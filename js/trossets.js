// Trossets, de Anna Carreras (Art Blocks, proyecto 147), pasado de p5 a
// canvas 2D sin cambiar la geometría: las 18 paletas, los 13 bloques, los
// adornos y el azar ponderado que decide qué bloques salen juntos.
// Sacado de generator.artblocks.io/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/147000000
// (2026-09-29). Licencia de Trossets: CC BY-NC-SA 4.0
// (https://creativecommons.org/licenses/by-nc-sa/4.0/); esta adaptación
// también. Los nombres en catalán son los del original.

// c1 fondo, c2 fondo medio, c3 línea, c4 puntos, c5 acento.
export const PALETTES = {
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
export const NAMES = Object.keys(PALETTES);

// Qué bloques pueden salir juntos, con su peso: q se sortea entre 0 y 195 y
// gana el primer umbral que supera (p30…p0 en el original).
const SETS = [
  [185, [3, 4, 5, 7, 8]], [175, [4, 5, 7, 8]], [170, [4, 7, 8]], [165, [2, 11, 12]], [160, [11, 12]],
  [155, [0, 1, 2, 4, 5, 6, 8]], [150, [0, 1, 2, 4, 5, 8, 12]], [145, [0, 1, 2, 4, 5, 8]], [140, [4, 5, 8]],
  [135, [5, 8]], [130, [3, 7, 12]], [125, [3, 7, 11]], [115, [3, 6, 7]], [110, [3, 7]], [107, [7]], [105, [3]],
  [100, [4, 10, 11, 12]], [95, [4, 10, 12]], [85, [6, 7, 8, 12]], [80, [5, 10]], [75, [4, 8]],
  [65, [4, 6, 7, 8, 12]], [60, [3, 4, 10, 11, 12]], [55, [2, 4, 10]], [45, [2, 5, 11]], [40, [2, 3, 4, 10, 11, 12]],
  [33, [2, 3, 10, 12]], [30, [2, 3, 4, 11, 12]], [20, [2, 3]], [10, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  [-1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12]],
];

// Lo que decide setup() en el original, en su orden: paleta, adornos,
// cuántas celdas se parten (casi siempre un 7–11 %; a veces un 37–51 %) y
// qué bloques salen. R es un generador de números entre 0 y 1.
export function rasgos(R) {
  const paleta = NAMES[R() * NAMES.length | 0];
  const adornos = { baro: false, barcs: false, bbuit: false, bcreu: false };
  const s = R();
  if (s > .98) adornos.baro = true;
  else if (s > .94) adornos.barcs = true;
  else if (s > .87) adornos.bcreu = true;
  else if (s > .77) { adornos.bbuit = true; adornos.baro = R() > .35; }
  const [pMin, pMax] = R() > .88 ? [.49, .63] : [.89, .93];
  const parte = 1 - (pMin + (pMax - pMin) * R());
  const q = R() * 195;
  const possibles = SETS.find(([min]) => q > min)[1];
  return { paleta, adornos, parte, possibles };
}

/* ---------- los bloques ---------- */

// Se dibujan en coordenadas de unidad, entre .25 y .75, como en el original
// (translate + scale(2 * lado)). Quien llama pone esa transformación.
let g, c1, c2, c3, c4, c5, baro, barcs, bbuit, bcreu;

export function pinta(ctx, id, P, adornos) {
  g = ctx;
  [c1, c2, c3, c4, c5] = P;
  ({ baro, barcs, bbuit, bcreu } = adornos);
  g.lineCap = 'round';
  TROSSETS[id]();
}

const TAU = Math.PI * 2, rad = Math.PI / 180, ang = Math.PI / 6;
const f16 = 1 / 6, f26 = 2 / 6, f166 = .6 * f16, f1635 = .35 * f16, f165 = .5 * f16, f1625 = .25 * f16;

// Lo que en p5 son circle(), line(), arc() y rect().
const dot = (x, y, d, col) => { g.beginPath(); g.arc(x, y, d / 2, 0, TAU); g.fillStyle = col; g.fill(); };
const ring = (x, y, d, col) => { g.beginPath(); g.arc(x, y, d / 2, 0, TAU); g.strokeStyle = col; g.lineWidth = .03; g.stroke(); };
const seg = (x0, y0, x1, y1, col, w) => {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = w; g.stroke();
};
const arcLine = (x, y, a0, a1, col, w) => {
  g.beginPath(); g.arc(x, y, .25, a0 * rad, a1 * rad); g.strokeStyle = col; g.lineWidth = w; g.stroke();
};
const box = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

// Los 13 bloques, por su nombre en el original.
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
function punts2Vb() { arcs3(.5, .25); arcs3(.5, .75); }
function punts2H() { dot(.25, .5, f16, c4); dot(.75, .5, f16, c4); }
function punts2Hs() { ring(.25, .5, f165, c5); ring(.75, .5, f165, c5); }
function punts2Hb() { arcs3(.25, .5); arcs3(.75, .5); }
function puntN() { dot(.5, .25, f16, c4); }
function puntNs2() { ring(.5, .25, f165, c5); }
function puntNb2() { arcs3(.5, .25); }
function puntS() { dot(.5, .75, f16, c4); }
function puntSs2() { ring(.5, .75, f165, c5); }
function puntSb2() { arcs3(.5, .75); }
function punts5C() { for (let a = 45; a <= 225; a += 45) dot(.75 + f166 * Math.cos(a * rad), .25 + f166 * Math.sin(a * rad), f1635, c5); }
function punts1NO() { dot(.25, .25, f166, c5); }
function punts1SE() { dot(.75, .75, f166, c5); }
function punts1CO() { dot(.5, .5, f16, c5); }
function punts4Q() { for (const [x, y] of [[.25, .25], [.75, .25], [.75, .75], [.25, .75]]) dot(x, y, f165, c5); }
function punts4D() { for (const [x, y] of [[.25, .5], [.75, .5], [.5, .25], [.5, .75]]) dot(x, y, f1635, c5); }
function punts3H() { for (const t of [.25, .5, .75]) dot(.25 + .5 * t, .5, f1635, c5); }
function punts3V() { for (const t of [.25, .5, .75]) dot(.5, .25 + .5 * t, f1635, c5); }
// Tres pétalos alrededor de un punto con el color de fondo encima (arcs3 +
// circle(c1) en el original).
function arcs3(x, y) {
  g.fillStyle = c5;
  for (let t = 0; t < 3; t++) {
    const a = t * ang * 2;
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, f16 / 2, a, a + ang); g.closePath(); g.fill();
  }
  dot(x, y, f165, c1);
}
function creu(col, t) { seg(.5 - t, .5 + t, .5 + t, .5 - t, col, .03); seg(.5 - t, .5 - t, .5 + t, .5 + t, col, .03); }
