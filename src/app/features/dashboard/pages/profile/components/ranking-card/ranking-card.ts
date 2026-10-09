import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProgressBar } from 'primeng/progressbar';
import { environment } from '../../../../../../../environments/environment';
import { StarRating } from '../../../../../../shared/star-rating/star-rating';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';

type ComponentKey = 'rating' | 'successfulClasses' | 'completedClasses' | 'favorites' | 'attendance' | 'repeatStudents';

interface RankingResponse {
  score: number;
  stars: number | null;
  components: Record<ComponentKey, { value: number; weight: number; points: number }>;
  metrics: { reviewCount: number; completedClasses: number };
  rules: { min_completed_classes_for_stars: number };
}

/** Cómo se llama cada componente de la puntuación y qué significa (en lenguaje del profe) */
const LABELS: Record<ComponentKey, { name: string; hint: string }> = {
  rating: { name: 'Calificación de tus estudiantes', hint: 'Lo que más pesa: las estrellas que te dan al terminar cada clase.' },
  successfulClasses: { name: 'Clases dictadas', hint: 'Clases que diste de verdad frente a las que cancelaste.' },
  completedClasses: { name: 'Experiencia', hint: 'Cuántas clases has dictado en Tizzo.' },
  favorites: { name: 'Favoritos', hint: 'Estudiantes que te tienen en su lista de favoritos.' },
  attendance: { name: 'Asistencia', hint: 'De los inscritos, cuántos se conectan a tus clases.' },
  repeatStudents: { name: 'Estudiantes que vuelven', hint: 'Estudiantes que toman otra clase contigo.' }
};

/**
 * "Tu puntuación" (profe): sus estrellas y de dónde salen. El cálculo vive en el API
 * (tizzo.api/src/app/services/teacher_ranking.service.ts); aquí solo se muestra.
 */
@Component({
  selector: 'app-ranking-card',
  imports: [ProgressBar, StarRating, WidgetCard],
  template: `
    <app-widget-card heading="Tu puntuación">
      @if (data(); as ranking) {
        <div class="flex flex-wrap items-center gap-3">
          <p class="font-display text-4xl font-semibold text-tz-title">{{ ranking.stars !== null ? ranking.stars.toFixed(1) : '—' }}</p>
          <app-star-rating [stars]="ranking.stars" [count]="ranking.metrics.reviewCount" />
        </div>
        @if (ranking.stars === null) {
          <p class="mt-2 text-sm">Aparecerás como "Profe nuevo" hasta que dictes {{ ranking.rules.min_completed_classes_for_stars }} clases ({{ ranking.metrics.completedClasses }} hasta ahora).</p>
        }
        <ul class="mt-4 space-y-3">
          @for (item of items(); track item.key) {
            <li>
              <div class="flex items-baseline justify-between gap-3 text-sm">
                <span class="font-medium text-tz-title">{{ item.name }}</span>
                <span class="text-xs">{{ item.percent }}%</span>
              </div>
              <p-progressbar [value]="item.percent" [showValue]="false" class="mt-1 block h-1.5" [attr.aria-label]="item.name + ': ' + item.percent + '%'" />
              <p class="mt-1 text-xs">{{ item.hint }}</p>
            </li>
          }
        </ul>
      } @else if (failed()) {
        <p class="text-sm">No pudimos calcular tu puntuación ahora. Intenta de nuevo más tarde.</p>
      } @else {
        <p class="text-sm">Calculando…</p>
      }
    </app-widget-card>
  `,
  host: { class: 'block' }
})
export class RankingCard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<RankingResponse | null>(null);
  protected readonly failed = signal(false);

  protected readonly items = computed(() => {
    const ranking = this.data();
    if (!ranking) return [];
    return (Object.keys(LABELS) as ComponentKey[]).map((key) => ({
      key,
      ...LABELS[key],
      percent: Math.round(ranking.components[key].value * 100)
    }));
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    firstValueFrom(this.http.get<RankingResponse>(`${environment.apiUrl}/teacher/ranking`))
      .then((ranking) => this.data.set(ranking))
      .catch(() => this.failed.set(true));
  }
}
