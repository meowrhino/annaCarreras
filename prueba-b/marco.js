// Línea A: la web es un output. Cada visita saca un hash, como el
// tokenData.hash de Art Blocks, y de él sale el fondo: un campo de teselas de
// Truchet con su paleta, y el margen que deja alrededor de la hoja. La hoja
// (el contenido) es siempre la misma.
// ?seed=0x… reproduce una versión. Provisional: Anna puede cambiar draw() por
// un sketch suyo (p5 en modo instancia incluido) sin tocar lo demás.

const root = document.documentElement;
const canvas = document.querySelector('.marco');
const ctx = canvas.getContext('2d');
const seedLink = document.querySelector('.seed a');
const dark = matchMedia('(prefers-color-scheme: dark)');

const newHash = () => '0x' + [...crypto.getRandomValues(new Uint8Array(32))]
  .map(b => b.toString(16).padStart(2, '0')).join('');

// sfc32, el PRNG de siempre en Art Blocks.
function sfc32(a, b, c, d) {
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11; c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
}
const words = (hash) => hash.slice(2, 34).match(/.{8}/g).map(h => parseInt(h, 16));

// Todo lo que decide el hash, en un orden fijo para que ?seed= sea reproducible.
function traits(hash) {
  const R = sfc32(...words(hash));
  const pick = (xs) => xs[R() * xs.length | 0];
  const hue = R() * 360;
  return {
    hue,
    accentHue: (hue + 90 + R() * 180) % 360,
    chroma: .02 + R() * .05,
    frame: .02 + R() * .035,        // margen de la hoja, en fracción del lado corto
    scale: 1 + (R() * 3 | 0),       // tamaño de celda, en grosores de marco
    split: .25 + R() * .45,         // probabilidad de partir una celda en cuatro
    style: pick(['arcs', 'arcs', 'diagonals', 'triangles']),
    line: 1 + R() * 1.25,
  };
}

// Fondo y teselas en OKLCH. Oscuro o claro según el sistema, para que la
// hoja translúcida no cambie de tono de golpe.
function palette(t, isDark) {
  const hue = (h) => h.toFixed(1);
  return isDark
    ? { field: `oklch(22% ${t.chroma.toFixed(3)} ${hue(t.hue)})`, accent: `oklch(70% .14 ${hue(t.accentHue)})` }
    : { field: `oklch(90% ${t.chroma.toFixed(3)} ${hue(t.hue)})`, accent: `oklch(60% .17 ${hue(t.accentHue)})` };
}

let hash, t, colors;

function apply(h) {
  hash = h;
  t = traits(hash);
  colors = palette(t, dark.matches);
  for (const [k, v] of Object.entries(colors)) root.style.setProperty('--' + k, v);
  root.dataset.seed = hash; // la línea B lo usa para el primer output
  document.dispatchEvent(new CustomEvent('seed', { detail: hash }));
  seedLink.textContent = `seed ${hash.slice(0, 6)}…${hash.slice(-4)}, ${t.style}`;
  updateLink();
  draw();
}

const updateLink = () => { seedLink.href = '?seed=' + hash + location.hash; };

/* ---------- el marco ---------- */

// Un campo de teselas de Truchet detrás de la hoja. Cada celda tiene su
// propio PRNG (hash + posición), así que al redimensionar la esquina de
// arriba a la izquierda no cambia.
function draw() {
  const w = innerWidth, h = innerHeight, dpr = devicePixelRatio || 1;
  const B = Math.round(Math.min(Math.max(Math.min(w, h) * t.frame, 12), 56));
  root.style.setProperty('--frame', B + 'px');

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = colors.field;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = ctx.fillStyle = colors.accent;
  ctx.lineWidth = t.line;
  ctx.lineCap = 'round';

  const S = B * t.scale;
  const depth = Math.min(3, Math.floor(Math.log2(S / 6)));
  const W = words(hash);
  for (let i = 0; i * S < w; i++) {
    for (let j = 0; j * S < h; j++) {
      const x = i * S, y = j * S;
      const r = sfc32(W[0] ^ Math.imul(i + 1, 0x9e3779b1), W[1] ^ Math.imul(j + 1, 0x85ebca6b), W[2], W[3]);
      for (let k = 0; k < 8; k++) r();
      tile(x, y, S, r, depth);
    }
  }
}

function tile(x, y, s, r, depth) {
  if (depth > 0 && r() < t.split) {
    const h = s / 2;
    tile(x, y, h, r, depth - 1); tile(x + h, y, h, r, depth - 1);
    tile(x, y + h, h, r, depth - 1); tile(x + h, y + h, h, r, depth - 1);
    return;
  }
  const o = r() * 4 | 0;
  ctx.beginPath();
  if (t.style === 'arcs') {
    // Teselas de Smith: dos cuartos de círculo en esquinas opuestas.
    const q = (cx, cy, a) => {
      ctx.moveTo(cx + s / 2 * Math.cos(a), cy + s / 2 * Math.sin(a));
      ctx.arc(cx, cy, s / 2, a, a + Math.PI / 2);
    };
    if (o & 1) { q(x, y, 0); q(x + s, y + s, Math.PI); }
    else { q(x + s, y, Math.PI / 2); q(x, y + s, -Math.PI / 2); }
    ctx.stroke();
  } else if (t.style === 'diagonals') {
    if (o & 1) { ctx.moveTo(x, y); ctx.lineTo(x + s, y + s); }
    else { ctx.moveTo(x + s, y); ctx.lineTo(x, y + s); }
    ctx.stroke();
  } else {
    // Las de Truchet (1704): medio cuadrado relleno, cuatro orientaciones.
    const c = [[x, y], [x + s, y], [x + s, y + s], [x, y + s]].filter((_, k) => k !== o);
    ctx.moveTo(...c[0]); ctx.lineTo(...c[1]); ctx.lineTo(...c[2]);
    ctx.fill();
  }
}

/* ---------- arranque ---------- */

const fromUrl = new URLSearchParams(location.search).get('seed');
apply(/^0x[0-9a-f]{64}$/i.test(fromUrl) ? fromUrl.toLowerCase() : newHash());

document.querySelector('.seed button').addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.hash); // fuera el ?seed= viejo
  apply(newHash());
});

let raf = 0;
addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
addEventListener('hashchange', updateLink);
dark.addEventListener('change', () => apply(hash));
