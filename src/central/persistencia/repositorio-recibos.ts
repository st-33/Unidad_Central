import { ref, get, set, child, query, orderByChild, equalTo } from 'firebase/database';
import type { IdentificadorUnico, ReciboEjecucion, ResultadoProcesamiento } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';

/**
 * Repositorio de recibos cobrables.
 * 
 * Estructura:
 * central/recibos/{evento_id} -> ReciboEjecucion
 * central/procesamientos/{evento_id} -> ResultadoProcesamiento
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
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, this.rutaRecibos), recibo.evento_id);
    await set(referencia, recibo);
  }

  async obtenerRecibo(eventoId: IdentificadorUnico): Promise<ReciboEjecucion | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, this.rutaRecibos), eventoId);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as ReciboEjecucion;
  }

  async listarRecibosPorNegocio(negocioId: IdentificadorUnico): Promise<readonly ReciboEjecucion[]> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, this.rutaRecibos);
    const consulta = query(referencia, orderByChild('negocio_id_origen'), equalTo(negocioId));
    const instantanea = await get(consulta);

    if (!instantanea.exists()) {
      return [];
    }

    const valor = instantanea.val();
    return Object.values(valor) as ReciboEjecucion[];
  }

  async guardarProcesamiento(procesamiento: ResultadoProcesamiento): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, this.rutaProcesamientos), procesamiento.recibo_id);
    await set(referencia, procesamiento);
  }

  async obtenerProcesamiento(eventoId: IdentificadorUnico): Promise<ResultadoProcesamiento | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, this.rutaProcesamientos), eventoId);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as ResultadoProcesamiento;
  }
}
