import { Component, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { ButtonDirective } from 'primeng/button';
import { CommunityPost } from '../../data/dashboard.models';
import { WidgetCard } from '../widget-card/widget-card';

/** Últimas publicaciones de la comunidad */
@Component({
  selector: 'app-community-feed',
  imports: [Avatar, ButtonDirective, WidgetCard],
  template: `
    <app-widget-card heading="Comunidad" actionLabel="Ver más" actionRoute="/app/comunidad">
      <ul class="divide-y divide-tz-line">
        @for (post of posts(); track post.id) {
          <li class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-center gap-3">
              <p-avatar [label]="initials(post.author)" shape="circle" class="tz-bg-gradient shrink-0 text-xs text-white" />
              <p class="min-w-0 flex-1 truncate text-sm font-semibold text-tz-title">{{ post.author }}</p>
              <span class="shrink-0 text-xs">{{ post.time }}</span>
            </div>
            <p class="mt-2 text-sm">{{ post.text }}</p>
            <!-- Solo UI: los hilos de la comunidad llegan después -->
            <button
              pButton
              type="button"
              size="small"
              [text]="true"
              [label]="post.replies + (post.replies === 1 ? ' respuesta' : ' respuestas')"
              class="-ml-3"
            ></button>
          </li>
        }
      </ul>
    </app-widget-card>
  `,
  host: { class: 'block h-full' }
})
export class CommunityFeed {
  readonly posts = input.required<CommunityPost[]>();

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
