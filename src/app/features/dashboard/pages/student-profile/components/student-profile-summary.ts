import { Component, computed, inject } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { AuthService } from '../../../../../core/auth/auth.service';
import { WidgetCard } from '../../../widgets/widget-card/widget-card';
import { studentCompletion } from '../student-profile.utils';

/** Estado de la cuenta del estudiante y checklist de qué falta por completar (sigue la sesión: la foto lo actualiza al instante) */
@Component({
  selector: 'app-student-profile-summary',
  imports: [Tag, ProgressBar, WidgetCard],
  template: `
    <app-widget-card heading="Estado del perfil">
      @if (suspended()) {
        <p-tag value="Suspendida" icon="pi pi-ban" severity="danger" [rounded]="true" />
        <p class="mt-3 text-sm">Tu cuenta está suspendida. Escríbenos para ayudarte.</p>
      } @else {
        <p-tag value="Cuenta activa" icon="pi pi-check-circle" [rounded]="true" />
        <p class="mt-3 text-sm">Mientras más completo esté tu perfil, mejor podremos recomendarte clases y profes.</p>
      }

      <div class="mt-5">
        <div class="flex justify-between text-sm">
          <span id="completitud-estudiante" class="font-semibold text-tz-title">Perfil completo</span>
          <span>{{ completion().percent }}%</span>
        </div>
        <p-progressbar [value]="completion().percent" [showValue]="false" aria-labelledby="completitud-estudiante" class="mt-2 block h-1.5" />
      </div>

      <ul class="mt-4 space-y-2" aria-label="Qué falta en tu perfil">
        @for (item of completion().items; track item.key) {
          <li class="flex items-center gap-2 text-sm" [class.text-tz-title]="item.done">
            <i class="pi text-sm" [class]="item.done ? 'pi-check-circle text-tz-subtitle' : 'pi-circle'" aria-hidden="true"></i>
            {{ item.label }}
            <span class="sr-only">{{ item.done ? '(listo)' : '(pendiente)' }}</span>
          </li>
        }
      </ul>
    </app-widget-card>
  `,
  host: { class: 'block' }
})
export class StudentProfileSummary {
  private readonly auth = inject(AuthService);

  protected readonly completion = computed(() => studentCompletion(this.auth.user()));
  protected readonly suspended = computed(() => this.auth.user()?.status === 'suspended');
}
