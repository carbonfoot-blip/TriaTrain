# SPEC-009 : Mémorisation du Refus d'Import Quotidien, Multi-Entraînements par Jour & Vue Semaine Sommaire (Style IRONMAN)

## 1. Contexte & Besoin Utilisateur
1. **Ne plus redemander l'import la même journée si refusé (`Non / Pas d'entraînement aujourd'hui`)** :
   - Si l'utilisateur indique au premier chargement de la journée qu'il ne souhaite pas importer de séance (ou qu'il ne s'entraînera pas aujourd'hui), mémoriser ce choix pour la date du jour (`triatrain_dismissed_import_date = YYYY-MM-DD`) afin de ne plus réafficher la fenêtre d'import aux ouvertures suivantes de la même journée.
2. **Plusieurs entraînements dans la même journée (Doublés : ex. Poids + Course, Vélo + Nage)** :
   - Permettre d'avoir 2 (ou plusieurs) entraînements la même journée :
     - Dans la **Semaine Type** (`ProfileSettings` / `WeeklyScheduleModal`), permettre d'associer un **2e sport optionnel (`secondarySport`)** à chaque jour (ex. `Course` + `Poids / PPG`, `Vélo` + `Nage`).
     - Directement sur chaque journée du calendrier (`WeekCalendar`), permettre d'**ajouter un 2e entraînement** en choisissant le sport (`Poids / PPG`, `Course`, `Vélo`, `Natation`, `Brique`) et un modèle du catalogue, ou en **combinant** une séance déplacée d'un autre jour sur la même journée.
3. **Refonte UI du Dashboard & Calendrier Hebdomadaire en Mode Sommaire (inspiré du visuel IRONMAN)** :
   - **En-tête Objectif & Semaine ultra-compact** en haut du Dashboard (avec tiroir dépliable sur demande pour les détails de l'objectif et le changement de date S1), évitant d'avoir à scroller pour voir les entraînements.
   - **Liste des 7 jours en mode Sommaire (style IRONMAN)** : chaque jour affiche sur une ligne épurée le jour, le résumé des séances et les **badges colorés de sports** (`NAGE`, `POIDS`, `VÉLO`, `COURSE`, `REPOS`).
   - **Journée actuelle mise en évidence et ouverte par défaut** : la journée d'aujourd'hui est surlignée et dépliée automatiquement ; un clic sur n'importe quelle autre journée déplie ses séances détaillées en accordéon.
   - **Barre récapitulative `TOTAUX DE LA SEMAINE`** en bas de la liste (`Nage • Vélo • Course • Poids/PPG • Total heures & km`).

