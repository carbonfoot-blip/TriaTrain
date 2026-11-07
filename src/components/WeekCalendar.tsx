import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  ArrowLeftRight,
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid,
  Dumbbell,
  Flame,
} from 'lucide-react';
import {
  AthleteProfile,
  SportType,
  TrainingWeek,
  Workout,
  WorkoutStatus,
} from '../types/triathlon';
import { WORKOUT_CATALOG, WorkoutTemplate } from '../data/workoutCatalog';

interface WeekCalendarProps {
  currentWeek: TrainingWeek;
  profile?: AthleteProfile;
  onSelectWorkout: (workout: Workout) => void;
  onToggleWorkoutStatus: (workoutId: string, currentStatus: WorkoutStatus) => void;
  onSwapWorkouts?: (workoutId: string, targetDay: number, mode: 'swap' | 'move') => void;
  onAddWorkoutToDay?: (dayOfWeek: number, template?: WorkoutTemplate) => void;
  onDeleteWorkout?: (workoutId: string) => void;
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  currentWeek,
  onSelectWorkout,
  onToggleWorkoutStatus,
  onSwapWorkouts,
  onAddWorkoutToDay,
  onDeleteWorkout,
}) => {
  const [viewLayout, setViewLayout] = useState<'summary_accordion' | 'grid_7col'>(
    'summary_accordion'
  );
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [activeSwapWorkout, setActiveSwapWorkout] = useState<Workout | null>(null);
  const [quickAddDay, setQuickAddDay] = useState<number | null>(null);
  const [quickAddSportFilter, setQuickAddSportFilter] = useState<SportType>('strength');

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  // Identify which dayOfWeek (1..7) is Today in the current week, if any
  const todayDayNumInWeek =
    currentWeek.workouts.find((w) => w.date === todayIso)?.dayOfWeek || null;

  // Expanded days in Accordion mode: Today is expanded by default!
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>(() => {
    if (todayDayNumInWeek) {
      return { [todayDayNumInWeek]: true };
    }
    return { 1: true };
  });

  // When switching weeks, auto-expand Today (if in that week) or Monday
  useEffect(() => {
    const matchToday = currentWeek.workouts.find((w) => w.date === todayIso)?.dayOfWeek;
    if (matchToday) {
      setExpandedDays({ [matchToday]: true });
    } else {
      setExpandedDays({ 1: true });
    }
  }, [currentWeek.weekNumber, currentWeek.startDate, todayIso]);

  const toggleDayExpanded = (dayNum: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  const expandAllDays = () => {
    const allOpen = DAY_NAMES.every((_, i) => expandedDays[i + 1]);
    if (allOpen) {
      setExpandedDays(todayDayNumInWeek ? { [todayDayNumInWeek]: true } : {});
    } else {
      setExpandedDays({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true });
    }
  };

  const getSportStyle = (sport: string, status: WorkoutStatus) => {
    const isDone = status === 'completed';
    switch (sport) {
      case 'swim':
        return {
          border: isDone
            ? 'border-cyan-500/80 bg-cyan-950/40'
            : 'border-cyan-500/40 bg-slate-900/90 hover:border-cyan-400',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          pill: isDone
            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/70'
            : 'bg-cyan-500/25 text-cyan-200 border-cyan-500/50',
          text: 'text-cyan-400',
          icon: '🏊',
          name: 'Natation',
          shortTag: 'NAGE',
        };
      case 'bike':
        return {
          border: isDone
            ? 'border-amber-500/80 bg-amber-950/40'
            : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          pill: isDone
            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/70'
            : 'bg-sky-500/25 text-sky-200 border-sky-500/50',
          text: 'text-amber-400',
          icon: '🚴',
          name: 'Vélo',
          shortTag: 'VÉLO',
        };
      case 'run':
        return {
          border: isDone
            ? 'border-emerald-500/80 bg-emerald-950/40'
            : 'border-emerald-500/40 bg-slate-900/90 hover:border-emerald-400',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          pill: isDone
            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/70'
            : 'bg-amber-500/25 text-amber-200 border-amber-500/50',
          text: 'text-emerald-400',
          icon: '🏃',
          name: 'Course',
          shortTag: 'COURSE',
        };
      case 'brick':
        return {
          border: isDone
            ? 'border-purple-500/80 bg-purple-950/40'
            : 'border-purple-500/40 bg-slate-900/90 hover:border-purple-400',
          badge: 'bg-purple-950 text-purple-300 border-purple-800',
          pill: isDone
            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/70'
            : 'bg-purple-500/25 text-purple-200 border-purple-500/50',
          text: 'text-purple-400',
          icon: '⚡',
          name: 'Brique',
          shortTag: 'BRIQUE',
        };
      case 'strength':
        return {
          border: isDone
            ? 'border-indigo-500/80 bg-indigo-950/40'
            : 'border-indigo-500/40 bg-slate-900/90 hover:border-indigo-400',
          badge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
          pill: isDone
            ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/70'
            : 'bg-indigo-500/30 text-indigo-200 border-indigo-500/50',
          text: 'text-indigo-400',
          icon: '💪',
          name: 'Poids / PPG',
          shortTag: 'POIDS / PPG',
        };
      default:
        return {
          border: 'border-slate-800 bg-slate-900/40 hover:border-slate-700',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          pill: 'bg-slate-800/90 text-slate-400 border-slate-700',
          text: 'text-slate-400',
          icon: '💤',
          name: 'Repos',
          shortTag: 'REPOS',
        };
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T12:00:00`);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatHoursDecimal = (minutes: number) => {
    if (minutes <= 0) return '0h';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h${m < 10 ? '0' : ''}${m}`;
  };

  const activeWorkoutsInWeek = currentWeek.workouts.filter((w) => w.sport !== 'rest');
  const completedInWeek = activeWorkoutsInWeek.filter((w) => w.status === 'completed').length;
  const allDaysExpanded = DAY_NAMES.every((_, i) => expandedDays[i + 1]);

  return (
    <div className="relative space-y-3">
      {/* View Toolbar */}
      <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-1.5">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            Cliquez sur une journée pour ouvrir ses détails ou ajouter un{' '}
            <strong className="text-slate-200">2e entraînement (Doublé)</strong>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {viewLayout === 'summary_accordion' && (
            <button
              type="button"
              onClick={expandAllDays}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {allDaysExpanded ? 'Réduire tout' : 'Tout déplier'}
            </button>
          )}

          <div className="hidden lg:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewLayout('summary_accordion')}
              title="Vue Sommaire Accordéon (Style IRONMAN)"
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 transition ${
                viewLayout === 'summary_accordion'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Sommaire</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid_7col')}
              title="Vue Grille 7 Colonnes"
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center space-x-1 transition ${
                viewLayout === 'grid_7col'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODE 1 (DEFAULT): IRONMAN-STYLE SUMMARY ROWS + CLICK-TO-EXPAND        */}
      {/* ===================================================================== */}
      {viewLayout === 'summary_accordion' && (
        <div className="space-y-2">
          {DAY_NAMES.map((dayName, index) => {
            const dayNum = index + 1;
            const rawDayWorkouts = currentWeek.workouts.filter((w) => w.dayOfWeek === dayNum);
            const activeDayWorkouts = rawDayWorkouts.filter((w) => w.sport !== 'rest');
            const dayDate = rawDayWorkouts[0]?.date || '';
            const isToday = dayDate === todayIso;
            const isExpanded = Boolean(expandedDays[dayNum]);
            const isRestDay = activeDayWorkouts.length === 0;
            const allDayDone =
              activeDayWorkouts.length > 0 &&
              activeDayWorkouts.every((w) => w.status === 'completed');

            const totalDayMinutes = activeDayWorkouts.reduce(
              (acc, w) => acc + w.durationMinutes,
              0
            );

            // Build concise summary string like the IRONMAN screenshot
            const summaryLabel = isRestDay
              ? 'Repos & Régénération musculaire'
              : activeDayWorkouts.map((w) => w.title).join('  +  ');

            // Left accent stripe color
            const accentStripeClass = isToday
              ? 'bg-gradient-to-b from-cyan-400 via-emerald-400 to-cyan-500'
              : allDayDone
                ? 'bg-emerald-500'
                : isRestDay
                  ? 'bg-slate-700'
                  : 'bg-amber-500';

            return (
              <div
                key={dayNum}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverDay !== dayNum) setDragOverDay(dayNum);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverDay(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverDay(null);
                  const draggedId = e.dataTransfer.getData('text/plain');
                  if (draggedId && onSwapWorkouts) {
                    onSwapWorkouts(draggedId, dayNum, 'move');
                  }
                }}
                className={`relative rounded-xl overflow-hidden transition-all duration-200 border ${
                  dragOverDay === dayNum
                    ? 'border-2 border-dashed border-cyan-400 bg-cyan-950/40'
                    : isToday
                      ? 'border-cyan-400/90 bg-gradient-to-r from-cyan-950/50 via-slate-900/95 to-slate-900/95 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/40'
                      : allDayDone
                        ? 'border-emerald-500/40 bg-slate-900/75 hover:border-emerald-500/60'
                        : 'border-slate-800/90 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                {/* Left Vertical Accent Stripe (IRONMAN style) */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentStripeClass}`} />

                {/* Clickable Summary Row */}
                <div
                  onClick={() => toggleDayExpanded(dayNum)}
                  className="pl-4 pr-3 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                >
                  {/* Left + Center: Day Name + Summary Text */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0 flex-1">
                    {/* Day Name & Date */}
                    <div className="flex items-center space-x-2 sm:w-44 shrink-0">
                      <span
                        className={`text-sm font-extrabold tracking-tight ${
                          isToday ? 'text-white' : 'text-slate-100'
                        }`}
                      >
                        {dayName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateShort(dayDate)}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-sm">
                          Aujourd'hui
                        </span>
                      )}
                    </div>

                    {/* Concise Workout Summary */}
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <p
                        className={`text-xs sm:text-[13px] truncate ${
                          isRestDay
                            ? 'text-slate-500 italic'
                            : allDayDone
                              ? 'text-emerald-300 font-semibold'
                              : isToday
                                ? 'text-slate-100 font-bold'
                                : 'text-slate-300 font-medium'
                        }`}
                      >
                        {summaryLabel}
                      </p>
                      {totalDayMinutes > 0 && (
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 hidden md:inline">
                          ({formatHoursDecimal(totalDayMinutes)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: IRONMAN-style Sport Pills + Add Button + Expand Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isRestDay ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-800/90 text-slate-400 border border-slate-700">
                          REPOS
                        </span>
                      ) : (
                        activeDayWorkouts.map((wo) => {
                          const st = getSportStyle(wo.sport, wo.status);
                          const isDone = wo.status === 'completed';
                          return (
                            <span
                              key={wo.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectWorkout(wo);
                              }}
                              title={`Cliquer pour ouvrir : ${wo.title}`}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center space-x-1 transition hover:scale-105 ${st.pill}`}
                            >
                              <span>{st.icon}</span>
                              <span>{st.shortTag}</span>
                              {isDone && <span className="text-emerald-300 ml-0.5">✓</span>}
                              {wo.garminActivity && !isDone && <span>⌚</span>}
                            </span>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center space-x-1 pl-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickAddSportFilter(
                            activeDayWorkouts.some((w) => w.sport === 'run' || w.sport === 'swim')
                              ? 'strength'
                              : 'run'
                          );
                          setQuickAddDay(dayNum);
                        }}
                        title={`Ajouter un entraînement à ${dayName} (ex: Poids + Course)`}
                        className="p-1 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <div className="p-1 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Day Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-2 border-t border-slate-800/80 bg-slate-950/60 space-y-3 animate-fadeIn">
                    {isRestDay ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-lg">💤</span>
                          <div>
                            <div className="text-xs font-bold text-slate-300">
                              Journée de Repos & Régénération
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Hydratation, sommeil et assimilation musculaire.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setQuickAddSportFilter('strength');
                            setQuickAddDay(dayNum);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter un entraînement ce jour</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`grid grid-cols-1 ${
                            activeDayWorkouts.length > 1 ? 'md:grid-cols-2' : ''
                          } gap-2.5`}
                        >
                          {activeDayWorkouts.map((wo, woIdx) => {
                            const style = getSportStyle(wo.sport, wo.status);
                            const isDone = wo.status === 'completed';

                            return (
                              <div
                                key={wo.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', wo.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onClick={() => onSelectWorkout(wo)}
                                className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer shadow-sm ${style.border}`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-base">{style.icon}</span>
                                    <span
                                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded border ${style.badge}`}
                                    >
                                      {activeDayWorkouts.length > 1
                                        ? `Séance ${woIdx + 1} • ${style.name}`
                                        : style.name}
                                    </span>
                                    <span className={`text-xs font-mono font-bold ${style.text}`}>
                                      {wo.targetZone}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    {onSwapWorkouts && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveSwapWorkout(wo);
                                        }}
                                        title="Déplacer, Permuter ou Combiner sur un autre jour"
                                        className="px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 text-[10px] font-bold flex items-center space-x-1 transition"
                                      >
                                        <ArrowLeftRight className="w-3 h-3" />
                                        <span>Déplacer</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleWorkoutStatus(wo.id, wo.status);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border flex items-center space-x-1 transition ${
                                        isDone
                                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                          : 'bg-slate-900/90 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border-slate-700'
                                      }`}
                                    >
                                      {isDone ? (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Validé</span>
                                        </>
                                      ) : (
                                        <>
                                          <Circle className="w-3.5 h-3.5" />
                                          <span>Valider</span>
                                        </>
                                      )}
                                    </button>

                                    {onDeleteWorkout && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteWorkout(wo.id);
                                        }}
                                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                                        title="Retirer cette séance"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <h4 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-cyan-300 transition">
                                  {wo.title}
                                </h4>

                                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                                  {wo.description}
                                </p>

                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 font-mono mt-2.5 pt-2 border-t border-slate-800/70">
                                  <div className="flex items-center space-x-3">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>{wo.durationMinutes} min</span>
                                    </span>

                                    {wo.distanceMeters > 0 && (
                                      <span className="flex items-center space-x-1">
                                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                        <span>
                                          {wo.sport === 'swim'
                                            ? `${wo.distanceMeters} m`
                                            : `${(wo.distanceMeters / 1000).toFixed(1)} km`}
                                        </span>
                                      </span>
                                    )}

                                    <span className="text-slate-400">RPE {wo.intensityRpe}/10</span>
                                  </div>

                                  <span className="text-[10px] font-sans font-bold text-cyan-400 group-hover:underline">
                                    Voir étapes & drills →
                                  </span>
                                </div>

                                {/* Garmin Synced Telemetry Mini-Banner */}
                                {wo.garminActivity && (
                                  <div className="mt-2 p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-bold text-emerald-300">
                                      ⌚ {wo.garminActivity.activityName} (
                                      {wo.garminActivity.avgPaceOrSpeedFormatted})
                                    </span>
                                    <span>
                                      {wo.garminActivity.durationMinutes}m •{' '}
                                      {wo.sport === 'swim'
                                        ? `${wo.garminActivity.distanceMeters}m`
                                        : `${(wo.garminActivity.distanceMeters / 1000).toFixed(2)}km`}
                                      {wo.garminActivity.avgHeartRate
                                        ? ` • ❤️ ${wo.garminActivity.avgHeartRate} bpm`
                                        : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add 2nd Workout Button Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setQuickAddSportFilter(
                                activeDayWorkouts.some((w) => w.sport === 'strength')
                                  ? 'run'
                                  : 'strength'
                              );
                              setQuickAddDay(dayNum);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1.5 transition"
                          >
                            <Plus className="w-3.5 h-3.5 text-indigo-400" />
                            <span>
                              Ajouter un {activeDayWorkouts.length + 1}e entraînement ce jour (ex:
                              Poids + Course, Vélo + Nage)
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 2 (OPTIONAL DESKTOP): 7-COLUMN GRID VIEW                         */}
      {/* ===================================================================== */}
      {viewLayout === 'grid_7col' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {DAY_NAMES.map((dayName, index) => {
            const dayNum = index + 1;
            const dayWorkouts = currentWeek.workouts.filter((w) => w.dayOfWeek === dayNum);
            const activeDayWorkouts = dayWorkouts.filter((w) => w.sport !== 'rest');
            const dayDate = dayWorkouts[0]?.date || '';
            const isToday = dayDate === todayIso;

            return (
              <div
                key={dayNum}
                className={`flex flex-col rounded-2xl p-3 space-y-2.5 border ${
                  isToday
                    ? 'bg-slate-900/90 border-2 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-200">{dayName}</span>
                      {isToday && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-cyan-400 text-slate-950">
                          Aujourd'hui
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {formatDateShort(dayDate)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddSportFilter('strength');
                      setQuickAddDay(dayNum);
                    }}
                    title={`Ajouter une séance à ${dayName}`}
                    className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  {activeDayWorkouts.length === 0 ? (
                    <div
                      onClick={() => {
                        setQuickAddSportFilter('strength');
                        setQuickAddDay(dayNum);
                      }}
                      className="min-h-[110px] flex flex-col items-center justify-center p-3 text-center rounded-xl border border-dashed border-slate-800 hover:border-slate-700 cursor-pointer transition"
                    >
                      <span className="text-lg">💤</span>
                      <span className="text-xs text-slate-400 mt-1">Repos</span>
                      <span className="text-[10px] text-cyan-400 mt-1">+ Ajouter</span>
                    </div>
                  ) : (
                    activeDayWorkouts.map((wo) => {
                      const style = getSportStyle(wo.sport, wo.status);
                      return (
                        <div
                          key={wo.id}
                          onClick={() => onSelectWorkout(wo)}
                          className={`rounded-xl border p-2.5 cursor-pointer transition ${style.border}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${style.badge}`}
                            >
                              {style.icon} {style.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWorkoutStatus(wo.id, wo.status);
                              }}
                            >
                              {wo.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-2">{wo.title}</h4>
                          <div className="text-[10px] font-mono text-slate-300 mt-1.5 flex items-center justify-between">
                            <span>{wo.durationMinutes}m</span>
                            <span className={style.text}>{wo.targetZone}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* IRONMAN-STYLE "WEEKLY TOTALS" BAR AT THE BOTTOM OF THE WEEK           */}
      {/* ===================================================================== */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Totaux de la Semaine {currentWeek.weekNumber} (Weekly Totals)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-bold text-slate-200">
            <span className="text-cyan-300">
              🏊 Nage {formatHoursDecimal(currentWeek.sportBreakdown.swimMinutes)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sky-300">
              🚴 Vélo {formatHoursDecimal(currentWeek.sportBreakdown.bikeMinutes)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300">
              🏃 Course {formatHoursDecimal(currentWeek.sportBreakdown.runMinutes)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-300">
              💪 Poids/PPG {formatHoursDecimal(currentWeek.sportBreakdown.strengthMinutes)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-white font-black">
              Total {formatHoursDecimal(currentWeek.totalDurationMinutes)} ({currentWeek.totalDistanceKm} km)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Séances complétées
            </div>
            <div className="text-sm font-black font-mono text-emerald-400">
              {completedInWeek} / {activeWorkoutsInWeek.length} (
              {activeWorkoutsInWeek.length > 0
                ? Math.round((completedInWeek / activeWorkoutsInWeek.length) * 100)
                : 0}
              %)
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* QUICK ADD WORKOUT MODAL (FOR MULTI-WORKOUT DAYS: POIDS + COURSE, ETC) */}
      {/* ===================================================================== */}
      {quickAddDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Ajouter un entraînement — {DAY_NAMES[quickAddDay - 1]}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    S'ajoute à la journée sans écraser vos autres séances du jour (Doublé)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddDay(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sport Selector Pills */}
            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { id: 'strength', label: 'Poids/PPG', icon: '💪' },
                  { id: 'run', label: 'Course', icon: '🏃' },
                  { id: 'bike', label: 'Vélo', icon: '🚴' },
                  { id: 'swim', label: 'Nage', icon: '🏊' },
                  { id: 'brick', label: 'Brique', icon: '⚡' },
                ] as { id: SportType; label: string; icon: string }[]
              ).map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setQuickAddSportFilter(sp.id)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold border flex flex-col items-center transition ${
                    quickAddSportFilter === sp.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{sp.icon}</span>
                  <span className="text-[10px] mt-0.5">{sp.label}</span>
                </button>
              ))}
            </div>

            {/* Template List for Selected Sport */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {WORKOUT_CATALOG.filter((t) => t.sport === quickAddSportFilter).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    if (onAddWorkoutToDay) {
                      onAddWorkoutToDay(quickAddDay, tpl);
                      setExpandedDays((prev) => ({ ...prev, [quickAddDay]: true }));
                      setQuickAddDay(null);
                    }
                  }}
                  className="w-full p-3 rounded-xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left transition flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition">
                      {tpl.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {tpl.shortSummary}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="text-xs font-bold text-cyan-300 block">
                      {tpl.durationMinutes} min
                    </span>
                    <span className="text-[10px] text-slate-400">{tpl.targetZone}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQuickAddDay(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* POPOVER / MODAL FOR MOVE, SWAP OR COMBINE (DOUBLÉ)                    */}
      {/* ===================================================================== */}
      {activeSwapWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Déplacer, Combiner (Doublé) ou Permuter
                </h3>
              </div>
              <button
                onClick={() => setActiveSwapWorkout(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Séance sélectionnée :</span>
              <div className="p-2.5 bg-slate-950 rounded-lg text-xs font-semibold text-white border border-slate-800">
                {activeSwapWorkout.title}
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  Jour actuel : {DAY_NAMES[activeSwapWorkout.dayOfWeek - 1]} (J
                  {activeSwapWorkout.dayOfWeek})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-cyan-300 block">
                Option A — Combiner sur un autre jour (Doublé : 2 séances le même jour) :
              </label>
              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map((name, idx) => {
                  const targetDayNum = idx + 1;
                  const isCurrent = activeSwapWorkout.dayOfWeek === targetDayNum;
                  return (
                    <button
                      key={`move-${targetDayNum}`}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        if (onSwapWorkouts) {
                          onSwapWorkouts(activeSwapWorkout.id, targetDayNum, 'move');
                          setExpandedDays((prev) => ({ ...prev, [targetDayNum]: true }));
                          setActiveSwapWorkout(null);
                        }
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center border ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-600 border-slate-800 opacity-40 cursor-not-allowed'
                          : 'bg-cyan-950/60 hover:bg-cyan-600 text-cyan-200 hover:text-white border-cyan-500/40'
                      }`}
                      title={`Ajouter à ${name} (sans écraser la séance existante)`}
                    >
                      <span className="text-[10px]">{name.substring(0, 3)}</span>
                      <span className="text-[9px] font-mono">+J{targetDayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-amber-300 block">
                Option B — Permuter (échanger) avec un autre jour :
              </label>
              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map((name, idx) => {
                  const targetDayNum = idx + 1;
                  const isCurrent = activeSwapWorkout.dayOfWeek === targetDayNum;
                  return (
                    <button
                      key={`swap-${targetDayNum}`}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        if (onSwapWorkouts) {
                          onSwapWorkouts(activeSwapWorkout.id, targetDayNum, 'swap');
                          setExpandedDays((prev) => ({ ...prev, [targetDayNum]: true }));
                          setActiveSwapWorkout(null);
                        }
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center border ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-600 border-slate-800 opacity-40 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white border-slate-700'
                      }`}
                      title={`Permuter avec ${name}`}
                    >
                      <span className="text-[10px]">{name.substring(0, 3)}</span>
                      <span className="text-[9px] font-mono">⇄J{targetDayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveSwapWorkout(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
