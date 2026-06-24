// Clear existing data
MATCH (n) DETACH DELETE n;

// Create Users
CREATE (alice:User {name: "ALICE", department: "RH", email: "alice@cybercorp.com"})
CREATE (bob:User {name: "BOB", department: "DEV", email: "bob@cybercorp.com"})
CREATE (charlie:User {name: "CHARLIE", department: "IT", email: "charlie@cybercorp.com"})
CREATE (diana:User {name: "DIANA", department: "SECURITY", email: "diana@cybercorp.com"})
CREATE (eve:User {name: "EVE", department: "RH", email: "eve@cybercorp.com"})
CREATE (carol:User {name: "CAROL", department: "FINANCE", email: "carol@cybercorp.com"})
CREATE (david:User {name: "DAVID", department: "IT", email: "david@cybercorp.com"});

// Create Machines
CREATE (pc_alice:Machine {name: "PC-ALICE", type: "workstation", criticality: "low", os: "Windows 10"})
CREATE (pc_bob:Machine {name: "PC-BOB", type: "workstation", criticality: "medium", os: "Windows 10"})
CREATE (srv_web:Machine {name: "SRV-WEB", type: "server", criticality: "high", os: "Linux Ubuntu 20.04"})
CREATE (srv_db:Machine {name: "SRV-DB", type: "database", criticality: "critical", os: "Linux Ubuntu 20.04"})
CREATE (dc_01:Machine {name: "DC-01", type: "domain_controller", criticality: "critical", os: "Windows Server 2019"})
CREATE (nas_backup:Machine {name: "NAS-BACKUP", type: "storage", criticality: "critical", os: "NAS OS"});

// Create Services
CREATE (http_service:Service {name: "HTTP", port: 80, protocol: "TCP"})
CREATE (https_service:Service {name: "HTTPS", port: 443, protocol: "TCP"})
CREATE (ssh_service:Service {name: "SSH", port: 22, protocol: "TCP"})
CREATE (mysql_service:Service {name: "MySQL", port: 3306, protocol: "TCP"})
CREATE (ldap_service:Service {name: "LDAP", port: 389, protocol: "TCP"})
CREATE (smb_service:Service {name: "SMB", port: 445, protocol: "TCP"})
CREATE (rdp_service:Service {name: "RDP", port: 3389, protocol: "TCP"});

// Create Vulnerabilities
CREATE (cve_log4shell:Vulnerability {cve: "CVE-2021-44228", name: "Log4Shell", score: 10.0, type: "RCE", description: "Log4Shell Remote Code Execution"})
CREATE (cve_spring4shell:Vulnerability {cve: "CVE-2022-22965", name: "Spring4Shell", score: 9.8, type: "RCE", description: "Spring4Shell Remote Code Execution"})
CREATE (cve_bluekeep:Vulnerability {cve: "CVE-2019-0708", name: "BlueKeep", score: 9.8, type: "RCE", description: "BlueKeep RDP RCE"})
CREATE (cve_zerologon:Vulnerability {cve: "CVE-2020-1472", name: "Zerologon", score: 10.0, type: "Auth Bypass", description: "Zerologon Netlogon Privilege Escalation"})
CREATE (cve_smbv1:Vulnerability {cve: "CVE-2017-0144", name: "SMBv1 RCE", score: 9.8, type: "RCE", description: "SMBv1 RCE"})
CREATE (cve_smb_config:Vulnerability {cve: "CVE-2023-0001", name: "SMB Misconfiguration", score: 7.5, type: "Config", description: "SMB Misconfiguration"});

// Create Groups
CREATE (rh_group:Group {name: "RH", description: "Ressources Humaines", privilegeLevel: "low"})
CREATE (dev_group:Group {name: "DEV", description: "Developers", privilegeLevel: "medium"})
CREATE (admins_group:Group {name: "ADMINS", description: "Domain Administrators", privilegeLevel: "high"})
CREATE (security_group:Group {name: "SECURITY", description: "Security Team", privilegeLevel: "low"})
CREATE (finance_group:Group {name: "FINANCE", description: "Finance Team", privilegeLevel: "low"});

// Create Resources
CREATE (res_clients:Resource {name: "Base clients", sensitivity: "high", data_type: "Customer"})
CREATE (res_rh:Resource {name: "Données RH", sensitivity: "high", data_type: "HR"})
CREATE (res_ad:Resource {name: "Active Directory", sensitivity: "critical", data_type: "System"})
CREATE (res_sauvegardes:Resource {name: "Sauvegardes", sensitivity: "critical", data_type: "Backup"})
CREATE (res_secrets:Resource {name: "Secrets applicatifs", sensitivity: "critical", data_type: "Credentials"});

// User workstation usages
MATCH (u:User {name: "ALICE"}), (m:Machine {name: "PC-ALICE"}) CREATE (u)-[:USES]->(m);
MATCH (u:User {name: "BOB"}), (m:Machine {name: "PC-BOB"}) CREATE (u)-[:USES]->(m);

// User member of group (explicitly matched by name to avoid cartesian products)
MATCH (u:User {name: "ALICE"}), (g:Group {name: "RH"}) CREATE (u)-[:MEMBER_OF]->(g);
MATCH (u:User {name: "BOB"}), (g:Group {name: "DEV"}) CREATE (u)-[:MEMBER_OF]->(g);
MATCH (u:User {name: "CHARLIE"}), (g:Group {name: "ADMINS"}) CREATE (u)-[:MEMBER_OF]->(g);
MATCH (u:User {name: "DIANA"}), (g:Group {name: "SECURITY"}) CREATE (u)-[:MEMBER_OF]->(g);
MATCH (u:User {name: "EVE"}), (g:Group {name: "RH"}) CREATE (u)-[:MEMBER_OF]->(g);
MATCH (u:User {name: "CAROL"}), (g:Group {name: "FINANCE"}) CREATE (u)-[:MEMBER_OF]->(g);
MATCH (u:User {name: "DAVID"}), (g:Group {name: "DEV"}) CREATE (u)-[:MEMBER_OF]->(g);

