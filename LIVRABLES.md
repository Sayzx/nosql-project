# 📦 Détails des Livrables - Projet CyberCorp

Ce document détaille l'implémentation technique et les composants livrés pour le projet de cartographie des chemins d'attaque.

## 1. Modélisation des Données (Graphe Neo4j)

L'intégralité du système d'information a été modélisée sous forme de graphe pour permettre des requêtes de portée variable (variable-length paths).

### 🧮 Inventaire des Entités (Nœuds)
| Label | Description | Propriétés Clés |
| :--- | :--- | :--- |
| `User` | Utilisateurs du domaine | `name`, `role`, `department` |
| `Machine` | Actifs réseau (PC, Serveurs) | `name`, `type`, `criticality` |
| `Service` | Services applicatifs | `name`, `port` |
| `Vulnerability` | Failles de sécurité | `cve`, `name`, `score` (CVSS) |
| `Group` | Groupes de privilèges | `name` |
| `Resource` | Actifs critiques | `name`, `sensitivity` |

### 🔗 Matrice des Relations
| Relation | Source $\rightarrow$ Cible | Signification |
| :--- | :--- | :--- |
| `USES` | `User` $\rightarrow$ `Machine` | L'utilisateur se connecte à la machine |
| `MEMBER_OF` | `User` $\rightarrow$ `Group` | Appartenance à un groupe de droits |
| `ADMIN_OF` | `User` $\rightarrow$ `Machine` | Droits d'administration complète |
| `HAS_ACCESS_TO` | `Group` $\rightarrow$ `Machine` | Accès autorisé pour le groupe |
| `CONNECTED_TO` | `Machine` $\rightarrow$ `Machine` | Connectivité réseau (Flux autorisé) |
| `EXPOSES` | `Machine` $\rightarrow$ `Service` | Service disponible sur le réseau |
| `HAS_VULNERABILITY` | `Machine` $\rightarrow$ `Vulnerability` | Machine affectée par une CVE |
| `HOSTS` | `Machine` $\rightarrow$ `Resource` | La machine contient la donnée critique |

---

## 2. Implémentation Logicielle

### 🟢 Backend (Node.js & Express)
L'API a été conç up pour isoler la logique Cypher du frontend.
- **Services de Graphe** : Implémentation de `graphService.js` pour gérer les calculs de chemins.
- **Endpoints** : 
  - `/api/graph` : Récupération complète de la topologie.
  - `/api/attack-paths` : Recherche de chemins optimisés via Cypher.
  - `/api/vulnerable-machines` : Identification des points d'entrée.
  - `/api/stats` : Agrégation des données de risque.

### 🔵 Frontend (Next.js 14 & React)
L'interface utilisateur a été optimisée pour la performance et l'expérience utilisateur (UX).
- **Visualisation** : Intégration de `react-force-graph-2d` pour un rendu fluide des nœuds.
- **Dynamic Import** : Gestion du SSR (Server Side Rendering) pour éviter les crashs liés à l'objet `window`.
- **Interactivité** : Système de clic pour simuler la compromission et calculer le rayon d'impact (Blast Radius).
- **Filtrage Contextuel** : Capacité de focaliser la vue sur un utilisateur ou une machine spécifique pour éliminer le bruit visuel.

---

## 3. Analyse de Sécurité & Preuves (PoC)

Le projet inclut des preuves de concept (PoC) via des requêtes Cypher permettant de répondre aux questions suivantes :
- *"Quelles machines sont accessibles depuis le poste d'Alice ?"*
- *"Existe-t-il un chemin entre un utilisateur non privilégié et la base de données de paie ?"*
- *"Quel serveur, s'il est compromis, offre le plus grand rayon d'impact sur le réseau ?"*

---

## 4. Guide d'Installation (Résumé)

Le déploiement est entièrement automatisé via Docker :
1. `docker compose up -d --build`
2. Initialisation automatique de la DB via `init_db.sh` et `setup_graph.cypher`.
3. Accès immédiat sur le port `3000`.
