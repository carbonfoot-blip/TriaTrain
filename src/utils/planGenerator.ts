import { AthleteProfile, TrainingPlan, TrainingWeek, Workout, TrainingPhase, SportType, WorkoutStep, TargetSport } from '../types/triathlon';
import { calculateAllZones, parsePaceToSeconds, formatSecondsToPace } from './zonesCalculator';

// Helper: add days to a date string YYYY-MM-DD (UTC-safe noon anchor)
export function addDays(dateStr: string, days: number): string {
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const d = new Date(`${clean}T12:00:00`);
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Retourne le Lundi (YYYY-MM-DD) de la semaine correspondant à la date fournie (ou de la semaine courante par défaut)
 */
export function getMondayOfWeek(dateInput?: string | Date): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
    d.setHours(12, 0, 0, 0);
  } else if (typeof dateInput === 'string') {
    const clean = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
    d = new Date(`${clean}T12:00:00`);
    if (isNaN(d.getTime())) {
      d = new Date();
      d.setHours(12, 0, 0, 0);
    }
  } else {
    d = new Date(dateInput);
    d.setHours(12, 0, 0, 0);
  }

  const day = d.getDay(); // 0 = Dimanche, 1 = Lundi ... 6 = Samedi
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Raccourcis pratiques pour choisir la date de début de la Semaine 1 (passé, présent ou futur)
 */
export function getStartDatePresets(): {
  id: string;
  label: string;
  sublabel: string;
  date: string;
}[] {
  const thisMonday = getMondayOfWeek();
  return [
    {
      id: 'two_weeks_ago',
      label: '⏪ Il y a 2 semaines',
      sublabel: addDays(thisMonday, -14),
      date: addDays(thisMonday, -14),
    },
    {
      id: 'last_week',
      label: '⏪ La semaine passée',
      sublabel: addDays(thisMonday, -7),
      date: addDays(thisMonday, -7),
    },
    {
      id: 'this_week',
      label: '📍 Cette semaine (Lundi)',
      sublabel: thisMonday,
      date: thisMonday,
    },
    {
      id: 'next_week',
      label: '⏩ Lundi prochain',
      sublabel: addDays(thisMonday, 7),
      date: addDays(thisMonday, 7),
    },
  ];
}

export function calculateWeeksBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(`${startDateStr.split('T')[0]}T12:00:00`);
  const end = new Date(`${endDateStr.split('T')[0]}T12:00:00`);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.max(4, Math.min(24, Math.round(diffDays / 7)));
  return weeks;
}

/**
 * Décale toutes les dates d'un plan existant (Semaine 1..N et chaque séance) vers une nouvelle date de début
 * SANS écraser les séances modifiées ni les activités Garmin déjà synchronisées.
 */
export function shiftTrainingPlanStartDate(
  plan: TrainingPlan,
  newStartDateStr: string
): TrainingPlan {
  const alignedStart = getMondayOfWeek(newStartDateStr);

  const updatedWeeks: TrainingWeek[] = plan.weeks.map((week, idx) => {
    const wStart = addDays(alignedStart, idx * 7);
    const wEnd = addDays(wStart, 6);

    const updatedWorkouts = week.workouts.map((wo) => ({
      ...wo,
      date: addDays(wStart, (wo.dayOfWeek || 1) - 1),
    }));

    return {
      ...week,
      startDate: wStart,
      endDate: wEnd,
      workouts: updatedWorkouts,
    };
  });

  return {
    ...plan,
    startDate: alignedStart,
    weeks: updatedWeeks,
  };
}

/**
 * Trouve l'index de la semaine qui correspond à la date d'aujourd'hui (ou 0 par défaut)
 */
export function findActiveWeekIndexForToday(plan: TrainingPlan): number {
  const todayMonday = getMondayOfWeek();
  const idx = plan.weeks.findIndex((w) => w.startDate === todayMonday);
  return idx >= 0 ? idx : 0;
}

