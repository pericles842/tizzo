import { Component, computed, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { apiErrorMessage } from '../../../../../../core/http/api-error';
import { CourseCover } from '../../../../../../shared/course-cover/course-cover';
import { CourseDetail, EnrolledStudent } from '../../../../../../shared/course-detail/course-detail.models';
import { EnrolledList } from '../../../../../../shared/enrolled-list/enrolled-list';
import { CalendarSession } from '../../calendar.models';
import { formatRange } from '../../calendar.utils';
import { TeachingService } from '../../teaching.service';
import { CoursePreviewDialog } from '../course-preview-dialog/course-preview-dialog';

/**
 * Detalle de una clase del calendario: miniatura, datos, personas inscritas, "Vista previa" (cómo lo ve el
 * estudiante) y cancelar (con confirmación). Al abrirse trae el detalle completo de su clase suelta o curso.
 */
@Component({
  selector: 'app-session-dialog',
  imports: [Dialog, ButtonDirective, Tag, Message, ConfirmDialog, CourseCover, EnrolledList, CoursePreviewDialog],
  providers: [ConfirmationService],
  template: `
    <p-dialog header="Detalle de la clase" [(visible)]="visible" [modal]="true" [draggable]="false" [resizable]="false" [style]="{ width: '34rem', maxWidth: '95vw' }" [contentStyle]="{ maxHeight: '75vh' }" (onHide)="onHide()">
      @if (session(); as current) {
        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <app-course-cover [url]="detail()?.cover_url ?? current.cover_url" [isCourse]="current.kind === 'course'" [alt]="'Miniatura de ' + current.course_title" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p-tag [value]="current.kind === 'course' ? 'Curso' : 'Clase suelta'" [severity]="current.kind === 'course' ? 'info' : 'warn'" />
                @if (current.course_status === 'draft') {
                  <p-tag value="Borrador" severity="secondary" />
                }
              </div>
              <p class="mt-2 font-display text-lg font-semibold leading-snug text-tz-title">{{ current.title }}</p>
            </div>
          </div>

          <div class="space-y-1.5">
            @if (current.kind === 'course') {
              <p class="text-sm">Clase {{ current.session_number }} de {{ current.total_sessions }} del curso <strong class="text-tz-title">{{ current.course_title }}</strong></p>
            }
            <p class="flex items-center gap-2 text-sm"><i class="pi pi-clock" aria-hidden="true"></i> {{ when() }}</p>
            <p class="flex items-center gap-2 text-sm">
              <i class="pi pi-users" aria-hidden="true"></i>
              {{ current.kind === 'course' ? 'Máximo de integrantes del curso' : 'Máximo de integrantes' }}: {{ current.max_students }}
            </p>
            @if (current.course_status === 'draft') {
              <p class="tz-hint">Se publicará cuando el equipo de Tizzo apruebe tu perfil.</p>
            }
          </div>

          @if (loadError(); as message) {
            <p-message severity="error" role="alert">{{ message }}</p-message>
          } @else {
            <app-enrolled-list [students]="enrolled()" [max]="current.max_students" [loading]="loading()" />
          }

          @if (error(); as message) {
            <p-message severity="error" role="alert">{{ message }}</p-message>
          }
        </div>

        <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button pButton type="button" label="Vista previa" icon="pi pi-eye" severity="secondary" [outlined]="true" [disabled]="!detail()" (click)="previewOpen.set(true)"></button>
          @if (current.status === 'scheduled') {
            <button pButton type="button" label="Cancelar clase" icon="pi pi-times" severity="danger" [outlined]="true" [loading]="cancelling()" (click)="confirmCancel()"></button>
          }
        </div>
      }
    </p-dialog>
    <app-course-preview-dialog [(visible)]="previewOpen" [course]="detail()" />
    <p-confirmdialog acceptButtonStyleClass="p-button-danger" />
  `
})
export class SessionDialog {
  private readonly service = inject(TeachingService);
  private readonly confirmation = inject(ConfirmationService);

  readonly visible = model(false);
  readonly session = input<CalendarSession | null>(null);
  /** La clase se canceló: el calendario se actualiza */
  readonly cancelled = output<void>();

  protected readonly detail = signal<CourseDetail | null>(null);
  protected readonly enrolled = signal<EnrolledStudent[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly previewOpen = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly when = computed(() => {
    const current = this.session();
    return current ? formatRange(current.starts_at, current.ends_at) : '';
  });

  constructor() {
    // Al abrir el diálogo con una clase, trae el detalle de su clase suelta o curso (con los inscritos)
    effect(() => {
      const current = this.session();
      const open = this.visible();
      if (open && current) untracked(() => void this.load(current.course_uuid));
    });
  }

  private async load(courseUuid: string): Promise<void> {
    this.detail.set(null);
    this.enrolled.set([]);
    this.loadError.set(null);
    this.loading.set(true);
    try {
      const { course, enrolled } = await this.service.courseDetail(courseUuid);
      // Si mientras tanto se abrió otra clase, se descarta esta respuesta
      if (this.session()?.course_uuid !== courseUuid) return;
      this.detail.set(course);
      this.enrolled.set(enrolled);
    } catch (err) {
      if (this.session()?.course_uuid === courseUuid) this.loadError.set(apiErrorMessage(err));
    } finally {
      if (this.session()?.course_uuid === courseUuid) this.loading.set(false);
    }
  }

  protected onHide(): void {
    this.error.set(null);
    this.previewOpen.set(false);
  }

  protected confirmCancel(): void {
    const current = this.session();
    if (!current) return;
    const enrolled = this.enrolled().length;
    const message =
      current.kind === 'class'
        ? 'La clase se quitará de tu calendario y no se podrá reservar.'
        : 'Solo se cancela esta clase; el resto del curso sigue igual.';
    this.confirmation.confirm({
      header: '¿Cancelar esta clase?',
      message: enrolled ? `${message} Ya tiene ${enrolled} ${enrolled === 1 ? 'persona inscrita' : 'personas inscritas'}.` : message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      accept: () => void this.cancel(current)
    });
  }

  private async cancel(current: CalendarSession): Promise<void> {
    this.cancelling.set(true);
    this.error.set(null);
    try {
      await this.service.cancelSession(current.uuid);
      this.visible.set(false);
      this.cancelled.emit();
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.cancelling.set(false);
    }
  }
}
