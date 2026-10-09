import { Audience } from '../../../../core/auth/age';
/** Tipos del calendario del profe (tizzo.api/src/app/controllers/teaching.controller.ts) */

/** class = clase suelta (una sesión); course = curso (varias clases, da diploma al completarse) */
export type TeachingKind = 'class' | 'course';

/** Una clase con fecha y hora, tal como la devuelve GET /teacher/calendar */
export interface CalendarSession {
  uuid: string;
  course_uuid: string;
  kind: TeachingKind;
  course_title: string;
  /** Título de la clase; si no tiene, el del curso */
  title: string;
  session_number: number;
  total_sessions: number;
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  /** draft = el profe aún no está aprobado, se publica al aprobarlo */
  course_status: 'draft' | 'published' | 'archived';
  /** Máximo de integrantes de la clase suelta o del curso completo */
  max_students: number;
  /** Miniatura de la clase o del curso */
  cover_url: string | null;
}

/** Una clase de un curso dentro de una plantilla (sin fecha: guarda la duración en minutos) */
export interface TemplateSession {
  title: string;
  description: string | null;
  duration_min: number;
  learning_points: string[];
}

/** Plantilla guardada: título, descripción y lo demás que se repite, sin fechas */
export interface TeachingTemplate {
  uuid: string;
  kind: TeachingKind;
  title: string;
  description: string;
  price: number | null;
  /** Solo clase suelta */
  duration_min: number | null;
  max_students: number | null;
  audience: Audience | null;
  gives_certificate: boolean;
  learning_points: string[];
  sessions: TemplateSession[];
  updated_at: string;
}

/** Cuerpo para guardar una plantilla. Solo kind, title y description son obligatorios. */
export interface TemplateData {
  kind: TeachingKind;
  title: string;
  description: string;
  price?: number | null;
  duration_min?: number | null;
  max_students?: number | null;
  audience?: Audience | null;
  gives_certificate?: boolean;
  learning_points?: string[];
  sessions?: Partial<TemplateSession>[];
}

export interface NewClass {
  title: string;
  description: string;
  price: number;
  max_students: number;
  /** Para quién es: todos, solo adultos o solo menores */
  audience: Audience;
  /** ISO en UTC; la duración sale del rango inicio-fin */
  starts_at: string;
  ends_at: string;
  gives_certificate: boolean;
  learning_points: string[];
}

export interface NewCourseSession {
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  learning_points: string[];
}

export interface NewCourse {
  title: string;
  description: string;
  price: number;
  /** Del curso completo, no de cada clase */
  max_students: number;
  audience: Audience;
  learning_points: string[];
  sessions: NewCourseSession[];
}

export interface CreatedCourse {
  course_uuid: string;
  status: 'draft' | 'published';
  /** Se creó, pero no se pudo subir la miniatura */
  coverFailed?: boolean;
}
