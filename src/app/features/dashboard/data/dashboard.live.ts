/**
 * Arma el "Inicio" del dashboard con los datos reales: las clases del calendario (profe o estudiante) y las tareas.
 * Son funciones puras (reciben la hora actual) para poder probarlas sin API.
 */
import { UserRole } from '../../../core/auth/auth.models';
import { sessionPhase } from '../../../core/live/session-phase';
import { CalendarSession } from '../pages/calendar/calendar.models';
import { StudentTask, TeacherTask } from '../pages/tasks/tasks.models';
import { targetLabel } from '../pages/tasks/tasks.utils';
import { ClassEvent, LiveClass, TaskItem, WeekDay } from './dashboard.models';

/** Clase del calendario; el estudiante también sabe quién la da */
export type DashboardSession = CalendarSession & { teacher_name?: string };

const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const MAX_TASKS = 5;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Lunes 00:00 de la semana que contiene `today` */
export function weekStart(today: Date): Date {
  const start = startOfDay(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

/** Rango que hay que pedir al API: la semana completa y los próximos 60 días (para la próxima clase) */
export function dashboardRange(now: Date): { from: Date; to: Date } {
  const start = weekStart(now);
  const from = new Date(Math.min(start.getTime(), now.getTime() - 12 * 3600e3));
  const to = new Date(Math.max(start.getTime() + 7 * 24 * 3600e3, now.getTime() + 60 * 24 * 3600e3));
  return { from, to };
}

function active(sessions: DashboardSession[]): DashboardSession[] {
  return sessions.filter((session) => session.status !== 'cancelled');
}

function minutesUntil(session: DashboardSession, now: Date): number {
  return Math.max(0, Math.ceil((new Date(session.starts_at).getTime() - now.getTime()) / 60_000));
}

/** "Hoy, 6:00 p. m." · "Mañana, 6:00 p. m." · "vie, 9 oct, 6:00 p. m." */
function whenLabel(value: string, now: Date): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString('es', TIME);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(date, now)) return `Hoy, ${time}`;
  if (sameDay(date, tomorrow)) return `Mañana, ${time}`;
  return `${date.toLocaleDateString('es', SHORT_DATE)}, ${time}`;
}

/** La clase en curso o, si no hay, la próxima que empieza; null si no queda ninguna */
export function buildLiveClass(role: UserRole, sessions: DashboardSession[], now: Date): LiveClass | null {
  const next = active(sessions)
    .filter((session) => sessionPhase(session.starts_at, session.ends_at, now) !== 'ended')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  if (!next) return null;

  const phase = sessionPhase(next.starts_at, next.ends_at, now) as LiveClass['phase'];
  const minutes = minutesUntil(next, now);
  const isCourse = next.kind === 'course';
  const parts = [
    isCourse ? `Clase ${next.session_number} de ${next.total_sessions}` : 'Clase única',
    role === 'student' && next.teacher_name ? `Prof. ${next.teacher_name}` : null,
    whenLabel(next.starts_at, now)
  ].filter(Boolean);

  return {
    courseUuid: next.course_uuid,
    courseTitle: next.course_title,
    meta: parts.join(' · '),
    status: phase === 'live' ? 'En vivo · en curso' : phase === 'open' ? `Sala abierta · empieza en ${minutes} min` : minutes < 60 ? `Empieza en ${minutes} min` : 'Próxima clase',
    phase,
    completedSessions: isCourse ? Math.max(0, next.session_number - 1) : 0,
    totalSessions: isCourse ? next.total_sessions : 0
  };
}

