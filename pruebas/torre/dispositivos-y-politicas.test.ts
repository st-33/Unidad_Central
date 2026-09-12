import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ServicioTorreControl } from '../../src/torre/logica/servicio-torre';
import type { RepositorioTorre } from '../../src/torre/persistencia/repositorio-torre';
import type {
  NegocioRTDB,
  DispositivoVinculado,
  PoliticaDispositivos,
  AuditoriaNegocioReporte,
  ReporteIntegracionCategoria,
  ResultadoArmonizacion,
  ResultadoConsolidacionCodigoAcceso,
  ResultadoPurgaLegacy,
} from '../../src/torre/tipos';

class MockRepositorioTorre implements RepositorioTorre {
  public negocios: Map<string, NegocioRTDB> = new Map();
  public accessCodes: Map<string, string> = new Map();
  public codigoAcceso: Map<string, string> = new Map();
  public centralFichas: Map<string, unknown> = new Map();
  public dispositivos: Map<string, Record<string, DispositivoVinculado>> = new Map();

  async listarNegociosPorCategoria(categoria: string): Promise<readonly NegocioRTDB[]> {
    return Array.from(this.negocios.values()).filter((n) => n.categoria === categoria);
  }

  suscribirNegociosPorCategoria(
    _categoria: string,
    alCambiar: (negocios: readonly NegocioRTDB[]) => void
  ): () => void {
    alCambiar(Array.from(this.negocios.values()));
    return () => {};
  }

  async listarCategorias(): Promise<readonly string[]> {
    return ['Marisquerias', 'Taquerias'];
  }

  async obtenerRutaPorCodigoAcceso(codigo: string): Promise<string | null> {
    return this.accessCodes.get(codigo) || this.codigoAcceso.get(codigo) || null;
  }

  async guardarNegocio(
    negocio: NegocioRTDB,
    codigoAnterior?: string,
    categoriaAnterior?: string
  ): Promise<void> {
    if (categoriaAnterior && categoriaAnterior !== negocio.categoria) {
      this.negocios.delete(`${categoriaAnterior}/${negocio.id}`);
    }
    const ruta = `${negocio.categoria}/${negocio.id}`;
    this.negocios.set(ruta, negocio);
    this.accessCodes.set(negocio.codigo, ruta);
    this.codigoAcceso.set(negocio.codigo, ruta);

    if (codigoAnterior && codigoAnterior !== negocio.codigo) {
      this.accessCodes.delete(codigoAnterior);
      this.codigoAcceso.delete(codigoAnterior);
    }

    this.centralFichas.set(negocio.id, {
      id: negocio.id,
      nombre: negocio.nombre,
      categoria: negocio.categoria,
      politica: negocio.politicas_dispositivos,
    });
  }

  async eliminarNegocio(categoria: string, id: string, codigo: string): Promise<void> {
    this.negocios.delete(`${categoria}/${id}`);
    this.accessCodes.delete(codigo);
    this.codigoAcceso.delete(codigo);
    this.centralFichas.delete(id);
  }

  async obtenerDispositivos(_categoria: string, id: string): Promise<Record<string, DispositivoVinculado>> {
    return this.dispositivos.get(id) || {};
  }

  async actualizarEstadoDispositivo(
    _categoria: string,
    id: string,
    deviceId: string,
    estado: 'activo' | 'bloqueado'
  ): Promise<void> {
    const devs = this.dispositivos.get(id) || {};
    if (devs[deviceId]) {
      devs[deviceId].estado = estado;
      this.dispositivos.set(id, devs);
    }
  }

  async eliminarDispositivo(_categoria: string, id: string, deviceId: string): Promise<void> {
    const devs = this.dispositivos.get(id) || {};
    delete devs[deviceId];
    this.dispositivos.set(id, devs);
  }

  async autorizarNuevoDispositivo(
    _categoria: string,
    id: string,
    dispositivo: DispositivoVinculado
  ): Promise<void> {
    const devs = this.dispositivos.get(id) || {};
    devs[dispositivo.deviceId] = dispositivo;
    this.dispositivos.set(id, devs);
  }

  async actualizarPoliticaDispositivos(
    _categoria: string,
    id: string,
    politicas: PoliticaDispositivos
  ): Promise<void> {
    for (const [key, val] of this.negocios.entries()) {
      if (val.id === id) {
        val.politicas_dispositivos = politicas;
        this.negocios.set(key, val);
      }
    }
  }

