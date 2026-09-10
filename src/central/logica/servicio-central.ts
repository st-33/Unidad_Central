import type {
  Categoria,
  Negocio,
  DefinicionCapacidad,
  IdentificadorUnico,
  ClaveCapacidad,
  ConfiguracionNegocioExportada,
  CapacidadExportada,
  CategoriaExportada,
  InformacionComercial,
  ModalidadComercial,
  EstadoComercial,
  ReciboEjecucion,
  ResultadoProcesamiento,
} from '../../../contratos';
import {
  RepositorioCategorias,
  RepositorioCategoriasRtdb,
  RepositorioNegocios,
  RepositorioNegociosRtdb,
  RepositorioCapacidades,
  RepositorioCapacidadesRtdb,
  RepositorioSistema,
  RepositorioSistemaRtdb,
  RepositorioComercial,
  RepositorioComercialRtdb,
  RepositorioRecibos,
  RepositorioRecibosRtdb,
} from '../persistencia';
import { Resultado, crearExito, crearFalla } from '../../compartido/resultado';

export interface ResumenCentral {
  readonly inicializado: boolean;
  readonly totalCategorias: number;
  readonly totalNegocios: number;
  readonly totalCapacidades: number;
  readonly negociosActivos: number;
  readonly categorias: readonly Categoria[];
  readonly capacidades: readonly DefinicionCapacidad[];
  readonly negocios: readonly Negocio[];
}

export interface ResultadoInicializacion {
  readonly yaInicializado: boolean;
  readonly categoriasCreadas: number;
  readonly capacidadesCreadas: number;
  readonly negociosCreados: number;
}

export const CATEGORIAS_BASE: readonly Categoria[] = [
  {
    id: 'cat-marisquerias',
    categoria_id: 'cat-marisquerias',
    clave: 'marisquerias',
    nombre: 'Marisquerías',
    descripcion: 'Comercio y distribución de pescados y mariscos',
    activa: true,
    capacidades_permitidas: ['mostrador', 'bascula', 'reparto'],
  },
  {
    id: 'cat-servicio-a-domicilio',
    categoria_id: 'cat-servicio-a-domicilio',
    clave: 'servicio_a_domicilio',
    nombre: 'Servicio a Domicilio',
    descripcion: 'Operaciones de logística y entrega a domicilio',
    activa: true,
    capacidades_permitidas: ['reparto'],
  },
  {
    id: 'cat-verdulerias',
    categoria_id: 'cat-verdulerias',
    clave: 'verdulerias',
    nombre: 'Verdulerías',
    descripcion: 'Comercio de frutas y verduras frescas',
    activa: true,
    capacidades_permitidas: ['mostrador', 'bascula', 'reparto'],
  },
  {
    id: 'cat-hornos-de-pan',
    categoria_id: 'cat-hornos-de-pan',
    clave: 'hornos_de_pan',
    nombre: 'Hornos de Pan',
    descripcion: 'Elaboración y venta de productos de panadería',
    activa: true,
    capacidades_permitidas: ['mostrador', 'horno', 'reparto'],
  },
];

export const CAPACIDADES_BASE: readonly DefinicionCapacidad[] = [
  {
    id: 'cap-mostrador',
    clave: 'mostrador',
    nombre: 'Atención en mostrador',
    descripcion: 'Venta y atención presencial en barra o mostrador',
    disponible: true,
  },
  {
    id: 'cap-bascula',
    clave: 'bascula',
    nombre: 'Integración con báscula',
    descripcion: 'Pesaje y cálculo por peso para venta a granel',
    disponible: true,
  },
  {
    id: 'cap-reparto',
    clave: 'reparto',
    nombre: 'Reparto a domicilio',
    descripcion: 'Gestión y despacho de entregas a domicilio',
    disponible: true,
  },
  {
    id: 'cap-horno',
    clave: 'horno',
    nombre: 'Producción de horneado',
    descripcion: 'Gestión de horneado y procesos de panificación',
    disponible: true,
  },
];

