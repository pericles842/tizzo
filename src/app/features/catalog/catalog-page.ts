import { Component, ElementRef, PLATFORM_ID, computed, effect, inject, signal, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ButtonDirective } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { Drawer } from 'primeng/drawer';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { apiErrorMessage } from '../../core/http/api-error';
import { CatalogCard } from '../../shared/catalog-card/catalog-card';
import { TeacherCard, TeacherCardData } from '../../shared/teacher-card/teacher-card';
import { TeachersService } from '../teachers/teachers.service';
import { CatalogArea, CatalogItem, CatalogService } from './catalog.service';
import {
  CatalogQuery,
  EMPTY_QUERY,
  KIND_OPTIONS,
  PER_PAGE,
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  TIME_OPTIONS,
  activeFilterCount,
  parseQuery,
  toFilters,
  toParams
} from './catalog-query';
import { CatalogFilters } from './components/catalog-filters';

/** Cuántos profes se muestran sobre los resultados cuando se busca por texto */
const TEACHERS_SHOWN = 3;

/** Filtro activo que se muestra como chip removible sobre los resultados */
interface ActiveChip {
  id: string;
  label: string;
  remove: Partial<CatalogQuery>;
}

/**
 * Página pública "Clases" (/clases): un solo buscador para profes, clases y cursos, filtros, orden y páginas.
 * La búsqueda vive en la URL (ver catalog-query.ts): cambiar un filtro navega y la página vuelve a pedir el catálogo.
 */
