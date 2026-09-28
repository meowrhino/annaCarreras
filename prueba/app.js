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
  n.append(...children.filter(c => c != null));
  return n;
};

// Slugs de WordPress (do_it_yourself) → texto (do it yourself)
const label = (slug) => slug.replace(/[_-]/g, ' ');

const img = (m, attrs = {}) => el('img', {
  src: url(m.src), alt: m.alt || '', width: m.width, height: m.height, loading: 'lazy', ...attrs,
});

// Los enlaces internos del contenido vienen como /slug: pasarlos a rutas hash.
function fixLinks(node, slugs) {
  node.querySelectorAll('a[href^="/"]').forEach(a => {
    const slug = a.getAttribute('href').replace(/^\/|\/$/g, '');
    if (slugs.has(slug)) a.href = '#/' + slug;
  });
  node.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  return node;
}

/* ---------- índice ---------- */

function renderIndex(index) {
  document.title = 'Anna Carreras';
  const years = index.map(p => p.year);
  const head = el('div', { class: 'index-head' },
    el('span', { text: 'Work' }),
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

/* ---------- proyecto ---------- */

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

function renderProject(p, index) {
  document.title = p.title + ' — Anna Carreras';
  const slugs = new Set(index.map(i => i.slug));

  const body = el('div', { class: 'body' }, ...p.blocks.map(renderBlock));

  const foot = el('footer', { class: 'project-foot' });
  if (p.credits.length) {
    const dl = el('dl');
    p.credits.forEach(c => {
      if (c.label) dl.append(el('dt', { text: c.label }), el('dd', { html: c.html }));
      else dl.append(el('dd', { html: c.html, style: 'grid-column: 1 / -1' }));
    });
    foot.append(dl);
  }
  if (p.tags.length) foot.append(el('p', { class: 'tags', text: p.tags.map(t => '#' + t.replace(/-/g, '_')).join(' ') }));

  // El índice va de más nuevo a más viejo.
  const i = index.findIndex(x => x.slug === p.slug);
  const pagerLink = (q, dir) => q && el('a', { href: '#/' + q.slug },
    el('small', { text: dir }), document.createTextNode(q.title));
  const pager = el('nav', { class: 'pager' },
    pagerLink(index[i + 1], '← Older'),
    pagerLink(index[i - 1], 'Newer →'));

  const article = el('article', { class: 'project' },
    el('a', { class: 'back', href: '#/', text: '← Index' }),
    el('header', { class: 'project-head' },
      el('p', { class: 'meta', text: [p.year, ...p.categories.map(label)].join(' · ') }),
      el('h1', { text: p.title })),
    body, foot, pager);

  app.replaceChildren(fixLinks(article, slugs));
}

/* ---------- about ---------- */

function renderAbout(a) {
  document.title = 'About — Anna Carreras';
  const bio = el('div', { class: 'bio' }, ...a.bio.map(h => el('p', { html: h })));
  const cv = el('div', { class: 'cv' });
  a.cv.forEach(s => {
    cv.append(el('h2', { text: s.title }));
    if (!s.entries.length) { cv.append(el('p', { class: 'empty', text: '—' })); return; }
    const ul = el('ul');
    s.entries.forEach((e, i) => {
      const same = e.year != null && i > 0 && s.entries[i - 1].year === e.year;
      // El html repite el año al principio; se quita porque ya va en su columna.
      const html = e.year != null ? e.html.replace(new RegExp('^\\s*' + e.year + '[.,:]?\\s*'), '') : e.html;
      ul.append(el('li', same ? { class: 'same-year' } : {},
        el('span', { class: 'year', text: e.year ?? '' }),
        el('span', { html })));
    });
    cv.append(ul);
  });
  app.replaceChildren(fixLinks(el('section', { class: 'about' }, bio, cv), new Set()));
}

/* ---------- rutas ---------- */

async function route() {
  const path = location.hash.replace(/^#\/?/, '');
  peek.classList.remove('on');
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.toggleAttribute('aria-current', a.dataset.nav === (path === 'about' ? 'about' : 'work')));
  try {
    const index = await get('content/projects/index.json');
    if (!path) renderIndex(index);
    else if (path === 'about') renderAbout(await get('content/about.json'));
    else renderProject(await get('content/projects/' + path + '.json'), index);
  } catch (e) {
    app.replaceChildren(el('p', { class: 'error', text: e.message }));
  }
  scrollTo(0, 0);
}

addEventListener('hashchange', route);
route();
