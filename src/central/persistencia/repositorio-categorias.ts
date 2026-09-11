import { ref, get, set, child } from 'firebase/database';
import type { Categoria, IdentificadorUnico } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';
import { almacenMemoria, conTiempoLimite } from './almacen-memoria';

export interface RepositorioCategorias {
  listar(): Promise<readonly Categoria[]>;
  obtenerPorId(id: IdentificadorUnico): Promise<Categoria | null>;
  guardar(categoria: Categoria): Promise<void>;
}

export class RepositorioCategoriasRtdb implements RepositorioCategorias {
  async listar(): Promise<readonly Categoria[]> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = ref(db, RUTAS_RTDB_CENTRAL.categorias);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.categorias.listar();
      }

      const valor = instantanea.val();
      const lista = Object.values(valor) as Categoria[];
      almacenMemoria.categorias.sincronizar(lista);
      return lista;
    } catch {
      return almacenMemoria.categorias.listar();
    }
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<Categoria | null> {
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.categorias), id);
      const instantanea = await conTiempoLimite(get(referencia), 2000);

      if (!instantanea.exists()) {
        return almacenMemoria.categorias.obtenerPorId(id);
      }

      return instantanea.val() as Categoria;
    } catch {
      return almacenMemoria.categorias.obtenerPorId(id);
    }
  }

  async guardar(categoria: Categoria): Promise<void> {
    almacenMemoria.categorias.guardar(categoria);
    try {
      const db = obtenerBaseDatosTiempoReal();
      const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.categorias), categoria.id);
      await conTiempoLimite(set(referencia, categoria), 2000);
    } catch {
      // Offline fallback saved
    }
  }
}
