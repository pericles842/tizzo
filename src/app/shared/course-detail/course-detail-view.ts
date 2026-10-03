import { Component, input, output } from '@angular/core';
import { BookingCard } from './booking-card';
import { CourseDetail } from './course-detail.models';
import { CourseHero } from './course-hero';
import { CourseProgramCard } from './course-program-card';
import { CourseTeacherCard } from './course-teacher-card';
import { LearningPointsCard } from './learning-points-card';

/**
 * Pantalla de detalle de una clase suelta o de un curso (lo que ve el estudiante): cabecera, "qué aprenderás",
 * programa (en cursos), profe y, a la derecha, la tarjeta de reserva. Solo recibe datos (`CourseDetail`), así que
 * sirve igual para la vista previa del profe y para la página pública. Con `preview` no se puede reservar.
 */
@Component({
  selector: 'app-course-detail-view',
  imports: [CourseHero, LearningPointsCard, CourseProgramCard, CourseTeacherCard, BookingCard],
  template: `
    <div class="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div class="min-w-0 space-y-5">
        <app-course-hero [course]="course()" />
        @if (course().learning_points.length) {
          <app-learning-points-card [points]="course().learning_points" />
        }
        @if (course().kind === 'course' && course().sessions.length) {
          <app-course-program-card [sessions]="course().sessions" />
        }
        <app-course-teacher-card [teacher]="course().teacher" [disabled]="preview()" (viewProfile)="viewProfile.emit()" />
      </div>
      <app-booking-card class="lg:sticky lg:top-2" [course]="course()" [preview]="preview()" (reserve)="reserve.emit()" />
    </div>
  `,
  host: { class: 'block' }
})
export class CourseDetailView {
  readonly course = input.required<CourseDetail>();
  /** Vista previa del profe: sin reservar ni abrir el perfil */
  readonly preview = input(false);
  readonly reserve = output<void>();
  readonly viewProfile = output<void>();
}
