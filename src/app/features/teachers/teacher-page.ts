import { Component, OnInit, PLATFORM_ID, computed, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { CatalogCard } from '../../shared/catalog-card/catalog-card';
import { CatalogItem, CatalogService } from '../catalog/catalog.service';
import { TeacherDetail, TeachersService } from './teachers.service';

/** Cuántas clases y cursos se piden de una vez (el máximo que acepta el API) */
const UPCOMING_LIMIT = 48;

/**
 * Perfil público de un profe (/profes/:uuid): quién es, su biografía y TODAS sus clases y cursos por dar.
 * El estudiante lo puede agregar a favoritos (aparece en "Profesores" de su panel). Sin sesión, el botón lleva a
 * ingresar y vuelve aquí. Las cuentas de profe no tienen favoritos.
 */
@Component({
  selector: 'app-teacher-page',
  imports: [RouterLink, Avatar, Badge, ButtonDirective, Card, Message, Skeleton, Tag, CatalogCard],
  template: `
    <section class="tz-container py-8">
      <a pButton routerLink="/profes" label="Todos los profes" icon="pi pi-arrow-left" severity="secondary" [text]="true" class="mb-4"></a>

      @if (error(); as message) {
        <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      }
      @if (favoriteError(); as message) {
        <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      }

      @if (data(); as current) {
        <p-card class="border border-tz-surface-border">
          <div class="flex flex-wrap items-start gap-5">
            @if (current.teacher.avatar_url; as image) {
              <p-avatar [image]="image" shape="circle" size="xlarge" class="shrink-0" />
            } @else {
              <p-avatar [label]="initials()" shape="circle" size="xlarge" class="tz-bg-gradient shrink-0 font-display text-xl text-white" />
            }

            <div class="min-w-0 flex-1 basis-64">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-semibold sm:text-3xl">Prof. {{ current.teacher.name }}</h1>
                @if (current.teacher.live) {
                  <p-badge value="EN VIVO" severity="danger" />
                }
              </div>
              @if (current.teacher.headline; as headline) {
                <p class="mt-1">{{ headline }}</p>
              }
              <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                @if (current.teacher.rating !== null) {
                  <span class="flex items-center gap-1 font-medium text-tz-subtitle">
                    <i class="pi pi-star-fill text-xs" aria-hidden="true"></i>
                    {{ current.teacher.rating.toFixed(1) }} · {{ current.teacher.reviews_count }} {{ current.teacher.reviews_count === 1 ? 'reseña' : 'reseñas' }}
                  </span>
                } @else {
                  <span class="font-medium text-tz-subtitle">Profe nuevo</span>
                }
                @if (current.teacher.years_experience !== null) {
                  <span>{{ current.teacher.years_experience }} {{ current.teacher.years_experience === 1 ? 'año' : 'años' }} de experiencia</span>
                }
              </p>
              @if (current.teacher.specialties.length) {
                <ul class="mt-3 flex flex-wrap gap-2" aria-label="Especialidades">
                  @for (specialty of current.teacher.specialties; track specialty.name) {
                    <li><p-tag [value]="specialty.name" severity="secondary" [rounded]="true" /></li>
                  }
                </ul>
              }
            </div>

            <!-- Favoritos: solo estudiantes (sin sesión invita a ingresar; el profe no los tiene) -->
            @if (!current.viewer.is_self && !isTeacher()) {
              <div class="w-full sm:w-auto">
                @if (!auth.isAuthenticated()) {
                  <a pButton [routerLink]="['/ingresar']" [queryParams]="{ redirect: '/profes/' + current.teacher.uuid }" label="Agregar a favoritos" icon="pi pi-heart" severity="secondary" [outlined]="true" [fluid]="true"></a>
                } @else if (favorite()) {
                  <button pButton type="button" label="En tus favoritos" icon="pi pi-heart-fill" [loading]="saving()" [disabled]="saving()" [fluid]="true" aria-pressed="true" (click)="toggleFavorite()"></button>
                } @else {
                  <button pButton type="button" label="Agregar a favoritos" icon="pi pi-heart" severity="secondary" [outlined]="true" [loading]="saving()" [disabled]="saving()" [fluid]="true" aria-pressed="false" (click)="toggleFavorite()"></button>
                }
              </div>
            }
          </div>

          @if (current.teacher.bio; as bio) {
            <div class="mt-6 border-t border-tz-line pt-5">
              <h2 class="text-lg font-semibold">Sobre {{ current.teacher.name }}</h2>
              <p class="mt-2 whitespace-pre-line text-sm leading-relaxed">{{ bio }}</p>
            </div>
          }
        </p-card>

        <!-- Todo lo que va a dar -->
        <div class="mt-10">
          <h2 class="text-2xl font-semibold">Próximas clases y cursos</h2>
          <p class="mt-1 text-sm" aria-live="polite">{{ upcomingSummary() }}</p>

          <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            @if (loadingUpcoming()) {
              @for (placeholder of [1, 2, 3]; track placeholder) {
                <p-skeleton height="18rem" borderRadius="1rem" />
              }
            } @else {
              @for (item of upcoming(); track item.uuid) {
                <app-catalog-card [item]="item" />
              } @empty {
                <div class="rounded-2xl border border-dashed border-tz-line px-6 py-10 text-center sm:col-span-2 lg:col-span-3">
                  <i class="pi pi-calendar text-3xl text-tz-subtitle" aria-hidden="true"></i>
                  <p class="mt-3 font-semibold text-tz-title">Todavía no tiene clases programadas</p>
                  <p class="mt-1 text-sm">Agrégalo a favoritos para encontrarlo fácil cuando publique nuevas clases.</p>
                </div>
              }
            }
          </div>
        </div>
      } @else if (loading()) {
        <p-skeleton height="14rem" borderRadius="1rem" />
      }
    </section>
  `
})
export class TeacherPage implements OnInit {
  private readonly teachers = inject(TeachersService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly auth = inject(AuthService);

  /** Viene de la ruta (withComponentInputBinding) */
  readonly uuid = input.required<string>();

  protected readonly data = signal<TeacherDetail | null>(null);
  protected readonly upcoming = signal<CatalogItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingUpcoming = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly favoriteError = signal<string | null>(null);
  protected readonly favorite = signal(false);

  protected readonly isTeacher = computed(() => this.auth.user()?.role === 'teacher');

  protected readonly initials = computed(() => {
    const parts = (this.data()?.teacher.name ?? '').trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  });

  protected readonly upcomingSummary = computed(() => {
    const count = this.upcoming().length;
    if (this.loadingUpcoming()) return 'Cargando...';
    if (!count) return 'No hay clases ni cursos por dar por ahora.';
    return count === 1 ? '1 clase o curso por dar' : `${count} clases y cursos por dar`;
  });

  ngOnInit(): void {
    // Esta página solo se renderiza en el navegador (con sesión y cupos al día)
    if (this.isBrowser) void this.load();
  }

  private async load(): Promise<void> {
    try {
      await this.auth.ensureSession();
      const [detail, page] = await Promise.all([
        this.teachers.detail(this.uuid()),
        this.catalog.list({ teacher: this.uuid(), perPage: UPCOMING_LIMIT }).catch(() => null)
      ]);
      this.data.set(detail);
      this.favorite.set(detail.viewer.favorite);
      this.upcoming.set(page?.items ?? []);
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
      this.loadingUpcoming.set(false);
    }
  }

  protected async toggleFavorite(): Promise<void> {
    const teacher = this.data()?.teacher;
    if (!teacher) return;
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/ingresar'], { queryParams: { redirect: `/profes/${teacher.uuid}` } });
      return;
    }

    this.favoriteError.set(null);
    this.saving.set(true);
    try {
      if (this.favorite()) await this.teachers.removeFavorite(teacher.uuid);
      else await this.teachers.addFavorite(teacher.uuid);
      this.favorite.update((value) => !value);
    } catch (err) {
      this.favoriteError.set(apiErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
