import React, { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function AnalysisView({ paths, vulnerable, resources, loading }) {
  const [sortBy, setSortBy] = useState('criticality');

  const sortedVuln = [...(vulnerable || [])].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    return a.machine.localeCompare(b.machine);
  });

  return (
    <div className={styles.section}>
      <h2>Attack Path Analysis</h2>

      {loading ? (
        <p className={styles.loading}>Loading analysis...</p>
      ) : (
        <>
          <div className={styles.subsection}>
            <h3>Attack Paths</h3>
            <p className={styles.description}>Lateral movement paths from compromised systems</p>
            {paths && paths.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Target</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((p, i) => (
                    <tr key={i} className={styles.rowAttack}>
                      <td className={styles.pathCell}>{Array.isArray(p.path) ? p.path.join(' → ') : 'N/A'}</td>
                      <td><strong>{p.target}</strong></td>
                      <td><span className={`${styles.badge} ${styles[p.criticality]}`}>{p.criticality?.toUpperCase()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>No attack paths found</p>
            )}
          </div>

          <div className={styles.subsection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Vulnerabilities</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: '4px' }}
              >
                <option value="machine">Sort by Machine</option>
                <option value="score">Sort by Score (High First)</option>
              </select>
            </div>
            <p className={styles.description}>Machines accessible with known vulnerabilities</p>
            {sortedVuln.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>CVE</th>
                    <th>Vulnerability</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVuln.map((v, i) => (
                    <tr key={i} className={v.score >= 9 ? styles.critical : v.score >= 7 ? styles.high : ''}>
                      <td><strong>{v.machine}</strong></td>
                      <td className={styles.cveCode}>{v.cve}</td>
                      <td>{v.vulnerability}</td>
                      <td><span className={`${styles.badge} ${v.score >= 9 ? styles.critical : v.score >= 7 ? styles.high : styles.medium}`}>{v.score.toFixed(1)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>No vulnerable machines found</p>
            )}
          </div>

          <div className={styles.subsection}>
            <h3>Critical Resources at Risk</h3>
            <p className={styles.description}>Sensitive data accessible through attack paths</p>
            {resources && resources.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Sensitivity</th>
                    <th>Located On</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r, i) => (
                    <tr key={i} className={r.sensitivity === 'critical' ? styles.critical : ''}>
                      <td><strong>{r.resource}</strong></td>
                      <td><span className={`${styles.badge} ${styles[r.sensitivity]}`}>{r.sensitivity?.toUpperCase()}</span></td>
                      <td>{r.machine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>No accessible resources found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
