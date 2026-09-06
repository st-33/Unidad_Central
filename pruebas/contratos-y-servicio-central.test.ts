import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type {
  Categoria,
  Negocio,
  DefinicionCapacidad,
  IdentificadorUnico,
  ConfiguracionNegocio,
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

  async actualizarConfiguracion(id: IdentificadorUnico, configuracion: ConfiguracionNegocio): Promise<void> {
    const existente = this.elementos.get(id);
    if (existente) {
      this.elementos.set(id, {
        ...existente,
        configuracion,
      });
    }
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

describe('Lógica Operativa de Central y Gestión de Negocios', () => {
  test('Inicialización idempotente: registra 4 categorías, 4 capacidades y 4 negocios base', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    // 1. Primera inicialización
    const resInicial = await servicio.inicializarEstructuraBase();
    assert.strictEqual(resInicial.exito, true);
    if (resInicial.exito) {
      assert.strictEqual(resInicial.datos.yaInicializado, false);
      assert.strictEqual(resInicial.datos.categoriasCreadas, 4);
      assert.strictEqual(resInicial.datos.capacidadesCreadas, 4);
      assert.strictEqual(resInicial.datos.negociosCreados, 4);
    }

    // 2. Verificar datos cargados en RTDB
    const resumen = await servicio.obtenerResumen();
    assert.strictEqual(resumen.exito, true);
    if (resumen.exito) {
      assert.strictEqual(resumen.datos.totalCategorias, 4);
      assert.strictEqual(resumen.datos.totalNegocios, 4);
      assert.strictEqual(resumen.datos.totalCapacidades, 4);

      const clavesCategorias = resumen.datos.categorias.map((c) => c.clave);
      assert.deepStrictEqual(clavesCategorias.sort(), [
        'hornos_de_pan',
        'marisquerias',
        'servicio_a_domicilio',
        'verdulerias',
      ]);

      const nombresNegocios = resumen.datos.negocios.map((n) => n.nombreComercial);
      assert.deepStrictEqual(nombresNegocios.sort(), [
        'ADIRepart',
        'Horno de Pan',
        'Marisquería Puerto Libres',
        'Verdulería',
      ]);
    }

    // 3. Segunda inicialización (idempotente)
    const resSegunda = await servicio.inicializarEstructuraBase();
    assert.strictEqual(resSegunda.exito, true);
    if (resSegunda.exito) {
      assert.strictEqual(resSegunda.datos.yaInicializado, true);
      assert.strictEqual(resSegunda.datos.categoriasCreadas, 0);
      assert.strictEqual(resSegunda.datos.negociosCreados, 0);
    }
  });

  test('Permite activar y desactivar capacidades reales por negocio de forma aislada', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    // Consultar estado inicial de Marisquería Puerto Libres (mostrador activa por defecto)
    const negocioInicial = await repoNegocios.obtenerPorId('neg-puerto-libres');
    assert.strictEqual(negocioInicial?.configuracion.capacidades.mostrador?.activa, true);

    // Desactivar mostrador en Marisquería Puerto Libres
    const resDesactivar = await servicio.alternarCapacidadNegocio('neg-puerto-libres', 'mostrador', false);
    assert.strictEqual(resDesactivar.exito, true);
    if (resDesactivar.exito) {
      assert.strictEqual(resDesactivar.datos.configuracion.capacidades.mostrador.activa, false);
    }

    // Activar reparto en Marisquería Puerto Libres
    const resActivarReparto = await servicio.alternarCapacidadNegocio('neg-puerto-libres', 'reparto', true);
    assert.strictEqual(resActivarReparto.exito, true);
    if (resActivarReparto.exito) {
      assert.strictEqual(resActivarReparto.datos.configuracion.capacidades.reparto.activa, true);
    }

    // Comprobar que ADIRepart no fue alterado (reparto sigue true, mostrador sigue false)
    const adirepart = await repoNegocios.obtenerPorId('neg-adirepart');
    assert.strictEqual(adirepart?.configuracion.capacidades.reparto?.activa, true);
    assert.strictEqual(adirepart?.configuracion.capacidades.mostrador?.activa, false);
  });

  test('Negocios en la misma categoría pueden mantener configuraciones de capacidades independientes', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    // Registrar un segundo negocio en la misma categoría 'marisquerias'
    const segundoNegocioMarisqueria: Negocio = {
      id: 'neg-el-arrecife',
      categoriaId: 'cat-marisquerias',
      nombre: 'El Arrecife Gourmet',
      nombreComercial: 'El Arrecife',
      activo: true,
      configuracion: {
        capacidades: {
          mostrador: { activa: false },
          bascula: { activa: false },
          reparto: { activa: true },
          horno: { activa: false },
        },
      },
    };
    await servicio.registrarNegocio(segundoNegocioMarisqueria);

    // Ambos pertenecen a marisquerías pero tienen capacidades diferentes
    const marisquerias = await servicio.listarNegociosPorCategoria('cat-marisquerias');
    assert.strictEqual(marisquerias.exito, true);
    if (marisquerias.exito) {
      assert.strictEqual(marisquerias.datos.length, 2);

      const puertoLibres = marisquerias.datos.find((n) => n.id === 'neg-puerto-libres');
      const arrecife = marisquerias.datos.find((n) => n.id === 'neg-el-arrecife');

      assert.strictEqual(puertoLibres?.configuracion.capacidades.mostrador?.activa, true);
      assert.strictEqual(arrecife?.configuracion.capacidades.mostrador?.activa, false);
      assert.strictEqual(arrecife?.configuracion.capacidades.reparto?.activa, true);
    }
  });

  test('Validación de categoría obligatoria: rechaza negocio con categoría inexistente', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    const negocioHuerfano: Negocio = {
      id: 'neg-invalido',
      categoriaId: 'cat-no-existe',
      nombre: 'Negocio Huerfano',
      nombreComercial: 'Huerfano',
      activo: true,
      configuracion: { capacidades: {} },
    };

    const resultado = await servicio.registrarNegocio(negocioHuerfano);
    assert.strictEqual(resultado.exito, false);
    if (!resultado.exito) {
      assert.match(resultado.error.message, /no existe en Central/);
    }
  });
});
