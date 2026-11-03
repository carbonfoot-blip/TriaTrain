# SPEC-004 : Nettoyage de l'interface (suppression .ICS & lien GitHub) et Journal des Nouveautés (v1.0 & v1.1)

## 1. Contexte & Besoin Utilisateur
L'utilisateur souhaite :
1. Retirer le lien vers le dépôt GitHub (`carbonfoot-blip/TriaTrain`) en bas du site.
2. Retirer l'option d'export du calendrier (`.ics`) tant dans la barre de navigation supérieure qu'en bas de page.
3. Ajouter une icône / un bouton simple permettant d'afficher les **Nouveautés (Notes de version)** avec :
   - **Version 1.0 (15 octobre 2026)** : Explication simple des fonctionnalités de base de TriaTrain.
   - **Version 1.1 (3 novembre 2026)** : Explication des 3 nouveautés majeures :
     1. Modification de la date de départ du plan (Semaine 1 dans le passé, présent ou futur).
     2. Fonctionnalité d'export du plan (semaine) et des exercices (drills) vers la montre Garmin / COROS.
     3. Synchronisation des activités réalisées depuis la montre Garmin / COROS vers TriaTrain.

## 2. Changements Techniques
- **`src/components/WhatsNewModal.tsx`** : Nouveau composant modal présentant clairement l'historique des versions (`Version 1.1 - 3 novembre 2026` et `Version 1.0 - 15 octobre 2026`).
- **`src/components/Navbar.tsx`** : Suppression du bouton `Export .ICS` et ajout d'un bouton/icône `✨ Nouveautés (v1.1)` ouvrant la fenêtre des nouveautés.
- **`src/App.tsx`** : Suppression du bouton `Exporter mon calendrier (.ics)` et du lien GitHub dans le `footer`, remplacés par un lien discret `✨ Nouveautés • Version 1.1` ouvrant `WhatsNewModal`.

