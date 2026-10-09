import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';

/** Pie de página del sitio */
@Component({
  selector: 'app-footer-web',
  imports: [RouterLink, Logo],
  template: `
    <footer class="border-t border-tz-line bg-tz-footer">
      <div class="tz-container flex flex-col items-center gap-3 py-7 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
        <app-logo />
        <p>Clases en vivo para Venezuela y Latinoamérica.</p>
        <nav aria-label="Legal"><a routerLink="/terminos" class="font-medium text-tz-subtitle underline-offset-2 hover:underline">Términos y condiciones</a></nav>
        <p>© {{ year }} Tizzo</p>
      </div>
    </footer>
  `
})
export class FooterWeb {
  protected readonly year = new Date().getFullYear();
}
