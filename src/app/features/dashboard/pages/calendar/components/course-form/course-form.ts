import { Audience } from '../../../../../../core/auth/age';
import { Component, ElementRef, OnInit, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { apiErrorMessage, apiFieldErrors } from '../../../../../../core/http/api-error';
import { FieldError } from '../../../../../../shared/form/field-error';
import { applyServerErrors, focusFirstInvalid, validateGroup } from '../../../../../../shared/form/form-utils';
import { CreatedCourse, TeachingTemplate } from '../../calendar.models';
import { DEFAULT_DURATION_MIN, addDays, addMinutes, minutesBetween } from '../../calendar.utils';
import { TeachingService } from '../../teaching.service';
import { DESCRIPTION_VALIDATORS, OfferFields, PRICE_VALIDATORS, STUDENTS_VALIDATORS, TITLE_VALIDATORS } from '../offer-fields/offer-fields';
import { PointsInput } from '../points-input/points-input';
import { RangeFields, endAfterStart } from '../range-fields/range-fields';

/** Una clase del curso: lo mismo que una clase suelta, pero sin precio ni diploma (eso es del curso) */
type SessionRow = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  starts_at: FormControl<Date | null>;
  ends_at: FormControl<Date | null>;
  learning_points: FormControl<string[]>;
}>;

const MIN_SESSIONS = 2;
const MAX_SESSIONS = 60;
/** Una clase por semana, a la misma hora */
const DAYS_BETWEEN = 7;

/**
 * Formulario de un curso: nombre, descripción general, precio del curso y qué se aprende; después, cada una de sus
 * clases con su propio título, hora y duración. El curso siempre da diploma al completarse. Se puede empezar desde
 * una plantilla o guardar lo escrito como plantilla (sin fechas).
 */
