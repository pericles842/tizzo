import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El área privada depende de la cookie de sesión, que el servidor no conoce: se renderiza en el navegador
  { path: 'app', renderMode: RenderMode.Client },
  { path: 'app/**', renderMode: RenderMode.Client },
  // Lo público se prerenderiza (HTML listo para buscadores y carga rápida)
  { path: '**', renderMode: RenderMode.Prerender }
];
