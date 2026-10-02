/** Tipos del dashboard. Hoy se llenan con datos de prueba (dashboard.mock.ts); mañana vendrán del API. */

export interface LiveClass {
  courseTitle: string;
  /** Ej.: "Clase 3 de 8 · Prof. Andrea M. · Hoy, 6:00 PM" */
  meta: string;
  /** Ej.: "En vivo · empieza en 25 min" */
  status: string;
  completedSessions: number;
  totalSessions: number;
}

export interface StatItem {
  icon: string;
  value: number;
  label: string;
}

export type ClassEventStatus = 'completed' | 'live' | 'upcoming';

export interface ClassEvent {
  title: string;
  time: string;
  status: ClassEventStatus;
  /** Texto extra: "Completada", "En 25 min" */
  note?: string;
}

export interface WeekDay {
  date: Date;
  isToday: boolean;
  events: ClassEvent[];
}

export interface TaskItem {
  id: string;
  title: string;
  course: string;
  due: string;
  /** Vence pronto: se resalta con el acento */
  urgent: boolean;
}

export interface PersonItem {
  id: string;
  name: string;
  detail: string;
  /** Lado derecho: "★ 4.9" para profes, "6 clases" para estudiantes */
  trailing: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  status: 'earned' | 'in_progress';
  /** Obtenido: "Prof. Luis R. · 12 ago 2026". En curso: "3 de 8 clases completadas" */
  detail: string;
  progress?: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  time: string;
  text: string;
  replies: number;
}

/** Textos del dashboard que cambian según el rol */
export interface DashboardCopy {
  greeting: string;
  summary: string;
  tasksTitle: string;
  peopleTitle: string;
  certificatesTitle: string;
  peopleRoute: string;
}

export interface DashboardData {
  copy: DashboardCopy;
  liveClass: LiveClass;
  stats: StatItem[];
  week: WeekDay[];
  tasks: TaskItem[];
  people: PersonItem[];
  certificates: CertificateItem[];
  posts: CommunityPost[];
}
