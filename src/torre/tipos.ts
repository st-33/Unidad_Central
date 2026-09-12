/**
 * Módulos del sistema configurables para cada negocio (limpios y directos)
 */
export const MODULOS_SISTEMA = ['Caja', 'Cocina', 'Mesero', 'Reparto'] as const;
export type ModuloSistema = typeof MODULOS_SISTEMA[number];

/**
 * Políticas de autorización para dispositivos y navegadores
 */
export interface PoliticaDispositivos {
  permitir_navegador_web: boolean;
  permitir_dispositivos_genericos: boolean;
  validar_hardware_estricto: boolean;
}

/**
 * Estructura de dispositivo vinculado al negocio
 */
export interface DispositivoVinculado {
  deviceId: string;
  alias?: string;
  nombre?: string;
  tipo?: 'caja' | 'comanda' | 'cocina' | 'administrador' | 'reparto' | 'otro';
  estado: 'activo' | 'bloqueado' | 'pendiente';
  nivelOperativo?: string;
  puedeCambiarRol?: boolean;
  rolesPermitidos?: Record<string, boolean>;
  brand?: string;
  marca?: string;
  model?: string;
  modelo?: string;
  systemName?: string;
  systemVersion?: string;
  isEmulator?: boolean;
  esWeb?: boolean;
  esGenerico?: boolean;
  clavePreautorizacion?: string;
  fechaRegistro?: number;
  ultimoAcceso?: number;
  ultimoHeartbeat?: number;
  vinculadoEn?: number;
  fecha_vinculacion?: string;
  ultima_conexion?: string;
}

/**
 * Estructura limpia del negocio en RTDB bajo /{Categoria}/{id}
 */
export interface NegocioRTDB {
  id: string; // Clave de 3 caracteres (ej: 'mpl')
  nombre: string; // Nombre comercial exacto (ej: 'Marisquería Puerto Libres')
  categoria: string; // Categoría padre (ej: 'Marisquerias')
  activo: boolean;
  codigo: string; // Código de acceso único (ej: 'PL2026-24')
  limite: number; // Límite numérico de dispositivos
  bloqueados: Record<string, boolean>; // Módulos bloqueados
  perfiles: string[]; // Roles operativos autorizados
  politicas_dispositivos?: PoliticaDispositivos;
  dispositivos?: Record<string, DispositivoVinculado>;
  dispositivos_autorizados?: Record<string, DispositivoVinculado>;
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
  categoria: string;
  activo: boolean;
  codigo: string;
  limite: number;
  bloqueados: Record<string, boolean>;
  perfiles: string[];
  politicas_dispositivos?: PoliticaDispositivos;
  direccion: string;
  instagram: string;
  facebook: string;
  whatsapp: string;
  celular: string;
  correo: string;
}

/**
 * Ficha Maestra almacenada en Unidad Central (base-principal-ma1) bajo /torre_control/negocios/{id}
 */
export interface FichaMaestraTorreCentral {
  id: string;
  nombre: string;
  categoria: string;
  activo: boolean;
  codigo: string;
  limite_dispositivos: number;
  modulos_bloqueados: Record<string, boolean>;
  perfiles_autorizados: string[];
  politica_dispositivos: PoliticaDispositivos;
  contacto: {
    direccion?: string;
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    celular?: string;
    correo?: string;
  };
  metadatos: {
    creado_en: number;
    actualizado_en: number;
    origen: string;
  };
}

/**
 * Resultado devuelto tras escribir en RTDB
 */
export interface ResultadoOperacionRTDB {
  exito: boolean;
  mensaje: string;
  idGenerado?: string;
  rutaRTDB?: string;
  idNegocio?: string;
  categoria?: string;
}

export type ResultadoEscrituraRTDB = ResultadoOperacionRTDB;
export type ResultadoEliminacionRTDB = ResultadoOperacionRTDB;

/**
 * Reporte de auditoría e integración técnica para la aplicación de negocio.
 * Consolida /codigo_acceso como FUENTE CONTRACTUAL ÚNICA.
 */
export interface AuditoriaNegocioReporte {
  idNegocio: string;
  nombreNegocio: string;
  categoria: string;
  codigoAcceso: string;
  rutaEsperada: string;
  activo: boolean;
  limiteDispositivos: number;

  // CONTRATO NORMATIVO ÚNICO
  indiceCodigoAcceso: {
    existe: boolean;
    rutaApunta: string | null;
    coincide: boolean;
  };
  contratoUnicoValido: boolean;

  // ESTADO DE RESIDUO / COMPATIBILIDAD LEGACY
  estadoLegacyAccessCodes: {
    presenteEnRTDB: boolean;
    rutaApunta: string | null;
    requierePurga: boolean;
  };

  // Dispositivos
  dispositivosOperativosTotal: number;
  dispositivosAutorizadosTotal: number;
  cuposDisponibles: number;
  politicasDispositivos: PoliticaDispositivos;

  // Módulos y Perfiles
  modulosBloqueados: Record<string, boolean>;
  perfilesAutorizados: string[];

  // Diagnóstico
  hallazgos: {
    tipo: 'exito' | 'advertencia' | 'error' | 'info';
    titulo: string;
    descripcion: string;
  }[];
}

/**
 * Resultado de la consolidación de claves hacia el contrato único codigo_acceso
 */
export interface ResultadoConsolidacionCodigoAcceso {
  exito: boolean;
  mensaje: string;
  totalCodigoAcceso: number;
  clavesMigradasDesdeLegacy: number;
  clavesConsistentes: number;
  detalles: string[];
}

/**
 * Resultado de la purga controlada del nodo legacy /access_codes
 */
export interface ResultadoPurgaLegacy {
  exito: boolean;
  mensaje: string;
  registrosPurgados: number;
  detalles: string[];
}

/**
 * Negocio analizado dentro de la unidad de integración de la Categoría
 */
export interface ItemNegocioCategoria {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
  rutaEsperada: string;
  rutaEnCodigoAcceso: string | null;
  estadoContrato: 'valido' | 'desalineado' | 'ausente';
}

/**
 * Reporte Técnico de Integración y Orquestación por Categoría.
 * La Categoría ID es la unidad de integración del sistema:
 * todos los negocios pertenecientes a ella heredan el mismo contrato y aplicación.
 */
export interface ReporteIntegracionCategoria {
  categoriaId: string;
  totalNegocios: number;
  negocios: ItemNegocioCategoria[];

  // Estado del Contrato Normativo Único: /codigo_acceso
  contratoCodigoAcceso: {
    totalEnRTDB: number;
    totalAsignadosCategoria: number;
    clavesValidas: number;
    clavesDesalineadas: number;
    clavesAusentes: number;
    cumplimientoPorcentaje: number;
  };

  // Estado del nodo legacy en RTDB: /access_codes
  estadoLegacyRTDB: {
    nodoPresente: boolean;
    totalClavesLegacy: number;
    claves: Record<string, string>;
  };

  // Diagnóstico y Orquestación Operativa (5 dimensiones clave)
  diagnostico: {
    categoriaAfectada: string;
    parteContratoAfectada: string;
    accionRequeridaModelo: string;
    cambiosEjecutadosTorre: string[];
    pendientesModeloCategoria: string[];
  };

  // Instrucción concreta lista para emitir al modelo de la categoría
  instruccionModeloCategoria: string;
}

/**
 * Alias de compatibilidad transitoria mientras se completa la migración
 */
export type ResultadoArmonizacion = ResultadoConsolidacionCodigoAcceso;
