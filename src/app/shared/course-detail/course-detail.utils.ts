import { CourseDetail, CourseDetailSession } from './course-detail.models';

/** "$80", "$12.50" */
export function money(amount: number, currency = 'USD'): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
}

/** "09:00" (24 horas, hora local) */
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "mar 13 oct" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
}

/** Día local 'YYYY-MM-DD' */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Primera clase programada que todavía no empezó */
export function nextSession(sessions: CourseDetailSession[], now: Date = new Date()): CourseDetailSession | null {
  return sessions.filter((s) => s.status === 'scheduled' && new Date(s.starts_at) > now).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null;
}

/** "hoy 18:00", "mañana 09:00" o "mar 13 oct 09:00" */
export function nextClassLabel(session: CourseDetailSession, now: Date = new Date()): string {
  const start = dayKey(session.starts_at);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = timeLabel(session.starts_at);
  if (start === dayKey(now.toISOString())) return `hoy ${time}`;
  if (start === dayKey(tomorrow.toISOString())) return `mañana ${time}`;
  return `${shortDate(session.starts_at)} ${time}`;
}

export interface DayGroup {
  key: string;
  weekday: string;
  day: number;
  sessions: CourseDetailSession[];
}

/** Clases agrupadas por día (de la más cercana a la más lejana), sin las canceladas */
export function groupByDay(sessions: CourseDetailSession[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const session of [...sessions].filter((s) => s.status !== 'cancelled').sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const key = dayKey(session.starts_at);
    const date = new Date(session.starts_at);
    const group = groups.get(key) ?? { key, weekday: date.toLocaleDateString('es', { weekday: 'short' }).replace(/\./g, ''), day: date.getDate(), sessions: [] };
    group.sessions.push(session);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Duración de las clases: la de la primera si todas duran igual; si no, el promedio redondeado */
export function typicalDuration(sessions: CourseDetailSession[]): number | null {
  if (!sessions.length) return null;
  const durations = sessions.map((s) => s.duration_min);
  return durations.every((d) => d === durations[0]) ? durations[0] : Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
}

/** "Clase individual (1 a 1)" o "Hasta 10 integrantes" */
export function capacityLabel(course: Pick<CourseDetail, 'max_students' | 'modality' | 'kind'>): string {
  if (course.max_students === 1) return `${course.kind === 'course' ? 'Curso' : 'Clase'} individual (1 a 1)`;
  return `Hasta ${course.max_students} integrantes`;
}
