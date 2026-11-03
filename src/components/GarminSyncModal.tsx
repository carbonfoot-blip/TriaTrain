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
  Sparkles,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AthleteProfile,
  GarminActivityMetrics,
  GarminBridgeConfig,
  GarminSyncProvider,
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

interface GarminSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeek: TrainingWeek;
  profile: AthleteProfile;
  onApplySyncedActivities: (updates: { workoutId: string; activity: GarminActivityMetrics }[]) => void;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const GarminSyncModal: React.FC<GarminSyncModalProps> = ({
  isOpen,
  onClose,
  currentWeek,
  profile,
  onApplySyncedActivities,
}) => {
  const [config, setConfig] = useState<GarminBridgeConfig>(() => loadGarminConfig());
  const [activities, setActivities] = useState<GarminActivityMetrics[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  // Date range for fetching (defaults to current week start..end, or +/- 3 days margin)
  const [oldestDate, setOldestDate] = useState<string>(currentWeek.startDate);
  const [newestDate, setNewestDate] = useState<string>(currentWeek.endDate);

  useEffect(() => {
    if (isOpen) {
      setOldestDate(currentWeek.startDate);
      setNewestDate(currentWeek.endDate);
      setErrorMsg(null);
      setSyncSuccessMsg(null);
    }
  }, [isOpen, currentWeek]);

  if (!isOpen) return null;

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
        // Mode Démo Garmin Forerunner 965
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-inner">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Connexion Montre Garmin
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Pont API Direct
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Synchronisez automatiquement vos sorties Garmin (FC, Allure, Watts, Distance, TSS) avec la Semaine {currentWeek.weekNumber}
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

        {/* Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Choisir la passerelle de synchronisation Garmin
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleProviderChange('intervals_icu')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  config.provider === 'intervals_icu'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-300">⚡ Intervals.icu</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Recommandé
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pont Garmin Connect gratuit, 100 % sans serveur avec Clé API directe.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('strava')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  config.provider === 'strava'
                    ? 'bg-amber-950/50 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-400">🟠 Strava API</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    OAuth2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Récupère vos sorties Garmin synchronisées sur votre compte Strava.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('demo')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  config.provider === 'demo'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400">⌚ Simulation Garmin</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Test 1-clic
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Simule une Garmin Forerunner 965 sur vos séances de la semaine.
                </p>
              </button>
            </div>
          </div>

          {/* Configuration Panel for Selected Provider */}
          {config.provider === 'intervals_icu' && (
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                  <Key className="w-4 h-4" />
                  <span>Identifiants Intervals.icu (liés à Garmin Connect)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpGuide(!showHelpGuide)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHelpGuide ? 'Masquer le guide' : 'Comment obtenir ma clé en 60s ?'}</span>
                </button>
              </div>

              {showHelpGuide && (
                <div className="p-3 bg-slate-900 rounded-lg border border-cyan-500/30 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-white">Guide rapide (100 % gratuit) :</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                    <li>
                      Créez un compte gratuit sur{' '}
                      <a
                        href="https://intervals.icu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline inline-flex items-center space-x-0.5"
                      >
                        <span>intervals.icu</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>{' '}
                      et cochez <strong>Garmin Connect</strong> dans <em>Settings</em>.
                    </li>
                    <li>
                      Descendez tout en bas de la page <strong>Settings → Developer Settings</strong>.
                    </li>
                    <li>
                      Cliquez sur <strong>API Key (View)</strong> et copiez votre clé API ci-dessous (laissez ID Athlète à <code>0</code> ou votre ID <code>i123456</code>).
                    </li>
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    ID Athlète (<code>0</code> = automatique)
                  </label>
                  <input
                    type="text"
                    value={config.intervalsAthleteId}
                    onChange={(e) => handleConfigChange('intervalsAthleteId', e.target.value)}
                    placeholder="0 ou i123456"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Clé API Personnelle (API Key)
                  </label>
                  <input
                    type="password"
                    value={config.intervalsApiKey}
                    onChange={(e) => handleConfigChange('intervalsApiKey', e.target.value)}
                    placeholder="Collez votre API Key Intervals.icu..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {config.provider === 'strava' && (
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                  <Key className="w-4 h-4" />
                  <span>Identifiants API Strava (scope activity:read_all)</span>
                </div>
                <a
                  href="https://www.strava.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 underline"
                >
                  <span>Ouvrir strava.com/settings/api</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Access Token Strava (ou laissez vide si vous remplissez le Refresh Token ci-dessous)
                </label>
                <input
                  type="password"
                  value={config.stravaAccessToken}
                  onChange={(e) => handleConfigChange('stravaAccessToken', e.target.value)}
                  placeholder="Votre Access Token Strava..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Client ID (optionnel)</label>
                  <input
                    type="text"
                    value={config.stravaClientId || ''}
                    onChange={(e) => handleConfigChange('stravaClientId', e.target.value)}
                    placeholder="Ex: 104521"
                    className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Client Secret (optionnel)</label>
                  <input
                    type="password"
                    value={config.stravaClientSecret || ''}
                    onChange={(e) => handleConfigChange('stravaClientSecret', e.target.value)}
                    placeholder="Client Secret..."
                    className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Refresh Token (auto-renouvelé)</label>
                  <input
                    type="password"
                    value={config.stravaRefreshToken || ''}
                    onChange={(e) => handleConfigChange('stravaRefreshToken', e.target.value)}
                    placeholder="Refresh Token..."
                    className="w-full px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {config.provider === 'demo' && (
            <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-xs text-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Le mode <strong>Simulation Garmin Forerunner 965</strong> génère des sorties réalistes calées sur vos séances de la Semaine {currentWeek.weekNumber} pour tester immédiatement le suivi.
                </span>
              </div>
            </div>
          )}

          {/* Period & Fetch Action */}
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

          {/* Activities List & Workout Association */}
          {activities.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    2. Sorties Garmin détectées ({activities.length})
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
                  <span>Tout valider ({matchedCount} séance{matchedCount > 1 ? 's' : ''})</span>
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
                            <span className="text-xs font-bold text-white">{act.activityName}</span>
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
                                {DAY_LABELS[wo.dayOfWeek - 1]} ({wo.date}) • {wo.title} ({wo.durationMinutes}m)
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vos clés API restent stockées uniquement sur votre appareil (LocalStorage).</span>
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
