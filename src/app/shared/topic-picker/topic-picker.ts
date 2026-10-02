import { Component, computed, input, model } from '@angular/core';
import { ButtonDirective } from 'primeng/button';

export interface TopicOption {
  id: number;
  name: string;
}

/**
 * Selector múltiple de temas en forma de chips (pButton que se alternan, con aria-pressed).
 * Sirve para "¿Qué quieres aprender?" y "¿Qué quieres enseñar?".
 */
@Component({
  selector: 'app-topic-picker',
  imports: [ButtonDirective],
  template: `
    <p class="text-xs font-medium text-tz-subtitle" aria-live="polite">{{ counter() }}</p>
    <ul class="mt-3 flex flex-wrap gap-2.5" [attr.aria-label]="label()">
      @for (topic of topics(); track topic.id) {
        <li>
          <!-- Un botón por estado: pButton no quita la clase p-button-outlined si [outlined] cambia en caliente -->
          @if (isSelected(topic.id)) {
            <button
              pButton
              type="button"
              size="small"
              icon="pi pi-check"
              [rounded]="true"
              [label]="topic.name"
              aria-pressed="true"
              (click)="toggle(topic.id)"
            ></button>
          } @else {
            <button
              pButton
              type="button"
              size="small"
              severity="secondary"
              [rounded]="true"
              [outlined]="true"
              [label]="topic.name"
              class="bg-tz-surface"
              aria-pressed="false"
              (click)="toggle(topic.id)"
            ></button>
          }
        </li>
      }
    </ul>
  `,
  host: { class: 'block' }
})
export class TopicPicker {
  readonly topics = input.required<TopicOption[]>();
  readonly label = input('Temas');
  /** ids seleccionados */
  readonly selected = model<number[]>([]);

  protected readonly counter = computed(() => {
    const count = this.selected().length;
    if (!count) return 'Ningún tema seleccionado';
    return count === 1 ? '1 tema seleccionado' : `${count} temas seleccionados`;
  });

  protected isSelected(id: number): boolean {
    return this.selected().includes(id);
  }

  protected toggle(id: number): void {
    this.selected.update((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }
}
