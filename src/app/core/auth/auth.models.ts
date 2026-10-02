/** Tipos que devuelve y recibe el API de autenticación (tizzo.api/src/utils/serializers.ts) */

export type UserRole = 'student' | 'teacher';
export type TeacherApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface TeacherProfile {
  uuid: string;
  headline: string | null;
  bio: string | null;
  specialty: string | null;
  years_experience: number | null;
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
  age: number;
  topic_ids: number[];
  timezone?: string;
}

export interface CredentialPayload {
  title: string;
  institution: string;
  issued_at?: string | null;
  credential_number?: string | null;
  file: File;
}
