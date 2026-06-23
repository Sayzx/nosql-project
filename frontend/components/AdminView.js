import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import { api } from '../utils/api';

export default function AdminView({ onRefreshAllData }) {
  const [nodeLabel, setNodeLabel] = useState('Machine');
  const [nodeName, setNodeName] = useState('');
  const [extraProps, setExtraProps] = useState({});
  const [nodeMessage, setNodeMessage] = useState({ text: '', type: '' });
  const [nodeLoading, setNodeLoading] = useState(false);

  const [linkSource, setLinkSource] = useState('');
  const [linkTarget, setLinkTarget] = useState('');
  const [linkType, setLinkType] = useState('CONNECTED_TO');
  const [linkMessage, setLinkMessage] = useState({ text: '', type: '' });
  const [linkLoading, setLinkLoading] = useState(false);

  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });
  const [resetLoading, setResetLoading] = useState(false);

  const [customQuery, setCustomQuery] = useState('MATCH (n) RETURN n LIMIT 10');
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const handleRunQuery = async (queryText) => {
    const queryToRun = typeof queryText === 'string' ? queryText : customQuery;
    if (typeof queryText === 'string') {
      setCustomQuery(queryText);
    }
    
    if (!queryToRun.trim()) {
      setQueryError('Query string is empty.');
      return;
    }
    
    setQueryLoading(true);
    setQueryError('');
    setQueryResult(null);
    try {
      const res = await api.runCustomQuery(queryToRun);
      if (res.keys) {
        setQueryResult(res);
        if (onRefreshAllData && (queryToRun.toUpperCase().includes('CREATE') || queryToRun.toUpperCase().includes('DELETE') || queryToRun.toUpperCase().includes('SET') || queryToRun.toUpperCase().includes('DETACH'))) {
          onRefreshAllData();
        }
      } else {
        setQueryError(res.error || 'Failed to run query.');
      }
    } catch (err) {
      setQueryError('API Connection Error.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handlePropChange = (key, value) => {
    setExtraProps(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddNode = async (e) => {
    e.preventDefault();
    if (!nodeName.trim()) {
      setNodeMessage({ text: 'Node Name is required.', type: 'error' });
      return;
    }
    setNodeLoading(true);
    setNodeMessage({ text: '', type: '' });
    try {
      const properties = {
        name: nodeName.toUpperCase().trim(),
        ...extraProps
      };
      const res = await api.createNode(nodeLabel, properties);
      if (res.success) {
        setNodeMessage({ text: `Node "${properties.name}" created successfully.`, type: 'success' });
        setNodeName('');
        setExtraProps({});
        if (onRefreshAllData) onRefreshAllData();
      } else {
        setNodeMessage({ text: res.error || 'Failed to create node.', type: 'error' });
      }
    } catch (err) {
      setNodeMessage({ text: 'API Connection Error.', type: 'error' });
    } finally {
      setNodeLoading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!linkSource.trim() || !linkTarget.trim()) {
      setLinkMessage({ text: 'Both Source and Target node names are required.', type: 'error' });
      return;
    }
    setLinkLoading(true);
    setLinkMessage({ text: '', type: '' });
    try {
      const source = linkSource.toUpperCase().trim();
      const target = linkTarget.toUpperCase().trim();
      const res = await api.createRelationship(source, target, linkType);
      if (res.success) {
        setLinkMessage({ text: `Relationship (${source})-[${linkType}]->(${target}) created successfully.`, type: 'success' });
        setLinkSource('');
        setLinkTarget('');
      } else {
        setLinkMessage({ text: res.error || 'Failed to create relationship.', type: 'error' });
      }
    } catch (err) {
      setLinkMessage({ text: 'API Connection Error.', type: 'error' });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleResetDB = async () => {
    const confirmReset = window.confirm('WARNING: This will delete all current nodes/relationships and restore the default CyberCorp graph. Do you want to proceed?');
    if (!confirmReset) return;

    setResetLoading(true);
    setResetMessage({ text: '', type: '' });
    try {
      const res = await api.resetDatabase();
      if (res.success) {
        setResetMessage({ text: 'Database successfully restored to default state.', type: 'success' });
        if (onRefreshAllData) onRefreshAllData();
      } else {
        setResetMessage({ text: res.error || 'Failed to reset database.', type: 'error' });
      }
    } catch (err) {
      setResetMessage({ text: 'API Connection Error.', type: 'error' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className={styles.section}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, border: 'none', padding: 0 }}>SI Administration & Graph Editor</h2>
        <p className={styles.description}>
          Manage the infrastructure topology by adding nodes, creating network paths, or resetting the dataset
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flexWrap: 'wrap' }} className={styles.dashboardGrid}>
        
        {/* Panel 1: Create Node */}
        <div className={styles.subsection}>
          <h3>➕ Add Infrastructure Node</h3>
          <p className={styles.description} style={{ marginBottom: '15px' }}>Create a new User, Machine, Service, or Vulnerability</p>
          
          <form onSubmit={handleAddNode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Node Type (Label)</label>
              <select
                value={nodeLabel}
                onChange={(e) => {
                  setNodeLabel(e.target.value);
                  setExtraProps({});
                }}
                style={{
                  padding: '10px',
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="Machine">💻 Machine (Workstation, Server)</option>
                <option value="User">👤 User (Active Directory account)</option>
                <option value="Group">👥 Group (RH, DEV, ADMINS)</option>
                <option value="Service">🔌 Service (SSH, HTTP, SMB)</option>
                <option value="Vulnerability">⚠️ Vulnerability (CVE)</option>
                <option value="Resource">💎 Resource (Sensitive Database)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Node Name (Unique Identifier)</label>
              <input
                type="text"
                placeholder="e.g. PC-AYLAN, AYLAN, RDP, CVE-2024-XXXX"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                style={{
                  padding: '10px',
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            {/* Dynamic Attributes based on selected Node Type */}
            {nodeLabel === 'Machine' && (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Machine Type</label>
                    <select
                      value={extraProps.type || 'workstation'}
                      onChange={(e) => handlePropChange('type', e.target.value)}
                      style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                    >
                      <option value="workstation">Workstation</option>
                      <option value="server">Server</option>
                      <option value="database">Database Server</option>
                      <option value="domain_controller">Domain Controller</option>
                      <option value="storage">Storage/Backup Server</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Asset Criticality</label>
                    <select
                      value={extraProps.criticality || 'low'}
                      onChange={(e) => handlePropChange('criticality', e.target.value)}
                      style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                    >
                      <option value="low">Low (Standard User)</option>
                      <option value="medium">Medium (Server/Dev)</option>
                      <option value="high">High (Production database)</option>
                      <option value="critical">Critical (Infrastructure core)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Operating System</label>
                  <input
                    type="text"
                    placeholder="e.g. Windows 11, Linux Ubuntu 22.04"
                    value={extraProps.os || ''}
                    onChange={(e) => handlePropChange('os', e.target.value)}
                    style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                  />
                </div>
              </>
            )}

            {nodeLabel === 'User' && (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Role/Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Stagiaire IT"
                      value={extraProps.role || ''}
                      onChange={(e) => handlePropChange('role', e.target.value)}
                      style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Marketing, IT"
                      value={extraProps.department || ''}
                      onChange={(e) => handlePropChange('department', e.target.value)}
                      style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. name@cybercorp.com"
                    value={extraProps.email || ''}
                    onChange={(e) => handlePropChange('email', e.target.value)}
                    style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                  />
                </div>
              </>
            )}

            {nodeLabel === 'Vulnerability' && (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>CVE Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CVE-2024-12345"
                      value={extraProps.cve || ''}
                      onChange={(e) => handlePropChange('cve', e.target.value)}
                      style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>CVSS v3 Score (0.0 - 10.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="e.g. 9.8"
                      value={extraProps.score || ''}
                      onChange={(e) => handlePropChange('score', e.target.value)}
                      style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Vulnerability Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote Code Execution via Netlogon"
                    value={extraProps.description || ''}
                    onChange={(e) => handlePropChange('description', e.target.value)}
                    style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                  />
                </div>
              </>
            )}

            {nodeLabel === 'Service' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Service Port Number</label>
                <input
                  type="number"
                  placeholder="e.g. 22, 80, 3389, 445"
                  value={extraProps.port || ''}
                  onChange={(e) => handlePropChange('port', e.target.value)}
                  style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                />
              </div>
            )}

            {nodeLabel === 'Resource' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Sensitivity Level</label>
                <select
                  value={extraProps.sensitivity || 'high'}
                  onChange={(e) => handlePropChange('sensitivity', e.target.value)}
                  style={{ padding: '10px', background: '#090d16', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#ffffff' }}
                >
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            )}

            {nodeMessage.text && (
              <p style={{
                margin: '5px 0',
                fontSize: '0.85em',
                padding: '8px 12px',
                borderRadius: '4px',
                border: nodeMessage.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                background: nodeMessage.type === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                color: nodeMessage.type === 'success' ? 'var(--color-low)' : 'var(--color-critical)'
              }}>
                {nodeMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={nodeLoading}
              style={{
                marginTop: '10px',
                padding: '10px',
                background: 'var(--cyber-blue)',
                boxShadow: '0 0 8px var(--cyber-blue-glow)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'opacity 0.2s'
              }}
            >
              {nodeLoading ? 'Creating Node...' : '➕ Create Node'}
            </button>
          </form>
        </div>

        {/* Panel 2: Create Link & Reset DB */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Create Relationship */}
          <div className={styles.subsection}>
            <h3>🔗 Add Relationship (Connection)</h3>
            <p className={styles.description} style={{ marginBottom: '15px' }}>Create a link between two existing nodes (e.g. connect PC-AYLAN to SRV-WEB)</p>
            
            <form onSubmit={handleAddLink} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Source Node Name</label>
                  <input
                    type="text"
                    placeholder="e.g. PC-AYLAN"
                    value={linkSource}
                    onChange={(e) => setLinkSource(e.target.value)}
                    style={{
                      padding: '10px',
                      background: '#090d16',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Target Node Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SRV-WEB"
                    value={linkTarget}
                    onChange={(e) => setLinkTarget(e.target.value)}
                    style={{
                      padding: '10px',
                      background: '#090d16',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Relationship Type</label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  style={{
                    padding: '10px',
                    background: '#090d16',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="CONNECTED_TO">CONNECTED_TO (Network Link between Machines)</option>
                  <option value="USES">USES (User uses Machine)</option>
                  <option value="MEMBER_OF">MEMBER_OF (User is member of Group)</option>
                  <option value="ADMIN_OF">ADMIN_OF (User admins Machine)</option>
                  <option value="HAS_ACCESS_TO">HAS_ACCESS_TO (Group has network access to Machine)</option>
                  <option value="EXPOSES">EXPOSES (Machine exposes Service)</option>
                  <option value="HAS_VULNERABILITY">HAS_VULNERABILITY (Machine has Vulnerability)</option>
                  <option value="HOSTS">HOSTS (Machine hosts Resource)</option>
                </select>
              </div>

              {linkMessage.text && (
                <p style={{
                  margin: '5px 0',
                  fontSize: '0.85em',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: linkMessage.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                  background: linkMessage.type === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                  color: linkMessage.type === 'success' ? 'var(--color-low)' : 'var(--color-critical)'
                }}>
                  {linkMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={linkLoading}
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: 'var(--cyber-blue)',
                  boxShadow: '0 0 8px var(--cyber-blue-glow)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'opacity 0.2s'
                }}
              >
                {linkLoading ? 'Creating Relationship...' : '🔗 Create Relationship'}
              </button>
            </form>
          </div>

          {/* Database Reset Danger Zone */}
          <div className={styles.subsection} style={{ borderLeft: '4px solid var(--color-critical)' }}>
            <h3 style={{ color: '#ff8787' }}>⚠️ Danger Zone</h3>
            <p className={styles.description} style={{ marginBottom: '15px' }}>Restore the database back to its default SI CyberCorp configuration</p>
            
            {resetMessage.text && (
              <p style={{
                margin: '10px 0',
                fontSize: '0.85em',
                padding: '8px 12px',
                borderRadius: '4px',
                border: resetMessage.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                background: resetMessage.type === 'success' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                color: resetMessage.type === 'success' ? 'var(--color-low)' : 'var(--color-critical)'
              }}>
                {resetMessage.text}
              </p>
            )}

            <button
              onClick={handleResetDB}
              disabled={resetLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid var(--color-critical)',
                color: '#ff8787',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-critical)';
                e.target.style.color = '#fff';
                e.target.style.boxShadow = '0 0 8px var(--color-critical-glow)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(239,68,68,0.1)';
                e.target.style.color = '#ff8787';
                e.target.style.boxShadow = 'none';
              }}
            >
              {resetLoading ? 'Restoring Database...' : '🧹 Reset Database to Defaults'}
            </button>
          </div>

        </div>

      </div>

      {/* Cypher Query Console (Full width below the grid) */}
      <div className={styles.subsection} style={{ marginTop: '30px' }}>
        <h3>💻 Interactive Cypher Console</h3>
        <p className={styles.description}>
          {"Directly query or manipulate the Neo4j graph database using Cypher query language"}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Presets */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: 'var(--text-muted)' }}>PRESETS:</span>
            {[
              { label: 'Show Graph Stats', query: 'MATCH (n) RETURN labels(n)[0] as Label, count(n) as Count' },
              { label: 'Workstations List', query: 'MATCH (m:Machine {type: "workstation"}) RETURN m.name as Name, m.os as OS' },
              { label: 'Active Privileges', query: 'MATCH (u:User)-[:MEMBER_OF]->(g:Group)-[:HAS_ACCESS_TO]->(m:Machine) RETURN u.name as User, g.name as Group, m.name as Machine' },
              { label: 'Vulnerabilities Score', query: 'MATCH (m:Machine)-[:HAS_VULNERABILITY]->(v:Vulnerability) RETURN m.name as Machine, v.cve as CVE, v.score as CVSS ORDER BY v.score DESC' }
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRunQuery(preset.query)}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75em',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--cyber-teal)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.08)'}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Terminal input area */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="MATCH (n) RETURN n LIMIT 15"
              style={{
                flex: 1,
                minHeight: '80px',
                padding: '12px',
                background: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85em',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            <button
              onClick={() => handleRunQuery()}
              disabled={queryLoading}
              style={{
                width: '120px',
                background: 'var(--cyber-teal)',
                boxShadow: '0 0 8px var(--cyber-teal-glow)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s'
              }}
            >
              {queryLoading ? 'Running...' : '⚡ RUN'}
            </button>
          </div>

          {/* Error display */}
          {queryError && (
            <div style={{
              padding: '12px 16px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.05)',
              color: 'var(--color-critical)',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8em',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {queryError}
            </div>
          )}

          {/* Results display */}
          {queryResult && (
            <div style={{ marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>Execution successful</span>
                <span>{queryResult.rows.length} records retrieved</span>
              </div>
              
              {queryResult.rows.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table className={styles.table} style={{ margin: 0, width: '100%' }}>
                    <thead>
                      <tr>
                        {queryResult.keys.map(key => (
                          <th key={key} style={{ fontSize: '0.8em', padding: '10px 14px' }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {queryResult.keys.map(key => (
                            <td key={key} style={{ 
                              fontSize: '0.8em', 
                              padding: '10px 14px', 
                              fontFamily: typeof row[key] === 'string' && (row[key].startsWith('Node') || row[key].startsWith('Relationship')) ? 'var(--font-mono)' : 'var(--font-sans)',
                              color: typeof row[key] === 'string' && row[key].startsWith('Node') ? 'var(--cyber-teal)' : typeof row[key] === 'string' && row[key].startsWith('Relationship') ? 'var(--cyber-blue)' : '#fff'
                            }}>
                              {row[key] !== null ? String(row[key]) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85em' }}>
                  Query executed successfully, but returned no records.
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
