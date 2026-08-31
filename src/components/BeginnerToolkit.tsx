import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckSquare, Square, AlertTriangle, Lightbulb, 
  Layers, Flame, HelpCircle, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { T1_STEPS, T2_STEPS, GEAR_CHECKLIST, NUTRITION_GUIDES, GearItem } from '../data/beginnerGuides';
import { AthleteProfile, RaceDistance } from '../types/triathlon';

interface BeginnerToolkitProps {
  profile: AthleteProfile;
}

export const BeginnerToolkit: React.FC<BeginnerToolkitProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'transitions' | 'checklist' | 'nutrition' | 'rules'>('transitions');
  const [transitionMode, setTransitionMode] = useState<'t1' | 't2'>('t1');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // LocalStorage-backed checklist
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('triatrain_gear_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [nutritionDist, setNutritionDist] = useState<string>(profile.raceObjective.distance || 'm');

  const toggleCheckItem = (id: string) => {
    const updated = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(updated);
    try {
      localStorage.setItem('triatrain_gear_checklist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const resetChecklist = () => {
    setCheckedItems({});
    try {
      localStorage.removeItem('triatrain_gear_checklist');
    } catch (e) {
      console.error(e);
    }
  };

  const steps = transitionMode === 't1' ? T1_STEPS : T2_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];

  const totalGearCount = GEAR_CHECKLIST.length;
  const packedCount = Object.values(checkedItems).filter(Boolean).length;
  const packedPct = Math.round((packedCount / totalGearCount) * 100);

  const nutGuide = NUTRITION_GUIDES[nutritionDist] || NUTRITION_GUIDES['m'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/30 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Boîte à Outils & Guides du Triathlète Débutant</h2>
            <p className="text-xs text-slate-400">
              Maîtrisez les transitions T1/T2, préparez votre sac de course sans rien oublier et calibrez votre nutrition
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'transitions', label: '⚡ Simulateur Transitions T1 & T2' },
          { id: 'checklist', label: `🎒 Checklist Sac de Course (${packedCount}/${totalGearCount})` },
          { id: 'nutrition', label: '🍌 Guide Nutrition & Ravitaillement' },
          { id: 'rules', label: '📜 Règles d\'Arbitrage & Pièges' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition text-center ${
              activeTab === tab.id
                ? 'bg-purple-950/80 text-purple-300 border border-purple-600/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Transitions Simulator */}
      {activeTab === 'transitions' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Simulateur Étape par Étape des Transitions de Triathlon
              </h3>
              <p className="text-xs text-slate-400">
                La transition est la 4ème discipline du triathlon. Répétez mentalement les gestes pour gagner 2 minutes sans effort physique.
              </p>
            </div>

            {/* T1 / T2 Switcher */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => { setTransitionMode('t1'); setCurrentStepIndex(0); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  transitionMode === 't1' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                T1 (Eau 🏊 ➔ Vélo 🚴)
              </button>
              <button
                onClick={() => { setTransitionMode('t2'); setCurrentStepIndex(0); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  transitionMode === 't2' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                T2 (Vélo 🚴 ➔ Course 🏃)
              </button>
            </div>
          </div>

          {/* Stepper Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Étape {currentStep.order} sur {steps.length} : <strong className="text-white">{currentStep.title}</strong></span>
              <span className="font-mono">{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${transitionMode === 't1' ? 'bg-cyan-500' : 'bg-amber-500'}`}
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Detail Card */}
          <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                transitionMode === 't1' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {currentStep.order}
              </div>
              <h4 className="text-base font-bold text-white">{currentStep.title}</h4>
            </div>

            {/* Action */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed">
              <strong>Action requise :</strong> {currentStep.action}
            </div>

            {/* Critical rule alert if present */}
            {currentStep.criticalRule && (
              <div className="p-4 bg-rose-950/50 border border-rose-600/50 rounded-xl flex items-start space-x-3 text-xs text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-300 font-bold mb-0.5">RÈGLE D'ARBITRAGE STRICTE :</strong>
                  <span>{currentStep.criticalRule}</span>
                </div>
              </div>
            )}

            {/* Pro tip */}
            <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-start space-x-3 text-xs text-purple-200">
              <Lightbulb className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-purple-300 font-bold mb-0.5">Astuce du Coach Débutant :</strong>
                <span>{currentStep.proTip}</span>
              </div>
            </div>
          </div>

          {/* Step navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Étape précédente</span>
            </button>

            <button
              onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === steps.length - 1}
              className="flex items-center space-x-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-600/20 transition"
            >
              <span>Étape suivante</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Gear Checklist */}
      {activeTab === 'checklist' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Checklist Interactive du Sac de Triathlon Jour J
              </h3>
              <p className="text-xs text-slate-400">
                Cochez chaque matériel lors de la préparation de votre sac la veille de la course. Sauvegarde automatique.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-purple-300">
                {packedCount} / {totalGearCount} préparés ({packedPct}%)
              </span>
              <button
                onClick={resetChecklist}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 transition"
                title="Réinitialiser toutes les cases"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${packedPct}%` }}
            />
          </div>

          {/* Checklist Sections */}
          {(['swim', 'bike', 'run', 'transition'] as const).map((cat) => {
            const items = GEAR_CHECKLIST.filter((g) => g.category === cat);
            const catTitle = cat === 'swim' ? '🏊 Équipement Natation' : cat === 'bike' ? '🚴 Équipement Vélo' : cat === 'run' ? '🏃 Équipement Course à Pied' : '⚡ Transition & Administratif';

            return (
              <div key={cat} className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{catTitle}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((item) => {
                    const isChecked = !!checkedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCheckItem(item.id)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
                        }`}
                      >
                        <button type="button" className="mt-0.5 text-slate-400">
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        <div className="space-y-0.5">
                          <div className={`text-xs font-semibold ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                            {item.name}
                            {item.essential && (
                              <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 font-bold uppercase">
                                Obligatoire
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.notes}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Nutrition Guide */}
      {activeTab === 'nutrition' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Stratégie Nutrition & Hydratation selon la Distance
              </h3>
              <p className="text-xs text-slate-400">
                La nutrition est la clé pour éviter le "mur" énergétique et les crampes d'estomac.
              </p>
            </div>

            {/* Distance select */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['xs', 's', 'm', 'l', 'xl'] as RaceDistance[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setNutritionDist(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    nutritionDist === d
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Glucides sur le Vélo</span>
              <div className="text-lg font-bold text-amber-400 font-mono">{nutGuide.bikeCarbsPerHour}</div>
              <span className="text-[10px] text-slate-500">Boisson isotonique + gels/barres</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Glucides en Course à Pied</span>
              <div className="text-lg font-bold text-emerald-400 font-mono">{nutGuide.runCarbsPerHour}</div>
              <span className="text-[10px] text-slate-500">Gels liquides faciles à digérer</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Hydratation Cible</span>
              <div className="text-lg font-bold text-cyan-400 font-mono">{nutGuide.hydrationPerHour}</div>
              <span className="text-[10px] text-slate-500">Petites gorgées régulières</span>
            </div>
          </div>

          {/* Detailed Advice */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Conseils Stratégiques pour {nutGuide.distance}
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {nutGuide.keyAdvice.map((advice, idx) => (
                <li key={idx} className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span className="leading-relaxed">{advice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: Rules & Traps */}
      {activeTab === 'rules' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Les 5 Règles d'Or pour Ne Pas Être Pénalisé</h3>
            <p className="text-xs text-slate-400">Les erreurs les plus fréquentes commises par les débutants lors de leur 1ère course.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>1. Le Casque dans le Parc à Vélo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vous devez <strong>clipser votre jugulaire avant même de décrocher votre vélo</strong> de son support. En T2, vous ne devez détacher votre casque qu'<strong>après avoir raccroché le vélo</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>2. Position du Dossard (Dos à vélo, Ventre à pied)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sur le vélo, le dossard doit être impérativement <strong>derrière (dans le dos)</strong>. En course à pied, vous devez pivoter votre ceinture pour le mettre <strong>devant (sur le ventre)</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>3. Le Drafting (Aspiration-Abri)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sauf mention explicite sur les courses Sprint avec drafting, il est <strong>interdit de rouler dans la roue d'un concurrent</strong>. Vous devez respecter un rectangle de 10 à 12 mètres entre votre roue avant et le coureur devant.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>4. Interdiction de Jeter des Déchets (Gel / Bidon)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tout emballage de gel ou bidon jeté hors des zones de propreté officielles entraîne une <strong>disqualification immédiate</strong> avec carton rouge. Glissez vos emballages vides sous la cuisse de votre trifonction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
