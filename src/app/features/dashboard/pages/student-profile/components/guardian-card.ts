import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../../../../core/auth/auth.service';
import { apiErrorMessage, apiFieldErrors } from '../../../../../core/http/api-error';
import { ToastService } from '../../../../../core/notify/toast.service';
import { WidgetCard } from '../../../widgets/widget-card/widget-card';

/**
 * Representante de un estudiante menor de edad: a qué correo se envió la confirmación, si ya confirmó, y reenviar o
 * cambiar el correo mientras no confirme. Sin su confirmación el menor no reserva ni entra a las salas.
 */
@Component({
  selector: 'app-guardian-card',
  imports: [FormsModule, ButtonDirective, InputText, Tag, WidgetCard],
  template: `
    <app-widget-card heading="Tu representante">
      @if (guardian(); as current) {
        <div class="flex flex-wrap items-center gap-2">
          @if (current.confirmed) {
            <p-tag value="Confirmó" icon="pi pi-check" [rounded]="true" />
          } @else {
            <p-tag value="Esperando confirmación" icon="pi pi-clock" severity="warn" [rounded]="true" />
          }
          @if (current.email) {
            <span class="min-w-0 truncate text-sm font-medium text-tz-title">{{ current.email }}</span>
          }
        </div>
        @if (current.confirmed) {
          <p class="mt-3 text-sm">Tu representante confirmó que estará contigo en todas tus clases en vivo.</p>
        } @else {
          <p class="mt-3 text-sm">Le enviamos un correo con un enlace para confirmar que estará contigo en todas tus clases en vivo. Si no le llegó, reenvíalo o cambia el correo.</p>
          <label for="guardian-email" class="tz-label mt-4">Correo de tu representante</label>
          <input pInputText id="guardian-email" type="email" class="w-full" placeholder="mama@correo.com" [ngModel]="email()" (ngModelChange)="email.set($event); error.set(null)" aria-describedby="guardian-email-error" />
          @if (error(); as message) {
            <p id="guardian-email-error" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert"><i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}</p>
          }
          <button pButton type="button" [label]="changed() ? 'Enviar al nuevo correo' : 'Reenviar correo'" icon="pi pi-send" class="mt-3" [loading]="busy()" [disabled]="busy()" (click)="send()"></button>
        }
      }
    </app-widget-card>
  `,
  host: { class: 'block' }
})
export class GuardianCard {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly guardian = computed(() => this.auth.user()?.guardian ?? null);
  protected readonly email = signal(this.auth.user()?.guardian?.email ?? '');
  protected readonly changed = computed(() => this.email().trim().toLowerCase() !== (this.guardian()?.email ?? ''));
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async send(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      const sent = await this.auth.resendGuardian(this.changed() ? this.email().trim() : undefined);
      this.toast.success(sent ? 'Le enviamos el correo a tu representante.' : 'Guardamos el correo, pero no se pudo enviar. Intenta de nuevo en un rato.');
    } catch (err) {
      const fields = apiFieldErrors(err);
      this.error.set(fields['guardian_email'] ?? null);
      if (!fields['guardian_email']) this.toast.error(apiErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
