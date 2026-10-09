import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from 'primeng/badge';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';

/** Datos públicos de un profe (GET /teachers) */
export interface TeacherCardData {
  /** Uuid del perfil del profe */
  uuid: string;
  name: string;
  avatar_url: string | null;
  headline: string | null;
  /** Nombres de sus especialidades */
  subjects: string[];
  years_experience: number | null;
  /** Promedio de sus reseñas (null si todavía no tiene) */
  rating: number | null;
  reviews_count: number;
  /** Clases sueltas y cursos publicados que todavía no terminan */
  upcoming_count: number;
  /** Precio más bajo de lo que tiene por dar, en USD */
  from_price: number | null;
  /** Tiene una clase en curso ahora */
  live: boolean;
  featured: boolean;
}

/**
 * Tarjeta de profe (p-card + foto + p-badge + pButton). Se itera en listados y su botón lleva al perfil público.
 * Con `removable` muestra "Quitar de favoritos" (la lista de favoritos del estudiante).
 */
@Component({
  selector: 'app-teacher-card',
  imports: [RouterLink, Card, Badge, ButtonDirective],
  template: `
    <p-card class="h-full border border-tz-surface-border">
      <!-- La foto llena todo el recuadro; sin foto, las iniciales sobre el degradado de marca -->
      <div class="aspect-[4/3] overflow-hidden rounded-xl bg-tz-soft">
        @if (teacher().avatar_url; as image) {
          <img [src]="image" [alt]="'Foto de ' + teacher().name" class="size-full object-cover" loading="lazy" />
        } @else {
          <div class="tz-bg-gradient flex size-full items-center justify-center font-display text-4xl text-white" aria-hidden="true">{{ initials() }}</div>
        }
      </div>

      <h3 class="mt-4 line-clamp-1 text-base font-semibold">Prof. {{ teacher().name }}</h3>
      @if (subtitle(); as text) {
        <p class="mt-0.5 line-clamp-2 text-sm">{{ text }}</p>
      }
      <p class="mt-1 text-xs font-medium text-tz-subtitle">
        @if (teacher().rating !== null) {
          <span aria-hidden="true">★</span>
          <span class="sr-only">Calificación</span> {{ rating() }} · {{ teacher().reviews_count }} {{ teacher().reviews_count === 1 ? 'reseña' : 'reseñas' }}
        } @else {
          Profe nuevo
        }
      </p>

      <div class="mt-4 flex items-center justify-between gap-2">
        <div>
          @if (teacher().from_price !== null) {
            <p>
              <span class="text-xs">Desde </span><span class="font-display text-xl font-semibold text-tz-title">\${{ teacher().from_price }}</span>
            </p>
          }
          <p class="text-xs">{{ upcoming() }}</p>
        </div>
        @if (teacher().live) {
          <p-badge value="EN VIVO" severity="danger" />
        }
      </div>

      <a
        pButton
        [routerLink]="['/profes', teacher().uuid]"
        label="Ver perfil"
        severity="secondary"
        [outlined]="true"
        [fluid]="true"
        class="mt-4"
        [attr.aria-label]="'Ver perfil de ' + teacher().name"
      ></a>
      @if (removable()) {
        <button pButton type="button" label="Quitar de favoritos" icon="pi pi-heart-fill" size="small" severity="secondary" [text]="true" [fluid]="true" class="mt-1" (click)="remove.emit()"></button>
      }
    </p-card>
  `,
  host: { class: 'block h-full' }
})
export class TeacherCard {
  readonly teacher = input.required<TeacherCardData>();
  /** Muestra "Quitar de favoritos" */
  readonly removable = input(false);
  readonly remove = output<void>();

  protected readonly initials = computed(() => {
    const parts = this.teacher().name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  });

  protected readonly rating = computed(() => (this.teacher().rating ?? 0).toFixed(1));

  /** Sus especialidades o, si no eligió, su titular */
  protected readonly subtitle = computed(() => this.teacher().subjects.slice(0, 3).join(' · ') || this.teacher().headline);

  protected readonly upcoming = computed(() => {
    const count = this.teacher().upcoming_count;
    if (!count) return 'Sin clases programadas';
    return `${count} ${count === 1 ? 'clase o curso por dar' : 'clases y cursos por dar'}`;
  });
}
