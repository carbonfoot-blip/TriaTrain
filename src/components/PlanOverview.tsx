import React from 'react';
import { Layers, Calendar, ArrowRight, Clock, MapPin, CheckCircle, Flame, Shield } from 'lucide-react';
import { TrainingPlan, TrainingPhase } from '../types/triathlon';

interface PlanOverviewProps {
  plan: TrainingPlan;
  currentWeekIndex: number;
  onSelectWeek: (weekIndex: number) => void;
}

export const PlanOverview: React.FC<PlanOverviewProps> = ({
  plan,
  currentWeekIndex,
  onSelectWeek,
}) => {
  const getPhaseBadge = (phase: TrainingPhase) => {
    switch (phase) {
      case 'base':
        return {
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          name: 'Base / Aérobie',
          border: 'border-cyan-500/30',
        };
      case 'build':
        return {
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          name: 'Build / Seuil',
          border: 'border-amber-500/30',
        };
      case 'peak':
        return {
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          name: 'Peak / Spécifique',
          border: 'border-rose-500/30',
        };
      case 'taper':
        return {
          badge: 'bg-purple-950 text-purple-300 border-purple-800',
          name: 'Affûtage (Taper)',
          border: 'border-purple-500/30',
        };
      case 'race_week':
        return {
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800 font-bold',
          name: 'Semaine de Course',
          border: 'border-emerald-500/50',
        };
    }
  };

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m < 10 ? '0' : ''}${m}`;
  };

  // Find max weekly minutes to scale volume bars
  const maxWeeklyMinutes = Math.max(...plan.weeks.map((w) => w.totalDurationMinutes), 60);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Périodisation Globale du Plan ({plan.totalWeeks} Semaines)
            </h2>
            <p className="text-xs text-slate-400">
              Progression scientifique : de la construction aérobie jusqu'à l'affûtage pour votre Triathlon {plan.raceDistance.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Phase Legend */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {[
            { phase: 'base', label: '1. Fondation (Z2 & Volume)' },
            { phase: 'build', label: '2. Développement (Seuil & Briques)' },
            { phase: 'peak', label: '3. Spécifique (Allures Course)' },
            { phase: 'taper', label: '4. Affûtage (Fraîcheur)' },
            { phase: 'race_week', label: '5. Semaine de Course 🏆' },
          ].map((item) => {
            const style = getPhaseBadge(item.phase as TrainingPhase);
            return (
              <span
                key={item.phase}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${style.badge}`}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Week-by-week Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plan.weeks.map((week, idx) => {
          const phaseStyle = getPhaseBadge(week.phase);
          const isCurrent = idx === currentWeekIndex;
          const activeWorkouts = week.workouts.filter((w) => w.sport !== 'rest');
          const completedWorkouts = activeWorkouts.filter((w) => w.status === 'completed');
          const volumePct = Math.round((week.totalDurationMinutes / maxWeeklyMinutes) * 100);

          return (
            <div
              key={week.weekNumber}
              onClick={() => onSelectWeek(idx)}
              className={`cursor-pointer rounded-2xl p-4.5 border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${
                isCurrent
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-extrabold text-white font-mono">
                      Semaine {week.weekNumber}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold uppercase">
                        En cours
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${phaseStyle.badge}`}>
                    {phaseStyle.name}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-1">{week.phaseTitle}</p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {week.phaseDescription}
                </p>
              </div>

              {/* Volume Bar & KPIs */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatHours(week.totalDurationMinutes)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{week.totalDistanceKm} km</span>
                  </span>
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{completedWorkouts.length}/{activeWorkouts.length}</span>
                  </span>
                </div>

                {/* Progress bar of volume */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 rounded-full"
                    style={{ width: `${volumePct}%` }}
                  />
                </div>
              </div>

              {/* Sport pills */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex space-x-1 font-mono">
                  <span>🏊 {week.workouts.filter(w => w.sport === 'swim').length}</span>
                  <span>🚴 {week.workouts.filter(w => w.sport === 'bike').length}</span>
                  <span>🏃 {week.workouts.filter(w => w.sport === 'run').length}</span>
                  <span>⚡ {week.workouts.filter(w => w.sport === 'brick').length}</span>
                </div>

                <span className="flex items-center space-x-1 text-cyan-400 text-xs font-semibold group-hover:translate-x-0.5 transition">
                  <span>Ouvrir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
