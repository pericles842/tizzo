import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';

/** Layouts y páginas se cargan bajo demanda (loadComponent) para mantener chico el bundle inicial */
export const routes: Routes = [
  // Área pública con header y footer
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout').then((m) => m.PublicLayout),
    children: [
      {
        path: '',
        title: 'Tizzo · Clases en vivo con profes reales',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home)
      }
    ]
  },
  // Autenticación: pantalla completa con AuthShell (panel de marca + formulario), sin header ni footer
  {
    path: 'ingresar',
    title: 'Ingresar · Tizzo',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login)
  },
  {
    path: 'registro',
    title: 'Crear cuenta · Tizzo',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then((m) => m.Register)
  },
  // Dashboard (área privada, después de entrar): features/dashboard
  {
    path: 'app',
    loadComponent: () => import('./features/dashboard/layout/dashboard-layout').then((m) => m.DashboardLayout),
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
  },
  { path: '**', redirectTo: '' }
];
