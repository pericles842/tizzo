import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Las peticiones al API viajan con credenciales para que el navegador mande la cookie
 * httpOnly de sesión (tizzo_session). El token nunca pasa por JavaScript.
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  return next(req.clone({ withCredentials: true }));
};
