import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/** Avisos pasajeros de la app (éxito o error de una acción): un toast de PrimeNG al centro. Se pinta en `App` con `<p-toast>`. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService);

  success(detail: string): void {
    this.messages.add({ severity: 'success', detail, life: 6000 });
  }

  error(detail: string): void {
    this.messages.add({ severity: 'error', detail, life: 8000 });
  }
}
