/**
 * Contratos de exportación que Central provee hacia los repositorios operativos
 * (Marisquerías, Verdulerías, Servicio a Domicilio, etc.).
 * 
 * PRINCIPIO FUNDAMENTAL:
 * Central SOLO expone: identidad de negocio, categoría y capacidades habilitadas.
 * Central NO provee: tarifas, inventarios, disponibilidad de repartidores, pedidos, etc.
 * 
 * Los repositorios operativos consultan esta configuración para conocer su contexto
 * y las funcionalidades que tienen permitidas.
 */

import type { IdentificadorUnico } from './identidad';
import type { ClaveCapacidad } from './capacidad';

/**
 * Payload de configuración que un negocio recibe de Central.
 * Contiene ÚNICAMENTE la información estructural que Central administra.
 */
export interface ConfiguracionNegocioExportada {
  /**
   * Identificador único del negocio en el ecosistema ADI.
   */
  readonly idNegocio: IdentificadorUnico;

  /**
   * Nombre comercial del negocio.
   */
  readonly nombreComercial: string;

  /**
   * Identificador de la categoría a la que pertenece el negocio.
   */
  readonly categoriaId: IdentificadorUnico;

  /**
   * Nombre legible de la categoría (para UI/informes).
   */
  readonly categoriaNombre: string;

  /**
   * Clave técnica de la categoría (para lógica de negocio).
   */
  readonly categoriaClave: string;

  /**
   * Lista de claves de capacidades que este negocio tiene ACTIVAS.
   * Solo incluye las capacidades habilitadas (activa: true).
   */
  readonly capacidadesActivas: readonly ClaveCapacidad[];

  /**
   * Indica si el negocio está operativo o suspendido.
   */
  readonly activo: boolean;
}

/**
 * Payload de catálogo de capacidades globales.
 * Útil para que los repositorios conozcan las capacidades disponibles en el sistema.
 */
export interface CapacidadExportada {
  readonly clave: ClaveCapacidad;
  readonly nombre: string;
  readonly descripcion: string;
}

/**
 * Payload de información de categoría.
 * Útil para que los repositorios entiendan su contexto sectorial.
 */
export interface CategoriaExportada {
  readonly id: IdentificadorUnico;
  readonly clave: string;
  readonly nombre: string;
  readonly descripcion: string;
  readonly capacidadesPermitidas: readonly ClaveCapacidad[];
}
