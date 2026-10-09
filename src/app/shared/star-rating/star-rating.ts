import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Rating } from 'primeng/rating';

/**
 * Estrellas de un profe (solo lectura): las 5 estrellas de PrimeNG (redondeadas), el número y cuántas reseñas tiene.
 * `stars` null = profe nuevo (todavía sin estrellas, ver la puntuación en tizzo.api/src/app/services/teacher_ranking.service.ts).
 */
@Component({
  selector: 'app-star-rating',
  imports: [FormsModule, Rating],
  template: `
    @if (stars() !== null) {
      <span class="inline-flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-tz-subtitle">
        <p-rating [ngModel]="rounded()" [readonly]="true" [stars]="5" [attr.aria-label]="label()" />
        <span aria-hidden="true">{{ value() }}</span>
        @if (count() > 0) {
          <span class="font-normal">· {{ count() }} {{ count() === 1 ? 'reseña' : 'reseñas' }}</span>
        }
      </span>
    } @else {
      <span class="text-xs font-medium text-tz-subtitle">Profe nuevo</span>
    }
  `
})
export class StarRating {
  readonly stars = input<number | null>(null);
  /** Cuántas reseñas tiene */
  readonly count = input(0);

  protected readonly rounded = computed(() => Math.round(this.stars() ?? 0));
  protected readonly value = computed(() => (this.stars() ?? 0).toFixed(1));
  protected readonly label = computed(() => `${this.value()} de 5 estrellas`);
}
