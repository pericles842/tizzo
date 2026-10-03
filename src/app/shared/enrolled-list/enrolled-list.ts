import { Component, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { Tag } from 'primeng/tag';
import { EnrolledStudent } from '../course-detail/course-detail.models';

/**
 * Lista de personas inscritas en una clase o curso: foto (o iniciales), nombre y, si ya terminó, la etiqueta
 * "Completó". Muestra "N de M" según el máximo de integrantes. Reutilizable para cualquier lista de inscritos.
 */
@Component({
  selector: 'app-enrolled-list',
  imports: [Avatar, Tag],
  template: `
    <section [attr.aria-labelledby]="headingId">
      <div class="flex items-center justify-between gap-3">
        <h3 [id]="headingId" class="font-display text-base font-semibold text-tz-title">{{ heading() }}</h3>
        @if (!loading()) {
          <p class="text-sm"><strong class="text-tz-title">{{ students().length }}</strong> de {{ max() }}</p>
        }
      </div>

      @if (loading()) {
        <p class="mt-3 flex items-center gap-2 text-sm" role="status"><i class="pi pi-spin pi-spinner" aria-hidden="true"></i> Cargando inscritos…</p>
      } @else if (students().length) {
        <ul class="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1" [attr.aria-label]="heading()">
          @for (student of students(); track student.uuid) {
            <li class="flex items-center gap-3 rounded-xl border border-tz-line p-2.5">
              @if (student.avatar_url; as image) {
                <p-avatar [image]="image" shape="circle" />
              } @else {
                <p-avatar [label]="initials(student.name)" shape="circle" class="tz-bg-gradient font-display text-xs text-white" />
              }
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-tz-title">{{ student.name }}</span>
              @if (student.status === 'completed') {
                <p-tag value="Completó" severity="success" />
              }
            </li>
          }
        </ul>
      } @else {
        <p class="mt-3 rounded-xl border border-dashed border-tz-line p-4 text-center text-sm">Aún no hay estudiantes inscritos.</p>
      }
    </section>
  `,
  host: { class: 'block' }
})
export class EnrolledList {
  private static nextId = 0;

  readonly students = input.required<EnrolledStudent[]>();
  /** Máximo de integrantes (para mostrar "N de M") */
  readonly max = input.required<number>();
  readonly loading = input(false);
  readonly heading = input('Personas inscritas');

  protected readonly headingId = `enrolled-${++EnrolledList.nextId}`;

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();
  }
}
