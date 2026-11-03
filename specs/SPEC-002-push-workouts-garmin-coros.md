# SPEC-002 : Envoi des Entraînements Structurés & Éducatifs (Drills) vers Garmin et COROS

> **Spécification fonctionnelle et technique pour TriaTrain**

---

## 📌 Métadonnées
- **ID de la Spécification :** SPEC-002
- **Statut :** `En cours`
- **Auteur :** Félix-Antoine Legault
- **Date de création :** 2026-11-03
- **Branche Git cible :** `feature/push-workouts-to-watch`

---

## 1. 🎯 Contexte & Objectif
- **Pourquoi cette évolution ?** Permettre à l'athlète de pousser son plan d'entraînement TriaTrain (une séance précise ou toute une semaine) vers sa montre **Garmin** ou **COROS**, afin que chaque bloc, intervalle et éducatif technique (*drill*) s'affiche directement sur l'écran de la montre au poignet avec ses cibles d'allure, de puissance (Watts) ou de fréquence cardiaque.
- **Utilisateur cible :** Triathlète, coureur, cycliste ou nageur équipé d'une montre GPS Garmin ou COROS.
- **Bénéfice attendu :** Guidage au poignet étape par étape pendant la séance (temps/distance restant, nom de l'éducatif/drill, alerte de zone cible) sans avoir à mémoriser la séance ni la programmer manuellement.

---

## 2. 🔍 Périmètre (Scope)

### ✅ Ce qui est inclus (In-Scope)
- **Modèles TypeScript (`src/types/triathlon.ts`) :**
  - `WatchStepPreview` : représentation d'un bloc ou éducatif formaté pour l'écran de la montre (titre court 28 car., consigne drill, répétitions, durée/distance, plage cible numérique Allure/Watts/FC).
  - Enrichissement de `Workout` avec `pushedToWatchAt?: string` et `externalEventId?: string`.
- **Moteur de conversion & d'export (`src/utils/workoutWatchExporter.ts`) :**
  - Traducteur intelligent des `WorkoutStep[]` en étapes structurées compatibles montres Garmin & COROS (détection automatique des séries `4x1000m`, `8x50m`, éducatifs techniques, calcul des cibles numériques selon le profil athlète).
  - Générateur de syntaxe structurée **Intervals.icu Workout Builder** et envoi sans fil (`POST /api/v1/athlete/{id}/events/bulk?upsert=true`) qui synchronise nativement le calendrier Garmin Connect et COROS Training Hub.
  - Générateur binaire de fichier **`.FIT` Workout** (standard Garmin/COROS) et de fichier **`.ZWO`** (Zwift / COROS / Home-Trainer) téléchargeables en 1 clic.
- **Interface Utilisateur :**
  - `WorkoutModal.tsx` : Nouvel onglet **« ⌚ Sur la montre (Drills) »** avec simulateur visuel d'écran de montre Garmin/COROS étape par étape, bouton d'envoi direct en 1 clic et téléchargement `.FIT` / `.ZWO`.
  - `GarminSyncModal.tsx` : Ajout de l'onglet **« 📤 Pousser vers la montre (Garmin / COROS) »** permettant d'envoyer toute la semaine active en un seul clic.
  - `WeekCalendar.tsx` : Badge `📲 Sur la montre` sur les séances déjà envoyées.

### ❌ Ce qui est exclu (Out-of-Scope)
- Dépendance à un serveur backend propriétaire (tout fonctionne directement depuis le navigateur).

---

## 3. ✅ Critères d'Acceptation
- [x] Chaque étape (`warmup`, `drill`, `interval`, `recovery`, `cooldown`) affiche clairement le nom de l'exercice/drill et la cible d'effort sur l'aperçu montre et dans les données envoyées.
- [x] Envoi unitaire (séance) et hebdomadaire (semaine complète) fonctionnel via l'API Intervals.icu (et en mode Simulation).
- [x] Export local `.FIT` et `.ZWO` fonctionnel sans erreur.
- [x] `npm.cmd run build` s'exécute avec succès (code de retour 0).
