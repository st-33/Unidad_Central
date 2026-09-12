import test from 'node:test';
import assert from 'node:assert/strict';
import { generarClaveTecnica } from '../src/torre/logica/generador-clave';
import { ServicioTorreControl } from '../src/torre/logica/servicio-torre';
import type { RepositorioTorre } from '../src/torre/persistencia/repositorio-torre';
import type {
  NegocioRTDB,
  DatosFichaNegocio,
  AuditoriaNegocioReporte,
  ReporteIntegracionCategoria,
  ResultadoArmonizacion,
  ResultadoConsolidacionCodigoAcceso,
  ResultadoPurgaLegacy,
} from '../src/torre/tipos';

// Repositorio en memoria que emula la RTDB con índice inverso de codigo_acceso
class RepositorioTorreMemoria implements RepositorioTorre {
  private negociosPorCat = new Map<string, Map<string, NegocioRTDB>>();
  private indiceCodigoAcceso = new Map<string, string>();

  async listarNegociosPorCategoria(categoria: string): Promise<readonly NegocioRTDB[]> {
    const mapa = this.negociosPorCat.get(categoria.toLowerCase());
    if (!mapa) return [];
    return Array.from(mapa.values());
  }

  suscribirNegociosPorCategoria(
    categoria: string,
    alCambiar: (negocios: readonly NegocioRTDB[]) => void
  ): () => void {
    const mapa = this.negociosPorCat.get(categoria.toLowerCase());
    alCambiar(mapa ? Array.from(mapa.values()) : []);
    return () => {};
  }

  async listarCategorias(): Promise<readonly string[]> {
    const keys = Array.from(this.negociosPorCat.keys());
    if (!keys.includes('marisquerias')) keys.unshift('marisquerias');
    return keys;
  }

  async obtenerRutaPorCodigoAcceso(codigo: string): Promise<string | null> {
    return this.indiceCodigoAcceso.get(codigo.trim().toUpperCase()) ?? null;
  }

  async guardarNegocio(
    negocio: NegocioRTDB,
    codigoAnterior?: string,
    categoriaAnterior?: string
  ): Promise<void> {
    const cat = negocio.categoria.toLowerCase();

    // Si la categoría cambió, eliminar del nodo anterior
    if (categoriaAnterior && categoriaAnterior.toLowerCase() !== cat) {
      const mapaAnt = this.negociosPorCat.get(categoriaAnterior.toLowerCase());
      if (mapaAnt) mapaAnt.delete(negocio.id.toLowerCase());
    }

    if (!this.negociosPorCat.has(cat)) {
      this.negociosPorCat.set(cat, new Map());
    }
    this.negociosPorCat.get(cat)!.set(negocio.id.toLowerCase(), negocio);

    const codActual = negocio.codigo.trim().toUpperCase();

    if (codigoAnterior) {
      const codAnt = codigoAnterior.trim().toUpperCase();
      if (codAnt !== codActual) {
        this.indiceCodigoAcceso.delete(codAnt);
      }
    }

    if (codActual) {
      this.indiceCodigoAcceso.set(codActual, `${negocio.categoria}/${negocio.id}`);
    }
  }

  async eliminarNegocio(categoria: string, id: string, codigo: string): Promise<void> {
    const cat = categoria.toLowerCase();
    const mapa = this.negociosPorCat.get(cat);
    if (mapa) {
      mapa.delete(id.toLowerCase());
    }
    if (codigo) {
      this.indiceCodigoAcceso.delete(codigo.trim().toUpperCase());
    }
  }

  async obtenerDispositivos(): Promise<Record<string, never>> {
    return {};
  }

  async actualizarEstadoDispositivo(): Promise<void> {}

  async eliminarDispositivo(): Promise<void> {}

  async autorizarNuevoDispositivo(): Promise<void> {}

  async actualizarPoliticaDispositivos(): Promise<void> {}

