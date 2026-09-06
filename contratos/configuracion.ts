import type { ClaveCapacidad } from './capacidad';

/**
 * Estado propio de una capacidad en un negocio específico.
 */
export interface EstadoCapacidadNegocio {
  readonly activa: boolean;
}

/**
 * Configuración propia e individual de un negocio dentro de la Unidad Central.
 * Modela las capacidades activas que determinan la operación concreta del negocio.
 */
export interface ConfiguracionNegocio {
  readonly capacidades: Readonly<Record<ClaveCapacidad, EstadoCapacidadNegocio>>;
}
