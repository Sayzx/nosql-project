# Requêtes Cypher - CyberCorp Attack Path Mapping

## Requêtes de Création de Données

### 1. Création d'une nouvelle Machine
```cypher
CREATE (m:Machine {
  name: "SRV-API",
  type: "server",
  criticality: "high",
  os: "Linux CentOS 7"
})
RETURN m;
```

**Résultat**: Crée une nouvelle machine de type serveur API avec criticité haute.

### 2. Création d'une Vulnérabilité
```cypher
CREATE (v:Vulnerability {
  cve: "CVE-2022-21698",
  name: "Prometheus Arbitrary File Access",
  score: 8.8,
  type: "Info Disclosure"
})
RETURN v;
```

**Résultat**: Ajoute une vulnérabilité Prometheus identifiée par son CVE.

### 3. Création d'une Relation de Connexion
```cypher
MATCH (m1:Machine {name: "PC-ALICE"}), (m2:Machine {name: "SRV-API"})
CREATE (m1)-[:CONNECTED_TO]->(m2)
RETURN m1, m2;
```

**Résultat**: Établit une connexion réseau entre PC-ALICE et SRV-API.

---

## Requêtes d'Analyse

### 4. Afficher tous les nœuds du graphe
```cypher
MATCH (n)
RETURN labels(n) as type, n.name as name, count(*) as total
GROUP BY type, name
ORDER BY type;
```

**Résultat**:
```
type          | name              | total
User          | ALICE             | 1
User          | BOB               | 1
...
Machine       | PC-ALICE          | 1
Machine       | SRV-WEB           | 1
Machine       | SRV-DB            | 1
...
```

### 5. Afficher les vulnérabilités par machine
```cypher
MATCH (m:Machine)-[:HAS_VULNERABILITY]->(v:Vulnerability)
RETURN
  m.name AS machine,
  v.cve AS cve,
  v.name AS vulnerabilite,
  v.score AS score
ORDER BY v.score DESC;
```

**Résultat**:
```
machine  | cve              | vulnerabilite      | score
SRV-WEB  | CVE-2021-44228  | Log4Shell          | 10.0
DC-01    | CVE-2020-1472   | Zerologon          | 10.0
SRV-DB   | CVE-2020-14625  | MySQL Auth Bypass  | 8.5
NAS-...  | CVE-2017-0144   | SMBv1 RCE          | 9.8
...
```

### 6. Afficher les services exposés par machine
```cypher
MATCH (m:Machine)-[:EXPOSES]->(s:Service)
RETURN
  m.name AS machine,
  s.name AS service,
  s.port AS port
ORDER BY m.name;
```

**Résultat**:
```
machine  | service | port
DC-01    | LDAP    | 389
DC-01    | SMB     | 445
SRV-DB   | MySQL   | 3306
SRV-DB   | SSH     | 22
SRV-WEB  | HTTP    | 80
SRV-WEB  | HTTPS   | 443
SRV-WEB  | SSH     | 22
```

### 7. Trouver tous les chemins d'attaque depuis PC-ALICE
```cypher
MATCH path = (start:Machine {name: "PC-ALICE"})-[:CONNECTED_TO*1..5]->(target:Machine)
RETURN
  [n in nodes(path) | n.name] as path,
  target.name as target,
  target.criticality as criticality,
  length(path) - 1 as hops
ORDER BY hops ASC;
```

**Résultat**:
```
path                           | target      | criticality | hops
PC-ALICE → SRV-WEB            | SRV-WEB     | high        | 1
PC-ALICE → SRV-WEB → SRV-DB   | SRV-DB      | critical    | 2
PC-ALICE → SRV-WEB → SRV-DB → DC-01 | DC-01 | critical    | 3
```

### 8. Trouver les machines vulnérables accessibles depuis PC-ALICE
```cypher
MATCH path = (start:Machine {name: "PC-ALICE"})-[:CONNECTED_TO*1..5]->(m:Machine)-[:HAS_VULNERABILITY]->(v:Vulnerability)
RETURN
  m.name AS machine,
  v.cve AS cve,
  v.name AS vulnerabilite,
  v.score AS score,
  [node in nodes(path) | node.name] as path
ORDER BY v.score DESC;
```