@Component({
  selector: 'app-course-form',
  imports: [ReactiveFormsModule, ButtonDirective, InputText, Message, Select, Textarea, FieldError, OfferFields, PointsInput, RangeFields],
  template: `
    @if (courseTemplates().length) {
      <div class="mb-5">
        <label for="course-template" class="tz-label">Empezar desde una plantilla</label>
        <p-select
          inputId="course-template"
          [options]="courseTemplates()"
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
      <app-offer-fields [form]="form" [isCourse]="true" [(cover)]="cover" prefix="course" titleLabel="Nombre del curso" titlePlaceholder="Ej.: Inglés básico" priceLabel="Precio del curso (USD)" studentsLabel="Máximo de integrantes del curso" />
      <p class="tz-hint flex items-center gap-2"><i class="pi pi-verified" aria-hidden="true"></i> Quien complete el curso recibe un diploma. El precio y el máximo de integrantes son del curso completo: las clases no tienen precio, ni diploma, ni cupo propios.</p>

      <section aria-labelledby="course-sessions-title" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h3 id="course-sessions-title" class="font-display text-base font-semibold">Clases del curso</h3>
          <p class="tz-hint !mt-0">{{ sessions.length }} / {{ maxSessions }}</p>
        </div>
        @if (sessionsError(); as message) {
          <p class="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert"><i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}</p>
        }

        <ol class="space-y-4" formArrayName="sessions">
          @for (row of sessions.controls; track row; let i = $index) {
            <li [formGroupName]="i" class="rounded-2xl border border-tz-line p-4">
              <div class="mb-4 flex items-center justify-between gap-3">
                <p class="font-display text-sm font-semibold text-tz-title">Clase {{ i + 1 }}</p>
                @if (sessions.length > minSessions) {
                  <button pButton type="button" icon="pi pi-trash" severity="secondary" [text]="true" [rounded]="true" [attr.aria-label]="'Quitar la clase ' + (i + 1)" (click)="removeSession(i)"></button>
                }
              </div>
              <div class="space-y-4">
                <div>
                  <label [for]="'session-title-' + i" class="tz-label">Título de la clase</label>
                  <input pInputText [id]="'session-title-' + i" formControlName="title" placeholder="Ej.: Presentaciones" class="w-full" />
                  <app-field-error [errorId]="'session-title-error-' + i" [control]="row.controls.title" />
                </div>
                <div>
                  <label [for]="'session-description-' + i" class="tz-label">Descripción (opcional)</label>
                  <textarea pTextarea [id]="'session-description-' + i" formControlName="description" rows="2" class="w-full"></textarea>
                  <app-field-error [errorId]="'session-description-error-' + i" [control]="row.controls.description" />
                </div>
                <app-range-fields [group]="row" [prefix]="'session-' + i" />
                <app-points-input
                  [inputId]="'session-points-' + i"
                  label="¿Qué se aprende en esta clase?"
                  placeholder="Ej.: Decir tu nombre y tu edad"
                  [points]="row.controls.learning_points.value"
                  (pointsChange)="setSessionPoints(row, $event)"
                />
              </div>
            </li>
          }
        </ol>

        <button pButton type="button" label="Agregar clase" icon="pi pi-plus" severity="warn" [disabled]="sessions.length >= maxSessions" (click)="addSession()"></button>
      </section>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button pButton type="submit" label="Programar curso" icon="pi pi-calendar-plus" [loading]="saving()" [disabled]="saving()"></button>
        <button pButton type="button" label="Guardar como plantilla" icon="pi pi-bookmark" severity="secondary" [outlined]="true" [loading]="savingTemplate()" [disabled]="saving() || savingTemplate()" (click)="saveTemplate()"></button>
        @if (templateSaved()) {
          <p class="flex items-center gap-2 text-sm font-semibold text-tz-subtitle" role="status"><i class="pi pi-check-circle" aria-hidden="true"></i> Plantilla guardada</p>
        }
      </div>
    </form>
  `,
  host: { class: 'block' }
})
export class CourseForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(TeachingService);
  private readonly formEl = viewChild<ElementRef<HTMLElement>>('formEl');

  /** Fecha y hora de la primera clase */
  readonly start = input.required<Date>();
  readonly templates = input<TeachingTemplate[]>([]);
  readonly initialTemplate = input<TeachingTemplate | null>(null);

  readonly saved = output<CreatedCourse>();
  readonly templateCreated = output<TeachingTemplate>();

  protected readonly minDate = new Date();
  protected readonly minSessions = MIN_SESSIONS;
  protected readonly maxSessions = MAX_SESSIONS;
  protected readonly courseTemplates = computed(() => this.templates().filter((template) => template.kind === 'course'));

  protected readonly form = this.fb.group({
    title: ['', TITLE_VALIDATORS],
    description: ['', DESCRIPTION_VALIDATORS],
    price: this.fb.control<number | null>(null, PRICE_VALIDATORS),
    max_students: this.fb.control<number | null>(null, STUDENTS_VALIDATORS),
    audience: this.fb.control<Audience>('all'),
    learning_points: this.fb.control<string[]>([]),
    sessions: this.fb.array<SessionRow>([])
  });

  /** Miniatura elegida, se sube al crear */
  protected readonly cover = signal<File | null>(null);
  protected readonly saving = signal(false);
  protected readonly savingTemplate = signal(false);
  protected readonly templateSaved = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sessionsError = signal<string | null>(null);

  protected get sessions(): FormArray<SessionRow> {
    return this.form.controls.sessions;
  }

  ngOnInit(): void {
    const template = this.initialTemplate();
    if (template) this.applyTemplate(template);
    else for (let i = 0; i < MIN_SESSIONS; i++) this.addSession();
    this.form.valueChanges.subscribe(() => this.templateSaved.set(false));
  }

  private newSession(startsAt: Date | null, endsAt: Date | null, data?: { title?: string; description?: string | null; points?: string[] }): SessionRow {
    return this.fb.group({
      title: [data?.title ?? '', TITLE_VALIDATORS],
      description: [data?.description ?? '', [Validators.minLength(10), Validators.maxLength(3000)]],
      starts_at: this.fb.control<Date | null>(startsAt, Validators.required),
      ends_at: this.fb.control<Date | null>(endsAt, [Validators.required, endAfterStart]),
      learning_points: this.fb.control<string[]>(data?.points ?? [])
    });
  }

  /** La primera clase empieza en la fecha elegida; cada nueva, una semana después de la anterior */
  protected addSession(): void {
    const last = this.sessions.length ? this.sessions.at(this.sessions.length - 1).getRawValue() : null;
    const startsAt = last?.starts_at ? addDays(last.starts_at, DAYS_BETWEEN) : new Date(this.start());
    // El fin conserva la duración de la clase anterior (o 60 min si es la primera)
    const duration = last?.starts_at && last.ends_at ? minutesBetween(last.starts_at, last.ends_at) : DEFAULT_DURATION_MIN;
    this.sessions.push(this.newSession(startsAt, addMinutes(startsAt, duration)));
  }

  protected removeSession(index: number): void {
    this.sessions.removeAt(index);
    this.sessionsError.set(null);
  }

  protected setSessionPoints(row: SessionRow, points: string[]): void {
    row.controls.learning_points.setValue(points);
    row.markAsDirty();
  }

  protected applyTemplate(template: TeachingTemplate): void {
    this.form.patchValue({
      title: template.title,
      description: template.description,
      price: template.price,
      max_students: template.max_students,
      audience: template.audience ?? 'all',
      learning_points: [...template.learning_points]
    });
    this.sessions.clear();
    template.sessions.forEach((session, index) => {
      const startsAt = addDays(this.start(), index * DAYS_BETWEEN);
      this.sessions.push(this.newSession(startsAt, addMinutes(startsAt, session.duration_min), { title: session.title, description: session.description, points: [...session.learning_points] }));
    });
    // Un curso necesita al menos dos clases: completa con vacías si la plantilla trae menos
    while (this.sessions.length < MIN_SESSIONS) this.addSession();
  }

  protected async submit(): Promise<void> {
    this.error.set(null);
    this.sessionsError.set(null);
    if (!validateGroup(this.form)) {
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    try {
      const created = await this.service.createCourse({
        title: value.title.trim(),
        description: value.description.trim(),
        price: value.price as number,
        max_students: value.max_students as number,
        audience: value.audience,
        learning_points: value.learning_points,
        sessions: value.sessions.map((session) => ({
          title: session.title.trim(),
          description: session.description.trim() || null,
          starts_at: (session.starts_at as Date).toISOString(),
          ends_at: (session.ends_at as Date).toISOString(),
          learning_points: session.learning_points
        }))
      });
      this.saved.emit(await this.service.attachCover(created, this.cover()));
    } catch (err) {
      this.showServerErrors(err);
    } finally {
      this.saving.set(false);
    }
  }

  /** Guarda el curso como plantilla, sin fechas. Solo nombre y descripción son obligatorios. */
  protected async saveTemplate(): Promise<void> {
    this.error.set(null);
    this.sessionsError.set(null);
    const { title, description, price, max_students, learning_points } = this.form.controls;
    for (const control of [title, description]) control.markAsTouched();
    if (title.invalid || description.invalid) {
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }
    this.savingTemplate.set(true);
    try {
      const template = await this.service.saveTemplate({
        kind: 'course',
        title: title.value.trim(),
        description: description.value.trim(),
        price: price.valid ? price.value : null,
        max_students: max_students.valid ? max_students.value : null,
        audience: this.form.controls.audience.value,
        learning_points: learning_points.value,
        // Solo las clases que ya tienen título
        sessions: this.sessions.controls
          .map((row) => row.getRawValue())
          .filter((session) => session.title.trim())
          .map((session) => ({
            title: session.title.trim(),
            description: session.description.trim() || null,
            // La plantilla guarda la duración (minutos) del rango; si el rango no es válido, la de por defecto
            duration_min: this.rangeMinutes(session.starts_at, session.ends_at),
            learning_points: session.learning_points
          }))
      });
      this.templateCreated.emit(template);
      this.templateSaved.set(true);
    } catch (err) {
      this.showServerErrors(err);
    } finally {
      this.savingTemplate.set(false);
    }
  }

  /** Minutos del rango de una clase si es válido (15 a 480); si no, la duración por defecto */
  private rangeMinutes(start: Date | null, end: Date | null): number {
    const minutes = start && end ? minutesBetween(start, end) : 0;
    return minutes >= 15 && minutes <= 480 ? minutes : DEFAULT_DURATION_MIN;
  }

  /** Pinta los errores del API en el campo que corresponda (las clases llegan como sessions.<n>.<campo>) */
  private showServerErrors(err: unknown): void {
    const fields = apiFieldErrors(err);
    const c = this.form.controls;
    applyServerErrors(fields, { title: c.title, description: c.description, price: c.price, max_students: c.max_students,
      audience: c.audience, learning_points: c.learning_points });
    this.sessions.controls.forEach((row, index) => {
      const prefix = `sessions.${index}.`;
      applyServerErrors(fields, {
        [`${prefix}title`]: row.controls.title,
        [`${prefix}description`]: row.controls.description,
        [`${prefix}starts_at`]: row.controls.starts_at,
        [`${prefix}ends_at`]: row.controls.ends_at
      });
    });
    if (fields['sessions']) this.sessionsError.set(fields['sessions']);
    this.error.set(apiErrorMessage(err));
  }
}
