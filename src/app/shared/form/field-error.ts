import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Mensaje de error de un campo. Se muestra cuando el campo fue tocado (o el formulario enviado).
 * Los errores del API llegan como { server: 'mensaje' } (ver applyServerErrors en form-utils.ts).
 */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p [id]="errorId()" class="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-300" role="alert">
        <i class="pi pi-exclamation-circle mt-0.5 text-xs" aria-hidden="true"></i>{{ text }}
      </p>
    }
  `
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  /**
   * id del mensaje, para enlazarlo con aria-describedby del input.
   * Se llama `errorId` (y no `id`) para que el id no quede duplicado en el elemento <app-field-error>.
   */
  readonly errorId = input.required<string>();
  /** Mensaje para el error `pattern` (depende del campo) */
  readonly patternMessage = input('El formato no es válido.');

  protected message(): string | null {
    const control = this.control();
    const errors = control.errors;
    if (!errors || !control.touched) return null;

    if (errors['server']) return errors['server'];
    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['email']) return 'Escribe un correo válido.';
    if (errors['minlength']) return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `No puede pasar de ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['min'] || errors['max']) return 'El valor está fuera del rango permitido.';
    if (errors['pattern']) return this.patternMessage();
    if (errors['mismatch']) return 'Las contraseñas no coinciden.';
    if (errors['file']) return errors['file'];
    return 'Revisa este campo.';
  }
}
