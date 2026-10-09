import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { AuthService } from '../../../../core/auth/auth.service';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/notify/toast.service';
import { DashboardSession, buildLiveClass, buildSummary, buildWeekFromSessions, countToday, countWeek, dashboardRange, studentTaskItems, teacherTaskItems } from '../../data/dashboard.live';
import { getDashboardMock } from '../../data/dashboard.mock';
import { DashboardData, TaskItem } from '../../data/dashboard.models';
import { StudentCalendarService } from '../student-calendar/student-calendar.service';
import { TeachingService } from '../calendar/teaching.service';
import { TasksService } from '../tasks/tasks.service';
import { LiveClassCard } from '../../widgets/live-class-card/live-class-card';
import { StatCard } from '../../widgets/stat-card/stat-card';
import { WeekCalendar } from '../../widgets/week-calendar/week-calendar';
import { TaskList } from '../../widgets/task-list/task-list';
import { PeopleList } from '../../widgets/people-list/people-list';
import { CertificatesSummary } from '../../widgets/certificates-summary/certificates-summary';
import { CommunityFeed } from '../../widgets/community-feed/community-feed';

/**
 * "Inicio" del dashboard. La próxima clase, los indicadores, la semana y las tareas salen de los datos reales
 * (calendario y tareas del profe o del estudiante); personas, certificados y comunidad siguen con datos de prueba.
 */
@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, ButtonDirective, Skeleton, LiveClassCard, StatCard, WeekCalendar, TaskList, PeopleList, CertificatesSummary, CommunityFeed],
  templateUrl: './dashboard-home.html'
})
export class DashboardHome implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teaching = inject(TeachingService);
  private readonly studentCalendar = inject(StudentCalendarService);
  private readonly tasksService = inject(TasksService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly role = computed(() => this.auth.user()?.role ?? 'student');
  protected readonly loading = signal(true);

  private readonly sessions = signal<DashboardSession[]>([]);
  private readonly taskItems = signal<{ items: TaskItem[]; total: number }>({ items: [], total: 0 });
  /** Se renueva cada minuto para que "en vivo" y "empieza en N min" se mantengan al día */
  private readonly now = signal(new Date());

  protected readonly data = computed<DashboardData>(() => {
    const user = this.auth.user();
    const role = this.role();
    const now = this.now();
    const sessions = this.sessions();
    const { items, total } = this.taskItems();
    const week = buildWeekFromSessions(sessions, now);
    const teacher = role === 'teacher';
    const mock = getDashboardMock(role, user?.first_name ?? '');

    return {
      ...mock,
      copy: {
        ...mock.copy,
        summary: buildSummary(role, countToday(sessions, now), total),
        tasksTitle: teacher ? 'Tareas por revisar' : 'Tareas por entregar'
      },
      liveClass: buildLiveClass(role, sessions, now),
      stats: [
        { icon: 'pi pi-video', value: countWeek(week), label: 'Clases esta semana' },
        { icon: 'pi pi-check-square', value: total, label: teacher ? 'Tareas por revisar' : 'Tareas por entregar' }
      ],
      week,
      tasks: items
    };
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
    void this.load();
  }

  private async load(): Promise<void> {
    const now = new Date();
    const { from, to } = dashboardRange(now);
    try {
      if (this.role() === 'teacher') {
        const [sessions, tasks] = await Promise.all([this.teaching.sessions(from, to), this.tasksService.list()]);
        this.sessions.set(sessions);
        this.taskItems.set(teacherTaskItems(tasks, now));
      } else {
        const [sessions, { tasks }] = await Promise.all([this.studentCalendar.sessions(from, to), this.tasksService.myTasks()]);
        this.sessions.set(sessions);
        this.taskItems.set(studentTaskItems(tasks, now));
      }
      this.now.set(new Date());
    } catch (err) {
      this.toast.error(apiErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
