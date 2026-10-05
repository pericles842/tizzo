import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseKind } from '../../shared/course-detail/course-detail.models';

export interface RoomSession {
  uuid: string;
  number: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

export interface RoomCourse {
  uuid: string;
  title: string;
  kind: CourseKind;
  total_sessions: number;
}

/** GET /rooms/:courseUuid: la clase abierta ahora (si hay) y la próxima */
export interface RoomStatus {
  course: RoomCourse;
  role: 'teacher' | 'student';
  open_session: RoomSession | null;
  next_session: RoomSession | null;
  join_early_min: number;
}

/** POST /rooms/:courseUuid/join: sala de Daily y token solo para la clase abierta */
export interface RoomJoin {
  room_url: string;
  token: string;
  role: 'teacher' | 'student';
  user_name: string;
  course: RoomCourse;
  session: RoomSession;
}

/** Sala de una clase suelta o curso. El token de Daily nunca se guarda: se pide cada vez que se entra. */
@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/rooms`;

  status(courseUuid: string): Promise<RoomStatus> {
    return firstValueFrom(this.http.get<RoomStatus>(`${this.api}/${courseUuid}`));
  }

  join(courseUuid: string): Promise<RoomJoin> {
    return firstValueFrom(this.http.post<RoomJoin>(`${this.api}/${courseUuid}/join`, {}));
  }
}
