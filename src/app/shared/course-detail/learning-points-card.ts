import { Component, input } from '@angular/core';
import { Card } from 'primeng/card';

/** Tarjeta con una lista de puntos con check, en dos columnas (por defecto, "Qué aprenderás") */
@Component({
  selector: 'app-learning-points-card',
  imports: [Card],
  template: `
    <p-card class="border border-tz-surface-border">
      <h2 class="font-display text-lg font-semibold">{{ heading() }}</h2>
      <ul class="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        @for (point of points(); track $index) {
          <li class="flex items-start gap-2.5 text-sm">
            <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="pi pi-check text-[0.65rem]"></i></span>
            <span>{{ point }}</span>
          </li>
        }
      </ul>
    </p-card>
  `,
  host: { class: 'block' }
})
export class LearningPointsCard {
  readonly points = input.required<string[]>();
  readonly heading = input('Qué aprenderás');
}
