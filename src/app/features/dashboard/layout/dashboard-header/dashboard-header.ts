import { Component, computed, inject, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeToggle } from '../../../../shared/theme-toggle/theme-toggle';
import { UserAvatar } from '../../../../shared/user-avatar/user-avatar';
import { NotificationBell } from '../notification-bell/notification-bell';

/**
 * Header del dashboard: título de la sección, tema, notificaciones y menú del usuario.
 * A diferencia del header del sitio, no tiene la navegación del centro.
 */
@Component({
  selector: 'app-dashboard-header',
  imports: [ButtonDirective, Menu, ThemeToggle, UserAvatar, NotificationBell],
  template: `
    <header class="sticky top-0 z-30 border-b border-tz-line bg-tz-header backdrop-blur-md">
      <div class="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          pButton
          type="button"
          icon="pi pi-bars"
          severity="secondary"
          [text]="true"
          [rounded]="true"
          class="lg:hidden"
          aria-label="Abrir menú del panel"
          (click)="openMenu.emit()"
        ></button>

        <h1 class="min-w-0 flex-1 truncate text-xl font-semibold sm:text-2xl">{{ title() }}</h1>

        <app-theme-toggle />

        <app-notification-bell />

        @if (auth.user(); as user) {
          <button
            type="button"
            class="tz-focus flex items-center gap-2.5 rounded-full border border-tz-line bg-tz-surface py-1 pl-1 pr-3 hover:bg-tz-soft"
            aria-haspopup="menu"
            aria-controls="menu-usuario"
            (click)="userMenu.toggle($event)"
          >
            <app-user-avatar [user]="user" />
            <span class="hidden text-left leading-tight sm:block">
              <span class="block text-sm font-semibold text-tz-title">{{ user.first_name }} {{ user.last_name }}</span>
              <span class="block text-xs">{{ roleLabel() }}</span>
            </span>
            <i class="pi pi-chevron-down text-xs" aria-hidden="true"></i>
            <span class="sr-only">Menú de usuario</span>
          </button>
          <p-menu #userMenu id="menu-usuario" [model]="menuItems()" [popup]="true" appendTo="body" />
        }
      </div>
    </header>
  `
})
export class DashboardHeader {
  protected readonly auth = inject(AuthService);

  /** Título de la sección actual (lo pone el layout según la ruta) */
  readonly title = input.required<string>();
  readonly openMenu = output<void>();
  readonly logout = output<void>();

  protected readonly roleLabel = computed(() => (this.auth.user()?.role === 'teacher' ? 'Profe' : 'Estudiante'));

  protected readonly menuItems = computed<MenuItem[]>(() => [
    { label: 'Mi perfil', icon: 'pi pi-id-card', routerLink: '/app/perfil' },
    { label: 'Ir al sitio', icon: 'pi pi-external-link', routerLink: '/' },
    { separator: true },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout.emit() }
  ]);
}
