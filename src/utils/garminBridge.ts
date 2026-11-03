import {
  AthleteProfile,
  GarminActivityMetrics,
  GarminBridgeConfig,
  SportType,
  TrainingWeek,
  Workout,
} from '../types/triathlon';

const STORAGE_KEY = 'triatrain_garmin_bridge_config';

export const DEFAULT_GARMIN_CONFIG: GarminBridgeConfig = {
  provider: 'intervals_icu',
  intervalsAthleteId: '0',
  intervalsApiKey: '',
  stravaAccessToken: '',
  stravaClientId: '',
  stravaClientSecret: '',
  stravaRefreshToken: '',
  autoMatchOnOpen: true,
};

export function loadGarminConfig(): GarminBridgeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GARMIN_CONFIG;
    return { ...DEFAULT_GARMIN_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GARMIN_CONFIG;
  }
}

export function saveGarminConfig(config: GarminBridgeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erreur sauvegarde configuration Garmin:', e);
  }
}

/**
 * Convertit le sport brut d'Intervals.icu ou Strava en SportType TriaTrain
 */
export function mapExternalSportToTriaTrain(rawType: string): SportType {
  const normalized = (rawType || '').toLowerCase();
  if (
    normalized.includes('swim') ||
    normalized.includes('natation') ||
    normalized.includes('lap_swimming') ||
    normalized.includes('open_water')
  ) {
    return 'swim';
  }
  if (
    normalized.includes('ride') ||
    normalized.includes('bike') ||
    normalized.includes('cycling') ||
    normalized.includes('velomobile') ||
    normalized.includes('ebikeride') ||
    normalized.includes('gravel') ||
    normalized.includes('virtualride')
  ) {
    return 'bike';
  }
  if (
    normalized.includes('run') ||
    normalized.includes('course') ||
    normalized.includes('trail') ||
    normalized.includes('treadmill') ||
    normalized.includes('track')
  ) {
    return 'run';
  }
  if (
    normalized.includes('weight') ||
    normalized.includes('strength') ||
    normalized.includes('workout') ||
    normalized.includes('crossfit') ||
    normalized.includes('yoga') ||
    normalized.includes('pilates') ||
    normalized.includes('hiit')
  ) {
    return 'strength';
  }
  if (normalized.includes('multi') || normalized.includes('triathlon') || normalized.includes('brick')) {
    return 'brick';
  }
  return 'run';
}

/**
 * Formate l'allure (min/km ou min/100m) ou la vitesse moyenne (km/h) selon le sport
 */
