import { Component, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Avatar } from 'primeng/avatar';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Message } from 'primeng/message';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { apiErrorMessage } from '../../../../../core/http/api-error';
import { ToastService } from '../../../../../core/notify/toast.service';
import { QuizAnswer, QuizQuestion, TaskStudent, TeacherTask } from '../tasks.models';
import { TasksService } from '../tasks.service';
import { SCOPE_LABEL, STATUS_TAG, TYPE_LABEL, dueLabel, formatDateTime, stateTag, targetLabel } from '../tasks.utils';

type StudentFilter = 'all' | 'submitted' | 'missing';

/**
 * Detalle de una tarea (profe): datos, acciones (editar, cerrar, eliminar borrador) y cada estudiante asignado con
 * su estado y su entrega para descargar. Arriba muestra el aviso que dejó el editor ("Tarea publicada: llegó a…").
 */
@Component({
  selector: 'app-teacher-task-detail-page',
  imports: [FormsModule, RouterLink, Avatar, ButtonDirective, Card, ConfirmDialog, Message, SelectButton, Skeleton, Tag],
  providers: [ConfirmationService],
  template: `
    <a pButton routerLink="/app/tareas" label="Todas las tareas" icon="pi pi-arrow-left" severity="secondary" [text]="true" class="-ml-3 mb-2"></a>

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    @if (task(); as current) {
      <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p-tag [value]="statusTag[current.status].label" [icon]="statusTag[current.status].icon" [severity]="statusTag[current.status].severity" [rounded]="true" />
            <p-tag [value]="typeLabel[current.type]" severity="secondary" [rounded]="true" />
          </div>
          <h1 class="mt-2 font-display text-3xl font-semibold text-tz-title">{{ current.title }}</h1>
          <p class="mt-1 text-sm">{{ scopeLabel[current.scope] }} · {{ target(current) }}</p>
          <p class="mt-1 flex items-center gap-2 text-sm font-medium text-tz-title"><i class="pi pi-calendar-clock text-tz-subtitle" aria-hidden="true"></i>{{ due(current) }}{{ current.allow_late ? ' · acepta tardías' : '' }}</p>
        </div>
        <div class="flex w-full flex-wrap gap-2 sm:w-auto">
          @if (current.status !== 'closed') {
            <a pButton [routerLink]="['/app/tareas', current.uuid, 'editar']" [label]="current.status === 'draft' ? 'Editar y publicar' : 'Editar'" icon="pi pi-pencil" [severity]="current.status === 'draft' ? undefined : 'secondary'" [outlined]="current.status !== 'draft'" class="flex-1 sm:flex-none"></a>
          }
          @if (current.status === 'published') {
            <button pButton type="button" label="Cerrar tarea" icon="pi pi-lock" severity="secondary" [outlined]="true" class="flex-1 sm:flex-none" [loading]="busy()" (click)="askClose()"></button>
          }
          @if (current.status === 'draft') {
            <button pButton type="button" label="Eliminar" icon="pi pi-trash" severity="secondary" [text]="true" class="flex-1 sm:flex-none" [loading]="busy()" (click)="askRemove()"></button>
          }
        </div>
      </header>

      <div class="grid items-start gap-5 xl:grid-cols-[1fr_20rem]">
        <div class="min-w-0 space-y-5">
          @if (current.status === 'draft') {
            <p-message severity="secondary">Es un borrador: todavía no se asignó a nadie. Publícalo para que les llegue a tus estudiantes.</p-message>
          } @else {
            <!-- Resumen -->
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              @for (stat of stats(); track stat.label) {
                <div class="rounded-2xl border border-tz-surface-border bg-tz-surface p-4">
                  <p class="font-display text-2xl font-semibold text-tz-title">{{ stat.value }}</p>
                  <p class="text-xs">{{ stat.label }}</p>
                </div>
              }
            </div>

            <!-- Estudiantes -->
            <p-card class="border border-tz-surface-border">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">Estudiantes</h2>
                @if (takesEntries(current)) {
                  <p-selectbutton [options]="filters" optionLabel="label" optionValue="value" [ngModel]="filter()" (ngModelChange)="filter.set($event)" [allowEmpty]="false" aria-label="Filtrar estudiantes" />
                }
              </div>
              <ul class="mt-4 divide-y divide-tz-line" aria-label="Estudiantes asignados">
                @for (student of visibleStudents(); track student.uuid) {
                  <li class="flex flex-wrap items-center gap-3 py-3">
                    @if (student.avatar_url) {
                      <p-avatar [image]="student.avatar_url" shape="circle" />
                    } @else {
                      <p-avatar [label]="initials(student.name)" shape="circle" class="tz-bg-gradient text-xs text-white" />
                    }
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-medium text-tz-title">{{ student.name }}</p>
                      <p class="text-xs">{{ rowText(current, student) }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      @if (student.attempt; as attempt) {
                        @if (attempt.grade !== null) {
                          <p-tag [value]="gradeText(attempt.grade) + ' / 100'" [rounded]="true" />
                        }
                        @if (attempt.pending_review) {
                          <p-tag [value]="attempt.pending_review + ' por leer'" severity="warn" [rounded]="true" />
                        }
                      }
                      @if (student.submission?.is_late || student.attempt?.is_late) {
                        <p-tag value="Tardía" severity="warn" [rounded]="true" />
                      }
                      <p-tag [value]="tag(student).label" [severity]="tag(student).severity" [rounded]="true" />
                      @if (student.attempt) {
                        <button pButton type="button" [label]="open() === student.uuid ? 'Ocultar' : 'Ver respuestas'" [icon]="open() === student.uuid ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" severity="secondary" [text]="true" [attr.aria-expanded]="open() === student.uuid" (click)="toggle(student.uuid)"></button>
                      }
                      @if (student.submission) {
                        <a pButton [href]="service.submissionFileUrl(current.uuid, student.uuid)" target="_blank" rel="noopener" icon="pi pi-download" severity="secondary" [text]="true" [rounded]="true" [attr.aria-label]="'Ver la entrega de ' + student.name"></a>
                      }
                    </div>
                    @if (student.attempt; as attempt) {
                      @if (open() === student.uuid) {
                        <ol class="mt-1 w-full space-y-4 rounded-xl bg-tz-soft p-4">
                          @for (question of current.questions; track question.uuid; let qi = $index) {
                            <li>
                              <p class="text-sm font-medium text-tz-title">{{ qi + 1 }}. {{ question.prompt }}</p>
                              @if (question.kind === 'free_text') {
                                <p class="mt-1 whitespace-pre-line rounded-lg bg-tz-card p-3 text-sm">{{ answerOf(attempt.answers, question)?.text || 'Sin respuesta' }}</p>
                              } @else {
                                <p class="mt-1 text-sm">
                                  <span class="font-medium text-tz-title">{{ chosenLabels(attempt.answers, question) || 'Sin respuesta' }}</span>
                                  <span class="ml-2 inline-flex items-center gap-1 text-xs font-medium" [class]="answerOf(attempt.answers, question)?.is_correct ? 'text-tz-subtitle' : 'text-red-600 dark:text-red-300'">
                                    <i [class]="answerOf(attempt.answers, question)?.is_correct ? 'pi pi-check-circle' : 'pi pi-times-circle'" aria-hidden="true"></i>{{ answerOf(attempt.answers, question)?.is_correct ? 'Correcta' : 'Incorrecta' }}
                                  </span>
                                </p>
                              }
                            </li>
                          }
                        </ol>
                      }
                    }
                  </li>
                } @empty {
                  <li class="py-6 text-center text-sm">{{ students().length ? 'Nadie en este filtro.' : 'Todavía no hay inscritos. Quien se inscriba la recibirá.' }}</li>
                }
              </ul>
            </p-card>
          }
        </div>

        <aside class="space-y-5">
          <p-card class="border border-tz-surface-border">
            @if (current.type === 'quiz') {
              <h2 class="text-base font-semibold">Preguntas</h2>
              <ol class="mt-3 space-y-3">
                @for (question of current.questions; track question.uuid; let qi = $index) {
                  <li class="text-sm">
                    <p class="font-medium text-tz-title">{{ qi + 1 }}. {{ question.prompt }}</p>
                    @if (question.kind === 'free_text') {
                      <p class="mt-0.5 text-xs">Respuesta libre: la lees tú.</p>
                    } @else {
                      <ul class="mt-1 space-y-0.5">
                        @for (option of question.options; track option.uuid; let oi = $index) {
                          <li class="flex items-start gap-2 text-xs">
                            <span class="w-4 shrink-0 font-bold text-tz-subtitle">{{ letter(oi) }}</span>
                            <span class="flex-1" [class.font-semibold]="option.is_correct" [class.text-tz-title]="option.is_correct">{{ option.label }}</span>
                            @if (option.is_correct) {
                              <i class="pi pi-check text-tz-subtitle" aria-label="Correcta"></i>
                            }
                          </li>
                        }
                      </ul>
                    }
                  </li>
                }
              </ol>
              @if (current.instructions) {
                <h3 class="mt-4 text-sm font-semibold text-tz-title">Instrucciones</h3>
                <p class="mt-1 whitespace-pre-line text-sm">{{ current.instructions }}</p>
              }
              <p class="mt-4 text-xs">Un solo intento. Las de opciones se califican solas; las libres las lees tú.</p>
            } @else {
            <h2 class="text-base font-semibold">Guía</h2>
            @if (current.file_name) {
              <a [href]="service.teacherFileUrl(current.uuid)" target="_blank" rel="noopener" class="mt-3 flex min-h-11 items-center gap-3 rounded-xl bg-tz-soft p-3 hover:underline">
                <i class="pi pi-file-pdf text-xl text-tz-subtitle" aria-hidden="true"></i>
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-tz-title">{{ current.file_name }}</span>
                <i class="pi pi-external-link text-xs" aria-hidden="true"></i>
              </a>
            } @else {
              <p class="mt-2 text-sm">Sin PDF todavía.</p>
            }
            @if (current.instructions) {
              <h3 class="mt-4 text-sm font-semibold text-tz-title">Instrucciones</h3>
              <p class="mt-1 whitespace-pre-line text-sm">{{ current.instructions }}</p>
            }
            <p class="mt-4 text-xs">{{ current.requires_submission ? 'Pide entrega en PDF.' : 'No pide entrega (solo lectura).' }}</p>
            }
          </p-card>
        </aside>
      </div>
    } @else if (loading()) {
      <p-skeleton height="8rem" borderRadius="1.25rem" />
      <p-skeleton height="16rem" borderRadius="1.25rem" styleClass="mt-5" />
    }

    <p-confirmdialog rejectButtonStyleClass="p-button-text p-button-secondary" />
  `
})
export class TeacherTaskDetailPage implements OnInit {
  protected readonly service = inject(TasksService);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly uuid = input.required<string>();

