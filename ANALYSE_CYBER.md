# Rapport d'Analyse Cyber - CyberCorp

## 1. Présentation du Système d'Information Modélisé

Le système d'information de CyberCorp est composé d'une infrastructure hybride associant :

- **6 machines** : postes utilisateurs (PC-ALICE, PC-BOB), serveurs applicatifs (SRV-WEB, SRV-DB), domaine (DC-01), stockage (NAS-BACKUP)
- **5 utilisateurs** : ALICE, BOB, CAROL, DAVID, EVE avec différents rôles
- **4 groupes d'accès** : ADMINS, DEV, USERS, FINANCE
- **6 services réseau** : HTTP, HTTPS, SSH, MySQL, LDAP, SMB
- **5 ressources critiques** : PAYROLL_DB, CLIENTS_DB, APP_SECRETS, FULL_BACKUPS, SECURITY_LOGS
- **5 vulnérabilités identifiées** : Log4Shell, Zerologon, MySQL Auth Bypass, SSH User Enum, SMBv1

---

## 2. Schéma du Graphe

### Structure des nœuds
```
User ──MEMBER_OF──> Group ──HAS_ACCESS_TO──> Machine
 │                                              │
 └──USES──────────────────────────────────────┘
 │                                              │
 └──ADMIN_OF────────────────────────────────────┘

Machine ──CONNECTED_TO──> Machine
   │
   ├──EXPOSES──> Service
   ├──HOSTS──> Resource
   └──HAS_VULNERABILITY──> Vulnerability
```

### Entités critiques
- **PC-ALICE** : Point de compromission initial (hypothèse phishing)
- **SRV-WEB** : Passerelle vers ressources critiques
- **SRV-DB** : Héberge données sensibles (clients, secrets)
- **DC-01** : Cœur du domaine, risque maximal
- **NAS-BACKUP** : Sauvegardes complètes du système

---

## 3. Hypothèse d'Attaque

### Scénario Initial
Un utilisateur de la société (ALICE) reçoit un email de phishing. L'attaquant gagne accès au poste PC-ALICE par exécution de code malveillant.

### Vecteur d'Attaque Primaire
Depuis PC-ALICE, l'attaquant **pivoter** vers SRV-WEB pour exploiter **Log4Shell** (CVE-2021-44228), une vulnérabilité RCE critique non patchée.

---

## 4. Chemins d'Attaque Identifiés

### Chemin 1 : Compromission de SRV-WEB
```
PC-ALICE --[CONNECTED_TO]--> SRV-WEB
```
- **Accès réseau** : ✅ Possible via connexion directe
- **Exploitation** : Log4Shell (score 10.0)
- **Résultat** : RCE, contrôle complet du serveur web
- **Durée estimée** : < 1 heure pour exploitation

### Chemin 2 : Compromission de SRV-DB
```
PC-ALICE --> SRV-WEB --[CONNECTED_TO]--> SRV-DB
```
- **Pivot depuis** : SRV-WEB compromis
- **Accès réseau** : ✅ SRV-WEB connecté à SRV-DB
- **Exploitation** : MySQL Auth Bypass (score 8.5)
- **Impact** : Accès direct aux données clients et secrets applicatifs
- **Ressources exposées** :
  - PAYROLL_DB (sensibilité CRITICAL)
  - CLIENTS_DB (sensibilité HIGH)
  - APP_SECRETS (sensibilité CRITICAL)

### Chemin 3 : Compromission du Contrôleur de Domaine
```
PC-ALICE --> SRV-WEB --> SRV-DB --[CONNECTED_TO]--> DC-01
```
- **Pivot depuis** : SRV-DB compromis
- **Accès réseau** : ✅ SRV-DB connecté à DC-01
- **Exploitation** : Zerologon (score 10.0), Auth Bypass sur LDAP
- **Impact** : Compromission complète du domaine
- **Conséquences** :
  - Contrôle de tous les utilisateurs du domaine
  - Modification des policies d'accès
  - Élévation de privilèges pour tous les comptes

### Chemin 4 : Compromission des Sauvegardes
```
PC-ALICE --> SRV-WEB --> SRV-DB --> DC-01 --[CONNECTED_TO]--> NAS-BACKUP
```
- **Pivot depuis** : DC-01 compromis
- **Exploitation** : SMBv1 RCE (score 9.8)
- **Impact** : Accès aux sauvegardes complètes (FULL_BACKUPS)
- **Conséquences** : Perte de capacité de récupération après sinistre

---

## 5. Machines Vulnérables

### Analyse de criticité et exposition