  async auditarNegocio(categoria: string, id: string): Promise<AuditoriaNegocioReporte> {
    const neg = this.negocios.get(`${categoria}/${id}`);
    const cod = neg?.codigo || '';
    const ruta = `${categoria}/${id}`;
    const tieneAccess = this.accessCodes.get(cod) === ruta;
    const tieneCodigo = this.codigoAcceso.get(cod) === ruta;

    return {
      idNegocio: id,
      nombreNegocio: neg?.nombre || id,
      categoria,
      codigoAcceso: cod,
      rutaEsperada: ruta,
      activo: neg?.activo ?? true,
      limiteDispositivos: neg?.limite || 1,
      indiceCodigoAcceso: {
        existe: Boolean(this.codigoAcceso.get(cod)),
        rutaApunta: this.codigoAcceso.get(cod) || null,
        coincide: tieneCodigo,
      },
      contratoUnicoValido: tieneCodigo,
      estadoLegacyAccessCodes: {
        presenteEnRTDB: this.accessCodes.has(cod),
        rutaApunta: this.accessCodes.get(cod) || null,
        requierePurga: this.accessCodes.has(cod),
      },
      dispositivosOperativosTotal: Object.keys(this.dispositivos.get(id) || {}).length,
      dispositivosAutorizadosTotal: 0,
      cuposDisponibles: Math.max(0, (neg?.limite || 1) - Object.keys(this.dispositivos.get(id) || {}).length),
      politicasDispositivos: neg?.politicas_dispositivos || {
        permitir_navegador_web: true,
        permitir_dispositivos_genericos: true,
        validar_hardware_estricto: false,
      },
      modulosBloqueados: neg?.bloqueados || {},
      perfilesAutorizados: neg?.perfiles || ['Administrador'],
      hallazgos: [],
    };
  }

  async auditarCategoria(categoria: string): Promise<ReporteIntegracionCategoria> {
    const lista = await this.listarNegociosPorCategoria(categoria);
    const negocios = lista.map((neg) => {
      const cod = neg.codigo ? neg.codigo.trim().toUpperCase() : '';
      const rutaEsperada = `${categoria}/${neg.id.toLowerCase()}`;
      const rutaEnCodigoAcceso = this.codigoAcceso.get(cod) || null;
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
        totalEnRTDB: this.codigoAcceso.size,
        totalAsignadosCategoria: lista.filter((n) => n.codigo).length,
        clavesValidas: negocios.filter((n) => n.estadoContrato === 'valido').length,
        clavesDesalineadas: negocios.filter((n) => n.estadoContrato === 'desalineado').length,
        clavesAusentes: negocios.filter((n) => n.estadoContrato === 'ausente').length,
        cumplimientoPorcentaje: 100,
      },
      estadoLegacyRTDB: {
        nodoPresente: this.accessCodes.size > 0,
        totalClavesLegacy: this.accessCodes.size,
        claves: Object.fromEntries(this.accessCodes.entries()),
      },
      diagnostico: {
        categoriaAfectada: categoria,
        parteContratoAfectada: `/codigo_acceso/{CODIGO}`,
        accionRequeridaModelo: 'Actualizar resolución O(1) hacia /codigo_acceso',
        cambiosEjecutadosTorre: ['Consolidación RTDB hacia contrato único'],
        pendientesModeloCategoria: ['Eliminar access_codes del cliente'],
      },
      instruccionModeloCategoria: '# Instrucción oficial para categoría ' + categoria,
    };
  }

  async consolidarContratoCodigoAcceso(): Promise<ResultadoConsolidacionCodigoAcceso> {
    let migradas = 0;
    for (const [k, v] of this.accessCodes.entries()) {
      if (!this.codigoAcceso.has(k)) {
        this.codigoAcceso.set(k, v);
        migradas++;
      }
    }
    return {
      exito: true,
      mensaje: 'Contrato consolidado',
      totalCodigoAcceso: this.codigoAcceso.size,
      clavesMigradasDesdeLegacy: migradas,
      clavesConsistentes: this.codigoAcceso.size,
      detalles: [],
    };
  }

  async purgarNodoLegacyAccessCodes(): Promise<ResultadoPurgaLegacy> {
    const total = this.accessCodes.size;
    this.accessCodes.clear();
    return {
      exito: true,
      mensaje: 'Nodo legacy purgado',
      registrosPurgados: total,
      detalles: [],
    };
  }

  async armonizarDobleIndice(): Promise<ResultadoArmonizacion> {
    return this.consolidarContratoCodigoAcceso();
  }
}

