import { DashboardSession, buildLiveClass, buildSummary, buildWeekFromSessions, countToday, countWeek, studentTaskItems, teacherTaskItems } from './dashboard.live';
import { StudentTask, TeacherTask } from '../pages/tasks/tasks.models';

// Viernes 9 de octubre de 2026, 5:35 p. m. (hora local del navegador)
const NOW = new Date(2026, 9, 9, 17, 35);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 9, day, hour, minute).toISOString();

const session = (over: Partial<DashboardSession> = {}): DashboardSession => ({
  uuid: 's' + Math.random(),
  course_uuid: 'c1',
  kind: 'course',
  course_title: 'Álgebra',
  title: 'Álgebra',
  session_number: 3,
  total_sessions: 8,
  starts_at: at(9, 18),
  ends_at: at(9, 19),
  status: 'scheduled',
  course_status: 'published',
  max_students: 10,
  cover_url: null,
  ...over
});

describe('Dashboard con datos reales', () => {
  it('la próxima clase es la que empieza antes y avisa cuándo', () => {
    const live = buildLiveClass('teacher', [session({ starts_at: at(12, 18), ends_at: at(12, 19) }), session()], NOW)!;
    expect(live.phase).toBe('upcoming');
    expect(live.status).toBe('Empieza en 25 min');
    expect(live.meta).toBe('Clase 3 de 8 · Hoy, 6:00 p. m.');
    expect(live.completedSessions).toBe(2);
    expect(live.totalSessions).toBe(8);
  });

  it('la clase en curso va primero y la sala abre 10 minutos antes', () => {
    const running = session({ starts_at: at(9, 17), ends_at: at(9, 18) });
    expect(buildLiveClass('student', [session(), running], NOW)!.phase).toBe('live');
    expect(buildLiveClass('student', [session({ starts_at: at(9, 17, 40), ends_at: at(9, 18, 40) })], NOW)!.phase).toBe('open');
  });

  it('sin clases por delante (terminadas o canceladas) no hay próxima clase', () => {
    const done = session({ starts_at: at(9, 14), ends_at: at(9, 15) });
    const cancelled = session({ status: 'cancelled' });
    expect(buildLiveClass('teacher', [done, cancelled], NOW)).toBeNull();
    expect(buildLiveClass('teacher', [], NOW)).toBeNull();
  });

  it('el estudiante ve quién da la clase y una clase suelta no lleva progreso', () => {
    const live = buildLiveClass('student', [session({ kind: 'class', total_sessions: 1, teacher_name: 'Andrea M.' })], NOW)!;
    expect(live.meta).toBe('Clase única · Prof. Andrea M. · Hoy, 6:00 p. m.');
    expect(live.totalSessions).toBe(0);
  });

  it('la semana va de lunes a domingo con las clases de cada día y su estado', () => {
    const week = buildWeekFromSessions([session({ starts_at: at(7, 10), ends_at: at(7, 11) }), session(), session({ status: 'cancelled', starts_at: at(8, 10), ends_at: at(8, 11) })], NOW);
    expect(week.length).toBe(7);
    expect(week[0].date.getDate()).toBe(5);
    expect(week[4].isToday).toBeTrue();
    expect(week[2].events[0].status).toBe('completed');
    expect(week[4].events[0].status).toBe('upcoming');
    expect(week[3].events.length).toBe(0);
    expect(countWeek(week)).toBe(2);
  });

  it('cuenta las clases de hoy y arma el resumen según el rol', () => {
    expect(countToday([session(), session({ starts_at: at(10, 9), ends_at: at(10, 10) })], NOW)).toBe(1);
    expect(buildSummary('teacher', 1, 3)).toBe('Hoy das 1 clase y tienes 3 tareas por revisar.');
    expect(buildSummary('teacher', 0, 0)).toBe('Hoy no das clases y no tienes tareas por revisar.');
    expect(buildSummary('student', 2, 1)).toBe('Hoy tienes 2 clases y 1 tarea por entregar.');
    expect(buildSummary('student', 0, 0)).toBe('Hoy no tienes clases y ninguna tarea por entregar.');
  });

  it('profe: solo tareas publicadas con entregas; cerrar la saca de la lista', () => {
    const task = (over: Partial<TeacherTask>) =>
      ({ uuid: 't' + Math.random(), type: 'document', status: 'published', title: 'Ejercicios', due_at: at(12, 18), course: { uuid: 'c', title: 'Álgebra', kind: 'course' }, session: null, stats: { assigned: 5, submitted: 2, late: 0 }, ...over }) as TeacherTask;
    const { items, total } = teacherTaskItems([task({}), task({ status: 'closed' }), task({ stats: { assigned: 5, submitted: 0, late: 0 } }), task({ type: 'quiz', stats: { assigned: 5, submitted: 1, late: 0 } })], NOW);
    expect(total).toBe(2);
    expect(items.map((i) => i.due).sort()).toEqual(['1 respondió', '2 entregas']);
    expect(items[0].link).toContain('/app/tareas/');
  });

  it('estudiante: pendientes por entregar o responder, la que vence antes primero; las de lectura no cuentan', () => {
    const task = (over: Partial<StudentTask>) =>
      ({ uuid: 't' + Math.random(), type: 'document', state: 'pending', requires_submission: true, title: 'Tarea', due_at: at(12, 18), course: { uuid: 'c', title: 'Álgebra', kind: 'course' }, session: null, ...over }) as StudentTask;
    const { items, total } = studentTaskItems(
      [task({ title: 'Lejana', due_at: at(15, 18) }), task({ title: 'Mañana', due_at: at(10, 18) }), task({ title: 'Lectura', requires_submission: false }), task({ title: 'Hecha', state: 'submitted' }), task({ title: 'Quiz', type: 'quiz', requires_submission: false, due_at: at(9, 20) })],
      NOW
    );
    expect(total).toBe(3);
    expect(items.map((i) => i.title)).toEqual(['Quiz', 'Mañana', 'Lejana']);
    expect(items[0].due).toBe('Vence hoy');
    expect(items[0].urgent).toBeTrue();
    expect(items[1].due).toBe('Vence mañana');
    expect(items[2].urgent).toBeFalse();
  });
});