| Machine  | Criticité | Vulnérabilités | Services | Risque Global |
|----------|-----------|---|----------|---|
| PC-ALICE | LOW       | SSH Enumeration | – | Moyen (point d'origine) |
| SRV-WEB  | HIGH      | Log4Shell (RCE) | HTTP, HTTPS, SSH | **TRÈS ÉLEVÉ** |
| SRV-DB   | CRITICAL  | MySQL Auth Bypass | MySQL, SSH | **CRITIQUE** |
| DC-01    | CRITICAL  | Zerologon (RCE) | LDAP, SMB | **CRITIQUE** |
| NAS-...  | CRITICAL  | SMBv1 RCE | SMB | **CRITIQUE** |
| PC-BOB   | LOW       | Aucune détectée | – | Moyen |

### Hiérarchie de criticité
1. **SRV-WEB** : Vulnérabilité RCE non patchée = point d'entrée critique
2. **SRV-DB** : Données sensibles + vulnérabilité d'authentification = accès direct aux secrets
3. **DC-01** : Contrôle du domaine = compromission complète du SI
4. **NAS-BACKUP** : Perte capacité de récupération

---

## 6. Services Exposés

### Par machine

| Machine | Services | Ports | Criticité |
|---------|----------|-------|-----------|
| SRV-WEB | HTTP | 80 | Élevée (exposition publique) |
| SRV-WEB | HTTPS | 443 | Élevée (exposition publique) |
| SRV-WEB | SSH | 22 | Élevée (admin accès) |
| SRV-DB  | MySQL | 3306 | CRITIQUE (base données) |
| SRV-DB  | SSH | 22 | CRITIQUE (admin accès) |
| DC-01   | LDAP | 389 | CRITIQUE (annuaire) |
| DC-01   | SMB | 445 | CRITIQUE (partages) |
| NAS-... | SMB | 445 | CRITIQUE (sauvegardes) |

### Analyse de surface d'attaque
- **Services publiques exposées** : HTTP/HTTPS sur SRV-WEB = vecteur d'attaque N°1
- **Services d'administration** : SSH sur machines sensibles = risque de pivot
- **Services critiques** : LDAP, SMB sans segmentation réseau = risque très élevé

---

## 7. Utilisateurs et Groupes à Risque

### Utilisateurs avec droits admin

| Utilisateur | Groupe | Machines | Risque |
|---|---|---|---|
| ALICE | ADMINS | SRV-WEB | Très élevé (admin WEB + point origin) |
| BOB | ADMINS | SRV-DB | Très élevé (admin données + accès DC) |
| EVE | ADMINS | DC-01 | Très élevé (control domaine) |

### Groupes d'accès problématiques

1. **Groupe DEV** → Accès à SRV-DB
   - **Risque** : Groupe DEV a accès direct à données critiques (PAYROLL, CLIENTS)
   - **Justification** : Violates least privilege principle
   - **Impact** : 1 compte DEV compromis = accès aux données financières

2. **Groupe ADMINS** → Accès à DC-01 et NAS-BACKUP
   - **Risque** : Un admin compromis = domaine entièrement compromis
   - **Justification** : Pas de séparation des rôles (web admin ≠ domain admin)
   - **Impact** : Compromission complète du SI

3. **Groupe FINANCE** → Accès à SRV-DB
   - **Risque** : Accès direct aux données de paie
   - **Justification** : Pas de contrôle d'accès granulaire
   - **Impact** : Exposition de données salariales

---

## 8. Recommandations de Sécurité

### Priorité 1 : Critique (Implémenter immédiatement)

#### 8.1 Patcher les vulnérabilités RCE
```
- Log4Shell (CVE-2021-44228) sur SRV-WEB
- Zerologon (CVE-2020-1472) sur DC-01
- SMBv1 RCE (CVE-2017-0144) sur NAS-BACKUP
```
**Délai** : < 24h | **Impact** : Élimine vecteurs d'exploitation directs

#### 8.2 Isoler réseau SRV-DB
```
Segmenter SRV-DB dans un VLAN dédié :
- Seul SRV-WEB peut initier connexions MySQL
- DC-01 peut accéder à SRV-DB via LDAP seulement
- Pas d'accès direct depuis postes utilisateurs
```
**Délai** : 1 semaine | **Impact** : Bloque chemin d'attaque 2-3

#### 8.3 Implémenter MFA pour tous les admins
```
- MFA obligatoire pour ALICE, BOB, EVE
- Authentification basée sur hardware tokens (YubiKey)
- Logs d'accès admin audités
```
**Délai** : 2 semaines | **Impact** : Réduit risque d'escalade privilege

### Priorité 2 : Haute (Implémenter dans le mois)

#### 8.4 Revoir les droits du groupe DEV
```
Avant :  DEV --> SRV-DB (accès complet)
Après :  DEV --> SRV-DEV (environ test) seulement
         Accès SRV-DB via proxy/API avec audit
```
**Impact** : Isolate data sensitivity

#### 8.5 Implémenter WAF sur SRV-WEB
```
- Web Application Firewall (ModSecurity)
- IDS/IPS pour détection d'exploitation Log4Shell
- Logs centralisés et alertes
```
**Impact** : Détecte et bloque tentatives d'exploitation

#### 8.6 Désactiver SMB v1
```
- SMB v1 deprecated et vuln (CVE-2017-0144)
- Mettre à jour vers SMB v3
- Auditer tous les clients SMB
```
**Impact** : Élimine vector SMBv1 RCE

### Priorité 3 : Moyenne (Implémenter dans le trimestre)

#### 8.7 Segmentation réseau avec firewalls
```
Zone 1 (Public)     : SRV-WEB
Zone 2 (Données)    : SRV-DB, Storage
Zone 3 (Domaine)    : DC-01
Zone 4 (Utilisateurs): PC-ALICE, PC-BOB

Règles de filtrage :
- Postes utilisateurs NOT → SRV-DB (sauf via proxy)
- Postes utilisateurs NOT → DC-01
- SRV-WEB ONLY vers SRV-DB port 3306
```
**Impact** : Coupe chemins d'attaque automatiques

#### 8.8 Monitoring et détection d'anomalies
```
- SIEM centralisé (ELK/Splunk)
- Alertes sur patterns d'attaque :
  * Enumération d'utilisateurs SSH
  * Tentatives d'exploitation Log4Shell
  * Accès inhabituel à données sensibles
  * Lateral movement vers DC-01
- Réponse d'incident < 15 min
```
**Impact** : Détecte compromissions avant exfiltration

#### 8.9 Programme de patching automatisé
```
- Patch Tuesday automatisé pour systèmes non-production
- Testing en lab avant rollout production
- Hotfix process < 48h pour vulnérabilités critiques
```
**Impact** : Réduit fenêtre d'exploitation

### Priorité 4 : Amélioration continue

#### 8.10 Least Privilege & Zero Trust
```
Principes :
- Chaque utilisateur = accès minimum requis pour job
- Chaque machine = peut accéder ONLY à ressources nécessaires
- Implémenter PAM (Privileged Access Management)
- Audit mensuel des permissions
```

#### 8.11 Disaster Recovery Testing
```
- Test recovery depuis NAS-BACKUP mensuellement
- Vérifier intégrité backups (FULL_BACKUPS)
- Plan de récupération < 4h
```

#### 8.12 Sécurité applicative
```
- Code review des apps (surtout SRV-WEB)
- SAST/DAST dans pipeline CI/CD
- Dépendances régulièrement updatées
- Secrets management externalisé (HashiCorp Vault)
```

---

## 9. Cartographie des Mesures

### Avant sécurisation
```
Graphe initial avec tous chemins d'attaque ouverts:
PC-ALICE --[libre]--> SRV-WEB --[RCE Log4Shell]
                      |
                      +--> SRV-DB --[libre]--> DC-01 --[libre]--> NAS-BACKUP
```

### Après sécurisation (Phase 1)
```
PC-ALICE --[firewall]-X--> SRV-WEB --[patché Log4Shell]
                            |
                            +--> SRV-DB [VLAN isolé] --[MFA requis]--> DC-01

NAS-BACKUP [SMB v1 désactivé, patché CVE-2017-0144]
```

### Après sécurisation complète (Phase 2-3)
```
PC-ALICE --[segmentation]-X--> SRV-WEB --[WAF + IDS/IPS]
                                |
                                +--> SRV-DB [proxy API + audit]
                                     [Least Privilege]

DC-01 --[Zero Trust]--> NAS-BACKUP
[MFA + PAM] [Monitoring continu]
```

---

## 10. Conclusion

### État actuel : RISQUE TRÈS ÉLEVÉ ⚠️

Le système d'information de CyberCorp présente une **architecture de sécurité insuffisante** avec :

1. **Vulnérabilités RCE critiques non patchées** (Log4Shell, Zerologon, SMBv1)
2. **Pas de segmentation réseau** permettant pivots directs
3. **Droits d'accès non restreints** (DEV accès SRV-DB, ADMINS accès tout)
4. **Risque de compromission complète en < 2h** via chemin PC-ALICE → SRV-WEB → SRV-DB → DC-01

### Gains attendus après implémentation des recommandations

| Mesure | Gain | Timeline |
|--------|------|----------|
| Patch RCE | Élimine exploitation directe | < 24h |
| Segmentation SRV-DB | Coupe chemin vers données | 1 semaine |
| MFA Admins | Réduit risque escalade | 2 semaines |
| Firewall + WAF | Bloque lateral movement | 1 mois |
| **État final** | **Risque RÉDUIT à MOYEN** | **3 mois** |

### Actions recommandées immédiatement
1. ✅ Patcher Log4Shell sur SRV-WEB TODAY
2. ✅ Isoler SRV-DB en VLAN séparé
3. ✅ Implémenter MFA pour admins
4. ✅ Déployer WAF sur SRV-WEB
5. ✅ Mettre en place SIEM pour monitoring

**L'investissement en sécurité aujourd'hui évite une compromission complète demain.**
