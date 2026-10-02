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
  // Área privada (después de entrar). Por ahora solo la estructura del layout; el dashboard viene después.
  {
    path: 'app',
    loadComponent: () => import('./layouts/app-layout/app-layout').then((m) => m.AppLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Tizzo',
        loadComponent: () => import('./pages/app-home/app-home').then((m) => m.AppHome)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
