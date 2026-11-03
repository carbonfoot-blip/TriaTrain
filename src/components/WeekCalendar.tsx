import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  ArrowLeftRight,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { TrainingWeek, Workout, WorkoutStatus } from '../types/triathlon';

interface WeekCalendarProps {
  currentWeek: TrainingWeek;
  onSelectWorkout: (workout: Workout) => void;
  onToggleWorkoutStatus: (workoutId: string, currentStatus: WorkoutStatus) => void;
  onSwapWorkouts?: (workoutId: string, targetDay: number, mode: 'swap' | 'move') => void;
  onAddWorkoutToDay?: (dayOfWeek: number) => void;
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
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [activeSwapWorkout, setActiveSwapWorkout] = useState<Workout | null>(null);

  const getSportStyle = (sport: string, status: WorkoutStatus) => {
    const isDone = status === 'completed';
    switch (sport) {
      case 'swim':
        return {
          border: isDone
            ? 'border-cyan-500/80 bg-cyan-950/40'
            : 'border-cyan-500/40 bg-slate-900/90 hover:border-cyan-400',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          text: 'text-cyan-400',
          icon: '🏊',
          name: 'Natation',
        };
      case 'bike':
        return {
          border: isDone
            ? 'border-amber-500/80 bg-amber-950/40'
            : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          text: 'text-amber-400',
          icon: '🚴',
          name: 'Vélo',
        };
      case 'run':
        return {
          border: isDone
            ? 'border-emerald-500/80 bg-emerald-950/40'
            : 'border-emerald-500/40 bg-slate-900/90 hover:border-emerald-400',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          text: 'text-emerald-400',
          icon: '🏃',
          name: 'Course',
        };
      case 'brick':
        return {
          border: isDone
            ? 'border-purple-500/80 bg-purple-950/40'
            : 'border-purple-500/40 bg-slate-900/90 hover:border-purple-400',
          badge: 'bg-purple-950 text-purple-300 border-purple-800',
          text: 'text-purple-400',
          icon: '⚡',
          name: 'Brique',
        };
      case 'strength':
        return {
          border: isDone
            ? 'border-indigo-500/80 bg-indigo-950/40'
            : 'border-indigo-500/40 bg-slate-900/90 hover:border-indigo-400',
          badge: 'bg-indigo-950 text-indigo-300 border-indigo-800',
          text: 'text-indigo-400',
          icon: '💪',
          name: 'PPG',
        };
      default:
        return {
          border: 'border-slate-800 bg-slate-900/40 hover:border-slate-700',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          text: 'text-slate-400',
          icon: '💤',
          name: 'Repos',
        };
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAY_NAMES.map((dayName, index) => {
          const dayNum = index + 1;
          const dayWorkouts = currentWeek.workouts.filter((w) => w.dayOfWeek === dayNum);
          const dayDate = dayWorkouts[0]?.date || '';
          const isOver = dragOverDay === dayNum;

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
              className={`flex flex-col rounded-2xl transition-all duration-200 p-3 space-y-3 min-h-[260px] ${
                isOver
                  ? 'bg-cyan-950/50 border-2 border-dashed border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/60 border border-slate-800/80'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-200">{dayName}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {formatDateShort(dayDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-500 font-mono">J{dayNum}</span>
                  {onAddWorkoutToDay && (
                    <button
                      type="button"
                      onClick={() => onAddWorkoutToDay(dayNum)}
                      title={`Ajouter un entraînement à ${dayName}`}
                      className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Workouts container */}
              <div className="flex-1 space-y-2.5">
                {dayWorkouts.length === 0 ? (
                  <div
                    onClick={() => onAddWorkoutToDay && onAddWorkoutToDay(dayNum)}
                    className="h-full min-h-[140px] flex flex-col items-center justify-center p-3 text-center rounded-xl border border-dashed border-slate-800/80 hover:border-slate-700 cursor-pointer transition group"
                  >
                    <span className="text-xl block mb-1 opacity-50 group-hover:opacity-100 transition">
                      💤
                    </span>
                    <span className="text-xs text-slate-500 group-hover:text-slate-300">Repos</span>
                    <span className="text-[10px] text-slate-600 group-hover:text-cyan-400 mt-1 flex items-center space-x-0.5">
                      <Plus className="w-3 h-3" />
                      <span>Ajouter séance</span>
                    </span>
                  </div>
                ) : (
                  dayWorkouts.map((wo) => {
                    const style = getSportStyle(wo.sport, wo.status);
                    const isRest = wo.sport === 'rest';

                    if (isRest) {
                      return (
                        <div
                          key={wo.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', wo.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="relative group p-3 rounded-xl border border-slate-800/60 bg-slate-950/40 text-center hover:bg-slate-900 transition cursor-pointer"
                          onClick={() => onSelectWorkout(wo)}
                        >
                          <span className="text-lg block mb-1">💤</span>
                          <div className="text-xs font-semibold text-slate-400">
                            Repos & Récupération
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Régénération musculaire
                          </div>

                          <div className="mt-2 flex items-center justify-center space-x-2 pt-2 border-t border-slate-800/60 opacity-0 group-hover:opacity-100 transition">
                            {onSwapWorkouts && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSwapWorkout(wo);
                                }}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>Permuter</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={wo.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', wo.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        className={`group relative rounded-xl border p-3 transition-all cursor-pointer shadow-sm ${style.border}`}
                        onClick={() => onSelectWorkout(wo)}
                      >
                        {/* Top badges & controls */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">{style.icon}</span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${style.badge}`}
                            >
                              {style.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {/* Permuter / Déplacer Button */}
                            {onSwapWorkouts && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSwapWorkout(wo);
                                }}
                                title="Permuter ou Déplacer vers un autre jour"
                                className="text-slate-500 hover:text-cyan-400 p-0.5 rounded hover:bg-slate-800 transition"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Status Checkbox toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleWorkoutStatus(wo.id, wo.status);
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded transition"
                              title={
                                wo.status === 'completed'
                                  ? 'Marquer comme non fait'
                                  : 'Marquer comme validé'
                              }
                            >
                              {wo.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Workout Title */}
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-cyan-300 transition">
                          {wo.title}
                        </h4>

                        {/* Metrics */}
                        <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono mt-2 pt-2 border-t border-slate-800/60">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{wo.durationMinutes}m</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>
                              {wo.sport === 'swim'
                                ? `${wo.distanceMeters}m`
                                : `${(wo.distanceMeters / 1000).toFixed(1)}k`}
                            </span>
                          </span>

                          <span className={`font-bold ${style.text}`}>{wo.targetZone}</span>
                        </div>

                        {/* Intensity bar */}
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2">
                          <span>RPE {wo.intensityRpe}/10</span>
                          <div className="flex space-x-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  i < Math.round(wo.intensityRpe / 2)
                                    ? 'bg-amber-400'
                                    : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Pushed to Watch (Drills Ready) Indicator */}
                        {wo.pushedToWatchAt && !wo.garminActivity && (
                          <div className="mt-2 px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 flex items-center justify-between">
                            <span>📲 Sur la montre</span>
                            <span>{wo.steps?.length || 3} drills</span>
                          </div>
                        )}

                        {/* Garmin Synced Telemetry Mini-Banner */}
                        {wo.garminActivity && (
                          <div className="mt-2 p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[9px] font-mono text-emerald-200 space-y-0.5">
                            <div className="flex items-center justify-between font-bold text-emerald-300">
                              <span>⌚ Garmin Sync</span>
                              <span>{wo.garminActivity.avgPaceOrSpeedFormatted}</span>
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-slate-300">
                              <span>
                                {wo.garminActivity.durationMinutes}m •{' '}
                                {wo.sport === 'swim'
                                  ? `${wo.garminActivity.distanceMeters}m`
                                  : `${(wo.garminActivity.distanceMeters / 1000).toFixed(1)}k`}
                              </span>
                              {wo.garminActivity.avgHeartRate && (
                                <span className="text-rose-300">
                                  ❤️ {wo.garminActivity.avgHeartRate}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Drag indicator & quick actions */}
                        <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
                          <span className="truncate">Glisser pour déplacer ⇄</span>
                          {onDeleteWorkout && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteWorkout(wo.id);
                              }}
                              className="text-slate-600 hover:text-rose-400 transition"
                              title="Transformer en repos"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
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

      {/* Popover / Modal for Swap & Move */}
      {activeSwapWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Déplacer ou Permuter</h3>
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
              <div className="p-2 bg-slate-950 rounded-lg text-xs font-semibold text-white border border-slate-800">
                {activeSwapWorkout.title}
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  Jour actuel : {DAY_NAMES[activeSwapWorkout.dayOfWeek - 1]} (J
                  {activeSwapWorkout.dayOfWeek})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Choisir le jour de destination :
              </label>
              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map((name, idx) => {
                  const targetDayNum = idx + 1;
                  const isCurrent = activeSwapWorkout.dayOfWeek === targetDayNum;
                  return (
                    <button
                      key={targetDayNum}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        if (onSwapWorkouts) {
                          onSwapWorkouts(activeSwapWorkout.id, targetDayNum, 'swap');
                          setActiveSwapWorkout(null);
                        }
                      }}
                      className={`py-2 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center ${
                        isCurrent
                          ? 'bg-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white'
                      }`}
                      title={`Permuter avec ${name}`}
                    >
                      <span className="text-[10px]">{name.substring(0, 3)}</span>
                      <span className="text-[9px] font-mono">J{targetDayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <p className="text-[11px] leading-relaxed">
                💡 En cliquant sur un jour, vous{' '}
                <strong className="text-cyan-400">permuterez (switch)</strong> automatiquement
                l'entraînement avec celui de ce jour.
              </p>
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
