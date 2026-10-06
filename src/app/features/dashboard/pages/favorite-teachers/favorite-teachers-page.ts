import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { TeacherCard, TeacherCardData } from '../../../../shared/teacher-card/teacher-card';
import { TeachersService } from '../../../teachers/teachers.service';

/** "Profesores" del estudiante: los profes que marcó como favoritos (el último agregado primero), con "Ver perfil" y "Quitar" */
@Component({
  selector: 'app-favorite-teachers-page',
  imports: [RouterLink, ButtonDirective, Message, Skeleton, TeacherCard],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="font-display text-3xl font-semibold text-tz-title">Tus profes favoritos</p>
        <p class="mt-1 text-sm">Los profes que guardaste desde su perfil. Entra a su perfil para ver todo lo que van a dar.</p>
      </div>
      <a pButton routerLink="/profes" label="Buscar profes" icon="pi pi-search" severity="secondary" [outlined]="true"></a>
    </header>

    @if (error(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      <button pButton type="button" label="Reintentar" icon="pi pi-refresh" severity="secondary" [outlined]="true" class="mb-4" (click)="load()"></button>
    }
    @if (removeError(); as message) {
      <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
    }

    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" [attr.aria-busy]="loading()">
      @if (loading()) {
        @for (placeholder of [1, 2, 3]; track placeholder) {
          <p-skeleton height="19rem" borderRadius="1rem" />
        }
      } @else {
        @for (teacher of items(); track teacher.uuid) {
          <app-teacher-card [teacher]="teacher" [removable]="true" (remove)="remove(teacher)" />
        } @empty {
          @if (!error()) {
            <div class="rounded-2xl border border-dashed border-tz-line px-6 py-12 text-center sm:col-span-2 xl:col-span-3 2xl:col-span-4">
              <i class="pi pi-heart text-3xl text-tz-subtitle" aria-hidden="true"></i>
              <p class="mt-3 font-semibold text-tz-title">Todavía no tienes profes favoritos</p>
              <p class="mt-1 text-sm">Entra al perfil de un profe y toca "Agregar a favoritos" para verlo aquí.</p>
              <a pButton routerLink="/profes" label="Buscar profes" class="mt-4"></a>
            </div>
          }
        }
      }
    </div>
  `
})
export class FavoriteTeachersPage implements OnInit {
  private readonly service = inject(TeachersService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly items = signal<TeacherCardData[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly removeError = signal<string | null>(null);

  ngOnInit(): void {
    // El área privada solo se renderiza en el navegador
    if (this.isBrowser) void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.items.set(await this.service.favorites());
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async remove(teacher: TeacherCardData): Promise<void> {
    this.removeError.set(null);
    try {
      await this.service.removeFavorite(teacher.uuid);
      this.items.update((items) => items.filter((item) => item.uuid !== teacher.uuid));
    } catch (err) {
      this.removeError.set(apiErrorMessage(err));
    }
  }
}
