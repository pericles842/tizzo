import { Component, computed, input } from '@angular/core';
import { Badge } from 'primeng/badge';
import { Tag } from 'primeng/tag';
import { AUDIENCE_TAG } from '../../core/auth/age';
import { CourseCover } from '../course-cover/course-cover';
import { CourseDetail } from './course-detail.models';
import { nextClassLabel, nextSession, typicalDuration } from './course-detail.utils';

/**
 * Cabecera del detalle: miniatura, etiquetas (categoría o tipo), aviso de la próxima clase, título, descripción
 * y una línea con calificación, cantidad de clases, duración y diploma.
 */
@Component({
  selector: 'app-course-hero',
  imports: [Badge, Tag, CourseCover],
  template: `
    @if (course().cover_url) {
      <app-course-cover class="mb-5" variant="banner" [url]="course().cover_url" [alt]="'Miniatura de ' + course().title" />
    }
    <div class="flex flex-wrap items-center gap-2">
      <p-tag [value]="course().category ?? kindLabel()" severity="secondary" />
      @if (audienceTag[course().audience]; as label) {
        <p-tag [value]="label" icon="pi pi-shield" severity="warn" />
      }
      @if (next(); as label) {
        <p-badge [value]="'PRÓXIMA CLASE ' + label" severity="danger" />
      }
    </div>
    <h1 class="mt-3 font-display text-3xl font-semibold text-tz-title">{{ course().title }}</h1>
    <p class="mt-3 max-w-3xl whitespace-pre-line">{{ course().description }}</p>
    <ul class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label="Resumen">
      @if (course().teacher.rating_count > 0) {
        <li class="flex items-center gap-1"><i class="pi pi-star-fill text-xs text-tz-subtitle" aria-hidden="true"></i> {{ course().teacher.rating_avg.toFixed(1) }} ({{ course().teacher.rating_count }} reseñas)</li>
      }
      <li>{{ sessionsLabel() }}@if (duration(); as minutes) { · {{ minutes }} min }</li>
      @if (course().gives_certificate) {
        <li>Incluye diploma</li>
      }
    </ul>
  `,
  host: { class: 'block' }
})
export class CourseHero {
  protected readonly audienceTag = AUDIENCE_TAG;
  readonly course = input.required<CourseDetail>();
  /** Momento de referencia para "próxima clase" (se puede fijar en pruebas) */
  readonly now = input<Date>(new Date());

  protected readonly kindLabel = computed(() => (this.course().kind === 'course' ? 'Curso' : 'Clase'));
  protected readonly duration = computed(() => typicalDuration(this.course().sessions));
  protected readonly sessionsLabel = computed(() => {
    const total = this.course().sessions.length || this.course().total_sessions;
    return this.course().kind === 'course' ? `${total} sesiones` : '1 sesión';
  });
  protected readonly next = computed(() => {
    const session = nextSession(this.course().sessions, this.now());
    return session ? nextClassLabel(session, this.now()) : null;
  });
}
