import type { Categoria, Negocio, DefinicionCapacidad, IdentificadorUnico } from '../../../contratos';
import {
  RepositorioCategorias,
  RepositorioCategoriasRtdb,
  RepositorioNegocios,
  RepositorioNegociosRtdb,
  RepositorioCapacidades,
  RepositorioCapacidadesRtdb,
} from '../persistencia';
import { Resultado, crearExito, crearFalla } from '../../compartido/resultado';

export interface ResumenCentral {
  readonly totalCategorias: number;
  readonly totalNegocios: number;
  readonly totalCapacidades: number;
  readonly negociosActivos: number;
}

export class ServicioCentral {
  private readonly repoCategorias: RepositorioCategorias;
  private readonly repoNegocios: RepositorioNegocios;
  private readonly repoCapacidades: RepositorioCapacidades;

  constructor(
    repoCategorias: RepositorioCategorias = new RepositorioCategoriasRtdb(),
    repoNegocios: RepositorioNegocios = new RepositorioNegociosRtdb(),
    repoCapacidades: RepositorioCapacidades = new RepositorioCapacidadesRtdb()
  ) {
    this.repoCategorias = repoCategorias;
    this.repoNegocios = repoNegocios;
    this.repoCapacidades = repoCapacidades;
  }

  async obtenerResumen(): Promise<Resultado<ResumenCentral, Error>> {
    try {
      const [categorias, negocios, capacidades] = await Promise.all([
        this.repoCategorias.listar(),
        this.repoNegocios.listar(),
        this.repoCapacidades.listar(),
      ]);

      const activos = negocios.filter((n) => n.activo).length;

      return crearExito({
        totalCategorias: categorias.length,
        totalNegocios: negocios.length,
        totalCapacidades: capacidades.length,
        negociosActivos: activos,
      });
    } catch (error) {
      return crearFalla(
        error instanceof Error ? error : new Error('Falla al consultar resumen de Central')
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

      // Validar que la categoría a la que pertenece exista
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
