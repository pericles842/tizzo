import { Component, computed, input, model } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { Tag } from 'primeng/tag';
import { ClassJoinBar } from '../../../../shared/class-join/class-join-bar';
import { CourseCover } from '../../../../shared/course-cover/course-cover';
import { formatRange, formatDuration, minutesBetween } from '../calendar/calendar.utils';
import { StudentSession } from './student-calendar.service';

/**
 * Lo que ve el estudiante al tocar una de sus clases: qué clase es, quién la da, cuándo, si está en vivo y el botón
 * "Entrar a la sala" (activo desde 10 minutos antes hasta el fin).
 */
@Component({
  selector: 'app-class-info-dialog',
  imports: [Dialog, Tag, ClassJoinBar, CourseCover],
  template: `
    <p-dialog header="Tu clase" [(visible)]="visible" [modal]="true" [draggable]="false" [resizable]="false" [style]="{ width: '32rem', maxWidth: '95vw' }">
      @if (session(); as current) {
        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <app-course-cover [url]="current.cover_url" [isCourse]="current.kind === 'course'" [alt]="'Miniatura de ' + current.course_title" />
            <div class="min-w-0 flex-1">
              <p-tag [value]="current.kind === 'course' ? 'Curso' : 'Clase suelta'" [severity]="current.kind === 'course' ? 'info' : 'warn'" />
              <p class="mt-2 font-display text-lg font-semibold leading-snug text-tz-title">{{ current.title }}</p>
            </div>
          </div>

          <div class="space-y-1.5 text-sm">
            @if (current.kind === 'course') {
              <p>Clase {{ current.session_number }} de {{ current.total_sessions }} del curso <strong class="text-tz-title">{{ current.course_title }}</strong></p>
            }
            <p class="flex items-center gap-2"><i class="pi pi-clock" aria-hidden="true"></i> {{ when() }} · {{ duration() }}</p>
            @if (current.teacher_name) {
              <p class="flex items-center gap-2"><i class="pi pi-user" aria-hidden="true"></i> Con {{ current.teacher_name }}</p>
            }
          </div>

          @if (current.status !== 'cancelled') {
            <app-class-join-bar [startsAt]="current.starts_at" [endsAt]="current.ends_at" [courseUuid]="current.course_uuid" />
          }
        </div>
      }
    </p-dialog>
  `
})
export class ClassInfoDialog {
  readonly visible = model(false);
  readonly session = input<StudentSession | null>(null);

  protected readonly when = computed(() => {
    const current = this.session();
    return current ? formatRange(current.starts_at, current.ends_at) : '';
  });
  protected readonly duration = computed(() => {
    const current = this.session();
    return current ? formatDuration(minutesBetween(new Date(current.starts_at), new Date(current.ends_at))) : '';
  });
}
