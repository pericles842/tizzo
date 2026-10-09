import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tag } from 'primeng/tag';
import { TaskItem } from '../../data/dashboard.models';
import { WidgetCard } from '../widget-card/widget-card';

/** Tareas por entregar (estudiante) o por revisar (profe): cada fila abre la tarea */
@Component({
  selector: 'app-task-list',
  imports: [RouterLink, Tag, WidgetCard],
  template: `
    <app-widget-card [heading]="heading()" actionLabel="Ver todas" actionRoute="/app/tareas">
      <ul class="divide-y divide-tz-line">
        @for (task of tasks(); track task.id) {
          <li>
            <a
              [routerLink]="task.link ?? '/app/tareas'"
              class="flex min-h-11 items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tz-subtitle"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-tz-title">{{ task.title }}</span>
                <span class="block truncate text-xs">{{ task.course }}</span>
              </span>
              <p-tag [value]="task.due" [severity]="task.urgent ? 'warn' : 'secondary'" [rounded]="true" class="shrink-0 text-[0.6875rem]" />
            </a>
          </li>
        } @empty {
          <li class="py-6 text-center text-sm">{{ emptyText() }}</li>
        }
      </ul>
    </app-widget-card>
  `,
  host: { class: 'block h-full' }
})
export class TaskList {
  readonly heading = input('Tareas por entregar');
  readonly tasks = input.required<TaskItem[]>();
  readonly emptyText = input('No tienes tareas pendientes.');
}
