import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { Tag } from 'primeng/tag';
import { TaskItem } from '../../data/dashboard.models';
import { WidgetCard } from '../widget-card/widget-card';

/** Tareas pendientes (estudiante) o por revisar (profe). Marcar es solo visual por ahora. */
@Component({
  selector: 'app-task-list',
  imports: [FormsModule, Checkbox, Tag, WidgetCard],
  template: `
    <app-widget-card [heading]="heading()" actionLabel="Ver todas" actionRoute="/app/tareas">
      <ul class="divide-y divide-tz-line">
        @for (task of tasks(); track task.id) {
          <li class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <p-checkbox
              [inputId]="'tarea-' + task.id"
              [binary]="true"
              [ngModel]="done().includes(task.id)"
              (ngModelChange)="toggle(task.id)"
            />
            <label [for]="'tarea-' + task.id" class="min-w-0 flex-1 cursor-pointer" [class.line-through]="done().includes(task.id)">
              <span class="block truncate text-sm font-semibold text-tz-title">{{ task.title }}</span>
              <span class="block truncate text-xs">{{ task.course }}</span>
            </label>
            <p-tag [value]="task.due" [severity]="task.urgent ? 'warn' : 'secondary'" [rounded]="true" class="shrink-0 text-[0.6875rem]" />
          </li>
        }
      </ul>
    </app-widget-card>
  `,
  host: { class: 'block h-full' }
})
export class TaskList {
  readonly heading = input('Tareas pendientes');
  readonly tasks = input.required<TaskItem[]>();

  protected readonly done = signal<string[]>([]);

  protected toggle(id: string): void {
    this.done.update((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }
}
