import { Component, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Message } from 'primeng/message';
import { RadioButton } from 'primeng/radiobutton';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { apiErrorMessage, apiFieldErrors } from '../../../../../core/http/api-error';
import { ToastService } from '../../../../../core/notify/toast.service';
import { PdfDropzone } from '../components/pdf-dropzone';
import { QuizAnswer, QuizQuestion, StudentTask } from '../tasks.models';
import { TasksService } from '../tasks.service';
import { TYPE_LABEL, dueLabel, formatDateTime, stateTag, targetLabel } from '../tasks.utils';

/**
 * Detalle de una tarea (estudiante): fecha límite, instrucciones y, según el tipo, descargar la guía y entregar su
 * respuesta en PDF (documento) o responder el quiz en un solo intento y ver su nota.
 */
@Component({
  selector: 'app-student-task-page',
  imports: [FormsModule, RouterLink, ButtonDirective, Card, Checkbox, ConfirmDialog, Message, RadioButton, Skeleton, Tag, Textarea, PdfDropzone],
  providers: [ConfirmationService],
  template: `
    <a pButton routerLink="/app/tareas" label="Mis tareas" icon="pi pi-arrow-left" severity="secondary" [text]="true" class="-ml-3 mb-2"></a>

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    @if (task(); as current) {
      <header class="mb-5">
        <div class="flex flex-wrap items-center gap-2">
          <p-tag [value]="tag().label" [icon]="tag().icon" [severity]="tag().severity" [rounded]="true" />
          <p-tag [value]="typeLabel[current.type]" severity="secondary" [rounded]="true" />
        </div>
        <h1 class="mt-2 font-display text-2xl font-semibold text-tz-title sm:text-3xl">{{ current.title }}</h1>
        <p class="mt-1 text-sm">{{ target() }}{{ current.teacher_name ? ' · Prof. ' + current.teacher_name : '' }}</p>
      </header>

      <div class="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
        <div class="min-w-0 space-y-5">
          <!-- Fecha límite -->
          <div class="flex items-center gap-3 rounded-2xl border p-4" [class]="current.state === 'overdue' ? 'border-tz-live/50 bg-tz-live/5' : 'border-tz-surface-border bg-tz-surface'">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="pi pi-calendar-clock text-xl"></i></span>
            <div>
              <p class="font-semibold text-tz-title">{{ due() }}</p>
              <p class="text-xs">{{ current.allow_late ? (current.type === 'quiz' ? 'Acepta respuestas tardías (quedan marcadas).' : 'Acepta entregas tardías (quedan marcadas).') : current.type === 'quiz' ? 'No acepta respuestas después de la fecha límite.' : current.requires_submission ? 'No acepta entregas después de la fecha límite.' : 'Tarea de lectura: no hay que entregar nada.' }}</p>
            </div>
          </div>

          <p-card class="border border-tz-surface-border">
            <h2 class="text-lg font-semibold">{{ current.type === 'quiz' ? 'Instrucciones' : 'Guía de la tarea' }}</h2>
            @if (current.type === 'quiz' && !current.instructions) {
              <p class="mt-2 text-sm">Responde las preguntas y envía. Solo tienes un intento.</p>
            }
            @if (current.instructions) {
              <p class="mt-2 whitespace-pre-line text-sm leading-relaxed">{{ current.instructions }}</p>
            }
            @if (current.file_name) {
              <a
                [href]="service.studentFileUrl(current.uuid)"
                target="_blank"
                rel="noopener"
                class="mt-4 flex min-h-14 items-center gap-3 rounded-xl border border-tz-line bg-tz-soft p-3 transition-colors hover:border-tz-subtitle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tz-subtitle"
              >
                <i class="pi pi-file-pdf text-2xl text-tz-subtitle" aria-hidden="true"></i>
                <span class="min-w-0 flex-1">
                  <span class="block truncate font-semibold text-tz-title">{{ current.file_name }}</span>
                  <span class="text-xs">Abrir o descargar el PDF</span>
                </span>
                <i class="pi pi-download text-tz-subtitle" aria-hidden="true"></i>
              </a>
            }
          </p-card>

          @if (current.type === 'quiz' && current.quiz; as quiz) {
            @if (quiz.attempt; as attempt) {
              <!-- Resultado -->
              <p-card class="border border-tz-surface-border">
                <h2 class="text-lg font-semibold">Tu resultado</h2>
                <div class="mt-3 flex flex-wrap items-center gap-4">
                  @if (attempt.grade !== null) {
                    <p class="font-display text-4xl font-semibold text-tz-title">{{ gradeText(attempt.grade) }}<span class="text-lg font-medium"> / 100</span></p>
                    <p class="text-sm">{{ pointsText(attempt.score) }} de {{ pointsText(attempt.max_score) }} puntos en las preguntas de opciones.</p>
                  } @else {
                    <p class="text-sm">Tus respuestas están con tu profe: este quiz no tiene preguntas que se califiquen solas.</p>
                  }
                </div>
                @if (attempt.pending_review) {
                  <p class="mt-3 flex items-center gap-2 text-sm"><i class="pi pi-hourglass text-tz-subtitle" aria-hidden="true"></i>{{ attempt.pending_review === 1 ? 'Tu profe lee 1 respuesta libre.' : 'Tu profe lee ' + attempt.pending_review + ' respuestas libres.' }}</p>
                }
                <p class="mt-3 text-xs">Respondido el {{ date(attempt.submitted_at) }}{{ attempt.is_late ? ' · tardío' : ' · a tiempo' }}</p>
              </p-card>

              <p-card class="border border-tz-surface-border">
                <h2 class="text-lg font-semibold">Tus respuestas</h2>
                @if (!revealed() && hasChoice()) {
                  <p class="mt-1 text-xs">Las respuestas correctas se muestran cuando el profe cierre el quiz.</p>
                }
                <ol class="mt-4 space-y-5">
                  @for (question of quiz.questions; track question.uuid; let qi = $index) {
                    <li>
                      <p class="font-medium text-tz-title">{{ qi + 1 }}. {{ question.prompt }}</p>
                      @if (question.kind === 'free_text') {
                        <p class="mt-2 whitespace-pre-line rounded-xl bg-tz-soft p-3 text-sm">{{ answerOf(attempt.answers, question)?.text }}</p>
                      } @else {
                        <ul class="mt-2 space-y-1.5">
                          @for (option of question.options; track option.uuid; let oi = $index) {
                            <li class="flex items-start gap-2 text-sm">
                              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-tz-soft text-xs font-bold text-tz-subtitle" aria-hidden="true">{{ letter(oi) }}</span>
                              <span class="flex-1 pt-0.5" [class.font-semibold]="chosen(attempt.answers, question, option.uuid)" [class.text-tz-title]="chosen(attempt.answers, question, option.uuid)">{{ option.label }}</span>
                              @if (chosen(attempt.answers, question, option.uuid)) {
                                <span class="pt-0.5 text-xs">Tu respuesta</span>
                              }
                              @if (option.is_correct) {
                                <i class="pi pi-check pt-1 text-tz-subtitle" aria-label="Respuesta correcta"></i>
                              }
                            </li>
                          }
                        </ul>
                        <p class="mt-2 flex items-center gap-1.5 text-xs font-medium" [class]="answerOf(attempt.answers, question)?.is_correct ? 'text-tz-subtitle' : 'text-red-600 dark:text-red-300'">
                          <i [class]="answerOf(attempt.answers, question)?.is_correct ? 'pi pi-check-circle' : 'pi pi-times-circle'" aria-hidden="true"></i>{{ answerOf(attempt.answers, question)?.is_correct ? 'Correcta' : 'Incorrecta' }}
                        </p>
                      }
                    </li>
                  }
                </ol>
              </p-card>
            } @else if (current.can_submit) {
              <!-- Responder -->
              <p-card class="border border-tz-surface-border">
                <h2 class="text-lg font-semibold">Preguntas</h2>
                <ol class="mt-4 space-y-6">
                  @for (question of quiz.questions; track question.uuid; let qi = $index) {
                    <li [id]="'answer-' + qi">
                      <p class="font-medium text-tz-title">{{ qi + 1 }}. {{ question.prompt }}</p>
                      @if (question.kind === 'free_text') {
                        <textarea pTextarea rows="4" class="mt-2 w-full" maxlength="5000" placeholder="Escribe tu respuesta" [attr.aria-label]="'Respuesta a la pregunta ' + (qi + 1)" [ngModel]="texts()[question.uuid]" (ngModelChange)="setText(question.uuid, $event)"></textarea>
                      } @else {
                        <p class="mt-1 text-xs">{{ question.kind === 'multiple' ? 'Elige todas las que correspondan.' : 'Elige una.' }}</p>
                        <div class="mt-2 space-y-2" role="group" [attr.aria-label]="'Respuestas de la pregunta ' + (qi + 1)">
                          @for (option of question.options; track option.uuid; let oi = $index) {
                            <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors" [class]="isPicked(question.uuid, option.uuid) ? 'border-tz-subtitle bg-tz-soft' : 'border-tz-line hover:border-tz-subtitle'">
                              @if (question.kind === 'multiple') {
                                <p-checkbox [binary]="true" [ngModel]="isPicked(question.uuid, option.uuid)" (ngModelChange)="toggle(question.uuid, option.uuid, $event)" />
                              } @else {
                                <p-radiobutton [name]="'q-' + question.uuid" [value]="option.uuid" [ngModel]="picked()[question.uuid]?.[0] ?? null" (ngModelChange)="pick(question.uuid, $event)" />
                              }
                              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-tz-soft text-xs font-bold text-tz-subtitle" aria-hidden="true">{{ letter(oi) }}</span>
                              <span class="min-w-0 flex-1">{{ option.label }}</span>
                            </label>
                          }
                        </div>
                      }
                      @if (answerErrors()[question.uuid]; as message) {
                        <p class="mt-2 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert"><i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}</p>
                      }
                    </li>
                  }
                </ol>
                <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p class="text-sm">{{ answeredCount() }} de {{ quiz.questions.length }} respondidas</p>
                  <button pButton type="button" label="Enviar respuestas" icon="pi pi-send" [loading]="uploading()" [disabled]="uploading()" (click)="askSend()"></button>
                </div>
              </p-card>
            } @else {
              <p-card class="border border-tz-surface-border">
                <p class="text-sm">{{ closedReason() }}</p>
              </p-card>
            }
          }
        </div>

        <!-- Quiz: resumen -->
        @if (current.type === 'quiz') {
          <p-card class="border border-tz-surface-border lg:sticky lg:top-24">
            <h2 class="text-lg font-semibold">Tu quiz</h2>
            <ul class="mt-3 space-y-2 text-sm">
              <li class="flex items-center gap-2"><i class="pi pi-list-check text-tz-subtitle" aria-hidden="true"></i>{{ questionCount() }} {{ questionCount() === 1 ? 'pregunta' : 'preguntas' }}</li>
              <li class="flex items-center gap-2"><i class="pi pi-replay text-tz-subtitle" aria-hidden="true"></i>Un solo intento</li>
              <li class="flex items-center gap-2"><i class="pi pi-calendar-clock text-tz-subtitle" aria-hidden="true"></i>{{ due() }}</li>
            </ul>
          </p-card>
        }

        <!-- Entrega -->
        @if (current.type === 'document' && current.requires_submission) {
          <p-card class="border border-tz-surface-border lg:sticky lg:top-24">
            <h2 class="text-lg font-semibold">Tu entrega</h2>
            <div class="mt-3">
              @if (current.submission || current.can_submit) {
                <app-pdf-dropzone
                  [fileName]="current.submission?.file_name ?? null"
                  [caption]="submissionCaption()"
                  [viewUrl]="current.submission ? service.mySubmissionUrl(current.uuid) : null"
                  prompt="Arrastra aquí tu respuesta en PDF"
                  [removable]="false"
                  [disabled]="!current.can_submit || uploading()"
                  [externalError]="uploadError()"
                  (picked)="submit($event)"
                />
              }
              @if (uploading()) {
                <p class="mt-2 flex items-center gap-2 text-sm" role="status"><i class="pi pi-spin pi-spinner text-tz-subtitle" aria-hidden="true"></i> Subiendo tu entrega…</p>
              }
              @if (!current.can_submit) {
                <p class="mt-3 text-sm">{{ closedReason() }}</p>
              } @else if (current.past_due) {
                <p class="mt-3 text-sm">Pasó la fecha límite: tu entrega quedará marcada como tardía.</p>
              } @else if (current.submission) {
                <p class="mt-3 text-xs">Puedes reemplazarla hasta la fecha límite; se guarda solo la última.</p>
              }
            </div>
          </p-card>
        }
      </div>
    } @else if (loading()) {
      <p-skeleton height="8rem" borderRadius="1.25rem" />
      <p-skeleton height="14rem" borderRadius="1.25rem" styleClass="mt-5" />
    }

    <p-confirmdialog rejectButtonStyleClass="p-button-text p-button-secondary" />
  `
})
export class StudentTaskPage implements OnInit {
  protected readonly service = inject(TasksService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);

