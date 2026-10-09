import { Component, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { ToastService } from '../../core/notify/toast.service';
import { CourseDetailView } from '../../shared/course-detail/course-detail-view';
import { CatalogDetail, CatalogService } from './catalog.service';

/**
 * Página pública de una clase o curso (/clases/:slug): la pantalla de detalle con la reserva activa.
 * Sin sesión, "Reservar" lleva a ingresar y vuelve aquí. Las cuentas de profe no reservan.
 */
@Component({
  selector: 'app-course-page',
  imports: [RouterLink, ButtonDirective, Message, Skeleton, CourseDetailView],
  template: `
    <section class="tz-container py-8">
      <a pButton routerLink="/clases" label="Todas las clases" icon="pi pi-arrow-left" severity="secondary" [text]="true" class="mb-4"></a>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      }

      @if (data(); as current) {
        <app-course-detail-view
          [course]="current.course"
          [enrolled]="current.viewer.enrolled"
          [reserving]="reserving()"
          [blockedReason]="blockedReason()"
          (reserve)="reserve()"
          (viewProfile)="viewProfile()"
        />
      } @else if (loading()) {
        <p-skeleton height="24rem" borderRadius="1rem" />
      }
    </section>
  `
})
export class CoursePage implements OnInit {
  private readonly service = inject(CatalogService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Viene de la ruta (withComponentInputBinding) */
  readonly slug = input.required<string>();

  protected readonly data = signal<CatalogDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly reserving = signal(false);
  protected readonly error = signal<string | null>(null);

  /** "Ver perfil" del profe: su página pública con todo lo que va a dar */
  protected viewProfile(): void {
    const teacher = this.data()?.course.teacher;
    if (teacher) void this.router.navigate(['/profes', teacher.uuid]);
  }

  protected readonly blockedReason = computed(() => {
    const current = this.data();
    if (current?.viewer.is_teacher) return 'Eres el profe de esta clase.';
    if (this.auth.user()?.role === 'teacher') return 'Las reservas son para cuentas de estudiante.';
    // Su edad no corresponde al público de la clase, o es menor y su representante no ha confirmado
    return current?.viewer.blocked_reason ?? null;
  });

  ngOnInit(): void {
    if (this.isBrowser) void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.data.set(await this.service.detail(this.slug()));
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async reserve(): Promise<void> {
    const current = this.data();
    if (!current) return;
    await this.auth.ensureSession();
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/ingresar'], { queryParams: { redirect: this.router.url } });
      return;
    }

    this.reserving.set(true);
    try {
      const result = await this.service.book(current.course.uuid);
      this.toast.success(
        result.email_sent
          ? '¡Listo! Ya estás inscrito. Te enviamos el enlace de la sala por correo y la clase aparece en tu calendario.'
          : '¡Listo! Ya estás inscrito y la clase aparece en tu calendario. No pudimos enviarte el correo con el enlace; entra a la sala desde tu calendario.'
      );
      // Recarga para ver los cupos y el estado "inscrito" actualizados
      this.data.set(await this.service.detail(this.slug()));
    } catch (err) {
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.reserving.set(false);
    }
  }
}
