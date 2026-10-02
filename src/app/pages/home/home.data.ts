/**
 * Datos de EJEMPLO del home (solo UI, según el diseño de Figma).
 * Se reemplazarán por datos del API cuando existan cursos, clases en vivo y profes aprobados.
 */
import { TeacherCardData } from '../../shared/teacher-card/teacher-card';

export interface LiveClassPreview {
  title: string;
  progress: string;
  teacher: string;
  teacherInitials: string;
  subject: string;
  rating: number;
  price: number;
}

export interface HowItWorksStep {
  title: string;
  text: string;
}

export const HERO_LIVE_CLASS: LiveClassPreview = {
  title: 'Álgebra desde cero',
  progress: 'Clase 3 de 8 · 60 min',
  teacher: 'Prof. Andrea M.',
  teacherInitials: 'AM',
  subject: 'Matemáticas',
  rating: 4.9,
  price: 12
};

export const HERO_HIGHLIGHTS = ['100% en vivo', 'Diploma al terminar', 'Pagos seguros'];

export const TOPICS = ['Matemáticas', 'Idiomas', 'Programación', 'Música', 'Ciencias', 'Diseño', 'Oficios', 'Preparación de exámenes'];

export const FEATURED_TEACHERS: TeacherCardData[] = [
  { id: 'demo-1', name: 'Prof. Andrea M.', subjects: 'Matemáticas · Álgebra', rating: 4.9, classes: 120, price: 12, live: true },
  { id: 'demo-2', name: 'Prof. Luis R.', subjects: 'Programación · Web', rating: 4.8, classes: 86, price: 15, live: false },
  { id: 'demo-3', name: 'Prof. Camila S.', subjects: 'Inglés · Conversación', rating: 5, classes: 210, price: 10, live: true },
  { id: 'demo-4', name: 'Prof. Carlos P.', subjects: 'Música · Guitarra', rating: 4.7, classes: 64, price: 14, live: false }
];

export const HOW_IT_WORKS: HowItWorksStep[] = [
  { title: 'Elige a tu profe', text: 'Busca por tema, precio y horario. Cada perfil tiene su propio precio.' },
  { title: 'Reserva y paga', text: 'Tu pago confirma la reserva. Recibes el link de tu sala al instante.' },
  { title: 'Aprende en vivo', text: 'Entra a la videollamada, pregunta todo y, al terminar el curso, descarga tu diploma.' }
];
