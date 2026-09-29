// El fondo: una rejilla sin fin de rajoles de Trossets, pintada en un canvas
// fijo que solo dibuja las filas visibles y las mueve con el scroll.
//
// Cada celda tiene un estado de base, que sale de la semilla: siempre el
// mismo para el mismo día. Encima pueden ir dos capas vivas:
//   - cambios lentos (animación 1): cada ~2 s una celda libre cambia un
//     bloque, o se parte en cuatro, o se vuelve a unir. Se quedan.
//   - el rastro del cursor (animación 2): las celdas por donde pasa el ratón
//     o el dedo se regeneran y a los pocos segundos vuelven a lo que eran.
// Cada cambio se funde en ~0,4 s. Nada se mueve con «reducir movimiento» ni
// con la pestaña oculta.

import { pinta } from './trossets.js';
import { mulberry32 } from './azar.js';

const canvas = document.querySelector('.rajoles');
const g = canvas.getContext('2d');
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

const FUNDIDO = 400;          // ms que tarda una celda en cambiar
const CADA = 2000;            // ms entre cambios lentos
const RASTRO = 5000;          // ms que dura el rastro del cursor

let semilla, P, r;            // r: los rasgos del día (adornos, parte, possibles)
let cols = 12, s = 100;       // columnas y lado de celda, en px
let hueco = null;             // la hoja, en celdas: { x0, x1, y0, y1 } (y1 excluido)
let progreso = 0;             // la intro: qué fracción de celdas se ve (0 hasta que empieza)

const cambios = new Map();    // 'i,j' → estado: cambios lentos
const rastro = new Map();     // 'i,j' → { estado, hasta }: cursor
const fundidos = new Map();   // 'i,j' → { de: estado anterior, t0 }

/* ---------- configuración, desde rajoles.js ---------- */

// Un día (o llavor) nuevo: nuevos rasgos, y se olvidan los cambios vivos.
export function configura(nuevaSemilla, paleta, rasgos) {
  semilla = nuevaSemilla;
  P = paleta;
  r = rasgos;
  cambios.clear(); rastro.clear(); fundidos.clear();
}

// Otra paleta con las mismas rajoles.
export function cambiaPaleta(paleta) { P = paleta; pide(); }

export function rejilla(nuevo) {
  ({ cols, s, hueco } = nuevo);
  pide();
}

/* ---------- el estado de cada celda ---------- */

// Un estado es { parte, ids }: un bloque entero o cuatro pequeños.
const azar = (i, j) => mulberry32(semilla ^ Math.imul(i + 1, 73856093) ^ Math.imul(j + 1, 19349663));
const elige = (rnd) => r.possibles[rnd() * r.possibles.length | 0];

function base(i, j) {
  const rnd = azar(i, j);
  const cuando = rnd();                          // cuándo aparece en la intro
  const parte = rnd() < r.parte;
  return { cuando, parte, ids: parte ? [elige(rnd), elige(rnd), elige(rnd), elige(rnd)] : [elige(rnd)] };
}

const clave = (i, j) => i + ',' + j;
// Lo que se ve en una celda: el rastro manda sobre los cambios, y estos sobre la base.
const estado = (i, j, b) => rastro.get(clave(i, j))?.estado ?? cambios.get(clave(i, j)) ?? b ?? base(i, j);

function libre(i, j) {
  if (i < 0 || i >= cols || j < 0) return false;
  return !hueco || i < hueco.x0 || i >= hueco.x1 || j < hueco.y0 || j >= hueco.y1;
}

// Cambia una celda fundiendo desde lo que había.
function cambia(i, j, nuevo, temporal) {
  const k = clave(i, j);
  fundidos.set(k, { de: estado(i, j), t0: performance.now() });
  if (temporal) rastro.set(k, { estado: nuevo, hasta: performance.now() + RASTRO });
  else cambios.set(k, nuevo);
  pide();
}

// Una variación de un estado: casi siempre un bloque distinto; a veces
// partir o unir, como la multiescala de Trossets.
function varia(e) {
  if (Math.random() < .25) {
    const parte = !e.parte;
    return { parte, ids: parte ? [0, 1, 2, 3].map(() => elige(Math.random)) : [elige(Math.random)] };
  }
  const ids = [...e.ids];
  ids[Math.random() * ids.length | 0] = elige(Math.random);
  return { parte: e.parte, ids };
}

