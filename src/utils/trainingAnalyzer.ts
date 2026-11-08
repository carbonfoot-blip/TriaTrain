import {
  AthleteProfile,
  SportType,
  TrainingPlan,
  TrainingWeek,
  Workout,
} from '../types/triathlon';
import { WORKOUT_CATALOG, WorkoutTemplate } from '../data/workoutCatalog';

export type CoachMood = 'celebration' | 'on_track' | 'boost_needed' | 'kickstart';

export type ReadinessStatus = 'ahead' | 'on_target' | 'needs_consistency' | 'needs_relaunch';

export type RecommendationCategory =
  | 'volume'
  | 'intensity'
  | 'drills'
  | 'workout_adjustment';

export interface SportPerformanceSummary {
  sport: SportType;
  label: string;
  icon: string;
  plannedSessions: number;
  completedSessions: number;
  plannedMinutes: number;
  completedMinutes: number;
  completedDistanceKm: number;
  avgHeartRate?: number;
  avgPowerWatts?: number;
  avgRpe?: number;
  status: 'strong' | 'ok' | 'missing' | 'none';
}

export interface CoachRecommendation {
  id: string;
  category: RecommendationCategory;
  categoryLabel: string;
  icon: string;
  priority: 'high' | 'medium' | 'positive';
  title: string;
  detail: string;
  actionableTip: string;
  suggestedTemplateId?: string;
  suggestedDayOfWeek?: number;
}

export interface ObjectivePositioning {
  readinessScore: number; // 0..100
  status: ReadinessStatus;
  statusBadge: string;
  confirmedLevelLabel: string;
  daysToRace: number | null;
  cumulativeCompletedSessions: number;
  cumulativePlannedSessionsToDate: number;
  cumulativeHoursCompleted: number;
  summaryText: string;
  physiologicalHighlight: string;
}

export interface WeeklyCoachAnalysisReport {
  analyzedWeekNumber: number;
  analyzedWeekIndex: number;
  phaseTitle: string;
  startDate: string;
  endDate: string;
  mood: CoachMood;
  headline: string;
  subHeadline: string;
  encouragementParagraph: string;
  adherencePct: number;
  volumePct: number;
  plannedSessionsCount: number;
  completedSessionsCount: number;
  plannedDurationMinutes: number;
  completedDurationMinutes: number;
  completedDistanceKm: number;
  objectivePositioning: ObjectivePositioning;
  sportSummaries: SportPerformanceSummary[];
  recommendations: CoachRecommendation[];
}

function getLocalTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Détermine quelle semaine analyser par défaut :
 * - Le lundi (ou en début de semaine si la semaine en cours n'a encore aucune séance complétée
 *   et que la semaine précédente existe), on analyse la semaine qui vient de se terminer (S-1) !
 * - Sinon on analyse la semaine active.
 */
export function resolveDefaultAnalysisWeekIndex(
  plan: TrainingPlan,
  currentWeekIndex: number
): number {
  if (!plan || !Array.isArray(plan.weeks) || plan.weeks.length === 0) return 0;
  const currentWeek = plan.weeks[currentWeekIndex];
  if (!currentWeek) return 0;

  const completedInCurrent = currentWeek.workouts.some(
    (w) => w.sport !== 'rest' && (w.status === 'completed' || Boolean(w.garminActivity))
  );

  // If current week has no completed workouts yet and there is a previous week, analyze the previous week
  if (!completedInCurrent && currentWeekIndex > 0) {
    return currentWeekIndex - 1;
  }
  return currentWeekIndex;
}

/**
 * Vérifie si l'application doit ouvrir automatiquement le Bilan Coach du Lundi matin :
 * - On est Lundi (getDay() === 1)
 * - L'athlète a au moins 1 séance complétée dans son plan
 * - Le bilan n'a pas encore été affiché aujourd'hui
 */
export function shouldTriggerMondayMorningAnalysis(plan: TrainingPlan): boolean {
  const now = new Date();
  const isMonday = now.getDay() === 1;
  if (!isMonday) return false;

  const todayIso = getLocalTodayIso();
  const seenDate = localStorage.getItem('triatrain_weekly_analysis_seen_date');
  if (seenDate === todayIso) return false;

  const hasAnyCompleted = plan.weeks.some((w) =>
    w.workouts.some(
      (wo) => wo.sport !== 'rest' && (wo.status === 'completed' || Boolean(wo.garminActivity))
    )
  );

  return hasAnyCompleted;
}

