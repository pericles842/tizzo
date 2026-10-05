import { canJoin, sessionPhase } from './session-phase';

describe('sessionPhase', () => {
  const start = new Date('2026-10-05T18:00:00Z');
  const end = new Date('2026-10-05T19:00:00Z');
  const at = (iso: string) => sessionPhase(start, end, new Date(iso));

  it('antes de los 10 minutos previos la sala no abre', () => {
    expect(at('2026-10-05T17:49:59Z')).toBe('upcoming');
    expect(canJoin(at('2026-10-05T17:49:59Z'))).toBeFalse();
  });

  it('desde 10 minutos antes la sala está abierta', () => {
    expect(at('2026-10-05T17:50:00Z')).toBe('open');
    expect(canJoin(at('2026-10-05T17:55:00Z'))).toBeTrue();
  });

  it('entre el inicio y el fin está en vivo', () => {
    expect(at('2026-10-05T18:00:00Z')).toBe('live');
    expect(at('2026-10-05T18:59:59Z')).toBe('live');
  });

  it('al llegar el fin terminó y ya no se puede entrar', () => {
    expect(at('2026-10-05T19:00:00Z')).toBe('ended');
    expect(canJoin(at('2026-10-05T19:00:00Z'))).toBeFalse();
  });
});
