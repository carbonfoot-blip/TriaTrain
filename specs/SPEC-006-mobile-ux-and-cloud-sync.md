# SPEC-006 : Ergonomie Mobile (iPhone), Centre de Profil Unifié & Synchronisation Cloud Multi-Appareils (Intervals.icu)

## 1. Contexte & Objectifs
1. **Lisibilité & Navigation Mobile (iPhone)** :
   - Centraliser tous les réglages (« Setup ») dans la fenêtre **Profil** divisée en 4 onglets (`🎯 Objectif & Dates`, `❤️ Physio & Allures`, `📅 Semaine Type`, `⌚ Montre & Cloud`).
   - Masquer les champs techniques de configuration (ID Athlète + Clé API Intervals.icu / Strava) dans la fenêtre `Synchroniser Garmin` une fois qu'ils sont configurés, afin d'aller droit au but (*Pousser la semaine* / *Importer les sorties*).
   - Ajouter une barre de navigation fixe en bas de l'écran sur iPhone (*Bottom Tab Bar*) et compacter les cartes de repos et de résumé sur mobile.
2. **Synchronisation Multi-Appareils (iPhone ↔ PC) via ID + Clé Intervals.icu** :
   - Permettre de sauvegarder (**Push**) et récupérer (**Pull**) l'intégralité des données TriaTrain (`profile`, `plan` complet, réglages, semaine active et tous les résultats / séances complétées jusqu'ici) directement via le compte Intervals.icu de l'athlète (`category: "NOTE"`, `external_id: "triatrain_cloud_backup_v1"`).
   - Aucun serveur tiers ni nouveau compte requis : entrer son ID + Clé API Intervals.icu sur son PC suffit à récupérer instantanément tout ce qui a été configuré et accompli sur l'iPhone.

## 2. Architecture Technique
- **`src/utils/cloudSync.ts`** :
  - Sérialisation et compression/encodage du snapshot complet `TriaTrainCloudSnapshot` (`profile`, `plan`, `currentWeekIndex`, `updatedAt`).
  - `pushStateToIntervalsCloud` : Enregistre ou met à jour l'événement `NOTE` (`external_id: "triatrain_cloud_backup_v1"`) sur `2020-01-01T00:00:00` via l'API Intervals.icu.
  - `pullStateFromIntervalsCloud` : Interroge `GET /api/v1/athlete/{id}/events?oldest=2020-01-01&newest=2020-01-02`, décode le snapshot et restaure tout l'état dans TriaTrain + `localStorage`.
- **`src/components/ProfileSettings.tsx`** :
  - Interface à 4 onglets incluant la configuration Garmin/Intervals.icu et le panneau de synchronisation Cloud (`Push` / `Pull`).
- **`src/components/GarminSyncModal.tsx`** :
  - Masquage automatique du formulaire d'API Key lorsqu'elle est déjà renseignée (remplacé par un bandeau compact `🟢 Connecté à Intervals.icu` et un bouton `Modifier dans Profil`).
- **`src/components/Navbar.tsx`, `src/components/Dashboard.tsx`, `src/components/WeekCalendar.tsx`** :
  - Barre de navigation mobile fixe en bas d'écran (`Bottom Tab Bar`), filtre mobile rapide sur la semaine et jours de repos compacts sur iPhone.
