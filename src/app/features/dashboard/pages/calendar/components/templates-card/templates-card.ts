import { Component, inject, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Tag } from 'primeng/tag';
import { TeachingTemplate } from '../../calendar.models';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';

/** Plantillas guardadas del profe: se usan para programar de nuevo o se borran (con confirmación) */
@Component({
  selector: 'app-templates-card',
  imports: [ButtonDirective, ConfirmDialog, Tag, WidgetCard],
  providers: [ConfirmationService],
  template: `
    <app-widget-card heading="Tus plantillas">
      <p class="-mt-2 mb-4 text-sm">Guarda el título y la descripción de lo que dictas para no escribirlos otra vez.</p>
      @if (templates().length) {
        <ul class="space-y-3" aria-label="Plantillas guardadas">
          @for (template of templates(); track template.uuid) {
            <li class="flex items-center gap-3 rounded-xl border border-tz-line p-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-tz-title">{{ template.title }}</p>
                <p-tag class="mt-1" [value]="template.kind === 'course' ? 'Curso' : 'Clase'" severity="secondary" />
              </div>
              <button pButton type="button" label="Usar" size="small" severity="secondary" [outlined]="true" (click)="use.emit(template)"></button>
              <button pButton type="button" icon="pi pi-trash" severity="secondary" [text]="true" [rounded]="true" [attr.aria-label]="'Borrar la plantilla ' + template.title" (click)="confirmDelete(template)"></button>
            </li>
          }
        </ul>
      } @else {
        <p class="text-sm">Aún no tienes plantillas. Al programar una clase o un curso, pulsa «Guardar como plantilla».</p>
      }
    </app-widget-card>
    <p-confirmdialog acceptButtonStyleClass="p-button-danger" />
  `,
  host: { class: 'block' }
})
export class TemplatesCard {
  private readonly confirmation = inject(ConfirmationService);

  readonly templates = input.required<TeachingTemplate[]>();
  readonly use = output<TeachingTemplate>();
  readonly remove = output<TeachingTemplate>();

  protected confirmDelete(template: TeachingTemplate): void {
    this.confirmation.confirm({
      header: '¿Borrar la plantilla?',
      message: `Se borrará «${template.title}». Las clases ya programadas no cambian.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Borrar',
      rejectLabel: 'Cancelar',
      accept: () => this.remove.emit(template)
    });
  }
}