**Résultat**:
```
machine | cve              | vulnerabilite    | score | path
SRV-WEB | CVE-2021-44228  | Log4Shell        | 10.0  | PC-ALICE → SRV-WEB
SRV-DB  | CVE-2020-14625  | MySQL Auth Bypass| 8.5   | PC-ALICE → SRV-WEB → SRV-DB
DC-01   | CVE-2020-1472   | Zerologon        | 10.0  | PC-ALICE → SRV-WEB → SRV-DB → DC-01
```

### 9. Trouver les ressources critiques accessibles depuis PC-ALICE
```cypher
MATCH path = (start:Machine {name: "PC-ALICE"})-[:CONNECTED_TO*1..5]->(m:Machine)-[:HOSTS]->(r:Resource)
WHERE r.sensitivity IN ["high", "critical"]
RETURN
  r.name AS ressource,
  r.sensitivity AS sensibilite,
  m.name AS machine,
  r.data_type AS type_donnees,
  [node in nodes(path) | node.name] as path
ORDER BY r.sensitivity DESC;
```

**Résultat**:
```
ressource       | sensibilite | machine | type_donnees | path
PAYROLL_DB      | critical    | SRV-DB  | Financial    | PC-ALICE → SRV-WEB → SRV-DB
CLIENTS_DB      | high        | SRV-DB  | Customer     | PC-ALICE → SRV-WEB → SRV-DB
APP_SECRETS     | critical    | SRV-WEB | Credentials  | PC-ALICE → SRV-WEB
FULL_BACKUPS    | critical    | NAS-... | System       | PC-ALICE → ... → NAS-BACKUP
```

### 10. Trouver les utilisateurs ayant accès à des machines critiques
```cypher
MATCH (u:User)-[:MEMBER_OF]->(g:Group)-[:HAS_ACCESS_TO]->(m:Machine)
WHERE m.criticality IN ["high", "critical"]
RETURN
  u.name AS utilisateur,
  u.department AS departement,
  g.name AS groupe,
  m.name AS machine,
  m.criticality AS criticite
ORDER BY m.criticality DESC;
```

**Résultat**:
```
utilisateur | departement | groupe | machine    | criticite
ALICE       | IT          | ADMINS | SRV-WEB    | high
BOB         | IT          | ADMINS | DC-01      | critical
EVE         | SECURITY    | ADMINS | DC-01      | critical
DAVID       | IT          | DEV    | SRV-DB     | critical
CAROL       | FINANCE     | FINANCE| SRV-DB     | critical
```

---

## Requêtes Bonus d'Analyse Avancée

### 11. Scoring de risque par machine
```cypher
MATCH (m:Machine)
OPTIONAL MATCH (m)-[:HAS_VULNERABILITY]->(v:Vulnerability)
OPTIONAL MATCH (m)-[:EXPOSES]->(s:Service)
RETURN
  m.name AS machine,
  m.criticality AS criticality,
  COUNT(DISTINCT v) AS vulnerabilities,
  COUNT(DISTINCT s) AS exposed_services,
  (m.criticality = "critical") * 5 +
  (m.criticality = "high") * 3 +
  (m.criticality = "low") * 1 +
  COUNT(DISTINCT v) * 2 +
  COUNT(DISTINCT s) as risk_score
ORDER BY risk_score DESC;
```

### 12. Chemins les plus courts vers ressources critiques
```cypher
MATCH path = shortestPath((start:Machine {name: "PC-ALICE"})-[:CONNECTED_TO*]->(m:Machine)-[:HOSTS]->(r:Resource {sensitivity: "critical"}))
RETURN
  [node in nodes(path) | node.name] as path,
  r.name as resource,
  length(path) - 1 as hops
ORDER BY hops ASC;
```

### 13. Analyse de surface d'attaque par groupe
```cypher
MATCH (g:Group)-[:HAS_ACCESS_TO]->(m:Machine)
RETURN
  g.name AS groupe,
  COUNT(DISTINCT m) AS machines_accessible,
  SUM(CASE WHEN m.criticality = "critical" THEN 1 ELSE 0 END) AS critical_machines,
  SUM(CASE WHEN m.criticality = "high" THEN 1 ELSE 0 END) AS high_machines
ORDER BY critical_machines DESC;
```
