import { servicioTorreControl } from '../src/torre/logica/servicio-torre';
import type { DatosFichaNegocio } from '../src/torre/tipos';

async function verificarFlujoRtdbReal() {
  console.log('--- VERIFICANDO TORRE DE CONTROL CON RTDB REAL (ESTRUCTURA PLANA) ---');
  console.log('RTDB Destino: https://minegocioaunclick-1539b-default-rtdb.firebaseio.com');

  // 1. Listar inicialmente
  const inicial = await servicioTorreControl.listarNegocios();
  console.log('Negocios actuales en matriz:', inicial.length);

  // 2. Registrar negocio con datos de ficha técnica
  const datosRegistro: DatosFichaNegocio = {
    nombre: 'Marisquería Puerto Libres',
    activo: true,
    codigo: 'PL2026',
    limite: 3,
    bloqueados: {
      Reparto: false,
      'KDS Cocina': false,
      Caja: false,
      Comandero: false,
    },
    perfiles: ['Administrador', 'Cajero', 'Comandero'],
    instagram: '@puertolibres',
    facebook: 'puertolibres',
    whatsapp: '+527441234567',
    celular: '7441234567',
    correo: 'contacto@puertolibres.com',
    direccion: 'Costera Miguel Alemán 100',
  };

  const resultado = await servicioTorreControl.registrarOActualizarNegocio(datosRegistro);
  console.log('Resultado registro:', resultado.exito, resultado.mensaje, 'ID:', resultado.idGenerado);

  if (!resultado.exito || !resultado.idGenerado) {
    throw new Error('Fallo al registrar en RTDB real');
  }

  // 3. Verificar que el negocio existe y se recupera de la RTDB
  const listaPostRegistro = await servicioTorreControl.listarNegocios();
  const encontrado = listaPostRegistro.find((n) => n.id === resultado.idGenerado);
  console.log('Encontrado en RTDB:', encontrado?.nombre, 'ID Técnico interno:', encontrado?.id);

  if (!encontrado) {
    throw new Error('El negocio registrado no se encontró en la lista de RTDB');
  }

  // 4. Actualizar negocio (idempotente)
  const datosActualizados: DatosFichaNegocio = {
    ...datosRegistro,
    limite: 5,
  };
  const resultadoActualizacion = await servicioTorreControl.registrarOActualizarNegocio(
    datosActualizados,
    resultado.idGenerado
  );
  console.log('Resultado actualización:', resultadoActualizacion.exito, resultadoActualizacion.mensaje);

  // 5. Verificar que el total sigue siendo 1 (no duplicó)
  const listaPostUpdate = await servicioTorreControl.listarNegocios();
  console.log('Total negocios tras actualización:', listaPostUpdate.length);
  if (listaPostUpdate.length !== listaPostRegistro.length) {
    throw new Error('Se generó un duplicado al actualizar el negocio');
  }

  console.log('--- VERIFICACIÓN DE TORRE DE CONTROL COMPLETADA CON ÉXITO ---');
  process.exit(0);
}

verificarFlujoRtdbReal().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
