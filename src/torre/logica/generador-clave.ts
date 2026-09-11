/**
 * Generador determinista de clave técnica interna para RTDB.
 * 
 * Reglas de Torre de Control:
 * 1. Derivado directamente del nombre comercial.
 * 2. Determinista y consistente.
 * 3. Longitud máxima: 3 caracteres.
 * 4. Caracteres alfanuméricos en minúsculas (sin acentos, sin espacios, sin caracteres especiales).
 * 5. Manejo de colisiones garantizando siempre <= 3 caracteres.
 */

export function generarClaveTecnica(
  nombreComercial: string,
  clavesExistentes: readonly string[] = [],
  idActual?: string
): string {
  // Si ya tiene un ID asignado de <= 3 caracteres (actualización), se preserva
  if (idActual && idActual.trim().length > 0 && idActual.trim().length <= 3) {
    return idActual.trim().toLowerCase();
  }

  // Limpieza básica: quitar tildes, símbolos raros
  const normalizado = nombreComercial
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  const palabras = normalizado.split(/\s+/).filter(Boolean);

  let base = '';

  if (palabras.length >= 3) {
    // Tomar la primera letra de las primeras 3 palabras (ej: "Marisquería Puerto Libres" -> "mpl")
    base = palabras[0][0] + palabras[1][0] + palabras[2][0];
  } else if (palabras.length === 2) {
    const p1 = palabras[0];
    const p2 = palabras[1];
    // Si la segunda palabra tiene al menos 2 letras, tomar 1 de la primera + 2 de la segunda
    // ej: "El Arquitecto" -> "ear"
    if (p2.length >= 2) {
      base = p1[0] + p2.slice(0, 2);
    } else {
      base = p1.slice(0, 2) + p2[0];
    }
  } else if (palabras.length === 1) {
    const p = palabras[0];
    base = p.slice(0, 3);
  }

  // Si tiene menos de 3 caracteres, rellenar con números
  if (base.length === 0) {
    base = 'neg';
  } else if (base.length === 1) {
    base = `${base}01`;
  } else if (base.length === 2) {
    base = `${base}1`;
  }

  // Asegurar que no exceda 3 caracteres
  base = base.slice(0, 3);

  // Si la clave base no está tomada por otro negocio, usarla
  const conjuntoExistentes = new Set(clavesExistentes.map((k) => k.toLowerCase()));
  if (!conjuntoExistentes.has(base)) {
    return base;
  }

  // Manejo de colisión: probar variaciones cortas manteniendo <= 3 caracteres
  // ej: base = "mpl" -> "mp1", "mp2" ... "m01", "m02"
  const prefijo2 = base.slice(0, 2);
  for (let i = 1; i <= 9; i++) {
    const candidato = `${prefijo2}${i}`;
    if (!conjuntoExistentes.has(candidato)) {
      return candidato;
    }
  }

  const prefijo1 = base.slice(0, 1);
  for (let i = 10; i <= 99; i++) {
    const candidato = `${prefijo1}${i}`;
    if (!conjuntoExistentes.has(candidato)) {
      return candidato;
    }
  }

  // Caso extremo: fallback de 3 caracteres
  return base;
}
