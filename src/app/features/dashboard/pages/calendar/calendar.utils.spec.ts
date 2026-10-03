import { addDays, formatRange, nextFullHour, suggestedStart } from './calendar.utils';

describe('calendar.utils', () => {
  const now = new Date(2026, 9, 2, 14, 30); // 2 oct 2026, 14:30 (hora local)

  describe('nextFullHour', () => {
    it('sube a la siguiente hora en punto', () => {
      const next = nextFullHour(now);
      expect(next.getHours()).toBe(15);
      expect(next.getMinutes()).toBe(0);
    });

    it('cruza la medianoche', () => {
      const next = nextFullHour(new Date(2026, 9, 2, 23, 10));
      expect(next.getDate()).toBe(3);
      expect(next.getHours()).toBe(0);
    });
  });

  describe('suggestedStart', () => {
    it('en la vista de mes usa las 9:00 del día tocado', () => {
      const start = suggestedStart(new Date(2026, 9, 5), false, now);
      expect(start?.getDate()).toBe(5);
      expect(start?.getHours()).toBe(9);
    });

    it('si hoy ya pasó de las 9:00, sugiere la siguiente hora en punto', () => {
      const start = suggestedStart(new Date(2026, 9, 2), false, now);
      expect(start?.getHours()).toBe(15);
    });

    it('un día pasado no es válido', () => {
      expect(suggestedStart(new Date(2026, 9, 1), false, now)).toBeNull();
    });

    it('con hora (vista semana) respeta la hora tocada si es futura', () => {
      const start = suggestedStart(new Date(2026, 9, 2, 18, 0), true, now);
      expect(start?.getHours()).toBe(18);
    });

    it('con hora, una franja que ya pasó no es válida', () => {
      expect(suggestedStart(new Date(2026, 9, 2, 10, 0), true, now)).toBeNull();
    });

    it('no modifica la fecha recibida', () => {
      const day = new Date(2026, 9, 5);
      suggestedStart(day, false, now);
      expect(day.getHours()).toBe(0);
    });
  });

  describe('addDays', () => {
    it('suma días conservando la hora', () => {
      const next = addDays(new Date(2026, 9, 5, 9, 0), 7);
      expect(next.getDate()).toBe(12);
      expect(next.getHours()).toBe(9);
    });

    it('cruza de mes y no muta el original', () => {
      const original = new Date(2026, 9, 28, 9, 0);
      const next = addDays(original, 7);
      expect(next.getMonth()).toBe(10);
      expect(next.getDate()).toBe(4);
      expect(original.getDate()).toBe(28);
    });
  });

  describe('formatRange', () => {
    it('muestra día y horas de inicio y fin', () => {
      const text = formatRange(new Date(2026, 9, 5, 9, 0).toISOString(), new Date(2026, 9, 5, 10, 0).toISOString());
      expect(text).toContain('09:00');
      expect(text).toContain('10:00');
      expect(text.toLowerCase()).toContain('octubre');
    });
  });
});
