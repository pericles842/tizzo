import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { CourseDetail } from './course-detail.models';
import { DayGroup, capacityLabel, groupByDay, money, timeLabel, typicalDuration } from './course-detail.utils';

/** Cuántos días se muestran antes de "Ver todas" */
const VISIBLE_DAYS = 10;

/**
 * Tarjeta de reserva: precio, horario (día y hora de las clases), cupos, botón "Reservar" y lo que incluye.
 * Con `preview` el botón queda desactivado (el profe ve cómo se verá, pero no reserva). Con `enrolled` muestra que ya
 * está inscrito y el camino a su calendario. TEMPORAL: sin pasarela, reservar confirma al instante (docs/DECISIONES.md).
 */
@Component({
  selector: 'app-booking-card',
  imports: [ButtonDirective, Card, RouterLink],
  template: `
    <p-card class="border border-tz-surface-border">
      <p class="font-display text-3xl font-semibold text-tz-title">
        {{ price() }} <span class="font-sans text-sm font-normal">{{ course().kind === 'course' ? 'curso completo' : 'por clase' }}</span>
      </p>
      <p class="mt-1 text-xs">{{ priceDetail() }}</p>

      <h2 class="mt-5 text-sm font-semibold text-tz-title">{{ course().kind === 'course' ? 'Horario de las clases' : 'Fecha y hora' }}</h2>
      @if (days().length) {
        <ul class="mt-2 grid grid-cols-5 gap-2" aria-label="Días de clase">
          @for (day of shownDays(); track day.key) {
            <li>
              @if (day.key === selectedDay()?.key) {
                <button pButton type="button" class="!h-auto !w-full !px-0 !py-1.5" [attr.aria-pressed]="true" [attr.aria-label]="day.weekday + ' ' + day.day" (click)="selectDay(day)">
                  <span class="flex flex-col leading-tight"><span class="text-[0.7rem] capitalize">{{ day.weekday }}</span><span class="font-semibold">{{ day.day }}</span></span>
                </button>
              } @else {
                <button pButton type="button" severity="secondary" [outlined]="true" class="!h-auto !w-full !px-0 !py-1.5" [attr.aria-pressed]="false" [attr.aria-label]="day.weekday + ' ' + day.day" (click)="selectDay(day)">
                  <span class="flex flex-col leading-tight"><span class="text-[0.7rem] capitalize">{{ day.weekday }}</span><span class="font-semibold">{{ day.day }}</span></span>
                </button>
              }
            </li>
          }
        </ul>
        @if (days().length > visibleDays) {
          <button pButton type="button" [label]="showAll() ? 'Ver menos' : 'Ver las ' + days().length + ' fechas'" size="small" severity="secondary" [text]="true" class="mt-1" (click)="showAll.set(!showAll())"></button>
        }
        @if (selectedDay(); as day) {
          <ul class="mt-2 grid grid-cols-3 gap-2" aria-label="Horas de clase">
            @for (session of day.sessions; track session.uuid) {
              <li>
                <span class="flex h-9 items-center justify-center rounded-xl border border-tz-line text-sm font-medium text-tz-title">{{ time(session.starts_at) }}</span>
              </li>
            }
          </ul>
        }
      } @else {
        <p class="mt-2 text-sm">Aún no hay clases programadas.</p>
      }

      <p class="mt-4 flex items-center gap-2 rounded-xl bg-tz-soft px-3 py-2 text-xs font-medium text-tz-subtitle">
        <span class="size-2 shrink-0 rounded-full bg-tz-accent" aria-hidden="true"></span>{{ spotsLabel() }}
      </p>

      @if (enrolled()) {
        <p class="mt-4 flex items-center gap-2 text-sm font-semibold text-tz-title" role="status">
          <i class="pi pi-check-circle text-tz-subtitle" aria-hidden="true"></i> Ya estás inscrito
        </p>
        <a pButton routerLink="/app/calendario" class="mt-3 w-full" label="Ver en mi calendario" icon="pi pi-calendar"></a>
        <p class="mt-3 text-xs">Entra a la sala desde tu calendario. La sala abre 10 minutos antes de cada clase.</p>
      } @else {
        <button
          pButton
          type="button"
          class="mt-4 w-full"
          label="Reservar"
          [loading]="reserving()"
          [disabled]="preview() || soldOut() || !!blockedReason()"
          (click)="reserve.emit()"
        ></button>
        @if (preview()) {
          <p class="tz-hint text-center">Vista previa: la reserva no está disponible.</p>
        } @else if (blockedReason(); as reason) {
          <p class="tz-hint text-center">{{ reason }}</p>
        }
        <p class="mt-3 text-xs">Al reservar, la clase aparece en tu calendario y te enviamos el enlace de la sala por correo.</p>
      }

      <h2 class="mt-5 text-sm font-semibold text-tz-title">Incluye</h2>
      <ul class="mt-2 space-y-1.5 text-sm">
        @for (item of includes(); track item) {
          <li class="flex items-start gap-2"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-tz-subtitle" aria-hidden="true"></span>{{ item }}</li>
        }
      </ul>
    </p-card>
  `,
  host: { class: 'block' }
})
export class BookingCard {
  readonly course = input.required<CourseDetail>();
  /** Vista previa del profe: no se puede reservar */
  readonly preview = input(false);
  /** Ya tiene la reserva confirmada */
  readonly enrolled = input(false);
  /** La reserva se está enviando */
  readonly reserving = input(false);
  /** Por qué esta persona no puede reservar (ej. es una cuenta de profe); null = puede */
  readonly blockedReason = input<string | null>(null);
  readonly reserve = output<void>();

