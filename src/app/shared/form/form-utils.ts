import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mínimo una letra y un número (igual que el API) */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const PHONE_PATTERN = /^\+?[\d\s()-]{7,30}$/;

/** Límite de archivos, igual que el API (middlewares/upload.ts) */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

/** El campo `confirm` debe ser igual a `password`. El error se marca en `confirm`. */
export function passwordsMatch(password: string, confirm: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirmControl = group.get(confirm);
    if (!confirmControl) return null;

    const mismatch = !!confirmControl.value && group.get(password)?.value !== confirmControl.value;
    const { mismatch: _, ...others } = confirmControl.errors ?? {};
    confirmControl.setErrors(mismatch ? { ...others, mismatch: true } : Object.keys(others).length ? others : null);
    return null;
  };
}

/** Valida tipo y tamaño de un archivo. Devuelve el mensaje de error o null. */
export function checkFile(file: File, allowedTypes: string[], typesLabel: string): string | null {
  if (!allowedTypes.includes(file.type)) return `Formato no permitido. Usa ${typesLabel}.`;
  if (file.size > MAX_FILE_BYTES) return 'El archivo supera el máximo de 10 MB.';
  return null;
}

/**
 * Pinta en el formulario los errores por campo que devolvió el API.
 * `map` traduce la clave del API (ej. 'teacher.bio') al control del formulario.
 * Devuelve las claves que se pudieron aplicar.
 */
export function applyServerErrors(fields: Record<string, string>, map: Record<string, AbstractControl | undefined>): string[] {
  const applied: string[] = [];
  for (const [key, message] of Object.entries(fields)) {
    const control = map[key];
    if (!control) continue;
    control.setErrors({ ...(control.errors ?? {}), server: message });
    control.markAsTouched();
    applied.push(key);
  }
  return applied;
}

/** Marca todo como tocado y dice si el grupo es válido */
export function validateGroup(group: FormGroup): boolean {
  group.markAllAsTouched();
  group.updateValueAndValidity();
  return group.valid;
}

/** Lleva el foco al primer campo inválido dentro de un contenedor */
export function focusFirstInvalid(container: HTMLElement | null | undefined): void {
  const target = container?.querySelector<HTMLElement>('.ng-invalid input, .ng-invalid textarea, input.ng-invalid, textarea.ng-invalid, .ng-invalid [role="combobox"]');
  target?.focus();
}
