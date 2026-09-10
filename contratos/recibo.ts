import type { IdentificadorUnico } from './identidad';

/**
 * Tipo de operación que genera un cargo.
 */
export type TipoOperacionCobrable = 
  | 'entrega_domicilio'
  | 'servicio_logistica'
  | 'uso_plataforma';

/**
 * Estado del recibo.
 */
export type EstadoRecibo = 
  | 'pendiente'
  | 'completado'
  | 'rechazado'
  | 'cancelado';

/**
 * Canal desde donde se originó la operación.
 */
export type CanalOrigen = 
  | 'app_cliente'
  | 'app_negocio'
  | 'api_externa'
  | 'interno';

/**
 * Recibo de ejecución que Central consume desde servicios operativos.
 * 
 * Este contrato define qué información debe enviar un servicio operativo
 * (como Servicio a Domicilio) para que Central pueda:
 * 1. Verificar que la operación se completó
 * 2. Determinar si aplica cargo (según modalidad comercial)
 * 3. Registrar el evento para análisis y cobro posterior
 * 
 * IMPORTANTE:
 * - Central solo procesa recibos en estado 'completado'
 * - La lógica de cobro depende de la modalidad y suscripción del negocio
 * - Este contrato NO ejecuta cobros reales, solo registra eventos cobrables
 */
export interface ReciboEjecucion {
  readonly evento_id: IdentificadorUnico;
  readonly negocio_id_origen: IdentificadorUnico;
  readonly negocio_id_proveedor: IdentificadorUnico;
  readonly tipo_operacion: TipoOperacionCobrable;
  readonly mision_id?: IdentificadorUnico;
  readonly estado: EstadoRecibo;
  readonly timestamp_entrega: number;
  readonly tarifa_aplicada: number;
  readonly moneda: string;
  readonly canal_origen: CanalOrigen;
  readonly idempotencia_key: string;
  readonly metadatos?: Record<string, unknown>;
}

/**
 * Resultado del procesamiento de un recibo en Central.
 */
export interface ResultadoProcesamiento {
  readonly recibo_id: IdentificadorUnico;
  readonly cargo_aplicado: boolean;
  readonly monto_cargo: number;
  readonly razon: string;
  readonly timestamp_procesamiento: number;
}
