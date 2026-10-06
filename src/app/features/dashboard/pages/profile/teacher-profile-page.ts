import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { TeacherProfile } from '../../../../core/auth/auth.models';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { CredentialsCard } from './components/credentials-card/credentials-card';
import { PhotoCard } from './components/photo-card/photo-card';
import { ProfileForm } from './components/profile-form/profile-form';
import { ProfileSummary } from './components/profile-summary/profile-summary';
import { SignatureCard } from './components/signature-card/signature-card';
import { CategoryGroup, ProfilePayload, SpecialtyEntry, TeacherCredential } from './profile.models';
import { TeacherProfileService } from './teacher-profile.service';

/**
 * "Perfil" del profe: aquí completa su foto, el titular, la biografía, sus especialidades (categorías con sus
 * años de experiencia), su firma para los diplomas y sus credenciales. Solo para profes (teacherMatch en la ruta; el estudiante ve student-profile).
 */
@Component({
  selector: 'app-teacher-profile-page',
  imports: [ButtonDirective, Message, ProfileSummary, PhotoCard, ProfileForm, SignatureCard, CredentialsCard],
  template: `
    <header class="mb-6">
      <p class="font-display text-3xl font-semibold text-tz-title">Tu perfil de profe</p>
      <p class="mt-1 text-sm">Completa tu perfil para que el equipo de Tizzo lo apruebe y tus estudiantes te conozcan.</p>
    </header>

    @if (loading()) {
      <p class="flex items-center gap-2 text-sm" role="status"><i class="pi pi-spin pi-spinner" aria-hidden="true"></i> Cargando tu perfil…</p>
    } @else if (loadError(); as message) {
      <p-message severity="error" role="alert">{{ message }}</p-message>
      <button pButton type="button" label="Reintentar" icon="pi pi-refresh" severity="secondary" [outlined]="true" class="mt-4" (click)="load()"></button>
    } @else if (profile(); as current) {
      <div class="grid items-start gap-5 xl:grid-cols-3">
        <div class="space-y-5 xl:col-span-2">
          <app-profile-form [profile]="current" [specialties]="specialties()" [categories]="categories()" (updated)="apply($event)" />
          <app-credentials-card [credentials]="credentials()" (changed)="credentials.set($event)" />
        </div>
        <div class="space-y-5">
          <app-profile-summary [profile]="current" [specialtiesCount]="specialties().length" />
          <app-photo-card />
          <app-signature-card [profile]="current" (updated)="apply($event)" />
        </div>
      </div>
    }
  `
})
export class TeacherProfilePage implements OnInit {
  private readonly service = inject(TeacherProfileService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly profile = signal<TeacherProfile | null>(null);
  protected readonly specialties = signal<SpecialtyEntry[]>([]);
  protected readonly credentials = signal<TeacherCredential[]>([]);
  protected readonly categories = signal<CategoryGroup[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    // Esta página solo se renderiza en el navegador (la sesión vive en una cookie que el servidor no ve)
    if (this.isBrowser) void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const [payload, categories] = await Promise.all([this.service.getProfile(), this.service.getCategories()]);
      this.categories.set(categories);
      this.apply(payload);
    } catch (err) {
      this.loadError.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected apply(payload: ProfilePayload): void {
    this.profile.set(payload.profile);
    this.specialties.set(payload.specialties);
    this.credentials.set(payload.credentials);
  }
}
