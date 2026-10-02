import { Component, input } from '@angular/core';
import { Card } from 'primeng/card';
import { Avatar } from 'primeng/avatar';
import { HowItWorksStep } from '../../home.data';

/** "Cómo funciona": los 3 pasos del flujo del estudiante */
@Component({
  selector: 'app-how-it-works',
  imports: [Card, Avatar],
  template: `
    <section id="como-funciona" class="scroll-mt-20 border-t border-tz-line bg-tz-section-alt py-16" aria-labelledby="como-funciona-titulo">
      <div class="tz-container">
        <h2 id="como-funciona-titulo" class="text-2xl font-semibold sm:text-3xl">Cómo funciona</h2>

        <ol class="mt-8 grid gap-5 md:grid-cols-3">
          @for (step of steps(); track step.title; let i = $index) {
            <li>
              <p-card class="h-full border border-tz-surface-border">
                <p-avatar [label]="'' + (i + 1)" shape="circle" class="tz-bg-gradient font-display text-white" />
                <h3 class="mt-4 text-lg font-semibold">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed">{{ step.text }}</p>
              </p-card>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  host: { class: 'block' }
})
export class HowItWorks {
  readonly steps = input.required<HowItWorksStep[]>();
}
