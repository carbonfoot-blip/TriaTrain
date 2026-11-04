import {
  AthleteProfile,
  GarminBridgeConfig,
  SportType,
  WatchStepPreview,
  Workout,
  WorkoutStep,
} from '../types/triathlon';

/**
 * Parse une allure "mm:ss" en secondes totales
 */
function parsePaceToSeconds(paceStr: string, fallbackSeconds: number): number {
  if (!paceStr || !paceStr.includes(':')) return fallbackSeconds;
  const parts = paceStr.trim().split(':');
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (isNaN(mins) || isNaN(secs)) return fallbackSeconds;
  return mins * 60 + secs;
}

/**
 * Formate un nombre de secondes en "m:ss"
 */
function formatSecondsToPace(totalSec: number): string {
  const safe = Math.max(30, Math.round(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Calcule la plage cible numérique (Allure, Watts ou FC) affichée sur la montre Garmin / COROS
 * ainsi que la cible au format strict du Workout Builder Intervals.icu.
 *
 * IMPORTANT (Règle Intervals.icu) :
 * - Pour les allures (Run / Swim), la plage doit obligatoirement être écrite de la plus LENTE
 *   à la plus RAPIDE (ex: "5:45-5:15/km Pace"), car 5:45/km correspond à la vitesse (m/s) basse
 *   et 5:15/km à la vitesse (m/s) haute.
 * - Utiliser des valeurs absolues explicites ("5:45-5:15/km Pace", "150-180w", "65-75% HR")
 *   évite l'erreur "(null-null for 0km)" lorsque les zones ne sont pas configurées dans Intervals.icu.
 */
export function computeWatchTargetForZone(
  sport: SportType,
  zone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5',
  profile: AthleteProfile
): { displayRange: string; intervalsTarget: string } {
  const hrMax = profile.hrMax || 186;

  if (sport === 'run') {
    const efSec = parsePaceToSeconds(profile.runMetrics.efPaceMinKm, 375);
    const maraSec = parsePaceToSeconds(profile.runMetrics.marathonPaceMinKm, 325);
    const threshSec = parsePaceToSeconds(profile.runMetrics.thresholdPaceMinKm, 290);
    const vmaSec = parsePaceToSeconds(profile.runMetrics.vmaPaceMinKm, 250);

    switch (zone) {
      case 'Z1': {
        const fast = formatSecondsToPace(efSec + 15);
        const slow = formatSecondsToPace(efSec + 45);
        return {
          displayRange: `${fast}–${slow} /km`,
          intervalsTarget: `${slow}-${fast}/km Pace`,
        };
      }
      case 'Z2': {
        const fast = formatSecondsToPace(efSec - 10);
        const slow = formatSecondsToPace(efSec + 15);
        return {
          displayRange: `${fast}–${slow} /km`,
          intervalsTarget: `${slow}-${fast}/km Pace`,
        };
      }
      case 'Z3': {
        const fast = formatSecondsToPace(maraSec - 8);
        const slow = formatSecondsToPace(maraSec + 8);
        return {
          displayRange: `${fast}–${slow} /km`,
          intervalsTarget: `${slow}-${fast}/km Pace`,
        };
      }
      case 'Z4': {
        const fast = formatSecondsToPace(threshSec - 6);
        const slow = formatSecondsToPace(threshSec + 6);
        return {
          displayRange: `${fast}–${slow} /km`,
          intervalsTarget: `${slow}-${fast}/km Pace`,
        };
      }
      case 'Z5': {
        const fast = formatSecondsToPace(vmaSec - 5);
        const slow = formatSecondsToPace(vmaSec + 5);
        return {
          displayRange: `${fast}–${slow} /km`,
          intervalsTarget: `${slow}-${fast}/km Pace`,
        };
      }
    }
  }

  if (sport === 'bike') {
    const ftp = profile.bikeMetrics.ftpWatts || 210;
    const ranges: Record<'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', [number, number]> = {
      Z1: [0.45, 0.55],
      Z2: [0.56, 0.75],
      Z3: [0.76, 0.90],
      Z4: [0.91, 1.05],
      Z5: [1.06, 1.20],
    };
    const [lowPct, highPct] = ranges[zone];
    const lowW = Math.round(ftp * lowPct);
    const highW = Math.round(ftp * highPct);
    return {
      displayRange: `${lowW}–${highW} W (${Math.round(lowPct * 100)}-${Math.round(highPct * 100)}% FTP)`,
      intervalsTarget: `${lowW}-${highW}w`,
    };
  }

  if (sport === 'swim') {
    const cssSec = parsePaceToSeconds(profile.swimMetrics.cssPacePer100m, 120);
    const offsets: Record<'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', [number, number]> = {
      Z1: [12, 22],
      Z2: [5, 12],
      Z3: [0, 5],
      Z4: [-4, 1],
      Z5: [-10, -4],
    };
    const [fastOff, slowOff] = offsets[zone];
    const fast = formatSecondsToPace(cssSec + fastOff);
    const slow = formatSecondsToPace(cssSec + slowOff);
    return {
      displayRange: `${fast}–${slow} /100m`,
      intervalsTarget: `${slow}-${fast}/100m Pace`,
    };
  }

  // Brick / Strength -> Fréquence Cardiaque
  const hrRanges: Record<'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', [number, number]> = {
    Z1: [55, 65],
    Z2: [65, 75],
    Z3: [75, 83],
    Z4: [83, 90],
    Z5: [90, 98],
  };
  const [lowPct, highPct] = hrRanges[zone];
  return {
    displayRange: `${Math.round((hrMax * lowPct) / 100)}–${Math.round((hrMax * highPct) / 100)} bpm`,
    intervalsTarget: `${lowPct}-${highPct}% HR`,
  };
}

/**
 * Nettoie intégralement le texte d'une étape pour le Workout Builder d'Intervals.icu.
 *
 * RÈGLE CRITIQUE INTERVALS.ICU :
 * Tout nombre suivi de "m", "min", "s", "x", "'", "/km", "W" ou "Z1..Z5" présent dans le libellé
 * d'une ligne "- ..." est interprété par Intervals.icu comme une durée/distance/cible (ex: "1000m"
 * est lu comme 1000 MINUTES = 16h40 !).
 * Le libellé textuel placé avant la durée ne doit donc contenir AUCUN chiffre ni unité.
 */
function sanitizeStepLabelForIntervals(
  name: string,
  targetDescription: string,
  stepType: WorkoutStep['type']
): string {
  const raw = `${name} ${targetDescription}`
    // Supprimer le contenu entre parenthèses s'il contient des chiffres (ex: "(4:30/km)", "(189W)", "(R=1'45)")
    .replace(/\([^)]*\d[^)]*\)/g, ' ')
    // Supprimer les notations de récupération R=1'45, R=20s, R=2 min, etc.
    .replace(/\bR\s*=\s*[\d'":\sA-Za-z]+/gi, ' ')
    // Supprimer les mentions "Allure cible :", "Allure :", "Série clé :", "Partie 1 :"
    .replace(/\b(?:Allure\s*cible|Allure|Cible|Série\s*clé|Blocs?\s*Allure\s*Cible|Partie\s*\d+)\s*:?/gi, ' ')
    // Supprimer les codes de zones Z0..Z5
    .replace(/\bZ[0-5]\b/gi, ' ')
    // Supprimer toute séquence contenant des chiffres et leurs unités éventuelles (1000m, 15 min, 5:29/km, 4 x, 189W, 90-95 rpm...)
    .replace(/\d+(?:[:.,'/+-]\d+)*\s*(?:km\/h|\/km|\/100m|\/mi|mtr|min|sec|rpm|spm|ppm|bpm|watts?|km|m|s|w|h|x|×|%|'|")?\b/gi, ' ')
    // Supprimer les symboles spéciaux ou opérateurs restants
    .replace(/[@/\\+<>—–=:;•*[\]()-]/g, ' ')
    .replace(/\b(?:x|×)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (raw.length >= 3) {
    return raw.slice(0, 48).trim();
  }

  switch (stepType) {
    case 'warmup':
      return 'Echauffement progressif';
    case 'drill':
      return 'Educatifs techniques';
    case 'interval':
      return 'Serie principale';
    case 'recovery':
      return 'Recuperation souple';
    case 'cooldown':
    default:
      return 'Retour au calme';
  }
}

interface ParsedRepeatBlock {
  repeats: number;
  workDurationOrDistToken: string; // ex: "1000mtr", "30s", "12m"
  restDurationToken: string; // ex: "1m45s", "30s", "2m"
  workLabel: string;
  restLabel: string;
  workTarget: string;
  restTarget: string;
  displayLabel: string;
}

/**
 * Extrait une éventuelle structure de répétitions (ex: "4 x 1000m @ Seuil R=1'45",
 * "8 x (30s Vite / 30s Récup)", "4 x 6 min @ SweetSpot R=2'", "8 x 100m Crawl R=15s")
 * afin de générer un vrai bloc "Nx" multi-lignes compris par Intervals.icu et Garmin Connect.
 */
function parseStepRepeatStructure(
  step: WorkoutStep,
  sport: SportType,
  profile: AthleteProfile
): ParsedRepeatBlock | null {
  const combined = `${step.name} ${step.targetDescription}`;
  const workZone = step.targetZone || 'Z4';
  const workTarget = computeWatchTargetForZone(sport, workZone, profile).intervalsTarget;
  const restTarget = computeWatchTargetForZone(sport, 'Z1', profile).intervalsTarget;
  const workLabel = sanitizeStepLabelForIntervals(step.name, step.targetDescription, step.type);
  const restLabel = sport === 'swim' ? 'Repos au mur' : 'Recuperation souple';

  // Helper pour extraire R=1'45, R=2', R=30s, R=2 min
  const extractRecoveryToken = (text: string, fallback: string): string => {
    const minSecMatch = text.match(/\bR\s*=\s*(\d+)\s*'\s*(\d{1,2})/i);
    if (minSecMatch) {
      return `${minSecMatch[1]}m${minSecMatch[2]}s`;
    }
    const minQuoteMatch = text.match(/\bR\s*=\s*(\d+)\s*'/i);
    if (minQuoteMatch) {
      return `${minQuoteMatch[1]}m`;
    }
    const unitMatch = text.match(/\bR\s*=\s*(\d+)\s*(s|sec|min|m)\b/i);
    if (unitMatch) {
      const val = unitMatch[1];
      const u = unitMatch[2].toLowerCase();
      return u.startsWith('s') ? `${val}s` : `${val}m`;
    }
    return fallback;
  };

  // Cas 1 : "8 x (30s Vite @ VMA / 30s Récup trot)" ou "4 x 45s effort / 15s récup"
  const dualTimeMatch = combined.match(
    /(\d+)\s*[x×]\s*\(?(\d+)\s*(s|sec|min|m)\b[^/]*\/\s*(\d+)\s*(s|sec|min|m)\b/i
  );
  if (dualTimeMatch) {
    const repeats = parseInt(dualTimeMatch[1], 10);
    const workVal = dualTimeMatch[2];
    const workUnit = dualTimeMatch[3].toLowerCase().startsWith('s') ? 's' : 'm';
    const restVal = dualTimeMatch[4];
    const restUnit = dualTimeMatch[5].toLowerCase().startsWith('s') ? 's' : 'm';
    if (repeats >= 2) {
      return {
        repeats,
        workDurationOrDistToken: `${workVal}${workUnit}`,
        restDurationToken: `${restVal}${restUnit}`,
        workLabel,
        restLabel,
        workTarget,
        restTarget,
        displayLabel: `${repeats} × (${workVal}${workUnit} / ${restVal}${restUnit})`,
      };
    }
  }

  // Cas 2 : Répétitions sur une distance : "4 x 1000m", "3 x 2000m", "8 x 100m", "4 x 80m"
  const distRepeatMatch = combined.match(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(km|m|mtr)\b/i);
  if (distRepeatMatch) {
    const repeats = parseInt(distRepeatMatch[1], 10);
    const rawNum = parseFloat(distRepeatMatch[2].replace(',', '.'));
    const unit = distRepeatMatch[3].toLowerCase();
    const meters = unit === 'km' ? Math.round(rawNum * 1000) : Math.round(rawNum);
    if (repeats >= 2 && meters > 0) {
      const defaultRest = sport === 'swim' ? '20s' : meters >= 1000 ? '1m45s' : '45s';
      const restToken = extractRecoveryToken(combined, defaultRest);
      return {
        repeats,
        // CRITIQUE : Toujours "mtr" pour les mètres dans Intervals.icu (jamais "m" qui veut dire minutes !)
        workDurationOrDistToken: `${meters}mtr`,
        restDurationToken: restToken,
        workLabel,
        restLabel,
        workTarget,
        restTarget: sport === 'swim' ? '50% Pace' : restTarget,
        displayLabel: `${repeats} × ${meters}m (R=${restToken})`,
      };
    }
  }

  // Cas 3 : Répétitions sur une durée : "3 x 12 min", "4 x 6 min"
  const timeRepeatMatch = combined.match(/(\d+)\s*[x×]\s*(\d+)\s*(min|m|sec|s)\b/i);
  if (timeRepeatMatch) {
    const repeats = parseInt(timeRepeatMatch[1], 10);
    const val = parseInt(timeRepeatMatch[2], 10);
    const unit = timeRepeatMatch[3].toLowerCase().startsWith('s') ? 's' : 'm';
    if (repeats >= 2 && val > 0) {
      const restToken = extractRecoveryToken(combined, unit === 'm' ? '2m' : '30s');
      return {
        repeats,
        workDurationOrDistToken: `${val}${unit}`,
        restDurationToken: restToken,
        workLabel,
        restLabel,
        workTarget,
        restTarget,
        displayLabel: `${repeats} × ${val}${unit} (R=${restToken})`,
      };
    }
  }

  return null;
}

/**
 * Abrège proprement le nom de l'étape/drill pour l'écran d'une montre Garmin/COROS (<= 28 caractères)
 */
function formatWatchScreenTitle(step: WorkoutStep): string {
  const prefix =
    step.type === 'drill'
      ? '🎯 '
      : step.type === 'interval'
      ? '⚡ '
      : step.type === 'warmup'
      ? '🔥 '
      : step.type === 'recovery'
      ? '💧 '
      : '🧊 ';

  const cleanedName = step.name
    .replace(/Échauffement/gi, 'Échauf.')
    .replace(/Récupération/gi, 'Récup.')
    .replace(/Retour au calme/gi, 'Calme')
    .replace(/Éducatifs/gi, 'Drills')
    .replace(/Intervalle/gi, 'Int.')
    .trim();

  const full = `${prefix}${cleanedName}`;
  return full.length <= 28 ? full : `${full.slice(0, 26)}..`;
}

/**
 * Extrait un indice de cadence ou de technique (ex: "90-95 rpm", "Crawl rattrapé", "Foulée")
 */
function extractCadenceOrDrillCue(step: WorkoutStep, sport: SportType): string | undefined {
  const combined = `${step.name} ${step.targetDescription} ${step.notes || ''}`;
  const rpmMatch = combined.match(/(\d{2,3}\s*(?:-\s*\d{2,3})?\s*(?:rpm|spm|ppm))/i);
  if (rpmMatch) {
    return `Cadence ${rpmMatch[1]}`;
  }
  if (step.type === 'drill') {
    if (sport === 'swim') return 'Focus glisse & prise d’appui';
    if (sport === 'bike') return 'Vélocité fluide sans rebond';
    if (sport === 'run') return 'Pose médio-pied & posture haute';
    return 'Exécution technique contrôlée';
  }
  return undefined;
}

/**
 * Construit la liste des étapes formatées pour l'aperçu Montre Garmin/COROS et l'export structuré
 */
export function buildWatchStepsForWorkout(
  workout: Workout,
  profile: AthleteProfile
): WatchStepPreview[] {
  const rawSteps: WorkoutStep[] =
    workout.steps && workout.steps.length > 0
      ? workout.steps
      : [
          {
            type: 'warmup',
            name: 'Échauffement progressif',
            durationMinutes: Math.max(5, Math.round(workout.durationMinutes * 0.2)),
            targetZone: 'Z1',
            targetDescription: 'Mise en route souple',
          },
          {
            type: 'interval',
            name: workout.title,
            durationMinutes: Math.max(10, Math.round(workout.durationMinutes * 0.65)),
            targetZone: (workout.targetZone as WorkoutStep['targetZone']) || 'Z2',
            targetDescription: workout.description,
          },
          {
            type: 'cooldown',
            name: 'Retour au calme',
            durationMinutes: Math.max(5, Math.round(workout.durationMinutes * 0.15)),
            targetZone: 'Z1',
            targetDescription: 'Relâchement complet',
          },
        ];

  return rawSteps.map((step, idx): WatchStepPreview => {
    const durationMinutes = step.durationMinutes || 5;
    const durationSeconds = durationMinutes * 60;
    const zone = step.targetZone || 'Z2';
    const targetInfo = computeWatchTargetForZone(workout.sport, zone, profile);
    const repeatBlock = parseStepRepeatStructure(step, workout.sport, profile);

    let durationOrDistanceLabel = `${durationMinutes}:00`;
    let repeats = step.repeats;

    if (repeatBlock) {
      repeats = repeatBlock.repeats;
      durationOrDistanceLabel = repeatBlock.displayLabel;
    } else if (step.distanceMeters && step.distanceMeters > 0) {
      durationOrDistanceLabel =
        step.distanceMeters >= 1000 && workout.sport !== 'swim'
          ? `${(step.distanceMeters / 1000).toFixed(1)} km`
          : `${step.distanceMeters} m`;
    }

    const cleanLabel = sanitizeStepLabelForIntervals(
      step.name,
      step.targetDescription,
      step.type
    );

    // Pour une étape simple : utiliser "mtr" si c'est une distance de natation, sinon "m" (minutes)
    const stepDurationOrDistToken =
      workout.sport === 'swim' && step.distanceMeters && step.distanceMeters > 0
        ? `${step.distanceMeters}mtr`
        : `${durationMinutes}m`;

    const intervalsSyntaxLine = repeatBlock
      ? `${repeatBlock.repeats}x\n- ${repeatBlock.workLabel} ${repeatBlock.workDurationOrDistToken} ${repeatBlock.workTarget}\n- ${repeatBlock.restLabel} ${repeatBlock.restDurationToken} ${repeatBlock.restTarget}`
      : `- ${cleanLabel} ${stepDurationOrDistToken} ${targetInfo.intervalsTarget}`;

    return {
      stepNumber: idx + 1,
      type: step.type,
      watchScreenTitle: formatWatchScreenTitle(step),
      drillCue: step.targetDescription || step.name,
      durationOrDistanceLabel,
      repeats,
      durationSeconds,
      distanceMeters: step.distanceMeters,
      targetZone: zone,
      watchTargetRange: targetInfo.displayRange,
      cadenceOrStrokeCue: extractCadenceOrDrillCue(step, workout.sport),
      intervalsSyntaxLine,
    };
  });
}

/**
 * Génère la description structurée au format officiel Intervals.icu Workout Builder
 * (Automatiquement convertie en étapes Garmin Connect & COROS par Intervals.icu)
 */
export function generateIntervalsStructuredWorkoutText(
  workout: Workout,
  profile: AthleteProfile
): string {
  const rawSteps: WorkoutStep[] =
    workout.steps && workout.steps.length > 0
      ? workout.steps
      : [
          {
            type: 'warmup',
            name: 'Échauffement progressif',
            durationMinutes: Math.max(5, Math.round(workout.durationMinutes * 0.2)),
            targetZone: 'Z1',
            targetDescription: 'Mise en route souple',
          },
          {
            type: 'interval',
            name: workout.title,
            durationMinutes: Math.max(10, Math.round(workout.durationMinutes * 0.65)),
            targetZone: (workout.targetZone as WorkoutStep['targetZone']) || 'Z2',
            targetDescription: workout.description,
          },
          {
            type: 'cooldown',
            name: 'Retour au calme',
            durationMinutes: Math.max(5, Math.round(workout.durationMinutes * 0.15)),
            targetZone: 'Z1',
            targetDescription: 'Relâchement complet',
          },
        ];

  const warmups = rawSteps.filter((s) => s.type === 'warmup');
  const mainAndDrills = rawSteps.filter(
    (s) => s.type === 'drill' || s.type === 'interval' || s.type === 'recovery'
  );
  const cooldowns = rawSteps.filter((s) => s.type === 'cooldown');

  const formatSingleStepLine = (step: WorkoutStep): string => {
    const durationMinutes = step.durationMinutes || 5;
    const zone = step.targetZone || 'Z2';
    const targetInfo = computeWatchTargetForZone(workout.sport, zone, profile);
    const cleanLabel = sanitizeStepLabelForIntervals(
      step.name,
      step.targetDescription,
      step.type
    );
    const token =
      workout.sport === 'swim' && step.distanceMeters && step.distanceMeters > 0
        ? `${step.distanceMeters}mtr`
        : `${durationMinutes}m`;
    return `- ${cleanLabel} ${token} ${targetInfo.intervalsTarget}`;
  };

  const lines: string[] = [];
  lines.push(workout.description);
  if (workout.coachTips && workout.coachTips.length > 0) {
    lines.push(`Coach TriaTrain : ${workout.coachTips[0]}`);
  }
  lines.push('');

  if (warmups.length > 0) {
    lines.push('Warmup');
    warmups.forEach((step) => {
      const rep = parseStepRepeatStructure(step, workout.sport, profile);
      if (rep) {
        lines.push('');
        lines.push(`${rep.repeats}x`);
        lines.push(`- ${rep.workLabel} ${rep.workDurationOrDistToken} ${rep.workTarget}`);
        lines.push(`- ${rep.restLabel} ${rep.restDurationToken} ${rep.restTarget}`);
        lines.push('');
      } else {
        lines.push(formatSingleStepLine(step));
      }
    });
    lines.push('');
  }

  if (mainAndDrills.length > 0) {
    // Si le Main Set ne contient qu'une seule étape et que c'est un bloc de répétitions,
    // on écrit directement "Main Set Nx" (syntaxe officielle Intervals.icu la plus propre)
    if (mainAndDrills.length === 1) {
      const onlyStep = mainAndDrills[0];
      const rep = parseStepRepeatStructure(onlyStep, workout.sport, profile);
      if (rep) {
        lines.push(`Main Set ${rep.repeats}x`);
        lines.push(`- ${rep.workLabel} ${rep.workDurationOrDistToken} ${rep.workTarget}`);
        lines.push(`- ${rep.restLabel} ${rep.restDurationToken} ${rep.restTarget}`);
        lines.push('');
      } else {
        lines.push('Main Set');
        lines.push(formatSingleStepLine(onlyStep));
        lines.push('');
      }
    } else {
      let hasOpenMainSetHeader = false;
      mainAndDrills.forEach((step) => {
        const rep = parseStepRepeatStructure(step, workout.sport, profile);
        if (rep) {
          lines.push('');
          lines.push(`Main Set ${rep.repeats}x`);
          lines.push(`- ${rep.workLabel} ${rep.workDurationOrDistToken} ${rep.workTarget}`);
          lines.push(`- ${rep.restLabel} ${rep.restDurationToken} ${rep.restTarget}`);
          lines.push('');
          hasOpenMainSetHeader = false;
        } else {
          if (!hasOpenMainSetHeader) {
            lines.push('Main Set');
            hasOpenMainSetHeader = true;
          }
          lines.push(formatSingleStepLine(step));
        }
      });
      lines.push('');
    }
  }

  if (cooldowns.length > 0) {
    lines.push('Cooldown');
    cooldowns.forEach((step) => {
      lines.push(formatSingleStepLine(step));
    });
  }

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapTriaTrainSportToIntervalsType(sport: SportType): string {
  switch (sport) {
    case 'swim':
      return 'Swim';
    case 'bike':
      return 'Ride';
    case 'run':
      return 'Run';
    case 'brick':
      return 'Ride';
    case 'strength':
      return 'WeightTraining';
    default:
      return 'Workout';
  }
}

/**
 * Synchronise automatiquement les seuils (Threshold Pace en m/s, Zones d'allure, FTP, FC Max)
 * du profil TriaTrain vers les Sport Settings d'Intervals.icu afin que l'affichage du graphique
 * et la résolution des étapes Garmin Connect ne tombent jamais sur "(null-null for 0km)".
 */
async function syncAthleteThresholdsToIntervals(
  athleteId: string,
  authToken: string,
  profile: AthleteProfile
): Promise<void> {
  const threshSec = parsePaceToSeconds(profile.runMetrics.thresholdPaceMinKm, 290);
  const runThresholdMetersPerSec = Number((1000 / Math.max(150, threshSec)).toFixed(4));

  const cssSec = parsePaceToSeconds(profile.swimMetrics.cssPacePer100m, 120);
  const swimThresholdMetersPerSec = Number((100 / Math.max(50, cssSec)).toFixed(4));

  const ftp = profile.bikeMetrics.ftpWatts || 210;
  const maxHr = profile.hrMax || 186;
  const lthr = Math.round(maxHr * 0.88);

  const defaultPaceZones = [77.5, 87.7, 94.3, 100.0, 103.4, 111.5, 999.0];
  const defaultPaceZoneNames = [
    'Zone 1',
    'Zone 2',
    'Zone 3',
    'Zone 4',
    'Zone 5a',
    'Zone 5b',
    'Zone 5c',
  ];

  const headers = {
    Authorization: `Basic ${authToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const baseUrl = `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
    athleteId
  )}/sport-settings`;

  await Promise.allSettled([
    fetch(`${baseUrl}/Run`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        threshold_pace: runThresholdMetersPerSec,
        pace_units: 'MINS_KM',
        pace_zones: defaultPaceZones,
        pace_zone_names: defaultPaceZoneNames,
        max_hr: maxHr,
        lthr,
      }),
    }),
    fetch(`${baseUrl}/Ride`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ftp,
        max_hr: maxHr,
        lthr,
      }),
    }),
    fetch(`${baseUrl}/Swim`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        threshold_pace: swimThresholdMetersPerSec,
        pace_units: 'SECS_100M',
        pace_zones: defaultPaceZones,
        pace_zone_names: defaultPaceZoneNames,
        max_hr: maxHr,
        lthr,
      }),
    }),
  ]);
}

export interface PushWatchResponse {
  pushedWorkoutIds: string[];
  mode: 'intervals_icu' | 'demo';
  timestamp: string;
}

/**
 * Pousse une ou plusieurs séances structurées (avec leurs drills) vers Garmin Connect & COROS
 * via le calendrier d'entraînement Intervals.icu (POST /api/v1/athlete/{id}/events/bulk?upsert=true)
 */
export async function pushWorkoutsToWatch(
  workouts: Workout[],
  profile: AthleteProfile,
  config: GarminBridgeConfig
): Promise<PushWatchResponse> {
  const validWorkouts = workouts.filter((w) => w.sport !== 'rest');
  if (validWorkouts.length === 0) {
    throw new Error('Aucune séance active à envoyer vers la montre.');
  }

  const nowIso = new Date().toISOString();

  // Si l'utilisateur a configuré sa clé API Intervals.icu, on pousse réellement vers l'API
  if (config.provider === 'intervals_icu' && config.intervalsApiKey.trim()) {
    const apiKey = config.intervalsApiKey.trim();
    const athleteId = config.intervalsAthleteId.trim() || '0';
    const authToken = btoa(`API_KEY:${apiKey}`);

    // 1. Calibrer automatiquement les seuils (Run / Ride / Swim) dans Intervals.icu
    // pour éviter toute résolution "(null-null for 0km)"
    try {
      await syncAthleteThresholdsToIntervals(athleteId, authToken, profile);
    } catch {
      // Non bloquant si les sport-settings ne sont pas modifiables
    }

    // 2. Construire le payload d'événements WORKOUT sans surcharger moving_time/distance
    // afin qu'Intervals.icu calcule exactement la durée, la distance et les Steps Garmin Connect
    // depuis les étapes structurées de "description".
    const payload = validWorkouts.map((wo) => ({
      category: 'WORKOUT',
      start_date_local: `${wo.date}T08:00:00`,
      type: mapTriaTrainSportToIntervalsType(wo.sport),
      name: `[TriaTrain] ${wo.title}`,
      description: generateIntervalsStructuredWorkoutText(wo, profile),
      external_id: `triatrain_${wo.id}`,
    }));

    const url = `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
      athleteId
    )}/events/bulk?upsert=true`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Clé API Intervals.icu refusée (401/403). Vérifiez votre clé dans l’onglet de configuration.'
        );
      }
      throw new Error(`Erreur lors de l'envoi vers Intervals.icu (HTTP ${response.status}).`);
    }

    return {
      pushedWorkoutIds: validWorkouts.map((w) => w.id),
      mode: 'intervals_icu',
      timestamp: nowIso,
    };
  }

  // Sinon, mode Simulation sans fil (ou lorsque le mode Démo est sélectionné)
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    pushedWorkoutIds: validWorkouts.map((w) => w.id),
    mode: 'demo',
    timestamp: nowIso,
  };
}

/**
 * Génère et télécharge un fichier d'entraînement structuré .ZWO (compatible Zwift, COROS, Home-Trainer)
 * contenant chaque bloc et les consignes d'éducatifs (TextEvent)
 */
export function downloadZwoWorkoutFile(workout: Workout, profile: AthleteProfile): void {
  const watchSteps = buildWatchStepsForWorkout(workout, profile);
  const sportTag = workout.sport === 'run' ? 'run' : 'bike';

  const zonePowerPct: Record<'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', number> = {
    Z1: 0.52,
    Z2: 0.68,
    Z3: 0.83,
    Z4: 0.97,
    Z5: 1.12,
  };

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const stepXmlBlocks = watchSteps.map((step) => {
    const pct = zonePowerPct[step.targetZone] || 0.7;
    const tag =
      step.type === 'warmup'
        ? 'Warmup'
        : step.type === 'cooldown'
        ? 'Cooldown'
        : 'SteadyState';

    if (tag === 'Warmup') {
      return `    <Warmup Duration="${step.durationSeconds}" PowerLow="0.45" PowerHigh="${pct.toFixed(2)}">
      <textevent timeoffset="5" message="${escapeXml(`${step.watchScreenTitle} : ${step.drillCue} (${step.watchTargetRange})`)}" />
    </Warmup>`;
    }
    if (tag === 'Cooldown') {
      return `    <Cooldown Duration="${step.durationSeconds}" PowerLow="${pct.toFixed(2)}" PowerHigh="0.45">
      <textevent timeoffset="5" message="${escapeXml(`${step.watchScreenTitle} : ${step.drillCue}`)}" />
    </Cooldown>`;
    }
    return `    <SteadyState Duration="${step.durationSeconds}" Power="${pct.toFixed(2)}">
      <textevent timeoffset="5" message="${escapeXml(`${step.watchScreenTitle} : ${step.drillCue} (${step.watchTargetRange})`)}" />
    </SteadyState>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>TriaTrain Coach</author>
  <name>${escapeXml(workout.title)}</name>
  <description>${escapeXml(workout.description)}</description>
  <sportType>${sportTag}</sportType>
  <tags>
    <tag name="TriaTrain" />
    <tag name="${escapeXml(workout.targetZone)}" />
  </tags>
  <workout>
${stepXmlBlocks.join('\n')}
  </workout>
</workout_file>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = workout.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `TriaTrain_W${workout.weekNumber}_J${workout.dayOfWeek}_${safeName}.zwo`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Calcul CRC-16 officiel du protocole ANT+ / Garmin FIT
 */
function computeFitCrc16(bytes: Uint8Array, length: number): number {
  const crcTable = [
    0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401,
    0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
  ];
  let crc = 0;
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    let tmp = crcTable[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ crcTable[byte & 0xf];
    tmp = crcTable[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xf];
  }
  return crc & 0xffff;
}

/**
 * Convertit une chaîne UTF-8/ASCII en tableau d'octets de taille fixe terminé par 0
 */
function encodeFixedAscii(text: string, byteLength: number): Uint8Array {
  const out = new Uint8Array(byteLength);
  const clean = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .trim();
  for (let i = 0; i < Math.min(clean.length, byteLength - 1); i++) {
    out[i] = clean.charCodeAt(i);
  }
  return out;
}

/**
 * Génère et télécharge un fichier binaire .FIT Workout natif (File Type 5)
 * utilisable directement dans GARMIN/NewFiles (ou GARMIN/Workouts) et l'application COROS
 */
export function downloadFitWorkoutFile(workout: Workout, profile: AthleteProfile): void {
  const watchSteps = buildWatchStepsForWorkout(workout, profile);
  const chunks: number[] = [];

  const pushUint8 = (v: number) => chunks.push(v & 0xff);
  const pushUint16LE = (v: number) => {
    chunks.push(v & 0xff, (v >> 8) & 0xff);
  };
  const pushUint32LE = (v: number) => {
    chunks.push(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff);
  };
  const pushBytes = (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) chunks.push(arr[i]);
  };

  // Sport FIT enum: 1 = running, 2 = cycling, 5 = swimming, 10 = training/strength
  const fitSport =
    workout.sport === 'run'
      ? 1
      : workout.sport === 'bike' || workout.sport === 'brick'
      ? 2
      : workout.sport === 'swim'
      ? 5
      : 10;

  // 1. Definition Message 0: file_id (Global Mesg 0)
  pushUint8(0x40); // Definition header, local mesg 0
  pushUint8(0); // reserved
  pushUint8(0); // little-endian
  pushUint16LE(0); // Global mesg num = 0 (file_id)
  pushUint8(4); // 4 fields
  // field 0 (type: enum)
  pushUint8(0);
  pushUint8(1);
  pushUint8(0x00);
  // field 1 (manufacturer: uint16)
  pushUint8(1);
  pushUint8(2);
  pushUint8(0x84);
  // field 2 (product: uint16)
  pushUint8(2);
  pushUint8(2);
  pushUint8(0x84);
  // field 4 (time_created: uint32)
  pushUint8(4);
  pushUint8(4);
  pushUint8(0x86);

  // Data Message 0: file_id
  pushUint8(0x00);
  pushUint8(5); // type = 5 (workout file)
  pushUint16LE(1); // manufacturer = 1 (Garmin)
  pushUint16LE(65534);
  const fitEpochOffset = Math.floor((Date.now() - Date.UTC(1989, 11, 31, 0, 0, 0)) / 1000);
  pushUint32LE(fitEpochOffset);

  // 2. Definition Message 1: workout (Global Mesg 26)
  pushUint8(0x41); // Definition header, local mesg 1
  pushUint8(0);
  pushUint8(0);
  pushUint16LE(26); // Global mesg num = 26 (workout)
  pushUint8(3); // 3 fields
  // field 4 (sport: enum)
  pushUint8(4);
  pushUint8(1);
  pushUint8(0x00);
  // field 6 (num_valid_steps: uint16)
  pushUint8(6);
  pushUint8(2);
  pushUint8(0x84);
  // field 8 (wkt_name: string 24 bytes)
  pushUint8(8);
  pushUint8(24);
  pushUint8(0x07);

  // Data Message 1: workout
  pushUint8(0x01);
  pushUint8(fitSport);
  pushUint16LE(watchSteps.length);
  pushBytes(encodeFixedAscii(workout.title, 24));

  // 3. Definition Message 2: workout_step (Global Mesg 27)
  pushUint8(0x42); // Definition header, local mesg 2
  pushUint8(0);
  pushUint8(0);
  pushUint16LE(27); // Global mesg num = 27 (workout_step)
  pushUint8(7); // 7 fields
  // field 254 (message_index: uint16)
  pushUint8(254);
  pushUint8(2);
  pushUint8(0x84);
  // field 0 (wkt_step_name: string 32 bytes -> nom du drill et cible !)
  pushUint8(0);
  pushUint8(32);
  pushUint8(0x07);
  // field 1 (duration_type: enum, 0 = time)
  pushUint8(1);
  pushUint8(1);
  pushUint8(0x00);
  // field 2 (duration_value: uint32, milliseconds)
  pushUint8(2);
  pushUint8(4);
  pushUint8(0x86);
  // field 3 (target_type: enum, 0 = speed, 1 = heart_rate, 2 = open, 4 = power)
  pushUint8(3);
  pushUint8(1);
  pushUint8(0x00);
  // field 4 (target_value: uint32, zone 1..5 or 0)
  pushUint8(4);
  pushUint8(4);
  pushUint8(0x86);
  // field 7 (intensity: enum, 0=active, 1=rest, 2=warmup, 3=cooldown)
  pushUint8(7);
  pushUint8(1);
  pushUint8(0x00);

  // Data Messages 2: each workout step / drill
  watchSteps.forEach((step, idx) => {
    pushUint8(0x02);
    pushUint16LE(idx);
    const stepDrillLabel = `${step.watchScreenTitle} ${step.watchTargetRange}`;
    pushBytes(encodeFixedAscii(stepDrillLabel, 32));
    pushUint8(0); // duration_type = 0 (time in ms)
    pushUint32LE(step.durationSeconds * 1000);
    const targetType = workout.sport === 'bike' ? 4 : 1; // 4 = power zone, 1 = HR zone
    pushUint8(targetType);
    const zoneNum = parseInt(step.targetZone.replace('Z', ''), 10) || 2;
    pushUint32LE(zoneNum);
    const intensity =
      step.type === 'warmup'
        ? 2
        : step.type === 'cooldown'
        ? 3
        : step.type === 'recovery'
        ? 1
        : 0;
    pushUint8(intensity);
  });

  // Construct 14-byte FIT Header + Data + 2-byte CRC
  const dataSize = chunks.length;
  const totalBuffer = new Uint8Array(14 + dataSize + 2);

  totalBuffer[0] = 14; // Header size
  totalBuffer[1] = 0x10; // Protocol version 1.0
  const profileVer = 2116;
  totalBuffer[2] = profileVer & 0xff;
  totalBuffer[3] = (profileVer >> 8) & 0xff;
  totalBuffer[4] = dataSize & 0xff;
  totalBuffer[5] = (dataSize >> 8) & 0xff;
  totalBuffer[6] = (dataSize >> 16) & 0xff;
  totalBuffer[7] = (dataSize >> 24) & 0xff;
  totalBuffer[8] = 0x2e; // '.'
  totalBuffer[9] = 0x46; // 'F'
  totalBuffer[10] = 0x49; // 'I'
  totalBuffer[11] = 0x54; // 'T'

  const headerCrc = computeFitCrc16(totalBuffer, 12);
  totalBuffer[12] = headerCrc & 0xff;
  totalBuffer[13] = (headerCrc >> 8) & 0xff;

  for (let i = 0; i < dataSize; i++) {
    totalBuffer[14 + i] = chunks[i];
  }

  const fileCrc = computeFitCrc16(totalBuffer, 14 + dataSize);
  totalBuffer[14 + dataSize] = fileCrc & 0xff;
  totalBuffer[14 + dataSize + 1] = (fileCrc >> 8) & 0xff;

  const blob = new Blob([totalBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = workout.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `TriaTrain_W${workout.weekNumber}_J${workout.dayOfWeek}_${safeName}.fit`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
