import React, { useState } from 'react';
import { X, Save, User, Activity, Gauge, Flame, Download, Upload, RefreshCw, Layers } from 'lucide-react';
import { AthleteProfile, RaceDistance, RaceGoal, TargetSport } from '../types/triathlon';

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  onSaveProfile: (profile: AthleteProfile) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  isOpen,
  onClose,
  profile: initialProfile,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [profile, setProfile] = useState<AthleteProfile>(initialProfile);
  const [saveToast, setSaveToast] = useState<boolean>(false);

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

  const handleSave = () => {
    onSaveProfile(profile);
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 400);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `TriaTrain_Profile_${profile.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.runMetrics && parsed.bikeMetrics) {
          setProfile(parsed);
        }
      } catch (err) {
        alert('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Paramètres du Profil & Allures</h3>
              <p className="text-xs text-slate-400">Ajustez votre sport cible, vos allures ou chargez une sauvegarde</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* Target Sport & Goal Switcher */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4" />
              <span>Discipline Cible & Distance</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'triathlon', label: '🏊🚴🏃 Triathlon' },
                { id: 'run', label: '🏃 Course à pied' },
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
                  onChange={(e) => setProfile({
                    ...profile,
                    raceObjective: { ...profile.raceObjective, distance: e.target.value as RaceDistance }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs font-medium"
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
                  value={profile.raceObjective.raceName}
                  onChange={(e) => setProfile({
                    ...profile,
                    raceObjective: { ...profile.raceObjective, raceName: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                  placeholder="Ex: Marathon de Paris ou Défi Pierre Lavoie"
                />
              </div>
            </div>
          </div>

          {/* Athlete Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Identité & Biométrie</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Âge</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value, 10) || 30 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Poids (kg)</label>
                <input
                  type="number"
                  value={profile.weightKg}
                  onChange={(e) => setProfile({ ...profile, weightKg: parseFloat(e.target.value) || 70 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Taille (cm)</label>
                <input
                  type="number"
                  value={profile.heightCm}
                  onChange={(e) => setProfile({ ...profile, heightCm: parseInt(e.target.value, 10) || 175 })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Running Paces */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🏃 Allures Course à Pied (min/km)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Allure EF (Z2)</label>
                <input
                  type="text"
                  value={profile.runMetrics.efPaceMinKm}
                  onChange={(e) => setProfile({
                    ...profile,
                    runMetrics: { ...profile.runMetrics, efPaceMinKm: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Allure Seuil (Z4)</label>
                <input
                  type="text"
                  value={profile.runMetrics.thresholdPaceMinKm}
                  onChange={(e) => setProfile({
                    ...profile,
                    runMetrics: { ...profile.runMetrics, thresholdPaceMinKm: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Allure Marathon (Z3)</label>
                <input
                  type="text"
                  value={profile.runMetrics.marathonPaceMinKm}
                  onChange={(e) => setProfile({
                    ...profile,
                    runMetrics: { ...profile.runMetrics, marathonPaceMinKm: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Allure VMA (Z5)</label>
                <input
                  type="text"
                  value={profile.runMetrics.vmaPaceMinKm}
                  onChange={(e) => setProfile({
                    ...profile,
                    runMetrics: { ...profile.runMetrics, vmaPaceMinKm: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Bike & Swim */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">🚴 Cyclisme & 🏊 Natation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">FTP Vélo (Watts)</label>
                <input
                  type="number"
                  value={profile.bikeMetrics.ftpWatts}
                  onChange={(e) => setProfile({
                    ...profile,
                    bikeMetrics: { ...profile.bikeMetrics, ftpWatts: parseInt(e.target.value, 10) || 200 }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Vitesse Z2 plat (km/h)</label>
                <input
                  type="number"
                  step="0.5"
                  value={profile.bikeMetrics.avgZ2SpeedKmh}
                  onChange={(e) => setProfile({
                    ...profile,
                    bikeMetrics: { ...profile.bikeMetrics, avgZ2SpeedKmh: parseFloat(e.target.value) || 25 }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">CSS Natation (mm:ss/100m)</label>
                <input
                  type="text"
                  value={profile.swimMetrics.cssPacePer100m}
                  onChange={(e) => setProfile({
                    ...profile,
                    swimMetrics: { ...profile.swimMetrics, cssPacePer100m: e.target.value }
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Backup Data Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px]">Sauvegarde & Restauration locale</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exporter JSON</span>
              </button>

              <label className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Importer JSON</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/30 transition"
          >
            <Save className="w-4 h-4" />
            <span>{saveToast ? 'Sauvegardé !' : 'Appliquer et recalculer le plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
