import { Component, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { apiErrorMessage } from '../../../../../core/http/api-error';
import { PdfDropzone } from '../components/pdf-dropzone';
import { StudentTask } from '../tasks.models';
import { TasksService } from '../tasks.service';
import { TYPE_LABEL, dueLabel, formatDateTime, stateTag, targetLabel } from '../tasks.utils';

/**
 * Detalle de una tarea tipo documento (estudiante): fecha límite, instrucciones, descargar la guía y, si la pide,
 * entregar su respuesta en PDF (se puede reemplazar hasta la fecha límite; tardía solo si la tarea lo permite).
 */
@Component({
  selector: 'app-student-task-page',
  imports: [RouterLink, ButtonDirective, Card, Message, Skeleton, Tag, PdfDropzone],
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
              <p class="text-xs">{{ current.allow_late ? 'Acepta entregas tardías (quedan marcadas).' : current.requires_submission ? 'No acepta entregas después de la fecha límite.' : 'Tarea de lectura: no hay que entregar nada.' }}</p>
            </div>
          </div>

          <p-card class="border border-tz-surface-border">
            <h2 class="text-lg font-semibold">Guía de la tarea</h2>
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
        </div>

        <!-- Entrega -->
        @if (current.requires_submission) {
          <p-card class="border border-tz-surface-border lg:sticky lg:top-24">
            <h2 class="text-lg font-semibold">Tu entrega</h2>
            @if (notice(); as message) {
              <p class="mt-3 flex items-center gap-2 rounded-xl border border-tz-line bg-tz-soft px-4 py-3 text-sm font-medium text-tz-title" role="status"><i class="pi pi-check-circle text-tz-subtitle" aria-hidden="true"></i>{{ message }}</p>
            }
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
  `
})
export class StudentTaskPage implements OnInit {
  protected readonly service = inject(TasksService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly uuid = input.required<string>();

  protected readonly typeLabel = TYPE_LABEL;
  protected readonly task = signal<StudentTask | null>(null);
  protected readonly loading = signal(true);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

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

  protected async submit(file: File): Promise<void> {
    this.uploadError.set(null);
    this.notice.set(null);
    this.uploading.set(true);
    const replacing = !!this.task()?.submission;
    try {
      const task = await this.service.submit(this.uuid(), file);
      this.task.set(task);
      this.notice.set(replacing ? 'Entrega reemplazada.' : task.submission?.is_late ? 'Entrega recibida (tardía).' : '¡Entrega recibida!');
    } catch (err) {
      this.uploadError.set(apiErrorMessage(err));
    } finally {
      this.uploading.set(false);
    }
  }
}
