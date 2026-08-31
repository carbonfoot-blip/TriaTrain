import { AthleteProfile, RaceDistance } from '../types/triathlon';
import { parsePaceToSeconds } from './zonesCalculator';

export interface RacePrediction {
  distanceLabel: string;
  swimDistance: string;
  bikeDistance: string;
  runDistance: string;
  swimTime: string;
  t1Time: string;
  bikeTime: string;
  t2Time: string;
  runTime: string;
  totalTime: string;
  totalMinutes: number;
}

export function formatTimeFromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h${minutes < 10 ? '0' : ''}${minutes}`;
}

export function predictRaceTimes(profile: AthleteProfile, targetDistance?: RaceDistance): RacePrediction {
  const distance = targetDistance || profile.raceObjective.distance || 'm';

  const cssSec = parsePaceToSeconds(profile.swimMetrics?.cssPacePer100m || '2:00');
  const avgBikeSpeed = profile.bikeMetrics?.avgZ2SpeedKmh || 26;
  const threshRunSec = parsePaceToSeconds(profile.runMetrics?.thresholdPaceMinKm || '4:50');

  let swimM = 1500;
  let bikeKm = 40;
  let runKm = 10;
  let distName = 'Distance M (Olympique)';
  let swimFatigue = 1.08;
  let bikeIntensity = 1.05; // slightly faster than Z2 flat
  let runFatigue = 1.12; // run off bike pace relative to dry threshold
  let t1Min = 3.5;
  let t2Min = 2.5;

  if (distance === 'xs') {
    swimM = 400;
    bikeKm = 10;
    runKm = 2.5;
    distName = 'Distance XS (Découverte)';
    swimFatigue = 1.02;
    bikeIntensity = 1.10;
    runFatigue = 1.04;
    t1Min = 2.0;
    t2Min = 1.5;
  } else if (distance === 's') {
    swimM = 750;
    bikeKm = 20;
    runKm = 5;
    distName = 'Distance S (Sprint)';
    swimFatigue = 1.04;
    bikeIntensity = 1.08;
    runFatigue = 1.07;
    t1Min = 2.5;
    t2Min = 2.0;
  } else if (distance === 'm') {
    swimM = 1500;
    bikeKm = 40;
    runKm = 10;
    distName = 'Distance M (Olympique / Courte Distance)';
    swimFatigue = 1.08;
    bikeIntensity = 1.03;
    runFatigue = 1.12;
    t1Min = 3.5;
    t2Min = 2.5;
  } else if (distance === 'l') {
    swimM = 1900;
    bikeKm = 90;
    runKm = 21.1;
    distName = 'Distance L (Half Ironman / 70.3)';
    swimFatigue = 1.14;
    bikeIntensity = 0.96;
    runFatigue = 1.22;
    t1Min = 4.5;
    t2Min = 3.0;
  } else if (distance === 'xl') {
    swimM = 3800;
    bikeKm = 180;
    runKm = 42.2;
    distName = 'Distance XL (Ironman / 140.6)';
    swimFatigue = 1.20;
    bikeIntensity = 0.88;
    runFatigue = 1.38;
    t1Min = 6.0;
    t2Min = 4.0;
  }

  // Calculate split durations in minutes
  const swimMinutes = ((swimM / 100) * (cssSec * swimFatigue)) / 60;
  const effectiveBikeSpeed = avgBikeSpeed * bikeIntensity;
  const bikeMinutes = (bikeKm / effectiveBikeSpeed) * 60;
  const runMinutes = (runKm * (threshRunSec * runFatigue)) / 60;
  const totalMinutes = swimMinutes + t1Min + bikeMinutes + t2Min + runMinutes;

  return {
    distanceLabel: distName,
    swimDistance: `${swimM >= 1000 ? (swimM / 1000).toFixed(1) + ' km' : swimM + ' m'}`,
    bikeDistance: `${bikeKm} km`,
    runDistance: `${runKm} km`,
    swimTime: formatTimeFromMinutes(swimMinutes),
    t1Time: `${Math.floor(t1Min)}m${Math.round((t1Min % 1) * 60) ? '30' : '00'}`,
    bikeTime: formatTimeFromMinutes(bikeMinutes),
    t2Time: `${Math.floor(t2Min)}m${Math.round((t2Min % 1) * 60) ? '30' : '00'}`,
    runTime: formatTimeFromMinutes(runMinutes),
    totalTime: formatTimeFromMinutes(totalMinutes),
    totalMinutes,
  };
}
