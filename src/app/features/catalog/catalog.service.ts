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
  /** `rating`: promedio de las reseñas del profe (null si aún no tiene) */
  teacher: { name: string; avatar_url: string | null; rating: number | null; reviews_count: number };
}

export type PriceBand = 'low' | 'mid' | 'high';
export type TimeBand = 'morning' | 'afternoon' | 'night';
export type CatalogSort = 'soonest' | 'price_asc' | 'price_desc' | 'rating';

/** Búsqueda y filtros del catálogo (GET /catalog) */
export interface CatalogFilters {
  /** Busca en el título, la descripción, el nombre del profe y el tema */
  q?: string;
  kind?: CourseKind | null;
  /** Slugs de áreas (categorías padre) */
  topics?: string[];
  prices?: PriceBand[];
  times?: TimeBand[];
  /** Valoración mínima del profe */
  rating?: 4 | 4.5 | null;
  /** Solo las que están en curso */
  live?: boolean;
  sort?: CatalogSort;
  page?: number;
  perPage?: number;
}

/** Área de temas (categoría padre de GET /categories) */
export interface CatalogArea {
  name: string;
  slug: string;
}

/** Una página del catálogo */
export interface CatalogPage {
  items: CatalogItem[];
  total: number;
  page: number;
  per_page: number;
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

  /** Una página del catálogo con la búsqueda y los filtros dados (todos opcionales) */
  list(filters: CatalogFilters = {}): Promise<CatalogPage> {
    let params = new HttpParams().set('tz_offset', -new Date().getTimezoneOffset());
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());
    if (filters.kind) params = params.set('kind', filters.kind);
    if (filters.topics?.length) params = params.set('topics', filters.topics.join(','));
    if (filters.prices?.length) params = params.set('price', filters.prices.join(','));
    if (filters.times?.length) params = params.set('time', filters.times.join(','));
    if (filters.rating) params = params.set('rating', filters.rating);
    if (filters.live) params = params.set('live', '1');
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.perPage) params = params.set('per_page', filters.perPage);
    return firstValueFrom(this.http.get<CatalogPage>(`${this.api}/catalog`, { params }));
  }

  /** Áreas (categorías padre) para el filtro "Tema" */
  async areas(): Promise<CatalogArea[]> {
    const groups = await firstValueFrom(this.http.get<CatalogArea[]>(`${this.api}/categories`));
    return groups.map(({ name, slug }) => ({ name, slug }));
  }

  detail(slug: string): Promise<CatalogDetail> {
    return firstValueFrom(this.http.get<CatalogDetail>(`${this.api}/catalog/${encodeURIComponent(slug)}`));
  }

  /** TEMPORAL: sin pasarela, la reserva queda confirmada al instante */
  book(courseUuid: string): Promise<BookingResult> {
    return firstValueFrom(this.http.post<BookingResult>(`${this.api}/courses/${courseUuid}/bookings`, {}));
  }
}
