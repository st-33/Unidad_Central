import { ref, get, set, child } from 'firebase/database';
import type { Negocio, IdentificadorUnico, ConfiguracionNegocio } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';

export interface RepositorioNegocios {
  listar(): Promise<readonly Negocio[]>;
  obtenerPorId(id: IdentificadorUnico): Promise<Negocio | null>;
  listarPorCategoria(categoriaId: IdentificadorUnico): Promise<readonly Negocio[]>;
  guardar(negocio: Negocio): Promise<void>;
  actualizarConfiguracion(id: IdentificadorUnico, configuracion: ConfiguracionNegocio): Promise<void>;
}

export class RepositorioNegociosRtdb implements RepositorioNegocios {
  async listar(): Promise<readonly Negocio[]> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, RUTAS_RTDB_CENTRAL.negocios);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return [];
    }

    const valor = instantanea.val();
    return Object.values(valor) as Negocio[];
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<Negocio | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.negocios), id);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as Negocio;
  }

  async listarPorCategoria(categoriaId: IdentificadorUnico): Promise<readonly Negocio[]> {
    const todos = await this.listar();
    return todos.filter((negocio) => negocio.categoria_id === categoriaId);
  }

  async guardar(negocio: Negocio): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.negocios), negocio.id);
    await set(referencia, negocio);
  }

  async actualizarConfiguracion(id: IdentificadorUnico, configuracion: ConfiguracionNegocio): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.negocios), `${id}/configuracion`);
    await set(referencia, configuracion);
  }
}
