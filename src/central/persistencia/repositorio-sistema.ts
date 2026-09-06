import { ref, get, set } from 'firebase/database';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';

export interface EstadoEstructuraSistema {
  readonly inicializado: boolean;
  readonly version: number;
  readonly inicializadoEn: number;
}

export interface RepositorioSistema {
  obtenerEstado(): Promise<EstadoEstructuraSistema | null>;
  marcarInicializado(version?: number): Promise<void>;
}

export class RepositorioSistemaRtdb implements RepositorioSistema {
  async obtenerEstado(): Promise<EstadoEstructuraSistema | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, RUTAS_RTDB_CENTRAL.sistema);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as EstadoEstructuraSistema;
  }

  async marcarInicializado(version = 1): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, RUTAS_RTDB_CENTRAL.sistema);
    const datos: EstadoEstructuraSistema = {
      inicializado: true,
      version,
      inicializadoEn: Date.now(),
    };
    await set(referencia, datos);
  }
}
