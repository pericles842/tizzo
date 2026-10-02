import { HttpErrorResponse } from '@angular/common/http';

/** Forma de error del API: { message, error, fields? } */
export interface ApiErrorBody {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

/** Mensaje legible para mostrar al usuario */
export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    const body = err.error as ApiErrorBody | null;
    if (body?.error) return body.error;
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

/** Errores por campo que devolvió el API (vacío si no hay) */
export function apiFieldErrors(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse) return (err.error as ApiErrorBody | null)?.fields ?? {};
  return {};
}
