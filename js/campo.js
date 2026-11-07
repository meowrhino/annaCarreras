// El campo de flujo de una semilla, sin DOM ni disco: un ruido suave que dice
// hacia dónde ir en cada punto y que va derivando con el tiempo. Lo usan el
// fondo (fondo.js), el icono de la pestaña (icono.js) y el build (el icono
// quieto). Misma semilla, mismo campo.

// mulberry32: azar determinista a partir de un entero.
const azar = (a) => () => {
  a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
const suave = (t) => t * t * (3 - 2 * t);

// El carácter sale de la semilla; la iteración solo cambia la tirada.
// Devuelve el azar (para seguir tirando), el carácter y el rumbo en cada punto.
export function campo(texto, iteracion = 1) {
  const rnd = azar(hash(texto) + iteracion);
  // Ruido de valor en 3D (x, y, tiempo) a partir de una tabla barajada. Entre 0 y 1.
  const tabla = new Uint8Array(512);
  for (let i = 0; i < 256; i++) tabla[i] = i;
  for (let i = 255; i > 0; i--) { const j = rnd() * (i + 1) | 0; [tabla[i], tabla[j]] = [tabla[j], tabla[i]]; }
  tabla.copyWithin(256, 0, 256);
  const ruido = (x, y, z) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    const u = suave(x - X), v = suave(y - Y), s = suave(z - Z);
    const at = (i, j, k) => tabla[(tabla[(tabla[(X + i) & 255] + Y + j) & 255] + Z + k) & 255] / 255;
    const mezcla = (a, b, t) => a + (b - a) * t;
    const capa = (k) => mezcla(mezcla(at(0, 0, k), at(1, 0, k), u), mezcla(at(0, 1, k), at(1, 1, k), u), v);
    return mezcla(capa(0), capa(1), s);
  };
  const c = {
    paso: 1.6 + rnd() * 1.8,               // px por paso
    escala: 1 / (120 + rnd() * 320),       // tamaño de los remolinos, en px
    rizo: 1 + rnd() * 2.5,                 // cuánto gira el campo (vueltas)
    deriva: 1 / (40000 + rnd() * 80000),   // cuánto cambia el campo con el tiempo
    rama: .004 + rnd() * .02,              // probabilidad de ramificar por paso
    recto: rnd() < .35,                    // ángulos rectos (circuito) o curva libre
    vida: 150 + rnd() * 450,               // pasos que vive una punta
    grueso: .9 + rnd() * 1,
  };
  const rumbo = (x, y, t) => {
    const a = (ruido(x * c.escala, y * c.escala, t * c.deriva) - .5) * Math.PI * 2 * c.rizo;
    return c.recto ? Math.round(a / (Math.PI / 2)) * Math.PI / 2 : a;
  };
  return { rnd, c, rumbo };
}
