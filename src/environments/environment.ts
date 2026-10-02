/**
 * Configuración del frontend. Por ahora un solo entorno (desarrollo local).
 * Cuando exista el dominio de producción, agregar environment.production.ts y fileReplacements en angular.json.
 */
export const environment = {
  /** Base del API. La sesión viaja en una cookie httpOnly, por eso las peticiones van con credenciales. */
  apiUrl: 'http://localhost:3000/api'
};
