import { UserRole } from '../../../core/auth/auth.models';

/** Opción del menú lateral del dashboard */
export interface DashboardNavItem {
  label: string;
  icon: string;
  route: string;
  /** Solo para estos roles (si se omite, la ven todos) */
  roles?: UserRole[];
  /** Contador opcional (lo calcula el menú lateral) */
  badge?: number;
}

/**
 * Menú del dashboard. "Profesores", "Comunidad" y "Academias" son solo del estudiante; el profe no las ve. El número de
 * "Tareas" (pendientes por entregar) lo pone el menú lateral y solo para el estudiante.
 */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  { label: 'Inicio', icon: 'pi pi-home', route: '/app' },
  { label: 'Perfil', icon: 'pi pi-id-card', route: '/app/perfil' },
  { label: 'Calendario', icon: 'pi pi-calendar', route: '/app/calendario' },
  { label: 'Certificados', icon: 'pi pi-verified', route: '/app/certificados' },
  { label: 'Profesores', icon: 'pi pi-user', route: '/app/profesores', roles: ['student'] },
  { label: 'Comunidad', icon: 'pi pi-users', route: '/app/comunidad', roles: ['student'] },
  { label: 'Tareas', icon: 'pi pi-check-square', route: '/app/tareas' },
  { label: 'Academias', icon: 'pi pi-graduation-cap', route: '/app/academias', roles: ['student'] }
];

export function navForRole(role: UserRole | undefined): DashboardNavItem[] {
  return DASHBOARD_NAV.filter((item) => !item.roles || (role && item.roles.includes(role)));
}
