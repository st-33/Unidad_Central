import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

export const URL_RTDB_TORRE = 'https://minegocioaunclick-1539b-default-rtdb.firebaseio.com';
export const URL_RTDB_TORRE_NEGOCIOS = URL_RTDB_TORRE;
export const NOMBRE_APP_TORRE = 'torre-control-negocios';

let baseDatosInstancia: Database | null = null;

export function obtenerBaseDatosTorre(): Database {
  if (baseDatosInstancia) {
    return baseDatosInstancia;
  }

  const apps = getApps();
  const existente = apps.find((app) => app.name === NOMBRE_APP_TORRE);
  if (existente) {
    baseDatosInstancia = getDatabase(existente);
    return baseDatosInstancia;
  }

  const app = initializeApp(
    {
      databaseURL: URL_RTDB_TORRE,
      projectId: 'minegocioaunclick-1539b',
    },
    NOMBRE_APP_TORRE
  );

  baseDatosInstancia = getDatabase(app);
  return baseDatosInstancia;
}
