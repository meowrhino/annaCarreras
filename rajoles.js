// Rajoles: el fondo de la web es Trossets. Sus 13 bloques, su azar ponderado
// y sus 18 paletas, en una rejilla sin fin que sigue al scroll. La semilla es
// el día: hoy todo el mundo ve el mismo fondo; mañana, otro.
// La hoja (el contenido) ocupa celdas enteras de la rejilla.
//
// URL: ?dia=AAAA-MM-DD (otro día), ?llavor=… (otra combinación), ?paleta=Paella.
//
// Los bloques son el script on-chain de Trossets (Art Blocks, proyecto 147),
// de Anna Carreras, pasado de p5 a canvas 2D sin cambiar la geometría. Solo
// es nuestro lo que los coloca en la rejilla y los controles del pie.

// Las paletas de Trossets, en su orden: c1 fondo, c2 fondo medio, c3 línea,
// c4 puntos, c5 acento.
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
const NAMES = Object.keys(PALETTES);

// Qué bloques pueden salir juntos, y con qué peso (el umbral de q, de 0 a 195).
const SETS = [
  [185, [3, 4, 5, 7, 8]], [175, [4, 5, 7, 8]], [170, [4, 7, 8]], [165, [2, 11, 12]], [160, [11, 12]],
  [155, [0, 1, 2, 4, 5, 6, 8]], [150, [0, 1, 2, 4, 5, 8, 12]], [145, [0, 1, 2, 4, 5, 8]], [140, [4, 5, 8]],
  [135, [5, 8]], [130, [3, 7, 12]], [125, [3, 7, 11]], [115, [3, 6, 7]], [110, [3, 7]], [107, [7]], [105, [3]],
  [100, [4, 10, 11, 12]], [95, [4, 10, 12]], [85, [6, 7, 8, 12]], [80, [5, 10]], [75, [4, 8]],
  [65, [4, 6, 7, 8, 12]], [60, [3, 4, 10, 11, 12]], [55, [2, 4, 10]], [45, [2, 5, 11]], [40, [2, 3, 4, 10, 11, 12]],
  [33, [2, 3, 10, 12]], [30, [2, 3, 4, 11, 12]], [20, [2, 3]], [10, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  [-1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]],
];

/* ---------- los bloques de Trossets ---------- */

// Cada bloque se dibuja en coordenadas de unidad, entre .25 y .75, como en el
// original (translate + scale(2 * lado)).
let g, c1, c2, c3, c4, c5, baro, barcs, bbuit, bcreu;
const TAU = Math.PI * 2, rad = Math.PI / 180, ang = Math.PI / 6;
const f16 = 1 / 6, f26 = 2 / 6, f166 = .6 * f16, f1635 = .35 * f16, f165 = .5 * f16, f1625 = .25 * f16;

const dot = (x, y, d, col) => { g.beginPath(); g.arc(x, y, d / 2, 0, TAU); g.fillStyle = col; g.fill(); };
const ring = (x, y, d, col) => { g.beginPath(); g.arc(x, y, d / 2, 0, TAU); g.strokeStyle = col; g.lineWidth = .03; g.stroke(); };
const seg = (x0, y0, x1, y1, col, w) => {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = w; g.stroke();
};
const arcLine = (x, y, a0, a1, col, w) => {
  g.beginPath(); g.arc(x, y, .25, a0 * rad, a1 * rad); g.strokeStyle = col; g.lineWidth = w; g.stroke();
};
const box = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

