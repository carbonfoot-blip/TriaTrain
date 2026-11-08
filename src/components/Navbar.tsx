import React from 'react';
import {
  Calendar,
  Compass,
  Layers,
  ShieldCheck,
  PlusCircle,
  Activity,
  Watch,
  Sparkles,
  User,
} from 'lucide-react';
import { AthleteProfile, TrainingPlan } from '../types/triathlon';

interface NavbarProps {
  activeTab: 'dashboard' | 'plan' | 'zones' | 'toolkit';
  setActiveTab: (tab: 'dashboard' | 'plan' | 'zones' | 'toolkit') => void;
  profile: AthleteProfile;
  plan: TrainingPlan;
  onOpenOnboarding: () => void;
  onOpenProfile: () => void;
  onOpenGarminSync?: () => void;
  onOpenWhatsNew?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  plan,
  onOpenOnboarding,
  onOpenProfile,
  onOpenGarminSync,
  onOpenWhatsNew,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Brand */}
            <div
              className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                    TriaTrain
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 truncate">
                    {profile.targetSport === 'run'
                      ? '🏃'
                      : profile.targetSport === 'bike'
                        ? '🚴'
                        : profile.targetSport === 'swim'
                          ? '🏊'
                          : '🏊🚴🏃'}{' '}
                    {profile.raceObjective.distance
                      .replace('run_', '')
                      .replace('bike_', '')
                      .replace('swim_', '')
                      .toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Coach & Plans d'Entraînement Scientifiques (Triathlon, Marathon, Cyclisme)
                </p>
              </div>
            </div>

            {/* Desktop Nav Tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Semaine en cours</span>
              </button>

              <button
                onClick={() => setActiveTab('plan')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'plan'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Vue Globale ({plan.totalWeeks} sem.)</span>
              </button>

              <button
                onClick={() => setActiveTab('zones')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'zones'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Zones & Allures</span>
              </button>

              <button
                onClick={() => setActiveTab('toolkit')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'toolkit'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Guide & T1/T2</span>
              </button>
            </nav>

            {/* Quick Actions & Profile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {onOpenWhatsNew && (
                <button
                  onClick={onOpenWhatsNew}
                  title="Découvrir les nouveautés de TriaTrain"
                  className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-700/50 rounded-lg transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">Nouveautés</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-amber-500/20 text-amber-200">
                    v1.3
                  </span>
                </button>
              )}

              {onOpenGarminSync && (
                <button
                  onClick={onOpenGarminSync}
                  title="Synchroniser ma montre Garmin / COROS & Cloud"
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 rounded-lg transition"
                >
                  <Watch className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Garmin Sync</span>
                </button>
              )}

              <button
                onClick={onOpenOnboarding}
                title="Nouveau programme sur-mesure"
                className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 rounded-lg transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nouveau Plan</span>
              </button>

              <button
                onClick={onOpenProfile}
                title="Profil, Zones, Semaine Type & Synchronisation Cloud (iPhone ↔ PC)"
                className="flex items-center space-x-1.5 pl-1.5 pr-2 sm:pl-2 sm:pr-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {profile.name ? profile.name[0].toUpperCase() : 'A'}
                </div>
                <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[100px] truncate">
                  {profile.name.split(' ')[0]}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile (iPhone Ergonomics) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-lg px-2 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'dashboard'
                ? 'text-cyan-400 bg-cyan-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Semaine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'plan'
                ? 'text-amber-400 bg-amber-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Plan</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenGarminSync && onOpenGarminSync()}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 font-bold shadow-sm"
          >
            <Watch className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] mt-0.5">Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              activeTab === 'zones'
                ? 'text-emerald-400 bg-emerald-950/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Zones</span>
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-300 hover:text-white transition"
          >
            <User className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] mt-0.5">Profil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
