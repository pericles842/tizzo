import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { OverlayBadge } from 'primeng/overlaybadge';
import { Popover } from 'primeng/popover';
import { AppNotification, NotificationService } from '../../../../core/notifications/notification.service';

/**
 * Campana del header del panel: cuántos avisos faltan por leer y la lista (p-popover). Los nuevos llegan en vivo
 * por WebSocket. Tocar un aviso lo marca como leído y, si tiene enlace (ej. la sala), lleva ahí.
 */
@Component({
  selector: 'app-notification-bell',
  imports: [ButtonDirective, OverlayBadge, Popover],
  template: `
    @if (service.unread() > 0) {
      <p-overlaybadge [value]="badge()" severity="danger" badgeSize="small">
        <button pButton type="button" icon="pi pi-bell" severity="secondary" [outlined]="true" [rounded]="true" class="bg-tz-surface" [attr.aria-label]="'Notificaciones: ' + service.unread() + ' sin leer'" aria-haspopup="dialog" (click)="panel.toggle($event)"></button>
      </p-overlaybadge>
    } @else {
      <button pButton type="button" icon="pi pi-bell" severity="secondary" [outlined]="true" [rounded]="true" class="bg-tz-surface" aria-label="Notificaciones" aria-haspopup="dialog" (click)="panel.toggle($event)"></button>
    }

    <p-popover #panel appendTo="body" [style]="{ width: '22rem', maxWidth: '92vw' }">
      <div class="flex items-center justify-between gap-2 pb-2">
        <p class="font-semibold text-tz-title">Notificaciones</p>
        @if (service.unread() > 0) {
          <button pButton type="button" label="Marcar todo como leído" size="small" severity="secondary" [text]="true" (click)="service.markAllRead()"></button>
        }
      </div>
      <ul class="-mx-2 max-h-96 overflow-y-auto" aria-label="Lista de notificaciones">
        @for (item of service.items(); track item.uuid) {
          <li>
            <button type="button" class="tz-focus flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-tz-soft" (click)="open(item); panel.hide()">
              <span class="mt-1.5 size-2 shrink-0 rounded-full" [class.bg-tz-subtitle]="!item.read" aria-hidden="true"></span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm text-tz-title" [class.font-semibold]="!item.read">{{ item.title }}</span>
                @if (item.body) {
                  <span class="mt-0.5 block text-xs">{{ item.body }}</span>
                }
                <span class="mt-1 block text-[0.6875rem]">{{ ago(item.created_at) }}{{ item.read ? '' : ' · sin leer' }}</span>
              </span>
            </button>
          </li>
        } @empty {
          <li class="px-2 py-6 text-center text-sm">No tienes notificaciones.</li>
        }
      </ul>
    </p-popover>
  `
})
export class NotificationBell implements OnInit {
  protected readonly service = inject(NotificationService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.service.connect();
  }

  protected badge(): string {
    const count = this.service.unread();
    return count > 9 ? '9+' : String(count);
  }

  protected open(item: AppNotification): void {
    void this.service.markRead(item);
    // Solo rutas internas
    if (item.link?.startsWith('/') && !item.link.startsWith('//')) void this.router.navigateByUrl(item.link);
  }

  /** "hace 5 min", "hace 2 h", "3 oct" */
  protected ago(iso: string): string {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
}
