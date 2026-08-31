import { AthleteProfile, RaceDistance } from '../types/triathlon';
import { parsePaceToSeconds } from './zonesCalculator';

export interface RacePrediction {
  sportType: 'triathlon' | 'run' | 'bike' | 'swim';
  distanceLabel: string;
  swimDistance?: string;
  bikeDistance?: string;
  runDistance?: string;
  swimTime?: string;
  t1Time?: string;
  bikeTime?: string;
  t2Time?: string;
  runTime?: string;
  avgPaceOrSpeed?: string;
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
  const efRunSec = parsePaceToSeconds(profile.runMetrics?.efPaceMinKm || '6:15');
  const marathonRunSec = parsePaceToSeconds(profile.runMetrics?.marathonPaceMinKm || '5:25');

  // 1. RUNNING ONLY PREDICTIONS
  if (distance === 'run_5k') {
    const paceSec = Math.round(threshRunSec * 0.95);
    const totMin = (5 * paceSec) / 60;
    return {
      sportType: 'run',
      distanceLabel: 'Course à pied 5 KM',
      runDistance: '5.0 km',
      runTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `${Math.floor(paceSec / 60)}:${(paceSec % 60) < 10 ? '0' : ''}${paceSec % 60}/km (${((5 / totMin) * 60).toFixed(1)} km/h)`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }
  if (distance === 'run_10k') {
    const paceSec = threshRunSec;
    const totMin = (10 * paceSec) / 60;
    return {
      sportType: 'run',
      distanceLabel: 'Course à pied 10 KM',
      runDistance: '10.0 km',
      runTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `${Math.floor(paceSec / 60)}:${(paceSec % 60) < 10 ? '0' : ''}${paceSec % 60}/km (${((10 / totMin) * 60).toFixed(1)} km/h)`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }
  if (distance === 'run_semi') {
    const paceSec = Math.round(threshRunSec * 1.05);
    const totMin = (21.1 * paceSec) / 60;
    return {
      sportType: 'run',
      distanceLabel: 'Semi-Marathon (21.1 KM)',
      runDistance: '21.1 km',
      runTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `${Math.floor(paceSec / 60)}:${(paceSec % 60) < 10 ? '0' : ''}${paceSec % 60}/km (${((21.1 / totMin) * 60).toFixed(1)} km/h)`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }
  if (distance === 'run_marathon') {
    const paceSec = marathonRunSec || Math.round(threshRunSec * 1.10);
    const totMin = (42.195 * paceSec) / 60;
    return {
      sportType: 'run',
      distanceLabel: 'Marathon Officiel (42.195 KM)',
      runDistance: '42.2 km',
      runTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `${Math.floor(paceSec / 60)}:${(paceSec % 60) < 10 ? '0' : ''}${paceSec % 60}/km (${((42.195 / totMin) * 60).toFixed(1)} km/h)`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }
  if (distance === 'run_trail') {
    const paceSec = Math.round(efRunSec * 1.15);
    const totMin = (30 * paceSec) / 60;
    return {
      sportType: 'run',
      distanceLabel: 'Trail Nature & Dénivelé (~30 KM)',
      runDistance: '30.0 km',
      runTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `${Math.floor(paceSec / 60)}:${(paceSec % 60) < 10 ? '0' : ''}${paceSec % 60}/km`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }

  // 2. CYCLING ONLY PREDICTIONS
  if (distance === 'bike_50k' || distance === 'bike_90k' || distance === 'bike_135k' || distance === 'bike_century' || distance === 'bike_200k') {
    let km = 135;
    let label = 'Cyclosportive 135 KM (ex: Défi Pierre Lavoie)';
    let speedFactor = 1.04; // Peloton and sustained effort
    if (distance === 'bike_50k') { km = 50; label = 'Sortie Cycliste 50 KM'; speedFactor = 1.08; }
    if (distance === 'bike_90k') { km = 90; label = 'Gran Fondo 90 KM'; speedFactor = 1.05; }
    if (distance === 'bike_135k') { km = 135; label = 'Défi 135 KM (ex: La Boucle Pierre Lavoie)'; speedFactor = 1.03; }
    if (distance === 'bike_century') { km = 160; label = 'Century Ride (160 KM / 100 Miles)'; speedFactor = 1.00; }
    if (distance === 'bike_200k') { km = 200; label = 'Ultra-Cyclisme / Brevet 200 KM'; speedFactor = 0.96; }

    const speed = avgBikeSpeed * speedFactor;
    const totMin = (km / speed) * 60;

    return {
      sportType: 'bike',
      distanceLabel: label,
      bikeDistance: `${km} km`,
      bikeTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `Moyenne estimée : ${speed.toFixed(1)} km/h`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }

  // 3. SWIMMING ONLY PREDICTIONS
  if (distance === 'swim_1500m' || distance === 'swim_3k' || distance === 'swim_5k') {
    let m = 1500;
    let label = 'Traversée Eau Libre 1 500 M';
    let paceFactor = 1.04;
    if (distance === 'swim_1500m') { m = 1500; label = 'Nage Eau Libre 1 500 M'; paceFactor = 1.04; }
    if (distance === 'swim_3k') { m = 3000; label = 'Défi Eau Libre 3 000 M (3 KM)'; paceFactor = 1.08; }
    if (distance === 'swim_5k') { m = 5000; label = 'Marathon de Nage 5 000 M (5 KM)'; paceFactor = 1.12; }

    const totMin = ((m / 100) * (cssSec * paceFactor)) / 60;
    const pace100 = Math.round(cssSec * paceFactor);

    return {
      sportType: 'swim',
      distanceLabel: label,
      swimDistance: `${m} m`,
      swimTime: formatTimeFromMinutes(totMin),
      avgPaceOrSpeed: `Allure : ${Math.floor(pace100 / 60)}:${(pace100 % 60) < 10 ? '0' : ''}${pace100 % 60}/100m`,
      totalTime: formatTimeFromMinutes(totMin),
      totalMinutes: totMin,
    };
  }

  // 4. TRIATHLON MULTI-SPORT PREDICTIONS
  let swimM = 1500;
  let bikeKm = 40;
  let runKm = 10;
  let distName = 'Distance M (Olympique)';
  let swimFatigue = 1.08;
  let bikeIntensity = 1.03;
  let runFatigue = 1.12;
  let t1Min = 3.5;
  let t2Min = 2.5;

  if (distance === 'xs') {
    swimM = 400; bikeKm = 10; runKm = 2.5; distName = 'Distance XS (Découverte)';
    swimFatigue = 1.02; bikeIntensity = 1.10; runFatigue = 1.04; t1Min = 2.0; t2Min = 1.5;
  } else if (distance === 's') {
    swimM = 750; bikeKm = 20; runKm = 5; distName = 'Distance S (Sprint)';
    swimFatigue = 1.04; bikeIntensity = 1.08; runFatigue = 1.07; t1Min = 2.5; t2Min = 2.0;
  } else if (distance === 'm') {
    swimM = 1500; bikeKm = 40; runKm = 10; distName = 'Distance M (Olympique / Courte Distance)';
    swimFatigue = 1.08; bikeIntensity = 1.03; runFatigue = 1.12; t1Min = 3.5; t2Min = 2.5;
  } else if (distance === 'l') {
    swimM = 1900; bikeKm = 90; runKm = 21.1; distName = 'Distance L (Half Ironman / 70.3)';
    swimFatigue = 1.14; bikeIntensity = 0.96; runFatigue = 1.22; t1Min = 4.5; t2Min = 3.0;
  } else if (distance === 'xl') {
    swimM = 3800; bikeKm = 180; runKm = 42.2; distName = 'Distance XL (Ironman / 140.6)';
    swimFatigue = 1.20; bikeIntensity = 0.88; runFatigue = 1.38; t1Min = 6.0; t2Min = 4.0;
  }

  const swimMinutes = ((swimM / 100) * (cssSec * swimFatigue)) / 60;
  const effectiveBikeSpeed = avgBikeSpeed * bikeIntensity;
  const bikeMinutes = (bikeKm / effectiveBikeSpeed) * 60;
  const runMinutes = (runKm * (threshRunSec * runFatigue)) / 60;
  const totalMinutes = swimMinutes + t1Min + bikeMinutes + t2Min + runMinutes;

  return {
    sportType: 'triathlon',
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
