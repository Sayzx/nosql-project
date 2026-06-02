import React from 'react';
import styles from '../styles/Home.module.css';

function RiskGauge({ level }) {
  const percentage = Math.min((level / 15) * 100, 100);
  const color = level > 10 ? '#dc2626' : level > 5 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
}

export default function DashboardView({ stats, vulnerable, paths, resources, loading, riskLevel }) {
  return (
    <div className={styles.dashboard}>
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <h3>Machines</h3>
              <p className={styles.bigNumber}>{stats?.machines || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Users</h3>
              <p className={styles.bigNumber}>{stats?.users || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Vulnerabilities</h3>
              <p className={styles.bigNumber}>{stats?.vulnerabilities || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Resources</h3>
              <p className={styles.bigNumber}>{stats?.resources || 0}</p>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <div className={styles.subsection}>
              <h3>Risk Overview</h3>
              <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>Attack Paths Found</p>
                  <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#2563eb' }}>{paths?.length || 0}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>Accessible Vulnerabilities</p>
                  <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#dc2626' }}>{vulnerable?.length || 0}</p>
                </div>
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '8px' }}>Critical Resources at Risk</p>
                  <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>{resources?.filter(r => r.sensitivity === 'critical')?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className={styles.subsection} style={{ marginTop: '20px' }}>
              <h3>Overall Risk Assessment</h3>
              <div style={{ marginTop: '15px' }}>
                <RiskGauge level={vulnerable?.length || 0} />
                <p style={{ marginTop: '15px', color: '#6b7280' }}>
                  {vulnerable?.length > 10 ? '⚠️ CRITICAL RISK: Multiple high-severity vulnerabilities accessible via attack paths' : vulnerable?.length > 5 ? '⚠️ HIGH RISK: Several vulnerabilities pose significant threat' : '✓ MODERATE RISK: System vulnerabilities are limited'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