export function formatPaceOrSpeed(
  sport: SportType,
  distanceMeters: number,
  movingTimeSeconds: number
): string {
  if (!distanceMeters || distanceMeters <= 0 || !movingTimeSeconds || movingTimeSeconds <= 0) {
    return '—';
  }

  if (sport === 'swim') {
    const secPer100m = (movingTimeSeconds / distanceMeters) * 100;
    const mins = Math.floor(secPer100m / 60);
    const secs = Math.round(secPer100m % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs} /100m`;
  }

  if (sport === 'bike' || sport === 'brick') {
    const speedKmh = (distanceMeters / 1000) / (movingTimeSeconds / 3600);
    return `${speedKmh.toFixed(1)} km/h`;
  }

  if (sport === 'run') {
    const secPerKm = (movingTimeSeconds / distanceMeters) * 1000;
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
  }

  return `${Math.round(movingTimeSeconds / 60)} min`;
}

interface IntervalsRawActivity {
  id: string;
  start_date_local: string;
  type: string;
  name?: string;
  device_name?: string;
  moving_time?: number;
  elapsed_time?: number;
  distance?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  icu_average_watts?: number;
  icu_weighted_avg_watts?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
  calories?: number;
  icu_training_load?: number;
  icu_rpe?: number;
  feel?: number;
}

/**
 * Interroge l'API REST Intervals.icu (Pont Garmin Connect officiel sans serveur)
 */
export async function fetchIntervalsIcuActivities(
  config: GarminBridgeConfig,
  oldestDate: string,
  newestDate: string
): Promise<GarminActivityMetrics[]> {
  const apiKey = config.intervalsApiKey.trim();
  if (!apiKey) {
    throw new Error('Veuillez renseigner votre clé API Intervals.icu dans la configuration.');
  }

  const athleteId = config.intervalsAthleteId.trim() || '0';
  const authToken = btoa(`API_KEY:${apiKey}`);
  const url = `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
    athleteId
  )}/activities?oldest=${encodeURIComponent(oldestDate)}&newest=${encodeURIComponent(newestDate)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Authentification Intervals.icu refusée (401/403). Vérifiez votre ID Athlète (ou laissez "0") et votre Clé API personnelle.'
      );
    }
    throw new Error(`Erreur API Intervals.icu (HTTP ${response.status}).`);
  }

  const data: IntervalsRawActivity[] = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter((item) => Boolean(item && item.start_date_local))
    .map((item): GarminActivityMetrics => {
      const sport = mapExternalSportToTriaTrain(item.type);
      const movingTimeSeconds = Math.round(item.moving_time || item.elapsed_time || 0);
      const durationMinutes = Math.max(1, Math.round(movingTimeSeconds / 60));
      const distanceMeters = Math.round(item.distance || 0);
      const startDateLocal = item.start_date_local.split('T')[0];

      return {
        externalId: String(item.id),
        provider: 'intervals_icu',
        deviceName: item.device_name || 'Montre Garmin (via Intervals.icu)',
        activityName: item.name || `${item.type} Garmin`,
        startDateLocal,
        sport,
        rawSportType: item.type,
        durationMinutes,
        movingTimeSeconds,
        distanceMeters,
        avgHeartRate: item.average_heartrate ? Math.round(item.average_heartrate) : undefined,
        maxHeartRate: item.max_heartrate ? Math.round(item.max_heartrate) : undefined,
        avgWatts: item.icu_average_watts ? Math.round(item.icu_average_watts) : undefined,
        normalizedWatts: item.icu_weighted_avg_watts ? Math.round(item.icu_weighted_avg_watts) : undefined,
        avgCadence: item.average_cadence ? Math.round(item.average_cadence) : undefined,
        elevationGainMeters: item.total_elevation_gain ? Math.round(item.total_elevation_gain) : undefined,
        calories: item.calories ? Math.round(item.calories) : undefined,
        trainingLoadTss: item.icu_training_load ? Math.round(item.icu_training_load) : undefined,
        avgPaceOrSpeedFormatted: formatPaceOrSpeed(sport, distanceMeters, movingTimeSeconds),
        perceivedRpe: item.icu_rpe ? Math.min(10, Math.max(1, Math.round(item.icu_rpe))) : undefined,
        syncedAt: new Date().toISOString(),
      };
    });
}

interface StravaRawActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date_local: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  average_cadence?: number;
  total_elevation_gain?: number;
  kilojoules?: number;
  suffer_score?: number;
  device_name?: string;
}

/**
 * Rafraîchit automatiquement le token OAuth2 Strava si Client ID + Secret + Refresh Token sont fournis
 */
async function resolveStravaAccessToken(config: GarminBridgeConfig): Promise<string> {
  if (
    config.stravaClientId?.trim() &&
    config.stravaClientSecret?.trim() &&
    config.stravaRefreshToken?.trim()
  ) {
    const tokenResp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.stravaClientId.trim(),
        client_secret: config.stravaClientSecret.trim(),
        refresh_token: config.stravaRefreshToken.trim(),
        grant_type: 'refresh_token',
      }),
    });

    if (tokenResp.ok) {
      const tokenData = (await tokenResp.json()) as { access_token?: string; refresh_token?: string };
      if (tokenData.access_token) {
        saveGarminConfig({
          ...config,
          stravaAccessToken: tokenData.access_token,
          stravaRefreshToken: tokenData.refresh_token || config.stravaRefreshToken,
        });
        return tokenData.access_token;
      }
    }
  }

  if (config.stravaAccessToken.trim()) {
    return config.stravaAccessToken.trim();
  }

  throw new Error(
    'Veuillez renseigner un Access Token Strava ou le trio (Client ID, Client Secret, Refresh Token).'
  );
}

/**
 * Interroge l'API Strava v3 (Pont Garmin Connect -> Strava)
 */
