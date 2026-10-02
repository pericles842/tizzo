import { Component, computed, input } from '@angular/core';
import { Avatar } from 'primeng/avatar';
import { User } from '../../core/auth/auth.models';

/** Foto del usuario o, si no tiene, sus iniciales (p-avatar) */
@Component({
  selector: 'app-user-avatar',
  imports: [Avatar],
  template: `
    @if (user().avatar_url; as url) {
      <p-avatar [image]="url" shape="circle" size="large" />
    } @else {
      <p-avatar [label]="initials()" shape="circle" size="large" class="tz-bg-gradient font-display text-sm text-white" />
    }
  `
})
export class UserAvatar {
  readonly user = input.required<User>();
  protected readonly initials = computed(() => `${this.user().first_name[0] ?? ''}${this.user().last_name[0] ?? ''}`.toUpperCase());
}
