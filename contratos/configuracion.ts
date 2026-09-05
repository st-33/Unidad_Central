import type { ClaveCapacidad } from './capacidad';

/**
 * Estado y ajuste específico de una capacidad particular en un negocio.
 */
export interface AjusteCapacidadNegocio {
  readonly activa: boolean;
  readonly opciones?: Readonly<Record<string, unknown>>;
}

/**
 * Configuración propia e individual de un negocio dentro de la Unidad Central.
 * Modela las capacidades activas y los parámetros operativos propios.
 */
export interface ConfiguracionNegocio {
  readonly capacidades: Readonly<Record<ClaveCapacidad, AjusteCapacidadNegocio>>;
  readonly parametros?: Readonly<Record<string, unknown>>;
}
