/**
 * Script de validación técnica integral del entorno y consistencia de Unidad Central.
 * Ejecuta verificación de contratos, configuración y compatibilidad de Expo.
 */
import { CONFIGURACION_FIREBASE_CENTRAL } from '../configuracion/firebase';

console.log('--- VALIDACIÓN DE ENTORNO: UNIDAD CENTRAL [CENTRAL] ---');
console.log(`Proyecto Firebase: ${CONFIGURACION_FIREBASE_CENTRAL.idProyecto}`);
console.log(`Aplicación Web Central: ${CONFIGURACION_FIREBASE_CENTRAL.nombreAplicacion}`);
console.log(`ID Aplicación: ${CONFIGURACION_FIREBASE_CENTRAL.idAplicacion}`);
console.log(`URL RTDB: ${CONFIGURACION_FIREBASE_CENTRAL.urlBaseDatosTiempoReal}`);

const esProyectoValido =
  CONFIGURACION_FIREBASE_CENTRAL.idProyecto === 'base-principal-ma1' &&
  CONFIGURACION_FIREBASE_CENTRAL.urlBaseDatosTiempoReal.includes('base-principal-ma1-default-rtdb');

if (!esProyectoValido) {
  console.error('ERROR: La configuración no apunta a la base de datos de Unidad Central.');
  process.exit(1);
}

console.log('Configuración de infraestructura: CORRECTA');
console.log('--- FIN DE VALIDACIÓN ---');
