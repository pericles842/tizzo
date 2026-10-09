import { Component, computed, input, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { CourseDetailSession } from './course-detail.models';
import { shortDate, timeLabel } from './course-detail.utils';

/** "Programa del curso": filas numeradas con título y duración; al abrirlas muestran fecha, descripción y lo que se verá */
@Component({
  selector: 'app-course-program-card',
  imports: [Card],
  template: `
    <p-card class="border border-tz-surface-border">
      <h2 class="font-display text-lg font-semibold">{{ heading() }}</h2>
      <ol class="mt-4 space-y-2.5">
        @for (session of visible(); track session.uuid) {
          <li class="rounded-2xl bg-tz-soft">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
              [attr.aria-expanded]="isOpen(session)"
              [attr.aria-controls]="'program-' + session.uuid"
              (click)="toggle(session)"
            >
              <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-tz-card text-sm font-semibold text-tz-subtitle" aria-hidden="true">{{ session.number }}</span>
              <span class="min-w-0 flex-1 truncate text-base font-medium text-tz-title">{{ session.title }}</span>
              <span class="shrink-0 text-sm">{{ session.duration_min }} min</span>
              <i class="pi pi-chevron-down shrink-0 text-xs transition-transform" [class.rotate-180]="isOpen(session)" aria-hidden="true"></i>
            </button>
            @if (isOpen(session)) {
              <div [id]="'program-' + session.uuid" class="space-y-4 px-4 pb-5 pl-4 sm:pl-15">
                <p class="inline-flex items-center gap-2 rounded-full bg-tz-card px-3 py-1 text-xs font-medium text-tz-subtitle">
                  <i class="pi pi-calendar-clock" aria-hidden="true"></i>{{ date(session) }}
                </p>
                @if (session.description) {
                  <p class="border-l-2 border-tz-subtitle/40 pl-3 text-sm leading-relaxed text-tz-title">{{ session.description }}</p>
                }
                @if (session.learning_points.length) {
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-tz-subtitle">Lo que verás en esta clase</p>
                    <ul class="mt-2 space-y-2">
                      @for (point of session.learning_points; track $index) {
                        <li class="flex items-start gap-2.5 rounded-xl bg-tz-card px-3 py-2 text-sm text-tz-title">
                          <i class="pi pi-check-circle mt-0.5 shrink-0 text-tz-subtitle" aria-hidden="true"></i>
                          <span class="min-w-0">{{ point }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
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

  /** Clases desplegadas (por uuid); todas empiezan cerradas */
  private readonly open = signal<ReadonlySet<string>>(new Set());

  protected isOpen(session: CourseDetailSession): boolean {
    return this.open().has(session.uuid);
  }

  protected toggle(session: CourseDetailSession): void {
    this.open.update((set) => {
      const next = new Set(set);
      if (!next.delete(session.uuid)) next.add(session.uuid);
      return next;
    });
  }

  protected date(session: CourseDetailSession): string {
    return `${shortDate(session.starts_at)} · ${timeLabel(session.starts_at)}`;
  }
}
