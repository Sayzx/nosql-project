import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';
import { api } from '../utils/api';
import DashboardView from '../components/DashboardView';
import MachinesView from '../components/MachinesView';
import AnalysisView from '../components/AnalysisView';
import UsersView from '../components/UsersView';
import AdminView from '../components/AdminView';

const GraphView = dynamic(() => import('../components/GraphView'), { ssr: false });

export default function Home() {
  const [stats, setStats] = useState(null);
  const [machines, setMachines] = useState([]);
  const [paths, setPaths] = useState([]);
  const [vulnerable, setVulnerable] = useState([]);
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStartNode, setSelectedStartNode] = useState('PC-ALICE');
  const [secureMode, setSecureMode] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAllData();
      setStats(data.stats);
      setMachines(data.machines || []);
      setUsers(data.users || []);
      
      // Load initial analysis for PC-ALICE
      await loadAnalysisData(selectedStartNode);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisData = async (node) => {
    setAnalysisLoading(true);
    try {
      const [pathsData, vulnsData, resourcesData] = await Promise.all([
        api.fetchAttackPaths(node),
        api.fetchVulnerabilities(node),
        api.fetchResources(node)
      ]);
      setPaths(pathsData || []);
      setVulnerable(vulnsData || []);
      setResources(resourcesData || []);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleStartNodeChange = async (node) => {
    setSelectedStartNode(node);
    await loadAnalysisData(node);
  };

  const exportData = (format) => {
    const data = {
      timestamp: new Date().toISOString(),
      compromised_entry_point: selectedStartNode,
      security_mode: secureMode ? 'secured_post_mitigation' : 'vulnerable_default',
      stats,
      machines: secureMode ? getSecuredMachines(machines) : getVulnerableMachinesList(machines, vulnerable),
      paths: secureMode ? [] : paths,
      vulnerable: secureMode ? [] : vulnerable,
      resources: secureMode ? [] : resources,
      users,
    };

    if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `cybercorp-analysis-${selectedStartNode}-${secureMode ? 'secured' : 'vulnerable'}.json`, 'application/json');
    } else if (format === 'csv') {
      const csv = generateCSV(data);
      downloadFile(csv, `cybercorp-analysis-${selectedStartNode}-${secureMode ? 'secured' : 'vulnerable'}.csv`, 'text/csv');
    }
  };

  // Helper lists for export
  const getVulnerableMachinesList = (machs, vulns) => {
    return machs.map(m => {
      const score = calculateMachineRiskScore(m, vulns, false);
      return { ...m, riskScore: score };
    });
  };

  const getSecuredMachines = (machs) => {
    return machs.map(m => {
      const score = calculateMachineRiskScore(m, [], true);
      return { ...m, riskScore: score };
    });
  };

  const generateCSV = (data) => {
    let csv = `CyberCorp Infrastructure Security Analysis\n`;
    csv += `Generated: ${data.timestamp}\n`;
    csv += `Compromised Entry Point: ${data.compromised_entry_point}\n`;
    csv += `Security Status: ${data.security_mode.toUpperCase()}\n\n`;

    csv += '=== MACHINES & RISK SCORING ===\n';
    csv += 'Name,Type,Criticality,RiskScore\n';
    data.machines.forEach(m => {
      csv += `${m.name},${m.type},${m.criticality},${m.riskScore || 0}%\n`;
    });

    csv += '\n=== ACTIVE VULNERABILITIES ===\n';
    if (data.vulnerable.length > 0) {
      csv += 'Machine,CVE,Vulnerability,Score\n';
      data.vulnerable.forEach(v => {
        csv += `${v.machine},${v.cve},${v.vulnerability},${v.score}\n`;
      });
    } else {
      csv += 'No active vulnerabilities (All patched or mitigated)\n';
    }

    csv += '\n=== DETECTED ATTACK PATHS ===\n';
    if (data.paths.length > 0) {
      csv += 'Path,Target,TargetCriticality\n';
      data.paths.forEach(p => {
        const pathStr = Array.isArray(p.path) ? p.path.join(' -> ') : 'N/A';
        csv += `"${pathStr}",${p.target},${p.criticality}\n`;
      });
    } else {
      csv += 'No active attack paths (Network segmented & secured)\n';
    }

    return csv;
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to calculate risk score for a machine
  const calculateMachineRiskScore = (machine, vulns, isSecured) => {
    if (isSecured) {
      // In secured mode, risk is strictly restricted to base system criticality with no vulnerabilities or network exposure
      const baseScores = { critical: 25, high: 15, medium: 8, low: 2 };
      return baseScores[machine.criticality] || 5;
    }
    
    // In vulnerable mode, calculate based on vulnerabilities and criticality
    const baseScores = { critical: 40, high: 25, medium: 12, low: 4 };
    let score = baseScores[machine.criticality] || 10;
    
    // Add vulnerability impact
    const machineVulns = vulns.filter(v => v.machine === machine.name);
    if (machineVulns.length > 0) {
      // Max vuln score * 5
      const maxVulnScore = Math.max(...machineVulns.map(v => v.score));
      score += maxVulnScore * 5.0; // e.g. Log4Shell (10.0) adds +50%
    }

    // Add network exposure (if machine is connected to compromised machine or is a server)
    if (machine.type === 'server' || machine.type === 'domain_controller') {
      score += 8;
    }
    
    return Math.min(Math.round(score), 100);
  };

  // Compute stats and lists for rendering based on secureMode
  const activePaths = secureMode ? [] : paths;
  const activeVulnerabilities = secureMode ? [] : vulnerable;
  const activeResourcesAtRisk = secureMode ? [] : resources;
  
  const machinesWithRiskScores = machines.map(m => ({
    ...m,
    riskScore: calculateMachineRiskScore(m, vulnerable, secureMode)
  }));

  const overallRiskValue = secureMode ? 1.5 : Math.max(vulnerable.length, paths.length * 1.5);
  const riskLevel = secureMode ? 'low' : overallRiskValue > 10 ? 'critical' : overallRiskValue > 5 ? 'high' : 'medium';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>CyberCorp Attack Path Mapper</h1>
            <p>
              <span>🛡️ SI Risk Management Dashboard</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: secureMode ? 'var(--color-low)' : 'var(--color-critical)', fontWeight: 600 }}>
                STATUS: {secureMode ? '🔒 SECURE (POST-MITIGATION)' : '⚠️ VULNERABLE (ACTIVE ATTACKS)'}
              </span>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Start Node Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0d1222', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--text-secondary)' }}>🔴 COMPROMISED:</span>
              <select
                value={selectedStartNode}
                onChange={(e) => handleStartNodeChange(e.target.value)}
                style={{
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.85em',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {machines.map(m => (
                  <option key={m.name} value={m.name} style={{ background: '#0d1222', color: '#fff' }}>{m.name}</option>
                ))}
                {machines.length === 0 && <option value="PC-ALICE">PC-ALICE</option>}
              </select>
            </div>

            {/* Secure Mode Simulation Toggle */}
            <div className={styles.switchContainer}>
              <span style={{ fontSize: '0.8em', fontWeight: 600, color: secureMode ? 'var(--color-low)' : 'var(--text-secondary)' }}>
                {secureMode ? '🔒 MITIGATIONS ACTIVE' : '🔓 SECURE SIMULATION'}
              </span>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={secureMode} 
                  onChange={(e) => setSecureMode(e.target.checked)} 
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Actions */}
            <button
              onClick={loadAllData}
              className={styles.navButton}
              style={{
                padding: '8px 14px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--cyber-blue)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.8em',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              title="Reload data from database"
            >
              🔄 Refresh
            </button>
            
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <button
                onClick={() => exportData('json')}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8em',
                  fontWeight: 600
                }}
              >
                JSON
              </button>
              <span style={{ display: 'inline-block', width: '1px', background: 'var(--border-color)' }}></span>
              <button
                onClick={() => exportData('csv')}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8em',
                  fontWeight: 600
                }}
              >
                CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className={styles.nav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'machines', label: 'Infrastructure', icon: '💻' },
          { id: 'analysis', label: 'Attack Paths', icon: '🔍' },
          { id: 'users', label: 'Access Control', icon: '🔑' },
          { id: 'graph', label: 'Graph Explorer', icon: '🕸️' },
          { id: 'admin', label: 'Database Manager', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? styles.active : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <DashboardView 
          stats={stats} 
          vulnerable={activeVulnerabilities} 
          paths={activePaths} 
          resources={activeResourcesAtRisk} 
          loading={loading || analysisLoading} 
          riskLevel={riskLevel}
          secureMode={secureMode}
          originalStats={{
            paths: paths.length,
            vulns: vulnerable.length,
            resources: resources.filter(r => r.sensitivity === 'critical').length
          }}
          startNode={selectedStartNode}
        />
      )}
      {activeTab === 'machines' && (
        <MachinesView 
          machines={machinesWithRiskScores} 
          loading={loading} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          secureMode={secureMode}
        />
      )}
      {activeTab === 'analysis' && (
        <AnalysisView 
          paths={activePaths} 
          vulnerable={activeVulnerabilities} 
          resources={activeResourcesAtRisk} 
          loading={loading || analysisLoading}
          secureMode={secureMode}
          originalPaths={paths}
          originalVulns={vulnerable}
          originalResources={resources}
          startNode={selectedStartNode}
        />
      )}
      {activeTab === 'users' && (
        <UsersView 
          users={users} 
          machines={machines} 
          loading={loading}
          secureMode={secureMode}
        />
      )}
      {activeTab === 'graph' && (
        <GraphView 
          users={users} 
          loading={loading} 
          secureMode={secureMode}
          compromisedEntryPoint={selectedStartNode}
          paths={activePaths}
          machines={machinesWithRiskScores}
        />
      )}
      {activeTab === 'admin' && (
        <AdminView 
          onRefreshAllData={loadAllData}
        />
      )}
    </div>
  );
}
