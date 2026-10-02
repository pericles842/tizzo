import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Injector, OnInit, PLATFORM_ID, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth/auth.service';
import { RegisterPayload, Topic, UserRole } from '../../core/auth/auth.models';
import { COUNTRIES } from '../../core/catalog/countries';
import { apiErrorMessage, apiFieldErrors } from '../../core/http/api-error';
import { AuthShell } from '../../shared/auth-shell/auth-shell';
import { StepProgress } from '../../shared/step-progress/step-progress';
import { PasswordStrength } from '../../shared/password-strength/password-strength';
import { ChoiceCard } from '../../shared/choice-card/choice-card';
import { TopicPicker } from '../../shared/topic-picker/topic-picker';
import { FieldError } from '../../shared/form/field-error';
import { PASSWORD_PATTERN, applyServerErrors, focusFirstInvalid, passwordsMatch, validateGroup } from '../../shared/form/form-utils';

type StepId = 'personal' | 'password' | 'goal' | 'interests';

/** Textos de cada paso: parte 1 (panel de marca) y parte 2 (formulario) */
interface StepCopy {
  id: StepId;
  label: string;
  asideHeading: string;
  asideDescription: string;
  title: string;
  subtitle: string;
}

const STEPS: StepCopy[] = [
  {
    id: 'personal',
    label: 'Datos personales',
    asideHeading: 'Crea tu cuenta y empieza en minutos',
    asideDescription: 'Aprende o enseña en vivo con personas reales.',
    title: 'Cuéntanos sobre ti',
    subtitle: 'Con estos datos creamos tu cuenta de Tizzo.'
  },
  {
    id: 'password',
    label: 'Contraseña',
    asideHeading: 'Protege tu cuenta',
    asideDescription: 'Una contraseña segura mantiene a salvo tus clases, pagos y diplomas.',
    title: 'Crea tu contraseña',
    subtitle: 'Elige una contraseña que puedas recordar y que nadie más adivine.'
  },
  {
    id: 'goal',
    label: 'Tu objetivo',
    asideHeading: 'Cuéntanos qué buscas',
    asideDescription: 'Así personalizamos tu experiencia desde el primer día.',
    title: '¿Qué quieres hacer en Tizzo?',
    subtitle: 'Elige una opción. Podrás cambiarla más adelante.'
  },
  {
    id: 'interests',
    label: 'Tus intereses',
    asideHeading: 'Encuentra al profe ideal',
    asideDescription: 'Elige tus temas y te mostramos profes que dan clases en vivo.',
    title: '¿Qué quieres aprender?',
    subtitle: 'Elige uno o varios temas. Podrás cambiarlos cuando quieras.'
  }
];

/** El último paso cambia según el objetivo: aprender (estudiante) o enseñar (profe) */
const TEACHER_INTERESTS: Partial<StepCopy> = {
  asideHeading: 'Comparte lo que sabes',
  asideDescription: 'Elige los temas que enseñas y te conectamos con estudiantes que quieren aprender en vivo.',
  title: '¿Qué quieres enseñar?'
};

const DEFAULT_TIMEZONE = 'America/Caracas';

/**
 * Registro en 4 pasos (diseño de Figma): datos personales -> contraseña -> objetivo -> intereses.
 * La cuenta se crea al final en una sola petición. El layout es AuthShell (parte 1 + parte 2).
 */
