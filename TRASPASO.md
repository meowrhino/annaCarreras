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

## 0. Pre-traspaso: una reunión antes, solo en esta web

Anna ya tiene web (su WordPress en `annacarreras.com`) y al llevar el dominio a la
nueva **todo lo que no esté en `work/` deja de existir**. Por eso, antes del traspaso,
una reunión para decidir esto. Lo que hay que llevar:

**Lo que se pierde del WordPress** (hoy la web nueva enlaza ahí):
- [ ] **El PDF de la tesi** (`tesi`, "tesi pdf paper"): `/phd/TESI_art_generatiu_complexitat_Anna_Carreras.pdf`.
      ¿Lo traemos a `work/tesi/` (un enlace a `work/tesi/tesi.pdf`), o lo sube a otro sitio (su
      universidad, TDX)? Mirar cuánto pesa: más de 25 MiB no cabe en Cloudflare.
- [ ] **Trossets prints** (`trossets`, "purchase" y "order your print here"): `/trossets-prints/`.
      ¿Sigue vendiendo las copias? ¿Adónde lleva el enlace: una tienda, su correo, nada?
- [ ] **Constelations** (en el CV, `data/about.json`): `/constelations/`. Además el enlace está
      vacío (`[ ](…)`, sin texto: no se ve). ¿Se trae como proyecto, se enlaza a otra cosa o se quita?
- [ ] **Qué proyectos más quiere**: la web nueva tiene 13 de ~103 posts. Que traiga la lista
      (los slugs del WordPress); se traen con `python3 scripts/scrape.py <slug…>` (README).
- [ ] **Una copia del WordPress entero**, por si acaso: *Herramientas → Exportar* y la carpeta
      `wp-content/uploads` (que la baje ella o quien le lleve el hosting).

**El dominio y el correo**:
- [ ] **¿Dónde está registrado `annacarreras.com` y quién tiene acceso** a sus DNS?
- [ ] **El correo `hola@annacarreras.com`** (sale en My City My Playground): ¿va con el dominio?
      Al pasar los DNS a Cloudflare hay que copiar los registros **MX** (y SPF/DKIM) tal cual,
      o se queda sin correo. Que diga quién le da el correo (el hosting del WordPress, Google…).

**Para el día del traspaso**:
- [ ] Que se haga **cuenta de GitHub** y nos pase el usuario, y **cuenta de Cloudflare**.
- [ ] El **correo de su cuenta de GitHub** (para `git config`, paso 6).
- [ ] Que traiga un ordenador con **VS Code** y **git** (`git --version` en el Terminal). Si no,
      mejor instalado antes: git en Mac, `xcode-select --install`; en Windows,
      `winget install --id Git.Git -e`.
- [ ] Enseñarle la web (`meowrhino.github.io/annaCarreras/`) y el **proyecto oculto**: una página
      que puede mandar en privado sin que salga en la portada ni en Google.

Las direcciones de los proyectos son las del WordPress (`/<slug>/`): las que ya circulan
siguen valiendo para los que se traen.

## Antes

- [ ] Lo del pre-traspaso (paso 0), decidido y hecho en `main`.
- [ ] `main` está al día y sin cambios a medias (`git status` limpio).
- [ ] Anna tiene cuenta de GitHub. Su usuario: `<su-usuario>`.
- [ ] Anna tiene cuenta de Cloudflare, y el dominio `annacarreras.com` (dónde
      está registrado y quién tiene acceso a sus DNS).

## 1. Su copia

- [ ] En su cuenta, **New repository** → `annacarreras`, público y vacío (sin README ni licencia).
      El mismo nombre que el Worker (`name` de `wrangler.jsonc`): Cloudflare llama al proyecto
      como el repo, y si no coinciden el deploy falla (oriol, 2026-10-30).
- [ ] La copia va **sin historial** (la nuestra lleva los diseños descartados y las
      fotos en jpg de antes, ~70 MB). Desde esta carpeta:
      ```bash
      rm -rf /tmp/anna && mkdir /tmp/anna && git archive HEAD | tar -x -C /tmp/anna
      cd /tmp/anna && rm -r CLAUDE.md TRASPASO.md manus
      git init -b main && git add -A && git commit -m "La web de Anna Carreras"
      git push https://github.com/<su-usuario>/annacarreras.git main
      ```
      (si pide permiso, que nos añada antes como colaboradores, paso 3). Nada de `push --mirror`.
- [ ] En su copia no van `CLAUDE.md`, `TRASPASO.md` ni `manus/` (las notas del diseño): son nuestros y se quedan
      en el repo de meowrhino. El README los nombra sin enlazarlos.

## 2. Cloudflare

- [ ] En su Cloudflare: **Workers & Pages → Create → Import a repository** → `<su-usuario>/annacarreras`.
      *Project name*: `annacarreras` (si pone otro, se cambia `name` en `wrangler.jsonc` de su copia antes del deploy).
      Lo demás lo lee de `wrangler.jsonc` (instala sharp con `npm install`, build `node build/build.mjs`, sale `dist/`).
- [ ] Mirar el primer build entero. Workers Builds no lee `engines` de `package.json`: si
      falla por la versión de Node, **Settings → Build → Variables** → `NODE_VERSION` = `22`.
- [ ] Si `annacarreras.com` no está aún en su Cloudflare: **Add a site**, y antes de cambiar los
      nameservers en el registrador, comprobar que Cloudflare ha importado los **MX** (y SPF/DKIM)
      del correo (paso 0). Si falta alguno, se copia a mano del DNS de ahora.
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
- [ ] Su nombre y su correo para git, antes del primer Commit (si no, VS Code se para con
      "configure your user.name and user.email"). En la terminal de VS Code **de su ordenador**:
      `git config --global user.name "Anna Carreras"` y `git config --global user.email "<su correo de GitHub>"`
      (o el noreply, `<id>+<usuario>@users.noreply.github.com`; el id: `gh api users/<usuario> --jq .id`).
- [ ] Live Server: **Open with Live Server** y ve la vista previa.
- [ ] Un cambio pequeño (una coma en el about), Commit → Sync, y la boleta verde en GitHub.
- [ ] El aviso: quitar una coma a propósito, subirlo, y que le llegue el correo de GitHub
      "La web no se ha publicado". Ponerla, subirlo, y que el issue se cierre solo. Si el correo
      no llega: en GitHub, Settings → Notifications, que tenga el correo marcado en *Watching*.

## 7. Al acabar

- [ ] Fila de annaCarreras en `JAMstack/inventario.md` con las dos direcciones (github.io y su dominio).
- [ ] La copia de meowrhino sigue en github.io con `noindex`: no compite en Google. Si molesta,
      Settings → Pages → **Unpublish site** (el repo se queda).
