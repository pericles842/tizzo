import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Logo provisional: "tizzo" + punto rojo de "en vivo" (el logo oficial está por definir) */
@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a
      routerLink="/"
      class="tz-focus inline-flex items-center gap-1.5 rounded-lg font-display text-2xl font-semibold tracking-tight text-tz-title"
      aria-label="Tizzo, ir al inicio"
    >
      tizzo
      <span class="mt-1 size-2 rounded-full bg-tz-live" aria-hidden="true"></span>
    </a>
  `
})
export class Logo {}
