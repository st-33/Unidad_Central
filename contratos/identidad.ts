/**
 * Contrato base de identidad y marcas temporales para entidades de la Unidad Central.
 * No depende de ningún framework ni infraestructura de persistencia.
 */

export type IdentificadorUnico = string;

export interface MetadatosRegistro {
  creadoEn: number;
  actualizadoEn: number;
}

export interface EntidadIdentificable {
  readonly id: IdentificadorUnico;
  readonly metadatos?: MetadatosRegistro;
}
