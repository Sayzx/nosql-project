import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';
import { api } from '../utils/api';
import DashboardView from '../components/DashboardView';
import MachinesView from '../components/MachinesView';
import AnalysisView from '../components/AnalysisView';
import UsersView from '../components/UsersView';

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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await api.fetchAllData();
      setStats(data.stats);
      setMachines(data.machines || []);
      setPaths(data.paths || []);
      setVulnerable(data.vulnerable || []);
      setResources(data.resources || []);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format) => {
    const data = {
      timestamp: new Date().toISOString(),
      stats,
      machines,
      paths,
      vulnerable,
      resources,
      users,
    };

    if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, 'cybercorp-analysis.json', 'application/json');
    } else if (format === 'csv') {
      const csv = generateCSV(data);
      downloadFile(csv, 'cybercorp-analysis.csv', 'text/csv');
    }
  };

  const generateCSV = (data) => {
    let csv = 'CyberCorp Analysis Export\n';
    csv += `Generated: ${data.timestamp}\n\n`;

    csv += '=== MACHINES ===\n';
    csv += 'Name,Type,Criticality\n';
    data.machines.forEach(m => {
      csv += `${m.name},${m.type},${m.criticality}\n`;
    });

    csv += '\n=== VULNERABILITIES ===\n';
    csv += 'Machine,CVE,Vulnerability,Score\n';
    data.vulnerable.forEach(v => {
      csv += `${v.machine},${v.cve},${v.vulnerability},${v.score}\n`;
    });

    csv += '\n=== ATTACK PATHS ===\n';
    csv += 'Path,Target,Criticality\n';
    data.paths.forEach(p => {
      const pathStr = Array.isArray(p.path) ? p.path.join('->') : 'N/A';
      csv += `${pathStr},${p.target},${p.criticality}\n`;
    });

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

  const riskLevel = vulnerable.length > 10 ? 'critical' : vulnerable.length > 5 ? 'high' : 'medium';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>CyberCorp Analysis Dashboard</h1>
            <p>Network Security & Attack Path Analysis</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={loadAllData}
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => exportData('json')}
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              ↓ JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              ↓ CSV
            </button>
          </div>
        </div>
      </header>

      <nav className={styles.nav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'machines', label: 'Machines', icon: '💻' },
          { id: 'analysis', label: 'Analysis', icon: '🔍' },
          { id: 'users', label: 'Users', icon: '👤' },
          { id: 'graph', label: 'Graph', icon: '🕸️' },
        ].map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? styles.active : ''}
            onClick={() => setActiveTab(tab.id)}
            style={{ textTransform: 'capitalize' }}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <DashboardView stats={stats} vulnerable={vulnerable} paths={paths} resources={resources} loading={loading} riskLevel={riskLevel} />
      )}
      {activeTab === 'machines' && (
        <MachinesView machines={machines} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}
      {activeTab === 'analysis' && (
        <AnalysisView paths={paths} vulnerable={vulnerable} resources={resources} loading={loading} />
      )}
      {activeTab === 'users' && (
        <UsersView users={users} machines={machines} loading={loading} />
      )}
      {activeTab === 'graph' && (
        <GraphView users={users} loading={loading} />
      )}
    </div>
  );
}
