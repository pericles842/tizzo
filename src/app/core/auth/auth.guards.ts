import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Solo con sesión. Sin sesión manda a /ingresar y recuerda a dónde iba. */
export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSession();
  return auth.isAuthenticated() || router.createUrlTree(['/ingresar'], { queryParams: { redirect: state.url } });
};

/** Solo sin sesión (ingresar, registro). Con sesión manda al área privada. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ensureSession();
  return auth.isAuthenticated() ? router.createUrlTree(['/app']) : true;
};
