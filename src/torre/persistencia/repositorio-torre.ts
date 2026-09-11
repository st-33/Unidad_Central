import { ref, get, set, remove, onValue } from 'firebase/database';
import { obtenerBaseDatosTorre, URL_RTDB_TORRE_NEGOCIOS } from './conexion-rtdb';
import type { NegocioRTDB } from '../tipos';

export interface RepositorioTorre {
  listarNegocios(): Promise<readonly NegocioRTDB[]>;
  suscribirNegocios(alCambiar: (negocios: readonly NegocioRTDB[]) => void): () => void;
  guardarNegocio(negocio: NegocioRTDB): Promise<void>;
  eliminarNegocio(id: string): Promise<void>;
}

export class RepositorioTorreRtdb implements RepositorioTorre {
  private readonly nodoRaiz = 'negocios';

  /**
   * Obtiene todos los negocios directamente de la RTDB
   */
  async listarNegocios(): Promise<readonly NegocioRTDB[]> {
    try {
      const db = obtenerBaseDatosTorre();
      const r = ref(db, this.nodoRaiz);
      const snapshot = await get(r);

      if (!snapshot.exists()) {
        return [];
      }

      const val = snapshot.val() as Record<string, unknown>;
      return this.transformarMapaEnLista(val);
    } catch (err) {
      // Fallback a REST para asegurar disponibilidad en cualquier entorno
      return this.listarNegociosViaRest();
    }
  }

  /**
   * Suscribe en tiempo real a los cambios en el nodo negocios de la RTDB
   */
  suscribirNegocios(alCambiar: (negocios: readonly NegocioRTDB[]) => void): () => void {
    try {
      const db = obtenerBaseDatosTorre();
      const r = ref(db, this.nodoRaiz);

      const unsubscribe = onValue(
        r,
        (snapshot) => {
          if (!snapshot.exists()) {
            alCambiar([]);
            return;
          }
          const val = snapshot.val() as Record<string, unknown>;
          alCambiar(this.transformarMapaEnLista(val));
        },
        () => {
          // Si falla onValue, intentamos fallback con una lectura única
          this.listarNegociosViaRest()
            .then(alCambiar)
            .catch(() => alCambiar([]));
        }
      );

      return unsubscribe;
    } catch {
      // Fallback si el SDK falla al montar el listener
      this.listarNegociosViaRest()
        .then(alCambiar)
        .catch(() => alCambiar([]));
      return () => {};
    }
  }

  /**
   * Guarda o actualiza un negocio con estructura limpia y plana en /negocios/{id}
   */
  async guardarNegocio(negocio: NegocioRTDB): Promise<void> {
    const idLimpio = negocio.id.toLowerCase().trim();

    // Payload plano y limpio
    const payloadPlano: Record<string, unknown> = {
      id: idLimpio,
      nombre: negocio.nombre.trim(),
      activo: Boolean(negocio.activo),
      codigo: negocio.codigo || '',
      limite: Number(negocio.limite) || 1,
      bloqueados: negocio.bloqueados || {},
      perfiles: Array.isArray(negocio.perfiles) ? negocio.perfiles : [],
    };

    if (negocio.direccion?.trim()) payloadPlano.direccion = negocio.direccion.trim();
    if (negocio.instagram?.trim()) payloadPlano.instagram = negocio.instagram.trim();
    if (negocio.facebook?.trim()) payloadPlano.facebook = negocio.facebook.trim();
    if (negocio.whatsapp?.trim()) payloadPlano.whatsapp = negocio.whatsapp.trim();
    if (negocio.celular?.trim()) payloadPlano.celular = negocio.celular.trim();
    if (negocio.correo?.trim()) payloadPlano.correo = negocio.correo.trim();

    try {
      const db = obtenerBaseDatosTorre();
      const r = ref(db, `${this.nodoRaiz}/${idLimpio}`);
      await set(r, payloadPlano);
    } catch {
      // Fallback REST directo
      const url = `${URL_RTDB_TORRE_NEGOCIOS}/${this.nodoRaiz}/${idLimpio}.json`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPlano),
      });

      if (!res.ok) {
        throw new Error(`Error HTTP al escribir en RTDB: ${res.statusText}`);
      }
    }
  }

  /**
   * Elimina un negocio del nodo /negocios/{id} en RTDB
   */
  async eliminarNegocio(id: string): Promise<void> {
    const idLimpio = id.toLowerCase().trim();
    try {
      const db = obtenerBaseDatosTorre();
      const r = ref(db, `${this.nodoRaiz}/${idLimpio}`);
      await remove(r);
    } catch {
      const url = `${URL_RTDB_TORRE_NEGOCIOS}/${this.nodoRaiz}/${idLimpio}.json`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Error HTTP al eliminar de RTDB: ${res.statusText}`);
      }
    }
  }

  private async listarNegociosViaRest(): Promise<readonly NegocioRTDB[]> {
    const url = `${URL_RTDB_TORRE_NEGOCIOS}/${this.nodoRaiz}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as Record<string, unknown> | null;
    if (!data) return [];
    return this.transformarMapaEnLista(data);
  }

  private transformarMapaEnLista(mapa: Record<string, unknown>): readonly NegocioRTDB[] {
    const lista: NegocioRTDB[] = [];

    for (const [clave, valor] of Object.entries(mapa)) {
      if (!valor || typeof valor !== 'object') continue;

      const obj = valor as Record<string, unknown>;
      const nombre = typeof obj.nombre === 'string' ? obj.nombre : clave;
      const activo = typeof obj.activo === 'boolean' ? obj.activo : true;
      const codigo = typeof obj.codigo === 'string' ? obj.codigo : '';
      const limite = typeof obj.limite === 'number' ? obj.limite : 1;
      const bloqueados = (obj.bloqueados && typeof obj.bloqueados === 'object')
        ? (obj.bloqueados as Record<string, boolean>)
        : {};
      const perfiles = Array.isArray(obj.perfiles) ? (obj.perfiles as string[]) : [];

      lista.push({
        id: (typeof obj.id === 'string' && obj.id) ? obj.id : clave,
        nombre,
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
