import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CategoryGroup, NewCredential, ProfilePayload, ProfileTextData, TeacherCredential } from './profile.models';

/** Llamadas del perfil del profe al API (la sesión viaja en la cookie httpOnly) */
@Injectable({ providedIn: 'root' })
export class TeacherProfileService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/teacher`;

  getProfile(): Promise<ProfilePayload> {
    return firstValueFrom(this.http.get<ProfilePayload>(`${this.api}/profile`));
  }

  /** Categorías (áreas con subcategorías) para elegir las especialidades */
  getCategories(): Promise<CategoryGroup[]> {
    return firstValueFrom(this.http.get<CategoryGroup[]>(`${environment.apiUrl}/categories`));
  }

  updateProfile(data: ProfileTextData): Promise<ProfilePayload> {
    return firstValueFrom(this.http.put<ProfilePayload>(`${this.api}/profile`, data));
  }

  uploadSignature(file: File): Promise<ProfilePayload> {
    const form = new FormData();
    form.append('signature', file);
    return firstValueFrom(this.http.post<ProfilePayload>(`${this.api}/profile/signature`, form));
  }

  deleteSignature(): Promise<ProfilePayload> {
    return firstValueFrom(this.http.delete<ProfilePayload>(`${this.api}/profile/signature`));
  }

  async addCredential(credential: NewCredential): Promise<TeacherCredential> {
    const form = new FormData();
    form.append('title', credential.title);
    form.append('institution', credential.institution);
    form.append('issued_at', credential.issued_at);
    form.append('credential_number', credential.credential_number);
    form.append('file', credential.file);
    const { credential: created } = await firstValueFrom(this.http.post<{ credential: TeacherCredential }>(`${this.api}/credentials`, form));
    return created;
  }

  deleteCredential(uuid: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`${this.api}/credentials/${uuid}`));
  }

  /** URL para abrir el archivo de una credencial en otra pestaña (privado: lo valida la cookie de sesión) */
  credentialFileUrl(uuid: string): string {
    return `${this.api}/credentials/${uuid}/file`;
  }
}
