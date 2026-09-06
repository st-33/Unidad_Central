/**
 * Rutas de nodos en Firebase Realtime Database para la estructura mínima de Central.
 * Mantiene la persistencia organizada bajo el espacio de nombres 'central'.
 */
export const RUTAS_RTDB_CENTRAL = {
  raiz: 'central',
  sistema: 'central/sistema',
  categorias: 'central/categorias',
  negocios: 'central/negocios',
  capacidades: 'central/capacidades',
} as const;
