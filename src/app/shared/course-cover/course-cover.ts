import { Component, computed, input } from '@angular/core';

/**
 * Miniatura o portada de una clase o curso, en proporción 16:9. Si todavía no tiene imagen muestra un fondo de marca
 * con un icono. `thumb` es la versión chica (listas y detalle); `banner` ocupa todo el ancho (pantalla de detalle).
 */
@Component({
  selector: 'app-course-cover',
  template: `
    <div class="relative aspect-video overflow-hidden bg-tz-soft" [class]="variant() === 'thumb' ? 'w-28 rounded-xl' : 'w-full rounded-2xl'">
      @if (url(); as src) {
        <img [src]="src" [alt]="alt()" loading="lazy" class="size-full object-cover" />
      } @else {
        <div class="tz-bg-gradient flex size-full items-center justify-center text-white" role="img" [attr.aria-label]="alt() || 'Sin miniatura'">
          <i [class]="icon()" [class.text-xl]="variant() === 'thumb'" [class.text-4xl]="variant() === 'banner'" aria-hidden="true"></i>
        </div>
      }
    </div>
  `,
  host: { class: 'block shrink-0' }
})
export class CourseCover {
  /** Imagen; si es null o vacía se muestra el fondo de marca */
  readonly url = input<string | null | undefined>(null);
  readonly alt = input('');
  readonly variant = input<'thumb' | 'banner'>('thumb');
  /** true = curso (libro), false = clase suelta (video) */
  readonly isCourse = input(false);

  protected readonly icon = computed(() => (this.isCourse() ? 'pi pi-book' : 'pi pi-video'));
}
