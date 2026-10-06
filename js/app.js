// El contenido: lee los JSON de content/ y pinta cada ruta encima del fondo
// (#/, #/about, #/contact, #/<slug>). Lo único que le dice al fondo es la
// semilla: cada proyecto dibuja con su carácter.
//
// Los `src` de los JSON son root-absolutos (/assets/...). Se resuelven contra
// la carpeta de la página, así funciona igual en local que en GitHub Pages
// (/annaCarreras/). Una copia archivada fuera de este repo apunta a otro
// origen con <html data-content>.
import { semilla } from './fondo.js';

const ROOT = new URL(document.documentElement.dataset.content || '.', location.href);
const url = (path) => new URL(path.replace(/^\//, ''), ROOT).href;

const app = document.getElementById('app');

const cache = {};
const get = (path) => cache[path] ??= fetch(url(path)).then(r => {
  if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
  return r.json();
});

const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  n.append(...children.filter(c => c != null && c !== false));
  return n;
};

// Slugs de WordPress (do_it_yourself) → texto (do it yourself)
const label = (slug) => slug.replace(/[_-]/g, ' ');

const img = (m, attrs = {}) => el('img', {
  src: url(m.src), alt: m.alt || '', width: m.width, height: m.height, loading: 'lazy', ...attrs,
});

const extLink = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', text: text + ' ↗' });

// Los enlaces internos del contenido vienen como /slug: pasarlos a rutas hash.
function fixLinks(node, slugs) {
  node.querySelectorAll('a[href^="/"]').forEach(a => {
    const slug = a.getAttribute('href').replace(/^\/|\/$/g, '');
    if (slugs.has(slug)) a.href = '#/' + slug;
  });
  node.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  return node;
}

// Lo curado a mano (content/curated.json) manda sobre lo scrapeado.
const nameOf = (p, cur) => cur.projects[p.slug]?.name || p.title;
const mediumOf = (p, cur) => cur.projects[p.slug]?.medium || p.categories.map(label);

/* ---------- work: todos los proyectos ---------- */

// Portadas grandes, del más nuevo al más viejo, con el título y el año
// encima (v3ga). Apaisadas en ordenador, en vertical en el móvil.
function renderWork(index, cur) {
  document.title = 'Anna Carreras';
  app.replaceChildren(el('ul', { class: 'work' }, ...index.map((p, i) =>
    el('li', {}, el('a', { href: '#/' + p.slug },
      p.cover ? img(p.cover, { loading: i < 4 ? 'eager' : 'lazy' }) : el('span', { class: 'no-cover' }),
      el('span', { class: 'label' },
        el('span', { class: 'name', text: nameOf(p, cur) }),
        el('span', { class: 'year', text: p.year })))))));
}

/* ---------- proyecto: ficha + cuerpo + racó geek ---------- */

function renderBlock(b) {
  switch (b.type) {
    case 'text':    return el('p', { html: b.html });
    case 'heading': return el('h' + Math.min(Math.max(b.level, 2), 4), { html: b.html });
    case 'list':    return el(b.ordered ? 'ol' : 'ul', {}, ...b.items.map(i => el('li', { html: i })));
    case 'image':   return el('figure', {}, img(b), b.caption && el('figcaption', { html: b.caption }));
    case 'video':   return el('video', { src: url(b.src), controls: '', preload: 'metadata', playsinline: '' });
    case 'quote':
      return el('blockquote', {}, el('p', { html: b.html }), b.cite && el('cite', { html: b.cite }));
    case 'embed':
      if (b.provider === 'youtube' || b.provider === 'vimeo') {
        const src = b.provider === 'youtube'
          ? 'https://www.youtube-nocookie.com/embed/' + b.id
          : 'https://player.vimeo.com/video/' + b.id;
        return el('figure', { class: 'embed' },
          el('iframe', { src, title: b.title || b.provider, loading: 'lazy', allowfullscreen: '' }),
          b.title && el('figcaption', { text: b.title }));
      }
      if (b.provider === 'twitter') return renderTweet(b);
      return el('figure', { class: 'embed' }, el('iframe', { src: b.url, loading: 'lazy' }));
  }
  return null;
}

function renderTweet(b) {
  const media = b.media && el('div', { class: 'tweet-media' }, ...b.media.map(m => img(m)));
  const who = (b.author ? '@' + b.author : 'X') + (b.date ? ' · ' + b.date : '');
  return el('blockquote', { class: 'tweet' },
    b.text && el('p', { text: b.text }),
    media,
    el('a', { class: 'src', href: b.url, text: who + ' ↗' }));
}

// Dos o más imágenes (o tuits) seguidos se agrupan en una rejilla de outputs.
function renderBody(blocks) {
  const kind = (b) => b.type === 'image' ? 'outputs'
    : b.type === 'embed' && b.provider === 'twitter' ? 'tweets' : null;
  const out = [];
  for (let i = 0; i < blocks.length;) {
    const k = kind(blocks[i]);
    let j = i + 1;
    while (k && j < blocks.length && kind(blocks[j]) === k) j++;
    if (k && j - i > 1) out.push(el('div', { class: k, 'data-n': j - i }, ...blocks.slice(i, j).map(renderBlock)));
    else out.push(renderBlock(blocks[i]));
    i = j;
  }
  return el('div', { class: 'body' }, ...out);
}

function renderFicha(p, cur) {
  const c = cur.projects[p.slug] || {};
  const dl = el('dl', { class: 'ficha' });
  const row = (dt, ...dd) => dd.length && dl.append(el('dt', { text: dt }), el('dd', {}, ...dd));
  const list = (items) => el('ul', {}, ...items.map(i => el('li', {}, i)));

  (c.facts || []).forEach(f => row(f.label, el('span', { html: f.html })));

  // Créditos con etiqueta van a la ficha; las líneas sueltas suelen ser prensa.
  const credits = p.credits.filter(x => x.label);
  const loose = p.credits.filter(x => !x.label);
  credits.forEach(x => row(x.label, el('span', { html: x.html })));

  if (c.links?.length) row('Links', list(c.links.map(l => extLink(l.url, l.label))));
  if (c.exhibitions?.length) row('Exhibitions', list(c.exhibitions.map(t => document.createTextNode(t))));
  const press = [...(c.press || []).map(l => extLink(l.url, l.label)), ...loose.map(x => el('span', { html: x.html }))];
  if (press.length) row('Press', list(press));
  return dl.children.length ? dl : null;
}

// El «Racó geek» es como acaba cada proyecto en su tesis: cómo funciona el
// algoritmo, con números. Solo sale si hay texto en curated.json.
function renderGeek(c) {
  if (!c.geek?.length) return null;
  return el('section', { class: 'geek' },
    el('h2', { text: 'Racó geek' }),
    ...c.geek.map(h => el('p', { html: h })));
}

// Arriba, lo importante: el primer vídeo, con la portada hasta que se clica
// (La Diegol); así no carga el reproductor sin que nadie lo pida. Sin
// vídeo, la portada sola.
const isVideo = (b) => b.type === 'embed' && (b.provider === 'youtube' || b.provider === 'vimeo');

function renderHero(p, video) {
  if (!video) return p.cover && el('figure', { class: 'hero' }, img(p.cover, { loading: 'eager' }));
  const box = el('button', { type: 'button', class: 'hero play', 'aria-label': 'Play ' + (video.title || 'video') },
    p.cover && img(p.cover, { loading: 'eager' }), el('span', { class: 'play-icon', text: '▶' }));
  box.addEventListener('click', () => {
    const src = video.provider === 'youtube'
      ? 'https://www.youtube-nocookie.com/embed/' + video.id + '?autoplay=1'
      : 'https://player.vimeo.com/video/' + video.id + '?autoplay=1&dnt=1';
    box.replaceWith(el('div', { class: 'hero' },
      el('iframe', { src, title: video.title || video.provider, allow: 'autoplay; fullscreen', allowfullscreen: '' })));
  });
  return box;
}

function renderProject(p, index, cur) {
  const name = nameOf(p, cur);
  document.title = name + ' — Anna Carreras';
  const slugs = new Set(index.map(i => i.slug));

  const video = p.blocks.find(isVideo);
  const i = index.findIndex(x => x.slug === p.slug);
  const pagerLink = (q, dir, cls) => q && el('a', { href: '#/' + q.slug, class: cls },
    el('small', { text: dir }), document.createTextNode(nameOf(q, cur)));

  const article = el('article', { class: 'project' },
    renderHero(p, video),
    el('header', { class: 'project-head' },
      el('h1', { text: name }),
      el('p', { class: 'meta', text: [p.year, mediumOf(p, cur).join(', ')].join(' · ') }),
      cur.projects[p.slug]?.line && el('p', { class: 'line', text: cur.projects[p.slug].line })),
    renderBody(p.blocks.filter(b => b !== video)),
    renderFicha(p, cur),
    renderGeek(cur.projects[p.slug] || {}),
    el('nav', { class: 'pager' },
      pagerLink(index[i - 1], '← Newer', 'newer'),
      el('a', { class: 'back', href: '#/', text: 'All projects' }),
      pagerLink(index[i + 1], 'Older →', 'older')));

  app.replaceChildren(fixLinks(article, slugs));
}

/* ---------- about y contact ---------- */

function renderAbout(a, cur) {
  document.title = 'About — Anna Carreras';
  const upcoming = cur.upcoming?.length > 0 && el('section', { class: 'upcoming' },
    el('h2', { text: 'Upcoming' }),
    el('ul', {}, ...cur.upcoming.map(u => el('li', { html: u }))));
  const bio = el('div', { class: 'bio' }, ...a.bio.map(h => el('p', { html: h })));
  const cv = el('div', { class: 'cv' });
  a.cv.filter(s => s.entries.length).forEach(s => {
    const ul = el('ul');
    s.entries.forEach((e, i) => {
      const same = e.year != null && i > 0 && s.entries[i - 1].year === e.year;
      // El html repite el año al principio; se quita porque ya va en su columna.
      const html = e.year != null ? e.html.replace(new RegExp('^\\s*' + e.year + '[.,:]?\\s*'), '') : e.html;
      ul.append(el('li', same ? { class: 'same-year' } : {},
        el('span', { class: 'year', text: e.year ?? '' }),
        el('span', { html })));
    });
    cv.append(el('h2', { text: s.title }), ul);
  });
  app.replaceChildren(fixLinks(el('section', { class: 'about' }, upcoming, bio, cv), new Set()));
}

function renderContact(cur) {
  document.title = 'Contact — Anna Carreras';
  app.replaceChildren(el('section', { class: 'contact' },
    el('ul', {}, ...cur.contact.map(c => el('li', {}, extLink(c.url, c.label))))));
}

/* ---------- rutas ---------- */

const PAGES = ['about', 'contact'];

async function route() {
  const path = location.hash.replace(/^#\/?/, '');
  semilla(path);
  document.body.dataset.page = path ? (PAGES.includes(path) ? path : 'project') : 'work';
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.toggleAttribute('aria-current', a.dataset.nav === (PAGES.includes(path) ? path : 'work')));
  try {
    const [index, cur] = await Promise.all([get('content/projects/index.json'), get('content/curated.json')]);
    if (!path || path === 'archive') renderWork(index, cur);
    else if (path === 'about') renderAbout(await get('content/about.json'), cur);
    else if (path === 'contact') renderContact(cur);
    else renderProject(await get('content/projects/' + path + '.json'), index, cur);
  } catch (e) {
    app.replaceChildren(el('p', { class: 'error', text: e.message }));
  }
  scrollTo(0, 0);
}

addEventListener('hashchange', route);
route();
