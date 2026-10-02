import { Component } from '@angular/core';

/** Contenido inicial del área privada. Por ahora solo marca dónde irá el dashboard. */
@Component({
  selector: 'app-app-home',
  template: `
    <section class="tz-card flex min-h-64 items-center justify-center p-8">
      <h1 class="text-3xl font-semibold">layout</h1>
    </section>
  `
})
export class AppHome {}
