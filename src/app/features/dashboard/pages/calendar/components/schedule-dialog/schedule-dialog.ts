import { Component, computed, input, model, output, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { ChoiceCard } from '../../../../../../shared/choice-card/choice-card';
import { CreatedCourse, TeachingKind, TeachingTemplate } from '../../calendar.models';
import { ClassForm } from '../class-form/class-form';
import { CourseForm } from '../course-form/course-form';

/**
 * Diálogo para programar algo en el calendario: primero pregunta si es una clase o un curso y luego muestra
 * el formulario que corresponde. Al abrirse desde una plantilla se salta la pregunta.
 */
@Component({
  selector: 'app-schedule-dialog',
  imports: [Dialog, ButtonDirective, ChoiceCard, ClassForm, CourseForm],
  template: `
    <p-dialog
      [header]="header()"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="false"
      [style]="{ width: '40rem', maxWidth: '95vw' }"
      [contentStyle]="{ maxHeight: '75vh' }"
      (onHide)="reset()"
    >
      @if (visible()) {
        @if (!kind()) {
          <p class="mb-4 text-sm">Elige lo que quieres dictar el <strong class="text-tz-title">{{ dayLabel() }}</strong>.</p>
          <div class="space-y-3" role="radiogroup" aria-label="Qué quieres dictar">
            <app-choice-card
              name="teaching-kind"
              value="class"
              title="Una clase"
              description="Una sola sesión, con su propio precio. Puede dar diploma."
              icon="pi pi-video"
              [selected]="chosen()"
              (selectedChange)="chosen.set($event)"
            />
            <app-choice-card
              name="teaching-kind"
              value="course"
              title="Un curso"
              description="Varias clases con un solo precio. Da diploma al completarse."
              icon="pi pi-book"
              [selected]="chosen()"
              (selectedChange)="chosen.set($event)"
            />
          </div>
          <div class="mt-5 flex justify-end">
            <button pButton type="button" label="Continuar" icon="pi pi-arrow-right" iconPos="right" [disabled]="!chosen()" (click)="continue()"></button>
          </div>
        } @else {
          @if (!template()) {
            <button pButton type="button" label="Cambiar" icon="pi pi-arrow-left" severity="secondary" [text]="true" size="small" class="-ml-2 mb-3" (click)="reset()"></button>
          }
          @if (kind() === 'class') {
            <app-class-form [start]="start()" [templates]="templates()" [initialTemplate]="template()" (saved)="done($event)" (templateCreated)="templateCreated.emit($event)" />
          } @else {
            <app-course-form [start]="start()" [templates]="templates()" [initialTemplate]="template()" (saved)="done($event)" (templateCreated)="templateCreated.emit($event)" />
          }
        }
      }
    </p-dialog>
  `
})
export class ScheduleDialog {
  readonly visible = model(false);
  /** Día y hora con que se abre */
  readonly start = input.required<Date>();
  readonly templates = input<TeachingTemplate[]>([]);
  /** Plantilla elegida desde la lista: salta la pregunta y llena el formulario */
  readonly template = input<TeachingTemplate | null>(null);

  readonly created = output<CreatedCourse & { kind: TeachingKind }>();
  readonly templateCreated = output<TeachingTemplate>();

  protected readonly chosen = signal<string | null>(null);
  /** Lo que ya se eligió: viene de la plantilla o de la pregunta inicial */
  protected readonly picked = signal<TeachingKind | null>(null);
  protected readonly kind = computed<TeachingKind | null>(() => this.template()?.kind ?? this.picked());

  protected readonly header = computed(() => {
    const kind = this.kind();
    if (kind === 'class') return 'Nueva clase';
    if (kind === 'course') return 'Nuevo curso';
    return 'Programar en tu calendario';
  });

  protected dayLabel(): string {
    return this.start().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  protected continue(): void {
    const value = this.chosen();
    if (value === 'class' || value === 'course') this.picked.set(value);
  }

  protected done(created: CreatedCourse): void {
    const kind = this.kind() as TeachingKind;
    this.visible.set(false);
    this.created.emit({ ...created, kind });
  }

  protected reset(): void {
    this.picked.set(null);
    this.chosen.set(null);
  }
}
