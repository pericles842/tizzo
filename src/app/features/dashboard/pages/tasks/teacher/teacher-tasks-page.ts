import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { ProgressBar } from 'primeng/progressbar';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { apiErrorMessage } from '../../../../../core/http/api-error';
import { TaskStatus, TaskTargetCourse, TaskType, TeacherTask } from '../tasks.models';
import { TasksService } from '../tasks.service';
import { STATUS_TAG, TYPE_ICON, TYPE_LABEL, dueLabel, targetLabel } from '../tasks.utils';

/** "Tareas" del profe: sus tareas con filtros por curso, clase, tipo y estado, y cuántos entregaron */
@Component({
  selector: 'app-teacher-tasks-page',
  imports: [FormsModule, RouterLink, ButtonDirective, Message, ProgressBar, Select, Skeleton, Tag],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-display text-3xl font-semibold text-tz-title">Tareas</p>
        <p class="mt-1 text-sm">Guías en PDF y entregas de tus estudiantes. Al publicar, a cada inscrito le llega un aviso.</p>
      </div>
      <a pButton routerLink="/app/tareas/nueva" label="Nueva tarea" icon="pi pi-plus"></a>
    </header>

    <!-- Filtros -->
    <div class="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="group" aria-label="Filtros">
      <div>
        <label for="filter-course" class="sr-only">Curso o clase</label>
        <p-select inputId="filter-course" [options]="courseOptions()" optionLabel="label" optionValue="value" [ngModel]="courseId()" (ngModelChange)="setCourse($event)" placeholder="Todos los cursos y clases" [showClear]="true" appendTo="body" [fluid]="true" />
      </div>
      <div>
        <label for="filter-session" class="sr-only">Clase</label>
        <p-select inputId="filter-session" [options]="sessionOptions()" optionLabel="label" optionValue="value" [ngModel]="sessionId()" (ngModelChange)="sessionId.set($event); load()" [placeholder]="courseId() ? 'Todas las clases' : 'Elige un curso para ver sus clases'" [disabled]="!sessionOptions().length" [showClear]="true" appendTo="body" [fluid]="true" />
      </div>
      <div>
        <label for="filter-type" class="sr-only">Tipo</label>
        <p-select inputId="filter-type" [options]="typeOptions" optionLabel="label" optionValue="value" [ngModel]="type()" (ngModelChange)="type.set($event); load()" placeholder="Todos los tipos" [showClear]="true" appendTo="body" [fluid]="true" />
      </div>
      <div>
        <label for="filter-status" class="sr-only">Estado</label>
        <p-select inputId="filter-status" [options]="statusOptions" optionLabel="label" optionValue="value" [ngModel]="status()" (ngModelChange)="status.set($event); load()" placeholder="Todos los estados" [showClear]="true" appendTo="body" [fluid]="true" />
      </div>
    </div>

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    <ul class="space-y-3" [attr.aria-busy]="loading()" aria-label="Tus tareas">
      @if (loading()) {
        @for (placeholder of [1, 2, 3]; track placeholder) {
          <li><p-skeleton height="6.5rem" borderRadius="1.25rem" /></li>
        }
      } @else {
        @for (task of tasks(); track task.uuid) {
          <li>
            <a
              [routerLink]="['/app/tareas', task.uuid]"
              class="flex flex-col gap-3 rounded-2xl border border-tz-surface-border bg-tz-surface p-4 transition-colors hover:border-tz-subtitle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tz-subtitle sm:flex-row sm:items-center"
            >
              <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="text-xl" [class]="typeIcon[task.type]"></i></span>
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="font-semibold text-tz-title">{{ task.title }}</span>
                  <p-tag [value]="statusTag[task.status].label" [icon]="statusTag[task.status].icon" [severity]="statusTag[task.status].severity" [rounded]="true" />
                </span>
                <span class="mt-0.5 block truncate text-sm">{{ typeLabel[task.type] }} · {{ target(task) }}</span>
                <span class="mt-0.5 block text-xs">{{ due(task) }}</span>
              </span>
              @if (task.stats && task.status !== 'draft') {
                <span class="w-full shrink-0 sm:w-44">
                  @if (task.requires_submission || task.type === 'quiz') {
                    <span class="flex justify-between text-xs"><span>{{ task.type === 'quiz' ? 'Respondieron' : 'Entregaron' }}</span><span class="font-semibold text-tz-title">{{ task.stats.submitted }} de {{ task.stats.assigned }}</span></span>
                    <p-progressbar [value]="percent(task)" [showValue]="false" class="mt-1.5 block h-1.5" [attr.aria-label]="task.stats.submitted + ' de ' + task.stats.assigned + ' completaron'" />
                  } @else {
                    <span class="text-xs">Solo lectura · {{ task.stats.assigned }} {{ task.stats.assigned === 1 ? 'estudiante' : 'estudiantes' }}</span>
                  }
                </span>
              }
              <i class="pi pi-angle-right hidden text-tz-subtitle sm:block" aria-hidden="true"></i>
            </a>
          </li>
        } @empty {
          <li class="rounded-2xl border border-dashed border-tz-line px-6 py-12 text-center">
            <i class="pi pi-check-square text-3xl text-tz-subtitle" aria-hidden="true"></i>
            <p class="mt-3 font-semibold text-tz-title">{{ filtered() ? 'Ninguna tarea con esos filtros' : 'Todavía no tienes tareas' }}</p>
            <p class="mt-1 text-sm">{{ filtered() ? 'Prueba con otros filtros.' : 'Crea un quiz o una guía en PDF para tus estudiantes; les llegará un aviso al publicarla.' }}</p>
            @if (!filtered()) {
              <a pButton routerLink="/app/tareas/nueva" label="Nueva tarea" icon="pi pi-plus" class="mt-4"></a>
            }
          </li>
        }
      }
    </ul>
  `
})
export class TeacherTasksPage implements OnInit {
  private readonly service = inject(TasksService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly typeIcon = TYPE_ICON;
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly statusTag = STATUS_TAG;
  protected readonly typeOptions: { value: TaskType; label: string }[] = [
    { value: 'document', label: 'Documento' },
    { value: 'quiz', label: 'Quiz' }
  ];
  protected readonly statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'published', label: 'Publicadas' },
    { value: 'closed', label: 'Cerradas' }
  ];

  protected readonly targets = signal<TaskTargetCourse[]>([]);
  protected readonly tasks = signal<TeacherTask[]>([]);
  protected readonly courseId = signal<string | null>(null);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly type = signal<TaskType | null>(null);
  protected readonly status = signal<TaskStatus | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private requestId = 0;

  protected readonly filtered = computed(() => !!(this.courseId() || this.sessionId() || this.type() || this.status()));
  protected readonly courseOptions = computed(() => this.targets().map((course) => ({ value: course.uuid, label: course.title })));
  protected readonly sessionOptions = computed(() => {
    const course = this.targets().find((item) => item.uuid === this.courseId());
    return (course?.sessions ?? []).length > 1 ? course!.sessions.map((s) => ({ value: s.uuid, label: `Clase ${s.number}${s.title && s.title !== course!.title ? ` · ${s.title}` : ''}` })) : [];
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    void this.load();
    this.service
      .targets()
      .then((targets) => this.targets.set(targets))
      .catch(() => undefined);
  }

  protected setCourse(courseId: string | null): void {
    this.courseId.set(courseId);
    this.sessionId.set(null);
    void this.load();
  }

  protected async load(): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    try {
      const tasks = await this.service.list({ course_id: this.courseId(), session_id: this.sessionId(), type: this.type(), status: this.status() });
      if (id === this.requestId) this.tasks.set(tasks);
    } catch (err) {
      if (id === this.requestId) this.error.set(apiErrorMessage(err));
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }

  protected target(task: TeacherTask): string {
    return targetLabel(task.course, task.session);
  }

  protected due(task: TeacherTask): string {
    return dueLabel(task.due_at);
  }

  protected percent(task: TeacherTask): number {
    return task.stats?.assigned ? Math.round((task.stats.submitted / task.stats.assigned) * 100) : 0;
  }
}
