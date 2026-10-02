import { Component, computed, inject, input } from '@angular/core';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { Tag } from 'primeng/tag';
import { ProgressBar } from 'primeng/progressbar';
import { TeacherApprovalStatus, TeacherProfile } from '../../../../../../core/auth/auth.models';
import { WidgetCard } from '../../../../widgets/widget-card/widget-card';
import { profileCompletion } from '../../profile.utils';

interface StatusCopy {
  label: string;
  severity: 'secondary' | 'danger' | null;
  icon: string;
  text: string;
}

const STATUS: Record<TeacherApprovalStatus, StatusCopy> = {
  pending: {
    label: 'En revisión',
    severity: 'secondary',
    icon: 'pi pi-clock',
    text: 'El equipo de Tizzo revisará tu perfil. Mientras más completo esté, más rápido podremos aprobarlo.'
  },
  approved: { label: 'Aprobado', severity: null, icon: 'pi pi-check-circle', text: 'Tu perfil está aprobado: ya puedes publicar cursos.' },
  rejected: { label: 'Rechazado', severity: 'danger', icon: 'pi pi-times-circle', text: 'Tu perfil no fue aprobado. Corrige lo indicado y vuelve a guardarlo.' },
  suspended: { label: 'Suspendido', severity: 'danger', icon: 'pi pi-ban', text: 'Tu perfil está suspendido. Escríbenos para ayudarte.' }
};

/** Estado de aprobación del perfil y checklist de qué falta por completar */
@Component({
  selector: 'app-profile-summary',
  imports: [Tag, ProgressBar, WidgetCard],
  template: `
    <app-widget-card heading="Estado del perfil">
      <p-tag [value]="status().label" [icon]="status().icon" [severity]="status().severity" [rounded]="true" />
      <p class="mt-3 text-sm">{{ status().text }}</p>
      @if (profile().rejection_reason) {
        <p class="mt-2 rounded-lg bg-tz-soft p-3 text-sm"><strong class="text-tz-title">Motivo:</strong> {{ profile().rejection_reason }}</p>
      }

      <div class="mt-5">
        <div class="flex justify-between text-sm">
          <span id="completitud" class="font-semibold text-tz-title">Perfil completo</span>
          <span>{{ completion().percent }}%</span>
        </div>
        <p-progressbar [value]="completion().percent" [showValue]="false" aria-labelledby="completitud" class="mt-2 block h-1.5" />
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
      <p class="mt-3 text-xs">Las credenciales son opcionales, pero ayudan a que aprobemos tu perfil.</p>
    </app-widget-card>
  `,
  host: { class: 'block' }
})
export class ProfileSummary {
  private readonly auth = inject(AuthService);

  readonly profile = input.required<TeacherProfile>();
  /** Cuántas especialidades tiene guardadas */
  readonly specialtiesCount = input(0);

  protected readonly status = computed(() => STATUS[this.profile().approval_status]);
  protected readonly completion = computed(() =>
    profileCompletion(this.profile(), { specialtiesCount: this.specialtiesCount(), hasPhoto: !!this.auth.user()?.avatar_url })
  );
}