  protected readonly visibleDays = VISIBLE_DAYS;
  protected readonly showAll = signal(false);
  private readonly picked = signal<string | null>(null);

  protected readonly days = computed(() => groupByDay(this.course().sessions));
  protected readonly shownDays = computed(() => (this.showAll() ? this.days() : this.days().slice(0, VISIBLE_DAYS)));
  /** Día elegido; si no se eligió ninguno, el primero */
  protected readonly selectedDay = computed<DayGroup | null>(() => this.days().find((d) => d.key === this.picked()) ?? this.days()[0] ?? null);

  protected readonly price = computed(() => money(this.course().price, this.course().currency));
  protected readonly soldOut = computed(() => this.course().enrollment.spots_left <= 0);

  protected readonly priceDetail = computed(() => {
    const course = this.course();
    const sessions = course.sessions.filter((s) => s.status !== 'cancelled').length || course.total_sessions;
    if (course.kind === 'course') return `${sessions} clases en vivo · ${money(course.price / sessions, course.currency)} por clase`;
    const minutes = typicalDuration(course.sessions);
    return [minutes ? `${minutes} min` : null, capacityLabel(course)].filter(Boolean).join(' · ');
  });

  protected readonly spotsLabel = computed(() => {
    const { max_students, enrollment, modality, kind } = this.course();
    if (enrollment.spots_left <= 0) return 'Sin cupos disponibles';
    if (max_students === 1) return `${capacityLabel({ max_students, modality, kind })}`;
    return `Quedan ${enrollment.spots_left} ${enrollment.spots_left === 1 ? 'cupo' : 'cupos'} de ${max_students}`;
  });

  protected readonly includes = computed(() => {
    const course = this.course();
    const sessions = course.sessions.filter((s) => s.status !== 'cancelled').length || course.total_sessions;
    const items = [course.kind === 'course' ? `${sessions} clases en vivo por videollamada` : 'Clase en vivo por videollamada', 'Preguntas ilimitadas durante la clase'];
    if (course.gives_certificate) items.push(course.kind === 'course' ? 'Diploma al completar el curso' : 'Diploma al completar la clase');
    return items;
  });

  protected selectDay(day: DayGroup): void {
    this.picked.set(day.key);
  }

  protected time(iso: string): string {
    return timeLabel(iso);
  }
}
