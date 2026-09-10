import type { ClaveCapacidad } from './capacidad';

/**
 * Estado concreto de una capacidad en un negocio específico.
 * 
 * IMPORTANTE: Esta estructura NO define QUÉ capacidades existen,
 * solo el estado (activa/inactiva) de las capacidades que el negocio puede usar.
 */
export interface EstadoCapacidadNegocio {
  readonly activa: boolean;
}

/**
 * Configuración operativa individual de un negocio dentro de la Unidad Central.
 * 
 * JERARQUÍA CANÓNICA:
 * - El negocio SOLO puede tener capacidades que su categoría permita.
 * - Este registro almacena el estado (activa/inactiva) de cada capacidad permitida.
 * - NO debe contener capacidades que la categoría del negocio no permite.
 */
export interface ConfiguracionNegocio {
  readonly capacidades: Readonly<Record<ClaveCapacidad, EstadoCapacidadNegocio>>;
}
