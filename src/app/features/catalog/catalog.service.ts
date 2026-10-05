import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseDetail, CourseKind } from '../../shared/course-detail/course-detail.models';

/** Tarjeta del catálogo público (GET /catalog) */
export interface CatalogItem {
  uuid: string;
  slug: string;
  kind: CourseKind;
  title: string;
  cover_url: string | null;
  price: number;
  currency: string;
  modality: 'group' | 'individual';
  max_students: number;
  total_sessions: number;
  gives_certificate: boolean;
  next_starts_at: string | null;
  spots_left: number;
  teacher: { name: string; avatar_url: string | null };
}

/** Detalle público (GET /catalog/:slug): la pantalla de detalle y qué puede hacer quien la ve */
export interface CatalogDetail {
  course: CourseDetail & { slug: string };
  viewer: { enrolled: boolean; is_teacher: boolean };
}

export interface BookingResult {
  booking: { uuid: string; status: string };
  course_uuid: string;
  room_path: string;
  /** El correo con el enlace de la sala salió de verdad (false si el proveedor lo rechazó o no hay proveedor) */
  email_sent: boolean;
}

/** Catálogo público de clases y cursos, e inscripción del estudiante */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  async list(filters: { kind?: CourseKind | null; q?: string } = {}): Promise<CatalogItem[]> {
    let params = new HttpParams();
    if (filters.kind) params = params.set('kind', filters.kind);
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());
    const { items } = await firstValueFrom(this.http.get<{ items: CatalogItem[] }>(`${this.api}/catalog`, { params }));
    return items;
  }

  detail(slug: string): Promise<CatalogDetail> {
    return firstValueFrom(this.http.get<CatalogDetail>(`${this.api}/catalog/${encodeURIComponent(slug)}`));
  }

  /** TEMPORAL: sin pasarela, la reserva queda confirmada al instante */
  book(courseUuid: string): Promise<BookingResult> {
    return firstValueFrom(this.http.post<BookingResult>(`${this.api}/courses/${courseUuid}/bookings`, {}));
  }
}
