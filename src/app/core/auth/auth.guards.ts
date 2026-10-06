import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Solo con sesión. Sin sesión manda a /ingresar y recuerda a dónde iba. */
export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSession();
  return auth.isAuthenticated() || router.createUrlTree(['/ingresar'], { queryParams: { redirect: state.url } });
};

/** Solo profes. Un estudiante que entre por URL vuelve al inicio del dashboard. Usar después de authGuard. */
export const teacherGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSession();
  return auth.user()?.role === 'teacher' || router.createUrlTree(['/app']);
};

/** Solo estudiantes (favoritos). Un profe que entre por URL vuelve al inicio del dashboard. Usar después de authGuard. */
export const studentGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSession();
  return auth.user()?.role === 'student' || router.createUrlTree(['/app']);
};

/**
 * Para elegir entre dos pantallas con la misma ruta según el rol: la primera ruta que lo use solo coincide con
 * profes y las demás (por ejemplo "Próximamente" de estudiantes) siguen de largo. Usar después de authGuard.
 */
export const teacherMatch: CanMatchFn = async () => {
  const auth = inject(AuthService);

  await auth.ensureSession();
  return auth.user()?.role === 'teacher';
};

/** Solo sin sesión (ingresar, registro). Con sesión manda al área privada. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSession();
  return auth.isAuthenticated() ? router.createUrlTree(['/app']) : true;
};