// Admin relationships
MATCH (u:User {name: "ALICE"}), (m:Machine {name: "SRV-WEB"}) CREATE (u)-[:ADMIN_OF]->(m);
MATCH (u:User {name: "BOB"}), (m:Machine {name: "SRV-DB"}) CREATE (u)-[:ADMIN_OF]->(m);
MATCH (u:User {name: "CHARLIE"}), (m:Machine {name: "DC-01"}) CREATE (u)-[:ADMIN_OF]->(m);
MATCH (u:User {name: "CHARLIE"}), (m:Machine {name: "NAS-BACKUP"}) CREATE (u)-[:ADMIN_OF]->(m);

// Machine connectivity
MATCH (a:Machine {name: "PC-ALICE"}), (b:Machine {name: "SRV-WEB"}) CREATE (a)-[:CONNECTED_TO]->(b);
MATCH (a:Machine {name: "PC-BOB"}), (b:Machine {name: "SRV-WEB"}) CREATE (a)-[:CONNECTED_TO]->(b);
MATCH (a:Machine {name: "SRV-WEB"}), (b:Machine {name: "SRV-DB"}) CREATE (a)-[:CONNECTED_TO]->(b);
MATCH (a:Machine {name: "SRV-DB"}), (b:Machine {name: "DC-01"}) CREATE (a)-[:CONNECTED_TO]->(b);
MATCH (a:Machine {name: "SRV-DB"}), (b:Machine {name: "NAS-BACKUP"}) CREATE (a)-[:CONNECTED_TO]->(b);
MATCH (a:Machine {name: "PC-ALICE"}), (b:Machine {name: "PC-BOB"}) CREATE (a)-[:CONNECTED_TO]->(b);

// Service exposures
MATCH (m:Machine {name: "SRV-WEB"}), (s:Service {name: "HTTP"}) CREATE (m)-[:EXPOSES]->(s);
MATCH (m:Machine {name: "SRV-WEB"}), (s:Service {name: "HTTPS"}) CREATE (m)-[:EXPOSES]->(s);
MATCH (m:Machine {name: "SRV-DB"}), (s:Service {name: "MySQL"}) CREATE (m)-[:EXPOSES]->(s);
MATCH (m:Machine {name: "DC-01"}), (s:Service {name: "SMB"}) CREATE (m)-[:EXPOSES]->(s);
MATCH (m:Machine {name: "DC-01"}), (s:Service {name: "LDAP"}) CREATE (m)-[:EXPOSES]->(s);
MATCH (m:Machine {name: "PC-BOB"}), (s:Service {name: "RDP"}) CREATE (m)-[:EXPOSES]->(s);
MATCH (m:Machine {name: "SRV-DB"}), (s:Service {name: "SSH"}) CREATE (m)-[:EXPOSES]->(s);

// Vulnerabilities
MATCH (m:Machine {name: "SRV-WEB"}), (v:Vulnerability {cve: "CVE-2021-44228"}) CREATE (m)-[:HAS_VULNERABILITY]->(v);
MATCH (m:Machine {name: "SRV-WEB"}), (v:Vulnerability {cve: "CVE-2022-22965"}) CREATE (m)-[:HAS_VULNERABILITY]->(v);
MATCH (m:Machine {name: "PC-BOB"}), (v:Vulnerability {cve: "CVE-2019-0708"}) CREATE (m)-[:HAS_VULNERABILITY]->(v);
MATCH (m:Machine {name: "DC-01"}), (v:Vulnerability {cve: "CVE-2020-1472"}) CREATE (m)-[:HAS_VULNERABILITY]->(v);
MATCH (m:Machine {name: "NAS-BACKUP"}), (v:Vulnerability {cve: "CVE-2023-0001"}) CREATE (m)-[:HAS_VULNERABILITY]->(v);

// Group access permissions
MATCH (g:Group {name: "RH"}), (m:Machine {name: "SRV-WEB"}) CREATE (g)-[:HAS_ACCESS_TO]->(m);
MATCH (g:Group {name: "DEV"}), (m:Machine {name: "SRV-DB"}) CREATE (g)-[:HAS_ACCESS_TO]->(m);
MATCH (g:Group {name: "ADMINS"}), (m:Machine {name: "DC-01"}) CREATE (g)-[:HAS_ACCESS_TO]->(m);
MATCH (g:Group {name: "ADMINS"}), (m:Machine {name: "NAS-BACKUP"}) CREATE (g)-[:HAS_ACCESS_TO]->(m);

// Resource hosting
MATCH (m:Machine {name: "SRV-DB"}), (r:Resource {name: "Base clients"}) CREATE (m)-[:HOSTS]->(r);
MATCH (m:Machine {name: "SRV-DB"}), (r:Resource {name: "Secrets applicatifs"}) CREATE (m)-[:HOSTS]->(r);
MATCH (m:Machine {name: "DC-01"}), (r:Resource {name: "Active Directory"}) CREATE (m)-[:HOSTS]->(r);
MATCH (m:Machine {name: "NAS-BACKUP"}), (r:Resource {name: "Sauvegardes"}) CREATE (m)-[:HOSTS]->(r);
MATCH (m:Machine {name: "SRV-DB"}), (r:Resource {name: "Données RH"}) CREATE (m)-[:HOSTS]->(r);

// Return status
RETURN "Graph initialized successfully" as status;
