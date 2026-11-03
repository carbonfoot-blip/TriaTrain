import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Award, 
  Activity, Clock, MapPin, Flame, Sliders, Watch, X, Check
} from 'lucide-react';
import { AthleteProfile, TrainingPlan, Workout, WorkoutStatus } from '../types/triathlon';
import { WeekCalendar } from './WeekCalendar';
import { getMondayOfWeek, getStartDatePresets } from '../utils/planGenerator';

interface DashboardProps {
  plan: TrainingPlan;
  profile: AthleteProfile;
  currentWeekIndex: number;
  setCurrentWeekIndex: (index: number) => void;
  onSelectWorkout: (workout: Workout) => void;
  onToggleWorkoutStatus: (workoutId: string, currentStatus: WorkoutStatus) => void;
  onOpenOnboarding: () => void;
  onOpenWeeklySchedule?: () => void;
  onOpenGarminSync?: () => void;
  onSwapWorkouts?: (workoutId: string, targetDay: number, mode: 'swap' | 'move') => void;
  onAddWorkoutToDay?: (dayOfWeek: number) => void;
  onDeleteWorkout?: (workoutId: string) => void;
  onShiftPlanStartDate?: (newStartDateStr: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plan,
  profile,
  currentWeekIndex,
  setCurrentWeekIndex,
  onSelectWorkout,
  onToggleWorkoutStatus,
  onOpenWeeklySchedule,
  onOpenGarminSync,
  onSwapWorkouts,
  onAddWorkoutToDay,
  onDeleteWorkout,
  onShiftPlanStartDate,
}) => {
  const currentWeek = plan.weeks[currentWeekIndex] || plan.weeks[0];
  const planWeek1Start = plan.weeks[0]?.startDate || profile.raceObjective.startDate || getMondayOfWeek();

  const [isStartDateEditorOpen, setIsStartDateEditorOpen] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<string>(planWeek1Start);
  const [shiftSuccessMsg, setShiftSuccessMsg] = useState<string | null>(null);

  // Calculate days remaining to race
  const calculateDaysToRace = () => {
    if (!profile.raceObjective.raceDate) return null;
    const today = new Date();
    const race = new Date(profile.raceObjective.raceDate);
    const diffTime = race.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysToRace = calculateDaysToRace();

  // Weekly completion stats
  const activeWorkouts = currentWeek.workouts.filter((w) => w.sport !== 'rest');
  const completedCount = activeWorkouts.filter((w) => w.status === 'completed').length;
  const completionPct = activeWorkouts.length > 0 ? Math.round((completedCount / activeWorkouts.length) * 100) : 0;

  const formatHoursMinutes = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m < 10 ? '0' : ''}${m}`;
  };

  const handleApplyStartDate = (chosenDate: string) => {
    if (!onShiftPlanStartDate) return;
    const aligned = getMondayOfWeek(chosenDate);
    setTempStartDate(aligned);
    onShiftPlanStartDate(aligned);
    setShiftSuccessMsg(`Semaine 1 calée au Lundi ${aligned} !`);
    setTimeout(() => {
      setShiftSuccessMsg(null);
      setIsStartDateEditorOpen(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Race Countdown & Phase Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Race countdown card */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Award className="w-32 h-32 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Objectif Principal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {profile.raceObjective.distance.toUpperCase()} • {profile.raceObjective.goalType.toUpperCase()}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-white leading-tight">
              {profile.raceObjective.raceName || 'Triathlon Cible'}
            </h3>

            <p className="text-xs text-slate-300">
              {profile.raceObjective.distance === 'xs' && '400m 🏊 + 10km 🚴 + 2.5km 🏃 (Triathlon Découverte)'}
              {profile.raceObjective.distance === 's' && '750m 🏊 + 20km 🚴 + 5km 🏃 (Triathlon Sprint)'}
              {profile.raceObjective.distance === 'm' && '1500m 🏊 + 40km 🚴 + 10km 🏃 (Triathlon Olympique)'}
              {profile.raceObjective.distance === 'l' && '1900m 🏊 + 90km 🚴 + 21.1km 🏃 (Half 70.3)'}
              {profile.raceObjective.distance === 'xl' && '3800m 🏊 + 180km 🚴 + 42.2km 🏃 (Ironman 140.6)'}
              {profile.raceObjective.distance === 'run_5k' && '🏃 5.0 km Course à pied'}
              {profile.raceObjective.distance === 'run_10k' && '🏃 10.0 km Course à pied'}
              {profile.raceObjective.distance === 'run_semi' && '🏃 21.1 km Semi-Marathon'}
              {profile.raceObjective.distance === 'run_marathon' && '🏃 42.195 km Marathon'}
              {profile.raceObjective.distance === 'run_trail' && '🏃 ~30 km Trail Nature & Dénivelé'}
              {profile.raceObjective.distance === 'bike_50k' && '🚴 50 km Sortie Rythmée'}
              {profile.raceObjective.distance === 'bike_90k' && '🚴 90 km Gran Fondo'}
              {profile.raceObjective.distance === 'bike_135k' && '🚴 135 km Défi Pierre Lavoie (La Boucle)'}
              {profile.raceObjective.distance === 'bike_century' && '🚴 160 km Century Ride (100 Miles)'}
              {profile.raceObjective.distance === 'bike_200k' && '🚴 200 km+ Ultra-Cyclisme'}
              {profile.raceObjective.distance === 'swim_1500m' && '🏊 1 500 m Eau Libre'}
              {profile.raceObjective.distance === 'swim_3k' && '🏊 3 000 m (3 km) Eau Libre'}
              {profile.raceObjective.distance === 'swim_5k' && '🏊 5 000 m (5 km) Marathon Nage'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Compte à rebours</span>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
                {daysToRace !== null ? `J - ${daysToRace} jours` : 'Plan actif'}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Date de course</span>
              <span className="text-xs font-semibold text-slate-200">
                {profile.raceObjective.raceDate
                  ? new Date(`${profile.raceObjective.raceDate}T12:00:00`).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'À définir'}
              </span>
            </div>
          </div>
        </div>

        {/* Phase Description & Volume Summary */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {currentWeek.phaseTitle}
                </span>
                {currentWeek.isRestWeek && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800">
                    Régénération
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {currentWeek.phaseDescription}
              </p>
            </div>

            {/* Week Switcher buttons */}
            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                disabled={currentWeekIndex === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={currentWeekIndex}
                onChange={(e) => setCurrentWeekIndex(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                {plan.weeks.map((w, idx) => (
                  <option key={w.weekNumber} value={idx}>
                    Semaine {w.weekNumber} / {plan.totalWeeks} ({w.startDate} • {w.phase.toUpperCase()})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setCurrentWeekIndex(Math.min(plan.totalWeeks - 1, currentWeekIndex + 1))}
                disabled={currentWeekIndex === plan.totalWeeks - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Volume KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Volume Hebdo</span>
              </span>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {formatHoursMinutes(currentWeek.totalDurationMinutes)}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>Distance Totale</span>
              </span>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                {currentWeek.totalDistanceKm} km
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Progression</span>
              </span>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {completedCount}/{activeWorkouts.length} ({completionPct}%)
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-purple-400" />
                <span>Répartition</span>
              </span>
              <div className="text-[11px] text-slate-300 font-mono mt-1 space-x-1 truncate">
                <span className="text-cyan-400">🏊 {Math.round(currentWeek.sportBreakdown.swimMinutes / 60 * 10) / 10}h</span>
                <span className="text-amber-400">🚴 {Math.round(currentWeek.sportBreakdown.bikeMinutes / 60 * 10) / 10}h</span>
                <span className="text-emerald-400">🏃 {Math.round(currentWeek.sportBreakdown.runMinutes / 60 * 10) / 10}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              Programme de la Semaine {currentWeek.weekNumber}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({currentWeek.startDate} au {currentWeek.endDate})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onShiftPlanStartDate && (
              <button
                type="button"
                onClick={() => {
                  setTempStartDate(planWeek1Start);
                  setIsStartDateEditorOpen(!isStartDateEditorOpen);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition shadow-sm"
                title="Modifier la date de début réelle de la Semaine 1 (ex: la semaine passée)"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>📅 Début S1 : {planWeek1Start}</span>
              </button>
            )}

            {onOpenGarminSync && (
              <button
                type="button"
                onClick={onOpenGarminSync}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-lg transition shadow-sm"
              >
                <Watch className="w-3.5 h-3.5 text-emerald-400" />
                <span>⌚ Synchroniser Garmin</span>
              </button>
            )}

            {onOpenWeeklySchedule && (
              <button
                type="button"
                onClick={onOpenWeeklySchedule}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-lg transition shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>⚙️ Jours de sport (Semaine type)</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick inline Start Date Editor Banner */}
        {isStartDateEditorOpen && onShiftPlanStartDate && (
          <div className="p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Changer la date de début réelle du programme (Semaine 1)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Décale toutes les semaines de votre programme (sans perdre vos séances complétées ni vos synchronisations Garmin) pour que la Semaine 1 débute à la date de votre choix (ex: la semaine passée).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStartDateEditorOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {getStartDatePresets().map((preset) => {
                  const isCurrent = planWeek1Start === preset.date;
                  return (
                    <button
                      key={preset.date}
                      type="button"
                      onClick={() => handleApplyStartDate(preset.date)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {preset.label} <span className="text-[10px] opacity-80 font-mono">({preset.date})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyStartDate(tempStartDate)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Appliquer</span>
                </button>
              </div>
            </div>

            {shiftSuccessMsg && (
              <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 pt-1">
                <Check className="w-4 h-4" />
                <span>{shiftSuccessMsg}</span>
              </div>
            )}
          </div>
        )}

        <WeekCalendar
          currentWeek={currentWeek}
          onSelectWorkout={onSelectWorkout}
          onToggleWorkoutStatus={onToggleWorkoutStatus}
          onSwapWorkouts={onSwapWorkouts}
          onAddWorkoutToDay={onAddWorkoutToDay}
          onDeleteWorkout={onDeleteWorkout}
        />
      </div>
    </div>
  );
};
