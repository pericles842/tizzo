import { Component, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ButtonDirective } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';
import { apiErrorMessage } from '../../core/http/api-error';
import { TeacherCard, TeacherCardData } from '../../shared/teacher-card/teacher-card';
import { TeachersService } from './teachers.service';

const PER_PAGE = 12;

/**
 * Listado público de profes (/profes): un buscador (nombre, titular, especialidad o clase) y las tarjetas con "Ver perfil".
 * La búsqueda y la página viven en la URL (?q=&pagina=).
 */
@Component({
  selector: 'app-teachers-page',
  imports: [FormsModule, ButtonDirective, IconField, InputIcon, InputText, Message, Paginator, Skeleton, TeacherCard],
  template: `
    <section class="border-b border-tz-line bg-tz-section py-10" aria-labelledby="profes-titulo">
      <div class="tz-container">
        <h1 id="profes-titulo" class="text-3xl font-semibold sm:text-4xl">Encuentra a tu profe</h1>
        <p class="mt-2 max-w-2xl">Mira su perfil, sus clases y cursos por dar, y guarda a tus favoritos.</p>

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
              placeholder="Nombre, especialidad o clase: álgebra, inglés, guitarra..."
              aria-label="Buscar profes"
              maxlength="80"
              [(ngModel)]="draft"
            />
          </p-iconfield>
          <button pButton type="submit" label="Buscar"></button>
        </form>
      </div>
    </section>

    <section class="tz-container py-8">
      <h2 class="text-2xl font-semibold">{{ query().q ? 'Resultados para "' + query().q + '"' : 'Profes' }}</h2>
      <p class="mt-1 text-sm" aria-live="polite">{{ loading() ? 'Buscando...' : total() === 1 ? '1 profe' : total() + ' profes' }}</p>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mt-6" role="alert">{{ message }}</p-message>
      }

      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" [attr.aria-busy]="loading()">
        @if (loading()) {
          @for (placeholder of placeholders; track placeholder) {
            <p-skeleton height="19rem" borderRadius="1rem" />
          }
        } @else {
          @for (teacher of items(); track teacher.uuid) {
            <app-teacher-card [teacher]="teacher" />
          } @empty {
            @if (!error()) {
              <div class="rounded-2xl border border-dashed border-tz-line px-6 py-12 text-center sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <i class="pi pi-search text-3xl text-tz-subtitle" aria-hidden="true"></i>
                <p class="mt-3 font-semibold text-tz-title">No encontramos profes con esa búsqueda</p>
                <p class="mt-1 text-sm">Prueba con otras palabras.</p>
                @if (query().q) {
                  <button pButton type="button" class="mt-4" label="Ver todos los profes" severity="secondary" [outlined]="true" (click)="clear()"></button>
                }
              </div>
            }
          }
        }
      </div>

      @if (total() > perPage) {
        <p-paginator class="mt-8" [rows]="perPage" [totalRecords]="total()" [first]="(query().page - 1) * perPage" [pageLinkSize]="5" (onPageChange)="changePage($event)" />
      }
    </section>
  `
})
export class TeachersPage {
  private readonly service = inject(TeachersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({ q: (params.get('q') ?? '').trim().slice(0, 80), page: Math.max(1, Math.trunc(Number(params.get('pagina'))) || 1) }))
    ),
    { initialValue: { q: '', page: 1 } }
  );

  protected readonly perPage = PER_PAGE;
  protected readonly placeholders = [1, 2, 3, 4, 5, 6, 7, 8];
  protected draft = '';
  protected readonly items = signal<TeacherCardData[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Número de la última petición: las respuestas viejas se ignoran */
  private requestId = 0;

  constructor() {
    effect(() => {
      const { q, page } = this.query();
      this.draft = q;
      if (this.isBrowser) void this.load(q, page);
    });
  }

  protected search(): void {
    this.go({ q: this.draft.trim() || null, pagina: null });
  }

  protected clear(): void {
    this.go({ q: null, pagina: null });
  }

  protected changePage(event: PaginatorState): void {
    this.go({ q: this.query().q || null, pagina: Math.floor((event.first ?? 0) / PER_PAGE) + 1 || null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private go(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { ...queryParams, pagina: Number(queryParams['pagina']) > 1 ? queryParams['pagina'] : null } });
  }

  private async load(q: string, page: number): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.service.list({ q, page, perPage: PER_PAGE });
      if (id !== this.requestId) return;
      this.items.set(result.items);
      this.total.set(result.total);
    } catch (err) {
      if (id !== this.requestId) return;
      this.items.set([]);
      this.total.set(0);
      this.error.set(apiErrorMessage(err));
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }
}
