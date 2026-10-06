import { dueLabel, isDueSoon, stateTag, tabOf, targetLabel } from './tasks.utils';

describe('tasks.utils', () => {
  const now = new Date(2026, 9, 6, 10, 0); // lunes 6 oct 2026, 10:00 a. m.

  it('dueLabel: hoy, mañana, otro día y vencida', () => {
    expect(dueLabel(new Date(2026, 9, 6, 18, 0), now)).toMatch(/^Vence hoy a las 6:00/);
    expect(dueLabel(new Date(2026, 9, 7, 9, 30), now)).toMatch(/^Vence mañana a las 9:30/);
    expect(dueLabel(new Date(2026, 9, 9, 18, 0), now)).toMatch(/^Vence el .*9.*6:00/);
    expect(dueLabel(new Date(2026, 9, 5, 18, 0), now)).toMatch(/^Venció el /);
  });

  it('isDueSoon: solo dentro de las próximas 24 h', () => {
    expect(isDueSoon(new Date(2026, 9, 6, 20, 0), now)).toBeTrue();
    expect(isDueSoon(new Date(2026, 9, 8, 20, 0), now)).toBeFalse();
    expect(isDueSoon(new Date(2026, 9, 5, 20, 0), now)).toBeFalse();
  });

  it('stateTag: sin verde; pendiente urgente en amarillo y vencida en rojo', () => {
    expect(stateTag('submitted', now, now).label).toBe('Entregada');
    expect(stateTag('submitted', now, now).severity).toBeUndefined(); // primario (violeta)
    expect(stateTag('pending', new Date(2026, 9, 6, 20, 0), now).severity).toBe('warn');
    expect(stateTag('pending', new Date(2026, 9, 9, 20, 0), now).severity).toBe('secondary');
    expect(stateTag('overdue', now, now).severity).toBe('danger');
    expect(stateTag('done', now, now).label).toBe('Finalizada');
  });

  it('tabOf: las finalizadas van con las entregadas', () => {
    expect(tabOf('done')).toBe('submitted');
    expect(tabOf('overdue')).toBe('overdue');
  });

  it('targetLabel: curso solo o con su clase', () => {
    expect(targetLabel({ title: 'Álgebra' }, null)).toBe('Álgebra');
    expect(targetLabel({ title: 'Álgebra' }, { number: 2, title: 'Ecuaciones' })).toBe('Álgebra · Clase 2: Ecuaciones');
    expect(targetLabel({ title: 'Guitarra' }, { number: 1, title: 'Guitarra' })).toBe('Guitarra · Clase 1');
  });
});
