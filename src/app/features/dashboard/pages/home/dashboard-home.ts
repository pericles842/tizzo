import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { getDashboardMock } from '../../data/dashboard.mock';
import { LiveClassCard } from '../../widgets/live-class-card/live-class-card';
import { StatCard } from '../../widgets/stat-card/stat-card';
import { WeekCalendar } from '../../widgets/week-calendar/week-calendar';
import { TaskList } from '../../widgets/task-list/task-list';
import { PeopleList } from '../../widgets/people-list/people-list';
import { CertificatesSummary } from '../../widgets/certificates-summary/certificates-summary';
import { CommunityFeed } from '../../widgets/community-feed/community-feed';

/** "Inicio" del dashboard: arma los widgets con datos de prueba según el rol */
@Component({
  selector: 'app-dashboard-home',
  imports: [LiveClassCard, StatCard, WeekCalendar, TaskList, PeopleList, CertificatesSummary, CommunityFeed],
  templateUrl: './dashboard-home.html'
})
export class DashboardHome {
  private readonly auth = inject(AuthService);

  protected readonly data = computed(() => {
    const user = this.auth.user();
    return getDashboardMock(user?.role ?? 'student', user?.first_name ?? '');
  });
}