@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonDirective,
    InputText,
    InputNumber,
    Password,
    Select,
    Message,
    AuthShell,
    StepProgress,
    PasswordStrength,
    ChoiceCard,
    TopicPicker,
    FieldError
  ],
  templateUrl: './register.html'
})
export class Register implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');
  private readonly stepContainer = viewChild<ElementRef<HTMLElement>>('stepContainer');

  /** ?rol=estudiante | ?rol=profe (desde el home): deja preseleccionado el objetivo */
  readonly rol = input<string>();

  protected readonly countries = COUNTRIES;
  protected readonly totalSteps = STEPS.length;
  protected readonly timezone = this.isBrowser ? Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE : DEFAULT_TIMEZONE;

  // ---- Pasos ----
  protected readonly stepIndex = signal(0);
  protected readonly role = signal<UserRole | null>(null);
  protected readonly step = computed<StepCopy>(() => {
    const step = STEPS[this.stepIndex()];
    return step.id === 'interests' && this.role() === 'teacher' ? { ...step, ...TEACHER_INTERESTS } : step;
  });

  // ---- Formularios ----
  protected readonly personalForm = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    country_code: this.fb.control<string | null>(null, Validators.required),
    age: this.fb.control<number | null>(null, [Validators.required, Validators.min(10), Validators.max(100)])
  });

  protected readonly passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(PASSWORD_PATTERN)]],
      confirm_password: ['', Validators.required]
    },
    { validators: passwordsMatch('password', 'confirm_password') }
  );

  /** Valor de la contraseña como signal, para el medidor de seguridad */
  protected readonly passwordValue = toSignal(this.passwordForm.controls.password.valueChanges, { initialValue: '' });

  // ---- Objetivo e intereses ----
  protected readonly goalError = signal<string | null>(null);
  protected readonly topics = signal<Topic[]>([]);
  protected readonly topicsError = signal<string | null>(null);
  protected readonly selectedTopics = signal<number[]>([]);
  protected readonly interestsError = signal<string | null>(null);

  // ---- Envío ----
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  ngOnInit(): void {
    const preset = this.rol() === 'profe' ? 'teacher' : this.rol() === 'estudiante' ? 'student' : null;
    if (preset) this.role.set(preset);

    // El catálogo solo se pide en el navegador (esta página se prerenderiza)
    if (this.isBrowser) void this.loadTopics();
  }

  // ---------------- Navegación ----------------

  protected back(): void {
    if (this.stepIndex() > 0) this.goTo(this.stepIndex() - 1);
  }

  protected next(): void {
    if (!this.validateStep(this.step().id)) return;
    if (this.stepIndex() === STEPS.length - 1) {
      void this.submit();
      return;
    }
    this.goTo(this.stepIndex() + 1);
  }

  protected selectRole(role: string | null): void {
    this.role.set(role as UserRole | null);
    this.goalError.set(null);
  }

  protected selectTopics(ids: number[]): void {
    this.selectedTopics.set(ids);
    if (ids.length) this.interestsError.set(null);
  }

  private validateStep(step: StepId): boolean {
    let valid = true;
    if (step === 'personal') valid = validateGroup(this.personalForm);
    if (step === 'password') valid = validateGroup(this.passwordForm);
    if (step === 'goal') {
      valid = this.role() !== null;
      this.goalError.set(valid ? null : 'Elige si quieres aprender o enseñar.');
    }
    if (step === 'interests') {
      valid = this.selectedTopics().length > 0;
      this.interestsError.set(valid ? null : 'Elige al menos un tema.');
    }

    if (!valid) focusFirstInvalid(this.stepContainer()?.nativeElement);
    return valid;
  }

  /** Cambia de paso y lleva el foco al título del paso (lectores de pantalla y teclado) */
  private goTo(index: number): void {
    this.serverError.set(null);
    this.stepIndex.set(index);
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  // ---------------- Datos ----------------

  private async loadTopics(): Promise<void> {
    this.topicsError.set(null);
    try {
      this.topics.set(await this.auth.getTopics());
    } catch (err) {
      this.topicsError.set(apiErrorMessage(err));
    }
  }

  protected retryTopics(): void {
    void this.loadTopics();
  }

  private buildPayload(): RegisterPayload {
    const personal = this.personalForm.getRawValue();
    return {
      role: this.role()!,
      first_name: personal.first_name.trim(),
      last_name: personal.last_name.trim(),
      email: personal.email.trim(),
      password: this.passwordForm.controls.password.value,
      country_code: personal.country_code!,
      age: personal.age!,
      topic_ids: this.selectedTopics(),
      timezone: this.timezone
    };
  }

  private async submit(): Promise<void> {
    this.submitting.set(true);
    this.serverError.set(null);
    try {
      await this.auth.register(this.buildPayload());
      await this.router.navigateByUrl('/app');
    } catch (err) {
      this.handleRegisterError(err);
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Vuelve al paso donde está el primer error del API y lo pinta en su campo.
   * Los errores se aplican DESPUÉS de mostrar el paso: al montarse, el formulario se revalida
   * y borraría un error puesto antes.
   */
  private handleRegisterError(err: unknown): void {
    const fields = apiFieldErrors(err);
    const keys = Object.keys(fields);
    const personalKeys = ['first_name', 'last_name', 'email', 'country_code', 'age'];
    const target: StepId | null = keys.some((key) => personalKeys.includes(key))
      ? 'personal'
      : keys.includes('password')
        ? 'password'
        : keys.includes('role')
          ? 'goal'
          : keys.includes('topic_ids')
            ? 'interests'
            : null;

    if (target && target !== this.step().id) this.goTo(STEPS.findIndex((step) => step.id === target));
    this.serverError.set(apiErrorMessage(err));
    if (fields['role']) this.goalError.set(fields['role']);
    if (fields['topic_ids']) this.interestsError.set(fields['topic_ids']);

    afterNextRender(
      () => {
        const personal = this.personalForm.controls;
        applyServerErrors(fields, {
          first_name: personal.first_name,
          last_name: personal.last_name,
          email: personal.email,
          country_code: personal.country_code,
          age: personal.age,
          password: this.passwordForm.controls.password
        });
        // El error queda en el control (no es un signal): hay que avisar a la vista (zoneless)
        this.cdr.markForCheck();
        focusFirstInvalid(this.stepContainer()?.nativeElement);
      },
      { injector: this.injector }
    );
  }
}
