export type SportType = 'swim' | 'bike' | 'run' | 'brick' | 'strength' | 'rest';

export type TargetSport = 'triathlon' | 'run' | 'bike' | 'swim';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type TriathlonDistance = 'xs' | 's' | 'm' | 'l' | 'xl';
export type RunDistance = 'run_5k' | 'run_10k' | 'run_semi' | 'run_marathon' | 'run_trail';
export type BikeDistance = 'bike_50k' | 'bike_90k' | 'bike_135k' | 'bike_century' | 'bike_200k';
export type SwimDistance = 'swim_1500m' | 'swim_3k' | 'swim_5k';

export type RaceDistance = TriathlonDistance | RunDistance | BikeDistance | SwimDistance;

export type RaceGoal = 'finisher' | 'time' | 'podium';

export type TrainingPhase = 'base' | 'build' | 'peak' | 'taper' | 'race_week';

export type WorkoutStatus = 'planned' | 'completed' | 'skipped' | 'partial';

export interface RunMetrics {
  efPaceMinKm: string;          // Ex: "6:15"
  thresholdPaceMinKm: string;   // Ex: "4:50"
  marathonPaceMinKm: string;    // Ex: "5:25"
  vmaPaceMinKm: string;         // Ex: "4:15"
  fiveKTimeMin?: string;        // Ex: "23:30"
  tenKTimeMin?: string;         // Ex: "49:00"
}

export interface BikeMetrics {
  ftpWatts: number;             // Ex: 210
  avgZ2SpeedKmh: number;        // Ex: 27.5
  hasPowerMeter: boolean;
}

export interface SwimMetrics {
  cssPacePer100m: string;       // Ex: "2:00"
  fourHundredTimeMin?: string;  // Ex: "8:00"
  canSwimCrawlContinuously: boolean;
  comfortLevel: 'beginner' | 'intermediate' | 'advanced';
}

export type WorkoutCategory = 'endurance' | 'intervals' | 'tempo' | 'threshold' | 'recovery' | 'technique' | 'brick' | 'strength' | 'rest';

export interface WeeklyDayPreference {
  dayOfWeek: number; // 1: Lundi ... 7: Dimanche
  sport: SportType;
  category?: WorkoutCategory;
  customTitle?: string;
}

export interface AthleteProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  weightKg: number;
  heightCm: number;
  hrRest: number;
  hrMax: number;
  targetSport: TargetSport;     // 'triathlon' | 'run' | 'bike' | 'swim'
  experienceLevel: ExperienceLevel;
  runMetrics: RunMetrics;
  bikeMetrics: BikeMetrics;
  swimMetrics: SwimMetrics;
  raceObjective: {
    sport: TargetSport;
    distance: RaceDistance;
    raceName: string;
    raceDate: string; // YYYY-MM-DD
    goalType: RaceGoal;
    targetTimeHours?: string;
  };
  availability: {
    availableDays: number[]; // 1: Lundi ... 7: Dimanche
    maxWeeklyHours: number;
    preferredLongRideDay: number;
    preferredLongRunDay: number;
    preferredRestDay: number;
    weeklySchedule?: WeeklyDayPreference[];
  };
  equipment: {
    hasGpsWatch: boolean;
    hasSmartTrainer: boolean;
    hasHeartRateBelt: boolean;
    hasWetsuit: boolean;
    hasTrisuit: boolean;
  };
}

export interface WorkoutStep {
  type: 'warmup' | 'drill' | 'interval' | 'recovery' | 'cooldown';
  name: string;
  durationMinutes?: number;
  distanceMeters?: number;
  targetZone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  targetDescription: string;
  repeats?: number;
  notes?: string;
}

