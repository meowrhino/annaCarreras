// Rajoles: el fondo de la web. Una rejilla de rajoles multiescala, como en
// Trossets, pintada con una de sus 18 paletas. La semilla es el día: hoy todo
// el mundo ve el mismo fondo, mañana otro. ?dia=2026-09-28 reproduce uno.
// La hoja (el contenido) ocupa celdas enteras de la rejilla y tapa las
// rajoles que caen debajo.
// Provisional: los bloques de BLOCKS son nuestros, a la manera de Trossets.
// Anna puede cambiarlos por los suyos sin tocar el resto.

// Las paletas de Trossets (Art Blocks, proyecto 147), en su orden:
// fondo, fondo medio, línea, claro, acento.
const PALETTES = {
  Montseny: ['#ABD16A', '#61BC47', '#245E2C', '#FEF2F2', '#F03E3C'],
  Salines: ['#70CC96', '#98D9A3', '#0D0C0A', '#B25D2B', '#E5BF00'],
  Ibiza: ['#000000', '#347460', '#44C3B2', '#8EDBD0', '#E52E2E'],
  Altafulla: ['#EBA26E', '#C45F43', '#40373D', '#E3CC98', '#67987B'],
  Industria: ['#A0A6AD', '#696F80', '#2B3038', '#FFD900', '#FFEA81'],
  Olivos: ['#44564A', '#DCCBAD', '#142D27', '#6C7860', '#E05848'],
  Mallorca: ['#DCCBAD', '#44564A', '#142D27', '#6C7860', '#E05848'],
  Tortilla: ['#E8E8B0', '#F5BB0C', '#FFD745', '#ED7343', '#26403F'],
  Paella: ['#F5BB0C', '#FFD745', '#26403F', '#EAD8AF', '#ED5311'],
  Menorca: ['#75AE9D', '#B42339', '#381B2F', '#D1754C', '#DBBD3B'],
  'La Barca': ['#FA4A2F', '#088B83', '#2B2B2B', '#000000', '#F2AC72'],
  Barraca: ['#088B83', '#2B2B2B', '#000000', '#F2AC72', '#FA4A2F'],
  Mar: ['#FAFAFA', '#F9D401', '#F99F00', '#0E376F', '#3A6BA5'],
  Palamós: ['#E8D5B9', '#E8D5B9', '#0E2430', '#FC3A51', '#F5B349'],
  Buganvilea: ['#EEF0C6', '#616621', '#9FA619', '#FF027F', '#272225'],
  Alzines: ['#727E66', '#44564A', '#142D27', '#DCCBAD', '#C6A882'],
  Puigpedrós: ['#CCCEBD', '#982D03', '#010101', '#898D6C', '#A8AA92'],
  Beget: ['#00B284', '#D1DFB2', '#1C1F1E', '#005A3F', '#00835E'],
};

// Cada bloque dibuja una celda de lado s en (x, y). P es la paleta y w el
// grosor de línea del día. Las barras y los arcos salen hasta el borde, así
// se enlazan con la celda vecina.
const TAU = Math.PI * 2;
const BLOCKS = {
  empty() {},
  h(c, x, y, s, P, w) { bar(c, x, y + s / 2, x + s, y + s / 2, w, P[2]); beads(c, x, y, s, P, w, 1, 0); },
  v(c, x, y, s, P, w) { bar(c, x + s / 2, y, x + s / 2, y + s, w, P[2]); beads(c, x, y, s, P, w, 0, 1); },
  cross(c, x, y, s, P, w) {
    bar(c, x, y + s / 2, x + s, y + s / 2, w, P[2]);
    bar(c, x + s / 2, y, x + s / 2, y + s, w, P[2]);
    disc(c, x + s / 2, y + s / 2, w * .32, P[4]);
  },
  corner(c, x, y, s, P, w) {
    c.beginPath(); c.moveTo(x, y + s / 2); c.lineTo(x + s / 2, y + s / 2); c.lineTo(x + s / 2, y + s);
    c.lineWidth = w; c.strokeStyle = P[2]; c.lineJoin = 'round'; c.stroke();
  },
  arcsA(c, x, y, s, P, w) { arcs(c, [[x, y, 0], [x + s, y + s, 2]], s, w, P[2]); },
  arcsB(c, x, y, s, P, w) { arcs(c, [[x + s, y, 1], [x, y + s, 3]], s, w, P[2]); },
  ring(c, x, y, s, P, w) {
    disc(c, x + s / 2, y + s / 2, s * .3, P[4]);
    disc(c, x + s / 2, y + s / 2, s * .19, P[3]);
    disc(c, x + s / 2, y + s / 2, s * .09, P[2]);
  },
  seeds(c, x, y, s, P) {
    for (const a of [.25, .5, .75]) for (const b of [.25, .5, .75]) disc(c, x + a * s, y + b * s, s * .045, P[4]);
  },
  pond(c, x, y, s, P) {
    disc(c, x + s / 2, y + s / 2, s * .4, P[1]);
    disc(c, x + s / 2, y + s / 2, s * .11, P[3]);
  },
};