export async function fetchStravaActivities(
  config: GarminBridgeConfig,
  oldestDate: string,
  newestDate: string
): Promise<GarminActivityMetrics[]> {
  const accessToken = await resolveStravaAccessToken(config);

  const afterEpoch = Math.floor(new Date(`${oldestDate}T00:00:00`).getTime() / 1000);
  const beforeEpoch = Math.floor(new Date(`${newestDate}T23:59:59`).getTime() / 1000) + 86400;

  const url = `https://www.strava.com/api/v3/athlete/activities?after=${afterEpoch}&before=${beforeEpoch}&per_page=50`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Jeton Strava expiré ou invalide (401). Vérifiez votre Access Token (avec scope activity:read_all) ou vos clés Refresh Token.'
      );
    }
    throw new Error(`Erreur API Strava (HTTP ${response.status}).`);
  }

  const data: StravaRawActivity[] = await response.json();
  if (!Array.isArray(data)) return [];

  return data.map((item): GarminActivityMetrics => {
    const rawSport = item.sport_type || item.type || 'Run';
    const sport = mapExternalSportToTriaTrain(rawSport);
    const movingTimeSeconds = Math.round(item.moving_time || item.elapsed_time || 0);
    const durationMinutes = Math.max(1, Math.round(movingTimeSeconds / 60));
    const distanceMeters = Math.round(item.distance || 0);
    const startDateLocal = (item.start_date_local || '').split('T')[0];

    return {
      externalId: `strava-${item.id}`,
      provider: 'strava',
      deviceName: item.device_name || 'Montre Garmin (via Strava)',
      activityName: item.name || `${rawSport} Garmin`,
      startDateLocal,
      sport,
      rawSportType: rawSport,
      durationMinutes,
      movingTimeSeconds,
      distanceMeters,
      avgHeartRate: item.average_heartrate ? Math.round(item.average_heartrate) : undefined,
      maxHeartRate: item.max_heartrate ? Math.round(item.max_heartrate) : undefined,
      avgWatts: item.average_watts ? Math.round(item.average_watts) : undefined,
      normalizedWatts: item.weighted_average_watts ? Math.round(item.weighted_average_watts) : undefined,
      avgCadence: item.average_cadence ? Math.round(item.average_cadence) : undefined,
      elevationGainMeters: item.total_elevation_gain ? Math.round(item.total_elevation_gain) : undefined,
      calories: item.kilojoules ? Math.round(item.kilojoules * 1.05) : undefined,
      trainingLoadTss: item.suffer_score ? Math.round(item.suffer_score) : undefined,
      avgPaceOrSpeedFormatted: formatPaceOrSpeed(sport, distanceMeters, movingTimeSeconds),
      syncedAt: new Date().toISOString(),
    };
  });
}

/**
 * Génère des sorties réalistes issues d'une montre Garmin Forerunner 965 pour la semaine en cours (Mode Démo)
 */
