import { Component, computed, input } from '@angular/core';
import { Card } from 'primeng/card';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { ButtonDirective } from 'primeng/button';

/** Datos que muestra la tarjeta de un profe */
export interface TeacherCardData {
  id: string;
  name: string;
  /** Ej.: "Matemáticas · Álgebra" */
  subjects: string;
  rating: number;
  classes: number;
  /** Precio por clase en USD */
  price: number;
  live: boolean;
}

/** Tarjeta de profe (p-card + p-avatar + p-badge + pButton). Se itera en listados. */
@Component({
  selector: 'app-teacher-card',
  imports: [Card, Avatar, Badge, ButtonDirective],
  template: `
    <p-card class="h-full border border-tz-surface-border">
      <div class="flex h-28 items-center justify-center rounded-xl bg-tz-soft">
        <p-avatar [label]="initials()" shape="circle" size="xlarge" class="tz-bg-gradient font-display text-xl text-white" />
      </div>

      <h3 class="mt-4 text-base font-semibold">{{ teacher().name }}</h3>
      <p class="mt-0.5 text-sm">{{ teacher().subjects }}</p>
      <p class="mt-1 text-xs font-medium text-tz-subtitle">
        <span aria-hidden="true">★</span>
        <span class="sr-only">Calificación</span> {{ rating() }} · {{ teacher().classes }} clases
      </p>

      <div class="mt-4 flex items-center justify-between gap-2">
        <p>
          <span class="font-display text-xl font-semibold text-tz-title">\${{ teacher().price }}</span>
          <span class="text-xs"> / clase</span>
        </p>
        @if (teacher().live) {
          <p-badge value="EN VIVO" severity="danger" />
        }
      </div>

      <button pButton type="button" label="Reservar clase" [fluid]="true" class="mt-4" [attr.aria-label]="'Reservar clase con ' + teacher().name"></button>
    </p-card>
  `,
  host: { class: 'block h-full' }
})
export class TeacherCard {
  readonly teacher = input.required<TeacherCardData>();

  /** "Prof. Andrea M." -> "AM" */
  protected readonly initials = computed(() =>
    this.teacher()
      .name.replace(/^Prof(a)?\.\s*/i, '')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );

  protected readonly rating = computed(() => this.teacher().rating.toFixed(1));
}