const TROSSETS = [
  () => { fons(); arcsD(c3, f16); bbuit && arcsD(c1, f165); bcreu && creu(c5, f1625); punts5C(); },             // L
  () => { fons(); arcsE(c3, f16); bbuit && arcsE(c1, f165); bcreu && creu(c5, f1625); punts4Q(); },             // R
  () => { fons(); liniaH(); punts2V(); baro && punts2Vs(); barcs && punts2Vb(); punts4Q(); punts3H(); },         // H
  () => { liniaV(); punts2H(); baro && punts2Hs(); barcs && punts2Hb(); punts3V(); punts1NO(); },               // V
  () => {                                                                                                        // P
    fons(); punts2H(); baro && punts2Hs(); barcs && punts2Hb();
    punts2V(); baro && punts2Vs(); barcs && punts2Vb(); punts1CO(); bcreu && creu(c1, f1635);
  },
  () => {                                                                                                        // X
    arcsD(c2, f16); bbuit && arcsD(c1, f165); arcsE(c3, f16); bbuit && arcsE(c1, f165);
    punts4D(); punts1SE(); bcreu && creu(c5, f1625);
  },
  () => { fons(); liniaH(); liniaV(); punts3H(); punts5C(); },                                                  // M
  () => { liniaH(); punts2V(); baro && punts2Vs(); barcs && punts2Vb(); punts3H(); punts1SE(); },              // VV
  () => {                                                                                                        // XX
    arcsE(c2, f16); bbuit && arcsE(c1, f165); arcsD(c3, f16); bbuit && arcsD(c1, f165);
    punts4D(); punts1NO(); bcreu && creu(c5, f1625);
  },
  () => {                                                                                                        // LL
    fons(); arcsD(c2, f16); bbuit && arcsD(c1, f165);
    punts2H(); baro && punts2Hs(); barcs && punts2Hb(); punts1CO(); bcreu && creu(c1, f1635);
  },
  () => {                                                                                                        // PP
    fons(); punts2H(); baro && punts2Hs(); barcs && punts2Hb();
    punts2V(); baro && punts2Vs(); barcs && punts2Vb(); punts3V();
  },
  () => { migFonsN(); liniaH(); puntN(); puntS(); baro && puntSs2(); barcs && puntSb2(); punts1NO(); bcreu && creu(c5, f1625); }, // MN
  () => { migFonsS(); liniaH(); puntN(); baro && puntNs2(); barcs && puntNb2(); puntS(); punts3H(); },          // MS
];

function fons() { box(.25, .25, .5, .5, c2); for (const [x, y] of [[.25, .25], [.75, .25], [.75, .75], [.25, .75]]) dot(x, y, f26, c1); }
function migFonsN() { box(.25, .25, .5, .25, c2); dot(.25, .25, f26, c1); dot(.75, .25, f26, c1); }
function migFonsS() { box(.25, .5, .5, .25, c2); dot(.75, .75, f26, c1); dot(.25, .75, f26, c1); }
function arcsE(col, w) { arcLine(.75, .75, 180, 270, col, w); arcLine(.25, .25, 0, 90, col, w); }
function arcsD(col, w) { arcLine(.75, .25, 90, 180, col, w); arcLine(.25, .75, 270, 360, col, w); }
function liniaH() { seg(.25, .5, .75, .5, c3, f16); }
function liniaV() { seg(.5, .25, .5, .75, c3, f16); }
function punts2V() { dot(.5, .25, f16, c4); dot(.5, .75, f16, c4); }
function punts2Vs() { ring(.5, .25, f165, c5); ring(.5, .75, f165, c5); }
function punts2Vb() { blossom(.5, .25); blossom(.5, .75); }
function punts2H() { dot(.25, .5, f16, c4); dot(.75, .5, f16, c4); }
function punts2Hs() { ring(.25, .5, f165, c5); ring(.75, .5, f165, c5); }
function punts2Hb() { blossom(.25, .5); blossom(.75, .5); }
function puntN() { dot(.5, .25, f16, c4); }
function puntNs2() { ring(.5, .25, f165, c5); }
function puntNb2() { blossom(.5, .25); }
function puntS() { dot(.5, .75, f16, c4); }
function puntSs2() { ring(.5, .75, f165, c5); }
function puntSb2() { blossom(.5, .75); }
function punts5C() { for (let a = 45; a <= 225; a += 45) dot(.75 + f166 * Math.cos(a * rad), .25 + f166 * Math.sin(a * rad), f1635, c5); }
function punts1NO() { dot(.25, .25, f166, c5); }
function punts1SE() { dot(.75, .75, f166, c5); }
function punts1CO() { dot(.5, .5, f16, c5); }
function punts4Q() { for (const [x, y] of [[.25, .25], [.75, .25], [.75, .75], [.25, .75]]) dot(x, y, f165, c5); }
function punts4D() { for (const [x, y] of [[.25, .5], [.75, .5], [.5, .25], [.5, .75]]) dot(x, y, f1635, c5); }
function punts3H() { for (const t of [.25, .5, .75]) dot(.25 + .5 * t, .5, f1635, c5); }
function punts3V() { for (const t of [.25, .5, .75]) dot(.5, .25 + .5 * t, f1635, c5); }
// arcs3 + el círculo de fondo encima: tres pétalos alrededor de un punto.
function blossom(x, y) {
  g.fillStyle = c5;
  for (let t = 0; t < 3; t++) {
    const a = t * ang * 2;
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, f16 / 2, a, a + ang); g.closePath(); g.fill();
  }
  dot(x, y, f165, c1);
}
function creu(col, t) { seg(.5 - t, .5 + t, .5 + t, .5 - t, col, .03); seg(.5 - t, .5 - t, .5 + t, .5 + t, col, .03); }

