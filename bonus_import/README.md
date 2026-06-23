# 🚀 Bonus — Import de données CSV et Script Python pour Neo4j

Ce dossier contient une solution complète pour importer la cartographie du système d'information de **CyberCorp** directement depuis des fichiers CSV dans Neo4j à l'aide d'un script Python.

## 📂 Contenu du dossier

* **`nodes.csv`** : Contient la définition de tous les nœuds (utilisateurs, machines, services, vulnérabilités, groupes, ressources) avec leurs étiquettes (labels) et attributs respectifs.
* **`relationships.csv`** : Contient la définition de toutes les relations connectant les nœuds entre eux.
* **`import_to_neo4j.py`** : Script Python robuste utilisant le pilote officiel `neo4j` pour lire les fichiers CSV, vider la base de données et importer l'infrastructure de CyberCorp.

## 🔧 Prérequis

1. **Python 3.x** installé sur votre système.
2. **Neo4j** en cours d'exécution (local ou sur Docker).
3. Installer le pilote Neo4j pour Python :
   ```bash
   pip install -r requirements.txt
   ```

## 🚀 Utilisation

1. Assurez-vous que votre base de données Neo4j est démarrée.
2. Configurez les variables d'environnement suivantes si votre configuration diffère des valeurs par défaut :
   * `NEO4J_URI` (Défaut : `bolt://localhost:7687`)
   * `NEO4J_USER` (Défaut : `neo4j`)
   * `NEO4J_PASSWORD` (Défaut : `password123`)

   *Exemple en PowerShell (Windows) :*
   ```powershell
   $env:NEO4J_PASSWORD="votre_mot_de_passe"
   python import_to_neo4j.py
   ```

   *Exemple sous Linux/macOS :*
   ```bash
   NEO4J_PASSWORD="votre_mot_de_passe" python import_to_neo4j.py
   ```

3. Le script effectuera les opérations suivantes :
   * Connexion et validation de la connectivité avec l'instance Neo4j.
   * Suppression complète des données existantes (`MATCH (n) DETACH DELETE n`).
   * Lecture de `nodes.csv` et création dynamique de tous les nœuds typés avec leurs propriétés.
   * Lecture de `relationships.csv` et création des connexions associées.
