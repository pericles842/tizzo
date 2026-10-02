import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';
import { AuthService } from '../../core/auth/auth.service';
import { OTHER_SPECIALTY_SLUG, RegisterPayload, Specialty, UserRole } from '../../core/auth/auth.models';
import { COUNTRIES } from '../../core/catalog/countries';
import { apiErrorMessage, apiFieldErrors } from '../../core/http/api-error';
import { FieldError } from '../../shared/form/field-error';
import {
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  PASSWORD_PATTERN,
  PHONE_PATTERN,
  applyServerErrors,
  checkFile,
  focusFirstInvalid,
  passwordsMatch,
  validateGroup
} from '../../shared/form/form-utils';

type StepId = 'role' | 'account' | 'profile' | 'credentials' | 'review';

interface Step {
  id: StepId;
  label: string;
}

/** Credencial agregada en el asistente; se sube después de crear la cuenta */
interface PendingCredential {
  id: number;
  title: string;
  institution: string;
  issued_at: string | null;
  credential_number: string | null;
  file: File;
}

const STUDENT_STEPS: Step[] = [
  { id: 'role', label: 'Tipo de cuenta' },
  { id: 'account', label: 'Tus datos' }
];

const TEACHER_STEPS: Step[] = [
  ...STUDENT_STEPS,
  { id: 'profile', label: 'Perfil profesional' },
  { id: 'credentials', label: 'Credenciales' },
  { id: 'review', label: 'Confirmar' }
];

const MAX_CREDENTIALS = 10;
const DEFAULT_TIMEZONE = 'America/Caracas';