  async auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte> {
    const mapa = this.negociosPorCat.get(categoria.toLowerCase());
    const neg = mapa?.get(id.toLowerCase());
    const codigo = neg?.codigo || '';
    const ruta = `${categoria}/${id}`;
    const rutaIndex = this.indiceCodigoAcceso.get(codigo);
    const coincide = rutaIndex === ruta;

    return {
      idNegocio: id,
      nombreNegocio: neg?.nombre || id,
      categoria,
      codigoAcceso: codigo,
      rutaEsperada: ruta,
      activo: neg?.activo ?? true,
      limiteDispositivos: neg?.limite || 1,
      indiceCodigoAcceso: { existe: coincide, rutaApunta: rutaIndex || null, coincide },
      contratoUnicoValido: coincide,
      estadoLegacyAccessCodes: {
        presenteEnRTDB: false,
        rutaApunta: null,
        requierePurga: false,
      },
      dispositivosOperativosTotal: 0,
      dispositivosAutorizadosTotal: 0,
      cuposDisponibles: neg?.limite || 1,
      politicasDispositivos: {
        permitir_navegador_web: true,
        permitir_dispositivos_genericos: true,
        validar_hardware_estricto: false,
      },
      modulosBloqueados: {},
      perfilesAutorizados: ['Administrador'],
      hallazgos: [
        {
          tipo: coincide ? 'exito' : 'error',
          titulo: coincide ? 'Contrato Normativo /codigo_acceso Válido' : 'Desalineado',
          descripcion: 'Resolución de contrato único',
        },
      ],
    };
  }

  async auditarCategoria(categoria: string): Promise<ReporteIntegracionCategoria> {
    const lista = await this.listarNegociosPorCategoria(categoria);
    const negocios = lista.map((neg) => {
      const cod = neg.codigo ? neg.codigo.trim().toUpperCase() : '';
      const rutaEsperada = `${categoria}/${neg.id.toLowerCase()}`;
      const rutaEnCodigoAcceso = this.indiceCodigoAcceso.get(cod) || null;
      const estadoContrato: 'valido' | 'desalineado' | 'ausente' =
        rutaEnCodigoAcceso?.toLowerCase() === rutaEsperada.toLowerCase()
          ? 'valido'
          : rutaEnCodigoAcceso
          ? 'desalineado'
          : 'ausente';
      return {
        id: neg.id,
        nombre: neg.nombre,
        codigo: cod,
        activo: neg.activo,
        rutaEsperada,
        rutaEnCodigoAcceso,
        estadoContrato,
      };
    });

    return {
      categoriaId: categoria,
      totalNegocios: lista.length,
      negocios,
      contratoCodigoAcceso: {
        totalEnRTDB: this.indiceCodigoAcceso.size,
        totalAsignadosCategoria: lista.filter((n) => n.codigo).length,
        clavesValidas: negocios.filter((n) => n.estadoContrato === 'valido').length,
        clavesDesalineadas: negocios.filter((n) => n.estadoContrato === 'desalineado').length,
        clavesAusentes: negocios.filter((n) => n.estadoContrato === 'ausente').length,
        cumplimientoPorcentaje: 100,
      },
      estadoLegacyRTDB: {
        nodoPresente: false,
        totalClavesLegacy: 0,
        claves: {},
      },
      diagnostico: {
        categoriaAfectada: categoria,
        parteContratoAfectada: `/codigo_acceso/{CODIGO}`,
        accionRequeridaModelo: 'Actualizar resolución O(1) hacia /codigo_acceso',
        cambiosEjecutadosTorre: ['Consolidación RTDB hacia contrato único'],
        pendientesModeloCategoria: ['Eliminar access_codes del cliente'],
      },
      instruccionModeloCategoria: '# Instrucción oficial: usar contrato único /codigo_acceso para la categoría ' + categoria,
    };
  }

  async consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso> {
    return {
      exito: true,
      mensaje: 'Consolidado contrato único en memoria',
      totalCodigoAcceso: this.indiceCodigoAcceso.size,
      clavesMigradasDesdeLegacy: 0,
      clavesConsistentes: this.indiceCodigoAcceso.size,
      detalles: [],
    };
  }

  async purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy> {
    return {
      exito: true,
      mensaje: 'Nodo legacy purgado en memoria',
      registrosPurgados: 0,
      detalles: [],
    };
  }

