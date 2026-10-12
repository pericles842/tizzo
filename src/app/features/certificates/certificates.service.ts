import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Certificate, CertificateVerification } from './certificates.models';

/** Diplomas: los del estudiante, los que emitió el profe y la verificación pública por código */
@Injectable({ providedIn: 'root' })
export class CertificatesService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  async mine(): Promise<Certificate[]> {
    const { certificates } = await firstValueFrom(this.http.get<{ certificates: Certificate[] }>(`${this.api}/student/certificates`));
    return certificates;
  }

  async issued(): Promise<Certificate[]> {
    const { certificates } = await firstValueFrom(this.http.get<{ certificates: Certificate[] }>(`${this.api}/teacher/certificates`));
    return certificates;
  }

  async verify(code: string): Promise<CertificateVerification> {
    const { certificate } = await firstValueFrom(
      this.http.get<{ certificate: CertificateVerification }>(`${this.api}/certificates/verify/${encodeURIComponent(code.trim())}`)
    );
    return certificate;
  }

  /** Vista previa (imagen privada): sale por la ruta del rol, con la cookie de sesión */
  previewUrl(uuid: string, role: 'student' | 'teacher'): string {
    return `${this.api}/${role}/certificates/${encodeURIComponent(uuid)}/preview`;
  }

  /** El PDF es privado: se abre por esta ruta con la cookie de sesión (no con <img>) */
  fileUrl(uuid: string): string {
    return `${this.api}/student/certificates/${encodeURIComponent(uuid)}/file`;
  }
}
