import { Component, input } from '@angular/core';
import { Card } from 'primeng/card';
import { StatItem } from '../../data/dashboard.models';

/** Indicador: icono + número + etiqueta */
@Component({
  selector: 'app-stat-card',
  imports: [Card],
  template: `
    <p-card class="h-full border border-tz-surface-border">
      <div class="flex items-center gap-4">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true">
          <i [class]="stat().icon" class="text-lg"></i>
        </span>
        <p class="leading-tight">
          <span class="block font-display text-2xl font-semibold text-tz-title">{{ stat().value }}</span>
          <span class="text-sm">{{ stat().label }}</span>
        </p>
      </div>
    </p-card>
  `,
  host: { class: 'block' }
})
export class StatCard {
  readonly stat = input.required<StatItem>();
}
