import React from 'react';
import { Calendar, Compass, Layers, ShieldCheck, UserCheck, Download, PlusCircle, Activity } from 'lucide-react';
import { AthleteProfile, TrainingPlan } from '../types/triathlon';
import { downloadIcsFile } from '../utils/icsExporter';

interface NavbarProps {
  activeTab: 'dashboard' | 'plan' | 'zones' | 'toolkit';
  setActiveTab: (tab: 'dashboard' | 'plan' | 'zones' | 'toolkit') => void;
  profile: AthleteProfile;
  plan: TrainingPlan;
  onOpenOnboarding: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  plan,
  onOpenOnboarding,
  onOpenProfile,
}) => {
  const handleExportIcs = () => {
    downloadIcsFile(plan, profile.name);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
                  TriaTrain
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                  {profile.raceObjective.distance.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Coach & Programme Triathlon Personnalisé</p>
            </div>
          </div>

          {/* Nav Tabs */}
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
              <span>Guide Débutant & T1/T2</span>
            </button>
          </nav>

          {/* Quick Actions & Profile */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportIcs}
              title="Exporter le plan vers Apple Calendar / Google Calendar (.ics)"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .ICS</span>
            </button>

            <button
              onClick={onOpenOnboarding}
              title="Nouveau programme sur-mesure"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 rounded-lg transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouveau Plan</span>
            </button>

            <button
              onClick={onOpenProfile}
              className="flex items-center space-x-2 pl-2 pr-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/80 transition"
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

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/60 bg-slate-950/95 py-2 px-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center space-y-1 text-[11px] ${
            activeTab === 'dashboard' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Semaine</span>
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex flex-col items-center space-y-1 text-[11px] ${
            activeTab === 'plan' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plan</span>
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex flex-col items-center space-y-1 text-[11px] ${
            activeTab === 'zones' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Zones</span>
        </button>
        <button
          onClick={() => setActiveTab('toolkit')}
          className={`flex flex-col items-center space-y-1 text-[11px] ${
            activeTab === 'toolkit' ? 'text-purple-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Guide</span>
        </button>
      </div>
    </header>
  );
};
