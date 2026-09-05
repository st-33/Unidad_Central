/**
 * Configuración única y centralizada de Firebase para la Unidad Central.
 * Encapsula las credenciales y parámetros de conexión para evitar dispersión.
 */

export interface ConfiguracionFirebase {
  readonly idProyecto: string;
  readonly nombreProyecto: string;
  readonly idAplicacion: string;
  readonly nombreAplicacion: string;
  readonly urlBaseDatosTiempoReal: string;
  readonly claveApi?: string;
  readonly dominioAutenticacion?: string;
}

export const CONFIGURACION_FIREBASE_CENTRAL: ConfiguracionFirebase = {
  idProyecto: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'base-principal-ma1',
  nombreProyecto: 'Unidad Central',
  idAplicacion: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:381866932199:web:a97b0914d7d0a46a872f42',
  nombreAplicacion: 'central',
  urlBaseDatosTiempoReal:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
    'https://base-principal-ma1-default-rtdb.firebaseio.com/',
  claveApi: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyD-desarrollo-central-temp',
  dominioAutenticacion:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'base-principal-ma1.firebaseapp.com',
};

/**
 * Convierte la configuración interna de Unidad Central al formato requerido por el SDK de Firebase.
 */
export function obtenerOpcionesFirebaseSdk() {
  return {
    projectId: CONFIGURACION_FIREBASE_CENTRAL.idProyecto,
    appId: CONFIGURACION_FIREBASE_CENTRAL.idAplicacion,
    databaseURL: CONFIGURACION_FIREBASE_CENTRAL.urlBaseDatosTiempoReal,
    apiKey: CONFIGURACION_FIREBASE_CENTRAL.claveApi,
    authDomain: CONFIGURACION_FIREBASE_CENTRAL.dominioAutenticacion,
  };
}
