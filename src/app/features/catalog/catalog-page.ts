import { Component, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectButton } from 'primeng/selectbutton';
import { Skeleton } from 'primeng/skeleton';
import { apiErrorMessage } from '../../core/http/api-error';
import { CatalogCard } from '../../shared/catalog-card/catalog-card';
import { CourseKind } from '../../shared/course-detail/course-detail.models';
import { CatalogItem, CatalogService } from './catalog.service';

type KindFilter = CourseKind | 'all';

const KINDS: { label: string; value: KindFilter }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'Clases', value: 'class' },
  { label: 'Cursos', value: 'course' }
];

/** Página pública "Clases": clases sueltas y cursos publicados que todavía se pueden reservar */
@Component({
  selector: 'app-catalog-page',
  imports: [FormsModule, ButtonDirective, IconField, InputIcon, InputText, Message, SelectButton, Skeleton, CatalogCard],
  template: `
    <section class="tz-container py-10">
      <h1 class="text-3xl font-semibold sm:text-4xl">Clases y cursos en vivo</h1>
      <p class="mt-2 max-w-2xl">Elige una clase o un curso, resérvalo y entra a la sala desde tu calendario. La sala abre 10 minutos antes de cada clase.</p>

      <form class="mt-6 flex flex-wrap items-center gap-3" role="search" (submit)="$event.preventDefault(); load()">
        <p-iconfield class="w-full sm:w-80">
          <p-inputicon class="pi pi-search" />
          <input pInputText type="search" class="w-full" placeholder="Buscar por título" aria-label="Buscar por título" [(ngModel)]="query" name="q" />
        </p-iconfield>
        <p-selectbutton [options]="kinds" optionLabel="label" optionValue="value" [allowEmpty]="false" [ngModel]="kind()" (ngModelChange)="changeKind($event)" name="kind" />
        <button pButton type="submit" label="Buscar" severity="secondary" [outlined]="true"></button>
      </form>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mt-6" role="alert">{{ message }}</p-message>
      }

      <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        @if (loading()) {
          @for (placeholder of [1, 2, 3]; track placeholder) {
            <p-skeleton height="18rem" borderRadius="1rem" />
          }
        } @else {
          @for (item of items(); track item.uuid) {
            <app-catalog-card [item]="item" />
          } @empty {
            <p class="sm:col-span-2 lg:col-span-3">No hay clases disponibles con esos filtros por ahora.</p>
          }
        }
      </div>
    </section>
  `
})
export class CatalogPage implements OnInit {
  private readonly service = inject(CatalogService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Texto a buscar que viene de la URL (/clases?q=...), por ejemplo desde el buscador del home */
  readonly q = input<string>();

  protected readonly kinds = KINDS;
  protected readonly kind = signal<KindFilter>('all');
  protected query = '';
  protected readonly items = signal<CatalogItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.query = this.q() ?? '';
    if (this.isBrowser) void this.load();
  }

  protected changeKind(kind: KindFilter): void {
    this.kind.set(kind);
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const kind = this.kind();
      this.items.set(await this.service.list({ kind: kind === 'all' ? null : kind, q: this.query }));
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
