import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CourseDetail, EnrolledStudent } from '../../../../shared/course-detail/course-detail.models';
import { CalendarSession, CreatedCourse, NewClass, NewCourse, TeachingTemplate, TemplateData } from './calendar.models';

/** Llamadas del calendario del profe al API: clases, cursos, plantillas (la sesión viaja en la cookie httpOnly) */
@Injectable({ providedIn: 'root' })
export class TeachingService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/teacher`;

  /** Clases del profe entre dos fechas, sin las canceladas */
  async sessions(from: Date, to: Date): Promise<CalendarSession[]> {
    const params = new HttpParams().set('from', from.toISOString()).set('to', to.toISOString());
    const { events } = await firstValueFrom(this.http.get<{ events: CalendarSession[] }>(`${this.api}/calendar`, { params }));
    return events;
  }

  createClass(data: NewClass): Promise<CreatedCourse> {
    return firstValueFrom(this.http.post<CreatedCourse>(`${this.api}/classes`, data));
  }

  createCourse(data: NewCourse): Promise<CreatedCourse> {
    return firstValueFrom(this.http.post<CreatedCourse>(`${this.api}/courses`, data));
  }

  /** Detalle de una clase suelta o curso propio (lo que ve el estudiante) y sus inscritos */
  courseDetail(courseUuid: string): Promise<{ course: CourseDetail; enrolled: EnrolledStudent[] }> {
    return firstValueFrom(this.http.get<{ course: CourseDetail; enrolled: EnrolledStudent[] }>(`${this.api}/courses/${courseUuid}`));
  }

  /** Sube o reemplaza la miniatura de una clase suelta o curso */
  async uploadCover(courseUuid: string, file: File): Promise<string> {
    const form = new FormData();
    form.append('cover', file);
    const { cover_url } = await firstValueFrom(this.http.post<{ cover_url: string }>(`${this.api}/courses/${courseUuid}/cover`, form));
    return cover_url;
  }

  /**
   * Sube la miniatura elegida a una clase o curso recién creado. Si falla, la clase ya existe: se devuelve
   * marcada con coverFailed para avisar, sin perder lo creado.
   */
  async attachCover(created: CreatedCourse, file: File | null): Promise<CreatedCourse> {
    if (!file) return created;
    try {
      await this.uploadCover(created.course_uuid, file);
      return created;
    } catch {
      return { ...created, coverFailed: true };
    }
  }

  /** Mueve una clase a otra hora de inicio (conserva la duración) */
  moveSession(uuid: string, startsAt: Date): Promise<unknown> {
    return firstValueFrom(this.http.patch(`${this.api}/sessions/${uuid}`, { starts_at: startsAt.toISOString() }));
  }

  cancelSession(uuid: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`${this.api}/sessions/${uuid}`));
  }

  async templates(): Promise<TeachingTemplate[]> {
    const { templates } = await firstValueFrom(this.http.get<{ templates: TeachingTemplate[] }>(`${this.api}/templates`));
    return templates;
  }

  async saveTemplate(data: TemplateData): Promise<TeachingTemplate> {
    const { template } = await firstValueFrom(this.http.post<{ template: TeachingTemplate }>(`${this.api}/templates`, data));
    return template;
  }

  deleteTemplate(uuid: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`${this.api}/templates/${uuid}`));
  }
}
