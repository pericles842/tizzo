import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Drawer } from 'primeng/drawer';
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardHeader } from './dashboard-header/dashboard-header';
import { DashboardSidebar } from './dashboard-sidebar/dashboard-sidebar';

/**
 * Layout del dashboard (área privada /app): menú lateral + header propio + contenido.
 * En escritorio el menú queda fijo a la izquierda; en móvil se abre en un p-drawer.
 * El título del header sale de `data.pageTitle` de la ruta activa.
 */
@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterOutlet, Drawer, DashboardHeader, DashboardSidebar],
  templateUrl: './dashboard-layout.html',
  host: { class: 'block min-h-dvh bg-tz-canvas' }
})
export class DashboardLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly menuOpen = signal(false);
  protected readonly pageTitle = signal(this.readTitle());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.pageTitle.set(this.readTitle()));
  }

  protected async logout(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }

  /** `data.pageTitle` de la ruta hija más profunda */
  private readTitle(): string {
    let current = this.route.snapshot;
    while (current.firstChild) current = current.firstChild;
    return (current.data['pageTitle'] as string | undefined) ?? 'Inicio';
  }
}
