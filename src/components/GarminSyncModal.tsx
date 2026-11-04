import React, { useState, useEffect } from 'react';
import {
  X,
  Watch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  Heart,
  Zap,
  Clock,
  MapPin,
  Flame,
  Link2,
  ShieldCheck,
  HelpCircle,
  Send,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Settings,
  CloudUpload,
  CloudDownload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AthleteProfile,
  GarminActivityMetrics,
  GarminBridgeConfig,
  GarminSyncProvider,
  TrainingPlan,
  TrainingWeek,
  Workout,
} from '../types/triathlon';
import {
  loadGarminConfig,
  saveGarminConfig,
  fetchIntervalsIcuActivities,
  fetchStravaActivities,
  generateDemoGarminActivities,
  matchActivitiesToWeekWorkouts,
} from '../utils/garminBridge';
import {
  buildWatchStepsForWorkout,
  downloadFitWorkoutFile,
  downloadZwoWorkoutFile,
  pushWorkoutsToWatch,
} from '../utils/workoutWatchExporter';
import {
  pushStateToIntervalsCloud,
  pullStateFromIntervalsCloud,
  TriaTrainCloudSnapshot,
} from '../utils/cloudSync';

interface GarminSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: TrainingWeek;
  profile: AthleteProfile;
  plan?: TrainingPlan;
  currentWeekIndex?: number;
  onApplySyncedActivities: (updates: { workoutId: string; activity: GarminActivityMetrics }[]) => void;
  onMarkWorkoutsPushedToWatch?: (workoutIds: string[], timestamp: string) => void;
  onOpenProfileConnections?: () => void;
  onRestoreCloudSnapshot?: (snapshot: TriaTrainCloudSnapshot) => void;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const GarminSyncModal: React.FC<GarminSyncModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  profile,
  plan,
  currentWeekIndex = 0,
  onApplySyncedActivities,
  onMarkWorkoutsPushedToWatch,
  onOpenProfileConnections,
  onRestoreCloudSnapshot,
}) => {
  // Direction Mode: 'push_to_watch' | 'pull_results'
  const [syncDirection, setSyncDirection] = useState<'push_to_watch' | 'pull_results'>(
    'push_to_watch'
  );

  const [config, setConfig] = useState<GarminBridgeConfig>(() => loadGarminConfig());
  const [showInlineConfig, setShowInlineConfig] = useState<boolean>(false);
  const [activities, setActivities] = useState<GarminActivityMetrics[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCloudBusy, setIsCloudBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Date range for fetching
  const [oldestDate, setOldestDate] = useState<string>(currentWeek.startDate);
  const [newestDate, setNewestDate] = useState<string>(currentWeek.endDate);

  useEffect(() => {
    if (isOpen) {
      const freshCfg = loadGarminConfig();
      setConfig(freshCfg);
      const isAlreadyConfigured =
        (freshCfg.provider === 'intervals_icu' && freshCfg.intervalsApiKey.trim().length > 0) ||
        (freshCfg.provider === 'strava' && freshCfg.stravaAccessToken.trim().length > 0);
      setShowInlineConfig(!isAlreadyConfigured);
      setOldestDate(currentWeek.startDate);
      setNewestDate(currentWeek.endDate);
      setErrorMsg(null);
      setSyncSuccessMsg(null);
    }
  }, [isOpen, currentWeek]);

  if (!isOpen) return null;

  const isConfigured =
    (config.provider === 'intervals_icu' && config.intervalsApiKey.trim().length > 0) ||
    (config.provider === 'strava' && config.stravaAccessToken.trim().length > 0);

  const handleProviderChange = (provider: GarminSyncProvider) => {
    const nextConfig: GarminBridgeConfig = { ...config, provider };
    setConfig(nextConfig);
    saveGarminConfig(nextConfig);
    setErrorMsg(null);
    setSyncSuccessMsg(null);
  };

  const handleConfigChange = (field: keyof GarminBridgeConfig, value: string | boolean) => {
    const nextConfig: GarminBridgeConfig = { ...config, [field]: value };
    setConfig(nextConfig);
    saveGarminConfig(nextConfig);
  };

  const applyAutoMatching = (fetched: GarminActivityMetrics[]) => {
    const suggestions = matchActivitiesToWeekWorkouts(fetched, currentWeek.workouts);
    const map: Record<string, string> = {};
    suggestions.forEach((s) => {
      if (s.matchedWorkoutId) {
        map[s.activity.externalId] = s.matchedWorkoutId;
      }
    });
    setSelectedMatches(map);
  };

  const handleFetchActivities = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSyncSuccessMsg(null);

    try {
      let fetched: GarminActivityMetrics[] = [];

      if (config.provider === 'intervals_icu') {
        fetched = await fetchIntervalsIcuActivities(config, oldestDate, newestDate);
      } else if (config.provider === 'strava') {
        fetched = await fetchStravaActivities(config, oldestDate, newestDate);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 450));
        fetched = generateDemoGarminActivities(currentWeek, profile);
      }

      const updatedCfg: GarminBridgeConfig = {
        ...config,
        lastSyncedAt: new Date().toISOString(),
      };
      setConfig(updatedCfg);
      saveGarminConfig(updatedCfg);

      setActivities(fetched);
      applyAutoMatching(fetched);

      if (fetched.length === 0) {
        setErrorMsg(
          `Aucune sortie Garmin trouvée entre le ${oldestDate} et le ${newestDate}. Vérifiez vos dates ou essayez le mode Simulation Garmin.`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la synchronisation.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushWeekToWatch = async (targetWorkouts: Workout[]) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSyncSuccessMsg(null);

    try {
      const res = await pushWorkoutsToWatch(targetWorkouts, profile, config);
      if (onMarkWorkoutsPushedToWatch) {
        onMarkWorkoutsPushedToWatch(res.pushedWorkoutIds, res.timestamp);
      }
      setSyncSuccessMsg(
        res.mode === 'intervals_icu'
          ? `${res.pushedWorkoutIds.length} séance(s) et leurs éducatifs (drills) ont été poussés vers votre calendrier Garmin Connect & COROS via Intervals.icu !`
          : `${res.pushedWorkoutIds.length} séance(s) et leurs éducatifs (drills) sont programmés sur votre montre Garmin / COROS (Mode Simulation) !`
      );
      try {
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.65 } });
      } catch {
        // ignore confetti error
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'envoi vers la montre.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCloudPush = async () => {
    if (!plan) return;
    setIsCloudBusy(true);
    setErrorMsg(null);
    setSyncSuccessMsg(null);
    try {
      const res = await pushStateToIntervalsCloud(config, profile, plan, currentWeekIndex);
      setSyncSuccessMsg(
        `☁️ Sauvegarde Cloud réussie (${new Date(res.updatedAt).toLocaleTimeString('fr-FR')}) ! Ouvrez TriaTrain sur votre PC ou iPhone et cliquez sur "Pull Cloud" pour tout retrouver.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur sauvegarde Cloud.');
    } finally {
      setIsCloudBusy(false);
    }
  };

  const handleQuickCloudPull = async () => {
    if (!onRestoreCloudSnapshot) return;
    setIsCloudBusy(true);
    setErrorMsg(null);
    setSyncSuccessMsg(null);
    try {
      const snapshot = await pullStateFromIntervalsCloud(config);
      onRestoreCloudSnapshot(snapshot);
      setSyncSuccessMsg(
        `📥 Profil, programme (${snapshot.plan.totalWeeks} sem.) et résultats restaurés depuis le Cloud !`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur récupération Cloud.');
    } finally {
      setIsCloudBusy(false);
    }
  };

  const handleApplySingle = (activity: GarminActivityMetrics) => {
    const targetWorkoutId = selectedMatches[activity.externalId];
    if (!targetWorkoutId) return;

    onApplySyncedActivities([{ workoutId: targetWorkoutId, activity }]);
    setSyncSuccessMsg(`Sortie "${activity.activityName}" associée avec succès !`);
    try {
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore confetti error
    }
  };

  const handleApplyAllMatched = () => {
    const updates: { workoutId: string; activity: GarminActivityMetrics }[] = [];
    activities.forEach((act) => {
      const targetId = selectedMatches[act.externalId];
      if (targetId) {
        updates.push({ workoutId: targetId, activity: act });
      }
    });

    if (updates.length === 0) {
      setErrorMsg('Aucune activité n’est associée à une séance de la semaine.');
      return;
    }

    onApplySyncedActivities(updates);
    setSyncSuccessMsg(
      `${updates.length} séance(s) synchronisée(s) et validée(s) avec les données de votre montre Garmin !`
    );
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
    } catch {
      // ignore confetti error
    }
  };

  const matchedCount = Object.values(selectedMatches).filter(Boolean).length;
  const availableWorkouts = currentWeek.workouts.filter((w) => w.sport !== 'rest');

  const getSportBadge = (sport: Workout['sport']) => {
    switch (sport) {
      case 'swim':
        return { icon: '🏊', label: 'Natation', cls: 'bg-cyan-950 text-cyan-300 border-cyan-800' };
      case 'bike':
        return { icon: '🚴', label: 'Vélo', cls: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'run':
        return { icon: '🏃', label: 'Course', cls: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'brick':
        return { icon: '⚡', label: 'Brique', cls: 'bg-purple-950 text-purple-300 border-purple-800' };
      default:
        return { icon: '💪', label: 'PPG', cls: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-inner">
              <Watch className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-lg font-extrabold text-white">
                  Montre Garmin / COROS & Cloud
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 hidden sm:inline">
                  Bidirectionnel
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Poussez vos séances vers la montre, importez vos sorties ou synchronisez iPhone ↔ PC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Connection Status Bar (Hides bulky API key config once configured!) */}
        <div className="px-4 sm:px-6 pt-3 bg-slate-900">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div className="text-xs">
                {config.provider === 'intervals_icu' && isConfigured ? (
                  <span className="font-bold text-emerald-300">
                    Connecté : Intervals.icu{' '}
                    <span className="text-slate-400 font-mono text-[11px]">
                      (ID: {config.intervalsAthleteId || '0'})
                    </span>
                  </span>
                ) : config.provider === 'strava' && isConfigured ? (
                  <span className="font-bold text-amber-300">Connecté : Strava API</span>
                ) : (
                  <span className="font-bold text-amber-300">
                    Mode Simulation (Configurez votre clé dans Profil pour Garmin / Cloud)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Quick Cloud Push/Pull buttons when Intervals.icu is configured */}
              {config.provider === 'intervals_icu' && isConfigured && (
                <>
                  {plan && (
                    <button
                      type="button"
                      disabled={isCloudBusy}
                      onClick={handleQuickCloudPush}
                      title="Sauvegarder mon programme et mes résultats vers le Cloud (pour les retrouver sur PC / iPhone)"
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center space-x-1 transition disabled:opacity-50"
                    >
                      <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Push Cloud</span>
                    </button>
                  )}
                  {onRestoreCloudSnapshot && (
                    <button
                      type="button"
                      disabled={isCloudBusy}
                      onClick={handleQuickCloudPull}
                      title="Récupérer mon programme et mes résultats depuis le Cloud"
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center space-x-1 transition disabled:opacity-50"
                    >
                      <CloudDownload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pull Cloud</span>
                    </button>
                  )}
                </>
              )}

              {onOpenProfileConnections ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfileConnections();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isConfigured ? 'Modifier dans Profil' : 'Configurer dans Profil'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInlineConfig(!showInlineConfig)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{showInlineConfig ? 'Masquer config' : 'Connexion'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Direction Switcher: Push Plan/Drills TO Watch vs Pull Results FROM Watch */}
        <div className="grid grid-cols-2 gap-2 px-4 sm:px-6 pt-3 bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setSyncDirection('push_to_watch');
              setErrorMsg(null);
              setSyncSuccessMsg(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 border ${
              syncDirection === 'push_to_watch'
                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span className="truncate">📤 Pousser vers Montre</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSyncDirection('pull_results');
              setErrorMsg(null);
              setSyncSuccessMsg(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 border ${
              syncDirection === 'pull_results'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
            <span className="truncate">📥 Importer Sorties</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 max-h-[68vh] overflow-y-auto space-y-4">
          {/* Collapsible Inline Config (Only shown if not configured yet or user explicitly toggled it) */}
          {showInlineConfig && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Configuration de la passerelle (Garmin / COROS)
                </label>
                {isConfigured && (
                  <button
                    type="button"
                    onClick={() => setShowInlineConfig(false)}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Masquer (déjà configuré)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleProviderChange('intervals_icu')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.provider === 'intervals_icu'
                      ? 'bg-cyan-950/60 border-cyan-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-cyan-300">⚡ Intervals.icu</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Garmin + COROS + Cloud Sync
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderChange('strava')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.provider === 'strava'
                      ? 'bg-amber-950/50 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-amber-400">🟠 Strava API</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Import de sorties</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderChange('demo')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    config.provider === 'demo'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-emerald-400">⌚ Simulation</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Test sans clé API</p>
                </button>
              </div>

              {config.provider === 'intervals_icu' && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400">
                      <Key className="w-3.5 h-3.5" />
                      <span>Identifiants Intervals.icu</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHelpGuide(!showHelpGuide)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 underline"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showHelpGuide ? 'Masquer guide' : 'Où trouver ma clé ?'}</span>
                    </button>
                  </div>

                  {showHelpGuide && (
                    <div className="p-3 bg-slate-900 rounded-lg border border-cyan-500/30 text-xs text-slate-300 space-y-1">
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>
                          Sur{' '}
                          <a
                            href="https://intervals.icu"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 underline inline-flex items-center"
                          >
                            intervals.icu <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                          , activez <strong>Garmin Connect</strong> dans <em>Settings</em>.
                        </li>
                        <li>
                          En bas de <em>Settings → Developer Settings</em>, copiez votre{' '}
                          <strong>API Key</strong>.
                        </li>
                      </ol>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        ID Athlète (<code>0</code> = auto)
                      </label>
                      <input
                        type="text"
                        value={config.intervalsAthleteId}
                        onChange={(e) => handleConfigChange('intervalsAthleteId', e.target.value)}
                        placeholder="0 ou i123456"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Clé API (API Key)
                      </label>
                      <input
                        type="password"
                        value={config.intervalsApiKey}
                        onChange={(e) => handleConfigChange('intervalsApiKey', e.target.value)}
                        placeholder="Collez votre API Key Intervals.icu..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {config.provider === 'strava' && (
                <div className="space-y-2 pt-1">
                  <label className="block text-[10px] text-slate-400">
                    Access Token Strava (scope activity:read_all)
                  </label>
                  <input
                    type="password"
                    value={config.stravaAccessToken}
                    onChange={(e) => handleConfigChange('stravaAccessToken', e.target.value)}
                    placeholder="Votre Access Token Strava..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{syncSuccessMsg}</span>
            </div>
          )}

          {/* ===================================================================== */}
          {/* DIRECTION 1: PUSH PLAN & DRILLS TO GARMIN / COROS WATCH               */}
          {/* ===================================================================== */}
          {syncDirection === 'push_to_watch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white">
                    Envoyer la Semaine {currentWeek.weekNumber} ({availableWorkouts.length} séances) vers la montre
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Chaque séance inclut ses blocs d'échauffement, éducatifs (drills), intervalles et allures cibles adaptés à votre profil.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoading || availableWorkouts.length === 0}
                  onClick={() => handlePushWeekToWatch(availableWorkouts)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                  <span>
                    {isLoading
                      ? 'Envoi vers la montre...'
                      : `📲 Pousser les ${availableWorkouts.length} séances`}
                  </span>
                </button>
              </div>

              {/* List of workouts in the current week with drill preview & individual actions */}
              <div className="space-y-2.5">
                {availableWorkouts.map((wo) => {
                  const badge = getSportBadge(wo.sport);
                  const watchSteps = buildWatchStepsForWorkout(wo, profile);
                  const isExpanded = expandedWorkoutId === wo.id;

                  return (
                    <div
                      key={wo.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center flex-wrap gap-2">
                            <span>{badge.icon}</span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}
                            >
                              {DAY_LABELS[wo.dayOfWeek - 1]} • {badge.label}
                            </span>
                            <span className="text-xs font-bold text-white">{wo.title}</span>
                            {wo.pushedToWatchAt && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                                📲 Sur la montre
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            📅 {wo.date} • ⏱️ {wo.durationMinutes} min • 🎯 {watchSteps.length} blocs / drills structurés
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedWorkoutId(isExpanded ? null : wo.id)
                            }
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition"
                          >
                            <span>{watchSteps.length} drills</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadFitWorkoutFile(wo, profile)}
                            title="Télécharger le fichier .FIT pour Garmin / COROS"
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 transition"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>.FIT</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadZwoWorkoutFile(wo, profile)}
                            title="Télécharger le fichier .ZWO pour Zwift / Home-Trainer"
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 transition"
                          >
                            <Download className="w-3 h-3 text-amber-400" />
                            <span>.ZWO</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handlePushWeekToWatch([wo])}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-[11px] font-bold transition"
                          >
                            Envoyer
                          </button>
                        </div>
                      </div>

                      {/* Expanded Watch Steps / Drills Preview */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {watchSteps.map((st) => (
                            <div
                              key={st.stepNumber}
                              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] space-y-0.5"
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-cyan-300">
                                  {st.stepNumber}. {st.watchScreenTitle}
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  {st.durationOrDistanceLabel}
                                </span>
                              </div>
                              <div className="text-slate-300 text-[10px]">{st.drillCue}</div>
                              <div className="text-[10px] font-mono text-amber-300">
                                Cible montre : {st.watchTargetRange}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* DIRECTION 2: PULL COMPLETED ACTIVITIES FROM GARMIN WATCH              */}
          {/* ===================================================================== */}
          {syncDirection === 'pull_results' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Du (Date début)</label>
                    <input
                      type="date"
                      value={oldestDate}
                      onChange={(e) => setOldestDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Au (Date fin)</label>
                    <input
                      type="date"
                      value={newestDate}
                      onChange={(e) => setNewestDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFetchActivities}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {isLoading ? 'Connexion à la montre...' : 'Récupérer mes sorties Garmin'}
                  </span>
                </button>
              </div>

              {activities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Sorties Garmin détectées ({activities.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Vérifiez l'association automatique avec vos séances prévues de la Semaine {currentWeek.weekNumber}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyAllMatched}
                      disabled={matchedCount === 0}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs rounded-lg shadow-md transition flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Tout valider ({matchedCount} séance{matchedCount > 1 ? 's' : ''})
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activities.map((act) => {
                      const badge = getSportBadge(act.sport);
                      const linkedWorkoutId = selectedMatches[act.externalId] || '';

                      return (
                        <div
                          key={act.externalId}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span>{badge.icon}</span>
                                <span
                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}
                                >
                                  {badge.label}
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {act.activityName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-2">
                                <span>📅 {act.startDateLocal}</span>
                                {act.deviceName && <span>• ⌚ {act.deviceName}</span>}
                              </div>
                            </div>

                            {/* Metric Pills */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                <span>{act.durationMinutes} min</span>
                              </span>
                              {act.distanceMeters > 0 && (
                                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 flex items-center space-x-1">
                                  <MapPin className="w-3 h-3 text-amber-400" />
                                  <span>
                                    {act.sport === 'swim'
                                      ? `${act.distanceMeters} m`
                                      : `${(act.distanceMeters / 1000).toFixed(2)} km`}
                                  </span>
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                                {act.avgPaceOrSpeedFormatted}
                              </span>
                              {act.avgHeartRate && (
                                <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 flex items-center space-x-1">
                                  <Heart className="w-3 h-3 text-rose-400" />
                                  <span>{act.avgHeartRate} bpm</span>
                                </span>
                              )}
                              {act.avgWatts && (
                                <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 flex items-center space-x-1">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>{act.avgWatts} W</span>
                                </span>
                              )}
                              {act.trainingLoadTss && (
                                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 flex items-center space-x-1">
                                  <Flame className="w-3 h-3 text-purple-400" />
                                  <span>{act.trainingLoadTss} TSS</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Target Workout Selector */}
                          <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 flex-1">
                              <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="text-[11px] text-slate-400 shrink-0">Associer à :</span>
                              <select
                                value={linkedWorkoutId}
                                onChange={(e) =>
                                  setSelectedMatches({
                                    ...selectedMatches,
                                    [act.externalId]: e.target.value,
                                  })
                                }
                                className="flex-1 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                              >
                                <option value="">— Ne pas associer —</option>
                                {availableWorkouts.map((wo) => (
                                  <option key={wo.id} value={wo.id}>
                                    {DAY_LABELS[wo.dayOfWeek - 1]} ({wo.date}) • {wo.title} (
                                    {wo.durationMinutes}m)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              disabled={!linkedWorkoutId}
                              onClick={() => handleApplySingle(act)}
                              className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg text-xs font-bold transition disabled:opacity-30 shrink-0"
                            >
                              Importer vers cette séance
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Compatible Garmin (Forerunner, Fenix, Epix) & COROS.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
