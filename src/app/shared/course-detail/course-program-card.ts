import { Component, computed, input } from '@angular/core';
import { Card } from 'primeng/card';
import { CourseDetailSession } from './course-detail.models';
import { shortDate, timeLabel } from './course-detail.utils';

/** "Programa del curso": las clases numeradas con su fecha y duración */
@Component({
  selector: 'app-course-program-card',
  imports: [Card],
  template: `
    <p-card class="border border-tz-surface-border">
      <h2 class="font-display text-lg font-semibold">{{ heading() }}</h2>
      <ol class="mt-4 space-y-2.5">
        @for (session of visible(); track session.uuid) {
          <li class="rounded-xl bg-tz-soft px-4 py-3">
            <div class="flex items-center gap-3">
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-tz-card text-xs font-semibold text-tz-subtitle" aria-hidden="true">{{ session.number }}</span>
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-tz-title">{{ session.title }}</span>
              <span class="shrink-0 text-xs">{{ session.duration_min }} min</span>
            </div>
            <p class="mt-1 pl-9 text-xs">{{ date(session) }}</p>
            @if (session.description) {
              <p class="mt-1 pl-9 text-sm">{{ session.description }}</p>
            }
            @if (session.learning_points.length) {
              <ul class="mt-2 list-disc space-y-0.5 pl-14 pr-2 text-xs">
                @for (point of session.learning_points; track $index) {
                  <li>{{ point }}</li>
                }
              </ul>
            }
          </li>
        }
      </ol>
    </p-card>
  `,
  host: { class: 'block' }
})
export class CourseProgramCard {
  readonly sessions = input.required<CourseDetailSession[]>();
  readonly heading = input('Programa del curso');

  /** Sin las clases canceladas, en orden */
  protected readonly visible = computed(() => this.sessions().filter((s) => s.status !== 'cancelled').sort((a, b) => a.number - b.number));

  protected date(session: CourseDetailSession): string {
    return `${shortDate(session.starts_at)} · ${timeLabel(session.starts_at)}`;
  }
}
