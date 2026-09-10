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
    return Array.from(this.elementos.values()).filter((n) => n.categoria_id === categoriaId);
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

      const nombresNegocios = resumen.datos.negocios.map((n) => n.nombre_comercial);
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

    // Comprobar que ADIRepart no fue alterado (reparto sigue true)
    // ADIRepart solo tiene 'reparto' en su configuración porque es la única capacidad permitida por su categoría
    const adirepart = await repoNegocios.obtenerPorId('neg-adirepart');
    assert.strictEqual(adirepart?.configuracion.capacidades.reparto?.activa, true);
    assert.strictEqual(adirepart?.configuracion.capacidades.mostrador, undefined);
  });

  test('Negocios en la misma categoría pueden mantener configuraciones de capacidades independientes', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    // Registrar un segundo negocio en la misma categoría 'marisquerias'
    // Solo incluimos capacidades permitidas por la categoría (mostrador, bascula, reparto)
    const segundoNegocioMarisqueria: Negocio = {
      id: 'neg-el-arrecife',
      negocio_id: 'neg-el-arrecife',
      categoria_id: 'cat-marisquerias',
      nombre: 'El Arrecife Gourmet',
      nombre_comercial: 'El Arrecife',
      activo: true,
      configuracion: {
        capacidades: {
          mostrador: { activa: false },
          bascula: { activa: false },
          reparto: { activa: true },
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
      negocio_id: 'neg-invalido',
      categoria_id: 'cat-no-existe',
      nombre: 'Negocio Huerfano',
      nombre_comercial: 'Huerfano',
      activo: true,
      configuracion: { capacidades: {} },
    };

    const resultado = await servicio.registrarNegocio(negocioHuerfano);
    assert.strictEqual(resultado.exito, false);
    if (!resultado.exito) {
      assert.match(resultado.error.message, /no existe en Central/);
    }
  });

  test('JERARQUÍA: No permite activar capacidad que la categoría no permite', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    // Intentar activar "horno" en ADIRepart (Servicio a Domicilio solo permite "reparto")
    const resultado = await servicio.alternarCapacidadNegocio('neg-adirepart', 'horno', true);
    
    assert.strictEqual(resultado.exito, false);
    if (!resultado.exito) {
      assert.match(resultado.error.message, /no permite la capacidad/);
    }
  });

  test('JERARQUÍA: Categorías definen capacidades permitidas correctamente', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    const resumen = await servicio.obtenerResumen();
    assert.strictEqual(resumen.exito, true);
    
    if (resumen.exito) {
      const marisquerias = resumen.datos.categorias.find((c) => c.clave === 'marisquerias');
      const servicioADomicilio = resumen.datos.categorias.find((c) => c.clave === 'servicio_a_domicilio');
      
      assert.ok(marisquerias);
      assert.ok(servicioADomicilio);
      
      // Marisquerías permite mostrador, bascula, reparto
      assert.deepStrictEqual([...marisquerias.capacidades_permitidas].sort(), ['bascula', 'mostrador', 'reparto']);
      
      // Servicio a Domicilio solo permite reparto
      assert.deepStrictEqual(servicioADomicilio.capacidades_permitidas, ['reparto']);
    }
  });

  test('EXPORTACIÓN: Genera configuración para consumo externo correctamente', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    const resultado = await servicio.exportarConfiguracionNegocio('neg-puerto-libres');
    
    assert.strictEqual(resultado.exito, true);
    if (resultado.exito) {
      const config = resultado.datos;
      
      assert.strictEqual(config.idNegocio, 'neg-puerto-libres');
      assert.strictEqual(config.nombreComercial, 'Marisquería Puerto Libres');
      assert.strictEqual(config.categoriaId, 'cat-marisquerias');
      assert.strictEqual(config.categoriaNombre, 'Marisquerías');
      assert.strictEqual(config.categoriaClave, 'marisquerias');
      assert.strictEqual(config.activo, true);
      
      // Solo incluye capacidades ACTIVAS (mostrador y bascula por defecto)
      assert.deepStrictEqual([...config.capacidadesActivas].sort(), ['bascula', 'mostrador']);
    }
  });

  test('EXPORTACIÓN: Catálogo de capacidades excluye capacidades no disponibles', async () => {
    const repoCategorias = new RepositorioCategoriasMemoria();
    const repoNegocios = new RepositorioNegociosMemoria();
    const repoCapacidades = new RepositorioCapacidadesMemoria();
    const repoSistema = new RepositorioSistemaMemoria();
    const servicio = new ServicioCentral(repoCategorias, repoNegocios, repoCapacidades, repoSistema);

    await servicio.inicializarEstructuraBase();

    // Agregar una capacidad en desuso
    await repoCapacidades.guardar({
      id: 'cap-obsoleta',
      clave: 'obsoleta',
      nombre: 'Capacidad Obsoleta',
      descripcion: 'Ya no se usa',
      disponible: false,
    });

    const resultado = await servicio.exportarCatalogoCapacidades();
    
    assert.strictEqual(resultado.exito, true);
    if (resultado.exito) {
      const claves = resultado.datos.map((c) => c.clave);
      
      // Debe incluir las 4 capacidades base (todas disponible: true)
      assert.strictEqual(resultado.datos.length, 4);
      assert.ok(!claves.includes('obsoleta'));
    }
  });
});
