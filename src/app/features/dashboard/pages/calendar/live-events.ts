import { Calendar, EventContentArg } from '@fullcalendar/core';
import { SessionPhase, sessionPhase } from '../../../../core/live/session-phase';

/** Cada cuánto se revisa si una clase empezó o terminó (el estado sale solo de las fechas) */
export const LIVE_REFRESH_MS = 30_000;

/** Lo mínimo que necesita una clase del calendario para saber su estado */
export interface TimedSession {
  starts_at: string;
  ends_at: string;
}

/** Clases de estado: en vivo (verde, late) o terminada (atenuada) */
export function phaseClassNames(session: TimedSession, now = new Date()): string[] {
  const phase: SessionPhase = sessionPhase(session.starts_at, session.ends_at, now);
  if (phase === 'live') return ['tz-event-live'];
  if (phase === 'ended') return ['tz-event-ended'];
  return [];
}

/**
 * Contenido de cada clase en el calendario: "EN VIVO" con el punto que late si está en curso, la hora (salvo en el
 * mes) y el título. Se arma con nodos (no HTML) para que el título del profe nunca se interprete como HTML.
 */
export function liveEventContent(arg: EventContentArg) {
  const session = arg.event.extendedProps['session'] as TimedSession | undefined;
  const live = !!session && sessionPhase(session.starts_at, session.ends_at) === 'live';
  const nodes: Node[] = [];

  if (live) {
    const tag = document.createElement('span');
    tag.className = 'tz-on-air-tag';
    const dot = document.createElement('span');
    dot.className = 'tz-on-air-dot';
    dot.setAttribute('aria-hidden', 'true');
    tag.append(dot, 'EN VIVO');
    nodes.push(tag);
  }
  if (arg.timeText && arg.view.type !== 'listWeek') {
    const time = document.createElement('span');
    time.className = 'fc-event-time';
    time.textContent = arg.timeText;
    nodes.push(time);
  }
  const title = document.createElement('span');
  title.className = 'fc-event-title';
  title.textContent = arg.event.title;
  nodes.push(title);

  const wrapper = document.createElement('span');
  wrapper.className = 'tz-event-content';
  wrapper.append(...nodes);
  return { domNodes: [wrapper] };
}

/**
 * Vuelve a calcular el estado de las clases ya dibujadas (sin pedirlas otra vez al API), para que se pongan en
 * verde al empezar y se apaguen al terminar. `baseClasses` da las clases fijas de cada una (tipo, borrador...).
 */
export function refreshLivePhases(api: Calendar | undefined, baseClasses: (session: TimedSession) => string[]): void {
  if (!api) return;
  const now = new Date();
  for (const event of api.getEvents()) {
    const session = event.extendedProps['session'] as TimedSession | undefined;
    if (!session) continue;
    const next = [...baseClasses(session), ...phaseClassNames(session, now)];
    if (next.join(' ') !== event.classNames.join(' ')) event.setProp('classNames', next);
  }
}
