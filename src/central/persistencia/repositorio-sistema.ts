import { ref, get, set } from 'firebase/database';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';
import { almacenMemoria, conTiempoLimite } from './almacen-memoria';

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
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = ref(db, RUTAS_RTDB_CENTRAL.sistema);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.sistema.obtener();
      }

      const valor = instantanea.val() as EstadoEstructuraSistema;
      almacenMemoria.sistema.sincronizar(valor);
      return valor;
    } catch {
      return almacenMemoria.sistema.obtener();
    }
  }

  async marcarInicializado(version = 1): Promise<void> {
    almacenMemoria.sistema.marcarInicializado(version);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = ref(db, RUTAS_RTDB_CENTRAL.sistema);
      const datos: EstadoEstructuraSistema = {
        inicializado: true,
        version,
        inicializadoEn: Date.now(),
      };
      await conTiempoLimite(set(referencia, datos), 2000);
    } catch {
      // Offline fallback already recorded in memory
    }
  }
}
