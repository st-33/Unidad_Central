import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type {
  Categoria,
  Negocio,
  DefinicionCapacidad,
  IdentificadorUnico,
} from '../contratos';
import type {
  RepositorioCategorias,
  RepositorioNegocios,
  RepositorioCapacidades,
  RepositorioSistema,
  EstadoEstructuraSistema,
} from '../src/central/persistencia';
import { ServicioCentral } from '../src/central/logica/servicio-central';

class RepositorioCategoriasMemoria implements RepositorioCategorias {
  private elementos = new Map<IdentificadorUnico, Categoria>();

  async listar(): Promise<readonly Categoria[]> {
    return Array.from(this.elementos.values());
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<Categoria | null> {
    return this.elementos.get(id) ?? null;
  }

  async guardar(categoria: Categoria): Promise<void> {
    this.elementos.set(categoria.id, categoria);
  }
}

class RepositorioNegociosMemoria implements RepositorioNegocios {
  private elementos = new Map<IdentificadorUnico, Negocio>();

  async listar(): Promise<readonly Negocio[]> {
    return Array.from(this.elementos.values());
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<Negocio | null> {
    return this.elementos.get(id) ?? null;
  }

  async listarPorCategoria(categoriaId: IdentificadorUnico): Promise<readonly Negocio[]> {
    return Array.from(this.elementos.values()).filter((n) => n.categoriaId === categoriaId);
  }

  async guardar(negocio: Negocio): Promise<void> {
    this.elementos.set(negocio.id, negocio);
  }
}

class RepositorioCapacidadesMemoria implements RepositorioCapacidades {
  private elementos = new Map<IdentificadorUnico, DefinicionCapacidad>();

  async listar(): Promise<readonly DefinicionCapacidad[]> {
    return Array.from(this.elementos.values());
  }

  async obtenerPorId(id: IdentificadorUnico): Promise<DefinicionCapacidad | null> {
    return this.elementos.get(id) ?? null;
  }

  async guardar(capacidad: DefinicionCapacidad): Promise<void> {
    this.elementos.set(capacidad.id, capacidad);
  }
}

class RepositorioSistemaMemoria implements RepositorioSistema {
  private estado: EstadoEstructuraSistema | null = null;

  async obtenerEstado(): Promise<EstadoEstructuraSistema | null> {
    return this.estado;
  }

  async marcarInicializado(version = 1): Promise<void> {
    this.estado = {
      inicializado: true,
      version,
      inicializadoEn: Date.now(),
    };
  }
}

describe('Lógica de Central y Principios Contractuales', () => {
  test('Inicialización de estructura base: segura, explícita e idempotente', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    // Estado antes de inicializar
    const resumenPrevio = await servicio.obtenerResumen();
    assert.strictEqual(resumenPrevio.exito, true);
    if (resumenPrevio.exito) {
      assert.strictEqual(resumenPrevio.datos.inicializado, false);
      assert.strictEqual(resumenPrevio.datos.totalCategorias, 0);
    }

    // Primera inicialización: crea datos base mínimos
    const resultado1 = await servicio.inicializarEstructuraBase();
    assert.strictEqual(resultado1.exito, true);
    if (resultado1.exito) {
      assert.strictEqual(resultado1.datos.yaInicializado, false);
      assert.strictEqual(resultado1.datos.categoriasCreadas, 1);
      assert.strictEqual(resultado1.datos.capacidadesCreadas, 2);
    }

    // Comprobación de lectura real en el resumen
    const resumenPost = await servicio.obtenerResumen();
    assert.strictEqual(resumenPost.exito, true);
    if (resumenPost.exito) {
      assert.strictEqual(resumenPost.datos.inicializado, true);
      assert.strictEqual(resumenPost.datos.totalCategorias, 1);
      assert.strictEqual(resumenPost.datos.categorias[0].clave, 'marisquerias');
      assert.strictEqual(resumenPost.datos.totalCapacidades, 2);
    }

    // Segunda inicialización: idempotente, no altera nada
    const resultado2 = await servicio.inicializarEstructuraBase();
    assert.strictEqual(resultado2.exito, true);
    if (resultado2.exito) {
      assert.strictEqual(resultado2.datos.yaInicializado, true);
      assert.strictEqual(resultado2.datos.categoriasCreadas, 0);
    }
  });

  test('Categoría != Negocio: Un negocio requiere pertenecer a una categoría existente', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    const negocioHuerfano: Negocio = {
      id: 'neg-01',
      categoriaId: 'cat-inexistente',
      nombre: 'Negocio Sin Categoria',
      nombreComercial: 'Sin Categoria',
      activo: true,
      configuracion: {
        capacidades: {},
      },
    };

    const resultadoFalla = await servicio.registrarNegocio(negocioHuerfano);
    assert.strictEqual(resultadoFalla.exito, false);
    if (!resultadoFalla.exito) {
      assert.match(resultadoFalla.error.message, /no existe en Central/);
    }
  });

  test('Permite modelar negocios con capacidades diferenciadas según su configuración propia', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    // Inicializar estructura base
    await servicio.inicializarEstructuraBase();

    // Negocio A: "Puerto Libres" (sin mostrador ni báscula)
    const puertoLibres: Negocio = {
      id: 'neg-puerto-libres',
      categoriaId: 'cat-marisquerias',
      nombre: 'Puerto Libres S.A.',
      nombreComercial: 'Puerto Libres',
      activo: true,
      configuracion: {
        capacidades: {
          mostrador: { activa: false },
          bascula: { activa: false },
        },
      },
    };

    // Negocio B: "El Arrecife" (con mostrador y báscula activas)
    const elArrecife: Negocio = {
      id: 'neg-el-arrecife',
      categoriaId: 'cat-marisquerias',
      nombre: 'El Arrecife Gourmet',
      nombreComercial: 'El Arrecife',
      activo: true,
      configuracion: {
        capacidades: {
          mostrador: { activa: true },
          bascula: { activa: true },
        },
      },
    };

    const resA = await servicio.registrarNegocio(puertoLibres);
    const resB = await servicio.registrarNegocio(elArrecife);

    assert.strictEqual(resA.exito, true);
    assert.strictEqual(resB.exito, true);

    // Consulta de negocios por categoría
    const listado = await servicio.listarNegociosPorCategoria('cat-marisquerias');
    assert.strictEqual(listado.exito, true);
    if (listado.exito) {
      assert.strictEqual(listado.datos.length, 2);
      const negocioB = listado.datos.find((n) => n.id === 'neg-el-arrecife');
      assert.strictEqual(negocioB?.configuracion.capacidades.mostrador.activa, true);
      const negocioA = listado.datos.find((n) => n.id === 'neg-puerto-libres');
      assert.strictEqual(negocioA?.configuracion.capacidades.mostrador.activa, false);
    }
  });
});
