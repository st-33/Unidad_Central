import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { obtenerOpcionesFirebaseSdk } from '../../../configuracion/firebase';

let instanciaApp: FirebaseApp | null = null;
let instanciaBaseDatos: Database | null = null;

/**
 * Obtiene o inicializa la instancia de Firebase App para la Unidad Central.
 * Protegido contra reinicializaciones múltiples causadas por recargas de Metro.
 */
export function obtenerAplicacionFirebase(): FirebaseApp {
  if (instanciaApp) {
    return instanciaApp;
  }

  const appsExistentes = getApps();
  if (appsExistentes.length > 0) {
    instanciaApp = getApp();
    return instanciaApp;
  }

  const opciones = obtenerOpcionesFirebaseSdk();
  instanciaApp = initializeApp(opciones);
  return instanciaApp;
}

/**
 * Obtiene la referencia única a la base de datos en tiempo real (RTDB) de Unidad Central.
 */
export function obtenerBaseDatosTiempoReal(): Database {
  if (instanciaBaseDatos) {
    return instanciaBaseDatos;
  }

  const app = obtenerAplicacionFirebase();
  const opciones = obtenerOpcionesFirebaseSdk();
  instanciaBaseDatos = getDatabase(app, opciones.databaseURL);
  return instanciaBaseDatos;
}
