// La navegación, encima del fondo. La web no recarga al hacer clic: el
// dibujo sigue y solo cambia la semilla (cada proyecto dibuja con su
// carácter), que es lo único que app.js le dice al fondo.
//
// En la web construida (<html data-built>) cada dirección es una página de
// verdad (/trossets/) con su contenido dentro: al hacer clic se pide esa
// página, se cambia el <main> y la dirección (pushState). Las de antes
// (#/trossets) llevan a la nueva.
//
// Sin data-built es la vista previa (Live Server, sin build): lee los JSON,
// los revisa con su esquema como el build, pinta con js/paginas.js (lo mismo
// que escribe el build) y navega por #/ruta. Lo que esté mal sale en pantalla.
import { semilla } from './fondo.js';
import { pagina } from './paginas.js';
import { leerJSON, validar } from './validar.js';

const BUILT = document.documentElement.hasAttribute('data-built');
const BASE = new URL('./', document.baseURI).href;
const app = document.getElementById('app');

// La ruta de una dirección: '' (work), 'about', 'trossets'… null si no es una página.
const rutaDe = (href) => {
  const u = new URL(href, BASE);
  if (u.origin !== location.origin || !u.href.startsWith(BASE)) return null;
  const r = u.pathname.slice(new URL(BASE).pathname.length).replace(/\/$/, '');
  return r.includes('/') || r.includes('.') ? null : decodeURIComponent(r);
};
const rutaHash = () => location.hash.replace(/^#\/?/, '').replace(/\/$/, '');

/* ---------- lo que se hace en cada página ---------- */

// El título se baraja: las letras pasan por caracteres al azar y se van
// recomponiendo de izquierda a derecha (~0,5 s). Atzar que acaba en el nombre.
const AZAR = 'abcdefghijklmnopqrstuvwxyz#/+*=<>';
const quieto = matchMedia('(prefers-reduced-motion: reduce)');

function baraja(node, texto) {
  if (quieto.matches) return;
  cancelAnimationFrame(node.baraja);
  const t0 = performance.now();
  const paso = (t) => {
    const hechas = Math.floor((t - t0) / 500 * texto.length);
    node.textContent = [...texto].map((c, i) =>
      i < hechas || c === ' ' ? c : AZAR[Math.random() * AZAR.length | 0]).join('');
    if (hechas < texto.length) node.baraja = requestAnimationFrame(paso);
  };
  node.baraja = requestAnimationFrame(paso);
}

function anima() {
  app.querySelectorAll('.work a').forEach((a) => {
    const name = a.querySelector('.name');
    const texto = name.textContent;
    a.addEventListener('pointerenter', () => baraja(name, texto));
    a.addEventListener('focus', () => baraja(name, texto));
  });
}

function marca(ruta, page) {
  semilla(ruta);
  document.body.dataset.page = page;
  const nav = page === 'about' || page === 'contact' ? page : 'work';
  document.querySelectorAll('[data-nav]').forEach((a) =>
    a.dataset.nav === nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
}

// El vídeo de arriba: la portada hasta que se clica, y entonces el reproductor.
app.addEventListener('click', (e) => {
  const box = e.target.closest('.hero.play');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'hero';
  const f = document.createElement('iframe');
  Object.assign(f, { src: box.dataset.video, title: box.getAttribute('aria-label').replace(/^Play /, ''), allow: 'autoplay; fullscreen', allowFullscreen: true });
  div.append(f);
  box.replaceWith(div);
});

/* ---------- la web construida: cada página, la suya ---------- */

let turno = 0;
async function ve(ruta, push) {
  const yo = ++turno;
  const url = BASE + (ruta ? encodeURIComponent(ruta) + '/' : '');
  try {
    const res = await fetch(url);
    if (!res.ok && res.status !== 404) throw new Error(res.status);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    if (yo !== turno) return;
    if (push) history.pushState(null, '', url);
    app.innerHTML = doc.getElementById('app').innerHTML;
    document.title = doc.title;
    marca(ruta, doc.body.dataset.page);
    anima();
    scrollTo(0, 0);
  } catch {
    location.href = url;   // sin red o algo raro: que cargue entera
  }
}

/* ---------- la vista previa: desde los JSON ---------- */

let datos;
async function lee() {
  const get = async (path, schema) => {
    const res = await fetch(BASE + path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`no encuentro ${path} (HTTP ${res.status})`);
    const d = leerJSON(await res.text(), path);
    const errors = validar(d, await (await fetch(BASE + `schema/${schema}.json`)).json(), path);
    if (errors.length) throw new Error(errors.join('\n✗ '));
    return d;
  };
  const [site, about] = await Promise.all([get('data/site.json', 'site'), get('data/about.json', 'about')]);
  const slugs = site.lists.work.projects;
  const projects = Object.fromEntries(await Promise.all(slugs.map(async (s) => [s, await get(`work/${s}/project.json`, 'project')])));
  return { site, about, projects };
}

async function pinta() {
  const ruta = rutaHash();
  try {
    datos ??= await lee();
    const p = pagina(ruta, datos);
    if (!p) throw new Error(`no hay ninguna página "${ruta}": ni about, ni contact, ni un proyecto de data/site.json → lists`);
    document.querySelector('.site-tagline').textContent = datos.site.description;
    app.innerHTML = p.html;
    document.title = p.title;
    marca(ruta, p.page);
    anima();
    // el navegador no ve el disco: una foto que no está se sabe al pedirla
    app.querySelectorAll('img, video').forEach((m) => {
      m.addEventListener('error', () => avisa(`no hay ningún ${m.getAttribute('src')}: revisa el número en work/${ruta}/project.json`), { once: true });
      m.loading = 'eager';
    });
  } catch (e) {
    avisa(e.message);
  }
  scrollTo(0, 0);
}

function avisa(msg) {
  let box = document.getElementById('errores');
  if (!box) {
    box = document.createElement('pre');
    box.id = 'errores';
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;margin:0;padding:2rem;overflow:auto;white-space:pre-wrap;background:#fff;color:#000;font:15px/1.5 monospace';
    box.textContent = 'esto no se publicaría:\n\n\narréglalo, guarda, y la página se recarga sola.\n';
    document.body.append(box);
  }
  box.firstChild.insertData(box.textContent.lastIndexOf('\narréglalo'), `✗ ${msg}\n`);
}

/* ---------- los clics ---------- */

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.target || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const ruta = rutaDe(a.href);
  if (ruta == null) return;
  e.preventDefault();
  if (BUILT) ve(ruta, true);
  else location.hash = '#/' + ruta;
});

if (BUILT) {
  const vieja = location.hash.startsWith('#/') && rutaHash();
  if (vieja !== false) location.replace(BASE + (vieja ? encodeURIComponent(vieja) + '/' : ''));
  addEventListener('popstate', () => ve(rutaDe(location.href) ?? '', false));
  semilla(rutaDe(location.href) ?? '');
  anima();
} else {
  addEventListener('hashchange', pinta);
  pinta();
}
