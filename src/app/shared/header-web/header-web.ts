import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { AuthService } from '../../core/auth/auth.service';
import { Logo } from '../logo/logo';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { UserAvatar } from '../user-avatar/user-avatar';

interface NavLink {
  label: string;
  route: string;
  fragment?: string;
  queryParams?: Record<string, string>;
}

/**
 * Header del sitio: logo, navegación, selector de tema y acceso (Entrar / Crear cuenta).
 * Con sesión muestra el avatar y "Salir". En pantallas chicas la navegación va en un p-drawer.
 */
@Component({
  selector: 'app-header-web',
  imports: [RouterLink, ButtonDirective, Drawer, Logo, ThemeToggle, UserAvatar],
  templateUrl: './header-web.html'
})
export class HeaderWeb {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  protected readonly loggingOut = signal(false);

  /** Las secciones viven en el home; desde otras páginas el enlace lleva al home y baja a la sección */
  protected readonly links: NavLink[] = [
    { label: 'Buscar profes', route: '/', fragment: 'explorar' },
    { label: 'Clases', route: '/clases' },
    { label: 'Cómo funciona', route: '/', fragment: 'como-funciona' },
    { label: 'Soy profe', route: '/registro', queryParams: { rol: 'profe' } }
  ];

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected async logout(): Promise<void> {
    this.loggingOut.set(true);
    this.closeMenu();
    try {
      await this.auth.logout();
    } finally {
      this.loggingOut.set(false);
      await this.router.navigateByUrl('/');
    }
  }
}
