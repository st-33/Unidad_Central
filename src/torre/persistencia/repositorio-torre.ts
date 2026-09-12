import { ref, onValue, get, update } from 'firebase/database';
import {
  obtenerBaseDatosNegocios,
  URL_RTDB_NEGOCIOS,
  URL_RTDB_CENTRAL,
} from './conexion-rtdb';
import type {
  NegocioRTDB,
  DatosFichaNegocio,
  ResultadoEscrituraRTDB,
  ResultadoEliminacionRTDB,
  AuditoriaNegocioReporte,
  ReporteIntegracionCategoria,
  ResultadoConsolidacionCodigoAcceso,
  ResultadoPurgaLegacy,
  ResultadoArmonizacion,
  DispositivoVinculado,
  PoliticaDispositivos,
} from '../tipos';
import { moduloDispositivosRtdb } from './dispositivos-rtdb';
import { moduloAuditoriaContrato } from './auditoria-contrato';

/**
 * Contrato de interfaz para el Repositorio de Torre de Control.
 * Permite inyección de dependencias y pruebas unitarias / mocks en memoria.
 */
export interface RepositorioTorre {
  listarNegociosPorCategoria(categoria: string): Promise<readonly NegocioRTDB[]>;
  suscribirNegociosPorCategoria(
    categoria: string,
    alActualizar: (negocios: readonly NegocioRTDB[]) => void
  ): () => void;
  listarCategorias(): Promise<readonly string[]>;
  obtenerRutaPorCodigoAcceso(codigo: string): Promise<string | null>;
  guardarNegocio(
    datos: DatosFichaNegocio | NegocioRTDB,
    idExistenteOCodigoAnterior?: string,
    codigoAnteriorOCategoriaAnterior?: string,
    categoriaAnterior?: string
  ): Promise<ResultadoEscrituraRTDB | void>;
  eliminarNegocio(
    categoria: string,
    id: string,
    codigo?: string
  ): Promise<ResultadoEliminacionRTDB | void>;
  obtenerDispositivos(categoria: string, id: string): Promise<Record<string, DispositivoVinculado>>;
  actualizarEstadoDispositivo(
    categoria: string,
    id: string,
    deviceId: string,
    estado: 'activo' | 'bloqueado'
  ): Promise<void>;
  eliminarDispositivo(categoria: string, id: string, deviceId: string): Promise<void>;
  autorizarNuevoDispositivo(
    categoria: string,
    id: string,
    dispositivo: DispositivoVinculado
  ): Promise<void>;
  actualizarPoliticaDispositivos(
    categoria: string,
    id: string,
    politicas: PoliticaDispositivos
  ): Promise<void>;
  auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte>;
  auditarCategoria(categoria: string): Promise<ReporteIntegracionCategoria>;
  consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso>;
  purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy>;
  armonizarDobleIndice(): Promise<ResultadoArmonizacion>;
}

/**
 * Repositorio Oficial de Torre de Control para RTDB.
 * Orquesta persistencia de Negocios y delega dispositivos y auditoría.
 */
export class RepositorioTorreRtdb implements RepositorioTorre {
  readonly nodoCodigoAcceso = 'codigo_acceso';
  readonly nodoLegacyAccessCodes = 'access_codes';

  private normalizarNodoCategoria(categoria: string): string {
    const limpia = categoria.trim();
    if (!limpia) return 'Marisquerias';
    return limpia.charAt(0).toUpperCase() + limpia.slice(1);
  }

  /**
   * Genera el ID técnico corto (máx 3 letras) determinísticamente a partir del nombre comercial.
   */
  private generarIdTecnico(nombre: string): string {
    const limpio = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    const palabras = limpio.split(/\s+/).filter(Boolean);

    if (palabras.length === 1) {
      return palabras[0].substring(0, 3);
    }
    if (palabras.length === 2) {
      return (palabras[0].substring(0, 1) + palabras[1].substring(0, 2)).substring(0, 3);
    }
    return palabras
      .slice(0, 3)
      .map((p) => p[0])
      .join('')
      .substring(0, 3);
  }

