# [ID_SPEC] : [Titre court et explicite de la fonctionnalité]

> **Fichier modèle de spécification pour l'Agent IA Antigravity**  
> Copiez ce fichier dans `specs/SPEC-XXX-<nom-court>.md` et complétez les sections ci-dessous avant de demander à l'Agent IA d'intervenir.

---

## 📌 Métadonnées
- **ID de la Spécification :** SPEC-001 *(incrémenter pour chaque nouvelle spec)*
- **Statut :** `Brouillon` | `Prêt pour développement` | `En cours` | `En revue` | `Terminé`
- **Auteur :** Félix-Antoine Legault
- **Date de création :** AAAA-MM-JJ
- **Branche Git cible :** `feature/<nom-court-kebab-case>` ou `fix/<nom-court-kebab-case>`

---

## 1. 🎯 Contexte & Objectif
- **Pourquoi cette évolution ?** Expliquez la fonctionnalité d'entraînement (Natation, Vélo, Course à pied), le calendrier ou les métriques de charge athlétique.
- **Utilisateur cible :** Athlète ou triathlète préparant une compétition.
- **Bénéfice attendu :** Meilleure planification, visualisation de la charge, suivi des séances complétées.

---

## 2. 🔍 Périmètre (Scope)

### ✅ Ce qui est inclus (In-Scope)
- Liste des composants React, hooks, utilitaires ou types TypeScript à créer ou modifier.

### ❌ Ce qui est exclu (Out-of-Scope)
- Éléments non concernés.

---

## 3. 📋 Spécifications Fonctionnelles & Expérience Utilisateur

### 3.1 Description des composants et interactions
1. L'athlète sélectionne une discipline (Natation 🏊, Vélo 🚴, Course 🏃)...
2. Le système propose ou enregistre les blocs d'entraînement avec zones d'intensité...
3. Le tableau de bord calcule le volume horaire et l'indice de charge (TSS).

### 3.2 Modèles de données & Typage TypeScript
- Types d'entraînement (`WorkoutType`, `IntensityZone`, `TrainingPlan`).
- Gestion de l'état local ou persistance (`localStorage`).

---

## 4. ✅ Critères d'Acceptation (Règles d'or pour validation)

- [ ] **Critère 1 :** Rendu fluide et interactif sans erreurs React dans la console.
- [ ] **Critère 2 :** Validation stricte TypeScript sans `any` injustifié ni avertissements de typage.
- [ ] **Critère 3 :** `npm.cmd run build` s'exécute avec succès (code de retour 0).

---

## 5. 🛠️ Contraintes Techniques, Design & Composants

- **Framework :** React 19 + TypeScript (Strict Mode).
- **Build tool :** Vite.
- **Design & UI :** Tailwind CSS avec classes utilitaires cohérentes, icônes `lucide-react`, animations discrètes (`canvas-confetti`).
- **Responsive :** Mobile First impératif (ergonomie tactile pour saisie au bord du bassin ou après une sortie vélo).

---

## 6. 🧪 Protocole de Validation & Tests Locaux

Avant de considérer la tâche comme terminée, l'Agent IA doit :
1. **Exécuter la commande de validation locale documentée dans `AGENTS.md`** :
   ```powershell
   npm.cmd run build
   ```
2. **S'assurer que la compilation TypeScript (`tsc`) et le bundling Vite réussissent sans erreur.**

---

## 7. 🔀 Protocole Git & Livraison

1. **Création de la branche isolée :**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/<nom-de-la-tache>
   ```
2. **Commits atomiques et clairs :**
   ```bash
   git commit -m "feat(calendar): ajout de la vue de planification hebdomadaire"
   ```
3. **Présentation obligatoire du `git diff` :**
   - Inspecter le diff : `git diff main...HEAD`
   - Présenter le résumé complet et les détails des modifications à l'utilisateur pour validation humaine.
