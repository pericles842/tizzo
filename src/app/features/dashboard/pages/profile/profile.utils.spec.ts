import { TeacherProfile } from '../../../../core/auth/auth.models';
import { profileCompletion } from './profile.utils';

const empty: TeacherProfile = {
  uuid: 'tp-1',
  headline: null,
  bio: null,
  signature_url: null,
  approval_status: 'pending',
  rejection_reason: null,
  rating_avg: 0,
  rating_count: 0
};

describe('profileCompletion', () => {
  it('perfil vacío: 0 de 5', () => {
    const result = profileCompletion(empty);
    expect(result.total).toBe(5);
    expect(result.done).toBe(0);
    expect(result.percent).toBe(0);
  });

  it('sin perfil (aún cargando) cuenta como vacío', () => {
    expect(profileCompletion(null).percent).toBe(0);
  });

  it('el texto en blanco no cuenta', () => {
    expect(profileCompletion({ ...empty, headline: '   ', bio: '' }).done).toBe(0);
  });

  it('las especialidades cuentan cuando hay al menos una', () => {
    expect(profileCompletion(empty, { specialtiesCount: 0, hasPhoto: false }).items.find((i) => i.key === 'specialties')?.done).toBeFalse();
    expect(profileCompletion(empty, { specialtiesCount: 2, hasPhoto: false }).items.find((i) => i.key === 'specialties')?.done).toBeTrue();
  });

  it('la foto de perfil cuenta', () => {
    const result = profileCompletion(empty, { specialtiesCount: 0, hasPhoto: true });
    expect(result.items.find((i) => i.key === 'photo')?.done).toBeTrue();
    expect(result.percent).toBe(20);
  });

  it('perfil completo: 100 %', () => {
    const result = profileCompletion(
      { ...empty, headline: 'Profesora de álgebra', bio: 'Biografía', signature_url: 'http://localhost:3000/uploads/signatures/x/firma.png' },
      { specialtiesCount: 3, hasPhoto: true }
    );
    expect(result.percent).toBe(100);
    expect(result.items.every((item) => item.done)).toBeTrue();
  });

  it('parcial: titular y biografía = 2 de 5 = 40 %', () => {
    expect(profileCompletion({ ...empty, headline: 'Titular', bio: 'Bio' }).percent).toBe(40);
  });
});