  async armonizarDobleIndice(): Promise<ResultadoArmonizacion> {
    return this.consolidarContratoCodigoAcceso();
  }
}

test('Torre de Control — Generación Determinista de Clave Técnica (3 caracteres)', async (t) => {
  await t.test('Genera claves de máximo 3 caracteres', () => {
    const clave1 = generarClaveTecnica('Marisquería Puerto Libres');
    assert.equal(clave1, 'mpl');
    assert.ok(clave1.length <= 3);

    const clave2 = generarClaveTecnica('El Arquitecto');
    assert.equal(clave2, 'ear');
    assert.ok(clave2.length <= 3);
  });

  await t.test('Resuelve colisiones de claves respetando 3 caracteres', () => {
    const existentes = ['mpl'];
    const clave = generarClaveTecnica('Marisquería Playa Linda', existentes);
    assert.equal(clave, 'mp1');
    assert.ok(clave.length <= 3);
  });
});

test('Torre de Control — Contrato Único de Resolución (/codigo_acceso) y Gestión de Negocios', async (t) => {
  const repo = new RepositorioTorreMemoria();
  const servicio = new ServicioTorreControl(repo);

  const datosNegocio1: DatosFichaNegocio = {
    nombre: 'Marisquería Puerto Libres',
    categoria: 'Marisquerias',
    activo: true,
    codigo: 'PL2026-24',
    limite: 3,
    bloqueados: {
      Reparto: false,
      'KDS Cocina': false,
      Caja: false,
      Comandero: false,
    },
    perfiles: ['Administrador', 'Cajero', 'Comandero'],
    instagram: '@puertolibres',
    facebook: 'puertolibres',
    whatsapp: '+527441234567',
    celular: '7441234567',
    correo: 'contacto@puertolibres.com',
    direccion: 'Costera Miguel Alemán 100',
  };

  await t.test('Registra negocio en /{Categoria}/{id} y crea puntero en codigo_acceso', async () => {
    const res = await servicio.registrarOActualizarNegocio(datosNegocio1);
    assert.ok(res.exito);
    assert.equal(res.idGenerado, 'mpl');
    assert.equal(res.rutaRTDB, 'Marisquerias/mpl');

    // Verificar en nodo de categoría
    const enCat = await repo.listarNegociosPorCategoria('Marisquerias');
    assert.equal(enCat.length, 1);
    assert.equal(enCat[0].id, 'mpl');
    assert.equal(enCat[0].nombre, 'Marisquería Puerto Libres');
    assert.equal(enCat[0].codigo, 'PL2026-24');

    // Verificar puntero directo O(1)
    const rutaPuntero = await repo.obtenerRutaPorCodigoAcceso('PL2026-24');
    assert.equal(rutaPuntero, 'Marisquerias/mpl');
  });

  await t.test('Rechaza registrar un segundo negocio con el mismo código de acceso (unicidad)', async () => {
    const negocioDuplicado: DatosFichaNegocio = {
      ...datosNegocio1,
      nombre: 'El Arquitecto',
      codigo: 'PL2026-24', // Código repetido!
    };

    const res = await servicio.registrarOActualizarNegocio(negocioDuplicado);
    assert.equal(res.exito, false);
    assert.match(res.mensaje, /ya está asignado/);

    const enCat = await repo.listarNegociosPorCategoria('Marisquerias');
    assert.equal(enCat.length, 1, 'No debió crearse el negocio duplicado');
  });

  await t.test('Rechaza códigos con caracteres ilegales para Firebase (. # $ [ ] /)', async () => {
    const negocioInvalido: DatosFichaNegocio = {
      ...datosNegocio1,
      nombre: 'El Jarocho',
      codigo: 'PL/2026#1',
    };

    const res = await servicio.registrarOActualizarNegocio(negocioInvalido);
    assert.equal(res.exito, false);
    assert.match(res.mensaje, /no puede contener los caracteres/);
  });

  await t.test('Permite actualizar el código y limpia el puntero anterior en codigo_acceso', async () => {
    const datosActualizados: DatosFichaNegocio = {
      ...datosNegocio1,
      codigo: 'PL2027-25', // Nuevo código
    };

    const res = await servicio.registrarOActualizarNegocio(
      datosActualizados,
      'mpl',
      'PL2026-24'
    );
    assert.ok(res.exito);

    // Puntero anterior debe haber desaparecido
    const rutaVieja = await repo.obtenerRutaPorCodigoAcceso('PL2026-24');
    assert.equal(rutaVieja, null);

    // Nuevo puntero debe existir
    const rutaNueva = await repo.obtenerRutaPorCodigoAcceso('PL2027-25');
    assert.equal(rutaNueva, 'Marisquerias/mpl');
  });

  await t.test('Permite mover negocio a otra categoría sin dejar nodos huérfanos', async () => {
    const datosTraslado: DatosFichaNegocio = {
      ...datosNegocio1,
      categoria: 'Restaurantes',
      codigo: 'PL2027-25',
    };

    const res = await servicio.registrarOActualizarNegocio(
      datosTraslado,
      'mpl',
      'PL2027-25',
      'Marisquerias' // Categoría previa
    );
    assert.ok(res.exito);

    // En Marisquerías ya no debe estar
    const enMarisquerias = await repo.listarNegociosPorCategoria('Marisquerias');
    assert.equal(enMarisquerias.length, 0);

    // En Restaurantes debe estar
    const enRestaurantes = await repo.listarNegociosPorCategoria('Restaurantes');
    assert.equal(enRestaurantes.length, 1);
    assert.equal(enRestaurantes[0].id, 'mpl');

    // Puntero debe apuntar a la nueva categoría
    const rutaNueva = await repo.obtenerRutaPorCodigoAcceso('PL2027-25');
    assert.equal(rutaNueva, 'Restaurantes/mpl');
  });

  await t.test('Retira negocio y elimina ambos nodos (categoría y código de acceso)', async () => {
    const res = await servicio.eliminarNegocio('Restaurantes', 'mpl', 'PL2027-25');
    assert.ok(res.exito);

    const enRestaurantes = await repo.listarNegociosPorCategoria('Restaurantes');
    assert.equal(enRestaurantes.length, 0);

    const puntero = await repo.obtenerRutaPorCodigoAcceso('PL2027-25');
    assert.equal(puntero, null);
  });

  await t.test('Auditoría confirma cumplimiento del contrato único /codigo_acceso sin requerir access_codes', async () => {
    // Registrar un negocio de prueba
    await servicio.registrarOActualizarNegocio({
      ...datosNegocio1,
      categoria: 'Marisquerias',
      codigo: 'MAR2026-01',
    });

    const auditoria = await servicio.auditarNegocio('Marisquerias', 'mpl');
    assert.equal(auditoria.codigoAcceso, 'MAR2026-01');
    assert.equal(auditoria.contratoUnicoValido, true);
    assert.equal(auditoria.indiceCodigoAcceso.existe, true);
    assert.equal(auditoria.indiceCodigoAcceso.coincide, true);
    assert.equal(auditoria.estadoLegacyAccessCodes.presenteEnRTDB, false);

    // Flujo normativo de resolución esperado:
    const rutaResuelta = await repo.obtenerRutaPorCodigoAcceso('MAR2026-01');
    assert.equal(rutaResuelta, 'Marisquerias/mpl');
  });

  await t.test('Auditoría a nivel de Categoría: evalúa cumplimiento colectivo e instruye al modelo', async () => {
    const repCat = await servicio.auditarCategoria('Marisquerias');
    assert.equal(repCat.categoriaId, 'Marisquerias');
    assert.equal(repCat.contratoCodigoAcceso.cumplimientoPorcentaje, 100);
    assert.equal(repCat.estadoLegacyRTDB.nodoPresente, false);
    assert.ok(repCat.diagnostico.cambiosEjecutadosTorre.length > 0);
    assert.ok(repCat.diagnostico.pendientesModeloCategoria.length > 0);
    assert.ok(repCat.instruccionModeloCategoria.includes('codigo_acceso'));
    assert.ok(!repCat.instruccionModeloCategoria.includes('importar herramientas de Torre'));
  });
});
