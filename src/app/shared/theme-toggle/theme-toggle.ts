import { Component, computed, inject } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { ThemeService } from '../../core/theme/theme.service';

/** Botón del header para alternar entre "Lila nube" (claro) y "Violeta noche" (oscuro) */
@Component({
  selector: 'app-theme-toggle',
  imports: [ButtonDirective],
  template: `
    <button
      pButton
      type="button"
      severity="secondary"
      [text]="true"
      [rounded]="true"
      [icon]="isDark() ? 'pi pi-sun' : 'pi pi-moon'"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      [attr.aria-pressed]="isDark()"
      (click)="theme.toggle()"
    ></button>
  `
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly isDark = computed(() => this.theme.theme() === 'dark');
  protected readonly label = computed(() => (this.isDark() ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'));
}
