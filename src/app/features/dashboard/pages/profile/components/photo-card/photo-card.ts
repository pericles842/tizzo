import { Component, computed, inject, signal } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../../../../core/http/api-error';
import { FilePicker } from '../../../../../../shared/file-picker/file-picker';
import { IMAGE_TYPES, checkFile } from '../../../../../../shared/form/form-utils';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';

/**
 * Foto de perfil del profe. Usa la sesión (AuthService), así el header del dashboard
 * cambia al mismo tiempo que se sube o se quita la foto.
 */
@Component({
  selector: 'app-photo-card',
  imports: [Avatar, ButtonDirective, Message, FilePicker, WidgetCard],
  template: `
    <app-widget-card heading="Foto de perfil">
      <div class="flex items-center gap-4">
        @if (photoUrl(); as url) {
          <p-avatar [image]="url" shape="circle" size="xlarge" class="shrink-0" />
        } @else {
          <p-avatar [label]="initials()" shape="circle" size="xlarge" class="tz-bg-gradient shrink-0 font-display text-xl text-white" />
        }
        <p class="text-sm">Una foto clara de tu rostro ayuda a que los estudiantes confíen en ti. JPG, PNG, WEBP o GIF, máx. 10 MB.</p>
      </div>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mt-3" role="alert">{{ message }}</p-message>
      }

      <div class="mt-3 flex flex-wrap items-center gap-1">
        <app-file-picker
          [label]="photoUrl() ? 'Cambiar foto' : 'Subir foto'"
          accept="image/jpeg,image/png,image/webp,image/gif"
          [disabled]="busy()"
          (picked)="upload($event)"
        />
        @if (photoUrl()) {
          <button pButton type="button" label="Quitar" icon="pi pi-trash" severity="secondary" [text]="true" [disabled]="busy()" (click)="remove()"></button>
        }
        @if (busy()) {
          <i class="pi pi-spin pi-spinner text-tz-subtitle" role="status" aria-label="Guardando"></i>
        }
      </div>
    </app-widget-card>
  `,
  host: { class: 'block' }
})
export class PhotoCard {
  private readonly auth = inject(AuthService);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly photoUrl = computed(() => this.auth.user()?.avatar_url ?? null);
  protected readonly initials = computed(() => {
    const user = this.auth.user();
    return `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();
  });

  protected async upload(file: File): Promise<void> {
    const invalid = checkFile(file, IMAGE_TYPES, 'JPG, PNG, WEBP o GIF');
    if (invalid) {
      this.error.set(invalid);
      return;
    }
    await this.run(() => this.auth.uploadAvatar(file));
  }

  protected async remove(): Promise<void> {
    await this.run(() => this.auth.removeAvatar());
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      await action();
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
