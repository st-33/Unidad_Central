import { ref, get, set, child } from 'firebase/database';
import type { Categoria, IdentificadorUnico } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';

export interface RepositorioCategorias {
  listar(): Promise<readonly Categoria[]>;
  obtenerPorId(id: IdentificadorUnico): Promise<Categoria | null>;
  guardar(categoria: Categoria): Promise<void>;
}

export class RepositorioCategoriasRtdb implements RepositorioCategorias {
  async listar(): Promise<readonly Categoria[]> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, RUTAS_RTDB_CENTRAL.categorias);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return [];
    }

    const valor = instantanea.val();
    return Object.values(valor) as Categoria[];
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<Categoria | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.categorias), id);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as Categoria;
  }

  async guardar(categoria: Categoria): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.categorias), categoria.id);
    await set(referencia, categoria);
  }
}
