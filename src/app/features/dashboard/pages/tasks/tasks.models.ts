/** Tipos del módulo de tareas (respuestas del API, ver tizzo.api/src/utils/serializers.ts) */

export type TaskType = 'document' | 'quiz';
export type TaskScope = 'course' | 'class' | 'individual';
export type TaskStatus = 'draft' | 'published' | 'closed';
/** Estado de una tarea para el estudiante */
export type StudentTaskState = 'pending' | 'submitted' | 'overdue' | 'done';

export interface TaskCourseRef {
  uuid: string;
  title: string;
  kind: 'class' | 'course';
}

export interface TaskSessionRef {
  uuid: string;
  number: number;
  title: string;
  starts_at: string;
}

export interface TaskSubmissionInfo {
  file_name: string;
  submitted_at: string;
  is_late: boolean;
}

/** Tarea vista por su profe */
export interface TeacherTask {
  uuid: string;
  type: TaskType;
  scope: TaskScope;
  status: TaskStatus;
  title: string;
  instructions: string | null;
  due_at: string;
  allow_late: boolean;
  requires_submission: boolean;
  notify_email: boolean;
  /** Nombre del PDF de instrucciones (se descarga por el API) */
  file_name: string | null;
  course_id: string;
  session_id: string | null;
  course: TaskCourseRef;
  session: TaskSessionRef | null;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  stats: { assigned: number; submitted: number; late: number } | null;
}

/** Un estudiante asignado, en el detalle del profe */
export interface TaskStudent {
  uuid: string;
  name: string;
  avatar_url: string | null;
  assigned_at: string;
  state: StudentTaskState;
  submission: TaskSubmissionInfo | null;
}

/** Tarea vista por un estudiante asignado */
export interface StudentTask {
  uuid: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  instructions: string | null;
  due_at: string;
  allow_late: boolean;
  requires_submission: boolean;
  file_name: string | null;
  course: TaskCourseRef;
  session: TaskSessionRef | null;
  teacher_name: string | null;
  published_at: string | null;
  state: StudentTaskState;
  can_submit: boolean;
  past_due: boolean;
  submission: TaskSubmissionInfo | null;
}

/** Clase o curso del profe para el selector del editor (GET /teacher/task-targets) */
export interface TaskTargetCourse {
  uuid: string;
  title: string;
  kind: 'class' | 'course';
  individual: boolean;
  /** Alcances que admite */
  scopes: TaskScope[];
  /** Ya terminó su última clase */
  finished: boolean;
  sessions: { uuid: string; number: number; title: string; starts_at: string; ends_at: string }[];
  students: { uuid: string; name: string; avatar_url: string | null }[];
}

/** Lo que se envía al crear o editar */
export interface TaskPayload {
  type: TaskType;
  scope: TaskScope;
  course_id: string;
  session_id: string | null;
  title: string;
  instructions: string | null;
  due_at: string;
  allow_late: boolean;
  requires_submission: boolean;
  notify_email: boolean;
}

export interface TeacherTaskFilters {
  course_id?: string | null;
  session_id?: string | null;
  type?: TaskType | null;
  status?: TaskStatus | null;
}
