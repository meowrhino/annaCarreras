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
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, pagina, RESERVADAS, slugs, visibles } from '../js/paginas.js';
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
const used = {};   // las fotos que usa cada proyecto: "slug/3"
for (const slug of order) {
  const rel = `work/${slug}/project.json`;
  if (projects[slug]) { errors.push(`data/site.json: "${slug}" está dos veces en "lists"`); continue; }
  if (RESERVADAS.includes(slug)) { errors.push(`data/site.json: un proyecto no se puede llamar "${slug}" (es otra página de la web): cambia el nombre de su carpeta`); continue; }
  if (!existsSync(at(rel))) { errors.push(`data/site.json: "lists" dice "${slug}", y no hay ningún ${rel}`); continue; }
  const p = projects[slug] = read(rel);
  const before = errors.length;
  errors.push(...validar(p, schema('project'), rel));
  if (errors.length > before) continue;
  // cada foto o vídeo que nombra, en su img/
  const files = existsSync(at('work', slug, 'img')) ? readdirSync(at('work', slug, 'img')) : [];
  const need = (n, ext, donde) => {
    if (!files.includes(`${n}.${ext}`)) errors.push(`${rel}: ${donde} dice "${n}", y no hay ningún work/${slug}/img/${n}.${ext}`);
    else if (ext === 'webp') used[`${slug}/${n}`] = at('work', slug, 'img', `${n}.webp`);
  };
  if (p.cover) need(p.cover, 'webp', '"cover"');
  p.text.forEach((t, i) => {
    const donde = `"text" (el párrafo ${i + 1})`;
    if (typeof t === 'object' && !Array.isArray(t)) return (t.photos || []).forEach((n) => need(n, 'webp', donde));
    const m = typeof t === 'string' && /^\[\[([\s\S]+)\]\]$/.exec(t.trim());
    if (!m) return;
    const head = m[1].split(' | ')[0].trim();
    if (/^video:/.test(head)) need(head.slice(6), 'mp4', donde);
    else if (/^(youtube|vimeo|iframe):/.test(head)) return;
    else if (/^\d+( \d+)*$/.test(head)) head.split(' ').forEach((n) => need(n, 'webp', donde));
    else errors.push(`${rel}: ${donde}: "${t}" no es una marca que entienda. Fotos: [[3]] o [[3 4 5]]; vídeos: [[video:5]], [[youtube:ID | título]], [[vimeo:ID | título]]`);
  });
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
    } catch (e) { console.warn(`⚠ work/${key}.webp: sharp no la puede leer (${e.message})`); }
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
const ogUrl = (slug) => !slug ? '' : ogs.has(slug) ? `${SITE}/og/${slug}.jpg` : projects[slug].cover ? `${SITE}/work/${slug}/img/${projects[slug].cover}.webp` : '';

/* ---------- las páginas ---------- */

const datos = { site, about, projects, sizes };
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
