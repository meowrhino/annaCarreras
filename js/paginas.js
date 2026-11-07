// Las páginas: los datos (data/ y work/<slug>/project.json) → el HTML de
// cada una, como texto. No toca el DOM ni el disco: lo usan el build, que lo
// escribe en cada página de dist/, y la vista previa (app.js, sin build), que
// lo pinta. Así se ven igual.
//
// d = { site, about, projects: { slug: project.json }, sizes: { "slug/3": [w, h] } }
// (sizes solo en el build, que mide las fotos; en la vista previa no hay).

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const attrs = (a) => Object.entries(a).filter(([, v]) => v != null && v !== false)
  .map(([k, v]) => v === true ? ` ${k}=""` : ` ${k}="${esc(v)}"`).join('');

// El mini-markdown de los JSON: **negrita**, *cursiva*, [enlace](url) y un
// salto de línea dentro del párrafo. Un enlace a /slug va a su proyecto; los
// de fuera, en otra pestaña.
// La url puede llevar paréntesis (wiki/Algopolis_(en)).
const LINK = /\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;

export function md(s, slugs = new Set()) {
  return esc(s)
    .replace(LINK, (_, t, u) => {
      const slug = u.replace(/^\/|\/$/g, '');
      if (u.startsWith('/') && slugs.has(slug)) u = slug + '/';
      return `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    })
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// El texto sin marcas: para la description de Google y para leer el año del CV.
export const plain = (s) => s.replace(LINK, '$1').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

// lists.work.projects: "slug", o { "project": "slug", "visible": false }, que es
// un proyecto oculto: tiene su página (sin indexar) para mandarla en privado,
// y no sale en la portada, en el sitemap ni en el «newer · older».
export const slugs = (site) => site.lists.work.projects.map((x) => x.project ?? x);
export const visibles = (site) => site.lists.work.projects.filter((x) => x.visible !== false).map((x) => x.project ?? x);

const extLink = (url, text) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)} ↗</a>`;

const img = (d, slug, n, loading = 'lazy', alt = '') => {
  const [width, height] = d.sizes?.[`${slug}/${n}`] || [];
  return `<img${attrs({ src: `work/${slug}/img/${n}.webp`, alt, width, height, loading })}>`;
};

/* ---------- work: todos los proyectos ---------- */

// Portadas grandes, del más nuevo al más viejo, con el título y el año
// encima (v3ga). Apaisadas en ordenador, en vertical en el móvil.
function work(d) {
  return `<ul class="work">${visibles(d.site).map((slug, i) => {
    const p = d.projects[slug];
    const cover = p.cover ? img(d, slug, p.cover, i < 4 ? 'eager' : 'lazy') : '<span class="no-cover"></span>';
    return `<li><a href="${slug}/">${cover}<span class="label"><span class="name">${esc(p.title)}</span><span class="year">${p.year}</span></span></a></li>`;
  }).join('')}</ul>`;
}

/* ---------- proyecto: ficha + cuerpo + racó geek ---------- */

// Un párrafo de «text» que es una marca: [[3 4]], [[video:5]], [[youtube:ID | título]]…
const marca = (s) => {
  const m = typeof s === 'string' && /^\[\[([\s\S]+)\]\]$/.exec(s.trim());
  if (!m) return null;
  const [head, ...rest] = m[1].split(' | ');
  const [, kind, ref] = /^(youtube|vimeo|video|iframe):(.+)$/.exec(head.trim()) || [];
  return kind ? { kind, ref, title: rest.join(' | ') || null } : { kind: 'photos', nums: head.trim().split(/\s+/), caption: rest.join(' | ') || null };
};
const isVideo = (m) => m && (m.kind === 'youtube' || m.kind === 'vimeo');
const embedSrc = (m, auto) => m.kind === 'youtube'
  ? 'https://www.youtube-nocookie.com/embed/' + m.ref + (auto ? '?autoplay=1' : '')
  : 'https://player.vimeo.com/video/' + m.ref + (auto ? '?autoplay=1&dnt=1' : '');

// Cada párrafo → piezas: { kind: 'outputs' | 'tweets' | null, html }
function pieces(d, slug, item, slugs) {
  if (Array.isArray(item)) return [{ html: `<ul>${item.map((i) => `<li>${md(i, slugs)}</li>`).join('')}</ul>` }];
  if (typeof item === 'object') {
    const author = item.tweet.split('/')[3];
    const media = item.photos ? `<div class="tweet-media">${item.photos.map((n) => img(d, slug, n)).join('')}</div>` : '';
    const who = '@' + author + (item.date ? ' · ' + item.date : '');
    return [{ kind: 'tweets', html: `<blockquote class="tweet">${item.text ? `<p>${esc(item.text)}</p>` : ''}${media}<a class="src" href="${esc(item.tweet)}" target="_blank" rel="noopener">${esc(who)} ↗</a></blockquote>` }];
  }
  const m = marca(item);
  if (m?.kind === 'photos') return m.nums.map((n) => ({ kind: 'outputs', html: `<figure>${img(d, slug, n)}${m.caption ? `<figcaption>${md(m.caption, slugs)}</figcaption>` : ''}</figure>` }));
  if (m?.kind === 'video') return [{ html: `<video src="work/${slug}/img/${esc(m.ref)}.mp4" controls="" preload="metadata" playsinline=""></video>` }];
  if (isVideo(m)) return [{ html: `<figure class="embed"><iframe${attrs({ src: embedSrc(m), title: m.title || m.kind, loading: 'lazy', allowfullscreen: true })}></iframe>${m.title ? `<figcaption>${esc(m.title)}</figcaption>` : ''}</figure>` }];
  if (m?.kind === 'iframe') return [{ html: `<figure class="embed"><iframe src="${esc(m.ref)}" loading="lazy"></iframe></figure>` }];
  const h = /^(#{1,6}) /.exec(item);
  if (h) { const n = Math.min(Math.max(h[1].length, 2), 4); return [{ html: `<h${n}>${md(item.slice(h[0].length), slugs)}</h${n}>` }]; }
  if (item.startsWith('> ')) {
    const [q, ...cite] = item.slice(2).split('\n');
    return [{ html: `<blockquote><p>${md(q, slugs)}</p>${cite.length ? `<cite>${md(cite.join('\n'), slugs)}</cite>` : ''}</blockquote>` }];
  }
  return [{ html: `<p>${md(item, slugs)}</p>` }];
}

// Dos o más imágenes (o tuits) seguidos se agrupan en una rejilla de outputs.
function body(d, slug, items, slugs) {
  const all = items.flatMap((i) => pieces(d, slug, i, slugs));
  let out = '';
  for (let i = 0; i < all.length;) {
    const k = all[i].kind;
    let j = i + 1;
    while (k && j < all.length && all[j].kind === k) j++;
    const html = all.slice(i, j).map((x) => x.html).join('');
    out += k && j - i > 1 ? `<div class="${k}" data-n="${j - i}">${html}</div>` : html;
    i = j;
  }
  return `<div class="body">${out}</div>`;
}

function ficha(p, slugs) {
  let dl = '';
  const row = (dt, dd) => { dl += `<dt>${esc(dt)}</dt><dd>${dd}</dd>`; };
  const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  // un enlace solo, con su flecha; si lleva más texto, tal cual
  const link = (s) => { const m = new RegExp(`^${LINK.source}$`).exec(s); return m ? extLink(m[2], m[1]) : `<span>${md(s, slugs)}</span>`; };
  (p.credits || []).forEach((c) => row(c.role, `<span>${md(c.name, slugs)}</span>`));
  if (p.links?.length) row('Links', list(p.links.map(link)));
  if (p.exhibitions?.length) row('Exhibitions', list(p.exhibitions.map(esc)));
  if (p.press?.length) row('Press', list(p.press.map((s) => `<span>${md(s, slugs)}</span>`)));
  return dl && `<dl class="ficha">${dl}</dl>`;
}

// El «Racó geek» es como acaba cada proyecto en su tesis: cómo funciona el
// algoritmo, con números. Solo sale si el proyecto tiene texto en «geek».
const geek = (p, slugs) => p.geek?.length ? `<section class="geek"><h2>Racó geek</h2>${p.geek.map((g) => `<p>${md(g, slugs)}</p>`).join('')}</section>` : '';

// Arriba, lo importante: el primer vídeo, con la portada hasta que se clica
// (La Diegol); así no carga el reproductor sin que nadie lo pida. Sin
// vídeo, la portada sola. app.js cambia el botón por el reproductor.
function hero(d, slug, p, video) {
  const cover = p.cover ? img(d, slug, p.cover, 'eager', p.title) : '';
  if (!video) return cover && `<figure class="hero">${cover}</figure>`;
  return `<button${attrs({ type: 'button', class: 'hero play', 'aria-label': 'Play ' + (video.title || 'video'), 'data-video': embedSrc(video, true) })}>${cover}<span class="play-icon">▶</span></button>`;
}

function project(d, slug) {
  const p = d.projects[slug];
  const order = visibles(d.site);
  const todos = new Set(slugs(d.site));
  const video = p.text.find((t) => isVideo(marca(t)));
  const i = order.indexOf(slug);   // -1 si está oculto: sin «newer · older»
  const pager = (q, dir, cls) => q ? `<a href="${q}/" class="${cls}"><small>${dir}</small>${esc(d.projects[q].title)}</a>` : '';
  return `<article class="project">${hero(d, slug, p, video && marca(video))}`
    + `<header class="project-head"><h1>${esc(p.title)}</h1><p class="meta">${esc([p.year, (p.medium || []).join(', ')].join(' · '))}</p>${p.line ? `<p class="line">${esc(p.line)}</p>` : ''}</header>`
    + body(d, slug, p.text.filter((t) => t !== video), todos) + ficha(p, todos) + geek(p, todos)
    + `<nav class="pager">${i < 0 ? '' : pager(order[i - 1], '← Newer', 'newer')}<a class="back" href="./">All projects</a>${i < 0 ? '' : pager(order[i + 1], 'Older →', 'older')}</nav></article>`;
}

/* ---------- about y contact ---------- */

function about(d) {
  const a = d.about;
  const upcoming = a.upcoming?.length ? `<section class="upcoming"><h2>Upcoming</h2><ul>${a.upcoming.map((u) => `<li>${md(u)}</li>`).join('')}</ul></section>` : '';
  const bio = `<div class="bio">${a.bio.map((h) => `<p>${md(h)}</p>`).join('')}</div>`;
  const cv = a.cv.filter((s) => s.entries.length).map((s) => {
    // Si la línea empieza por el año, el año va en su columna (y se quita del texto).
    const years = s.entries.map((e) => /^(\d{4})/.exec(plain(e))?.[1] ?? null);
    const lis = s.entries.map((e, i) => {
      const y = years[i];
      const same = y != null && i > 0 && years[i - 1] === y;
      const text = y != null ? e.replace(new RegExp('^\\s*' + y + '[.,:]?\\s*'), '') : e;
      return `<li${same ? ' class="same-year"' : ''}><span class="year">${y ?? ''}</span><span>${md(text)}</span></li>`;
    }).join('');
    return `<h2>${esc(s.title)}</h2><ul>${lis}</ul>`;
  }).join('');
  // La firma del estudio: nuestra, en la plantilla y no en el JSON.
  return `<section class="about">${upcoming}${bio}<div class="cv">${cv}</div>`
    + '<p class="firma">web: <a href="https://meowrhino.studio" target="_blank" rel="noopener">meowrhino.studio</a></p></section>';
}

const contact = (d) => `<section class="contact"><ul>${Object.entries(d.site.social || {}).map(([label, url]) => `<li>${extLink(url, label)}</li>`).join('')}</ul></section>`;

/* ---------- las rutas ---------- */

// ruta: '' (work), 'about', 'contact' o el slug de un proyecto. null si no existe.
export function pagina(ruta, d) {
  const name = d.site.name;
  if (!ruta) return { page: 'work', title: name, description: d.site.description, html: work(d) };
  if (ruta === 'about') return { page: 'about', title: 'About — ' + name, description: plain(d.about.bio[0] || d.site.description), html: about(d) };
  if (ruta === 'contact') return { page: 'contact', title: 'Contact — ' + name, description: d.site.description, html: contact(d) };
  const p = slugs(d.site).includes(ruta) && d.projects[ruta];
  if (!p) return null;
  const first = p.text.find((t) => typeof t === 'string' && !marca(t) && !/^(#|> )/.test(t));
  return { page: 'project', title: p.title + ' — ' + name, description: p.description || plain(first || d.site.description), cover: p.cover, oculto: !visibles(d.site).includes(ruta), html: project(d, ruta) };
}

// Las que no son proyectos: un proyecto no se puede llamar así.
export const RESERVADAS = ['about', 'contact', 'work', 'data', 'js', 'css', 'fonts', 'og', 'schema', 'build', 'scripts', 'assets'];
