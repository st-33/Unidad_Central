import { generarClaveTecnica } from './generador-clave';
import {
  repositorioTorreRtdb,
  RepositorioTorre,
} from '../persistencia/repositorio-torre';
import type {
  NegocioRTDB,
  DatosFichaNegocio,
  ResultadoOperacionRTDB,
} from '../tipos';

export class ServicioTorreControl {
  constructor(private readonly repositorio: RepositorioTorre = repositorioTorreRtdb) {}

  async listarNegocios(): Promise<readonly NegocioRTDB[]> {
    return this.repositorio.listarNegocios();
  }

  suscribirNegocios(alActualizar: (negocios: readonly NegocioRTDB[]) => void): () => void {
    return this.repositorio.suscribirNegocios(alActualizar);
  }

  async registrarOActualizarNegocio(
    datos: DatosFichaNegocio,
    idExistente?: string
  ): Promise<ResultadoOperacionRTDB> {
    const nombreLimpio = datos.nombre.trim();
    if (!nombreLimpio) {
      return {
        exito: false,
        mensaje: 'El nombre comercial del negocio es obligatorio.',
      };
    }

    try {
      const negociosActuales = await this.repositorio.listarNegocios();
      const clavesExistentes = negociosActuales.map((n) => n.id.toLowerCase());

      // Verificar si ya existe por ID o por coincidencia exacta de nombre comercial
      let idFinal = idExistente ? idExistente.toLowerCase().trim() : '';

      if (!idFinal) {
        const coincidenciaNombre = negociosActuales.find(
          (n) => n.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
        );
        if (coincidenciaNombre) {
          idFinal = coincidenciaNombre.id;
        }
      }

      // Si aún no tiene ID (es un negocio nuevo), generamos la clave determinista de máximo 3 caracteres
      if (!idFinal) {
        idFinal = generarClaveTecnica(nombreLimpio, clavesExistentes);
      }

      const negocioParaGuardar: NegocioRTDB = {
        id: idFinal,
        nombre: nombreLimpio, // Se preserva el nombre comercial tal como se escribió
        activo: Boolean(datos.activo),
        codigo: datos.codigo.trim(),
        limite: Math.max(1, Number(datos.limite) || 1),
        bloqueados: datos.bloqueados || {},
        perfiles: datos.perfiles || [],
        direccion: datos.direccion?.trim() || '',
        instagram: datos.instagram?.trim() || '',
        facebook: datos.facebook?.trim() || '',
        whatsapp: datos.whatsapp?.trim() || '',
        celular: datos.celular?.trim() || '',
        correo: datos.correo?.trim() || '',
      };

      await this.repositorio.guardarNegocio(negocioParaGuardar);

      const esNuevo = !idExistente && !negociosActuales.some((n) => n.id === idFinal);

      return {
        exito: true,
        mensaje: esNuevo
          ? `Negocio "${nombreLimpio}" registrado con éxito en matriz.`
          : `Negocio "${nombreLimpio}" actualizado con éxito en matriz.`,
        idGenerado: idFinal,
      };
    } catch (error) {
      const msj = error instanceof Error ? error.message : 'Error desconocido al escribir en RTDB';
      return {
        exito: false,
        mensaje: `Error al impactar RTDB: ${msj}`,
      };
    }
  }

  async eliminarNegocio(id: string): Promise<ResultadoOperacionRTDB> {
    try {
      await this.repositorio.eliminarNegocio(id);
      return {
        exito: true,
        mensaje: 'Negocio retirado de la matriz correctamente.',
      };
    } catch (error) {
      const msj = error instanceof Error ? error.message : 'Error al eliminar en RTDB';
      return {
        exito: false,
        mensaje: msj,
      };
    }
  }
}

export const servicioTorreControl = new ServicioTorreControl();
