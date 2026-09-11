import { ref, get, set, child, query, orderByChild, equalTo } from 'firebase/database';
import type { IdentificadorUnico, ReciboEjecucion, ResultadoProcesamiento } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { almacenMemoria, conTiempoLimite } from './almacen-memoria';

/**
 * Repositorio de recibos cobrables.
 */
export interface RepositorioRecibos {
  guardarRecibo(recibo: ReciboEjecucion): Promise<void>;
  obtenerRecibo(eventoId: IdentificadorUnico): Promise<ReciboEjecucion | null>;
  listarRecibosPorNegocio(negocioId: IdentificadorUnico): Promise<readonly ReciboEjecucion[]>;
  guardarProcesamiento(procesamiento: ResultadoProcesamiento): Promise<void>;
  obtenerProcesamiento(eventoId: IdentificadorUnico): Promise<ResultadoProcesamiento | null>;
}

export class RepositorioRecibosRtdb implements RepositorioRecibos {
  private readonly rutaRecibos = 'central/recibos';
  private readonly rutaProcesamientos = 'central/procesamientos';

  async guardarRecibo(recibo: ReciboEjecucion): Promise<void> {
    almacenMemoria.recibos.guardarRecibo(recibo);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, this.rutaRecibos), recibo.evento_id);
      await conTiempoLimite(set(referencia, recibo), 2000);
    } catch {
      // Offline fallback saved
    }
  }

  async obtenerRecibo(eventoId: IdentificadorUnico): Promise<ReciboEjecucion | null> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, this.rutaRecibos), eventoId);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return null;
      }

      return instantanea.val() as ReciboEjecucion;
    } catch {
      return null;
    }
  }

  async listarRecibosPorNegocio(negocioId: IdentificadorUnico): Promise<readonly ReciboEjecucion[]> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = ref(db, this.rutaRecibos);
      const consulta = query(referencia, orderByChild('negocio_id_origen'), equalTo(negocioId));
      const instantanea = await conTiempoLimite(get(consulta), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.recibos.listarPorNegocio(negocioId);
      }

      const valor = instantanea.val();
      return Object.values(valor) as ReciboEjecucion[];
    } catch {
      return almacenMemoria.recibos.listarPorNegocio(negocioId);
    }
  }

  async guardarProcesamiento(procesamiento: ResultadoProcesamiento): Promise<void> {
    almacenMemoria.recibos.guardarProcesamiento(procesamiento);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, this.rutaProcesamientos), procesamiento.recibo_id);
      await conTiempoLimite(set(referencia, procesamiento), 2000);
    } catch {
      // Offline fallback saved
    }
  }

  async obtenerProcesamiento(eventoId: IdentificadorUnico): Promise<ResultadoProcesamiento | null> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, this.rutaProcesamientos), eventoId);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.recibos.obtenerProcesamiento(eventoId);
      }

      return instantanea.val() as ResultadoProcesamiento;
    } catch {
      return almacenMemoria.recibos.obtenerProcesamiento(eventoId);
    }
  }
}
