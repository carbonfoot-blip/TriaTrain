import React, { useState } from 'react';
import { X, Calendar, Check, Save, RotateCcw, Sparkles, Flame, Clock, Award } from 'lucide-react';
import { AthleteProfile, SportType, WeeklyDayPreference, WorkoutCategory } from '../types/triathlon';

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  onSaveSchedule: (updatedSchedule: WeeklyDayPreference[], availableDays: number[]) => void;
}

const DAY_NAMES = [
  { day: 1, name: 'Lundi', short: 'Lun' },
  { day: 2, name: 'Mardi', short: 'Mar' },
  { day: 3, name: 'Mercredi', short: 'Mer' },
  { day: 4, name: 'Jeudi', short: 'Jeu' },
  { day: 5, name: 'Vendredi', short: 'Ven' },
  { day: 6, name: 'Samedi', short: 'Sam' },
  { day: 7, name: 'Dimanche', short: 'Dim' },
];

const DEFAULT_SCHEDULE: WeeklyDayPreference[] = [
  { dayOfWeek: 1, sport: 'rest', category: 'recovery' },
  { dayOfWeek: 2, sport: 'swim', category: 'technique' },
  { dayOfWeek: 3, sport: 'bike', category: 'intervals' },
  { dayOfWeek: 4, sport: 'run', category: 'intervals' },
  { dayOfWeek: 5, sport: 'swim', category: 'endurance' },
  { dayOfWeek: 6, sport: 'bike', category: 'endurance' },
  { dayOfWeek: 7, sport: 'run', category: 'endurance' },
];

