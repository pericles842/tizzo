import { Component, input, model } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { CoverPicker } from '../../../../../../shared/cover-picker/cover-picker';
import { FieldError } from '../../../../../../shared/form/field-error';
import { PointsInput } from '../points-input/points-input';

/** Reglas de los campos que comparten la clase suelta y el curso (las mismas que valida el API) */
export const TITLE_VALIDATORS = [Validators.required, Validators.minLength(3), Validators.maxLength(180)];
export const DESCRIPTION_VALIDATORS = [Validators.required, Validators.minLength(10), Validators.maxLength(3000)];
export const PRICE_VALIDATORS = [Validators.required, Validators.min(0.01), Validators.max(99999.99)];
export const STUDENTS_VALIDATORS = [Validators.required, Validators.min(1), Validators.max(500)];

/**
 * Campos comunes de una clase suelta y de un curso: título, descripción general, precio en USD, máximo de integrantes
 * (de la clase o del curso completo), miniatura opcional y "qué aprenderás". El formulario padre debe tener los controles `title`,
 * `description`, `price`, `max_students` y `learning_points`.
 */
@Component({
  selector: 'app-offer-fields',
  imports: [ReactiveFormsModule, InputText, InputNumber, Textarea, FieldError, PointsInput, CoverPicker],
  template: `
    <div class="space-y-5" [formGroup]="form()">
      <div>
        <label [for]="prefix() + '-title'" class="tz-label">{{ titleLabel() }}</label>
        <input pInputText [id]="prefix() + '-title'" formControlName="title" [placeholder]="titlePlaceholder()" class="w-full" [attr.aria-describedby]="prefix() + '-title-error'" />
        <app-field-error [errorId]="prefix() + '-title-error'" [control]="form().controls['title']" />
      </div>

      <div>
        <label [for]="prefix() + '-description'" class="tz-label">Descripción general</label>
        <textarea
          pTextarea
          [id]="prefix() + '-description'"
          formControlName="description"
          rows="4"
          class="w-full"
          placeholder="Cuéntales de qué trata y a quién va dirigida."
          [attr.aria-describedby]="prefix() + '-description-error'"
        ></textarea>
        <div class="flex items-start justify-between gap-4">
          <app-field-error [errorId]="prefix() + '-description-error'" [control]="form().controls['description']" />
          <p class="tz-hint ml-auto shrink-0">{{ form().controls['description'].value.length }} / 3000</p>
        </div>
      </div>

      <app-cover-picker [isCourse]="isCourse()" [(file)]="cover" />

      <div class="grid gap-5 sm:grid-cols-2">
      <div>
        <label [for]="prefix() + '-price'" class="tz-label">{{ priceLabel() }}</label>
        <p-inputnumber
          [inputId]="prefix() + '-price'"
          formControlName="price"
          mode="currency"
          currency="USD"
          locale="en-US"
          [min]="0"
          [max]="99999.99"
          placeholder="$0.00"
          [ariaRequired]="true"
          [fluid]="true"
        />
        <app-field-error [errorId]="prefix() + '-price-error'" [control]="form().controls['price']" />
      </div>
      <div>
        <label [for]="prefix() + '-students'" class="tz-label">{{ studentsLabel() }}</label>
        <p-inputnumber
          [inputId]="prefix() + '-students'"
          formControlName="max_students"
          [min]="1"
          [max]="500"
          [useGrouping]="false"
          suffix=" integrantes"
          placeholder="Ej.: 20"
          [ariaRequired]="true"
          [fluid]="true"
        />
        <app-field-error [errorId]="prefix() + '-students-error'" [control]="form().controls['max_students']" />
      </div>
      </div>

      <app-points-input
        [inputId]="prefix() + '-points'"
        [points]="form().controls['learning_points'].value"
        (pointsChange)="setPoints($event)"
      />
      <app-field-error [errorId]="prefix() + '-points-error'" [control]="form().controls['learning_points']" />
    </div>
  `,
  host: { class: 'block' }
})
export class OfferFields {
  readonly form = input.required<FormGroup>();
  /** Prefijo de los id, para que dos formularios en pantalla no repitan ids */
  readonly prefix = input.required<string>();
  readonly titleLabel = input('Nombre');
  readonly titlePlaceholder = input('Ej.: Inglés básico');
  readonly priceLabel = input('Precio (USD)');
  readonly studentsLabel = input('Máximo de integrantes');
  /** true = curso, false = clase suelta (cambia el icono de la miniatura) */
  readonly isCourse = input(false);
  /** Miniatura elegida, pendiente de subir (la sube el formulario cuando se crea la clase o el curso) */
  readonly cover = model<File | null>(null);

  protected setPoints(points: string[]): void {
    const control = this.form().controls['learning_points'];
    control.setValue(points);
    control.markAsDirty();
  }
}
