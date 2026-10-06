// El fondo: un dibujo que se hace en directo. Unas puntas avanzan, giran,
// se ramifican y mueren; lo que dibujan se va borrando a los pocos segundos.
// Nunca está quieto, así que se ve que se genera.
//
// Cada página tiene su semilla (la portada, la vacía; cada proyecto, su
// slug): misma página, mismo carácter de dibujo; otra página, otro carácter
// (cuánto gira, cuánto se ramifica, si va en ángulos rectos o en curva).
// Al pasar el ratón o el dedo nacen puntas nuevas.
//
// El canvas no recibe clics (pointer-events: none): el botón derecho no
// ofrece «guardar imagen». Con «reducir movimiento», un dibujo quieto.

const canvas = document.querySelector('.fondo');
const g = canvas.getContext('2d');
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VIDA = 12000;       // ms que tarda un trazo en borrarse
let PUNTAS = 26;          // puntas vivas como mucho: según el tamaño de la pantalla
const MAX = 60000;        // trazos guardados como mucho (anillo)
const ALFA = .6;          // tinta como mucho: el texto se lee por encima
const TONOS = 10;         // escalones de opacidad: un path por escalón

// mulberry32: azar determinista a partir de un entero.
const azar = (a) => () => {
  a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

let rnd = Math.random, c;          // c: el carácter de la página
let puntas = [];
const trazos = new Float32Array(MAX * 5);   // x1 y1 x2 y2 t
let n = 0, cabeza = 0;
let w = 0, h = 0, tinta = '#111';

// El carácter sale de la semilla.
export function semilla(texto = '') {
  rnd = azar(hash(texto || 'anna carreras'));
  c = {
    paso: 2 + rnd() * 2.5,                 // px por paso
    giro: .03 + rnd() * .12,               // cuánto se tuerce
    rama: .006 + rnd() * .03,              // probabilidad de ramificar por paso
    recto: rnd() < .4,                     // ángulos rectos (circuito) o curva libre
    vida: 120 + rnd() * 380,               // pasos que vive una punta
    grueso: .9 + rnd() * 1.4,
  };
  puntas = [];
  if (quieto) estatico();
}

function nace(x, y, a, tope = PUNTAS) {
  if (puntas.length >= tope) return;
  a ??= rnd() * Math.PI * 2;
  if (c.recto) a = Math.round(a / (Math.PI / 2)) * Math.PI / 2;   // circuito: solo en ejes
  puntas.push({ x, y, a, va: 0, edad: 0 });
}

function naceDondeSea() {
  // Desde un borde hacia dentro, o desde un punto cualquiera.
  if (rnd() < .5) return nace(rnd() * w, rnd() * h);
  const lado = rnd() * 4 | 0;
  const x = lado === 1 ? w : lado === 3 ? 0 : rnd() * w;
  const y = lado === 2 ? h : lado === 0 ? 0 : rnd() * h;
  nace(x, y, [Math.PI / 2, Math.PI, -Math.PI / 2, 0][lado] + (rnd() - .5));
}

function traza(x1, y1, x2, y2, t) {
  trazos.set([x1, y1, x2, y2, t], cabeza * 5);
  cabeza = (cabeza + 1) % MAX;
  n = Math.min(n + 1, MAX);
}

function avanza(t) {
  for (let i = puntas.length - 1; i >= 0; i--) {
    const p = puntas[i];
    if (c.recto) {
      // Giros de 90° de vez en cuando: como pistas de un circuito.
      if (rnd() < c.giro * .12) p.a += (rnd() < .5 ? 1 : -1) * Math.PI / 2;
    } else {
      p.va = p.va * .92 + (rnd() - .5) * c.giro;
      p.a += p.va;
    }
    const x = p.x + Math.cos(p.a) * c.paso, y = p.y + Math.sin(p.a) * c.paso;
    traza(p.x, p.y, x, y, t);
    p.x = x; p.y = y; p.edad++;
    if (rnd() < c.rama) nace(x, y, p.a + (rnd() < .5 ? 1 : -1) * (c.recto ? Math.PI / 2 : .5 + rnd() * .8));
    const fuera = x < -40 || y < -40 || x > w + 40 || y > h + 40;
    if (fuera || p.edad > c.vida) puntas.splice(i, 1);
  }
  while (puntas.length < PUNTAS * .5) naceDondeSea();
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

// Con «reducir movimiento»: unos cientos de pasos de golpe y nada más.
function estatico() {
  if (!w) return;
  n = cabeza = 0;
  const t = performance.now();
  for (let i = 0; i < 400; i++) avanza(t);
  dibuja(t);
}

function mide() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  w = innerWidth; h = innerHeight;
  PUNTAS = Math.max(16, Math.min(50, Math.round(w * h / 26000)));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  tinta = getComputedStyle(document.documentElement).getPropertyValue('--trazo').trim() || tinta;
  if (quieto) estatico();
}

mide();
addEventListener('resize', mide);
semilla();

if (!quieto) {
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
    nace(e.clientX, e.clientY, undefined, PUNTAS + 14);   // el cursor puede pasarse del tope
  }, { passive: true });
}
