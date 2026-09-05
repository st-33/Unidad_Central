import type { EntidadIdentificable, IdentificadorUnico } from './identidad';

/**
 * Clave identificadora de una capacidad operativa o funcional dentro del sistema.
 */
export type ClaveCapacidad = string;

/**
 * Representa la definición formal de una capacidad en la Unidad Central.
 * Un negocio activa o desactiva capacidades según su operación real.
 */
export interface DefinicionCapacidad extends EntidadIdentificable {
  readonly id: IdentificadorUnico;
  readonly clave: ClaveCapacidad;
  readonly nombre: string;
  readonly descripcion: string;
  readonly obligatoriaParaCategorias?: readonly string[];
}
