import { AthleteProfile, SportType, Workout, WorkoutCategory, WorkoutStep } from '../types/triathlon';

export interface WorkoutTemplate {
  id: string;
  title: string;
  sport: SportType;
  category: WorkoutCategory;
  durationMinutes: number;
  distanceMeters: number;
  targetZone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  intensityRpe: number; // 1-10
  shortSummary: string;
  description: string;
  coachTips: string[];
  stepsGenerator: (profile: AthleteProfile) => WorkoutStep[];
}

export const WORKOUT_CATALOG: WorkoutTemplate[] = [
  // ===================== COURSE À PIED =====================
  {
    id: 'run-ef-basic',
    title: 'Footing Endurance Fondamentale (EF)',
    sport: 'run',
    category: 'endurance',
    durationMinutes: 45,
    distanceMeters: 7000,
    targetZone: 'Z2',
    intensityRpe: 4,
    shortSummary: 'Footing d\'endurance en aisance respiratoire + lignes droites',
    description: 'Course en totale aisance respiratoire. Développe le réseau capillaire et l\'utilisation des lipides.',
    coachTips: [
      'Vous devez pouvoir parler sans être essoufflé tout le long de la séance.',
      'Finissez avec 4 lignes droites de 80m dynamiques pour le pied.'
    ],
    stepsGenerator: (p) => [
      { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Allure très lente' },
      { type: 'interval', name: 'Endurance Fondamentale Z2', durationMinutes: 30, targetZone: 'Z2', targetDescription: `Allure cible : ${p.runMetrics.efPaceMinKm || '6:15'}/km` },
      { type: 'drill', name: '4 x 80m lignes droites', durationMinutes: 5, targetZone: 'Z4', targetDescription: 'Foulée déliée et grandie' }
    ]
  },
  {
    id: 'run-vma-short',
    title: 'Intervalles VMA Courts (30s / 30s)',
    sport: 'run',
    category: 'intervals',
    durationMinutes: 50,
    distanceMeters: 8500,
    targetZone: 'Z5',
    intensityRpe: 8,
    shortSummary: '10 à 12 x (30s vite @ VMA / 30s trot)',
    description: 'Fractions courtes à haute intensité pour développer la VMA et la puissance aérobie maximale.',
    coachTips: [
      'Gardez une cadence élevée (~180 pas/min) sur les fractions rapides.',
      'Ne sprintez pas au départ : régularité parfaite sur l\'ensemble des répétitions.'
    ],
    stepsGenerator: (p) => [
      { type: 'warmup', name: 'Échauffement complet', durationMinutes: 15, targetZone: 'Z2', targetDescription: `Footing ${p.runMetrics.efPaceMinKm || '6:15'}/km` },
      { type: 'drill', name: 'Éducatifs dynamiques (montées de genoux, talons-fesses)', durationMinutes: 5, targetZone: 'Z3', targetDescription: 'Posture haute' },
      { type: 'interval', name: '10 x (30s VMA / 30s trot)', durationMinutes: 10, targetZone: 'Z5', targetDescription: `Allure : ${p.runMetrics.vmaPaceMinKm || '4:15'}/km` },
      { type: 'cooldown', name: 'Retour au calme très doux', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Trot lent et marche' }
    ]
  },
  {
    id: 'run-threshold-intervals',
    title: 'Intervalles au Seuil (4 x 1000m)',
    sport: 'run',
    category: 'threshold',
    durationMinutes: 55,
    distanceMeters: 9500,
    targetZone: 'Z4',
    intensityRpe: 8,
    shortSummary: '4 x 1000m allure seuil avec 1\'45 récup',
    description: 'Séance référence pour repousser le seuil lactique et maintenir une vitesse de croisière élevée.',
    coachTips: [
      'Calibrage métronome : chaque 1000m doit être couru à la seconde près.',
      'Respirez profondément et relâchez les épaules.'
    ],
    stepsGenerator: (p) => [
      { type: 'warmup', name: 'Footing échauffement', durationMinutes: 15, targetZone: 'Z2', targetDescription: `Footing souple ${p.runMetrics.efPaceMinKm || '6:15'}/km` },
      { type: 'interval', name: '4 x 1000m @ Allure Seuil', durationMinutes: 25, targetZone: 'Z4', targetDescription: `Allure : ${p.runMetrics.thresholdPaceMinKm || '4:50'}/km (R=1'45 trot)` },
      { type: 'cooldown', name: 'Décrassage lent', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Jogging très souple' }
    ]
  },
  {
    id: 'run-long-progressive',
    title: 'Sortie Longue Progressive (Z2 ➔ Z3)',
    sport: 'run',
    category: 'endurance',
    durationMinutes: 80,
    distanceMeters: 13500,
    targetZone: 'Z2',
    intensityRpe: 6,
    shortSummary: 'Sortie longue fondamentale avec 20 min tempo final',
    description: 'Bâtit l\'endurance musculaire et teste la tolérance aux kilomètres accumulés.',
    coachTips: [
      'Prenez de l\'eau toutes les 20 minutes dès le départ.',
      'Ne démarrez pas trop vite pour avoir les jambes fraîches sur le bloc tempo final.'
    ],
    stepsGenerator: (p) => [
      { type: 'warmup', name: 'Mise en route lente', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Footing cool' },
      { type: 'interval', name: 'Bloc Endurance Fondamentale', durationMinutes: 45, targetZone: 'Z2', targetDescription: `Allure : ${p.runMetrics.efPaceMinKm || '6:15'}/km` },
      { type: 'interval', name: 'Bloc Tempo / Allure Semi-Marathon', durationMinutes: 20, targetZone: 'Z3', targetDescription: `Allure : ${p.runMetrics.marathonPaceMinKm || '5:25'}/km` }
    ]
  },
  {
    id: 'run-recovery-soft',
    title: 'Footing Récupération Active (30 min)',
    sport: 'run',
    category: 'recovery',
    durationMinutes: 30,
    distanceMeters: 4500,
    targetZone: 'Z1',
    intensityRpe: 3,
    shortSummary: 'Footing ultra-léger pour stimuler la régénération',
    description: 'Décrassage musculaire sans impact physiologique important. Privilégier herbe ou sentier souple.',
    coachTips: ['Ne forcez jamais sur cette séance : elle doit vous laisser plus frais qu\'au départ.'],
    stepsGenerator: (p) => [
      { type: 'interval', name: 'Jogging très doux', durationMinutes: 30, targetZone: 'Z1', targetDescription: `${p.runMetrics.efPaceMinKm || '6:15'} + 30s/km` }
    ]
  },
  {
    id: 'run-hills-strength',
    title: 'Séance Côtes & Puissance Foulée',
    sport: 'run',
    category: 'intervals',
    durationMinutes: 45,
    distanceMeters: 7500,
    targetZone: 'Z4',
    intensityRpe: 7,
    shortSummary: '8 à 10 répétitions de côtes de 45s dynamiques',
    description: 'Renforce les quadriceps, les mollets et dynamise la pose de pied sans traumatisme excentrique.',
    coachTips: ['Montez le genou et descendez en marchant ou trottinant très lentement.'],
    stepsGenerator: (p) => [
      { type: 'warmup', name: 'Échauffement plat', durationMinutes: 15, targetZone: 'Z2', targetDescription: 'Footing progressif' },
      { type: 'interval', name: '8 x 45s en côte rythmée', durationMinutes: 15, targetZone: 'Z4', targetDescription: 'Poussée active, récup descente trot' },
      { type: 'cooldown', name: 'Retour au calme plat', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Trot lent' }
    ]
  },

  // ===================== CYCLISME =====================
  {
    id: 'bike-cadence-technique',
    title: 'Vélo : Cadence & Vélocité (95-105 rpm)',
    sport: 'bike',
    category: 'technique',
    durationMinutes: 60,
    distanceMeters: 26000,
    targetZone: 'Z2',
    intensityRpe: 4,
    shortSummary: 'Souplesse de coup de pédale et coordination neuro-musculaire',
    description: 'Améliore le rendement du coup de pédale sur le plat et réduit la fatigue musculaire.',
    coachTips: ['Ne sautillez pas sur la selle : gainage et fluidité du pédalage.'],
    stepsGenerator: (p) => {
      const ftp = p.bikeMetrics.ftpWatts || 200;
      return [
        { type: 'warmup', name: 'Échauffement 15 min', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Cadence 85 rpm souple' },
        { type: 'interval', name: 'Bloc Vélocité haute', durationMinutes: 35, targetZone: 'Z2', targetDescription: `Cadence 95-105 rpm @ ${Math.round(ftp * 0.65)}W` },
        { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Petit plateau relâché' }
      ];
    }
  },
  {
    id: 'bike-intervals-sweetspot',
    title: 'Vélo : Intervalles SweetSpot (3 x 10 min)',
    sport: 'bike',
    category: 'threshold',
    durationMinutes: 65,
    distanceMeters: 30000,
    targetZone: 'Z4',
    intensityRpe: 7,
    shortSummary: '3 x 10 min à 88-92% FTP avec 3 min récup',
    description: 'La zone clé SweetSpot développe la puissance sans épuiser excessivement le système nerveux.',
    coachTips: ['Buvez 1 gorgée d\'eau toutes les 10 minutes, position aéro sur les prolongateurs.'],
    stepsGenerator: (p) => {
      const ftp = p.bikeMetrics.ftpWatts || 200;
      const ssWatts = Math.round(ftp * 0.88);
      return [
        { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Montée progressive des watts' },
        { type: 'interval', name: `3 x 10 min @ SweetSpot (${ssWatts}W)`, durationMinutes: 35, targetZone: 'Z4', targetDescription: `Tenue constante ${ssWatts}W (R=3' Z1)` },
        { type: 'cooldown', name: 'Retour au calme', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Moulinage souple' }
      ];
    }
  },
  {
    id: 'bike-long-endurance',
    title: 'Sortie Longue Cyclisme (Endurance Z2)',
    sport: 'bike',
    category: 'endurance',
    durationMinutes: 120,
    distanceMeters: 55000,
    targetZone: 'Z2',
    intensityRpe: 5,
    shortSummary: '2h à 3h de selle à allure constante et aérobie',
    description: 'Endurance de base, travail d\'adaptation digestive et gestion du braquet.',
    coachTips: [
      'Consommez 40 à 60g de glucides par heure (barre énergétique ou boisson isotonique).',
      'Restez assis et moulinez dans les bosses pour épargner vos fibres musculaires.'
    ],
    stepsGenerator: (p) => {
      const ftp = p.bikeMetrics.ftpWatts || 200;
      return [
        { type: 'warmup', name: 'Mise en route 20 min', durationMinutes: 20, targetZone: 'Z1', targetDescription: 'Départ tranquille' },
        { type: 'interval', name: `Endurance Z2 (${Math.round(ftp * 0.68)}W)`, durationMinutes: 85, targetZone: 'Z2', targetDescription: 'Allure régulière' },
        { type: 'cooldown', name: 'Retour au calme 15 min', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Moulinage très léger' }
      ];
    }
  },
  {
    id: 'bike-tempo-peloton',
    title: 'Vélo : Rythme Peloton & Relais (Zone 3)',
    sport: 'bike',
    category: 'tempo',
    durationMinutes: 75,
    distanceMeters: 36000,
    targetZone: 'Z3',
    intensityRpe: 6,
    shortSummary: 'Simulation de relais en peloton et rythme soutenu',
    description: 'Travail à allure soutenue pour s\'habituer à rouler vite en groupe ou contre le vent.',
    coachTips: ['Positionnez les mains aux cocottes ou sur les prolongateurs.'],
    stepsGenerator: (p) => {
      const ftp = p.bikeMetrics.ftpWatts || 200;
      return [
        { type: 'warmup', name: 'Échauffement', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Mise en route' },
        { type: 'interval', name: `Bloc Tempo Soutenu (${Math.round(ftp * 0.80)}W)`, durationMinutes: 45, targetZone: 'Z3', targetDescription: 'Rythme continu soutenu' },
        { type: 'cooldown', name: 'Retour au calme', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Pédalage très doux' }
      ];
    }
  },
  {
    id: 'bike-recovery-spin',
    title: 'Vélo : Décrassage & Récupération Active (45 min)',
    sport: 'bike',
    category: 'recovery',
    durationMinutes: 45,
    distanceMeters: 18000,
    targetZone: 'Z1',
    intensityRpe: 2,
    shortSummary: 'Tournage de jambes très souple sur petit plateau',
    description: 'Pédalage sans aucune résistance pour stimuler le drainage sanguin des jambes.',
    coachTips: ['95-100 rpm avec zéro tension musculaire.'],
    stepsGenerator: (p) => [
      { type: 'interval', name: 'Moulinage décrassage Z1', durationMinutes: 45, targetZone: 'Z1', targetDescription: 'Résistance minimale' }
    ]
  },

  // ===================== NATATION =====================
  {
    id: 'swim-css-threshold',
    title: 'Natation : Séries Seuil CSS (10 x 100m Crawl)',
    sport: 'swim',
    category: 'threshold',
    durationMinutes: 50,
    distanceMeters: 2000,
    targetZone: 'Z3',
    intensityRpe: 7,
    shortSummary: '10 x 100m Crawl à allure CSS avec 15s récup',
    description: 'Séance de calibrage de l\'allure de compétition. Appuis solides et respiration régulière.',
    coachTips: ['Maintenez le coude haut sous l\'eau et expirez en continu.'],
    stepsGenerator: (p) => {
      const css = p.swimMetrics.cssPacePer100m || '2:00';
      return [
        { type: 'warmup', name: 'Échauffement 4 nages', distanceMeters: 400, targetZone: 'Z1', targetDescription: '200m crawl + 100m dos + 100m brasse' },
        { type: 'interval', name: '10 x 100m Crawl @ CSS', distanceMeters: 1000, targetZone: 'Z3', targetDescription: `Allure : ${css}/100m (R=15s)` },
        { type: 'drill', name: 'Éducatifs technique glisse', distanceMeters: 400, targetZone: 'Z2', targetDescription: 'Rattrapé + godille' },
        { type: 'recovery', name: 'Dos souple retour au calme', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Récupération' }
      ];
    }
  },
  {
    id: 'swim-aerobic-pull',
    title: 'Natation : Endurance Aérobie & Pull-Buoy / Plaquettes',
    sport: 'swim',
    category: 'endurance',
    durationMinutes: 45,
    distanceMeters: 1800,
    targetZone: 'Z2',
    intensityRpe: 5,
    shortSummary: 'Volume aérobie continu avec matériel d\'appui',
    description: 'Développe la puissance des bras et l\'alignement horizontal dans l\'eau.',
    coachTips: ['Glissez bien sur chaque mouvement de bras avant d\'engager la traction.'],
    stepsGenerator: (p) => {
      const css = p.swimMetrics.cssPacePer100m || '2:00';
      return [
        { type: 'warmup', name: 'Échauffement souple', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Nage libre sans forcer' },
        { type: 'interval', name: '3 x 400m Crawl avec Pull-Buoy', distanceMeters: 1200, targetZone: 'Z2', targetDescription: `Allure Z2 stable (${css} + 10s/100m)` },
        { type: 'cooldown', name: 'Retour au calme', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Dos crawlé relax' }
      ];
    }
  },
  {
    id: 'swim-technique-drills',
    title: 'Natation : Technique, Éducatifs & Glisse',
    sport: 'swim',
    category: 'technique',
    durationMinutes: 40,
    distanceMeters: 1500,
    targetZone: 'Z2',
    intensityRpe: 4,
    shortSummary: 'Éducatifs pour perfectionner la traction et le gainage',
    description: 'Séance axée sur les sensations d\'appui, la diminution de la traînée et la respiration.',
    coachTips: ['Regardez le fond du bassin à 45° vers l\'avant, pas devant vous.'],
    stepsGenerator: () => [
      { type: 'warmup', name: 'Échauffement doux', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Crawl souple' },
      { type: 'drill', name: 'Série éducatifs (Rattrapé, doigt surface, godille)', distanceMeters: 600, targetZone: 'Z2', targetDescription: 'Focus appuis paumes' },
      { type: 'interval', name: '6 x 50m Crawl régulier', distanceMeters: 300, targetZone: 'Z2', targetDescription: 'Moins de mouvements par longueur' },
      { type: 'cooldown', name: 'Retour au calme libre', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Très décontracté' }
    ]
  },
  {
    id: 'swim-recovery-water',
    title: 'Natation : Récupération & Mobilité scapulaire (1200m)',
    sport: 'swim',
    category: 'recovery',
    durationMinutes: 30,
    distanceMeters: 1200,
    targetZone: 'Z1',
    intensityRpe: 3,
    shortSummary: 'Nage décontractée, décompression de la colonne',
    description: 'Idéal après une grosse sortie vélo ou course à pied. Zéro stress cardiaque.',
    coachTips: ['Battez très peu des jambes et concentrez-vous sur la détente musculaire.'],
    stepsGenerator: () => [
      { type: 'interval', name: 'Crawl et Dos en continu très relax', distanceMeters: 1200, targetZone: 'Z1', targetDescription: 'Allure balade aquatique' }
    ]
  },

  // ===================== BRIQUE =====================
  {
    id: 'brick-classic-t2',
    title: 'Séance Brique : Vélo 60 min + Transition Course 20 min',
    sport: 'brick',
    category: 'brick',
    durationMinutes: 80,
    distanceMeters: 29000,
    targetZone: 'Z3',
    intensityRpe: 7,
    shortSummary: 'Enchaînement vélo vers course pour habituer les jambes',
    description: 'Séance clé de triathlon : prépare la transition T2 et combat l\'effet jambes lourdes.',
    coachTips: [
      'Posez votre vélo, enfilez vos chaussures en moins de 90 secondes.',
      'Les premières 500m de course doivent se faire avec des foulées courtes et rapides.'
    ],
    stepsGenerator: (p) => {
      const ftp = p.bikeMetrics.ftpWatts || 200;
      const mp = p.runMetrics.marathonPaceMinKm || '5:25';
      return [
        { type: 'interval', name: 'Partie 1 : Vélo Rythmé', durationMinutes: 60, targetZone: 'Z2', targetDescription: `${Math.round(ftp * 0.75)}W` },
        { type: 'drill', name: 'Transition T2 express', durationMinutes: 2, targetZone: 'Z3', targetDescription: 'Casque posé, run prêt' },
        { type: 'interval', name: 'Partie 2 : Course à pied', durationMinutes: 18, targetZone: 'Z3', targetDescription: `Allure : ${mp}/km` }
      ];
    }
  },

  // ===================== PPG / RENFORCEMENT =====================
  {
    id: 'strength-core-prevention',
    title: 'PPG : Renforcement Musculaire & Gainage (30 min)',
    sport: 'strength',
    category: 'strength',
    durationMinutes: 30,
    distanceMeters: 0,
    targetZone: 'Z2',
    intensityRpe: 5,
    shortSummary: 'Gainage abdominal, fessiers et stabilité du bassin',
    description: 'Protège les lombaires et prévient les blessures du coureur et du cycliste.',
    coachTips: ['Privilégiez la posture parfaite et la respiration ventrale.'],
    stepsGenerator: () => [
      { type: 'warmup', name: 'Mobilisations articulaires chevilles/hanches', durationMinutes: 5, targetZone: 'Z1', targetDescription: 'Rotations douces' },
      { type: 'drill', name: 'Circuit Gainage (Planche ventrale, latérale, pont fessier)', durationMinutes: 15, targetZone: 'Z2', targetDescription: '4 x 45s effort / 15s récup' },
      { type: 'interval', name: 'Fentes marchées & Squats contrôlés', durationMinutes: 10, targetZone: 'Z2', targetDescription: '3 séries de 10 reps par jambe' }
    ]
  },

  // ===================== REPOS =====================
  {
    id: 'rest-day-complete',
    title: 'Repos complet & Régénération',
    sport: 'rest',
    category: 'recovery',
    durationMinutes: 0,
    distanceMeters: 0,
    targetZone: 'Z1',
    intensityRpe: 1,
    shortSummary: 'Journée sans séance sportive pour assimiler le travail',
    description: 'Le repos fait partie intégrante de l\'entraînement : c\'est là que les muscles se réparent et progressent.',
    coachTips: ['Dormez au moins 8 heures et hydratez-vous généreusement.'],
    stepsGenerator: () => []
  }
];

/**
 * Instantiates a concrete Workout from a template for a given week and day.
 */
export function instantiateWorkoutFromTemplate(
  template: WorkoutTemplate,
  weekNumber: number,
  dayOfWeek: number,
  date: string,
  profile: AthleteProfile
): Workout {
  const steps = template.stepsGenerator(profile);
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    weekNumber,
    dayOfWeek,
    date,
    title: template.title,
    sport: template.sport,
    category: template.category,
    phase: 'base',
    durationMinutes: template.durationMinutes,
    distanceMeters: template.distanceMeters,
    targetZone: template.targetZone,
    intensityRpe: template.intensityRpe,
    description: template.description,
    coachTips: template.coachTips,
    steps,
    status: 'planned'
  };
}