export function generateTrainingPlan(profile: AthleteProfile): TrainingPlan {
  const startDate = profile.raceObjective.startDate
    ? getMondayOfWeek(profile.raceObjective.startDate)
    : getMondayOfWeek();
  const targetSport: TargetSport = profile.targetSport || profile.raceObjective.sport || 'triathlon';
  
  // Calculate total weeks
  let totalWeeks = 12;
  if (profile.raceObjective.raceDate) {
    totalWeeks = calculateWeeksBetween(startDate, profile.raceObjective.raceDate);
  } else {
    const dist = profile.raceObjective.distance;
    if (dist === 'xs' || dist === 'run_5k' || dist === 'bike_50k') totalWeeks = 6;
    else if (dist === 's' || dist === 'run_10k' || dist === 'bike_90k') totalWeeks = 8;
    else if (dist === 'm' || dist === 'run_semi' || dist === 'bike_135k') totalWeeks = 12;
    else if (dist === 'l' || dist === 'run_marathon' || dist === 'bike_century') totalWeeks = 16;
    else if (dist === 'xl' || dist === 'run_trail' || dist === 'bike_200k') totalWeeks = 20;
  }

  const weeks: TrainingWeek[] = [];
  const threshPace = profile.runMetrics.thresholdPaceMinKm || '4:50';
  const efPace = profile.runMetrics.efPaceMinKm || '6:15';
  const marathonPace = profile.runMetrics.marathonPaceMinKm || '5:25';
  const vmaPace = profile.runMetrics.vmaPaceMinKm || '4:15';
  const ftp = profile.bikeMetrics.ftpWatts || 200;
  const avgBikeSpeed = profile.bikeMetrics.avgZ2SpeedKmh || 26;
  const css = profile.swimMetrics.cssPacePer100m || '2:00';

  const longRideDay = profile.availability.preferredLongRideDay || 6;
  const longRunDay = profile.availability.preferredLongRunDay || 7;
  const restDay = profile.availability.preferredRestDay || 1;
  const availableDays = profile.availability.availableDays.length > 0 ? profile.availability.availableDays : [2, 3, 4, 5, 6, 7];

  for (let w = 1; w <= totalWeeks; w++) {
    const weekStart = addDays(startDate, (w - 1) * 7);
    const weekEnd = addDays(weekStart, 6);

    let phase: TrainingPhase = 'base';
    let phaseTitle = 'Phase 1 : Fondation & Endurance Aérobie';
    let phaseDesc = 'Construction du socle aérobie (Z2) et renforcement musculaire préventif.';
    const isRestWeek = (w % 4 === 0) && (w < totalWeeks - 1);

    if (w === totalWeeks) {
      phase = 'race_week';
      phaseTitle = 'Semaine de Course / Objectif Jour J';
      phaseDesc = 'Activation courte, vérification du matériel, plein de glycogène et compétition !';
    } else if (w >= totalWeeks - 2) {
      phase = 'taper';
      phaseTitle = 'Phase 4 : Affûtage (Taper)';
      phaseDesc = 'Baisse du volume de 40%, maintien des intensités clés et recharge maximale en fraîcheur.';
    } else if (w > Math.floor(totalWeeks * 0.65)) {
      phase = 'peak';
      phaseTitle = 'Phase 3 : Spécifique & Allures Cibles';
      phaseDesc = 'Répétitions aux allures de course et simulation du ravitaillement.';
    } else if (w > Math.floor(totalWeeks * 0.35)) {
      phase = 'build';
      phaseTitle = 'Phase 2 : Développement & Seuil Lactique';
      phaseDesc = 'Intervalles au seuil (Z4) et séances de puissance spécifique.';
    }

    if (isRestWeek) {
      phaseTitle = `Semaine d'Assimilation & Régénération (S${w})`;
      phaseDesc = 'Volume allégé de 30% pour permettre la surcompensation musculaire et éviter le surentraînement.';
    }

    const workouts: Workout[] = [];
    const progressMultiplier = (1 + (w - 1) * 0.04) * (isRestWeek ? 0.7 : 1.0);

    // ROUTING ACCORDING TO TARGET SPORT:
    if (targetSport === 'run') {
      // 🏃 100% RUNNING PROGRAM (Marathon, Semi, 10k, 5k)
      // Day 1: Lundi (Repos ou PPG douce)
      if (availableDays.includes(1) && restDay !== 1) {
        workouts.push(createStrengthWorkout(w, 1, addDays(weekStart, 0), phase));
      } else {
        workouts.push(createRestWorkout(w, 1, addDays(weekStart, 0)));
      }

      // Day 2: Mardi (Footing EF + Lignes droites)
      if (availableDays.includes(2)) {
        workouts.push(createRunEasyWorkout(w, 2, addDays(weekStart, 1), phase, efPace, progressMultiplier, isRestWeek));
      }

      // Day 3: Mercredi (Séance Intervalles VMA ou Côtes)
      if (availableDays.includes(3)) {
        workouts.push(createRunVmaWorkout(w, 3, addDays(weekStart, 2), phase, vmaPace, efPace, progressMultiplier, isRestWeek));
      }

      // Day 4: Jeudi (Repos ou Footing Récupération)
      if (availableDays.includes(4)) {
        workouts.push(createRunRecoveryWorkout(w, 4, addDays(weekStart, 3), phase, efPace));
      }

      // Day 5: Vendredi (Séance Seuil / Allure Spécifique Marathon/Semi/10k)
      if (availableDays.includes(5)) {
        workouts.push(createRunSpecificWorkout(w, 5, addDays(weekStart, 4), phase, profile.raceObjective.distance, threshPace, marathonPace, efPace, progressMultiplier, isRestWeek));
      }

      // Day 6: Samedi (PPG Renforcement Gainage ou Récup)
      if (availableDays.includes(6)) {
        workouts.push(createStrengthWorkout(w, 6, addDays(weekStart, 5), phase));
      }

      // Day 7: Dimanche (Sortie Longue Course progressive ou Jour J)
      if (availableDays.includes(7)) {
        if (w === totalWeeks) {
          workouts.push(createSingleRaceDayWorkout(w, 7, addDays(weekStart, 6), profile));
        } else {
          workouts.push(createRunLongProgressiveWorkout(w, 7, addDays(weekStart, 6), phase, profile.raceObjective.distance, efPace, marathonPace, progressMultiplier, isRestWeek));
        }
      }
    } else if (targetSport === 'bike') {
      // 🚴 100% CYCLING PROGRAM (135km Défi Pierre Lavoie, Gran Fondo 90k, Century 160k)
      // Day 1: Lundi (Repos)
      if (availableDays.includes(1) && restDay !== 1) {
        workouts.push(createStrengthWorkout(w, 1, addDays(weekStart, 0), phase));
      } else {
        workouts.push(createRestWorkout(w, 1, addDays(weekStart, 0)));
      }

      // Day 2: Mardi (Vélo Récup / Cadence 95-100 rpm)
      if (availableDays.includes(2)) {
        workouts.push(createBikeCadenceWorkout(w, 2, addDays(weekStart, 1), phase, ftp, avgBikeSpeed, isRestWeek));
      }

      // Day 3: Mercredi (Vélo Intervalles Seuil / Bosses / SweetSpot)
      if (availableDays.includes(3)) {
        workouts.push(createBikeIntervalWorkout(w, 3, addDays(weekStart, 2), phase, ftp, avgBikeSpeed, progressMultiplier, isRestWeek));
      }

      // Day 4: Jeudi (Repos ou PPG Core Gainage)
      if (availableDays.includes(4)) {
        workouts.push(createStrengthWorkout(w, 4, addDays(weekStart, 3), phase));
      }

      // Day 5: Vendredi (Vélo Tempo / Relais Peloton)
      if (availableDays.includes(5)) {
        workouts.push(createBikeTempoWorkout(w, 5, addDays(weekStart, 4), phase, ftp, avgBikeSpeed, progressMultiplier, isRestWeek));
      }

      // Day 6: Samedi (Grande Sortie Longue Cycliste - ex: 80km à 135km)
      if (availableDays.includes(6)) {
        if (w === totalWeeks) {
          workouts.push(createSingleRaceDayWorkout(w, 6, addDays(weekStart, 5), profile));
        } else {
          workouts.push(createBikeLongDistanceWorkout(w, 6, addDays(weekStart, 5), phase, profile.raceObjective.distance, ftp, avgBikeSpeed, progressMultiplier, isRestWeek));
        }
      }

      // Day 7: Dimanche (Décrassage souple ou Repos)
      if (availableDays.includes(7)) {
        workouts.push(createBikeRecoveryWorkout(w, 7, addDays(weekStart, 6), phase, ftp, avgBikeSpeed));
      }
    } else if (targetSport === 'swim') {
      // 🏊 100% SWIMMING PROGRAM (1500m, 3k, 5k Eau Libre)
      if (availableDays.includes(1) && restDay !== 1) workouts.push(createStrengthWorkout(w, 1, addDays(weekStart, 0), phase));
      else workouts.push(createRestWorkout(w, 1, addDays(weekStart, 0)));

      if (availableDays.includes(2)) workouts.push(createSwimWorkout(w, 2, addDays(weekStart, 1), phase, css, progressMultiplier, isRestWeek));
      if (availableDays.includes(3)) workouts.push(createSwimAerobicWorkout(w, 3, addDays(weekStart, 2), phase, css, progressMultiplier, isRestWeek));
      if (availableDays.includes(5)) workouts.push(createSwimWorkout(w, 5, addDays(weekStart, 4), phase, css, progressMultiplier, isRestWeek));
      if (availableDays.includes(6)) workouts.push(createSwimAerobicWorkout(w, 6, addDays(weekStart, 5), phase, css, progressMultiplier * 1.2, isRestWeek));
      if (availableDays.includes(7)) {
        if (w === totalWeeks) workouts.push(createSingleRaceDayWorkout(w, 7, addDays(weekStart, 6), profile));
        else workouts.push(createRestWorkout(w, 7, addDays(weekStart, 6)));
      }
    } else {
      // 🏊🚴🏃 MULTI-SPORT TRIATHLON PROGRAM
      const distFactor = profile.raceObjective.distance === 'xs' ? 0.6 : profile.raceObjective.distance === 's' ? 0.8 : profile.raceObjective.distance === 'm' ? 1.0 : profile.raceObjective.distance === 'l' ? 1.4 : 1.8;
      const triMult = progressMultiplier * distFactor;

      const userSchedule = profile.availability.weeklySchedule;
      const hasCustomSchedule = userSchedule && userSchedule.length > 0;

      if (hasCustomSchedule) {
        // Generate workouts following the athlete's exact day-by-day preferences
        for (let d = 1; d <= 7; d++) {
          const dayDate = addDays(weekStart, d - 1);
          const pref = userSchedule.find((s) => s.dayOfWeek === d);

          if (!pref || pref.sport === 'rest' || (!availableDays.includes(d) && restDay === d)) {
            workouts.push(createRestWorkout(w, d, dayDate));
            continue;
          }

          // Race week Day J
          if (w === totalWeeks && (d === 7 || d === 6)) {
            workouts.push(createRaceDayWorkout(w, d, dayDate, profile));
            continue;
          }

          switch (pref.sport) {
            case 'swim':
              if (pref.category === 'endurance') {
                workouts.push(createSwimAerobicWorkout(w, d, dayDate, phase, css, triMult, isRestWeek));
              } else if (pref.category === 'recovery') {
                workouts.push(createRecoveryWorkout(w, d, dayDate, phase, css));
              } else {
                workouts.push(createSwimWorkout(w, d, dayDate, phase, css, triMult, isRestWeek));
              }
              break;

            case 'bike':
              if (pref.category === 'intervals' || pref.category === 'threshold') {
                workouts.push(createBikeIntervalWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, triMult, isRestWeek));
              } else if (pref.category === 'tempo') {
                workouts.push(createBikeTempoWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, triMult, isRestWeek));
              } else if (pref.category === 'recovery') {
                workouts.push(createBikeRecoveryWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed));
              } else if (pref.category === 'technique') {
                workouts.push(createBikeCadenceWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, isRestWeek));
              } else {
                // Endurance / default
                if (d === longRideDay || d === 6 || d === 7) {
                  workouts.push(createLongBikeWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, triMult, isRestWeek));
                } else {
                  workouts.push(createBikeCadenceWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, isRestWeek));
                }
              }
              break;

            case 'run':
              if (pref.category === 'intervals') {
                // Alternance VMA et Seuil
                if (w % 2 === 1) {
                  workouts.push(createRunVmaWorkout(w, d, dayDate, phase, vmaPace, efPace, triMult, isRestWeek));
                } else {
                  workouts.push(createRunIntervalWorkout(w, d, dayDate, phase, threshPace, vmaPace, efPace, triMult, isRestWeek));
                }
              } else if (pref.category === 'threshold') {
                workouts.push(createRunIntervalWorkout(w, d, dayDate, phase, threshPace, vmaPace, efPace, triMult, isRestWeek));
              } else if (pref.category === 'recovery') {
                workouts.push(createRunRecoveryWorkout(w, d, dayDate, phase, efPace));
              } else if (pref.category === 'endurance') {
                if (d === longRunDay || d === 7 || d === 6) {
                  workouts.push(createLongRunWorkout(w, d, dayDate, phase, efPace, marathonPace, triMult, isRestWeek));
                } else {
                  workouts.push(createRunEasyWorkout(w, d, dayDate, phase, efPace, triMult, isRestWeek));
                }
              } else {
                workouts.push(createRunEasyWorkout(w, d, dayDate, phase, efPace, triMult, isRestWeek));
              }
              break;

            case 'brick':
              workouts.push(createBrickWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, marathonPace, efPace, triMult, isRestWeek));
              break;

            case 'strength':
              workouts.push(createStrengthWorkout(w, d, dayDate, phase));
              break;

            default:
              workouts.push(createRestWorkout(w, d, dayDate));
          }
        }
      } else {
        if (availableDays.includes(1) && restDay !== 1) workouts.push(createRecoveryWorkout(w, 1, addDays(weekStart, 0), phase, css));
        else workouts.push(createRestWorkout(w, 1, addDays(weekStart, 0)));

        if (availableDays.includes(2)) workouts.push(createSwimWorkout(w, 2, addDays(weekStart, 1), phase, css, triMult, isRestWeek));
        if (availableDays.includes(3)) workouts.push(createBikeIntervalWorkout(w, 3, addDays(weekStart, 2), phase, ftp, avgBikeSpeed, triMult, isRestWeek));
        if (availableDays.includes(4)) workouts.push(createRunIntervalWorkout(w, 4, addDays(weekStart, 3), phase, threshPace, vmaPace, efPace, triMult, isRestWeek));
        if (availableDays.includes(5)) workouts.push(createSwimAerobicWorkout(w, 5, addDays(weekStart, 4), phase, css, triMult, isRestWeek));

        if (availableDays.includes(6)) {
          if (longRideDay === 6) {
            if (phase === 'build' || phase === 'peak') {
              workouts.push(createBrickWorkout(w, 6, addDays(weekStart, 5), phase, ftp, avgBikeSpeed, marathonPace, efPace, triMult, isRestWeek));
            } else {
              workouts.push(createLongBikeWorkout(w, 6, addDays(weekStart, 5), phase, ftp, avgBikeSpeed, triMult, isRestWeek));
            }
          } else {
            workouts.push(createLongRunWorkout(w, 6, addDays(weekStart, 5), phase, efPace, marathonPace, triMult, isRestWeek));
          }
        }

        if (availableDays.includes(7)) {
          if (w === totalWeeks) {
            workouts.push(createRaceDayWorkout(w, 7, addDays(weekStart, 6), profile));
          } else if (longRunDay === 7) {
            workouts.push(createLongRunWorkout(w, 7, addDays(weekStart, 6), phase, efPace, marathonPace, triMult, isRestWeek));
          } else {
            workouts.push(createLongBikeWorkout(w, 7, addDays(weekStart, 6), phase, ftp, avgBikeSpeed, triMult, isRestWeek));
          }
        }
      }
    }

    // Ajout du 2e entraînement quotidien (Doublé : ex. Poids + Course, Vélo + Nage) si configuré dans la semaine type
    const customScheduleForDoubles = profile.availability.weeklySchedule;
    if (customScheduleForDoubles && customScheduleForDoubles.length > 0) {
      for (let d = 1; d <= 7; d++) {
        const pref = customScheduleForDoubles.find((s) => s.dayOfWeek === d);
        if (
          pref &&
          pref.secondarySport &&
          pref.secondarySport !== 'rest' &&
          availableDays.includes(d) &&
          !(w === totalWeeks && (d === 6 || d === 7))
        ) {
          const dayDate = addDays(weekStart, d - 1);
          const restIdx = workouts.findIndex((wo) => wo.dayOfWeek === d && wo.sport === 'rest');
          if (restIdx !== -1) {
            workouts.splice(restIdx, 1);
          }
          let secWo: Workout | null = null;
          if (pref.secondarySport === 'strength') {
            secWo = createStrengthWorkout(w, d, dayDate, phase);
            secWo.title = 'Poids & PPG : Renforcement Musculaire & Gainage';
          } else if (pref.secondarySport === 'run') {
            secWo = createRunEasyWorkout(w, d, dayDate, phase, efPace, progressMultiplier * 0.85, isRestWeek);
          } else if (pref.secondarySport === 'bike') {
            secWo = createBikeCadenceWorkout(w, d, dayDate, phase, ftp, avgBikeSpeed, isRestWeek);
          } else if (pref.secondarySport === 'swim') {
            secWo = createSwimAerobicWorkout(w, d, dayDate, phase, css, progressMultiplier * 0.85, isRestWeek);
          }
          if (secWo) {
            secWo.id = `${secWo.id}-sec-${d}`;
            workouts.push(secWo);
          }
        }
      }
    }

    // Weekly metrics computation
    let totalDur = 0;
    let totalDist = 0;
    let swimMin = 0;
    let bikeMin = 0;
    let runMin = 0;
    let strengthMin = 0;

    workouts.forEach((wo) => {
      totalDur += wo.durationMinutes;
      totalDist += wo.distanceMeters / 1000;
      if (wo.sport === 'swim') swimMin += wo.durationMinutes;
      else if (wo.sport === 'bike') bikeMin += wo.durationMinutes;
      else if (wo.sport === 'run') runMin += wo.durationMinutes;
      else if (wo.sport === 'brick') {
        bikeMin += Math.round(wo.durationMinutes * 0.75);
        runMin += Math.round(wo.durationMinutes * 0.25);
      } else if (wo.sport === 'strength') strengthMin += wo.durationMinutes;
    });

    weeks.push({
      weekNumber: w,
      startDate: weekStart,
      endDate: weekEnd,
      phase,
      phaseTitle,
      phaseDescription: phaseDesc,
      totalDurationMinutes: totalDur,
      totalDistanceKm: Math.round(totalDist * 10) / 10,
      sportBreakdown: {
        swimMinutes: swimMin,
        bikeMinutes: bikeMin,
        runMinutes: runMin,
        strengthMinutes: strengthMin,
      },
      workouts,
      isRestWeek,
    });
  }

  return {
    id: `plan-${Date.now()}`,
    athleteId: profile.id,
    createdAt: new Date().toISOString(),
    targetSport,
    raceDistance: profile.raceObjective.distance,
    startDate,
    raceDate: profile.raceObjective.raceDate || addDays(startDate, totalWeeks * 7),
    totalWeeks,
    weeks,
  };
}

