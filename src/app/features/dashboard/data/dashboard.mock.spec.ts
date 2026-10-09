import { buildWeek, getDashboardMock } from './dashboard.mock';
import { navForRole } from '../layout/dashboard-nav';

describe('Dashboard: semana, datos por rol y menú', () => {
  it('buildWeek arma lunes a domingo con hoy marcado y las clases según su distancia a hoy', () => {
    const friday = new Date(2026, 9, 2); // viernes 2 de octubre de 2026
    const week = buildWeek({ [-1]: [{ title: 'Ayer', time: '1', status: 'completed' }], 0: [{ title: 'Hoy', time: '2', status: 'live' }] }, friday);

    expect(week.length).toBe(7);
    expect(week[0].date.getDay()).toBe(1); // lunes
    expect(week[0].date.getDate()).toBe(28); // 28 de septiembre
    expect(week[6].date.getDate()).toBe(4); // domingo 4 de octubre
    expect(week.filter((day) => day.isToday).length).toBe(1);
    expect(week[4].isToday).toBeTrue();
    expect(week[4].events[0].title).toBe('Hoy');
    expect(week[3].events[0].title).toBe('Ayer');
  });

  it('buildWeek funciona cuando hoy es domingo', () => {
    const sunday = new Date(2026, 9, 4);
    const week = buildWeek({}, sunday);
    expect(week[0].date.getDate()).toBe(28);
    expect(week[6].isToday).toBeTrue();
  });

  it('los textos cambian según el rol', () => {
    expect(getDashboardMock('student', 'Laura').copy.peopleTitle).toBe('Mis profesores');
    expect(getDashboardMock('teacher', 'Andrea').copy.peopleTitle).toBe('Mis estudiantes');
    expect(getDashboardMock('student', 'Laura').copy.greeting).toBe('Hola, Laura');
  });

  it('el menú del estudiante tiene Profesores, Comunidad y Academias; el del profe no', () => {
    const student = navForRole('student').map((item) => item.label);
    const teacher = navForRole('teacher').map((item) => item.label);
    expect(student).toEqual(['Inicio', 'Perfil', 'Calendario', 'Certificados', 'Profesores', 'Comunidad', 'Tareas', 'Academias']);
    expect(teacher).toEqual(['Inicio', 'Perfil', 'Calendario', 'Certificados', 'Tareas']);
    // El número de Tareas lo pone el menú según las tareas pendientes: no viene fijo
    expect(navForRole('student').every((item) => item.badge === undefined)).toBeTrue();
  });
});
