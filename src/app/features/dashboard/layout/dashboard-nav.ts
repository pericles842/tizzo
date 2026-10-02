import { UserRole } from '../../../core/auth/auth.models';

/** Opción del menú lateral del dashboard */
export interface DashboardNavItem {
  label: string;
  icon: string;
  route: string;
  /** Solo para estos roles (si se omite, la ven todos) */
  roles?: UserRole[];
  /** Contador opcional (ej. tareas pendientes) */
  badge?: number;
}

/** Menú del dashboard. "Profesores" (estudiante) y "Estudiantes" (profe) cambian según el rol. */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: 'Inicio', icon: 'pi pi-home', route: '/app' },
  { label: 'Perfil', icon: 'pi pi-id-card', route: '/app/perfil', roles: ['teacher'] },
  { label: 'Calendario', icon: 'pi pi-calendar', route: '/app/calendario' },
  { label: 'Certificados', icon: 'pi pi-verified', route: '/app/certificados' },
  { label: 'Profesores', icon: 'pi pi-user', route: '/app/profesores', roles: ['student'] },
  { label: 'Estudiantes', icon: 'pi pi-user', route: '/app/estudiantes', roles: ['teacher'] },
  { label: 'Comunidad', icon: 'pi pi-users', route: '/app/comunidad' },
  { label: 'Tareas', icon: 'pi pi-check-square', route: '/app/tareas', badge: 2 },
  { label: 'Academias', icon: 'pi pi-graduation-cap', route: '/app/academias' }
];

export function navForRole(role: UserRole | undefined): DashboardNavItem[] {
  return DASHBOARD_NAV.filter((item) => !item.roles || (role && item.roles.includes(role)));
}
