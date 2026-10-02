import { Component } from '@angular/core';
import { Logo } from '../logo/logo';

/** Pie de página del sitio */
@Component({
  selector: 'app-footer-web',
  imports: [Logo],
  template: `
    <footer class="border-t border-tz-line bg-tz-footer">
      <div class="tz-container flex flex-col items-center gap-3 py-7 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
        <app-logo />
        <p>Clases en vivo para Venezuela y Latinoamérica.</p>
        <p>© {{ year }} Tizzo</p>
      </div>
    </footer>
  `
})
export class FooterWeb {
  protected readonly year = new Date().getFullYear();
}
