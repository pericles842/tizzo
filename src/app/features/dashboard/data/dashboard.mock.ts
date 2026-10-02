/**
 * Datos de PRUEBA del dashboard (solo frontend). Se reemplazarán por llamadas al API.
 * Hay una versión para estudiante y otra para profe; la semana se arma alrededor de la fecha de hoy.
 */
import { UserRole } from '../../../core/auth/auth.models';
import { ClassEvent, DashboardData, WeekDay } from './dashboard.models';

/** Clases de la semana según cuántos días faltan o pasaron desde hoy (0 = hoy) */
type WeekPlan = Record<number, ClassEvent[]>;

const STUDENT_WEEK: WeekPlan = {
  [-2]: [{ title: 'Inglés', time: '4:00 PM', status: 'completed', note: 'Completada' }],
  0: [{ title: 'Álgebra', time: '6:00 PM', status: 'live', note: 'En 25 min' }],
  1: [{ title: 'Inglés', time: '4:00 PM', status: 'upcoming' }],
  2: [{ title: 'Guitarra', time: '10:00 AM', status: 'upcoming' }]
};

const TEACHER_WEEK: WeekPlan = {
  [-1]: [{ title: 'Álgebra', time: '6:00 PM', status: 'completed', note: 'Completada' }],
  0: [{ title: 'Álgebra', time: '6:00 PM', status: 'live', note: 'En 25 min' }],
  2: [{ title: 'Álgebra', time: '6:00 PM', status: 'upcoming' }],
  3: [{ title: 'Ecuaciones', time: '11:00 AM', status: 'upcoming' }]
};

/** Semana de lunes a domingo que contiene `today` */
export function buildWeek(plan: WeekPlan, today = new Date()): WeekDay[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const mondayOffset = (start.getDay() + 6) % 7; // 0 = lunes
  start.setDate(start.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const offset = index - mondayOffset;
    return { date, isToday: offset === 0, events: plan[offset] ?? [] };
  });
}

export function getDashboardMock(role: UserRole, firstName: string): DashboardData {
  return role === 'teacher' ? teacherMock(firstName) : studentMock(firstName);
}

function studentMock(firstName: string): DashboardData {
  return {
    copy: {
      greeting: `Hola, ${firstName}`,
      summary: 'Hoy tienes 1 clase en vivo y 2 tareas por entregar.',
      tasksTitle: 'Tareas pendientes',
      peopleTitle: 'Mis profesores',
      certificatesTitle: 'Certificados',
      peopleRoute: '/app/profesores'
    },
    liveClass: {
      courseTitle: 'Álgebra desde cero',
      meta: 'Clase 3 de 8 · Prof. Andrea M. · Hoy, 6:00 PM',
      status: 'En vivo · empieza en 25 min',
      completedSessions: 3,
      totalSessions: 8
    },
    stats: [
      { icon: 'pi pi-video', value: 4, label: 'Clases esta semana' },
      { icon: 'pi pi-check-square', value: 2, label: 'Tareas pendientes' },
      { icon: 'pi pi-verified', value: 1, label: 'Certificado obtenido' }
    ],
    week: buildWeek(STUDENT_WEEK),
    tasks: [
      { id: 't1', title: 'Ejercicios de ecuaciones', course: 'Álgebra desde cero', due: 'Vence mañana', urgent: true },
      { id: 't2', title: 'Redacción en inglés', course: 'Inglés conversacional', due: 'En 3 días', urgent: false },
      { id: 't3', title: 'Practicar escalas', course: 'Guitarra desde cero', due: 'En 5 días', urgent: false }
    ],
    people: [
      { id: 'p1', name: 'Prof. Andrea M.', detail: 'Matemáticas', trailing: '★ 4.9' },
      { id: 'p2', name: 'Prof. Camila S.', detail: 'Inglés', trailing: '★ 5.0' },
      { id: 'p3', name: 'Prof. Carlos P.', detail: 'Guitarra', trailing: '★ 4.7' }
    ],
    certificates: [
      { id: 'c1', title: 'Introducción a la programación', status: 'earned', detail: 'Prof. Luis R. · 12 ago 2026' },
      { id: 'c2', title: 'Álgebra desde cero', status: 'in_progress', detail: '3 de 8 clases completadas', progress: 38 }
    ],
    posts: [
      { id: 'm1', author: 'Sofía M.', time: 'Hace 2 h', text: '¿Alguien tiene algún truco para factorizar más rápido?', replies: 4 },
      { id: 'm2', author: 'Carlos R.', time: 'Ayer', text: 'Comparto mis notas de la clase de inglés de esta semana.', replies: 2 }
    ]
  };
}

function teacherMock(firstName: string): DashboardData {
  return {
    copy: {
      greeting: `Hola, ${firstName}`,
      summary: 'Hoy das 1 clase en vivo y tienes 3 tareas por revisar.',
      tasksTitle: 'Tareas por revisar',
      peopleTitle: 'Mis estudiantes',
      certificatesTitle: 'Certificados emitidos',
      peopleRoute: '/app/estudiantes'
    },
    liveClass: {
      courseTitle: 'Álgebra desde cero',
      meta: 'Clase 3 de 8 · 12 estudiantes · Hoy, 6:00 PM',
      status: 'En vivo · empieza en 25 min',
      completedSessions: 3,
      totalSessions: 8
    },
    stats: [
      { icon: 'pi pi-video', value: 6, label: 'Clases esta semana' },
      { icon: 'pi pi-check-square', value: 3, label: 'Tareas por revisar' },
      { icon: 'pi pi-users', value: 24, label: 'Estudiantes activos' }
    ],
    week: buildWeek(TEACHER_WEEK),
    tasks: [
      { id: 't1', title: 'Ejercicios de ecuaciones', course: 'Laura P. · Álgebra desde cero', due: 'Entregada hoy', urgent: true },
      { id: 't2', title: 'Ejercicios de ecuaciones', course: 'Diego R. · Álgebra desde cero', due: 'Hace 1 día', urgent: false },
      { id: 't3', title: 'Prueba corta 2', course: 'Ana G. · Álgebra desde cero', due: 'Hace 2 días', urgent: false }
    ],
    people: [
      { id: 's1', name: 'Laura Pérez', detail: 'Álgebra desde cero', trailing: '3 clases' },
      { id: 's2', name: 'Diego Ramos', detail: 'Álgebra desde cero', trailing: '3 clases' },
      { id: 's3', name: 'Ana Gómez', detail: 'Ecuaciones', trailing: '5 clases' }
    ],
    certificates: [
      { id: 'c1', title: 'Álgebra desde cero · grupo de agosto', status: 'earned', detail: '8 diplomas emitidos · 30 ago 2026' },
      { id: 'c2', title: 'Álgebra desde cero · grupo actual', status: 'in_progress', detail: '3 de 8 clases dictadas', progress: 38 }
    ],
    posts: [
      { id: 'm1', author: 'Sofía M.', time: 'Hace 2 h', text: '¿Alguien tiene algún truco para factorizar más rápido?', replies: 4 },
      { id: 'm2', author: 'Laura P.', time: 'Ayer', text: 'Profe, ¿podemos repasar los productos notables el jueves?', replies: 1 }
    ]
  };
}
