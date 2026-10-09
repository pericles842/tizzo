import { Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';

export interface ChatMessage {
  id: number;
  name: string;
  text: string;
  at: Date;
  /** Lo escribí yo */
  mine: boolean;
}

/** Largo máximo de un mensaje */
export const MAX_CHAT_LENGTH = 500;

/**
 * Chat de la clase: una sola conversación para todos los de la sala (sin mensajes privados). Los mensajes viajan por la
 * llamada (Daily `sendAppMessage`) y no se guardan: quien entra tarde no ve lo anterior y al terminar la clase se pierden.
 */
@Component({
  selector: 'app-room-chat',
  imports: [FormsModule, ButtonDirective, InputText],
  template: `
    <div class="flex h-full flex-col">
      <ol #list class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" aria-label="Mensajes de la clase" aria-live="polite">
        @for (message of messages(); track message.id) {
          <li class="flex flex-col" [class.items-end]="message.mine">
            <span class="text-xs">{{ message.mine ? 'Tú' : message.name }} · {{ time(message.at) }}</span>
            <span class="mt-0.5 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm" [class]="message.mine ? 'tz-bg-gradient text-white' : 'bg-tz-soft text-tz-title'">{{ message.text }}</span>
          </li>
        } @empty {
          <li class="py-6 text-center text-sm">Todavía no hay mensajes. Escribe el primero: lo ve toda la clase.</li>
        }
      </ol>
      <form class="mt-3 flex gap-2" (ngSubmit)="submit()">
        <input pInputText name="message" class="min-w-0 flex-1" autocomplete="off" placeholder="Escribe un mensaje" aria-label="Mensaje para toda la clase" [maxlength]="max" [ngModel]="draft()" (ngModelChange)="draft.set($event)" />
        <button pButton type="submit" icon="pi pi-send" aria-label="Enviar mensaje" [disabled]="!draft().trim()"></button>
      </form>
      <p class="mt-2 text-xs">Los mensajes los ve toda la clase y no se guardan.</p>
    </div>
  `,
  host: { class: 'block h-full' }
})
export class RoomChat {
  readonly messages = input.required<ChatMessage[]>();
  readonly send = output<string>();

  protected readonly max = MAX_CHAT_LENGTH;
  protected readonly draft = signal('');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');

  constructor() {
    // Siempre se ve lo último
    effect(() => {
      this.messages();
      const element = this.list()?.nativeElement;
      if (element) queueMicrotask(() => (element.scrollTop = element.scrollHeight));
    });
  }

  protected submit(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.send.emit(text);
    this.draft.set('');
  }

  protected time(date: Date): string {
    return date.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
