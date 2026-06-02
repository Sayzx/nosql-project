# 🚀 DÉMARREZ ICI

## Bienvenue dans le projet CyberCorp Attack Path Mapping!

Vous avez un projet **complet et prêt à lancer** en 5 minutes.

---

## 📖 Par où commencer?

### Option 1: Je veux juste lancer et voir (2 minutes)

```bash
docker compose up --build -d
# Puis ouvrir http://localhost:3000
```

Voir: **QUICKSTART.md**

---

### Option 2: Je veux comprendre tout le projet (30 minutes)

Lire dans cet ordre:

1. **RESUME_PROJET.txt** ← Vue d'ensemble exécutive (5 min)
2. **readme.md** ← Architecture complète (10 min)
3. **QUERIES.md** ← Requêtes Cypher avec résultats (8 min)
4. **ANALYSE_CYBER.md** ← Rapport sécurité approfondi (10 min)
5. **INSTALLATION.md** ← Détails techniques + troubleshooting (5 min)

---

### Option 3: Je rencontre un problème (5 minutes)

1. Voir **INSTALLATION.md** section "Troubleshooting"
2. Lancer: `docker compose logs -f`
3. Vérifier ports disponibles: `lsof -i :3000`

---

## ✅ Qu'est-ce qui est inclus?

### Documentation (30 KB)
- ✅ Architecture complète (readme.md)
- ✅ 13+ requêtes Cypher commentées (QUERIES.md)
- ✅ Rapport d'analyse cyber 20 pages (ANALYSE_CYBER.md)
- ✅ Installation + troubleshooting (INSTALLATION.md)
- ✅ Lancer en 5 min (QUICKSTART.md)
- ✅ Détail livrables (LIVRABLES.md)

### Code Production
- ✅ Docker Compose (4 services prêts)
- ✅ Neo4j 5.15 (graphe avec 29 nœuds)
- ✅ Backend Node.js/Express (8 API endpoints)
- ✅ Frontend Next.js/React (3-tab dashboard)

### Données
- ✅ 6 types de nœuds (User, Machine, Service, Vulnerability, Group, Resource)
- ✅ 8 types de relations (40+ instances)
- ✅ 4 chemins d'attaque identifiés
- ✅ 12+ recommandations sécurité

---

## 🚀 Lancer maintenant

### Prérequis (30 secondes)

Vérifier Docker installé:
```bash
docker --version    # Doit retourner 20.10+
docker compose --version  # Doit retourner 2.x+
```

### Lancer (2-3 minutes)

```bash
# Position-vous dans le répertoire du projet
cd nosql-project

# Démarrer tous les services
docker compose up --build -d

# Attendre le message "ready"
sleep 30
docker compose ps

# Vérifier Neo4j
curl http://localhost:5000/api/stats | jq .
```

### Accéder (immédiat)

| Quoi | Où | Accès |
|------|-----|-------|
| 🖥️ Dashboard | http://localhost:3000 | Ouvert |
| 🗄️ Neo4j Browser | http://localhost:7474 | neo4j/password123 |
| 🔌 API Stats | http://localhost:5000/api/stats | JSON |

---

## 📊 Qu'est-ce que je vais voir?

### Dashboard (http://localhost:3000)

**Tab 1 - Dashboard**
- 6 Machines
- 5 Users
- 5 Vulnerabilities  
- 5 Resources

**Tab 2 - Graph**
- Liste toutes machines
- Code couleur criticité

**Tab 3 - Analysis**
- 4 chemins d'attaque depuis PC-ALICE
- 5 machines vulnérables accessibles
- 3 ressources critiques exposées

### Neo4j Browser (http://localhost:7474)

Exécuter cette requête:
```cypher
MATCH path = (start:Machine {name: "PC-ALICE"})-[:CONNECTED_TO*1..5]->(target:Machine)
RETURN [n in nodes(path) | n.name] as path, target.criticality
```

Résultat: 4 chemins d'attaque (SRV-WEB → SRV-DB → DC-01 → NAS-BACKUP)

---

## 🎯 Points clés à retenir

### Architecture
- 🐳 Docker Compose : 4 services (Neo4j, Backend, Frontend, Init-DB)
- 🗄️ Neo4j 5.15 : Base graphe (29 nœuds, 40+ relations)
- 🔧 Backend : Node.js/Express (8 API endpoints)
- 🎨 Frontend : Next.js/React (dashboard 3 tabs)

