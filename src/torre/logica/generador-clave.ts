/**
 * Generador canónico de negocio_nombre_id y categorías para RTDB.
 * 
 * Reglas de Torre de Control y Monitoreo:
 * 1. Derivado directamente del nombre comercial introducido por el especialista.
 * 2. Mantiene mayúsculas y minúsculas exactas.
 * 3. Sanitiza acentos (á->a, é->e, etc.) y diacríticos.
 * 4. Sustituye espacios por guiones bajos (_) y remueve caracteres prohibidos en Firebase (. # $ [ ] /).
 * 5. Si hay colisión con otro negocio existente en la misma categoría, agrega sufijo numérico (_2, _3).
 * 
 * Ejemplo:
 * "Marisquería Puerto Libres" -> "Marisqueria_Puerto_Libres"
 */

export function generarNegocioNombreId(
  nombreComercial: string,
  clavesExistentes: readonly string[] = [],
  idActual?: string
): string {
  if (idActual && idActual.trim()) {
    return idActual.trim();
  }

  const limpio = nombreComercial
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  const base = limpio || 'Negocio';

  const conjunto = new Set(clavesExistentes.map((c) => c.toLowerCase()));
  if (!conjunto.has(base.toLowerCase())) {
    return base;
  }

  let contador = 2;
  while (conjunto.has(`${base}_${contador}`.toLowerCase())) {
    contador++;
  }
  return `${base}_${contador}`;
}

export function sanitizarNombreCategoria(nombreCategoria: string): string {
  return nombreCategoria
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .trim();
}

/**
 * Función canónica para generación de IDs de negocio (reemplaza el legacy de 3 letras).
 */
export function generarClaveTecnica(
  nombreComercial: string,
  clavesExistentes: readonly string[] = [],
  idActual?: string
): string {
  return generarNegocioNombreId(nombreComercial, clavesExistentes, idActual);
}

