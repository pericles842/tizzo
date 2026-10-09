import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GuardianConsentInfo {
  student_name: string;
  confirmed: boolean;
  expired: boolean;
  statements: string[];
  version: string;
}

/** Consentimiento del representante (público: se entra con el enlace del correo, sin sesión) */
@Injectable({ providedIn: 'root' })
export class GuardianService {
  private readonly http = inject(HttpClient);

  info(token: string): Promise<GuardianConsentInfo> {
    return firstValueFrom(this.http.get<GuardianConsentInfo>(`${environment.apiUrl}/guardian/consent/${token}`));
  }

  confirm(token: string): Promise<{ confirmed: boolean; student_name: string }> {
    return firstValueFrom(this.http.post<{ confirmed: boolean; student_name: string }>(`${environment.apiUrl}/guardian/consent/${token}`, {}));
  }
}
