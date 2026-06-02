const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'neo4j://neo4j:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password123'
  ),
  { connectionTimeout: 30000 }
);

/**
 * Executes a read-only query in Neo4j.
 * Ensures session is closed regardless of outcome.
 */
async function executeRead(query, params = {}) {
  const session = driver.session();
  try {
    return await session.executeRead(tx => tx.run(query, params));
  } finally {
    await session.close();
  }
}

module.exports = {
  driver,
  executeRead
};
