import type { Categoria, Negocio, DefinicionCapacidad, IdentificadorUnico } from '../../../contratos';
import {
  RepositorioCategorias,
  RepositorioCategoriasRtdb,
  RepositorioNegocios,
  RepositorioNegociosRtdb,
  RepositorioCapacidades,
  RepositorioCapacidadesRtdb,
  RepositorioSistema,
  RepositorioSistemaRtdb,
  EstadoEstructuraSistema,
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
}

export interface ResultadoInicializacion {
  readonly yaInicializado: boolean;
  readonly categoriasCreadas: number;
  readonly capacidadesCreadas: number;
}

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
      });
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Falla al consultar resumen de Central')
      );
    }
  }

  /**
   * Inicializa de forma explícita, segura e idempotente la estructura base de Central en RTDB.
   * Si la estructura ya existe, no sobrescribe ni altera datos existentes.
   */
  async inicializarEstructuraBase(): Promise<Resultado<ResultadoInicializacion, Error>> {
    try {
      const estadoActual = await this.repoSistema.obtenerEstado();
      if (estadoActual?.inicializado) {
        return crearExito({
          yaInicializado: true,
          categoriasCreadas: 0,
          capacidadesCreadas: 0,
        });
      }

      // Definición de datos base estrictamente necesarios
      const categoriaBase: Categoria = {
        id: 'cat-marisquerias',
        clave: 'marisquerias',
        nombre: 'Marisquerías',
        descripcion: 'Comercio y distribución de pescados y mariscos',
        activa: true,
      };

      const capacidadesBase: readonly DefinicionCapacidad[] = [
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
      ];

      // Guardar de forma segura sin crear negocios ficticios
      await this.repoCategorias.guardar(categoriaBase);
      for (const cap of capacidadesBase) {
        await this.repoCapacidades.guardar(cap);
      }

      // Marcar nodo de sistema como inicializado
      await this.repoSistema.marcarInicializado(1);

      return crearExito({
        yaInicializado: false,
        categoriasCreadas: 1,
        capacidadesCreadas: capacidadesBase.length,
      });
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Error al inicializar la estructura base')
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

      // Validar que la categoría a la que pertenece exista en el catálogo de Central
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