// Single-sport workout creators

function createStrengthWorkout(week: number, day: number, date: string, phase: TrainingPhase): Workout {
  return {
    id: `w${week}-d${day}-str`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'PPG : Renforcement Musculaire & Gainage Préventif',
    sport: 'strength',
    category: 'strength',
    phase,
    durationMinutes: 30,
    distanceMeters: 0,
    targetZone: 'Z2',
    intensityRpe: 5,
    description: 'Renforcement du tronc, gainage abdominal, fentes, squat unilatéral et fessiers pour prévenir les blessures.',
    coachTips: [
      'Focus sur la qualité du mouvement plutôt que sur la vitesse d\'exécution.',
      'Le gainage renforce la stabilité du bassin à chaque foulée et sur la selle.',
    ],
    steps: [
      { type: 'warmup', name: 'Mobilisations articulaires chevilles/hanches', durationMinutes: 5, targetZone: 'Z1', targetDescription: 'Rotations douces' },
      { type: 'drill', name: 'Circuit Gainage (Planche ventrale, latérale, pont fessier)', durationMinutes: 15, targetZone: 'Z2', targetDescription: '4 x 45s effort / 15s récup' },
      { type: 'interval', name: 'Fentes marchées & Squats bulgares', durationMinutes: 10, targetZone: 'Z2', targetDescription: '3 séries de 10 reps par jambe' },
    ],
    status: 'planned',
  };
}