export const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveSchedule,
}) => {
  if (!isOpen) return null;

  // Initialize schedule from profile or default
  const [schedule, setSchedule] = useState<WeeklyDayPreference[]>(() => {
    const existing = profile.availability.weeklySchedule;
    if (existing && existing.length === 7) return [...existing];
    return [...DEFAULT_SCHEDULE];
  });

  const getDayPref = (day: number): WeeklyDayPreference => {
    return schedule.find((s) => s.dayOfWeek === day) || { dayOfWeek: day, sport: 'rest', category: 'recovery' };
  };

  const handleUpdateDaySport = (day: number, sport: SportType) => {
    let defaultCat: WorkoutCategory = 'endurance';
    if (sport === 'rest') defaultCat = 'recovery';
    else if (sport === 'strength') defaultCat = 'strength';
    else if (sport === 'brick') defaultCat = 'brick';
    else if (sport === 'run') defaultCat = day === 3 || day === 4 ? 'intervals' : day === 7 ? 'endurance' : 'endurance';
    else if (sport === 'bike') defaultCat = day === 3 ? 'intervals' : day === 6 ? 'endurance' : 'technique';
    else if (sport === 'swim') defaultCat = day === 2 ? 'technique' : 'endurance';

    const updated = schedule.map((s) => (s.dayOfWeek === day ? { ...s, sport, category: defaultCat } : s));
    setSchedule(updated);
  };

  const handleUpdateDayCategory = (day: number, category: WorkoutCategory) => {
    const updated = schedule.map((s) => (s.dayOfWeek === day ? { ...s, category } : s));
    setSchedule(updated);
  };

  const applyPresetExample = () => {
    // User requested example: Mercredi = Course intervalle, Mercredi & Vendredi = Natation (ou Mercredi = Run intervals, etc.)
    setSchedule([
      { dayOfWeek: 1, sport: 'rest', category: 'recovery' },
      { dayOfWeek: 2, sport: 'bike', category: 'technique' },
      { dayOfWeek: 3, sport: 'run', category: 'intervals' },     // Course à intervalle le mercredi !
      { dayOfWeek: 4, sport: 'bike', category: 'intervals' },
      { dayOfWeek: 5, sport: 'swim', category: 'threshold' },    // Natation le vendredi
      { dayOfWeek: 6, sport: 'bike', category: 'endurance' },    // Sortie longue vélo
      { dayOfWeek: 7, sport: 'run', category: 'endurance' },     // Sortie longue course
    ]);
  };

  const handleSave = () => {
    // Derive availableDays: any day that is not 'rest'
    const activeDays = schedule.filter((s) => s.sport !== 'rest').map((s) => s.dayOfWeek);
    onSaveSchedule(schedule, activeDays.length > 0 ? activeDays : [2, 3, 4, 5, 6, 7]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Planning Personnalisé de la Semaine Type
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Choisissez précisément le sport et le type de séance attribué à chaque jour de votre semaine (ex : Course à intervalles le mercredi, Natation le vendredi, etc.).
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Quick preset banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs text-slate-300">
                Vous pouvez définir votre propre routine ou charger une combinaison populaire :
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={applyPresetExample}
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold rounded-lg transition"
              >
                Modèle : Intervalles Mercredi
              </button>
              <button
                type="button"
                onClick={() => setSchedule([...DEFAULT_SCHEDULE])}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
            {DAY_NAMES.map((d) => {
              const pref = getDayPref(d.day);
              const isRest = pref.sport === 'rest';

              const getSportBadgeColor = () => {
                switch (pref.sport) {
                  case 'swim':
                    return 'bg-cyan-950 text-cyan-300 border-cyan-800';
                  case 'bike':
                    return 'bg-amber-950 text-amber-300 border-amber-800';
                  case 'run':
                    return 'bg-emerald-950 text-emerald-300 border-emerald-800';
                  case 'brick':
                    return 'bg-purple-950 text-purple-300 border-purple-800';
                  case 'strength':
                    return 'bg-indigo-950 text-indigo-300 border-indigo-800';
                  default:
                    return 'bg-slate-800 text-slate-400 border-slate-700';
                }
              };

              return (
                <div
                  key={d.day}
                  className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all ${
                    isRest
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                      : 'bg-slate-900 border-slate-700/80 shadow-md shadow-slate-950/30'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-white">{d.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getSportBadgeColor()}`}>
                        {d.short}
                      </span>
                    </div>

                    {/* Sport selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Discipline
                      </label>
                      <select
                        value={pref.sport}
                        onChange={(e) => handleUpdateDaySport(d.day, e.target.value as SportType)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="run">🏃 Course à pied</option>
                        <option value="bike">🚴 Cyclisme</option>
                        <option value="swim">🏊 Natation</option>
                        <option value="brick">⚡ Brique (Vélo+Run)</option>
                        <option value="strength">💪 PPG / Renforcement</option>
                        <option value="rest">💤 Repos complet</option>
                      </select>
                    </div>

                    {/* Category selection */}
                    {!isRest && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Type de séance
                        </label>
                        <select
                          value={pref.category || 'endurance'}
                          onChange={(e) => handleUpdateDayCategory(d.day, e.target.value as WorkoutCategory)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          {pref.sport === 'run' && (
                            <>
                              <option value="intervals">⚡ Intervalles (VMA / Courts)</option>
                              <option value="threshold">🔥 Seuil (Fractions longues)</option>
                              <option value="endurance">🏃 Endurance Fondamentale (EF)</option>
                              <option value="recovery">🌱 Récupération Active</option>
                            </>
                          )}

                          {pref.sport === 'bike' && (
                            <>
                              <option value="intervals">⚡ Intervalles SweetSpot & Seuil</option>
                              <option value="technique">🚴 Cadence & Vélocité (95-105 rpm)</option>
                              <option value="endurance">⛰️ Sortie Longue Endurance</option>
                              <option value="tempo">💨 Rythme Peloton / Tempo</option>
                              <option value="recovery">🌱 Décrassage & Récupération</option>
                            </>
                          )}

                          {pref.sport === 'swim' && (
                            <>
                              <option value="technique">🏊 Technique & Éducatifs</option>
                              <option value="threshold">🔥 Séries Seuil CSS (100m)</option>
                              <option value="endurance">🌊 Endurance Aérobie (Pull/Plaq)</option>
                              <option value="recovery">🌱 Récupération Glisse</option>
                            </>
                          )}

                          {pref.sport === 'brick' && (
                            <>
                              <option value="brick">⚡ Enchaînement Vélo + Course</option>
                            </>
                          )}

                          {pref.sport === 'strength' && (
                            <>
                              <option value="strength">💪 Gainage & Renforcement</option>
                            </>
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Summary pill at bottom */}
                  <div className="pt-3 mt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block truncate">
                      {isRest
                        ? '💤 Jour de repos'
                        : pref.sport === 'run'
                        ? pref.category === 'intervals' ? '🏃 VMA / Intervalles' : '🏃 Course endurance'
                        : pref.sport === 'bike'
                        ? pref.category === 'intervals' ? '🚴 Vélo SweetSpot' : '🚴 Vélo sortie clé'
                        : pref.sport === 'swim'
                        ? '🏊 Nage ciblée'
                        : pref.sport === 'brick'
                        ? '⚡ Brique T2'
                        : '💪 Renfo PPG'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Appliquer à tout mon programme</span>
          </button>
        </div>
      </div>
    </div>
  );
};
