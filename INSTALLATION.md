# Guide d'Installation - CyberCorp Attack Path Mapping

## 📋 Table des Matières

1. [Prérequis système](#prérequis-système)
2. [Installation pas à pas](#installation-pas-à-pas)
3. [Vérification de l'installation](#vérification-de-linstallation)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis système

### Minimum requis

| Composant | Version | Raison |
|-----------|---------|--------|
| Docker Desktop | 4.x+ | Orchestration conteneurs |
| RAM disponible | 4 GB | Neo4j + Backend + Frontend |
| Espace disque | 2 GB | Images Docker + volumes |
| Ports | 3000, 5000, 7474, 7687 | Services en écoute |

### Vérifier Docker

```bash
docker --version
docker compose version

# Résultat attendu
Docker version 20.10+
Docker Compose version 2.x+
```

---

## 📦 Installation pas à pas

### Étape 1 : Cloner/télécharger le projet

```bash
# Si vous avez git
git clone <url-repo> no_sql_projet
cd no_sql_projet

# Sinon, télécharger le ZIP et extraire
unzip no_sql_projet.zip
cd no_sql_projet
```

### Étape 2 : Vérifier l'arborescence

```bash
# Vous devez avoir cette structure
no_sql_projet/
├── docker-compose.yml
├── setup_graph.cypher
├── readme.md
├── .env
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── .env
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    └── pages/

# Vérifier avec
ls -la *.yml && ls -la backend/ && ls -la frontend/
```

### Étape 3 : Lancer Docker Compose

```bash
# Position: répertoire no_sql_projet

# Construire et lancer les conteneurs
docker compose up --build

# Logs attendus (attendre 30-60 secondes)
neo4j_1      | Starting Neo4j...
backend_1    | npm start
frontend_1   | npm run dev
init_db_1    | Graph initialized successfully

# CTRL+C pour arrêter (containers continuent)
# ou -d pour mode daemon
docker compose up --build -d
```

### Étape 4 : Vérifier les services

```bash
# Dans un autre terminal, vérifier les conteneurs

docker ps

# Vous devez voir 4 conteneurs
CONTAINER ID   IMAGE                    NAMES
xxx            no_sql_projet-neo4j      neo4j_1
xxx            no_sql_projet-backend    backend_1
xxx            no_sql_projet-frontend   frontend_1
xxx            no_sql_projet-init_db    init_db_1
```

### Étape 5 : Accéder aux services

```bash
# Frontend (Dashboard)
http://localhost:3000

# Backend API (Healthcheck)
curl http://localhost:5000/health
# Réponse: {"status":"ok"}

# Neo4j Browser (Cypher queries)
http://localhost:7474
# Login: neo4j / password123
```

---

## ✅ Vérification de l'installation

### Test 1 : Frontend accessible

```bash
curl -s http://localhost:3000 | grep -i cybercorp
# Doit retourner du HTML contenant "CyberCorp"
```

### Test 2 : Backend responding

```bash
curl -s http://localhost:5000/api/stats | jq .
# Doit retourner JSON avec machines, users, vulnerabilities, resources
```

### Test 3 : Neo4j connecté

```bash
# Via Neo4j Browser
http://localhost:7474
# Exécuter: MATCH (n) RETURN count(n)
# Résultat: count(n) = 29

# Ou via CLI
docker exec -it no_sql_projet-neo4j cypher-shell -u neo4j -p password123 "MATCH (n) RETURN count(n)"
```

### Test 4 : Graphe complet

```bash
# Via Neo4j Browser, exécuter
MATCH (n) 
RETURN labels(n) as type, count(*) as count
GROUP BY type

# Résultat attendu
type          | count
Machine       | 6
User          | 5
Service       | 6
Vulnerability | 5
Group         | 4
Resource      | 5
(6 rows)
```

---

## 🔍 Troubleshooting

### Problème : Ports déjà utilisés

```bash
# Vérifier quels ports sont en use
lsof -i :3000
lsof -i :5000
lsof -i :7474
lsof -i :7687

# Solutions
# 1. Arrêter les services concurrents
# 2. Modifier ports dans docker-compose.yml (6000:5000 au lieu de 5000:5000)
# 3. Utiliser un autre réseau Docker
```

### Problème : Neo4j ne démarre pas

```bash
# Logs détaillés
docker logs -f neo4j

# Solutions courantes
# 1. Augmenter timeout dans docker-compose.yml (healthcheck interval)
# 2. Vérifier RAM disponible (Neo4j besoin 2GB min)
# 3. Vérifier permissions sur volume neo4j_data/

# Nettoyer et recommencer
docker compose down -v
docker compose up --build
```

### Problème : Backend ne peut pas se connecter à Neo4j

```bash
# Logs backend
docker logs -f backend

# Vérifier connectivité
docker exec backend ping neo4j

# Si "Destination Host Unreachable", vérifier docker network
docker network ls
docker network inspect no_sql_projet_default

# Solution: rebuild
docker compose down
docker compose up --build
```

### Problème : Frontend ne charge pas le graphe

```bash
# Ouvrir DevTools (F12)
# Vérifier Console pour erreurs

# Si erreur CORS
# → Backend répond, mais origin non autorisé
# → Vérifier CORS middleware dans server.js

# Si erreur 502 / connection refused
# → Backend non accessible
# → Vérifier http://localhost:5000/health

# Solution: vérifier API_URL en env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Problème : Graphe vide

```bash
# Vérifier initialisation
docker logs init_db

# Si "failed to execute queries"
# → Neo4j n'était pas ready
# → Vérifier healthcheck réussit d'abord

# Solution manuelle
docker compose exec neo4j cypher-shell -u neo4j -p password123 < setup_graph.cypher
```

### Problème : Docker volumes persistants

```bash
# Si données corrompues
docker compose down -v          # -v supprime volumes
docker compose up --build       # Recrée tout

# Si vous velez garder Neo4j data
docker compose down             # Sans -v
docker compose up               # Remet en marche same data
```

---

## 🚀 Commandes utiles

### Arrêt complet

```bash
# Arrêter tous les containers
docker compose down

# Arrêter et supprimer volumes
docker compose down -v

# Arrêter un seul container
docker compose stop neo4j
```

### Logs en temps réel

```bash
# Tous les containers
docker compose logs -f

# Un container spécifique
docker compose logs -f neo4j
docker compose logs -f backend
docker compose logs -f frontend
```

### Accès shell dans container

```bash
# Bash Neo4j
docker compose exec neo4j bash

# Bash Backend
docker compose exec backend sh

# Cypher shell Neo4j
docker compose exec neo4j cypher-shell -u neo4j -p password123
```

### Rebuild spécifique

```bash
# Rebuild un service
docker compose up --build neo4j
docker compose up --build backend
docker compose up --build frontend
```

---

## 📝 Variables d'environnement

### Backend (.env)

```env
NEO4J_URI=neo4j://neo4j:7687          # Adresse Neo4j (docker network)
NEO4J_USER=neo4j                      # Utilisateur Neo4j
NEO4J_PASSWORD=password123            # Mot de passe Neo4j
NODE_ENV=development                  # Mode dev/prod
PORT=5000                             # Port écoute Express
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000   # API du backend
```

### Docker Compose (.env)

```env
NEO4J_AUTH=neo4j/password123          # Auth Neo4j format
```

---

## ✨ Après installation réussie

1. ✅ Accéder Frontend : http://localhost:3000
2. ✅ Tester Dashboard : voir stats (6 machines, 5 users, etc.)
3. ✅ Aller à l'onglet "Analysis" : voir chemins d'attaque
4. ✅ Ouvrir Neo4j Browser : http://localhost:7474
5. ✅ Exécuter requête : `MATCH (m:Machine)-[:HAS_VULNERABILITY]->(v:Vulnerability) RETURN m.name, v.name`

---

## 📞 Besoin d'aide?

1. Vérifier **Troubleshooting** ci-dessus
2. Lire logs : `docker compose logs -f`
3. Réinitialiser : `docker compose down -v && docker compose up --build`
4. Consulter `readme.md` pour architecture

---

**Bonne installation! 🚀**
