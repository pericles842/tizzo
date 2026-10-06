import { Component, ElementRef, OnInit, PLATFORM_ID, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Topic } from '../../../../../core/auth/auth.models';
import { AuthService } from '../../../../../core/auth/auth.service';
import { COUNTRIES } from '../../../../../core/catalog/countries';
import { apiErrorMessage, apiFieldErrors } from '../../../../../core/http/api-error';
import { FieldError } from '../../../../../shared/form/field-error';
import { PHONE_PATTERN, applyServerErrors, focusFirstInvalid, validateGroup } from '../../../../../shared/form/form-utils';
import { TopicPicker } from '../../../../../shared/topic-picker/topic-picker';
import { WidgetCard } from '../../../widgets/widget-card/widget-card';
import { timezoneOptions } from '../student-profile.utils';

/**
 * Datos del estudiante: nombre, teléfono, país, edad, zona horaria y los temas que quiere aprender.
 * Parte de la sesión (AuthService) y al guardar la actualiza, así el header cambia al mismo tiempo.
 */
@Component({
  selector: 'app-student-profile-form',
  imports: [ReactiveFormsModule, ButtonDirective, InputNumber, InputText, Message, Select, FieldError, TopicPicker, WidgetCard],
  template: `
    <app-widget-card heading="Tus datos">
      <p class="-mt-2 mb-5 text-sm">Con esto personalizamos las clases que te mostramos y la hora de tus clases.</p>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      }

      <form #formEl class="space-y-5" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="first_name" class="tz-label">Nombre</label>
            <input pInputText id="first_name" formControlName="first_name" autocomplete="given-name" class="w-full" aria-describedby="first_name-error" />
            <app-field-error errorId="first_name-error" [control]="form.controls.first_name" />
          </div>
          <div>
            <label for="last_name" class="tz-label">Apellido</label>
            <input pInputText id="last_name" formControlName="last_name" autocomplete="family-name" class="w-full" aria-describedby="last_name-error" />
            <app-field-error errorId="last_name-error" [control]="form.controls.last_name" />
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="email" class="tz-label">Correo</label>
            <input pInputText id="email" type="email" [value]="email()" class="w-full" readonly aria-describedby="email-hint" />
            <p id="email-hint" class="tz-hint">El correo no se puede cambiar por ahora.</p>
          </div>
          <div>
            <label for="phone" class="tz-label">Teléfono <span class="font-normal">(opcional)</span></label>
            <input pInputText id="phone" type="tel" formControlName="phone" autocomplete="tel" placeholder="+58 412 1234567" class="w-full" aria-describedby="phone-error" />
            <app-field-error errorId="phone-error" [control]="form.controls.phone" patternMessage="Escribe un teléfono válido, por ejemplo +58 412 1234567." />
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="country" class="tz-label">País</label>
            <p-select
              inputId="country"
              formControlName="country_code"
              [options]="countries"
              optionLabel="name"
              optionValue="code"
              placeholder="Selecciona tu país"
              [filter]="true"
              filterPlaceholder="Buscar país"
              emptyFilterMessage="Sin resultados"
              appendTo="body"
              [fluid]="true"
            />
            <app-field-error errorId="country-error" [control]="form.controls.country_code" />
          </div>
          <div>
            <label for="age" class="tz-label">Edad</label>
            <p-inputnumber inputId="age" formControlName="age" [min]="10" [max]="100" [useGrouping]="false" [fluid]="true" />
            <app-field-error errorId="age-error" [control]="form.controls.age" />
          </div>
        </div>

        <div>
          <label for="timezone" class="tz-label">Zona horaria</label>
          <p-select
            inputId="timezone"
            formControlName="timezone"
            [options]="timezones()"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona tu zona horaria"
            [filter]="true"
            filterPlaceholder="Buscar zona"
            emptyFilterMessage="Sin resultados"
            appendTo="body"
            [fluid]="true"
          />
          <p class="tz-hint">Las horas de tus clases se muestran en esta zona.</p>
          <app-field-error errorId="timezone-error" [control]="form.controls.timezone" />
        </div>

        <fieldset>
          <legend class="tz-label">¿Qué quieres aprender?</legend>
          @if (topicsError(); as message) {
            <p-message severity="error" styleClass="mt-2" role="alert">{{ message }}</p-message>
            <button pButton type="button" label="Reintentar" icon="pi pi-refresh" severity="secondary" [outlined]="true" size="small" class="mt-2" (click)="loadTopics()"></button>
          } @else {
            <app-topic-picker [topics]="topics()" label="Temas que quieres aprender" [selected]="selectedTopics()" (selectedChange)="selectTopics($event)" />
          }
          @if (selectedTopicsError(); as message) {
            <p class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert">
              <i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}
            </p>
          }
        </fieldset>

        <div class="flex flex-wrap items-center gap-4">
          <button pButton type="submit" label="Guardar cambios" icon="pi pi-save" [loading]="saving()" [disabled]="saving()"></button>
          @if (saved()) {
            <p class="flex items-center gap-2 text-sm font-semibold text-tz-subtitle" role="status">
              <i class="pi pi-check-circle" aria-hidden="true"></i> Cambios guardados
            </p>
          }
        </div>
      </form>
    </app-widget-card>
  `,
  host: { class: 'block' }
})
export class StudentProfileForm implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly formEl = viewChild<ElementRef<HTMLElement>>('formEl');

  protected readonly countries = COUNTRIES;
  protected readonly form = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    country_code: this.fb.control<string | null>(null, Validators.required),
    age: this.fb.control<number | null>(null, [Validators.required, Validators.min(10), Validators.max(100)]),
    timezone: ['', Validators.required]
  });

  protected readonly email = signal('');
  protected readonly timezones = signal(timezoneOptions(''));
  protected readonly topics = signal<Topic[]>([]);
  protected readonly topicsError = signal<string | null>(null);
  protected readonly selectedTopics = signal<number[]>([]);
  protected readonly selectedTopicsError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Carga lo guardado (al abrir y cada vez que cambia la sesión)
    effect(() => {
      const user = this.auth.user();
      if (!user) return;
      untracked(() => {
        this.email.set(user.email);
        this.timezones.set(timezoneOptions(user.timezone));
        this.selectedTopics.set(user.topics.map((topic) => topic.id));
        // Sin emitir eventos: reconstruir lo guardado no es una edición y no debe quitar el aviso "Cambios guardados"
        this.form.reset(
          {
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone ?? '',
            country_code: user.country_code,
            age: user.age,
            timezone: user.timezone
          },
          { emitEvent: false }
        );
      });
    });

    // El aviso se quita cuando la persona vuelve a editar (`dirty` distingue eso del reset al recibir lo guardado)
    this.form.valueChanges.subscribe(() => {
      if (this.form.dirty) this.saved.set(false);
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) void this.loadTopics();
  }

  protected async loadTopics(): Promise<void> {
    this.topicsError.set(null);
    try {
      this.topics.set(await this.auth.getTopics());
    } catch (err) {
      this.topicsError.set(apiErrorMessage(err));
    }
  }

  protected selectTopics(ids: number[]): void {
    this.selectedTopics.set(ids);
    this.selectedTopicsError.set(null);
    this.saved.set(false);
    this.form.markAsDirty();
  }

  protected async save(): Promise<void> {
    this.error.set(null);
    this.selectedTopicsError.set(this.selectedTopics().length ? null : 'Elige al menos un tema.');
    const valid = validateGroup(this.form);
    if (!valid || this.selectedTopicsError()) {
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    try {
      await this.auth.updateStudentProfile({
        first_name: value.first_name.trim(),
        last_name: value.last_name.trim(),
        phone: value.phone.trim() || null,
        country_code: value.country_code!,
        age: value.age!,
        timezone: value.timezone,
        topic_ids: this.selectedTopics()
      });
      this.form.markAsPristine();
      this.saved.set(true);
    } catch (err) {
      const fields = apiFieldErrors(err);
      const controls = this.form.controls;
      applyServerErrors(fields, {
        first_name: controls.first_name,
        last_name: controls.last_name,
        phone: controls.phone,
        country_code: controls.country_code,
        age: controls.age,
        timezone: controls.timezone
      });
      if (fields['topic_ids']) this.selectedTopicsError.set(fields['topic_ids']);
      this.error.set(apiErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
