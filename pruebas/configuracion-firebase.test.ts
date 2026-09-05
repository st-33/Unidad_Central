import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONFIGURACION_FIREBASE_CENTRAL,
  obtenerOpcionesFirebaseSdk,
} from '../configuracion/firebase';

describe('Configuración de Firebase para Unidad Central', () => {
  test('Debe apuntar exclusivamente al proyecto base-principal-ma1 de Unidad Central', () => {
    assert.strictEqual(CONFIGURACION_FIREBASE_CENTRAL.idProyecto, 'base-principal-ma1');
    assert.strictEqual(CONFIGURACION_FIREBASE_CENTRAL.nombreProyecto, 'Unidad Central');
    assert.strictEqual(CONFIGURACION_FIREBASE_CENTRAL.nombreAplicacion, 'central');
    assert.strictEqual(
      CONFIGURACION_FIREBASE_CENTRAL.idAplicacion,
      '1:381866932199:web:a97b0914d7d0a46a872f42'
    );
    assert.strictEqual(
      CONFIGURACION_FIREBASE_CENTRAL.urlBaseDatosTiempoReal,
      'https://base-principal-ma1-default-rtdb.firebaseio.com/'
    );
  });

  test('El adaptador para el SDK de Firebase genera las opciones requeridas', () => {
    const opciones = obtenerOpcionesFirebaseSdk();
    assert.strictEqual(opciones.projectId, 'base-principal-ma1');
    assert.strictEqual(opciones.appId, '1:381866932199:web:a97b0914d7d0a46a872f42');
    assert.strictEqual(
      opciones.databaseURL,
      'https://base-principal-ma1-default-rtdb.firebaseio.com/'
    );
  });
});
