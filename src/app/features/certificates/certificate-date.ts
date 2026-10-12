/** "9 de octubre de 2026" */
export function longDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}
