import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // El área privada depende de la cookie de sesión, que el servidor no conoce: se renderiza en el navegador
  { path: 'app', renderMode: RenderMode.Client },
  { path: 'app/**', renderMode: RenderMode.Client },
  { path: 'sala/**', renderMode: RenderMode.Client },
  // El catálogo cambia a cada rato (cupos, clases nuevas): se arma en el navegador con datos frescos
  { path: 'clases', renderMode: RenderMode.Client },
  { path: 'clases/**', renderMode: RenderMode.Client },
  // Los profes también: valoración, clases por dar y favoritos cambian a cada rato
  { path: 'profes', renderMode: RenderMode.Client },
  { path: 'profes/**', renderMode: RenderMode.Client },
  // Lo público se prerenderiza (HTML listo para buscadores y carga rápida)
  { path: '**', renderMode: RenderMode.Prerender }
];