function createRunEasyWorkout(week: number, day: number, date: string, phase: TrainingPhase, efPace: string, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 35 : Math.round(45 * mult);
  const distKm = Math.round((dur / 60) * 9.5 * 10) / 10;
  return {
    id: `w${week}-d${day}-runeasy`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Footing Endurance Fondamentale (${dur} min) + Lignes Droites`,
    sport: 'run',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(distKm * 1000),
    targetZone: 'Z2',
    intensityRpe: 4,
    description: `Course en totale aisance respiratoire (${efPace}/km). Finir avec 4 accélérations progressives sur 80m.`,
    coachTips: [
      'Vous devez pouvoir réciter une phrase complète sans reprendre votre souffle.',
      'Les lignes droites de fin dynamisent la foulée sans créer de fatigue lactique.',
    ],
    steps: [
      { type: 'warmup', name: 'Footing très cool', durationMinutes: 10, targetZone: 'Z1', targetDescription: `Allure lente` },
      { type: 'interval', name: 'Footing en Endurance Fondamentale (EF)', durationMinutes: dur - 15, targetZone: 'Z2', targetDescription: `Allure cible : ${efPace}/km` },
      { type: 'drill', name: '4 x 80m lignes droites progressives', durationMinutes: 5, targetZone: 'Z4', targetDescription: 'Foulée ample et relâchée' },
    ],
    status: 'planned',
  };
}

function createRunVmaWorkout(week: number, day: number, date: string, phase: TrainingPhase, vmaPace: string, efPace: string, mult: number, isRest: boolean): Workout {
  const reps = isRest ? 6 : Math.min(12, Math.max(6, Math.round(8 * mult)));
  const dur = Math.round(40 + reps * 1.5);
  return {
    id: `w${week}-d${day}-runvma`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Séance VMA : ${reps} x (30s Vite / 30s Trot) ou Intervalles Courts`,
    sport: 'run',
    category: 'intervals',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round((dur * 0.18) * 1000),
    targetZone: 'Z5',
    intensityRpe: 8,
    description: `Développement de la PMA / VMA. Fractions courtes et intenses à allure ${vmaPace}/km avec récupération active.`,
    coachTips: [
      'Ne sprintez pas sur les 3 premières répétitions : la dernière doit être aussi rapide que la première.',
      'Posez le médio-pied sous le centre de gravité.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 15, targetZone: 'Z2', targetDescription: `Footing ${efPace}/km` },
      { type: 'drill', name: 'Éducatifs (talons-fesses, griffés)', durationMinutes: 5, targetZone: 'Z3', targetDescription: 'Dynamisme du pied' },
      { type: 'interval', name: `${reps} x (30s Vite @ VMA / 30s Récup trot)`, durationMinutes: reps, targetZone: 'Z5', targetDescription: `Allure cible : ${vmaPace}/km` },
      { type: 'cooldown', name: 'Retour au calme lent', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Jogging très relax' },
    ],
    status: 'planned',
  };
}

function createRunRecoveryWorkout(week: number, day: number, date: string, phase: TrainingPhase, efPace: string): Workout {
  return {
    id: `w${week}-d${day}-runrec`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Footing Récupération Active (30 min)',
    sport: 'run',
    category: 'recovery',
    phase,
    durationMinutes: 30,
    distanceMeters: 4500,
    targetZone: 'Z1',
    intensityRpe: 3,
    description: 'Jogging ultra-doux pour drainer les toxines et stimuler la circulation.',
    coachTips: ['Privilégiez les sentiers souples ou l\'herbe plutôt que le bitume dur.'],
    steps: [
      { type: 'interval', name: 'Footing régénérant Z1', durationMinutes: 30, targetZone: 'Z1', targetDescription: `${efPace} + 20s/km` },
    ],
    status: 'planned',
  };
}

function createRunSpecificWorkout(week: number, day: number, date: string, phase: TrainingPhase, distance: string, threshPace: string, marathonPace: string, efPace: string, mult: number, isRest: boolean): Workout {
  const isMarathon = distance === 'run_marathon';
  const isSemi = distance === 'run_semi';
  const targetPace = isMarathon ? marathonPace : threshPace;
  const reps = isRest ? 3 : Math.min(5, Math.max(3, Math.round(3 * mult)));
  const dur = Math.round(50 + reps * 5);

  return {
    id: `w${week}-d${day}-runspec`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: isMarathon ? `Allure Spécifique Marathon : ${reps} x 2000m @ ${marathonPace}/km` : `Séance Seuil Spécifique : ${reps} x 1500m @ ${threshPace}/km`,
    sport: 'run',
    category: 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round((dur * 0.19) * 1000),
    targetZone: isMarathon ? 'Z3' : 'Z4',
    intensityRpe: 7,
    description: `Travail d'assimilation de l'allure de course cible (${targetPace}/km). Maintien d'une cadence élevée et d'une régularité absolue.`,
    coachTips: [
      'Vérifiez vos chronos tous les 500m pour caler votre allure au millimètre.',
      'Simulez la prise d\'un gel énergétique pendant la récupération entre les séries.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement 20 min', durationMinutes: 20, targetZone: 'Z2', targetDescription: `Footing ${efPace}/km` },
      { type: 'interval', name: `Blocs Allure Cible : ${reps} x ${isMarathon ? '2000m' : '1500m'}`, durationMinutes: reps * 8, targetZone: isMarathon ? 'Z3' : 'Z4', targetDescription: `Allure : ${targetPace}/km (R=2' trot)` },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Jogging très souple' },
    ],
    status: 'planned',
  };
}

