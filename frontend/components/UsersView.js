import React from 'react';
import styles from '../styles/Home.module.css';

export default function UsersView({ users, machines, loading, secureMode }) {
  if (loading) return <div className={styles.section}><p className={styles.loading}>Loading user directories...</p></div>;

  // Enhance users with rich profile data matching the project sujet
  const userProfiles = {
    alice: { role: 'Responsable RH', dept: 'Ressources Humaines', privileges: 'Standard Workstation, SRV-WEB (Read)' },
    bob: { role: 'Développeur Senior', dept: 'Ingénierie & Dev', privileges: 'Workstation, SRV-DB Access (Direct)' },
    charlie: { role: 'Administrateur Système', dept: 'IT Operations', privileges: 'Domain Controller (DC-01), NAS-BACKUP' },
    diana: { role: 'RSSI (CISO)', dept: 'Sécurité de l\'Information', privileges: 'Security Audits & Monitoring' },
    eve: { role: 'Stagiaire RH', dept: 'Ressources Humaines', privileges: 'Limited Workstation Access' },
    carol: { role: 'Directrice Financière', dept: 'Finance', privileges: 'Workstation, Payroll Access' },
    david: { role: 'Ingénieur DevOps', dept: 'Ingénierie & Dev', privileges: 'Workstation, SRV-DB Access (Dev)' }
  };

  const getUserData = (name) => {
    const key = (name || '').toLowerCase();
    return userProfiles[key] || { role: 'Collaborateur', dept: 'CyberCorp Staff', privileges: 'Standard Access' };
  };

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Identity & Access Management (IAM)</h2>
          <p className={styles.description} style={{ margin: '4px 0 0 0' }}>
            Review user privileges, group memberships, and active directory authorization levels
          </p>
        </div>
      </div>

      {users && users.length > 0 ? (
        <div className={styles.subsection}>
          <h3>Active Directory Users</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Corporate Role</th>
                <th>Department</th>
                <th>Assigned Privileges</th>
                <th>IAM Security Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const userName = u?.name || u || '';
                const profile = getUserData(userName);
                const isHighRisk = userName.toLowerCase() === 'charlie' || userName.toLowerCase() === 'bob';
                
                return (
                  <tr key={i} className={isHighRisk && !secureMode ? styles.high : ''}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#ffffff' }}>{userName.toUpperCase()}</strong>
                        <span style={{ fontSize: '0.75em', color: 'var(--text-muted)' }}>{userName.toLowerCase()}@cybercorp.com</span>
                      </div>
                    </td>
                    <td>{profile.role}</td>
                    <td>
                      <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>{profile.dept}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8em', fontFamily: 'var(--font-mono)', color: 'var(--cyber-teal)' }}>
                        {secureMode && userName.toLowerCase() === 'bob' 
                          ? 'Workstation (SRV-DB access restricted)' 
                          : secureMode && userName.toLowerCase() === 'charlie'
                          ? 'DC-01, NAS-BACKUP (MFA Enforced)'
                          : profile.privileges
                        }
                      </span>
                    </td>
                    <td>
                      {secureMode ? (
                        <span className={styles.badge} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-low)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          🔒 SECURE
                        </span>
                      ) : isHighRisk ? (
                        <span className={styles.badge} style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-high)', border: '1px solid rgba(245,158,11,0.3)' }}>
                          ⚠️ EXPOSED
                        </span>
                      ) : (
                        <span className={styles.badge} style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--cyber-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
                          ACTIVE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noData}>No Active Directory user profiles could be retrieved</p>
      )}
    </div>
  );
}
