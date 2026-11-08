import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Brain,
  Trophy,
  Sparkles,
  Target,
  Activity,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Heart,
  Zap,
  Flame,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AthleteProfile, TrainingPlan } from '../types/triathlon';
import { WorkoutTemplate } from '../data/workoutCatalog';
import {
  analyzeTrainingProgress,
  getSuggestedTemplateById,
  markWeeklyAnalysisSeenToday,
  resolveDefaultAnalysisWeekIndex,
} from '../utils/trainingAnalyzer';

interface WeeklyCoachAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TrainingPlan;
  profile: AthleteProfile;
  currentWeekIndex: number;
  isMondayAutoPrompt?: boolean;
  onAddSuggestedWorkoutToCurrentWeek?: (
    dayOfWeek: number,
    template: WorkoutTemplate
  ) => void;
  onOpenProfileSettings?: () => void;
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const WeeklyCoachAnalysisModal: React.FC<WeeklyCoachAnalysisModalProps> = ({
  isOpen,
  onClose,
  plan,
  profile,
  currentWeekIndex,
  isMondayAutoPrompt = false,
  onAddSuggestedWorkoutToCurrentWeek,
  onOpenProfileSettings,
}) => {
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number>(() =>
    resolveDefaultAnalysisWeekIndex(plan, currentWeekIndex)
  );
  const [addedRecIds, setAddedRecIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const defIdx = resolveDefaultAnalysisWeekIndex(plan, currentWeekIndex);
      setSelectedWeekIdx(defIdx);
      setAddedRecIds({});
      markWeeklyAnalysisSeenToday();
    }
  }, [isOpen, plan, currentWeekIndex]);

  const report = useMemo(
    () => analyzeTrainingProgress(plan, profile, selectedWeekIdx),
    [plan, profile, selectedWeekIdx]
  );

  useEffect(() => {
    if (isOpen && report.mood === 'celebration') {
      try {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
      } catch {
        // ignore confetti error
      }
    }
  }, [isOpen, report.mood, report.analyzedWeekIndex]);

  if (!isOpen) return null;

  const formatHoursMin = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    return `${h}h${m < 10 ? '0' : ''}${m}`;
  };

  const getMoodBannerStyle = () => {
    switch (report.mood) {
      case 'celebration':
        return 'from-emerald-950/80 via-slate-900 to-cyan-950/70 border-emerald-500/50';
      case 'on_track':
        return 'from-cyan-950/80 via-slate-900 to-blue-950/60 border-cyan-500/50';
      case 'boost_needed':
        return 'from-amber-950/70 via-slate-900 to-indigo-950/60 border-amber-500/50';
      default:
        return 'from-slate-900 via-slate-900 to-cyan-950/50 border-slate-700';
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 82) return 'from-emerald-400 to-cyan-400 text-emerald-300';
    if (score >= 62) return 'from-cyan-400 to-blue-400 text-cyan-300';
    return 'from-amber-400 to-orange-400 text-amber-300';
  };

  const handleApplySuggestion = (recId: string, templateId?: string, dayOfWeek = 3) => {
    if (!onAddSuggestedWorkoutToCurrentWeek || !templateId) return;
    const tpl = getSuggestedTemplateById(templateId);
    if (!tpl) return;
    onAddSuggestedWorkoutToCurrentWeek(dayOfWeek, tpl);
    setAddedRecIds((prev) => ({ ...prev, [recId]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-cyan-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 shadow-inner">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-sm sm:text-lg font-extrabold text-white">
                  {isMondayAutoPrompt
                    ? '☀️ Bilan du Lundi & Conseils du Coach'
                    : '🧠 Moteur d’Analyse & Conseils Coach'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Analyse Personnalisée
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Positionnement face à votre objectif, validation du niveau et recommandations ciblées
              </p>
            </div>
          </div>

          {/* Week Switcher inside Analyzer + Close */}
          <div className="flex items-center space-x-2 ml-auto">
            <div className="flex items-center space-x-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedWeekIdx(Math.max(0, selectedWeekIdx - 1))}
                disabled={selectedWeekIdx === 0}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
                title="Analyser la semaine précédente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={selectedWeekIdx}
                onChange={(e) => setSelectedWeekIdx(parseInt(e.target.value, 10))}
                className="px-2 py-0.5 bg-transparent text-xs font-extrabold text-white font-mono focus:outline-none cursor-pointer"
              >
                {plan.weeks.map((w, idx) => (
                  <option key={w.weekNumber} value={idx} className="bg-slate-900 text-white">
                    Bilan Sem. {w.weekNumber}/{plan.totalWeeks}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setSelectedWeekIdx(Math.min(plan.totalWeeks - 1, selectedWeekIdx + 1))
                }
                disabled={selectedWeekIdx === plan.totalWeeks - 1}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
                title="Analyser la semaine suivante"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. HERO BANNER : FÉLICITATIONS / COUP DE POUCE */}
          <div
            className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${getMoodBannerStyle()} border shadow-lg space-y-3`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {report.mood === 'celebration' ? (
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                  )}
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {report.headline}
                  </h3>
                </div>
                <p className="text-xs font-semibold text-cyan-300">{report.subHeadline}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Assiduité</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {report.completedSessionsCount}/{report.plannedSessionsCount} ({report.adherencePct}%)
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Volume réalisé</span>
                  <span className="text-sm font-black font-mono text-cyan-300">
                    {formatHoursMin(report.completedDurationMinutes)} ({report.volumePct}%)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              {report.encouragementParagraph}
            </p>
          </div>

          {/* 2. POSITIONNEMENT FACE À L'OBJECTIF & NIVEAU CONFIRMÉ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                  Où vous situez-vous par rapport à votre objectif ?
                </h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 self-start sm:self-center">
                {report.objectivePositioning.statusBadge}
              </span>
            </div>

            {/* Readiness Progress Bar + Confirmed Level */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Indice de Préparation Objectif
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-r ${getReadinessColor(
                      report.objectivePositioning.readinessScore
                    )}`}
                  >
                    {report.objectivePositioning.readinessScore}%
                  </span>
                  {report.objectivePositioning.daysToRace !== null && (
                    <span className="text-xs text-slate-400 font-mono">
                      • J-{report.objectivePositioning.daysToRace}
                    </span>
                  )}
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getReadinessColor(
                      report.objectivePositioning.readinessScore
                    )}`}
                    style={{ width: `${report.objectivePositioning.readinessScore}%` }}
                  />
                </div>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400">
                    Niveau Athlète Confirmé
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Cumul : {report.objectivePositioning.cumulativeCompletedSessions} séances •{' '}
                    {report.objectivePositioning.cumulativeHoursCompleted}h
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-white">
                  {report.objectivePositioning.confirmedLevelLabel}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.objectivePositioning.summaryText}
                </p>
              </div>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800/80 text-[11px] text-slate-300 flex items-center space-x-2">
              <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{report.objectivePositioning.physiologicalHighlight}</span>
            </div>
          </div>

          {/* 3. RÉPARTITION PAR DISCIPLINE SUR LA SEMAINE ANALYSÉE */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>
                Bilan par Discipline — Semaine {report.analyzedWeekNumber} ({report.startDate} au{' '}
                {report.endDate})
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {report.sportSummaries.map((sp) => {
                const isNone = sp.status === 'none';
                const statusBadge =
                  sp.status === 'strong'
                    ? { text: '✓ Validé', cls: 'text-emerald-400 bg-emerald-950/70 border-emerald-700/50' }
                    : sp.status === 'ok'
                    ? { text: 'En cours', cls: 'text-cyan-300 bg-cyan-950/70 border-cyan-700/50' }
                    : sp.status === 'missing'
                    ? { text: 'Manquant', cls: 'text-amber-300 bg-amber-950/70 border-amber-700/50' }
                    : { text: 'Optionnel', cls: 'text-slate-500 bg-slate-900 border-slate-800' };

                return (
                  <div
                    key={sp.sport}
                    className={`p-3 rounded-xl border ${
                      isNone
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        : 'bg-slate-950/90 border-slate-800'
                    } space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1">
                        <span>{sp.icon}</span>
                        <span className="truncate">{sp.label}</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusBadge.cls}`}
                      >
                        {statusBadge.text}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-200">
                      {sp.completedSessions}/{sp.plannedSessions} séance(s)
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      ⏱️ {formatHoursMin(sp.completedMinutes)} / {formatHoursMin(sp.plannedMinutes)}
                    </div>

                    {(sp.avgHeartRate || sp.avgPowerWatts || sp.avgRpe) && (
                      <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-300">
                        {sp.avgHeartRate && (
                          <span className="text-rose-300">❤️ {sp.avgHeartRate} bpm</span>
                        )}
                        {sp.avgPowerWatts && (
                          <span className="text-amber-300">⚡ {sp.avgPowerWatts}W</span>
                        )}
                        {sp.avgRpe && <span>RPE {sp.avgRpe}/10</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. RECOMMANDATIONS CONCRÈTES DU COACH (VOLUME, INTENSITÉ, DRILLS, AJUSTEMENTS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Conseils & Ajustements Recommandés (Volume, Intensité, Drills)</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.recommendations.map((rec) => {
                const suggestedTpl = getSuggestedTemplateById(rec.suggestedTemplateId);
                const isAlreadyAdded = Boolean(addedRecIds[rec.id]);
                const borderCls =
                  rec.priority === 'high'
                    ? 'border-amber-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20'
                    : rec.priority === 'positive'
                    ? 'border-emerald-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20'
                    : 'border-cyan-500/35 bg-slate-950/90';

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-xl border ${borderCls} flex flex-col justify-between space-y-3`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-slate-800">
                          {rec.icon} {rec.categoryLabel}
                        </span>
                        {rec.priority === 'high' && (
                          <span className="text-[10px] font-bold text-amber-300 flex items-center space-x-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Prioritaire</span>
                          </span>
                        )}
                        {rec.priority === 'positive' && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Point fort</span>
                          </span>
                        )}
                      </div>

                      <h5 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                        {rec.title}
                      </h5>

                      <p className="text-xs text-slate-300 leading-relaxed">{rec.detail}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] text-cyan-200 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                        <strong className="text-cyan-400">💡 Action Coach :</strong>{' '}
                        {rec.actionableTip}
                      </div>

                      {suggestedTpl && onAddSuggestedWorkoutToCurrentWeek && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-slate-400 truncate">
                            Séance suggérée : <strong className="text-slate-200">{suggestedTpl.title}</strong>
                          </span>
                          <button
                            type="button"
                            disabled={isAlreadyAdded}
                            onClick={() =>
                              handleApplySuggestion(
                                rec.id,
                                rec.suggestedTemplateId,
                                rec.suggestedDayOfWeek || 3
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center space-x-1 shrink-0 transition ${
                              isAlreadyAdded
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm'
                            }`}
                          >
                            {isAlreadyAdded ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Ajoutée ({DAY_NAMES_SHORT[(rec.suggestedDayOfWeek || 3) - 1]}) !</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Ajouter à ma semaine</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {onOpenProfileSettings ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfileSettings();
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ajuster FC Max / FTP / Semaine Type (sans perdre mes séances)</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-lg shadow-cyan-500/20"
          >
            Compris, merci Coach !
          </button>
        </div>
      </div>
    </div>
  );
};

