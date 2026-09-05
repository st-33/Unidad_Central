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
} from '../src/central/persistencia';
import { ServicioCentral } from '../src/central/logica/servicio-central';

/**
 * Repositorios en memoria para pruebas unitarias de lógica central.
 */
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

describe('Lógica de Central y Principios Contractuales', () => {
  test('Categoría != Negocio: Un negocio requiere pertenecer a una categoría existente', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades);

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

  test('Permite modelar negocios de una misma categoría con capacidades diferenciadas', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades);

    // 1. Registrar categoría
    const categoriaMarisquerias: Categoria = {
      id: 'cat-marisquerias',
      clave: 'marisquerias',
      nombre: 'Marisquerías',
      descripcion: 'Locales y puntos de venta de productos marinos',
      activa: true,
      capacidadesDisponibles: ['mostrador', 'bascula', 'pedidos_domicilio'],
    };
    await servicio.registrarCategoria(categoriaMarisquerias);

    // 2. Registrar capacidades técnicas posibles
    await servicio.registrarCapacidad({
      id: 'cap-mostrador',
      clave: 'mostrador',
      nombre: 'Mostrador',
      descripcion: 'Atención directa en barra/mostrador',
    });
    await servicio.registrarCapacidad({
      id: 'cap-bascula',
      clave: 'bascula',
      nombre: 'Básculas de pesaje',
      descripcion: 'Integración y lectura de básculas para venta por peso',
    });

    // 3. Negocio A: "Puerto Libres" (sin mostrador)
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

    // 4. Negocio B: "El Arrecife" (con mostrador y báscula)
    const elArrecife: Negocio = {
      id: 'neg-el-arrecife',
      categoriaId: 'cat-marisquerias',
      nombre: 'El Arrecife Gourmet',
      nombreComercial: 'El Arrecife',
      activo: true,
      configuracion: {
        capacidades: {
          mostrador: { activa: true, opciones: { cajasActivas: 2 } },
          bascula: { activa: true, opciones: { modelo: 'Torrey' } },
        },
      },
    };

    const resA = await servicio.registrarNegocio(puertoLibres);
    const resB = await servicio.registrarNegocio(elArrecife);

    assert.strictEqual(resA.exito, true);
    assert.strictEqual(resB.exito, true);

    // Verificar consulta por categoría
    const listado = await servicio.listarNegociosPorCategoria('cat-marisquerias');
    assert.strictEqual(listado.exito, true);
    if (listado.exito) {
      assert.strictEqual(listado.datos.length, 2);
      const negocioB = listado.datos.find((n) => n.id === 'neg-el-arrecife');
      assert.strictEqual(negocioB?.configuracion.capacidades.mostrador.activa, true);
      const negocioA = listado.datos.find((n) => n.id === 'neg-puerto-libres');
      assert.strictEqual(negocioA?.configuracion.capacidades.mostrador.activa, false);
    }

    // Verificar resumen de Central
    const resumen = await servicio.obtenerResumen();
    assert.strictEqual(resumen.exito, true);
    if (resumen.exito) {
      assert.strictEqual(resumen.datos.totalCategorias, 1);
      assert.strictEqual(resumen.datos.totalNegocios, 2);
      assert.strictEqual(resumen.datos.negociosActivos, 2);
      assert.strictEqual(resumen.datos.totalCapacidades, 2);
    }
  });
});
