import { Component, computed, input } from '@angular/core';
import { PASSWORD_RULES, passwordStrength } from '../form/form-utils';

const LEVELS = ['', 'débil', 'regular', 'buena', 'fuerte'];

/**
 * Medidor de seguridad (4 barras + "Seguridad: buena") y, si `showRules`, la lista de requisitos
 * con su check. Las reglas son las mismas que valida el API.
 */
@Component({
  selector: 'app-password-strength',
  template: `
    @if (showMeter()) {
      <div class="mt-2.5 flex gap-1.5" aria-hidden="true">
        @for (bar of bars(); track $index) {
          <span class="h-1 flex-1 rounded-full transition-colors" [class]="bar ? barColor() : 'bg-tz-soft'"></span>
        }
      </div>
      <p class="mt-1.5 text-xs" [class]="textColor()" aria-live="polite">
        @if (strength()) {
          Seguridad: {{ level() }}
        } @else {
          Escribe una contraseña
        }
      </p>
    }

    @if (showRules()) {
      <ul class="space-y-2" [class.mt-4]="showMeter()" aria-label="Requisitos de la contraseña">
        @for (rule of rules(); track rule.label) {
          <li class="flex items-center gap-2 text-sm" [class.text-tz-title]="rule.ok">
            <i
              class="pi text-sm"
              [class]="rule.ok ? 'pi pi-check-circle text-tz-subtitle' : 'pi pi-circle text-tz-body'"
              aria-hidden="true"
            ></i>
            {{ rule.label }}
            <span class="sr-only">{{ rule.ok ? '(cumplido)' : '(pendiente)' }}</span>
          </li>
        }
      </ul>
    }
  `,
  host: { class: 'block' }
})
export class PasswordStrength {
  readonly password = input.required<string>();
  /** Barras + "Seguridad: ..." */
  readonly showMeter = input(true);
  /** Lista de requisitos con check */
  readonly showRules = input(true);

  protected readonly strength = computed(() => passwordStrength(this.password()));
  protected readonly level = computed(() => LEVELS[this.strength()]);
  protected readonly bars = computed(() => [1, 2, 3, 4].map((step) => step <= this.strength()));
  protected readonly rules = computed(() => PASSWORD_RULES.map((rule) => ({ label: rule.label, ok: rule.test(this.password()) })));

  /** Débil = rojo "en vivo", regular = amarillo acento, buena/fuerte = violeta de marca */
  protected readonly barColor = computed(() => (this.strength() === 1 ? 'bg-tz-live' : this.strength() === 2 ? 'bg-tz-accent' : 'bg-tz-subtitle'));
  protected readonly textColor = computed(() => (this.strength() === 1 ? 'text-tz-live' : this.strength() >= 3 ? 'text-tz-subtitle' : 'text-tz-body'));
}
