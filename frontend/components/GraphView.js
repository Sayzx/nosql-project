import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styles from '../styles/Home.module.css';
import { api } from '../utils/api';

export default function GraphView({ users, loading }) {
  const [ForceGraph2D, setForceGraph2D] = useState(null);
  const [fullData, setFullData] = useState({ nodes: [], links: [] });
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [compromisedNodes, setCompromisedNodes] = useState(new Set());
  const [impactedNodes, setImpactedNodes] = useState(new Set());
  const [visibleRelationships, setVisibleRelationships] = useState(['CONNECTED_TO', 'ADMIN_OF', 'HAS_VULNERABILITY', 'HOSTS', 'EXPOSES']);

  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setForceGraph2D(() => mod.default);
    });
  }, []);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await api.fetchGraph();
        setFullData({
          nodes: data.nodes,
          links: data.edges.map(e => ({
            source: e.source,
            target: e.target,
            label: e.relationship
          }))
        });
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };
    fetchGraph();
  }, []);

  const filteredData = useMemo(() => {
    if (!fullData.nodes.length) return fullData;

    let focusNodeId = null;
    if (selectedUser) {
      const node = fullData.nodes.find(n => n.name?.toLowerCase().trim() === selectedUser.toLowerCase().trim());
      if (node) focusNodeId = node.id;
    } else if (selectedMachine) {
      const node = fullData.nodes.find(n => n.name?.toLowerCase().trim() === selectedMachine.toLowerCase().trim());
      if (node) focusNodeId = node.id;
    }

    // First, filter links by relationship type
    const relationshipFilteredLinks = fullData.links.filter(l => visibleRelationships.includes(l.label));

    if (focusNodeId === null) {
      return {
        nodes: fullData.nodes,
        links: relationshipFilteredLinks
      };
    }

    const relevantNodes = new Set([focusNodeId]);
    const relevantLinks = new Set();

    relationshipFilteredLinks.forEach(link => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sId === focusNodeId) {
        relevantNodes.add(tId);
        relevantLinks.add(link);
      } else if (tId === focusNodeId) {
        relevantNodes.add(sId);
        relevantLinks.add(link);
      }
    });

    const secondHopNodes = new Set(relevantNodes);
    relationshipFilteredLinks.forEach(link => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      if (relevantNodes.has(sId) && !relevantNodes.has(tId)) {
        secondHopNodes.add(tId);
        relevantLinks.add(link);
      } else if (relevantNodes.has(tId) && !relevantNodes.has(sId)) {
        secondHopNodes.add(sId);
        relevantLinks.add(link);
      }
    });

    return {
      nodes: fullData.nodes.filter(n => secondHopNodes.has(n.id)),
      links: Array.from(relevantLinks)
    };
  }, [fullData, selectedUser, selectedMachine, visibleRelationships]);

  const calculateBlastRadius = useCallback((startNodeId, currentCompromised) => {
    const visited = new Set(currentCompromised);
    const queue = [startNodeId];
    visited.add(startNodeId);
    while (queue.length > 0) {
      const nodeId = queue.shift();
      filteredData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === nodeId && !visited.has(targetId)) {
          visited.add(targetId);
          queue.push(targetId);
        }
      });
    }
    return visited;
  }, [filteredData]);

  const handleNodeClick = (node) => {
    const nodeId = node.id;
    const newCompromised = new Set(compromisedNodes);
    if (newCompromised.has(nodeId)) newCompromised.delete(nodeId);
    else newCompromised.add(nodeId);
    setCompromisedNodes(newCompromised);

    const allImpacted = new Set();
    newCompromised.forEach(id => {
      calculateBlastRadius(id, new Set()).forEach(rId => allImpacted.add(rId));
    });
    setImpactedNodes(allImpacted);
  };

  const resetSimulation = () => {
    setCompromisedNodes(new Set());
    setImpactedNodes(new Set());
  };

  const toggleRel = (rel) => {
    setVisibleRelationships(prev =>
      prev.includes(rel) ? prev.filter(r => r !== rel) : [...prev, rel]
    );
  };

  if (loading) return <p className={styles.loading}>Loading graph...</p>;
  if (!ForceGraph2D) return <p className={styles.loading}>Initializing Graph Engine...</p>;

  return (
    <div className={styles.section}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        gap: '20px'
      }}>
        <div>
          <h2 style={{ marginBottom: '5px' }}>Network Topology Explorer</h2>
          <p className={styles.description}>Filter access paths and refine visibility to analyze the attack surface</p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: '#fff',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#6b7280' }}>FOCUS:</label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setSelectedMachine('');
                resetSimulation();
              }}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.9em' }}
            >
              <option value="">Global View</option>
              <optgroup label="Users">
                {users?.map((u, i) => (
                  <option key={i} value={u.name || u}>{u.name || u}</option>
                ))}
              </optgroup>
            </select>

            <select
              value={selectedMachine}
              onChange={(e) => {
                setSelectedMachine(e.target.value);
                setSelectedUser('');
                resetSimulation();
              }}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.9em' }}
            >
              <option value="">All Machines</option>
              {fullData.nodes.filter(n => n.label === 'Machine').map(n => (
                <option key={n.id} value={n.name}>{n.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
            <label style={{ fontSize: '0.75em', fontWeight: 'bold', color: '#6b7280', width: '100%', marginBottom: '5px' }}>RELATIONSHIPS:</label>
            {['CONNECTED_TO', 'ADMIN_OF', 'HAS_VULNERABILITY', 'HOSTS', 'EXPOSES'].map(rel => (
              <button
                key={rel}
                onClick={() => toggleRel(rel)}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.7em',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  background: visibleRelationships.includes(rel) ? '#e5e7eb' : '#fff',
                  fontWeight: visibleRelationships.includes(rel) ? '600' : '400',
                  color: visibleRelationships.includes(rel) ? '#111' : '#6b7280'
                }}
              >
                {rel.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={resetSimulation}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8em',
              fontWeight: '500'
            }}
          >
            Reset Sim
          </button>
        </div>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(255,255,255,0.9)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
          fontSize: '0.85em'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>● Compromised: </span>
            {compromisedNodes.size}
          </div>
          <div>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>● At Risk: </span>
            {impactedNodes.size - compromisedNodes.size}
          </div>
        </div>

        <ForceGraph2D
          graphData={filteredData}
          nodeAutoColorBy="label"
          onNodeClick={handleNodeClick}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;

            let color = node.color;
            if (compromisedNodes.has(node.id)) color = '#ef4444';
            else if (impactedNodes.has(node.id)) color = '#f59e0b';

            // Size by type
            const size = node.label === 'Machine' ? 6 : 4;

            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();

            if (color !== node.color) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#374151';
            ctx.fillText(label, node.x, node.y + 10);
          }}
          linkLabel={(link) => link.label}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowColor={link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            if (compromisedNodes.has(sourceId)) return '#ef4444';
            return 'rgba(200, 200, 200, 0.4)'; // Subtle gray for non-compromised
          }}
          linkWidth={1}
          nodeRelSizingMode="fixed"
        />
      </div>
    </div>
  );
}
