import { Component, ElementRef, OnInit, PLATFORM_ID, computed, inject, input, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { AvatarGroup } from 'primeng/avatargroup';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { apiErrorMessage, apiFieldErrors } from '../../../../../core/http/api-error';
import { ChoiceCard } from '../../../../../shared/choice-card/choice-card';
import { FieldError } from '../../../../../shared/form/field-error';
import { applyServerErrors, focusFirstInvalid } from '../../../../../shared/form/form-utils';
import { PdfDropzone } from '../components/pdf-dropzone';
import { QuestionPayload, QuizQuestion, TaskPayload, TaskScope, TaskTargetCourse, TaskType, TeacherTask } from '../tasks.models';
import { TasksService } from '../tasks.service';
import { dueLabel, formatDateTime } from '../tasks.utils';

const MAX_INSTRUCTIONS = 5000;
const MAX_OPTIONS = 8;
const MAX_QUESTIONS = 50;

type QuestionKindUi = 'options' | 'free_text';
type OptionGroup = FormGroup<{ label: FormControl<string>; is_correct: FormControl<boolean> }>;
type QuestionGroup = FormGroup<{ kind: FormControl<QuestionKindUi>; prompt: FormControl<string>; options: FormArray<OptionGroup> }>;

/** Tipos de actividad: el quiz va primero porque es el que más se usa */
const TYPES: { value: TaskType; title: string; description: string; icon: string }[] = [
  { value: 'quiz', title: 'Quiz', description: 'Preguntas de opciones (A, B, C…) o de respuesta libre; las de opciones se califican solas.', icon: 'pi pi-list-check' },
  { value: 'document', title: 'Documento', description: 'Adjuntas un PDF con la guía; si quieres, el estudiante entrega su respuesta en PDF.', icon: 'pi pi-file-pdf' }
];

const QUESTION_KINDS: { value: QuestionKindUi; label: string }[] = [
  { value: 'options', label: 'Opciones' },
  { value: 'free_text', label: 'Respuesta libre' }
];

/** Opciones de "¿A qué pertenece?" */
const SCOPES: { value: TaskScope; title: string; description: string; icon: string }[] = [
  { value: 'course', title: 'Todo el curso', description: 'Para todos los inscritos del curso, sin una clase específica.', icon: 'pi pi-book' },
  { value: 'class', title: 'Una clase', description: 'Una clase con fecha de un curso, o una clase suelta grupal.', icon: 'pi pi-calendar' }
];

/**
 * Crear o editar una tarea (profe). Un formulario por pasos en tarjetas: tipo, a qué pertenece (curso → clase),
 * detalles, fecha límite y el PDF. Panel lateral con a quién se asigna, la vista previa del aviso y las acciones.
 * El PDF elegido se sube al guardar. Una tarea publicada no cambia tipo, alcance ni si pide entrega; la fecha solo se amplía.
 */
@Component({
  selector: 'app-task-editor-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    Avatar,
    AvatarGroup,
    ButtonDirective,
    Card,
    Checkbox,
    ConfirmDialog,
    DatePicker,
    InputText,
    Message,
    Select,
    SelectButton,
    Skeleton,
    Tag,
    Textarea,
    ToggleSwitch,
    ChoiceCard,
    FieldError,
    PdfDropzone
  ],
  providers: [ConfirmationService],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <a pButton [routerLink]="task() ? ['/app/tareas', task()!.uuid] : '/app/tareas'" label="Volver" icon="pi pi-arrow-left" severity="secondary" [text]="true" class="-ml-3 mb-1"></a>
        <p class="font-display text-3xl font-semibold text-tz-title">{{ task() ? 'Editar tarea' : 'Nueva tarea' }}</p>
        <p class="mt-1 text-sm">{{ locked() ? 'Ya está publicada: puedes cambiar el título, las instrucciones, ampliar la fecha y permitir entregas tardías.' : 'Arma la tarea; al publicarla se asigna sola a tus estudiantes y les llega un aviso.' }}</p>
      </div>
      @if (task(); as current) {
        @if (current.status !== 'draft') {
          <p-tag [value]="current.status === 'published' ? 'Publicada' : 'Cerrada'" [severity]="current.status === 'published' ? undefined : 'secondary'" [rounded]="true" />
        }
      }
    </header>

    @if (loadError(); as message) {
      <p-message severity="error" role="alert">{{ message }}</p-message>
    } @else if (loading()) {
      <div class="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div class="space-y-5">
          @for (placeholder of [1, 2, 3]; track placeholder) {
            <p-skeleton height="10rem" borderRadius="1.25rem" />
          }
        </div>
        <p-skeleton height="20rem" borderRadius="1.25rem" />
      </div>
    } @else {
      @if (error(); as message) {
        <p-message severity="error" styleClass="mb-5" role="alert">{{ message }}</p-message>
      }

      <form #formEl class="grid items-start gap-5 xl:grid-cols-[1fr_22rem]" [formGroup]="form" (ngSubmit)="$event.preventDefault()" novalidate>
        <div class="min-w-0 space-y-5">
          <!-- 1. Tipo -->
          <p-card class="border border-tz-surface-border">
            <h2 class="flex items-center gap-3 text-lg font-semibold"><span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-sm font-bold text-tz-subtitle" aria-hidden="true">1</span> Tipo de actividad</h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de actividad">
              @for (option of types; track option.value) {
                @if (!locked() || option.value === type()) {
                  <app-choice-card
                    name="task-type"
                    [value]="option.value"
                    [title]="option.title"
                    [description]="option.description"
                    [icon]="option.icon"
                    [selected]="type()"
                    (selectedChange)="setType($event)"
                  />
                }
              }
            </div>
          </p-card>

          <!-- 2. A qué pertenece -->
          <p-card class="border border-tz-surface-border">
            <h2 class="flex items-center gap-3 text-lg font-semibold"><span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-sm font-bold text-tz-subtitle" aria-hidden="true">2</span> ¿A qué pertenece?</h2>
            @if (!targets().length) {
              <p-message severity="secondary" styleClass="mt-4">Todavía no tienes clases ni cursos publicados. Programa uno desde tu calendario para ponerle tareas.</p-message>
            }
            <div class="mt-4 grid gap-3" role="radiogroup" aria-label="A qué pertenece la tarea" aria-describedby="scope-error">
              @for (option of scopeOptions(); track option.value) {
                @if (locked() && option.value !== scope()) {
                  <!-- publicada: solo se muestra el alcance elegido -->
                }
                @else if (option.value === 'individual' && scope() !== 'individual') {
                  <!-- clase individual: ya no se ofrece -->
                } @else {
                  <app-choice-card
                    name="task-scope"
                    [value]="option.value"
                    [title]="option.title"
                    [description]="option.description"
                    [icon]="option.icon"
                    [selected]="scope()"
                    (selectedChange)="setScope($event)"
                  />
                }
              }
            </div>
            <app-field-error errorId="scope-error" [control]="form.controls.scope" />

            @if (scope(); as current) {
              <div [class]="current === 'class' ? 'mt-5 grid gap-4 sm:grid-cols-2' : 'mt-5 grid gap-4'">
                <div>
                  <label for="task-course" class="tz-label">{{ current === 'course' ? 'Curso' : current === 'individual' ? 'Clase individual' : 'Curso o clase suelta' }}</label>
                  <p-select
                    inputId="task-course"
                    formControlName="course_id"
                    [options]="courseOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [placeholder]="courseOptions().length ? 'Elige…' : 'No tienes opciones para este tipo'"
                    [filter]="courseOptions().length > 6"
                    filterPlaceholder="Buscar"
                    emptyMessage="Sin opciones"
                    appendTo="body"
                    [fluid]="true"
                    (onChange)="onCourseChange()"
                  />
                  <app-field-error errorId="task-course-error" [control]="form.controls.course_id" />
                </div>
                @if (current === 'class') {
                  <div>
                    <label for="task-session" class="tz-label">Clase</label>
                    <p-select
                      inputId="task-session"
                      formControlName="session_id"
                      [options]="sessionOptions()"
                      optionLabel="label"
                      optionValue="value"
                      [placeholder]="selectedCourse() ? 'Elige la clase' : 'Primero elige el curso'"
                      emptyMessage="Sin clases"
                      appendTo="body"
                      [fluid]="true"
                    />
                    <app-field-error errorId="task-session-error" [control]="form.controls.session_id" />
                  </div>
                }
              </div>
            }
          </p-card>

          <!-- 3. Detalles -->
          <p-card class="border border-tz-surface-border">
            <h2 class="flex items-center gap-3 text-lg font-semibold"><span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-sm font-bold text-tz-subtitle" aria-hidden="true">3</span> Detalles</h2>
            <div class="mt-4 space-y-4">
              <div>
                <label for="task-title" class="tz-label">Título</label>
                <input pInputText id="task-title" formControlName="title" class="w-full" maxlength="180" placeholder="Ej.: Ejercicios de la unidad 2" aria-describedby="task-title-error" />
                <app-field-error errorId="task-title-error" [control]="form.controls.title" />
              </div>
              <div>
                <label for="task-instructions" class="tz-label">Instrucciones <span class="font-normal">(opcional)</span></label>
                <textarea pTextarea id="task-instructions" formControlName="instructions" rows="4" class="w-full" placeholder="Qué deben hacer, cómo entregar, en qué fijarse…" aria-describedby="task-instructions-error task-instructions-count"></textarea>
                <div class="flex items-start justify-between gap-4">
                  <app-field-error errorId="task-instructions-error" [control]="form.controls.instructions" />
                  <p id="task-instructions-count" class="tz-hint ml-auto shrink-0">{{ form.controls.instructions.value.length }} / {{ maxInstructions }}</p>
                </div>
              </div>
            </div>
          </p-card>

          <!-- 4. Fecha límite -->
          <p-card class="border border-tz-surface-border">
            <h2 class="flex items-center gap-3 text-lg font-semibold"><span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-sm font-bold text-tz-subtitle" aria-hidden="true">4</span> Fecha y hora límite</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2 sm:items-start">
              <div>
                <label for="task-due" class="tz-label">Entrega hasta</label>
                <p-datepicker
                  inputId="task-due"
                  formControlName="due_at"
                  [showTime]="true"
                  hourFormat="12"
                  [stepMinute]="5"
                  [minDate]="minDue()"
                  [readonlyInput]="true"
                  dateFormat="dd/mm/yy"
                  [showIcon]="true"
                  appendTo="body"
                  [fluid]="true"
                  [ariaRequired]="true"
                />
                @if (form.controls.due_at.value; as due) {
                  <p class="tz-hint">{{ dueText(due) }}</p>
                }
                <app-field-error errorId="task-due-error" [control]="form.controls.due_at" />
              </div>
              <div class="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-tz-line px-4 py-2 sm:mt-7">
                <label for="task-late" class="text-sm font-medium text-tz-title">Permitir entregas tardías<span class="block text-xs font-normal">Se marcan como tardías</span></label>
                <p-toggleswitch inputId="task-late" formControlName="allow_late" />
              </div>
            </div>
          </p-card>

          <!-- 5. Documento -->
          @if (type() === 'document') {
          <p-card class="border border-tz-surface-border">
            <h2 class="flex items-center gap-3 text-lg font-semibold"><span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-sm font-bold text-tz-subtitle" aria-hidden="true">5</span> Documento</h2>
            <div class="mt-4 space-y-4">
              <app-pdf-dropzone
                [fileName]="fileName()"
                [caption]="pendingFile() ? 'Se subirá al guardar' : 'Guía de la tarea'"
                [viewUrl]="!pendingFile() && task()?.file_name ? service.teacherFileUrl(task()!.uuid) : null"
                prompt="Arrastra aquí el PDF con las instrucciones"
                [removable]="!locked()"
                [externalError]="fileError()"
                (picked)="pickFile($event)"
                (removed)="removeFile()"
              />
              <div class="flex min-h-11 items-center gap-3">
                <p-checkbox inputId="task-submission" formControlName="requires_submission" [binary]="true" />
                <label for="task-submission" class="text-sm text-tz-title">El estudiante debe entregar su respuesta en PDF</label>
              </div>
            </div>
          </p-card>
          } @else {
          <!-- 5. Preguntas -->
          <p-card class="border border-tz-surface-border">
            <h2 class="flex items-center gap-3 text-lg font-semibold"><span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-sm font-bold text-tz-subtitle" aria-hidden="true">5</span> Preguntas</h2>
            <p class="mt-1 text-sm">{{ locked() ? 'El quiz ya está publicado: las preguntas no se pueden cambiar.' : 'Elige el tipo de cada pregunta. En las de opciones marca la correcta (o varias).' }}</p>

            @if (questionErrors()['questions']; as message) {
              <p class="mt-3 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert"><i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}</p>
            }

            <div formArrayName="questions" class="mt-4 space-y-4">
              @for (question of questions.controls; track question; let qi = $index) {
                <div [formGroupName]="qi" [id]="'question-' + qi" class="rounded-2xl border border-tz-line p-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="font-display font-semibold text-tz-title">Pregunta {{ qi + 1 }}</p>
                    <div class="flex items-center gap-1">
                      <p-selectbutton [options]="questionKinds" optionLabel="label" optionValue="value" formControlName="kind" [allowEmpty]="false" size="small" [attr.aria-label]="'Tipo de la pregunta ' + (qi + 1)" />
                      @if (!locked()) {
                        <button pButton type="button" icon="pi pi-trash" severity="secondary" [text]="true" [rounded]="true" [attr.aria-label]="'Quitar la pregunta ' + (qi + 1)" (click)="removeQuestion(qi)"></button>
                      }
                    </div>
                  </div>
                  <textarea pTextarea formControlName="prompt" rows="2" class="mt-3 w-full" maxlength="1000" placeholder="Escribe la pregunta" [attr.aria-label]="'Texto de la pregunta ' + (qi + 1)"></textarea>

                  @if (question.controls.kind.value === 'options') {
                    <div formArrayName="options" class="mt-3 space-y-2">
                      @for (option of question.controls.options.controls; track option; let oi = $index) {
                        <div [formGroupName]="oi" class="flex items-center gap-2 sm:gap-3">
                          <p-checkbox formControlName="is_correct" [binary]="true" [attr.aria-label]="'La respuesta ' + letter(oi) + ' es correcta'" />
                          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-tz-soft text-xs font-bold text-tz-subtitle" aria-hidden="true">{{ letter(oi) }}</span>
                          <input pInputText formControlName="label" class="min-w-0 flex-1" maxlength="300" [placeholder]="'Respuesta ' + letter(oi)" [attr.aria-label]="'Respuesta ' + letter(oi) + ' de la pregunta ' + (qi + 1)" />
                          @if (!locked() && question.controls.options.length > 2) {
                            <button pButton type="button" icon="pi pi-times" severity="secondary" [text]="true" [rounded]="true" [attr.aria-label]="'Quitar la respuesta ' + letter(oi)" (click)="removeOption(qi, oi)"></button>
                          }
                        </div>
                      }
                    </div>
                    @if (!locked() && question.controls.options.length < maxOptions) {
                      <button pButton type="button" label="Agregar respuesta" icon="pi pi-plus" severity="secondary" [text]="true" class="mt-2 -ml-3" (click)="addOption(qi)"></button>
                    }
                  } @else {
                    <p class="mt-3 text-sm">El estudiante escribe su respuesta y tú la lees en el detalle de la tarea: no se califica sola.</p>
                  }

                  @for (key of [qi + '', qi + '.options', qi + '.points']; track key) {
                    @if (questionErrors()['questions.' + key]; as message) {
                      <p class="mt-2 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert"><i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}</p>
                    }
                  }
                </div>
              }
            </div>

            @if (!locked()) {
              <button pButton type="button" label="Agregar pregunta" icon="pi pi-plus" severity="warn" class="mt-4" [disabled]="questions.length >= maxQuestions" (click)="addQuestion()"></button>
            }
          </p-card>
          }
        </div>

        <!-- Panel lateral -->
        <aside class="space-y-5 xl:sticky xl:top-24" aria-label="Resumen y acciones">
          <p-card class="border border-tz-surface-border">
            <h2 class="text-base font-semibold">Se asigna a</h2>
            @if (selectedCourse(); as course) {
              <p class="mt-2 font-display text-3xl font-semibold text-tz-title">{{ students().length }} <span class="text-base font-medium">{{ students().length === 1 ? 'estudiante' : 'estudiantes' }}</span></p>
              @if (students().length) {
                <p-avatargroup styleClass="mt-3">
                  @for (student of students().slice(0, 5); track student.uuid) {
                    @if (student.avatar_url) {
                      <p-avatar [image]="student.avatar_url" shape="circle" [attr.title]="student.name" />
                    } @else {
                      <p-avatar [label]="initials(student.name)" shape="circle" class="tz-bg-gradient text-xs text-white" [attr.title]="student.name" />
                    }
                  }
                  @if (students().length > 5) {
                    <p-avatar [label]="'+' + (students().length - 5)" shape="circle" class="bg-tz-soft text-xs text-tz-subtitle" />
                  }
                </p-avatargroup>
              }
              <p class="mt-3 text-sm">{{ assignHint() }}</p>
            } @else {
              <p class="mt-2 text-sm">Elige a qué pertenece la tarea para ver a quién le llega.</p>
            }
          </p-card>

          <p-card class="border border-tz-surface-border">
            <h2 class="text-base font-semibold">Aviso a los estudiantes</h2>
            <div class="mt-3 flex gap-3 rounded-xl bg-tz-soft p-3" aria-label="Vista previa del aviso">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full tz-bg-gradient text-white" aria-hidden="true"><i class="pi pi-bell text-sm"></i></span>
              <div class="min-w-0 text-sm">
                <p class="font-semibold text-tz-title">Nueva tarea en {{ selectedCourse()?.title || 'tu curso' }}</p>
                <p class="mt-0.5 truncate">{{ form.controls.title.value || 'Título de la tarea' }}</p>
                <p class="mt-0.5 text-xs">Entrega: {{ previewDue() }} · {{ previewDetail() }}</p>
              </div>
            </div>
            <p class="mt-3 text-xs">Les llega a la campana de la plataforma.</p>
          </p-card>

          <div class="flex flex-col gap-2">
            @if (locked()) {
              <button pButton type="button" label="Guardar cambios" icon="pi pi-save" [loading]="saving()" [disabled]="saving()" [fluid]="true" (click)="save(false)"></button>
            } @else {
              <button pButton type="button" label="Publicar y notificar" icon="pi pi-send" [loading]="saving()" [disabled]="saving()" [fluid]="true" (click)="askPublish()"></button>
            }
            <a pButton [routerLink]="task() ? ['/app/tareas', task()!.uuid] : '/app/tareas'" label="Cancelar" severity="secondary" [text]="true" [fluid]="true"></a>
          </div>
        </aside>
      </form>
    }

    <p-confirmdialog rejectButtonStyleClass="p-button-text p-button-secondary" />
  `
})
export class TaskEditorPage implements OnInit {
  protected readonly service = inject(TasksService);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly formEl = viewChild<ElementRef<HTMLElement>>('formEl');

  /** Viene de la ruta al editar (/app/tareas/:uuid/editar) */
  readonly uuid = input<string>();

  protected readonly types = TYPES;
  protected readonly questionKinds = QUESTION_KINDS;
  protected readonly maxInstructions = MAX_INSTRUCTIONS;
  protected readonly maxOptions = MAX_OPTIONS;
  protected readonly maxQuestions = MAX_QUESTIONS;

  protected readonly form = this.fb.group({
    type: this.fb.control<TaskType>('quiz'),
    scope: this.fb.control<TaskScope | null>(null, Validators.required),
    course_id: this.fb.control<string | null>(null, Validators.required),
    session_id: this.fb.control<string | null>(null),
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(180)]],
    instructions: ['', [Validators.maxLength(MAX_INSTRUCTIONS)]],
    due_at: this.fb.control<Date | null>(null, Validators.required),
    allow_late: false,
    requires_submission: true,
    questions: this.fb.array<QuestionGroup>([this.questionGroup()])
  });

  protected readonly questions = this.form.controls.questions;
  protected readonly type = signal<TaskType>('quiz');
  protected readonly questionErrors = signal<Record<string, string>>({});

  protected readonly targets = signal<TaskTargetCourse[]>([]);
  protected readonly task = signal<TeacherTask | null>(null);
  protected readonly pendingFile = signal<File | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly publishing = signal(false);

  private readonly courseId = toSignal(this.form.controls.course_id.valueChanges, { initialValue: null });
  private readonly titleValue = toSignal(this.form.controls.title.valueChanges, { initialValue: '' });
  private readonly dueValue = toSignal(this.form.controls.due_at.valueChanges, { initialValue: null });
  protected readonly scope = signal<TaskScope | null>(null);
  private readonly questionsValue = toSignal(this.questions.valueChanges, { initialValue: this.questions.getRawValue() });

  /** La clase individual (1 a 1) ya no se ofrece; solo aparece si la tarea ya la tenía */
  protected readonly scopeOptions = computed(() => SCOPES.filter((option) => option.value !== 'individual' || this.scope() === 'individual'));

  /** Publicada o cerrada: tipo, alcance y entrega quedan fijos */
  protected readonly locked = computed(() => !!this.task() && this.task()!.status !== 'draft');

  protected readonly selectedCourse = computed(() => this.targets().find((course) => course.uuid === this.courseId()) ?? null);
  protected readonly students = computed(() => this.selectedCourse()?.students ?? []);

  protected readonly courseOptions = computed(() => {
    const scope = this.scope();
    return this.targets()
      .filter((course) => !scope || course.scopes.includes(scope))
      .map((course) => ({ value: course.uuid, label: course.finished ? `${course.title} (terminado)` : course.title }));
  });

  protected readonly sessionOptions = computed(() =>
    (this.selectedCourse()?.sessions ?? []).map((session) => ({
      value: session.uuid,
      label: `Clase ${session.number} · ${formatDateTime(session.starts_at)}${session.title && session.title !== this.selectedCourse()?.title ? ` · ${session.title}` : ''}`
    }))
  );

  protected readonly fileName = computed(() => this.pendingFile()?.name ?? this.task()?.file_name ?? null);

  protected readonly minDue = computed(() => {
    const current = this.task();
    return current && current.status !== 'draft' ? new Date(current.due_at) : new Date();
  });

  protected readonly assignHint = computed(() => {
    const course = this.selectedCourse();
    if (!course) return '';
    if (!this.students().length) return 'Todavía no hay inscritos. Quien se inscriba después también la recibirá.';
    if (this.scope() === 'individual') return 'El estudiante de esta clase individual.';
    return `Todos los inscritos en ${course.title}. Quien se inscriba después también la recibirá.`;
  });

  protected readonly previewDetail = computed(() => {
    if (this.type() === 'document') return this.fileName() ? '1 PDF adjunto' : 'Documento';
    const count = this.questionsValue().length;
    return `Quiz · ${count} ${count === 1 ? 'pregunta' : 'preguntas'}`;
  });

  protected readonly previewDue = computed(() => {
    this.titleValue();
    const due = this.dueValue();
    return due ? formatDateTime(due) : 'fecha por definir';
  });

  ngOnInit(): void {
    if (this.isBrowser) void this.load();
  }

  private async load(): Promise<void> {
    try {
      const uuid = this.uuid();
      const [targets, detail] = await Promise.all([this.service.targets(), uuid ? this.service.detail(uuid) : Promise.resolve(null)]);
      this.targets.set(targets);
      if (detail) this.fill(detail.task);
    } catch (err) {
      this.loadError.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  private fill(task: TeacherTask): void {
    this.task.set(task);
    this.scope.set(task.scope);
    this.type.set(task.type);
    this.form.reset({
      type: task.type,
      scope: task.scope,
      course_id: task.course_id,
      session_id: task.session_id,
      title: task.title,
      instructions: task.instructions ?? '',
      due_at: new Date(task.due_at),
      allow_late: task.allow_late,
      requires_submission: task.requires_submission
    });
    this.questions.clear();
    for (const question of task.questions) this.questions.push(this.questionFrom(question));
    if (!this.questions.length) this.questions.push(this.questionGroup());
    if (task.status !== 'draft') {
      for (const key of ['type', 'scope', 'course_id', 'session_id', 'requires_submission'] as const) this.form.controls[key].disable();
      this.questions.disable();
    }
  }

  // ---------- Quiz: preguntas ----------

  private optionGroup(label = '', isCorrect = false): OptionGroup {
    return this.fb.group({ label: [label], is_correct: [isCorrect] });
  }

  /** Pregunta nueva: de opciones con dos respuestas vacías */
  private questionGroup(kind: QuestionKindUi = 'options', prompt = '', options: OptionGroup[] = [this.optionGroup(), this.optionGroup()]): QuestionGroup {
    return this.fb.group({ kind: this.fb.control<QuestionKindUi>(kind), prompt: [prompt], options: this.fb.array<OptionGroup>(options) });
  }

  private questionFrom(question: QuizQuestion): QuestionGroup {
    const kind: QuestionKindUi = question.kind === 'free_text' ? 'free_text' : 'options';
    const options = question.options.map((option) => this.optionGroup(option.label, !!option.is_correct));
    return this.questionGroup(kind, question.prompt, options.length ? options : undefined);
  }

  protected letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected addQuestion(): void {
    if (this.questions.length >= MAX_QUESTIONS) return;
    this.questions.push(this.questionGroup());
    this.questionErrors.set({});
  }

  protected removeQuestion(index: number): void {
    this.questions.removeAt(index);
    this.questionErrors.set({});
  }

  protected addOption(question: number): void {
    const options = this.questions.at(question).controls.options;
    if (options.length < MAX_OPTIONS) options.push(this.optionGroup());
  }

  protected removeOption(question: number, option: number): void {
    const options = this.questions.at(question).controls.options;
    if (options.length > 2) options.removeAt(option);
  }

  protected setType(value: string | null): void {
    if (this.locked() || !value) return;
    this.type.set(value as TaskType);
    this.form.controls.type.setValue(value as TaskType);
    this.questionErrors.set({});
    this.fileError.set(null);
  }

  /** Revisa las preguntas con las mismas reglas del API: texto, 2 a 8 respuestas llenas y al menos una correcta */
  private validateQuestions(): boolean {
    const errors: Record<string, string> = {};
    const list = this.questions.getRawValue();
    if (!list.length) errors['questions'] = 'Agrega al menos una pregunta.';
    list.forEach((question, index) => {
      if (!question.prompt.trim()) errors[`questions.${index}`] = 'Escribe la pregunta.';
      if (question.kind !== 'options') return;
      if (question.options.length < 2) errors[`questions.${index}.options`] = 'Pon al menos 2 respuestas.';
      else if (question.options.some((option) => !option.label.trim())) errors[`questions.${index}.options`] = 'Escribe todas las respuestas o quita las vacías.';
      else if (!question.options.some((option) => option.is_correct)) errors[`questions.${index}.options`] = 'Marca al menos una respuesta correcta.';
    });
    this.questionErrors.set(errors);
    return !Object.keys(errors).length;
  }

  /** Lo que se envía de las preguntas (sin las respuestas de una pregunta libre) */
  private questionPayload(): QuestionPayload[] {
    return this.questions.getRawValue().map((question) => ({
      kind: question.kind,
      prompt: question.prompt.trim(),
      options: question.kind === 'options' ? question.options.map((option) => ({ label: option.label.trim(), is_correct: option.is_correct })) : []
    }));
  }

  protected setScope(value: string | null): void {
    if (this.locked() || !value) return;
    const scope = value as TaskScope;
    this.scope.set(scope);
    this.form.controls.scope.setValue(scope);
    // Si el curso elegido no admite este alcance, se vuelve a elegir
    if (this.selectedCourse() && !this.selectedCourse()!.scopes.includes(scope)) this.form.controls.course_id.setValue(null);
    if (scope !== 'class') this.form.controls.session_id.setValue(null);
    // Si solo hay una opción, se elige sola
    const options = this.courseOptions();
    if (!this.form.controls.course_id.value && options.length === 1) {
      this.form.controls.course_id.setValue(options[0].value);
      this.onCourseChange();
    }
  }

  protected onCourseChange(): void {
    const sessions = this.selectedCourse()?.sessions ?? [];
    // Una clase suelta grupal tiene una sola clase: se elige sola
    this.form.controls.session_id.setValue(this.scope() === 'class' && sessions.length === 1 ? sessions[0].uuid : null);
  }

  protected pickFile(file: File): void {
    this.fileError.set(null);
    this.pendingFile.set(file);
  }

  protected async removeFile(): Promise<void> {
    this.fileError.set(null);
    if (this.pendingFile()) {
      this.pendingFile.set(null);
      return;
    }
    const current = this.task();
    if (!current?.file_name) return;
    try {
      this.task.set(await this.service.removeFile(current.uuid));
    } catch (err) {
      this.fileError.set(apiErrorMessage(err));
    }
  }

  protected dueText(due: Date): string {
    return dueLabel(due);
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  }

  /** Revisa en el navegador lo mismo que el API (para publicar, además: fecha futura y PDF) */
  private validate(publish: boolean): boolean {
    this.form.markAllAsTouched();
    let valid = this.form.valid;
    const raw = this.form.getRawValue();
    if (raw.scope === 'class' && !raw.session_id) {
      this.form.controls.session_id.setErrors({ server: 'Elige la clase.' });
      this.form.controls.session_id.markAsTouched();
      valid = false;
    }
    if (publish && raw.due_at && raw.due_at.getTime() <= Date.now()) {
      this.form.controls.due_at.setErrors({ server: 'La fecha límite debe ser futura.' });
      valid = false;
    }
    if (publish && raw.type === 'document' && !this.fileName()) {
      this.fileError.set('Adjunta el PDF con las instrucciones.');
      valid = false;
    }
    if (raw.type === 'quiz' && !this.locked() && !this.validateQuestions()) {
      valid = false;
      // Si el resto del formulario está bien, lleva a la primera pregunta con error
      if (this.form.controls.title.valid && this.form.controls.due_at.valid) {
        const first = Object.keys(this.questionErrors()).find((key) => key.startsWith('questions.'));
        const id = first ? `question-${first.split('.')[1]}` : 'task-title';
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
        return false;
      }
    }
    if (!valid) setTimeout(() => focusFirstInvalid(this.formEl()?.nativeElement));
    return valid;
  }

  protected askPublish(): void {
    this.error.set(null);
    if (!this.validate(true)) return;
    const count = this.students().length;
    this.confirmation.confirm({
      header: 'Publicar y notificar',
      message:
        count === 0
          ? 'Todavía no hay inscritos: la tarea quedará publicada y la recibirán quienes se inscriban.'
          : `La tarea se asignará a ${count} ${count === 1 ? 'estudiante' : 'estudiantes'} y les llegará un aviso.`,
      icon: 'pi pi-send',
      acceptLabel: 'Publicar',
      rejectLabel: 'Cancelar',
      accept: () => void this.save(true)
    });
  }

  protected async save(publish: boolean): Promise<void> {
    this.error.set(null);
    if (!publish && !this.validate(false)) return;

    const raw = this.form.getRawValue();
    const payload: TaskPayload = {
      type: raw.type,
      scope: raw.scope!,
      course_id: raw.course_id!,
      session_id: raw.scope === 'class' ? raw.session_id : null,
      title: raw.title.trim(),
      instructions: raw.instructions.trim() || null,
      due_at: raw.due_at!.toISOString(),
      allow_late: raw.allow_late,
      requires_submission: raw.type === 'document' && raw.requires_submission,
      notify_email: false,
      ...(raw.type === 'quiz' ? { questions: this.questionPayload() } : {})
    };

    this.saving.set(true);
    this.publishing.set(publish);
    try {
      const current = this.task();
      let saved = current ? await this.service.update(current.uuid, payload) : await this.service.create(payload);
      this.task.set(saved);
      const file = this.pendingFile();
      if (file) {
        saved = await this.service.uploadFile(saved.uuid, file);
        this.task.set(saved);
        this.pendingFile.set(null);
      }
      let notice = current ? 'Cambios guardados.' : 'Borrador guardado.';
      if (publish) {
        const { assigned } = await this.service.publish(saved.uuid, false);
        notice = assigned === 0 ? 'Tarea publicada. La recibirán quienes se inscriban.' : `Tarea publicada: llegó a ${assigned} ${assigned === 1 ? 'estudiante' : 'estudiantes'}.`;
      }
      void this.router.navigate(['/app/tareas', saved.uuid], { state: { notice } });
    } catch (err) {
      const fields = apiFieldErrors(err);
      const controls = this.form.controls;
      applyServerErrors(fields, {
        title: controls.title,
        instructions: controls.instructions,
        due_at: controls.due_at,
        scope: controls.scope,
        course_id: controls.course_id,
        session_id: controls.session_id,
        requires_submission: controls.requires_submission
      });
      if (fields['file']) this.fileError.set(fields['file']);
      this.questionErrors.set(Object.fromEntries(Object.entries(fields).filter(([key]) => key === 'questions' || key.startsWith('questions.'))));
      this.error.set(apiErrorMessage(err));
    } finally {
      this.saving.set(false);
      this.publishing.set(false);
    }
  }
}
