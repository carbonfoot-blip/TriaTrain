import React from 'react';
import { Clock, MapPin, CheckCircle2, Circle, Flame, AlertCircle, ArrowUpRight } from 'lucide-react';
import { TrainingWeek, Workout, WorkoutStatus } from '../types/triathlon';

interface WeekCalendarProps {
  currentWeek: TrainingWeek;
  onSelectWorkout: (workout: Workout) => void;
  onToggleWorkoutStatus: (workoutId: string, currentStatus: WorkoutStatus) => void;
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  currentWeek,
  onSelectWorkout,
  onToggleWorkoutStatus,
}) => {
  const getSportStyle = (sport: string, status: WorkoutStatus) => {
    const isDone = status === 'completed';
    switch (sport) {
      case 'swim':
        return {
          border: isDone ? 'border-cyan-500/80 bg-cyan-950/40' : 'border-cyan-500/40 bg-slate-900/90 hover:border-cyan-400',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          text: 'text-cyan-400',
          icon: '🏊',
          name: 'Natation',
        };
      case 'bike':
        return {
          border: isDone ? 'border-amber-500/80 bg-amber-950/40' : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          text: 'text-amber-400',
          icon: '🚴',
          name: 'Vélo',
        };
      case 'run':
        return {
          border: isDone ? 'border-emerald-500/80 bg-emerald-950/40' : 'border-emerald-500/40 bg-slate-900/90 hover:border-emerald-400',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          text: 'text-emerald-400',
          icon: '🏃',
          name: 'Course',
        };
      case 'brick':
        return {
          border: isDone ? 'border-purple-500/80 bg-purple-950/40' : 'border-purple-500/40 bg-slate-900/90 hover:border-purple-400',
          badge: 'bg-purple-950 text-purple-300 border-purple-800',
          text: 'text-purple-400',
          icon: '⚡',
          name: 'Brique',
        };
      case 'strength':
        return {
          border: isDone ? 'border-indigo-500/80 bg-indigo-950/40' : 'border-indigo-500/40 bg-slate-900/90 hover:border-indigo-400',
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

  // Format YYYY-MM-DD to "14 Juin"
  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
      {DAY_NAMES.map((dayName, index) => {
        const dayNum = index + 1;
        const dayWorkouts = currentWeek.workouts.filter((w) => w.dayOfWeek === dayNum);
        const dayDate = dayWorkouts[0]?.date || '';

        return (
          <div
            key={dayNum}
            className="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 space-y-3 min-h-[220px]"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-200">{dayName}</span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {formatDateShort(dayDate)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">J{dayNum}</span>
            </div>

            {/* Workouts container */}
            <div className="flex-1 space-y-2.5">
              {dayWorkouts.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4 text-center">
                  <span className="text-xs text-slate-600">Repos</span>
                </div>
              ) : (
                dayWorkouts.map((wo) => {
                  const style = getSportStyle(wo.sport, wo.status);
                  const isRest = wo.sport === 'rest';

                  if (isRest) {
                    return (
                      <div
                        key={wo.id}
                        onClick={() => onSelectWorkout(wo)}
                        className="cursor-pointer p-3 rounded-xl border border-slate-800/60 bg-slate-950/40 text-center hover:bg-slate-900 transition"
                      >
                        <span className="text-lg block mb-1">💤</span>
                        <div className="text-xs font-semibold text-slate-400">Repos & Récupération</div>
                        <div className="text-[10px] text-slate-500 mt-1">Régénération musculaire</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={wo.id}
                      className={`group relative rounded-xl border p-3 transition-all cursor-pointer shadow-sm ${style.border}`}
                      onClick={() => onSelectWorkout(wo)}
                    >
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">{style.icon}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${style.badge}`}>
                            {style.name}
                          </span>
                        </div>

                        {/* Status Checkbox toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWorkoutStatus(wo.id, wo.status);
                          }}
                          className="text-slate-400 hover:text-white p-0.5 rounded transition"
                          title={wo.status === 'completed' ? 'Marquer comme non fait' : 'Marquer comme validé'}
                        >
                          {wo.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>
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

                        <span className={`font-bold ${style.text}`}>
                          {wo.targetZone}
                        </span>
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
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
