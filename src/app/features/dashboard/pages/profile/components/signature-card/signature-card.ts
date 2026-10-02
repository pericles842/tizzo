import { Component, inject, input, output, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { TeacherProfile } from '../../../../../../core/auth/auth.models';
import { apiErrorMessage } from '../../../../../../core/http/api-error';
import { FilePicker } from '../../../../../../shared/file-picker/file-picker';
import { IMAGE_TYPES, checkFile } from '../../../../../../shared/form/form-utils';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';
import { ProfilePayload } from '../../profile.models';
import { TeacherProfileService } from '../../teacher-profile.service';

/** Firma del profe para sus diplomas: vista previa sobre fondo blanco, subir/cambiar y quitar */
@Component({
  selector: 'app-signature-card',
  imports: [ButtonDirective, Message, FilePicker, WidgetCard],
  template: `
    <app-widget-card heading="Firma para tus diplomas">
      <p class="-mt-2 mb-4 text-sm">Aparecerá en los diplomas que emitas. Usa una foto de tu firma en papel blanco o una imagen con fondo transparente (PNG).</p>

      <!-- Fondo blanco fijo (como el papel del diploma): una firma oscura no se vería sobre el tema oscuro -->
      <div class="flex h-32 items-center justify-center rounded-xl border border-tz-line bg-tz-paper p-3">
        @if (profile().signature_url; as url) {
          <img [src]="url" alt="Tu firma" class="max-h-full max-w-full object-contain" />
        } @else {
          <p class="text-sm text-tz-on-paper">Aún no subes tu firma</p>
        }
      </div>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mt-3" role="alert">{{ message }}</p-message>
      }

      <div class="mt-3 flex flex-wrap items-center gap-1">
        <app-file-picker
          [label]="profile().signature_url ? 'Cambiar firma' : 'Subir firma'"
          accept="image/png,image/jpeg,image/webp,image/gif"
          [disabled]="busy()"
          (picked)="upload($event)"
        />
        @if (profile().signature_url) {
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
export class SignatureCard {
  private readonly service = inject(TeacherProfileService);

  readonly profile = input.required<TeacherProfile>();
  readonly updated = output<ProfilePayload>();

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async upload(file: File): Promise<void> {
    const invalid = checkFile(file, IMAGE_TYPES, 'JPG, PNG, WEBP o GIF');
    if (invalid) {
      this.error.set(invalid);
      return;
    }
    await this.run(() => this.service.uploadSignature(file));
  }

  protected async remove(): Promise<void> {
    await this.run(() => this.service.deleteSignature());
  }

  private async run(action: () => Promise<ProfilePayload>): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      this.updated.emit(await action());
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
