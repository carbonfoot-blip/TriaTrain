import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Download,
  Upload,
  Layers,
  Heart,
  Calendar,
  Watch,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import {
  AthleteProfile,
  GarminBridgeConfig,
  GarminSyncProvider,
  RaceDistance,
  SportType,
  TargetSport,
  TrainingPlan,
  WorkoutCategory,
} from '../types/triathlon';
import { estimateMaxHR } from '../utils/zonesCalculator';
import { getMondayOfWeek, getStartDatePresets } from '../utils/planGenerator';
import { loadGarminConfig, saveGarminConfig } from '../utils/garminBridge';
import {
  getLastCloudSyncTimestamp,
  pullStateFromIntervalsCloud,
  pushStateToIntervalsCloud,
  TriaTrainCloudSnapshot,
} from '../utils/cloudSync';

export type ProfileTabSection = 'objective' | 'physio' | 'schedule' | 'connections';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  plan: TrainingPlan;
  currentWeekIndex: number;
  initialSection?: ProfileTabSection;
  onSaveProfile: (profile: AthleteProfile) => void;
  onRestoreCloudSnapshot?: (snapshot: TriaTrainCloudSnapshot) => void;
  onOpenOnboarding?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  isOpen,
  onClose,
  profile: initialProfile,
  plan,
  currentWeekIndex,
  initialSection = 'objective',
  onSaveProfile,
  onRestoreCloudSnapshot,
  onOpenOnboarding,
}) => {
  const [activeSection, setActiveSection] = useState<ProfileTabSection>(initialSection);
  const [profile, setProfile] = useState<AthleteProfile>(initialProfile);
  const [garminConfig, setGarminConfig] = useState<GarminBridgeConfig>(() => loadGarminConfig());
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Cloud sync states
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [cloudMsg, setCloudMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(() =>
    getLastCloudSyncTimestamp()
  );

  useEffect(() => {
    if (isOpen) {
      setProfile(initialProfile);
      setGarminConfig(loadGarminConfig());
      setActiveSection(initialSection);
      setCloudMsg(null);
      setLastCloudSync(getLastCloudSyncTimestamp());
    }
  }, [isOpen, initialProfile, initialSection]);

  if (!isOpen) return null;

  const parseNumberInput = (val: string): number => {
    if (val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const handleGarminFieldChange = (field: keyof GarminBridgeConfig, value: string | boolean) => {
    const updated: GarminBridgeConfig = {
      ...garminConfig,
      [field]: value,
    };
    setGarminConfig(updated);
    saveGarminConfig(updated);
  };

  const handleProviderChange = (provider: GarminSyncProvider) => {
    const updated: GarminBridgeConfig = {
      ...garminConfig,
      provider,
    };
    setGarminConfig(updated);
    saveGarminConfig(updated);
  };

  const handleSportChange = (sport: TargetSport) => {
    let defaultDist: RaceDistance = 'm';
    let defaultName = 'Triathlon Olympique M';

    if (sport === 'run') {
      defaultDist = 'run_marathon';
      defaultName = 'Marathon (42.195 km)';
    } else if (sport === 'bike') {
      defaultDist = 'bike_135k';
      defaultName = 'Défi Pierre Lavoie (135 km)';
    } else if (sport === 'swim') {
      defaultDist = 'swim_3k';
      defaultName = 'Nage Eau Libre 3 000m';
    }

    setProfile({
      ...profile,
      targetSport: sport,
      raceObjective: {
        ...profile.raceObjective,
        sport,
        distance: defaultDist,
        raceName: defaultName,
      },
    });
  };

  const handleAutoCalcHR = () => {
    const estimated = estimateMaxHR(profile.age || 30);
    setProfile({
      ...profile,
      hrMax: estimated,
    });
  };

  const handleSave = () => {
    saveGarminConfig(garminConfig);
    const sanitized: AthleteProfile = {
      ...profile,
      age: profile.age || 30,
      weightKg: profile.weightKg || 70,
      heightCm: profile.heightCm || 175,
      hrRest: profile.hrRest || 55,
      hrMax: profile.hrMax || estimateMaxHR(profile.age || 30),
      bikeMetrics: {
        ...profile.bikeMetrics,
        ftpWatts: profile.bikeMetrics.ftpWatts || 200,
        avgZ2SpeedKmh: profile.bikeMetrics.avgZ2SpeedKmh || 26,
      },
    };
    onSaveProfile(sanitized);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 350);
  };

  const handleCloudPush = async () => {
    setIsCloudLoading(true);
    setCloudMsg(null);
    try {
      saveGarminConfig(garminConfig);
      const res = await pushStateToIntervalsCloud(
        garminConfig,
        profile,
        plan,
        currentWeekIndex
      );
      setLastCloudSync(res.updatedAt);
      setCloudMsg({
        type: 'success',
        text: `Sauvegarde Cloud réussie ! Vous pouvez maintenant ouvrir TriaTrain sur votre PC (ou iPhone) et cliquer sur "Récupérer (Pull)".`,
      });
    } catch (err: unknown) {
      setCloudMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde Cloud.',
      });
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleCloudPull = async () => {
    setIsCloudLoading(true);
    setCloudMsg(null);
    try {
      saveGarminConfig(garminConfig);
      const snapshot = await pullStateFromIntervalsCloud(garminConfig);
      setProfile(snapshot.profile);
      setLastCloudSync(snapshot.updatedAt);
      if (onRestoreCloudSnapshot) {
        onRestoreCloudSnapshot(snapshot);
      }
      const completedCount = snapshot.plan.weeks.reduce(
        (acc, w) => acc + w.workouts.filter((wo) => wo.status === 'completed').length,
        0
      );
      setCloudMsg({
        type: 'success',
        text: `Données Cloud restaurées (${snapshot.profile.name} • ${snapshot.plan.totalWeeks} semaines • ${completedCount} séances complétées) !`,
      });
    } catch (err: unknown) {
      setCloudMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de la récupération Cloud.',
      });
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleExportFullJson = () => {
    const fullBackup: TriaTrainCloudSnapshot = {
      version: 1,
      updatedAt: new Date().toISOString(),
      currentWeekIndex,
      profile,
      plan,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute(
      'download',
      `TriaTrain_Backup_${profile.name.replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleImportFullJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.profile && parsed.plan && onRestoreCloudSnapshot) {
          setProfile(parsed.profile);
          onRestoreCloudSnapshot(parsed as TriaTrainCloudSnapshot);
          setCloudMsg({
            type: 'success',
            text: 'Sauvegarde complète (Profil + Programme + Résultats) importée avec succès !',
          });
        } else if (parsed && parsed.runMetrics && parsed.bikeMetrics) {
          setProfile(parsed as AthleteProfile);
          setCloudMsg({
            type: 'success',
            text: 'Profil importé ! Cliquez sur "Enregistrer le profil" en bas.',
          });
        }
      } catch {
        alert('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  const isIntervalsConfigured = Boolean(garminConfig.intervalsApiKey.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-t sm:border border-slate-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Profil, Réglages & Connexions Cloud
              </h3>
              <p className="text-[11px] text-slate-400">
                Tout votre setup centralisé (Objectif, Allures, Montre Garmin & Sync iPhone ↔ PC)
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

        {/* Section Navigation Tabs (Mobile-Friendly 4 Tabs) */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('objective')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 ${
              activeSection === 'objective'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mb-0.5 sm:mb-0" />
            <span>Objectif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('physio')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 ${
              activeSection === 'physio'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 mb-0.5 sm:mb-0" />
            <span>FC & Allures</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('schedule')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 ${
              activeSection === 'schedule'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mb-0.5 sm:mb-0" />
            <span>Semaine Type</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('connections')}
            className={`relative py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 ${
              activeSection === 'connections'
                ? 'bg-purple-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Watch className="w-3.5 h-3.5 mb-0.5 sm:mb-0" />
            <span>Montre & Cloud</span>
            {isIntervalsConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-2" />
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* ========================================================= */}
          {/* TAB 1: OBJECTIF & DATES                                   */}
          {/* ========================================================= */}
          {activeSection === 'objective' && (
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Discipline Cible & Format</span>
                  </h4>
                  {onOpenOnboarding && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenOnboarding();
                      }}
                      className="flex items-center space-x-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 px-2.5 py-1 rounded-lg border border-cyan-800/60 transition"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Assistant Nouveau Plan</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'triathlon', label: '🏊🚴🏃 Triathlon' },
                    { id: 'run', label: '🏃 Course' },
                    { id: 'bike', label: '🚴 Cyclisme' },
                    { id: 'swim', label: '🏊 Natation' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSportChange(s.id as TargetSport)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition text-center ${
                        profile.targetSport === s.id
                          ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Format de course</label>
                    <select
                      value={profile.raceObjective.distance}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          raceObjective: {
                            ...profile.raceObjective,
                            distance: e.target.value as RaceDistance,
                          },
                        })
                      }
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-medium"
                    >
                      {profile.targetSport === 'run' ? (
                        <>
                          <option value="run_5k">5 KM</option>
                          <option value="run_10k">10 KM</option>
                          <option value="run_semi">Semi-Marathon (21.1 km)</option>
                          <option value="run_marathon">Marathon (42.195 km)</option>
                          <option value="run_trail">Trail & Dénivelé (~30 km)</option>
                        </>
                      ) : profile.targetSport === 'bike' ? (
                        <>
                          <option value="bike_50k">50 KM (Rythmée)</option>
                          <option value="bike_90k">90 KM (Gran Fondo)</option>
                          <option value="bike_135k">135 KM (Défi Pierre Lavoie)</option>
                          <option value="bike_century">160 KM (100 Miles / Century)</option>
                          <option value="bike_200k">200 KM+ (Ultra-Cyclisme)</option>
                        </>
                      ) : profile.targetSport === 'swim' ? (
                        <>
                          <option value="swim_1500m">1 500 M Eau Libre</option>
                          <option value="swim_3k">3 000 M (3 KM)</option>
                          <option value="swim_5k">5 000 M (5 KM)</option>
                        </>
                      ) : (
                        <>
                          <option value="xs">Triathlon XS (Découverte)</option>
                          <option value="s">Triathlon S (Sprint)</option>
                          <option value="m">Triathlon M (Olympique)</option>
                          <option value="l">Triathlon L (Half 70.3)</option>
                          <option value="xl">Triathlon XL (Ironman 140.6)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nom de l'épreuve</label>
                    <input
                      type="text"
                      value={profile.raceObjective.raceName || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          raceObjective: { ...profile.raceObjective, raceName: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      placeholder="Ex: Marathon ou Défi Pierre Lavoie"
                    />
                  </div>
                </div>

                {/* Dates: Start Date of Week 1 & Race Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-cyan-300 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Date de début du programme (Semaine 1)</span>
                    </label>
                    <input
                      type="date"
                      value={profile.raceObjective.startDate || getMondayOfWeek()}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          raceObjective: {
                            ...profile.raceObjective,
                            startDate: e.target.value
                              ? getMondayOfWeek(e.target.value)
                              : getMondayOfWeek(),
                          },
                        })
                      }
                      className="w-full px-2.5 py-2 bg-slate-900 border border-cyan-500/40 rounded-lg text-white text-xs font-mono"
                    />
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {getStartDatePresets().map((preset) => {
                        const currentStart = getMondayOfWeek(profile.raceObjective.startDate);
                        const isActive = currentStart === preset.date;
                        return (
                          <button
                            key={preset.date}
                            type="button"
                            onClick={() =>
                              setProfile({
                                ...profile,
                                raceObjective: {
                                  ...profile.raceObjective,
                                  startDate: preset.date,
                                },
                              })
                            }
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition border ${
                              isActive
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-amber-300">
                      Date de la Course / Objectif
                    </label>
                    <input
                      type="date"
                      value={profile.raceObjective.raceDate || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          raceObjective: { ...profile.raceObjective, raceDate: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      Semaine 1 alignée sur le Lundi ({getMondayOfWeek(profile.raceObjective.startDate)}).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PHYSIO, FC & ALLURES                               */}
          {/* ========================================================= */}
          {activeSection === 'physio' && (
            <div className="space-y-4">
              {/* Athlete Info */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Identité & Biométrie
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Prénom / Nom</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Âge</label>
                    <input
                      type="number"
                      value={profile.age === 0 ? '' : profile.age}
                      onChange={(e) =>
                        setProfile({ ...profile, age: parseNumberInput(e.target.value) })
                      }
                      placeholder="30"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Poids (kg)</label>
                    <input
                      type="number"
                      value={profile.weightKg === 0 ? '' : profile.weightKg}
                      onChange={(e) =>
                        setProfile({ ...profile, weightKg: parseNumberInput(e.target.value) })
                      }
                      placeholder="70"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Taille (cm)</label>
                    <input
                      type="number"
                      value={profile.heightCm === 0 ? '' : profile.heightCm}
                      onChange={(e) =>
                        setProfile({ ...profile, heightCm: parseNumberInput(e.target.value) })
                      }
                      placeholder="175"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Heart Rate Calibration */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Heart className="w-4 h-4" />
                    <span>Fréquence Cardiaque (FC Repos & FC Max)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAutoCalcHR}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Estimer ({estimateMaxHR(profile.age || 30)} bpm)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      FC au Repos (bpm)
                    </label>
                    <input
                      type="number"
                      value={profile.hrRest === 0 ? '' : profile.hrRest}
                      onChange={(e) =>
                        setProfile({ ...profile, hrRest: parseNumberInput(e.target.value) })
                      }
                      placeholder="54"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      FC Maximale (bpm)
                    </label>
                    <input
                      type="number"
                      value={profile.hrMax === 0 ? '' : profile.hrMax}
                      onChange={(e) =>
                        setProfile({ ...profile, hrMax: parseNumberInput(e.target.value) })
                      }
                      placeholder="186"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Running Paces */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  🏃 Allures Course à Pied (min/km)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Allure EF (Z2)</label>
                    <input
                      type="text"
                      value={profile.runMetrics.efPaceMinKm || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          runMetrics: { ...profile.runMetrics, efPaceMinKm: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Allure Seuil (Z4)
                    </label>
                    <input
                      type="text"
                      value={profile.runMetrics.thresholdPaceMinKm || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          runMetrics: {
                            ...profile.runMetrics,
                            thresholdPaceMinKm: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Allure Marathon (Z3)
                    </label>
                    <input
                      type="text"
                      value={profile.runMetrics.marathonPaceMinKm || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          runMetrics: {
                            ...profile.runMetrics,
                            marathonPaceMinKm: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Allure VMA (Z5)</label>
                    <input
                      type="text"
                      value={profile.runMetrics.vmaPaceMinKm || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          runMetrics: { ...profile.runMetrics, vmaPaceMinKm: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Bike & Swim */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  🚴 Cyclisme & 🏊 Natation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">FTP Vélo (Watts)</label>
                    <input
                      type="number"
                      value={profile.bikeMetrics.ftpWatts === 0 ? '' : profile.bikeMetrics.ftpWatts}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          bikeMetrics: {
                            ...profile.bikeMetrics,
                            ftpWatts: parseNumberInput(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Vitesse Z2 plat (km/h)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={
                        profile.bikeMetrics.avgZ2SpeedKmh === 0
                          ? ''
                          : profile.bikeMetrics.avgZ2SpeedKmh
                      }
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          bikeMetrics: {
                            ...profile.bikeMetrics,
                            avgZ2SpeedKmh: parseNumberInput(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      CSS Natation (mm:ss/100m)
                    </label>
                    <input
                      type="text"
                      value={profile.swimMetrics.cssPacePer100m || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          swimMetrics: {
                            ...profile.swimMetrics,
                            cssPacePer100m: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SEMAINE TYPE (JOURS DE SPORT)                      */}
          {/* ========================================================= */}
          {activeSection === 'schedule' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>📅 Organisation de votre Semaine Type</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Choisissez quel sport placer sur chaque jour de la semaine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {[
                    { day: 1, name: 'Lundi' },
                    { day: 2, name: 'Mardi' },
                    { day: 3, name: 'Mercredi' },
                    { day: 4, name: 'Jeudi' },
                    { day: 5, name: 'Vendredi' },
                    { day: 6, name: 'Samedi' },
                    { day: 7, name: 'Dimanche' },
                  ].map((d) => {
                    const currentSched = profile.availability.weeklySchedule || [
                      { dayOfWeek: 1, sport: 'rest', category: 'recovery' },
                      { dayOfWeek: 2, sport: 'swim', category: 'technique' },
                      { dayOfWeek: 3, sport: 'bike', category: 'intervals' },
                      { dayOfWeek: 4, sport: 'run', category: 'intervals' },
                      { dayOfWeek: 5, sport: 'swim', category: 'endurance' },
                      { dayOfWeek: 6, sport: 'bike', category: 'endurance' },
                      { dayOfWeek: 7, sport: 'run', category: 'endurance' },
                    ];
                    const dayPref = currentSched.find((s) => s.dayOfWeek === d.day) || {
                      dayOfWeek: d.day,
                      sport: 'rest' as SportType,
                      category: 'recovery' as WorkoutCategory,
                    };

                    return (
                      <div
                        key={d.day}
                        className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex sm:flex-col items-center justify-between gap-2"
                      >
                        <span className="text-xs font-bold text-white sm:border-b sm:border-slate-800 sm:pb-1 sm:w-full sm:text-center w-24 shrink-0">
                          {d.name}
                        </span>
                        <div className="flex sm:flex-col gap-1.5 flex-1 w-full">
                          <select
                            value={dayPref.sport}
                            onChange={(e) => {
                              const newSport = e.target.value as SportType;
                              let newCat: WorkoutCategory = 'endurance';
                              if (newSport === 'rest') newCat = 'recovery';
                              else if (newSport === 'strength') newCat = 'strength';
                              else if (newSport === 'brick') newCat = 'brick';
                              else if (newSport === 'run')
                                newCat = d.day === 3 || d.day === 4 ? 'intervals' : 'endurance';
                              else if (newSport === 'bike')
                                newCat = d.day === 3 ? 'intervals' : 'endurance';
                              else if (newSport === 'swim')
                                newCat = d.day === 2 ? 'technique' : 'endurance';

                              const updatedSched = currentSched.map((s) =>
                                s.dayOfWeek === d.day
                                  ? { ...s, sport: newSport, category: newCat }
                                  : s
                              );
                              setProfile({
                                ...profile,
                                availability: {
                                  ...profile.availability,
                                  weeklySchedule: updatedSched,
                                  availableDays: updatedSched
                                    .filter((s) => s.sport !== 'rest')
                                    .map((s) => s.dayOfWeek),
                                },
                              });
                            }}
                            className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          >
                            <option value="run">🏃 Course</option>
                            <option value="bike">🚴 Vélo</option>
                            <option value="swim">🏊 Nage</option>
                            <option value="brick">⚡ Brique</option>
                            <option value="strength">💪 PPG</option>
                            <option value="rest">💤 Repos</option>
                          </select>

                          {dayPref.sport !== 'rest' && (
                            <select
                              value={dayPref.category || 'endurance'}
                              onChange={(e) => {
                                const newCat = e.target.value as WorkoutCategory;
                                const updatedSched = currentSched.map((s) =>
                                  s.dayOfWeek === d.day ? { ...s, category: newCat } : s
                                );
                                setProfile({
                                  ...profile,
                                  availability: {
                                    ...profile.availability,
                                    weeklySchedule: updatedSched,
                                  },
                                });
                              }}
                              className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300"
                            >
                              {dayPref.sport === 'run' && (
                                <>
                                  <option value="intervals">Intervalles</option>
                                  <option value="threshold">Seuil</option>
                                  <option value="endurance">Endurance</option>
                                  <option value="recovery">Récup</option>
                                </>
                              )}
                              {dayPref.sport === 'bike' && (
                                <>
                                  <option value="intervals">SweetSpot</option>
                                  <option value="technique">Cadence</option>
                                  <option value="endurance">Sortie Longue</option>
                                  <option value="tempo">Tempo</option>
                                  <option value="recovery">Récup</option>
                                </>
                              )}
                              {dayPref.sport === 'swim' && (
                                <>
                                  <option value="technique">Technique</option>
                                  <option value="threshold">Seuil CSS</option>
                                  <option value="endurance">Aérobie</option>
                                  <option value="recovery">Récup</option>
                                </>
                              )}
                              {dayPref.sport === 'brick' && <option value="brick">Brique</option>}
                              {dayPref.sport === 'strength' && (
                                <option value="strength">Poids / PPG</option>
                              )}
                            </select>
                          )}

                          {dayPref.sport !== 'rest' && (
                            <select
                              value={dayPref.secondarySport || 'rest'}
                              onChange={(e) => {
                                const secVal = e.target.value as SportType;
                                const updatedSched = currentSched.map((s) =>
                                  s.dayOfWeek === d.day
                                    ? {
                                        ...s,
                                        secondarySport: secVal === 'rest' ? undefined : secVal,
                                      }
                                    : s
                                );
                                setProfile({
                                  ...profile,
                                  availability: {
                                    ...profile.availability,
                                    weeklySchedule: updatedSched,
                                  },
                                });
                              }}
                              title="Ajouter un 2e entraînement ce même jour (Doublé : ex. Poids + Course)"
                              className="w-full p-1.5 bg-slate-950 border border-indigo-500/40 rounded-lg text-[10px] text-indigo-300 font-semibold"
                            >
                              <option value="rest">+ 2e séance (Aucune)</option>
                              <option value="strength">+ 💪 Poids / PPG</option>
                              <option value="run">+ 🏃 Course</option>
                              <option value="bike">+ 🚴 Vélo</option>
                              <option value="swim">+ 🏊 Nage</option>
                            </select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MONTRE GARMIN & SYNCHRONISATION CLOUD (iPhone ↔ PC)*/}
          {/* ========================================================= */}
          {activeSection === 'connections' && (
            <div className="space-y-4">
              {/* 1. Configuration Garmin / Intervals.icu */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      1. Identifiants Montre & Cloud (Intervals.icu / Garmin)
                    </h4>
                  </div>
                  {isIntervalsConfigured ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      🟢 Configuré
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60">
                      À configurer
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Configurez votre clé une seule fois ici : elle sert à <strong>envoyer vos séances vers Garmin Connect</strong>, <strong>importer vos activités réalisées</strong> et <strong>synchroniser votre compte entre votre iPhone et votre PC</strong>.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'intervals_icu', label: '🏆 Intervals.icu' },
                    { id: 'strava', label: '🧡 Strava API' },
                    { id: 'demo_garmin', label: '🧪 Mode Démo' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id as GarminSyncProvider)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border transition ${
                        garminConfig.provider === p.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {garminConfig.provider === 'intervals_icu' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        ID Athlète (ou 0)
                      </label>
                      <input
                        type="text"
                        value={garminConfig.intervalsAthleteId}
                        onChange={(e) =>
                          handleGarminFieldChange('intervalsAthleteId', e.target.value)
                        }
                        placeholder="0 ou i524854"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400">
                          Clé API Personnelle (API Key)
                        </label>
                        <a
                          href="https://intervals.icu/settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
                        >
                          <span>intervals.icu/settings</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <input
                        type="password"
                        value={garminConfig.intervalsApiKey}
                        onChange={(e) =>
                          handleGarminFieldChange('intervalsApiKey', e.target.value)
                        }
                        placeholder="Collez votre API Key Intervals.icu..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {garminConfig.provider === 'strava' && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] text-slate-400">
                      Access Token Strava
                    </label>
                    <input
                      type="password"
                      value={garminConfig.stravaAccessToken}
                      onChange={(e) =>
                        handleGarminFieldChange('stravaAccessToken', e.target.value)
                      }
                      placeholder="Votre Access Token Strava..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* 2. Synchronisation Cloud Multi-Appareils (iPhone <-> PC) */}
              <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 rounded-xl border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      2. Synchronisation Multi-Appareils (iPhone ↔ PC)
                    </h4>
                  </div>
                  {lastCloudSync && (
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800/60">
                      Sync : {new Date(lastCloudSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Grâce à votre <strong>ID + Clé API Intervals.icu</strong>, sauvegardez tout votre compte depuis votre iPhone (Profil, Programme complet, Dates, Séances complétées et Résultats Garmin), puis récupérez-le en 1 clic sur votre PC !
                </p>

                {cloudMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                      cloudMsg.type === 'success'
                        ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {cloudMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span>{cloudMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isCloudLoading || !isIntervalsConfigured}
                    onClick={handleCloudPush}
                    className="py-2.5 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-40"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>
                      {isCloudLoading
                        ? 'Synchronisation...'
                        : '☁️ Sauvegarder vers le Cloud (Push)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isCloudLoading || !isIntervalsConfigured}
                    onClick={handleCloudPull}
                    className="py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-40"
                  >
                    <CloudDownload className="w-4 h-4" />
                    <span>
                      {isCloudLoading
                        ? 'Chargement...'
                        : '📥 Récupérer sur cet appareil (Pull)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Sauvegarde locale Fichier JSON Complet */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                <span>Fichier de sauvegarde complet (Profil + Plan + Résultats)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleExportFullJson}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Exporter .JSON</span>
                  </button>

                  <label className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Importer .JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFullJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Fermer
          </button>

          {activeSection === 'connections' ? (
            <button
              onClick={() => {
                saveGarminConfig(garminConfig);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/30 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider les connexions</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/30 transition"
            >
              <Save className="w-4 h-4" />
              <span>{saveToast ? 'Sauvegardé !' : 'Appliquer et recalculer le plan'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
