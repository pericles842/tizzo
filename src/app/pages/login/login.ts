import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth/auth.service';
import { apiErrorMessage } from '../../core/http/api-error';
import { FieldError } from '../../shared/form/field-error';
import { focusFirstInvalid, validateGroup } from '../../shared/form/form-utils';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, InputText, Password, Message, FieldError],
  templateUrl: './login.html'
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formRef = viewChild<ElementRef<HTMLFormElement>>('formRef');

  /** Ruta a la que volver después de entrar (la pone authGuard) */
  readonly redirect = input<string>();

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit(): Promise<void> {
    this.error.set(null);
    if (!validateGroup(this.form)) {
      focusFirstInvalid(this.formRef()?.nativeElement);
      return;
    }

    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email.trim(), password);
      await this.router.navigateByUrl(this.safeRedirect());
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.submitting.set(false);
    }
  }

  /** Solo rutas internas: evita redirecciones abiertas a otros sitios */
  private safeRedirect(): string {
    const target = this.redirect();
    return target && target.startsWith('/') && !target.startsWith('//') ? target : '/app';
  }
}
