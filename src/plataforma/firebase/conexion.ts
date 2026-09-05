import { ref, onValue, off } from 'firebase/database';
import { obtenerBaseDatosTiempoReal } from './inicializacion';

export type ObservadorConexion = (conectado: boolean) => void;

/**
 * Escucha en tiempo real el estado de conexión de la RTDB interna de Firebase.
 * Retorna una función para cancelar la suscripción.
 */
export function observarConexionTiempoReal(observador: ObservadorConexion): () => void {
  try {
    const db = obtenerBaseDatosTiempoReal();
    const referenciaConexion = ref(db, '.info/connected');

    const listener = (snapshot: { val: () => unknown }) => {
      const valor = snapshot.val();
      observador(Boolean(valor));
    };

    onValue(referenciaConexion, listener);

    return () => {
      off(referenciaConexion, 'value', listener);
    };
  } catch (error) {
    console.error('Error al suscribir a estado de conexión RTDB:', error);
    observador(false);
    return () => {};
  }
}
