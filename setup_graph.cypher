// Clear existing data
MATCH (n) DETACH DELETE n;

// Create Users
CREATE (alice:User {name: "ALICE", department: "SALES", email: "alice@cybercorp.com"})
CREATE (bob:User {name: "BOB", department: "IT", email: "bob@cybercorp.com"})
CREATE (carol:User {name: "CAROL", department: "FINANCE", email: "carol@cybercorp.com"})
CREATE (david:User {name: "DAVID", department: "IT", email: "david@cybercorp.com"})
CREATE (eve:User {name: "EVE", department: "SECURITY", email: "eve@cybercorp.com"});

// Create Machines
CREATE (pc_alice:Machine {name: "PC-ALICE", type: "workstation", criticality: "low", os: "Windows 10"})
CREATE (pc_bob:Machine {name: "PC-BOB", type: "workstation", criticality: "low", os: "Windows 10"})
CREATE (srv_web:Machine {name: "SRV-WEB", type: "server", criticality: "high", os: "Linux Ubuntu 20.04"})
CREATE (srv_db:Machine {name: "SRV-DB", type: "server", criticality: "critical", os: "Linux Ubuntu 20.04"})
CREATE (dc_01:Machine {name: "DC-01", type: "domain_controller", criticality: "critical", os: "Windows Server 2019"})
CREATE (nas_backup:Machine {name: "NAS-BACKUP", type: "storage", criticality: "critical", os: "NAS OS"});

// Create Services
CREATE (http_service:Service {name: "HTTP", port: 80, protocol: "TCP"})
CREATE (https_service:Service {name: "HTTPS", port: 443, protocol: "TCP"})
CREATE (ssh_service:Service {name: "SSH", port: 22, protocol: "TCP"})
CREATE (mysql_service:Service {name: "MySQL", port: 3306, protocol: "TCP"})
CREATE (ldap_service:Service {name: "LDAP", port: 389, protocol: "TCP"})
CREATE (smb_service:Service {name: "SMB", port: 445, protocol: "TCP"});

// Create Vulnerabilities
CREATE (cve_log4shell:Vulnerability {cve: "CVE-2021-44228", name: "Log4Shell", score: 10.0, type: "RCE"})
CREATE (cve_zerologon:Vulnerability {cve: "CVE-2020-1472", name: "Zerologon", score: 10.0, type: "Auth Bypass"})
CREATE (cve_mysql:Vulnerability {cve: "CVE-2020-14625", name: "MySQL Auth Bypass", score: 8.5, type: "Auth Bypass"})
CREATE (cve_ssh:Vulnerability {cve: "CVE-2018-15473", name: "SSH Username Enumeration", score: 5.3, type: "Info Disclosure"})
CREATE (cve_smbv1:Vulnerability {cve: "CVE-2017-0144", name: "SMBv1 RCE", score: 9.8, type: "RCE"});

// Create Groups
CREATE (admins:Group {name: "ADMINS", description: "Domain Administrators", privilegeLevel: "high"})
CREATE (dev:Group {name: "DEV", description: "Developers", privilegeLevel: "medium"})
CREATE (users:Group {name: "USERS", description: "Regular Users", privilegeLevel: "low"})
CREATE (finance:Group {name: "FINANCE", description: "Finance Team", privilegeLevel: "low"});

// Create Resources
CREATE (res_payroll:Resource {name: "PAYROLL_DB", sensitivity: "critical", data_type: "Financial"})
CREATE (res_clients:Resource {name: "CLIENTS_DB", sensitivity: "high", data_type: "Customer"})
CREATE (res_secrets:Resource {name: "APP_SECRETS", sensitivity: "critical", data_type: "Credentials"})
CREATE (res_backups:Resource {name: "FULL_BACKUPS", sensitivity: "critical", data_type: "System"})
CREATE (res_logs:Resource {name: "SECURITY_LOGS", sensitivity: "high", data_type: "Audit"});

// User relationships
MATCH (alice:User), (admins:Group) CREATE (alice)-[:MEMBER_OF]->(admins);
MATCH (bob:User), (admins:Group) CREATE (bob)-[:MEMBER_OF]->(admins);
MATCH (carol:User), (finance:Group) CREATE (carol)-[:MEMBER_OF]->(finance);
MATCH (david:User), (dev:Group) CREATE (david)-[:MEMBER_OF]->(dev);
MATCH (eve:User), (admins:Group) CREATE (eve)-[:MEMBER_OF]->(admins);

// Admin relationships
MATCH (alice:User {name: "ALICE"}), (pc_alice:Machine {name: "PC-ALICE"}) CREATE (alice)-[:USES]->(pc_alice);
MATCH (bob:User {name: "BOB"}), (pc_bob:Machine {name: "PC-BOB"}) CREATE (bob)-[:USES]->(pc_bob);
MATCH (alice:User {name: "ALICE"}), (srv_web:Machine {name: "SRV-WEB"}) CREATE (alice)-[:ADMIN_OF]->(srv_web);
MATCH (bob:User {name: "BOB"}), (srv_db:Machine {name: "SRV-DB"}) CREATE (bob)-[:ADMIN_OF]->(srv_db);
MATCH (eve:User {name: "EVE"}), (dc_01:Machine {name: "DC-01"}) CREATE (eve)-[:ADMIN_OF]->(dc_01);

