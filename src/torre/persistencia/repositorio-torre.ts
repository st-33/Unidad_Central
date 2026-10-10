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
} from '../tipos';
import { moduloAuditoriaContrato } from './auditoria-contrato';
import { generarNegocioNombreId, sanitizarNombreCategoria } from '../logica/generador-clave';

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
  registrarCategoria(
    nombre: string,
    rtdbUrl?: string
  ): Promise<{ exito: boolean; mensaje: string; categoria: string }>;
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
  auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte>;
  auditarCategoria(categoria: string): Promise<ReporteIntegracionCategoria>;
  consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso>;
  purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy>;
  armonizarDobleIndice(): Promise<ResultadoArmonizacion>;
}

/**
 * Repositorio Oficial de Torre de Control para RTDB.
 * Orquesta persistencia de Negocios y auditoría de contratos.
 */
export class RepositorioTorreRtdb implements RepositorioTorre {
  readonly nodoCodigoAcceso = 'codigo_acceso';
  readonly nodoLegacyAccessCodes = 'access_codes';

  private normalizarNodoCategoria(categoria: string): string {
    const limpia = sanitizarNombreCategoria(categoria);
    if (!limpia) return 'Marisquerias';
    return limpia;
  }

  /**
   * Genera el ID canónico de negocio a partir de su nombre comercial.
   */
  private generarIdTecnico(nombre: string, existentes: readonly string[] = []): string {
    return generarNegocioNombreId(nombre, existentes);
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
   * Registra una nueva categoría escribiendo su nodo raíz en la RTDB destino
   * y respaldándola en la RTDB central de Torre de Control.
   */
  async registrarCategoria(
    nombre: string,
    rtdbUrl?: string
  ): Promise<{ exito: boolean; mensaje: string; categoria: string }> {
    const categoriaSanitizada = sanitizarNombreCategoria(nombre);
    if (!categoriaSanitizada) {
      return {
        exito: false,
        mensaje: 'El nombre de la categoría es inválido.',
        categoria: '',
      };
    }

    const urlDestino =
      rtdbUrl && rtdbUrl.trim()
        ? rtdbUrl.trim().replace(/\/+$/, '')
        : URL_RTDB_NEGOCIOS;

    try {
      // 1. Escribir nodo padre en la URL destino (RTDB de la categoría)
      const res = await fetch(`${urlDestino}/.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [categoriaSanitizada]: {} }),
      });
      if (!res.ok) {
        throw new Error(`Fallo HTTP al crear nodo en ${urlDestino}: ${res.statusText}`);
      }

      // 2. Registrar en la RTDB Central de Torre de Control
      await fetch(
        `${URL_RTDB_CENTRAL}/torre_control/categorias/${encodeURIComponent(categoriaSanitizada)}.json`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: categoriaSanitizada,
            rtdb_url: urlDestino,
            creada_en: new Date().toISOString(),
          }),
        }
      );

      return {
        exito: true,
        mensaje: `Categoría "${categoriaSanitizada}" registrada con éxito en ${urlDestino}`,
        categoria: categoriaSanitizada,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        exito: false,
        mensaje: `Error al registrar categoría: ${errorMsg}`,
        categoria: categoriaSanitizada,
      };
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

    // Cascarón Canónico Operativo para la RTDB de la Categoría (gobernanza limpia, cero datos de contacto)
    const cascaronOperativo: Record<string, unknown> = {
      activo: datos.activo,
      codigo,
      limite: datos.limite,
      perfiles: datos.perfiles && datos.perfiles.length > 0
        ? datos.perfiles
        : ['Administrador', 'Operador', 'Supervisor'],
      bloqueados: datos.bloqueados || {},
      fecha_actualizacion: new Date().toISOString(),
    };

    if (datosPrevios.fecha_creacion) {
      cascaronOperativo.fecha_creacion = datosPrevios.fecha_creacion;
    } else {
      cascaronOperativo.fecha_creacion = new Date().toISOString();
    }

    // 3. Construir actualizaciones atómicas para la RTDB de Categorías
    const updatesOperativos: Record<string, unknown> = {
      [`${nodoCat}/${id}`]: cascaronOperativo,
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

    // 5. Impactar RTDB Central de Torre de Control (Expediente Maestro + Directorio IA)
    try {
      const fichaMaestraCentral: Record<string, unknown> = {
        id,
        nombre_comercial: datos.nombre,
        categoria: nodoCat,
        codigo_acceso: codigo,
        activo: datos.activo,
        limite_dispositivos: datos.limite,
        bloqueados: datos.bloqueados || {},
        perfiles: cascaronOperativo.perfiles,
        contacto: {
          instagram: datos.instagram || '',
          facebook: datos.facebook || '',
          whatsapp: datos.whatsapp || '',
          celular: datos.celular || '',
          correo: datos.correo || '',
        },
        direccion: {
          barrio_colonia: (datos as DatosFichaNegocio).barrio_colonia || '',
          calle_avenida: (datos as DatosFichaNegocio).calle_avenida || '',
          numero: (datos as DatosFichaNegocio).numero || '',
          referencia: (datos as DatosFichaNegocio).referencia || '',
          direccion_completa: datos.direccion || '',
        },
        rtdb_origen: URL_RTDB_NEGOCIOS,
        nodo_operativo: rutaDestinoEsperada,
        sincronizado_en: new Date().toISOString(),
      };

      const updatesCentral: Record<string, unknown> = {
        [`torre_control/negocios/${id}`]: fichaMaestraCentral,
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
