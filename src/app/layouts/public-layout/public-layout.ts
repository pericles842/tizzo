import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderWeb } from '../../shared/header-web/header-web';
import { FooterWeb } from '../../shared/footer-web/footer-web';

/**
 * Layout del área pública: home, ingresar y registro.
 * El contenido va a ancho completo (las secciones del home pintan su fondo de borde a borde);
 * cada página usa `tz-container` para centrar su contenido.
 */
@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, HeaderWeb, FooterWeb],
  template: `
    <a
      href="#contenido"
      class="sr-only rounded-lg bg-tz-surface px-4 py-2 font-semibold text-tz-title focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >Saltar al contenido</a
    >
    <app-header-web />
    <main id="contenido" class="flex-1">
      <router-outlet />
    </main>
    <app-footer-web />
  `,
  host: { class: 'flex min-h-dvh flex-col' }
})
export class PublicLayout {}