export interface WatchStepPreview {
  stepNumber: number;
  type: WorkoutStep['type'];
  watchScreenTitle: string;      // Titre court optimisé écran Garmin/COROS (<= 28 car.)
  drillCue: string;              // Consigne précise de l'éducatif / exercice
  durationOrDistanceLabel: string; // Ex: "10:00", "4 × 1000m", "8 × 50m"
  repeats?: number;
  durationSeconds: number;
  distanceMeters?: number;
  targetZone: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';
  watchTargetRange: string;      // Ex: "4:45–4:55 /km" ou "195–215 W" ou "148–160 bpm"
  cadenceOrStrokeCue?: string;   // Ex: "Cadence 90-95 rpm" ou "Crawl rattrapé"
  intervalsSyntaxLine: string;   // Ligne correspondante pour Intervals.icu / Garmin / COROS
}

export interface GarminActivityMetrics {
  externalId: string;
  provider: 'intervals_icu' | 'strava' | 'demo';
  deviceName?: string;           // Ex: "Garmin Forerunner 965"
  activityName: string;
  startDateLocal: string;        // YYYY-MM-DD
  sport: SportType;
  rawSportType: string;          // Ex: "Run", "Ride", "Swim"
  durationMinutes: number;
  movingTimeSeconds: number;
  distanceMeters: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgWatts?: number;
  normalizedWatts?: number;
  avgCadence?: number;
  elevationGainMeters?: number;
  calories?: number;
  trainingLoadTss?: number;
  avgPaceOrSpeedFormatted: string; // Ex: "4:58 /km" ou "31.4 km/h" ou "1:52 /100m"
  perceivedRpe?: number;
  syncedAt: string;
}

export type GarminSyncProvider = 'intervals_icu' | 'strava' | 'demo';

export interface GarminBridgeConfig {
  provider: GarminSyncProvider;
  intervalsAthleteId: string;    // Ex: "i123456" ou "0"
  intervalsApiKey: string;       // Clé API personnelle Intervals.icu
  stravaAccessToken: string;     // Jeton d'accès Strava direct ou rafraîchi
  stravaClientId?: string;
  stravaClientSecret?: string;
  stravaRefreshToken?: string;
  autoMatchOnOpen?: boolean;
  lastSyncedAt?: string;
}

export interface Workout {
  id: string;
  weekNumber: number;
  dayOfWeek: number; // 1 (Mon) to 7 (Sun)
  date: string; // YYYY-MM-DD
  title: string;
  sport: SportType;
  category: 'endurance' | 'intervals' | 'tempo' | 'threshold' | 'recovery' | 'technique' | 'brick' | 'strength' | 'rest';
  phase: TrainingPhase;
  durationMinutes: number;
  distanceMeters: number;
  targetZone: string;
  intensityRpe: number; // 1-10 scale
  description: string;
  coachTips: string[];
  steps: WorkoutStep[];
  status: WorkoutStatus;
  completedRpe?: number;
  athleteNotes?: string;
  completedDurationMinutes?: number;
  completedDistanceMeters?: number;
  garminActivity?: GarminActivityMetrics;
  pushedToWatchAt?: string;
  externalEventId?: string;
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  phase: TrainingPhase;
  phaseTitle: string;
  phaseDescription: string;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  sportBreakdown: {
    swimMinutes: number;
    bikeMinutes: number;
    runMinutes: number;
    strengthMinutes: number;
  };
  workouts: Workout[];
  isRestWeek: boolean;
}

export interface TrainingPlan {
  id: string;
  athleteId: string;
  createdAt: string;
  targetSport: TargetSport;
  raceDistance: RaceDistance;
  raceDate: string;
  totalWeeks: number;
  weeks: TrainingWeek[];
}

export interface ZoneDetail {
  name: string;
  range: string;
  target: string;
  description: string;
  feel: string;
}

export interface DisciplineZones {
  run: {
    z1: ZoneDetail;
    z2: ZoneDetail;
    z3: ZoneDetail;
    z4: ZoneDetail;
    z5: ZoneDetail;
  };
  bike: {
    z1: ZoneDetail;
    z2: ZoneDetail;
    z3: ZoneDetail;
    z4: ZoneDetail;
    z5: ZoneDetail;
  };
  swim: {
    z1: ZoneDetail;
    z2: ZoneDetail;
    z3: ZoneDetail;
    z4: ZoneDetail;
  };
  heartRate: {
    z1: string;
    z2: string;
    z3: string;
    z4: string;
    z5: string;
  };
}
