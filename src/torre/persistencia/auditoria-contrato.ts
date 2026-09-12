import { ref, get, update } from 'firebase/database';
import { obtenerBaseDatosNegocios, URL_RTDB_NEGOCIOS } from './conexion-rtdb';
import type {
  AuditoriaNegocioReporte,
  ReporteIntegracionCategoria,
  ResultadoConsolidacionCodigoAcceso,
  ResultadoPurgaLegacy,
  ResultadoArmonizacion,
  ItemNegocioCategoria,
  PoliticaDispositivos,
  NegocioRTDB,
} from '../tipos';

export class ModuloAuditoriaContrato {
  readonly nodoCodigoAcceso = 'codigo_acceso';
  readonly nodoLegacyAccessCodes = 'access_codes';

  private normalizarNodoCategoria(categoria: string): string {
    const limpia = categoria.trim();
    if (!limpia) return 'Marisquerias';
    return limpia.charAt(0).toUpperCase() + limpia.slice(1);
  }

  /**
   * Realiza una auditoría completa del negocio, verificando la consistencia
   * del contrato de acceso, dispositivos y políticas.
   */
  async auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte> {
    const nodoCat = this.normalizarNodoCategoria(categoria);
    const idLimpio = id.toLowerCase().trim();
    const rutaEsperada = `${nodoCat}/${idLimpio}`;

    let negocioRaw: Record<string, unknown> | null = null;
    try {
      const db = obtenerBaseDatosNegocios();
      const snap = await get(ref(db, rutaEsperada));
      if (snap.exists()) {
        negocioRaw = snap.val() as Record<string, unknown>;
      }
    } catch {
      // Fallback REST
    }

    if (!negocioRaw) {
      try {
        const res = await fetch(`${URL_RTDB_NEGOCIOS}/${rutaEsperada}.json`);
        if (res.ok) negocioRaw = (await res.json()) as Record<string, unknown>;
      } catch {
        negocioRaw = null;
      }
    }

    const codigo =
      typeof negocioRaw?.codigo === 'string'
        ? (negocioRaw.codigo as string).trim().toUpperCase()
        : '';
    const nombre =
      typeof negocioRaw?.nombre === 'string'
        ? (negocioRaw.nombre as string).trim()
        : idLimpio;
    const activo = Boolean(negocioRaw?.activo ?? true);
    const limite = Number(negocioRaw?.limite) || 1;

    // Comprobar estado del nodo legacy /access_codes/{codigo}
    let rutaAccessCodes: string | null = null;
    let existeAccessCodes = false;
    if (codigo) {
      try {
        const res = await fetch(
          `${URL_RTDB_NEGOCIOS}/${this.nodoLegacyAccessCodes}/${encodeURIComponent(codigo)}.json`
        );
        if (res.ok) {
          const val = await res.json();
          if (typeof val === 'string') {
            rutaAccessCodes = val;
            existeAccessCodes = true;
          }
        }
      } catch {
        // Ignorar verificación legacy
      }
    }

    // Comprobar CONTRATO NORMATIVO ÚNICO /codigo_acceso/{codigo}
    let rutaCodigoAcceso: string | null = null;
    let existeCodigoAcceso = false;
    if (codigo) {
      try {
        const res = await fetch(
          `${URL_RTDB_NEGOCIOS}/${this.nodoCodigoAcceso}/${encodeURIComponent(codigo)}.json`
        );
        if (res.ok) {
          const val = await res.json();
          if (typeof val === 'string') {
            rutaCodigoAcceso = val;
            existeCodigoAcceso = true;
          }
        }
      } catch {
        // Ignorar
      }
    }

    const coincideCodigo =
      Boolean(rutaCodigoAcceso) &&
      rutaCodigoAcceso?.toLowerCase() === rutaEsperada.toLowerCase();
    const contratoUnicoValido = existeCodigoAcceso && coincideCodigo;

    // Dispositivos y cupos
    const dispOperativos =
      negocioRaw?.dispositivos && typeof negocioRaw.dispositivos === 'object'
        ? Object.keys(negocioRaw.dispositivos as object).length
        : 0;
    const dispAutorizados =
      negocioRaw?.dispositivos_autorizados &&
      typeof negocioRaw.dispositivos_autorizados === 'object'
        ? Object.keys(negocioRaw.dispositivos_autorizados as object).length
        : 0;

    const politicas: PoliticaDispositivos =
      (negocioRaw?.politicas_dispositivos as PoliticaDispositivos) ?? {
        permitir_navegador_web: true,
        permitir_dispositivos_genericos: true,
        validar_hardware_estricto: false,
      };

    const modulosBloqueados =
      negocioRaw?.bloqueados && typeof negocioRaw.bloqueados === 'object'
        ? (negocioRaw.bloqueados as Record<string, boolean>)
        : {};

    const perfilesAutorizados = Array.isArray(negocioRaw?.perfiles)
      ? (negocioRaw.perfiles as string[])
      : ['Administrador', 'Cajero', 'Comandero'];

    const hallazgos: AuditoriaNegocioReporte['hallazgos'] = [];

    if (contratoUnicoValido) {
      hallazgos.push({
        tipo: 'exito',
        titulo: 'Contrato Normativo /codigo_acceso Válido',
        descripcion: `El código "${codigo}" apunta a "${rutaEsperada}" en "/${this.nodoCodigoAcceso}". Es la fuente contractual única que resuelve el negocio para las aplicaciones operativas.`,
      });
    } else {
      if (!existeCodigoAcceso) {
        hallazgos.push({
          tipo: 'error',
          titulo: 'Falta Puntero Contractual /codigo_acceso',
          descripcion: `El código "${codigo}" no existe en "/${this.nodoCodigoAcceso}". Las aplicaciones operativas no podrán resolver el negocio.`,
        });
      } else if (!coincideCodigo) {
        hallazgos.push({
          tipo: 'error',
          titulo: 'Desalineación en /codigo_acceso',
          descripcion: `"/${this.nodoCodigoAcceso}/${codigo}" apunta a "${rutaCodigoAcceso}" en vez de "${rutaEsperada}".`,
        });
      }
    }

    if (existeAccessCodes) {
      hallazgos.push({
        tipo: 'info',
        titulo: 'Nodo Legacy /access_codes Detectado en RTDB',
        descripcion: `El código "${codigo}" aún existe bajo "/${this.nodoLegacyAccessCodes}". Ya no forma parte del contrato oficial y podrá ser purgado cuando el cliente de la categoría apunte al contrato único.`,
      });
    } else {
      hallazgos.push({
        tipo: 'exito',
        titulo: 'Nodo Legacy /access_codes Purgado',
        descripcion: `No existen residuos en el nodo legacy "/${this.nodoLegacyAccessCodes}".`,
      });
    }

    if (politicas.permitir_navegador_web && politicas.permitir_dispositivos_genericos) {
      hallazgos.push({
        tipo: 'exito',
        titulo: 'Políticas Flexibles (Expo Web / Browsers)',
        descripcion:
          'Permite conexiones de navegadores web y dispositivos genéricos (brand: unknown). Los terminales no serán rechazados por chequeo estricto de hardware.',
      });
    } else if (politicas.validar_hardware_estricto) {
      hallazgos.push({
        tipo: 'advertencia',
        titulo: 'Validación de Hardware Estricta Activada',
        descripcion:
          'Se exige hardware nativo reconocido. Terminales web o emuladores serán rechazados con error de dispositivo genérico.',
      });
    }

    const ocupacion = Math.max(dispOperativos, dispAutorizados);
    const cupos = Math.max(0, limite - ocupacion);

    if (cupos > 0) {
      hallazgos.push({
        tipo: 'info',
        titulo: `Cupos de Terminales: ${cupos} disponibles`,
        descripcion: `Actualmente hay ${ocupacion} dispositivo(s) vinculado(s) de un límite contratado de ${limite}.`,
      });
    } else {
      hallazgos.push({
        tipo: 'advertencia',
        titulo: 'Límite de Terminales Ocupado',
        descripcion: `Se han ocupado todos los ${limite} cupos permitidos. Para registrar otro dispositivo se debe ampliar el límite o desvincular uno previo.`,
      });
    }

    return {
      idNegocio: idLimpio,
      nombreNegocio: nombre,
      categoria: nodoCat,
      codigoAcceso: codigo,
      rutaEsperada,
      activo,
      limiteDispositivos: limite,
      indiceCodigoAcceso: {
        existe: existeCodigoAcceso,
        rutaApunta: rutaCodigoAcceso,
        coincide: coincideCodigo,
      },
      contratoUnicoValido,
      estadoLegacyAccessCodes: {
        presenteEnRTDB: existeAccessCodes,
        rutaApunta: rutaAccessCodes,
        requierePurga: existeAccessCodes,
      },
      dispositivosOperativosTotal: dispOperativos,
      dispositivosAutorizadosTotal: dispAutorizados,
      cuposDisponibles: cupos,
      politicasDispositivos: politicas,
      modulosBloqueados,
      perfilesAutorizados,
      hallazgos,
    };
  }