export function markWeeklyAnalysisSeenToday(): void {
  try {
    localStorage.setItem('triatrain_weekly_analysis_seen_date', getLocalTodayIso());
  } catch {
    // ignore
  }
}

export function getSuggestedTemplateById(templateId?: string): WorkoutTemplate | undefined {
  if (!templateId) return undefined;
  return WORKOUT_CATALOG.find((t) => t.id === templateId);
}

/**
 * Génère le rapport complet d'analyse d'entraînement, le positionnement face à l'objectif
 * et les recommandations (Volume, Intensité, Drills, Ajustements de séances).
 */
export function analyzeTrainingProgress(
  plan: TrainingPlan,
  profile: AthleteProfile,
  targetWeekIndex: number
): WeeklyCoachAnalysisReport {
  const safeIndex = Math.max(0, Math.min(plan.weeks.length - 1, targetWeekIndex));
  const week: TrainingWeek = plan.weeks[safeIndex] || plan.weeks[0];
  const firstName = (profile.name || 'Athlète').split(' ')[0];
  const todayIso = getLocalTodayIso();

  const activeWorkouts = week.workouts.filter((w) => w.sport !== 'rest');
  const completedWorkouts = activeWorkouts.filter(
    (w) => w.status === 'completed' || Boolean(w.garminActivity)
  );

  const plannedSessionsCount = activeWorkouts.length;
  const completedSessionsCount = completedWorkouts.length;
  const adherencePct =
    plannedSessionsCount > 0
      ? Math.round((completedSessionsCount / plannedSessionsCount) * 100)
      : 0;

  const plannedDurationMinutes = activeWorkouts.reduce((acc, w) => acc + w.durationMinutes, 0);
  const completedDurationMinutes = completedWorkouts.reduce(
    (acc, w) =>
      acc +
      (w.completedDurationMinutes ??
        w.garminActivity?.durationMinutes ??
        w.durationMinutes),
    0
  );
  const completedDistanceKm =
    Math.round(
      (completedWorkouts.reduce(
        (acc, w) =>
          acc +
          (w.completedDistanceMeters ??
            w.garminActivity?.distanceMeters ??
            w.distanceMeters),
        0
      ) /
        1000) *
        10
    ) / 10;

  const volumePct =
    plannedDurationMinutes > 0
      ? Math.round((completedDurationMinutes / plannedDurationMinutes) * 100)
      : 0;

  // 1. Mood, Félicitations & Coup de pouce
  let mood: CoachMood = 'on_track';
  let headline = '';
  let subHeadline = '';
  let encouragementParagraph = '';

  if (completedSessionsCount === 0) {
    mood = 'kickstart';
    headline = `🚀 Prêt à lancer votre Semaine ${week.weekNumber}, ${firstName} ?`;
    subHeadline = `Aucune séance validée sur cette semaine pour l'instant`;
    encouragementParagraph = `Que vous commenciez votre semaine ou que vous n'ayez pas encore importé vos sorties depuis votre montre Garmin / Intervals.icu, tout est prêt ! Validez vos séances au fur et à mesure pour débloquer l'analyse physiologique complète.`;
  } else if (adherencePct >= 85 || volumePct >= 90) {
    mood = 'celebration';
    headline = `🏆 Bravo ${firstName} ! Semaine ${week.weekNumber} exemplaire (${adherencePct}% réalisé)`;
    subHeadline = `Discipline remarquable et excellente assimilation de la charge`;
    encouragementParagraph = `Félicitations ! Vous avez validé ${completedSessionsCount} séance(s) sur ${plannedSessionsCount} prévues (${Math.floor(
      completedDurationMinutes / 60
    )}h${String(completedDurationMinutes % 60).padStart(
      2,
      '0'
    )} d'entraînement et ${completedDistanceKm} km). Cette régularité construit des adaptations aérobies et neuromusculaires durables pour votre objectif « ${
      profile.raceObjective.raceName || 'Course Cible'
    } ».`;
  } else if (adherencePct >= 60) {
    mood = 'on_track';
    headline = `👏 Belle régularité ${firstName} sur la Semaine ${week.weekNumber} (${adherencePct}%)`;
    subHeadline = `Le socle d'entraînement est bien maintenu — vous avancez vers l'objectif`;
    encouragementParagraph = `Bon travail ! Avec ${completedSessionsCount}/${plannedSessionsCount} séances complétées (${Math.floor(
      completedDurationMinutes / 60
    )}h${String(completedDurationMinutes % 60).padStart(
      2,
      '0'
    )}), l'essentiel des stimuli de la ${
      week.phaseTitle
    } est acquis. Ne cherchez jamais à "rattraper" une séance manquée en doublant la charge d'un coup : gardez ce cap régulier !`;
  } else {
    mood = 'boost_needed';
    headline = `💪 Coup de pouce du Coach pour ${firstName} (${completedSessionsCount}/${plannedSessionsCount} séances)`;
    subHeadline = `Chaque entraînement compte — relançons la dynamique en douceur`;
    encouragementParagraph = `Les semaines chargées au travail ou en famille font partie de la vie d'un athlète ! Vous avez tout de même maintenu le mouvement avec ${completedSessionsCount} séance(s) (${completedDurationMinutes} min). Oubliez les séances non faites et concentrez-vous sur les 2 ou 3 séances clés de la semaine qui vient.`;
  }

  // 2. Cumulative & Objective Positioning
  let cumulativePlannedToDate = 0;
  let cumulativeCompleted = 0;
  let cumulativeMinutesCompleted = 0;

  plan.weeks.forEach((w, idx) => {
    w.workouts.forEach((wo) => {
      if (wo.sport === 'rest') return;
      const isDone = wo.status === 'completed' || Boolean(wo.garminActivity);
      if (isDone) {
        cumulativeCompleted += 1;
        cumulativeMinutesCompleted +=
          wo.completedDurationMinutes ??
          wo.garminActivity?.durationMinutes ??
          wo.durationMinutes;
      }
      if (wo.date <= todayIso || idx <= safeIndex || isDone) {
        cumulativePlannedToDate += 1;
      }
    });
  });

  const globalAdherence =
    cumulativePlannedToDate > 0
      ? Math.round((cumulativeCompleted / cumulativePlannedToDate) * 100)
      : adherencePct;

  // Compute readiness score combining current week + global consistency + physiological calibration
  const rawScore =
    completedSessionsCount > 0
      ? Math.round(adherencePct * 0.55 + Math.min(100, volumePct) * 0.25 + globalAdherence * 0.2)
      : Math.max(35, globalAdherence);
  const readinessScore = Math.max(15, Math.min(99, rawScore));

  let status: ReadinessStatus = 'on_target';
  let statusBadge = '🎯 Parfaitement aligné avec l’objectif';
  if (readinessScore >= 85 && volumePct >= 90) {
    status = 'ahead';
    statusBadge = '🟢 En excellente posture / En avance sur la cible';
  } else if (readinessScore >= 65) {
    status = 'on_target';
    statusBadge = '🎯 Aligné avec votre objectif';
  } else if (readinessScore >= 45) {
    status = 'needs_consistency';
    statusBadge = '🟡 En progression (Volume à consolider)';
  } else {
    status = 'needs_relaunch';
    statusBadge = '🟠 À relancer cette semaine';
  }

  // Confirmed athlete level based on physiological metrics & adherence
  const ftp = profile.bikeMetrics.ftpWatts || 200;
  const wPerKg = profile.weightKg > 0 ? Math.round((ftp / profile.weightKg) * 10) / 10 : null;
  let confirmedLevelLabel = 'Athlète Régulier — Niveau Intermédiaire';
  if (
    (wPerKg && wPerKg >= 3.6) ||
    profile.experienceLevel === 'advanced' ||
    (readinessScore >= 85 && profile.experienceLevel === 'intermediate')
  ) {
    confirmedLevelLabel = `Niveau Avancé / Compétiteur Confirmé${wPerKg ? ` (~${wPerKg} W/kg)` : ''}`;
  } else if (profile.experienceLevel === 'beginner' && readinessScore >= 75) {
    confirmedLevelLabel = 'Progression Rapide (Débutant ➔ Intermédiaire)';
  } else if (profile.experienceLevel === 'beginner') {
    confirmedLevelLabel = 'Fondation Endurance — Niveau Découverte / Progression';
  } else if (wPerKg) {
    confirmedLevelLabel = `Niveau Intermédiaire Solide (${wPerKg} W/kg • Seuil ${profile.runMetrics.thresholdPaceMinKm}/km)`;
  }

  let daysToRace: number | null = null;
  if (profile.raceObjective.raceDate) {
    const diff =
      new Date(`${profile.raceObjective.raceDate}T12:00:00`).getTime() - new Date().getTime();
    daysToRace = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const cumulativeHoursCompleted = Math.round((cumulativeMinutesCompleted / 60) * 10) / 10;

  const objectiveSummaryText = `À ${
    daysToRace !== null ? `J-${daysToRace}` : `la Semaine ${week.weekNumber}/${plan.totalWeeks}`
  } de « ${
    profile.raceObjective.raceName || 'votre objectif'
  } », votre indice de préparation est de ${readinessScore}%. Vous avez déjà capitalisé ${cumulativeCompleted} séance(s) (${cumulativeHoursCompleted}h cumulées). ${
    status === 'ahead' || status === 'on_target'
      ? `Votre charge actuelle correspond exactement aux exigences de la ${week.phaseTitle}.`
      : `Priorisez la régularité sur vos sorties d'endurance fondamentale (Z2) pour sécuriser votre objectif.`
  }`;

  // Physiological highlight from Garmin / Intervals.icu metrics
  const workoutsWithHr = completedWorkouts.filter((w) => w.garminActivity?.avgHeartRate);
  const avgHrAcrossWeek =
    workoutsWithHr.length > 0
      ? Math.round(
          workoutsWithHr.reduce((s, w) => s + (w.garminActivity?.avgHeartRate || 0), 0) /
            workoutsWithHr.length
        )
      : null;

  const z2CeilingBpm = Math.round(
    profile.hrRest + (profile.hrMax - profile.hrRest) * 0.73
  );

  const physiologicalHighlight = avgHrAcrossWeek
    ? `Cardio moyen mesuré cette semaine : ${avgHrAcrossWeek} bpm (Plafond Z2 aérobie théorique : ~${z2CeilingBpm} bpm pour FC Max ${profile.hrMax} bpm).`
    : `Paramètres physiologiques actifs : FC Max ${profile.hrMax} bpm • FTP ${ftp} W • Seuil course ${profile.runMetrics.thresholdPaceMinKm}/km • CSS nage ${profile.swimMetrics.cssPacePer100m}/100m.`;

  // 3. Sport-by-Sport Breakdown
  const sportsOrder: { sport: SportType; label: string; icon: string }[] = [
    { sport: 'swim', label: 'Natation', icon: '🏊' },
    { sport: 'bike', label: 'Vélo / Brique', icon: '🚴' },
    { sport: 'run', label: 'Course à pied', icon: '🏃' },
    { sport: 'strength', label: 'Poids / PPG', icon: '💪' },
  ];

  const sportSummaries: SportPerformanceSummary[] = sportsOrder.map(({ sport, label, icon }) => {
    const matchingPlanned = activeWorkouts.filter((w) =>
      sport === 'bike' ? w.sport === 'bike' || w.sport === 'brick' : w.sport === sport
    );
    const matchingCompleted = completedWorkouts.filter((w) =>
      sport === 'bike' ? w.sport === 'bike' || w.sport === 'brick' : w.sport === sport
    );

    const plannedMin = matchingPlanned.reduce((s, w) => s + w.durationMinutes, 0);
    const completedMin = matchingCompleted.reduce(
      (s, w) =>
        s +
        (w.completedDurationMinutes ??
          w.garminActivity?.durationMinutes ??
          w.durationMinutes),
      0
    );
    const completedDistKm =
      Math.round(
        (matchingCompleted.reduce(
          (s, w) =>
            s +
            (w.completedDistanceMeters ??
              w.garminActivity?.distanceMeters ??
              w.distanceMeters),
          0
        ) /
          1000) *
          10
      ) / 10;

    const hrList = matchingCompleted
      .map((w) => w.garminActivity?.avgHeartRate)
      .filter((v): v is number => typeof v === 'number' && v > 0);
    const wattsList = matchingCompleted
      .map((w) => w.garminActivity?.avgWatts)
      .filter((v): v is number => typeof v === 'number' && v > 0);
    const rpeList = matchingCompleted
      .map((w) => w.completedRpe || w.garminActivity?.perceivedRpe)
      .filter((v): v is number => typeof v === 'number' && v > 0);

    let sportStatus: SportPerformanceSummary['status'] = 'none';
    if (matchingPlanned.length === 0 && matchingCompleted.length === 0) {
      sportStatus = 'none';
    } else if (
      matchingCompleted.length >= matchingPlanned.length ||
      (plannedMin > 0 && completedMin >= plannedMin * 0.85)
    ) {
      sportStatus = 'strong';
    } else if (matchingCompleted.length > 0) {
      sportStatus = 'ok';
    } else {
      sportStatus = 'missing';
    }

    return {
      sport,
      label,
      icon,
      plannedSessions: matchingPlanned.length,
      completedSessions: matchingCompleted.length,
      plannedMinutes: plannedMin,
      completedMinutes: completedMin,
      completedDistanceKm: completedDistKm,
      avgHeartRate:
        hrList.length > 0
          ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length)
          : undefined,
      avgPowerWatts:
        wattsList.length > 0
          ? Math.round(wattsList.reduce((a, b) => a + b, 0) / wattsList.length)
          : undefined,
      avgRpe:
        rpeList.length > 0
          ? Math.round((rpeList.reduce((a, b) => a + b, 0) / rpeList.length) * 10) / 10
          : undefined,
      status: sportStatus,
    };
  });

  // 4. Generate Smart Recommendations across the 4 Axes:
  // (1) Volume, (2) Intensité & Cardio, (3) Drills & Technique, (4) Ajustements d'Entraînements
  const recommendations: CoachRecommendation[] = [];

  // --- AXE 1 : VOLUME ---
  const missingSports = sportSummaries.filter((s) => s.status === 'missing');
  if (volumePct > 118) {
    recommendations.push({
      id: 'rec-volume-high',
      category: 'volume',
      categoryLabel: 'Volume & Récupération',
      icon: '📊',
      priority: 'high',
      title: `Volume supérieur de +${volumePct - 100}% au plan : surveillez la fatigue`,
      detail: `Vous avez réalisé ${completedDurationMinutes} min contre ${plannedDurationMinutes} min prévues. C'est une belle preuve de motivation, mais l'augmentation trop brusque de la charge mécanique augmente le risque de tendinite ou de surmenage.`,
      actionableTip: `Cette semaine, gardez strictement votre journée de repos et n'hésitez pas à raccourcir de 15 min votre footing d'endurance si vos jambes sont lourdes.`,
    });
  } else if (missingSports.length > 0 && completedSessionsCount > 0) {
    const missingNames = missingSports.map((m) => `${m.icon} ${m.label}`).join(', ');
    recommendations.push({
      id: 'rec-volume-balance',
      category: 'volume',
      categoryLabel: 'Équilibre du Volume',
      icon: '📊',
      priority: 'high',
      title: `Rééquilibrer la discipline manquante : ${missingNames}`,
      detail: `Sur la Semaine ${week.weekNumber}, aucune séance n'a été enregistrée en ${missingNames}. En triathlon, la fréquence par sport est plus rentable qu'une seule séance géante.`,
      actionableTip: `Placez au moins 1 séance courte (35 à 45 min) de ${missingSports[0].label} dès le début de cette semaine pour maintenir vos repères moteurs.`,
      suggestedTemplateId:
        missingSports[0].sport === 'swim'
          ? 'swim-tech-drills'
          : missingSports[0].sport === 'strength'
          ? 'strength-weights-fullbody'
          : missingSports[0].sport === 'bike'
          ? 'bike-velocity'
          : 'run-ef-fundamental',
      suggestedDayOfWeek: 2,
    });
  } else {
    recommendations.push({
      id: 'rec-volume-good',
      category: 'volume',
      categoryLabel: 'Volume Hebdomadaire',
      icon: '📊',
      priority: 'positive',
      title: `Progression du volume bien calibrée (${volumePct}% de la cible)`,
      detail: `La répartition entre vos séances permet d'assimiler la charge de la ${week.phaseTitle} sans dette de fatigue excessive.`,
      actionableTip: `Conservez votre sortie longue du week-end comme pilier central : c'est elle qui développe votre densité mitochondriale.`,
    });
  }

  // --- AXE 2 : INTENSITÉ & CARDIO ---
  const enduranceWorkoutsWithHighHr = completedWorkouts.filter(
    (w) =>
      (w.targetZone === 'Z1' || w.targetZone === 'Z2') &&
      ((w.garminActivity?.avgHeartRate && w.garminActivity.avgHeartRate > z2CeilingBpm + 6) ||
        (w.completedRpe && w.completedRpe >= 7))
  );

  const easyThresholdWorkouts = completedWorkouts.filter(
    (w) =>
      (w.targetZone === 'Z4' || w.category === 'threshold' || w.category === 'intervals') &&
      w.completedRpe !== undefined &&
      w.completedRpe <= 5
  );

  if (enduranceWorkoutsWithHighHr.length > 0) {
    const sample = enduranceWorkoutsWithHighHr[0];
    const measuredHr = sample.garminActivity?.avgHeartRate;
    recommendations.push({
      id: 'rec-intensity-z2-drift',
      category: 'intensity',
      categoryLabel: 'Intensité & Zones Cardio',
      icon: '🔥',
      priority: 'high',
      title: `Attention à la dérive en Zone 3 sur vos séances d'endurance (Z2)`,
      detail: `Sur « ${sample.title} », ${
        measuredHr
          ? `votre FC moyenne était de ${measuredHr} bpm alors que votre plafond Z2 Karvonen se situe autour de ${z2CeilingBpm} bpm`
          : `le ressenti RPE (${sample.completedRpe}/10) était plus élevé que prévu pour de l'endurance fondamentale`
      }.`,
      actionableTip: `Appliquez la règle du 80/20 : ralentissez de 15 à 20 sec/km en footing Z2 (ou baissez de 15W à vélo) pour rester en aisance respiratoire totale et arriver frais sur vos séances d'intervalles.`,
    });
  } else if (easyThresholdWorkouts.length > 0) {
    recommendations.push({
      id: 'rec-intensity-level-up',
      category: 'intensity',
      categoryLabel: 'Intensité & Progression',
      icon: '🔥',
      priority: 'positive',
      title: `Vos séances au seuil passent facilement : votre niveau progresse !`,
      detail: `Vos retours RPE sur les séances soutenues montrent une excellente tolérance à l'intensité. Votre système cardiovasculaire s'est adapté aux allures actuelles.`,
      actionableTip: `Si cette aisance se confirme cette semaine, vous pourrez augmenter votre FTP Vélo de +5 à +8W ou accélérer votre allure Seuil Course de 5 sec/km dans Profil (vos séances complétées seront conservées !).`,
    });
  } else {
    recommendations.push({
      id: 'rec-intensity-polarized',
      category: 'intensity',
      categoryLabel: 'Intensité & Polarisation',
      icon: '🔥',
      priority: 'medium',
      title: `Respect du contraste d'intensité (Séances faciles vraiment faciles)`,
      detail: `Avec une FC Max à ${profile.hrMax} bpm et une FTP à ${ftp}W, la clé de la ${week.phaseTitle} est de bien marquer la différence entre vos sorties Z2 (< ${z2CeilingBpm} bpm) et vos blocs Z4.`,
      actionableTip: `Sur la prochaine séance d'intervalles, concentrez-vous sur la régularité : le dernier intervalle doit être réalisé à la même vitesse ou puissance que le premier.`,
    });
  }

  // --- AXE 3 : DRILLS & TECHNIQUE ---
  if (profile.targetSport === 'triathlon' || profile.targetSport === 'swim') {
    recommendations.push({
      id: 'rec-drills-swim-run',
      category: 'drills',
      categoryLabel: 'Éducatifs (Drills) & Économie',
      icon: '🎯',
      priority: 'medium',
      title: `Focus Drills de la semaine : Prise d'appui (Catch) & Cadence Course`,
      detail: `À allures égales, l'amélioration technique réduit votre coût énergétique de 8 à 12%. Ne négligez jamais les 10 minutes d'éducatifs en début de séance.`,
      actionableTip: `🏊 En natation : intégrez 4 x 50m en éducatif « Rattrapé + Poings fermés » pour verrouiller le coude haut. 🏃 En course : visez une cadence dynamique de 175–180 pas/min sur vos 5 lignes droites de fin d'échauffement.`,
    });
  } else if (profile.targetSport === 'bike') {
    recommendations.push({
      id: 'rec-drills-bike',
      category: 'drills',
      categoryLabel: 'Éducatifs (Drills) Cyclisme',
      icon: '🎯',
      priority: 'medium',
      title: `Focus Drills Vélo : Vélocité (95–105 rpm) & Fluidité du Pédalage`,
      detail: `Pédaler trop en force (< 75 rpm) épuise prématurément vos fibres rapides et vos réserves de glycogène sur longue distance.`,
      actionableTip: `Intégrez 5 x 1 min à 100–105 rpm sans rebondir sur la selle pendant votre échauffement vélo pour automatiser un coup de pédale souple.`,
    });
  } else {
    recommendations.push({
      id: 'rec-drills-run',
      category: 'drills',
      categoryLabel: 'Éducatifs (Drills) Course',
      icon: '🎯',
      priority: 'medium',
      title: `Focus Drills Course : Pose médio-pied & Gainage dynamique`,
      detail: `Une foulée rasante et réactive protège vos genoux et améliore la restitution élastique des tendons.`,
      actionableTip: `Après 15 min de footing d'échauffement, réalisez 2 passages de montées de genoux, talons-fesses et griffés du sol suivis de 4 accélérations progressives de 80m.`,
    });
  }

  // --- AXE 4 : AJUSTEMENTS D'ENTRAÎNEMENTS (SEMAINE EN COURS / À VENIR) ---
  const strengthSummary = sportSummaries.find((s) => s.sport === 'strength');
  const hasBrickThisWeek = week.workouts.some((w) => w.sport === 'brick');

  if (!strengthSummary || strengthSummary.completedSessions === 0) {
    recommendations.push({
      id: 'rec-adjust-strength-double',
      category: 'workout_adjustment',
      categoryLabel: 'Ajustement & Doublé Recommandé',
      icon: '🔄',
      priority: 'medium',
      title: `Ajoutez un doublé Poids & Haltères / PPG (40 min) cette semaine`,
      detail: `Le renforcement musculaire (gainage, fessiers, ischios, épaules) est votre meilleure assurance anti-blessure et améliore votre transfert de puissance en fin de course.`,
      actionableTip: `Vous pouvez combiner une séance « Poids & Haltères : Full Body Athlétique » en doublé le même jour qu'une séance de Nage ou de Course courte.`,
      suggestedTemplateId: 'strength-weights-fullbody',
      suggestedDayOfWeek: 3,
    });
  } else if (profile.targetSport === 'triathlon' && !hasBrickThisWeek) {
    recommendations.push({
      id: 'rec-adjust-brick',
      category: 'workout_adjustment',
      categoryLabel: 'Ajustement Spécifique Triathlon',
      icon: '🔄',
      priority: 'medium',
      title: `Conseil Transition T2 : Enchaînez 15 min de course après votre vélo`,
      detail: `Habitudes neuromusculaires : courir immédiatement après avoir posé le vélo (« jambes en coton ») s'apprivoise avec des enchaînements courts et réguliers.`,
      actionableTip: `À la fin de votre sortie vélo du samedi, enfilez vos chaussures de course pour 15 min souples à allure cible dès la sortie du vélo.`,
      suggestedTemplateId: 'brick-simulation-t2',
      suggestedDayOfWeek: 6,
    });
  } else {
    recommendations.push({
      id: 'rec-adjust-recovery',
      category: 'workout_adjustment',
      categoryLabel: 'Optimisation du Programme',
      icon: '🔄',
      priority: 'positive',
      title: `Votre structure hebdomadaire est optimale : maintenez le cap !`,
      detail: `L'alternance entre vos séances clés, le renforcement musculaire et la récupération est très bien équilibrée.`,
      actionableTip: `Si vous sentez une raideur musculaire en milieu de semaine, ajoutez un bloc de 30 min de Mobilité / Récupération Active sans augmenter la charge cardio.`,
      suggestedTemplateId: 'strength-core-tri',
      suggestedDayOfWeek: 5,
    });
  }

  return {
    analyzedWeekNumber: week.weekNumber,
    analyzedWeekIndex: safeIndex,
    phaseTitle: week.phaseTitle,
    startDate: week.startDate,
    endDate: week.endDate,
    mood,
    headline,
    subHeadline,
    encouragementParagraph,
    adherencePct,
    volumePct,
    plannedSessionsCount,
    completedSessionsCount,
    plannedDurationMinutes,
    completedDurationMinutes,
    completedDistanceKm,
    objectivePositioning: {
      readinessScore,
      status,
      statusBadge,
      confirmedLevelLabel,
      daysToRace,
      cumulativeCompletedSessions: cumulativeCompleted,
      cumulativePlannedSessionsToDate: cumulativePlannedToDate,
      cumulativeHoursCompleted,
      summaryText: objectiveSummaryText,
      physiologicalHighlight,
    },
    sportSummaries,
    recommendations,
  };
}
