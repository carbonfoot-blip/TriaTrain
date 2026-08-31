export type SportType = 'swim' | 'bike' | 'run' | 'brick' | 'strength' | 'rest';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type RaceDistance = 'xs' | 's' | 'm' | 'l' | 'xl';

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
  avgZ2SpeedKmh: number;        // Ex: 26.5
  hasPowerMeter: boolean;
}

export interface SwimMetrics {
  cssPacePer100m: string;       // Ex: "2:00"
  fourHundredTimeMin?: string;  // Ex: "8:00"
  canSwimCrawlContinuously: boolean;
  comfortLevel: 'beginner' | 'intermediate' | 'advanced';
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
  experienceLevel: ExperienceLevel;
  runMetrics: RunMetrics;
  bikeMetrics: BikeMetrics;
  swimMetrics: SwimMetrics;
  raceObjective: {
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