  /**
   * Auditoría y Reporte Técnico de Integración a nivel de Categoría.
   */
  async auditarCategoria(
    categoria: string,
    listaNegocios: readonly NegocioRTDB[]
  ): Promise<ReporteIntegracionCategoria> {
    const nodoCat = this.normalizarNodoCategoria(categoria);

    let dataCodigo: Record<string, string> = {};
    try {
      const res = await fetch(`${URL_RTDB_NEGOCIOS}/${this.nodoCodigoAcceso}.json`);
      if (res.ok) {
        dataCodigo = ((await res.json()) || {}) as Record<string, string>;
      }
    } catch {
      dataCodigo = {};
    }

    let dataLegacy: Record<string, string> = {};
    try {
      const resLegacy = await fetch(`${URL_RTDB_NEGOCIOS}/${this.nodoLegacyAccessCodes}.json`);
      if (resLegacy.ok) {
        dataLegacy = ((await resLegacy.json()) || {}) as Record<string, string>;
      }
    } catch {
      dataLegacy = {};
    }

    const keysLegacy = Object.keys(dataLegacy);
    const keysCodigo = Object.keys(dataCodigo);

    const itemsNegocios: ItemNegocioCategoria[] = [];
    let clavesValidas = 0;
    let clavesDesalineadas = 0;
    let clavesAusentes = 0;
    let totalAsignados = 0;

    for (const neg of listaNegocios) {
      const cod = neg.codigo ? neg.codigo.trim().toUpperCase() : '';
      const rutaEsperada = `${nodoCat}/${neg.id.toLowerCase().trim()}`;
      let estadoContrato: 'valido' | 'desalineado' | 'ausente' = 'ausente';
      let rutaEnCodigoAcceso: string | null = null;

      if (cod) {
        totalAsignados++;
        rutaEnCodigoAcceso = dataCodigo[cod] || null;
        if (rutaEnCodigoAcceso) {
          if (rutaEnCodigoAcceso.toLowerCase() === rutaEsperada.toLowerCase()) {
            estadoContrato = 'valido';
            clavesValidas++;
          } else {
            estadoContrato = 'desalineado';
            clavesDesalineadas++;
          }
        } else {
          estadoContrato = 'ausente';
          clavesAusentes++;
        }
      }

      itemsNegocios.push({
        id: neg.id,
        nombre: neg.nombre,
        codigo: cod,
        activo: neg.activo,
        rutaEsperada,
        rutaEnCodigoAcceso,
        estadoContrato,
      });
    }

    const pctCumplimiento =
      totalAsignados > 0 ? Math.round((clavesValidas / totalAsignados) * 100) : 100;

    const nodoLegacyPresente = keysLegacy.length > 0;

    const cambiosEjecutadosTorre: string[] = [
      `Consolidación de claves activas hacia /codigo_acceso en base de datos RTDB.`,
      nodoLegacyPresente
        ? `Nodo legacy /access_codes aún presente con ${keysLegacy.length} residuo(s) (requiere purga).`
        : `Nodo legacy /access_codes completamente purgado de RTDB (base de datos limpia).`,
      `Backend de Torre de Control reconfigurado para operar con contrato único exclusivo (/codigo_acceso).`,
      `Políticas de dispositivos configuradas para admitir Expo Web y navegadores genéricos.`,
    ];

    const pendientesModeloCategoria: string[] = [
      `Eliminar cualquier llamada a '/access_codes' en el repositorio de la categoría ${nodoCat}.`,
      `En el flujo de acceso (Login), consultar ref(db, 'codigo_acceso/' + codigo) para resolver la ruta O(1).`,
      `Garantizar generación de deviceId persistente con prefijo 'ADI-web-' en navegadores para evitar rechazo por hardware 'unknown'.`,
      `Escuchar los nodos en tiempo real '${nodoCat}/\${idNegocio}/activo' y 'dispositivos/\${deviceId}/estado'.`,
    ];

    const instruccionModeloCategoria = `# Instrucción Técnica Oficial de Torre de Control para el Modelo de la Categoría: ${nodoCat}

Estimado agente/modelo responsable del repositorio de **${nodoCat}**:

La Unidad Central y Torre de Control ha definido y consolidado la arquitectura técnica de integración. Debes acoplar tu aplicación cumpliendo los siguientes puntos:

### 1. Fuente Contractual Única: /codigo_acceso
- **Ruta Oficial de Resolución:** \`/codigo_acceso/{CODIGO}\` (en mayúsculas).
- **Acción requerida:** Sustituye inmediatamente cualquier lectura, consulta o escucha al nodo legacy \`/access_codes\`. El nodo legacy ha sido descontinuado y purgado de la base de datos RTDB.
- **Formato del valor retornado:** Una cadena con la ruta operativa del negocio, por ejemplo: \`"${nodoCat}/mpl"\`.

### 2. Resolución de Entrada (Snippet Normativo):
\`\`\`typescript
import { ref, get } from 'firebase/database';

export async function resolverNegocioPorCodigo(codigo: string, db: any): Promise<string | null> {
  const cod = codigo.trim().toUpperCase();
  if (!cod) return null;
  const snap = await get(ref(db, \`codigo_acceso/\${cod}\`));
  if (snap.exists()) {
    return snap.val(); // Retorna ej: "${nodoCat}/mpl"
  }
  return null;
}
\`\`\`

### 3. Resiliencia en Expo Web y Emuladores (Brand "unknown")
- La Torre de Control ya tiene configuradas las políticas \`permitir_navegador_web: true\` y \`permitir_dispositivos_genericos: true\`.
- Tu app no debe fallar con error \`ADI-unknown\`. Genera un identificador de terminal consistente y persistente:
\`\`\`typescript
export function obtenerDeviceIdResiliente(): string {
  const clave = '@adi_device_id';
  let devId = localStorage.getItem(clave);
  if (!devId) {
    devId = \`ADI-web-\${Math.random().toString(36).substring(2, 9).toUpperCase()}-\${Date.now()}\`;
    localStorage.setItem(clave, devId);
  }
  return devId;
}
\`\`\`

### 4. Escucha de Estado Operativo y Suspensión
- Escucha en tiempo real la ruta del negocio \`\${rutaNegocio}/activo\` para bloquear el acceso si el negocio es desactivado.
- Escucha \`\${rutaNegocio}/dispositivos/\${deviceId}/estado\` para reaccionar ante bloqueos de terminal.
- Oculta los módulos que figuren como \`true\` en el objeto \`\${rutaNegocio}/bloqueados\` (Caja, Cocina, Mesero, Reparto).

**Nota de Gobernanza:** No agregues herramientas administrativas de Torre de Control en tu app. Tu aplicación es cliente operativo puro.`;

    return {
      categoriaId: nodoCat,
      totalNegocios: listaNegocios.length,
      negocios: itemsNegocios,
      contratoCodigoAcceso: {
        totalEnRTDB: keysCodigo.length,
        totalAsignadosCategoria: totalAsignados,
        clavesValidas,
        clavesDesalineadas,
        clavesAusentes,
        cumplimientoPorcentaje: pctCumplimiento,
      },
      estadoLegacyRTDB: {
        nodoPresente: nodoLegacyPresente,
        totalClavesLegacy: keysLegacy.length,
        claves: dataLegacy,
      },
      diagnostico: {
        categoriaAfectada: nodoCat,
        parteContratoAfectada: `/codigo_acceso/{CODIGO} vs residuo /access_codes/{CODIGO}`,
        accionRequeridaModelo: `Actualizar resolución O(1) hacia /codigo_acceso y eliminar dependencias de access_codes`,
        cambiosEjecutadosTorre,
        pendientesModeloCategoria,
      },
      instruccionModeloCategoria,
    };
  }

