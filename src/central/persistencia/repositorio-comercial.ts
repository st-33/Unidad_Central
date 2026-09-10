import { ref, get, set, child } from 'firebase/database';
import type { IdentificadorUnico, InformacionComercial } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';

/**
 * Repositorio para información comercial de negocios.
 * 
 * Estructura:
 * central/negocios/{negocio_id}/comercial/
 *   modalidad
 *   estado_comercial
 *   suscripcion_estado
 *   suscripcion_vigencia
 *   peaje_config
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
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(
      ref(db, RUTAS_RTDB_CENTRAL.negocios),
      `${negocioId}/comercial`
    );
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as InformacionComercial;
  }

  async guardar(info: InformacionComercial): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(
      ref(db, RUTAS_RTDB_CENTRAL.negocios),
      `${info.negocio_id}/comercial`
    );
    await set(referencia, info);
  }

  async actualizarEstadoComercial(
    negocioId: IdentificadorUnico,
    estadoComercial: InformacionComercial['estado_comercial']
  ): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(
      ref(db, RUTAS_RTDB_CENTRAL.negocios),
      `${negocioId}/comercial/estado_comercial`
    );
    await set(referencia, estadoComercial);
  }

  async actualizarEstadoSuscripcion(
    negocioId: IdentificadorUnico,
    estadoSuscripcion: InformacionComercial['suscripcion_estado'],
    vigencia?: number
  ): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const refEstado = child(
      ref(db, RUTAS_RTDB_CENTRAL.negocios),
      `${negocioId}/comercial/suscripcion_estado`
    );
    await set(refEstado, estadoSuscripcion);

    if (vigencia !== undefined) {
      const refVigencia = child(
        ref(db, RUTAS_RTDB_CENTRAL.negocios),
        `${negocioId}/comercial/suscripcion_vigencia`
      );
      await set(refVigencia, vigencia);
    }
  }
}