export function generateDemoGarminActivities(
  currentWeek: TrainingWeek,
  profile: AthleteProfile
): GarminActivityMetrics[] {
  const activeWorkouts = currentWeek.workouts.filter((w) => w.sport !== 'rest');

  return activeWorkouts.map((wo, idx): GarminActivityMetrics => {
    // Crée une légère variation réaliste (+2% à -3%) par rapport au plan
    const variationFactor = idx % 2 === 0 ? 1.03 : 0.98;
    const durationMinutes = Math.max(15, Math.round(wo.durationMinutes * variationFactor));
    const movingTimeSeconds = durationMinutes * 60 + (idx * 17) % 55;
    const distanceMeters =
      wo.distanceMeters > 0
        ? Math.round((wo.distanceMeters * variationFactor) / 10) * 10
        : wo.sport === 'strength'
        ? 0
        : durationMinutes * 180;

    // Calcul de FC réaliste selon la zone cible et le profil athlète
    const hrMax = profile.hrMax || 186;
    const zoneFactor =
      wo.targetZone === 'Z5'
        ? 0.91
        : wo.targetZone === 'Z4'
        ? 0.86
        : wo.targetZone === 'Z3'
        ? 0.80
        : wo.targetZone === 'Z2'
        ? 0.73
        : 0.65;

    const avgHeartRate = Math.round(hrMax * zoneFactor);
    const maxHeartRate = Math.min(hrMax, avgHeartRate + (wo.category === 'intervals' ? 18 : 11));

    const ftp = profile.bikeMetrics.ftpWatts || 215;
    const isBikeOrBrick = wo.sport === 'bike' || wo.sport === 'brick';
    const avgWatts = isBikeOrBrick ? Math.round(ftp * (zoneFactor - 0.04)) : undefined;
    const normalizedWatts = avgWatts ? Math.round(avgWatts * 1.06) : undefined;

    const elevationGainMeters =
      wo.sport === 'bike'
        ? Math.round((distanceMeters / 1000) * 11.5)
        : wo.sport === 'run'
        ? Math.round((distanceMeters / 1000) * 8.2)
        : wo.sport === 'brick'
        ? Math.round((distanceMeters / 1000) * 9.5)
        : undefined;

    const avgCadence =
      wo.sport === 'run'
        ? 174 + (idx % 6)
        : wo.sport === 'bike' || wo.sport === 'brick'
        ? 88 + (idx % 5)
        : wo.sport === 'swim'
        ? 31 + (idx % 4)
        : undefined;

    const trainingLoadTss = Math.round(
      (durationMinutes / 60) * (wo.intensityRpe * 10.5)
    );

    const calories = Math.round(durationMinutes * (wo.sport === 'bike' ? 10.5 : wo.sport === 'run' ? 12.2 : 9.4));

    const rawSportType =
      wo.sport === 'swim'
        ? 'LapSwimming'
        : wo.sport === 'bike'
        ? 'Ride'
        : wo.sport === 'run'
        ? 'Run'
        : wo.sport === 'brick'
        ? 'Multisport'
        : 'StrengthTraining';

    return {
      externalId: `garmin-demo-${wo.id}`,
      provider: 'demo',
      deviceName: 'Garmin Forerunner 965',
      activityName: `Garmin Connect • ${wo.title}`,
      startDateLocal: wo.date,
      sport: wo.sport,
      rawSportType,
      durationMinutes,
      movingTimeSeconds,
      distanceMeters,
      avgHeartRate,
      maxHeartRate,
      avgWatts,
      normalizedWatts,
      avgCadence,
      elevationGainMeters,
      calories,
      trainingLoadTss,
      avgPaceOrSpeedFormatted: formatPaceOrSpeed(wo.sport, distanceMeters, movingTimeSeconds),
      perceivedRpe: wo.intensityRpe,
      syncedAt: new Date().toISOString(),
    };
  });
}

export interface ActivityMatchSuggestion {
  activity: GarminActivityMetrics;
  matchedWorkoutId: string | null;
  matchConfidence: 'exact_date_and_sport' | 'same_week_sport' | 'date_only' | 'unmatched';
}

/**
 * Associe intelligemment chaque activité Garmin récupérée aux séances planifiées de la semaine
 */
export function matchActivitiesToWeekWorkouts(
  activities: GarminActivityMetrics[],
  weekWorkouts: Workout[]
): ActivityMatchSuggestion[] {
  const usedWorkoutIds = new Set<string>();
  const plannedNonRest = weekWorkouts.filter((w) => w.sport !== 'rest');

  return activities.map((activity): ActivityMatchSuggestion => {
    // 1. Priorité absolue : même date + même sport (ou brique)
    const exactMatch = plannedNonRest.find(
      (w) =>
        !usedWorkoutIds.has(w.id) &&
        w.date === activity.startDateLocal &&
        (w.sport === activity.sport || (w.sport === 'brick' && (activity.sport === 'bike' || activity.sport === 'run')))
    );

    if (exactMatch) {
      usedWorkoutIds.add(exactMatch.id);
      return {
        activity,
        matchedWorkoutId: exactMatch.id,
        matchConfidence: 'exact_date_and_sport',
      };
    }

    // 2. Même date (peu importe le sport)
    const dateMatch = plannedNonRest.find(
      (w) => !usedWorkoutIds.has(w.id) && w.date === activity.startDateLocal
    );
    if (dateMatch) {
      usedWorkoutIds.add(dateMatch.id);
      return {
        activity,
        matchedWorkoutId: dateMatch.id,
        matchConfidence: 'date_only',
      };
    }

    // 3. Même sport dans la même semaine (séance décalée d'un jour)
    const sportWeekMatch = plannedNonRest.find(
      (w) => !usedWorkoutIds.has(w.id) && w.sport === activity.sport
    );
    if (sportWeekMatch) {
      usedWorkoutIds.add(sportWeekMatch.id);
      return {
        activity,
        matchedWorkoutId: sportWeekMatch.id,
        matchConfidence: 'same_week_sport',
      };
    }

    return {
      activity,
      matchedWorkoutId: null,
      matchConfidence: 'unmatched',
    };
  });
}