describe('Torre de Control — Dispositivos, Políticas de Navegador y Central', () => {
  it('Guarda políticas de navegador web y genéricos al registrar negocio', async () => {
    const repo = new MockRepositorioTorre();
    const servicio = new ServicioTorreControl(repo);

    const res = await servicio.registrarOActualizarNegocio({
      nombre: 'Marisquería El Faro',
      categoria: 'Marisquerias',
      activo: true,
      codigo: 'FARO2026',
      limite: 4,
      bloqueados: {},
      perfiles: ['Administrador', 'Mesero', 'Cocina'],
      politicas_dispositivos: {
        permitir_navegador_web: true,
        permitir_dispositivos_genericos: true,
        validar_hardware_estricto: false,
      },
      direccion: 'Av. Costera 12',
      instagram: '',
      facebook: '',
      whatsapp: '',
      celular: '',
      correo: '',
    });

    assert.equal(res.exito, true);
    const guardado = repo.negocios.get('Marisquerias/mef');
    assert.ok(guardado);
    assert.equal(guardado.politicas_dispositivos?.permitir_navegador_web, true);
    assert.equal(guardado.politicas_dispositivos?.permitir_dispositivos_genericos, true);

    // Verifica que access_codes y codigo_acceso estén sincronizados
    assert.equal(repo.accessCodes.get('FARO2026'), 'Marisquerias/mef');
    assert.equal(repo.codigoAcceso.get('FARO2026'), 'Marisquerias/mef');
  });

  it('Permite autorizar un nuevo dispositivo y conmutar su estado', async () => {
    const repo = new MockRepositorioTorre();
    const servicio = new ServicioTorreControl(repo);

    // Pre-autorizar un dispositivo
    const resAuth = await servicio.autorizarNuevoDispositivo('Marisquerias', 'mpl', {
      deviceId: 'ADI-WEB-TEST-001',
      alias: 'Tablet Cocina',
      estado: 'activo',
      brand: 'Google Chrome Web',
      model: 'PC Browser',
      rolesPermitidos: { cocina: true },
    });
    assert.equal(resAuth.exito, true);

    const devs = await servicio.obtenerDispositivos('Marisquerias', 'mpl');
    assert.ok(devs['ADI-WEB-TEST-001']);
    assert.equal(devs['ADI-WEB-TEST-001'].alias, 'Tablet Cocina');
    assert.equal(devs['ADI-WEB-TEST-001'].estado, 'activo');

    // Bloquear el dispositivo
    const resBloq = await servicio.actualizarEstadoDispositivo(
      'Marisquerias',
      'mpl',
      'ADI-WEB-TEST-001',
      'bloqueado'
    );
    assert.equal(resBloq.exito, true);

    const devsPost = await servicio.obtenerDispositivos('Marisquerias', 'mpl');
    assert.equal(devsPost['ADI-WEB-TEST-001'].estado, 'bloqueado');

    // Desvincular / Liberar slot
    const resElim = await servicio.eliminarDispositivo('Marisquerias', 'mpl', 'ADI-WEB-TEST-001');
    assert.equal(resElim.exito, true);

    const devsFinal = await servicio.obtenerDispositivos('Marisquerias', 'mpl');
    assert.equal(devsFinal['ADI-WEB-TEST-001'], undefined);
  });

  it('Audita el cumplimiento del contrato único /codigo_acceso y consolida registros legacy', async () => {
    const repo = new MockRepositorioTorre();
    const servicio = new ServicioTorreControl(repo);

    await servicio.registrarOActualizarNegocio({
      nombre: 'Marisquería Puerto Libres',
      categoria: 'Marisquerias',
      activo: true,
      codigo: 'PL2026-24',
      limite: 3,
      bloqueados: {},
      perfiles: ['Administrador', 'Cajero'],
      direccion: 'Av. Costera 100',
      instagram: '',
      facebook: '',
      whatsapp: '',
      celular: '',
      correo: '',
    });

    const reporte = await servicio.auditarNegocio('Marisquerias', 'mpl');
    assert.equal(reporte.idNegocio, 'mpl');
    assert.equal(reporte.codigoAcceso, 'PL2026-24');
    assert.equal(reporte.contratoUnicoValido, true);
    assert.equal(reporte.indiceCodigoAcceso.existe, true);
    assert.equal(reporte.indiceCodigoAcceso.coincide, true);

    const resConsolidacion = await servicio.consolidarContratoCodigoAcceso();
    assert.equal(resConsolidacion.exito, true);
  });
});
