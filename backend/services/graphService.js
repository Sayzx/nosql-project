const { executeRead, executeWrite } = require('../db');
const fs = require('fs');
const path = require('path');

const graphService = {
  async getMachines() {
    const result = await executeRead(
      'MATCH (m:Machine) RETURN m.name as name, m.criticality as criticality, m.type as type'
    );
    return result.records.map(r => ({
      name: r.get('name'),
      criticality: r.get('criticality'),
      type: r.get('type')
    }));
  },

  async getGraphData() {
    const nodesResult = await executeRead(
      `MATCH (n) RETURN id(n) as id, labels(n) as labels, n as properties`
    );
    const edgesResult = await executeRead(
      `MATCH (a)-[r]->(b) RETURN id(a) as source, id(b) as target, type(r) as relationship`
    );

    const nodes = nodesResult.records.map(r => ({
      id: r.get('id').toNumber(),
      label: r.get('labels')[0],
      name: r.get('properties').properties.name || 'Unknown',
      criticality: r.get('properties').properties.criticality
    }));

    const edges = edgesResult.records.map(r => ({
      source: r.get('source').toNumber(),
      target: r.get('target').toNumber(),
      relationship: r.get('relationship')
    }));

    return { nodes, edges };
  },

  async getAttackPaths(startNode = 'PC-ALICE') {
    const result = await executeRead(
      `MATCH path = (start:Machine {name: $startNode})-[:CONNECTED_TO*1..5]->(target:Machine)
       RETURN
         [n in nodes(path) | n.name] as nodesPath,
         target.name as target,
         target.criticality as criticality
       ORDER BY length(path) ASC`,
      { startNode }
    );

    return result.records.map(r => ({
      path: r.get('nodesPath'),
      target: r.get('target'),
      criticality: r.get('criticality')
    }));
  },

  async getVulnerableMachines(startNode = 'PC-ALICE') {
    const result = await executeRead(
      `MATCH path = (start:Machine {name: $startNode})-[:CONNECTED_TO*1..5]->(m:Machine)-[:HAS_VULNERABILITY]->(v:Vulnerability)
       RETURN
         m.name as machine,
         v.cve as cve,
         v.name as vulnerability,
         v.score as score
       ORDER BY v.score DESC`,
      { startNode }
    );

    return result.records.map(r => ({
      machine: r.get('machine'),
      cve: r.get('cve'),
      vulnerability: r.get('vulnerability'),
      score: r.get('score')
    }));
  },

  async getAccessibleResources(startNode = 'PC-ALICE') {
    const result = await executeRead(
      `MATCH path = (start:Machine {name: $startNode})-[:CONNECTED_TO*1..5]->(m:Machine)-[:HOSTS]->(r:Resource)
       RETURN
         r.name as resource,
         r.sensitivity as sensitivity,
         m.name as machine
       ORDER BY r.sensitivity DESC`,
      { startNode }
    );

    return result.records.map(r => ({
      resource: r.get('resource'),
      sensitivity: r.get('sensitivity'),
      machine: r.get('machine')
    }));
  },

  async getAdminUsers() {
    const result = await executeRead(
      `MATCH (u:User)-[:ADMIN_OF]->(m:Machine)
       RETURN
         u.name as user,
         m.name as machine`
    );

    return result.records.map(r => ({
      user: r.get('user'),
      machine: r.get('machine')
    }));
  },

  async getExposedServices() {
    const result = await executeRead(
      `MATCH (m:Machine)-[:EXPOSES]->(s:Service)
       RETURN
         m.name as machine,
         s.name as service,
         s.port as port
       ORDER BY m.name`
    );

    return result.records.map(r => ({
      machine: r.get('machine'),
      service: r.get('service'),
      port: r.get('port')
    }));
  },

  async getStats() {
    const machines = await executeRead('MATCH (m:Machine) RETURN count(m) as count');
    const users = await executeRead('MATCH (u:User) RETURN count(u) as count');
    const vulns = await executeRead('MATCH (v:Vulnerability) RETURN count(v) as count');
    const resources = await executeRead('MATCH (r:Resource) RETURN count(r) as count');

    return {
      machines: machines.records[0].get('count').toNumber(),
      users: users.records[0].get('count').toNumber(),
      vulnerabilities: vulns.records[0].get('count').toNumber(),
      resources: resources.records[0].get('count').toNumber()
    };
  },

  async getUsers() {
    const result = await executeRead(
      'MATCH (u:User) RETURN u.name as name'
    );
    return result.records.map(r => ({
      name: r.get('name')
    }));
  },

  async createNode(label, properties) {
    if (!label || !properties.name) {
      throw new Error('Label and Name are required');
    }
    const cleanProps = {};
    Object.keys(properties).forEach(k => {
      if (properties[k] !== undefined && properties[k] !== '') {
        if (k === 'score' || k === 'port') {
          cleanProps[k] = Number(properties[k]);
        } else {
          cleanProps[k] = properties[k];
        }
      }
    });

    const propKeys = Object.keys(cleanProps).map(k => `${k}: $${k}`).join(', ');
    const query = `CREATE (n:${label} {${propKeys}}) RETURN n`;
    await executeWrite(query, cleanProps);
    return { success: true };
  },

  async createRelationship(sourceName, targetName, relType) {
    if (!sourceName || !targetName || !relType) {
      throw new Error('Source, Target and Relationship Type are required');
    }
    const query = `
      MATCH (a {name: $sourceName}), (b {name: $targetName})
      CREATE (a)-[r:${relType}]->(b)
      RETURN r
    `;
    await executeWrite(query, { sourceName, targetName });
    return { success: true };
  },

  async resetDatabase() {
    const cypherPath = path.join(__dirname, '../setup_graph.cypher');
    const cypherContent = fs.readFileSync(cypherPath, 'utf8');
    
    // Split queries by semicolon, strip comments, and filter out empty ones
    const queries = cypherContent
      .split(';')
      .map(q => {
        return q
          .split('\n')
          .map(line => line.trim())
          .filter(line => !line.startsWith('//'))
          .join('\n')
          .trim();
      })
      .filter(q => q.length > 0);

    for (const query of queries) {
      await executeWrite(query);
    }
    return { success: true };
  },

  async runCustomQuery(query) {
    if (!query || !query.trim()) {
      throw new Error('Query string is required');
    }
    const result = await executeWrite(query);
    
    const keys = result.records.length > 0 ? result.records[0].keys : [];
    const rows = result.records.map(rec => {
      const row = {};
      keys.forEach(k => {
        const val = rec.get(k);
        if (val && typeof val === 'object') {
          if (val.labels) {
            // Format node representation
            const labelStr = val.labels.join(':');
            const nameProp = val.properties.name || val.properties.cve || val.properties.cve || '';
            row[k] = `Node(:${labelStr} {name: "${nameProp}"})`;
          } else if (val.type) {
            // Format relationship representation
            row[k] = `Relationship[:${val.type}]`;
          } else if (typeof val.toNumber === 'function') {
            row[k] = val.toNumber();
          } else {
            row[k] = JSON.stringify(val);
          }
        } else {
          row[k] = val;
        }
      });
      return row;
    });
    
    return { keys, rows };
  }
};

module.exports = graphService;
