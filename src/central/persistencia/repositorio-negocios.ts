import { ref, get, set, child } from 'firebase/database';
import type { Negocio, IdentificadorUnico, ConfiguracionNegocio } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';
import { almacenMemoria, conTiempoLimite } from './almacen-memoria';

export interface RepositorioNegocios {
  listar(): Promise<readonly Negocio[]>;
  obtenerPorId(id: IdentificadorUnico): Promise<Negocio | null>;
  listarPorCategoria(categoriaId: IdentificadorUnico): Promise<readonly Negocio[]>;
  guardar(negocio: Negocio): Promise<void>;
  actualizarConfiguracion(id: IdentificadorUnico, configuracion: ConfiguracionNegocio): Promise<void>;
}

export class RepositorioNegociosRtdb implements RepositorioNegocios {
  async listar(): Promise<readonly Negocio[]> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = ref(db, RUTAS_RTDB_CENTRAL.negocios);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.negocios.listar();
      }

      const valor = instantanea.val();
      const lista = Object.values(valor) as Negocio[];
      almacenMemoria.negocios.sincronizar(lista);
      return lista;
    } catch {
      return almacenMemoria.negocios.listar();
    }
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<Negocio | null> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.negocios), id);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.negocios.obtenerPorId(id);
      }

      return instantanea.val() as Negocio;
    } catch {
      return almacenMemoria.negocios.obtenerPorId(id);
    }
  }

  async listarPorCategoria(categoriaId: IdentificadorUnico): Promise<readonly Negocio[]> {
    const todos = await this.listar();
    return todos.filter((negocio) => negocio.categoria_id === categoriaId);
  }

  async guardar(negocio: Negocio): Promise<void> {
    almacenMemoria.negocios.guardar(negocio);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.negocios), negocio.id);
      await conTiempoLimite(set(referencia, negocio), 2000);
    } catch {
      // Offline fallback saved
    }
  }

  async actualizarConfiguracion(id: IdentificadorUnico, configuracion: ConfiguracionNegocio): Promise<void> {
    almacenMemoria.negocios.actualizarConfiguracion(id, configuracion);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.negocios), `${id}/configuracion`);
      await conTiempoLimite(set(referencia, configuracion), 2000);
    } catch {
      // Offline fallback saved
    }
  }
}
