import { AthleteProfile, TrainingPlan, TrainingWeek, Workout, TrainingPhase, SportType, WorkoutStep } from '../types/triathlon';
import { calculateAllZones, parsePaceToSeconds, formatSecondsToPace } from './zonesCalculator';

// Helper: add days to a date string YYYY-MM-DD
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Get the coming Monday as starting point
function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 1 : (8 - day) % 7; // days to next Monday
  const nextMon = new Date(today);
  nextMon.setDate(today.getDate() + (diff === 0 ? 7 : diff));
  return nextMon.toISOString().split('T')[0];
}

// Calculate weeks between two dates
export function calculateWeeksBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.max(4, Math.min(24, Math.round(diffDays / 7)));
  return weeks;
}

export function generateTrainingPlan(profile: AthleteProfile): TrainingPlan {
  const zones = calculateAllZones(profile);
  const startDate = getNextMonday();
  
  // Calculate duration in weeks (default 12 if raceDate is close or not set)
  let totalWeeks = 12;
  if (profile.raceObjective.raceDate) {
    totalWeeks = calculateWeeksBetween(startDate, profile.raceObjective.raceDate);
  } else {
    if (profile.raceObjective.distance === 'xs') totalWeeks = 6;
    else if (profile.raceObjective.distance === 's') totalWeeks = 8;
    else if (profile.raceObjective.distance === 'm') totalWeeks = 12;
    else if (profile.raceObjective.distance === 'l') totalWeeks = 16;
    else if (profile.raceObjective.distance === 'xl') totalWeeks = 20;
  }

  const weeks: TrainingWeek[] = [];
  const threshPace = profile.runMetrics.thresholdPaceMinKm || '4:50';
  const efPace = profile.runMetrics.efPaceMinKm || '6:15';
  const marathonPace = profile.runMetrics.marathonPaceMinKm || '5:20';
  const vmaPace = profile.runMetrics.vmaPaceMinKm || '4:15';
  const ftp = profile.bikeMetrics.ftpWatts || 200;
  const avgBikeSpeed = profile.bikeMetrics.avgZ2SpeedKmh || 26;
  const css = profile.swimMetrics.cssPacePer100m || '2:00';

  const longRideDay = profile.availability.preferredLongRideDay || 6; // Samedi
  const longRunDay = profile.availability.preferredLongRunDay || 7;   // Dimanche
  const restDay = profile.availability.preferredRestDay || 1;         // Lundi
  const availableDays = profile.availability.availableDays.length > 0 ? profile.availability.availableDays : [2, 3, 4, 5, 6, 7];

  for (let w = 1; w <= totalWeeks; w++) {
    const weekStart = addDays(startDate, (w - 1) * 7);
    const weekEnd = addDays(weekStart, 6);

    // Determine Phase
    let phase: TrainingPhase = 'base';
    let phaseTitle = 'Phase 1 : Fondation & Endurance Aérobie';
    let phaseDesc = 'Construction du socle aérobie (Z2), technique crawl et renforcement musculaire préventif.';
    const isRestWeek = (w % 4 === 0) && (w < totalWeeks - 1);

    if (w === totalWeeks) {
      phase = 'race_week';
      phaseTitle = 'Semaine de Course / Objectif Jour J';
      phaseDesc = 'Activation nerveuse courte, vérification du matériel, plein de glycogène et compétition !';
    } else if (w >= totalWeeks - 2) {
      phase = 'taper';
      phaseTitle = 'Phase 4 : Affûtage & Surcompensation (Taper)';
      phaseDesc = 'Baisse du volume de 40%, maintien des intensités clés et recharge maximale en fraîcheur.';
    } else if (w > Math.floor(totalWeeks * 0.65)) {
      phase = 'peak';
      phaseTitle = 'Phase 3 : Spécifique & Allures de Course';
      phaseDesc = 'Répétitions aux allures cibles, enchaînements vélo-course (briques) et simulation de ravitaillement.';
    } else if (w > Math.floor(totalWeeks * 0.35)) {
      phase = 'build';
      phaseTitle = 'Phase 2 : Développement & Seuil Lactique';
      phaseDesc = 'Intervalles au seuil (Z4), puissance SweetSpot à vélo et premières séances briques.';
    }

    if (isRestWeek) {
      phaseTitle = `Semaine d'Assimilation & Régénération (S${w})`;
      phaseDesc = 'Volume allégé de 30% pour permettre la surcompensation musculaire et éviter le surentraînement.';
    }

    // Generate Workouts for this week
    const workouts: Workout[] = [];

    // Progressive multiplier based on week & distance
    const distFactor = profile.raceObjective.distance === 'xs' ? 0.6 : profile.raceObjective.distance === 's' ? 0.8 : profile.raceObjective.distance === 'm' ? 1.0 : profile.raceObjective.distance === 'l' ? 1.4 : 1.8;
    const progressMultiplier = (1 + (w - 1) * 0.04) * (isRestWeek ? 0.7 : 1.0) * distFactor;

    // Day 1: Lundi (Rest / Recovery / Mobilité)
    if (availableDays.includes(1) && restDay !== 1) {
      // Light recovery swim or mobility
      workouts.push(createRecoveryWorkout(w, 1, addDays(weekStart, 0), phase, css));
    } else {
      workouts.push(createRestWorkout(w, 1, addDays(weekStart, 0)));
    }

    // Day 2: Mardi (Natation Technique / Seuil CSS)
    if (availableDays.includes(2)) {
      workouts.push(createSwimWorkout(w, 2, addDays(weekStart, 1), phase, css, progressMultiplier, isRestWeek));
    }

    // Day 3: Mercredi (Vélo Intervalles / SweetSpot ou PMA)
    if (availableDays.includes(3)) {
      workouts.push(createBikeIntervalWorkout(w, 3, addDays(weekStart, 2), phase, ftp, avgBikeSpeed, progressMultiplier, isRestWeek));
    }

    // Day 4: Jeudi (Course à pied Seuil ou VMA / Renforcement)
    if (availableDays.includes(4)) {
      workouts.push(createRunIntervalWorkout(w, 4, addDays(weekStart, 3), phase, threshPace, vmaPace, efPace, progressMultiplier, isRestWeek));
    }

    // Day 5: Vendredi (Natation Aérobie ou PPG)
    if (availableDays.includes(5)) {
      workouts.push(createSwimAerobicWorkout(w, 5, addDays(weekStart, 4), phase, css, progressMultiplier, isRestWeek));
    }

    // Day 6: Samedi (Sortie Longue Vélo ou Brique Vélo-Course)
    if (availableDays.includes(6)) {
      if (longRideDay === 6) {
        if (phase === 'build' || phase === 'peak') {
          workouts.push(createBrickWorkout(w, 6, addDays(weekStart, 5), phase, ftp, avgBikeSpeed, marathonPace, efPace, progressMultiplier, isRestWeek));
        } else {
          workouts.push(createLongBikeWorkout(w, 6, addDays(weekStart, 5), phase, ftp, avgBikeSpeed, progressMultiplier, isRestWeek));
        }
      } else {
        workouts.push(createLongRunWorkout(w, 6, addDays(weekStart, 5), phase, efPace, marathonPace, progressMultiplier, isRestWeek));
      }
    }

    // Day 7: Dimanche (Sortie Longue Course à pied / Spécifique)
    if (availableDays.includes(7)) {
      if (w === totalWeeks) {
        // RACE DAY!
        workouts.push(createRaceDayWorkout(w, 7, addDays(weekStart, 6), profile));
      } else if (longRunDay === 7) {
        workouts.push(createLongRunWorkout(w, 7, addDays(weekStart, 6), phase, efPace, marathonPace, progressMultiplier, isRestWeek));
      } else {
        workouts.push(createLongBikeWorkout(w, 7, addDays(weekStart, 6), phase, ftp, avgBikeSpeed, progressMultiplier, isRestWeek));
      }
    }

    // Compute weekly totals
    let totalDur = 0;
    let totalDist = 0;
    let swimMin = 0;
    let bikeMin = 0;
    let runMin = 0;
    let strengthMin = 0;

    workouts.forEach((wo) => {
      totalDur += wo.durationMinutes;
      totalDist += wo.distanceMeters / 1000;
      if (wo.sport === 'swim') swimMin += wo.durationMinutes;
      else if (wo.sport === 'bike') bikeMin += wo.durationMinutes;
      else if (wo.sport === 'run') runMin += wo.durationMinutes;
      else if (wo.sport === 'brick') {
        bikeMin += Math.round(wo.durationMinutes * 0.75);
        runMin += Math.round(wo.durationMinutes * 0.25);
      } else if (wo.sport === 'strength') strengthMin += wo.durationMinutes;
    });

    weeks.push({
      weekNumber: w,
      startDate: weekStart,
      endDate: weekEnd,
      phase,
      phaseTitle,
      phaseDescription: phaseDesc,
      totalDurationMinutes: totalDur,
      totalDistanceKm: Math.round(totalDist * 10) / 10,
      sportBreakdown: {
        swimMinutes: swimMin,
        bikeMinutes: bikeMin,
        runMinutes: runMin,
        strengthMinutes: strengthMin,
      },
      workouts,
      isRestWeek,
    });
  }

  return {
    id: `plan-${Date.now()}`,
    athleteId: profile.id,
    createdAt: new Date().toISOString(),
    raceDistance: profile.raceObjective.distance,
    raceDate: profile.raceObjective.raceDate || addDays(startDate, totalWeeks * 7),
    totalWeeks,
    weeks,
  };
}

