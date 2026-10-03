import { Component, effect, input } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { FieldError } from '../../../../../../shared/form/field-error';
import { MAX_DURATION_MIN, MIN_DURATION_MIN, addMinutes, formatDuration, minutesBetween } from '../../calendar.utils';

/** Duración con la que se propone el fin al elegir el inicio */
const DEFAULT_RANGE_MIN = 60;

/**
 * Validador del control de fin: debe ser posterior al inicio y el rango debe durar de 15 a 480 minutos
 * (igual que el API). El inicio es el control hermano `starts_at`.
 */
export const endAfterStart: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const start = control.parent?.get('starts_at')?.value as Date | null | undefined;
  const end = control.value as Date | null;
  if (!start || !end) return null;
  const minutes = minutesBetween(start, end);
  if (minutes <= 0) return { range: 'Debe terminar después de que empieza.' };
  if (minutes < MIN_DURATION_MIN || minutes > MAX_DURATION_MIN) return { range: `Debe durar de ${MIN_DURATION_MIN} a ${MAX_DURATION_MIN} minutos.` };
  return null;
};

/**
 * Fecha y hora de inicio y de fin de una clase. La duración sale del rango (no se escribe aparte).
 * Al mover el inicio, el fin se mueve con él para conservar la duración. El formulario padre debe tener
 * `starts_at` y `ends_at` (con `endAfterStart` en el segundo).
 */
@Component({
  selector: 'app-range-fields',
  imports: [ReactiveFormsModule, DatePicker, FieldError],
  template: `
    <div [formGroup]="group()">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label [for]="prefix() + '-starts'" class="tz-label">Empieza</label>
          <p-datepicker
            [inputId]="prefix() + '-starts'"
            formControlName="starts_at"
            [showTime]="true"
            [readonlyInput]="true"
            hourFormat="24"
            [minDate]="minDate"
            [stepMinute]="5"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            appendTo="body"
            [fluid]="true"
            [ariaRequired]="true"
          />
          <app-field-error [errorId]="prefix() + '-starts-error'" [control]="group().controls['starts_at']" />
        </div>
        <div>
          <label [for]="prefix() + '-ends'" class="tz-label">Termina</label>
          <p-datepicker
            [inputId]="prefix() + '-ends'"
            formControlName="ends_at"
            [showTime]="true"
            [readonlyInput]="true"
            hourFormat="24"
            [minDate]="minDate"
            [stepMinute]="5"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            appendTo="body"
            [fluid]="true"
            [ariaRequired]="true"
          />
          <app-field-error [errorId]="prefix() + '-ends-error'" [control]="group().controls['ends_at']" />
        </div>
      </div>
      @if (duration(); as text) {
        <p class="tz-hint flex items-center gap-1.5"><i class="pi pi-clock text-xs" aria-hidden="true"></i> Duración: {{ text }}</p>
      }
    </div>
  `,
  host: { class: 'block' }
})
export class RangeFields {
  readonly group = input.required<FormGroup>();
  /** Prefijo de los id, para que varios rangos en pantalla no repitan ids */
  readonly prefix = input.required<string>();

  protected readonly minDate = new Date();

  constructor() {
    effect((onCleanup) => {
      const group = this.group();
      const start = group.controls['starts_at'];
      const end = group.controls['ends_at'];
      let previous = start.value as Date | null;

      const subscription = start.valueChanges.subscribe((value: Date | null) => {
        const endValue = end.value as Date | null;
        if (value && previous && endValue) end.setValue(addMinutes(value, minutesBetween(previous, endValue)));
        else if (value && !endValue) end.setValue(addMinutes(value, DEFAULT_RANGE_MIN));
        else end.updateValueAndValidity();
        // Al teclear la fecha el selector pasa por valores vacíos: se recuerda el último inicio válido
        if (value) previous = value;
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  /** "Duración: 1 h 30 min" cuando el rango es válido; vacío si no */
  protected duration(): string | null {
    const group = this.group();
    const start = group.controls['starts_at'].value as Date | null;
    const end = group.controls['ends_at'].value as Date | null;
    if (!start || !end) return null;
    const minutes = minutesBetween(start, end);
    return minutes >= MIN_DURATION_MIN && minutes <= MAX_DURATION_MIN ? formatDuration(minutes) : null;
  }
}
