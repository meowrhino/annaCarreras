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
// ofrece «guardar imagen». Con «reducir movimiento», un dibujo quieto.

const canvas = document.querySelector('.fondo');
const g = canvas.getContext('2d');
const pie = document.querySelector('.seed');
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

const VIDA = 12000;       // ms que tarda un trazo en borrarse
let PUNTAS = 26;          // puntas vivas como mucho: según el tamaño de la pantalla
const MAX = 60000;        // trazos guardados como mucho (anillo)
const ALFA = .5;          // tinta como mucho: el texto se lee por encima
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
let texto = '', iteracion = 0;
let puntas = [];
const trazos = new Float32Array(MAX * 5);   // x1 y1 x2 y2 t
let n = 0, cabeza = 0;
let w = 0, h = 0, tinta = '#111';

// Ruido de valor en 3D (x, y, tiempo), suave, a partir de una tabla barajada
// con la semilla. Entre 0 y 1.
const tabla = new Uint8Array(512);
const suave = (t) => t * t * (3 - 2 * t);
function ruido(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  const u = suave(x - X), v = suave(y - Y), s = suave(z - Z);
  const at = (i, j, k) => tabla[(tabla[(tabla[(X + i) & 255] + Y + j) & 255] + Z + k) & 255] / 255;
  const mezcla = (a, b, t) => a + (b - a) * t;
  const capa = (k) => mezcla(mezcla(at(0, 0, k), at(1, 0, k), u), mezcla(at(0, 1, k), at(1, 1, k), u), v);
  return mezcla(capa(0), capa(1), s);
}

// El carácter sale de la semilla; la iteración solo cambia la tirada.
export function semilla(nuevo = '', otra = false) {
  nuevo ||= 'anna carreras';
  iteracion = otra && nuevo === texto ? iteracion + 1 : 1;
  texto = nuevo;
  rnd = azar(hash(texto) + iteracion);
  for (let i = 0; i < 256; i++) tabla[i] = i;
  for (let i = 255; i > 0; i--) { const j = rnd() * (i + 1) | 0; [tabla[i], tabla[j]] = [tabla[j], tabla[i]]; }
  tabla.copyWithin(256, 0, 256);
  c = {
    paso: 1.6 + rnd() * 1.8,               // px por paso
    escala: 1 / (120 + rnd() * 320),       // tamaño de los remolinos, en px
    rizo: 1 + rnd() * 2.5,                 // cuánto gira el campo (vueltas)
    deriva: 1 / (40000 + rnd() * 80000),   // cuánto cambia el campo con el tiempo
    rama: .004 + rnd() * .02,              // probabilidad de ramificar por paso
    recto: rnd() < .35,                    // ángulos rectos (circuito) o curva libre
    vida: 150 + rnd() * 450,               // pasos que vive una punta
    grueso: .9 + rnd() * 1,
  };
  puntas = [];
  if (pie) pie.textContent = `seed ${texto} · iteration ${iteracion} · draw again`;
  if (quieto) estatico();
}

function nace(x, y, tope = PUNTAS) {
  if (puntas.length < tope) puntas.push({ x, y, edad: 0 });
}

function rumbo(x, y, t) {
  const a = (ruido(x * c.escala, y * c.escala, t * c.deriva) - .5) * Math.PI * 2 * c.rizo;
  return c.recto ? Math.round(a / (Math.PI / 2)) * Math.PI / 2 : a;
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
pie?.addEventListener('click', () => semilla(texto, true));

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
    nace(e.clientX, e.clientY, PUNTAS + 14);   // el cursor puede pasarse del tope
  }, { passive: true });
}
