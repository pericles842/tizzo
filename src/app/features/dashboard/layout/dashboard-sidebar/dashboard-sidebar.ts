import { Component, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Badge } from 'primeng/badge';
import { ButtonDirective } from 'primeng/button';
import { AuthService } from '../../../../core/auth/auth.service';
import { Logo } from '../../../../shared/logo/logo';
import { navForRole } from '../dashboard-nav';

/** Menú lateral del dashboard: logo, opciones según el rol y "Cerrar sesión" */
@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink, RouterLinkActive, Badge, ButtonDirective, Logo],
  template: `
    <div class="flex h-full flex-col px-4 py-6">
      <div class="px-3">
        <app-logo />
      </div>

      <nav aria-label="Menú del panel" class="mt-8 flex-1">
        <ul class="space-y-1">
          @for (item of items(); track item.route) {
            <li>
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-tz-soft font-semibold text-tz-title"
                [routerLinkActiveOptions]="{ exact: item.route === '/app' }"
                #rla="routerLinkActive"
                [attr.aria-current]="rla.isActive ? 'page' : null"
                class="tz-focus flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-tz-soft hover:text-tz-title"
                (click)="navigate.emit()"
              >
                <i [class]="item.icon" class="text-base" aria-hidden="true"></i>
                <span class="flex-1">{{ item.label }}</span>
                @if (item.badge) {
                  <p-badge [value]="item.badge" [attr.aria-label]="item.badge + ' pendientes'" />
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <button
        pButton
        type="button"
        label="Cerrar sesión"
        icon="pi pi-sign-out"
        severity="secondary"
        size="small"
        [text]="true"
        class="justify-start self-start"
        (click)="logout.emit()"
      ></button>
    </div>
  `,
  host: { class: 'block h-full' }
})
export class DashboardSidebar {
  private readonly auth = inject(AuthService);

  /** Se eligió una opción (el layout cierra el menú en móvil) */
  readonly navigate = output<void>();
  readonly logout = output<void>();

  protected readonly items = computed(() => navForRole(this.auth.user()?.role));
}
