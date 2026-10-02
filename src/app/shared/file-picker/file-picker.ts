import { Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';

/**
 * Botón de PrimeNG que abre el selector de archivos del navegador (input nativo oculto pero accesible).
 * Emite el archivo elegido; validar tipo y tamaño es responsabilidad de quien lo usa (ver checkFile en form-utils).
 */
@Component({
  selector: 'app-file-picker',
  imports: [ButtonDirective],
  template: `
    <label
      pButton
      [severity]="severity()"
      [text]="text()"
      [outlined]="outlined()"
      [icon]="icon()"
      [label]="label()"
      class="cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tz-subtitle"
    >
      <input type="file" class="sr-only" [accept]="accept()" [disabled]="disabled()" (change)="onChange($event)" />
    </label>
  `,
  host: { class: 'inline-block' }
})
export class FilePicker {
  readonly label = input.required<string>();
  readonly icon = input('pi pi-upload');
  /** Tipos aceptados, ej. 'image/png,image/jpeg' */
  readonly accept = input('');
  readonly severity = input<'primary' | 'secondary'>('secondary');
  readonly text = input(true);
  readonly outlined = input(false);
  readonly disabled = input(false);

  readonly picked = output<File>();

  protected onChange(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    element.value = ''; // permite volver a elegir el mismo archivo
    if (file) this.picked.emit(file);
  }
}
