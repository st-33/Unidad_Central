import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

export const URL_RTDB_CENTRAL = 'https://base-principal-ma1-default-rtdb.firebaseio.com';
export const URL_RTDB_NEGOCIOS = 'https://minegocioaunclick-1539b-default-rtdb.firebaseio.com';

// Aliases para retrocompatibilidad
export const URL_RTDB_TORRE = URL_RTDB_NEGOCIOS;
export const URL_RTDB_TORRE_NEGOCIOS = URL_RTDB_NEGOCIOS;

export const NOMBRE_APP_NEGOCIOS = 'torre-control-negocios';
export const NOMBRE_APP_CENTRAL = 'torre-control-central';
export const NOMBRE_APP_TORRE = NOMBRE_APP_NEGOCIOS;

let dbNegociosInstancia: Database | null = null;
let dbCentralInstancia: Database | null = null;

export function obtenerBaseDatosNegocios(): Database {
  if (dbNegociosInstancia) {
    return dbNegociosInstancia;
  }

  const apps = getApps();
  const existente = apps.find((app) => app.name === NOMBRE_APP_NEGOCIOS);
  if (existente) {
    dbNegociosInstancia = getDatabase(existente);
    return dbNegociosInstancia;
  }

  const app = initializeApp(
    {
      databaseURL: URL_RTDB_NEGOCIOS,
      projectId: 'minegocioaunclick-1539b',
    },
    NOMBRE_APP_NEGOCIOS
  );

  dbNegociosInstancia = getDatabase(app);
  return dbNegociosInstancia;
}

export function obtenerBaseDatosTorre(): Database {
  return obtenerBaseDatosNegocios();
}

export function obtenerBaseDatosCentral(): Database {
  if (dbCentralInstancia) {
    return dbCentralInstancia;
  }

  const apps = getApps();
  const existente = apps.find((app) => app.name === NOMBRE_APP_CENTRAL);
  if (existente) {
    dbCentralInstancia = getDatabase(existente);
    return dbCentralInstancia;
  }

  const app = initializeApp(
    {
      databaseURL: URL_RTDB_CENTRAL,
      projectId: 'base-principal-ma1',
    },
    NOMBRE_APP_CENTRAL
  );

  dbCentralInstancia = getDatabase(app);
  return dbCentralInstancia;
}

