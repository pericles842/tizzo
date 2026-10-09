/** Edad y mayoría de edad en el navegador (lo mismo que tizzo.api/src/utils/age.ts) */

/** Mayoría de edad en Tizzo */
export const ADULT_AGE = 18;
export const MIN_AGE = 10;
export const MAX_AGE = 100;

export type Audience = 'all' | 'adults' | 'minors';

/** Para quién es una clase o un curso */
export const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string }[] = [
  { value: 'all', label: 'Todos', hint: 'Adultos y menores de 18.' },
  { value: 'adults', label: 'Solo adultos', hint: 'Solo mayores de 18 años.' },
  { value: 'minors', label: 'Solo menores', hint: 'Solo menores de 18 (con su representante en la llamada).' }
];

/** Etiqueta corta para tarjetas y detalle; "Todos" no se muestra */
export const AUDIENCE_TAG: Record<Audience, string | null> = { all: null, adults: 'Solo adultos (18+)', minors: 'Para menores de 18' };

/** Años cumplidos a la fecha `now` */
export function ageFrom(birth: Date, now = new Date()): number {
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

/** 'YYYY-MM-DD' con la fecha local (sin pasar por UTC, que podría cambiar el día) */
export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'YYYY-MM-DD' → fecha local */
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
