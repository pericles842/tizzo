import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CalendarSession } from '../calendar/calendar.models';

/** Clase del calendario del estudiante: la misma forma que la del profe, más quién la da */
export interface StudentSession extends CalendarSession {
  teacher_name: string;
}

/** Calendario del estudiante (solo lectura): las clases de sus reservas confirmadas */
@Injectable({ providedIn: 'root' })
export class StudentCalendarService {
  private readonly http = inject(HttpClient);

  async sessions(from: Date, to: Date): Promise<StudentSession[]> {
    const params = new HttpParams().set('from', from.toISOString()).set('to', to.toISOString());
    const { events } = await firstValueFrom(this.http.get<{ events: StudentSession[] }>(`${environment.apiUrl}/student/calendar`, { params }));
    return events;
  }
}
