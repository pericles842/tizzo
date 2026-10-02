import { Component, computed, input } from '@angular/core';

/** Barra de progreso por segmentos + "Paso X de N · Nombre del paso" */
@Component({
  selector: 'app-step-progress',
  template: `
    <div class="flex gap-2" aria-hidden="true">
      @for (segment of segments(); track $index) {
        <span class="h-1.5 flex-1 rounded-full transition-colors" [class]="segment ? 'bg-tz-subtitle' : 'bg-tz-soft'"></span>
      }
    </div>
    <p class="mt-3 text-xs font-medium text-tz-subtitle" aria-live="polite">Paso {{ current() }} de {{ total() }} · {{ label() }}</p>
  `,
  host: { class: 'block' }
})
export class StepProgress {
  /** Paso actual (desde 1) */
  readonly current = input.required<number>();
  readonly total = input.required<number>();
  readonly label = input.required<string>();

  protected readonly segments = computed(() => Array.from({ length: this.total() }, (_, i) => i < this.current()));
}
