import { User } from '../../../../core/auth/auth.models';
import { CompletionItem, ProfileCompletion } from '../profile/profile.utils';

/** Zonas horarias que se ofrecen (mercado: Venezuela y Latinoamérica, más España y EE. UU.) */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Caracas', label: 'Venezuela (Caracas)' },
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'America/Guayaquil', label: 'Ecuador (Guayaquil)' },
  { value: 'America/La_Paz', label: 'Bolivia (La Paz)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Montevideo', label: 'Uruguay (Montevideo)' },
  { value: 'America/Asuncion', label: 'Paraguay (Asunción)' },
  { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
  { value: 'America/Panama', label: 'Panamá' },
  { value: 'America/Costa_Rica', label: 'Costa Rica' },
  { value: 'America/Guatemala', label: 'Guatemala' },
  { value: 'America/El_Salvador', label: 'El Salvador' },
  { value: 'America/Tegucigalpa', label: 'Honduras (Tegucigalpa)' },
  { value: 'America/Managua', label: 'Nicaragua (Managua)' },
  { value: 'America/Havana', label: 'Cuba (La Habana)' },
  { value: 'America/Santo_Domingo', label: 'República Dominicana' },
  { value: 'America/Puerto_Rico', label: 'Puerto Rico' },
  { value: 'America/New_York', label: 'Estados Unidos (Nueva York)' },
  { value: 'Europe/Madrid', label: 'España (Madrid)' }
];

/** Las zonas ofrecidas más la guardada de la persona, por si no está en la lista */
export function timezoneOptions(current: string): { value: string; label: string }[] {
  return TIMEZONES.some((zone) => zone.value === current) || !current ? TIMEZONES : [{ value: current, label: current }, ...TIMEZONES];
}

/**
 * Qué tan completo está el perfil del estudiante. Cuentan 5 datos: foto de perfil, teléfono, país, fecha de nacimiento y los temas
 * que quiere aprender. El nombre y el correo siempre existen, por eso no suman.
 */
export function studentCompletion(user: User | null): ProfileCompletion {
  const items: CompletionItem[] = [
    { key: 'photo', label: 'Foto de perfil', done: !!user?.avatar_url },
    { key: 'phone', label: 'Teléfono', done: !!user?.phone?.trim() },
    { key: 'country', label: 'País', done: !!user?.country_code },
    { key: 'age', label: 'Fecha de nacimiento', done: !!user?.birth_date },
    { key: 'topics', label: 'Temas que quieres aprender', done: (user?.topics.length ?? 0) > 0 }
  ];
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
}
