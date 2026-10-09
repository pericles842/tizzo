import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PendingReview, RateClass } from '../../../../shared/review/rate-class';
import { WidgetCard } from '../widget-card/widget-card';

/**
 * "Califica tus clases" (estudiante): las clases a las que asistió, ya terminaron y todavía no calificó. Si no hay
 * ninguna, el bloque no se muestra. Cada calificación mueve las estrellas del profe.
 */
@Component({
  selector: 'app-pending-reviews',
  imports: [RateClass, WidgetCard],
  template: `
    @if (items().length) {
      <app-widget-card heading="Califica tus clases">
        <ul class="divide-y divide-tz-line">
          @for (item of items(); track item.session_uuid) {
            <li class="py-4 first:pt-0 last:pb-0">
              <app-rate-class [sessionUuid]="item.session_uuid" [heading]="item.title + ' · Prof. ' + item.teacher_name" (rated)="done(item.session_uuid)" />
            </li>
          }
        </ul>
      </app-widget-card>
    }
  `,
  host: { class: 'block' }
})
export class PendingReviews implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly items = signal<PendingReview[]>([]);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    firstValueFrom(this.http.get<{ items: PendingReview[] }>(`${environment.apiUrl}/student/reviews/pending`))
      .then(({ items }) => this.items.set(items))
      .catch(() => undefined);
  }

  protected done(sessionUuid: string): void {
    this.items.update((list) => list.filter((item) => item.session_uuid !== sessionUuid));
  }
}