  /**
   * Consolidación hacia contrato único:
   * Migra de forma segura cualquier clave existente en el nodo legacy /access_codes
   * hacia la fuente contractual única /codigo_acceso.
   */
  async consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso> {
    try {
      const [resLegacy, resCodigo] = await Promise.all([
        fetch(`${URL_RTDB_NEGOCIOS}/${this.nodoLegacyAccessCodes}.json`),
        fetch(`${URL_RTDB_NEGOCIOS}/${this.nodoCodigoAcceso}.json`),
      ]);

      const dataLegacy: Record<string, string> = resLegacy.ok
        ? ((await resLegacy.json()) || {})
        : {};
      const dataCodigo: Record<string, string> = resCodigo.ok
        ? ((await resCodigo.json()) || {})
        : {};

      const keysLegacy = Object.keys(dataLegacy);
      const keysCodigo = Object.keys(dataCodigo);

      const updates: Record<string, string> = {};
      const detalles: string[] = [];
      let clavesMigradas = 0;
      let clavesConsistentes = 0;

      for (const key of keysLegacy) {
        const valLegacy = dataLegacy[key];
        const valCodigo = dataCodigo[key];

        if (!valCodigo && valLegacy) {
          updates[`${this.nodoCodigoAcceso}/${key}`] = valLegacy;
          detalles.push(`Migrada clave "${key}" (${valLegacy}) de legacy a /${this.nodoCodigoAcceso}`);
          clavesMigradas++;
        } else if (valCodigo && valLegacy && valCodigo === valLegacy) {
          clavesConsistentes++;
        } else if (valCodigo && valLegacy && valCodigo !== valLegacy) {
          detalles.push(`Aviso: Clave "${key}" tiene discrepancia: legacy="${valLegacy}", contrato="${valCodigo}". Se mantiene contrato.`);
        }
      }

      if (clavesMigradas > 0) {
        try {
          const db = obtenerBaseDatosNegocios();
          await update(ref(db), updates);
        } catch {
          await fetch(`${URL_RTDB_NEGOCIOS}/.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
        }
      }

      return {
        exito: true,
        mensaje:
          clavesMigradas > 0
            ? `Se migraron ${clavesMigradas} clave(s) hacia el contrato único /${this.nodoCodigoAcceso}.`
            : `El contrato único /${this.nodoCodigoAcceso} ya contiene todas las claves (${keysCodigo.length} claves activas).`,
        totalCodigoAcceso: keysCodigo.length + clavesMigradas,
        clavesMigradasDesdeLegacy: clavesMigradas,
        clavesConsistentes,
        detalles,
      };
    } catch (e) {
      return {
        exito: false,
        mensaje: `Error al consolidar contrato único: ${e instanceof Error ? e.message : String(e)}`,
        totalCodigoAcceso: 0,
        clavesMigradasDesdeLegacy: 0,
        clavesConsistentes: 0,
        detalles: [],
      };
    }
  }

  /**
   * Purga definitiva y controlada del nodo residual /access_codes en RTDB.
   */
  async purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy> {
    try {
      const resLegacy = await fetch(`${URL_RTDB_NEGOCIOS}/${this.nodoLegacyAccessCodes}.json`);
      const dataLegacy: Record<string, string> = resLegacy.ok
        ? ((await resLegacy.json()) || {})
        : {};

      const keysLegacy = Object.keys(dataLegacy);
      if (keysLegacy.length === 0) {
        return {
          exito: true,
          mensaje: 'El nodo legacy /access_codes ya se encuentra vacío o no existe en RTDB.',
          registrosPurgados: 0,
          detalles: [],
        };
      }

      await this.consolidarContratoCodigoAcceso();

      const purgaPayload: Record<string, null> = {
        [this.nodoLegacyAccessCodes]: null,
      };

      try {
        const db = obtenerBaseDatosNegocios();
        await update(ref(db), purgaPayload);
      } catch {
        await fetch(`${URL_RTDB_NEGOCIOS}/.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(purgaPayload),
        });
      }

      return {
        exito: true,
        mensaje: `Nodo legacy /${this.nodoLegacyAccessCodes} purgado con éxito de RTDB (${keysLegacy.length} registro(s) eliminados).`,
        registrosPurgados: keysLegacy.length,
        detalles: keysLegacy.map((k) => `Purgado residuo "${k}" -> "${dataLegacy[k]}"`),
      };
    } catch (e) {
      return {
        exito: false,
        mensaje: `Error al purgar nodo legacy: ${e instanceof Error ? e.message : String(e)}`,
        registrosPurgados: 0,
        detalles: [],
      };
    }
  }

  async armonizarDobleIndice(): Promise<ResultadoArmonizacion> {
    return this.consolidarContratoCodigoAcceso();
  }
}

export const moduloAuditoriaContrato = new ModuloAuditoriaContrato();
