import { Component, ElementRef, afterNextRender, computed, input, viewChild } from '@angular/core';
import { WeekDay } from '../../data/dashboard.models';
import { WidgetCard } from '../widget-card/widget-card';

const DAY_NAME = new Intl.DateTimeFormat('es', { weekday: 'short' });
const DAY_MONTH = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
const FULL_DATE = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });

/** "Esta semana": los 7 días (hoy resaltado) con las clases de cada día */
@Component({
  selector: 'app-week-calendar',
  imports: [WidgetCard],
  template: `
    <app-widget-card heading="Esta semana" [actionLabel]="range() + ' · Ver calendario'" actionRoute="/app/calendario">
      <!-- En pantallas chicas cada día conserva su ancho y la semana se desplaza de lado -->
      <ol #daysList class="-mx-1 grid grid-cols-[repeat(7,minmax(4.75rem,1fr))] gap-2 overflow-x-auto px-1 pb-2" tabindex="0" aria-label="Días de la semana">
        @for (day of days(); track day.key) {
          <li [attr.aria-label]="day.fullLabel" [attr.aria-current]="day.isToday ? 'date' : null">
            <div
              class="rounded-xl border px-1 py-2 text-center"
              [class]="day.isToday ? 'border-transparent tz-bg-gradient text-white' : 'border-tz-line bg-tz-soft text-tz-title'"
            >
              <span class="block text-xs" [class.text-white]="day.isToday">{{ day.label }}</span>
              <span class="block font-display text-lg font-semibold" [class.text-white]="day.isToday">{{ day.number }}</span>
            </div>

            <ul class="mt-2 space-y-2">
              @for (event of day.events; track event.title + event.time) {
                <li
                  class="rounded-lg border px-2 py-1.5 text-xs"
                  [class]="
                    event.status === 'live'
                      ? 'border-tz-live bg-tz-surface'
                      : event.status === 'completed'
                        ? 'border-transparent bg-tz-soft opacity-70'
                        : 'border-transparent bg-tz-soft'
                  "
                >
                  <span class="block font-semibold text-tz-title">{{ event.title }}</span>
                  <span class="block">{{ event.time }}</span>
                  @if (event.note) {
                    <span class="block font-semibold" [class.text-tz-live]="event.status === 'live'">{{ event.note }}</span>
                  }
                </li>
              }
            </ul>
          </li>
        }
      </ol>
    </app-widget-card>
  `,
  host: { class: 'block h-full' }
})
export class WeekCalendar {
  readonly week = input.required<WeekDay[]>();
  private readonly daysList = viewChild<ElementRef<HTMLElement>>('daysList');

  constructor() {
    // En pantallas chicas la semana se desplaza de lado: arranca mostrando el día de hoy
    afterNextRender(() => {
      const list = this.daysList()?.nativeElement;
      const today = list?.querySelector<HTMLElement>('[aria-current="date"]');
      if (list && today && list.scrollWidth > list.clientWidth) {
        list.scrollLeft = today.offsetLeft - list.clientWidth / 2 + today.offsetWidth / 2;
      }
    });
  }

  protected readonly days = computed(() =>
    this.week().map((day) => ({
      ...day,
      key: day.date.toISOString(),
      label: `${capitalize(DAY_NAME.format(day.date).replace('.', ''))}${day.isToday ? ' · hoy' : ''}`,
      number: day.date.getDate(),
      fullLabel: `${FULL_DATE.format(day.date)}${day.isToday ? ' (hoy)' : ''}: ${day.events.length ? day.events.map((e) => `${e.title} ${e.time}`).join(', ') : 'sin clases'}`
    }))
  );

  /** "28 sep – 4 oct" */
  protected readonly range = computed(() => {
    const week = this.week();
    if (!week.length) return '';
    return `${DAY_MONTH.format(week[0].date).replace('.', '')} – ${DAY_MONTH.format(week[week.length - 1].date).replace('.', '')}`;
  });
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