/* ---------- azar determinista ---------- */

function mulberry32(a) {
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hashString = (str) => [...str].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;

/* ---------- estado: día, llavor y paleta, en la URL ---------- */

const isDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !isNaN(Date.parse(d));
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const params = new URLSearchParams(location.search);
const state = {
  dia: isDay(params.get('dia')) ? params.get('dia') : today,
  llavor: params.get('llavor') || null,
  paleta: PALETTES[params.get('paleta')] ? params.get('paleta') : null,
};

function query() {
  const q = new URLSearchParams();
  if (state.dia !== today) q.set('dia', state.dia);
  if (state.llavor) q.set('llavor', state.llavor);
  if (state.paleta) q.set('paleta', state.paleta);
  return q.size ? '?' + q : location.pathname;
}

// Lo que decide la semilla, en orden fijo. La paleta se sortea siempre, así
// elegir otra a mano no cambia las rajoles.
let seed, P, dayPalette, split, possibles;
function traits() {
  seed = hashString(state.llavor || state.dia);
  const R = mulberry32(seed);
  dayPalette = NAMES[R() * NAMES.length | 0];
  P = PALETTES[state.paleta || dayPalette];
  [c1, c2, c3, c4, c5] = P;
  // Los adornos de Trossets: aros, pétalos, cruces, arcos huecos.
  let s = R();
  baro = barcs = bbuit = bcreu = false;
  if (s > .98) baro = true;
  else if (s > .94) barcs = true;
  else if (s > .87) bcreu = true;
  else if (s > .77) { bbuit = true; baro = R() > .35; }
  // Casi siempre pocas celdas partidas; a veces, muchas.
  const [lo, hi] = R() > .88 ? [.49, .63] : [.89, .93];
  split = 1 - (lo + (hi - lo) * R());
  const q = R() * 195;
  possibles = SETS.find(([min]) => q > min)[1];
}

const cellRandom = (i, j) => mulberry32(seed ^ Math.imul(i + 1, 73856093) ^ Math.imul(j + 1, 19349663));

/* ---------- la hoja: colores y geometría ---------- */

const root = document.documentElement;
const hoja = document.querySelector('.hoja');
const inner = hoja.firstElementChild;

// Tinta: el color de la paleta que más contrasta con el fondo; si ninguno
// llega a 4.5:1, negro o blanco.
const lum = (hex) => {
  const [r, gg, b] = hex.match(/\w\w/g).map(h => parseInt(h, 16) / 255)
    .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * gg + .0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };

function colors() {
  let ink = P.slice(1).reduce((best, c) => contrast(c, c1) > contrast(best, c1) ? c : best);
  if (contrast(ink, c1) < 4.5) ink = contrast('#000000', c1) > contrast('#ffffff', c1) ? '#000000' : '#ffffff';
  root.style.setProperty('--paper', c1);
  root.style.setProperty('--ink', ink);
  root.style.setProperty('--accent', c5 === c1 ? c3 : c5);
}

// 12 columnas en móvil y escritorio, 9 en tableta, como las rejillas de
// Trossets. La hoja, centrada, lo más ancha que quepa en ~1040 px.
let cols, s;
function layout() {
  const w = root.clientWidth;
  cols = w < 600 || w >= 1100 ? 12 : 9;
  s = w / cols;
  const options = cols === 12 ? [10, 8, 6] : [7, 5];
  const n = options.find(k => k * s <= 1040) ?? options.at(-1);
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
g = canvas.getContext('2d');
let progress = 0;

function draw() {
  const dpr = devicePixelRatio || 1, vw = root.clientWidth, vh = innerHeight;
  if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = c1;
  g.fillRect(0, 0, vw, vh);
  g.lineCap = 'round';

  // Como en Trossets: primero las rajoles grandes, luego las pequeñas encima.
  // Una fila de más arriba y abajo, porque los bloques se salen de su celda.
  const small = [];
  for (let j = Math.floor(scrollY / s) - 1; j * s < scrollY + vh + s; j++) {
    for (let i = 0; i < cols; i++) {
      const r = cellRandom(i, j);
      if (r() > progress) continue;            // al entrar, las celdas salen en orden aleatorio
      const x = i * s, y = j * s - scrollY;
      if (r() < split) {
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) small.push([pick(r), x + a * s / 2, y + b * s / 2, s / 2]);
      } else tile(pick(r), x, y, s);
    }
  }
  for (const t of small) tile(...t);
}

const pick = (r) => possibles[r() * possibles.length | 0];

function tile(id, x, y, size) {
  const dpr = devicePixelRatio || 1;
  g.setTransform(dpr * 2 * size, 0, 0, dpr * 2 * size, dpr * (x - size / 2), dpr * (y - size / 2));
  TROSSETS[id]();
}

let queued = 0;
const redraw = () => queued ||= requestAnimationFrame(() => { queued = 0; draw(); });

// Las rajoles salen una a una. La primera vez, la hoja espera a que acaben.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
function reveal(dur, done) {
  if (still) { progress = 1; draw(); return done?.(); }
  const t0 = performance.now();
  requestAnimationFrame(function step(t) {
    progress = Math.min((t - t0) / dur, 1);
    draw();
    if (progress < 1) requestAnimationFrame(step);
    else done?.();
  });
}

/* ---------- el pie: día, paleta y otra combinación ---------- */

const foot = {
  dia: document.querySelector('.dia'),
  prev: document.querySelector('.prev'),
  next: document.querySelector('.next'),
  paleta: document.querySelector('.paleta'),
  otra: document.querySelector('.otra'),
  paletas: document.querySelector('.paletas'),
};

const swatch = (name) => el('span', 'muestra', PALETTES[name].map(c => {
  const i = document.createElement('i'); i.style.background = c; return i;
}));
function el(tag, cls, children = []) {
  const n = document.createElement(tag); n.className = cls; n.append(...children); return n;
}

// Una muestra por paleta, y la primera vuelve a la del día.
foot.paletas.append(...[null, ...NAMES].map(name => {
  const b = el('button', '', [swatch(name || NAMES[0]), name || 'del día']);
  b.type = 'button';
  b.dataset.name = name || '';
  b.addEventListener('click', () => { state.paleta = name; foot.paletas.hidden = true; foot.paleta.setAttribute('aria-expanded', 'false'); apply(); });
  return b;
}));

foot.paleta.addEventListener('click', () => {
  foot.paletas.hidden = !foot.paletas.hidden;
  foot.paleta.setAttribute('aria-expanded', String(!foot.paletas.hidden));
});

const shift = (day, d) => new Date(Date.parse(day) + d * 864e5).toISOString().slice(0, 10);
foot.prev.addEventListener('click', () => { state.llavor = null; state.dia = shift(state.dia, -1); apply(); });
foot.next.addEventListener('click', () => { state.llavor = null; state.dia = shift(state.dia, 1); apply(); });
// Otra combinación con la misma paleta.
foot.otra.addEventListener('click', () => {
  state.paleta ||= dayPalette;
  state.llavor = Math.random().toString(16).slice(2, 8);
  apply();
});

function apply(first) {
  traits();
  colors();
  const q = query();
  history.replaceState(history.state, '', q + location.hash);
  foot.dia.href = q;
  foot.dia.textContent = state.llavor ? 'llavor ' + state.llavor : state.dia.split('-').reverse().join('.');
  foot.paleta.textContent = 'paleta ' + (state.paleta || dayPalette);
  foot.paletas.querySelector('[data-name=""] .muestra').replaceWith(swatch(dayPalette));
  foot.paletas.querySelectorAll('button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.name === (state.paleta || ''))));
  if (!first) reveal(500);
}

apply(true);
layout();
new ResizeObserver(() => { fitHoja(); redraw(); }).observe(inner);
addEventListener('resize', () => { layout(); redraw(); });
addEventListener('scroll', redraw, { passive: true });

// Primero el fondo; luego se asienta la hoja.
reveal(900, () => hoja.classList.add('on'));
