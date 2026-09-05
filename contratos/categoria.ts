import type { EntidadIdentificable, IdentificadorUnico } from './identidad';

/**
 * Representa una categoría o rubro en el sistema Central (ej: Marisquerías, Verdulerías).
 * La categoría define el contexto del negocio, pero NO es un negocio ni contiene
 * la configuración completa de un negocio individual.
 */
export interface Categoria extends EntidadIdentificable {
  readonly id: IdentificadorUnico;
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly activa: boolean;
  readonly capacidadesDisponibles?: readonly string[];
}
