import React from 'react';
import styles from '../styles/Home.module.css';

export default function UsersView({ users, machines, loading }) {
  if (loading) return <div className={styles.section}><p className={styles.loading}>Loading...</p></div>;

  return (
    <div className={styles.section}>
      <h2>User & Access Management</h2>
      {users && users.length > 0 ? (
        <div className={styles.subsection}>
          <h3>Users and Groups</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User/Group</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i}>
                  <td><strong>{u.name || u}</strong></td>
                  <td>{u.type || 'User'}</td>
                  <td><span className={styles.badge} style={{ background: '#dcfce7', color: '#065f46' }}>ACTIVE</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noData}>No user data available</p>
      )}
    </div>
  );
}
