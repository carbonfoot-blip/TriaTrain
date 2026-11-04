# SPEC-007 : Ouverture Automatique sur la Semaine en Cours

## 1. Contexte & Besoin Utilisateur
Lorsqu'un programme a débuté dans le passé (par exemple la semaine passée pour la Semaine 1, ce qui place la date d'aujourd'hui en Semaine 2), TriaTrain s'ouvrait systématiquement sur la **Semaine 1** (`currentWeekIndex = 0`) au chargement initial ou après modification du profil / décalage de date.
L'utilisateur souhaite qu'à l'ouverture, TriaTrain affiche automatiquement le programme de la **semaine en cours** (celle qui contient la date du jour).

## 2. Solution Technique
1. **`getLocalTodayIso()` et `findActiveWeekIndex(plan)` dans `src/utils/planGenerator.ts`** :
   - Calcule la date locale `YYYY-MM-DD` (sans décalage UTC en soirée).
   - Cherche dans `plan.weeks` la semaine telle que `todayIso >= week.startDate && todayIso <= week.endDate` (ou `week.startDate === getMondayOfWeek(todayIso)`).
   - Retourne `0` si le plan commence dans le futur, ou `plan.weeks.length - 1` si le plan est terminé.
2. **Initialisation et synchronisation dans `src/App.tsx`** :
   - Initialise `currentWeekIndex` avec `findActiveWeekIndex(plan)` dès l'ouverture de l'application.
   - Recalcule `findActiveWeekIndex` lors de la sauvegarde du profil (`handleSaveProfile`), du décalage de la date de départ (`handleShiftPlanStartDate`) et de la restauration Cloud (`handleRestoreCloudSnapshot`).
3. **Badge « Aujourd'hui » en heure locale dans `src/components/WeekCalendar.tsx`** :
   - Utilise `getLocalTodayIso()` pour éviter le basculement au lendemain à 19h/20h (heure du Québec).

