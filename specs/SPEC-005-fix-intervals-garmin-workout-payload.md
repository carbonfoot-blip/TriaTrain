# SPEC-005 : Correction du format d'entraînement structuré Intervals.icu & Garmin Connect

## 1. Diagnostic du Problème Observé
Lors de l'envoi d'une séance depuis TriaTrain vers Intervals.icu (puis Garmin Connect), deux problèmes apparaissaient :
1. **Durée et distance aberrantes (`17h5m / 1025 min` et `170 km`)** :
   - Dans la syntaxe du Workout Builder d'Intervals.icu, l'unité `m` signifie **minutes** (et non *mètres*, qui s'écrit obligatoirement `mtr` ou `km`).
   - Le titre de l'étape (`4 x 1000m @ Seuil (4:30/km) — Régularité métronome R=1'45`) était injecté tel quel avant `20m Z4 Pace`. Le parseur d'Intervals.icu interprétait `1000m` dans le texte comme **1000 minutes (`16h40`)**, ce qui donnait `15m + 1000m + 10m = 1025 min (17h05)` !
2. **Cibles `(null-null for 0km)` et section `Steps` vide dans Garmin Connect** :
   - L'envoi de cibles abstraites `Z2 Pace` / `Z4 Pace` échoue (`null-null for 0km`) si l'athlète n'a pas préalablement configuré sa `threshold_pace` et ses `pace_zones` dans les paramètres `Settings -> Run / Swim` d'Intervals.icu, et entrait en collision avec les allures déjà présentes dans le texte libre (`5:29/km`, `4:30/km`).
   - Lorsque les cibles valent `null-null`, Garmin Connect rejette la génération des étapes (`Steps`).

## 2. Correctifs Implémentés (`src/utils/workoutWatchExporter.ts`)
1. **Assainissement strict des libellés d'étapes (`sanitizeStepLabelForIntervals`)** :
   - Suppression de tous les chiffres, unités (`1000m`, `15 min`, `200m`), allures (`4:30/km`), répétitions (`4 x`) et notations de récupération (`R=1'45`) dans le libellé textuel précédant la durée de l'étape.
2. **Utilisation de `mtr` pour les mètres et de vrais blocs de répétition (`Nx`)** :
   - Toute distance en mètres utilise désormais `mtr` (`1000mtr`, `400mtr`, `100mtr`).
   - Les séries fractionnées (`4 x 1000m R=1'45`, `8 x 30s/30s`, `4 x 6 min R=2'`) sont compilées en vrais blocs de répétition multi-lignes (`4x` suivi de l'étape d'effort et de l'étape de récupération) pour que Garmin Connect affiche nativement la boucle `Repeat 4x` dans `Steps`.
3. **Cibles numériques explicites (ordre lent -> rapide pour les allures) & Auto-calibration `sport-settings`** :
   - Envoi des plages d'allures explicites au format officiel `[Allure lente]-[Allure rapide]/km Pace` (ex. `4:36-4:24/km Pace`), watts explicites (`150-180w`) et synchronisation automatique des seuils de l'athlète (`threshold_pace` en `m/s`, `pace_zones`, `ftp`, `lthr`, `max_hr`) via `PUT /api/v1/athlete/{id}/sport-settings/{Run|Ride|Swim}`.
   - Suppression des champs `moving_time` et `distance` redondants dans le payload `/events/bulk` afin de laisser Intervals.icu calculer la durée et la distance exactes depuis les étapes structurées.

