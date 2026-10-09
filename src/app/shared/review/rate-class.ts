import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ButtonDirective } from 'primeng/button';
import { Rating } from 'primeng/rating';
import { Textarea } from 'primeng/textarea';
import { environment } from '../../../environments/environment';
import { apiErrorMessage, apiFieldErrors } from '../../core/http/api-error';
import { ToastService } from '../../core/notify/toast.service';

/** Una clase terminada que el estudiante todavía no calificó (GET /student/reviews/pending) */
export interface PendingReview {
  session_uuid: string;
  course_uuid: string;
  title: string;
  teacher_name: string;
  ended_at: string;
}

const MAX_COMMENT = 1000;

/**
 * "¿Qué te pareció esta clase?": de 1 a 5 estrellas y, si quiere, un comentario. Es la señal más importante de la
 * puntuación del profe. Se usa al terminar la clase (sala) y en "Califica tus clases" del Inicio.
 */
@Component({
  selector: 'app-rate-class',
  imports: [FormsModule, ButtonDirective, Rating, Textarea],
  template: `
    <div class="text-left">
      <p class="font-semibold text-tz-title">¿Qué te pareció esta clase?</p>
      @if (heading()) {
        <p class="mt-0.5 text-sm">{{ heading() }}</p>
      }
      <p-rating class="mt-3 block" [ngModel]="stars()" (ngModelChange)="pick($event)" [stars]="5" aria-label="Calificación de la clase de 1 a 5 estrellas" />
      @if (stars() > 0) {
        <textarea pTextarea rows="2" class="mt-3 w-full" [maxlength]="maxComment" placeholder="Cuéntanos más (opcional)" aria-label="Comentario sobre la clase" [ngModel]="comment()" (ngModelChange)="comment.set($event)"></textarea>
      }
      @if (error(); as message) {
        <p class="mt-2 text-sm text-red-600 dark:text-red-300" role="alert">{{ message }}</p>
      }
      <button pButton type="button" label="Enviar calificación" icon="pi pi-send" size="small" class="mt-3" [disabled]="!stars() || saving()" [loading]="saving()" (click)="send()"></button>
    </div>
  `
})
export class RateClass {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly sessionUuid = input.required<string>();
  /** Línea bajo la pregunta: qué clase y con quién */
  readonly heading = input('');
  /** Se guardó la calificación (o ya estaba calificada) */
  readonly rated = output<void>();

  protected readonly maxComment = MAX_COMMENT;
  protected readonly stars = signal(0);
  protected readonly comment = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected pick(value: number | null): void {
    this.stars.set(value ?? 0);
    this.error.set(null);
  }

  protected async send(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/student/reviews`, { session_id: this.sessionUuid(), rating: this.stars(), comment: this.comment().trim() || null })
      );
      this.toast.success('¡Gracias por calificar la clase!');
      this.rated.emit();
    } catch (err) {
      // Ya estaba calificada: se da por hecho y se quita de la lista
      if ((err as { status?: number }).status === 409) {
        this.rated.emit();
        return;
      }
      this.error.set(apiFieldErrors(err)['rating'] ?? apiErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
