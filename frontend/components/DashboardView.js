import React from 'react';
import styles from '../styles/Home.module.css';

function RiskGauge({ level, secureMode }) {
  // Translate risk level to percentage (max 15 vulns/paths = 100%)
  const percentage = secureMode ? 5 : Math.min((level / 12) * 100, 100);
  const color = secureMode ? '#10b981' : level > 8 ? '#ef4444' : level > 4 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ position: 'relative', marginTop: '10px' }}>
      <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7em', color: 'var(--text-muted)', marginTop: '6px' }}>
        <span>SECURE</span>
        <span>MODERATE</span>
        <span>HIGH</span>
        <span>CRITICAL</span>
      </div>
    </div>
  );
}

export default function DashboardView({ stats, vulnerable, paths, resources, loading, riskLevel, secureMode, originalStats, startNode }) {
  return (
    <div className={styles.dashboard}>
      {loading ? (
        <p className={styles.loading}>Analyzing infrastructure security topology...</p>
      ) : (
        <>
          {/* Main Statistics Cards */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>Mapped Machines</h3>
              <p className={styles.bigNumber}>{stats?.machines || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Active Directory Users</h3>
              <p className={styles.bigNumber}>{stats?.users || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Total Known Vulnerabilities</h3>
              <p className={styles.bigNumber}>{stats?.vulnerabilities || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Monitored Sensitive Assets</h3>
              <p className={styles.bigNumber}>{stats?.resources || 0}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '35px', flexWrap: 'wrap' }} className={styles.dashboardGrid}>
            
            {/* Risk Overview Box */}
            <div className={styles.subsection} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>🛡️ SI Risk Exposure Analysis</h3>
                <span style={{ fontSize: '0.75em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Entrypoint: {startNode}
                </span>
              </div>
              <p className={styles.description}>
                Security metrics showing the active threat vectors starting from the compromised host:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '20px' }}>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75em', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>Attack Paths</p>
                  {secureMode ? (
                    <div>
                      <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: 'var(--color-low)', margin: 0 }}>0</p>
                      <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', textDecoration: 'line-through' }}>was {originalStats.paths}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: paths.length > 0 ? 'var(--cyber-blue)' : 'var(--color-low)', margin: 0 }}>
                      {paths?.length || 0}
                    </p>
                  )}
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75em', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>Active Vulns</p>
                  {secureMode ? (
                    <div>
                      <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: 'var(--color-low)', margin: 0 }}>0</p>
                      <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', textDecoration: 'line-through' }}>was {originalStats.vulns}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: vulnerable.length > 0 ? 'var(--color-critical)' : 'var(--color-low)', margin: 0 }}>
                      {vulnerable?.length || 0}
                    </p>
                  )}
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75em', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>Assets at Risk</p>
                  {secureMode ? (
                    <div>
                      <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: 'var(--color-low)', margin: 0 }}>0</p>
                      <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', textDecoration: 'line-through' }}>was {originalStats.resources}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '1.8em', fontWeight: 'bold', color: resources.length > 0 ? 'var(--color-high)' : 'var(--color-low)', margin: 0 }}>
                      {resources?.filter(r => r.sensitivity === 'critical')?.length || 0}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Overall Risk Gauge */}
            <div className={styles.subsection}>
              <h3>📊 Overall Infrastructure Risk Rating</h3>
              <p className={styles.description}>
                Aggregated system risk calculation based on open network paths and unpatched vulnerabilities:
              </p>
              
              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85em', fontWeight: 'bold', color: 'var(--text-secondary)' }}>SI threat level:</span>
                  <span 
                    style={{ 
                      fontSize: '0.85em', 
                      fontWeight: 'bold', 
                      color: secureMode ? 'var(--color-low)' : riskLevel === 'critical' ? 'var(--color-critical)' : riskLevel === 'high' ? 'var(--color-high)' : 'var(--color-low)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {secureMode ? '✓ SECURED' : `${riskLevel} Risk`}
                  </span>
                </div>
                
                <RiskGauge level={vulnerable?.length + paths?.length} secureMode={secureMode} />
                
                <div 
                  className={styles.riskHigh}
                  style={{
                    marginTop: '20px',
                    borderLeftColor: secureMode ? 'var(--color-low)' : 'var(--color-critical)',
                    background: secureMode ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    color: secureMode ? '#a7f3d0' : '#ff8787'
                  }}
                >
                  {secureMode ? (
                    <span>
                      <strong>🔒 Post-Mitigation Active:</strong> Network segmentation restricts lateral movement between zones. Critical hosts are isolated, vulnerabilities are patched, and the threat of domain takeover is fully mitigated.
                    </span>
                  ) : vulnerable?.length > 0 ? (
                    <span>
                      <strong>⚠️ Compromise Warning:</strong> An attacker on <strong>{startNode}</strong> can pivot laterally to reach domain controllers and backups. Immediate action is required to patch critical vulnerabilities (Log4Shell, Zerologon) and segment the network.
                    </span>
                  ) : (
                    <span>
                      <strong>✓ Isolated Workstation:</strong> No active attack paths exist from this machine. Critical assets are secure.
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