function bar(c, x0, y0, x1, y1, w, color) {
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
  c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = color; c.stroke();
}
function disc(c, x, y, r, color) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = color; c.fill();
}
// Dos puntos claros a lo largo de la barra, como cuentas.
function beads(c, x, y, s, P, w, dx, dy) {
  for (const t of [.3, .7]) disc(c, x + (dx ? t : .5) * s, y + (dy ? t : .5) * s, w * .2, P[3]);
}
// Cuartos de círculo centrados en dos esquinas opuestas (rajola de Smith).
function arcs(c, corners, s, w, color) {
  c.lineWidth = w; c.lineCap = 'butt'; c.strokeStyle = color;
  for (const [cx, cy, q] of corners) {
    c.beginPath(); c.arc(cx, cy, s / 2, q * TAU / 4, (q + 1) * TAU / 4); c.stroke();
  }
}

// Azar determinista: el mismo día y la misma celda dan siempre lo mismo.
function mulberry32(a) {
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hashString = (str) => [...str].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;

// El día: ?dia=AAAA-MM-DD o el de hoy, en hora local.
const asked = new URLSearchParams(location.search).get('dia');
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const day = /^\d{4}-\d{2}-\d{2}$/.test(asked || '') ? asked : today;
const seed = hashString(day);

// Lo que decide el día, en orden fijo.
const R = mulberry32(seed);
const names = Object.keys(PALETTES);
const paletteName = names[R() * names.length | 0];
const P = PALETTES[paletteName];
const split = .06 + R() * .24;                 // probabilidad de partir una celda en cuatro (una sola vez)
const thick = .13 + R() * .07;                 // grosor de línea, en fracción de celda
const all = Object.keys(BLOCKS);
const blocks = all.map(b => [R(), b]).sort((a, b) => a[0] - b[0]).map(x => x[1])
  .slice(0, 3 + (R() * (all.length - 2) | 0)); // hoy solo salen algunos bloques

const cellRandom = (i, j) => mulberry32(seed ^ Math.imul(i + 1, 73856093) ^ Math.imul(j + 1, 19349663));

/* ---------- la hoja: colores y geometría ---------- */

const root = document.documentElement;
const hoja = document.querySelector('.hoja');
const inner = hoja.firstElementChild;

// Tinta: el color de la paleta que más contrasta con el fondo; si ninguno
// llega a 4.5:1, negro o blanco.
const lum = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map(h => parseInt(h, 16) / 255)
    .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
let ink = P.slice(1).reduce((best, c) => contrast(c, P[0]) > contrast(best, P[0]) ? c : best);
if (contrast(ink, P[0]) < 4.5) ink = contrast('#000000', P[0]) > contrast('#ffffff', P[0]) ? '#000000' : '#ffffff';
root.style.setProperty('--paper', P[0]);
root.style.setProperty('--ink', ink);
root.style.setProperty('--accent', P[4] === P[0] ? P[2] : P[4]);

const foot = document.querySelector('.dia');
foot.href = '?dia=' + day;
foot.textContent = `paleta ${paletteName} · ${day.split('-').reverse().join('.')}`;

// Rejillas de Trossets: 12 columnas en móvil y escritorio, 9 en tableta. La
// hoja ocupa un número par o impar de celdas (el de la rejilla) centrado, lo
// más ancho que quepa en ~1040 px.
let cols, s, n;
function layout() {
  const w = root.clientWidth;
  cols = w < 600 || w >= 1100 ? 12 : 9;
  s = w / cols;
  const options = cols === 12 ? [10, 8, 6] : [7, 5];
  n = options.find(k => k * s <= 1040) ?? options.at(-1);
  root.style.setProperty('--s', s + 'px');
  root.style.setProperty('--n', n);
  root.style.setProperty('--m', (cols - n) / 2);
  fitHoja();
}

// El alto de la hoja se redondea a celdas enteras.
function fitHoja() {
  hoja.style.height = Math.ceil(inner.offsetHeight / s) * s + 'px';
}

/* ---------- el fondo ---------- */

const canvas = document.querySelector('.rajoles');
const ctx = canvas.getContext('2d');
let progress = 0;

function draw() {
  const dpr = devicePixelRatio || 1, vw = root.clientWidth, vh = innerHeight;
  if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = P[0];
  ctx.fillRect(0, 0, vw, vh);

  const top = scrollY;
  for (let j = Math.floor(top / s); j * s < top + vh; j++) {
    for (let i = 0; i < cols; i++) {
      const r = cellRandom(i, j);
      if (r() > progress) continue;            // al entrar, las celdas salen en orden aleatorio
      const x = i * s, y = j * s - top;
      if (r() < split) {
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) tile(r, x + a * s / 2, y + b * s / 2, s / 2);
      } else tile(r, x, y, s);
    }
  }
}

function tile(r, x, y, size) {
  BLOCKS[blocks[r() * blocks.length | 0]](ctx, x, y, size, P, size * thick);
}

let queued = 0;
const redraw = () => queued ||= requestAnimationFrame(() => { queued = 0; draw(); });

layout();
new ResizeObserver(() => { fitHoja(); redraw(); }).observe(inner);
addEventListener('resize', () => { layout(); redraw(); });
addEventListener('scroll', redraw, { passive: true });

// Primero el fondo, rajola a rajola; luego se asienta la hoja.
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  progress = 1;
  draw();
  hoja.classList.add('on');
} else {
  const t0 = performance.now(), dur = 900;
  requestAnimationFrame(function step(t) {
    progress = Math.min((t - t0) / dur, 1);
    draw();
    if (progress < 1) requestAnimationFrame(step);
    else hoja.classList.add('on');
  });
}
