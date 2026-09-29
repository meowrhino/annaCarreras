// Los JSON viven en la raíz del repo y sus `src` son root-absolutos
// (/assets/...). Se resuelven contra la carpeta padre de esta página, así
// funciona igual en local que en GitHub Pages (/annaCarreras/). Una copia
// archivada fuera de este repo apunta a otro origen con <html data-content>.
const ROOT = new URL(document.documentElement.dataset.content || '..', location.href);
const url = (path) => new URL(path.replace(/^\//, ''), ROOT).href;

const app = document.getElementById('app');
const peek = document.querySelector('.peek');

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

/* ---------- work: la selección ---------- */

function renderWork(index, cur) {
  document.title = 'Anna Carreras';
  const bySlug = Object.fromEntries(index.map(p => [p.slug, p]));
  const years = index.map(p => p.year);

  const grid = el('ul', { class: 'selected' }, ...cur.selected.map(slug => {
    const p = bySlug[slug], c = cur.projects[slug] || {};
    return el('li', {}, el('a', { href: '#/' + slug },
      p.cover && img(p.cover, { class: 'cover' }),
      el('div', { class: 'card-head' },
        el('span', { class: 'name', text: nameOf(p, cur) }),
        el('span', { class: 'year', text: p.year })),
      el('div', { class: 'medium' }, ...mediumOf(p, cur).map(m => el('span', { text: m }))),
      c.line && el('p', { class: 'line', text: c.line })));
  }));

  const more = el('a', { class: 'to-archive', href: '#/archive' },
    el('span', { text: 'Archive' }),
    el('span', { text: `all ${index.length} projects, ${Math.min(...years)}–${Math.max(...years)} →` }));

  app.replaceChildren(el('section', { class: 'work' }, grid, more));
}

/* ---------- archive: el índice cronológico (línea 1) ---------- */

function renderArchive(index) {
  document.title = 'Archive — Anna Carreras';
  const years = index.map(p => p.year);
  const head = el('div', { class: 'index-head' },
    el('span', { text: 'Archive' }),
    el('span', { text: `${index.length} projects, ${Math.min(...years)}–${Math.max(...years)}` }),
  );
  const list = el('ul', { class: 'index' });
  index.forEach((p, i) => {
    const same = i > 0 && index[i - 1].year === p.year;
    const a = el('a', { href: '#/' + p.slug, 'data-cover': p.cover && url(p.cover.src) },
      el('span', { class: 'year', text: p.year }),
      el('span', { class: 'title', text: p.title }),
      el('span', { class: 'cats', text: p.categories.map(label).join(', ') }),
      el('span', { class: 'tags', text: p.tags.map(label).join(', ') }),
      p.cover && img(p.cover, { class: 'thumb' }),
    );
    list.append(el('li', same ? { class: 'same-year' } : {}, a));
  });
  app.replaceChildren(head, list);
  bindPeek(list);
}

// La portada sigue al cursor con un poco de retardo.
let target = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, raf = 0;

function bindPeek(list) {
  if (!matchMedia('(hover: hover)').matches) return;
  list.addEventListener('pointerover', e => {
    const a = e.target.closest('a[data-cover]');
    if (!a) return;
    if (peek.src !== a.dataset.cover) peek.src = a.dataset.cover;
    peek.classList.add('on');
  });
  list.addEventListener('pointerleave', () => peek.classList.remove('on'));
  list.addEventListener('pointermove', e => {
    target = { x: e.clientX, y: e.clientY };
    if (!peek.classList.contains('on')) pos = { ...target };
    if (!raf) raf = requestAnimationFrame(tick);
  });
}

function tick() {
  pos.x += (target.x - pos.x) * .18;
  pos.y += (target.y - pos.y) * .18;
  const w = peek.offsetWidth, h = peek.offsetHeight;
  // A la derecha del cursor; si no cabe, a la izquierda.
  let x = pos.x + 32;
  if (x + w > innerWidth - 16) x = pos.x - w - 32;
  const y = Math.min(Math.max(pos.y - h / 2, 16), innerHeight - h - 16);
  peek.style.transform = `translate(${x}px, ${y}px)`;
  raf = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > .5 ? requestAnimationFrame(tick) : 0;
}

/* ---------- proyecto: ficha + cuerpo ---------- */

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

  row('Year', document.createTextNode(p.year));
  row('Medium', document.createTextNode(mediumOf(p, cur).join(', ')));
  (c.facts || []).forEach(f => row(f.label, el('span', { html: f.html })));

  // Créditos con etiqueta van a la ficha; las líneas sueltas suelen ser prensa.
  const credits = p.credits.filter(x => x.label);
  const loose = p.credits.filter(x => !x.label);
  credits.forEach(x => row(x.label, el('span', { html: x.html })));

  if (c.links?.length) row('Links', list(c.links.map(l => extLink(l.url, l.label))));
  if (c.exhibitions?.length) row('Exhibitions', list(c.exhibitions.map(t => document.createTextNode(t))));
  const press = [...(c.press || []).map(l => extLink(l.url, l.label)), ...loose.map(x => el('span', { html: x.html }))];
  if (press.length) row('Press', list(press));
  return dl;
}

function renderProject(p, index, cur) {
  const name = nameOf(p, cur);
  document.title = name + ' — Anna Carreras';
  const slugs = new Set(index.map(i => i.slug));

  // Anterior/siguiente dentro de la selección si el proyecto está en ella;
  // si no, por el archivo (que va de más nuevo a más viejo).
  const inSel = cur.selected.includes(p.slug);
  const seq = inSel ? cur.selected.map(s => index.find(x => x.slug === s)) : index;
  const i = seq.findIndex(x => x.slug === p.slug);
  const pagerLink = (q, dir) => q && el('a', { href: '#/' + q.slug },
    el('small', { text: dir }), document.createTextNode(nameOf(q, cur)));
  const pager = el('nav', { class: 'pager' },
    pagerLink(seq[i - 1], '← Previous'),
    pagerLink(seq[i + 1], 'Next →'));

  const article = el('article', { class: 'project' },
    el('a', { class: 'back', href: inSel ? '#/' : '#/archive', text: inSel ? '← Work' : '← Archive' }),
    el('h1', { text: name }),
    renderFicha(p, cur),
    renderBody(p.blocks),
    pager);

  app.replaceChildren(fixLinks(article, slugs));
}

/* ---------- about y contact ---------- */

function renderAbout(a, cur) {
  document.title = 'About — Anna Carreras';
  const upcoming = cur.upcoming?.length && el('section', { class: 'upcoming' },
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

const PAGES = ['archive', 'about', 'contact'];

async function route() {
  const path = location.hash.replace(/^#\/?/, '');
  peek.classList.remove('on');
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.toggleAttribute('aria-current', a.dataset.nav === (PAGES.includes(path) ? path : 'work')));
  try {
    const [index, cur] = await Promise.all([get('content/projects/index.json'), get('content/curated.json')]);
    if (!path) renderWork(index, cur);
    else if (path === 'archive') renderArchive(index);
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
