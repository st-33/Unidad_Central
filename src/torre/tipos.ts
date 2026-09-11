/**
 * Módulos del sistema configurables para cada negocio
 */
export const MODULOS_SISTEMA = ['Reparto', 'KDS Cocina', 'Caja', 'Comandero'] as const;
export type ModuloSistema = typeof MODULOS_SISTEMA[number];

/**
 * Estructura limpia y plana del negocio en RTDB (minegocioaunclick)
 */
export interface NegocioRTDB {
  id: string;
  nombre: string;
  activo: boolean;
  codigo: string;
  limite: number;
  bloqueados: Record<string, boolean>;
  perfiles: string[];
  direccion?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  celular?: string;
  correo?: string;
}

/**
 * Datos capturados en la Ficha Técnica para crear o actualizar en RTDB
 */
export interface DatosFichaNegocio {
  nombre: string;
  activo: boolean;
  codigo: string;
  limite: number;
  bloqueados: Record<string, boolean>;
  perfiles: string[];
  direccion: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  celular: string;
  correo: string;
}

/**
 * Resultado devuelto tras escribir en RTDB
 */
export interface ResultadoOperacionRTDB {
  exito: boolean;
  mensaje: string;
  idGenerado?: string;
}
