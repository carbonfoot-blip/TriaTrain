import React from 'react';
import {
  X,
  Sparkles,
  Calendar,
  UploadCloud,
  RefreshCw,
  Activity,
  Compass,
  Layers,
  CheckCircle2,
  Smartphone,
  Cloud,
} from 'lucide-react';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Nouveautés & Versions de TriaTrain</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  v1.2 Actuelle
                </span>
              </div>
              <p className="text-xs text-slate-400">Historique des fonctionnalités et améliorations de votre coach d'entraînement</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* VERSION 1.2 */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/40 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                  Version 1.2
                </span>
                <span className="text-sm font-bold text-white">
                  Expérience Mobile (iPhone) & Synchronisation Cloud (iPhone ↔ PC)
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/70 px-2.5 py-0.5 rounded border border-emerald-800/60">
                4 novembre 2026
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    1. Synchronisation Cloud Multi-Appareils (Push / Pull via Intervals.icu)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Sauvegardez et récupérez l'intégralité de votre profil, votre programme, vos réglages et tous vos résultats de séances entre votre <strong>iPhone</strong> et votre <strong>PC</strong> en utilisant simplement votre ID + Clé API Intervals.icu (sans aucun compte supplémentaire à créer).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    2. Centre de Configuration Unifié dans « Profil » & Ergonomie Mobile iPhone
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Toute la configuration (Objectif, FC & Allures, Semaine Type, Clé Garmin / Intervals.icu) est désormais regroupée dans <strong>Profil</strong>. Une fois la clé configurée, la fenêtre de synchronisation montre va droit au but, avec une barre de navigation fixe en bas d'écran sur iPhone et des cartes de repos compactes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VERSION 1.1 */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 border border-cyan-500/40 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider">
                  Version 1.1
                </span>
                <span className="text-sm font-bold text-white">Intégration Montres GPS & Dates Flexibles</span>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded border border-cyan-800/60">
                3 novembre 2026
              </span>
            </div>

            <div className="space-y-3">
              {/* i) Modification de date de départ du plan */}
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    1. Modification de la date de départ du plan (Semaine 1)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Choisissez ou modifiez librement la date réelle de début de votre programme (dans le passé comme <em>la semaine passée</em>, la semaine en cours ou dans le futur). Vous pouvez ainsi démarrer un programme rétroactivement et y importer les séances déjà réalisées en Semaine 1.
                  </p>
                </div>
              </div>

              {/* ii) Export du plan vers montre Garmin/Coros */}
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    2. Export du plan (semaine) vers montre Garmin / COROS
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Poussez toute votre semaine d'entraînement ou une séance précise directement vers votre montre GPS (via synchronisation directe ou fichier <code className="text-cyan-300">.FIT</code>). Chaque étape, répétition, allure cible et exercice technique (<em>drills</em>) s'affiche étape par étape sur l'écran de votre montre.
                  </p>
                </div>
              </div>

              {/* iii) Synchronisation de la montre Garmin/Coros vers TriaTrain */}
              <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    3. Synchronisation de la montre Garmin / COROS vers TriaTrain
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Importez les résultats de vos sorties enregistrées sur votre montre pour valider automatiquement vos séances prévues et suivre votre progression réelle (durée, distance, allure, fréquence cardiaque moyenne/max et puissance).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* VERSION 1.0 */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700">
                  Version 1.0
                </span>
                <span className="text-sm font-bold text-slate-200">Lancement de TriaTrain — Fonctionnalités de base</span>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                15 octobre 2026
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Générateur de Plans sur-mesure</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Création automatique de programmes pour Triathlon (XS à Ironman), Course à pied (5 km au Marathon), Cyclisme et Natation sur 4 phases progressives (Base, Build, Peak, Affûtage).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Calculateur de Zones & Allures</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calibration automatique de vos 5 zones cardiaques (méthode Karvonen), allures de course (EF, Seuil, VMA), puissance vélo (FTP) et nage (CSS / 100m).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Calendrier Hebdomadaire & Catalogue</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Organisation flexible de votre semaine type (déplacement de séances, ajout/suppression, catalogue de séances types par sport) et suivi de votre progression.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guide Triathlon, Nutrition & T1/T2</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Boîte à outils complète pour réussir ses transitions T1/T2, gérer sa nutrition en course et préparer sa checklist matériel le jour J.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-cyan-600/20"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
