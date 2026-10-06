import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { StudentTask, StudentTaskState, TaskPayload, TaskStudent, TaskTargetCourse, TeacherTask, TeacherTaskFilters } from './tasks.models';

/** Llamadas del módulo de tareas. Los PDF son privados: se abren con un enlace al API (la cookie viaja sola). */
@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // ---------- Profe ----------

  targets(): Promise<TaskTargetCourse[]> {
    return firstValueFrom(this.http.get<{ courses: TaskTargetCourse[] }>(`${this.api}/teacher/task-targets`)).then(({ courses }) => courses);
  }

  list(filters: TeacherTaskFilters = {}): Promise<TeacherTask[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
    return firstValueFrom(this.http.get<{ tasks: TeacherTask[] }>(`${this.api}/teacher/tasks`, { params })).then(({ tasks }) => tasks);
  }

  detail(uuid: string): Promise<{ task: TeacherTask; students: TaskStudent[] }> {
    return firstValueFrom(this.http.get<{ task: TeacherTask; students: TaskStudent[] }>(`${this.api}/teacher/tasks/${uuid}`));
  }

  create(payload: TaskPayload): Promise<TeacherTask> {
    return firstValueFrom(this.http.post<{ task: TeacherTask }>(`${this.api}/teacher/tasks`, payload)).then(({ task }) => task);
  }

  update(uuid: string, payload: TaskPayload): Promise<TeacherTask> {
    return firstValueFrom(this.http.put<{ task: TeacherTask }>(`${this.api}/teacher/tasks/${uuid}`, payload)).then(({ task }) => task);
  }

  async remove(uuid: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.api}/teacher/tasks/${uuid}`));
  }

  uploadFile(uuid: string, file: File): Promise<TeacherTask> {
    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(this.http.post<{ task: TeacherTask }>(`${this.api}/teacher/tasks/${uuid}/file`, form)).then(({ task }) => task);
  }

  removeFile(uuid: string): Promise<TeacherTask> {
    return firstValueFrom(this.http.delete<{ task: TeacherTask }>(`${this.api}/teacher/tasks/${uuid}/file`)).then(({ task }) => task);
  }

  publish(uuid: string, notifyEmail: boolean): Promise<{ task: TeacherTask; assigned: number }> {
    return firstValueFrom(this.http.post<{ task: TeacherTask; assigned: number }>(`${this.api}/teacher/tasks/${uuid}/publish`, { notify_email: notifyEmail }));
  }

  close(uuid: string): Promise<TeacherTask> {
    return firstValueFrom(this.http.post<{ task: TeacherTask }>(`${this.api}/teacher/tasks/${uuid}/close`, {})).then(({ task }) => task);
  }

  teacherFileUrl(uuid: string): string {
    return `${this.api}/teacher/tasks/${uuid}/file`;
  }

  submissionFileUrl(taskUuid: string, studentUuid: string): string {
    return `${this.api}/teacher/tasks/${taskUuid}/submissions/${studentUuid}/file`;
  }

  // ---------- Estudiante ----------

  myTasks(): Promise<{ tasks: StudentTask[]; counts: Record<StudentTaskState, number> }> {
    return firstValueFrom(this.http.get<{ tasks: StudentTask[]; counts: Record<StudentTaskState, number> }>(`${this.api}/student/tasks`));
  }

  myTask(uuid: string): Promise<StudentTask> {
    return firstValueFrom(this.http.get<{ task: StudentTask }>(`${this.api}/student/tasks/${uuid}`)).then(({ task }) => task);
  }

  submit(uuid: string, file: File): Promise<StudentTask> {
    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(this.http.put<{ task: StudentTask }>(`${this.api}/student/tasks/${uuid}/submission`, form)).then(({ task }) => task);
  }

  studentFileUrl(uuid: string): string {
    return `${this.api}/student/tasks/${uuid}/file`;
  }

  mySubmissionUrl(uuid: string): string {
    return `${this.api}/student/tasks/${uuid}/submission/file`;
  }
}
