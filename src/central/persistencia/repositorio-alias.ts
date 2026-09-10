import { ref, get, set, child } from 'firebase/database';
import type { IdentificadorUnico } from '../../../contratos';
import { obtenerBaseDatosTiempoReal } from '../../plataforma/firebase';
import { RUTAS_RTDB_CENTRAL } from './rutas-rtdb';

/**
 * Repositorio de alias legacy para resolución de identidad canónica.
 * 
 * Estructura:
 * central/alias/{id_legacy} -> negocio_id
 * 
 * Permite la transición gradual desde identificadores antiguos
 * sin romper rutas existentes.
 */
export interface RepositorioAlias {
  registrarAlias(aliasLegacy: string, negocioId: IdentificadorUnico): Promise<void>;
  resolverAlias(aliasLegacy: string): Promise<IdentificadorUnico | null>;
  listarAliasDeNegocio(negocioId: IdentificadorUnico): Promise<readonly string[]>;
}

export class RepositorioAliasRtdb implements RepositorioAlias {
  async registrarAlias(aliasLegacy: string, negocioId: IdentificadorUnico): Promise<void> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.alias), aliasLegacy);
    await set(referencia, negocioId);
  }

  async resolverAlias(aliasLegacy: string): Promise<IdentificadorUnico | null> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = child(ref(db, RUTAS_RTDB_CENTRAL.alias), aliasLegacy);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return null;
    }

    return instantanea.val() as IdentificadorUnico;
  }

  async listarAliasDeNegocio(negocioId: IdentificadorUnico): Promise<readonly string[]> {
    const db = obtenerBaseDatosTiempoReal();
    const referencia = ref(db, RUTAS_RTDB_CENTRAL.alias);
    const instantanea = await get(referencia);

    if (!instantanea.exists()) {
      return [];
    }

    const valor = instantanea.val();
    const aliases: string[] = [];

    for (const [alias, id] of Object.entries(valor)) {
      if (id === negocioId) {
        aliases.push(alias);
      }
    }

    return aliases;
  }
}
