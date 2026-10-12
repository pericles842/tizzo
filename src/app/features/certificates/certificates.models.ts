/** Diploma de la lista del estudiante o del profe (GET /student/certificates, /teacher/certificates) */
export interface Certificate {
  uuid: string;
  code: string;
  /** Clase o curso al que pertenece: con esto se agrupan las listas */
  course_id: string;
  title: string;
  kind: 'class' | 'course';
  student_name: string;
  teacher_name: string;
  issued_at: string;
  revoked: boolean;
  has_file: boolean;
  /** Hay vista previa (no la tiene un diploma revocado ni los emitidos antes de que existiera) */
  has_preview: boolean;
}

/** Lo que ve el público al verificar un código (GET /certificates/verify/:code) */
export interface CertificateVerification {
  valid: boolean;
  code: string;
  title: string;
  kind: 'class' | 'course';
  student_name: string;
  teacher_name: string;
  issued_at: string;
  revoked_at: string | null;
}
