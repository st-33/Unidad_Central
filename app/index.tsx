import React from 'react';
import { PantallaCentral } from '../src/central';

/**
 * Ruta raíz de Expo Router ('/').
 * Delega la ejecución completa al módulo de Central sin contener lógica interna.
 */
export default function RutaPrincipalCentral() {
  return <PantallaCentral />;
}