export const NEGOCIOS_BASE: readonly Negocio[] = [
  {
    id: 'neg-puerto-libres',
    negocio_id: 'neg-puerto-libres',
    categoria_id: 'cat-marisquerias',
    nombre: 'Marisquería Puerto Libres S.A.',
    nombre_comercial: 'Marisquería Puerto Libres',
    activo: true,
    ruta_operativa: 'marisquerias/puerto-libres',
    alias: ['puerto-libres', 'marisqueria'],
    configuracion: {
      capacidades: {
        mostrador: { activa: true },
        bascula: { activa: true },
        reparto: { activa: false },
      },
    },
  },
  {
    id: 'neg-adirepart',
    negocio_id: 'neg-adirepart',
    categoria_id: 'cat-servicio-a-domicilio',
    nombre: 'ADIRepart Logística',
    nombre_comercial: 'ADIRepart',
    activo: true,
    ruta_operativa: 'logistica/adirepart',
    alias: ['adirepart', 'reparto'],
    configuracion: {
      capacidades: {
        reparto: { activa: true },
      },
    },
  },
  {
    id: 'neg-verduleria',
    negocio_id: 'neg-verduleria',
    categoria_id: 'cat-verdulerias',
    nombre: 'Verdulería Central',
    nombre_comercial: 'Verdulería',
    activo: true,
    ruta_operativa: 'verdulerias/central',
    alias: ['verduleria'],
    configuracion: {
      capacidades: {
        mostrador: { activa: true },
        bascula: { activa: true },
        reparto: { activa: false },
      },
    },
  },
  {
    id: 'neg-horno-de-pan',
    negocio_id: 'neg-horno-de-pan',
    categoria_id: 'cat-hornos-de-pan',
    nombre: 'Horno de Pan Tradicional',
    nombre_comercial: 'Horno de Pan',
    activo: true,
    ruta_operativa: 'panaderias/horno-tradicional',
    alias: ['horno', 'panaderia'],
    configuracion: {
      capacidades: {
        mostrador: { activa: true },
        horno: { activa: true },
        reparto: { activa: false },
      },
    },
  },
];

export class ServicioCentral {
  private readonly repoCategorias: RepositorioCategorias;
  private readonly repoNegocios: RepositorioNegocios;
  private readonly repoCapacidades: RepositorioCapacidades;
  private readonly repoSistema: RepositorioSistema;
  private readonly repoComercial: RepositorioComercial;
  private readonly repoRecibos: RepositorioRecibos;

  constructor(
    repoCategorias: RepositorioCategorias = new RepositorioCategoriasRtdb(),
    repoNegocios: RepositorioNegocios = new RepositorioNegociosRtdb(),
    repoCapacidades: RepositorioCapacidades = new RepositorioCapacidadesRtdb(),
    repoSistema: RepositorioSistema = new RepositorioSistemaRtdb(),
    repoComercial: RepositorioComercial = new RepositorioComercialRtdb(),
    repoRecibos: RepositorioRecibos = new RepositorioRecibosRtdb()
  ) {
    this.repoCategorias = repoCategorias;
    this.repoNegocios = repoNegocios;
    this.repoCapacidades = repoCapacidades;
    this.repoSistema = repoSistema;
    this.repoComercial = repoComercial;
    this.repoRecibos = repoRecibos;
  }

