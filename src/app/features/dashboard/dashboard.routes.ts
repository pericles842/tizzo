import { Routes } from '@angular/router';
import { studentGuard, teacherGuard, teacherMatch } from '../../core/auth/auth.guards';

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
    canMatch: [teacherMatch],
    loadComponent: () => import('./pages/profile/teacher-profile-page').then((m) => m.TeacherProfilePage)
  },
  {
    // Estudiantes: su perfil (la ruta de arriba solo coincide con profes)
    path: 'perfil',
    title: 'Perfil · Tizzo',
    data: { pageTitle: 'Perfil' },
    loadComponent: () => import('./pages/student-profile/student-profile-page').then((m) => m.StudentProfilePage)
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
  {
    // Estudiantes: sus profes favoritos
    path: 'profesores',
    title: 'Profesores · Tizzo',
    data: { pageTitle: 'Profesores' },
    canActivate: [studentGuard],
    loadComponent: () => import('./pages/favorite-teachers/favorite-teachers-page').then((m) => m.FavoriteTeachersPage)
  },
  comingSoon('estudiantes', 'Estudiantes', 'pi pi-user', 'Aquí verás a tus estudiantes y su progreso.'),
  comingSoon('comunidad', 'Comunidad', 'pi pi-users', 'Un espacio para preguntar, compartir notas y aprender con otros.'),
  // Tareas: el profe las crea y revisa; el estudiante ve las suyas y entrega. 'nueva' va antes de ':uuid'.
  {
    path: 'tareas',
    title: 'Tareas · Tizzo',
    data: { pageTitle: 'Tareas' },
    canMatch: [teacherMatch],
    loadComponent: () => import('./pages/tasks/teacher/teacher-tasks-page').then((m) => m.TeacherTasksPage)
  },
  {
    path: 'tareas',
    title: 'Mis tareas · Tizzo',
    data: { pageTitle: 'Tareas' },
    loadComponent: () => import('./pages/tasks/student/student-tasks-page').then((m) => m.StudentTasksPage)
  },
  {
    path: 'tareas/nueva',
    title: 'Nueva tarea · Tizzo',
    data: { pageTitle: 'Tareas' },
    canActivate: [teacherGuard],
    loadComponent: () => import('./pages/tasks/teacher/task-editor-page').then((m) => m.TaskEditorPage)
  },
  {
    path: 'tareas/:uuid/editar',
    title: 'Editar tarea · Tizzo',
    data: { pageTitle: 'Tareas' },
    canActivate: [teacherGuard],
    loadComponent: () => import('./pages/tasks/teacher/task-editor-page').then((m) => m.TaskEditorPage)
  },
  {
    path: 'tareas/:uuid',
    title: 'Tarea · Tizzo',
    data: { pageTitle: 'Tareas' },
    canMatch: [teacherMatch],
    loadComponent: () => import('./pages/tasks/teacher/teacher-task-detail-page').then((m) => m.TeacherTaskDetailPage)
  },
  {
    path: 'tareas/:uuid',
    title: 'Tarea · Tizzo',
    data: { pageTitle: 'Tareas' },
    loadComponent: () => import('./pages/tasks/student/student-task-page').then((m) => m.StudentTaskPage)
  },
  comingSoon('academias', 'Academias', 'pi pi-graduation-cap', 'Sedes que agrupan a varios profesores. Pronto podrás conocerlas y unirte a una.'),
  { path: '**', redirectTo: '' }
];