function createRunLongProgressiveWorkout(week: number, day: number, date: string, phase: TrainingPhase, distance: string, efPace: string, marathonPace: string, mult: number, isRest: boolean): Workout {
  let baseDur = 70;
  if (distance === 'run_marathon') baseDur = 100;
  if (distance === 'run_semi') baseDur = 80;
  if (distance === 'run_5k' || distance === 'run_10k') baseDur = 55;

  const dur = isRest ? Math.round(baseDur * 0.7) : Math.min(140, Math.round(baseDur * mult));
  const distKm = Math.round((dur / 60) * 10 * 10) / 10;

  return {
    id: `w${week}-d${day}-runlong`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Sortie Longue Course (${Math.floor(dur / 60)}h${dur % 60 ? dur % 60 : '00'}) - Progression Z2 ➔ Z3`,
    sport: 'run',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(distKm * 1000),
    targetZone: 'Z2',
    intensityRpe: 6,
    description: `Séance majeure d'endurance fondamentale (${efPace}/km). Les 20 dernières minutes sont courues à allure marathon (${marathonPace}/km).`,
    coachTips: [
      'Emportez 500ml d\'eau avec électrolytes et testez 1 ou 2 gels pour habituer votre estomac.',
      'Ne partez surtout pas trop vite : la première moitié doit vous sembler facile.',
    ],
    steps: [
      { type: 'warmup', name: 'Mise en route 15 min', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Footing très relax' },
      { type: 'interval', name: 'Endurance Fondamentale (EF)', durationMinutes: dur - 35, targetZone: 'Z2', targetDescription: `Allure : ${efPace}/km` },
      { type: 'interval', name: 'Bloc Allure Spécifique (Fin de sortie)', durationMinutes: 20, targetZone: 'Z3', targetDescription: `Allure soutenue : ${marathonPace}/km` },
    ],
    status: 'planned',
  };
}

// Cycling specific workouts

function createBikeCadenceWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, isRest: boolean): Workout {
  const dur = isRest ? 45 : 60;
  return {
    id: `w${week}-d${day}-bikecad`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Vélo : Vélocité & Technique de Pédalage (Cadence 95-105 rpm)',
    sport: 'bike',
    category: 'technique',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(dur * (avgSpeed / 60) * 1000),
    targetZone: 'Z2',
    intensityRpe: 4,
    description: 'Travail de souplesse et de fluidité du coup de pédale (tirer et pousser). Économise les réserves musculaires sur les longues distances.',
    coachTips: ['Ne balancez pas le haut du buste : stabilité maximale du bassin sur la selle.'],
    steps: [
      { type: 'warmup', name: 'Échauffement 15 min', durationMinutes: 15, targetZone: 'Z1', targetDescription: '85 rpm souple' },
      { type: 'interval', name: 'Blocs vélocité 100 rpm', durationMinutes: 35, targetZone: 'Z2', targetDescription: `${Math.round(ftp * 0.65)}W en cadence haute` },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Moulinage sans résistance' },
    ],
    status: 'planned',
  };
}

function createBikeTempoWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 50 : Math.round(75 * mult);
  const z3Watts = Math.round(ftp * 0.82);
  return {
    id: `w${week}-d${day}-biketempo`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Vélo : Rythme Peloton & SweetSpot (3 x 12 min @ ${z3Watts}W)`,
    sport: 'bike',
    category: 'tempo',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(dur * (avgSpeed / 60) * 1.1 * 1000),
    targetZone: 'Z3',
    intensityRpe: 7,
    description: `Simulation de rythme de peloton cyclosportif (ex: Défi Pierre Lavoie). Répétitions soutenues en Zone 3 avec 3 min de récupération.`,
    coachTips: ['Alimentez-vous régulièrement : 1 gorgée de boisson énergétique toutes les 10 minutes.'],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Montée progressive' },
      { type: 'interval', name: `3 x 12 min @ Rythme Peloton (${z3Watts}W)`, durationMinutes: 45, targetZone: 'Z3', targetDescription: `R=3' Z1` },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Moulinage souple' },
    ],
    status: 'planned',
  };
}

function createBikeLongDistanceWorkout(week: number, day: number, date: string, phase: TrainingPhase, distance: string, ftp: number, avgSpeed: number, mult: number, isRest: boolean): Workout {
  let baseDur = 180; // 3h = ~80km
  if (distance === 'bike_135k') baseDur = 240; // 4h = ~110km build
  if (distance === 'bike_century') baseDur = 270; // 4h30
  if (distance === 'bike_200k') baseDur = 330; // 5h30
  if (distance === 'bike_50k') baseDur = 110;

  const dur = isRest ? Math.round(baseDur * 0.7) : Math.min(360, Math.round(baseDur * mult));
  const distKm = Math.round((dur / 60) * avgSpeed);
  const z2Watts = Math.round(ftp * 0.68);

  return {
    id: `w${week}-d${day}-bikelong`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Sortie Longue Cyclisme (${distKm} km / ${Math.floor(dur / 60)}h${dur % 60 ? dur % 60 : '00'}) - Endurance Z2`,
    sport: 'bike',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: distKm * 1000,
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `Séance fondatrice pour valider la distance cible (ex: Défi Pierre Lavoie 135 km). Gestion méticuleuse du braquet dans les côtes et de la stratégie nutritionnelle.`,
    coachTips: [
      'Ravitaillement : buvez 1 bidon de 500-750ml par heure avec des électrolytes et consommez 45 à 60g de glucides par heure.',
      'Gardez du braquet en réserve dans les montées pour ne pas saturer vos cuisses.',
    ],
    steps: [
      { type: 'warmup', name: 'Départ tranquille 20 min', durationMinutes: 20, targetZone: 'Z1', targetDescription: 'Mise en route' },
      { type: 'interval', name: `Endurance Fondamentale Z2 (${z2Watts}W)`, durationMinutes: dur - 35, targetZone: 'Z2', targetDescription: `Cadence 85-90 rpm` },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Moulinage' },
    ],
    status: 'planned',
  };
}

function createBikeRecoveryWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number): Workout {
  return {
    id: `w${week}-d${day}-bikerec`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Vélo : Décrassage & Récupération Active (45 min)',
    sport: 'bike',
    category: 'recovery',
    phase,
    durationMinutes: 45,
    distanceMeters: Math.round(45 * (avgSpeed / 60) * 0.8 * 1000),
    targetZone: 'Z1',
    intensityRpe: 2,
    description: 'Pédalage sur le tout petit plateau sans aucune tension musculaire pour évacuer les toxines de la sortie du samedi.',
    coachTips: ['Pédalez à 95 rpm en souplesse totale.'],
    steps: [
      { type: 'interval', name: 'Décrassage Z1', durationMinutes: 45, targetZone: 'Z1', targetDescription: `< ${Math.round(ftp * 0.55)}W` },
    ],
    status: 'planned',
  };
}

function createSingleRaceDayWorkout(week: number, day: number, date: string, profile: AthleteProfile): Workout {
  const sport = profile.targetSport;
  const raceName = profile.raceObjective.raceName || (sport === 'run' ? 'Marathon / Course Cible' : sport === 'bike' ? 'Défi Cycliste 135 km' : 'Épreuve Eau Libre');
  const sportType: SportType = sport === 'run' ? 'run' : sport === 'bike' ? 'bike' : sport === 'swim' ? 'swim' : 'brick';

  return {
    id: `w${week}-d${day}-raceday`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `JOUR J : ${raceName.toUpperCase()} 🏆`,
    sport: sportType,
    category: 'tempo',
    phase: 'race_week',
    durationMinutes: 180,
    distanceMeters: sport === 'run' ? 42195 : sport === 'bike' ? 135000 : 3000,
    targetZone: 'Z4',
    intensityRpe: 9,
    description: `C'est le grand jour ! Toute la préparation et les kilomètres accumulés s'expriment aujourd'hui. Respectez votre plan de course, gérez vos ravitaillements et franchissez la ligne d'arrivée avec fierté !`,
    coachTips: [
      'Démarrez avec retenue sur le premier tiers de l\'épreuve.',
      'Alimentez-vous et hydratez-vous dès le début sans attendre la sensation de soif ou de faim.',
    ],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Réveil articulaire' },
      { type: 'interval', name: `Compétition : ${raceName}`, durationMinutes: 150, targetZone: 'Z4', targetDescription: 'Allure spécifique maîtrisée' },
      { type: 'cooldown', name: 'Célébration & Récupération', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Hydratation et étirements très doux' },
    ],
    status: 'planned',
  };
}

// Triathlon workout creators (previously created)

function createRestWorkout(week: number, day: number, date: string): Workout {
  return {
    id: `w${week}-d${day}-rest`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Repos complet & Régénération',
    sport: 'rest',
    category: 'recovery',
    phase: 'base',
    durationMinutes: 0,
    distanceMeters: 0,
    targetZone: 'Z0',
    intensityRpe: 1,
    description: 'Journée de repos sans entraînement. Sommeil réparateur, hydratation et régénération cellulaire.',
    coachTips: [
      'Le repos fait partie intégrante de l\'entraînement : c\'est pendant le repos que la surcompensation s\'opère.',
    ],
    steps: [],
    status: 'planned',
  };
}

function createRecoveryWorkout(week: number, day: number, date: string, phase: TrainingPhase, css: string): Workout {
  return {
    id: `w${week}-d${day}-rec`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Natation Récupération & Mobilité scapulaire',
    sport: 'swim',
    category: 'recovery',
    phase,
    durationMinutes: 35,
    distanceMeters: 1200,
    targetZone: 'Z1',
    intensityRpe: 3,
    description: 'Séance très souple axée sur l\'alignement corporel, la décompression vertébrale et la glisse.',
    coachTips: ['Aucun chrono à regarder : cherchez simplement la sensation de glisse.'],
    steps: [
      { type: 'warmup', name: 'Échauffement 4 nages souple', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Allure très cool' },
      { type: 'drill', name: 'Éducatifs (rattrapé + godille)', distanceMeters: 400, targetZone: 'Z1', targetDescription: 'Appuis paumes de main' },
      { type: 'recovery', name: 'Crawl avec pull-buoy', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Glisse' },
      { type: 'cooldown', name: 'Dos relax', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Décontraction' },
    ],
    status: 'planned',
  };
}

function createSwimWorkout(week: number, day: number, date: string, phase: TrainingPhase, css: string, mult: number, isRest: boolean): Workout {
  const reps = isRest ? 6 : Math.min(12, Math.max(6, Math.round(8 * mult)));
  const dist = isRest ? 1600 : Math.round(2000 * mult);
  const dur = Math.round(dist / 40);
  return {
    id: `w${week}-d${day}-swim`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: phase === 'base' ? 'Natation : Technique & Aisance Respiratoire' : 'Natation : Séries Seuil CSS & Allure Course',
    sport: 'swim',
    category: phase === 'base' ? 'technique' : 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: dist,
    targetZone: phase === 'base' ? 'Z2' : 'Z3',
    intensityRpe: phase === 'base' ? 6 : 7,
    description: `Séance ciblée sur l'allure spécifique. Prise d'eau (catch) et maintien de l'allure CSS (${css}/100m).`,
    coachTips: ['Gardez la tête alignée avec la colonne vertébrale : regardez le fond du bassin à 45°.'],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', distanceMeters: 400, targetZone: 'Z1', targetDescription: '200m crawl + 100m dos + 100m brasse' },
      { type: 'interval', name: `Série clé : ${reps} x 100m Crawl @ CSS`, distanceMeters: reps * 100, targetZone: 'Z3', targetDescription: `Allure cible : ${css}/100m (R=15s)` },
      { type: 'recovery', name: 'Retour au calme souple', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Dos cool' },
    ],
    status: 'planned',
  };
}

function createBikeIntervalWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 45 : Math.round(60 * mult);
  const distKm = Math.round(dur * (avgSpeed / 60) * 1.05);
  const z4Watts = Math.round(ftp * 0.95);
  const sweetSpotWatts = Math.round(ftp * 0.88);
  return {
    id: `w${week}-d${day}-bike`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: phase === 'base' ? 'Vélo : Vélocité (Cadence 95-100 rpm)' : phase === 'build' ? 'Vélo : Intervalles SweetSpot & Force' : 'Vélo : Simulation Puissance Spécifique',
    sport: 'bike',
    category: phase === 'base' ? 'endurance' : 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: distKm * 1000,
    targetZone: phase === 'base' ? 'Z2' : 'Z4',
    intensityRpe: phase === 'base' ? 6 : 8,
    description: `Développement de l'efficacité de pédalage et tenue de puissance (${sweetSpotWatts}W à ${z4Watts}W).`,
    coachTips: ['Conservez un haut du corps détendu : ne serrez pas excessivement le guidon.'],
    steps: [
      { type: 'warmup', name: 'Échauffement progressif', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Montée en puissance' },
      { type: 'interval', name: `4 x 6 min @ SweetSpot (${sweetSpotWatts}W)`, durationMinutes: 30, targetZone: 'Z4', targetDescription: `Tenue constante R=2' Z1` },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Pédalage souple' },
    ],
    status: 'planned',
  };
}

function createRunIntervalWorkout(week: number, day: number, date: string, phase: TrainingPhase, threshPace: string, vmaPace: string, efPace: string, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 40 : Math.round(50 * mult);
  const reps = isRest ? 3 : Math.min(6, Math.max(3, Math.round(4 * mult)));
  const distKm = Math.round(dur * 0.18 * 10) / 10;
  return {
    id: `w${week}-d${day}-run`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Course : Répétitions au Seuil (${reps} x 1000m @ ${threshPace}/km)`,
    sport: 'run',
    category: 'threshold',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(distKm * 1000),
    targetZone: 'Z4',
    intensityRpe: 8,
    description: `Travail d'économie de course et repousse du seuil de fatigue. Cible : ${threshPace}/km.`,
    coachTips: ['Cadence cible : ~175 à 180 pas par minute.'],
    steps: [
      { type: 'warmup', name: 'Footing échauffement 15 min', durationMinutes: 15, targetZone: 'Z2', targetDescription: `${efPace}/km` },
      { type: 'interval', name: `${reps} x 1000m @ Seuil (${threshPace}/km)`, durationMinutes: reps * 5, targetZone: 'Z4', targetDescription: 'Régularité métronome R=1\'45' },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Jogging très lent' },
    ],
    status: 'planned',
  };
}

