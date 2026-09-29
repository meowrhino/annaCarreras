# Diseño: Rajoles

Elegido el 2026-09-29, después de leer los 13 proyectos, el about y la tesis
entera (*Art generatiu. Estudi entorn la complexitat des de la pràctica
artística amb codi*, 2023). Las pruebas anteriores (índice cronológico,
selección + ficha, la web como output, portadas vivas) se veían genéricas,
como hechas por una IA: tema oscuro, tarjetas, etiquetas en pastilla, cristal
desenfocado. Siguen en el historial de git y en
[annaCarreras-disenos](https://github.com/meowrhino/annaCarreras-disenos).

## La idea

La web es una rejilla de Trossets.

- **Fondo**: rajoles multiescala en una rejilla de 12 columnas (9 en
  tableta), subdivididas una sola vez, como en Trossets. Pintadas con una de
  sus 18 paletas con nombre.
- **Semilla = el día**: hoy todo el mundo ve el mismo fondo; mañana, otro.
  `?dia=AAAA-MM-DD` reproduce uno. Viene de L'algorisme despullat: la
  máquina dibuja una vez al día.
- **Hoja**: ocupa celdas enteras de la rejilla, del color de fondo de la
  paleta. Es el hueco sin rajoles; no flota con desenfoque.
- **Al entrar**: primero se pinta el fondo, rajola a rajola (~1 s); después
  se asienta la hoja.
- **Pie**: `paleta Paella · 29.09.2026`, enlazado a ese día.

## Lo que sale de la tesis

1. **La obra es la pieza y el código a la vez** (3.1.2): la web es un
   sistema suyo, no una plantilla con un canvas detrás.
2. **Racó geek**: así acaba cada proyecto de la tesis (cómo funciona, con
   números). Es la capa v3ga con nombre suyo.
3. **Small multiples** (Tufte): así colgó los dibujos de L'algorisme
   despullat. Es el *Archive*.
4. **Memoria y paisaje** (3.3): las paletas de Trossets tienen nombre de
   sitios y comidas suyas (Paella, Tortilla, Olivos, Palamós…).
5. **Diccionari**: define con sus palabras *llavor*, *atzar*, *iteració*…
   Material para una página oculta.

## Estructura

- Menú **Work · Archive · About · Contact** (Rikić). *About* empieza por
  *upcoming* si hay.
- **Work**: la selección; imagen, nombre, soporte y año, una frase (Anna
  Lucia).
- **Archive**: todos los proyectos en *small multiples*, del más nuevo al más
  viejo.
- **Proyecto**: ficha → texto → imágenes → **Racó geek** (solo si hay texto
  en `curated.json`; de momento, Trossets).

## Hecho

- [`rajoles.js`](rajoles.js): el fondo, la paleta del día, la tinta (el
  color de la paleta que más contrasta con el fondo, mínimo 4.5:1) y la
  rejilla de la hoja. Solo pinta las filas visibles, al hacer scroll.
- [`app.js`](app.js): Work, Archive, proyecto con Racó geek, About, Contact.
- Tipografía: Jost (geométrica, de la familia de Futura), 400 y 500.

## Falta

- **Los bloques son nuestros**, a la manera de Trossets (barras con
  cuentas, arcos de Smith, anillos, semillas). Anna puede cambiarlos por
  los suyos en `BLOCKS` sin tocar el resto.
- **Diccionari** y **lab/** ocultos (el calendario de fondos va ahí, en
  *small multiples*).
- **Racó geek** del resto de proyectos.
- Algunas paletas pintan líneas de poco contraste con el fondo (Tortilla:
  amarillo sobre crema). Es su paleta; decidir si se deja.
- Un HTML por proyecto (URLs limpias, og:image) en vez de rutas por hash.

## Huecos de contenido

- De los 13 proyectos de la demo, 9 son instalaciones interactivas de antes
  de 2015. La web se lee como estudio de instalaciones, no como artista
  generativa.
- Los proyectos de la tesis existen en su web y no están en la demo:
  `ganxillo`, `discs`, `estratosferic`, `algorisme-despullat` (y
  `quarantena-generativa`, `llacades`, `franja`). Añadirlos es poner sus
  slugs en `SLUGS` de `scripts/scrape.py`.
- La bio no menciona el doctorado (2023) ni Art Blocks.
- Todo lo de `curated.json` (selección, frases, fichas, Racó geek) es
  provisional.

## Preguntas para Anna

1. ¿Nos deja usar sus bloques de Trossets, o prefiere dibujar unos nuevos
   para la web?
2. ¿Qué 5 a 8 proyectos van en la selección?
3. ¿Añadimos Ganxillo, Discs, Estratosfèric y L'algorisme despullat?
4. ¿Web en catalán, en inglés o en los dos?
5. ¿Podemos usar el Racó geek y el Diccionari de la tesis?
6. ¿Qué contacto quiere enseñar? (email, Instagram, X, galería)
