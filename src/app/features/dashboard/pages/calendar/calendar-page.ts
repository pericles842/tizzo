import { Component, OnInit, PLATFORM_ID, ViewEncapsulation, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { SelectButton } from 'primeng/selectbutton';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { CalendarSession, CreatedCourse, TeachingKind, TeachingTemplate } from './calendar.models';
import { nextFullHour, suggestedStart } from './calendar.utils';
import { ScheduleDialog } from './components/schedule-dialog/schedule-dialog';
import { SessionDialog } from './components/session-dialog/session-dialog';
import { TemplatesCard } from './components/templates-card/templates-card';
import { TeachingService } from './teaching.service';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'listWeek';

const VIEWS: { label: string; value: CalendarView }[] = [
  { label: 'Mes', value: 'dayGridMonth' },
  { label: 'Semana', value: 'timeGridWeek' },
  { label: 'Lista', value: 'listWeek' }
];

/**
 * "Calendario" del profe (FullCalendar). Al tocar un día pregunta si va a dictar una clase o un curso y abre el
 * formulario. Las clases se arrastran para cambiarles la hora y al tocarlas se ven (y se cancelan). Solo para profes.
 */
@Component({
  selector: 'app-calendar-page',
  imports: [FormsModule, FullCalendarModule, ButtonDirective, Card, Message, SelectButton, ScheduleDialog, SessionDialog, TemplatesCard],
  encapsulation: ViewEncapsulation.None,
  styleUrl: './calendar-page.css',
  template: `
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-display text-3xl font-semibold text-tz-title">Tu calendario</p>
        <p class="mt-1 text-sm">Toca un día para programar una clase o un curso. Arrastra una clase para cambiarle la hora.</p>
      </div>
      <button pButton type="button" label="Nueva clase o curso" icon="pi pi-plus" severity="warn" (click)="openSchedule(null)"></button>
    </header>

    @if (notice(); as message) {
      <p-message severity="success" styleClass="mb-4" role="status">{{ message }}</p-message>
    }
    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    <div class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <p-card class="border border-tz-surface-border">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-1">
            <button pButton type="button" icon="pi pi-chevron-left" severity="secondary" [text]="true" [rounded]="true" aria-label="Anterior" (click)="move('prev')"></button>
            <button pButton type="button" icon="pi pi-chevron-right" severity="secondary" [text]="true" [rounded]="true" aria-label="Siguiente" (click)="move('next')"></button>
            <button pButton type="button" label="Hoy" size="small" severity="secondary" [outlined]="true" class="ml-1" (click)="move('today')"></button>
          </div>
          <h2 class="order-first w-full text-lg font-semibold sm:order-none sm:w-auto" aria-live="polite">{{ title() }}</h2>
          <p-selectbutton
            [options]="views"
            optionLabel="label"
            optionValue="value"
            [allowEmpty]="false"
            [ngModel]="view()"
            (ngModelChange)="changeView($event)"
            size="small"
          />
        </div>

        <div class="tz-calendar" aria-label="Calendario de clases">
          <full-calendar #calendar [options]="options" />
        </div>

        <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Leyenda">
          <li class="flex items-center gap-2"><span class="tz-legend tz-legend-course" aria-hidden="true"></span> Clase de un curso</li>
          <li class="flex items-center gap-2"><span class="tz-legend tz-legend-class" aria-hidden="true"></span> Clase suelta</li>
        </ul>
      </p-card>

      <app-templates-card [templates]="templates()" (use)="openSchedule($event)" (remove)="deleteTemplate($event)" />
    </div>

    <app-schedule-dialog
      [(visible)]="scheduleOpen"
      [start]="scheduleStart()"
      [templates]="templates()"
      [template]="scheduleTemplate()"
      (created)="onCreated($event)"
      (templateCreated)="onTemplateCreated($event)"
    />
    <app-session-dialog [(visible)]="detailOpen" [session]="detail()" (cancelled)="onCancelled()" />
  `
})
export class CalendarPage implements OnInit {
  private readonly service = inject(TeachingService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly calendar = viewChild(FullCalendarComponent);

  protected readonly views = VIEWS;
  protected readonly view = signal<CalendarView>('dayGridMonth');
  protected readonly title = signal('');
  protected readonly templates = signal<TeachingTemplate[]>([]);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly scheduleOpen = signal(false);
  protected readonly scheduleStart = signal(nextFullHour());
  protected readonly scheduleTemplate = signal<TeachingTemplate | null>(null);

  protected readonly detailOpen = signal(false);
  protected readonly detail = signal<CalendarSession | null>(null);

  protected readonly options: CalendarOptions = this.buildOptions();

  ngOnInit(): void {
    // Esta página solo se renderiza en el navegador (la sesión vive en una cookie que el servidor no ve)
    if (this.isBrowser) void this.loadTemplates();
  }

  private buildOptions(): CalendarOptions {
    return {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      locale: esLocale,
      initialView: this.view(),
      // La barra es nuestra (botones de PrimeNG); FullCalendar solo dibuja la cuadrícula
      headerToolbar: false,
      height: 'auto',
      firstDay: 1,
      nowIndicator: true,
      allDaySlot: false,
      slotMinTime: '06:00:00',
      slotMaxTime: '24:00:00',
      scrollTime: '08:00:00',
      slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      dayMaxEvents: 3,
      // En el mes las clases se ven como bloques (con su franja de color), no como puntos
      eventDisplay: 'block',
      views: { dayGridMonth: { displayEventTime: false } },
      editable: true,
      eventDurationEditable: false,
      // Una clase no se puede arrastrar al pasado
      eventAllow: (drop) => !!drop.start && drop.start.getTime() > Date.now(),
      noEventsText: 'No tienes clases programadas en estas fechas.',
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
        // "octubre de 2026" -> "Octubre de 2026"
        this.title.set(arg.view.title.charAt(0).toUpperCase() + arg.view.title.slice(1));
        this.view.set(arg.view.type as CalendarView);
      },
      dateClick: (arg) => this.onDateClick(arg),
      eventClick: (arg) => this.onEventClick(arg),
      eventDrop: (arg) => {
        const session = arg.event.extendedProps['session'] as CalendarSession;
        this.error.set(null);
        this.service.moveSession(session.uuid, arg.event.start as Date).catch((err) => {
          arg.revert();
          this.error.set(apiErrorMessage(err));
        });
      }
    };
  }

  private toEvent(session: CalendarSession): EventInput {
    const editable = session.status === 'scheduled' && new Date(session.starts_at).getTime() > Date.now();
    return {
      id: session.uuid,
      title: session.title,
      start: session.starts_at,
      end: session.ends_at,
      editable,
      classNames: [session.kind === 'course' ? 'tz-event-course' : 'tz-event-class', ...(session.course_status === 'draft' ? ['tz-event-draft'] : [])],
      extendedProps: { session }
    };
  }

  // ---------- Barra del calendario ----------

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

  // ---------- Programar ----------

  private onDateClick(arg: DateClickArg): void {
    this.notice.set(null);
    const start = suggestedStart(arg.date, !arg.allDay);
    if (!start) {
      this.error.set('Elige un día y una hora que todavía no hayan pasado.');
      return;
    }
    this.error.set(null);
    this.openSchedule(null, start);
  }

  protected openSchedule(template: TeachingTemplate | null, start: Date = nextFullHour()): void {
    this.notice.set(null);
    this.scheduleStart.set(start);
    this.scheduleTemplate.set(template);
    this.scheduleOpen.set(true);
  }

  protected onCreated(created: CreatedCourse & { kind: TeachingKind }): void {
    const what = created.kind === 'course' ? 'El curso' : 'La clase';
    this.notice.set(
      created.status === 'draft'
        ? `${what} quedó programada. Se publicará cuando el equipo de Tizzo apruebe tu perfil.`
        : `${what} quedó programada y publicada.`
    );
    // Lo creado queda; solo se avisa si la miniatura no se pudo subir
    this.error.set(created.coverFailed ? `${what} se programó, pero no se pudo subir la miniatura. Puedes intentarlo de nuevo más adelante.` : null);
    this.calendar()?.getApi().refetchEvents();
  }

  protected onTemplateCreated(template: TeachingTemplate): void {
    this.templates.update((list) => [template, ...list]);
  }

  // ---------- Detalle y cancelación ----------

  private onEventClick(arg: EventClickArg): void {
    this.detail.set(arg.event.extendedProps['session'] as CalendarSession);
    this.detailOpen.set(true);
  }

  protected onCancelled(): void {
    this.notice.set('La clase se canceló.');
    this.calendar()?.getApi().refetchEvents();
  }

  // ---------- Plantillas ----------

  private async loadTemplates(): Promise<void> {
    try {
      this.templates.set(await this.service.templates());
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    }
  }

  protected async deleteTemplate(template: TeachingTemplate): Promise<void> {
    try {
      await this.service.deleteTemplate(template.uuid);
      this.templates.update((list) => list.filter((item) => item.uuid !== template.uuid));
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    }
  }
}

