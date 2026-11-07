// El fondo: un dibujo que se hace en directo. Unas puntas siguen un campo
// de flujo (un ruido suave que dice hacia dónde ir en cada punto y que va
// derivando con el tiempo), se ramifican y mueren; lo que dibujan se borra
// a los pocos segundos. Nunca está quieto, así que se ve que se genera.
//
// Cada página tiene su semilla (la portada, la vacía; cada proyecto, su
// slug): misma página, mismo campo; otra página, otro campo (más grande o
// más rizado, en curva o en ángulos rectos). El pie enseña la semilla y la
// iteración, y clicarlo vuelve a tirar los dados con la misma semilla.
// Al pasar el ratón o el dedo nacen puntas nuevas.
//
// El canvas no recibe clics (pointer-events: none): el botón derecho no
// ofrece «guardar imagen».

import { campo } from './campo.js';
import { icono, LADO, PAPEL, TINTA, RADIO } from './icono.js';

const canvas = document.querySelector('.fondo');
const g = canvas.getContext('2d');
const pie = document.querySelector('.seed');

const VIDA = 12000;       // ms que tarda un trazo en borrarse
let PUNTAS = 26;          // puntas vivas como mucho: según el tamaño de la pantalla
const MAX = 60000;        // trazos guardados como mucho (anillo)
const ALFA = .5;          // tinta como mucho: el texto se lee por encima
const TONOS = 10;         // escalones de opacidad: un path por escalón

let rnd = Math.random, c, rumbo;   // c: el carácter de la página; rumbo: su campo
let mini;                          // el icono de la pestaña (abajo)
let texto = '', iteracion = 0;
let puntas = [];
const trazos = new Float32Array(MAX * 5);   // x1 y1 x2 y2 t
let n = 0, cabeza = 0;
let w = 0, h = 0, tinta = '#111';

// El carácter sale de la semilla; la iteración solo cambia la tirada.
export function semilla(nuevo = '', otra = false) {
  nuevo ||= 'anna carreras';
  iteracion = otra && nuevo === texto ? iteracion + 1 : 1;
  texto = nuevo;
  ({ rnd, c, rumbo } = campo(texto, iteracion));
  puntas = [];
  mini = icono(texto, iteracion, performance.now());
  if (pie) pie.textContent = `seed ${texto} · iteration ${iteracion} · draw again`;
}

function nace(x, y, tope = PUNTAS) {
  if (puntas.length < tope) puntas.push({ x, y, edad: 0 });
}

function traza(x1, y1, x2, y2, t) {
  trazos.set([x1, y1, x2, y2, t], cabeza * 5);
  cabeza = (cabeza + 1) % MAX;
  n = Math.min(n + 1, MAX);
}

function avanza(t) {
  for (let i = puntas.length - 1; i >= 0; i--) {
    const p = puntas[i];
    const a = rumbo(p.x, p.y, t);
    const x = p.x + Math.cos(a) * c.paso, y = p.y + Math.sin(a) * c.paso;
    traza(p.x, p.y, x, y, t);
    p.x = x; p.y = y; p.edad++;
    // La rama nace un poco al lado: en el mismo punto seguiría el mismo camino.
    if (rnd() < c.rama) nace(x + Math.cos(a + Math.PI / 2) * 8, y + Math.sin(a + Math.PI / 2) * 8);
    const fuera = x < -40 || y < -40 || x > w + 40 || y > h + 40;
    if (fuera || p.edad > c.vida) puntas.splice(i, 1);
  }
  while (puntas.length < PUNTAS * .5) nace(rnd() * w, rnd() * h);
}

function dibuja(t) {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = tinta;
  g.lineWidth = c.grueso;
  g.lineCap = 'round';
  // Trazos agrupados por edad: un path por escalón de opacidad.
  const tonos = Array.from({ length: TONOS }, () => new Path2D());
  for (let k = 0; k < n; k++) {
    const o = k * 5, edad = (t - trazos[o + 4]) / VIDA;
    if (edad >= 1) continue;
    const p = tonos[edad * TONOS | 0];
    p.moveTo(trazos[o], trazos[o + 1]);
    p.lineTo(trazos[o + 2], trazos[o + 3]);
  }
  tonos.forEach((p, k) => { g.globalAlpha = ALFA * (1 - k / TONOS); g.stroke(p); });
  g.globalAlpha = 1;
}

function mide() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  w = innerWidth; h = innerHeight;
  PUNTAS = Math.max(16, Math.min(50, Math.round(w * h / 26000)));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  tinta = getComputedStyle(document.documentElement).getPropertyValue('--trazo').trim() || tinta;
}

mide();
addEventListener('resize', mide);
semilla();
pie?.addEventListener('click', () => semilla(texto, true));

// 30 pasos por segundo bastan para que se vea crecer, y gasta la mitad.
// Si los cuadros llegan tarde (móvil cansado), recupera hasta 4 pasos.
let antes = 0;
requestAnimationFrame(function bucle(t) {
  const pasos = Math.min(4, Math.floor((t - antes) / 33));
  if (pasos > 0) {
    antes = t;
    for (let i = 0; i < pasos; i++) avanza(t);
    dibuja(t);
  }
  requestAnimationFrame(bucle);
});
let ultimo = 0;
addEventListener('pointermove', (e) => {
  if (e.timeStamp - ultimo < 90) return;
  ultimo = e.timeStamp;
  nace(e.clientX, e.clientY, PUNTAS + 14);   // el cursor puede pasarse del tope
}, { passive: true });

// El icono de la pestaña, que se sigue dibujando con la pestaña de fondo, que
// es cuando se ve: setInterval, porque ahí requestAnimationFrame no corre (el
// navegador lo deja en una vez por segundo, e icono.js recupera los pasos).
// Safari no cambia el icono: enseña el quieto del build.
const ico = document.createElement('canvas');
ico.width = ico.height = LADO;
const ig = ico.getContext('2d');
let link = document.querySelector('link[rel="icon"]');
if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.append(link); }
setInterval(() => {
  const t = performance.now();
  mini.hasta(t);
  ig.clearRect(0, 0, LADO, LADO);
  ig.save();
  ig.beginPath(); ig.roundRect(0, 0, LADO, LADO, RADIO); ig.fillStyle = PAPEL; ig.fill(); ig.clip();
  ig.strokeStyle = TINTA; ig.lineWidth = mini.grueso; ig.lineCap = 'round';
  for (const tr of mini.trazos) {
    ig.globalAlpha = mini.alfa(tr, t);
    ig.beginPath(); ig.moveTo(tr[0], tr[1]); ig.lineTo(tr[2], tr[3]); ig.stroke();
  }
  ig.restore();
  link.type = 'image/png';
  link.href = ico.toDataURL('image/png');
}, 200);
