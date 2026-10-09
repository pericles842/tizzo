import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Message } from 'primeng/message';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { apiErrorMessage } from '../../../../../core/http/api-error';
import { StudentTask } from '../tasks.models';
import { TasksService } from '../tasks.service';
import { StudentTab, TYPE_ICON, dueLabel, stateTag, tabOf, targetLabel } from '../tasks.utils';

/** "Mis tareas" del estudiante: pendientes, entregadas y vencidas, con la fecha límite a la vista */
@Component({
  selector: 'app-student-tasks-page',
  imports: [FormsModule, RouterLink, Message, SelectButton, Skeleton, Tag],
  template: `
    <header class="mb-5">
      <p class="font-display text-3xl font-semibold text-tz-title">Mis tareas</p>
      <p class="mt-1 text-sm">Las tareas que te dejan tus profes. Te avisamos en la campana cuando llega una nueva.</p>
    </header>

    <p-selectbutton
      [options]="tabs()"
      optionLabel="label"
      optionValue="value"
      [ngModel]="tab()"
      (ngModelChange)="tab.set($event)"
      [allowEmpty]="false"
      aria-label="Filtrar tareas"
      styleClass="mb-5"
    />

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    <ul class="space-y-3" [attr.aria-busy]="loading()" aria-label="Tareas">
      @if (loading()) {
        @for (placeholder of [1, 2, 3]; track placeholder) {
          <li><p-skeleton height="6rem" borderRadius="1.25rem" /></li>
        }
      } @else {
        @for (task of visible(); track task.uuid) {
          <li>
            <a
              [routerLink]="['/app/tareas', task.uuid]"
              class="flex items-center gap-3 rounded-2xl border bg-tz-surface p-4 transition-colors hover:border-tz-subtitle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tz-subtitle"
              [class]="task.state === 'overdue' ? 'border-tz-live/50' : 'border-tz-surface-border'"
            >
              <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="text-xl" [class]="typeIcon[task.type]"></i></span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold text-tz-title">{{ task.title }}</span>
                <span class="mt-0.5 block truncate text-sm">{{ target(task) }}{{ task.teacher_name ? ' · Prof. ' + task.teacher_name : '' }}</span>
                <span class="mt-1 flex flex-wrap items-center gap-2">
                  <p-tag [value]="tag(task).label" [icon]="tag(task).icon" [severity]="tag(task).severity" [rounded]="true" />
                  @if (task.submission?.is_late) {
                    <p-tag value="Tardía" severity="warn" [rounded]="true" />
                  }
                  <span class="text-xs">{{ due(task) }}</span>
                </span>
              </span>
              <i class="pi pi-angle-right text-tz-subtitle" aria-hidden="true"></i>
            </a>
          </li>
        } @empty {
          <li class="rounded-2xl border border-dashed border-tz-line px-6 py-12 text-center">
            <i class="pi text-3xl text-tz-subtitle" [class]="empty().icon" aria-hidden="true"></i>
            <p class="mt-3 font-semibold text-tz-title">{{ empty().title }}</p>
            <p class="mt-1 text-sm">{{ empty().text }}</p>
          </li>
        }
      }
    </ul>
  `
})
export class StudentTasksPage implements OnInit {
  private readonly service = inject(TasksService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly typeIcon = TYPE_ICON;
  protected readonly tasks = signal<StudentTask[]>([]);
  protected readonly tab = signal<StudentTab>('pending');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly count = (tab: StudentTab) => this.tasks().filter((task) => tabOf(task.state) === tab).length;

  protected readonly tabs = computed(() => [
    { value: 'pending', label: `Pendientes (${this.count('pending')})` },
    { value: 'submitted', label: `Entregadas (${this.count('submitted')})` },
    { value: 'overdue', label: `Vencidas (${this.count('overdue')})` }
  ]);

  protected readonly visible = computed(() => {
    const tab = this.tab();
    const items = this.tasks().filter((task) => tabOf(task.state) === tab);
    // Pendientes y vencidas: la fecha más cercana primero; entregadas: la más reciente primero
    return tab === 'submitted' ? [...items].reverse() : items;
  });

  protected readonly empty = computed(() => {
    switch (this.tab()) {
      case 'submitted':
        return { icon: 'pi-inbox', title: 'Todavía no has entregado tareas', text: 'Cuando entregues una, aparecerá aquí.' };
      case 'overdue':
        return { icon: 'pi-thumbs-up', title: 'No tienes tareas vencidas', text: '¡Vas al día!' };
      default:
        return { icon: 'pi-check-square', title: 'No tienes tareas pendientes', text: 'Cuando un profe te deje una tarea, te avisamos en la campana.' };
    }
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.service
      .myTasks()
      .then(({ tasks }) => this.tasks.set(tasks))
      .catch((err) => this.error.set(apiErrorMessage(err)))
      .finally(() => this.loading.set(false));
  }

  protected tag(task: StudentTask) {
    return stateTag(task.state, task.due_at);
  }

  protected target(task: StudentTask): string {
    return targetLabel(task.course, task.session);
  }

  protected due(task: StudentTask): string {
    return task.state === 'submitted' ? `Entregada · ${dueLabel(task.due_at)}` : dueLabel(task.due_at);
  }
}
