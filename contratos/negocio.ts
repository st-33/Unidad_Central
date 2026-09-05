import type { EntidadIdentificable, IdentificadorUnico } from './identidad';
import type { ConfiguracionNegocio } from './configuracion';

/**
 * Representa un negocio registrado bajo la supervisión de la Unidad Central.
 * Un negocio pertenece a una Categoría (contexto), pero tiene su propia
 * identidad y su propia configuración de capacidades.
 */
export interface Negocio extends EntidadIdentificable {
  readonly id: IdentificadorUnico;
  readonly categoriaId: IdentificadorUnico;
  readonly nombre: string;
  readonly nombreComercial: string;
  readonly activo: boolean;
  readonly configuracion: ConfiguracionNegocio;
}
