import React, { useState } from 'react';
import { 
  X, Check, Sparkles, ChevronRight, ChevronLeft, 
  Activity, Heart, Flame, Shield, Award, Calendar, 
  Clock, Gauge, Zap, HelpCircle, Dumbbell, Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AthleteProfile, RaceDistance, RaceGoal, ExperienceLevel, TargetSport } from '../types/triathlon';
import { estimateMaxHR, extrapolateRunPaces } from '../utils/zonesCalculator';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: AthleteProfile;
  onSaveProfile: (profile: AthleteProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [step, setStep] = useState<number>(1);
  const [profile, setProfile] = useState<AthleteProfile>(currentProfile);

  // Helper for run paces
  const [runHelperType, setRunHelperType] = useState<'manual' | '10k' | '5k' | 'ef'>('manual');
  const [runHelperValue, setRunHelperValue] = useState<string>('50:00');

  if (!isOpen) return null;

  const targetSport = profile.targetSport || 'triathlon';

  // Helper to parse numbers safely without resetting to default on backspace/empty
  const parseNumberInput = (val: string): number => {
    if (val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const handleApplyRunHelper = () => {
    if (runHelperType === 'manual') return;
    const extrapolated = extrapolateRunPaces(runHelperValue, runHelperType);
    setProfile({
      ...profile,
      runMetrics: {
        ...profile.runMetrics,
        efPaceMinKm: extrapolated.efPace,
        thresholdPaceMinKm: extrapolated.thresholdPace,
        marathonPaceMinKm: extrapolated.marathonPace,
        vmaPaceMinKm: extrapolated.vmaPace,
        ...(runHelperType === '10k' ? { tenKTimeMin: runHelperValue } : {}),
        ...(runHelperType === '5k' ? { fiveKTimeMin: runHelperValue } : {}),
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

  const setSportMode = (sport: TargetSport) => {
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
      defaultName = 'Épreuve Eau Libre 3 000m';
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

  const toggleDayAvailability = (day: number) => {
    const current = profile.availability.availableDays;
    let next: number[];
    if (current.includes(day)) {
      if (current.length > 2) {
        next = current.filter((d) => d !== day);
      } else {
        next = current;
      }
    } else {
      next = [...current, day].sort();
    }
    setProfile({
      ...profile,
      availability: {
        ...profile.availability,
        availableDays: next,
      },
    });
  };

  const handleFinish = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    // Ensure default fallbacks if athlete left a field empty
    const sanitizedProfile: AthleteProfile = {
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
      availability: {
        ...profile.availability,
        maxWeeklyHours: profile.availability.maxWeeklyHours || 8,
        weeklySchedule: profile.availability.weeklySchedule || [
          { dayOfWeek: 1, sport: 'rest', category: 'recovery' },
          { dayOfWeek: 2, sport: 'swim', category: 'technique' },
          { dayOfWeek: 3, sport: 'bike', category: 'intervals' },
          { dayOfWeek: 4, sport: 'run', category: 'intervals' },
          { dayOfWeek: 5, sport: 'swim', category: 'endurance' },
          { dayOfWeek: 6, sport: 'bike', category: 'endurance' },
          { dayOfWeek: 7, sport: 'run', category: 'endurance' },
        ],
      },
    };
    onSaveProfile(sanitizedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Configuration de votre Programme Personnalisé</h2>
                <p className="text-xs text-slate-400">Triathlon, Marathon, Semi, 10KM ou Défi Cyclisme (ex: Défi Pierre Lavoie 135 km)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-5 gap-2 mt-6">
            {[
              { num: 1, label: 'Sport & Profil' },
              { num: 2, label: 'Allures & Chronos' },
              { num: 3, label: 'Objectif Course' },
              { num: 4, label: 'Disponibilités' },
              { num: 5, label: 'Validation' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  step === s.num
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : step > s.num
                    ? 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800/40 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {step > s.num ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-xs">{s.num}</span>}
                </div>
                <span className="text-[10px] mt-0.5 truncate hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* STEP 1: Discipline selection & Biometrics & Heart Rate Inputs */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Main Sport Picker */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Choisissez votre Discipline Principale
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'triathlon', label: 'Triathlon Complet', emoji: '🏊🚴🏃', desc: 'XS, Sprint, M, 70.3, 140.6', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300' },
                    { id: 'run', label: 'Course à Pied Seule', emoji: '🏃', desc: 'Marathon, Semi, 10K, 5K', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300' },
                    { id: 'bike', label: 'Cyclisme Seul', emoji: '🚴', desc: '135 km Défi Pierre Lavoie, Gran Fondo', color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
                    { id: 'swim', label: 'Natation Seule', emoji: '🏊', desc: 'Eau Libre 1500m, 3km, 5km', color: 'border-blue-500 bg-blue-950/40 text-blue-300' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSportMode(s.id as TargetSport)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        targetSport === s.id
                          ? `${s.color} ring-2 ring-cyan-400/50 shadow-lg`
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xl mb-1">{s.emoji}</div>
                      <div className="text-xs font-bold text-white leading-tight">{s.label}</div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Biometrics */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">2. Données Physiologiques & Biométrie</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Votre Prénom ou Nom d'athlète</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="Ex: Alexandre"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Niveau d'expérience</label>
                    <select
                      value={profile.experienceLevel}
                      onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value as ExperienceLevel })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="beginner">Débutant (1ère ou 2ème préparation)</option>
                      <option value="intermediate">Intermédiaire (Déjà plusieurs courses terminées)</option>
                      <option value="advanced">Confirmé / Recherche de performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Âge</label>
                    <input
                      type="number"
                      value={profile.age === 0 ? '' : profile.age}
                      onChange={(e) => setProfile({ ...profile, age: parseNumberInput(e.target.value) })}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Poids (kg)</label>
                    <input
                      type="number"
                      value={profile.weightKg === 0 ? '' : profile.weightKg}
                      onChange={(e) => setProfile({ ...profile, weightKg: parseNumberInput(e.target.value) })}
                      placeholder="70"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Heart Rate Calibration (FC Repos & FC Max EDITABLE) */}
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
                      <Heart className="w-4 h-4" />
                      <span>Fréquence Cardiaque (Calibration Karvonen)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoCalcHR}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Estimer FC Max ({estimateMaxHR(profile.age || 30)} bpm)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        FC au Repos (bpm au réveil)
                      </label>
                      <input
                        type="number"
                        value={profile.hrRest === 0 ? '' : profile.hrRest}
                        onChange={(e) => setProfile({ ...profile, hrRest: parseNumberInput(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500 font-mono"
                        placeholder="54"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Fréquence cardiaque mesurée au repos allongé</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        FC Maximale (bpm)
                      </label>
                      <input
                        type="number"
                        value={profile.hrMax === 0 ? '' : profile.hrMax}
                        onChange={(e) => setProfile({ ...profile, hrMax: parseNumberInput(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500 font-mono"
                        placeholder="186"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">FC max observée lors d'un effort maximal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Current Paces & Metrics */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-l-2 border-emerald-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Étape 2 : Vos Allures et Repères Actuels
                </h3>
                <p className="text-xs text-slate-400">
                  {targetSport === 'run' && 'Calibrez vos allures clés de course à pied (EF, Seuil, Marathon, VMA).'}
                  {targetSport === 'bike' && 'Calibrez votre puissance FTP ou votre vitesse moyenne d\'endurance à vélo.'}
                  {targetSport === 'swim' && 'Calibrez votre allure CSS (Critical Swim Speed) aux 100m.'}
                  {targetSport === 'triathlon' && 'Calibrez vos allures de référence pour les 3 disciplines.'}
                </p>
              </div>

              {/* RUNNING SECTION (Visible for Run & Triathlon) */}
              {(targetSport === 'run' || targetSport === 'triathlon') && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-emerald-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                      <span>🏃 Course à Pied</span>
                    </span>
                  </div>

                  {/* Wizard helper */}
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 text-xs space-y-2">
                    <span className="font-semibold text-slate-300">💡 Assistant : déduire mes allures depuis un chrono</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={runHelperType}
                        onChange={(e) => setRunHelperType(e.target.value as any)}
                        className="px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded text-slate-200 text-xs"
                      >
                        <option value="manual">Saisie manuelle directe</option>
                        <option value="10k">Depuis mon temps sur 10 km (mm:ss)</option>
                        <option value="5k">Depuis mon temps sur 5 km (mm:ss)</option>
                        <option value="ef">Depuis mon allure cool en footing (min/km)</option>
                      </select>

                      {runHelperType !== 'manual' && (
                        <>
                          <input
                            type="text"
                            value={runHelperValue || ''}
                            onChange={(e) => setRunHelperValue(e.target.value)}
                            placeholder="Ex: 50:00 ou 6:15"
                            className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-xs font-mono text-center"
                          />
                          <button
                            type="button"
                            onClick={handleApplyRunHelper}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition"
                          >
                            Calculer
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure EF (min/km)</label>
                      <input
                        type="text"
                        value={profile.runMetrics.efPaceMinKm || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          runMetrics: { ...profile.runMetrics, efPaceMinKm: e.target.value }
                        })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                        placeholder="6:15"
                      />
                      <span className="text-[10px] text-slate-500 block text-center mt-0.5">Aisance totale (Z2)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure Seuil (min/km)</label>
                      <input
                        type="text"
                        value={profile.runMetrics.thresholdPaceMinKm || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          runMetrics: { ...profile.runMetrics, thresholdPaceMinKm: e.target.value }
                        })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                        placeholder="4:50"
                      />
                      <span className="text-[10px] text-slate-500 block text-center mt-0.5">Allure 10 km (Z4)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure Marathon (min/km)</label>
                      <input
                        type="text"
                        value={profile.runMetrics.marathonPaceMinKm || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          runMetrics: { ...profile.runMetrics, marathonPaceMinKm: e.target.value }
                        })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                        placeholder="5:25"
                      />
                      <span className="text-[10px] text-slate-500 block text-center mt-0.5">Allure Tempo (Z3)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure VMA (min/km)</label>
                      <input
                        type="text"
                        value={profile.runMetrics.vmaPaceMinKm || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          runMetrics: { ...profile.runMetrics, vmaPaceMinKm: e.target.value }
                        })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                        placeholder="4:15"
                      />
                      <span className="text-[10px] text-slate-500 block text-center mt-0.5">Intervalles 30/30 (Z5)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CYCLING SECTION (Visible for Bike & Triathlon) */}
              {(targetSport === 'bike' || targetSport === 'triathlon') && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20 space-y-4">
                  <span className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                    <span>🚴 Cyclisme (Watts & Vitesse)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Puissance FTP (Watts)</label>
                      <input
                        type="number"
                        value={profile.bikeMetrics.ftpWatts === 0 ? '' : profile.bikeMetrics.ftpWatts}
                        onChange={(e) => setProfile({
                          ...profile,
                          bikeMetrics: { ...profile.bikeMetrics, ftpWatts: parseNumberInput(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500 font-mono"
                        placeholder="210"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Puissance max 1 heure (env. {((profile.bikeMetrics.ftpWatts || 200) / (profile.weightKg || 70)).toFixed(2)} W/kg)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Vitesse moyenne endurance Z2 sur le plat (km/h)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={profile.bikeMetrics.avgZ2SpeedKmh === 0 ? '' : profile.bikeMetrics.avgZ2SpeedKmh}
                        onChange={(e) => setProfile({
                          ...profile,
                          bikeMetrics: { ...profile.bikeMetrics, avgZ2SpeedKmh: parseNumberInput(e.target.value) }
                        })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500 font-mono"
                        placeholder="27.5"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Vitesse confortable sur le plat</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SWIMMING SECTION (Visible for Swim & Triathlon) */}
              {(targetSport === 'swim' || targetSport === 'triathlon') && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-cyan-500/20 space-y-4">
                  <span className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                    <span>🏊 Natation (Crawl)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Allure Seuil CSS aux 100m (mm:ss)</label>
                      <input
                        type="text"
                        value={profile.swimMetrics.cssPacePer100m || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          swimMetrics: { ...profile.swimMetrics, cssPacePer100m: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:border-cyan-500 text-center"
                        placeholder="2:00"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Critical Swim Speed (Allure 400m)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Aisance respiratoire en crawl</label>
                      <select
                        value={profile.swimMetrics.comfortLevel}
                        onChange={(e) => setProfile({
                          ...profile,
                          swimMetrics: { ...profile.swimMetrics, comfortLevel: e.target.value as any }
                        })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                      >
                        <option value="beginner">Débutant (Pauses régulières)</option>
                        <option value="intermediate">Intermédiaire (1000m crawl continu)</option>
                        <option value="advanced">Confirmé (Respiration 3 temps fluide)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Race Target & Distance */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Étape 3 : Format & Distance de votre Objectif
                </h3>
                <p className="text-xs text-slate-400">
                  Choisissez la distance exacte pour calibrer les volumes hebdomadaires et les sorties clés.
                </p>
              </div>

              {/* 1. RUNNING FORMATS */}
              {targetSport === 'run' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'run_5k', name: '5 KM', tag: 'Vitesse & Débutant', dist: '5.0 km', desc: 'Idéal pour développer le dynamisme et la VMA.' },
                    { id: 'run_10k', name: '10 KM', tag: 'Classique Seuil', dist: '10.0 km', desc: 'La distance universelle de référence pour travailler le seuil.' },
                    { id: 'run_semi', name: 'Semi-Marathon', tag: '21.1 KM', dist: '21.1 km', desc: 'L\'équilibre parfait entre endurance et vitesse soutenue.' },
                    { id: 'run_marathon', name: 'Marathon', tag: '42.195 KM', dist: '42.2 km', desc: 'Le grand défi mythique. Gestion d\'allure et du mur du 30ème km.' },
                    { id: 'run_trail', name: 'Trail & Nature', tag: 'Dénivelé', dist: '~30 km', desc: 'Course nature, travail en côtes et renforcement articulaire.' },
                  ].map((d) => {
                    const isSelected = profile.raceObjective.distance === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setProfile({
                          ...profile,
                          raceObjective: { ...profile.raceObjective, distance: d.id as RaceDistance, raceName: d.name }
                        })}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-emerald-500/20 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white">🏃 {d.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {d.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{d.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. CYCLING FORMATS */}
              {targetSport === 'bike' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'bike_50k', name: '50 KM', tag: 'Rythmée', desc: 'Sortie rapide et rythmée, travail de cadence.' },
                    { id: 'bike_90k', name: '90 KM Gran Fondo', tag: 'Endurance', desc: 'Distance classique de cyclosportive intermédiaire.' },
                    { id: 'bike_135k', name: 'Défi 135 KM', tag: 'Défi Pierre Lavoie', desc: 'La distance emblématique de la Boucle Pierre Lavoie et des grandes cyclos.' },
                    { id: 'bike_century', name: '160 KM (100 Miles)', tag: 'Century Ride', desc: 'Le cap mythique des 100 miles en cyclisme.' },
                    { id: 'bike_200k', name: '200 KM+', tag: 'Ultra-Cyclisme', desc: 'Brevet des Randonneurs et ultra-distance.' },
                  ].map((d) => {
                    const isSelected = profile.raceObjective.distance === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setProfile({
                          ...profile,
                          raceObjective: { ...profile.raceObjective, distance: d.id as RaceDistance, raceName: d.name }
                        })}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white">🚴 {d.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                            {d.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{d.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. SWIMMING FORMATS */}
              {targetSport === 'swim' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'swim_1500m', name: '1 500 M Eau Libre', tag: 'Classique', desc: 'Traversée standard en lac ou mer.' },
                    { id: 'swim_3k', name: '3 000 M (3 KM)', tag: 'Endurance', desc: 'Défi longue distance en natation libre.' },
                    { id: 'swim_5k', name: '5 000 M (5 KM)', tag: 'Marathon Nage', desc: 'Épreuve d\'ultra-endurance aquatique.' },
                  ].map((d) => {
                    const isSelected = profile.raceObjective.distance === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setProfile({
                          ...profile,
                          raceObjective: { ...profile.raceObjective, distance: d.id as RaceDistance, raceName: d.name }
                        })}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white">🏊 {d.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {d.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{d.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. TRIATHLON FORMATS */}
              {targetSport === 'triathlon' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'xs', name: 'Triathlon XS', tag: 'Découverte', swim: '400m', bike: '10km', run: '2.5km', desc: 'Idéal pour un premier baptême.' },
                    { id: 's', name: 'Triathlon S', tag: 'Sprint', swim: '750m', bike: '20km', run: '5km', desc: 'Dynamique et accessible.' },
                    { id: 'm', name: 'Triathlon M', tag: 'Olympique', swim: '1500m', bike: '40km', run: '10km', desc: 'La distance reine internationale.' },
                    { id: 'l', name: 'Triathlon L', tag: 'Half 70.3', swim: '1900m', bike: '90km', run: '21.1km', desc: 'Endurance longue distance.' },
                    { id: 'xl', name: 'Triathlon XL', tag: 'Ironman 140.6', swim: '3800m', bike: '180km', run: '42.2km', desc: 'Le mythe ultime.' },
                  ].map((d) => {
                    const isSelected = profile.raceObjective.distance === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setProfile({
                          ...profile,
                          raceObjective: { ...profile.raceObjective, distance: d.id as RaceDistance, raceName: d.name }
                        })}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white">{d.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {d.tag}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-300 font-mono mb-1">
                          <span>🏊 {d.swim}</span>
                          <span>🚴 {d.bike}</span>
                          <span>🏃 {d.run}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{d.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Event Name & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de l'épreuve / Objectif</label>
                  <input
                    type="text"
                    value={profile.raceObjective.raceName || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      raceObjective: { ...profile.raceObjective, raceName: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                    placeholder="Ex: Marathon de Paris ou Défi Pierre Lavoie 135 km"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date de la Course</label>
                  <input
                    type="date"
                    value={profile.raceObjective.raceDate || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      raceObjective: { ...profile.raceObjective, raceDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Availability & Equipment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-l-2 border-purple-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 4 : Vos Disponibilités Hebdomadaires</h3>
                <p className="text-xs text-slate-400">Le programme place les séances clés sur vos jours de prédilection.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Jours où vous pouvez vous entraîner</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { day: 1, label: 'Lun' },
                    { day: 2, label: 'Mar' },
                    { day: 3, label: 'Mer' },
                    { day: 4, label: 'Jeu' },
                    { day: 5, label: 'Ven' },
                    { day: 6, label: 'Sam' },
                    { day: 7, label: 'Dim' },
                  ].map((d) => {
                    const isAvail = profile.availability.availableDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => toggleDayAvailability(d.day)}
                        className={`py-2 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center ${
                          isAvail
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        <span>{d.label}</span>
                        <span className="text-[9px] font-normal">{isAvail ? 'Dispo' : 'Off'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Volume max hebdo (Heures)</label>
                  <input
                    type="number"
                    value={profile.availability.maxWeeklyHours === 0 ? '' : profile.availability.maxWeeklyHours}
                    onChange={(e) => setProfile({
                      ...profile,
                      availability: { ...profile.availability, maxWeeklyHours: parseNumberInput(e.target.value) }
                    })}
                    placeholder="8"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jour Sortie Longue Principale</label>
                  <select
                    value={profile.availability.preferredLongRideDay}
                    onChange={(e) => setProfile({
                      ...profile,
                      availability: { ...profile.availability, preferredLongRideDay: parseInt(e.target.value, 10) }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                  >
                    <option value={6}>Samedi</option>
                    <option value={7}>Dimanche</option>
                    <option value={3}>Mercredi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jour de Repos Dédié</label>
                  <select
                    value={profile.availability.preferredRestDay}
                    onChange={(e) => setProfile({
                      ...profile,
                      availability: { ...profile.availability, preferredRestDay: parseInt(e.target.value, 10) }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                  >
                    <option value={1}>Lundi</option>
                    <option value={5}>Vendredi</option>
                    <option value={7}>Dimanche</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Summary & Generation */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="border-l-2 border-emerald-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 5 : Récapitulatif & Calibration</h3>
                <p className="text-xs text-slate-400">Vérifiez vos paramètres avant de générer votre programme d'entraînement.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4" />
                    <span>Discipline & Objectif</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {targetSport === 'run' && '🏃 Programme Course à Pied'}
                    {targetSport === 'bike' && '🚴 Programme Cyclisme'}
                    {targetSport === 'swim' && '🏊 Programme Natation'}
                    {targetSport === 'triathlon' && '🏊🚴🏃 Programme Triathlon'}
                  </div>
                  <div className="text-xs text-amber-400 font-semibold">
                    {profile.raceObjective.raceName || profile.raceObjective.distance}
                  </div>
                  <div className="text-xs text-slate-400">
                    Disponibilités : {profile.availability.availableDays.length} jours/sem. (~{profile.availability.maxWeeklyHours}h max)
                  </div>
                </div>

                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                    <Gauge className="w-4 h-4" />
                    <span>Allures & Cardio de Calibration</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-slate-300">❤️ Cardio : <strong className="text-rose-400 font-mono">{profile.hrRest} bpm (Repos)</strong> / <strong className="text-rose-400 font-mono">{profile.hrMax} bpm (Max)</strong></div>
                    {(targetSport === 'run' || targetSport === 'triathlon') && (
                      <div className="text-slate-300">🏃 EF : <strong className="text-white font-mono">{profile.runMetrics.efPaceMinKm}/km</strong> | Seuil : <strong className="text-emerald-400 font-mono">{profile.runMetrics.thresholdPaceMinKm}/km</strong></div>
                    )}
                    {(targetSport === 'bike' || targetSport === 'triathlon') && (
                      <div className="text-slate-300">🚴 FTP : <strong className="text-amber-400 font-mono">{profile.bikeMetrics.ftpWatts} W</strong> (~{profile.bikeMetrics.avgZ2SpeedKmh} km/h Z2)</div>
                    )}
                    {(targetSport === 'swim' || targetSport === 'triathlon') && (
                      <div className="text-slate-300">🏊 CSS : <strong className="text-cyan-400 font-mono">{profile.swimMetrics.cssPacePer100m}/100m</strong></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 rounded-xl border border-cyan-500/30 text-center space-y-2">
                <div className="text-sm font-bold text-white">✨ Tout est calibré pour votre objectif !</div>
                <p className="text-xs text-slate-300 max-w-xl mx-auto">
                  Votre programme va être structuré sur les 4 phases physiologiques (Base, Build, Peak, Taper) avec des allures adaptées à votre niveau.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/30 transition"
            >
              <span>Suivant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-amber-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-cyan-500/20 transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Générer mon Programme Personnalisé</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
