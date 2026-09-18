# annacarreras.com — contenido para JAMstack

Contenido extraído de la web actual (WordPress) a JSON plano + assets locales.
Sin estilos, sin markup de tema: solo datos listos para montar el front encima.

```
content/
  site.json                 datos globales del sitio
  about.json                bio + CV
  projects/
    index.json              listado ligero para el grid
    <slug>.json             un fichero por proyecto
assets/
  projects/<slug>/…         imágenes y vídeos a resolución original
scripts/
  scrape.py                 regenera todo lo anterior
```

Los `src` de los JSON son rutas root-absolutas (`/assets/projects/...`), así que
basta con servir `assets/` desde la raíz pública (en Astro/Next: mover o
enlazar la carpeta dentro de `public/`).

**Ojo con el base path:** si el sitio no cuelga de la raíz del dominio —como en
GitHub Pages, que sirve desde `/annaCarreras/`— hay que prefijar esos `src`. En
Astro es `import.meta.env.BASE_URL`; en Next, `basePath`. El visor lo hace a
mano en `index.html`.

## Visor de contenido

`index.html` es una página única, con rutas por hash, para revisar de un vistazo
que el scraping salió bien: grid de proyectos, detalle con todos los tipos de
bloque y el about.

<https://meowrhino.github.io/annaCarreras/>

No es el diseño del sitio ni pretende serlo: lleva el CSS mínimo para poder
leer. Cuando montemos el front encima, este fichero se sustituye (y conviene
cambiar el origen de Pages a GitHub Actions para servir el build).

Para verlo en local, desde la raíz del repo:

```bash
python3 -m http.server 8765
```

## Regenerar

```bash
python3 scripts/scrape.py
```

Solo stdlib, sin dependencias. `--no-assets` salta las descargas y regenera
únicamente los JSON. Es idempotente: los ficheros ya descargados no se vuelven
a bajar. Para añadir proyectos, añade su slug a la lista `SLUGS` de
`scripts/scrape.py`.

## Esquema

### `content/projects/<slug>.json`

```jsonc
{
  "slug": "trossets",
  "title": "“Trossets” at ArtBlocks curated",  // sin el {año} del título original
  "year": 2021,
  "date": "2021-10-21",                        // fecha de publicación en WP
  "summary": "…",                              // texto plano, para listados y <meta>
  "categories": ["generative"],                // slugs de categoría de WP
  "tags": ["generative", "long-form"],         // slugs de etiqueta de WP
  "cover": { "src": "…", "width": 900, "height": 506, "alt": "" },
  "blocks": [ /* ver abajo */ ],
  "credits": [ { "label": "Client", "html": "Warner Music, Samsung." } ],
  "source": "https://www.annacarreras.com/trossets/"
}
```

`year` sale del `{YYYY}` del título y, si no lo hay, del año más antiguo que
aparezca en los créditos; `date` es la fecha del post en WordPress y en los
proyectos antiguos no es fiable (se importaron todos el mismo día). **Ordena
siempre por `year`.**

En `credits`, `label` es la parte anterior a los dos puntos y es `null` en las
líneas que no la tienen (típicamente enlaces a prensa).

### Bloques

`blocks` es la secuencia del cuerpo del proyecto, en orden. Cada bloque tiene un
`type`; todo campo `html` es HTML inline reducido a `<strong> <em> <a> <br>
<code> <sup> <sub>`, con los enlaces internos a proyectos de este set
reescritos a rutas relativas (`/trossets`).

| type | campos |
|---|---|
| `text` | `html` |
| `heading` | `level` (1–6), `html` |
| `list` | `ordered` (bool), `items` (array de html) |
| `image` | `src`, `width`, `height`, `alt`, `caption?` |
| `video` | `src` (mp4 local) |
| `quote` | `html`, `cite?` |
| `embed` | `provider`, `id`, `url`, y `title?` (vídeo) o `text?` (tuit) |

`provider` es `youtube`, `vimeo`, `twitter` o `iframe`. En los tuits, `text`
guarda el texto plano del tuit como fallback: el widget de X ya no carga de
forma fiable y conviene renderizar una tarjeta propia con `text` + `url`.

### `content/projects/index.json`

Array ordenado por año descendente con `slug`, `title`, `year`, `summary`,
`categories`, `tags` y `cover`. Pensado para el grid: no hace falta cargar los
proyectos completos.

### `content/about.json`

```jsonc
{
  "title": "About",
  "bio": ["<html>", "…"],        // párrafos de la biografía
  "cv": [
    {
      "title": "Collective exhibitions and Residencies",
      "slug": "collective-exhibitions-and-residencies",
      "entries": [ { "year": 2023, "html": "2023 January. …" } ]
    }
  ],
  "source": "https://www.annacarreras.com/about/"
}
```

`year` es el año inicial de la entrada, o `null` cuando la línea no empieza por
un año (pasa en *Teaching*, donde los años van al final). El `html` conserva la
línea entera, año incluido.

## Notas de contenido

- 13 proyectos, elegidos por variedad de formatos (texto largo, galería, vídeo
  embebido, mp4 local, citas, hilos de tuits, créditos extensos).
- La sección *Upcoming exhibitions* del about está vacía en origen: se mantiene
  para poder rellenarla.
- `tops-m` no tiene `summary`: el post original no tiene ni un párrafo de texto,
  solo medios, así que WordPress no genera extracto.
- El `summary` de `tesi` es el extracto automático de WordPress y arrastra el
  texto de la cita inicial y un `[…]` final. Si se va a usar en listados o en
  las `<meta>`, conviene reescribirlo a mano.
- Los GIFs de `arrels` son pesados (~6 MB cada uno); conviene convertirlos a
  vídeo o WebP en el build.
