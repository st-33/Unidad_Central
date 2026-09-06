import type {
  Categoria,
  Negocio,
  DefinicionCapacidad,
  IdentificadorUnico,
  ClaveCapacidad,
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
    clave: 'marisquerias',
    nombre: 'Marisquerías',
    descripcion: 'Comercio y distribución de pescados y mariscos',
    activa: true,
  },
  {
    id: 'cat-servicio-a-domicilio',
    clave: 'servicio_a_domicilio',
    nombre: 'Servicio a Domicilio',
    descripcion: 'Operaciones de logística y entrega a domicilio',
    activa: true,
  },
  {
    id: 'cat-verdulerias',
    clave: 'verdulerias',
    nombre: 'Verdulerías',
    descripcion: 'Comercio de frutas y verduras frescas',
    activa: true,
  },
  {
    id: 'cat-hornos-de-pan',
    clave: 'hornos_de_pan',
    nombre: 'Hornos de Pan',
    descripcion: 'Elaboración y venta de productos de panadería',
    activa: true,
  },
];

export const CAPACIDADES_BASE: readonly DefinicionCapacidad[] = [
  {
    id: 'cap-mostrador',
    clave: 'mostrador',
    nombre: 'Atención en mostrador',
    descripcion: 'Venta y atención presencial en barra o mostrador',
  },
  {
    id: 'cap-bascula',
    clave: 'bascula',
    nombre: 'Integración con báscula',
    descripcion: 'Pesaje y cálculo por peso para venta a granel',
  },
  {
    id: 'cap-reparto',
    clave: 'reparto',
    nombre: 'Reparto a domicilio',
    descripcion: 'Gestión y despacho de entregas a domicilio',
  },
  {
    id: 'cap-horno',
    clave: 'horno',
    nombre: 'Producción de horneado',
    descripcion: 'Gestión de horneado y procesos de panificación',
  },
];

export const NEGOCIOS_BASE: readonly Negocio[] = [
  {
    id: 'neg-puerto-libres',
    categoriaId: 'cat-marisquerias',
    nombre: 'Marisquería Puerto Libres S.A.',
    nombreComercial: 'Marisquería Puerto Libres',
    activo: true,
    configuracion: {
      capacidades: {
        mostrador: { activa: true },
        bascula: { activa: true },
        reparto: { activa: false },
        horno: { activa: false },
      },
    },
  },
  {
    id: 'neg-adirepart',
    categoriaId: 'cat-servicio-a-domicilio',
    nombre: 'ADIRepart Logística',
    nombreComercial: 'ADIRepart',
    activo: true,
    configuracion: {
      capacidades: {
        mostrador: { activa: false },
        bascula: { activa: false },
        reparto: { activa: true },
        horno: { activa: false },
      },
    },
  },
  {
    id: 'neg-verduleria',
    categoriaId: 'cat-verdulerias',
    nombre: 'Verdulería Central',
    nombreComercial: 'Verdulería',
    activo: true,
    configuracion: {
      capacidades: {
        mostrador: { activa: true },
        bascula: { activa: true },
        reparto: { activa: false },
        horno: { activa: false },
      },
    },
  },
  {
    id: 'neg-horno-de-pan',
    categoriaId: 'cat-hornos-de-pan',
    nombre: 'Horno de Pan Tradicional',
    nombreComercial: 'Horno de Pan',
    activo: true,
    configuracion: {
      capacidades: {
        mostrador: { activa: true },
        bascula: { activa: false },
        reparto: { activa: false },
        horno: { activa: true },
      },
    },
  },
];

export class ServicioCentral {
  private readonly repoCategorias: RepositorioCategorias;
  private readonly repoNegocios: RepositorioNegocios;
  private readonly repoCapacidades: RepositorioCapacidades;
  private readonly repoSistema: RepositorioSistema;

  constructor(
    repoCategorias: RepositorioCategorias = new RepositorioCategoriasRtdb(),
    repoNegocios: RepositorioNegocios = new RepositorioNegociosRtdb(),
    repoCapacidades: RepositorioCapacidades = new RepositorioCapacidadesRtdb(),
    repoSistema: RepositorioSistema = new RepositorioSistemaRtdb()
  ) {
    this.repoCategorias = repoCategorias;
    this.repoNegocios = repoNegocios;
    this.repoCapacidades = repoCapacidades;
    this.repoSistema = repoSistema;
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
   * La configuración se persiste dentro del propio negocio en RTDB.
   */
  async alternarCapacidadNegocio(
    negocioId: IdentificadorUnico,
    claveCapacidad: ClaveCapacidad,
    activa: boolean
  ): Promise<Resultado<Negocio, Error>> {
    try {
      const negocio = await this.repoNegocios.obtenerPorId(negocioId);
      if (!negocio) {
        return crearFalla(new Error(`El negocio "${negocioId}" no existe en Central.`));
      }

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
      if (!negocio.id || !negocio.categoriaId || !negocio.nombre) {
        return crearFalla(new Error('El negocio requiere id, categoriaId y nombre válidos.'));
      }

      const categoria = await this.repoCategorias.obtenerPorId(negocio.categoriaId);
      if (!categoria) {
        return crearFalla(
          new Error(`La categoría con id "${negocio.categoriaId}" no existe en Central.`)
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
}
