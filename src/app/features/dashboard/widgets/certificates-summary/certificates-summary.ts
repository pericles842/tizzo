import { Component, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import { ProgressBar } from 'primeng/progressbar';
import { ButtonDirective } from 'primeng/button';
import { CertificateItem } from '../../data/dashboard.models';
import { WidgetCard } from '../widget-card/widget-card';

/** Certificados: obtenidos (con descarga) y en curso (con progreso) */
@Component({
  selector: 'app-certificates-summary',
  imports: [Tag, ProgressBar, ButtonDirective, WidgetCard],
  template: `
    <app-widget-card [heading]="heading()" actionLabel="Ver todos" actionRoute="/app/certificados">
      <ul class="space-y-3">
        @for (certificate of certificates(); track certificate.id) {
          <li class="rounded-2xl border border-tz-line bg-tz-soft p-4">
            @if (certificate.status === 'earned') {
              <p-tag value="Obtenido" [rounded]="true" class="text-[0.6875rem]" />
            } @else {
              <p-tag value="En curso" severity="secondary" [rounded]="true" class="text-[0.6875rem]" />
            }
            <p class="mt-2 text-sm font-semibold text-tz-title">{{ certificate.title }}</p>
            <p class="text-xs">{{ certificate.detail }}</p>

            @if (certificate.status === 'earned') {
              <!-- Solo UI: la descarga real llega con la emisión de diplomas -->
              <button pButton type="button" label="Descargar diploma" icon="pi pi-download" size="small" [text]="true" class="-ml-3 mt-1"></button>
            } @else {
              <p-progressbar
                [value]="certificate.progress ?? 0"
                [showValue]="false"
                [attr.aria-label]="'Progreso de ' + certificate.title"
                class="mt-3 block h-1.5"
              />
            }
          </li>
        }
      </ul>
    </app-widget-card>
  `,
  host: { class: 'block h-full' }
})
export class CertificatesSummary {
  readonly heading = input('Certificados');
  readonly certificates = input.required<CertificateItem[]>();
}
