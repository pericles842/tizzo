import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { ButtonDirective } from 'primeng/button';

/**
 * Sección del dashboard que todavía no existe. Se configura desde la ruta (data: pageTitle, icon, description)
 * gracias a withComponentInputBinding.
 */
@Component({
  selector: 'app-coming-soon',
  imports: [RouterLink, Card, ButtonDirective],
  template: `
    <p-card class="border border-tz-surface-border">
      <div class="flex flex-col items-center px-4 py-12 text-center">
        <span class="flex size-16 items-center justify-center rounded-2xl bg-tz-soft text-tz-subtitle" aria-hidden="true">
          <i [class]="icon()" class="text-2xl"></i>
        </span>
        <h2 class="mt-5 text-2xl font-semibold">{{ pageTitle() }}</h2>
        <p class="mt-2 max-w-md text-sm">{{ description() }}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-tz-subtitle">Próximamente</p>
        <a pButton routerLink="/app" label="Volver al inicio" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" class="mt-6"></a>
      </div>
    </p-card>
  `
})
export class ComingSoon {
  readonly pageTitle = input('Próximamente');
  readonly icon = input('pi pi-sparkles');
  readonly description = input('Estamos construyendo esta sección.');
}
