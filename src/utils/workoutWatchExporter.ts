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
      case 'Z1':
        return {
          displayRange: `${formatSecondsToPace(efSec + 20)}–${formatSecondsToPace(efSec + 45)} /km`,
          intervalsTarget: 'Z1 Pace',
        };
      case 'Z2':
        return {
          displayRange: `${formatSecondsToPace(efSec - 10)}–${formatSecondsToPace(efSec + 15)} /km`,
          intervalsTarget: 'Z2 Pace',
        };
      case 'Z3':
        return {
          displayRange: `${formatSecondsToPace(maraSec - 8)}–${formatSecondsToPace(maraSec + 8)} /km`,
          intervalsTarget: 'Z3 Pace',
        };
      case 'Z4':
        return {
          displayRange: `${formatSecondsToPace(threshSec - 6)}–${formatSecondsToPace(threshSec + 6)} /km`,
          intervalsTarget: 'Z4 Pace',
        };
      case 'Z5':
        return {
          displayRange: `${formatSecondsToPace(vmaSec - 5)}–${formatSecondsToPace(vmaSec + 5)} /km`,
          intervalsTarget: 'Z5 Pace',
        };
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
      intervalsTarget: `${Math.round(lowPct * 100)}-${Math.round(highPct * 100)}%`,
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
    const [minOff, maxOff] = offsets[zone];
    return {
      displayRange: `${formatSecondsToPace(cssSec + minOff)}–${formatSecondsToPace(cssSec + maxOff)} /100m`,
      intervalsTarget: `${zone} Pace`,
    };
  }

  // Brick / Strength -> Fréquence Cardiaque
  const hrRanges: Record<'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', [number, number]> = {
    Z1: [0.55, 0.65],
    Z2: [0.65, 0.75],
    Z3: [0.75, 0.83],
    Z4: [0.83, 0.90],
    Z5: [0.90, 0.98],
  };
  const [lowHr, highHr] = hrRanges[zone];
  return {
    displayRange: `${Math.round(hrMax * lowHr)}–${Math.round(hrMax * highHr)} bpm`,
    intervalsTarget: `${zone} HR`,
  };
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

    // Détection d'un pattern de répétition dans le nom ou la consigne (ex: "6x50m", "4x1000m", "8 x 30s")
    const repeatDistMatch = `${step.name} ${step.targetDescription}`.match(
      /(\d+)\s*[x×]\s*(\d+)\s*(m|km|s|sec|min)/i
    );

    let durationOrDistanceLabel = `${durationMinutes}:00`;
    let repeats = step.repeats;

    if (repeatDistMatch) {
      repeats = parseInt(repeatDistMatch[1], 10);
      durationOrDistanceLabel = `${repeatDistMatch[1]} × ${repeatDistMatch[2]}${repeatDistMatch[3]}`;
    } else if (step.distanceMeters && step.distanceMeters > 0) {
      durationOrDistanceLabel =
        step.distanceMeters >= 1000 && workout.sport !== 'swim'
          ? `${(step.distanceMeters / 1000).toFixed(1)} km`
          : `${step.distanceMeters} m`;
    }

    const cleanStepNote = `${step.name} — ${step.targetDescription}`
      .replace(/[-•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const intervalsSyntaxLine = `- ${cleanStepNote} ${durationMinutes}m ${targetInfo.intervalsTarget}`;

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
  const watchSteps = buildWatchStepsForWorkout(workout, profile);

  const warmups = watchSteps.filter((s) => s.type === 'warmup');
  const mainAndDrills = watchSteps.filter(
    (s) => s.type === 'drill' || s.type === 'interval' || s.type === 'recovery'
  );
  const cooldowns = watchSteps.filter((s) => s.type === 'cooldown');

  const lines: string[] = [];
  lines.push(`${workout.description}`);
  if (workout.coachTips && workout.coachTips.length > 0) {
    lines.push(`Coach TriaTrain : ${workout.coachTips[0]}`);
  }
  lines.push('');

  if (warmups.length > 0) {
    lines.push('Warmup');
    warmups.forEach((s) => lines.push(s.intervalsSyntaxLine));
    lines.push('');
  }

  if (mainAndDrills.length > 0) {
    lines.push('Main Set');
    mainAndDrills.forEach((s) => lines.push(s.intervalsSyntaxLine));
    lines.push('');
  }

  if (cooldowns.length > 0) {
    lines.push('Cooldown');
    cooldowns.forEach((s) => lines.push(s.intervalsSyntaxLine));
  }

  return lines.join('\n').trim();
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

    const payload = validWorkouts.map((wo) => ({
      category: 'WORKOUT',
      start_date_local: `${wo.date}T08:00:00`,
      type: mapTriaTrainSportToIntervalsType(wo.sport),
      name: `[TriaTrain] ${wo.title}`,
      description: generateIntervalsStructuredWorkoutText(wo, profile),
      moving_time: wo.durationMinutes * 60,
      distance: wo.distanceMeters > 0 ? wo.distanceMeters : undefined,
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
  const profileVersion = 2132;
  totalBuffer[2] = profileVersion & 0xff;
  totalBuffer[3] = (profileVersion >> 8) & 0xff;
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

