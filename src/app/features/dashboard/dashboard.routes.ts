import { Routes } from '@angular/router';
import { teacherGuard, teacherMatch } from '../../core/auth/auth.guards';

/** Secciones del menú que aún no existen: una sola página configurable desde `data` */
const comingSoon = (path: string, pageTitle: string, icon: string, description: string) => ({
  path,
  title: `${pageTitle} · Tizzo`,
  data: { pageTitle, icon, description },
  loadComponent: () => import('./pages/coming-soon/coming-soon').then((m) => m.ComingSoon)
});

/** Rutas hijas de /app (el layout y el authGuard se definen en app.routes.ts) */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Inicio · Tizzo',
    data: { pageTitle: 'Inicio' },
    loadComponent: () => import('./pages/home/dashboard-home').then((m) => m.DashboardHome)
  },
  {
    path: 'perfil',
    title: 'Perfil · Tizzo',
    data: { pageTitle: 'Perfil' },
    canActivate: [teacherGuard],
    loadComponent: () => import('./pages/profile/teacher-profile-page').then((m) => m.TeacherProfilePage)
  },
  {
    // Profes: calendario para programar. Estudiantes: el de abajo, solo lectura con sus clases.
    path: 'calendario',
    title: 'Calendario · Tizzo',
    data: { pageTitle: 'Calendario' },
    canMatch: [teacherMatch],
    loadComponent: () => import('./pages/calendar/calendar-page').then((m) => m.CalendarPage)
  },
  {
    path: 'calendario',
    title: 'Calendario · Tizzo',
    data: { pageTitle: 'Calendario' },
    loadComponent: () => import('./pages/student-calendar/student-calendar-page').then((m) => m.StudentCalendarPage)
  },
  comingSoon('certificados', 'Certificados', 'pi pi-verified', 'Aquí podrás ver y descargar tus diplomas.'),
  comingSoon('profesores', 'Profesores', 'pi pi-user', 'Aquí verás a tus profes y podrás encontrar nuevos.'),
  comingSoon('estudiantes', 'Estudiantes', 'pi pi-user', 'Aquí verás a tus estudiantes y su progreso.'),
  comingSoon('comunidad', 'Comunidad', 'pi pi-users', 'Un espacio para preguntar, compartir notas y aprender con otros.'),
  comingSoon('tareas', 'Tareas', 'pi pi-check-square', 'Aquí verás las tareas de tus cursos y sus fechas de entrega.'),
  comingSoon('academias', 'Academias', 'pi pi-graduation-cap', 'Sedes que agrupan a varios profesores. Pronto podrás conocerlas y unirte a una.'),
  { path: '**', redirectTo: '' }
];
