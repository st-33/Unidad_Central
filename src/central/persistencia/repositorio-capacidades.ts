import { ref, get, set, child } from 'firebase/database';
import type { DefinicionCapacidad, IdentificadorUnico } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';
import { almacenMemoria, conTiempoLimite } from './almacen-memoria';

export interface RepositorioCapacidades {
  listar(): Promise<readonly DefinicionCapacidad[]>;
  obtenerPorId(id: IdentificadorUnico): Promise<DefinicionCapacidad | null>;
  guardar(capacidad: DefinicionCapacidad): Promise<void>;
}

export class RepositorioCapacidadesRtdb implements RepositorioCapacidades {
  async listar(): Promise<readonly DefinicionCapacidad[]> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = ref(db, RUTAS_RTDB_CENTRAL.capacidades);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.capacidades.listar();
      }

      const valor = instantanea.val();
      const lista = Object.values(valor) as DefinicionCapacidad[];
      almacenMemoria.capacidades.sincronizar(lista);
      return lista;
    } catch {
      return almacenMemoria.capacidades.listar();
    }
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<DefinicionCapacidad | null> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.capacidades), id);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.capacidades.obtenerPorId(id);
      }

      return instantanea.val() as DefinicionCapacidad;
    } catch {
      return almacenMemoria.capacidades.obtenerPorId(id);
    }
  }

  async guardar(capacidad: DefinicionCapacidad): Promise<void> {
    almacenMemoria.capacidades.guardar(capacidad);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.capacidades), capacidad.id);
      await conTiempoLimite(set(referencia, capacidad), 2000);
    } catch {
      // Offline fallback saved
    }
  }
}
