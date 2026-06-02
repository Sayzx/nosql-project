# 🛡️ CyberCorp : Visualiseur de Chemins d'Attaque Réseau

Un outil d'analyse de cybersécurité avancé basé sur la base de données graphe **Neo4j**, conçu pour cartographier l'infrastructure d'une entreprise et simuler les mouvements latéraux d'un attaquant.

## 📖 Présentation du Projet

CyberCorp est une solution d'aide à la décision pour les architectes sécurité. Contrairement aux approches traditionnelles basées sur des tableaux, ce projet utilise la puissance des **graphes** pour modéliser un système d'information (SI) comme un ensemble d'entités interconnectées, permettant de découvrir des vecteurs d'attaque complexes invisibles dans des bases de données relationnelles.

### 🎯 Objectifs Pédagogiques & Techniques
- **Cartographie de la Surface d'Attaque** : Visualisation exhaustive des utilisateurs, machines, services et vulnérabilités.
- **Analyse de l'Accessibilité** : Identification des chemins permettant de passer d'un poste de travail non privilégié à un actif critique.
- **Simulation d'Impact en Temps Réel** : Calcul du "Rayon d'Impact" (Blast Radius) pour comprendre les conséquences de la compromission d'un seul serveur.
- **Quantification du Risque** : Corrélation entre les scores CVSS des vulnérabilités et l'accessibilité réseau.

---

## 🗺️ Guide de Navigation (Documentation)

Pour explorer le projet, suivez ce fil conducteur :

1. **[Démarrage Rapide (QUICKSTART.md)](QUICKSTART.md)** $\rightarrow$ Pour lancer l'application en 2 minutes.
2. **[Installation Détaillée (INSTALLATION.md)](INSTALLATION.md)** $\rightarrow$ Pour comprendre le déploiement Docker et la configuration.
3. **[Analyse Cybersécurité (ANALYSE_CYBER.md)](ANALYSE_CYBER.md)** $\rightarrow$ Pour voir la méthodologie d'analyse des risques.
4. **[Répertoire des Requêtes (QUERIES.md)](QUERIES.md)** $\rightarrow$ Pour consulter les requêtes Cypher utilisées pour l'extraction des données.
5. **[Détails des Livrables (LIVRABLES.md)](LIVRABLES.md)** $\rightarrow$ Pour une vue technique complète du modèle de données et des fonctionnalités.

---

## 🛠️ Architecture Technique

Le projet repose sur une architecture moderne à 3 niveaux :

- **Couche de Données** : `Neo4j` — Stocke les entités sous forme de nœuds et les dépendances sous forme d'arêtes (edges).
- **Backend** : `Node.js` / `Express` — Agit comme passerelle pour traduire les questions de sécurité en requêtes Cypher optimisées.
- **Frontend** : `Next.js 14` / `React` / `react-force-graph-2d` — Interface interactive permettant la navigation dans le graphe et le pilotage du dashboard de risques.

### 🏗️ Modèle de Données (Graphe)
Le graphe est structuré autour de 6 types de nœuds et plusieurs relations clés :

**Nœuds :** `User`, `Machine`, `Service`, `Vulnerability`, `Group`, `Resource`.
**Relations clés :** `ADMIN_OF`, `CONNECTED_TO`, `HAS_VULNERABILITY`, `HOSTS`.

---

## ✨ Fonctionnalités "Wow"

| Fonctionnalité | Description | Valeur Ajoutée |
| :--- | :--- | :--- |
| **Simulation de Compromission** | Clique sur un nœud pour simuler un hack. | Visualisation immédiate de la propagation de l'attaque. |
| **Calcul du Blast Radius** | Algorithme de parcours de graphe en temps réel. | Identifie instantanément tous les actifs à risque. |
| **Analyse Ciblée (Focus)** | Filtrage dynamique par Utilisateur ou Machine. | Élimine le "bruit" visuel pour se concentrer sur un vecteur précis. |
| **Dashboard de Risque** | Agrégation des stats de vulnérabilités et ressources critiques. | Vue synthétique de la posture de sécurité. |
| **Export de Conformité** | Export complet des analyses en JSON ou CSV. | Utile pour les audits et rapports de sécurité. |

---

## 🚦 Lancement Rapide

```bash
docker compose up -d --build
```
Accès au tableau de bord : `http://localhost:3000`

---

*Ce projet démontre l'efficacité des bases de données NoSQL Graphe pour la modélisation et l'analyse des risques en cybersécurité.*
# nosql-project
