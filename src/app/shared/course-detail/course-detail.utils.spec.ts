import { CourseDetailSession } from './course-detail.models';
import { capacityLabel, dayKey, groupByDay, money, nextClassLabel, nextSession, typicalDuration } from './course-detail.utils';

const session = (n: number, start: Date, minutes = 60, status: CourseDetailSession['status'] = 'scheduled'): CourseDetailSession => ({
  uuid: `s${n}`,
  number: n,
  title: `Clase ${n}`,
  description: null,
  learning_points: [],
  starts_at: start.toISOString(),
  ends_at: new Date(start.getTime() + minutes * 60_000).toISOString(),
  duration_min: minutes,
  status
});

describe('course-detail.utils', () => {
  const now = new Date(2026, 9, 5, 10, 0);

  it('money: sin centavos si son enteros', () => {
    expect(money(80)).toBe('$80');
    expect(money(12.5)).toBe('$12.50');
    expect(money(0.99)).toBe('$0.99');
  });

  it('nextSession: la primera programada que no ha empezado, ignorando canceladas y pasadas', () => {
    const list = [
      session(1, new Date(2026, 9, 4, 9, 0)),
      session(2, new Date(2026, 9, 7, 9, 0), 60, 'cancelled'),
      session(3, new Date(2026, 9, 9, 9, 0)),
      session(4, new Date(2026, 9, 8, 9, 0))
    ];
    expect(nextSession(list, now)?.number).toBe(4);
    expect(nextSession([], now)).toBeNull();
  });

  it('nextClassLabel: hoy, mañana y otro día', () => {
    expect(nextClassLabel(session(1, new Date(2026, 9, 5, 18, 0)), now)).toBe('hoy 18:00');
    expect(nextClassLabel(session(1, new Date(2026, 9, 6, 9, 0)), now)).toBe('mañana 09:00');
    expect(nextClassLabel(session(1, new Date(2026, 9, 13, 9, 0)), now)).toContain('13');
  });

  it('groupByDay: agrupa por día, ordena y quita canceladas', () => {
    const list = [
      session(3, new Date(2026, 9, 7, 16, 0)),
      session(1, new Date(2026, 9, 7, 9, 0)),
      session(2, new Date(2026, 9, 6, 9, 0)),
      session(4, new Date(2026, 9, 8, 9, 0), 60, 'cancelled')
    ];
    const groups = groupByDay(list);
    expect(groups.length).toBe(2);
    expect(groups[0].day).toBe(6);
    expect(groups[1].sessions.map((s) => s.number)).toEqual([1, 3]);
    expect(groups[1].key).toBe(dayKey(new Date(2026, 9, 7).toISOString()));
  });

  it('typicalDuration: igual para todas o promedio', () => {
    expect(typicalDuration([session(1, now, 45), session(2, now, 45)])).toBe(45);
    expect(typicalDuration([session(1, now, 30), session(2, now, 60)])).toBe(45);
    expect(typicalDuration([])).toBeNull();
  });

  it('capacityLabel: individual o grupal', () => {
    expect(capacityLabel({ max_students: 1, modality: 'individual', kind: 'class' })).toBe('Clase individual (1 a 1)');
    expect(capacityLabel({ max_students: 1, modality: 'individual', kind: 'course' })).toBe('Curso individual (1 a 1)');
    expect(capacityLabel({ max_students: 10, modality: 'group', kind: 'course' })).toBe('Hasta 10 integrantes');
  });
});
