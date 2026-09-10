import type { IdentificadorUnico } from './identidad';

/**
 * Modalidad comercial del negocio.
 */
export type ModalidadComercial = 'suscripcion' | 'por_uso' | 'hibrido';

/**
 * Estado comercial del negocio.
 */
export type EstadoComercial = 'activo' | 'suspendido' | 'moroso' | 'prueba';

/**
 * Estado de suscripción.
 */
export type EstadoSuscripcion = 'vigente' | 'vencida' | 'cancelada' | 'ninguna';

/**
 * Configuración de peaje por uso.
 */
export interface ConfiguracionPeaje {
  readonly habilitado: boolean;
  readonly tarifa_base: number;
  readonly moneda: string;
}

/**
 * Información comercial de un negocio.
 * 
 * Central es fuente de verdad para:
 * - modalidad comercial
 * - estado comercial
 * - estado de suscripción
 * - configuración de peaje
 * 
 * NO maneja:
 * - pagos reales
 * - facturación
 * - procesamiento de tarjetas
 */
export interface InformacionComercial {
  readonly negocio_id: IdentificadorUnico;
  readonly modalidad: ModalidadComercial;
  readonly estado_comercial: EstadoComercial;
  readonly suscripcion_estado: EstadoSuscripcion;
  readonly suscripcion_vigencia?: number; // timestamp
  readonly peaje_config: ConfiguracionPeaje;
}
