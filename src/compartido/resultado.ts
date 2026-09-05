/**
 * Estructura estándar para el manejo predecible de resultados de operaciones.
 * Evita excepciones no controladas y proporciona tipado estricto de éxito y error.
 */

export interface Exito<T> {
  readonly exito: true;
  readonly datos: T;
}

export interface Falla<E = Error> {
  readonly exito: false;
  readonly error: E;
}

export type Resultado<T, E = Error> = Exito<T> | Falla<E>;

export function crearExito<T>(datos: T): Exito<T> {
  return { exito: true, datos };
}

export function crearFalla<E = Error>(error: E): Falla<E> {
  return { exito: false, error };
}
