import { servicioTorreControl } from '../src/torre/logica/servicio-torre';
import type { DatosFichaNegocio } from '../src/torre/tipos';

async function verificarFlujoRtdbReal() {
  console.log('--- VERIFICANDO TORRE DE CONTROL CON RTDB REAL (DOBLE ÍNDICE) ---');
  console.log('RTDB Destino: https://minegocioaunclick-1539b-default-rtdb.firebaseio.com');

  // 1. Listar inicialmente en categoría Marisquerias
  const inicial = await servicioTorreControl.listarNegociosPorCategoria('Marisquerias');
  console.log('Negocios actuales en categoría Marisquerias:', inicial.length);

  // 2. Registrar negocio con datos de ficha técnica
  const datosRegistro: DatosFichaNegocio = {
    nombre: 'Marisquería Puerto Libres',
    categoria: 'Marisquerias',
    activo: true,
    codigo: 'PL2026-24',
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

  // 3. Verificar que el negocio existe y se recupera de la RTDB bajo Marisquerias
  const listaPostRegistro = await servicioTorreControl.listarNegociosPorCategoria('Marisquerias');
  const encontrado = listaPostRegistro.find((n) => n.id === resultado.idGenerado);
  console.log('Encontrado en RTDB:', encontrado?.nombre, 'Ruta:', `Marisquerias/${encontrado?.id}`);

  if (!encontrado) {
    throw new Error('El negocio registrado no se encontró en la lista de RTDB');
  }

  // 4. Verificar unicidad: intentar registrar otro negocio con el mismo código
  const intentoDuplicado: DatosFichaNegocio = {
    ...datosRegistro,
    nombre: 'El Jarocho',
    codigo: 'PL2026-24', // Mismo código
  };
  const resultadoDuplicado = await servicioTorreControl.registrarOActualizarNegocio(intentoDuplicado);
  console.log('Rechazo de código duplicado correcto:', !resultadoDuplicado.exito, resultadoDuplicado.mensaje);
  if (resultadoDuplicado.exito) {
    throw new Error('Debió rechazar el código de acceso duplicado');
  }

  // 5. Actualizar negocio (idempotente)
  const datosActualizados: DatosFichaNegocio = {
    ...datosRegistro,
    limite: 5,
  };
  const resultadoActualizacion = await servicioTorreControl.registrarOActualizarNegocio(
    datosActualizados,
    resultado.idGenerado
  );
  console.log('Resultado actualización:', resultadoActualizacion.exito, resultadoActualizacion.mensaje);

  console.log('--- VERIFICACIÓN DE TORRE DE CONTROL COMPLETADA CON ÉXITO ---');
  process.exit(0);
}

verificarFlujoRtdbReal().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
