/* ============================================================
   build.mjs — data/ + work/ + index.html → dist/, la web tal cual se
   publica.        node build/build.mjs

   Cada página tiene su dirección de verdad (/, /about/, /contact/,
   /<slug>/) con su contenido escrito dentro (js/paginas.js, lo mismo que
   pinta la vista previa), su title, description, canonical y og:image. Al
   navegar, app.js cambia de página sin recargar: el dibujo del fondo sigue.

   Si algo está mal (una coma, un campo mal escrito, una foto que no está)
   para y dice qué, y no se publica nada: la web se queda como estaba.
   ============================================================ */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, numeros, pagina, RESERVADAS, slugs, visibles } from '../js/paginas.js';
import { leerJSON, validar } from '../js/validar.js';
import { icono } from '../js/icono.js';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT = join(ROOT, 'dist');
const at = (...p) => join(ROOT, ...p);
const fail = (msg) => { console.error(`\n✗ ${msg}\n\nNo se ha publicado nada: la web sigue como estaba.\n`); process.exit(1); };

/* ---------- leer y revisar ---------- */

const read = (rel) => {
  if (!existsSync(at(rel))) fail(`no encuentro ${rel}`);
  try { return leerJSON(readFileSync(at(rel), 'utf8'), rel); } catch (e) { fail(e.message); }
};
const schema = (t) => JSON.parse(readFileSync(at('schema', `${t}.json`), 'utf8'));
const site = read('data/site.json');
const about = read('data/about.json');
const errors = [...validar(site, schema('site'), 'data/site.json'), ...validar(about, schema('about'), 'data/about.json')];
const order = errors.length ? [] : slugs(site);   // todos, también los ocultos
const projects = {};
const used = {};   // la imagen quieta de cada número que se usa: "slug/3" → su .webp o su .poster.webp
const media = {};  // qué hay de cada número: { webp, webm, poster }
for (const slug of order) {
  const rel = `work/${slug}/project.json`;
  if (projects[slug]) { errors.push(`data/site.json: "${slug}" está dos veces en "lists"`); continue; }
  if (RESERVADAS.includes(slug)) { errors.push(`data/site.json: un proyecto no se puede llamar "${slug}" (es otra página de la web): cambia el nombre de su carpeta`); continue; }
  if (!existsSync(at(rel))) { errors.push(`data/site.json: "lists" dice "${slug}", y no hay ningún ${rel}`); continue; }
  const p = projects[slug] = read(rel);
  const before = errors.length;
  errors.push(...validar(p, schema('project'), rel));
  if (errors.length > before) continue;
  // una marca [[…]] mal escrita
  p.text.forEach((t, i) => {
    const m = typeof t === 'string' && /^\[\[([\s\S]+)\]\]$/.exec(t.trim());
    const head = m && m[1].split(' | ')[0].trim();
    if (m && !/^(video|youtube|vimeo|iframe):/.test(head) && !/^\d+( \d+)*$/.test(head))
      errors.push(`${rel}: "text" (el párrafo ${i + 1}): "${t}" no es una marca que entienda. Fotos o vídeos en bucle: [[3]] o [[3 4 5]]; un vídeo con sonido: [[video:5]]; [[youtube:ID | título]], [[vimeo:ID | título]]`);
  });
  // cada foto o vídeo que nombra, en su img/: N.webp, o N.webm de videoToWeb (con
  // su fotograma N.poster.webp, que solo hace falta si es la portada)
  const files = existsSync(at('work', slug, 'img')) ? readdirSync(at('work', slug, 'img')) : [];
  const has = (f) => files.includes(f);
  for (const { n, donde, video, portada } of numeros(p)) {
    const h = media[`${slug}/${n}`] = { webp: has(`${n}.webp`), webm: has(`${n}.webm`), poster: has(`${n}.poster.webp`) };
    const falta = (f) => `${rel}: ${donde} dice "${n}", y no hay ningún work/${slug}/img/${f}`;
    if (has(`${n}.mp4`) && !h.webm) errors.push(`${falta(`${n}.webm`)}: hay un ${n}.mp4, pásalo por videoToWeb (https://meowrhino.github.io/videoToWeb/), que da ${n}.webm y ${n}.poster.webp`);
    else if (video && !h.webm) errors.push(falta(`${n}.webm`));
    else if (!h.webp && !h.webm) errors.push(`${falta(`${n}.webp`)} (ni ${n}.webm, si es un vídeo)`);
    else if (portada && !h.webp && !h.poster) errors.push(`${rel}: "cover" es el vídeo ${n}.webm y le falta su fotograma work/${slug}/img/${n}.poster.webp: la portada y la imagen al compartir son una foto. Sale de videoToWeb, con «fotograma» marcado`);
    const quieta = h.webp ? `${n}.webp` : h.poster ? `${n}.poster.webp` : null;
    if (quieta) used[`${slug}/${n}`] = at('work', slug, 'img', quieta);
  }
}
if (errors.length) fail(errors.join('\n✗ '));
for (const d of readdirSync(at('work'))) {
  if (existsSync(at('work', d, 'project.json')) && !projects[d]) console.warn(`⚠ work/${d} no está en data/site.json → lists: no se publica`);
}

