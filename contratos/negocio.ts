import type { EntidadIdentificable, IdentificadorUnico } from './identidad';
import type { ConfiguracionNegocio } from './configuracion';

/**
 * Representa un negocio registrado bajo la supervisión de la Unidad Central.
 * 
 * JERARQUÍA CANÓNICA:
 * - Un negocio PERTENECE a una Categoría (contexto sectorial).
 * - Un negocio tiene identidad propia y configuración independiente.
 * - Un negocio SOLO puede activar capacidades permitidas por su categoría.
 * 
 * Ejemplo de jerarquía:
 * Categoría: Marisquerías (permite: mostrador, bascula, reparto)
 *   ↓
 * Negocio: "Marisquería Puerto Libres" (activa: mostrador, bascula | desactiva: reparto)
 *   ↓
 * Configuración: Define qué capacidades están operativas en este negocio específico
 */
export interface Negocio extends EntidadIdentificable {
  readonly negocio_id: IdentificadorUnico;
  readonly categoria_id: IdentificadorUnico;
  readonly nombre: string;
  readonly nombre_comercial: string;
  readonly activo: boolean;
  readonly configuracion: ConfiguracionNegocio;
  readonly ruta_operativa?: string;
  readonly alias?: readonly string[];
}
