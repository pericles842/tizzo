import { Component, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { PersonItem } from '../../data/dashboard.models';
import { WidgetCard } from '../widget-card/widget-card';

/** "Mis profesores" (estudiante) o "Mis estudiantes" (profe) */
@Component({
  selector: 'app-people-list',
  imports: [Avatar, WidgetCard],
  template: `
    <app-widget-card [heading]="heading()" actionLabel="Ver todos" [actionRoute]="route()">
      <ul class="divide-y divide-tz-line">
        @for (person of people(); track person.id) {
          <li class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <p-avatar [label]="initials(person.name)" shape="circle" size="large" class="tz-bg-gradient shrink-0 text-sm text-white" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-tz-title">{{ person.name }}</p>
              <p class="truncate text-xs">{{ person.detail }}</p>
            </div>
            <span class="shrink-0 text-xs font-semibold text-tz-subtitle">{{ person.trailing }}</span>
          </li>
        }
      </ul>
    </app-widget-card>
  `,
  host: { class: 'block h-full' }
})
export class PeopleList {
  readonly heading = input('Mis profesores');
  readonly route = input('/app/profesores');
  readonly people = input.required<PersonItem[]>();

  /** "Prof. Andrea M." -> "AM" */
  protected initials(name: string): string {
    return name
      .replace(/^Prof(a)?\.\s*/i, '')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