  readonly uuid = input.required<string>();

  protected readonly typeLabel = TYPE_LABEL;
  protected readonly task = signal<StudentTask | null>(null);
  protected readonly loading = signal(true);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);

  // Quiz: lo que va marcando y escribiendo el estudiante (por uuid de pregunta)
  protected readonly picked = signal<Record<string, string[]>>({});
  protected readonly texts = signal<Record<string, string>>({});
  protected readonly answerErrors = signal<Record<string, string>>({});

  protected readonly questionCount = computed(() => this.task()?.quiz?.questions.length ?? 0);
  /** Con las correctas a la vista (el profe cerró el quiz o lo permitió) */
  protected readonly revealed = computed(() => !!this.task()?.quiz?.questions.some((q) => q.options.some((o) => o.is_correct !== undefined)));
  protected readonly hasChoice = computed(() => !!this.task()?.quiz?.questions.some((q) => q.kind !== 'free_text'));
  protected readonly answeredCount = computed(() => (this.task()?.quiz?.questions ?? []).filter((q) => this.isAnswered(q)).length);

  protected readonly tag = computed(() => stateTag(this.task()!.state, this.task()!.due_at));
  protected readonly target = computed(() => targetLabel(this.task()!.course, this.task()!.session));
  protected readonly due = computed(() => dueLabel(this.task()!.due_at));

  protected readonly submissionCaption = computed(() => {
    const submission = this.task()?.submission;
    if (!submission) return '';
    return `Entregada el ${formatDateTime(submission.submitted_at)}${submission.is_late ? ' · tardía' : ' · a tiempo'}`;
  });

  protected readonly closedReason = computed(() => {
    const current = this.task()!;
    if (current.type === 'quiz') return current.status === 'closed' ? 'El profe cerró este quiz; ya no recibe respuestas.' : 'Pasó la fecha límite y este quiz no acepta respuestas tardías.';
    if (current.status === 'closed') return 'El profe cerró esta tarea; ya no recibe entregas.';
    return current.submission ? 'Pasó la fecha límite: tu entrega ya no se puede cambiar.' : 'Pasó la fecha límite y esta tarea no acepta entregas tardías.';
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.service
      .myTask(this.uuid())
      .then((task) => this.task.set(task))
      .catch((err) => this.error.set(apiErrorMessage(err)))
      .finally(() => this.loading.set(false));
  }

  protected letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected date(value: string): string {
    return formatDateTime(value);
  }

  protected gradeText(grade: number): string {
    return Number.isInteger(grade) ? String(grade) : grade.toFixed(1);
  }

  protected pointsText(points: number | null): string {
    return points === null ? '0' : Number.isInteger(points) ? String(points) : points.toFixed(1);
  }

  protected answerOf(answers: QuizAnswer[], question: QuizQuestion): QuizAnswer | undefined {
    return answers.find((answer) => answer.question_id === question.uuid);
  }

  protected chosen(answers: QuizAnswer[], question: QuizQuestion, optionId: string): boolean {
    return !!this.answerOf(answers, question)?.option_ids.includes(optionId);
  }

  protected isPicked(questionId: string, optionId: string): boolean {
    return !!this.picked()[questionId]?.includes(optionId);
  }

  protected pick(questionId: string, optionId: string | null): void {
    this.picked.update((all) => ({ ...all, [questionId]: optionId ? [optionId] : [] }));
    this.clearError(questionId);
  }

  protected toggle(questionId: string, optionId: string, on: boolean): void {
    this.picked.update((all) => {
      const current = (all[questionId] ?? []).filter((id) => id !== optionId);
      return { ...all, [questionId]: on ? [...current, optionId] : current };
    });
    this.clearError(questionId);
  }

  protected setText(questionId: string, value: string): void {
    this.texts.update((all) => ({ ...all, [questionId]: value }));
    this.clearError(questionId);
  }

  private clearError(questionId: string): void {
    if (this.answerErrors()[questionId]) this.answerErrors.update(({ [questionId]: _, ...rest }) => rest);
  }

  private isAnswered(question: QuizQuestion): boolean {
    return question.kind === 'free_text' ? !!this.texts()[question.uuid]?.trim() : !!this.picked()[question.uuid]?.length;
  }

  /** Revisa que no falte ninguna y confirma: solo hay un intento */
  protected askSend(): void {
    const questions = this.task()?.quiz?.questions ?? [];
    const errors: Record<string, string> = {};
    for (const question of questions) {
      if (!this.isAnswered(question)) errors[question.uuid] = question.kind === 'free_text' ? 'Escribe tu respuesta.' : 'Elige una respuesta.';
    }
    this.answerErrors.set(errors);
    const firstMissing = questions.findIndex((question) => errors[question.uuid]);
    if (firstMissing >= 0) {
      document.getElementById('answer-' + firstMissing)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    this.confirmation.confirm({
      header: 'Enviar respuestas',
      message: 'Solo tienes un intento: después de enviar no podrás cambiar tus respuestas.',
      icon: 'pi pi-send',
      acceptLabel: 'Enviar',
      rejectLabel: 'Revisar',
      accept: () => void this.sendQuiz()
    });
  }

  private async sendQuiz(): Promise<void> {
    const questions = this.task()?.quiz?.questions ?? [];
    this.uploading.set(true);
    try {
      const task = await this.service.submitQuiz(
        this.uuid(),
        questions.map((question) => ({ question_id: question.uuid, option_ids: this.picked()[question.uuid] ?? [], text: this.texts()[question.uuid] ?? '' }))
      );
      this.task.set(task);
      this.toast.success(task.quiz?.attempt?.is_late ? 'Respuestas recibidas (tardías).' : '¡Respuestas recibidas!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const fields = apiFieldErrors(err);
      const byQuestion: Record<string, string> = {};
      questions.forEach((question, index) => {
        if (fields[`questions.${index}`]) byQuestion[question.uuid] = fields[`questions.${index}`];
      });
      this.answerErrors.set(byQuestion);
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.uploading.set(false);
    }
  }

  protected async submit(file: File): Promise<void> {
    this.uploadError.set(null);
    this.uploading.set(true);
    const replacing = !!this.task()?.submission;
    try {
      const task = await this.service.submit(this.uuid(), file);
      this.task.set(task);
      this.toast.success(replacing ? 'Entrega reemplazada.' : task.submission?.is_late ? 'Entrega recibida (tardía).' : '¡Entrega recibida!');
    } catch (err) {
      this.uploadError.set(apiErrorMessage(err));
    } finally {
      this.uploading.set(false);
    }
  }
}
