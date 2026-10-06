import { StudentTaskState, TaskScope, TaskSessionRef, TaskStatus, TaskType } from './tasks.models';

const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "jue, 9 oct, 6:00 p. m." (siempre 12 horas) */
export function formatDateTime(value: string | Date): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('es', TIME)}`;
}

/**
 * Fecha límite en palabras: "Vence hoy a las 6:00 p. m.", "Vence mañana a las…", "Vence el jue, 9 oct, 6:00 p. m."
 * o, si ya pasó, "Venció el …".
 */
export function dueLabel(value: string | Date, now = new Date()): string {
  const due = new Date(value);
  const time = due.toLocaleTimeString('es', TIME);
  if (due.getTime() < now.getTime()) return `Venció el ${formatDateTime(due)}`;
  if (sameDay(due, now)) return `Vence hoy a las ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(due, tomorrow)) return `Vence mañana a las ${time}`;
  return `Vence el ${formatDateTime(due)}`;
}

/** Faltan menos de 24 h para la fecha límite (y todavía no pasa) */
export function isDueSoon(value: string | Date, now = new Date()): boolean {
  const left = new Date(value).getTime() - now.getTime();
  return left > 0 && left <= 24 * 3600e3;
}

export const TYPE_LABEL: Record<TaskType, string> = { document: 'Documento', quiz: 'Quiz' };
export const TYPE_ICON: Record<TaskType, string> = { document: 'pi pi-file-pdf', quiz: 'pi pi-list-check' };

export const SCOPE_LABEL: Record<TaskScope, string> = { course: 'Todo el curso', class: 'Una clase', individual: 'Clase individual' };

/** "Curso de álgebra · Clase 2: Ecuaciones" */
export function targetLabel(course: { title: string }, session: Pick<TaskSessionRef, 'number' | 'title'> | null): string {
  if (!session) return course.title;
  return session.title && session.title !== course.title ? `${course.title} · Clase ${session.number}: ${session.title}` : `${course.title} · Clase ${session.number}`;
}

/**
 * Etiqueta del estado de la tarea (profe). Sin verde: borrador neutro, publicada en violeta (primario), cerrada neutra.
 * `severity` undefined = primario.
 */
export const STATUS_TAG: Record<TaskStatus, { label: string; severity?: 'secondary'; icon: string }> = {
  draft: { label: 'Borrador', severity: 'secondary', icon: 'pi pi-pencil' },
  published: { label: 'Publicada', icon: 'pi pi-send' },
  closed: { label: 'Cerrada', severity: 'secondary', icon: 'pi pi-lock' }
};

/**
 * Etiqueta del estado para el estudiante. Sin verde: entregada en violeta (logrado), pendiente neutra (o amarilla si
 * vence en menos de 24 h), vencida en rojo, finalizada neutra.
 */
export function stateTag(state: StudentTaskState, dueAt: string | Date, now = new Date()): { label: string; severity?: 'secondary' | 'warn' | 'danger'; icon: string } {
  switch (state) {
    case 'submitted':
      return { label: 'Entregada', icon: 'pi pi-check' };
    case 'overdue':
      return { label: 'Vencida', severity: 'danger', icon: 'pi pi-exclamation-circle' };
    case 'done':
      return { label: 'Finalizada', severity: 'secondary', icon: 'pi pi-flag' };
    default:
      return isDueSoon(dueAt, now) ? { label: 'Vence pronto', severity: 'warn', icon: 'pi pi-clock' } : { label: 'Pendiente', severity: 'secondary', icon: 'pi pi-clock' };
  }
}

/** Pestañas de "Mis tareas": entregadas incluye las de solo lectura ya finalizadas */
export type StudentTab = 'pending' | 'submitted' | 'overdue';
export function tabOf(state: StudentTaskState): StudentTab {
  return state === 'done' ? 'submitted' : state;
}
