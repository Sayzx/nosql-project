import React from 'react';
import styles from '../styles/Home.module.css';

export default function MachinesView({ machines, loading, searchQuery, setSearchQuery }) {
  const filtered = machines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.section}>
      <h2>Infrastructure Machines</h2>
      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search machines by name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '0.9em'
            }}
          />
          {filtered.length === 0 ? (
            <p className={styles.noData}>No machines found</p>
          ) : (
            <>
              <div className={styles.machinesList}>
                {filtered.map(m => (
                  <div key={m.name} className={`${styles.machine} ${styles[m.criticality]}`}>
                    <strong>{m.name}</strong>
                    <p className={styles.machineType}>{m.type}</p>
                    <p className={styles.criticality_badge}>{m.criticality.toUpperCase()}</p>
                  </div>
                ))}
              </div>
              <div className={styles.legend}>
                <p><span className={styles.red}>🔴</span> Critical | <span className={styles.orange}>🟠</span> High | <span className={styles.green}>🟢</span> Low</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
