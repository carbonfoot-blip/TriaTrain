import { AthleteProfile, DisciplineZones } from '../types/triathlon';

// Helper: parse "mm:ss" or "m:ss" to total seconds
export function parsePaceToSeconds(paceStr: string): number {
  if (!paceStr) return 0;
  const clean = paceStr.trim().replace(',', '.');
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const min = parseInt(parts[0], 10) || 0;
    const sec = parseInt(parts[1], 10) || 0;
    return min * 60 + sec;
  }
  const floatVal = parseFloat(clean);
  if (!isNaN(floatVal)) {
    const min = Math.floor(floatVal);
    const sec = Math.round((floatVal - min) * 60);
    return min * 60 + sec;
  }
  return 0;
}

// Helper: format total seconds to "mm:ss"
export function formatSecondsToPace(totalSec: number): string {
  if (isNaN(totalSec) || totalSec <= 0) return '0:00';
  const min = Math.floor(totalSec / 60);
  const sec = Math.round(totalSec % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// Auto-estimate Max HR if not provided (Tanaka formula)
export function estimateMaxHR(age: number): number {
  return Math.round(208 - 0.7 * age);
}

// Extrapolate running paces from a single known value (e.g., 10k time or 5k time or threshold)
export function extrapolateRunPaces(referenceTime: string, referenceType: '5k' | '10k' | 'threshold' | 'ef'): {
  efPace: string;
  thresholdPace: string;
  marathonPace: string;
  vmaPace: string;
} {
  const refSec = parsePaceToSeconds(referenceTime);
  let thresholdSec = 290; // Default 4:50/km

  if (referenceType === '5k') {
    // 5k pace is roughly 95% of threshold time (i.e. faster)
    const fiveKPaceSec = refSec / 5;
    thresholdSec = Math.round(fiveKPaceSec * 1.05);
  } else if (referenceType === '10k') {
    // 10k pace is close to threshold (approx 102% of pure 60min threshold)
    thresholdSec = Math.round(refSec / 10);
  } else if (referenceType === 'threshold') {
    thresholdSec = refSec;
  } else if (referenceType === 'ef') {
    // EF is approx 120% of threshold
    thresholdSec = Math.round(refSec / 1.20);
  }

  const efSec = Math.round(thresholdSec * 1.22);
  const marathonSec = Math.round(thresholdSec * 1.09);
  const vmaSec = Math.round(thresholdSec * 0.90);

  return {
    efPace: formatSecondsToPace(efSec),
    thresholdPace: formatSecondsToPace(thresholdSec),
    marathonPace: formatSecondsToPace(marathonSec),
    vmaPace: formatSecondsToPace(vmaSec),
  };
}

// Calculate comprehensive zones for an athlete
export function calculateAllZones(profile: AthleteProfile): DisciplineZones {
  const hrRest = profile.hrRest || 55;
  const hrMax = profile.hrMax || estimateMaxHR(profile.age || 30);
  const hrr = hrMax - hrRest; // Heart Rate Reserve (Karvonen)

  const calcKarvonen = (pctLow: number, pctHigh: number) => {
    const low = Math.round(hrRest + hrr * pctLow);
    const high = Math.round(hrRest + hrr * pctHigh);
    return `${low} - ${high} bpm`;
  };

  // 1. Heart Rate Zones
  const heartRate = {
    z1: calcKarvonen(0.50, 0.60),
    z2: calcKarvonen(0.60, 0.70),
    z3: calcKarvonen(0.70, 0.80),
    z4: calcKarvonen(0.80, 0.90),
    z5: calcKarvonen(0.90, 1.00),
  };

  // 2. Running Zones (calculated around threshold)
  const threshSec = parsePaceToSeconds(profile.runMetrics?.thresholdPaceMinKm || '4:50');
  const run = {
    z1: {
      name: 'Z1 - Récupération Active',
      range: `> ${formatSecondsToPace(Math.round(threshSec * 1.28))}/km`,
      target: formatSecondsToPace(Math.round(threshSec * 1.30)) + '/km',
      description: 'Jogging très souple, élimination des toxines et régénération musculaire.',
      feel: 'Effort 2-3/10. Conversation fluide et continue sans essoufflement.',
    },
    z2: {
      name: 'Z2 - Endurance Fondamentale (EF)',
      range: `${formatSecondsToPace(Math.round(threshSec * 1.26))} - ${formatSecondsToPace(Math.round(threshSec * 1.15))}/km`,
      target: (profile.runMetrics?.efPaceMinKm || formatSecondsToPace(Math.round(threshSec * 1.20))) + '/km',
      description: 'Zone reine du triathlon (80% du volume). Développe le réseau capillaire et l\'utilisation des lipides.',
      feel: 'Effort 4-5/10. Aisance respiratoire totale, capable de parler par phrases complètes.',
    },
    z3: {
      name: 'Z3 - Tempo / Allure Marathon',
      range: `${formatSecondsToPace(Math.round(threshSec * 1.14))} - ${formatSecondsToPace(Math.round(threshSec * 1.05))}/km`,
      target: (profile.runMetrics?.marathonPaceMinKm || formatSecondsToPace(Math.round(threshSec * 1.09))) + '/km',
      description: 'Endurance active. Allure de course pour les triathlons 70.3 / Half et Marathon sec.',
      feel: 'Effort 6-7/10. Rythme soutenu, phrases courtes possibles, concentration requise.',
    },
    z4: {
      name: 'Z4 - Seuil Lactique',
      range: `${formatSecondsToPace(Math.round(threshSec * 1.04))} - ${formatSecondsToPace(Math.round(threshSec * 0.98))}/km`,
      target: (profile.runMetrics?.thresholdPaceMinKm || formatSecondsToPace(threshSec)) + '/km',
      description: 'Zone de tenue au seuil anaérobie. Idéale pour le 10km sec et la course du Triathlon M (Olympique).',
      feel: 'Effort 8/10. Respiration profonde, brûlure musculaire contrôlée, 1 ou 2 mots seulement.',
    },
    z5: {
      name: 'Z5 - VMA / VO2 Max',
      range: `< ${formatSecondsToPace(Math.round(threshSec * 0.97))}/km`,
      target: (profile.runMetrics?.vmaPaceMinKm || formatSecondsToPace(Math.round(threshSec * 0.90))) + '/km',
      description: 'Intervalles courts (30/30, 200m-400m). Boost de la cylindrée cardiaque et du coût énergétique.',
      feel: 'Effort 9-10/10. Effort quasi maximal, essoufflement total, impossible de parler.',
    },
  };

  // 3. Cycling Power Zones (Coggan % of FTP)
  const ftp = profile.bikeMetrics?.ftpWatts || 200;
  const avgSpeed = profile.bikeMetrics?.avgZ2SpeedKmh || 26;

  const bike = {
    z1: {
      name: 'Z1 - Récupération Active',
      range: `< ${Math.round(ftp * 0.55)} W`,
      target: `${Math.round(ftp * 0.50)} W (${Math.round(avgSpeed * 0.75)} km/h)`,
      description: 'Moulinage souple (cadence 90-95 rpm), décontraction des jambes.',
      feel: 'Effort 2-3/10. Pédalage sans aucune résistance sensible.',
    },
    z2: {
      name: 'Z2 - Endurance Aérobie',
      range: `${Math.round(ftp * 0.56)} - ${Math.round(ftp * 0.75)} W`,
      target: `${Math.round(ftp * 0.68)} W (${avgSpeed} km/h)`,
      description: 'Base de toutes les sorties longues vélo. Économie d\'énergie et combustion des graisses.',
      feel: 'Effort 4-5/10. Pédalage régulier, capable de discuter avec un partenaire.',
    },
    z3: {
      name: 'Z3 - Tempo / SweetSpot',
      range: `${Math.round(ftp * 0.76)} - ${Math.round(ftp * 0.90)} W`,
      target: `${Math.round(ftp * 0.85)} W (${Math.round(avgSpeed * 1.15)} km/h)`,
      description: 'Allure spécifique vélo 70.3 et Ironman. Gain maximal de forme sans épuiser le glycogène.',
      feel: 'Effort 6-7/10. Puissance nette sur les pédales, nécessite de boire et manger régulièrement.',
    },
    z4: {
      name: 'Z4 - Seuil FTP',
      range: `${Math.round(ftp * 0.91)} - ${Math.round(ftp * 1.05)} W`,
      target: `${ftp} W (${Math.round(avgSpeed * 1.30)} km/h)`,
      description: 'Puissance maximale tenable 1 heure. Idéal pour la bosse clé ou le contre-la-montre Sprint/M.',
      feel: 'Effort 8/10. Effort dur et constant, jambes lourdes, concentration totale.',
    },
    z5: {
      name: 'Z5 - PMA / VO2 Max',
      range: `${Math.round(ftp * 1.06)} - ${Math.round(ftp * 1.20)} W`,
      target: `${Math.round(ftp * 1.15)} W`,
      description: 'Intervalles de 1 à 4 minutes. Augmente la puissance aérobie maximale.',
      feel: 'Effort 9-10/10. Fréquence cardiaque au sommet, ventilation maximale.',
    },
  };

  // 4. Swim Zones (based on CSS - Critical Swim Speed per 100m)
  const cssSec = parsePaceToSeconds(profile.swimMetrics?.cssPacePer100m || '2:00');
  const swim = {
    z1: {
      name: 'Z1 - Technique & Échauffement',
      range: `${formatSecondsToPace(cssSec + 15)} - ${formatSecondsToPace(cssSec + 25)} / 100m`,
      target: `${formatSecondsToPace(cssSec + 20)} / 100m`,
      description: 'Éducatifs (rattrapé, doigts qui traînent, godille), amplitude et glisse.',
      feel: 'Effort 3/10. Focus exclusif sur la position du corps, l\'alignement et la respiration.',
    },
    z2: {
      name: 'Z2 - Endurance Aérobie',
      range: `${formatSecondsToPace(cssSec + 6)} - ${formatSecondsToPace(cssSec + 14)} / 100m`,
      target: `${formatSecondsToPace(cssSec + 10)} / 100m`,
      description: 'Séries longues (ex: 400m à 1000m continu). Développe l\'endurance spécifique nage.',
      feel: 'Effort 5-6/10. Nage fluide et régulière, respiration en 3 temps sans essoufflement aigu.',
    },
    z3: {
      name: 'Z3 - Seuil CSS (Allure Course Triathlon)',
      range: `${formatSecondsToPace(cssSec - 2)} - ${formatSecondsToPace(cssSec + 5)} / 100m`,
      target: `${formatSecondsToPace(cssSec)} / 100m`,
      description: 'Allure spécifique de compétition (Sprint, M ou première partie de 70.3).',
      feel: 'Effort 7-8/10. Rythme de bras soutenu, bonne prise d\'eau (catch), effort consistant.',
    },
    z4: {
      name: 'Z4 - Vitesse & Sprint',
      range: `< ${formatSecondsToPace(cssSec - 4)} / 100m`,
      target: `${formatSecondsToPace(cssSec - 8)} / 100m`,
      description: 'Séries courtes (25m - 50m max) avec récupération complète. Travail de puissance de bras.',
      feel: 'Effort 9-10/10. Fréquence de bras rapide, battements de jambes intenses.',
    },
  };

  return { run, bike, swim, heartRate };
}
