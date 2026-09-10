import type { EntidadIdentificable, IdentificadorUnico } from './identidad';
import type { ClaveCapacidad } from './capacidad';

/**
 * Representa una categoría o rubro en el sistema Central (ej: Marisquerías, Verdulerías).
 * 
 * JERARQUÍA CANÓNICA:
 * - La categoría DEFINE el universo de capacidades aplicables a los negocios de su tipo.
 * - Solo las capacidades listadas en `capacidadesPermitidas` pueden ser activadas por negocios de esta categoría.
 * - La categoría NO es un negocio ni contiene configuración operativa de negocios individuales.
 */
export interface Categoria extends EntidadIdentificable {
  readonly categoria_id: IdentificadorUnico;
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly activa: boolean;
  /**
   * Lista de claves de capacidades que los negocios de esta categoría pueden usar.
   * Un negocio solo puede activar capacidades que su categoría permita.
   */
  readonly capacidades_permitidas: readonly ClaveCapacidad[];
}
