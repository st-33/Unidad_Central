import type { EntidadIdentificable, IdentificadorUnico } from './identidad';

/**
 * Clave identificadora de una capacidad operativa o funcional dentro del sistema.
 */
export type ClaveCapacidad = string;

/**
 * Representa la definición GLOBAL de una capacidad en la Unidad Central.
 * 
 * JERARQUÍA CANÓNICA:
 * - Las capacidades existen GLOBALMENTE como definiciones reusables.
 * - Una CATEGORÍA decide qué capacidades aplican a su tipo de negocio.
 * - Un NEGOCIO decide cuáles de las capacidades permitidas por su categoría están activas.
 * 
 * Ejemplo:
 * - Capacidad global: "reparto" (existe para todo el sistema)
 * - Categoría Marisquerías: permite ["mostrador", "bascula", "reparto"]
 * - Negocio "Marisquería Puerto Libres": activa ["mostrador", "bascula"], desactiva "reparto"
 */
export interface DefinicionCapacidad extends EntidadIdentificable {
  readonly id: IdentificadorUnico;
  readonly clave: ClaveCapacidad;
  readonly nombre: string;
  readonly descripcion: string;
  /**
   * Si true, esta capacidad está disponible para asignarse a categorías.
   * Si false, la capacidad está en desuso y no debe asignarse a nuevas categorías.
   */
  readonly disponible: boolean;
}
