# Guide Central des Agents IA - TriaTrain

Ce document constitue le cadre de référence impératif pour tout agent IA (Antigravity) intervenant sur le dépôt **TriaTrain**. Tout agent doit respecter scrupuleusement les consignes d'architecture, de style, le protocole de branches Git, le cycle de spécifications et les validations locales obligatoires.

---

## 1. 🏗️ Présentation & Architecture du Projet

### Rôle du projet
**TriaTrain** est une application web moderne dédiée à la planification, au suivi d'entraînement et à l'analyse de performance pour triathlètes (Natation, Cyclisme, Course à pied, Transitions, Renforcement).

### Stack Technologique
- **Frontend Core :** React 19 (ESModules, Hooks modernes).
- **Langage :** TypeScript 5+ avec typage strict activé (`tsconfig.json`).
- **Build & Bundler :** Vite 8 avec `@vitejs/plugin-react`.
- **Styles & CSS :** Tailwind CSS 3.4, PostCSS, Autoprefixer, `tailwind-merge`, `clsx`.
- **Composants & Icônes :** Lucide React (`lucide-react`), Canvas Confetti (`canvas-confetti`).

### Structure du Répertoire
```text
TriaTrain/
├── .git/                   # Répertoire Git
├── .github/                # Workflows GitHub Actions
├── AGENTS.md               # Guide central pour les agents IA (ce fichier)
├── specs/                  # Spécifications fonctionnelles et techniques
│   └── template.md         # Modèle de rédaction de spécifications
├── src/                    # Code source de l'application React
│   ├── components/         # Composants d'interface réutilisables
│   ├── types/              # Définitions TypeScript
│   ├── App.tsx             # Composant racine
│   └── main.tsx            # Point d'entrée de l'application
├── public/                 # Assets statiques
├── index.html              # Fichier HTML hôte Vite
├── tailwind.config.js      # Configuration Tailwind CSS
├── postcss.config.js       # Configuration PostCSS
├── tsconfig.json           # Configuration TypeScript
├── vite.config.ts          # Configuration Vite
└── package.json            # Dépendances et scripts de build
```

---

## 2. 🎯 Conventions de Nommage & Bonnes Pratiques

- **Composants React :** PascalCase (`WorkoutCard.tsx`, `WeeklySummary.tsx`).
- **Hooks personnalisés :** camelCase avec préfixe `use` (`useWorkoutPlanner.ts`).
- **Types & Interfaces TypeScript :** PascalCase (`Workout`, `TrainingSession`, `IntensityLevel`).
- **Typage Strict :** Ne jamais utiliser `any` sans justification exceptionnelle. Créer ou compléter les types dans les fichiers de types appropriés.
- **Tailwind CSS :** Utiliser les utilitaires de style Tailwind de manière lisible ; combiner conditionnellement les classes avec `clsx` / `twMerge`.
- **Éviter les régressions visuelles :** Concevoir chaque écran avec une approche Mobile-First garantissant une navigation irréprochable sur smartphones.

---

## 3. 🔀 Protocole Strict de Branches Git Isolées

L'agent IA doit appliquer le protocole de branches suivant sans exception :

1. **Interdiction de committer directement sur `main` :**
   Toute tâche ou modification commence par la création d'une branche dédiée.
2. **Nommage conventionnel de la branche :**
   - Nouvelle fonctionnalité : `feature/<nom-court-kebab-case>`
   - Correction de bug : `fix/<nom-court-kebab-case>`
   - Refactorisation / typage : `refactor/<nom-court-kebab-case>`
   - Documentation : `docs/<nom-court-kebab-case>`
3. **Cycle de commande :**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/nom-de-la-tache
   ```
4. **Commits atomiques :** Utiliser la convention *Conventional Commits* (`feat: ...`, `fix: ...`, `chore: ...`).
5. **Revue obligatoire du `git diff` :**
   - Avant toute proposition de fusion (`merge`), l'agent IA doit exécuter :
     ```bash
     git diff main...HEAD
     ```
   - L'agent doit **analyser et présenter clairement ce diff à l'utilisateur** afin de solliciter sa validation humaine explicite.
   - Ne jamais merger automatiquement sans accord préalable.

---

## 4. 📝 Cycle de Vie des Spécifications (`specs/`)

1. L'utilisateur formalise son besoin en dupliquant `specs/template.md` vers un nouveau fichier, par exemple `specs/SPEC-001-calcul-tss-triathlon.md`.
2. L'agent IA analyse les types TypeScript requis, les composants à créer et l'expérience utilisateur.
3. L'agent crée la branche Git dédiée, implémente les composants et styles.
4. L'agent lance le build de validation local et présente le diff.

---

## 5. 🧪 Script & Commande de Validation Locale (Obligatoire)

Sous Windows PowerShell, les scripts npm peuvent être soumis à la politique d'exécution (`ExecutionPolicy`). L'agent IA doit donc **impérativement exécuter la commande suivante via `npm.cmd`** depuis la racine du projet :

```powershell
npm.cmd run build
```

*(Cette commande exécute séquentiellement le vérificateur de types TypeScript `tsc` puis le build de production Vite `vite build`).*

### Critères de réussite :
- `tsc` ne remonte aucune erreur de typage (`Found 0 errors`).
- `vite build` compile les bundles dans `dist/` avec succès (code de sortie 0).
