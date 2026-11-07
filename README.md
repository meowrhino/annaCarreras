# annacarreras.com

La web de Anna Carreras, con la receta del estudio
([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)): HTML, CSS y JS
a pelo, y un build en Node (solo `sharp`) que escribe `dist/`.

<https://meowrhino.github.io/annaCarreras/> (sin indexar)

El diseño es el **10** (portadas a sangre, el vídeo arriba, un dibujo que se
hace en directo detrás); por qué y qué falta, en `DISEÑO.md`. Las
pruebas anteriores, en
[meowrhino/annaCarreras-disenos](https://github.com/meowrhino/annaCarreras-disenos).
Lo que edita Anna: [`GUIA.md`](GUIA.md) (en catalán; los mensajes del build,
en castellano). El traspaso: `TRASPASO.md`. Si el build falla:
`CLAUDE.md`. (Esos tres son nuestros: no van en la copia de Anna.)

```
data/site.json            lo general y lists.work: qué proyectos salen y en qué orden
data/about.json           bio, CV, upcoming
work/<slug>/project.json  un proyecto (schema/project.json dice qué lleva)
work/<slug>/img/          1.webp, 2.webp… (y N.mp4)
index.html                la plantilla, y con Live Server la vista previa
js/paginas.js             datos → HTML de cada página; lo usan el build y la vista previa
js/app.js                 navega sin recargar (el fondo sigue) y, sin build, pinta desde los JSON
js/fondo.js               el dibujo del fondo; cada página, su semilla
build/build.mjs           valida, mide las fotos, og 1200×630 y escribe dist/
scripts/scrape.py         trae proyectos nuevos del WordPress a work/ (+ scripts/webp.mjs)
```

**Patrón B** (JAMstack, patrones §1): cada dirección es una página de verdad
(`/trossets/`) con su contenido dentro, pero al hacer clic no recarga: `app.js`
pide la página, cambia el `<main>` y hace `pushState`, así el dibujo sigue y solo
cambia la semilla. Sin transición de la casa (no recarga). Los `#/slug` de antes
redirigen. Las direcciones son las del WordPress (`/<slug>/`): al poner el
dominio, los enlaces que ya circulan siguen valiendo.

```bash
npm ci && node build/build.mjs
```

Publica la Action en nuestra copia (`meowrhino.github.io/annaCarreras/`, base
`/annaCarreras/` y `noindex`) y Workers Builds en la de Anna (`wrangler.jsonc`,
la raíz y el `url` de `site.json`).

## Traer más proyectos del WordPress

Son 13 de ~103. Para traer otros:

```bash
python3 scripts/scrape.py ganxillo discs estratosferic
```

Solo trae los que no tienen carpeta (lo que ya está se edita a mano y no se
toca). Las fotos bajan en su tamaño original y salen en webp (q85; los gif,
animados y sin pérdida). Luego, el slug a `data/site.json` → `lists` por año, y
un `title` corto.
