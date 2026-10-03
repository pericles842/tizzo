import { Component, ElementRef, OnInit, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { apiErrorMessage, apiFieldErrors } from '../../../../../../core/http/api-error';
import { applyServerErrors, focusFirstInvalid, validateGroup } from '../../../../../../shared/form/form-utils';
import { CreatedCourse, TeachingTemplate } from '../../calendar.models';
import { DEFAULT_DURATION_MIN, addMinutes, minutesBetween } from '../../calendar.utils';
import { TeachingService } from '../../teaching.service';
import { DESCRIPTION_VALIDATORS, OfferFields, PRICE_VALIDATORS, STUDENTS_VALIDATORS, TITLE_VALIDATORS } from '../offer-fields/offer-fields';
import { RangeFields, endAfterStart } from '../range-fields/range-fields';

/**
 * Formulario de una clase suelta: nombre, descripción, precio, máximo de integrantes, si da diploma y qué se aprende,
 * en el rango de fecha y hora elegido (la duración sale de ese rango). Se puede empezar desde una plantilla o guardar
 * lo escrito como plantilla.
 */
@Component({
  selector: 'app-class-form',
  imports: [ReactiveFormsModule, ButtonDirective, Message, Select, ToggleSwitch, OfferFields, RangeFields],
  template: `
    @if (classTemplates().length) {
      <div class="mb-5">
        <label for="class-template" class="tz-label">Empezar desde una plantilla</label>
        <p-select
          inputId="class-template"
          [options]="classTemplates()"
          optionLabel="title"
          (onChange)="applyTemplate($event.value)"
          placeholder="Elige una plantilla (opcional)"
          appendTo="body"
          [fluid]="true"
        />
      </div>
    }

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    <form #formEl [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">
      <app-offer-fields
        [form]="form"
        [isCourse]="false"
        [(cover)]="cover"
        prefix="class"
        titleLabel="Nombre de la clase"
        titlePlaceholder="Ej.: Saludos en inglés"
        priceLabel="Precio de la clase (USD)"
        studentsLabel="Máximo de integrantes de la clase"
      />

      <app-range-fields [group]="form" prefix="class" />

      <div class="flex items-center gap-3">
        <p-toggleswitch inputId="class-certificate" formControlName="gives_certificate" />
        <label for="class-certificate" class="text-sm font-medium text-tz-title">Esta clase da diploma</label>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button pButton type="submit" label="Programar clase" icon="pi pi-calendar-plus" [loading]="saving()" [disabled]="saving()"></button>
        <button pButton type="button" label="Guardar como plantilla" icon="pi pi-bookmark" severity="secondary" [outlined]="true" [loading]="savingTemplate()" [disabled]="saving() || savingTemplate()" (click)="saveTemplate()"></button>
        @if (templateSaved()) {
          <p class="flex items-center gap-2 text-sm font-semibold text-tz-subtitle" role="status"><i class="pi pi-check-circle" aria-hidden="true"></i> Plantilla guardada</p>
        }
      </div>
    </form>
  `,
  host: { class: 'block' }
})
export class ClassForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(TeachingService);
  private readonly formEl = viewChild<ElementRef<HTMLElement>>('formEl');

  /** Fecha y hora con que se abre el formulario (inicio de la clase) */
  readonly start = input.required<Date>();
  readonly templates = input<TeachingTemplate[]>([]);
  /** Plantilla con la que se abre (cuando se llega desde "Usar" en la lista de plantillas) */
  readonly initialTemplate = input<TeachingTemplate | null>(null);

  readonly saved = output<CreatedCourse>();
  readonly templateCreated = output<TeachingTemplate>();

  protected readonly classTemplates = computed(() => this.templates().filter((template) => template.kind === 'class'));

  protected readonly form = this.fb.group({
    title: ['', TITLE_VALIDATORS],
    description: ['', DESCRIPTION_VALIDATORS],
    price: this.fb.control<number | null>(null, PRICE_VALIDATORS),
    max_students: this.fb.control<number | null>(null, STUDENTS_VALIDATORS),
    learning_points: this.fb.control<string[]>([]),
    starts_at: this.fb.control<Date | null>(null, Validators.required),
    ends_at: this.fb.control<Date | null>(null, [Validators.required, endAfterStart]),
    gives_certificate: [false]
  });

  /** Miniatura elegida, se sube al crear */
  protected readonly cover = signal<File | null>(null);
  protected readonly saving = signal(false);
  protected readonly savingTemplate = signal(false);
  protected readonly templateSaved = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.setRange(this.start(), DEFAULT_DURATION_MIN);
    const template = this.initialTemplate();
    if (template) this.applyTemplate(template);
    this.form.valueChanges.subscribe(() => this.templateSaved.set(false));
  }

  /** Inicio y fin a partir del inicio y una duración en minutos */
  private setRange(start: Date, durationMin: number): void {
    this.form.controls.starts_at.setValue(start);
    this.form.controls.ends_at.setValue(addMinutes(start, durationMin));
  }

  protected applyTemplate(template: TeachingTemplate): void {
    this.form.patchValue({
      title: template.title,
      description: template.description,
      price: template.price,
      max_students: template.max_students,
      gives_certificate: template.gives_certificate,
      learning_points: [...template.learning_points]
    });
    // La plantilla no tiene fechas: conserva el inicio elegido y pone el fin según su duración
    const start = this.form.controls.starts_at.value ?? this.start();
    this.setRange(start, template.duration_min ?? DEFAULT_DURATION_MIN);
  }

  protected async submit(): Promise<void> {
    this.error.set(null);
    if (!validateGroup(this.form)) {
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    try {
      const created = await this.service.createClass({
        title: value.title.trim(),
        description: value.description.trim(),
        price: value.price as number,
        max_students: value.max_students as number,
        starts_at: (value.starts_at as Date).toISOString(),
        ends_at: (value.ends_at as Date).toISOString(),
        gives_certificate: value.gives_certificate,
        learning_points: value.learning_points
      });
      this.saved.emit(await this.service.attachCover(created, this.cover()));
    } catch (err) {
      this.showServerErrors(err);
    } finally {
      this.saving.set(false);
    }
  }

  /** Guarda título, descripción y lo demás que ya esté escrito. Solo título y descripción son obligatorios. */
  protected async saveTemplate(): Promise<void> {
    this.error.set(null);
    const { title, description, price, max_students, starts_at, ends_at, gives_certificate, learning_points } = this.form.controls;
    for (const control of [title, description]) control.markAsTouched();
    if (title.invalid || description.invalid) {
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }
    // La plantilla guarda la duración (minutos) del rango, solo si el rango es válido
    const rangeValid = starts_at.valid && ends_at.valid && !!starts_at.value && !!ends_at.value;
    this.savingTemplate.set(true);
    try {
      const template = await this.service.saveTemplate({
        kind: 'class',
        title: title.value.trim(),
        description: description.value.trim(),
        price: price.valid ? price.value : null,
        max_students: max_students.valid ? max_students.value : null,
        duration_min: rangeValid ? minutesBetween(starts_at.value as Date, ends_at.value as Date) : null,
        gives_certificate: gives_certificate.value,
        learning_points: learning_points.value
      });
      this.templateCreated.emit(template);
      this.templateSaved.set(true);
    } catch (err) {
      this.showServerErrors(err);
    } finally {
      this.savingTemplate.set(false);
    }
  }

  private showServerErrors(err: unknown): void {
    const c = this.form.controls;
    applyServerErrors(apiFieldErrors(err), {
      title: c.title,
      description: c.description,
      price: c.price,
      max_students: c.max_students,
      learning_points: c.learning_points,
      starts_at: c.starts_at,
      ends_at: c.ends_at
    });
    this.error.set(apiErrorMessage(err));
  }
}
