import React, { useState, useEffect } from 'react';
import {
  AthleteProfile,
  GarminActivityMetrics,
  TrainingPlan,
  TrainingWeek,
  Workout,
  WorkoutStatus,
  WeeklyDayPreference,
} from './types/triathlon';
import { DEFAULT_ATHLETE_PROFILE } from './data/defaultProfile';
import {
  WorkoutTemplate,
  instantiateWorkoutFromTemplate,
} from './data/workoutCatalog';
import {
  generateTrainingPlan,
  regeneratePlanPreservingCompletedWorkouts,
  shiftTrainingPlanStartDate,
  getMondayOfWeek,
  findActiveWeekIndexForToday,
} from './utils/planGenerator';
import { shouldTriggerMondayMorningAnalysis } from './utils/trainingAnalyzer';
import { loadGarminConfig } from './utils/garminBridge';
import {
  pushStateToIntervalsCloud,
  TriaTrainCloudSnapshot,
} from './utils/cloudSync';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { PlanOverview } from './components/PlanOverview';
import { ZonesCenter } from './components/ZonesCenter';
import { BeginnerToolkit } from './components/BeginnerToolkit';
import { WorkoutModal } from './components/WorkoutModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileSettings, ProfileTabSection } from './components/ProfileSettings';
import { WeeklyScheduleModal } from './components/WeeklyScheduleModal';
import { GarminSyncModal } from './components/GarminSyncModal';
import { WeeklyCoachAnalysisModal } from './components/WeeklyCoachAnalysisModal';
import { WhatsNewModal } from './components/WhatsNewModal';
import { Sparkles, Cloud, Brain } from 'lucide-react';

function getLocalTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Recalcule les totaux hebdomadaires (durée, distance, répartition par sport) d'une semaine
 */
function recomputeWeekTotals(week: TrainingWeek, workouts: Workout[]): TrainingWeek {
  let totalDur = 0;
  let totalDist = 0;
  let swimMin = 0;
  let bikeMin = 0;
  let runMin = 0;
  let strengthMin = 0;

  workouts.forEach((wo) => {
    if (wo.sport === 'rest') return;
    totalDur += wo.durationMinutes;
    totalDist += wo.distanceMeters / 1000;
    if (wo.sport === 'swim') swimMin += wo.durationMinutes;
    else if (wo.sport === 'bike') bikeMin += wo.durationMinutes;
    else if (wo.sport === 'run') runMin += wo.durationMinutes;
    else if (wo.sport === 'brick') {
      bikeMin += Math.round(wo.durationMinutes * 0.75);
      runMin += Math.round(wo.durationMinutes * 0.25);
    } else if (wo.sport === 'strength') strengthMin += wo.durationMinutes;
  });

  return {
    ...week,
    workouts,
    totalDurationMinutes: totalDur,
    totalDistanceKm: Math.round(totalDist * 10) / 10,
    sportBreakdown: {
      swimMinutes: swimMin,
      bikeMinutes: bikeMin,
      runMinutes: runMin,
      strengthMinutes: strengthMin,
    },
  };
}

/**
 * Détermine automatiquement l'index de la semaine correspondant à la date d'aujourd'hui
 * (ex: si Semaine 1 a commencé la semaine passée, retourne l'index 1 = Semaine 2).
 */
function resolveCurrentWeekIndex(targetPlan: TrainingPlan): number {
  if (!targetPlan || !Array.isArray(targetPlan.weeks) || targetPlan.weeks.length === 0) {
    return 0;
  }
  const todayIso = getLocalTodayIso();
  const todayMonday = getMondayOfWeek(todayIso);

  const exactIdx = targetPlan.weeks.findIndex(
    (w) =>
      w.startDate === todayMonday ||
      (todayIso >= w.startDate && todayIso <= w.endDate)
  );
  if (exactIdx >= 0) {
    return exactIdx;
  }

  const lastWeek = targetPlan.weeks[targetPlan.weeks.length - 1];
  if (lastWeek && todayIso > lastWeek.endDate) {
    return targetPlan.weeks.length - 1;
  }

  return findActiveWeekIndexForToday(targetPlan);
}

