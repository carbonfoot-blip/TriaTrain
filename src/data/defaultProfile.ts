import { AthleteProfile } from '../types/triathlon';
import { getMondayOfWeek } from '../utils/planGenerator';

export const DEFAULT_ATHLETE_PROFILE: AthleteProfile = {
  id: 'athlete-1',
  name: 'Alexandre (Sportif Polyvalent)',
  gender: 'male',
  age: 32,
  weightKg: 74,
  heightCm: 178,
  hrRest: 54,
  hrMax: 186,
  targetSport: 'triathlon',
  experienceLevel: 'beginner',
  runMetrics: {
    efPaceMinKm: '6:15',
    thresholdPaceMinKm: '4:50',
    marathonPaceMinKm: '5:25',
    vmaPaceMinKm: '4:10',
    fiveKTimeMin: '23:45',
    tenKTimeMin: '49:30',
  },
  bikeMetrics: {
    ftpWatts: 215,
    avgZ2SpeedKmh: 27,
    hasPowerMeter: false,
  },
  swimMetrics: {
    cssPacePer100m: '2:00',
    fourHundredTimeMin: '8:10',
    canSwimCrawlContinuously: true,
    comfortLevel: 'beginner',
  },
  raceObjective: {
    sport: 'triathlon',
    distance: 'm',
    raceName: 'Triathlon International Olympique (Distance M)',
    startDate: getMondayOfWeek(),
    raceDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 weeks ahead
    goalType: 'finisher',
    targetTimeHours: '2h45',
  },
  availability: {
    availableDays: [2, 3, 4, 5, 6, 7], // Mardi à Dimanche
    maxWeeklyHours: 8,
    preferredLongRideDay: 6, // Samedi
    preferredLongRunDay: 7,  // Dimanche
    preferredRestDay: 1,     // Lundi
    weeklySchedule: [
      { dayOfWeek: 1, sport: 'rest', category: 'recovery' },
      { dayOfWeek: 2, sport: 'swim', category: 'technique' },
      { dayOfWeek: 3, sport: 'bike', category: 'intervals' },
      { dayOfWeek: 4, sport: 'run', category: 'intervals' },
      { dayOfWeek: 5, sport: 'swim', category: 'endurance' },
      { dayOfWeek: 6, sport: 'bike', category: 'endurance' },
      { dayOfWeek: 7, sport: 'run', category: 'endurance' },
    ],
  },
  equipment: {
    hasGpsWatch: true,
    hasSmartTrainer: true,
    hasHeartRateBelt: true,
    hasWetsuit: true,
    hasTrisuit: true,
  },
};
