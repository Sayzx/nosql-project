import React, { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function AnalysisView({ 
  paths, 
  vulnerable, 
  resources, 
  loading, 
  secureMode, 
  originalPaths, 
  originalVulns, 
  originalResources,
  startNode 
}) {
  const [sortBy, setSortBy] = useState('score');
  const [showReportModal, setShowReportModal] = useState(false);
  const [auditorName, setAuditorName] = useState('Analyste SecOps');
  const [companyName, setCompanyName] = useState('CyberCorp SA');
  const [copySuccess, setCopySuccess] = useState(false);

  const activeVulns = secureMode ? [] : vulnerable;
  const sortedVuln = [...(activeVulns || [])].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    return a.machine.localeCompare(b.machine);
  });

  const generateReportMarkdown = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `# RAPPORT D'AUDIT DE SÉCURITÉ & D'ANALYSE DES CHEMINS D'ATTAQUE (LIVRABLE 3)
    
**Auditeur :** ${auditorName}
**Organisation cible :** ${companyName}
**Date de l'audit :** ${dateStr}
**Statut de l'environnement :** ${secureMode ? '🔒 SÉCURISÉ (APRÈS REMÉDIATIONS)' : '⚠️ CRITIQUE (COMPROMISSION ACTIVE)'}
**Point d'entrée compromis analysé :** ${startNode}

---

## 1. RÉSUMÉ EXÉCUTIF
Ce rapport présente l'analyse de sécurité et la cartographie des risques de l'infrastructure d'information de **${companyName}**, modélisée et auditée grâce à notre base de données de graphe orientée sécurité sous Neo4j.
L'objectif est d'identifier les chemins d'attaque potentiels (mouvements latéraux) qu'un groupe hostile pourrait emprunter à partir du poste initial compromis (**${startNode}**) pour atteindre les serveurs critiques et le contrôleur de domaine principal (**DC-01**).

${secureMode 
  ? "Dans l'état actuel de simulation sécurisée, toutes les menaces et chemins de compromission identifiés ont été bloqués avec succès grâce à l'implémentation de politiques de cloisonnement réseau strictes, de correctifs de sécurité applicatifs, et de l'alignement sur le principe du moindre privilège."
  : `Dans l'état actuel par défaut, l'infrastructure présente des vulnérabilités critiques. L'attaquant dispose de **${paths.length} chemins d'attaque actifs** lui permettant de compromettre l'Active Directory en exploitant des vulnérabilités logicielles et des failles d'accès.`
}

---

## 2. INVENTAIRE ET ESTIMATION DU RISQUE DES MACHINES
L'analyse quantitative des risques se base sur la criticité intrinsèque de la machine combinée à son exposition réseau et aux vulnérabilités logicielles détectées dans son voisinage.

| Machine | Type d'Équipement | Criticité Intrinsèque | Risque Estimé (Vulnerable) | Risque Estimé (Sécurisé) |
| :--- | :--- | :---: | :---: | :---: |
| DC-01 | Domain Controller | CRITICAL | 98% | 25% |
| SRV-DB | Database Server | HIGH | 85% | 15% |
| SRV-WEB | Web Server | HIGH | 80% | 15% |
| NAS-BACKUP | Backup NAS | HIGH | 70% | 15% |
| PC-ALICE | Workstation | LOW | 40% | 2% |
| PC-BOB | Workstation | LOW | 35% | 2% |

---

## 3. ANALYSE DU CHEMIN D'ATTAQUE (LATERAL MOVEMENT)
À partir de la compromission initiale de **${startNode}**, le graphe met en évidence les étapes critiques suivantes utilisées lors de la phase d'exploitation :

${secureMode 
  ? "### ✓ Aucun chemin d'attaque actif\nLes chemins de transition ont été coupés par des règles de pare-feu et l'isolation des VLANs."
  : (paths || []).map((p, index) => {
      const pathStr = Array.isArray(p.path) ? p.path.join(' ➔ ') : 'N/A';
      return `### Chemin ${index + 1} : Vers ${p.target} (Niveau : ${p.criticality?.toUpperCase()})\n* **Vecteur de propagation :** \`${pathStr}\`\n* **Description du pivot :** L'attaquant utilise sa présence sur un poste utilisateur pour scanner les serveurs du sous-réseau, exploite des vulnérabilités de confiance Active Directory, puis pivote latéralement vers sa cible.`;
    }).join('\n\n')
}

