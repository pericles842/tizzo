import { Component, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Tag } from 'primeng/tag';
import { apiErrorMessage } from '../../core/http/api-error';
import { longDate } from './certificate-date';
import { CertificateVerification } from './certificates.models';
import { CertificatesService } from './certificates.service';

/**
 * /verificar y /verificar/:code — página pública a la que lleva el QR del diploma. Muestra a quién se le dio, de qué
 * clase o curso, quién lo dio y si sigue vigente. Nunca entrega el PDF.
 */
@Component({
  selector: 'app-verify-page',
  imports: [FormsModule, ButtonDirective, Card, InputText, Message, Tag],
  template: `
    <section class="tz-container max-w-2xl py-10">
      <p-card class="border border-tz-surface-border">
        <span class="flex size-12 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="pi pi-verified text-xl"></i></span>
        <h1 class="mt-4 font-display text-2xl font-semibold text-tz-title">Verificar un diploma</h1>
        <p class="mt-1 text-sm">Escribe el código que aparece en el diploma (por ejemplo, TZ-8K3F-9QX2) o escanea su código QR.</p>

        <form class="mt-4 flex flex-col gap-3 sm:flex-row" (submit)="$event.preventDefault(); search()">
          <label for="certificate-code" class="sr-only">Código del diploma</label>
          <input pInputText id="certificate-code" name="code" class="w-full uppercase" placeholder="TZ-XXXX-XXXX" autocomplete="off" maxlength="40" [ngModel]="typed()" (ngModelChange)="typed.set($event)" />
          <button pButton type="submit" label="Verificar" icon="pi pi-search" class="shrink-0" [disabled]="!typed().trim() || loading()" [loading]="loading()"></button>
        </form>

        @if (error(); as message) {
          <p-message severity="error" styleClass="mt-4" role="alert">{{ message }}</p-message>
        }

        @if (result(); as certificate) {
          <div class="mt-6 rounded-2xl border border-tz-surface-border bg-tz-soft p-5" role="status">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-display text-lg font-semibold text-tz-title">{{ certificate.valid ? 'Diploma auténtico' : 'Diploma revocado' }}</p>
              <p-tag [severity]="certificate.valid ? null : 'danger'" [value]="certificate.valid ? 'Vigente' : 'Revocado'" />
            </div>
            <dl class="mt-3 space-y-2 text-sm">
              <div><dt class="text-xs">Otorgado a</dt><dd class="font-semibold text-tz-title">{{ certificate.student_name }}</dd></div>
              <div><dt class="text-xs">{{ certificate.kind === 'course' ? 'Curso' : 'Clase' }}</dt><dd class="font-semibold text-tz-title">{{ certificate.title }}</dd></div>
              <div><dt class="text-xs">Profesor/a</dt><dd class="font-semibold text-tz-title">{{ certificate.teacher_name }}</dd></div>
              <div><dt class="text-xs">Fecha de emisión</dt><dd class="font-semibold text-tz-title">{{ date(certificate.issued_at) }}</dd></div>
              <div><dt class="text-xs">Código</dt><dd class="font-semibold text-tz-title">{{ certificate.code }}</dd></div>
              @if (certificate.revoked_at) {
                <div><dt class="text-xs">Revocado el</dt><dd class="font-semibold text-tz-title">{{ date(certificate.revoked_at) }}</dd></div>
              }
            </dl>
          </div>
        }
      </p-card>
    </section>
  `
})
export class VerifyPage implements OnInit {
  private readonly service = inject(CertificatesService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Viene de la ruta (/verificar/:code); sin código solo se muestra el buscador */
  readonly code = input<string>();

  protected readonly typed = signal('');
  protected readonly result = signal<CertificateVerification | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly date = longDate;

  ngOnInit(): void {
    const code = this.code();
    if (!this.isBrowser || !code) return;
    this.typed.set(code);
    void this.check(code);
  }

  protected search(): void {
    const code = this.typed().trim();
    if (!code) return;
    void this.router.navigate(['/verificar', code]);
    void this.check(code);
  }

  private async check(code: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      this.result.set(await this.service.verify(code));
    } catch (err) {
      this.error.set(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
