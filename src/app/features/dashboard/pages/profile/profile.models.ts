import { TeacherProfile } from '../../../../core/auth/auth.models';

export type CredentialStatus = 'pending' | 'verified' | 'rejected';

/** Credencial del profe. El archivo es privado: nunca trae URL, se abre por `/teacher/credentials/:uuid/file`. */
export interface TeacherCredential {
  uuid: string;
  title: string;
  institution: string;
  /** 'YYYY-MM-DD' */
  issued_at: string | null;
  credential_number: string | null;
  status: CredentialStatus;
  created_at: string;
}

/** Categoría en la que enseña el profe, con sus años de experiencia en ella */
export interface SpecialtyEntry {
  category_id: number;
  name: string;
  /** Área a la que pertenece (null si es una categoría sin área, como "otro") */
  parent_name: string | null;
  years_experience: number;
}

/** Área de categorías con sus subcategorías (GET /categories). Las especialidades se eligen entre las subcategorías. */
export interface CategoryGroup {
  id: number;
  name: string;
  slug: string;
  children: { id: number; name: string; slug: string }[];
}

/** Respuesta de GET/PUT /teacher/profile y de la firma */
export interface ProfilePayload {
  profile: TeacherProfile;
  specialties: SpecialtyEntry[];
  credentials: TeacherCredential[];
}

/** Lo que el profe edita en el formulario del perfil */
export interface ProfileTextData {
  headline: string | null;
  bio: string | null;
  specialties: { category_id: number; years_experience: number }[];
}

/** Todos los datos son obligatorios al agregar una credencial */
export interface NewCredential {
  title: string;
  institution: string;
  issued_at: string;
  credential_number: string;
  file: File;
}
