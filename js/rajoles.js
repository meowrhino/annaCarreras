// Rajoles: la web es una rejilla de Trossets. Este módulo lo une todo:
//   - el estado (día, llavor, paleta), que vive en la URL;
//   - los colores de la hoja, que salen de la paleta;
//   - la geometría: la hoja ocupa celdas enteras de la rejilla;
//   - los mandos del pie.
// El dibujo está en fondo.js y los bloques de Anna en trossets.js.
//
// URL: ?dia=AAAA-MM-DD (otro día), ?llavor=… (otra combinación), ?paleta=Paella.

import { PALETTES, NAMES, rasgos } from './trossets.js';
import { mulberry32, hashTexto } from './azar.js';
import * as fondo from './fondo.js';

const root = document.documentElement;

/* ---------- estado ---------- */

const esDia = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !isNaN(Date.parse(d));
const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const params = new URLSearchParams(location.search);
const estado = {
  dia: esDia(params.get('dia')) ? params.get('dia') : hoy,
  llavor: params.get('llavor') || null,
  paleta: PALETTES[params.get('paleta')] ? params.get('paleta') : null,   // null: la del día
};

function url() {
  const q = new URLSearchParams();
  if (estado.dia !== hoy) q.set('dia', estado.dia);
  if (estado.llavor) q.set('llavor', estado.llavor);
  if (estado.paleta) q.set('paleta', estado.paleta);
  return q.size ? '?' + q : location.pathname;
}

let r;                                   // los rasgos de la semilla actual
const paleta = () => estado.paleta || r.paleta;

/* ---------- colores de la hoja ---------- */

// Tinta: el color de la paleta que más contrasta con el fondo; si ninguno
// llega a 4.5:1 (WCAG AA), negro o blanco.
const luminancia = (hex) => {
  const [R, G, B] = hex.match(/\w\w/g).map(h => parseInt(h, 16) / 255)
    .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * R + .7152 * G + .0722 * B;
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + .05) / (y + .05);
};

function colores(P) {
  const [fondoColor, ...resto] = P;
  let tinta = resto.reduce((mejor, c) => contraste(c, fondoColor) > contraste(mejor, fondoColor) ? c : mejor);
  if (contraste(tinta, fondoColor) < 4.5) {
    tinta = contraste('#000000', fondoColor) > contraste('#ffffff', fondoColor) ? '#000000' : '#ffffff';
  }
  root.style.setProperty('--paper', fondoColor);
  root.style.setProperty('--ink', tinta);
  root.style.setProperty('--accent', P[4] === fondoColor ? P[2] : P[4]);
}

/* ---------- geometría: la hoja en la rejilla ---------- */

// 12 columnas en móvil y escritorio, 9 en tableta, como las rejillas de
// Trossets. La hoja va centrada, lo más ancha que quepa en ~1040 px, con un
// número de celdas de la misma paridad que las columnas.
const hoja = document.querySelector('.hoja');
const contenido = hoja.firstElementChild;
let cols, s, n;

function mide() {
  const w = root.clientWidth;
  cols = w < 600 || w >= 1100 ? 12 : 9;
  s = w / cols;
  const anchos = cols === 12 ? [10, 8, 6] : [7, 5];
  n = anchos.find(k => k * s <= 1040) ?? anchos.at(-1);
  root.style.setProperty('--s', s + 'px');
  root.style.setProperty('--n', n);
  root.style.setProperty('--m', (cols - n) / 2);
  ajustaHoja();
}

// El alto de la hoja se redondea a celdas enteras; el fondo sabe qué celdas
// tapa para no animarlas.
function ajustaHoja() {
  const filas = Math.ceil(contenido.offsetHeight / s);
  hoja.style.height = filas * s + 'px';
  const m = (cols - n) / 2;
  fondo.rejilla({ cols, s, hueco: { x0: m, x1: m + n, y0: 1, y1: 1 + filas } });
}

/* ---------- el pie: día, paleta y otra combinación ---------- */

const pie = {
  dia: document.querySelector('.dia'),
  antes: document.querySelector('.prev'),
  despues: document.querySelector('.next'),
  paleta: document.querySelector('.paleta'),
  otra: document.querySelector('.otra'),
  paletas: document.querySelector('.paletas'),
};

// Cinco franjas con los colores de una paleta.
function muestra(nombre) {
  const m = document.createElement('span');
  m.className = 'muestra';
  m.append(...PALETTES[nombre].map(c => Object.assign(document.createElement('i'), { style: `background:${c}` })));
  return m;
}

// Un botón por paleta; el primero («del día») vuelve a la que toca por fecha.
pie.paletas.append(...[null, ...NAMES].map(nombre => {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.nombre = nombre || '';
  b.append(muestra(nombre || NAMES[0]), nombre || 'del día');
  b.addEventListener('click', () => {
    estado.paleta = nombre;
    abrePaletas(false);
    actualiza({ soloPaleta: true });
  });
  return b;
}));

function abrePaletas(abrir) {
  pie.paletas.hidden = !abrir;
  pie.paleta.setAttribute('aria-expanded', String(abrir));
}
pie.paleta.addEventListener('click', () => abrePaletas(pie.paletas.hidden));

const mueveDia = (dias) => () => {
  estado.llavor = null;
  estado.dia = new Date(Date.parse(estado.dia) + dias * 864e5).toISOString().slice(0, 10);
  actualiza();
};
pie.antes.addEventListener('click', mueveDia(-1));
pie.despues.addEventListener('click', mueveDia(1));

// Otra combinación con la paleta que se está viendo.
pie.otra.addEventListener('click', () => {
  estado.paleta = paleta();
  estado.llavor = Math.random().toString(16).slice(2, 8);
  actualiza();
});

/* ---------- aplicar el estado ---------- */

// Recalcula lo que haga falta, reescribe la URL (sin tocar la ruta #/…) y
// actualiza el pie. Con soloPaleta, las rajoles no cambian.
function actualiza({ soloPaleta = false, primera = false } = {}) {
  if (!soloPaleta) {
    const semilla = hashTexto(estado.llavor || estado.dia);
    r = rasgos(mulberry32(semilla));
    fondo.configura(semilla, PALETTES[paleta()], r);
  } else fondo.cambiaPaleta(PALETTES[paleta()]);
  colores(PALETTES[paleta()]);

  const q = url();
  history.replaceState(history.state, '', q + location.hash);
  pie.dia.href = q;
  pie.dia.textContent = estado.llavor ? 'llavor ' + estado.llavor : estado.dia.split('-').reverse().join('.');
  pie.paleta.textContent = 'paleta ' + paleta();
  pie.paletas.querySelector('[data-nombre=""] .muestra').replaceWith(muestra(r.paleta));
  for (const b of pie.paletas.children) b.setAttribute('aria-pressed', String(b.dataset.nombre === (estado.paleta || '')));

  if (!primera && !soloPaleta) fondo.revela(500);
}

/* ---------- arranque ---------- */

actualiza({ primera: true });
mide();
new ResizeObserver(ajustaHoja).observe(contenido);
addEventListener('resize', mide);
addEventListener('scroll', fondo.pide, { passive: true });

// Primero el fondo, rajola a rajola; luego se asienta la hoja.
fondo.revela(900).then(() => hoja.classList.add('on'));
