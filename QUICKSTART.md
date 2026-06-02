# ⚡ Quick Start - CyberCorp Attack Path Mapping

Lancer le projet en 5 minutes.

---

## 1️⃣ Vérifier prérequis

```bash
docker --version    # Doit être 20.10+
docker compose --version  # Doit être 2.x+
```

---

## 2️⃣ Lancer les services

```bash
cd no_sql_projet
docker compose up --build -d

# Attendre 30-60 secondes
sleep 30
docker compose ps
```

---

## 3️⃣ Accéder aux services

| Service | URL |
|---------|-----|
| 🖥️ **Dashboard** | http://localhost:3000 |
| 🗄️ **Neo4j Browser** | http://localhost:7474 (neo4j / password123) |
| 🔌 **API Health** | http://localhost:5000/health |

---

## 4️⃣ Vérifier graphe chargé

Dans **Neo4j Browser** (http://localhost:7474):

```cypher
MATCH (n) RETURN count(n)
```

Résultat attendu: **29 nœuds**

---

## 5️⃣ Explorer dashboard

1. Ouvrir http://localhost:3000
2. Onglet **Dashboard** → voir 4 cartes (machines, users, vulns, resources)
3. Onglet **Analysis** → voir 4 chemins d'attaque depuis PC-ALICE

---

## 📊 Requête test rapide

Via Neo4j Browser:

```cypher
MATCH path = (start:Machine {name: "PC-ALICE"})-[:CONNECTED_TO*1..5]->(target:Machine)
RETURN [n in nodes(path) | n.name] as path, target.criticality
```

Résultat: 4 chemins avec SRV-WEB (high), SRV-DB (critical), DC-01 (critical), NAS-BACKUP (critical)

---

## 🛑 Arrêter

```bash
docker compose down    # Arrête containers (data persiste)
docker compose down -v # Arrête + supprime volumes (réinitialise)
```

---

## 📖 Documentation complète

- **readme.md** - Vue d'ensemble
- **INSTALLATION.md** - Installation détaillée + troubleshooting
- **QUERIES.md** - 13+ requêtes Cypher
- **ANALYSE_CYBER.md** - Rapport sécurité
- **LIVRABLES.md** - Détail tous livrables

---

## ❓ Problème?

Voir **INSTALLATION.md** section Troubleshooting, ou:

```bash
# Logs temps réel
docker compose logs -f

# Rebuild
docker compose down -v && docker compose up --build
```

---

**C'est tout! 🚀**
