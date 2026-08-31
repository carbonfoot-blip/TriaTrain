import React, { useState } from 'react';
import { 
  X, Check, Sparkles, ChevronRight, ChevronLeft, 
  Activity, Heart, Flame, Shield, Award, Calendar, 
  Clock, Gauge, Zap, HelpCircle, Dumbbell
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AthleteProfile, RaceDistance, RaceGoal, ExperienceLevel } from '../types/triathlon';
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

  // Magic calculation helper state for run paces
  const [runHelperType, setRunHelperType] = useState<'manual' | '10k' | '5k' | 'ef'>('manual');
  const [runHelperValue, setRunHelperValue] = useState<string>('50:00');

  if (!isOpen) return null;

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

  const toggleDayAvailability = (day: number) => {
    const current = profile.availability.availableDays;
    let next: number[];
    if (current.includes(day)) {
      if (current.length > 2) {
        next = current.filter((d) => d !== day);
      } else {
        next = current; // Keep at least 2 days
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
    onSaveProfile(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header with Step indicator */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Configuration de votre Profil & Allures</h2>
                <p className="text-xs text-slate-400">Programme de triathlon personnalisé et calibré sur vos zones physiologiques</p>
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
              { num: 1, label: 'Biométrie' },
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
          {/* STEP 1: Biometrics & Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="border-l-2 border-cyan-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 1 : Identité & Physiologie Cardiaque</h3>
                <p className="text-xs text-slate-400">Ces métriques permettent d'estimer vos zones de fréquence cardiaque et vos dépenses énergétiques.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Votre Prénom ou Nom d'athlète</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                    placeholder="Ex: Thomas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Genre</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Âge</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Niveau d'expérience globale</label>
                  <select
                    value={profile.experienceLevel}
                    onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value as ExperienceLevel })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="beginner">Débutant (1er ou 2ème triathlon)</option>
                    <option value="intermediate">Intermédiaire (Déjà réalisé plusieurs triathlons)</option>
                    <option value="advanced">Confirmé / Compétiteur régulier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Poids (kg)</label>
                  <input
                    type="number"
                    value={profile.weightKg}
                    onChange={(e) => setProfile({ ...profile, weightKg: parseFloat(e.target.value) || 70 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Taille (cm)</label>
                  <input
                    type="number"
                    value={profile.heightCm}
                    onChange={(e) => setProfile({ ...profile, heightCm: parseInt(e.target.value, 10) || 175 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Heart Rate Calibration */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Fréquence Cardiaque (Calibration Karvonen)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoCalcHR}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Estimer FC Max via l'âge ({estimateMaxHR(profile.age)} bpm)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">FC Repos au réveil (bpm)</label>
                    <input
                      type="number"
                      value={profile.hrRest}
                      onChange={(e) => setProfile({ ...profile, hrRest: parseInt(e.target.value, 10) || 55 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="Ex: 52"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">FC Maximale observée (bpm)</label>
                    <input
                      type="number"
                      value={profile.hrMax}
                      onChange={(e) => setProfile({ ...profile, hrMax: parseInt(e.target.value, 10) || 185 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="Ex: 188"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Paces & Benchmarks (Run, Bike, Swim) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-l-2 border-emerald-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 2 : Vos Allures Actuelles de Référence</h3>
                <p className="text-xs text-slate-400">Entrez vos allures habituelles. Si vous êtes débutant, utilisez l'assistant de calcul automatique.</p>
              </div>

              {/* 1. RUNNING SECTION */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                    <span>🏃 Course à Pied</span>
                  </span>
                </div>

                {/* Wizard helper */}
                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">💡 Assistant débutant : déduire mes allures depuis un chrono</span>
                  </div>
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
                          value={runHelperValue}
                          onChange={(e) => setRunHelperValue(e.target.value)}
                          placeholder="Ex: 50:00 ou 6:15"
                          className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyRunHelper}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition"
                        >
                          Calculer automatiquement
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure EF / Z2 (min/km)</label>
                    <input
                      type="text"
                      value={profile.runMetrics.efPaceMinKm}
                      onChange={(e) => setProfile({
                        ...profile,
                        runMetrics: { ...profile.runMetrics, efPaceMinKm: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                      placeholder="6:15"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Aisance totale</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure Seuil (min/km)</label>
                    <input
                      type="text"
                      value={profile.runMetrics.thresholdPaceMinKm}
                      onChange={(e) => setProfile({
                        ...profile,
                        runMetrics: { ...profile.runMetrics, thresholdPaceMinKm: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                      placeholder="4:50"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Allure 10 km</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure Marathon (min/km)</label>
                    <input
                      type="text"
                      value={profile.runMetrics.marathonPaceMinKm}
                      onChange={(e) => setProfile({
                        ...profile,
                        runMetrics: { ...profile.runMetrics, marathonPaceMinKm: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                      placeholder="5:25"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Allure Z3 Tempo</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-medium mb-1">Allure VMA / 5k (min/km)</label>
                    <input
                      type="text"
                      value={profile.runMetrics.vmaPaceMinKm}
                      onChange={(e) => setProfile({
                        ...profile,
                        runMetrics: { ...profile.runMetrics, vmaPaceMinKm: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-sm text-center font-mono focus:border-emerald-500"
                      placeholder="4:15"
                    />
                    <span className="text-[10px] text-slate-500 block text-center mt-0.5">Intervalles courts</span>
                  </div>
                </div>
              </div>

              {/* 2. CYCLING SECTION */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-amber-500/20 space-y-4">
                <span className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <span>🚴 Cyclisme</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Puissance FTP (Watts)</label>
                    <input
                      type="number"
                      value={profile.bikeMetrics.ftpWatts}
                      onChange={(e) => setProfile({
                        ...profile,
                        bikeMetrics: { ...profile.bikeMetrics, ftpWatts: parseInt(e.target.value, 10) || 180 }
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500"
                      placeholder="210"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Puissance max tenable 1 heure (env. {((profile.bikeMetrics.ftpWatts || 200) / (profile.weightKg || 70)).toFixed(2)} W/kg)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vitesse moyenne sur le plat en Z2 (km/h)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={profile.bikeMetrics.avgZ2SpeedKmh}
                      onChange={(e) => setProfile({
                        ...profile,
                        bikeMetrics: { ...profile.bikeMetrics, avgZ2SpeedKmh: parseFloat(e.target.value) || 25 }
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500"
                      placeholder="26.5"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Vitesse en endurance sans vent défavorable</span>
                  </div>
                </div>
              </div>

              {/* 3. SWIMMING SECTION */}
              <div className="p-4 bg-slate-800/50 rounded-xl border border-cyan-500/20 space-y-4">
                <span className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                  <span>🏊 Natation (Crawl)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Allure Seuil CSS aux 100m (mm:ss)</label>
                    <input
                      type="text"
                      value={profile.swimMetrics.cssPacePer100m}
                      onChange={(e) => setProfile({
                        ...profile,
                        swimMetrics: { ...profile.swimMetrics, cssPacePer100m: e.target.value }
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:border-cyan-500"
                      placeholder="2:00"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Critical Swim Speed (Allure tenue sur un 400m)</span>
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
                      <option value="beginner">Débutant (Difficulté à nager 100m crawl sans pause)</option>
                      <option value="intermediate">Intermédiaire (Capable de nager 1000m continu en crawl)</option>
                      <option value="advanced">Confirmé (Nageur régulier, respiration 3 temps fluide)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Race Target & Distance */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 3 : Objectif de Triathlon & Format de Course</h3>
                <p className="text-xs text-slate-400">Sélectionnez la distance préparée pour adapter les volumes hebdomadaires et les séances briques.</p>
              </div>

              {/* Distance cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    id: 'xs',
                    name: 'Triathlon XS',
                    tag: 'Découverte',
                    swim: '400 m',
                    bike: '10 km',
                    run: '2.5 km',
                    desc: 'Idéal pour un tout premier baptême sans stress.',
                  },
                  {
                    id: 's',
                    name: 'Triathlon S',
                    tag: 'Sprint',
                    swim: '750 m',
                    bike: '20 km',
                    run: '5 km',
                    desc: 'Dynamique, accessible et parfait pour débuter avec panache.',
                  },
                  {
                    id: 'm',
                    name: 'Triathlon M',
                    tag: 'Olympique (Standard)',
                    swim: '1 500 m',
                    bike: '40 km',
                    run: '10 km',
                    desc: 'La distance reine internationale, le premier vrai grand défi.',
                  },
                  {
                    id: 'l',
                    name: 'Triathlon L',
                    tag: 'Half 70.3',
                    swim: '1 900 m',
                    bike: '90 km',
                    run: '21.1 km',
                    desc: 'Endurance longue distance, gestion nutritionnelle clé.',
                  },
                  {
                    id: 'xl',
                    name: 'Triathlon XL',
                    tag: 'Ironman 140.6',
                    swim: '3 800 m',
                    bike: '180 km',
                    run: '42.2 km',
                    desc: 'Le mythe ultime de l\'ultra-endurance.',
                  },
                ].map((d) => {
                  const isSelected = profile.raceObjective.distance === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setProfile({
                        ...profile,
                        raceObjective: { ...profile.raceObjective, distance: d.id as RaceDistance }
                      })}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-white">{d.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {d.tag}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-300 font-mono mb-2">
                        <span>🏊 {d.swim}</span>
                        <span>🚴 {d.bike}</span>
                        <span>🏃 {d.run}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{d.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Race details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de la course / Événement</label>
                  <input
                    type="text"
                    value={profile.raceObjective.raceName}
                    onChange={(e) => setProfile({
                      ...profile,
                      raceObjective: { ...profile.raceObjective, raceName: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500"
                    placeholder="Ex: Triathlon de Paris ou Triathlon de Deauville"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Date de la Course (Jour J)</label>
                  <input
                    type="date"
                    value={profile.raceObjective.raceDate}
                    onChange={(e) => setProfile({
                      ...profile,
                      raceObjective: { ...profile.raceObjective, raceDate: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Type d'ambition</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'finisher', label: 'Finisher avec le sourire', icon: Shield, desc: 'Objectif régularité & plaisir' },
                    { id: 'time', label: 'Chrono spécifique', icon: Clock, desc: 'Optimisation de la vitesse' },
                    { id: 'podium', label: 'Top Performance', icon: Award, desc: 'Catégorie d\'âge / Compétition' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setProfile({
                        ...profile,
                        raceObjective: { ...profile.raceObjective, goalType: g.id as RaceGoal }
                      })}
                      className={`p-3 rounded-xl border text-left transition ${
                        profile.raceObjective.goalType === g.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <g.icon className="w-4 h-4 mb-1" />
                      <div className="text-xs font-bold text-white">{g.label}</div>
                      <div className="text-[10px] text-slate-400">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Availability & Equipment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-l-2 border-purple-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 4 : Disponibilités & Équipements</h3>
                <p className="text-xs text-slate-400">Le planificateur adapte l'agencement des séances selon votre emploi du temps réel.</p>
              </div>

              {/* Days selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Jours disponibles pour vous entraîner</label>
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
                    value={profile.availability.maxWeeklyHours}
                    onChange={(e) => setProfile({
                      ...profile,
                      availability: { ...profile.availability, maxWeeklyHours: parseInt(e.target.value, 10) || 8 }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                    placeholder="8"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Recommandé : 6h à 10h pour un M</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jour Sortie Longue Vélo</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jour Sortie Longue Course</label>
                  <select
                    value={profile.availability.preferredLongRunDay}
                    onChange={(e) => setProfile({
                      ...profile,
                      availability: { ...profile.availability, preferredLongRunDay: parseInt(e.target.value, 10) }
                    })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-cyan-500"
                  >
                    <option value={7}>Dimanche</option>
                    <option value={6}>Samedi</option>
                    <option value={4}>Jeudi</option>
                  </select>
                </div>
              </div>

              {/* Equipment Check */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Vos équipements disponibles</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'hasGpsWatch', label: 'Montre GPS (Garmin/Coros/Apple)' },
                    { key: 'hasHeartRateBelt', label: 'Ceinture Cardio Thoracique' },
                    { key: 'hasSmartTrainer', label: 'Home-Trainer connecté / Zwift' },
                    { key: 'hasWetsuit', label: 'Combinaison néoprène eau libre' },
                    { key: 'hasTrisuit', label: 'Trifonction de triathlon' },
                  ].map((eq) => {
                    const isChecked = (profile.equipment as any)[eq.key];
                    return (
                      <label
                        key={eq.key}
                        className={`flex items-center space-x-2 p-2.5 rounded-lg border cursor-pointer transition ${
                          isChecked ? 'bg-slate-800 border-cyan-500/50 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setProfile({
                            ...profile,
                            equipment: { ...profile.equipment, [eq.key]: e.target.checked }
                          })}
                          className="rounded text-cyan-500 focus:ring-0"
                        />
                        <span className="text-[11px] leading-tight">{eq.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Summary & Generation */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="border-l-2 border-emerald-500 pl-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Étape 5 : Récapitulatif & Calibration du Plan</h3>
                <p className="text-xs text-slate-400">Vérifiez vos paramètres avant de générer votre programme d'entraînement scientifique.</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400">
                    <Activity className="w-4 h-4" />
                    <span>Profil & Objectif</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{profile.name} ({profile.age} ans, {profile.weightKg} kg)</div>
                  <div className="text-xs text-slate-300">
                    Cible : <strong className="text-amber-400">Triathlon {profile.raceObjective.distance.toUpperCase()}</strong> ({profile.raceObjective.raceName || 'Course cible'})
                  </div>
                  <div className="text-xs text-slate-400">
                    Disponibilités : {profile.availability.availableDays.length} jours/semaine (~{profile.availability.maxWeeklyHours}h max)
                  </div>
                </div>

                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                    <Gauge className="w-4 h-4" />
                    <span>Allures Cibles Personnalisées</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-slate-300">🏃 EF : <strong className="text-white font-mono">{profile.runMetrics.efPaceMinKm}/km</strong> | Seuil : <strong className="text-emerald-400 font-mono">{profile.runMetrics.thresholdPaceMinKm}/km</strong></div>
                    <div className="text-slate-300">🚴 FTP : <strong className="text-amber-400 font-mono">{profile.bikeMetrics.ftpWatts} W</strong> (~{profile.bikeMetrics.avgZ2SpeedKmh} km/h Z2)</div>
                    <div className="text-slate-300">🏊 CSS : <strong className="text-cyan-400 font-mono">{profile.swimMetrics.cssPacePer100m}/100m</strong></div>
                  </div>
                </div>
              </div>

              {/* Ready banner */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 rounded-xl border border-cyan-500/30 text-center space-y-2">
                <div className="text-sm font-bold text-white">✨ Tout est prêt pour débuter votre préparation !</div>
                <p className="text-xs text-slate-300 max-w-xl mx-auto">
                  Votre programme va être structuré avec les 4 phases physiologiques clés (Fondation, Développement, Spécifique, Affûtage), les séances briques indispensables et des conseils de coach pour chaque séance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
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
              <span>Générer mon Programme TriaTrain</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
