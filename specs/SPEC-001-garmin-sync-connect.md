# SPEC-001 : Connexion Montre Garmin via Pont API (Intervals.icu & Strava)

> **Spécification fonctionnelle et technique pour TriaTrain**

---

## 📌 Métadonnées
- **ID de la Spécification :** SPEC-001
- **Statut :** `En cours`
- **Auteur :** Félix-Antoine Legault
- **Date de création :** 2026-11-02
- **Branche Git cible :** `feature/garmin-sync-connect`

---

## 1. 🎯 Contexte & Objectif
- **Pourquoi cette évolution ?** Permettre aux triathlètes utilisant une montre Garmin (Forerunner, Fenix, Epix, Swim, Edge) de récupérer automatiquement les résultats réels de leurs sorties (durée, distance, allure/vitesse moyenne, fréquence cardiaque moy/max, puissance moyenne/normalisée, cadence, dénivelé, TSS, calories) dans TriaTrain sans nécessiter de serveur backend propriétaire.
- **Utilisateur cible :** Triathlète, coureur, cycliste ou nageur équipé d'une montre Garmin.
- **Bénéfice attendu :** Synchronisation en 1 clic des séances réalisées, appariement intelligent avec les séances planifiées du programme hebdomadaire, et comparaison visuelle *Prévu vs Réalisé*.

---

## 2. 🔍 Périmètre (Scope)

### ✅ Ce qui est inclus (In-Scope)
- **Types TypeScript (`src/types/triathlon.ts`) :**
  - `GarminActivityMetrics` : métriques complètes d'une sortie enregistrée par la montre.
  - `GarminBridgeConfig` : configuration persistée (fournisseur `intervals_icu`, `strava` ou `demo`, identifiants API).
  - Enrichissement de `Workout` avec `garminActivity?: GarminActivityMetrics`.
- **Service de synchronisation (`src/utils/garminBridge.ts`) :**
  - Connecteur REST **Intervals.icu** (`https://intervals.icu/api/v1/athlete/{id}/activities`) en HTTP Basic Auth (`API_KEY`), 100 % compatible CORS navigateur.
  - Connecteur REST **Strava API v3** (`https://www.strava.com/api/v3/athlete/activities`) avec support du rafraîchissement automatique OAuth2 (`refresh_token`) ou jeton d'accès direct.
  - Générateur **Mode Démo Garmin** permettant de tester immédiatement l'appariement sur la semaine courante.
  - Algorithme de correspondance automatique (Date + Discipline : Natation, Vélo, Course, Brique, PPG) et calcul de l'allure/vitesse réelle.
- **Composant `src/components/GarminSyncModal.tsx` :**
  - Interface de configuration guidée pas-à-pas (Intervals.icu, Strava, Démo).
  - Liste des activités récupérées de la montre avec proposition d'association automatique aux séances TriaTrain de la semaine.
  - Synchronisation groupée en 1 clic ou association individuelle.
- **Mise à jour des composants existants :**
  - `WorkoutModal.tsx` : Affichage détaillé de la carte « Résultats Montre Garmin (Prévu vs Réalisé) », liaison rapide d'une sortie Garmin et édition manuelle des métriques réalisées.
  - `WeekCalendar.tsx` & `Dashboard.tsx` & `Navbar.tsx` : Bouton « ⌚ Sync Garmin », badges d'activité synchronisée et indicateurs de performance réelle.

### ❌ Ce qui est exclu (Out-of-Scope)
- Serveur backend Python externe obligatoire (l'architecture reste 100 % autonome côté client).

---

## 3. 📋 Spécifications Fonctionnelles & Expérience Utilisateur

### 3.1 Description des composants et interactions
1. Depuis la barre de navigation ou le tableau de bord, l'athlète clique sur **« ⌚ Sync Garmin »**.
2. Il configure son pont gratuit (**Intervals.icu** avec ID Athlète + Clé API, ou **Strava** avec Client ID/Secret/Refresh Token, ou **Mode Simulation Garmin**).
3. En cliquant sur **« Récupérer mes sorties Garmin »**, TriaTrain interroge l'API et affiche les sorties trouvées sur la période de la semaine active (ou des 14 derniers jours).
4. Chaque activité Garmin est automatiquement associée à la séance planifiée correspondante (même jour / même discipline, ou séance la plus proche dans la semaine).
5. En validant, les séances TriaTrain passent au statut `completed` avec toutes les métriques Garmin attachées et visibles dans la carte du calendrier et dans la modale de détail.

### 3.2 Modèles de données & Typage TypeScript
- `GarminSyncProvider = 'intervals_icu' | 'strava' | 'demo'`
- `GarminActivityMetrics` stocké dans `Workout.garminActivity` et persisté dans `localStorage`.

---

## 4. ✅ Critères d'Acceptation
- [x] Rendu fluide et interactif sans erreurs React dans la console.
- [x] Validation stricte TypeScript sans erreurs.
- [x] `npm.cmd run build` s'exécute avec succès (code de retour 0).
