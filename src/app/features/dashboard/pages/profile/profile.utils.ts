import { TeacherProfile } from '../../../../core/auth/auth.models';

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
}

export interface ProfileCompletion {
  items: CompletionItem[];
  done: number;
  total: number;
  /** 0 a 100 */
  percent: number;
}

/** Lo que hace falta saber, además del perfil, para calcular qué tan completo está */
export interface CompletionContext {
  /** Cuántas especialidades eligió (cada una ya trae sus años de experiencia) */
  specialtiesCount: number;
  hasPhoto: boolean;
}

/**
 * Qué tan completo está el perfil. Cuentan 5 datos: foto de perfil, titular, biografía, especialidades
 * (al menos una, con sus años) y firma. Las credenciales son recomendadas pero opcionales, por eso no suman.
 */
export function profileCompletion(profile: TeacherProfile | null, context: CompletionContext = { specialtiesCount: 0, hasPhoto: false }): ProfileCompletion {
  const has = (value: string | null | undefined) => !!value && value.trim().length > 0;
  const items: CompletionItem[] = [
    { key: 'photo', label: 'Foto de perfil', done: context.hasPhoto },
    { key: 'headline', label: 'Titular', done: has(profile?.headline) },
    { key: 'bio', label: 'Biografía', done: has(profile?.bio) },
    { key: 'specialties', label: 'Especialidades y años de experiencia', done: context.specialtiesCount > 0 },
    { key: 'signature', label: 'Firma para tus diplomas', done: has(profile?.signature_url) }
  ];
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
}
