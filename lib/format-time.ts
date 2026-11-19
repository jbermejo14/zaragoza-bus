// Formato de minutos de espera y de la hora de actualización.

const ARRIVING_LABEL = 'Llegando';
const NO_ESTIMATE_LABEL = '—';
const CLOCK_PAD_LENGTH = 2;

/** «Llegando» si 0, «N min» si hay estimación y «—» si es null. */
export function formatMinutes(minutes: number | null): string {
  if (minutes === null) {
    return NO_ESTIMATE_LABEL;
  }
  return minutes === 0 ? ARRIVING_LABEL : `${minutes} min`;
}

function padClockPart(value: number): string {
  return String(value).padStart(CLOCK_PAD_LENGTH, '0');
}

/** Hora local en formato hh:mm:ss. */
export function formatClock(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map(padClockPart).join(':');
}
