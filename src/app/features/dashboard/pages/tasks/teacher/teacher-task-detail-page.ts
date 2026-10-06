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
import { TaskStudent, TeacherTask } from '../tasks.models';
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

    @if (notice(); as message) {
      <p class="mb-4 flex items-center gap-2 rounded-xl border border-tz-line bg-tz-soft px-4 py-3 text-sm font-medium text-tz-title" role="status"><i class="pi pi-check-circle text-tz-subtitle" aria-hidden="true"></i>{{ message }}</p>
    }
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
                @if (current.requires_submission) {
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
                      <p class="text-xs">{{ student.submission ? 'Entregó el ' + date(student.submission.submitted_at) : current.requires_submission ? 'Sin entrega' : 'Solo lectura' }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      @if (student.submission?.is_late) {
                        <p-tag value="Tardía" severity="warn" [rounded]="true" />
                      }
                      <p-tag [value]="tag(student).label" [severity]="tag(student).severity" [rounded]="true" />
                      @if (student.submission) {
                        <a pButton [href]="service.submissionFileUrl(current.uuid, student.uuid)" target="_blank" rel="noopener" icon="pi pi-download" severity="secondary" [text]="true" [rounded]="true" [attr.aria-label]="'Ver la entrega de ' + student.name"></a>
                      }
                    </div>
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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly uuid = input.required<string>();

  protected readonly statusTag = STATUS_TAG;
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly scopeLabel = SCOPE_LABEL;
  protected readonly filters: { value: StudentFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'submitted', label: 'Entregaron' },
    { value: 'missing', label: 'Faltan' }
  ];

  protected readonly task = signal<TeacherTask | null>(null);
  protected readonly students = signal<TaskStudent[]>([]);
  protected readonly filter = signal<StudentFilter>('all');
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Aviso que deja el editor al guardar o publicar */
  protected readonly notice = signal<string | null>((this.router.getCurrentNavigation()?.extras.state?.['notice'] as string) ?? null);

  protected readonly visibleStudents = computed(() => {
    const filter = this.filter();
    return this.students().filter((s) => filter === 'all' || (filter === 'submitted' ? !!s.submission : !s.submission));
  });

  protected readonly stats = computed(() => {
    const current = this.task();
    const s = current?.stats ?? { assigned: 0, submitted: 0, late: 0 };
    if (!current?.requires_submission) return [{ label: 'Asignados', value: s.assigned }];
    return [
      { label: 'Asignados', value: s.assigned },
      { label: 'Entregaron', value: s.submitted },
      { label: 'Tardías', value: s.late },
      { label: 'Faltan', value: Math.max(0, s.assigned - s.submitted) }
    ];
  });

  ngOnInit(): void {
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
        this.notice.set('Tarea cerrada.');
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
