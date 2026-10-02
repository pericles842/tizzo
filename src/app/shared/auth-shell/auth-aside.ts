import { Component, input } from '@angular/core';
import { Logo } from '../logo/logo';

/**
 * PARTE 1 del layout de autenticación: panel de marca (degradado, logo, título y ventajas).
 * El fondo es siempre el mismo; solo cambian `heading` y `description` según la pantalla o el paso.
 */
@Component({
  selector: 'app-auth-aside',
  imports: [Logo],
  template: `
    <aside class="tz-bg-gradient relative flex h-full flex-col overflow-hidden px-6 py-6 text-white sm:px-10 lg:px-12 lg:py-10">
      <!-- Círculos decorativos -->
      <span class="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 lg:size-96" aria-hidden="true"></span>
      <span class="pointer-events-none absolute -bottom-32 -left-24 hidden size-80 rounded-full bg-white/10 lg:block" aria-hidden="true"></span>

      <div class="relative">
        <app-logo [inverse]="true" />
      </div>

      <div class="relative mt-6 lg:my-auto">
        <h1 class="max-w-md text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-5xl" aria-live="polite">{{ heading() }}</h1>
        <p class="mt-3 max-w-md text-sm text-white/85 lg:mt-5 lg:text-base">{{ description() }}</p>
      </div>

      <ul class="relative mt-auto hidden space-y-3 text-sm text-white/90 lg:block" aria-label="Por qué Tizzo">
        @for (item of benefits; track item) {
          <li class="flex items-center gap-3"><span class="size-1.5 rounded-full bg-white" aria-hidden="true"></span>{{ item }}</li>
        }
      </ul>
    </aside>
  `,
  host: { class: 'block' }
})
export class AuthAside {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();

  protected readonly benefits = ['Clases 100% en vivo', 'Pagos seguros', 'Diploma al terminar'];
}