/* ---------- dibujo ---------- */

function dibuja() {
  const dpr = devicePixelRatio || 1, vw = document.documentElement.clientWidth, vh = innerHeight;
  if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.globalAlpha = 1;
  g.fillStyle = P[0];
  g.fillRect(0, 0, vw, vh);

  // Como en Trossets: primero las rajoles grandes, luego las pequeñas encima.
  // Una fila de más arriba y abajo, porque los bloques se salen de su celda.
  const grandes = [], pequeñas = [];
  const ahora = performance.now();
  for (let j = Math.floor(scrollY / s) - 1; j * s < scrollY + vh + s; j++) {
    for (let i = 0; i < cols; i++) {
      const b = base(i, j);
      if (b.cuando > progreso) continue;
      const x = i * s, y = j * s - scrollY;
      const f = fundidos.get(clave(i, j));
      const k = f ? Math.min((ahora - f.t0) / FUNDIDO, 1) : 1;
      if (k < 1) coloca(f.de, x, y, 1 - k, grandes, pequeñas);
      coloca(estado(i, j, b), x, y, k, grandes, pequeñas);
    }
  }
  for (const t of grandes) rajola(...t, dpr);
  for (const t of pequeñas) rajola(...t, dpr);
  g.globalAlpha = 1;
}

function coloca(e, x, y, alfa, grandes, pequeñas) {
  if (!e.parte) return grandes.push([e.ids[0], x, y, s, alfa]);
  const m = s / 2;
  e.ids.forEach((id, n) => pequeñas.push([id, x + (n % 2) * m, y + (n >> 1) * m, m, alfa]));
}

function rajola(id, x, y, lado, alfa, dpr) {
  g.globalAlpha = alfa;
  g.setTransform(dpr * 2 * lado, 0, 0, dpr * 2 * lado, dpr * (x - lado / 2), dpr * (y - lado / 2));
  pinta(g, id, P, r.adornos);
}

/* ---------- bucle ---------- */

// Un solo requestAnimationFrame a la vez: pide() dibuja en el siguiente
// cuadro, y el bucle sigue solo mientras haya fundidos o rastro que borrar.
let marco = 0;
export function pide() { marco ||= requestAnimationFrame(paso); }

function paso() {
  marco = 0;
  const ahora = performance.now();
  for (const [k, f] of fundidos) if (ahora - f.t0 > FUNDIDO) fundidos.delete(k);
  // El rastro caduca: la celda vuelve fundiéndose a lo que había debajo.
  for (const [k, t] of rastro) {
    if (ahora < t.hasta) continue;
    fundidos.set(k, { de: t.estado, t0: ahora });
    rastro.delete(k);
  }
  dibuja();
  if (fundidos.size || rastro.size) pide();
}

// La intro: las rajoles salen una a una en orden aleatorio.
export function revela(ms) {
  if (quieto) { progreso = 1; dibuja(); return Promise.resolve(); }
  return new Promise(hecho => {
    const t0 = performance.now();
    requestAnimationFrame(function frame(t) {
      progreso = Math.min((t - t0) / ms, 1);
      dibuja();
      if (progreso < 1) requestAnimationFrame(frame);
      else hecho();
    });
  });
}

/* ---------- las animaciones ---------- */

// 1. Cambios lentos: una celda libre y visible al azar.
function cambioLento() {
  if (document.hidden || progreso < 1) return;
  const vh = innerHeight;
  const j0 = Math.floor(scrollY / s), j1 = Math.floor((scrollY + vh) / s);
  for (let intento = 0; intento < 20; intento++) {
    const i = Math.random() * cols | 0, j = j0 + (Math.random() * (j1 - j0 + 1) | 0);
    if (libre(i, j)) return cambia(i, j, varia(estado(i, j)));
  }
}

// 2. El cursor: cada celda libre nueva por la que pasa se regenera un rato.
let ultima = '';
function pasa(e) {
  if (progreso < 1) return;
  const i = Math.floor(e.clientX / s), j = Math.floor((e.clientY + scrollY) / s);
  const k = clave(i, j);
  if (k === ultima || !libre(i, j)) return;
  ultima = k;
  cambia(i, j, varia(estado(i, j)), true);
}

if (!quieto) {
  setInterval(cambioLento, CADA);
  addEventListener('pointermove', pasa, { passive: true });
  addEventListener('pointerdown', pasa, { passive: true });
}
