import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { ButtonDirective } from 'primeng/button';

/**
 * Marco común de los bloques del dashboard (p-card): título, enlace de acción opcional
 * ("Ver todos") y el contenido proyectado.
 */
@Component({
  selector: 'app-widget-card',
  imports: [RouterLink, Card, ButtonDirective],
  template: `
    <p-card class="h-full border border-tz-surface-border" [attr.aria-labelledby]="headingId">
      <div class="flex items-center justify-between gap-3">
        <h2 [id]="headingId" class="text-lg font-semibold">{{ heading() }}</h2>
        @if (actionLabel(); as label) {
          <a pButton [routerLink]="actionRoute()" [label]="label" size="small" [text]="true" class="-mr-2 shrink-0"></a>
        }
      </div>
      <div class="mt-4">
        <ng-content />
      </div>
    </p-card>
  `,
  host: { class: 'block h-full' }
})
export class WidgetCard {
  private static nextId = 0;

  readonly heading = input.required<string>();
  readonly actionLabel = input<string>();
  readonly actionRoute = input<string>();

  protected readonly headingId = `widget-${++WidgetCard.nextId}`;
}