  protected readonly statusTag = STATUS_TAG;
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly scopeLabel = SCOPE_LABEL;
  protected readonly filters: { value: StudentFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'submitted', label: 'Completaron' },
    { value: 'missing', label: 'Faltan' }
  ];

  protected readonly task = signal<TeacherTask | null>(null);
  protected readonly students = signal<TaskStudent[]>([]);
  protected readonly filter = signal<StudentFilter>('all');
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Aviso que deja el editor al guardar o publicar */
  private readonly notice = (this.router.getCurrentNavigation()?.extras.state?.['notice'] as string | undefined) ?? null;

  protected readonly visibleStudents = computed(() => {
    const filter = this.filter();
    return this.students().filter((s) => filter === 'all' || (filter === 'submitted' ? !!(s.submission || s.attempt) : !(s.submission || s.attempt)));
  });

  protected readonly stats = computed(() => {
    const current = this.task();
    const s = current?.stats ?? { assigned: 0, submitted: 0, late: 0 };
    if (!current || !this.takesEntries(current)) return [{ label: 'Asignados', value: s.assigned }];
    const quiz = current.type === 'quiz';
    return [
      { label: 'Asignados', value: s.assigned },
      { label: quiz ? 'Respondieron' : 'Entregaron', value: s.submitted },
      { label: 'Tardías', value: s.late },
      { label: 'Faltan', value: Math.max(0, s.assigned - s.submitted) }
    ];
  });

  ngOnInit(): void {
    if (this.notice) this.toast.success(this.notice);
    if (this.isBrowser) void this.load();
  }

  private async load(): Promise<void> {
    try {
      const { task, students } = await this.service.detail(this.uuid());
      this.task.set(task);
      this.students.set(students);
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  /** Quiz: respuestas abiertas de un estudiante (una a la vez) */
  protected readonly open = signal<string | null>(null);

  protected takesEntries(task: TeacherTask): boolean {
    return task.type === 'quiz' || task.requires_submission;
  }

  protected rowText(task: TeacherTask, student: TaskStudent): string {
    if (student.attempt) return 'Respondió el ' + this.date(student.attempt.submitted_at);
    if (student.submission) return 'Entregó el ' + this.date(student.submission.submitted_at);
    if (task.type === 'quiz') return 'Sin responder';
    return task.requires_submission ? 'Sin entrega' : 'Solo lectura';
  }

  protected toggle(uuid: string): void {
    this.open.update((current) => (current === uuid ? null : uuid));
  }

  protected letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected gradeText(grade: number): string {
    return Number.isInteger(grade) ? String(grade) : grade.toFixed(1);
  }

  protected answerOf(answers: QuizAnswer[], question: QuizQuestion): QuizAnswer | undefined {
    return answers.find((answer) => answer.question_id === question.uuid);
  }

  /** "B, C" y el texto de lo que marcó */
  protected chosenLabels(answers: QuizAnswer[], question: QuizQuestion): string {
    const ids = this.answerOf(answers, question)?.option_ids ?? [];
    return question.options
      .map((option, index) => ({ option, index }))
      .filter(({ option }) => ids.includes(option.uuid))
      .map(({ option, index }) => this.letter(index) + '. ' + option.label)
      .join(' · ');
  }

  protected target(task: TeacherTask): string {
    return targetLabel(task.course, task.session);
  }

  protected due(task: TeacherTask): string {
    return dueLabel(task.due_at);
  }

  protected date(value: string): string {
    return formatDateTime(value);
  }

  protected tag(student: TaskStudent) {
    return stateTag(student.state, this.task()!.due_at);
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  }

  protected askClose(): void {
    this.confirmation.confirm({
      header: 'Cerrar tarea',
      message: 'Ya no se aceptarán entregas, ni siquiera tardías. ¿Cerrarla?',
      icon: 'pi pi-lock',
      acceptLabel: 'Cerrar tarea',
      rejectLabel: 'Cancelar',
      accept: () => void this.run(async () => {
        this.task.set(await this.service.close(this.uuid()));
        this.toast.success('Tarea cerrada.');
      })
    });
  }

  protected askRemove(): void {
    this.confirmation.confirm({
      header: 'Eliminar borrador',
      message: '¿Eliminar este borrador y su PDF? No se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.run(async () => {
        await this.service.remove(this.uuid());
        void this.router.navigate(['/app/tareas']);
      })
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      await action();
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
