import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeacherCardData } from '../../shared/teacher-card/teacher-card';

/** Una página del listado de profes (GET /teachers) */
export interface TeacherPage {
  items: TeacherCardData[];
  total: number;
  page: number;
  per_page: number;
}

/** Perfil público de un profe (GET /teachers/:uuid): la tarjeta más su biografía y especialidades */
export interface TeacherProfileData extends TeacherCardData {
  bio: string | null;
  specialties: { name: string; parent_name: string | null; years_experience: number }[];
}

export interface TeacherDetail {
  teacher: TeacherProfileData;
  /** `favorite`: el estudiante de la sesión lo tiene en favoritos; `is_self`: es el perfil del profe que está viendo */
  viewer: { favorite: boolean; is_self: boolean };
}

/** Profes públicos y favoritos del estudiante */
@Injectable({ providedIn: 'root' })
export class TeachersService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  list(filters: { q?: string; page?: number; perPage?: number } = {}): Promise<TeacherPage> {
    let params = new HttpParams();
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());
    if (filters.page) params = params.set('page', filters.page);
    if (filters.perPage) params = params.set('per_page', filters.perPage);
    return firstValueFrom(this.http.get<TeacherPage>(`${this.api}/teachers`, { params }));
  }

  detail(uuid: string): Promise<TeacherDetail> {
    return firstValueFrom(this.http.get<TeacherDetail>(`${this.api}/teachers/${encodeURIComponent(uuid)}`));
  }

  async favorites(): Promise<TeacherCardData[]> {
    const { items } = await firstValueFrom(this.http.get<{ items: TeacherCardData[] }>(`${this.api}/student/favorites`));
    return items;
  }

  async addFavorite(uuid: string): Promise<void> {
    await firstValueFrom(this.http.post(`${this.api}/teachers/${encodeURIComponent(uuid)}/favorite`, {}));
  }

  async removeFavorite(uuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/teachers/${encodeURIComponent(uuid)}/favorite`));
  }
}
