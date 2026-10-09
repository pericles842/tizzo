/** Tipos que devuelve y recibe el API de autenticación (tizzo.api/src/utils/serializers.ts) */

export type UserRole = 'student' | 'teacher';
export type TeacherApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface TeacherProfile {
  uuid: string;
  headline: string | null;
  bio: string | null;
  /** Firma para los diplomas */
  signature_url: string | null;
  approval_status: TeacherApprovalStatus;
  rejection_reason: string | null;
  rating_avg: number;
  rating_count: number;
}

export interface User {
  uuid: string;
  role: UserRole;
  is_admin: boolean;
  status: 'active' | 'suspended' | 'deleted';
  email: string;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  phone: string | null;
  country_code: string | null;
  age: number | null;
  /** 'YYYY-MM-DD'; null en cuentas viejas (solo tienen la edad) */
  birth_date: string | null;
  /** Menor de 18 (por su fecha de nacimiento) */
  is_minor: boolean;
  /** Menor: el correo de su representante y si ya confirmó (sin eso no reserva ni entra a las salas) */
  guardian: { email: string | null; confirmed: boolean } | null;
  timezone: string;
  /** Estudiante: temas que quiere aprender. Profe: temas que quiere enseñar. */
  topics: Topic[];
  avatar_url: string | null;
  teacher_profile: TeacherProfile | null;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
}

/** Registro de 4 pasos: datos personales, contraseña, objetivo (rol) y temas */
export interface RegisterPayload {
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  country_code: string;
  /** 'YYYY-MM-DD' */
  birth_date: string;
  /** Obligatorio si es menor de 18 */
  guardian_email?: string;
  topic_ids: number[];
  timezone?: string;
}

/** Datos que guarda el estudiante en su perfil (PUT /student/profile) */
export interface StudentProfilePayload {
  first_name: string;
  last_name: string;
  phone: string | null;
  country_code: string;
  /** Solo si todavía no la tiene (se pone una sola vez) */
  birth_date?: string;
  timezone: string;
  topic_ids: number[];
}

export interface CredentialPayload {
  title: string;
  institution: string;
  issued_at?: string | null;
  credential_number?: string | null;
  file: File;
}
