/** Fecha y hora de inicio por defecto al elegir un día del calendario */
export const DEFAULT_HOUR = 9;
export const DEFAULT_DURATION_MIN = 60;

/** Siguiente hora en punto después de `from` */
export function nextFullHour(from: Date = new Date()): Date {
  const date = new Date(from);
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
}

/**
 * Inicio sugerido para una clase al tocar `day`. Si el calendario no trae hora (vista de mes) se usa
 * las 9:00; si eso ya pasó (hoy), la siguiente hora en punto. Devuelve null si el día ya pasó.
 */
export function suggestedStart(day: Date, hasTime: boolean, now: Date = new Date()): Date | null {
  const start = new Date(day);
  if (!hasTime) start.setHours(DEFAULT_HOUR, 0, 0, 0);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (start < startOfToday) return null;

  if (start <= now) return hasTime ? null : nextFullHour(now);
  return start;
}

/** Misma hora, `days` días después (una clase por semana: 7) */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Texto de fecha y hora para mostrar: "mié 8 oct, 15:00 – 16:00" */
export function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = (date: Date) => date.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day}, ${time(start)} – ${time(end)}`;
}

/** Duración de una clase en minutos (de inicio a fin) */
export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

/** Misma fecha con `minutes` minutos más */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** "1 h 30 min", "45 min", "2 h" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export const MIN_DURATION_MIN = 15;
export const MAX_DURATION_MIN = 480;