function createSwimAerobicWorkout(week: number, day: number, date: string, phase: TrainingPhase, css: string, mult: number, isRest: boolean): Workout {
  const dist = isRest ? 1400 : Math.round(1800 * mult);
  const dur = Math.round(dist / 40);
  return {
    id: `w${week}-d${day}-swimaero`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: 'Natation : Endurance Aérobie & Pull-Buoy / Plaquettes',
    sport: 'swim',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: dist,
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `Volume aérobie continu (${css} + 10s / 100m).`,
    coachTips: ['Concentrez-vous sur l\'expiration complète sous l\'eau.'],
    steps: [
      { type: 'warmup', name: 'Échauffement 300m', distanceMeters: 300, targetZone: 'Z1', targetDescription: 'Nage libre' },
      { type: 'interval', name: '3 x 400m Crawl régulier', distanceMeters: 1200, targetZone: 'Z2', targetDescription: 'Allure Z2 stable R=30s' },
      { type: 'cooldown', name: 'Retour au calme', distanceMeters: 200, targetZone: 'Z1', targetDescription: 'Dos souple' },
    ],
    status: 'planned',
  };
}

function createLongBikeWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 75 : Math.round(120 * mult);
  const distKm = Math.round((dur / 60) * avgSpeed);
  const z2Watts = Math.round(ftp * 0.68);
  return {
    id: `w${week}-d${day}-longbike`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Sortie Longue Vélo (${Math.floor(dur / 60)}h${dur % 60 ? dur % 60 : '00'}) - Endurance Z2`,
    sport: 'bike',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: distKm * 1000,
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `Tenue constante en Zone 2 (${z2Watts}W / ~${avgSpeed} km/h).`,
    coachTips: ['Mangez toutes les 45 minutes et buvez 1 bidon par heure.'],
    steps: [
      { type: 'warmup', name: 'Mise en route 20 min', durationMinutes: 20, targetZone: 'Z1', targetDescription: 'Moulinage' },
      { type: 'interval', name: `Bloc Endurance Z2 (${z2Watts}W)`, durationMinutes: dur - 35, targetZone: 'Z2', targetDescription: 'Cadence 85-90 rpm' },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Petit plateau' },
    ],
    status: 'planned',
  };
}

function createBrickWorkout(week: number, day: number, date: string, phase: TrainingPhase, ftp: number, avgSpeed: number, marathonPace: string, efPace: string, mult: number, isRest: boolean): Workout {
  const bikeMin = isRest ? 60 : Math.round(90 * mult);
  const runMin = isRest ? 15 : Math.min(30, Math.round(20 * mult));
  const totalDur = bikeMin + runMin;
  const bikeDistKm = Math.round((bikeMin / 60) * avgSpeed);
  const runDistKm = Math.round(runMin * 0.17 * 10) / 10;
  const totalDistKm = bikeDistKm + runDistKm;
  return {
    id: `w${week}-d${day}-brick`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Séance Brique : Vélo (${Math.floor(bikeMin / 60)}h${bikeMin % 60 ? bikeMin % 60 : '00'}) + Transition Course (${runMin} min)`,
    sport: 'brick',
    category: 'brick',
    phase,
    durationMinutes: totalDur,
    distanceMeters: Math.round(totalDistKm * 1000),
    targetZone: 'Z3',
    intensityRpe: 7,
    description: `Enchaînement direct vélo vers course à pied.`,
    coachTips: ['Faites des petits pas rapides au début de la course pour relancer la cadence.'],
    steps: [
      { type: 'interval', name: 'Partie 1 : Sortie Vélo', durationMinutes: bikeMin, targetZone: 'Z2', targetDescription: `${Math.round(ftp * 0.75)}W` },
      { type: 'drill', name: 'Transition T2 express (< 2 min)', durationMinutes: 2, targetZone: 'Z3', targetDescription: 'Casque posé, chaussures enfilées' },
      { type: 'interval', name: `Partie 2 : Course à pied (${runMin} min)`, durationMinutes: runMin, targetZone: 'Z3', targetDescription: `Allure : ${marathonPace}/km` },
    ],
    status: 'planned',
  };
}

function createLongRunWorkout(week: number, day: number, date: string, phase: TrainingPhase, efPace: string, marathonPace: string, mult: number, isRest: boolean): Workout {
  const dur = isRest ? 45 : Math.min(105, Math.round(65 * mult));
  const distKm = Math.round((dur / 60) * 9.8 * 10) / 10;
  return {
    id: `w${week}-d${day}-longrun`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `Sortie Longue Course (${Math.floor(dur / 60)}h${dur % 60 ? dur % 60 : '00'}) - Endurance Z2`,
    sport: 'run',
    category: 'endurance',
    phase,
    durationMinutes: dur,
    distanceMeters: Math.round(distKm * 1000),
    targetZone: 'Z2',
    intensityRpe: 5,
    description: `Course en aisance respiratoire (${efPace}/km).`,
    coachTips: ['Restez sous votre seuil aérobie.'],
    steps: [
      { type: 'warmup', name: 'Mise en route 15 min', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Très lent' },
      { type: 'interval', name: 'Endurance Fondamentale (EF)', durationMinutes: dur - 25, targetZone: 'Z2', targetDescription: `Allure : ${efPace}/km` },
      { type: 'cooldown', name: 'Retour au calme', durationMinutes: 10, targetZone: 'Z1', targetDescription: 'Marche et trot lent' },
    ],
    status: 'planned',
  };
}

function createRaceDayWorkout(week: number, day: number, date: string, profile: AthleteProfile): Workout {
  const dist = profile.raceObjective.distance;
  const raceName = profile.raceObjective.raceName || `Triathlon ${dist.toUpperCase()}`;
  return {
    id: `w${week}-d${day}-raceday`,
    weekNumber: week,
    dayOfWeek: day,
    date,
    title: `JOUR J : ${raceName.toUpperCase()} 🏆`,
    sport: 'brick',
    category: 'brick',
    phase: 'race_week',
    durationMinutes: 180,
    distanceMeters: dist === 's' ? 25750 : dist === 'm' ? 51500 : dist === 'l' ? 113000 : 15000,
    targetZone: 'Z4',
    intensityRpe: 9,
    description: `C'est le grand jour ! Respectez votre allure cible et votre nutrition.`,
    coachTips: ['Profitez de chaque instant et célébrez votre ligne d\'arrivée !'],
    steps: [
      { type: 'warmup', name: 'Échauffement articulaire', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Élastiques' },
      { type: 'interval', name: `Compétition : ${raceName}`, durationMinutes: 150, targetZone: 'Z4', targetDescription: 'Allure spécifique' },
      { type: 'cooldown', name: 'Célébration', durationMinutes: 15, targetZone: 'Z1', targetDescription: 'Médaille & Récup' },
    ],
    status: 'planned',
  };
}
