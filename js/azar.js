// Azar determinista: la misma semilla da siempre la misma secuencia.

// Generador de números entre 0 y 1 a partir de un entero de 32 bits.
export function mulberry32(a) {
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Un texto (el día, la llavor) → un entero de 32 bits (FNV-1a).
export const hashTexto = (texto) =>
  [...texto].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
