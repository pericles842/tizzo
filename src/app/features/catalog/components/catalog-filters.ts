import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { RadioButton } from 'primeng/radiobutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { CatalogArea } from '../catalog.service';
import { CatalogQuery, KIND_OPTIONS, PRICE_OPTIONS, RATING_OPTIONS, TIME_OPTIONS, activeFilterCount } from '../catalog-query';

/**
 * Panel "Filtros" del catálogo: en vivo, tipo, tema, precio, valoración y horario.
 * Solo muestra la búsqueda que recibe y emite los cambios (la página los pasa a la URL).
 * `idPrefix` evita ids repetidos cuando el panel está dos veces (columna lateral y drawer de móvil).
 */
@Component({
  selector: 'app-catalog-filters',
  imports: [FormsModule, ButtonDirective, Checkbox, RadioButton, ToggleSwitch],
  template: `
    <div class="flex items-center justify-between gap-2">
      <h2 class="font-display text-lg font-semibold">Filtros</h2>
      @if (count() > 0) {
        <button pButton type="button" label="Limpiar" size="small" severity="secondary" [text]="true" (click)="cleared.emit()"></button>
      }
    </div>

    <div class="mt-4 flex items-center justify-between gap-3">
      <label [for]="idPrefix() + '-live'" class="flex items-center gap-2 text-sm font-medium text-tz-title">
        <span class="tz-live-dot" aria-hidden="true"></span> En vivo ahora
      </label>
      <p-toggleswitch [inputId]="idPrefix() + '-live'" [ngModel]="query().live" (ngModelChange)="changed.emit({ live: $event })" />
    </div>

    <fieldset class="mt-5">
      <legend class="text-sm font-semibold text-tz-title">Tipo</legend>
      <div class="mt-2 space-y-2">
        <div class="flex items-center gap-2">
          <p-radiobutton [inputId]="idPrefix() + '-kind-all'" [name]="idPrefix() + '-kind'" [value]="null" [ngModel]="query().kind" (ngModelChange)="changed.emit({ kind: $event })" />
          <label [for]="idPrefix() + '-kind-all'" class="text-sm">Todo</label>
        </div>
        @for (option of kinds; track option.value) {
          <div class="flex items-center gap-2">
            <p-radiobutton [inputId]="idPrefix() + '-kind-' + option.value" [name]="idPrefix() + '-kind'" [value]="option.value" [ngModel]="query().kind" (ngModelChange)="changed.emit({ kind: $event })" />
            <label [for]="idPrefix() + '-kind-' + option.value" class="text-sm">{{ option.label }}</label>
          </div>
        }
      </div>
    </fieldset>

    @if (areas().length) {
      <fieldset class="mt-5">
        <legend class="text-sm font-semibold text-tz-title">Tema</legend>
        <div class="mt-2 space-y-2">
          @for (area of areas(); track area.slug) {
            <div class="flex items-center gap-2">
              <p-checkbox [inputId]="idPrefix() + '-topic-' + area.slug" [value]="area.slug" [ngModel]="query().topics" (ngModelChange)="changed.emit({ topics: $event })" />
              <label [for]="idPrefix() + '-topic-' + area.slug" class="text-sm">{{ area.name }}</label>
            </div>
          }
        </div>
      </fieldset>
    }

    <fieldset class="mt-5">
      <legend class="text-sm font-semibold text-tz-title">Precio</legend>
      <div class="mt-2 space-y-2">
        @for (option of prices; track option.value) {
          <div class="flex items-center gap-2">
            <p-checkbox [inputId]="idPrefix() + '-price-' + option.value" [value]="option.value" [ngModel]="query().prices" (ngModelChange)="changed.emit({ prices: $event })" />
            <label [for]="idPrefix() + '-price-' + option.value" class="text-sm">{{ option.label }}</label>
          </div>
        }
      </div>
    </fieldset>

    <fieldset class="mt-5">
      <legend class="text-sm font-semibold text-tz-title">Valoración del profe</legend>
      <div class="mt-2 space-y-2">
        <div class="flex items-center gap-2">
          <p-radiobutton [inputId]="idPrefix() + '-rating-any'" [name]="idPrefix() + '-rating'" [value]="null" [ngModel]="query().rating" (ngModelChange)="changed.emit({ rating: $event })" />
          <label [for]="idPrefix() + '-rating-any'" class="text-sm">Cualquiera</label>
        </div>
        @for (option of ratings; track option.value) {
          <div class="flex items-center gap-2">
            <p-radiobutton [inputId]="idPrefix() + '-rating-' + option.value" [name]="idPrefix() + '-rating'" [value]="option.value" [ngModel]="query().rating" (ngModelChange)="changed.emit({ rating: $event })" />
            <label [for]="idPrefix() + '-rating-' + option.value" class="flex items-center gap-1 text-sm">
              <i class="pi pi-star-fill text-xs text-tz-subtitle" aria-hidden="true"></i> {{ option.label }}
            </label>
          </div>
        }
      </div>
    </fieldset>

    <fieldset class="mt-5">
      <legend class="text-sm font-semibold text-tz-title">Horario de la próxima clase</legend>
      <div class="mt-2 space-y-2">
        @for (option of times; track option.value) {
          <div class="flex items-center gap-2">
            <p-checkbox [inputId]="idPrefix() + '-time-' + option.value" [value]="option.value" [ngModel]="query().times" (ngModelChange)="changed.emit({ times: $event })" />
            <label [for]="idPrefix() + '-time-' + option.value" class="text-sm">{{ option.label }} <span class="text-xs opacity-75">· {{ option.hint }}</span></label>
          </div>
        }
      </div>
    </fieldset>
  `,
  host: { class: 'block' }
})
export class CatalogFilters {
  readonly query = input.required<CatalogQuery>();
  readonly areas = input<CatalogArea[]>([]);
  readonly idPrefix = input('filters');

  /** Un cambio de filtro (la página vuelve a la página 1) */
  readonly changed = output<Partial<CatalogQuery>>();
  /** "Limpiar": quita todos los filtros del panel (deja la búsqueda y el orden) */
  readonly cleared = output<void>();

  protected readonly kinds = KIND_OPTIONS;
  protected readonly prices = PRICE_OPTIONS;
  protected readonly ratings = RATING_OPTIONS;
  protected readonly times = TIME_OPTIONS;
  protected readonly count = computed(() => activeFilterCount(this.query()));
}
