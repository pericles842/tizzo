import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { CatalogItem, CatalogService } from '../../../../features/catalog/catalog.service';
import { CatalogCard } from '../../../../shared/catalog-card/catalog-card';

/** Cuántas clases se muestran en el home antes de "Ver todas" */
const VISIBLE = 6;

/**
 * Sección "Clases disponibles" del home: las clases sueltas y cursos publicados que ya se pueden reservar,
 * con las que empiezan primero. Se carga en el navegador (el home se prerenderiza, pero los cupos cambian a cada rato).
 * Si no hay ninguna, invita a ver el catálogo o a dar clases en vez de quedar vacía.
 */
@Component({
  selector: 'app-available-classes',
  imports: [RouterLink, ButtonDirective, Skeleton, CatalogCard],
  template: `
    <section id="clases" class="bg-tz-section py-14" aria-labelledby="clases-titulo">
      <div class="tz-container">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="clases-titulo" class="text-2xl font-semibold sm:text-3xl">Clases disponibles</h2>
            <p class="mt-1">Reserva tu lugar en las próximas clases y cursos en vivo.</p>
          </div>
          <a pButton routerLink="/clases" label="Ver todas" icon="pi pi-arrow-right" iconPos="right" severity="secondary" [outlined]="true"></a>
        </div>

        <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          @if (loading()) {
            @for (placeholder of [1, 2, 3]; track placeholder) {
              <p-skeleton height="18rem" borderRadius="1rem" />
            }
          } @else {
            @for (item of items(); track item.uuid) {
              <app-catalog-card [item]="item" />
            } @empty {
              <p class="sm:col-span-2 lg:col-span-3">
                {{ failed() ? 'No pudimos cargar las clases ahora. Intenta de nuevo en un momento.' : 'Todavía no hay clases publicadas. Vuelve pronto.' }}
              </p>
            }
          }
        </div>
      </div>
    </section>
  `
})
export class AvailableClasses implements OnInit {
  private readonly service = inject(CatalogService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly items = signal<CatalogItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.service
      .list({ perPage: VISIBLE })
      .then(({ items }) => this.items.set(items))
      .catch(() => this.failed.set(true))
      .finally(() => this.loading.set(false));
  }
}
