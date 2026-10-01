import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Tema de PrimeNG con la identidad de Tizzo (docs/BRANDING.md).
 * Primario #7B61FF; los extremos de la paleta salen de los fondos claro y oscuro.
 */
export const TizzoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f3eeff',
      100: '#e2d6ff',
      200: '#cdbdff',
      300: '#b39cff',
      400: '#9b80ff',
      500: '#7b61ff',
      600: '#6347e6',
      700: '#4f37bf',
      800: '#3a2a8f',
      900: '#2a1f5c',
      950: '#1c1433'
    }
  }
});
