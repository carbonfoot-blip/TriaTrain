# SPEC-003 : Choix et Édition de la Date Réelle de Début du Programme (Semaine 1)

> **Spécification fonctionnelle et technique pour TriaTrain**

---

## 📌 Métadonnées
- **ID de la Spécification :** SPEC-003
- **Statut :** `En cours`
- **Auteur :** Félix-Antoine Legault
- **Date de création :** 2026-11-03
- **Branche Git cible :** `feature/custom-plan-start-date`

---

## 1. 🎯 Contexte & Objectif
- **Pourquoi cette évolution ?** Auparavant, le générateur de plan (`generateTrainingPlan`) forçait systématiquement le début de la Semaine 1 au *lundi suivant* dans le futur (`getNextMonday()`). Or, un athlète qui crée son programme aujourd'hui peut avoir déjà commencé son entraînement la semaine passée (ou il y a 2 semaines) et vouloir importer ses séances Garmin déjà réalisées sur la Semaine 1 pour suivre sa progression réelle.
- **Utilisateur cible :** Tout athlète démarrant ou ajustant son programme dans TriaTrain.
- **Bénéfice attendu :** Pouvoir choisir librement la date de début de la Semaine 1 (dans le passé, cette semaine ou dans le futur) lors de la création du programme, dans les paramètres du profil, ou directement depuis le calendrier du tableau de bord sans perdre ses séances déjà validées.

---

## 2. 🔍 Périmètre (Scope)

### ✅ Ce qui est inclus (In-Scope)
- **Modèles TypeScript (`src/types/triathlon.ts` & `src/data/defaultProfile.ts`) :**
  - Ajout de `startDate?: string` (`YYYY-MM-DD`) dans `AthleteProfile['raceObjective']` et `startDate?: string` dans `TrainingPlan`.
- **Générateur & Utilitaires de dates (`src/utils/planGenerator.ts`) :**
  - `getMondayOfWeek(dateStr?: string)` : Aligne proprement la Semaine 1 sur le lundi de la semaine choisie (puisque la grille hebdomadaire va du Lundi J1 au Dimanche J7).
  - `getStartDatePresets()` : Raccourcis rapides (*Il y a 2 semaines*, *La semaine passée*, *Cette semaine*, *Lundi prochain*).
  - `shiftTrainingPlanStartDate(plan, newStartDateStr)` : Permet de décaler toutes les dates d'un plan existant (Semaine 1..N et chaque `Workout.date`) sans écraser les séances validées ou importées de Garmin.
- **Interfaces Utilisateur :**
  - `OnboardingModal.tsx` : Sélecteur de **Date de début (Semaine 1)** + boutons raccourcis rapides (*La semaine passée*, *Cette semaine*, etc.) à l'Étape 3 et récapitulatif à l'Étape 5.
  - `ProfileSettings.tsx` : Édition de la **Date de début (Semaine 1)** et de la **Date de la Course**.
  - `Dashboard.tsx` : Bouton rapide **« 📅 Début du plan (S1) »** permettant de modifier la date de début du programme en 1 clic directement depuis le tableau de bord (en conservant les séances existantes).

---

## 3. ✅ Critères d'Acceptation
- [x] Possibilité de choisir une date passée (ex. la semaine dernière), actuelle ou future comme début de la Semaine 1.
- [x] Décalage intelligent des dates (`shiftTrainingPlanStartDate`) conservant les activités Garmin déjà associées ou séances modifiées.
- [x] `npm.cmd run build` s'exécute avec succès (0 erreur TypeScript).

