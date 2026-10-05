import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Tag } from 'primeng/tag';
import type { CatalogItem } from '../../features/catalog/catalog.service';
import { CourseCover } from '../course-cover/course-cover';
import { money } from '../course-detail/course-detail.utils';

/**
 * Tarjeta de una clase suelta o curso publicado (miniatura, tipo, profe, próxima clase, precio, cupos y "Ver detalle").
 * La usan el catálogo `/clases` y la sección de clases del home. Solo recibe datos (`CatalogItem`).
 */
@Component({
  selector: 'app-catalog-card',
  imports: [RouterLink, ButtonDirective, Card, Tag, CourseCover],
  template: `
    <p-card class="h-full border border-tz-surface-border">
      <app-course-cover variant="banner" [url]="item().cover_url" [isCourse]="item().kind === 'course'" [alt]="'Miniatura de ' + item().title" />
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <p-tag [value]="item().kind === 'course' ? 'Curso · ' + item().total_sessions + ' clases' : 'Clase suelta'" [severity]="item().kind === 'course' ? 'info' : 'warn'" />
        @if (item().gives_certificate) {
          <p-tag value="Con diploma" severity="secondary" />
        }
      </div>
      <h3 class="mt-2 line-clamp-2 text-lg font-semibold leading-snug">{{ item().title }}</h3>
      <p class="mt-1 text-sm">Con {{ item().teacher.name }}</p>
      @if (live()) {
        <p class="mt-1 flex items-center gap-2 text-sm"><span class="tz-on-air-tag"><span class="tz-on-air-dot" aria-hidden="true"></span>EN VIVO</span> {{ when() }}</p>
      } @else if (item().next_starts_at) {
        <p class="mt-1 flex items-center gap-2 text-sm"><i class="pi pi-calendar" aria-hidden="true"></i> {{ when() }}</p>
      }
      <div class="mt-4 flex items-center justify-between gap-2">
        <div>
          <p class="font-display text-xl font-semibold text-tz-title">{{ price() }}</p>
          <p class="text-xs">{{ spots() }}</p>
        </div>
        <a pButton [routerLink]="['/clases', item().slug]" label="Ver detalle" size="small"></a>
      </div>
    </p-card>
  `,
  host: { class: 'block' }
})
export class CatalogCard {
  readonly item = input.required<CatalogItem>();

  protected readonly price = computed(() => `${money(this.item().price, this.item().currency)}${this.item().kind === 'course' ? ' el curso' : ''}`);

  protected readonly spots = computed(() => {
    const left = this.item().spots_left;
    return left > 0 ? `Quedan ${left} ${left === 1 ? 'cupo' : 'cupos'}` : 'Sin cupos';
  });

  /**
   * La clase ya empezó: el API solo devuelve clases que no han terminado, así que si su inicio ya pasó está en curso.
   * (Se calcula al dibujar la tarjeta; el catálogo se vuelve a pedir al entrar a la página.)
   */
  protected readonly live = computed(() => !!this.item().next_starts_at && new Date(this.item().next_starts_at as string).getTime() <= Date.now());

  /** "Próxima clase: jue, 8 oct, 6:00 p. m." o, en vivo, "Empezó a las 4:28 p. m." */
  protected readonly when = computed(() => {
    const date = new Date(this.item().next_starts_at as string);
    const time = date.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (this.live()) return `Empezó a las ${time}`;
    const day = date.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
    return `Próxima clase: ${day}, ${time}`;
  });
}
