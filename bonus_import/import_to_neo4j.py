#!/usr/bin/env python3
import os
import csv
import sys
from neo4j import GraphDatabase

# Configuration loaded from environment variables (matching .env format) or default values
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password123")

def clear_db(tx):
    print("🧹 Clearing existing data...")
    tx.run("MATCH (n) DETACH DELETE n")

def create_node(tx, label, properties):
    # Dynamically build the Cypher query to avoid hardcoding properties
    # Using parameters for security and performance
    prop_keys = []
    for k, v in properties.items():
        if v is not None and v != "":
            # Convert numeric values where appropriate
            if k == "score" or k == "port":
                try:
                    properties[k] = float(v) if k == "score" else int(v)
                except ValueError:
                    pass
            prop_keys.append(f"{k}: ${k}")
    
    prop_string = ", ".join(prop_keys)
    query = f"CREATE (n:{label} {{{prop_string}}}) RETURN n"
    
    # Filter out empty/None properties from the parameter dict
    filtered_props = {k: v for k, v in properties.items() if v is not None and v != ""}
    tx.run(query, **filtered_props)

def create_relationship(tx, from_id, to_id, rel_type):
    # Match by 'name' property (which serves as our unique identifier in nodes.csv)
    query = (
        f"MATCH (a {{name: $from_id}}), (b {{name: $to_id}}) "
        f"CREATE (a)-[r:{rel_type}]->(b) "
        f"RETURN r"
    )
    tx.run(query, from_id=from_id, to_id=to_id)

def main():
    print("🚀 CyberCorp Neo4j CSV Importer")
    print(f"Connecting to Neo4j at {NEO4J_URI} as user '{NEO4J_USER}'...")
    
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        # Test connection
        driver.verify_connectivity()
        print("✅ Successfully connected to Neo4j!")
    except Exception as e:
        print(f"❌ Connection failed: {e}", file=sys.stderr)
        print("Please check that your Neo4j instance is running and credentials are correct.", file=sys.stderr)
        sys.exit(1)

    nodes_file = os.path.join(os.path.dirname(__file__), "nodes.csv")
    rels_file = os.path.join(os.path.dirname(__file__), "relationships.csv")

    if not os.path.exists(nodes_file) or not os.path.exists(rels_file):
        print("❌ Error: nodes.csv or relationships.csv not found in the same directory.", file=sys.stderr)
        sys.exit(1)

    with driver.session() as session:
        # 1. Clear Database
        session.execute_write(clear_db)

        # 2. Import Nodes
        print("📦 Importing nodes...")
        node_count = 0
        with open(nodes_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                label = row.get("label")
                if not label:
                    continue
                # The 'id' column in nodes.csv is for relationships mapping, but we also use 'name'
                # Extract properties except 'label' and 'id'
                properties = {k: v for k, v in row.items() if k not in ["label", "id"]}
                # Ensure the 'name' property is populated (fallback to id if empty)
                if not properties.get("name"):
                    properties["name"] = row.get("id")
                
                session.execute_write(create_node, label, properties)
                node_count += 1
        print(f"✅ Imported {node_count} nodes.")

        # 3. Import Relationships
        print("🔗 Importing relationships...")
        rel_count = 0
        with open(rels_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                from_id = row.get("from_id")
                to_id = row.get("to_id")
                rel_type = row.get("type")
                if not from_id or not to_id or not rel_type:
                    continue
                session.execute_write(create_relationship, from_id, to_id, rel_type)
                rel_count += 1
        print(f"✅ Imported {rel_count} relationships.")

    driver.close()
    print("\n🎉 Database initialization complete! The graph is ready for analysis.")

if __name__ == "__main__":
    main()