  /**
   * Lista en tiempo real todos los negocios de una categoría
   */
  suscribirNegociosPorCategoria(
    categoria: string,
    alActualizar: (negocios: readonly NegocioRTDB[]) => void
  ): () => void {
    const nodoCat = this.normalizarNodoCategoria(categoria);

    try {
      const db = obtenerBaseDatosNegocios();
      const referenciaCat = ref(db, nodoCat);

      const cancelar = onValue(
        referenciaCat,
        (snapshot) => {
          if (!snapshot.exists()) {
            alActualizar([]);
            return;
          }
          const data = snapshot.val() as Record<string, unknown>;
          const lista = this.transformarMapaEnLista(data, nodoCat);
          alActualizar(lista);
        },
        async () => {
          const listaRest = await this.listarViaRest(nodoCat);
          alActualizar(listaRest);
        }
      );

      return cancelar;
    } catch {
      this.listarViaRest(nodoCat).then(alActualizar);
      return () => {};
    }
  }

  /**
   * Obtiene la lista de negocios de una categoría (Lectura puntual)
   */
  async listarNegociosPorCategoria(categoria: string): Promise<readonly NegocioRTDB[]> {
    const nodoCat = this.normalizarNodoCategoria(categoria);

    try {
      const db = obtenerBaseDatosNegocios();
      const snapshot = await get(ref(db, nodoCat));
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, unknown>;
        return this.transformarMapaEnLista(data, nodoCat);
      }
      return this.listarViaRest(nodoCat);
    } catch {
      return this.listarViaRest(nodoCat);
    }
  }

  /**
   * Lista todas las categorías descubiertas en la RTDB
   */
  async listarCategorias(): Promise<readonly string[]> {
    try {
      const res = await fetch(`${URL_RTDB_NEGOCIOS}/.json?shallow=true`);
      if (!res.ok) return ['Marisquerias'];
      const data = (await res.json()) as Record<string, boolean> | null;
      if (!data) return ['Marisquerias'];

      const categorias = Object.keys(data).filter(
        (k) =>
          k !== 'access_codes' &&
          k !== 'codigo_acceso' &&
          k !== 'indice_codigos' &&
          k !== 'torre_control' &&
          k !== 'auditoria' &&
          !k.startsWith('_') &&
          !k.startsWith('.')
      );

      if (!categorias.includes('Marisquerias')) {
        categorias.unshift('Marisquerias');
      }

      return categorias.sort();
    } catch {
      return ['Marisquerias'];
    }
  }

  /**
   * Resuelve la ruta operativa O(1) consultando el contrato único /codigo_acceso
   */
  async obtenerRutaPorCodigoAcceso(codigo: string): Promise<string | null> {
    const cod = codigo.trim().toUpperCase().replace(/\s+/g, '');
    if (!cod) return null;

    try {
      const res = await fetch(`${URL_RTDB_NEGOCIOS}/${this.nodoCodigoAcceso}/${encodeURIComponent(cod)}.json`);
      if (res.ok) {
        const val = await res.json();
        if (typeof val === 'string' && val.trim()) return val.trim();
      }
    } catch {
      // Continuar con fallback SDK
    }

    try {
      const db = obtenerBaseDatosNegocios();
      const snap = await get(ref(db, `${this.nodoCodigoAcceso}/${cod}`));
      if (snap.exists() && typeof snap.val() === 'string') {
        return snap.val();
      }
    } catch {
      // Sin resultado
    }

    return null;
  }

  /**
   * Registra o actualiza un negocio atómicamente.
   */
  async guardarNegocio(
    datos: DatosFichaNegocio | NegocioRTDB,
    idExistenteOCodigoAnterior?: string,
    codigoAnteriorOCategoriaAnterior?: string,
    categoriaAnteriorParam?: string
  ): Promise<ResultadoEscrituraRTDB> {
    let idExistente: string | undefined;
    let codigoAnterior: string | undefined;
    let categoriaAnterior: string | undefined;

    if ('id' in datos && typeof (datos as NegocioRTDB).id === 'string') {
      idExistente = (datos as NegocioRTDB).id;
      codigoAnterior = idExistenteOCodigoAnterior;
      categoriaAnterior = codigoAnteriorOCategoriaAnterior;
    } else {
      idExistente = idExistenteOCodigoAnterior;
      codigoAnterior = codigoAnteriorOCategoriaAnterior;
      categoriaAnterior = categoriaAnteriorParam;
    }

    const id = idExistente || this.generarIdTecnico(datos.nombre);
    const nodoCat = this.normalizarNodoCategoria(datos.categoria);
    const codigo = datos.codigo.trim().toUpperCase().replace(/\s+/g, '');

    if (!codigo) {
      return {
        exito: false,
        mensaje: 'El código de acceso no puede estar vacío.',
        idNegocio: id,
        categoria: nodoCat,
      };
    }

    // 1. Validar colisiones en /codigo_acceso
    const rutaEnIndice = await this.obtenerRutaPorCodigoAcceso(codigo);
    const rutaDestinoEsperada = `${nodoCat}/${id}`;

    if (rutaEnIndice && rutaEnIndice.toLowerCase() !== rutaDestinoEsperada.toLowerCase()) {
      if (!idExistente || (codigoAnterior && codigoAnterior !== codigo)) {
        return {
          exito: false,
          mensaje: `El código "${codigo}" ya está asignado a otro negocio ("${rutaEnIndice}").`,
          idNegocio: id,
          categoria: nodoCat,
        };
      }
    }

    // 2. Cargar datos existentes para preservar
    let datosPrevios: Record<string, unknown> = {};
    if (idExistente) {
      try {
        const catPrevia = categoriaAnterior
          ? this.normalizarNodoCategoria(categoriaAnterior)
          : nodoCat;
        const resPrev = await fetch(`${URL_RTDB_NEGOCIOS}/${catPrevia}/${idExistente}.json`);
        if (resPrev.ok) {
          datosPrevios = ((await resPrev.json()) || {}) as Record<string, unknown>;
        }
      } catch {
        datosPrevios = {};
      }
    }

    const payloadNegocio: Record<string, unknown> = {
      id,
      nombre: datos.nombre,
      categoria: nodoCat,
      activo: datos.activo,
      codigo,
      limite: datos.limite,
      bloqueados: datos.bloqueados || {},
      perfiles: datos.perfiles || [],
      direccion: datos.direccion || '',
      instagram: datos.instagram || '',
      facebook: datos.facebook || '',
      whatsapp: datos.whatsapp || '',
      celular: datos.celular || '',
      correo: datos.correo || '',
      fecha_actualizacion: new Date().toISOString(),
    };

    if (datos.politicas_dispositivos) {
      payloadNegocio.politicas_dispositivos = datos.politicas_dispositivos;
    } else if (datosPrevios.politicas_dispositivos) {
      payloadNegocio.politicas_dispositivos = datosPrevios.politicas_dispositivos;
    } else {
      payloadNegocio.politicas_dispositivos = {
        permitir_navegador_web: true,
        permitir_dispositivos_genericos: true,
        validar_hardware_estricto: false,
      };
    }

    if (datosPrevios.dispositivos) payloadNegocio.dispositivos = datosPrevios.dispositivos;
    if (datosPrevios.dispositivos_autorizados) {
      payloadNegocio.dispositivos_autorizados = datosPrevios.dispositivos_autorizados;
    }
    if (datosPrevios.fecha_creacion) {
      payloadNegocio.fecha_creacion = datosPrevios.fecha_creacion;
    } else {
      payloadNegocio.fecha_creacion = new Date().toISOString();
    }

    // 3. Construir actualizaciones atómicas
    const updatesOperativos: Record<string, unknown> = {
      [`${nodoCat}/${id}`]: payloadNegocio,
      [`${this.nodoCodigoAcceso}/${codigo}`]: rutaDestinoEsperada,
    };

    // Si cambió el código, liberar el anterior
    if (codigoAnterior && codigoAnterior !== codigo) {
      updatesOperativos[`${this.nodoCodigoAcceso}/${codigoAnterior}`] = null;
      updatesOperativos[`${this.nodoLegacyAccessCodes}/${codigoAnterior}`] = null;
    }

    // Si cambió de categoría, eliminar de la previa
    if (categoriaAnterior && categoriaAnterior !== datos.categoria && idExistente) {
      const catPrevia = this.normalizarNodoCategoria(categoriaAnterior);
      updatesOperativos[`${catPrevia}/${idExistente}`] = null;
    }

    // 4. Impactar RTDB Negocios
    try {
      const db = obtenerBaseDatosNegocios();
      await update(ref(db), updatesOperativos);
    } catch {
      const res = await fetch(`${URL_RTDB_NEGOCIOS}/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatesOperativos),
      });
      if (!res.ok) {
        throw new Error(`Error HTTP al escribir en RTDB Negocios: ${res.statusText}`);
      }
    }

    // 5. Impactar RTDB Central (respaldo maestro)
    try {
      const updatesCentral: Record<string, unknown> = {
        [`torre_control/negocios/${id}`]: {
          ...payloadNegocio,
          rtdb_origen: URL_RTDB_NEGOCIOS,
          nodo_operativo: rutaDestinoEsperada,
          sincronizado_en: new Date().toISOString(),
        },
        [`torre_control/indice_codigos/${codigo}`]: {
          idNegocio: id,
          categoria: nodoCat,
          ruta: rutaDestinoEsperada,
          sincronizado_en: new Date().toISOString(),
        },
      };

      if (codigoAnterior && codigoAnterior !== codigo) {
        updatesCentral[`torre_control/indice_codigos/${codigoAnterior}`] = null;
      }

      await fetch(`${URL_RTDB_CENTRAL}/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatesCentral),
      });
    } catch {
      // Respaldo central resiliente
    }

    return {
      exito: true,
      mensaje: idExistente
        ? `Negocio "${datos.nombre}" actualizado con éxito en /${nodoCat}/${id} y contrato /${this.nodoCodigoAcceso}/${codigo}.`
        : `Negocio "${datos.nombre}" registrado con éxito en /${nodoCat}/${id} y contrato /${this.nodoCodigoAcceso}/${codigo}.`,
      idNegocio: id,
      categoria: nodoCat,
    };
  }

  /**
   * Elimina un negocio de la RTDB liberando su código de acceso.
   */
  async eliminarNegocio(
    categoria: string,
    id: string,
    codigo?: string
  ): Promise<ResultadoEliminacionRTDB> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();

    let codigoAEliminar = codigo?.trim().toUpperCase();
    if (!codigoAEliminar) {
      try {
        const res = await fetch(`${URL_RTDB_NEGOCIOS}/${nodoCat}/${idLimpio}/codigo.json`);
        if (res.ok) {
          const val = await res.json();
          if (typeof val === 'string') codigoAEliminar = val.trim().toUpperCase();
        }
      } catch {
        // Continuar
      }
    }

    const updatesOperativos: Record<string, null> = {
      [`${nodoCat}/${idLimpio}`]: null,
    };

    if (codigoAEliminar) {
      updatesOperativos[`${this.nodoCodigoAcceso}/${codigoAEliminar}`] = null;
      updatesOperativos[`${this.nodoLegacyAccessCodes}/${codigoAEliminar}`] = null;
    }

    try {
      const db = obtenerBaseDatosNegocios();
      await update(ref(db), updatesOperativos);
    } catch {
      await fetch(`${URL_RTDB_NEGOCIOS}/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatesOperativos),
      });
    }

    try {
      const updatesCentral: Record<string, null> = {
        [`torre_control/negocios/${idLimpio}`]: null,
      };
      if (codigoAEliminar) {
        updatesCentral[`torre_control/indice_codigos/${codigoAEliminar}`] = null;
      }
      await fetch(`${URL_RTDB_CENTRAL}/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatesCentral),
      });
    } catch {
      // Fallback
    }

    return {
      exito: true,
      mensaje: `Negocio "${idLimpio}" retirado con éxito de /${nodoCat} y liberado /${this.nodoCodigoAcceso}/${codigoAEliminar || ''}.`,
      idNegocio: idLimpio,
    };
  }

  // --- DELEGACIONES A MÓDULOS ESPECIALIZADOS ---

  obtenerDispositivos(categoria: string, id: string): Promise<Record<string, DispositivoVinculado>> {
    return moduloDispositivosRtdb.obtenerDispositivos(categoria, id);
  }

  actualizarEstadoDispositivo(
    categoria: string,
    id: string,
    deviceId: string,
    estado: 'activo' | 'bloqueado'
  ): Promise<void> {
    return moduloDispositivosRtdb.actualizarEstadoDispositivo(categoria, id, deviceId, estado);
  }

  eliminarDispositivo(categoria: string, id: string, deviceId: string): Promise<void> {
    return moduloDispositivosRtdb.eliminarDispositivo(categoria, id, deviceId);
  }

  autorizarNuevoDispositivo(
    categoria: string,
    id: string,
    dispositivo: DispositivoVinculado
  ): Promise<void> {
    return moduloDispositivosRtdb.autorizarNuevoDispositivo(categoria, id, dispositivo);
  }

  actualizarPoliticaDispositivos(
    categoria: string,
    id: string,
    politicas: PoliticaDispositivos
  ): Promise<void> {
    return moduloDispositivosRtdb.actualizarPoliticaDispositivos(categoria, id, politicas);
  }

  auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte> {
    return moduloAuditoriaContrato.auditarNegocio(categoria, id);
  }

  async auditarCategoria(categoria: string): Promise<ReporteIntegracionCategoria> {
    const listaNegocios = await this.listarNegociosPorCategoria(categoria);
    return moduloAuditoriaContrato.auditarCategoria(categoria, listaNegocios);
  }

  consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso> {
    return moduloAuditoriaContrato.consolidarContratoCodigoAcceso();
  }

  purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy> {
    return moduloAuditoriaContrato.purgarNodoLegacyAccessCodes();
  }

  armonizarDobleIndice(): Promise<ResultadoArmonizacion> {
    return moduloAuditoriaContrato.armonizarDobleIndice();
  }

  private async listarViaRest(nodoCat: string): Promise<readonly NegocioRTDB[]> {
    const url = `${URL_RTDB_NEGOCIOS}/${nodoCat}.json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown> | null;
    if (!data) return [];
    return this.transformarMapaEnLista(data, nodoCat);
  }

  private transformarMapaEnLista(
    mapa: Record<string, unknown>,
    categoriaDefault: string
  ): readonly NegocioRTDB[] {
    const lista: NegocioRTDB[] = [];

    for (const [clave, valor] of Object.entries(mapa)) {
      if (!valor || typeof valor !== 'object') continue;

      const obj = valor as Record<string, unknown>;
      const nombre = typeof obj.nombre === 'string' ? obj.nombre : clave;
      const activo = typeof obj.activo === 'boolean' ? obj.activo : true;
      const codigo = typeof obj.codigo === 'string' ? obj.codigo : '';
      const limite = typeof obj.limite === 'number' ? obj.limite : 1;
      const cat = typeof obj.categoria === 'string' ? obj.categoria : categoriaDefault;
      const bloqueados =
        obj.bloqueados && typeof obj.bloqueados === 'object'
          ? (obj.bloqueados as Record<string, boolean>)
          : {};
      const perfiles = Array.isArray(obj.perfiles) ? (obj.perfiles as string[]) : [];

      lista.push({
        id: typeof obj.id === 'string' && obj.id ? obj.id : clave,
        nombre,
        categoria: cat,
        activo,
        codigo,
        limite,
        bloqueados,
        perfiles,
        politicas_dispositivos: obj.politicas_dispositivos as PoliticaDispositivos | undefined,
        dispositivos: obj.dispositivos as Record<string, DispositivoVinculado> | undefined,
        dispositivos_autorizados: obj.dispositivos_autorizados as
          | Record<string, DispositivoVinculado>
          | undefined,
        direccion: typeof obj.direccion === 'string' ? obj.direccion : '',
        instagram: typeof obj.instagram === 'string' ? obj.instagram : '',
        facebook: typeof obj.facebook === 'string' ? obj.facebook : '',
        whatsapp: typeof obj.whatsapp === 'string' ? obj.whatsapp : '',
        celular: typeof obj.celular === 'string' ? obj.celular : '',
        correo: typeof obj.correo === 'string' ? obj.correo : '',
      });
    }

    return lista;
  }
}

export const repositorioTorreRtdb = new RepositorioTorreRtdb();
