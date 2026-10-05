import { Component, DestroyRef, OnInit, PLATFORM_ID, ViewEncapsulation, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { SelectButton } from 'primeng/selectbutton';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { LIVE_REFRESH_MS, liveEventContent, phaseClassNames, refreshLivePhases } from '../calendar/live-events';
import { ClassInfoDialog } from './class-info-dialog';
import { StudentCalendarService, StudentSession } from './student-calendar.service';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'listWeek';

const VIEWS: { label: string; value: CalendarView }[] = [
  { label: 'Mes', value: 'dayGridMonth' },
  { label: 'Semana', value: 'timeGridWeek' },
  { label: 'Lista', value: 'listWeek' }
];

/**
 * "Calendario" del estudiante: solo lectura. Muestra las clases de sus reservas (clases sueltas y cursos); al tocar
 * una se abre un diálogo con la información, si está en vivo y "Entrar a la sala". Usa los estilos de calendar-page.css.
 */
@Component({
  selector: 'app-student-calendar-page',
  imports: [FormsModule, RouterLink, FullCalendarModule, ButtonDirective, Card, Message, SelectButton, ClassInfoDialog],
  encapsulation: ViewEncapsulation.None,
  styleUrl: '../calendar/calendar-page.css',
  template: `
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-display text-3xl font-semibold text-tz-title">Tus clases</p>
        <p class="mt-1 text-sm">Toca una clase para ver sus datos y entrar a la sala. La sala abre 10 minutos antes.</p>
      </div>
      <a pButton routerLink="/clases" label="Buscar clases" icon="pi pi-search" severity="secondary" [outlined]="true"></a>
    </header>

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    <p-card class="border border-tz-surface-border">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-1">
          <button pButton type="button" icon="pi pi-chevron-left" severity="secondary" [text]="true" [rounded]="true" aria-label="Anterior" (click)="move('prev')"></button>
          <button pButton type="button" icon="pi pi-chevron-right" severity="secondary" [text]="true" [rounded]="true" aria-label="Siguiente" (click)="move('next')"></button>
          <button pButton type="button" label="Hoy" size="small" severity="secondary" [outlined]="true" class="ml-1" (click)="move('today')"></button>
        </div>
        <h2 class="order-first w-full text-lg font-semibold sm:order-none sm:w-auto" aria-live="polite">{{ title() }}</h2>
        <p-selectbutton [options]="views" optionLabel="label" optionValue="value" [allowEmpty]="false" [ngModel]="view()" (ngModelChange)="changeView($event)" size="small" />
      </div>

      <div class="tz-calendar" aria-label="Calendario de tus clases">
        <full-calendar #calendar [options]="options" />
      </div>

      <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Leyenda">
        <li class="flex items-center gap-2"><span class="tz-legend tz-legend-course" aria-hidden="true"></span> Clase de un curso</li>
        <li class="flex items-center gap-2"><span class="tz-legend tz-legend-class" aria-hidden="true"></span> Clase suelta</li>
        <li class="flex items-center gap-2"><span class="tz-legend tz-legend-live" aria-hidden="true"></span> En vivo ahora</li>
      </ul>
    </p-card>

    <app-class-info-dialog [(visible)]="detailOpen" [session]="detail()" />
  `
})
export class StudentCalendarPage implements OnInit {
  private readonly service = inject(StudentCalendarService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly calendar = viewChild(FullCalendarComponent);

  protected readonly views = VIEWS;
  protected readonly view = signal<CalendarView>('dayGridMonth');
  protected readonly title = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly detailOpen = signal(false);
  protected readonly detail = signal<StudentSession | null>(null);

  protected readonly options: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
    locale: esLocale,
    initialView: 'dayGridMonth',
    headerToolbar: false,
    height: 'auto',
    firstDay: 1,
    nowIndicator: true,
    allDaySlot: false,
    slotMinTime: '06:00:00',
    slotMaxTime: '24:00:00',
    scrollTime: '08:00:00',
    slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', hour12: true },
    dayMaxEvents: 3,
    eventDisplay: 'block',
    eventContent: liveEventContent,
    views: { dayGridMonth: { displayEventTime: false } },
    // Solo lectura: el estudiante no mueve ni crea clases
    editable: false,
    noEventsText: 'No tienes clases en estas fechas.',
    events: (info, success, failure) => {
      this.service
        .sessions(info.start, info.end)
        .then((sessions) => success(sessions.map((session) => this.toEvent(session))))
        .catch((err) => {
          this.error.set(apiErrorMessage(err));
          failure(err);
        });
    },
    datesSet: (arg) => {
      this.title.set(arg.view.title.charAt(0).toUpperCase() + arg.view.title.slice(1));
      this.view.set(arg.view.type as CalendarView);
    },
    eventClick: (arg: EventClickArg) => {
      this.detail.set(arg.event.extendedProps['session'] as StudentSession);
      this.detailOpen.set(true);
    }
  };

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const timer = setInterval(() => refreshLivePhases(this.calendar()?.getApi(), (s) => this.baseClasses(s as StudentSession)), LIVE_REFRESH_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private baseClasses(session: StudentSession): string[] {
    return [session.kind === 'course' ? 'tz-event-course' : 'tz-event-class'];
  }

  private toEvent(session: StudentSession): EventInput {
    return {
      id: session.uuid,
      title: session.title,
      start: session.starts_at,
      end: session.ends_at,
      classNames: [...this.baseClasses(session), ...phaseClassNames(session)],
      extendedProps: { session }
    };
  }

  protected move(action: 'prev' | 'next' | 'today'): void {
    const api = this.calendar()?.getApi();
    if (action === 'prev') api?.prev();
    else if (action === 'next') api?.next();
    else api?.today();
  }

  protected changeView(view: CalendarView): void {
    this.view.set(view);
    this.calendar()?.getApi().changeView(view);
  }
}