### Graphe
- **6 types nœuds** : User, Machine, Service, Vulnerability, Group, Resource
- **8 types relations** : USES, MEMBER_OF, ADMIN_OF, HAS_ACCESS_TO, CONNECTED_TO, EXPOSES, HAS_VULNERABILITY, HOSTS
- **29 nœuds au total** : Seedés automatiquement via setup_graph.cypher

### Sécurité
- **4 chemins d'attaque** identifiés depuis PC-ALICE
- **Risque TRÈS ÉLEVÉ** (< 2h pour compromission complète)
- **12+ recommandations** organisées par priorité

### Bonus
- ✅ Dashboard interactif
- ✅ 13+ requêtes Cypher commentées
- ✅ Rapport cyber 20 pages
- ✅ Installation one-command

---

## 📚 Documentation structurée

Tous les fichiers sont numérotés pour une lecture logique:

| # | Fichier | Type | Durée | Contenu |
|---|---------|------|-------|---------|
| 1 | RESUME_PROJET.txt | Texte | 5 min | Vue d'ensemble |
| 2 | readme.md | Markdown | 10 min | Architecture |
| 3 | QUERIES.md | Markdown | 8 min | Requêtes Cypher |
| 4 | ANALYSE_CYBER.md | Markdown | 15 min | Rapport sécurité |
| 5 | INSTALLATION.md | Markdown | 5 min | Déploiement |
| 6 | LIVRABLES.md | Markdown | 10 min | Détails livrables |
| 7 | QUICKSTART.md | Markdown | 2 min | Démarrage rapide |

**Total : 55 min pour tout lire.**

---

## ❓ Questions fréquentes

**Q: J'ai une erreur "port already in use"**
A: Un autre service utilise le port 3000/5000/7474/7687. Voir INSTALLATION.md "Troubleshooting"

**Q: Le graphe ne charge pas dans le dashboard**
A: Attendre 30 secondes après `docker compose up`. Le graphe se seed automatiquement.

**Q: Comment ajouter une nouvelle machine?**
A: Via Neo4j Browser (http://localhost:7474): `CREATE (m:Machine {...})`

**Q: Où sont stockées les données?**
A: Dans le volume `neo4j_data` (persiste après `docker compose down`)

**Q: Comment arrêter proprement?**
A: `docker compose down` (sans `-v` si vous voulez garder les données)

---

## 🎓 Pour votre présentation

**Si vous devez présenter ce projet:**

1. **Accueil (2 min)** : Montrer RESUME_PROJET.txt
2. **Architecture (3 min)** : Lancer `docker compose up --build`, ouvrir http://localhost:3000
3. **Graphe (2 min)** : Aller à l'onglet Graph, montrer machines
4. **Chemins d'attaque (3 min)** : Onglet Analysis, montrer 4 chemins
5. **Sécurité (5 min)** : Résumer recommandations priorité 1 depuis ANALYSE_CYBER.md
6. **Demo requête (2 min)** : Neo4j Browser, exécuter requête chemin d'attaque

**Total présentation : 15-20 minutes**

---

## 🎁 Ce qui fait la différence

- ✅ **One-command deployment** : `docker compose up --build` = tout fonctionne
- ✅ **Dashboard temps réel** : Frontend React connecté au graphe
- ✅ **Analyse complète** : 4 chemins + 12 recommandations
- ✅ **Production-ready** : Dockerfile + volumes + healthchecks
- ✅ **Documentation** : 30KB, 2441 lignes code/doc

---

## 🚀 Prêt à commencer?

### Étape 1 (maintenant)
```bash
docker compose up --build -d
```

### Étape 2 (dans 30 secondes)
```bash
open http://localhost:3000
```

### Étape 3 (optionnel)
Lire RESUME_PROJET.txt pour comprendre ce que vous voyez.

---

## ✨ Support

Si vous avez des questions:

1. **Général** → Lire readme.md
2. **Installation** → INSTALLATION.md
3. **Requêtes** → QUERIES.md
4. **Sécurité** → ANALYSE_CYBER.md
5. **Rapide** → QUICKSTART.md

---

**Le projet est complet. Bon courage! 🎓**

_(Créé en Juin 2026 pour CyberCorp Neo4j Project)_
