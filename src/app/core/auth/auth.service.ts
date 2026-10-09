import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CredentialPayload, RegisterPayload, SessionStatus, StudentProfilePayload, Topic, User } from './auth.models';

/**
 * Estado de la sesión en signals. El token vive en una cookie httpOnly que maneja el navegador:
 * este servicio solo sabe QUIÉN está conectado (lo pregunta a /auth/me).
 *
 * En el servidor (SSR) la sesión queda en 'unknown': el render del servidor nunca conoce al usuario,
 * por eso las páginas privadas se renderizan solo en el navegador (app.routes.server.ts).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly api = environment.apiUrl;
  private sessionRequest: Promise<void> | null = null;

  readonly user = signal<User | null>(null);
  readonly status = signal<SessionStatus>('unknown');
  readonly isAuthenticated = computed(() => this.status() === 'authenticated');
  readonly isPendingTeacher = computed(() => this.user()?.teacher_profile?.approval_status === 'pending');
  /** Menor de edad cuyo representante todavía no confirmó: no reserva ni entra a las salas */
  readonly needsGuardian = computed(() => !!this.user()?.is_minor && !this.user()?.guardian?.confirmed);

  /** Pregunta al API por la sesión una sola vez. En el servidor no hace nada. */
  ensureSession(): Promise<void> {
    if (!this.isBrowser || this.status() !== 'unknown') return Promise.resolve();

    this.sessionRequest ??= firstValueFrom(this.http.get<{ user: User }>(`${this.api}/auth/me`))
      .then(({ user }) => this.setUser(user))
      .catch(() => this.clearUser());

    return this.sessionRequest;
  }

  async login(email: string, password: string): Promise<User> {
    const { user } = await firstValueFrom(this.http.post<{ user: User }>(`${this.api}/auth/login`, { email, password }));
    this.setUser(user);
    return user;
  }

  async register(payload: RegisterPayload): Promise<User> {
    const { user } = await firstValueFrom(this.http.post<{ user: User }>(`${this.api}/auth/register`, payload));
    this.setUser(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.api}/auth/logout`, {}));
    } finally {
      // Aunque el API falle, en este navegador la sesión se da por cerrada
      this.clearUser();
    }
  }

  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append('avatar', file);
    const { user } = await firstValueFrom(this.http.post<{ user: User }>(`${this.api}/me/avatar`, form));
    this.setUser(user);
    return user;
  }

  /** Quita la foto de perfil (el header vuelve a mostrar las iniciales) */
  async removeAvatar(): Promise<User> {
    const { user } = await firstValueFrom(this.http.delete<{ user: User }>(`${this.api}/me/avatar`));
    this.setUser(user);
    return user;
  }

  /** Guarda el perfil del estudiante; el header y el resto del panel se actualizan con la sesión */
  async updateStudentProfile(data: StudentProfilePayload): Promise<User> {
    const { user } = await firstValueFrom(this.http.put<{ user: User }>(`${this.api}/student/profile`, data));
    this.setUser(user);
    return user;
  }

  /** Reenvía el correo al representante (o lo cambia si viene `guardianEmail`). Responde si el correo salió. */
  async resendGuardian(guardianEmail?: string): Promise<boolean> {
    const { user, guardian_email_sent } = await firstValueFrom(
      this.http.post<{ user: User; guardian_email_sent: boolean }>(`${this.api}/student/guardian`, guardianEmail ? { guardian_email: guardianEmail } : {})
    );
    this.setUser(user);
    return guardian_email_sent;
  }

  async addCredential(credential: CredentialPayload): Promise<void> {
    const form = new FormData();
    form.append('title', credential.title);
    form.append('institution', credential.institution);
    if (credential.issued_at) form.append('issued_at', credential.issued_at);
    if (credential.credential_number) form.append('credential_number', credential.credential_number);
    form.append('file', credential.file);
    await firstValueFrom(this.http.post(`${this.api}/teacher/credentials`, form));
  }

  /** Temas para el paso "Tus intereses" del registro */
  getTopics(): Promise<Topic[]> {
    return firstValueFrom(this.http.get<Topic[]>(`${this.api}/topics`));
  }

  private setUser(user: User): void {
    this.user.set(user);
    this.status.set('authenticated');
  }

  private clearUser(): void {
    this.user.set(null);
    this.status.set('anonymous');
  }
}
