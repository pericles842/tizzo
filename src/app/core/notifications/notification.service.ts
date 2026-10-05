import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import type { Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/** Aviso de la campana (notificationResponse en tizzo.api) */
export interface AppNotification {
  uuid: string;
  type: string;
  title: string;
  body: string | null;
  /** Ruta interna (ej. /sala/<uuid>) o null */
  link: string | null;
  read: boolean;
  created_at: string;
}

/**
 * Avisos de la campana del panel (recordatorios de clase, inscripciones). Al conectarse trae los últimos por HTTP
 * y luego recibe los nuevos en vivo por WebSocket (Socket.io, con la misma cookie de sesión). Solo en el navegador;
 * se desconecta solo al cerrar sesión. El socket.io-client se carga bajo demanda (no pesa en el bundle inicial).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly api = environment.apiUrl;
  private socket: Socket | null = null;
  private connecting: Promise<void> | null = null;

  readonly items = signal<AppNotification[]>([]);
  readonly unread = signal(0);

  constructor() {
    effect(() => {
      if (!this.auth.isAuthenticated()) this.disconnect();
    });
  }

  /** Trae los avisos y abre el WebSocket (una sola vez) */
  connect(): Promise<void> {
    if (!this.isBrowser || !this.auth.isAuthenticated()) return Promise.resolve();
    this.connecting ??= this.open().catch((err) => {
      this.connecting = null;
      console.error('No se pudieron cargar los avisos', err);
    });
    return this.connecting;
  }

  private async open(): Promise<void> {
    await this.refresh();
    const { io } = await import('socket.io-client');
    // El WebSocket vive en el mismo servidor que el API, en la raíz (no en /api)
    this.socket = io(new URL(this.api).origin, { withCredentials: true, transports: ['websocket', 'polling'] });
    this.socket.on('notification', (notification: AppNotification) => {
      this.items.update((list) => [notification, ...list.filter((item) => item.uuid !== notification.uuid)].slice(0, 30));
      if (!notification.read) this.unread.update((count) => count + 1);
    });
    // Al reconectar (ej. se cayó la red) se vuelven a pedir por si llegó alguno mientras tanto
    this.socket.io.on('reconnect', () => void this.refresh());
  }

  async refresh(): Promise<void> {
    const { items, unread } = await firstValueFrom(this.http.get<{ items: AppNotification[]; unread: number }>(`${this.api}/notifications`));
    this.items.set(items);
    this.unread.set(unread);
  }

  async markRead(notification: AppNotification): Promise<void> {
    if (notification.read) return;
    this.items.update((list) => list.map((item) => (item.uuid === notification.uuid ? { ...item, read: true } : item)));
    this.unread.update((count) => Math.max(0, count - 1));
    await firstValueFrom(this.http.post(`${this.api}/notifications/${notification.uuid}/read`, {})).catch(() => undefined);
  }

  async markAllRead(): Promise<void> {
    this.items.update((list) => list.map((item) => ({ ...item, read: true })));
    this.unread.set(0);
    await firstValueFrom(this.http.post(`${this.api}/notifications/read-all`, {})).catch(() => undefined);
  }

  private disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connecting = null;
    this.items.set([]);
    this.unread.set(0);
  }
}
