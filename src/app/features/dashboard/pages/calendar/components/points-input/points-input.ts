import { Component, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { InputText } from 'primeng/inputtext';

export const MAX_POINTS = 15;
export const MAX_POINT_LENGTH = 160;

/**
 * Lista de "qué aprenderás": un input al que se le va agregando una opción a la vez (Enter o "Agregar"),
 * que se muestran como chips que se pueden quitar. Máximo 15, de 160 caracteres (igual que el API).
 */
@Component({
  selector: 'app-points-input',
  imports: [FormsModule, ButtonDirective, Chip, InputText],
  template: `
    <label [for]="inputId()" class="tz-label">{{ label() }}</label>
    <div class="flex gap-2">
      <input
        pInputText
        [id]="inputId()"
        [(ngModel)]="draft"
        [ngModelOptions]="{ standalone: true }"
        [maxlength]="maxLength"
        [placeholder]="placeholder()"
        [disabled]="full()"
        class="min-w-0 flex-1"
        (keydown.enter)="onEnter($event)"
      />
      <button pButton type="button" label="Agregar" icon="pi pi-plus" severity="warn" [disabled]="full() || !draft().trim()" (click)="add()"></button>
    </div>
    @if (points().length) {
      <ul class="mt-3 flex flex-wrap gap-2" [attr.aria-label]="label()">
        @for (point of points(); track $index) {
          <li><p-chip [label]="point" [removable]="true" (onRemove)="remove($index)" /></li>
        }
      </ul>
    }
    <p class="tz-hint">{{ points().length }} / {{ max }} · {{ hint() }}</p>
  `,
  host: { class: 'block' }
})
export class PointsInput {
  readonly label = input('¿Qué aprenderán?');
  readonly inputId = input.required<string>();
  readonly placeholder = input('Ej.: Presentarte en inglés');
  readonly hint = input('Escribe una y pulsa Enter para agregar otra.');
  readonly points = model<string[]>([]);

  protected readonly max = MAX_POINTS;
  protected readonly maxLength = MAX_POINT_LENGTH;
  protected readonly draft = signal('');

  protected full(): boolean {
    return this.points().length >= MAX_POINTS;
  }

  /** Enter agrega la opción y no envía el formulario */
  protected onEnter(event: Event): void {
    event.preventDefault();
    this.add();
  }

  protected add(): void {
    const text = this.draft().trim();
    if (!text || this.full()) return;
    this.points.set([...this.points(), text]);
    this.draft.set('');
  }

  protected remove(index: number): void {
    this.points.set(this.points().filter((_, i) => i !== index));
  }
}
