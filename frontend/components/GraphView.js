import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import styles from '../styles/Home.module.css';
import { api } from '../utils/api';

// Node Color and Icon palette (Static, defined outside component to avoid ESLint hook dependency issues)
const nodeStyles = {
  Machine: { color: '#3b82f6', label: '💻 Machine', size: 7 },
  User: { color: '#10b981', label: '👤 User', size: 5 },
  Group: { color: '#a855f7', label: '🔑 Group', size: 6 },
  Service: { color: '#f59e0b', label: '🔌 Service', size: 5 },
  Vulnerability: { color: '#ef4444', label: '⚠️ Vulnerability', size: 5.5 },
  Resource: { color: '#fbbf24', label: '💎 Resource', size: 6 }
};

const getNodeStyle = (label) => {
  return nodeStyles[label] || { color: '#9ca3af', label: 'Node', size: 5 };
};

export default function GraphView({ users, loading, secureMode, compromisedEntryPoint, paths, machines }) {
  const [ForceGraph2D, setForceGraph2D] = useState(null);
  const [fullData, setFullData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [visibleRelationships, setVisibleRelationships] = useState(['CONNECTED_TO', 'ADMIN_OF', 'HAS_VULNERABILITY', 'HOSTS', 'EXPOSES', 'MEMBER_OF', 'HAS_ACCESS_TO', 'USES']);
  const graphRef = useRef();

  // --- Cyber Threat Simulator State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [simStep, setSimStep] = useState(-1);
  const [simSpeed, setSimSpeed] = useState(3000); // 3 seconds per step
  const [simMitigated, setSimMitigated] = useState(false); // If user clicked "Deploy active block"
  const simTimerRef = useRef(null);

  // Load the graph library dynamically for Next.js SSR compatibility
  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setForceGraph2D(() => mod.default);
    });
  }, []);

  // Fetch graph data from Neo4j backend
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await api.fetchGraph();
        
        // Enhance nodes with extra attributes if available from the machines list
        const enhancedNodes = data.nodes.map(n => {
          const machData = machines?.find(m => m.name === n.name);
          return {
            ...n,
            riskScore: machData ? machData.riskScore : null,
            type: machData ? machData.type : n.type || null,
            criticality: machData ? machData.criticality : n.criticality || 'medium'
          };
        });

        setFullData({
          nodes: enhancedNodes,
          links: data.edges.map(e => ({
            id: `${e.source}-${e.target}-${e.relationship}`,
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
  }, [machines]);

  // Extract the active attack path for the simulator
  const activePath = useMemo(() => {
    if (secureMode || !paths || paths.length === 0) return [];
    return paths[0]?.path || [];
  }, [paths, secureMode]);

  // Simulation timer loop
  useEffect(() => {
    if (isPlaying && simStep < activePath.length - 1 && !simMitigated) {
      simTimerRef.current = setTimeout(() => {
        setSimStep(prev => prev + 1);
      }, simSpeed);
    } else {
      setIsPlaying(false);
    }
    return () => clearTimeout(simTimerRef.current);
  }, [isPlaying, simStep, activePath, simSpeed, simMitigated]);

  // Reset simulation when entrypoint changes
  useEffect(() => {
    setIsPlaying(false);
    setSimStep(-1);
    setSimMitigated(false);
  }, [compromisedEntryPoint]);

  // Check if a relationship is mitigated/blocked (Static or Dynamic Simulation-based)
  const isLinkMitigated = useCallback((link) => {
    if (!link || !link.source || !link.target) return false;
    
    const sId = (link.source && typeof link.source === 'object') ? link.source.id : link.source;
    const tId = (link.target && typeof link.target === 'object') ? link.target.id : link.target;
    
    const sourceNode = fullData.nodes.find(n => n.id === sId);
    const targetNode = fullData.nodes.find(n => n.id === tId);
    
    if (!sourceNode || !targetNode) return false;

    // A. Dynamic Simulation Counter-measure: Block the next step at the current active node
    if (simMitigated && simStep >= 0 && activePath.length > 1 && simStep < activePath.length - 1) {
      if (sourceNode.name === activePath[simStep] && targetNode.name === activePath[simStep + 1]) {
        return true;
      }
    }

    // B. Static Secure Mode rules
    if (!secureMode) return false;

    // 1. Vulnerability links are patched
    if (link.label === 'HAS_VULNERABILITY') return true;

    // 2. Network segmentation: SRV-WEB -> SRV-DB and SRV-DB -> DC-01 are blocked
    if (link.label === 'CONNECTED_TO') {
      if (sourceNode.name === 'SRV-WEB' && targetNode.name === 'SRV-DB') return true;
      if (sourceNode.name === 'SRV-DB' && targetNode.name === 'DC-01') return true;
    }

    // 3. Least privilege: DEV group access to SRV-DB is restricted
    if (link.label === 'HAS_ACCESS_TO') {
      if (sourceNode.name === 'DEV' && targetNode.name === 'SRV-DB') return true;
    }

    return false;
  }, [secureMode, fullData, simMitigated, simStep, activePath]);

  // Identify which nodes and links are active on the attack paths
  const attackPathElements = useMemo(() => {
    const activeNodes = new Set();
    const activeLinks = new Set();

    if (secureMode) {
      return { nodes: activeNodes, links: activeLinks };
    }

    // B1. If Threat Simulator is active, only highlight path up to the current simulation step
    if (simStep >= 0 && activePath.length > 0) {
      const limit = Math.min(simStep, activePath.length - 1);
      for (let i = 0; i <= limit; i++) {
        const node = fullData.nodes.find(n => n.name === activePath[i]);
        if (node) activeNodes.add(node.id);
      }

      for (let i = 0; i < limit; i++) {
        const sourceNode = fullData.nodes.find(n => n.name === activePath[i]);
        const targetNode = fullData.nodes.find(n => n.name === activePath[i+1]);
        
        if (sourceNode && targetNode) {
          const link = fullData.links.find(l => {
            if (!l || !l.source || !l.target) return false;
            const sId = (l.source && typeof l.source === 'object') ? l.source.id : l.source;
            const tId = (l.target && typeof l.target === 'object') ? l.target.id : l.target;
            return sId === sourceNode.id && tId === targetNode.id && l.label === 'CONNECTED_TO';
          });
          if (link) activeLinks.add(link.id);
        }
      }

      return { nodes: activeNodes, links: activeLinks };
    }

    // B2. Static Path highlight
    if (!paths || paths.length === 0) {
      return { nodes: activeNodes, links: activeLinks };
    }

    paths.forEach(p => {
      if (Array.isArray(p.path)) {
        // Add all nodes on the path
        p.path.forEach(nodeName => {
          const node = fullData.nodes.find(n => n.name === nodeName);
          if (node) activeNodes.add(node.id);
        });

        // Add all links connecting successive nodes on the path
        for (let i = 0; i < p.path.length - 1; i++) {
          const sourceNode = fullData.nodes.find(n => n.name === p.path[i]);
          const targetNode = fullData.nodes.find(n => n.name === p.path[i+1]);
          
          if (sourceNode && targetNode) {
            const link = fullData.links.find(l => {
              if (!l || !l.source || !l.target) return false;
              const sId = (l.source && typeof l.source === 'object') ? l.source.id : l.source;
              const tId = (l.target && typeof l.target === 'object') ? l.target.id : l.target;
              return sId === sourceNode.id && tId === targetNode.id && l.label === 'CONNECTED_TO';
            });
            if (link) activeLinks.add(link.id);
          }
        }
      }
    });

    return { nodes: activeNodes, links: activeLinks };
  }, [paths, fullData, secureMode, simStep, activePath]);

  // Filter nodes and links based on active filters
  const filteredData = useMemo(() => {
    const activeLinks = fullData.links.filter(l => {
      if (!visibleRelationships.includes(l.label)) return false;
      return true;
    });

    return {
      nodes: fullData.nodes,
      links: activeLinks
    };
  }, [fullData, visibleRelationships]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const toggleRel = (rel) => {
    setVisibleRelationships(prev =>
      prev.includes(rel) ? prev.filter(r => r !== rel) : [...prev, rel]
    );
  };

  // --- BACKGROUND CANVAS DRAWING: Network Segmentation Zones ---
  const paintBeforeUpdate = useCallback((ctx, globalScale) => {
    if (filteredData.nodes.length === 0) return;

    // Define the network zoning rules
    const zones = [
      {
        name: 'VLAN 10 - Workstations Zone',
        color: 'rgba(16, 185, 129, 0.03)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
        textColor: '#10b981',
        match: (node) => ['PC-ALICE', 'PC-BOB', 'PC-CHARLIE', 'PC-DEV', 'DEV', 'HR', 'MARKETING', 'ALICE', 'BOB', 'CHARLIE'].includes(node.name) || node.label === 'User' || node.label === 'Group'
      },
      {
        name: 'VLAN 20 - Demilitarized Zone (DMZ)',
        color: 'rgba(245, 158, 11, 0.03)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
        textColor: '#f59e0b',
        match: (node) => ['SRV-WEB', 'SRV-MAIL', 'SRV-FTP', 'WEB_ACCESS'].includes(node.name)
      },
      {
        name: 'VLAN 30 - Database Zone',
        color: 'rgba(59, 130, 246, 0.03)',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        textColor: '#3b82f6',
        match: (node) => ['SRV-DB', 'SRV-MONGO', 'SRV-POSTGRES', 'SRV-SQL', 'DB_ADMIN'].includes(node.name)
      },
      {
        name: 'VLAN 100 - Admin Core',
        color: 'rgba(239, 68, 68, 0.03)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
        textColor: '#ef4444',
        match: (node) => ['DC-01', 'DC-02', 'NAS-BACKUP', 'SRV-ADMIN', 'DOMAIN_ADMINS'].includes(node.name)
      }
    ];

    zones.forEach(zone => {
      // Filter out nodes that belong to this zone and have valid coordinates
      const zoneNodes = filteredData.nodes.filter(n => zone.match(n) && n.x !== undefined && n.y !== undefined);
      if (zoneNodes.length === 0) return;

      // Compute bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      zoneNodes.forEach(n => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      });

      // Add generous padding for labels and breathing room
      const padding = 28;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const width = maxX - minX;
      const height = maxY - minY;

      // Draw beautiful rounded rect
      ctx.beginPath();
      const radius = 12;
      ctx.moveTo(minX + radius, minY);
      ctx.lineTo(maxX - radius, minY);
      ctx.quadraticCurveTo(maxX, minY, maxX, minY + radius);
      ctx.lineTo(maxX, maxY - radius);
      ctx.quadraticCurveTo(maxX, maxY, maxX - radius, maxY);
      ctx.lineTo(minX + radius, maxY);
      ctx.quadraticCurveTo(minX, maxY, minX, maxY - radius);
      ctx.lineTo(minX, minY + radius);
      ctx.quadraticCurveTo(minX, minY, minX + radius, minY);
      ctx.closePath();

      // Fill
      ctx.fillStyle = zone.color;
      ctx.fill();

      // Dashed Stroke
      ctx.strokeStyle = zone.borderColor;
      ctx.lineWidth = 1.5 / globalScale;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Text label at top-left of the zone
      ctx.fillStyle = zone.textColor;
      ctx.font = `bold ${10 / globalScale}px Fira Code, monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`[ ${zone.name} ]`, minX + 10, minY + 15);
    });
  }, [filteredData]);

  // Node canvas drawing
  const drawNode = useCallback((node, ctx, globalScale) => {
    const style = getNodeStyle(node.label);
    const fontSize = 10 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    let color = style.color;
    const isCompromisedEntry = node.name === compromisedEntryPoint;
    const isOnAttackPath = attackPathElements.nodes.has(node.id);

    // Color overrides based on simulation or threat paths
    if (isCompromisedEntry && !secureMode) {
      color = '#ef4444'; // Red for compromised starting point
    } else if (isOnAttackPath && !secureMode) {
      color = '#f59e0b'; // Orange for intermediate pivots
    }

    // Draw main node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, style.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Pulses and auras
    if (isCompromisedEntry && !secureMode) {
      const time = Date.now() * 0.003;
      const pulseRadius = style.size + 3 + Math.sin(time) * 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (isOnAttackPath && !secureMode) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, style.size + 2.5, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Selection/Hover ring
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHovered = hoveredNode && hoveredNode.id === node.id;
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, style.size + 2, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Text labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#ffffff' : 'var(--text-secondary)';
    
    let displayName = node.name;
    // Show a lock emoji if secure mode is active and this node represents a vulnerability or protected resource
    if (secureMode && (node.label === 'Vulnerability' || node.label === 'Resource')) {
      displayName = `🔒 ${node.name}`;
    }
    
    ctx.fillText(displayName, node.x, node.y + style.size + 9);
  }, [compromisedEntryPoint, attackPathElements, selectedNode, hoveredNode, secureMode]);

  // Threat logs based on active pivot and step
  const getSimulationLog = (nodeName, stepIndex) => {
    if (stepIndex === 0) {
      return `🔴 Compromission initiale du poste utilisateur [${nodeName}] via une campagne de phishing ciblée (hameçonnage et exécution d'un implant de type Command & Control).`;
    }
    
    const descriptions = {
      'SRV-WEB': `🔥 Exploitation réussie de la vulnérabilité critique Log4Shell (CVE-2021-44228) sur [SRV-WEB]. L'attaquant obtient un shell d'administration distant avec des privilèges de niveau SYSTEM.`,
      'SRV-DB': `🗄️ Pivoting réseau vers le serveur de bases de données [SRV-DB]. L'attaquant accède aux schémas SQL, exfiltre les données sensibles des clients, et récupère des hashs de mots de passe d'administration.`,
      'DC-01': `⚡ Exploitation dévastatrice de la faille de chiffrement Zerologon (CVE-2020-1472) sur le contrôleur de domaine principal [DC-01]. Prise de contrôle totale de l'Active Directory (Domain Admin). Le SI est entièrement compromis !`,
      'NAS-BACKUP': `💾 Pivoting vers le serveur [NAS-BACKUP]. L'attaquant localise les stockages de sauvegardes, désactive le chiffrement de transport, et commence le chiffrement par rançongiciel pour neutraliser la résilience du SI.`,
      'PC-BOB': `👥 Mouvement latéral furtif vers le poste utilisateur de [PC-BOB] via rejeu de ticket Kerberos (Pass-the-Ticket) extrait de la mémoire.`,
      'PC-CHARLIE': `👥 Pivot réseau vers le poste [PC-CHARLIE] en exploitant une session bureau à distance (RDP) persistante.`
    };

    return descriptions[nodeName] || `🔄 Mouvement latéral vers [${nodeName}] : Scanning réseau, exploitation de liaisons de confiance LDAP/SMB et réutilisation d'identifiants administrateur locaux.`;
  };

  // Mitigation lists for nodes
  const getHostMitigations = (hostName) => {
    const mitigations = {
      'PC-ALICE': [
        'Isoler immédiatement le poste du reste du réseau (Quarantaine VLAN 10).',
        'Réinitialiser les identifiants d\'Alice et révoquer ses sessions Active Directory.',
        'Lancer une analyse complète EDR pour détecter l\'implant C2 actif.'
      ],
      'SRV-WEB': [
        'Mettre à jour d\'urgence Log4j vers la version 2.17.1+ pour corriger Log4Shell.',
        'Bloquer tous les flux LDAP/RMI sortants du serveur vers Internet.',
        'Déployer des signatures de blocage spécifiques sur le pare-feu applicatif (WAF).'
      ],
      'SRV-DB': [
        'Mettre en place un bastion d\'administration (Jump Host) avec authentification MFA.',
        'Restreindre l\'écoute réseau du port MySQL/MongoDB aux seuls serveurs du backend.',
        'Chiffrer les données sensibles au repos et activer la surveillance de volumes.'
      ],
      'DC-01': [
        'Appliquer immédiatement le correctif de sécurité cumulatif de Microsoft contre Zerologon (CVE-2020-1472).',
        'Activer la journalisation avancée des requêtes réseau Netlogon.',
        'Activer Microsoft Defender for Identity pour surveiller les élévations Kerberos.'
      ],
      'NAS-BACKUP': [
        'Désactiver SMBv1 et forcer SMBv3 avec signatures obligatoires.',
        'Isoler les sauvegardes dans un VLAN sécurisé hors-ligne (Air-gapped backup).',
        'Restreindre les droits d\'écriture réseau des comptes de sauvegarde.'
      ]
    };
    return mitigations[hostName] || ['Appliquer le principe du moindre privilège.', 'Activer la surveillance des connexions réseau anormales.'];
  };

  const currentSimNode = simStep >= 0 && activePath.length > 0 ? activePath[Math.min(simStep, activePath.length - 1)] : null;

  if (loading) return <p className={styles.loading}>Analyzing Neo4j graph topology...</p>;
  if (!ForceGraph2D) return <p className={styles.loading}>Initializing WebGL Graphics Engine...</p>;

  return (
    <div className={styles.section} style={{ padding: '30px 40px' }}>
      
      {/* --- Threat Simulator Dashboard UI --- */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4em' }}>🎮</span>
            <div>
              <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95em', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Simulateur de Menaces Tactiques (Red vs Blue)
              </h4>
              <span style={{ fontSize: '0.78em', color: 'var(--text-secondary)' }}>
                Visualisez la propagation latérale en temps réel et testez vos contre-mesures de blocage actif.
              </span>
            </div>
          </div>

          {/* Controls */}
          {activePath.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', background: '#040711', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '2px' }}>
                {isPlaying ? (
                  <button
                    onClick={() => setIsPlaying(false)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8em', fontWeight: 600 }}
                  >
                    ⏸️ Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeSim}
                    style={{ background: 'transparent', border: 'none', color: 'var(--cyber-teal)', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8em', fontWeight: 600 }}
                  >
                    ▶️ {simStep === -1 ? "Lancer" : "Reprendre"}
                  </button>
                )}
                <button
                  onClick={handleResetSim}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8em', fontWeight: 600 }}
                >
                  🔄 Reset
                </button>
              </div>

              {/* Speed select */}
              <select
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                style={{
                  background: '#040711',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.8em',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={5000}>Vitesse : Lente (5s)</option>
                <option value={3000}>Vitesse : Normale (3s)</option>
                <option value={1000}>Vitesse : Rapide (1s)</option>
              </select>

              {/* Blue Team Intercept Action Button */}
              {simStep >= 0 && simStep < activePath.length - 1 && !simMitigated && (
                <button
                  onClick={handleDeployCountermeasure}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)',
                    animation: 'pulseGlow 1.5s infinite'
                  }}
                >
                  🛡️ Activer Contre-Mesure (Blue Team Block)
                </button>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.85em', color: 'var(--color-low)', fontWeight: 600 }}>
              ✓ Aucun chemin d'attaque actif pour cet état. Le simulateur est verrouillé.
            </span>
          )}
        </div>

        {/* Simulator Status Timeline Log */}
        {simStep >= 0 && activePath.length > 0 && (
          <div style={{
            background: '#040711',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78em' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                PHASE {simStep + 1} / {activePath.length} : Pivot sur <strong style={{ color: 'var(--cyber-teal)' }}>{currentSimNode}</strong>
              </span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                fontWeight: 'bold',
                color: simMitigated 
                  ? '#34d399' 
                  : simStep === activePath.length - 1 
                  ? '#f87171' 
                  : '#fbbf24',
                background: simMitigated 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : simStep === activePath.length - 1 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : 'rgba(245, 158, 11, 0.1)'
              }}>
                {simMitigated 
                  ? '🛡️ ATTACK INTERCEPTED & CONTAINED' 
                  : simStep === activePath.length - 1 
                  ? '☠️ TOTAL domain takeover' 
                  : '⚠️ ATTACK PROPAGATING...'}
              </span>
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.85em',
              color: '#d1d5db',
              lineHeight: '1.4',
              fontFamily: 'var(--font-mono)'
            }}>
              {getSimulationLog(currentSimNode, simStep)}
            </p>

            {simMitigated && (
              <div style={{
                marginTop: '4px',
                fontSize: '0.8em',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500
              }}>
                <span>🛡️</span>
                <span>Interception réussie : Un filtre de segmentation réseau actif a été déployé au niveau de {currentSimNode} bloquant tout rebond vers {activePath[simStep + 1]}. Menace circonscrite.</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '650px', position: 'relative' }}>
        
        {/* Graph Canvas Container */}
        <div style={{
          flex: 1,
          position: 'relative',
          background: '#040711',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Legend and Filters Panel Overlay */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(13, 18, 34, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            width: '260px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🔍 Topology Filters
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { key: 'CONNECTED_TO', label: 'Network Route' },
                { key: 'HAS_VULNERABILITY', label: 'Vulnerability Links' },
                { key: 'HOSTS', label: 'Hosted Resources' },
                { key: 'EXPOSES', label: 'Exposed Services' },
                { key: 'ADMIN_OF', label: 'Admin Access' },
                { key: 'USES', label: 'User Workstations' }
              ].map(rel => (
                <label 
                  key={rel.key} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '0.78em', 
                    color: visibleRelationships.includes(rel.key) ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleRelationships.includes(rel.key)}
                    onChange={() => toggleRel(rel.key)}
                    style={{ cursor: 'pointer' }}
                  />
                  {rel.label}
                </label>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '10px', fontSize: '0.7em', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
                <span>Compromised Entry Point</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 8px #f59e0b' }} />
                <span>Active Attack Pivot Path</span>
              </div>
              {(secureMode || simMitigated) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '1px', borderTop: '2px dashed #10b981', display: 'inline-block' }} />
                  <span style={{ color: 'var(--color-low)' }}>Dashed Green: Firewalled/Patched</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Statistics Badge */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(13, 18, 34, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8em',
            pointerEvents: 'none'
          }}>
            {simMitigated ? (
              <span style={{ color: 'var(--color-low)', fontWeight: 'bold' }}>
                🛡️ ATTACK CONTAINED & ISOLATED
              </span>
            ) : !secureMode && attackPathElements.nodes.size > 0 ? (
              <span style={{ color: 'var(--color-critical)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-critical)', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                LATERAL DRIFT: {attackPathElements.nodes.size} hosts compromised
              </span>
            ) : (
              <span style={{ color: 'var(--color-low)', fontWeight: 'bold' }}>
                🔒 INFRASTRUCTURE ISOLATED & SECURE
              </span>
            )}
          </div>

          {/* Force Graph Render */}
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            onNodeClick={handleNodeClick}
            onNodeHover={setHoveredNode}
            nodeCanvasObject={drawNode}
            paintBeforeUpdate={paintBeforeUpdate}
            
            // Link styling & flowing particles on active attack paths
            linkWidth={link => {
              if (!link) return 1;
              if (isLinkMitigated(link)) return 1.5;
              return attackPathElements.links.has(link.id) ? 2.5 : 1;
            }}
            linkColor={link => {
              if (!link) return 'rgba(59, 130, 246, 0.15)';
              if (isLinkMitigated(link)) {
                // Mitigated links are rendered as light green lines representing secure firewalls
                return 'rgba(16, 185, 129, 0.55)';
              }
              // Active attack path links are colored neon red/orange
              if (attackPathElements.links.has(link.id) && !secureMode) return 'rgba(239, 68, 68, 0.85)';
              return 'rgba(59, 130, 246, 0.15)';
            }}
            
            // Flowing particles representing active threat packets along attack routes
            linkDirectionalParticles={link => {
              if (secureMode || !link) return 0;
              if (isLinkMitigated(link)) return 0; // No threat flow through firewall rules!
              return attackPathElements.links.has(link.id) ? 4 : 0;
            }}
            linkDirectionalParticleWidth={3}
            linkDirectionalParticleSpeed={0.012}
            linkDirectionalParticleColor={() => 'rgba(239, 68, 68, 1)'}
            
            linkDirectionalArrowLength={3}
            linkDirectionalArrowColor={link => {
              if (!link) return 'rgba(59, 130, 246, 0.2)';
              return isLinkMitigated(link) ? 'rgba(16, 185, 129, 0.5)' : 'rgba(59, 130, 246, 0.2)';
            }}
            cooldownTicks={100}
          />
        </div>

        {/* Side Panel: Node Contextual Intelligence */}
        <div style={{
          width: '320px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflowY: 'auto',
          transition: 'all 0.3s'
        }}>
          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: '0.7em', 
                  fontWeight: 'bold', 
                  color: getNodeStyle(selectedNode.label).color,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {getNodeStyle(selectedNode.label).label}
                </span>
                <button 
                  onClick={() => setSelectedNode(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1em' }}
                >
                  ✕
                </button>
              </div>

              <h3 style={{ margin: '5px 0 0 0', color: '#ffffff', fontSize: '1.4em', fontWeight: 'bold', wordBreak: 'break-word' }}>
                {selectedNode.name}
              </h3>

              {/* Machine-Specific Context panel */}
              {selectedNode.label === 'Machine' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  
                  {/* Risk Score Dial */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75em', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Host Risk Rating
                    </div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: selectedNode.riskScore > 75 ? 'var(--color-critical)' : selectedNode.riskScore > 40 ? 'var(--color-high)' : 'var(--color-low)' }}>
                      {selectedNode.riskScore || 0}%
                    </div>
                    <div style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {selectedNode.riskScore > 75 ? 'Critical vulnerability exposure' : selectedNode.riskScore > 40 ? 'Medium risk to infrastructure' : 'Secured / Isolated Host'}
                    </div>
                  </div>

                  {/* Properties list */}
                  <div>
                    <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Host Parameters</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontSize: '0.85em' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Operating System:</span>
                        <span style={{ color: '#fff', fontWeight: 500 }}>{selectedNode.name === 'PC-ALICE' || selectedNode.name === 'PC-BOB' || selectedNode.name === 'DC-01' ? 'Windows' : 'Linux (Ubuntu)'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Asset Tier:</span>
                        <span style={{ color: '#fff', fontWeight: 500 }}>{selectedNode.criticality?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Recommendations */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>🛡️ Defensive Mitigations</span>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '0.85em', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {getHostMitigations(selectedNode.name).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

              {/* Vulnerability-Specific Context panel */}
              {selectedNode.label === 'Vulnerability' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div style={{ background: 'rgba(239,68,68,0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: '0.75em', color: 'var(--color-critical)', fontWeight: 'bold', textTransform: 'uppercase' }}>CVSS v3 Severity</span>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-critical)' }}>
                      10.0 / 10
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Threat Description</span>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {selectedNode.name === 'Log4Shell' 
                        ? 'Permet à un attaquant distant d\'exécuter du code arbitraire sur le serveur cible si l\'application enregistre une chaîne de caractères spécifique via Log4j.' 
                        : selectedNode.name === 'Zerologon'
                        ? 'Permet à un attaquant non authentifié d\'établir une connexion Netlogon sécurisée vers un contrôleur de domaine et d\'obtenir des privilèges d\'administrateur de domaine.'
                        : 'Vulnérabilité critique permettant l\'escalade de privilèges ou l\'exécution de code à distance.'
                      }
                    </p>
                  </div>
                  
                  {secureMode && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(16,185,129,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-low)', fontSize: '0.8em' }}>
                      <span>✓</span>
                      <strong>CVE fully patched & mitigated.</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Resource-Specific Context panel */}
              {selectedNode.label === 'Resource' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <div style={{ background: 'rgba(251,191,36,0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <span style={{ fontSize: '0.75em', color: 'var(--color-high)', fontWeight: 'bold', textTransform: 'uppercase' }}>Sensitivity Tier</span>
                    <div style={{ fontSize: '1.6em', fontWeight: 'bold', color: 'var(--color-high)' }}>
                      CRITICAL ASSET
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Asset Details</span>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85em', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {"Ce nœud représente une ressource hautement stratégique de l'entreprise (ex. Active Directory, Sauvegardes centrales, Base de données clients). Sa compromission entraîne une perte complète de contrôle sur le SI."}
                    </p>
                  </div>
                </div>
              )}

              {/* Fallback general info */}
              {selectedNode.label !== 'Machine' && selectedNode.label !== 'Vulnerability' && selectedNode.label !== 'Resource' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                  <p>
                    {"Nœud de type "}<strong>{selectedNode.label}</strong>{" modélisant un composant clé de l'infrastructure de CyberCorp dans le graphe Neo4j."}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.5em' }}>🎯</span>
              <p style={{ fontSize: '0.85em', margin: 0 }}>
                Cliquez sur n'importe quel nœud de la topologie pour afficher ses caractéristiques cyber, son score de risque, et ses remédiations.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* CSS Keyframe Animations for UI Glows */}
      <style jsx global>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);
          }
        }
      `}</style>
    </div>
  );
}