---

## 4. REGISTRE DES VULNÉRABILITÉS (CVE) ET REQUÊTES DE DÉTECTION (CYPHER)
Les failles logicielles critiques suivantes constituent les principaux leviers d'escalade de privilèges identifiés dans le SI.

### 4.1. Liste des vulnérabilités critiques identifiées
${(originalVulns || []).map(v => `* **${v.cve}** (${v.vulnerability}) sur **${v.machine}** (Score CVSS : **${v.score}/10**)
  * *Impact :* Permet un pivot ou une exécution de code arbitraire de niveau administrateur.`).join('\n') || '* Aucune vulnérabilité critique active détectée.'}

### 4.2. Requêtes Cypher de détection pour l'administrateur
Pour auditer et surveiller ces risques dans Neo4j, utilisez les requêtes Cypher de sécurité suivantes :

* **Détection de tous les chemins d'attaque menant à un actif critique :**
  \`\`\`cypher
  MATCH path = (start:Machine {name: "${startNode}"})-[:CONNECTED_TO*]->(target:Machine)
  WHERE target.criticality = "critical" OR target.type = "domain_controller"
  RETURN path, length(path) AS hops
  ORDER BY hops ASC
  \`\`\`

* **Détection des machines vulnérables et de leurs scores CVSS :**
  \`\`\`cypher
  MATCH (m:Machine)-[:HAS_VULNERABILITY]->(v:Vulnerability)
  RETURN m.name AS Machine, v.cve AS CVE, v.name AS Description, v.score AS CVSS_Score
  ORDER BY v.score DESC
  \`\`\`

---

## 5. PLAN D'ACTION DE REMÉDIATION PROPOSÉ (BLUE TEAM)
Pour sécuriser durablement l'infrastructure de **${companyName}**, nous préconisons la mise en œuvre immédiate des contre-mesures suivantes :

1. **Cloisonnement Réseau Strict (Segmentation VLAN & Pare-feu) :**
   * Mettre en place un pare-feu bloquant tout trafic direct entre la zone Workstations (VLAN 10) et la zone Database (VLAN 30).
   * Restreindre l'accès au contrôleur de domaine (VLAN 100) aux seuls flux d'authentification légitimes.
2. **Campagne d'Application de Correctifs (Patch Management) :**
   * Appliquer en urgence le correctif de sécurité Microsoft contre **Zerologon (CVE-2020-1472)** sur **DC-01**.
   * Mettre à jour les bibliothèques Log4j vers la version 2.17.1 sur **SRV-WEB** pour éradiquer **Log4Shell (CVE-2021-44228)**.
3. **Restructuration des Droits d'Accès (Moindre Privilège) :**
   * Révoquer le groupe \`DEV\` de l'accès direct en SSH à **SRV-DB**. Remplacer par un serveur bastion avec authentification double facteur (MFA).

---
**Verdict de l'Auditeur :** L'infrastructure est classée comme **${secureMode ? 'SÉCURISÉE (MITIGATIONS COMPLÈTES)' : 'HAUTEMENT EXPOSÉE'}**. L'application des contre-mesures recommandées permet de réduire la surface d'attaque globale à **zéro chemin critique ouvert**.
`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generateReportMarkdown());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadFile = () => {
    const content = generateReportMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Livrable3_Rapport_Audit_${companyName.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Attack Path & Vulnerability Analysis</h2>
          <p className={styles.description} style={{ margin: '4px 0 0 0' }}>
            Exploit mapping and lateral movement path discovery starting from {startNode}
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, var(--cyber-blue), var(--cyber-teal))',
            color: '#ffffff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.85em',
            fontWeight: 'bold',
            boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📝</span> Générer Rapport Cyber (Livrable 3)
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Running Cypher graph traversal algorithms...</p>
      ) : secureMode ? (
        /* Render Mitigated / Secured State Analysis */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Comparison summary card */}
          <div className={styles.subsection} style={{ borderLeft: '4px solid var(--color-low)', background: 'rgba(16, 185, 129, 0.03)' }}>
            <h3 style={{ color: 'var(--color-low)' }}>🔒 SI Mitigations Comparison (Before vs After)</h3>
            <p className={styles.description}>
              Applying recommended security controls eliminates all lateral movement paths to critical business resources.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Attack Paths</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--color-critical)', fontWeight: 'bold' }}>{originalPaths.length}</span>
                  <span style={{ fontSize: '1.2em' }}>➔</span>
                  <span style={{ color: 'var(--color-low)', fontWeight: 'bold', fontSize: '1.3em' }}>0</span>
                </div>
                <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>100% Mitigated</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Active Vulns</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--color-critical)', fontWeight: 'bold' }}>{originalVulns.length}</span>
                  <span style={{ fontSize: '1.2em' }}>➔</span>
                  <span style={{ color: 'var(--color-low)', fontWeight: 'bold', fontSize: '1.3em' }}>0</span>
                </div>
                <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>All Patched</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Exposed Critical Assets</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--color-high)', fontWeight: 'bold' }}>
                    {originalResources.filter(r => r.sensitivity === 'critical').length}
                  </span>
                  <span style={{ fontSize: '1.2em' }}>➔</span>
                  <span style={{ color: 'var(--color-low)', fontWeight: 'bold', fontSize: '1.3em' }}>0</span>
                </div>
                <span style={{ fontSize: '0.7em', color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>Fully Isolated</span>
              </div>
            </div>
          </div>

          {/* List of applied security controls */}
          <div className={styles.subsection}>
            <h3>🛠️ Applied Security Controls (Segmentation & Hardening)</h3>
            <p className={styles.description}>
              The following defensive mitigations were simulated on the network topology:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>🩹</span>
                <div>
                  <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.9em' }}>Software Patching (Vulnerability Elimination)</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em' }}>
                    Patched **Log4Shell** (CVE-2021-44228) on SRV-WEB, **Zerologon** (CVE-2020-1472) on DC-01, and **SMB Misconfiguration** on NAS-BACKUP.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>🧱</span>
                <div>
                  <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.9em' }}>Zone-based Network Segmentation (VLAN & Firewalls)</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em' }}>
                    Severed direct routing between user workstations (PC-ALICE) and database servers (SRV-DB), and blocked database servers from reaching domain controllers (DC-01) directly.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>🔐</span>
                <div>
                  <strong style={{ color: '#ffffff', display: 'block', fontSize: '0.9em' }}>Least Privilege Access Control Restructuring</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em' }}>
                    {"Revoked the DEV group's direct SSH/admin network access to SRV-DB. Developers must now connect through secure jump hosts with multi-factor authentication (MFA)."}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Render Active Threat State Analysis */
        <>
          {/* Attack paths */}
          <div className={styles.subsection}>
            <h3>Active Attack Paths</h3>
            <p className={styles.description}>
              {"Identified lateral movement paths using Neo4j graph traversal (`MATCH path = (start)-[:CONNECTED_TO*]->(target)`):"}
            </p>
            {paths && paths.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Lateral Pivot Path</th>
                    <th>Target Asset</th>
                    <th>Risk Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {paths.map((p, i) => (
                    <tr key={i} className={styles.rowAttack}>
                      <td className={styles.pathCell}>
                        {Array.isArray(p.path) ? p.path.map((nodeName, idx) => (
                          <React.Fragment key={idx}>
                            <span style={{ 
                              color: idx === 0 ? 'var(--color-critical)' : idx === p.path.length - 1 ? '#ffffff' : 'var(--cyber-teal)',
                              fontWeight: idx === 0 || idx === p.path.length - 1 ? 'bold' : 'normal'
                            }}>
                              {nodeName}
                            </span>
                            {idx < p.path.length - 1 && ' ➔ '}
                          </React.Fragment>
                        )) : 'N/A'}
                      </td>
                      <td><strong>{p.target}</strong></td>
                      <td>
                        <span className={`${styles.badge} ${styles[p.criticality]}`}>
                          {p.criticality?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>✓ No attack paths detected from {startNode} to critical systems</p>
            )}
          </div>

          {/* Vulnerabilities */}
          <div className={styles.subsection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ margin: 0 }}>Active Vulnerabilities in Reach</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '6px 12px',
                  background: '#090d16',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.85em',
                  cursor: 'pointer'
                }}
              >
                <option value="machine">Sort by Host Name</option>
                <option value="score">Sort by CVE Score (Critical First)</option>
              </select>
            </div>
            <p className={styles.description}>
              Vulnerabilities present on hosts that are network-reachable from {startNode}:
            </p>
            {sortedVuln.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vulnerable Host</th>
                    <th>CVE ID</th>
                    <th>Vulnerability Name</th>
                    <th>CVSS Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVuln.map((v, i) => (
                    <tr key={i} className={v.score >= 9 ? styles.critical : v.score >= 7 ? styles.high : ''}>
                      <td><strong>{v.machine}</strong></td>
                      <td className={styles.cveCode}>{v.cve}</td>
                      <td>{v.vulnerability}</td>
                      <td>
                        <span className={`${styles.badge} ${v.score >= 9.0 ? styles.critical : v.score >= 7.0 ? styles.high : styles.medium}`}>
                          {v.score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>✓ No reachable vulnerabilities detected on the network</p>
            )}
          </div>

          {/* Resources */}
          <div className={styles.subsection}>
            <h3>Exposed High-Sensitivity Assets</h3>
            <p className={styles.description}>
              Sensitive databases and servers containing critical business intelligence reachable from {startNode}:
            </p>
            {resources && resources.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sensitive Asset</th>
                    <th>Sensitivity</th>
                    <th>Host Node</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r, i) => (
                    <tr key={i} className={r.sensitivity === 'critical' ? styles.critical : ''}>
                      <td><strong>{r.resource}</strong></td>
                      <td>
                        <span className={`${styles.badge} ${styles[r.sensitivity]}`}>
                          {r.sensitivity?.toUpperCase()}
                        </span>
                      </td>
                      <td>{r.machine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>✓ No high-sensitivity assets are reachable from this workstation</p>
            )}
          </div>
        </>
      )}

      {/* Audit Report Modal Overlay */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            width: '80%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 30px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2em', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span> Générateur de Rapport d'Audit (Livrable 3)
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2em'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Settings Bar */}
            <div style={{
              padding: '16px 30px',
              background: 'rgba(0,0,0,0.2)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.75em', color: 'var(--text-secondary)', fontWeight: 600 }}>NOM DE L'AUDITEUR</label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="Ex: SecOps Analyst"
                  style={{
                    padding: '8px 12px',
                    background: '#040711',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.85em',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '200px' }}>
                <label style={{ fontSize: '0.75em', color: 'var(--text-secondary)', fontWeight: 600 }}>ORGANISATION AUDITÉE</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: CyberCorp SA"
                  style={{
                    padding: '8px 12px',
                    background: '#040711',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.85em',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Modal Body: Report Markdown Preview */}
            <div style={{
              flex: 1,
              padding: '30px',
              overflowY: 'auto',
              background: '#040711',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82em',
              lineHeight: '1.5',
              color: '#d1d5db',
              whiteSpace: 'pre-wrap'
            }}>
              {generateReportMarkdown()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 30px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>
                Format : Markdown (.md)
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCopyToClipboard}
                  style={{
                    padding: '8px 16px',
                    background: copySuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: copySuccess ? 'var(--color-low)' : '#ffffff',
                    border: '1px solid',
                    borderColor: copySuccess ? 'var(--color-low)' : 'var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {copySuccess ? '✓ Copié !' : '📋 Copier le rapport'}
                </button>

                <button
                  onClick={handleDownloadFile}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--cyber-blue)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85em',
                    fontWeight: 600,
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  📥 Télécharger le rapport (.md)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
