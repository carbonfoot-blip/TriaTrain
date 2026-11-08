import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Award,
  Activity,
  Clock,
  MapPin,
  Flame,
  Sliders,
  Watch,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
} from 'lucide-react';
import { AthleteProfile, TrainingPlan, Workout, WorkoutStatus } from '../types/triathlon';
import { WorkoutTemplate } from '../data/workoutCatalog';
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
  onOpenCoachAnalysis?: () => void;
  onSwapWorkouts?: (workoutId: string, targetDay: number, mode: 'swap' | 'move') => void;
  onAddWorkoutToDay?: (dayOfWeek: number, template?: WorkoutTemplate) => void;
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
  onOpenCoachAnalysis,
  onSwapWorkouts,
  onAddWorkoutToDay,
  onDeleteWorkout,
  onShiftPlanStartDate,
}) => {
  const currentWeek = plan.weeks[currentWeekIndex] || plan.weeks[0];
  const planWeek1Start =
    plan.weeks[0]?.startDate || profile.raceObjective.startDate || getMondayOfWeek();

  // Collapsed by default so the weekly summary & today's workout are immediately visible without scrolling!
  const [showObjectiveDetails, setShowObjectiveDetails] = useState<boolean>(false);
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
  const completionPct =
    activeWorkouts.length > 0 ? Math.round((completedCount / activeWorkouts.length) * 100) : 0;

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
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* COMPACT COCKPIT HEADER BAR (Zero vertical clutter before Today!)    */}
      {/* =================================================================== */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Compact Objective + Phase + Countdown */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setTempStartDate(planWeek1Start);
                setShowObjectiveDetails(!showObjectiveDetails);
              }}
              className="group flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-950 border border-cyan-500/30 transition text-left"
              title="Afficher / masquer les détails de l'objectif, le volume et la date de début S1"
            >
              <Award className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[160px] sm:max-w-[240px]">
                  {profile.raceObjective.raceName || 'Objectif Triathlon'}
                </span>
                {daysToRace !== null && (
                  <span className="text-[11px] font-black font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    J-{daysToRace}
                  </span>
                )}
              </div>
              {showObjectiveDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              )}
            </button>

            {/* Phase & Progression Pills */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {currentWeek.phaseTitle}
              </span>

              {currentWeek.isRestWeek && (
                <span className="text-[10px] font-bold px-2 py-1 bg-blue-950 text-blue-300 rounded-lg border border-blue-800">
                  Régénération
                </span>
              )}

              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-950/80 text-emerald-400 border border-slate-800">
                ✓ {completedCount}/{activeWorkouts.length} ({completionPct}%)
              </span>

              <span className="hidden xl:inline-block text-[11px] font-mono text-slate-400 px-2 py-1">
                ⏱️ {formatHoursMinutes(currentWeek.totalDurationMinutes)} • 📍{' '}
                {currentWeek.totalDistanceKm} km
              </span>
            </div>
          </div>

          {/* Right: Week Selector + Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
            {/* Week Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                disabled={currentWeekIndex === 0}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={currentWeekIndex}
                onChange={(e) => setCurrentWeekIndex(parseInt(e.target.value, 10))}
                className="px-2 py-1 bg-transparent text-xs font-extrabold text-white focus:outline-none font-mono cursor-pointer"
              >
                {plan.weeks.map((w, idx) => (
                  <option key={w.weekNumber} value={idx} className="bg-slate-900 text-white">
                    Sem. {w.weekNumber}/{plan.totalWeeks} ({w.startDate})
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  setCurrentWeekIndex(Math.min(plan.totalWeeks - 1, currentWeekIndex + 1))
                }
                disabled={currentWeekIndex === plan.totalWeeks - 1}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {onOpenCoachAnalysis && (
                <button
                  type="button"
                  onClick={onOpenCoachAnalysis}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-indigo-950/90 to-cyan-950/90 hover:from-indigo-900 hover:to-cyan-900 border border-indigo-400/50 text-indigo-200 text-xs font-extrabold rounded-xl transition shadow-sm"
                  title="Analyser mes entraînements récents, mon niveau et obtenir les conseils du Coach"
                >
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bilan Coach</span>
                </button>
              )}

              {onOpenGarminSync && (
                <button
                  type="button"
                  onClick={onOpenGarminSync}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-xl transition shadow-sm"
                  title="Synchroniser Garmin / Intervals.icu"
                >
                  <Watch className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Sync Garmin</span>
                </button>
              )}

              {onOpenWeeklySchedule && (
                <button
                  type="button"
                  onClick={onOpenWeeklySchedule}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl transition shadow-sm"
                  title="Configurer vos jours de sport et doublés (Semaine type)"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Semaine type</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLLAPSIBLE DRAWER: Full Objective Details, KPIs & Date Début S1  */}
        {/* ================================================================= */}
        {showObjectiveDetails && (
          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Objective Info */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                      Objectif Principal ({profile.raceObjective.distance.toUpperCase()} •{' '}
                      {profile.raceObjective.goalType.toUpperCase()})
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      {profile.raceObjective.raceDate
                        ? new Date(`${profile.raceObjective.raceDate}T12:00:00`).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : 'Date à définir'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{currentWeek.phaseDescription}</p>
                </div>

                <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Début S1 : {planWeek1Start}</span>
                  <span>
                    Semaine {currentWeek.weekNumber} : {currentWeek.startDate} →{' '}
                    {currentWeek.endDate}
                  </span>
                </div>
              </div>

              {/* 4 KPI Mini Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Volume Hebdo</span>
                  </span>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {formatHoursMinutes(currentWeek.totalDurationMinutes)}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>Distance Totale</span>
                  </span>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {currentWeek.totalDistanceKm} km
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>Progression</span>
                  </span>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {completedCount}/{activeWorkouts.length} ({completionPct}%)
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-purple-400" />
                    <span>Répartition</span>
                  </span>
                  <div className="text-[11px] text-slate-300 font-mono mt-1 space-x-1 truncate">
                    <span className="text-cyan-400">
                      🏊 {Math.round((currentWeek.sportBreakdown.swimMinutes / 60) * 10) / 10}h
                    </span>
                    <span className="text-amber-400">
                      🚴 {Math.round((currentWeek.sportBreakdown.bikeMinutes / 60) * 10) / 10}h
                    </span>
                    <span className="text-emerald-400">
                      🏃 {Math.round((currentWeek.sportBreakdown.runMinutes / 60) * 10) / 10}h
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Date S1 Shifter inside the drawer */}
            {onShiftPlanStartDate && (
              <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300">
                    Décaler le début de la Semaine 1 :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {getStartDatePresets().map((preset) => {
                      const isCurrent = planWeek1Start === preset.date;
                      return (
                        <button
                          key={preset.date}
                          type="button"
                          onClick={() => handleApplyStartDate(preset.date)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition border ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyStartDate(tempStartDate)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-lg transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Caler S1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowObjectiveDetails(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg"
                    title="Replier"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {shiftSuccessMsg && (
              <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <Check className="w-4 h-4" />
                <span>{shiftSuccessMsg}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* IRONMAN-STYLE WEEKLY SUMMARY ACCORDION (Today highlighted & open!)  */}
      {/* =================================================================== */}
      <WeekCalendar
        currentWeek={currentWeek}
        onSelectWorkout={onSelectWorkout}
        onToggleWorkoutStatus={onToggleWorkoutStatus}
        onSwapWorkouts={onSwapWorkouts}
        onAddWorkoutToDay={onAddWorkoutToDay}
        onDeleteWorkout={onDeleteWorkout}
      />
    </div>
  );
};
