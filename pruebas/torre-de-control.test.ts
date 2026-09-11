import test from 'node:test';
import assert from 'node:assert/strict';
import { generarClaveTecnica } from '../src/torre/logica/generador-clave';
import { ServicioTorreControl } from '../src/torre/logica/servicio-torre';
import type { RepositorioTorre } from '../src/torre/persistencia/repositorio-torre';
import type { NegocioRTDB, DatosFichaNegocio } from '../src/torre/tipos';

// Repositorio en memoria para pruebas de integración unitaria
class RepositorioTorrePrueba implements RepositorioTorre {
  private almacenes = new Map<string, NegocioRTDB>();

  async listarNegocios(): Promise<readonly NegocioRTDB[]> {
    return Array.from(this.almacenes.values());
  }

  suscribirNegocios(alCambiar: (negocios: readonly NegocioRTDB[]) => void): () => void {
    alCambiar(Array.from(this.almacenes.values()));
    return () => {};
  }

  async guardarNegocio(negocio: NegocioRTDB): Promise<void> {
    this.almacenes.set(negocio.id.toLowerCase(), negocio);
  }

  async eliminarNegocio(id: string): Promise<void> {
    this.almacenes.delete(id.toLowerCase());
  }
}

test('Torre de Control — Generación Determinista de Clave Técnica', async (t) => {
  await t.test('Genera claves de máximo 3 caracteres a partir del nombre comercial', () => {
    const clave1 = generarClaveTecnica('Marisquería Puerto Libres');
    assert.equal(clave1, 'mpl');
    assert.ok(clave1.length <= 3, 'La clave técnica no debe exceder 3 caracteres');

    const clave2 = generarClaveTecnica('El Arquitecto');
    assert.equal(clave2, 'ear');
    assert.ok(clave2.length <= 3, 'La clave técnica no debe exceder 3 caracteres');

    const clave3 = generarClaveTecnica('Oasis');
    assert.equal(clave3, 'oas');
    assert.ok(clave3.length <= 3, 'La clave técnica no debe exceder 3 caracteres');
  });

  await t.test('Resuelve colisiones preservando la restricción de máximo 3 caracteres', () => {
    const existentes = ['mpl'];
    const nuevaClave = generarClaveTecnica('Marisquería Playa Linda', existentes);
    assert.notEqual(nuevaClave, 'mpl');
    assert.ok(nuevaClave.length <= 3, 'La clave con colisión resuelta no debe exceder 3 caracteres');
    assert.equal(nuevaClave, 'mp1');
  });

  await t.test('Preserva clave previa si se encuentra en actualización', () => {
    const clavePrevia = 'mpl';
    const clave = generarClaveTecnica('Marisquería Puerto Libres VIP', ['mpl', 'ear'], clavePrevia);
    assert.equal(clave, 'mpl');
  });
});

test('Torre de Control — Lógica Operativa y Ficha Técnica', async (t) => {
  const repo = new RepositorioTorrePrueba();
  const servicio = new ServicioTorreControl(repo);

  const datosFicha: DatosFichaNegocio = {
    nombre: 'Marisquería Puerto Libres',
    activo: true,
    codigo: 'PL2026',
    limite: 4,
    bloqueados: {
      Reparto: false,
      'KDS Cocina': false,
      Caja: false,
      Comandero: false,
    },
    perfiles: ['Administrador', 'Cajero', 'Mesero'],
    instagram: '@marisqueria_puertolibres',
    facebook: 'puertolibres.oficial',
    whatsapp: '+527441234567',
    celular: '7441234567',
    correo: 'contacto@puertolibres.com',
    direccion: 'Av. Costera Miguel Alemán 123',
  };

  await t.test('Registra un nuevo negocio con estructura plana limpia', async () => {
    const res = await servicio.registrarOActualizarNegocio(datosFicha);
    assert.ok(res.exito);
    assert.equal(res.idGenerado, 'mpl');

    const todos = await servicio.listarNegocios();
    assert.equal(todos.length, 1);
    const n = todos[0];
    assert.equal(n.nombre, 'Marisquería Puerto Libres');
    assert.equal(n.id, 'mpl');
    assert.equal(n.codigo, 'PL2026');
    assert.equal(n.limite, 4);
    assert.equal(n.direccion, 'Av. Costera Miguel Alemán 123');
    assert.equal(n.instagram, '@marisqueria_puertolibres');
    assert.equal(n.facebook, 'puertolibres.oficial');
    assert.equal(n.whatsapp, '+527441234567');
    assert.equal(n.celular, '7441234567');
    assert.equal(n.correo, 'contacto@puertolibres.com');
  });

  await t.test('Idempotencia: no duplica registros al volver a guardar el mismo negocio', async () => {
    const datosActualizados: DatosFichaNegocio = {
      ...datosFicha,
      limite: 6,
      bloqueados: {
        Reparto: true,
        'KDS Cocina': false,
        Caja: false,
        Comandero: false,
      },
    };

    const res = await servicio.registrarOActualizarNegocio(datosActualizados);
    assert.ok(res.exito);

    const todos = await servicio.listarNegocios();
    assert.equal(todos.length, 1, 'No debe haber negocios duplicados');
    assert.equal(todos[0].limite, 6);
    assert.equal(todos[0].bloqueados.Reparto, true);
  });

  await t.test('Permite retirar un negocio de la matriz', async () => {
    const res = await servicio.eliminarNegocio('mpl');
    assert.equal(res.exito, true);
    const todos = await servicio.listarNegocios();
    assert.equal(todos.length, 0);
  });
});
