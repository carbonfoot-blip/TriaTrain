import React, { useState } from 'react';
import { Compass, Gauge, Heart, Activity, Flame, Shield, Clock, MapPin, Zap } from 'lucide-react';
import { AthleteProfile, RaceDistance } from '../types/triathlon';
import { calculateAllZones } from '../utils/zonesCalculator';
import { predictRaceTimes } from '../utils/racePredictor';

interface ZonesCenterProps {
  profile: AthleteProfile;
}

export const ZonesCenter: React.FC<ZonesCenterProps> = ({ profile }) => {
  const [sportTab, setSportTab] = useState<'run' | 'bike' | 'swim' | 'hr'>('run');
  const [predictedDist, setPredictedDist] = useState<RaceDistance>(profile.raceObjective.distance || 'm');

  const zones = calculateAllZones(profile);
  const prediction = predictRaceTimes(profile, predictedDist);

  const wKg = profile.weightKg ? (profile.bikeMetrics.ftpWatts / profile.weightKg).toFixed(2) : '2.8';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Centre des Zones Physiologiques & Allures</h2>
            <p className="text-xs text-slate-400">
              Vos plages d'entraînement personnalisées (Karvonen, Coggan, CSS) pour un entraînement polarisé efficace
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Zones Tables + Race Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Zones Browser */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'run', label: '🏃 Course à Pied', color: 'text-emerald-400' },
              { id: 'bike', label: '🚴 Cyclisme (Watts & Vit.)', color: 'text-amber-400' },
              { id: 'swim', label: '🏊 Natation (CSS)', color: 'text-cyan-400' },
              { id: 'hr', label: '❤️ Fréquence Cardiaque', color: 'text-rose-400' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSportTab(tab.id as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  sportTab === tab.id
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={sportTab === tab.id ? tab.color : ''}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Running Zones */}
          {sportTab === 'run' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Allures de Course à Pied (min/km)</h3>
                  <p className="text-xs text-slate-400">
                    Calculées autour de votre Seuil : <strong className="text-emerald-400 font-mono">{profile.runMetrics.thresholdPaceMinKm}/km</strong>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  Polarisation 80/20
                </span>
              </div>

              <div className="space-y-3">
                {[zones.run.z1, zones.run.z2, zones.run.z3, zones.run.z4, zones.run.z5].map((z, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1 sm:max-w-[60%]">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold ${
                          idx === 0 ? 'text-slate-300' : idx === 1 ? 'text-emerald-400' : idx === 2 ? 'text-amber-400' : idx === 3 ? 'text-orange-400' : 'text-rose-400'
                        }`}>
                          {z.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">{z.description}</p>
                      <p className="text-[10px] text-slate-500 italic">"{z.feel}"</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                        {z.range}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Cible : <span className="text-emerald-300 font-semibold">{z.target}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Cycling Zones */}
          {sportTab === 'bike' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Zones de Puissance Vélo (Watts Coggan)</h3>
                  <p className="text-xs text-slate-400">
                    FTP de référence : <strong className="text-amber-400 font-mono">{profile.bikeMetrics.ftpWatts} Watts</strong> ({wKg} W/kg)
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                  Cadence : 85-95 rpm
                </span>
              </div>

              <div className="space-y-3">
                {[zones.bike.z1, zones.bike.z2, zones.bike.z3, zones.bike.z4, zones.bike.z5].map((z, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1 sm:max-w-[60%]">
                      <span className={`text-xs font-bold ${
                        idx === 0 ? 'text-slate-300' : idx === 1 ? 'text-amber-400' : idx === 2 ? 'text-orange-400' : idx === 3 ? 'text-rose-400' : 'text-purple-400'
                      }`}>
                        {z.name}
                      </span>
                      <p className="text-[11px] text-slate-300">{z.description}</p>
                      <p className="text-[10px] text-slate-500 italic">"{z.feel}"</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                        {z.range}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Cible : <span className="text-white font-semibold">{z.target}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Swimming Zones */}
          {sportTab === 'swim' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Allures de Natation Crawl (aux 100m)</h3>
                  <p className="text-xs text-slate-400">
                    CSS (Critical Swim Speed) : <strong className="text-cyan-400 font-mono">{profile.swimMetrics.cssPacePer100m}/100m</strong>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                  Respiration 3 temps
                </span>
              </div>

              <div className="space-y-3">
                {[zones.swim.z1, zones.swim.z2, zones.swim.z3, zones.swim.z4].map((z, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1 sm:max-w-[60%]">
                      <span className={`text-xs font-bold ${
                        idx === 0 ? 'text-slate-300' : idx === 1 ? 'text-cyan-400' : idx === 2 ? 'text-blue-400' : 'text-purple-400'
                      }`}>
                        {z.name}
                      </span>
                      <p className="text-[11px] text-slate-300">{z.description}</p>
                      <p className="text-[10px] text-slate-500 italic">"{z.feel}"</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                        {z.range}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Cible : <span className="text-white font-semibold">{z.target}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Heart Rate Zones */}
          {sportTab === 'hr' && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Zones de Fréquence Cardiaque (Karvonen)</h3>
                  <p className="text-xs text-slate-400">
                    FC Repos : {profile.hrRest} bpm | FC Max : {profile.hrMax} bpm (Réserve : {profile.hrMax - profile.hrRest} bpm)
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                  Cardio Guidé
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {[
                  { name: 'Z1 Récup', range: zones.heartRate.z1, color: 'text-slate-300 bg-slate-950 border-slate-800' },
                  { name: 'Z2 EF', range: zones.heartRate.z2, color: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60' },
                  { name: 'Z3 Tempo', range: zones.heartRate.z3, color: 'text-amber-300 bg-amber-950/40 border-amber-800/60' },
                  { name: 'Z4 Seuil', range: zones.heartRate.z4, color: 'text-orange-300 bg-orange-950/40 border-orange-800/60' },
                  { name: 'Z5 Max', range: zones.heartRate.z5, color: 'text-rose-300 bg-rose-950/40 border-rose-800/60' },
                ].map((hrz, i) => (
                  <div key={i} className={`p-3 rounded-xl border text-center ${hrz.color}`}>
                    <div className="text-[11px] font-bold">{hrz.name}</div>
                    <div className="text-xs font-mono font-extrabold mt-1">{hrz.range}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Race Time Predictor */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Zap className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Estimateur Chrono Triathlon</h3>
            </div>

            <p className="text-xs text-slate-300">
              Simulation du temps d'arrivée et des splits selon vos allures actuelles et l'économie d'effort :
            </p>

            {/* Distance buttons */}
            <div className="grid grid-cols-5 gap-1">
              {(['xs', 's', 'm', 'l', 'xl'] as RaceDistance[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setPredictedDist(d)}
                  className={`py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    predictedDist === d
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Prediction Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-white">{prediction.distanceLabel}</span>
                <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono">
                  {prediction.totalTime}
                </span>
              </div>

              {/* Splits */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <span>🏊 Natation ({prediction.swimDistance})</span>
                  </span>
                  <span className="font-mono font-bold text-cyan-300">{prediction.swimTime}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>⚡ Transition 1 (T1)</span>
                  <span className="font-mono">{prediction.t1Time}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <span>🚴 Vélo ({prediction.bikeDistance})</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300">{prediction.bikeTime}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>⚡ Transition 2 (T2)</span>
                  <span className="font-mono">{prediction.t2Time}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <span>🏃 Course ({prediction.runDistance})</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-300">{prediction.runTime}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Astuce Débutant</strong> : En triathlon, la gestion d'effort à vélo est le secret d'une bonne course à pied. Ne dépassez pas votre Z2/Z3 à vélo pour ne pas marcher sur la course !
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
