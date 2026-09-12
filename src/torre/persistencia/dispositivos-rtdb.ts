import { ref, get, update } from 'firebase/database';
import { obtenerBaseDatosNegocios, URL_RTDB_NEGOCIOS, URL_RTDB_CENTRAL } from './conexion-rtdb';
import type { DispositivoVinculado, PoliticaDispositivos } from '../tipos';

export class ModuloDispositivosRtdb {
  private normalizarNodoCategoria(categoria: string): string {
    const limpia = categoria.trim();
    if (!limpia) return 'Marisquerias';
    return limpia.charAt(0).toUpperCase() + limpia.slice(1);
  }

  /**
   * Obtiene el listado de dispositivos registrados en un negocio
   */
  async obtenerDispositivos(
    categoria: string,
    id: string
  ): Promise<Record<string, DispositivoVinculado>> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();

    try {
      const db = obtenerBaseDatosNegocios();
      const snapOperativos = await get(ref(db, `${nodoCat}/${idLimpio}/dispositivos`));
      const snapAutorizados = await get(ref(db, `${nodoCat}/${idLimpio}/dispositivos_autorizados`));

      const operativos = snapOperativos.exists()
        ? (snapOperativos.val() as Record<string, DispositivoVinculado>)
        : {};
      const autorizados = snapAutorizados.exists()
        ? (snapAutorizados.val() as Record<string, DispositivoVinculado>)
        : {};

      const resultado: Record<string, DispositivoVinculado> = {};

      for (const [devId, dev] of Object.entries(autorizados)) {
        resultado[devId] = {
          ...dev,
          deviceId: devId,
          nombre: dev.nombre || dev.alias || dev.model || devId,
          tipo: dev.tipo || 'otro',
          estado: dev.estado || 'activo',
          esWeb: dev.esWeb ?? (dev.brand?.toLowerCase() === 'manual / web' || dev.brand?.toLowerCase() === 'browser' || devId.startsWith('ADI-web-')),
          esGenerico: dev.esGenerico ?? (dev.brand?.toLowerCase() === 'unknown'),
        };
      }

      for (const [devId, dev] of Object.entries(operativos)) {
        if (!resultado[devId]) {
          resultado[devId] = {
            ...dev,
            deviceId: devId,
            nombre: dev.nombre || dev.alias || dev.model || devId,
            tipo: dev.tipo || 'otro',
            estado: dev.estado || 'activo',
            esWeb: dev.esWeb ?? (dev.brand?.toLowerCase() === 'manual / web' || dev.brand?.toLowerCase() === 'browser' || devId.startsWith('ADI-web-')),
            esGenerico: dev.esGenerico ?? (dev.brand?.toLowerCase() === 'unknown'),
          };
        } else {
          resultado[devId] = {
            ...resultado[devId],
            ...dev,
            nombre: resultado[devId].nombre || dev.nombre || dev.alias || devId,
          };
        }
      }

      return resultado;
    } catch {
      return {};
    }
  }

  /**
   * Actualiza el estado (activo o bloqueado) de un dispositivo específico
   */
  async actualizarEstadoDispositivo(
    categoria: string,
    id: string,
    deviceId: string,
    estado: 'activo' | 'bloqueado'
  ): Promise<void> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();

    const updates: Record<string, unknown> = {
      [`${nodoCat}/${idLimpio}/dispositivos/${deviceId}/estado`]: estado,
      [`${nodoCat}/${idLimpio}/dispositivos_autorizados/${deviceId}/estado`]: estado,
    };

    try {
      const db = obtenerBaseDatosNegocios();
      await update(ref(db), updates);
    } catch {
      const url = `${URL_RTDB_NEGOCIOS}/.json`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    }
  }

  /**
   * Elimina un dispositivo desvinculándolo y liberando un cupo
   */
  async eliminarDispositivo(categoria: string, id: string, deviceId: string): Promise<void> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();

    const updates: Record<string, null> = {
      [`${nodoCat}/${idLimpio}/dispositivos/${deviceId}`]: null,
      [`${nodoCat}/${idLimpio}/dispositivos_autorizados/${deviceId}`]: null,
    };

    try {
      const db = obtenerBaseDatosNegocios();
      await update(ref(db), updates);
    } catch {
      const url = `${URL_RTDB_NEGOCIOS}/.json`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    }
  }

  /**
   * Pre-autoriza manualmente un nuevo dispositivo en el negocio
   */
  async autorizarNuevoDispositivo(
    categoria: string,
    id: string,
    dispositivo: DispositivoVinculado
  ): Promise<void> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();
    const devId = dispositivo.deviceId.trim();

    const now = Date.now();
    const payloadAutorizado = {
      deviceId: devId,
      alias: dispositivo.alias?.trim() || 'Dispositivo Autorizado',
      estado: dispositivo.estado || 'activo',
      brand: dispositivo.brand || 'Manual / Web',
      model: dispositivo.model || 'Navegador / Terminal',
      systemName: dispositivo.systemName || 'Torre de Control',
      systemVersion: '1.0',
      isEmulator: false,
      fechaRegistro: now,
      ultimoAcceso: now,
      ultimoHeartbeat: now,
    };

    const payloadOperativo = {
      deviceId: devId,
      alias: dispositivo.alias?.trim() || 'Dispositivo Autorizado',
      estado: dispositivo.estado || 'activo',
      nivelOperativo: dispositivo.nivelOperativo || 'operador',
      puedeCambiarRol: true,
      rolesPermitidos: dispositivo.rolesPermitidos || {
        admin: true,
        cocina: true,
        mesero: true,
      },
      ultimoHeartbeat: now,
      vinculadoEn: now,
    };

    const updates: Record<string, unknown> = {
      [`${nodoCat}/${idLimpio}/dispositivos_autorizados/${devId}`]: payloadAutorizado,
      [`${nodoCat}/${idLimpio}/dispositivos/${devId}`]: payloadOperativo,
    };

    try {
      const db = obtenerBaseDatosNegocios();
      await update(ref(db), updates);
    } catch {
      const url = `${URL_RTDB_NEGOCIOS}/.json`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    }
  }

  /**
   * Actualiza las políticas de acceso para navegadores y dispositivos genéricos
   */
  async actualizarPoliticaDispositivos(
    categoria: string,
    id: string,
    politicas: PoliticaDispositivos
  ): Promise<void> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();

    const updates: Record<string, unknown> = {
      [`${nodoCat}/${idLimpio}/politicas_dispositivos`]: politicas,
    };

    try {
      const db = obtenerBaseDatosNegocios();
      await update(ref(db), updates);
    } catch {
      const url = `${URL_RTDB_NEGOCIOS}/.json`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    }

    try {
      const urlCentral = `${URL_RTDB_CENTRAL}/torre_control/negocios/${idLimpio}/politica_dispositivos.json`;
      await fetch(urlCentral, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(politicas),
      });
    } catch {
      // Fallback
    }
  }
}

export const moduloDispositivosRtdb = new ModuloDispositivosRtdb();
