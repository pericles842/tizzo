import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { checkFile } from '../../../../../shared/form/form-utils';

/**
 * Zona para arrastrar o elegir un PDF (máx. 10 MB). Muestra el archivo cargado con "Ver", "Reemplazar" y "Quitar".
 * Solo valida y emite: subirlo es responsabilidad de quien la usa. Toda la zona es un botón de al menos 44 px.
 */
@Component({
  selector: 'app-pdf-dropzone',
  imports: [ButtonDirective],
  template: `
    <input #picker type="file" accept="application/pdf,.pdf" class="sr-only" tabindex="-1" aria-hidden="true" [disabled]="disabled()" (change)="onPicked($event)" />

    @if (fileName(); as name) {
      <div class="rounded-2xl border border-tz-line bg-tz-soft p-3 sm:p-4">
        <div class="flex items-center gap-3">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tz-surface text-tz-subtitle" aria-hidden="true">
            <i class="pi pi-file-pdf text-xl"></i>
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-tz-title" [attr.title]="name">{{ name }}</p>
            <p class="text-xs">{{ caption() }}</p>
          </div>
        </div>
        <div class="-mb-1 mt-2 flex flex-wrap gap-1 border-t border-tz-line pt-2">
          @if (viewUrl(); as url) {
            <a pButton [href]="url" target="_blank" rel="noopener" label="Ver" icon="pi pi-external-link" size="small" severity="secondary" [text]="true"></a>
          }
          @if (!disabled()) {
            <button pButton type="button" label="Reemplazar" icon="pi pi-refresh" size="small" severity="secondary" [text]="true" (click)="open()"></button>
            @if (removable()) {
              <button pButton type="button" label="Quitar" icon="pi pi-trash" size="small" severity="secondary" [text]="true" (click)="removed.emit()"></button>
            }
          }
        </div>
      </div>
    } @else {
      <button
        type="button"
        class="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tz-subtitle disabled:cursor-not-allowed disabled:opacity-60"
        [class]="dragging() ? 'border-tz-subtitle bg-tz-soft' : 'border-tz-line bg-tz-surface hover:border-tz-subtitle'"
        [disabled]="disabled()"
        [attr.aria-describedby]="describedBy()"
        (click)="open()"
        (dragover)="onDragOver($event)"
        (dragleave)="dragging.set(false)"
        (drop)="onDrop($event)"
      >
        <span class="flex size-12 items-center justify-center rounded-xl tz-bg-gradient text-white" aria-hidden="true"><i class="pi pi-upload text-xl"></i></span>
        <span class="font-semibold text-tz-title">{{ prompt() }}</span>
        <span class="text-sm">o <span class="font-semibold text-tz-subtitle underline">elige un archivo</span> · Solo PDF, máx. 10 MB</span>
      </button>
    }

    @if (error(); as message) {
      <p class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert">
        <i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ message }}
      </p>
    }
  `,
  host: { class: 'block' }
})
export class PdfDropzone {
  private readonly picker = viewChild.required<ElementRef<HTMLInputElement>>('picker');

  /** Archivo ya cargado (del servidor o elegido sin subir) */
  readonly fileName = input<string | null>(null);
  /** Texto bajo el nombre ("Se subirá al guardar", "Entregado el …") */
  readonly caption = input('PDF');
  /** Enlace para abrir el archivo cargado */
  readonly viewUrl = input<string | null>(null);
  readonly prompt = input('Arrastra aquí el PDF');
  readonly removable = input(true);
  readonly disabled = input(false);
  readonly describedBy = input<string | null>(null);
  /** Error del servidor u otro, además de los de tipo y tamaño */
  readonly externalError = input<string | null>(null);

  readonly picked = output<File>();
  readonly removed = output<void>();

  protected readonly dragging = signal(false);
  private readonly localError = signal<string | null>(null);
  protected readonly error = () => this.localError() ?? this.externalError();

  protected open(): void {
    if (!this.disabled()) this.picker().nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.disabled()) this.accept(file);
  }

  protected onPicked(event: Event): void {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    element.value = '';
    if (file) this.accept(file);
  }

  private accept(file: File): void {
    // El navegador puede no saber el tipo: se acepta la extensión .pdf y el servidor revisa el contenido real
    const typed = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');
    const pdf = file.type === typed ? file : new File([file], file.name, { type: typed });
    const invalid = checkFile(pdf, ['application/pdf'], 'PDF');
    this.localError.set(invalid);
    if (!invalid) this.picked.emit(pdf);
  }
}
