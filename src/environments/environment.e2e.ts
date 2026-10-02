/**
 * Entorno SOLO para pruebas de interfaz (`ng serve --configuration e2e --port 4201`).
 * Apunta a un API de pruebas en el puerto 3100 (con su propia base de datos), para no tocar el API ni la base de desarrollo.
 */
export const environment = {
  apiUrl: 'http://localhost:3100/api'
};
