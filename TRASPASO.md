# Traspaso: la web a la cuenta de Anna

Se le pasa una copia del repositorio a su cuenta de GitHub, y la publica su
Cloudflare con su dominio. El de meowrhino se queda como está, de copia
nuestra en `meowrhino.github.io/annaCarreras/` (sin indexar). Desde el
traspaso son dos repositorios separados: los cambios, en el suyo.

Todo viaja dentro del repositorio: el código, los JSON, las fotos y cómo se
publica (`wrangler.jsonc`). En su copia la Action solo comprueba el build y,
si falla, abre un issue que le llega por correo; no publica en GitHub Pages
(eso lleva `if: github.repository_owner == 'meowrhino'`). Quien publica es
Cloudflare: el build, al no estar en GitHub, va a la raíz con el `url` de
`site.json`.

Tiempo: unos 20 minutos, más lo que tarden los DNS.

## Antes: lo que se pierde del WordPress

`annacarreras.com` es hoy su WordPress. Al llevar el dominio a la web nueva,
**todo lo que no esté en `work/` deja de existir**. Antes de tocar el DNS:

- [ ] Qué proyectos quiere: la web nueva tiene 13 de ~103 posts. Los que falten,
      `python3 scripts/scrape.py <slug…>` (README) y a `data/site.json` → `lists`.
- [ ] Los ficheros del WordPress a los que enlaza la web nueva, y que hay que
      traer (a `work/<slug>/`) o apuntar a otro sitio:
  - `tesi`: el PDF de la tesis, `/phd/TESI_art_generatiu_complexitat_Anna_Carreras.pdf`.
  - `trossets`: la página de las copias impresas, `/trossets-prints/`.
  - `about`: `/constelations/` (en el CV).
- [ ] Una copia del WordPress entero (exportación de *Herramientas → Exportar* y
      la carpeta `wp-content/uploads`), por si acaso.
- [ ] Las direcciones de los proyectos son las mismas (`/<slug>/`): las que ya
      circulan siguen valiendo para los que se traen.

## Antes

- [ ] `main` está al día y sin cambios a medias (`git status` limpio).
- [ ] Anna tiene cuenta de GitHub. Su usuario: `<su-usuario>`.
- [ ] Anna tiene cuenta de Cloudflare, y el dominio `annacarreras.com` (dónde
      está registrado y quién tiene acceso a sus DNS).

## 1. Su copia

- [ ] En su cuenta, **New repository** → `web`, público y vacío (sin README ni licencia).
- [ ] La copia va **sin historial** (la nuestra lleva los diseños descartados y las
      fotos en jpg de antes, ~70 MB). Desde esta carpeta:
      ```bash
      rm -rf /tmp/anna && mkdir /tmp/anna && git archive HEAD | tar -x -C /tmp/anna
      cd /tmp/anna && git init -b main && git add -A && git commit -m "La web de Anna Carreras"
      git push https://github.com/<su-usuario>/web.git main
      ```
      (si pide permiso, que nos añada antes como colaboradores, paso 3). Nada de `push --mirror`.

## 2. Cloudflare

- [ ] En su Cloudflare: **Workers & Pages → Create → Import a repository** → `<su-usuario>/web`.
      Lo demás lo lee de `wrangler.jsonc` (instala sharp con `npm install`, build `node build/build.mjs`, sale `dist/`).
- [ ] **Settings → Domains & Routes → Add → Custom domain**: `annacarreras.com` y `www.annacarreras.com`.
- [ ] En **su** repo, `data/site.json` → `"url": "https://www.annacarreras.com"`. Commit y push
      a su repo (no al de meowrhino). Con eso deja de llevar `noindex`.

## 3. Que nos deje entrar

- [ ] GitHub, en su repo: Settings → Collaborators → `meowrhino`, con **Write** (no hace falta admin).
- [ ] Cloudflare: Manage account → Members → nos invita. Ahí se ve el error entero de un build que falla.

## 4. Comprobar en su dominio

- [ ] La portada, un proyecto, `/about/` y `/contact/`; de un proyecto a otro sin que
      el dibujo del fondo se corte, y el botón de atrás.
- [ ] Un vídeo de arriba se reproduce al clicar (Vimeo o YouTube).
- [ ] Una dirección vieja con `#`: `annacarreras.com/#/trossets` lleva a `/trossets/`.
- [ ] `view-source:`: `canonical` y `og:url` con su dominio, y **sin** `<meta name="robots" content="noindex">`.
- [ ] `/robots.txt` dice `Allow` y `/sitemap.xml` tiene las direcciones de su dominio.
- [ ] Una que no existe (`/no-existe/`) da 404 y enseña los proyectos.
- [ ] Compartir un proyecto por WhatsApp: sale su foto (la og).
- [ ] En `/about/`, abajo, la firma `web: meowrhino.studio` con su enlace.

## 5. Search Console, con su cuenta de Google

- [ ] Dar de alta el dominio (el registro TXT, en el DNS de Cloudflare) y enviar `sitemap.xml`.
      Si ya lo tenía con el WordPress, solo enviar el sitemap nuevo.

## 6. Anna en su ordenador

Con ella delante, siguiendo [GUIA.md](GUIA.md) ("0. Abans de començar"):

- [ ] Clona **su** repositorio, no el de meowrhino, en una carpeta **fuera de Google Drive** (ni iCloud ni Dropbox).
      El repo ya lleva `.vscode/settings.json`: *Sync* pone sus commits encima de los nuestros sin preguntar.
- [ ] Live Server: **Open with Live Server** y ve la vista previa.
- [ ] Un cambio pequeño (una coma en el about), Commit → Sync, y la boleta verde en GitHub.
- [ ] El aviso: quitar una coma a propósito, subirlo, y que le llegue el correo de GitHub
      "La web no se ha publicado". Ponerla, subirlo, y que el issue se cierre solo. Si el correo
      no llega: en GitHub, Settings → Notifications, que tenga el correo marcado en *Watching*.

## 7. Al acabar

- [ ] Fila de annaCarreras en `JAMstack/inventario.md` con las dos direcciones (github.io y su dominio).
- [ ] La copia de meowrhino sigue en github.io con `noindex`: no compite en Google. Si molesta,
      Settings → Pages → **Unpublish site** (el repo se queda).
