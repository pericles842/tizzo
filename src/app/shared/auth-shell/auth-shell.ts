import { Component, input } from '@angular/core';
import { AuthAside } from './auth-aside';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

/**
 * Layout de autenticación (ingresar, registro) = PARTE 1 + PARTE 2.
 * - Parte 1 (`app-auth-aside`): panel de marca; solo cambia el texto (`heading`, `description`).
 * - Parte 2: el contenido de la página. Slot `[authTop]` para el enlace de arriba a la derecha
 *   ("¿Ya tienes cuenta? Entrar"); el contenido normal va al centro.
 * En móvil la parte 1 se vuelve una banda compacta arriba.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [AuthAside, ThemeToggle],
  template: `
    <div class="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <app-auth-aside class="lg:sticky lg:top-0 lg:h-dvh" [heading]="heading()" [description]="description()" />

      <div class="flex min-h-full flex-col bg-tz-surface">
        <div class="flex items-center justify-end gap-3 px-5 pt-5 text-sm sm:px-8">
          <ng-content select="[authTop]" />
          <app-theme-toggle />
        </div>
        <main id="contenido" class="flex flex-1 items-start justify-center px-5 pb-12 pt-6 sm:px-8 lg:items-center lg:pt-0">
          <div class="w-full max-w-md">
            <ng-content />
          </div>
        </main>
      </div>
    </div>
  `
})
export class AuthShell {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
}
