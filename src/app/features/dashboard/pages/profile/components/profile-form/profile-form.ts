import { Component, ElementRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { MultiSelect } from 'primeng/multiselect';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';
import { TeacherProfile } from '../../../../../../core/auth/auth.models';
import { apiErrorMessage, apiFieldErrors } from '../../../../../../core/http/api-error';
import { FieldError } from '../../../../../../shared/form/field-error';
import { applyServerErrors, focusFirstInvalid, validateGroup } from '../../../../../../shared/form/form-utils';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';
import { CategoryGroup, ProfilePayload, ProfileTextData, SpecialtyEntry } from '../../profile.models';
import { TeacherProfileService } from '../../teacher-profile.service';

/** Una fila de especialidad: la categoría elegida y sus años de experiencia (obligatorios, 0 a 70) */
type SpecialtyRow = FormGroup<{ category_id: FormControl<number>; years: FormControl<number | null> }>;

interface CategoryInfo {
  name: string;
  parent: string | null;
}

/** Grupo del selector: las subcategorías de un área. Las categorías sin subcategorías (como "otro") van juntas en "Otros". */
interface OptionGroup {
  label: string;
  items: { label: string; value: number }[];
}

const OTHERS_LABEL = 'Otros';

/**
 * Datos del perfil: titular, biografía y especialidades. Las especialidades son categorías (selección múltiple)
 * y cada una tiene su renglón con los años de experiencia. Se puede guardar a medias.
 */
@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, ButtonDirective, InputText, InputNumber, MultiSelect, Textarea, Message, FieldError, WidgetCard],
  template: `
    <app-widget-card heading="Tu perfil profesional">
      <p class="-mt-2 mb-5 text-sm">Esto es lo que verán tus estudiantes. Puedes guardar a medias y seguir después.</p>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      }

      <form #formEl class="space-y-5" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div>
          <label for="headline" class="tz-label">Titular</label>
          <input
            pInputText
            id="headline"
            formControlName="headline"
            placeholder="Ej.: Profesora de álgebra y cálculo"
            class="w-full"
            aria-describedby="headline-error"
          />
          <app-field-error errorId="headline-error" [control]="form.controls.headline" />
        </div>

        <div>
          <label for="bio" class="tz-label">Sobre ti</label>
          <textarea
            pTextarea
            id="bio"
            formControlName="bio"
            rows="5"
            class="w-full"
            placeholder="Cuéntales a tus estudiantes tu experiencia y cómo son tus clases."
            aria-describedby="bio-error bio-count"
          ></textarea>
          <div class="flex items-start justify-between gap-4">
            <app-field-error errorId="bio-error" [control]="form.controls.bio" />
            <p id="bio-count" class="tz-hint ml-auto shrink-0">{{ form.controls.bio.value.length }} / 3000</p>
          </div>
        </div>

        <!-- Especialidades: categorías (selección múltiple) y un renglón con los años de cada una -->
        <div>
          <label for="categories" class="tz-label">Especialidades</label>
          <p-multiselect
            inputId="categories"
            formControlName="categoryIds"
            [options]="options()"
            [group]="true"
            optionLabel="label"
            optionValue="value"
            optionGroupLabel="label"
            optionGroupChildren="items"
            placeholder="Elige las categorías en las que enseñas"
            [filter]="true"
            filterPlaceHolder="Buscar categoría"
            emptyFilterMessage="Sin resultados"
            [maxSelectedLabels]="3"
            selectedItemsLabel="{0} especialidades elegidas"
            [showToggleAll]="false"
            appendTo="body"
            [fluid]="true"
            (onChange)="syncRows($event.value)"
          />
          @if (specialtiesError(); as message) {
            <p class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert">
              <i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}
            </p>
          }

          @if (rows.length) {
            <p class="tz-hint">Escribe los años de experiencia que tienes en cada una (si llevas menos de un año, pon 0).</p>
            <ul class="mt-3 space-y-3" formArrayName="rows" aria-label="Años de experiencia por especialidad">
              @for (row of rows.controls; track row.controls.category_id.value; let i = $index) {
                <li [formGroupName]="i" class="rounded-xl border border-tz-line p-3">
                  <div class="flex flex-wrap items-center gap-3">
                    <label [for]="'years-' + row.controls.category_id.value" class="min-w-0 flex-1 basis-40">
                      <span class="block truncate text-sm font-semibold text-tz-title">{{ info(row.controls.category_id.value).name }}</span>
                      @if (info(row.controls.category_id.value).parent; as parent) {
                        <span class="block truncate text-xs">{{ parent }}</span>
                      }
                    </label>
                    <div class="w-36 shrink-0">
                      <p-inputnumber
                        [inputId]="'years-' + row.controls.category_id.value"
                        formControlName="years"
                        [min]="0"
                        [max]="70"
                        [useGrouping]="false"
                        suffix=" años"
                        placeholder="Años"
                        [ariaRequired]="true"
                        [fluid]="true"
                      />
                    </div>
                    <button
                      pButton
                      type="button"
                      icon="pi pi-trash"
                      severity="secondary"
                      [text]="true"
                      [rounded]="true"
                      [attr.aria-label]="'Quitar ' + info(row.controls.category_id.value).name"
                      (click)="removeRow(i)"
                    ></button>
                  </div>
                  <app-field-error [errorId]="'years-error-' + row.controls.category_id.value" [control]="row.controls.years" />
                </li>
              }
            </ul>
          } @else {
            <p class="tz-hint">Elige tus especialidades y escribe aquí los años de experiencia que tienes en cada una.</p>
          }
        </div>

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
export class ProfileForm {
  private readonly service = inject(TeacherProfileService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly formEl = viewChild<ElementRef<HTMLElement>>('formEl');

  readonly profile = input.required<TeacherProfile>();
  readonly specialties = input.required<SpecialtyEntry[]>();
  readonly categories = input.required<CategoryGroup[]>();
  /** Perfil guardado: el contenedor actualiza su estado */
  readonly updated = output<ProfilePayload>();

  protected readonly form = this.fb.group({
    headline: ['', [Validators.minLength(5), Validators.maxLength(160)]],
    bio: ['', [Validators.minLength(30), Validators.maxLength(3000)]],
    categoryIds: this.fb.control<number[]>([]),
    rows: this.fb.array<SpecialtyRow>([])
  });

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly specialtiesError = signal<string | null>(null);

  /** Datos de cada categoría (nombre y área), por id */
  private readonly categoryMap = computed(() => {
    const map = new Map<number, CategoryInfo>();
    for (const group of this.categories()) {
      if (group.children.length) for (const child of group.children) map.set(child.id, { name: child.name, parent: group.name });
      else map.set(group.id, { name: group.name, parent: null });
    }
    return map;
  });

  protected readonly options = computed<OptionGroup[]>(() => {
    const groups: OptionGroup[] = this.categories()
      .filter((group) => group.children.length)
      .map((group) => ({ label: group.name, items: group.children.map((child) => ({ label: child.name, value: child.id })) }));
    const others = this.categories().filter((group) => !group.children.length);
    if (others.length) groups.push({ label: OTHERS_LABEL, items: others.map((group) => ({ label: group.name, value: group.id })) });
    return groups;
  });

  protected get rows(): FormArray<SpecialtyRow> {
    return this.form.controls.rows;
  }

  constructor() {
    // Carga lo guardado (al abrir y cada vez que el servidor devuelve el perfil)
    effect(() => {
      const profile = this.profile();
      const specialties = this.specialties();
      untracked(() => {
        // Sin emitir eventos: reconstruir lo guardado no es una edición de la persona y no debe quitar el aviso "Cambios guardados"
        this.rows.clear({ emitEvent: false });
        for (const specialty of specialties) this.rows.push(this.newRow(specialty.category_id, specialty.years_experience), { emitEvent: false });
        this.form.reset(
          { headline: profile.headline ?? '', bio: profile.bio ?? '', categoryIds: specialties.map((item) => item.category_id) },
          { emitEvent: false }
        );
        this.specialtiesError.set(null);
      });
    });

    // El aviso se quita cuando la persona vuelve a editar. `dirty` distingue eso del reset que hace
    // el formulario al recibir el perfil guardado (reset lo deja en pristine).
    this.form.valueChanges.subscribe(() => {
      if (this.form.dirty) this.saved.set(false);
    });
  }

  protected info(categoryId: number): CategoryInfo {
    return this.categoryMap().get(categoryId) ?? { name: 'Categoría', parent: null };
  }

  /** Mantiene un renglón por cada categoría elegida: agrega los nuevos (sin años) y quita los desmarcados */
  protected syncRows(selected: number[]): void {
    for (let i = this.rows.length - 1; i >= 0; i--) {
      if (!selected.includes(this.rows.at(i).controls.category_id.value)) this.rows.removeAt(i);
    }
    for (const id of selected) {
      if (!this.rows.controls.some((row) => row.controls.category_id.value === id)) this.rows.push(this.newRow(id, null));
    }
    this.rows.markAsDirty();
    this.form.markAsDirty();
    this.specialtiesError.set(null);
  }

  protected removeRow(index: number): void {
    const id = this.rows.at(index).controls.category_id.value;
    this.rows.removeAt(index);
    this.form.controls.categoryIds.setValue(this.form.controls.categoryIds.value.filter((item) => item !== id));
    this.form.markAsDirty();
  }

  private newRow(categoryId: number, years: number | null): SpecialtyRow {
    return this.fb.group({
      category_id: this.fb.control(categoryId),
      // Obligatorio: cada especialidad lleva sus años (0 es válido)
      years: this.fb.control<number | null>(years, [Validators.required, Validators.min(0), Validators.max(70)])
    });
  }

  protected async save(): Promise<void> {
    this.error.set(null);
    this.specialtiesError.set(null);
    if (!validateGroup(this.form)) {
      this.rows.controls.forEach((row) => row.markAllAsTouched());
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }

    const value = this.form.getRawValue();
    const data: ProfileTextData = {
      headline: value.headline.trim() || null,
      bio: value.bio.trim() || null,
      specialties: value.rows.map((row) => ({ category_id: row.category_id, years_experience: row.years as number }))
    };

    this.saving.set(true);
    try {
      this.updated.emit(await this.service.updateProfile(data));
      this.saved.set(true);
    } catch (err) {
      const fields = apiFieldErrors(err);
      const controls = this.form.controls;
      applyServerErrors(fields, { headline: controls.headline, bio: controls.bio });
      for (const row of this.rows.controls) {
        const message = fields[`specialties.${row.controls.category_id.value}`];
        if (message) applyServerErrors({ years: message }, { years: row.controls.years });
      }
      if (fields['specialties']) this.specialtiesError.set(fields['specialties']);
      this.error.set(apiErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
