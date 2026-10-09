/**
 * Datos de la pantalla de detalle de una clase suelta o de un curso. Es la forma que devuelve el API
 * (courseDetailResponse en tizzo.api) y la comparten la vista previa del profe y, más adelante, la página pública.
 */

/** class = clase suelta (una sesión); course = curso (varias clases, da diploma al completarse) */
export type CourseKind = 'class' | 'course';

export interface CourseDetailSession {
  uuid: string;
  number: number;
  title: string;
  description: string | null;
  learning_points: string[];
  starts_at: string;
  ends_at: string;
  duration_min: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface CourseDetailTeacher {
  /** Uuid del perfil del profe (su página pública es /profes/:uuid) */
  uuid: string;
  name: string;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  years_experience: number | null;
  rating_avg: number;
  rating_count: number;
}

export interface CourseDetail {
  uuid: string;
  kind: CourseKind;
  title: string;
  description: string;
  cover_url: string | null;
  /** Nombre de la categoría, si la tiene */
  category: string | null;
  price: number;
  currency: string;
  modality: 'group' | 'individual';
  /** Máximo de integrantes de la clase suelta o del curso completo */
  max_students: number;
  /** Para quién es: todos, solo adultos o solo menores */
  audience: 'all' | 'adults' | 'minors';
  gives_certificate: boolean;
  learning_points: string[];
  status: 'draft' | 'published' | 'archived';
  total_sessions: number;
  sessions: CourseDetailSession[];
  teacher: CourseDetailTeacher;
  enrollment: { count: number; spots_left: number };
}

/** Estudiante inscrito (reserva confirmada o completada) */
export interface EnrolledStudent {
  uuid: string;
  name: string;
  avatar_url: string | null;
  status: 'confirmed' | 'completed';
  enrolled_at: string;
}
