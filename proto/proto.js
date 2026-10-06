// Helpers compartidos por los tres prototipos de diseño.
// Los JSON llevan `src` root-absolutos (/assets/...), así que hay que
// prefijarlos con la raíz del repo, que desde /proto/ cuelga un nivel arriba.
export const BASE = location.pathname.replace(/\/proto\/[^/]*$/, '');

export const asset = (src) => BASE + src;

export const get = (path) => fetch(BASE + '/' + path).then((r) => {
  if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
  return r.json();
});

export const el = (tag, html) => {
  const n = document.createElement(tag);
  if (html != null) n.innerHTML = html;
  return n;
};

// Siempre por año: las fechas de WordPress no son fiables en los proyectos
// antiguos (se importaron todos el mismo día).
export const byYear = (a, b) => b.year - a.year;

export const img = (src, alt) => {
  const n = new Image();
  n.src = asset(src);
  n.alt = alt || '';
  n.loading = 'lazy';
  n.decoding = 'async';
  return n;
};

function block(b) {
  switch (b.type) {
    case 'text':
      return el('p', b.html);
    case 'heading':
      return el('h' + b.level, b.html);
    case 'list': {
      const l = el(b.ordered ? 'ol' : 'ul');
      b.items.forEach((i) => l.append(el('li', i)));
      return l;
    }
    case 'image': {
      const f = el('figure');
      f.append(img(b.src, b.alt));
      if (b.caption) f.append(el('figcaption', b.caption));
      return f;
    }
    case 'video': {
      const f = el('figure');
      const v = document.createElement('video');
      v.src = asset(b.src);
      v.controls = true;
      v.preload = 'metadata';
      f.append(v);
      return f;
    }
    case 'quote': {
      const q = el('blockquote', b.html);
      if (b.cite) q.append(el('cite', b.cite));
      return q;
    }
    case 'embed': {
      if (b.provider === 'youtube' || b.provider === 'vimeo') {
        const f = el('figure');
        f.className = 'embed';
        const i = document.createElement('iframe');
        i.src = b.provider === 'youtube'
          ? 'https://www.youtube-nocookie.com/embed/' + b.id
          : 'https://player.vimeo.com/video/' + b.id;
        i.loading = 'lazy';
        i.allowFullscreen = true;
        i.title = b.title || b.provider;
        f.append(i);
        if (b.title) f.append(el('figcaption', b.title));
        return f;
      }
      // X/Twitter: el widget ya no carga, se pinta el texto como cita.
      const q = el('blockquote');
      q.className = 'tweet';
      if (b.text) q.append(el('p', b.text));
      q.append(el('cite', '<a href="' + b.url + '">' + b.url + '</a>'));
      return q;
    }
    default:
      return el('pre', JSON.stringify(b, null, 2));
  }
}

export function blocks(list) {
  const frag = document.createDocumentFragment();
  list.forEach((b) => frag.append(block(b)));
  return frag;
}

// Los `label` vienen de WordPress y algunos son null: esas líneas son
// continuación de la anterior, no un campo nuevo.
export function credits(list) {
  if (!list.length) return document.createDocumentFragment();
  const dl = el('dl');
  dl.className = 'credits';
  list.forEach((line) => {
    if (line.label) dl.append(el('dt', line.label));
    dl.append(el('dd', line.html));
  });
  return dl;
}

// ---------------------------------------------------------------- páginas ---
// El detalle y el about son iguales en los tres prototipos: lo que cambia es
// el listado y el CSS. Así se comparan las portadas, no tres implementaciones.

const wrapper = (...kids) => {
  const wrap = el('div');
  wrap.className = 'wrap';
  const back = el('a', '← index');
  back.className = 'back';
  back.href = '#/';
  wrap.append(back, ...kids);
  const outer = el('div');
  outer.className = 'detail';
  outer.append(wrap);
  return outer;
};

const meta = (html) => {
  const n = el('p', html);
  n.className = 'meta';
  return n;
};

export async function detailPage(slug) {
  const p = await get('content/projects/' + slug + '.json');
  document.title = p.title + ' — Anna Carreras';
  const kids = [
    el('h1', p.title),
    meta(p.year + ' · ' + p.categories.join(' / ') + (p.tags.length ? ' · ' + p.tags.join(' ') : '')),
  ];
  // El `summary` sale del excerpt de WordPress, que en la mayoría de proyectos
  // es el primer párrafo recortado: si se repite, no se pinta dos veces.
  const first = p.blocks.find((b) => b.type === 'text');
  const dup = first && p.summary && first.html.replace(/<[^>]+>/g, '').slice(0, 60) === p.summary.slice(0, 60);
  if (p.summary && !dup) {
    const lead = el('p', p.summary);
    lead.className = 'lead';
    kids.push(lead);
  }
  kids.push(blocks(p.blocks), credits(p.credits));
  return wrapper(...kids);
}

// Los 90 proyectos que aún no están scrapeados: solo portada, año y categorías.
export async function stubPage(slug, index) {
  const p = index.find((x) => x.slug === slug);
  if (!p) throw new Error('slug desconocido: ' + slug);
  document.title = p.title + ' — Anna Carreras';
  const kids = [
    el('h1', p.title),
    meta(p.year + (p.year_guessed ? ' (año por confirmar)' : '') + ' · ' + p.categories.join(' / ')),
    el('p', 'Sin scrapear todavía: de este proyecto solo tenemos portada, año y categorías. ' +
      '<a href="https://www.annacarreras.com/' + p.slug + '/">Ver el original</a>.'),
  ];
  kids[2].className = 'note';
  if (p.cover) {
    const f = el('figure');
    const i = new Image();
    i.src = p.cover.src;
    i.alt = '';
    f.append(i);
    kids.push(f);
  }
  return wrapper(...kids);
}

export async function aboutPage() {
  const a = await get('content/about.json');
  document.title = 'About — Anna Carreras';
  const kids = [el('h1', 'About')];
  a.bio.forEach((h) => kids.push(el('p', h)));
  a.cv.forEach((s) => {
    const h = el('h2', s.title);
    h.className = 'section';
    kids.push(h);
    if (!s.entries.length) {
      const e = el('p', '(vacío en el WordPress: lo tiene que rellenar Anna)');
      e.className = 'note';
      kids.push(e);
      return;
    }
    const ul = el('ul');
    ul.className = 'cv';
    s.entries.forEach((e) => ul.append(el('li', e.html)));
    kids.push(ul);
  });
  return wrapper(...kids);
}

// Rutas por hash: #/ listado, #/p/<slug> detalle, #/x/<slug> stub, #/about.
export function router(app, renderList) {
  let index = null;
  async function route() {
    const hash = location.hash.slice(1) || '/';
    const p = hash.match(/^\/p\/(.+)$/);
    const x = hash.match(/^\/x\/(.+)$/);
    try {
      index = index || await get('proto/density.json');
      const node = p ? await detailPage(p[1])
        : x ? await stubPage(x[1], index)
        : hash === '/about' ? await aboutPage()
        : await renderList(index);
      app.replaceChildren(node);
    } catch (e) {
      const err = el('p', e.message);
      err.className = 'note';
      app.replaceChildren(err);
    }
    scrollTo(0, 0);
    document.querySelectorAll('[data-nav] a').forEach((a) => {
      a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + hash);
    });
  }
  addEventListener('hashchange', route);
  route();
}
