import { ref, get, set, child } from 'firebase/database';
import type { DefinicionCapacidad, IdentificadorUnico } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';

export interface RepositorioCapacidades {
  listar(): Promise<readonly DefinicionCapacidad[]>;
  obtenerPorId(id: IdentificadorUnico): Promise<DefinicionCapacidad | null>;
  guardar(capacidad: DefinicionCapacidad): Promise<void>;
}

export class RepositorioCapacidadesRtdb implements RepositorioCapacidades {
  async listar(): Promise<readonly DefinicionCapacidad[]> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, RUTAS_RTDB_CENTRAL.capacidades);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return [];
    }

    const valor = instantanea.val();
    return Object.values(valor) as DefinicionCapacidad[];
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<DefinicionCapacidad | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.capacidades), id);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as DefinicionCapacidad;
  }

  async guardar(capacidad: DefinicionCapacidad): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.capacidades), capacidad.id);
    await set(referencia, capacidad);
  }
}
