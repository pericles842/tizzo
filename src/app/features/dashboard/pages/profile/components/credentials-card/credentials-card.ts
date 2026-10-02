import { Component, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { apiErrorMessage, apiFieldErrors } from '../../../../../../core/http/api-error';
import { FieldError } from '../../../../../../shared/form/field-error';
import { FilePicker } from '../../../../../../shared/file-picker/file-picker';
import { DOCUMENT_TYPES, applyServerErrors, checkFile, focusFirstInvalid, notFutureDate, validateGroup } from '../../../../../../shared/form/form-utils';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';
import { CredentialStatus, TeacherCredential } from '../../profile.models';
import { TeacherProfileService } from '../../teacher-profile.service';

const MAX_CREDENTIALS = 10;

const STATUS: Record<CredentialStatus, { label: string; severity: 'secondary' | 'danger' | null; icon: string }> = {
  pending: { label: 'En revisión', severity: 'secondary', icon: 'pi pi-clock' },
  verified: { label: 'Verificada', severity: null, icon: 'pi pi-verified' },
  rejected: { label: 'Rechazada', severity: 'danger', icon: 'pi pi-times-circle' }
};

/**
 * Títulos y certificados del profe (opcionales). El archivo es privado: solo lo ve su dueño y, más adelante,
 * un admin que lo revisa. Las credenciales verificadas no se pueden quitar.
 */
@Component({
  selector: 'app-credentials-card',
  imports: [ReactiveFormsModule, ButtonDirective, InputText, Message, Tag, ConfirmDialog, FieldError, FilePicker, WidgetCard],
  providers: [ConfirmationService],
  template: `
    <app-widget-card heading="Credenciales">
      <p class="-mt-2 mb-4 text-sm">
        Opcional. Si agregas una credencial, todos sus datos son obligatorios: título, institución, fecha, número de registro y la foto o PDF del
        documento. Solo los verá el equipo de Tizzo.
      </p>

      @if (listError(); as message) {
        <p-message severity="error" styleClass="mb-4" role="alert">{{ message }}</p-message>
      }

      @if (credentials().length) {
        <ul class="space-y-3" aria-label="Tus credenciales">
          @for (credential of credentials(); track credential.uuid) {
            <li class="rounded-2xl border border-tz-line p-4">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-semibold text-tz-title">{{ credential.title }}</p>
                  <p class="text-sm">
                    {{ credential.institution }}
                    @if (credential.issued_at) { · {{ formatDate(credential.issued_at) }} }
                    @if (credential.credential_number) { · N.º {{ credential.credential_number }} }
                  </p>
                </div>
                <p-tag
                  [value]="status(credential).label"
                  [icon]="status(credential).icon"
                  [severity]="status(credential).severity"
                  [rounded]="true"
                  class="shrink-0"
                />
              </div>
              <div class="mt-2 flex flex-wrap gap-1">
                <a
                  pButton
                  [href]="fileUrl(credential)"
                  target="_blank"
                  rel="noopener"
                  label="Ver archivo"
                  icon="pi pi-eye"
                  size="small"
                  severity="secondary"
                  [text]="true"
                  class="-ml-3"
                ></a>
                @if (credential.status !== 'verified') {
                  <button
                    pButton
                    type="button"
                    label="Quitar"
                    icon="pi pi-trash"
                    size="small"
                    severity="secondary"
                    [text]="true"
                    [disabled]="removing() === credential.uuid"
                    [attr.aria-label]="'Quitar ' + credential.title"
                    (click)="confirmRemove(credential)"
                  ></button>
                }
              </div>
            </li>
          }
        </ul>
      } @else if (!adding()) {
        <p class="rounded-xl bg-tz-soft p-4 text-sm">Todavía no has agregado credenciales.</p>
      }

      @if (adding()) {
        <form
          #formEl
          class="mt-4 space-y-4 rounded-2xl border border-dashed border-tz-line p-5"
          [formGroup]="form"
          (ngSubmit)="add()"
          novalidate
          aria-label="Agregar credencial"
        >
          <h3 class="text-base font-semibold">Agregar credencial</h3>

          @if (formError(); as message) {
            <p-message severity="error" role="alert">{{ message }}</p-message>
          }

          <div>
            <label for="cred-title" class="tz-label">Título</label>
            <input pInputText id="cred-title" formControlName="title" placeholder="Ej.: Licenciado en Educación" class="w-full" aria-describedby="cred-title-error" />
            <app-field-error errorId="cred-title-error" [control]="form.controls.title" />
          </div>
          <div>
            <label for="cred-institution" class="tz-label">Institución que lo avala</label>
            <input
              pInputText
              id="cred-institution"
              formControlName="institution"
              placeholder="Ej.: Universidad Central de Venezuela"
              class="w-full"
              aria-describedby="cred-institution-error"
            />
            <app-field-error errorId="cred-institution-error" [control]="form.controls.institution" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="cred-date" class="tz-label">Fecha de emisión</label>
              <input pInputText id="cred-date" type="date" formControlName="issued_at" [max]="today" class="w-full" aria-describedby="cred-date-error" />
              <app-field-error errorId="cred-date-error" [control]="form.controls.issued_at" />
            </div>
            <div>
              <label for="cred-number" class="tz-label">N.º de registro</label>
              <input pInputText id="cred-number" formControlName="credential_number" class="w-full" aria-describedby="cred-number-error" />
              <app-field-error errorId="cred-number-error" [control]="form.controls.credential_number" />
            </div>
          </div>
          <div>
            <span class="tz-label">Foto o PDF del documento (máx. 10 MB)</span>
            <app-file-picker
              [label]="file() ? 'Cambiar archivo' : 'Elegir archivo'"
              icon="pi pi-paperclip"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
              class="-ml-3"
              (picked)="pickFile($event)"
            />
            @if (file(); as chosen) {
              <p class="tz-hint mt-0">{{ chosen.name }} · {{ formatSize(chosen.size) }}</p>
            }
            @if (fileError(); as message) {
              <p class="mt-1 text-sm text-red-600 dark:text-red-300" role="alert">{{ message }}</p>
            }
          </div>

          <div class="flex flex-wrap gap-2">
            <button pButton type="submit" label="Guardar credencial" icon="pi pi-check" [loading]="saving()" [disabled]="saving()"></button>
            <button pButton type="button" label="Cancelar" severity="secondary" [outlined]="true" [disabled]="saving()" (click)="cancel()"></button>
          </div>
        </form>
      } @else {
        <button
          pButton
          type="button"
          label="Agregar credencial"
          icon="pi pi-plus"
          severity="warn"
          class="mt-4"
          [disabled]="!canAdd()"
          (click)="adding.set(true)"
        ></button>
        @if (!canAdd()) {
          <p class="tz-hint">Llegaste al máximo de {{ max }} credenciales.</p>
        }
      }
    </app-widget-card>

    <p-confirmdialog acceptButtonStyleClass="p-button-danger" rejectButtonStyleClass="p-button-text p-button-secondary" />
  `,
  host: { class: 'block' }
})
export class CredentialsCard {
  private readonly service = inject(TeacherProfileService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly formEl = viewChild<ElementRef<HTMLElement>>('formEl');

  readonly credentials = input.required<TeacherCredential[]>();
  /** Lista actualizada tras agregar o quitar */
  readonly changed = output<TeacherCredential[]>();

  protected readonly max = MAX_CREDENTIALS;
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly removing = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly listError = signal<string | null>(null);
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly canAdd = computed(() => this.credentials().length < MAX_CREDENTIALS);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    institution: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    issued_at: ['', [Validators.required, notFutureDate]],
    credential_number: ['', [Validators.required, Validators.maxLength(80)]]
  });

  protected status(credential: TeacherCredential) {
    return STATUS[credential.status];
  }

  protected fileUrl(credential: TeacherCredential): string {
    return this.service.credentialFileUrl(credential.uuid);
  }

  /** '2015-07-20' -> '20 jul 2015' (sin pasar por zona horaria) */
  protected formatDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day)).replace('.', '');
  }

  protected formatSize(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  protected pickFile(file: File): void {
    const error = checkFile(file, DOCUMENT_TYPES, 'PDF, JPG, PNG, WEBP o GIF');
    this.fileError.set(error);
    this.file.set(error ? null : file);
  }

  protected cancel(): void {
    this.adding.set(false);
    this.form.reset();
    this.file.set(null);
    this.fileError.set(null);
    this.formError.set(null);
  }

  protected async add(): Promise<void> {
    this.formError.set(null);
    const file = this.file();
    if (!file) this.fileError.set('Adjunta la foto o el PDF del documento.');
    if (!validateGroup(this.form) || !file) {
      focusFirstInvalid(this.formEl()?.nativeElement);
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    try {
      const created = await this.service.addCredential({
        title: value.title.trim(),
        institution: value.institution.trim(),
        issued_at: value.issued_at,
        credential_number: value.credential_number.trim(),
        file
      });
      this.changed.emit([created, ...this.credentials()]);
      this.cancel();
    } catch (err) {
      const controls = this.form.controls;
      const fields = apiFieldErrors(err);
      applyServerErrors(fields, { title: controls.title, institution: controls.institution, issued_at: controls.issued_at, credential_number: controls.credential_number });
      if (fields['file']) this.fileError.set(fields['file']);
      this.formError.set(apiErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  protected confirmRemove(credential: TeacherCredential): void {
    this.confirmation.confirm({
      header: 'Quitar credencial',
      message: `¿Quitar "${credential.title}"? También se borrará el archivo que subiste.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      accept: () => void this.remove(credential)
    });
  }

  private async remove(credential: TeacherCredential): Promise<void> {
    this.listError.set(null);
    this.removing.set(credential.uuid);
    try {
      await this.service.deleteCredential(credential.uuid);
      this.changed.emit(this.credentials().filter((item) => item.uuid !== credential.uuid));
    } catch (err) {
      this.listError.set(apiErrorMessage(err));
    } finally {
      this.removing.set(null);
    }
  }
}
