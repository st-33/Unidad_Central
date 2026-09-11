import { ref, get, set, child } from 'firebase/database';
import type { IdentificadorUnico, InformacionComercial } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';
import { almacenMemoria, conTiempoLimite } from './almacen-memoria';

/**
 * Repositorio para información comercial de negocios.
 */
export interface RepositorioComercial {
  obtener(negocioId: IdentificadorUnico): Promise<InformacionComercial | null>;
  guardar(info: InformacionComercial): Promise<void>;
  actualizarEstadoComercial(
    negocioId: IdentificadorUnico,
    estadoComercial: InformacionComercial['estado_comercial']
  ): Promise<void>;
  actualizarEstadoSuscripcion(
    negocioId: IdentificadorUnico,
    estadoSuscripcion: InformacionComercial['suscripcion_estado'],
    vigencia?: number
  ): Promise<void>;
}

export class RepositorioComercialRtdb implements RepositorioComercial {
  async obtener(negocioId: IdentificadorUnico): Promise<InformacionComercial | null> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(
        ref(db, RUTAS_RTDB_CENTRAL.negocios),
        `${negocioId}/comercial`
      );
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.comercial.obtener(negocioId);
      }

      return instantanea.val() as InformacionComercial;
    } catch {
      return almacenMemoria.comercial.obtener(negocioId);
    }
  }

  async guardar(info: InformacionComercial): Promise<void> {
    almacenMemoria.comercial.guardar(info);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(
        ref(db, RUTAS_RTDB_CENTRAL.negocios),
        `${info.negocio_id}/comercial`
      );
      await conTiempoLimite(set(referencia, info), 2000);
    } catch {
      // Offline fallback saved
    }
  }

  async actualizarEstadoComercial(
    negocioId: IdentificadorUnico,
    estadoComercial: InformacionComercial['estado_comercial']
  ): Promise<void> {
    almacenMemoria.comercial.actualizarEstado(negocioId, estadoComercial);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(
        ref(db, RUTAS_RTDB_CENTRAL.negocios),
        `${negocioId}/comercial/estado_comercial`
      );
      await conTiempoLimite(set(referencia, estadoComercial), 2000);
    } catch {
      // Offline fallback saved
    }
  }

  async actualizarEstadoSuscripcion(
    negocioId: IdentificadorUnico,
    estadoSuscripcion: InformacionComercial['suscripcion_estado'],
    vigencia?: number
  ): Promise<void> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const refEstado = child(
        ref(db, RUTAS_RTDB_CENTRAL.negocios),
        `${negocioId}/comercial/suscripcion_estado`
      );
      await conTiempoLimite(set(refEstado, estadoSuscripcion), 2000);

      if (vigencia !== undefined) {
        const refVigencia = child(
          ref(db, RUTAS_RTDB_CENTRAL.negocios),
          `${negocioId}/comercial/suscripcion_vigencia`
        );
        await conTiempoLimite(set(refVigencia, vigencia), 2000);
      }
    } catch {
      // Offline fallback
    }
  }
}