/* Dónde se publica, según dónde se construye (JAMstack, patrones §5): en la
   Action de GitHub (nuestra copia), meowrhino.github.io/<repo>/ y sin
   indexar; en cualquier otro sitio (Cloudflare, en la copia de Anna), la
   raíz con el dominio de site.json → "url", y se indexa si lo hay. */
const github = process.env.GITHUB_ACTIONS === 'true';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const BASE = github ? `/${repo}` : '';
const SITE = github ? `https://${owner}.github.io${BASE}` : String(site.url || '').replace(/\/+$/, '');
const INDEX = !github && !!site.url;

/* ---------- las fotos, con sharp: medidas y la imagen al compartir ---------- */

let sharp = null;
try { sharp = (await import('sharp')).default; } catch (e) {
  console.warn(`⚠ sin sharp (${e.code || e.message}): sin medidas de las fotos ni imagen al compartir. Se arregla con: npm ci`);
}
const sizes = {};
const ogs = new Map();
if (sharp) {
  for (const [key, file] of Object.entries(used)) {
    try {
      const m = await sharp(file).metadata();
      sizes[key] = [m.width, m.pageHeight || m.height];
    } catch (e) { console.warn(`⚠ ${file.slice(ROOT.length + 1)}: sharp no la puede leer (${e.message})`); }
  }
  for (const slug of order.filter((s) => projects[s].cover)) {
    const src = used[`${slug}/${projects[slug].cover}`];
    const cached = at('.cache', 'og', `${slug}.jpg`);
    try {
      if (!(existsSync(cached) && statSync(cached).mtimeMs >= statSync(src).mtimeMs)) {
        mkdirSync(dirname(cached), { recursive: true });
        await sharp(src).resize(1200, 630, { fit: 'cover' }).flatten({ background: '#efede8' }).jpeg({ quality: 85, mozjpeg: true }).toFile(cached);
      }
      ogs.set(slug, cached);
    } catch (e) { console.warn(`⚠ work/${slug}: no sale la imagen al compartir (${e.message})`); }
  }
}
const ogUrl = (slug) => !slug ? '' : ogs.has(slug) ? `${SITE}/og/${slug}.jpg` : used[`${slug}/${projects[slug].cover}`] ? `${SITE}/${used[`${slug}/${projects[slug].cover}`].slice(ROOT.length + 1)}` : '';

/* ---------- las páginas ---------- */

const datos = { site, about, projects, sizes, media };

/* ?v=<hash> a css/ y js/: tras publicar, nadie se queda con el CSS o el JS
   viejos junto al HTML nuevo (Pages los guarda 10 min, Cloudflare 1 h, por
   _headers). Uno para todos, porque los módulos se importan entre ellos. */
const hash = createHash('sha1');
for (const d of ['css', 'js']) for (const f of readdirSync(at(d)).sort()) hash.update(f).update(readFileSync(at(d, f)));
const V = `?v=${hash.digest('hex').slice(0, 8)}`;
const TEMPLATE = readFileSync(at('index.html'), 'utf8');
function swap(html, find, replace) {
  if (!find.test(html)) fail(`no encuentro ${find} en index.html: el build lo necesita para escribir las páginas.`);
  return html.replace(find, replace);
}
const cut = (s) => (s.length <= 160 ? s : s.slice(0, 157).trimEnd() + '…');