export const App: React.FC = () => {
  // 1. Profile State
  const [profile, setProfile] = useState<AthleteProfile>(() => {
    try {
      const saved = localStorage.getItem('triatrain_athlete_profile');
      return saved ? JSON.parse(saved) : DEFAULT_ATHLETE_PROFILE;
    } catch {
      return DEFAULT_ATHLETE_PROFILE;
    }
  });

  // 2. Training Plan State
  const [plan, setPlan] = useState<TrainingPlan>(() => {
    try {
      const saved = localStorage.getItem('triatrain_training_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return generateTrainingPlan(DEFAULT_ATHLETE_PROFILE);
  });

  // 3. UI Navigation State (ouvre automatiquement sur la semaine en cours !)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plan' | 'zones' | 'toolkit'>(
    'dashboard'
  );
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(() =>
    resolveCurrentWeekIndex(plan)
  );
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileInitialSection, setProfileInitialSection] =
    useState<ProfileTabSection>('objective');
  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState<boolean>(false);
  const [isGarminSyncOpen, setIsGarminSyncOpen] = useState<boolean>(false);
  const [isStartupImportPrompt, setIsStartupImportPrompt] = useState<boolean>(false);
  const [isCoachAnalysisOpen, setIsCoachAnalysisOpen] = useState<boolean>(false);
  const [isMondayCoachAutoPrompt, setIsMondayCoachAutoPrompt] = useState<boolean>(false);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState<boolean>(false);

  // Check if first visit to prompt onboarding, OR if user has a plan + Intervals.icu configured,
  // does not already have an imported/completed workout today, AND has not already dismissed
  // the prompt earlier today (`triatrain_dismissed_import_date === todayIso`).
  // Also triggers the Monday AM Coach Analysis automatically when appropriate.
  useEffect(() => {
    const hasVisited = localStorage.getItem('triatrain_visited');
    const savedPlanStr = localStorage.getItem('triatrain_training_plan');

    if (!hasVisited && !savedPlanStr) {
      setIsOnboardingOpen(true);
      localStorage.setItem('triatrain_visited', 'true');
      return;
    }

    const todayIso = getLocalTodayIso();
    const alreadyDismissedToday =
      localStorage.getItem('triatrain_dismissed_import_date') === todayIso;

    const hasActivePlan = Boolean(plan && Array.isArray(plan.weeks) && plan.weeks.length > 0);
    const garminCfg = loadGarminConfig();
    const hasIntervalsConfigured =
      garminCfg.provider === 'intervals_icu' && garminCfg.intervalsApiKey.trim().length > 0;

    // Vérifie s'il y a déjà une entrée (import Garmin/Intervals.icu ou séance complétée) aujourd'hui
    const alreadyHasEntryToday =
      hasActivePlan &&
      plan.weeks.some((w) =>
        w.workouts.some(
          (wo) =>
            wo.sport !== 'rest' &&
            ((wo.date === todayIso && (Boolean(wo.garminActivity) || wo.status === 'completed')) ||
              wo.garminActivity?.startDateLocal === todayIso)
        )
      );

    if (
      hasActivePlan &&
      hasIntervalsConfigured &&
      !alreadyHasEntryToday &&
      !alreadyDismissedToday
    ) {
      setIsStartupImportPrompt(true);
      setIsGarminSyncOpen(true);
    } else if (hasActivePlan && shouldTriggerMondayMorningAnalysis(plan)) {
      setIsMondayCoachAutoPrompt(true);
      setIsCoachAnalysisOpen(true);
    }
  }, []);

  // Silent background Cloud Push helper when Intervals.icu API Key is configured
  const triggerBackgroundCloudPush = (
    nextProfile: AthleteProfile,
    nextPlan: TrainingPlan,
    nextWeekIdx: number
  ) => {
    try {
      const cfg = loadGarminConfig();
      if (cfg.provider === 'intervals_icu' && cfg.intervalsApiKey.trim().length > 0) {
        pushStateToIntervalsCloud(cfg, nextProfile, nextPlan, nextWeekIdx).catch(() => {
          // non-blocking background sync
        });
      }
    } catch {
      // ignore
    }
  };

  // Restore full snapshot (Profile + Plan + Results + WeekIndex) from Cloud or JSON backup
  const handleRestoreCloudSnapshot = (snapshot: TriaTrainCloudSnapshot) => {
    if (!snapshot || !snapshot.profile || !snapshot.plan) return;
    setProfile(snapshot.profile);
    setPlan(snapshot.plan);
    const activeWeekIdx = resolveCurrentWeekIndex(snapshot.plan);
    setCurrentWeekIndex(activeWeekIdx);

    try {
      localStorage.setItem('triatrain_athlete_profile', JSON.stringify(snapshot.profile));
      localStorage.setItem('triatrain_training_plan', JSON.stringify(snapshot.plan));
      localStorage.setItem('triatrain_visited', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Save to localStorage when profile or Semaine Type changes — PRESERVING 100% of completed/imported workouts!
  const handleSaveProfile = (newProfile: AthleteProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('triatrain_athlete_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error(e);
    }
    // Regenerate plan with new profile & paces while preserving completed/imported workouts
    const newPlan = regeneratePlanPreservingCompletedWorkouts(newProfile, plan);
    setPlan(newPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(newPlan));
    } catch (e) {
      console.error(e);
    }
    const activeWeekIdx = resolveCurrentWeekIndex(newPlan);
    setCurrentWeekIndex(activeWeekIdx);
    triggerBackgroundCloudPush(newProfile, newPlan, activeWeekIdx);
  };

  // Update a single workout (completion, RPE, notes)
  const handleUpdateWorkout = (updatedWorkout: Workout) => {
    const updatedWeeks = plan.weeks.map((week) => {
      if (week.weekNumber !== updatedWorkout.weekNumber) return week;
      const nextWorkouts = week.workouts.map((w) =>
        w.id === updatedWorkout.id ? updatedWorkout : w
      );
      return recomputeWeekTotals(week, nextWorkouts);
    });

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }

    if (selectedWorkout && selectedWorkout.id === updatedWorkout.id) {
      setSelectedWorkout(updatedWorkout);
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // Quick toggle completion status directly from card
  const handleToggleWorkoutStatus = (workoutId: string, currentStatus: WorkoutStatus) => {
    const nextStatus: WorkoutStatus =
      currentStatus === 'completed' ? 'planned' : 'completed';
    const updatedWeeks = plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((w) => {
        if (w.id === workoutId) {
          return {
            ...w,
            status: nextStatus,
            completedRpe:
              nextStatus === 'completed'
                ? w.completedRpe || w.intensityRpe || 6
                : undefined,
          };
        }
        return w;
      }),
    }));

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // 4. Swap or Move Workouts between days in the current week (supports multi-workout days!)
  const handleSwapWorkouts = (
    workoutId: string,
    targetDay: number,
    mode: 'swap' | 'move'
  ) => {
    const currentWeek = plan.weeks[currentWeekIndex];
    if (!currentWeek) return;

    const sourceWo = currentWeek.workouts.find((w) => w.id === workoutId);
    if (!sourceWo) return;
    const sourceDay = sourceWo.dayOfWeek;
    if (sourceDay === targetDay) return;

    const addDaysToStart = (days: number) => {
      const d = new Date(`${currentWeek.startDate}T12:00:00`);
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
    };

    const targetDate = addDaysToStart(targetDay - 1);
    const sourceDate = addDaysToStart(sourceDay - 1);

    let updatedWorkouts = [...currentWeek.workouts];

    if (mode === 'swap') {
      const targetWorkouts = updatedWorkouts.filter((w) => w.dayOfWeek === targetDay);
      if (targetWorkouts.length > 0) {
        updatedWorkouts = updatedWorkouts.map((w) => {
          if (w.id === workoutId) {
            return { ...w, dayOfWeek: targetDay, date: targetDate };
          }
          if (w.dayOfWeek === targetDay) {
            return { ...w, dayOfWeek: sourceDay, date: sourceDate };
          }
          return w;
        });
      } else {
        updatedWorkouts = updatedWorkouts.map((w) =>
          w.id === workoutId ? { ...w, dayOfWeek: targetDay, date: targetDate } : w
        );
      }
    } else {
      // mode === 'move' (combine onto targetDay!)
      // Remove any placeholder 'rest' workout on targetDay so the moved workout doesn't sit next to a rest entry
      updatedWorkouts = updatedWorkouts.filter(
        (w) => !(w.dayOfWeek === targetDay && w.sport === 'rest')
      );
      updatedWorkouts = updatedWorkouts.map((w) =>
        w.id === workoutId ? { ...w, dayOfWeek: targetDay, date: targetDate } : w
      );

      // If sourceDay now has zero workouts left, insert a rest day entry on sourceDay
      const remainingOnSource = updatedWorkouts.filter((w) => w.dayOfWeek === sourceDay);
      if (remainingOnSource.length === 0) {
        updatedWorkouts.push({
          id: `rest-${Date.now()}-d${sourceDay}`,
          weekNumber: currentWeek.weekNumber,
          dayOfWeek: sourceDay,
          date: sourceDate,
          title: 'Repos complet & Régénération',
          sport: 'rest',
          category: 'recovery',
          phase: currentWeek.phase,
          durationMinutes: 0,
          distanceMeters: 0,
          targetZone: 'Z0',
          intensityRpe: 1,
          description: 'Journée de repos sans entraînement.',
          coachTips: ["Le repos fait partie intégrante de l'entraînement."],
          steps: [],
          status: 'planned',
        });
      }
    }

    const updatedWeeks = plan.weeks.map((week, idx) => {
      if (idx !== currentWeekIndex) return week;
      return recomputeWeekTotals(week, updatedWorkouts);
    });

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // 5. Add a workout to a day in the current week (supports multi-workout days & catalog templates)
  const handleAddWorkoutToDay = (dayOfWeek: number, template?: WorkoutTemplate) => {
    const currentWeek = plan.weeks[currentWeekIndex];
    if (!currentWeek) return;

    const d = new Date(`${currentWeek.startDate}T12:00:00`);
    d.setDate(d.getDate() + (dayOfWeek - 1));
    const dayDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;

    const newWorkout: Workout = template
      ? {
          ...instantiateWorkoutFromTemplate(
            template,
            currentWeek.weekNumber,
            dayOfWeek,
            dayDate,
            profile
          ),
          id: `wo-w${currentWeek.weekNumber}-d${dayOfWeek}-${Date.now()}`,
        }
      : {
          id: `custom-wo-${Date.now()}`,
          weekNumber: currentWeek.weekNumber,
          dayOfWeek,
          date: dayDate,
          title: `Nouvelle Séance (Jour ${dayOfWeek})`,
          sport: 'run',
          category: 'endurance',
          phase: currentWeek.phase,
          durationMinutes: 45,
          distanceMeters: 7000,
          targetZone: 'Z2',
          intensityRpe: 5,
          description:
            'Séance ajoutée au programme. Cliquez sur "Changer" pour choisir dans le catalogue ou "Modifier" pour l\'ajuster.',
          coachTips: ['Personnalisez les détails selon vos disponibilités du jour.'],
          steps: [
            {
              type: 'warmup',
              name: 'Échauffement progressif',
              durationMinutes: 10,
              targetZone: 'Z1',
              targetDescription: 'Mise en route douce',
            },
            {
              type: 'interval',
              name: 'Corps de séance principal',
              durationMinutes: 25,
              targetZone: 'Z2',
              targetDescription: 'Allure régulière',
            },
            {
              type: 'cooldown',
              name: 'Retour au calme',
              durationMinutes: 10,
              targetZone: 'Z1',
              targetDescription: 'Décrassage',
            },
          ],
          status: 'planned',
        };

    const updatedWeeks = plan.weeks.map((week, idx) => {
      if (idx !== currentWeekIndex) return week;
      // Remove any 'rest' placeholder on that day before appending the new workout
      const filteredWorkouts = week.workouts.filter(
        (w) => !(w.dayOfWeek === dayOfWeek && w.sport === 'rest')
      );
      return recomputeWeekTotals(week, [...filteredWorkouts, newWorkout]);
    });

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }

    if (!template) {
      setSelectedWorkout(newWorkout);
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // 6. Delete a workout from the current week
  const handleDeleteWorkout = (workoutId: string) => {
    const currentWeek = plan.weeks[currentWeekIndex];
    if (!currentWeek) return;

    const targetWo = currentWeek.workouts.find((w) => w.id === workoutId);
    if (!targetWo) return;
    const dayOfWeek = targetWo.dayOfWeek;

    const otherOnDay = currentWeek.workouts.filter(
      (w) => w.dayOfWeek === dayOfWeek && w.id !== workoutId
    );
    const updatedWorkouts = currentWeek.workouts.filter((w) => w.id !== workoutId);

    if (otherOnDay.length === 0) {
      updatedWorkouts.push({
        id: `rest-${Date.now()}`,
        weekNumber: currentWeek.weekNumber,
        dayOfWeek,
        date: targetWo.date,
        title: 'Repos complet & Régénération',
        sport: 'rest',
        category: 'recovery',
        phase: currentWeek.phase,
        durationMinutes: 0,
        distanceMeters: 0,
        targetZone: 'Z0',
        intensityRpe: 1,
        description: 'Journée de repos sans entraînement.',
        coachTips: ["Le repos fait partie intégrante de l'entraînement."],
        steps: [],
        status: 'planned',
      });
    }

    const updatedWeeks = plan.weeks.map((week, idx) => {
      if (idx !== currentWeekIndex) return week;
      return recomputeWeekTotals(week, updatedWorkouts);
    });

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // 7. Save custom weekly schedule preference
  const handleSaveWeeklySchedule = (
    updatedSchedule: WeeklyDayPreference[],
    availableDays: number[]
  ) => {
    const updatedProfile: AthleteProfile = {
      ...profile,
      availability: {
        ...profile.availability,
        availableDays,
        weeklySchedule: updatedSchedule,
      },
    };
    handleSaveProfile(updatedProfile);
  };

  // 8. Apply synced Garmin activities to workouts
  const handleApplySyncedActivities = (
    updates: { workoutId: string; activity: GarminActivityMetrics }[]
  ) => {
    if (updates.length === 0) return;

    const updatesMap = new Map<string, GarminActivityMetrics>();
    updates.forEach((u) => updatesMap.set(u.workoutId, u.activity));

    const updatedWeeks = plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((wo) => {
        const matchedActivity = updatesMap.get(wo.id);
        if (!matchedActivity) return wo;
        return {
          ...wo,
          status: 'completed' as WorkoutStatus,
          completedDurationMinutes: matchedActivity.durationMinutes,
          completedDistanceMeters: matchedActivity.distanceMeters,
          completedRpe:
            matchedActivity.perceivedRpe || wo.completedRpe || wo.intensityRpe || 6,
          garminActivity: matchedActivity,
        };
      }),
    }));

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }

    if (selectedWorkout && updatesMap.has(selectedWorkout.id)) {
      const act = updatesMap.get(selectedWorkout.id)!;
      setSelectedWorkout({
        ...selectedWorkout,
        status: 'completed',
        completedDurationMinutes: act.durationMinutes,
        completedDistanceMeters: act.distanceMeters,
        completedRpe:
          act.perceivedRpe ||
          selectedWorkout.completedRpe ||
          selectedWorkout.intensityRpe ||
          6,
        garminActivity: act,
      });
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // 9. Mark workouts as pushed to watch (Garmin / COROS)
  const handleMarkWorkoutsPushedToWatch = (workoutIds: string[], timestamp: string) => {
    const idSet = new Set(workoutIds);
    const updatedWeeks = plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((wo) => {
        if (!idSet.has(wo.id)) return wo;
        return {
          ...wo,
          pushedToWatchAt: timestamp,
          externalEventId: `triatrain_${wo.id}`,
        };
      }),
    }));

    const updatedPlan: TrainingPlan = {
      ...plan,
      weeks: updatedWeeks,
    };

    setPlan(updatedPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(updatedPlan));
    } catch (e) {
      console.error(e);
    }
    triggerBackgroundCloudPush(profile, updatedPlan, currentWeekIndex);
  };

  // 10. Shift existing training plan start date (Week 1) without losing completed workouts or Garmin syncs
  const handleShiftPlanStartDate = (newStartDateStr: string) => {
    const alignedStart = getMondayOfWeek(newStartDateStr);
    const shiftedPlan = shiftTrainingPlanStartDate(plan, alignedStart);
    const updatedProfile: AthleteProfile = {
      ...profile,
      raceObjective: {
        ...profile.raceObjective,
        startDate: alignedStart,
      },
    };

    setProfile(updatedProfile);
    setPlan(shiftedPlan);
    const activeWeekIdx = resolveCurrentWeekIndex(shiftedPlan);
    setCurrentWeekIndex(activeWeekIdx);
    try {
      localStorage.setItem('triatrain_athlete_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('triatrain_training_plan', JSON.stringify(shiftedPlan));
    } catch (e) {
      console.error(e);
    }
    triggerBackgroundCloudPush(updatedProfile, shiftedPlan, activeWeekIdx);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white pb-16 md:pb-0">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        plan={plan}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenProfile={() => {
          setProfileInitialSection('objective');
          setIsProfileOpen(true);
        }}
        onOpenGarminSync={() => {
          setIsStartupImportPrompt(false);
          setIsGarminSyncOpen(true);
        }}
        onOpenWhatsNew={() => setIsWhatsNewOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            plan={plan}
            profile={profile}
            currentWeekIndex={currentWeekIndex}
            setCurrentWeekIndex={setCurrentWeekIndex}
            onSelectWorkout={(wo) => setSelectedWorkout(wo)}
            onToggleWorkoutStatus={handleToggleWorkoutStatus}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenWeeklySchedule={() => {
              setProfileInitialSection('schedule');
              setIsProfileOpen(true);
            }}
            onOpenGarminSync={() => {
              setIsStartupImportPrompt(false);
              setIsGarminSyncOpen(true);
            }}
            onOpenCoachAnalysis={() => {
              setIsMondayCoachAutoPrompt(false);
              setIsCoachAnalysisOpen(true);
            }}
            onSwapWorkouts={handleSwapWorkouts}
            onAddWorkoutToDay={handleAddWorkoutToDay}
            onDeleteWorkout={handleDeleteWorkout}
            onShiftPlanStartDate={handleShiftPlanStartDate}
          />
        )}

        {activeTab === 'plan' && (
          <PlanOverview
            plan={plan}
            currentWeekIndex={currentWeekIndex}
            onSelectWeek={(weekIdx) => {
              setCurrentWeekIndex(weekIdx);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'zones' && <ZonesCenter profile={profile} />}

        {activeTab === 'toolkit' && <BeginnerToolkit profile={profile} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">TriaTrain</span>
            <span>•</span>
            <span>Programme d'entraînement Triathlon Personnalisé</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                setIsMondayCoachAutoPrompt(false);
                setIsCoachAnalysisOpen(true);
              }}
              className="text-indigo-400 hover:text-indigo-300 transition flex items-center space-x-1.5 font-medium"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Bilan & Conseils Coach</span>
            </button>

            <button
              onClick={() => {
                setProfileInitialSection('connections');
                setIsProfileOpen(true);
              }}
              className="text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1.5 font-medium"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sync Cloud (iPhone ↔ PC)</span>
            </button>

            <button
              onClick={() => setIsWhatsNewOpen(true)}
              className="text-amber-400 hover:text-amber-300 transition flex items-center space-x-1.5 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nouveautés & Versions (v1.3)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WorkoutModal
        workout={selectedWorkout}
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        onUpdateWorkout={handleUpdateWorkout}
        profile={profile}
        onOpenGarminSync={() => {
          setIsStartupImportPrompt(false);
          setIsGarminSyncOpen(true);
        }}
      />

      <GarminSyncModal
        isOpen={isGarminSyncOpen}
        onClose={() => {
          const wasStartup = isStartupImportPrompt;
          if (wasStartup) {
            try {
              localStorage.setItem('triatrain_dismissed_import_date', getLocalTodayIso());
            } catch {
              // ignore storage error
            }
          }
          setIsGarminSyncOpen(false);
          setIsStartupImportPrompt(false);

          // Si nous sommes lundi matin et que le Bilan Coach n'a pas encore été vu aujourd'hui, l'ouvrir après l'import
          if (wasStartup && shouldTriggerMondayMorningAnalysis(plan)) {
            setIsMondayCoachAutoPrompt(true);
            setIsCoachAnalysisOpen(true);
          }
        }}
        currentWeek={plan.weeks[currentWeekIndex] || plan.weeks[0]}
        profile={profile}
        plan={plan}
        currentWeekIndex={currentWeekIndex}
        isStartupPrompt={isStartupImportPrompt}
        onApplySyncedActivities={handleApplySyncedActivities}
        onMarkWorkoutsPushedToWatch={handleMarkWorkoutsPushedToWatch}
        onOpenProfileConnections={() => {
          setProfileInitialSection('connections');
          setIsProfileOpen(true);
        }}
        onRestoreCloudSnapshot={handleRestoreCloudSnapshot}
      />

      <WeeklyCoachAnalysisModal
        isOpen={isCoachAnalysisOpen}
        onClose={() => {
          setIsCoachAnalysisOpen(false);
          setIsMondayCoachAutoPrompt(false);
        }}
        plan={plan}
        profile={profile}
        currentWeekIndex={currentWeekIndex}
        isMondayAutoPrompt={isMondayCoachAutoPrompt}
        onAddSuggestedWorkoutToCurrentWeek={(dayOfWeek, tpl) =>
          handleAddWorkoutToDay(dayOfWeek, tpl)
        }
        onOpenProfileSettings={() => {
          setProfileInitialSection('physio');
          setIsProfileOpen(true);
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentProfile={profile}
        onSaveProfile={handleSaveProfile}
      />

      <ProfileSettings
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        plan={plan}
        currentWeekIndex={currentWeekIndex}
        initialSection={profileInitialSection}
        onSaveProfile={handleSaveProfile}
        onRestoreCloudSnapshot={handleRestoreCloudSnapshot}
      />

      <WeeklyScheduleModal
        isOpen={isWeeklyScheduleOpen}
        onClose={() => setIsWeeklyScheduleOpen(false)}
        profile={profile}
        onSaveSchedule={handleSaveWeeklySchedule}
      />

      <WhatsNewModal
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
      />
    </div>
  );
};
