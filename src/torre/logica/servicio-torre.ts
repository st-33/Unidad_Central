import { generarClaveTecnica } from './generador-clave';
import {
  repositorioTorreRtdb,
  type RepositorioTorre,
} from '../persistencia/repositorio-torre';
import type {
  NegocioRTDB,
  DatosFichaNegocio,
  ResultadoOperacionRTDB,
  DispositivoVinculado,
  PoliticaDispositivos,
  AuditoriaNegocioReporte,
  ReporteIntegracionCategoria,
  ResultadoArmonizacion,
  ResultadoConsolidacionCodigoAcceso,
  ResultadoPurgaLegacy,
} from '../tipos';

const CARACTERES_PROHIBIDOS_FIREBASE = /[.#$\[\]\/]/;

export class ServicioTorreControl {
  constructor(private readonly repositorio: RepositorioTorre = repositorioTorreRtdb) {}

  async listarNegociosPorCategoria(categoria: string = 'Marisquerias'): Promise<readonly NegocioRTDB[]> {
    return this.repositorio.listarNegociosPorCategoria(categoria);
  }

  suscribirNegociosPorCategoria(
    categoria: string = 'Marisquerias',
    alActualizar: (negocios: readonly NegocioRTDB[]) => void
  ): () => void {
    return this.repositorio.suscribirNegociosPorCategoria(categoria, alActualizar);
  }

  async listarCategorias(): Promise<readonly string[]> {
    return this.repositorio.listarCategorias();
  }

  async registrarOActualizarNegocio(
    datos: DatosFichaNegocio,
    idExistente?: string,
    codigoAnterior?: string,
    categoriaAnterior?: string
  ): Promise<ResultadoOperacionRTDB> {
    const nombreLimpio = datos.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        mensaje: 'El nombre comercial del negocio es obligatorio.',
      };
    }

    const codigoLimpio = datos.codigo.trim().toUpperCase();
    if (!codigoLimpio) {
      return {
        exito: false,
        mensaje: 'El código de acceso único es obligatorio.',
      };
    }

    if (CARACTERES_PROHIBIDOS_FIREBASE.test(codigoLimpio)) {
      return {
        exito: false,
        mensaje: 'El código de acceso no puede contener los caracteres: . # $ [ ] /',
      };
    }

    const categoriaLimpia = datos.categoria.trim() || 'Marisquerias';

    try {
      const negociosActuales = await this.repositorio.listarNegociosPorCategoria(categoriaLimpia);
      const clavesExistentes = negociosActuales.map((n: NegocioRTDB) => n.id.toLowerCase());

      // Determinar ID técnico determinista
      let idFinal = idExistente ? idExistente.toLowerCase().trim() : '';

      if (!idFinal) {
        const coincidencia = negociosActuales.find(
          (n: NegocioRTDB) => n.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
        );
        if (coincidencia) {
          idFinal = coincidencia.id;
        }
      }

      if (!idFinal) {
        idFinal = generarClaveTecnica(nombreLimpio, clavesExistentes);
      }

      const rutaEsperada = `${categoriaLimpia}/${idFinal}`;

      // Validación estricta de unicidad global del código de acceso
      const rutaExistente = await this.repositorio.obtenerRutaPorCodigoAcceso(codigoLimpio);
      if (rutaExistente && rutaExistente.toLowerCase() !== rutaEsperada.toLowerCase()) {
        const rutaPreviaMismoNegocio =
          idExistente &&
          ((categoriaAnterior &&
            rutaExistente.toLowerCase() ===
              `${categoriaAnterior.toLowerCase()}/${idExistente.toLowerCase()}`) ||
            rutaExistente.toLowerCase().endsWith(`/${idExistente.toLowerCase()}`));

        if (!rutaPreviaMismoNegocio) {
          return {
            exito: false,
            mensaje: `El código de acceso "${codigoLimpio}" ya está asignado a "${rutaExistente}". Cada negocio debe tener un código estrictamente único.`,
          };
        }
      }

      const negocioParaGuardar: NegocioRTDB = {
        id: idFinal,
        nombre: nombreLimpio,
        categoria: categoriaLimpia,
        activo: Boolean(datos.activo),
        codigo: codigoLimpio,
        limite: Math.max(1, Number(datos.limite) || 1),
        bloqueados: datos.bloqueados || {},
        perfiles: datos.perfiles || [],
        politicas_dispositivos: datos.politicas_dispositivos ?? {
          permitir_navegador_web: true,
          permitir_dispositivos_genericos: true,
          validar_hardware_estricto: false,
        },
        direccion: datos.direccion?.trim() || '',
        instagram: datos.instagram?.trim() || '',
        facebook: datos.facebook?.trim() || '',
        whatsapp: datos.whatsapp?.trim() || '',
        celular: datos.celular?.trim() || '',
        correo: datos.correo?.trim() || '',
      };

      await this.repositorio.guardarNegocio(
        negocioParaGuardar,
        codigoAnterior,
        categoriaAnterior
      );

      const esNuevo = !idExistente && !negociosActuales.some((n: NegocioRTDB) => n.id === idFinal);

      return {
        exito: true,
        mensaje: esNuevo
          ? `Negocio "${nombreLimpio}" registrado con éxito en ${categoriaLimpia}/${idFinal} y vinculado a código ${codigoLimpio}.`
          : `Negocio "${nombreLimpio}" actualizado con éxito en ${categoriaLimpia}/${idFinal}.`,
        idGenerado: idFinal,
        rutaRTDB: rutaEsperada,
      };
    } catch (error) {
      const msj = error instanceof Error ? error.message : 'Error desconocido al escribir en RTDB';
      return {
        exito: false,
        mensaje: `Error al impactar RTDB: ${msj}`,
      };
    }
  }

  async eliminarNegocio(categoria: string, id: string, codigo: string): Promise<ResultadoOperacionRTDB> {
    try {
      await this.repositorio.eliminarNegocio(categoria, id, codigo);
      return {
        exito: true,
        mensaje: 'Negocio y código de acceso retirados de la matriz correctamente.',
      };
    } catch (error) {
      const msj = error instanceof Error ? error.message : 'Error al eliminar en RTDB';
      return {
        exito: false,
        mensaje: msj,
      };
    }
  }

  async obtenerDispositivos(
    categoria: string,
    id: string
  ): Promise<Record<string, DispositivoVinculado>> {
    return this.repositorio.obtenerDispositivos(categoria, id);
  }

  async actualizarEstadoDispositivo(
    categoria: string,
    id: string,
    deviceId: string,
    estado: 'activo' | 'bloqueado'
  ): Promise<ResultadoOperacionRTDB> {
    try {
      await this.repositorio.actualizarEstadoDispositivo(categoria, id, deviceId, estado);
      return {
        exito: true,
        mensaje: `Dispositivo ${deviceId} marcado como ${estado}.`,
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : 'Error al actualizar dispositivo',
      };
    }
  }

  async eliminarDispositivo(
    categoria: string,
    id: string,
    deviceId: string
  ): Promise<ResultadoOperacionRTDB> {
    try {
      await this.repositorio.eliminarDispositivo(categoria, id, deviceId);
      return {
        exito: true,
        mensaje: `Dispositivo ${deviceId} desvinculado con éxito. Slot liberado.`,
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : 'Error al desvincular dispositivo',
      };
    }
  }

  async autorizarNuevoDispositivo(
    categoria: string,
    id: string,
    dispositivo: DispositivoVinculado
  ): Promise<ResultadoOperacionRTDB> {
    try {
      await this.repositorio.autorizarNuevoDispositivo(categoria, id, dispositivo);
      return {
        exito: true,
        mensaje: `Dispositivo "${dispositivo.alias || dispositivo.deviceId}" pre-autorizado con éxito.`,
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : 'Error al pre-autorizar dispositivo',
      };
    }
  }

  async actualizarPoliticaDispositivos(
    categoria: string,
    id: string,
    politicas: PoliticaDispositivos
  ): Promise<ResultadoOperacionRTDB> {
    try {
      await this.repositorio.actualizarPoliticaDispositivos(categoria, id, politicas);
      return {
        exito: true,
        mensaje: 'Políticas de dispositivos actualizadas en RTDB.',
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: error instanceof Error ? error.message : 'Error al actualizar políticas',
      };
    }
  }

  async auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte> {
    return this.repositorio.auditarNegocio(categoria, id);
  }

  async auditarCategoria(categoria: string): Promise<ReporteIntegracionCategoria> {
    return this.repositorio.auditarCategoria(categoria);
  }

  async consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso> {
    return this.repositorio.consolidarContratoCodigoAcceso();
  }

  async purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy> {
    return this.repositorio.purgarNodoLegacyAccessCodes();
  }

  async armonizarDobleIndice(): Promise<ResultadoArmonizacion> {
    return this.repositorio.armonizarDobleIndice();
  }
}

export const servicioTorreControl = new ServicioTorreControl();

