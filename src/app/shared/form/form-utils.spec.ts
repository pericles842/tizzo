import { PASSWORD_PATTERN, PASSWORD_RULES, passwordStrength } from './form-utils';

describe('form-utils: contraseña', () => {
  it('passwordStrength: vacía 0, débil, regular, buena y fuerte', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('clave')).toBe(1); // solo minúsculas
    expect(passwordStrength('clave1234')).toBe(2); // largo + minúscula + número
    expect(passwordStrength('Clave1234')).toBe(3); // "buena", como en el diseño
    expect(passwordStrength('Clave1234!segura')).toBe(4);
  });

  it('las reglas del registro: 8 caracteres, una mayúscula y un número', () => {
    const check = (value: string) => PASSWORD_RULES.map((rule) => rule.test(value));
    expect(check('clave')).toEqual([false, false, false]);
    expect(check('Clave1234')).toEqual([true, true, true]);
    expect(PASSWORD_PATTERN.test('clave1234')).toBeFalse();
    expect(PASSWORD_PATTERN.test('Clave1234')).toBeTrue();
  });
});