function page(ruta, { robots } = {}) {
  const p = pagina(ruta, datos);
  const url = `${SITE}/${ruta ? encodeURIComponent(ruta) + '/' : ''}`;
  const nav = p.page === 'about' || p.page === 'contact' ? p.page : 'work';
  let html = TEMPLATE;
  html = swap(html, /<html lang="en">/, '<html lang="en" data-built>');
  html = swap(html, /(<meta charset="utf-8">)/, `$1\n<base href="${BASE}/">`);
  html = swap(html, /(href="css\/style\.css)(")/, `$1${V}$2`);
  html = swap(html, /(src="js\/app\.js)(")/, `$1${V}$2`);
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`);
  for (const [re, v] of [
    [/(<meta name="description" content=")[^"]*(")/, cut(p.description)],
    [/(<meta name="robots" content=")[^"]*(")/, robots || (INDEX && !p.oculto ? 'index,follow' : 'noindex')],
    [/(<link rel="canonical" href=")[^"]*(")/, url],
    [/(<meta property="og:url" content=")[^"]*(")/, url],
    [/(<meta property="og:title" content=")[^"]*(")/, p.title],
    [/(<meta property="og:description" content=")[^"]*(")/, cut(p.description)],
    [/(<meta property="og:image" content=")[^"]*(")/, ogUrl(p.page === 'project' ? ruta : visibles(site).find((s) => projects[s].cover))],
    [/(<p class="site-tagline">)[^<]*(<)/, site.description],
  ]) html = swap(html, re, (_, a, b) => `${a}${esc(v)}${b}`);
  html = swap(html, new RegExp(`(data-nav="${nav}")`), '$1 aria-current="page"');
  html = swap(html, /<body>/, `<body data-page="${p.page}">`);
  return swap(html, /<main id="app"><\/main>/, () => `<main id="app">${p.html}</main>`);
}

/* ---------- escribir dist/ ---------- */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['css', 'js', 'fonts', '_headers']) cpSync(at(f), join(OUT, f), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
for (const f of readdirSync(join(OUT, 'js'))) {
  const js = join(OUT, 'js', f);
  writeFileSync(js, readFileSync(js, 'utf8').replace(/(from\s+'\.\/[\w-]+\.js)'/g, `$1${V}'`));
}
for (const slug of order) if (existsSync(at('work', slug, 'img'))) cpSync(at('work', slug, 'img'), join(OUT, 'work', slug, 'img'), { recursive: true, filter: (x) => !x.endsWith('.DS_Store') });
mkdirSync(join(OUT, 'og'), { recursive: true });
for (const [slug, cached] of ogs) cpSync(cached, join(OUT, 'og', `${slug}.jpg`));

const rutas = ['', 'about', 'contact', ...order];
for (const ruta of rutas) {
  mkdirSync(join(OUT, ruta), { recursive: true });
  writeFileSync(join(OUT, ruta, 'index.html'), page(ruta));
}
// una dirección que no existe: 404, con todos los proyectos para seguir
writeFileSync(join(OUT, '404.html'), page('', { robots: 'noindex' }));
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas.filter((r) => !order.includes(r) || visibles(site).includes(r)).map((r) => `  <url><loc>${SITE}/${r ? encodeURIComponent(r) + '/' : ''}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), INDEX ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(OUT, '.nojekyll'), '');
// El icono quieto, el de la portada (en la pestaña lo cambia fondo.js por el vivo)
const ico = icono('anna carreras', 1, 0).svg(0);
writeFileSync(join(OUT, 'favicon.svg'), ico);
if (sharp) await sharp(Buffer.from(ico), { density: 216 }).resize(180, 180).png().toFile(join(OUT, 'apple-touch-icon.png'))
  .catch((e) => console.warn(`⚠ sin apple-touch-icon.png (${e.message})`));

const ocultos = order.length - visibles(site).length;
console.log(`✓ dist/: work, about, contact y ${order.length} proyectos${ocultos ? ` (${ocultos} oculto${ocultos > 1 ? 's' : ''})` : ''}${INDEX ? ` · se indexa (${SITE})` : ' · sin indexar'}`);