/**
 * Registro paso a paso. El primer paso define si la cuenta es de estudiante o de profesor.
 * - Estudiante: tipo de cuenta -> datos personales.
 * - Profesor: ... -> perfil profesional -> credenciales (opcional) -> confirmar.
 * La cuenta se crea al final en una sola petición; la foto y las credenciales se suben después con la sesión ya abierta.
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, InputText, Password, Select, InputNumber, Textarea, Message, FieldError],
  templateUrl: './register.html'
})
export class Register implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');
  private readonly stepContainer = viewChild<ElementRef<HTMLElement>>('stepContainer');

  /** ?rol=estudiante | ?rol=profe (desde los botones del home) */
  readonly rol = input<string>();

  protected readonly countries = COUNTRIES;
  protected readonly maxCredentials = MAX_CREDENTIALS;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly timezone = this.isBrowser ? Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE : DEFAULT_TIMEZONE;

  // ---- Pasos ----
  protected readonly role = signal<UserRole | null>(null);
  protected readonly steps = computed(() => (this.role() === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS));
  protected readonly stepIndex = signal(0);
  protected readonly currentStep = computed(() => this.steps()[this.stepIndex()]);
  protected readonly isLastStep = computed(() => this.stepIndex() === this.steps().length - 1);
  /** id del <form> del paso actual, si tiene; el botón Continuar se asocia a él */
  protected readonly stepFormId = computed(() => {
    const id = this.currentStep().id;
    return id === 'account' ? 'account-form' : id === 'profile' ? 'profile-form' : null;
  });

  // ---- Formularios ----
  protected readonly accountForm = this.fb.group(
    {
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.pattern(PHONE_PATTERN)]],
      country_code: this.fb.control<string | null>(null),
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(PASSWORD_PATTERN)]],
      confirm_password: ['', Validators.required]
    },
    { validators: passwordsMatch('password', 'confirm_password') }
  );

  protected readonly teacherForm = this.fb.group({
    headline: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]],
    specialty_id: this.fb.control<number | null>(null, Validators.required),
    specialty: [''],
    years_experience: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(70)]),
    bio: ['', [Validators.required, Validators.minLength(30), Validators.maxLength(3000)]]
  });

  protected readonly credentialForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    institution: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    issued_at: [''],
    credential_number: ['', Validators.maxLength(80)]
  });

  // ---- Archivos ----
  protected readonly avatarFile = signal<File | null>(null);
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);
  protected readonly credentialFile = signal<File | null>(null);
  protected readonly credentialFileError = signal<string | null>(null);
  protected readonly credentials = signal<PendingCredential[]>([]);
  private credentialSeq = 0;

  // ---- Catálogo de especialidades ----
  protected readonly specialties = signal<Specialty[]>([]);
  protected readonly specialtiesError = signal<string | null>(null);
  protected readonly isOtherSpecialty = signal(false);

  // ---- Envío ----
  protected readonly submitting = signal(false);

  /** Texto e icono del botón principal según el paso */
  protected readonly nextLabel = computed(() => {
    if (this.submitting()) return 'Creando tu cuenta…';
    if (this.isLastStep()) return 'Crear cuenta';
    if (this.currentStep().id === 'credentials' && !this.credentials().length) return 'Omitir por ahora';
    return 'Continuar';
  });
  protected readonly nextIcon = computed(() => (this.isLastStep() || this.submitting() ? '' : 'pi pi-arrow-right'));
  protected readonly serverError = signal<string | null>(null);
  /** Cuenta creada pero alguna subida falló: se muestra la pantalla final con el detalle */
  protected readonly uploadWarnings = signal<string[] | null>(null);

  constructor() {
    // "Otro" habilita (y exige) el texto libre de la especialidad
    this.teacherForm.controls.specialty_id.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      const isOther = this.specialties().find((s) => s.id === id)?.slug === OTHER_SPECIALTY_SLUG;
      const custom = this.teacherForm.controls.specialty;
      this.isOtherSpecialty.set(isOther);
      custom.setValidators(isOther ? [Validators.required, Validators.minLength(2), Validators.maxLength(120)] : null);
      if (!isOther) custom.setValue('');
      custom.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const preset = this.rol() === 'profe' ? 'teacher' : this.rol() === 'estudiante' ? 'student' : null;
    if (preset) {
      this.role.set(preset);
      this.stepIndex.set(1);
    }

    // El catálogo solo se pide en el navegador (esta página se prerenderiza)
    if (this.isBrowser) void this.loadSpecialties();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  // ---------------- Navegación ----------------

  protected selectRole(role: UserRole): void {
    this.role.set(role);
    this.goTo(1);
  }

  protected back(): void {
    if (this.stepIndex() > 0) this.goTo(this.stepIndex() - 1);
  }

  protected next(): void {
    if (!this.validateStep(this.currentStep().id)) return;
    if (this.isLastStep()) {
      void this.submit();
      return;
    }
    this.goTo(this.stepIndex() + 1);
  }

  private validateStep(step: StepId): boolean {
    let valid = true;
    if (step === 'role') valid = this.role() !== null;
    if (step === 'account') valid = validateGroup(this.accountForm) && !this.avatarError();
    if (step === 'profile') valid = validateGroup(this.teacherForm);

    if (!valid) focusFirstInvalid(this.stepContainer()?.nativeElement);
    return valid;
  }

  /** Cambia de paso y lleva el foco al título del paso (lectores de pantalla y teclado) */
  private goTo(index: number): void {
    this.serverError.set(null);
    this.stepIndex.set(index);
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  // ---------------- Foto de perfil ----------------

  protected onAvatarSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;

    const error = checkFile(file, IMAGE_TYPES, 'JPG, PNG, WEBP o GIF');
    this.avatarError.set(error);
    if (error) return;

    this.revokePreview();
    this.avatarFile.set(file);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  protected removeAvatar(): void {
    this.revokePreview();
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    this.avatarError.set(null);
  }

  private revokePreview(): void {
    const url = this.avatarPreview();
    if (url) URL.revokeObjectURL(url);
  }

  // ---------------- Credenciales ----------------

  protected onCredentialFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0] ?? null;
    inputEl.value = '';
    if (!file) return;

    const error = checkFile(file, DOCUMENT_TYPES, 'PDF, JPG, PNG, WEBP o GIF');
    this.credentialFileError.set(error);
    this.credentialFile.set(error ? null : file);
  }

  protected addCredential(container: HTMLElement): void {
    const formOk = validateGroup(this.credentialForm);
    const file = this.credentialFile();
    if (!file) this.credentialFileError.set('Adjunta el archivo del título (PDF o imagen).');
    if (!formOk || !file) {
      focusFirstInvalid(container);
      return;
    }

    const value = this.credentialForm.getRawValue();
    this.credentials.update((list) => [
      ...list,
      {
        id: ++this.credentialSeq,
        title: value.title.trim(),
        institution: value.institution.trim(),
        issued_at: value.issued_at || null,
        credential_number: value.credential_number.trim() || null,
        file
      }
    ]);
    this.credentialForm.reset();
    this.credentialFile.set(null);
    this.credentialFileError.set(null);
  }

  protected removeCredential(id: number): void {
    this.credentials.update((list) => list.filter((item) => item.id !== id));
  }

  protected formatSize(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  /** Especialidad a mostrar en el resumen: la del catálogo o el texto libre de "Otro" */
  protected specialtyName(): string | null {
    const { specialty_id, specialty } = this.teacherForm.getRawValue();
    if (this.isOtherSpecialty()) return specialty.trim() || null;
    return this.specialties().find((item) => item.id === specialty_id)?.name ?? null;
  }

  protected countryName(code: string | null): string | null {
    return this.countries.find((country) => country.code === code)?.name ?? null;
  }

  // ---------------- Envío ----------------

  private async loadSpecialties(): Promise<void> {
    this.specialtiesError.set(null);
    try {
      this.specialties.set(await this.auth.getSpecialties());
    } catch (err) {
      this.specialtiesError.set(apiErrorMessage(err));
    }
  }

  protected retrySpecialties(): void {
    void this.loadSpecialties();
  }

  private buildPayload(): RegisterPayload {
    const account = this.accountForm.getRawValue();
    const payload: RegisterPayload = {
      role: this.role()!,
      first_name: account.first_name.trim(),
      last_name: account.last_name.trim(),
      email: account.email.trim(),
      password: account.password,
      phone: account.phone.trim() || null,
      country_code: account.country_code,
      timezone: this.timezone
    };

    if (this.role() === 'teacher') {
      const teacher = this.teacherForm.getRawValue();
      payload.teacher = {
        headline: teacher.headline.trim(),
        specialty_id: teacher.specialty_id!,
        specialty: this.isOtherSpecialty() ? teacher.specialty.trim() : null,
        years_experience: teacher.years_experience,
        bio: teacher.bio.trim()
      };
    }
    return payload;
  }

  private async submit(): Promise<void> {
    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.auth.register(this.buildPayload());
    } catch (err) {
      this.handleRegisterError(err);
      this.submitting.set(false);
      return;
    }

    // Con la sesión ya abierta se suben los archivos. Si algo falla, la cuenta igual queda creada.
    const warnings: string[] = [];
    const avatar = this.avatarFile();
    if (avatar) {
      try {
        await this.auth.uploadAvatar(avatar);
      } catch (err) {
        warnings.push(`Tu foto de perfil: ${apiErrorMessage(err)}`);
      }
    }
    for (const credential of this.credentials()) {
      try {
        await this.auth.addCredential(credential);
      } catch (err) {
        warnings.push(`La credencial "${credential.title}": ${apiErrorMessage(err)}`);
      }
    }

    this.submitting.set(false);
    if (warnings.length) {
      this.uploadWarnings.set(warnings);
      return;
    }
    await this.router.navigateByUrl('/app');
  }

  /** Pinta los errores del API en sus campos y vuelve al paso donde está el primero */
  private handleRegisterError(err: unknown): void {
    const account = this.accountForm.controls;
    const teacher = this.teacherForm.controls;
    const applied = applyServerErrors(apiFieldErrors(err), {
      first_name: account.first_name,
      last_name: account.last_name,
      email: account.email,
      password: account.password,
      phone: account.phone,
      country_code: account.country_code,
      'teacher.headline': teacher.headline,
      'teacher.specialty_id': teacher.specialty_id,
      'teacher.specialty': teacher.specialty,
      'teacher.years_experience': teacher.years_experience,
      'teacher.bio': teacher.bio
    });

    if (!applied.length) {
      this.serverError.set(apiErrorMessage(err));
      return;
    }

    const target: StepId = applied.some((key) => !key.startsWith('teacher.')) ? 'account' : 'profile';
    this.goTo(this.steps().findIndex((step) => step.id === target));
    this.serverError.set(apiErrorMessage(err));
  }

  protected goToApp(): void {
    void this.router.navigateByUrl('/app');
  }
}