@Component({
  selector: 'app-catalog-page',
  imports: [FormsModule, RouterLink, ButtonDirective, Chip, Drawer, IconField, InputIcon, InputText, Message, Paginator, Select, Skeleton, CatalogCard, TeacherCard, CatalogFilters],
  template: `
    <!-- Buscador -->
    <section class="border-b border-tz-line bg-tz-section py-10" aria-labelledby="catalogo-titulo">
      <div class="tz-container">
        <h1 id="catalogo-titulo" class="text-3xl font-semibold sm:text-4xl">Encuentra tu clase</h1>
        <p class="mt-2 max-w-2xl">Busca por profe, clase o curso. Reserva y entra a la sala desde tu calendario: abre 10 minutos antes de cada clase.</p>

        <form
          role="search"
          class="mt-6 flex items-center gap-2 rounded-2xl border border-tz-surface-border bg-tz-surface p-1.5 shadow-sm focus-within:border-tz-subtitle"
          (submit)="$event.preventDefault(); search()"
        >
          <p-iconfield class="min-w-0 flex-1">
            <p-inputicon class="pi pi-search" />
            <input
              pInputText
              type="search"
              name="q"
              class="w-full border-0 bg-transparent shadow-none focus:outline-none"
              placeholder="Nombre del profe, clase o curso: álgebra, inglés, guitarra..."
              aria-label="Buscar por profe, clase o curso"
              maxlength="80"
              [(ngModel)]="draft"
            />
          </p-iconfield>
          <button pButton type="submit" label="Buscar"></button>
        </form>
      </div>
    </section>

    <section class="tz-container py-8">
      <div class="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <!-- Filtros (escritorio) -->
        <aside class="hidden lg:block" aria-label="Filtros">
          <div class="sticky top-24 rounded-2xl border border-tz-surface-border bg-tz-surface p-5">
            <app-catalog-filters idPrefix="side" [query]="query()" [areas]="areas()" (changed)="update($event)" (cleared)="clearFilters()" />
          </div>
        </aside>

        <div #results class="min-w-0 scroll-mt-24">
          <!-- Encabezado de resultados -->
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-2xl font-semibold">{{ heading() }}</h2>
              <p class="mt-1 text-sm" aria-live="polite">{{ loading() ? 'Buscando...' : summary() }}</p>
            </div>
            <div class="flex w-full items-center gap-2 sm:w-auto">
              <button
                pButton
                type="button"
                class="lg:hidden"
                icon="pi pi-sliders-h"
                [label]="filterCount() ? 'Filtros (' + filterCount() + ')' : 'Filtros'"
                severity="secondary"
                [outlined]="true"
                (click)="drawerOpen.set(true)"
              ></button>
              <label for="catalog-sort" class="sr-only">Ordenar</label>
              <p-select
                inputId="catalog-sort"
                class="min-w-0 flex-1 sm:w-52 sm:flex-none"
                [options]="sorts"
                optionLabel="label"
                optionValue="value"
                [ngModel]="query().sort"
                (ngModelChange)="update({ sort: $event })"
              />
            </div>
          </div>

          <!-- Filtros activos -->
          @if (chips().length) {
            <ul class="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
              @for (chip of chips(); track chip.id) {
                <li><p-chip [label]="chip.label" [removable]="true" (onRemove)="update(chip.remove)" /></li>
              }
              <li><button pButton type="button" label="Limpiar todo" size="small" severity="secondary" [text]="true" (click)="clearAll()"></button></li>
            </ul>
          }

          @if (error(); as message) {
            <p-message severity="error" styleClass="mt-6" role="alert">{{ message }}</p-message>
          }

          <!-- Profes que coinciden con lo escrito (nombre, especialidad, clase...) -->
          @if (teachers().length) {
            <section class="mt-6" aria-labelledby="catalogo-profes">
              <div class="flex items-end justify-between gap-3">
                <h3 id="catalogo-profes" class="text-lg font-semibold">Profes</h3>
                @if (teachersTotal() > teachers().length) {
                  <a pButton routerLink="/profes" [queryParams]="{ q: query().q }" [label]="'Ver los ' + teachersTotal() + ' profes'" icon="pi pi-arrow-right" iconPos="right" size="small" [text]="true"></a>
                }
              </div>
              <div class="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                @for (teacher of teachers(); track teacher.uuid) {
                  <app-teacher-card [teacher]="teacher" />
                }
              </div>
            </section>
            <h3 class="mt-8 text-lg font-semibold">Clases y cursos</h3>
          }

          <div class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" [attr.aria-busy]="loading()">
            @if (loading()) {
              @for (placeholder of placeholders; track placeholder) {
                <p-skeleton height="20rem" borderRadius="1rem" />
              }
            } @else {
              @for (item of items(); track item.uuid) {
                <app-catalog-card [item]="item" />
              } @empty {
                @if (!error() && teachers().length) {
                  <p class="sm:col-span-2 xl:col-span-3">Ninguna clase ni curso coincide con esa búsqueda, pero encontramos estos profes.</p>
                } @else if (!error()) {
                  <div class="rounded-2xl border border-dashed border-tz-line px-6 py-12 text-center sm:col-span-2 xl:col-span-3">
                    <i class="pi pi-search text-3xl text-tz-subtitle" aria-hidden="true"></i>
                    <p class="mt-3 font-semibold text-tz-title">No encontramos clases con esa búsqueda</p>
                    <p class="mt-1 text-sm">Prueba con otras palabras o quita algunos filtros.</p>
                    @if (chips().length) {
                      <button pButton type="button" class="mt-4" label="Quitar filtros" severity="secondary" [outlined]="true" (click)="clearAll()"></button>
                    }
                  </div>
                }
              }
            }
          </div>

          @if (total() > perPage) {
            <p-paginator
              class="mt-8"
              [rows]="perPage"
              [totalRecords]="total()"
              [first]="(query().page - 1) * perPage"
              [pageLinkSize]="5"
              (onPageChange)="changePage($event)"
            />
          }
        </div>
      </div>
    </section>

    <!-- Filtros (móvil) -->
    <p-drawer [visible]="drawerOpen()" (visibleChange)="drawerOpen.set($event)" position="right" header="Filtros" styleClass="w-full! sm:w-96!">
      <app-catalog-filters idPrefix="drawer" [query]="query()" [areas]="areas()" (changed)="update($event)" (cleared)="clearFilters()" />
      <ng-template #footer>
        <button pButton type="button" class="w-full" [label]="loading() ? 'Buscando...' : 'Ver ' + summary()" (click)="drawerOpen.set(false)"></button>
      </ng-template>
    </p-drawer>
  `
})
export class CatalogPage {
  private readonly service = inject(CatalogService);
  private readonly teachersService = inject(TeachersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly resultsRef = viewChild<ElementRef<HTMLElement>>('results');

  /** La búsqueda actual, leída de la URL */
  protected readonly query = toSignal(this.route.queryParamMap.pipe(map(parseQuery)), { initialValue: EMPTY_QUERY });

  protected readonly sorts = SORT_OPTIONS;
  protected readonly perPage = PER_PAGE;
  protected readonly placeholders = [1, 2, 3, 4, 5, 6];
  protected draft = '';
  protected readonly areas = signal<CatalogArea[]>([]);
  protected readonly items = signal<CatalogItem[]>([]);
  /** Profes que coinciden con la búsqueda escrita (solo se piden cuando hay texto) */
  protected readonly teachers = signal<TeacherCardData[]>([]);
  protected readonly teachersTotal = signal(0);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly drawerOpen = signal(false);
  protected readonly filterCount = computed(() => activeFilterCount(this.query()));

  /** Número de la última petición: si llegan respuestas viejas (filtros cambiados rápido) se ignoran */
  private requestId = 0;

  protected readonly heading = computed(() => {
    const { q, topics } = this.query();
    if (q) return `Resultados para "${q}"`;
    if (topics.length === 1) return this.areas().find((area) => area.slug === topics[0])?.name ?? 'Clases y cursos';
    return 'Clases y cursos';
  });

  protected readonly summary = computed(() => {
    const total = this.total();
    return total === 1 ? '1 resultado' : `${total} resultados`;
  });

  protected readonly chips = computed<ActiveChip[]>(() => {
    const query = this.query();
    const chips: ActiveChip[] = [];
    if (query.q) chips.push({ id: 'q', label: `"${query.q}"`, remove: { q: '' } });
    if (query.live) chips.push({ id: 'live', label: 'En vivo ahora', remove: { live: false } });
    const kind = KIND_OPTIONS.find((option) => option.value === query.kind);
    if (kind) chips.push({ id: 'kind', label: kind.label, remove: { kind: null } });
    for (const slug of query.topics) {
      const name = this.areas().find((area) => area.slug === slug)?.name ?? slug;
      chips.push({ id: `topic-${slug}`, label: name, remove: { topics: query.topics.filter((topic) => topic !== slug) } });
    }
    for (const option of PRICE_OPTIONS.filter((price) => query.prices.includes(price.value))) {
      chips.push({ id: `price-${option.value}`, label: option.label, remove: { prices: query.prices.filter((price) => price !== option.value) } });
    }
    const rating = RATING_OPTIONS.find((option) => option.value === query.rating);
    if (rating) chips.push({ id: 'rating', label: `★ ${rating.label}`, remove: { rating: null } });
    for (const option of TIME_OPTIONS.filter((time) => query.times.includes(time.value))) {
      chips.push({ id: `time-${option.value}`, label: option.label, remove: { times: query.times.filter((time) => time !== option.value) } });
    }
    return chips;
  });

  constructor() {
    // Cada cambio de la URL vuelve a pedir el catálogo (solo en el navegador: /clases no se prerenderiza)
    effect(() => {
      const query = this.query();
      this.draft = query.q;
      if (this.isBrowser) void this.load(query);
    });
    if (this.isBrowser) {
      this.service
        .areas()
        .then((areas) => this.areas.set(areas))
        .catch(() => this.areas.set([]));
    }
  }

  protected search(): void {
    this.update({ q: this.draft.trim() });
  }

  /** Cambia la búsqueda en la URL; todo cambio que no sea de página vuelve a la página 1 */
  protected update(change: Partial<CatalogQuery>): void {
    const next = { ...this.query(), page: 1, ...change };
    void this.router.navigate([], { relativeTo: this.route, queryParams: toParams(next) });
  }

  protected clearFilters(): void {
    const { q, sort } = this.query();
    this.update({ ...EMPTY_QUERY, q, sort });
  }

  protected clearAll(): void {
    this.update({ ...EMPTY_QUERY, sort: this.query().sort });
  }

  protected changePage(event: PaginatorState): void {
    this.update({ page: Math.floor((event.first ?? 0) / PER_PAGE) + 1 });
    this.resultsRef()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private async load(query: CatalogQuery): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [page, teachers] = await Promise.all([
        this.service.list(toFilters(query)),
        query.q ? this.teachersService.list({ q: query.q, perPage: TEACHERS_SHOWN }).catch(() => null) : Promise.resolve(null)
      ]);
      if (id !== this.requestId) return;
      this.items.set(page.items);
      this.total.set(page.total);
      this.teachers.set(teachers?.items ?? []);
      this.teachersTotal.set(teachers?.total ?? 0);
    } catch (err) {
      if (id !== this.requestId) return;
      this.items.set([]);
      this.teachers.set([]);
      this.total.set(0);
      this.error.set(apiErrorMessage(err));
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }
}
