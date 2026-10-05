/**
 * En qué momento está una clase, solo por sus fechas (lo mismo que decide el API para dejar entrar a la sala):
 * - upcoming: todavía no abre la sala.
 * - open: la sala ya abrió (10 min antes) pero la clase no empezó.
 * - live: la clase está en curso (EN VIVO).
 * - ended: ya terminó.
 */
export type SessionPhase = 'upcoming' | 'open' | 'live' | 'ended';

/** Minutos antes del inicio en que se abre la sala (igual que JOIN_EARLY_MIN en tizzo.api) */
export const JOIN_EARLY_MIN = 10;

export function sessionPhase(startsAt: string | Date, endsAt: string | Date, now: Date = new Date()): SessionPhase {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const time = now.getTime();
  if (time >= end) return 'ended';
  if (time >= start) return 'live';
  if (time >= start - JOIN_EARLY_MIN * 60_000) return 'open';
  return 'upcoming';
}

/** Se puede pulsar "Entrar a la sala" */
export function canJoin(phase: SessionPhase): boolean {
  return phase === 'open' || phase === 'live';
}

/** Ruta de Tizzo a la sala de una clase suelta o curso (la misma para todas sus clases) */
export function roomPath(courseUuid: string): string {
  return `/sala/${courseUuid}`;
}

/** Texto corto del estado, para el diálogo de la clase */
export function phaseLabel(phase: SessionPhase): string {
  switch (phase) {
    case 'live':
      return 'En vivo';
    case 'open':
      return 'La sala ya abrió';
    case 'ended':
      return 'Terminó';
    default:
      return `La sala abre ${JOIN_EARLY_MIN} minutos antes`;
  }
}