// Workout Factory Functions

function createRestWorkout(week: number, day: number, date: string): Workout {
  return {
    id: `w${week}-d${day}-rest`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Repos complet & Régénération',
    sport: 'rest',
    category: 'recovery',
    phase: 'base',
    durationMinutes: 0,
    distanceMeters: 0,
    targetZone: 'Z0',
    intensityRpe: 1,
    description: 'Journée de repos sans entraînement. Sommeil réparateur, bonne hydratation et nutrition riche en antioxydants.',
    coachTips: [
      'Le repos fait partie intégrante de l\'entraînement : c\'est pendant le sommeil que les fibres musculaires se reconstruisent.',
      'Profitez-en pour masser vos mollets ou faire 10 minutes d\'étirements très doux.',
    ],
    steps: [],
    status: 'planned',
  };
}

function createRecoveryWorkout(week: number, day: number, date: string, phase: TrainingPhase, css: string): Workout {
  return {
    id: `w${week}-d${day}-rec`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Natation Récupération & Mobilité scapulaire',
    sport: 'swim',
    category: 'recovery',
    phase,
    durationMinutes: 35,
    distanceMeters: 1200,
    targetZone: 'Z1',
    intensityRpe: 3,
    description: 'Séance très souple axée sur l\'alignement corporel, la décompression vertébrale et la glisse dans l\'eau.',
    coachTips: [
      'Aucun chrono à regarder : cherchez simplement la sensation de glisse sans résistance.',
      'Respirez alternativement à gauche et à droite pour équilibrer les trapèzes.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement 4 nages souple', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Allure très cool' },
      { type: 'drill', name: 'Éducatifs (rattrapé + godille)', distanceMeters: 400, targetZone: 'Z1', targetDescription: 'Focus appuis paumes de main' },
      { type: 'recovery', name: 'Crawl avec pull-buoy', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Glisse sans battement de jambes' },
      { type: 'cooldown', name: 'Dos à 2 bras relax', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Décontraction' },
    ],
    status: 'planned',
  };
}

function createSwimWorkout(week: number, day: number, date: string, phase: TrainingPhase, css: string, mult: number, isRest: boolean): Workout {
  const reps = isRest ? 6 : Math.min(12, Math.max(6, Math.round(8 * mult)));
  const dist = isRest ? 1600 : Math.round(2000 * mult);
  const dur = Math.round(dist / 40);

  return {
    id: `w${week}-d${day}-swim`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: phase === 'base' ? 'Natation : Technique & Aisance Respiratoire' : 'Natation : Séries Seuil CSS & Allure Course',
    sport: 'swim',
    category: phase === 'base' ? 'technique' : 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: dist,
    targetZone: phase === 'base' ? 'Z2' : 'Z3',
    intensityRpe: phase === 'base' ? 6 : 7,
    description: `Séance ciblée sur l'allure spécifique triathlon. Travail du catch (prise d'eau) et maintien de l'allure CSS (${css}/100m).`,
    coachTips: [
      'Gardez la tête alignée avec la colonne vertébrale : regardez le fond du bassin à 45°, pas devant vous.',
      'Sur les séries au seuil, ne partez pas trop vite sur le 1er 100m. La régularité au centième est la clé.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', distanceMeters: 400, targetZone: 'Z1', targetDescription: '200m crawl + 100m dos + 100m brasse' },
      { type: 'drill', name: 'Éducatif : Doigts qui traînent à la surface', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Coude haut lors du retour aérien' },
      { type: 'interval', name: `Série clé : ${reps} x 100m Crawl @ CSS`, distanceMeters: reps * 100, targetZone: 'Z3', targetDescription: `Allure cible : ${css} / 100m (R=15s)` },
      { type: 'recovery', name: 'Retour au calme souple', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Dos et brasse cool' },
    ],
    status: 'planned',
  };
}

function createBikeIntervalWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 45 : Math.round(60 * mult);
  const distKm = Math.round(dur * (avgSpeed / 60) * 1.05);

  const z4Watts = Math.round(ftp * 0.95);
  const z4Speed = Math.round(avgSpeed * 1.25);
  const sweetSpotWatts = Math.round(ftp * 0.88);

  return {
    id: `w${week}-d${day}-bike`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: phase === 'base' ? 'Vélo : Vélocité (Cadence 95-100 rpm)' : phase === 'build' ? 'Vélo : Intervalles SweetSpot & Force' : 'Vélo : Simulation Puissance Spécifique',
    sport: 'bike',
    category: phase === 'base' ? 'endurance' : 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: distKm * 1000,
    targetZone: phase === 'base' ? 'Z2' : 'Z4',
    intensityRpe: phase === 'base' ? 6 : 8,
    description: `Développement de l'efficacité de pédalage et tenue de puissance. Cible : ${phase === 'base' ? 'Cadence haute 95 rpm en Z2' : `${sweetSpotWatts}W à ${z4Watts}W (${z4Speed} km/h)`}.`,
    coachTips: [
      'Conservez un haut du corps détendu : ne serrez pas excessivement le guidon, relâchez les épaules.',
      'Buvez 1 gorgée d\'eau toutes les 10 minutes, même en intérieur sur home-trainer.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 15, targetZone: 'Z1', targetDescription: `Monter de ${Math.round(ftp * 0.5)}W à ${Math.round(ftp * 0.7)}W` },
      { type: 'interval', name: phase === 'base' ? 'Blocs vélocité 100 rpm' : `4 x 6 min @ SweetSpot (${sweetSpotWatts}W)`, durationMinutes: 30, targetZone: phase === 'base' ? 'Z2' : 'Z4', targetDescription: `Tenue constante R=2' Z1 (${Math.round(ftp * 0.55)}W)` },
      { type: 'cooldown', name: 'Retour au calme très souple', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Pédalage sans résistance 90 rpm' },
    ],
    status: 'planned',
  };
}

function createRunIntervalWorkout(week: number, day: number, date: string, phase: TrainingPhase, threshPace: string, vmaPace: string, efPace: string, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 40 : Math.round(50 * mult);
  const reps = isRest ? 3 : Math.min(6, Math.max(3, Math.round(4 * mult)));
  const distKm = Math.round(dur * 0.18 * 10) / 10;

  return {
    id: `w${week}-d${day}-run`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: phase === 'base' ? 'Course : Gammes, Côtes & Lignes Droites' : phase === 'build' ? `Course : Répétitions au Seuil (${reps} x 1000m)` : 'Course : Allure Spécifique Triathlon',
    sport: 'run',
    category: phase === 'base' ? 'technique' : 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(distKm * 1000),
    targetZone: phase === 'base' ? 'Z3' : 'Z4',
    intensityRpe: phase === 'base' ? 6 : 8,
    description: `Travail d'économie de course et repousse du seuil de fatigue. Cible : Allure Seuil ${threshPace}/km avec récupération active en footing (${efPace}/km).`,
    coachTips: [
      'Pensez à votre posture : buste légèrement incliné vers l\'avant depuis les chevilles, regard à 20 mètres.',
      'Cadence cible : ~175 à 180 pas par minute pour réduire les impacts au sol.',
    ],
    steps: [
      { type: 'warmup', name: 'Footing échauffement progressif', durationMinutes: 15, targetZone: 'Z2', targetDescription: `Allure EF cool (${efPace}/km)` },
      { type: 'drill', name: 'Gammes athlétiques (talons-fesses, montées de genoux, 3 lignes droites)', durationMinutes: 5, targetZone: 'Z3', targetDescription: 'Fréquence et dynamisme' },
      { type: 'interval', name: `${reps} x 1000m @ Allure Seuil (${threshPace}/km)`, durationMinutes: reps * 5, targetZone: 'Z4', targetDescription: `Régularité métronome. R=1'45 en trottinant` },
      { type: 'cooldown', name: 'Retour au calme régénérant', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Jogging très lent' },
    ],
    status: 'planned',
  };
}

function createSwimAerobicWorkout(week: number, day: number, date: string, phase: TrainingPhase, css: string, mult: number, isRest: boolean): Workout {
  const dist = isRest ? 1400 : Math.round(1800 * mult);
  const dur = Math.round(dist / 40);

  return {
    id: `w${week}-d${day}-swimaero`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Natation : Endurance Aérobie & Pull-Buoy / Plaquettes',
    sport: 'swim',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: dist,
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `Volume aérobie continu pour habituer le haut du corps aux longues distances sans arrêt. Allure Z2 confortable (${css} + 10s / 100m).`,
    coachTips: [
      'Concentrez-vous sur l\'expiration complète sous l\'eau par la bouche et le nez avant de tourner la tête.',
      'Le pull-buoy permet d\'isoler la traction des bras tout en maintenant le bassin haut.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement continu 300m', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Nage libre' },
      { type: 'interval', name: '3 x 400m Crawl régulier avec pull-buoy', distanceMeters: 1200, targetZone: 'Z2', targetDescription: 'Allure Z2 stable R=30s' },
      { type: 'cooldown', name: 'Retour au calme', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Dos crawlé souple' },
    ],
    status: 'planned',
  };
}

function createLongBikeWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 75 : Math.round(120 * mult);
  const distKm = Math.round((dur / 60) * avgSpeed);
  const z2Watts = Math.round(ftp * 0.68);

  return {
    id: `w${week}-d${day}-longbike`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Sortie Longue Vélo (${Math.floor(dur / 60)}h${dur % 60 ? dur % 60 : '00'}) - Endurance Z2`,
    sport: 'bike',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: distKm * 1000,
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `La séance reine pour construire le moteur aérobie. Tenue constante en Zone 2 (${z2Watts}W / ~${avgSpeed} km/h). Travail de la position aéro et test de la nutrition.`,
    coachTips: [
      'Alimentation : mangez une barre ou 1/2 banane toutes les 45 minutes et buvez un bidon de 500ml par heure.',
      'Restez en Z2 sur les montées de côtes : utilisez les petits braquets pour ne pas faire exploser les pulsations.',
    ],
    steps: [
      { type: 'warmup', name: 'Mise en route tranquille', durationMinutes: 20, targetZone: 'Z1', targetDescription: 'Moulinage souple' },
      { type: 'interval', name: `Bloc Endurance Fondamentale (${z2Watts} Watts)`, durationMinutes: dur - 35, targetZone: 'Z2', targetDescription: `Cadence 85-90 rpm sur terrain varié` },
      { type: 'cooldown', name: 'Retour au calme petit plateau', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Décontraction' },
    ],
    status: 'planned',
  };
}

function createBrickWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, marathonPace: string, efPace: string, mult: number, isRest: boolean): Workout {
  const bikeMin = isRest ? 60 : Math.round(90 * mult);
  const runMin = isRest ? 15 : Math.min(30, Math.round(20 * mult));
  const totalDur = bikeMin + runMin;
  const bikeDistKm = Math.round((bikeMin / 60) * avgSpeed);
  const runDistKm = Math.round(runMin * 0.17 * 10) / 10;
  const totalDistKm = bikeDistKm + runDistKm;

  return {
    id: `w${week}-d${day}-brick`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Séance Brique : Vélo (${Math.floor(bikeMin / 60)}h${bikeMin % 60 ? bikeMin % 60 : '00'}) + Transition Course (${runMin} min)`,
    sport: 'brick',
    category: 'brick',
    phase,
    durationMinutes: totalDur,
    distanceMeters: Math.round(totalDistKm * 1000),
    targetZone: 'Z3',
    intensityRpe: 7,
    description: `L'enchaînement typique du triathlon ! Dès la fin du vélo, posez le vélo, chaussez vos runnings en moins de 2 minutes et partez courir avec les jambes lourdes.`,
    coachTips: [
      'Les 5 premières minutes de course à pied donnent l\'impression d\'avoir des "jambes de bois" : c\'est normal ! Faites des petits pas rapides pour relancer la cadence.',
      'Ne partez pas trop vite à pied : cale-toi directement sur ton allure marathon/semi (${marathonPace}/km).',
    ],
    steps: [
      { type: 'interval', name: `Partie 1 : Sortie Vélo avec 3x10' @ Allure Course`, durationMinutes: bikeMin, targetZone: 'Z2', targetDescription: `${Math.round(ftp * 0.75)}W - Gestion des ravitaillements` },
      { type: 'drill', name: 'Transition T2 express (< 2 minutes)', durationMinutes: 2, targetZone: 'Z3', targetDescription: 'Casque posé, chaussures enfilées, dossard devant' },
      { type: 'interval', name: `Partie 2 : Course enchaînée immédiate (${runMin} min)`, durationMinutes: runMin, targetZone: 'Z3', targetDescription: `Allure spécifique : ${marathonPace}/km` },
    ],
    status: 'planned',
  };
}

function createLongRunWorkout(week: number, day: number, date: string, phase: TrainingPhase, efPace: string, marathonPace: string, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 45 : Math.min(105, Math.round(65 * mult));
  const distKm = Math.round((dur / 60) * 9.8 * 10) / 10;

  return {
    id: `w${week}-d${day}-longrun`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Sortie Longue Course (${Math.floor(dur / 60)}h${dur % 60 ? dur % 60 : '00'}) - Endurance Aérobie`,
    sport: 'run',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(distKm * 1000),
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `Développement de l'endurance fondamentale et de la résistance musculaire des jambes. Course en aisance respiratoire (${efPace}/km).`,
    coachTips: [
      'Courir lentement pour courir vite : restez strictement en Z2 sous votre seuil aérobie.',
      'Hydratez-vous avec une flasque d\'eau si la sortie dépasse 50 minutes.',
    ],
    steps: [
      { type: 'warmup', name: 'Mise en route très progressive', durationMinutes: 15, targetZone: 'Z1', targetDescription: `Allure très lente (${efPace} + 20s)` },
      { type: 'interval', name: 'Corps de sortie en Endurance Fondamentale (EF)', durationMinutes: dur - 25, targetZone: 'Z2', targetDescription: `Allure cible : ${efPace}/km` },
      { type: 'cooldown', name: 'Retour au calme & marche', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Marche et respirations profondes' },
    ],
    status: 'planned',
  };
}

function createRaceDayWorkout(week: number, day: number, date: string, profile: AthleteProfile): Workout {
  const dist = profile.raceObjective.distance;
  const raceName = profile.raceObjective.raceName || `Triathlon ${dist.toUpperCase()}`;

  return {
    id: `w${week}-d${day}-raceday`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `JOUR J : ${raceName.toUpperCase()} 🏆`,
    sport: 'brick',
    category: 'brick',
    phase: 'race_week',
    durationMinutes: 180,
    distanceMeters: dist === 's' ? 25750 : dist === 'm' ? 51500 : dist === 'l' ? 113000 : 15000,
    targetZone: 'Z4',
    intensityRpe: 9,
    description: `C'est le grand jour ! Tout l'entraînement des dernières semaines converge ici. Appliquez votre plan de course, gérez votre énergie et profitez de chaque kilomètre !`,
    coachTips: [
      'Natation : partez sur le côté du peloton pour éviter la bousculade au premier virage de bouée.',
      'Vélo : les 15 premières minutes sont trompeuses avec l\'euphorie. Restez calé sur vos watts/vitesse cible !',
      'Course : prenez un rythme régulier dès le départ et souriez aux photographes sur la ligne d\'arrivée !',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement à sec + Réveil articulaire', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Élastiques et petits sauts' },
      { type: 'interval', name: `Compétition : ${raceName}`, durationMinutes: 150, targetZone: 'Z4', targetDescription: 'Allure spécifique maîtrisée' },
      { type: 'cooldown', name: 'Célébration & Récupération active', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Boisson de récup et médaille autour du cou' },
    ],
    status: 'planned',
  };
}
