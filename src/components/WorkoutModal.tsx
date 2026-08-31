import React, { useState } from 'react';
import { 
  X, Clock, MapPin, Gauge, Flame, CheckCircle, AlertCircle, 
  HelpCircle, MessageSquare, Award, ArrowRight, Activity, Save
} from 'lucide-react';
import { Workout, WorkoutStatus } from '../types/triathlon';

interface WorkoutModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateWorkout: (updated: Workout) => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  workout,
  isOpen,
  onClose,
  onUpdateWorkout,
}) => {
  if (!isOpen || !workout) return null;

  const [status, setStatus] = useState<WorkoutStatus>(workout.status || 'planned');
  const [completedRpe, setCompletedRpe] = useState<number>(workout.completedRpe || workout.intensityRpe || 6);
  const [notes, setNotes] = useState<string>(workout.athleteNotes || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    onUpdateWorkout({
      ...workout,
      status,
      completedRpe,
      athleteNotes: notes,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'swim':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          glow: 'shadow-cyan-500/10',
          gradient: 'from-cyan-500 to-blue-600',
          icon: '🏊',
          name: 'Natation',
        };
      case 'bike':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
          glow: 'shadow-amber-500/10',
          gradient: 'from-amber-500 to-orange-600',
          icon: '🚴',
          name: 'Cyclisme',
        };
      case 'run':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          glow: 'shadow-emerald-500/10',
          gradient: 'from-emerald-500 to-teal-600',
          icon: '🏃',
          name: 'Course à pied',
        };
      case 'brick':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          badgeBg: 'bg-purple-950 text-purple-300 border-purple-800',
          glow: 'shadow-purple-500/10',
          gradient: 'from-purple-500 to-pink-600',
          icon: '⚡',
          name: 'Enchaînement Brique (Vélo + Course)',
        };
      case 'strength':
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          text: 'text-indigo-400',
          badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
          glow: 'shadow-indigo-500/10',
          gradient: 'from-indigo-500 to-violet-600',
          icon: '💪',
          name: 'Renforcement & PPG',
        };
      default:
        return {
          bg: 'bg-slate-800/40',
          border: 'border-slate-700',
          text: 'text-slate-400',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          glow: 'shadow-slate-500/10',
          gradient: 'from-slate-600 to-slate-800',
          icon: '💤',
          name: 'Repos',
        };
    }
  };

  const colors = getSportColor(workout.sport);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header with sport style */}
        <div className={`p-6 bg-gradient-to-r ${colors.bg} border-b border-slate-800`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{colors.icon}</span>
                <span className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${colors.badgeBg}`}>
                  {colors.name}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Semaine {workout.weekNumber} • Jour {workout.dayOfWeek}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{workout.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Durée</span>
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">
                {workout.durationMinutes} min
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>Distance</span>
              </span>
              <span className="text-sm font-bold text-white font-mono mt-0.5">
                {workout.sport === 'swim'
                  ? `${workout.distanceMeters} m`
                  : `${(workout.distanceMeters / 1000).toFixed(1)} km`}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Gauge className="w-3 h-3" />
                <span>Zone Cible</span>
              </span>
              <span className={`text-sm font-bold font-mono mt-0.5 ${colors.text}`}>
                {workout.targetZone}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <Flame className="w-3 h-3" />
                <span>Intensité</span>
              </span>
              <span className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                {workout.intensityRpe}/10
              </span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Objectif de la séance</h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
              {workout.description}
            </p>
          </div>

          {/* Structured Steps Table */}
          {workout.steps && workout.steps.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Structure & Intervalles</h3>
                <span className="text-[11px] text-slate-400">Allures calculées sur votre profil</span>
              </div>

              <div className="space-y-2">
                {workout.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start justify-between space-x-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{step.name}</div>
                        <div className="text-xs text-slate-300 font-mono mt-0.5">{step.targetDescription}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        step.targetZone === 'Z4' || step.targetZone === 'Z5'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : step.targetZone === 'Z3'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      }`}>
                        {step.targetZone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach Advice */}
          {workout.coachTips && workout.coachTips.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-cyan-950/40 to-slate-900 rounded-xl border border-cyan-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                <HelpCircle className="w-4 h-4" />
                <span>Conseils du Coach TriaTrain</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                {workout.coachTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Athlete Completion & Feedback section */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Suivi & Validation de Séance</span>
            </h3>

            {/* Status switcher */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'planned', label: 'À faire', color: 'bg-slate-800 text-slate-300 border-slate-700' },
                { id: 'completed', label: '✅ Validée', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-600' },
                { id: 'partial', label: '⚠️ Adaptée', color: 'bg-amber-950/80 text-amber-300 border-amber-600' },
                { id: 'skipped', label: '❌ Manquée', color: 'bg-rose-950/80 text-rose-300 border-rose-600' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as WorkoutStatus)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                    status === s.id
                      ? `${s.color} ring-2 ring-cyan-500 shadow-md`
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* RPE & Notes */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Effort ressenti réel (RPE) :</span>
                  <span className="font-bold text-amber-400 font-mono">{completedRpe} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={completedRpe}
                  onChange={(e) => setCompletedRpe(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Notes personnelles & Sensations</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Excellentes sensations sur les séries au seuil, vent de face dans la bosse, bonne hydratation..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Fermer
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{savedSuccess ? 'Enregistré !' : 'Enregistrer mes sensations'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
