import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  Gauge,
  Flame,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Activity,
  Save,
  RefreshCw,
  Edit3,
  Plus,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
  Watch,
  Heart,
  Zap,
  TrendingUp,
  Unlink,
  Send,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AthleteProfile,
  SportType,
  Workout,
  WorkoutCategory,
  WorkoutStatus,
  WorkoutStep,
} from '../types/triathlon';
import {
  WORKOUT_CATALOG,
  WorkoutTemplate,
  instantiateWorkoutFromTemplate,
} from '../data/workoutCatalog';
import {
  buildWatchStepsForWorkout,
  downloadFitWorkoutFile,
  downloadZwoWorkoutFile,
  generateIntervalsStructuredWorkoutText,
  pushWorkoutsToWatch,
} from '../utils/workoutWatchExporter';
import { loadGarminConfig } from '../utils/garminBridge';

interface WorkoutModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateWorkout: (updated: Workout) => void;
  profile: AthleteProfile;
  onOpenGarminSync?: () => void;
}

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  workout,
  isOpen,
  onClose,
  onUpdateWorkout,
  profile,
  onOpenGarminSync,
}) => {
  // Active Tab: 'details' | 'watch' | 'replace' | 'edit'
  const [activeTab, setActiveTab] = useState<'details' | 'watch' | 'replace' | 'edit'>('details');

  // Details State
  const [status, setStatus] = useState<WorkoutStatus>(workout?.status || 'planned');
  const [completedRpe, setCompletedRpe] = useState<number>(
    workout?.completedRpe || workout?.intensityRpe || 6
  );
  const [notes, setNotes] = useState<string>(workout?.athleteNotes || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Edit State (initialized when workout changes)
  const [editTitle, setEditTitle] = useState<string>(workout?.title || '');
  const [editSport, setEditSport] = useState<SportType>(workout?.sport || 'run');
  const [editCategory, setEditCategory] = useState<WorkoutCategory>(
    workout?.category || 'endurance'
  );
  const [editDuration, setEditDuration] = useState<number>(workout?.durationMinutes || 45);
  const [editDistance, setEditDistance] = useState<number>(workout?.distanceMeters || 0);
  const [editTargetZone, setEditTargetZone] = useState<string>(workout?.targetZone || 'Z2');
  const [editIntensityRpe, setEditIntensityRpe] = useState<number>(workout?.intensityRpe || 6);
  const [editDescription, setEditDescription] = useState<string>(workout?.description || '');
  const [editSteps, setEditSteps] = useState<WorkoutStep[]>(
    workout?.steps ? [...workout.steps] : []
  );

  // Replace Tab State
  const [catalogFilterSport, setCatalogFilterSport] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Watch Preview & Push State
  const [previewStepIndex, setPreviewStepIndex] = useState<number>(0);
  const [isPushingWatch, setIsPushingWatch] = useState<boolean>(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [copiedSyntax, setCopiedSyntax] = useState<boolean>(false);

  // Reset form when workout prop changes
  useEffect(() => {
    if (workout) {
      setStatus(workout.status || 'planned');
      setCompletedRpe(workout.completedRpe || workout.intensityRpe || 6);
      setNotes(workout.athleteNotes || '');
      setEditTitle(workout.title);
      setEditSport(workout.sport);
      setEditCategory(workout.category || 'endurance');
      setEditDuration(workout.durationMinutes);
      setEditDistance(workout.distanceMeters);
      setEditTargetZone(workout.targetZone || 'Z2');
      setEditIntensityRpe(workout.intensityRpe || 6);
      setEditDescription(workout.description || '');
      setEditSteps(workout.steps ? JSON.parse(JSON.stringify(workout.steps)) : []);
      setActiveTab('details');
      setPreviewStepIndex(0);
      setPushMessage(null);
      setPushError(null);
      setCopiedSyntax(false);
    }
  }, [workout]);

  if (!isOpen || !workout) return null;

  const watchSteps = buildWatchStepsForWorkout(workout, profile);
  const currentWatchStep = watchSteps[previewStepIndex] || watchSteps[0];
  const structuredSyntaxText = generateIntervalsStructuredWorkoutText(workout, profile);

  const handleSaveDetails = () => {
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
    }, 350);
  };

  const handlePushSingleWorkoutToWatch = async () => {
    setIsPushingWatch(true);
    setPushError(null);
    setPushMessage(null);

    try {
      const config = loadGarminConfig();
      const result = await pushWorkoutsToWatch([workout], profile, config);
      onUpdateWorkout({
        ...workout,
        pushedToWatchAt: result.timestamp,
        externalEventId: `triatrain_${workout.id}`,
      });
      setPushMessage(
        result.mode === 'intervals_icu'
          ? 'Séance & éducatifs (drills) envoyés sur votre calendrier Garmin Connect / COROS via Intervals.icu !'
          : 'Séance & éducatifs (drills) programmés sur votre montre (Mode Simulation Garmin / COROS) !'
      );
      try {
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
      } catch {
        // ignore confetti error
      }
    } catch (err) {
      setPushError(
        err instanceof Error ? err.message : "Erreur lors de l'envoi vers la montre."
      );
    } finally {
      setIsPushingWatch(false);
    }
  };

  const handleCopyStructuredSyntax = () => {
    navigator.clipboard.writeText(structuredSyntaxText);
    setCopiedSyntax(true);
    setTimeout(() => setCopiedSyntax(false), 2000);
  };

  const handleApplyReplacement = (template: WorkoutTemplate) => {
    const instantiated = instantiateWorkoutFromTemplate(
      template,
      workout.weekNumber,
      workout.dayOfWeek,
      workout.date,
      profile
    );

    const updated: Workout = {
      ...instantiated,
      id: workout.id,
      status: workout.status,
      athleteNotes: workout.athleteNotes,
      completedRpe: workout.completedRpe,
      garminActivity: workout.garminActivity,
    };

    onUpdateWorkout(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('details');
    }, 300);
  };

  const handleSaveManualEdit = () => {
    const updated: Workout = {
      ...workout,
      title: editTitle,
      sport: editSport,
      category: editCategory,
      durationMinutes: editDuration,
      distanceMeters: editDistance,
      targetZone: editTargetZone,
      intensityRpe: editIntensityRpe,
      description: editDescription,
      steps: editSteps,
    };

    onUpdateWorkout(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('details');
    }, 300);
  };

  // Steps / intervals management for 'edit' tab
  const handleAddStep = () => {
    const newStep: WorkoutStep = {
      type: 'drill',
      name: `Éducatif / Intervalle ${editSteps.length + 1}`,
      durationMinutes: 8,
      targetZone: 'Z2',
      targetDescription: 'Focus technique & relâchement',
    };
    setEditSteps([...editSteps, newStep]);
  };

  const handleRemoveStep = (idx: number) => {
    setEditSteps(editSteps.filter((_, i) => i !== idx));
  };

  const handleUpdateStep = (
    idx: number,
    field: keyof WorkoutStep,
    value: WorkoutStep[keyof WorkoutStep]
  ) => {
    const updated = editSteps.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    setEditSteps(updated);
  };

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'swim':
        return {
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/30',
          text: 'text-cyan-400',
          badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-800',
          icon: '🏊',
          name: 'Natation',
        };
      case 'bike':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
          icon: '🚴',
          name: 'Cyclisme',
        };
      case 'run':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          icon: '🏃',
          name: 'Course à pied',
        };
      case 'brick':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          badgeBg: 'bg-purple-950 text-purple-300 border-purple-800',
          icon: '⚡',
          name: 'Enchaînement Brique',
        };
      case 'strength':
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/30',
          text: 'text-indigo-400',
          badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
          icon: '💪',
          name: 'Renforcement & PPG',
        };
      default:
        return {
          bg: 'bg-slate-800/40',
          border: 'border-slate-700',
          text: 'text-slate-400',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: '💤',
          name: 'Repos',
        };
    }
  };

  const colors = getSportColor(workout.sport);

  // Filter catalog
  const filteredCatalog = WORKOUT_CATALOG.filter((item) => {
    const matchesSport = catalogFilterSport === 'all' || item.sport === catalogFilterSport;
    const matchesQuery =
      !catalogSearch.trim() ||
      item.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.shortSummary.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesSport && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className={`p-6 bg-gradient-to-r ${colors.bg} border-b border-slate-800`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-2xl">{colors.icon}</span>
                <span
                  className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${colors.badgeBg}`}
                >
                  {colors.name}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Semaine {workout.weekNumber} • Jour {workout.dayOfWeek}
                </span>
                {workout.pushedToWatchAt && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    📲 Programmée sur la montre
                  </span>
                )}
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
          <div className="grid grid-cols-4 gap-2 mt-4">
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
                <span>Zone</span>
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

          {/* Action Tabs Switcher: Détails / Sur la Montre (Drills) / Changer / Modifier */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'details'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Détails & Suivi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('watch')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'watch'
                  ? 'bg-emerald-600 text-slate-950 font-extrabold shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60'
              }`}
            >
              <Watch className="w-3.5 h-3.5" />
              <span>⌚ Montre & Drills</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('replace')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'replace'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Changer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'edit'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: DETAILS & SUIVI ===================== */}
        {activeTab === 'details' && (
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-6">
            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Objectif de la séance
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                {workout.description}
              </p>
            </div>

            {/* Structured Steps Table */}
            {workout.steps && workout.steps.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Structure, Éducatifs (Drills) & Intervalles
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setActiveTab('watch')}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline"
                    >
                      ⌚ Envoyer vers Garmin / COROS
                    </button>
                    <button
                      onClick={() => setActiveTab('edit')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Personnaliser
                    </button>
                  </div>
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
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-white">{step.name}</span>
                            {step.type === 'drill' && (
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                Drill
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 font-mono mt-0.5">
                            {step.targetDescription}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            step.targetZone === 'Z4' || step.targetZone === 'Z5'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                              : step.targetZone === 'Z3'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          }`}
                        >
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

            {/* Garmin Watch Telemetry Section */}
            {workout.garminActivity ? (
              <div className="p-4 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-cyan-950/40 rounded-xl border border-emerald-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Watch className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                          Résultats Montre Garmin
                        </h3>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {workout.garminActivity.provider === 'intervals_icu'
                            ? 'Intervals.icu'
                            : workout.garminActivity.provider === 'strava'
                            ? 'Strava'
                            : 'Forerunner 965'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        {workout.garminActivity.activityName} •{' '}
                        {workout.garminActivity.deviceName || 'Garmin'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateWorkout({
                        ...workout,
                        garminActivity: undefined,
                        completedDurationMinutes: undefined,
                        completedDistanceMeters: undefined,
                      });
                    }}
                    title="Dissocier cette activité Garmin"
                    className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 transition"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Dissocier</span>
                  </button>
                </div>

                {/* Comparison Grid: Planned vs Realized */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Durée réalisée</span>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {workout.garminActivity.durationMinutes} min
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Prévu : {workout.durationMinutes} min
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Distance réelle</span>
                    <span className="text-sm font-extrabold text-cyan-400 font-mono">
                      {workout.sport === 'swim'
                        ? `${workout.garminActivity.distanceMeters} m`
                        : `${(workout.garminActivity.distanceMeters / 1000).toFixed(2)} km`}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Prévu :{' '}
                      {workout.sport === 'swim'
                        ? `${workout.distanceMeters} m`
                        : `${(workout.distanceMeters / 1000).toFixed(1)} km`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Allure / Vitesse moy.</span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      {workout.garminActivity.avgPaceOrSpeedFormatted}
                    </span>
                    {workout.garminActivity.avgCadence && (
                      <span className="text-[10px] text-slate-500 block font-mono">
                        Cadence : {workout.garminActivity.avgCadence} rpm/spm
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      <span>Cardio (Moy / Max)</span>
                    </span>
                    <span className="text-sm font-extrabold text-rose-400 font-mono">
                      {workout.garminActivity.avgHeartRate
                        ? `${workout.garminActivity.avgHeartRate} bpm`
                        : '—'}
                    </span>
                    {workout.garminActivity.maxHeartRate && (
                      <span className="text-[10px] text-slate-500 block font-mono">
                        Max : {workout.garminActivity.maxHeartRate} bpm
                      </span>
                    )}
                  </div>
                </div>

                {/* Secondary metrics row: Power, TSS, Elevation, Calories */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                  {workout.garminActivity.avgWatts && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>
                        Puissance : {workout.garminActivity.avgWatts} W
                        {workout.garminActivity.normalizedWatts
                          ? ` (NP ${workout.garminActivity.normalizedWatts} W)`
                          : ''}
                      </span>
                    </span>
                  )}
                  {workout.garminActivity.trainingLoadTss && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300 flex items-center space-x-1">
                      <Flame className="w-3 h-3 text-purple-400" />
                      <span>Charge : {workout.garminActivity.trainingLoadTss} TSS</span>
                    </span>
                  )}
                  {workout.garminActivity.elevationGainMeters !== undefined &&
                    workout.garminActivity.elevationGainMeters > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-cyan-400" />
                        <span>D+ {workout.garminActivity.elevationGainMeters} m</span>
                      </span>
                    )}
                  {workout.garminActivity.calories && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      🔥 {workout.garminActivity.calories} kcal
                    </span>
                  )}
                </div>
              </div>
            ) : (
              workout.sport !== 'rest' && (
                <div className="p-3.5 bg-slate-900/90 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <Watch className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">
                        Montre Garmin / COROS : Préparer ou Importer la sortie
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Poussez les éducatifs (drills) sur votre montre avant de partir ou récupérez vos résultats après.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('watch')}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 rounded-lg text-xs font-bold transition"
                    >
                      📤 Pousser les Drills
                    </button>
                    {onOpenGarminSync && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenGarminSync();
                        }}
                        className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 rounded-lg text-xs font-bold transition"
                      >
                        📥 Résultats
                      </button>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Validation & Feedback section */}
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/80 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Validation & Sensations Réelles</span>
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
                  <label className="block text-xs text-slate-300 mb-1">
                    Notes personnelles & Sensations
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Bonnes sensations, cardio stable, vent de face au retour..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: MONTRE GARMIN / COROS & DRILLS ===================== */}
        {activeTab === 'watch' && (
          <div className="p-6 max-h-[58vh] overflow-y-auto space-y-5">
            {/* Top Action Banner: Wireless Push + File Downloads */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/50 border border-emerald-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Watch className="w-4 h-4 text-emerald-400" />
                    <span>Envoyer les exercices (drills) dans votre montre</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Chaque bloc s'affichera sur votre Garmin ou COROS avec le nom du drill, le compte à rebours et les alertes d'allure/FC/Watts.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isPushingWatch}
                  onClick={handlePushSingleWorkoutToWatch}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isPushingWatch
                      ? 'Envoi en cours...'
                      : '📲 Pousser vers Garmin / COROS'}
                  </span>
                </button>
              </div>

              {/* Direct File Export Buttons (.FIT / .ZWO / Copy) */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => downloadFitWorkoutFile(workout, profile)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Télécharger .FIT (Garmin / COROS USB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadZwoWorkoutFile(workout, profile)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Télécharger .ZWO (Zwift / Home-Trainer)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyStructuredSyntax}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  {copiedSyntax ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Syntaxe copiée !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copier syntaxe Workout Builder</span>
                    </>
                  )}
                </button>
              </div>

              {pushMessage && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pushMessage}</span>
                </div>
              )}

              {pushError && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pushError}</span>
                </div>
              )}
            </div>

            {/* Interactive Garmin / COROS Watch Face Simulator */}
            {currentWatchStep && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {/* Round Sports Watch Screen */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="w-56 h-56 rounded-full bg-slate-950 border-[6px] border-slate-700 shadow-2xl ring-2 ring-cyan-500/30 flex flex-col items-center justify-between p-5 text-center relative overflow-hidden">
                    {/* Top Arc: Step index & Zone */}
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block">
                        ÉTAPE {currentWatchStep.stepNumber}/{watchSteps.length} •{' '}
                        {currentWatchStep.type.toUpperCase()}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          currentWatchStep.targetZone === 'Z4' ||
                          currentWatchStep.targetZone === 'Z5'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : currentWatchStep.targetZone === 'Z3'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        ZONE {currentWatchStep.targetZone}
                      </span>
                    </div>

                    {/* Center: Drill Name + Target Pace/Watts/HR */}
                    <div className="space-y-1 my-auto px-1">
                      <div className="text-xs font-extrabold text-cyan-300 leading-tight line-clamp-2">
                        {currentWatchStep.watchScreenTitle}
                      </div>
                      <div className="text-sm font-black text-white font-mono tracking-tight bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                        {currentWatchStep.watchTargetRange}
                      </div>
                      {currentWatchStep.cadenceOrStrokeCue && (
                        <div className="text-[10px] text-amber-300 font-mono">
                          {currentWatchStep.cadenceOrStrokeCue}
                        </div>
                      )}
                    </div>

                    {/* Bottom Arc: Duration / Distance Counter */}
                    <div className="border-t border-slate-800/80 pt-1.5 w-full">
                      <span className="text-[9px] text-slate-400 uppercase block">
                        Durée / Série
                      </span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {currentWatchStep.durationOrDistanceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Step Switcher Controls under watch */}
                  <div className="flex items-center space-x-3 mt-3">
                    <button
                      type="button"
                      disabled={previewStepIndex === 0}
                      onClick={() => setPreviewStepIndex(Math.max(0, previewStepIndex - 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-slate-300">
                      Aperçu Montre ({previewStepIndex + 1}/{watchSteps.length})
                    </span>
                    <button
                      type="button"
                      disabled={previewStepIndex === watchSteps.length - 1}
                      onClick={() =>
                        setPreviewStepIndex(
                          Math.min(watchSteps.length - 1, previewStepIndex + 1)
                        )
                      }
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Detailed Drill Cue & Step List */}
                <div className="md:col-span-7 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Détail des blocs & éducatifs programmés ({watchSteps.length})
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Cliquez sur un bloc pour le prévisualiser
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {watchSteps.map((step, idx) => {
                      const isSelected = idx === previewStepIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => setPreviewStepIndex(idx)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-cyan-950/50 border-cyan-500 shadow-sm'
                              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300 flex items-center justify-center font-mono">
                                {step.stepNumber}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {step.watchScreenTitle}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                              <span className="text-emerald-400 font-bold">
                                {step.durationOrDistanceLabel}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px]">
                                {step.watchTargetRange}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 pl-7">
                            {step.drillCue}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: CHANGER D'ENTRAÎNEMENT (CATALOGUE) ===================== */}
        {activeTab === 'replace' && (
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Choisir un autre entraînement de remplacement
              </h3>
              <p className="text-xs text-slate-400">
                Sélectionnez une séance clé de remplacement. Les allures cibles et zones seront automatiquement adaptées à votre profil.
              </p>
            </div>

            {/* Sport Filters & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Rechercher (ex: VMA, seuil, endurance, 1000m, technique...)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'run', label: '🏃 Course' },
                  { id: 'bike', label: '🚴 Vélo' },
                  { id: 'swim', label: '🏊 Natation' },
                  { id: 'brick', label: '⚡ Brique' },
                  { id: 'strength', label: '💪 PPG' },
                  { id: 'rest', label: '💤 Repos' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCatalogFilterSport(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      catalogFilterSport === f.id
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog List */}
            <div className="space-y-2.5 pt-2">
              {filteredCatalog.map((template) => {
                const sportColor = getSportColor(template.sport);
                return (
                  <div
                    key={template.id}
                    className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{sportColor.icon}</span>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                          {template.title}
                        </h4>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${sportColor.badgeBg}`}
                        >
                          {template.targetZone}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{template.shortSummary}</p>

                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
                        <span>⏱️ {template.durationMinutes} min</span>
                        {template.distanceMeters > 0 && (
                          <span>
                            📍{' '}
                            {template.sport === 'swim'
                              ? `${template.distanceMeters} m`
                              : `${(template.distanceMeters / 1000).toFixed(1)} km`}
                          </span>
                        )}
                        <span>🔥 RPE {template.intensityRpe}/10</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyReplacement(template)}
                      className="shrink-0 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center justify-center space-x-1"
                    >
                      <span>Appliquer</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: MODIFIER EN DÉTAIL (FORMULAIRE) ===================== */}
        {activeTab === 'edit' && (
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                Personnalisation complète de la séance & des drills
              </h3>
              <p className="text-xs text-slate-400">
                Ajustez manuellement la durée, la distance, la zone cible ou ajoutez des blocs d'éducatifs précis qui s'afficheront sur votre montre.
              </p>
            </div>

            {/* General Fields */}
            <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Titre de la séance
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Discipline</label>
                  <select
                    value={editSport}
                    onChange={(e) => setEditSport(e.target.value as SportType)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="run">🏃 Course à pied</option>
                    <option value="bike">🚴 Cyclisme</option>
                    <option value="swim">🏊 Natation</option>
                    <option value="brick">⚡ Brique</option>
                    <option value="strength">💪 PPG</option>
                    <option value="rest">💤 Repos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Distance (mètres)</label>
                  <input
                    type="number"
                    value={editDistance}
                    onChange={(e) => setEditDistance(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Zone Cible</label>
                  <select
                    value={editTargetZone}
                    onChange={(e) => setEditTargetZone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                  >
                    <option value="Z1">Z1 (Récupération)</option>
                    <option value="Z2">Z2 (Endurance Fondamentale)</option>
                    <option value="Z3">Z3 (Tempo / Allure Marathon)</option>
                    <option value="Z4">Z4 (Seuil Lactique)</option>
                    <option value="Z5">Z5 (VMA / PMA Haute)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Objectif & Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white resize-none"
                />
              </div>
            </div>

            {/* Steps & Intervals Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Structure des Intervalles & Drills ({editSteps.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un bloc / éducatif</span>
                </button>
              </div>

              <div className="space-y-2">
                {editSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => handleUpdateStep(idx, 'name', e.target.value)}
                          placeholder="Nom de l'éducatif ou intervalle (affiché sur la montre)"
                          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                      </div>

                      <select
                        value={step.targetZone}
                        onChange={(e) =>
                          handleUpdateStep(
                            idx,
                            'targetZone',
                            e.target.value as WorkoutStep['targetZone']
                          )
                        }
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                      >
                        <option value="Z1">Z1</option>
                        <option value="Z2">Z2</option>
                        <option value="Z3">Z3</option>
                        <option value="Z4">Z4</option>
                        <option value="Z5">Z5</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Supprimer ce bloc"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={step.targetDescription}
                        onChange={(e) =>
                          handleUpdateStep(idx, 'targetDescription', e.target.value)
                        }
                        placeholder="Consigne / Drill (ex: 4x1000m @ 4:50/km ou Crawl rattrapé)"
                        className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={step.durationMinutes || ''}
                          onChange={(e) =>
                            handleUpdateStep(
                              idx,
                              'durationMinutes',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          placeholder="Durée (min)"
                          className="w-1/2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white font-mono"
                        />
                        <select
                          value={step.type}
                          onChange={(e) =>
                            handleUpdateStep(idx, 'type', e.target.value as WorkoutStep['type'])
                          }
                          className="w-1/2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300"
                        >
                          <option value="warmup">Échauffement</option>
                          <option value="drill">Éducatif / Drill</option>
                          <option value="interval">Intervalle clé</option>
                          <option value="recovery">Récupération</option>
                          <option value="cooldown">Retour au calme</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Fermer
          </button>

          {activeTab === 'details' && (
            <button
              onClick={handleSaveDetails}
              className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{savedSuccess ? 'Enregistré !' : 'Enregistrer mes sensations'}</span>
            </button>
          )}

          {activeTab === 'watch' && (
            <button
              type="button"
              onClick={handlePushSingleWorkoutToWatch}
              disabled={isPushingWatch}
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-lg shadow-emerald-500/20 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer la séance vers Garmin / COROS</span>
            </button>
          )}

          {activeTab === 'replace' && (
            <span className="text-xs text-slate-400">
              Cliquez sur "Appliquer" sur une séance du catalogue ci-dessus.
            </span>
          )}

          {activeTab === 'edit' && (
            <button
              onClick={handleSaveManualEdit}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-amber-500/20 transition"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{savedSuccess ? 'Enregistré !' : 'Sauvegarder mes modifications'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