/** La semana de lunes a domingo con las clases de cada día */
export function buildWeekFromSessions(sessions: DashboardSession[], now: Date): WeekDay[] {
  const start = weekStart(now);
  const list = active(sessions);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const events: ClassEvent[] = list
      .filter((session) => sameDay(new Date(session.starts_at), date))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .map((session) => {
        const phase = sessionPhase(session.starts_at, session.ends_at, now);
        const time = new Date(session.starts_at).toLocaleTimeString('es', TIME);
        const title = session.course_title;
        if (phase === 'ended') return { title, time, status: 'completed', note: 'Completada' };
        if (phase === 'live') return { title, time, status: 'live', note: 'En vivo' };
        if (phase === 'open') return { title, time, status: 'live', note: `En ${minutesUntil(session, now)} min` };
        return { title, time, status: 'upcoming' };
      });
    return { date, isToday: sameDay(date, now), events };
  });
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "Hoy das 1 clase y tienes 3 tareas por revisar." */
export function buildSummary(role: UserRole, todayClasses: number, pendingTasks: number): string {
  if (role === 'teacher') {
    const classes = todayClasses ? `das ${plural(todayClasses, 'clase', 'clases')}` : 'no das clases';
    const tasks = pendingTasks ? `tienes ${plural(pendingTasks, 'tarea', 'tareas')} por revisar` : 'no tienes tareas por revisar';
    return `Hoy ${classes} y ${tasks}.`;
  }
  const classes = todayClasses ? `tienes ${plural(todayClasses, 'clase', 'clases')}` : 'no tienes clases';
  const tasks = pendingTasks ? `${plural(pendingTasks, 'tarea', 'tareas')} por entregar` : 'ninguna tarea por entregar';
  return `Hoy ${classes} y ${tasks}.`;
}

/** Clases de hoy que todavía no terminaron (o ya terminaron: cuentan las del día) */
export function countToday(sessions: DashboardSession[], now: Date): number {
  return active(sessions).filter((session) => sameDay(new Date(session.starts_at), now)).length;
}

export function countWeek(week: WeekDay[]): number {
  return week.reduce((total, day) => total + day.events.length, 0);
}

/** Profe: tareas publicadas (sin cerrar) que ya tienen entregas o respuestas; cerrarla es darla por revisada */
export function teacherTaskItems(tasks: TeacherTask[], now: Date): { items: TaskItem[]; total: number } {
  const open = tasks
    .filter((task) => task.status === 'published' && (task.stats?.submitted ?? 0) > 0)
    .sort((a, b) => new Date(b.due_at).getTime() - new Date(a.due_at).getTime());
  return {
    total: open.length,
    items: open.slice(0, MAX_TASKS).map((task) => {
      const count = task.stats!.submitted;
      const what = task.type === 'quiz' ? (count === 1 ? 'respondió' : 'respondieron') : count === 1 ? 'entrega' : 'entregas';
      return {
        id: task.uuid,
        title: task.title,
        course: targetLabel(task.course, task.session),
        due: `${count} ${what}`,
        urgent: new Date(task.due_at).getTime() <= now.getTime(),
        link: `/app/tareas/${task.uuid}`
      };
    })
  };
}

function dueShort(value: string, now: Date): string {
  const due = new Date(value);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(due, now)) return 'Vence hoy';
  if (sameDay(due, tomorrow)) return 'Vence mañana';
  const days = Math.ceil((startOfDay(due).getTime() - startOfDay(now).getTime()) / (24 * 3600e3));
  return days <= 6 ? `En ${days} días` : `Vence ${due.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '')}`;
}

/** Estudiante: tareas pendientes que se entregan o se responden (las de solo lectura no), la que vence antes primero */
export function studentTaskItems(tasks: StudentTask[], now: Date): { items: TaskItem[]; total: number } {
  const pending = tasks
    .filter((task) => task.state === 'pending' && (task.type === 'quiz' || task.requires_submission))
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  return {
    total: pending.length,
    items: pending.slice(0, MAX_TASKS).map((task) => ({
      id: task.uuid,
      title: task.title,
      course: targetLabel(task.course, task.session),
      due: dueShort(task.due_at, now),
      urgent: new Date(task.due_at).getTime() - now.getTime() <= 24 * 3600e3,
      link: `/app/tareas/${task.uuid}`
    }))
  };
}