// Machine connectivity
MATCH (pc_alice:Machine {name: "PC-ALICE"}), (srv_web:Machine {name: "SRV-WEB"}) CREATE (pc_alice)-[:CONNECTED_TO]->(srv_web);
MATCH (srv_web:Machine {name: "SRV-WEB"}), (srv_db:Machine {name: "SRV-DB"}) CREATE (srv_web)-[:CONNECTED_TO]->(srv_db);
MATCH (srv_db:Machine {name: "SRV-DB"}), (dc_01:Machine {name: "DC-01"}) CREATE (srv_db)-[:CONNECTED_TO]->(dc_01);
MATCH (dc_01:Machine {name: "DC-01"}), (nas_backup:Machine {name: "NAS-BACKUP"}) CREATE (dc_01)-[:CONNECTED_TO]->(nas_backup);
MATCH (pc_bob:Machine {name: "PC-BOB"}), (srv_web:Machine {name: "SRV-WEB"}) CREATE (pc_bob)-[:CONNECTED_TO]->(srv_web);
MATCH (pc_alice:Machine {name: "PC-ALICE"}), (pc_bob:Machine {name: "PC-BOB"}) CREATE (pc_alice)-[:CONNECTED_TO]->(pc_bob);

// Service exposures
MATCH (srv_web:Machine {name: "SRV-WEB"}), (http_service:Service {name: "HTTP"}) CREATE (srv_web)-[:EXPOSES]->(http_service);
MATCH (srv_web:Machine {name: "SRV-WEB"}), (https_service:Service {name: "HTTPS"}) CREATE (srv_web)-[:EXPOSES]->(https_service);
MATCH (srv_db:Machine {name: "SRV-DB"}), (mysql_service:Service {name: "MySQL"}) CREATE (srv_db)-[:EXPOSES]->(mysql_service);
MATCH (dc_01:Machine {name: "DC-01"}), (ldap_service:Service {name: "LDAP"}) CREATE (dc_01)-[:EXPOSES]->(ldap_service);
MATCH (dc_01:Machine {name: "DC-01"}), (smb_service:Service {name: "SMB"}) CREATE (dc_01)-[:EXPOSES]->(smb_service);
MATCH (srv_db:Machine {name: "SRV-DB"}), (ssh_service:Service {name: "SSH"}) CREATE (srv_db)-[:EXPOSES]->(ssh_service);

// Vulnerabilities
MATCH (srv_web:Machine {name: "SRV-WEB"}), (cve_log4shell:Vulnerability) CREATE (srv_web)-[:HAS_VULNERABILITY]->(cve_log4shell);
MATCH (dc_01:Machine {name: "DC-01"}), (cve_zerologon:Vulnerability) CREATE (dc_01)-[:HAS_VULNERABILITY]->(cve_zerologon);
MATCH (srv_db:Machine {name: "SRV-DB"}), (cve_mysql:Vulnerability) CREATE (srv_db)-[:HAS_VULNERABILITY]->(cve_mysql);
MATCH (srv_web:Machine {name: "SRV-WEB"}), (cve_ssh:Vulnerability) CREATE (srv_web)-[:HAS_VULNERABILITY]->(cve_ssh);
MATCH (nas_backup:Machine {name: "NAS-BACKUP"}), (cve_smbv1:Vulnerability) CREATE (nas_backup)-[:HAS_VULNERABILITY]->(cve_smbv1);

// Resources hosting
MATCH (srv_db:Machine), (res_payroll:Resource) CREATE (srv_db)-[:HOSTS]->(res_payroll);
MATCH (srv_db:Machine), (res_clients:Resource) CREATE (srv_db)-[:HOSTS]->(res_clients);
MATCH (srv_web:Machine), (res_secrets:Resource) CREATE (srv_web)-[:HOSTS]->(res_secrets);
MATCH (nas_backup:Machine), (res_backups:Resource) CREATE (nas_backup)-[:HOSTS]->(res_backups);
MATCH (dc_01:Machine), (res_logs:Resource) CREATE (dc_01)-[:HOSTS]->(res_logs);

// Group access
MATCH (dev:Group), (srv_db:Machine) CREATE (dev)-[:HAS_ACCESS_TO]->(srv_db);
MATCH (admins:Group), (dc_01:Machine) CREATE (admins)-[:HAS_ACCESS_TO]->(dc_01);
MATCH (admins:Group), (nas_backup:Machine) CREATE (admins)-[:HAS_ACCESS_TO]->(nas_backup);
MATCH (users:Group), (srv_web:Machine) CREATE (users)-[:HAS_ACCESS_TO]->(srv_web);
MATCH (finance:Group), (srv_db:Machine) CREATE (finance)-[:HAS_ACCESS_TO]->(srv_db);

// Return summary
RETURN "Graph initialized successfully" as status;
