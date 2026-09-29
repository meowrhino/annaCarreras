# annacarreras.com

La web de Anna Carreras, en HTML, CSS y JS a pelo: sin frameworks, sin build.
GitHub Pages sirve el repo tal cual.

<https://meowrhino.github.io/annaCarreras/>

El diseño es **Rajoles**: el fondo es Trossets (sus 13 bloques y sus 18
paletas) en una rejilla sin fin; la semilla es el día. La hoja con el
contenido ocupa celdas enteras de la rejilla. Por qué y qué falta, en
[`DISEÑO.md`](DISEÑO.md). Las pruebas anteriores están en el historial de git
y archivadas en
[meowrhino/annaCarreras-disenos](https://github.com/meowrhino/annaCarreras-disenos).

```
index.html                  la página (rutas por hash: #/, #/archive, #/about, #/contact, #/<slug>)
style.css
rajoles.js                  el fondo (Trossets), los mandos del pie y la rejilla de la hoja
app.js                      pinta el contenido desde content/
content/
  site.json                 datos globales del sitio
  about.json                bio + CV
  curated.json              selección, frases, fichas y Racó geek (a mano)
  projects/
    index.json              listado ligero para el grid
    <slug>.json             un fichero por proyecto
assets/
  projects/<slug>/…         imágenes y vídeos a resolución original
scripts/
  scrape.py                 regenera content/ y assets/ desde el WordPress
```

`?dia=AAAA-MM-DD` enseña el fondo de otro día, `?paleta=Paella` fija la paleta
y `?llavor=…` saca otra combinación. Los mandos del pie escriben estos mismos
parámetros.

Los `src` de los JSON son rutas root-absolutas (`/assets/projects/...`).
**Ojo con el base path:** GitHub Pages sirve desde `/annaCarreras/`, así que
`app.js` los resuelve contra la carpeta de la página.

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

`provider` es `youtube`, `vimeo`, `twitter` o `iframe`.

Los tuits no dependen del widget de X (ya no carga de forma fiable): el script
los completa desde el endpoint público de sindicación de X, así que llevan todo
lo necesario para pintar una tarjeta propia:

```jsonc
{
  "type": "embed", "provider": "twitter", "id": "…", "url": "…",
  "text": "…",               // texto plano con saltos de línea; t.co expandidos
  "date": "2024-02-07",
  "author": "carreras_anna",
  "media": [                  // opcional; imágenes locales a ~680px
    { "src": "…", "width": 453, "height": 680, "alt": "", "kind?": "video" }
  ]
}
```

`kind: "video"` indica que `src` es solo el fotograma de portada de un vídeo
del tuit; enlaza al `url` para verlo.

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

### `content/curated.json`

Lo único escrito a mano: `scrape.py` no lo toca. Manda sobre lo scrapeado.

```jsonc
{
  "selected": ["trossets", "arrels", …],   // orden de la portada
  "projects": {
    "trossets": {
      "name": "Trossets",                   // nombre corto (sin «at ArtBlocks curated»)
      "line": "…",                          // una frase para la selección
      "medium": ["digital"],                // soporte; si falta, las categorías
      "facts": [ { "label": "Edition", "html": "1,000 outputs" } ],
      "links": [ { "label": "Art Blocks", "url": "…" } ],
      "exhibitions": ["2022 — …"],
      "press": [ { "label": "…", "url": "…" } ],
      "geek": ["<html>", "…"]               // Racó geek: cómo funciona; si falta, no sale
    }
  },
  "contact": [ { "label": "X", "url": "…" } ],
  "upcoming": []                            // html; si está vacío no se pinta
}
```

Los créditos del proyecto con etiqueta van a la ficha; las líneas sin
etiqueta (enlaces a prensa) van a *Press*.

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
- Cuatro tuits (tres en `trossets`, uno en `tesi`) no se ven en la web actual:
  WordPress nunca resolvió el embed y guardó solo la URL. Aquí sí tienen texto
  e imágenes.
- Casi ninguna imagen tiene `alt` real. WordPress rellena el `alt` con el nombre
  del fichero cuando no se escribe uno; el script lo descarta y deja `""`.
- Los GIFs de `arrels` son pesados (~6 MB cada uno); conviene convertirlos a
  vídeo o WebP (a mano, con `ffmpeg`, antes de publicar).
