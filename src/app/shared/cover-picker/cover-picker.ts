import { Component, effect, input, model, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { CourseCover } from '../course-cover/course-cover';
import { FilePicker } from '../file-picker/file-picker';
import { IMAGE_TYPES, checkFile } from '../form/form-utils';

/**
 * Elegir la miniatura de una clase o curso: botón para escoger una imagen, vista previa en 16:9 y "Quitar".
 * Solo guarda el archivo elegido en `file` (quien lo usa lo sube al API); valida tipo y tamaño.
 */
@Component({
  selector: 'app-cover-picker',
  imports: [ButtonDirective, CourseCover, FilePicker],
  template: `
    <p class="tz-label">{{ label() }}</p>
    <div class="flex flex-wrap items-center gap-4">
      <app-course-cover [url]="preview() ?? currentUrl()" [isCourse]="isCourse()" alt="Vista previa de la miniatura" />
      <div class="min-w-0 flex-1 basis-48">
        <div class="flex flex-wrap items-center gap-2">
          <app-file-picker [label]="file() ? 'Cambiar imagen' : 'Elegir imagen'" icon="pi pi-image" accept="image/jpeg,image/png,image/webp,image/gif" [outlined]="true" [text]="false" (picked)="pick($event)" />
          @if (file()) {
            <button pButton type="button" label="Quitar" icon="pi pi-trash" severity="secondary" [text]="true" (click)="clear()"></button>
          }
        </div>
        <p class="tz-hint">JPG, PNG, WEBP o GIF, hasta 10 MB. Se recorta en formato 16:9.</p>
        @if (error(); as message) {
          <p class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert"><i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}</p>
        }
      </div>
    </div>
  `,
  host: { class: 'block' }
})
export class CoverPicker {
  readonly label = input('Miniatura (opcional)');
  readonly isCourse = input(false);
  /** Miniatura que ya tiene guardada (si hay) */
  readonly currentUrl = input<string | null>(null);
  /** Archivo elegido, pendiente de subir */
  readonly file = model<File | null>(null);

  protected readonly preview = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Vista previa del archivo elegido; se libera el objeto al cambiar o al cerrar
    effect((onCleanup) => {
      const file = this.file();
      if (!file || typeof URL === 'undefined') {
        this.preview.set(null);
        return;
      }
      const url = URL.createObjectURL(file);
      this.preview.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  protected pick(file: File): void {
    const invalid = checkFile(file, IMAGE_TYPES, 'JPG, PNG, WEBP o GIF');
    this.error.set(invalid);
    if (!invalid) this.file.set(file);
  }

  protected clear(): void {
    this.error.set(null);
    this.file.set(null);
  }
}
