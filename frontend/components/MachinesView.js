import React from 'react';
import styles from '../styles/Home.module.css';

export default function MachinesView({ machines, loading, searchQuery, setSearchQuery, secureMode }) {
  const filtered = machines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score) => {
    if (score > 75) return 'var(--color-critical)';
    if (score > 40) return 'var(--color-high)';
    if (score > 15) return 'var(--color-medium)';
    return 'var(--color-low)';
  };

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>System Infrastructure & Scoring</h2>
          <p className={styles.description} style={{ margin: '4px 0 0 0' }}>
            Risk scoring for each workstation and server based on vulnerability severity and access paths
          </p>
        </div>
        {secureMode && (
          <span style={{ fontSize: '0.8em', color: 'var(--color-low)', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 'bold' }}>
            🔒 MITIGATION SIMULATION ACTIVE
          </span>
        )}
      </div>

      {loading ? (
        <p className={styles.loading}>Loading system components...</p>
      ) : (
        <>
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '25px' }}>
            <input
              type="text"
              placeholder="Search assets by host name, OS, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.9em',
                outline: 'none',
                transition: 'border-color 0.25s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--cyber-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {filtered.length === 0 ? (
            <p className={styles.noData}>No infrastructure hosts match your search query</p>
          ) : (
            <>
              <div className={styles.machinesList}>
                {filtered.map(m => {
                  const riskColor = getScoreColor(m.riskScore);
                  return (
                    <div key={m.name} className={`${styles.machine} ${styles[m.criticality]}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong>{m.name}</strong>
                        {secureMode ? (
                          <span title="Secured and isolated" style={{ fontSize: '0.9em' }}>🔒</span>
                        ) : (
                          m.riskScore > 60 && <span title="High vulnerability exposure" style={{ fontSize: '0.9em', animation: 'pulse 1.5s infinite' }}>⚠️</span>
                        )}
                      </div>
                      <p className={styles.machineType}>{m.type.replace('_', ' ')}</p>
                      
                      {/* Risk Score Indicator */}
                      <div style={{ marginTop: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                          <span>Risk Score</span>
                          <span style={{ color: riskColor, fontWeight: 'bold' }}>{m.riskScore}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${m.riskScore}%`, 
                              background: riskColor,
                              boxShadow: `0 0 5px ${riskColor}`,
                              transition: 'width 0.5s ease-out' 
                            }} 
                          />
                        </div>
                      </div>

                      <p className={styles.criticality_badge} style={{ color: 'var(--text-muted)' }}>
                        Asset: {m.criticality}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className={styles.legend}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>LEGEND:</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--color-critical)' }}>●</span> Critical Risk (&gt;75%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--color-high)' }}>●</span> High Risk (40-75%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--color-medium)' }}>●</span> Medium Risk (15-40%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: 'var(--color-low)' }}>●</span> Low Risk (&lt;15%)
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
