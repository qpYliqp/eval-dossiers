# Documentation MonMasterUB

## Table des Matières

- [Introduction](#introduction)
- [Installation](#installation)
- [Premiers Pas](#premiers-pas)
- [Fonctionnalités Clés](#fonctionnalités-clés)
  - [Espaces de Programmes de Master](#espaces-de-programmes-de-master)
  - [Téléchargement et Gestion de Fichiers](#téléchargement-et-gestion-de-fichiers)
  - [Mappage de Données](#mappage-de-données)
  - [Validation des Candidats](#validation-des-candidats)
  - [Mises à Jour des Données](#mises-à-jour-des-données)
- [Guide Utilisateur](#guide-utilisateur)
  - [Gestion des Programmes de Master](#gestion-des-programmes-de-master)
  - [Téléchargement de Fichiers](#téléchargement-de-fichiers)
  - [Création de Mappages de Données](#création-de-mappages-de-données)
  - [Validation des Candidats](#validation-des-candidats-1)
  - [Mise à Jour des Informations des Candidats](#mise-à-jour-des-informations-des-candidats)
- [Résolution de Problèmes](#résolution-de-problèmes)
- [Questions Fréquemment Posées (FAQ)](#questions-fréquemment-posées-faq)
- [Glossaire](#glossaire)

## Introduction

MonMasterUB est une application web complète conçue pour simplifier la gestion des programmes de master, les évaluations des étudiants et les processus de vérification des données pour les établissements d'enseignement. Cette application permet aux administrateurs et aux examinateurs de créer et gérer des espaces de programmes de master, de télécharger des fichiers d'évaluation, de mapper des champs de données entre différents formats de fichiers, de valider les informations des candidats et de mettre à jour efficacement les dossiers des étudiants.

Le système aide à combler le fossé entre les données spécifiques à l'université (fichiers PV) et les formats standardisés MonMaster, rendant les processus d'évaluation plus efficaces et précis.

## Installation

### Utilisation de Docker (Recommandé)

1. Assurez-vous que Docker et Docker Compose sont installés sur votre système
2. Clonez le dépôt :
   ```bash
   git clone https://gitlab.emi.u-bordeaux.fr/pfe2025/evaldossiers.git
   cd evaldossiers
   ```
3. Démarrez l'application en utilisant Docker Compose :
   ```bash
   docker-compose up --build
   ```
4. Accédez à l'application à l'adresse `http://localhost:4200`

## Premiers Pas

Après l'installation, suivez ces étapes pour commencer à utiliser MonMasterUB :

1. **Accéder à l'Application** : Ouvrez votre navigateur web et accédez à `http://localhost:4200`
2. **Créer un Espace de Programme de Master** : Cliquez sur "Ajouter un espace" pour créer votre premier espace de programme
3. **Télécharger des Fichiers** : Sélectionnez votre programme de master nouvellement créé et téléchargez les fichiers MonMaster et PV pertinents
4. **Mapper les Champs de Données** : Créez des mappages entre les champs de données MonMaster et les champs de données spécifiques à l'université
5. **Valider les Candidats** : Traitez et validez les informations des candidats
6. **Réviser et Mettre à Jour les Données** : Effectuez les mises à jour nécessaires aux informations des candidats

## Fonctionnalités Clés

### Espaces de Programmes de Master

La fonctionnalité des Espaces de Programmes de Master vous permet de créer et de gérer différents espaces de programmes pour les divers masters proposés par votre établissement.

**Capacités clés :**
- Créer de nouveaux espaces de programmes de master
- Gérer les programmes de master existants
- Ajouter des examinateurs aux programmes de master
- Consulter les détails et les statistiques des programmes

### Téléchargement et Gestion de Fichiers

Cette fonctionnalité vous permet de télécharger et de gérer différents types de fichiers associés à vos programmes de master, principalement les fichiers MonMaster et PV (spécifiques à l'université).

**Types de fichiers pris en charge :**
- Fichiers au format MonMaster
- Fichiers PV (Procès-Verbal) universitaires
- Divers formats de documents (XLSX, XML, PDF, etc.)

### Mappage de Données

La fonctionnalité de Mappage de Données vous permet de créer des correspondances entre les formats standardisés MonMaster et les formats de données spécifiques à votre établissement (fichiers PV).

**Avantages :**
- Créer des mappages de champs un à un
- Standardiser les données provenant de différentes sources
- Enregistrer les configurations de mappage pour une réutilisation ultérieure
- Réduire les erreurs de saisie manuelle des données

### Validation des Candidats

La fonctionnalité de Validation des Candidats vous aide à vérifier et à valider les informations des candidats à travers différentes sources de données.

**Niveaux de validation :**
- Entièrement vérifié : Toutes les informations du candidat correspondent entre les sources
- Partiellement vérifié : Certaines informations correspondent, mais des divergences existent
- Impossible à vérifier : Informations insuffisantes pour valider le candidat
- Fraude potentielle : Divergences significatives nécessitant une enquête

### Mises à Jour des Données

Cette fonctionnalité vous permet de visualiser et de mettre à jour les informations des candidats selon les besoins.

**Capacités de mise à jour :**
- Informations personnelles (nom, coordonnées)
- Dossiers académiques
- Notes et évaluations
- Documentation justificative

## Guide Utilisateur

### Gestion des Programmes de Master

#### Création d'un Nouveau Programme de Master
1. Depuis le tableau de bord principal, cliquez sur "Ajouter un espace"
2. Remplissez les informations requises :
   - Nom du Master (par exemple, "Master Informatique")
   - Unité Académique (par exemple, "UF Informatique")
3. Cliquez sur "Soumettre" pour créer le programme de master

#### Ajout d'Examinateurs (à venir)
1. Sélectionnez un programme de master depuis le tableau de bord
2. Cliquez sur "Voir les examinateurs" pour voir les examinateurs actuels
3. Cliquez sur "Ajouter un examinateur" pour ajouter un nouvel examinateur
4. Sélectionnez l'examinateur dans la liste déroulante
5. Cliquez sur "Soumettre" pour ajouter l'examinateur

#### Gestion des Programmes de Master
- **Modifier** : Cliquez sur l'icône de modification sur la carte d'un programme de master pour modifier ses détails
- **Supprimer** : Cliquez sur l'icône de suppression pour retirer un programme de master (confirmation requise)
- **Naviguer** : Utilisez le menu contextuel (trois points) pour accéder aux fonctionnalités spécifiques :
  - Système de Fichiers : Gérer les fichiers pour ce programme de master
  - Système de Mappage : Créer et gérer les mappages de données
  - Vérification des Données : Valider les informations des candidats

### Téléchargement de Fichiers

1. Accédez à la section Fichiers pour un programme de master spécifique
2. Choisissez le type de fichier que vous souhaitez télécharger (MonMaster ou PV)
3. Glissez-déposez votre fichier ou cliquez pour parcourir
4. Remplissez les métadonnées requises :
   - Nom de l'Université
   - Unité Académique
   - Année Académique
   - Session (si applicable)
5. Cliquez sur "Télécharger" pour traiter le fichier

### Création de Mappages de Données

1. Accédez à la section Mappage pour un programme de master spécifique
2. Si aucun fichier n'est sélectionné, choisissez les fichiers MonMaster et PV pertinents
3. Une fois les fichiers chargés, vous verrez trois panneaux :
   - Champs MonMaster (gauche)
   - Mappages actuels (centre)
   - Champs PV (droite)
4. Pour créer un nouveau mappage :
   - Cliquez sur "Ajouter un mapping"
   - Sélectionnez un champ dans la liste MonMaster
   - Sélectionnez un champ correspondant dans la liste PV
   - Cliquez sur "Enregistrer" pour sauvegarder le mappage
5. Pour supprimer un mappage, cliquez sur l'icône de suppression à côté de ce mappage

### Validation des Candidats

1. Accédez à la section Validation pour un programme de master spécifique
2. Cliquez sur "Commencer la validation" pour démarrer le processus de validation
3. Le système traitera et comparera les données des candidats provenant de différentes sources
4. Une fois terminé, examinez les résultats dans le tableau :
   - Lignes vertes : Candidats entièrement vérifiés
   - Lignes jaunes : Candidats partiellement vérifiés
   - Lignes rouges : Cas de fraude potentielle
   - Lignes bleues : Impossible à vérifier (informations insuffisantes)
5. Utilisez l'option de filtre pour n'afficher que les candidats vérifiés si nécessaire
6. Pour un examen détaillé :
   - Cliquez sur le bouton "Examiner" pour voir la comparaison détaillée
   - Cliquez sur le bouton "Modifier" pour mettre à jour les informations du candidat

### Mise à Jour des Informations des Candidats

1. Accédez à la page de mise à jour d'un candidat (depuis la section Validation)
2. Vous verrez :
   - Section Informations Personnelles
   - Section Résultats Académiques
   - Section Résultats des Notes
   - Documentation justificative (visionneuse PDF)
3. Pour modifier les informations :
   - Cliquez sur un champ modifiable
   - Entrez la nouvelle valeur
   - Le système enregistre automatiquement les modifications lorsque vous cliquez en dehors du champ
4. Utilisez les contrôles de la visionneuse PDF pour :
   - Zoomer/dézoomer
   - Naviguer entre les pages
   - Télécharger ou imprimer le document

## Résolution de Problèmes

### Problèmes Courants et Solutions

#### L'Application ne se Charge pas
- Assurez-vous que les serveurs frontend et backend sont en cours d'exécution
- Vérifiez si les ports corrects (3000 pour l'API, 4200 pour le frontend) sont disponibles
- Videz le cache du navigateur et rafraîchissez la page

#### Échecs de Téléchargement de Fichiers
- Vérifiez que le fichier est dans un format pris en charge
- Vérifiez la taille du fichier (maximum 10 Mo recommandé)
- Assurez-vous que tous les champs de métadonnées requis sont remplis
- Essayez de télécharger le fichier en plus petits morceaux s'il est très volumineux

#### Problèmes de Mappage
- Assurez-vous que les fichiers MonMaster et PV sont correctement téléchargés
- Vérifiez que les en-têtes de colonne dans les fichiers sont cohérents et lisibles
- Effacez toutes les tentatives de mappage incomplètes précédentes
- Redémarrez le processus de mappage si vous rencontrez des erreurs persistantes

#### Processus de Validation Bloqué
- Le processus de validation peut prendre plusieurs minutes pour les grands ensembles de données
- Assurez-vous que le système a terminé toutes les opérations de mappage avant la validation
- Vérifiez la connectivité réseau et la réponse du serveur
- Rafraîchissez la page et redémarrez la validation si nécessaire

#### Données non mises à jour
- Vérifiez que vous disposez des autorisations nécessaires pour modifier les données
- Vérifiez si les champs sont marqués comme modifiables
- Assurez-vous que le serveur backend est en cours d'exécution et répond
- Essayez de rafraîchir la page et de tenter à nouveau la mise à jour

## Questions Fréquemment Posées (FAQ)

### Questions Générales

**Q : Qu'est-ce que MonMasterUB ?**  
R : MonMasterUB est une application web conçue pour aider les établissements d'enseignement à gérer les programmes de master, vérifier les informations des candidats et simplifier le processus d'évaluation.

### Questions Techniques

**Q : Quels navigateurs sont pris en charge ?**  
R : MonMasterUB prend en charge les versions récentes de Chrome, Firefox, Safari et Edge.

**Q : Puis-je utiliser l'application sur des appareils mobiles ?**  
R : Bien que l'application soit principalement conçue pour une utilisation sur ordinateur, elle possède des éléments de conception responsive pour une utilisation sur tablette. L'utilisation sur smartphone peut être limitée.

**Q : Comment puis-je signaler des bugs ou demander des fonctionnalités ?**  
R : Veuillez contacter l'administrateur système ou soumettre un problème via le dépôt du projet.

### Questions Spécifiques aux Fonctionnalités

**Q : Puis-je réutiliser des mappages entre différents programmes de master ?**  
R : Actuellement, les mappages sont spécifiques aux combinaisons de fichiers. Cependant, des structures de fichiers similaires vous permettront de recréer rapidement des mappages.

**Q : Que dois-je faire si un candidat est signalé comme fraude potentielle ?**  
R : Examinez attentivement les données de comparaison détaillées. Cela peut simplement indiquer une erreur de saisie de données ou une incompatibilité qui nécessite une correction.

**Q : Puis-je exporter les résultats de validation ?**  
R : Cette fonctionnalité est prévue pour une mise à jour future.

## Glossaire

**MonMaster** : Format standardisé pour la gestion des données des programmes de master

**PV (Procès-Verbal)** : Format spécifique à l'université pour l'évaluation des étudiants et la tenue des dossiers

**Mappage** : Processus de connexion des champs entre différents formats de données pour permettre la comparaison

**Validation** : Processus de vérification des informations des candidats à travers différentes sources de données

**Unité Académique** : Département, faculté ou autre division organisationnelle au sein d'un établissement d'enseignement

**Examinateur** : Personne responsable de l'examen et de l'évaluation des candidatures ou des performances des candidats

**Champ** : Un élément de données spécifique dans un fichier (par exemple, nom, note, date)

**Configuration de Mappage** : Ensemble enregistré de mappages de champs entre des types de fichiers spécifiques
