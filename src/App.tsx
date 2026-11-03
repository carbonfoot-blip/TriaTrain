import React, { useState, useEffect } from 'react';
import { AthleteProfile, GarminActivityMetrics, TrainingPlan, Workout, WorkoutStatus, WeeklyDayPreference } from './types/triathlon';
import { DEFAULT_ATHLETE_PROFILE } from './data/defaultProfile';
import { generateTrainingPlan } from './utils/planGenerator';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { PlanOverview } from './components/PlanOverview';
import { ZonesCenter } from './components/ZonesCenter';
import { BeginnerToolkit } from './components/BeginnerToolkit';
import { WorkoutModal } from './components/WorkoutModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileSettings } from './components/ProfileSettings';
import { WeeklyScheduleModal } from './components/WeeklyScheduleModal';
import { GarminSyncModal } from './components/GarminSyncModal';
import { Activity, Sparkles, Download, Calendar, Compass, ShieldCheck } from 'lucide-react';
import { downloadIcsFile } from './utils/icsExporter';

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

  // 3. UI Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plan' | 'zones' | 'toolkit'>('dashboard');
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number>(0);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isWeeklyScheduleOpen, setIsWeeklyScheduleOpen] = useState<boolean>(false);
  const [isGarminSyncOpen, setIsGarminSyncOpen] = useState<boolean>(false);

  // Check if first visit to prompt onboarding
  useEffect(() => {
    const hasVisited = localStorage.getItem('triatrain_visited');
    if (!hasVisited) {
      setIsOnboardingOpen(true);
      localStorage.setItem('triatrain_visited', 'true');
    }
  }, []);

  // Save to localStorage when profile changes
  const handleSaveProfile = (newProfile: AthleteProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('triatrain_athlete_profile', JSON.stringify(newProfile));
    } catch (e) {
      console.error(e);
    }
    // Regenerate plan with new profile & paces
    const newPlan = generateTrainingPlan(newProfile);
    setPlan(newPlan);
    try {
      localStorage.setItem('triatrain_training_plan', JSON.stringify(newPlan));
    } catch (e) {
      console.error(e);
    }
    setCurrentWeekIndex(0);
  };

  // Update a single workout (completion, RPE, notes)
  const handleUpdateWorkout = (updatedWorkout: Workout) => {
    const updatedWeeks = plan.weeks.map((week) => {
      if (week.weekNumber !== updatedWorkout.weekNumber) return week;
      return {
        ...week,
        workouts: week.workouts.map((w) => (w.id === updatedWorkout.id ? updatedWorkout : w)),
      };
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
  };

  // Quick toggle completion status directly from card
  const handleToggleWorkoutStatus = (workoutId: string, currentStatus: WorkoutStatus) => {
    const nextStatus: WorkoutStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    const updatedWeeks = plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((w) => {
        if (w.id === workoutId) {
          return {
            ...w,
            status: nextStatus,
            completedRpe: nextStatus === 'completed' ? (w.completedRpe || w.intensityRpe || 6) : undefined,
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
  };

  // 4. Swap or Move Workouts between days in the current week
  const handleSwapWorkouts = (workoutId: string, targetDay: number, mode: 'swap' | 'move') => {
    const currentWeek = plan.weeks[currentWeekIndex];
    if (!currentWeek) return;

    const sourceWo = currentWeek.workouts.find((w) => w.id === workoutId);
    if (!sourceWo) return;
    const sourceDay = sourceWo.dayOfWeek;
    if (sourceDay === targetDay) return;

    const addDaysToStart = (days: number) => {
      const d = new Date(currentWeek.startDate);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
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
      updatedWorkouts = updatedWorkouts.map((w) =>
        w.id === workoutId ? { ...w, dayOfWeek: targetDay, date: targetDate } : w
      );
    }

    // Recompute week volume metrics
    let totalDur = 0;
    let totalDist = 0;
    let swimMin = 0;
    let bikeMin = 0;
    let runMin = 0;
    let strengthMin = 0;

    updatedWorkouts.forEach((wo) => {
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

    const updatedWeeks = plan.weeks.map((week, idx) => {
      if (idx !== currentWeekIndex) return week;
      return {
        ...week,
        workouts: updatedWorkouts,
        totalDurationMinutes: totalDur,
        totalDistanceKm: Math.round(totalDist * 10) / 10,
        sportBreakdown: {
          swimMinutes: swimMin,
          bikeMinutes: bikeMin,
          runMinutes: runMin,
          strengthMinutes: strengthMin,
        },
      };
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
  };

  // 5. Add a workout to a day in the current week
  const handleAddWorkoutToDay = (dayOfWeek: number) => {
    const currentWeek = plan.weeks[currentWeekIndex];
    if (!currentWeek) return;

    const d = new Date(currentWeek.startDate);
    d.setDate(d.getDate() + (dayOfWeek - 1));
    const dayDate = d.toISOString().split('T')[0];

    const newWorkout: Workout = {
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
      description: 'Séance ajoutée au programme. Cliquez sur "Changer la séance" pour choisir dans le catalogue ou "Modifier" pour l\'ajuster.',
      coachTips: ['Personnalisez les détails selon vos disponibilités du jour.'],
      steps: [
        { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Mise en route douce' },
        { type: 'interval', name: 'Corps de séance principal', durationMinutes: 25, targetZone: 'Z2', targetDescription: 'Allure régulière' },
        { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Décrassage' },
      ],
      status: 'planned',
    };

    const updatedWeeks = plan.weeks.map((week, idx) => {
      if (idx !== currentWeekIndex) return week;
      const existingOnDay = week.workouts.filter((w) => w.dayOfWeek === dayOfWeek);
      const filteredWorkouts = existingOnDay.length === 1 && existingOnDay[0].sport === 'rest'
        ? week.workouts.filter((w) => w.id !== existingOnDay[0].id)
        : week.workouts;

      return {
        ...week,
        workouts: [...filteredWorkouts, newWorkout],
      };
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

    setSelectedWorkout(newWorkout);
  };

  // 6. Delete a workout from the current week
  const handleDeleteWorkout = (workoutId: string) => {
    const currentWeek = plan.weeks[currentWeekIndex];
    if (!currentWeek) return;

    const targetWo = currentWeek.workouts.find((w) => w.id === workoutId);
    if (!targetWo) return;
    const dayOfWeek = targetWo.dayOfWeek;

    const otherOnDay = currentWeek.workouts.filter((w) => w.dayOfWeek === dayOfWeek && w.id !== workoutId);
    let updatedWorkouts = currentWeek.workouts.filter((w) => w.id !== workoutId);

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
        coachTips: ['Le repos fait partie intégrante de l\'entraînement.'],
        steps: [],
        status: 'planned',
      });
    }

    const updatedWeeks = plan.weeks.map((week, idx) => {
      if (idx !== currentWeekIndex) return week;
      return {
        ...week,
        workouts: updatedWorkouts,
      };
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
  };

  // 7. Save custom weekly schedule preference
  const handleSaveWeeklySchedule = (updatedSchedule: WeeklyDayPreference[], availableDays: number[]) => {
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
          completedRpe: matchedActivity.perceivedRpe || wo.completedRpe || wo.intensityRpe || 6,
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
        completedRpe: act.perceivedRpe || selectedWorkout.completedRpe || selectedWorkout.intensityRpe || 6,
        garminActivity: act,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        plan={plan}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenGarminSync={() => setIsGarminSyncOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            plan={plan}
            profile={profile}
            currentWeekIndex={currentWeekIndex}
            setCurrentWeekIndex={setCurrentWeekIndex}
            onSelectWorkout={(wo) => setSelectedWorkout(wo)}
            onToggleWorkoutStatus={handleToggleWorkoutStatus}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenWeeklySchedule={() => setIsWeeklyScheduleOpen(true)}
            onOpenGarminSync={() => setIsGarminSyncOpen(true)}
            onSwapWorkouts={handleSwapWorkouts}
            onAddWorkoutToDay={handleAddWorkoutToDay}
            onDeleteWorkout={handleDeleteWorkout}
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

        {activeTab === 'zones' && (
          <ZonesCenter profile={profile} />
        )}

        {activeTab === 'toolkit' && (
          <BeginnerToolkit profile={profile} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">TriaTrain</span>
            <span>•</span>
            <span>Programme d'entraînement Triathlon Personnalisé</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => downloadIcsFile(plan, profile.name)}
              className="text-cyan-400 hover:text-cyan-300 transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter mon calendrier (.ics)</span>
            </button>
            <span>•</span>
            <a
              href="https://github.com/carbonfoot-blip/TriaTrain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>carbonfoot-blip/TriaTrain</span>
            </a>
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
        onOpenGarminSync={() => setIsGarminSyncOpen(true)}
      />

      <GarminSyncModal
        isOpen={isGarminSyncOpen}
        onClose={() => setIsGarminSyncOpen(false)}
        currentWeek={plan.weeks[currentWeekIndex] || plan.weeks[0]}
        profile={profile}
        onApplySyncedActivities={handleApplySyncedActivities}
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
        onSaveProfile={handleSaveProfile}
      />

      <WeeklyScheduleModal
        isOpen={isWeeklyScheduleOpen}
        onClose={() => setIsWeeklyScheduleOpen(false)}
        profile={profile}
        onSaveSchedule={handleSaveWeeklySchedule}
      />
    </div>
  );
};