  /**
   * Consulta el estado de la estructura base y los registros reales en Central.
   */
  async obtenerResumen(): Promise<Resultado<ResumenCentral, Error>> {
    try {
      const [estadoSistema, categorias, negocios, capacidades] = await Promise.all([
        this.repoSistema.obtenerEstado(),
        this.repoCategorias.listar(),
        this.repoNegocios.listar(),
        this.repoCapacidades.listar(),
      ]);

      const activos = negocios.filter((n) => n.activo).length;

      return crearExito({
        inicializado: Boolean(estadoSistema?.inicializado),
        totalCategorias: categorias.length,
        totalNegocios: negocios.length,
        totalCapacidades: capacidades.length,
        negociosActivos: activos,
        categorias,
        capacidades,
        negocios,
      });
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Falla al consultar resumen de Central')
      );
    }
  }

  /**
   * Inicializa de forma explícita, segura e idempotente la estructura operativa base de Central.
   * Si las entidades ya existen en RTDB, no sobrescribe ni destruye configuraciones modificadas.
   */
  async inicializarEstructuraBase(): Promise<Resultado<ResultadoInicializacion, Error>> {
    try {
      let categoriasCreadas = 0;
      let capacidadesCreadas = 0;
      let negociosCreados = 0;

      // 1. Categorías base
      for (const cat of CATEGORIAS_BASE) {
        const existente = await this.repoCategorias.obtenerPorId(cat.id);
        if (!existente) {
          await this.repoCategorias.guardar(cat);
          categoriasCreadas++;
        }
      }

      // 2. Capacidades base
      for (const cap of CAPACIDADES_BASE) {
        const existente = await this.repoCapacidades.obtenerPorId(cap.id);
        if (!existente) {
          await this.repoCapacidades.guardar(cap);
          capacidadesCreadas++;
        }
      }

      // 3. Negocios iniciales con configuración propia
      for (const neg of NEGOCIOS_BASE) {
        const existente = await this.repoNegocios.obtenerPorId(neg.id);
        if (!existente) {
          await this.repoNegocios.guardar(neg);
          negociosCreados++;
        }
      }

      const estadoActual = await this.repoSistema.obtenerEstado();
      const yaEstabaInicializado =
        Boolean(estadoActual?.inicializado) &&
        categoriasCreadas === 0 &&
        capacidadesCreadas === 0 &&
        negociosCreados === 0;

      if (!estadoActual?.inicializado) {
        await this.repoSistema.marcarInicializado(2);
      }

      return crearExito({
        yaInicializado: yaEstabaInicializado,
        categoriasCreadas,
        capacidadesCreadas,
        negociosCreados,
      });
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al inicializar la estructura base')
      );
    }
  }

  /**
   * Activa o desactiva una capacidad concreta en un negocio específico.
   * 
   * REGLA ARQUITECTÓNICA INQUEBRANTABLE:
   * CAPACIDAD EXISTE GLOBALMENTE → CATEGORÍA DEFINE SI APLICA → NEGOCIO DEFINE SI ESTÁ ACTIVA
   * 
   * Validaciones aplicadas:
   * 1. El negocio debe existir
   * 2. La capacidad debe existir globalmente
   * 3. La capacidad debe estar disponible (disponible: true)
   * 4. La categoría del negocio debe permitir esa capacidad
   * 5. Solo entonces se puede activar/desactivar en el negocio
   */
  async alternarCapacidadNegocio(
    negocioId: IdentificadorUnico,
    claveCapacidad: ClaveCapacidad,
    activa: boolean
  ): Promise<Resultado<Negocio, Error>> {
    try {
      // 1. Validar que el negocio existe
      const negocio = await this.repoNegocios.obtenerPorId(negocioId);
      if (!negocio) {
        return crearFalla(new Error(`El negocio "${negocioId}" no existe en Central.`));
      }

      // 2. Validar que la capacidad existe globalmente
      const capacidades = await this.repoCapacidades.listar();
      const capacidad = capacidades.find((c) => c.clave === claveCapacidad);
      if (!capacidad) {
        return crearFalla(
          new Error(`La capacidad "${claveCapacidad}" no existe en el sistema.`)
        );
      }

      // 3. Validar que la capacidad está disponible
      if (!capacidad.disponible) {
        return crearFalla(
          new Error(
            `La capacidad "${claveCapacidad}" no está disponible para asignación. Está en desuso.`
          )
        );
      }

      // 4. Validar que la categoría del negocio permite esta capacidad
      const categoria = await this.repoCategorias.obtenerPorId(negocio.categoria_id);
      if (!categoria) {
        return crearFalla(
          new Error(`La categoría "${negocio.categoria_id}" del negocio no existe.`)
        );
      }

      if (!categoria.capacidades_permitidas.includes(claveCapacidad)) {
        return crearFalla(
          new Error(
            `La categoría "${categoria.nombre}" no permite la capacidad "${capacidad.nombre}". ` +
              `Capacidades permitidas: ${categoria.capacidades_permitidas.join(', ')}.`
          )
        );
      }

      // 5. Actualizar el estado de la capacidad en el negocio
      const capacidadesActualizadas = {
        ...negocio.configuracion.capacidades,
        [claveCapacidad]: { activa },
      };

      const configuracionNueva = {
        ...negocio.configuracion,
        capacidades: capacidadesActualizadas,
      };

      await this.repoNegocios.actualizarConfiguracion(negocioId, configuracionNueva);

      const negocioActualizado: Negocio = {
        ...negocio,
        configuracion: configuracionNueva,
      };

      return crearExito(negocioActualizado);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al actualizar la capacidad del negocio')
      );
    }
  }

  async registrarCategoria(categoria: Categoria): Promise<Resultado<void, Error>> {
    try {
      if (!categoria.id || !categoria.clave || !categoria.nombre) {
        return crearFalla(new Error('La categoría requiere id, clave y nombre válidos.'));
      }
      await this.repoCategorias.guardar(categoria);
      return crearExito(undefined);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al registrar categoría')
      );
    }
  }

  async registrarNegocio(negocio: Negocio): Promise<Resultado<void, Error>> {
    try {
      if (!negocio.id || !negocio.categoria_id || !negocio.nombre) {
        return crearFalla(new Error('El negocio requiere id, categoria_id y nombre válidos.'));
      }

      const categoria = await this.repoCategorias.obtenerPorId(negocio.categoria_id);
      if (!categoria) {
        return crearFalla(
          new Error(`La categoría con id "${negocio.categoria_id}" no existe en Central.`)
        );
      }

      await this.repoNegocios.guardar(negocio);
      return crearExito(undefined);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al registrar negocio')
      );
    }
  }

  async registrarCapacidad(capacidad: DefinicionCapacidad): Promise<Resultado<void, Error>> {
    try {
      if (!capacidad.id || !capacidad.clave || !capacidad.nombre) {
        return crearFalla(new Error('La capacidad requiere id, clave y nombre válidos.'));
      }
      await this.repoCapacidades.guardar(capacidad);
      return crearExito(undefined);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al registrar capacidad')
      );
    }
  }

  async listarNegociosPorCategoria(
    categoriaId: IdentificadorUnico
  ): Promise<Resultado<readonly Negocio[], Error>> {
    try {
      const negocios = await this.repoNegocios.listarPorCategoria(categoriaId);
      return crearExito(negocios);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al listar negocios por categoría')
      );
    }
  }

  /**
   * EXPORTACIÓN: Genera el payload de configuración que un negocio específico
   * debe recibir para conocer su contexto y capacidades activas.
   * 
   * Este método es el punto de salida canónico de datos desde Central hacia
   * los repositorios operativos (Marisquerías, Verdulerías, etc.).
   */
  async exportarConfiguracionNegocio(
    negocioId: IdentificadorUnico
  ): Promise<Resultado<ConfiguracionNegocioExportada, Error>> {
    try {
      const negocio = await this.repoNegocios.obtenerPorId(negocioId);
      if (!negocio) {
        return crearFalla(new Error(`El negocio "${negocioId}" no existe en Central.`));
      }

      const categoria = await this.repoCategorias.obtenerPorId(negocio.categoria_id);
      if (!categoria) {
        return crearFalla(
          new Error(`La categoría "${negocio.categoria_id}" del negocio no existe.`)
        );
      }

      // Extraer solo las capacidades que están activas
      const capacidadesActivas = Object.entries(negocio.configuracion.capacidades)
        .filter(([_, estado]) => estado.activa)
        .map(([clave]) => clave as ClaveCapacidad);

      const payload: ConfiguracionNegocioExportada = {
        idNegocio: negocio.id,
        nombreComercial: negocio.nombre_comercial,
        categoriaId: categoria.categoria_id,
        categoriaNombre: categoria.nombre,
        categoriaClave: categoria.clave,
        capacidadesActivas,
        activo: negocio.activo,
      };

      return crearExito(payload);
    } catch (error) {
      return crearFalla(
        error instanceof Error
          ? error
          : new Error('Error al exportar configuración del negocio')
      );
    }
  }

  /**
   * EXPORTACIÓN: Lista todas las capacidades disponibles en formato simplificado
   * para consumo externo.
   */
  async exportarCatalogoCapacidades(): Promise<Resultado<readonly CapacidadExportada[], Error>> {
    try {
      const capacidades = await this.repoCapacidades.listar();
      const exportadas: CapacidadExportada[] = capacidades
        .filter((c) => c.disponible)
        .map((c) => ({
          clave: c.clave,
          nombre: c.nombre,
          descripcion: c.descripcion,
        }));

      return crearExito(exportadas);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al exportar catálogo de capacidades')
      );
    }
  }

  /**
   * EXPORTACIÓN: Obtiene información de una categoría específica en formato
   * simplificado para consumo externo.
   */
  async exportarCategoria(
    categoriaId: IdentificadorUnico
  ): Promise<Resultado<CategoriaExportada, Error>> {
    try {
      const categoria = await this.repoCategorias.obtenerPorId(categoriaId);
      if (!categoria) {
        return crearFalla(new Error(`La categoría "${categoriaId}" no existe en Central.`));
      }

      const exportada: CategoriaExportada = {
        id: categoria.categoria_id,
        clave: categoria.clave,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        capacidadesPermitidas: categoria.capacidades_permitidas,
      };

      return crearExito(exportada);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al exportar categoría')
      );
    }
  }

  /**
   * Inicializa la configuración comercial de un negocio.
   * Si ya existe, no sobrescribe.
   */
  async inicializarComercialNegocio(
    negocioId: IdentificadorUnico,
    modalidad: ModalidadComercial = 'por_uso'
  ): Promise<Resultado<InformacionComercial, Error>> {
    try {
      const existente = await this.repoComercial.obtener(negocioId);
      if (existente) {
        return crearExito(existente);
      }

      const infoComercial: InformacionComercial = {
        negocio_id: negocioId,
        modalidad,
        estado_comercial: 'activo',
        suscripcion_estado: 'ninguna',
        peaje_config: {
          habilitado: modalidad === 'por_uso',
          tarifa_base: 0,
          moneda: 'MXN',
        },
      };

      await this.repoComercial.guardar(infoComercial);
      return crearExito(infoComercial);
    } catch (error) {
      return crearFalla(
        error instanceof Error
          ? error
          : new Error('Error al inicializar configuración comercial')
      );
    }
  }

  /**
   * Obtiene la información comercial de un negocio.
   */
  async obtenerComercialNegocio(
    negocioId: IdentificadorUnico
  ): Promise<Resultado<InformacionComercial, Error>> {
    try {
      const info = await this.repoComercial.obtener(negocioId);
      if (!info) {
        return crearFalla(
          new Error(`No existe configuración comercial para el negocio "${negocioId}"`)
        );
      }
      return crearExito(info);
    } catch (error) {
      return crearFalla(
        error instanceof Error
          ? error
          : new Error('Error al obtener configuración comercial')
      );
    }
  }

  /**
   * Actualiza el estado comercial de un negocio.
   */
  async actualizarEstadoComercial(
    negocioId: IdentificadorUnico,
    estadoComercial: EstadoComercial
  ): Promise<Resultado<void, Error>> {
    try {
      await this.repoComercial.actualizarEstadoComercial(negocioId, estadoComercial);
      return crearExito(undefined);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al actualizar estado comercial')
      );
    }
  }

  /**
   * Procesa un recibo de ejecución.
   * 
   * REGLA COMERCIAL:
   * - Si el negocio tiene suscripción vigente -> cargo 0
   * - Si el negocio no tiene suscripción -> aplica peaje según configuración
   * - Solo procesa recibos en estado 'completado'
   * - Valida idempotencia para evitar procesamiento duplicado
   */
  async procesarRecibo(
    recibo: ReciboEjecucion
  ): Promise<Resultado<ResultadoProcesamiento, Error>> {
    try {
      // 1. Validar estado del recibo
      if (recibo.estado !== 'completado') {
        return crearFalla(
          new Error(
            `Solo se procesan recibos completados. Estado actual: ${recibo.estado}`
          )
        );
      }

      // 2. Verificar idempotencia
      const procesamientoExistente = await this.repoRecibos.obtenerProcesamiento(
        recibo.evento_id
      );
      if (procesamientoExistente) {
        return crearExito(procesamientoExistente);
      }

      // 3. Obtener información comercial del negocio origen
      const infoComercial = await this.repoComercial.obtener(recibo.negocio_id_origen);
      if (!infoComercial) {
        return crearFalla(
          new Error(
            `No existe configuración comercial para el negocio "${recibo.negocio_id_origen}"`
          )
        );
      }

      // 4. Determinar si aplica cargo
      let cargoAplicado = false;
      let montoCargo = 0;
      let razon = '';

      if (infoComercial.suscripcion_estado === 'vigente') {
        // Suscripción vigente -> sin cargo
        cargoAplicado = false;
        montoCargo = 0;
        razon = 'Suscripción vigente';
      } else if (infoComercial.peaje_config.habilitado) {
        // Sin suscripción -> aplicar peaje
        cargoAplicado = true;
        montoCargo = recibo.tarifa_aplicada || infoComercial.peaje_config.tarifa_base;
        razon = 'Cargo por uso (sin suscripción)';
      } else {
        // Peaje deshabilitado
        cargoAplicado = false;
        montoCargo = 0;
        razon = 'Peaje deshabilitado';
      }

      // 5. Registrar procesamiento
      const resultado: ResultadoProcesamiento = {
        recibo_id: recibo.evento_id,
        cargo_aplicado: cargoAplicado,
        monto_cargo: montoCargo,
        razon,
        timestamp_procesamiento: Date.now(),
      };

      await this.repoRecibos.guardarRecibo(recibo);
      await this.repoRecibos.guardarProcesamiento(resultado);

      return crearExito(resultado);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al procesar recibo')
      );
    }
  }

  /**
   * Obtiene el historial de recibos procesados de un negocio.
   */
  async obtenerRecibosNegocio(
    negocioId: IdentificadorUnico
  ): Promise<Resultado<readonly ReciboEjecucion[], Error>> {
    try {
      const recibos = await this.repoRecibos.listarRecibosPorNegocio(negocioId);
      return crearExito(recibos);
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al obtener recibos del negocio')
      );
    }
  }
}
