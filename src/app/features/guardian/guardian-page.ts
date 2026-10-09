import { Component, OnInit, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { apiErrorMessage } from '../../core/http/api-error';
import { ToastService } from '../../core/notify/toast.service';
import { GuardianConsentInfo, GuardianService } from './guardian-service';

/**
 * /representante/:token — el representante de un menor abre el enlace del correo, lee lo que acepta (estar con el menor
 * en todas sus clases en vivo) y confirma. No necesita cuenta.
 */
@Component({
  selector: 'app-guardian-page',
  imports: [FormsModule, ButtonDirective, Card, Checkbox, Message, Skeleton],
  template: `
    <section class="tz-container max-w-2xl py-10">
      @if (error(); as message) {
        <p-message severity="error" role="alert">{{ message }}</p-message>
      } @else if (info(); as current) {
        <p-card class="border border-tz-surface-border">
          <span class="flex size-12 items-center justify-center rounded-xl bg-tz-soft text-tz-subtitle" aria-hidden="true"><i class="pi pi-shield text-xl"></i></span>
          <h1 class="mt-4 font-display text-2xl font-semibold text-tz-title">Autorización del representante</h1>

          @if (done() || current.confirmed) {
            <p class="mt-3 text-base text-tz-title">¡Gracias! Confirmaste la cuenta de <strong>{{ current.student_name }}</strong>.</p>
            <p class="mt-2 text-sm">Ya puede reservar clases en Tizzo. Recuerda acompañarle en todas sus clases en vivo.</p>
          } @else if (current.expired) {
            <p class="mt-3 text-sm">Este enlace venció. Pide a <strong>{{ current.student_name }}</strong> que te envíe uno nuevo desde su perfil en Tizzo.</p>
          } @else {
            <p class="mt-3 text-sm"><strong class="text-tz-title">{{ current.student_name }}</strong> es menor de edad y creó una cuenta en Tizzo, una plataforma de clases en vivo por videollamada. Para que pueda tomar clases necesitamos que confirmes lo siguiente:</p>
            <ul class="mt-4 space-y-2">
              @for (statement of current.statements; track $index) {
                <li class="flex items-start gap-2.5 rounded-xl bg-tz-soft px-3 py-2.5 text-sm text-tz-title">
                  <i class="pi pi-check-circle mt-0.5 shrink-0 text-tz-subtitle" aria-hidden="true"></i>
                  <span>{{ statement }}</span>
                </li>
              }
            </ul>
            <div class="mt-5 flex min-h-11 items-start gap-3">
              <p-checkbox inputId="accept" [binary]="true" [ngModel]="accepted()" (ngModelChange)="accepted.set($event)" />
              <label for="accept" class="text-sm text-tz-title">Leí y acepto todo lo anterior.</label>
            </div>
            <button pButton type="button" label="Confirmar" icon="pi pi-check" class="mt-4" [fluid]="true" [disabled]="!accepted() || saving()" [loading]="saving()" (click)="confirm()"></button>
            <p class="mt-4 text-xs">Si no conoces a esta persona, cierra esta página: sin tu confirmación no podrá tomar clases.</p>
          }
        </p-card>
      } @else {
        <p-skeleton height="24rem" borderRadius="1.25rem" />
      }
    </section>
  `
})
export class GuardianPage implements OnInit {
  private readonly service = inject(GuardianService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Viene de la ruta */
  readonly token = input.required<string>();

  protected readonly info = signal<GuardianConsentInfo | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly accepted = signal(false);
  protected readonly saving = signal(false);
  protected readonly done = signal(false);

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.service
      .info(this.token())
      .then((info) => this.info.set(info))
      .catch((err) => this.error.set(apiErrorMessage(err)));
  }

  protected async confirm(): Promise<void> {
    this.saving.set(true);
    try {
      await this.service.confirm(this.token());
      this.done.set(true);
      this.toast.success('Autorización confirmada.');
    } catch (err) {
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
