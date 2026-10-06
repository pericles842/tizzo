import { User } from '../../../../core/auth/auth.models';
import { TIMEZONES, studentCompletion, timezoneOptions } from './student-profile.utils';

const base: User = {
  uuid: 'u1',
  role: 'student',
  is_admin: false,
  status: 'active',
  email: 'a@b.co',
  email_verified: false,
  first_name: 'Ana',
  last_name: 'Pérez',
  phone: null,
  country_code: 'VE',
  age: 20,
  timezone: 'America/Caracas',
  topics: [{ id: 1, name: 'Matemáticas', slug: 'matematicas' }],
  avatar_url: null,
  teacher_profile: null
};

describe('student-profile.utils', () => {
  it('sin sesión no hay nada completo', () => {
    expect(studentCompletion(null).percent).toBe(0);
  });

  it('recién registrado: faltan la foto y el teléfono', () => {
    const completion = studentCompletion(base);
    expect(completion.done).toBe(3);
    expect(completion.percent).toBe(60);
    expect(completion.items.filter((item) => !item.done).map((item) => item.key)).toEqual(['photo', 'phone']);
  });

  it('con foto y teléfono llega al 100 %', () => {
    expect(studentCompletion({ ...base, avatar_url: 'http://x/a.webp', phone: '+58 412 1234567' }).percent).toBe(100);
  });

  it('un teléfono en blanco no cuenta', () => {
    expect(studentCompletion({ ...base, phone: '   ' }).items.find((item) => item.key === 'phone')?.done).toBeFalse();
  });

  it('timezoneOptions agrega la zona guardada si no está en la lista', () => {
    expect(timezoneOptions('America/Caracas')).toBe(TIMEZONES);
    expect(timezoneOptions('Asia/Tokyo')[0]).toEqual({ value: 'Asia/Tokyo', label: 'Asia/Tokyo' });
  });
});
