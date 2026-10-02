import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioButton } from 'primeng/radiobutton';

/**
 * Tarjeta de opción única (p-radiobutton dentro de una tarjeta clicable).
 * Varias tarjetas con el mismo `name` y el mismo `[(selected)]` forman un grupo de radio accesible.
 */
@Component({
  selector: 'app-choice-card',
  imports: [FormsModule, RadioButton],
  template: `
    <label
      [for]="inputId()"
      class="flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tz-subtitle"
      [class]="isSelected() ? 'border-tz-subtitle bg-tz-soft' : 'border-tz-line hover:border-tz-subtitle'"
    >
      <span class="tz-bg-gradient flex size-12 shrink-0 items-center justify-center rounded-xl text-white" aria-hidden="true">
        <i class="text-xl" [class]="icon()"></i>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-display font-semibold text-tz-title">{{ title() }}</span>
        <span class="mt-0.5 block text-sm">{{ description() }}</span>
      </span>
      <p-radiobutton [inputId]="inputId()" [name]="name()" [value]="value()" [(ngModel)]="selected" />
    </label>
  `,
  host: { class: 'block' }
})
export class ChoiceCard {
  readonly name = input.required<string>();
  readonly value = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  /** Clase de PrimeIcons, ej. 'pi pi-book' */
  readonly icon = input('pi pi-circle');
  readonly selected = model<string | null>(null);

  protected readonly inputId = computed(() => `${this.name()}-${this.value()}`);
  protected readonly isSelected = computed(() => this.selected() === this.value());
}
