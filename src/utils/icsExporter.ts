import { TrainingPlan } from '../types/triathlon';

// Formats a date YYYY-MM-DD to ICS DATE string format: YYYYMMDD
function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

export function exportPlanToIcs(plan: TrainingPlan, athleteName: string): string {
  const lines: string[] = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//TriaTrain//Triathlon Training Program//FR');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(`X-WR-CALNAME:TriaTrain - Plan ${plan.raceDistance.toUpperCase()} (${athleteName})`);
  lines.push('X-WR-TIMEZONE:Europe/Paris');

  plan.weeks.forEach((week) => {
    week.workouts.forEach((workout) => {
      if (workout.sport === 'rest' && workout.durationMinutes === 0) {
        return; // Skip empty rest days to keep calendar clean
      }

      const dtStart = formatIcsDate(workout.date);
      const uid = `triatrain-${workout.id}@triatrain.app`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${formatIcsDate(new Date().toISOString().split('T')[0])}T000000Z`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`SUMMARY:[TriaTrain] ${workout.title}`);

      // Sport specific emoji and category
      const sportEmoji = workout.sport === 'swim' ? '🏊' : workout.sport === 'bike' ? '🚴' : workout.sport === 'run' ? '🏃' : workout.sport === 'brick' ? '⚡' : '💪';
      
      const descriptionLines = [
        `${sportEmoji} Discipline : ${workout.sport.toUpperCase()}`,
        `⏱ Durée : ${workout.durationMinutes} min | 📏 Distance : ${(workout.distanceMeters / 1000).toFixed(1)} km`,
        `🎯 Zone cible : ${workout.targetZone} (Intensité : ${workout.intensityRpe}/10)`,
        '',
        `📝 Description :`,
        workout.description,
        '',
        `💡 Conseils du Coach :`,
        ...workout.coachTips.map((tip) => `• ${tip}`),
        '',
        `📋 Structure de séance :`,
        ...workout.steps.map((step) => `• ${step.name} (${step.targetZone}) : ${step.targetDescription}`),
      ];

      const cleanDescription = descriptionLines.join('\\n').replace(/,/g, '\\,');
      lines.push(`DESCRIPTION:${cleanDescription}`);
      lines.push(`CATEGORIES:Triathlon,${workout.sport.toUpperCase()}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(plan: TrainingPlan, athleteName: string) {
  const icsContent = exportPlanToIcs(plan, athleteName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `TriaTrain_Plan_${plan.raceDistance.toUpperCase()}_${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
