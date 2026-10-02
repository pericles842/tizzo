import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderWeb } from '../../shared/header-web/header-web';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Layout del área privada (después de entrar). Por ahora: header, aviso de revisión para
 * profes pendientes y el contenido. Aquí se agregará el menú lateral cuando exista el dashboard.
 */
@Component({
  selector: 'app-app-layout',
  imports: [RouterOutlet, HeaderWeb],
  templateUrl: './app-layout.html',
  host: { class: 'flex min-h-dvh flex-col' }
})
export class AppLayout {
  protected readonly auth = inject(AuthService);
}
