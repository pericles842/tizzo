import { Component, input, model } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { CourseDetail } from '../../../../../../shared/course-detail/course-detail.models';
import { CourseDetailView } from '../../../../../../shared/course-detail/course-detail-view';

/** Vista previa a pantalla grande: así verán los estudiantes la clase o el curso (sin poder reservar) */
@Component({
  selector: 'app-course-preview-dialog',
  imports: [Dialog, Message, CourseDetailView],
  template: `
    <p-dialog
      header="Vista previa"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [maximizable]="true"
      [dismissableMask]="true"
      [style]="{ width: '74rem', maxWidth: '96vw' }"
      [contentStyle]="{ maxHeight: '80vh' }"
    >
      @if (course(); as current) {
        <p-message severity="info" styleClass="mb-4" role="status">
          Así lo verán tus estudiantes@if (current.status === 'draft') { cuando se publique }. Desde aquí no se puede reservar.
        </p-message>
        <div class="rounded-2xl bg-tz-section p-4 sm:p-5">
          <app-course-detail-view [course]="current" [preview]="true" />
        </div>
      }
    </p-dialog>
  `
})
export class CoursePreviewDialog {
  readonly visible = model(false);
  readonly course = input<CourseDetail | null>(null);
}
