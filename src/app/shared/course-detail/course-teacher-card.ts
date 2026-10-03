import { Component, computed, input, output } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { CourseDetailTeacher } from './course-detail.models';

/** "Tu profe": foto, nombre, titular, años enseñando, calificación y presentación */
@Component({
  selector: 'app-course-teacher-card',
  imports: [Avatar, ButtonDirective, Card],
  template: `
    <p-card class="border border-tz-surface-border">
      <h2 class="font-display text-lg font-semibold">{{ heading() }}</h2>
      <div class="mt-4 flex items-start gap-4">
        @if (teacher().avatar_url; as image) {
          <p-avatar [image]="image" shape="circle" size="large" />
        } @else {
          <p-avatar [label]="initials()" shape="circle" size="large" class="tz-bg-gradient font-display text-sm text-white" />
        }
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-tz-title">Prof. {{ teacher().name }}</p>
          @if (subtitle(); as text) {
            <p class="text-sm">{{ text }}</p>
          }
          @if (teacher().rating_count > 0) {
            <p class="mt-0.5 flex items-center gap-1 text-xs text-tz-subtitle"><i class="pi pi-star-fill text-[0.65rem]" aria-hidden="true"></i> {{ teacher().rating_avg.toFixed(1) }} · {{ teacher().rating_count }} reseñas</p>
          }
        </div>
        <button pButton type="button" label="Ver perfil" size="small" severity="secondary" [outlined]="true" [disabled]="disabled()" (click)="viewProfile.emit()"></button>
      </div>
      @if (teacher().bio; as bio) {
        <p class="mt-4 text-sm">{{ bio }}</p>
      }
    </p-card>
  `,
  host: { class: 'block' }
})
export class CourseTeacherCard {
  readonly teacher = input.required<CourseDetailTeacher>();
  readonly heading = input('Tu profe');
  /** Desactiva "Ver perfil" (vista previa, o mientras no exista el perfil público) */
  readonly disabled = input(false);
  readonly viewProfile = output<void>();

  protected readonly initials = computed(() => {
    const parts = this.teacher().name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  });

  /** "Licenciada en Matemáticas · 8 años enseñando" */
  protected readonly subtitle = computed(() => {
    const { headline, years_experience } = this.teacher();
    const years = years_experience === null ? null : `${years_experience} ${years_experience === 1 ? 'año' : 'años'} enseñando`;
    return [headline, years].filter(Boolean).join(' · ') || null;
  });
}
