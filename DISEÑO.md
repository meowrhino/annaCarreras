# Diseño 10

Hecho desde cero el 2026-10-06, con el feedback de Anna sobre Rajoles. Las
pruebas anteriores (01–09, Rajoles incluida) están archivadas en
[annaCarreras-disenos](https://github.com/meowrhino/annaCarreras-disenos).

## El feedback

1. El contenido flotando con scroll en medio de la página se ve de principios
   de los 2000. Mejor contenido grande y fácil de ver, como
   [thrumotion.com/work](https://thrumotion.com/work).
2. El fondo tiene que verse claramente generado y animado, como
   [alsoknownasrox.com](https://alsoknownasrox.com). Con Rajoles, el clic
   derecho daba «guardar imagen» y se bajaba un trozo: parecía una foto.
3. La portada: todos los proyectos en rectángulos, apaisados en ordenador y
   en vertical en el móvil, con título y año como en [v3ga](https://www.v3ga.net).
4. El proyecto, como La Diegol, pero en ordenador más ancho. En el móvil, igual.
5. El fondo: algo generativo de cada proyecto, o una pieza ligera para toda la
   web.

## Qué hace

- **Papel claro y tinta negra.** Nada de tema oscuro ni cajas: el contenido
  va directo sobre el fondo.
- **Fondo**: un dibujo que se hace en directo
  ([`js/fondo.js`](js/fondo.js)). Unas puntas avanzan, giran, se ramifican
  y mueren, y lo que dibujan se borra a los 12 s. Nunca está quieto. Al pasar
  el ratón o el dedo nacen puntas nuevas. El canvas no recibe clics: no hay
  «guardar imagen».
- **Una pieza para toda la web, con un carácter por proyecto** (punto 5, las
  dos cosas a la vez): la semilla es la página. Cada proyecto dibuja distinto
  (en curva o en circuito, más o menos enredado, más o menos grueso), y
  siempre igual para el mismo proyecto.
- **Portada** (v3ga + thrumotion): el nombre enorme sobre media pantalla de
  dibujo, y debajo todas las portadas a sangre, con el título y el año encima
  en blanco invertido. Dos columnas 16:10 en ordenador; una en vertical
  (4:5) en el móvil. El dibujo asoma entre portada y portada.
- **Proyecto** (La Diegol, más ancho): el primer vídeo a todo el ancho (hasta
  112rem) con la portada y ▶ hasta que se clica; el título centrado con año,
  soporte y la frase; el texto a 40rem para leer; las imágenes y los vídeos a
  todo el ancho, en dos columnas cuando van seguidas; la ficha al final; más
  nuevo · todos · más viejo.
- **El texto lleva un halo de papel**: el dibujo pasa por detrás sin tapar
  las letras y sin meterlas en una caja.
- Tipografía: Instrument Sans, 400 y 500.
- Ligero: un canvas 2D, ~30 pasos por segundo, puntas según el tamaño de la
  pantalla (16 a 50). Se para con la pestaña oculta. Con «reducir
  movimiento», un dibujo quieto.

## Falta

- **Hablarlo con Anna**: ¿el fondo es este dibujo para siempre, o cada
  proyecto con una pieza suya de verdad (Trossets en Trossets, Arrels en
  Arrels…)? El cambio es pequeño: la semilla ya llega por página.
- **Racó geek** del resto de proyectos.
- **Diccionari** y **lab/** ocultos.
- Un HTML por proyecto (URLs limpias, og:image) en vez de rutas por hash.

## Lo que sale de la tesis

1. **La obra es la pieza y el código a la vez** (3.1.2): la web es un
   sistema suyo, no una plantilla con un canvas detrás.
2. **Racó geek**: así acaba cada proyecto de la tesis (cómo funciona, con
   números). Es la capa v3ga con nombre suyo.
3. **Diccionari**: define con sus palabras *llavor*, *atzar*, *iteració*…
   Material para una página oculta.

## Huecos de contenido

- De los 13 proyectos de la demo, 9 son instalaciones interactivas de antes
  de 2015. La web se lee como estudio de instalaciones, no como artista
  generativa.
- Los proyectos de la tesis existen en su web y no están en la demo:
  `ganxillo`, `discs`, `estratosferic`, `algorisme-despullat` (y
  `quarantena-generativa`, `llacades`, `franja`). Añadirlos es poner sus
  slugs en `SLUGS` de `scripts/scrape.py`. En total hay 103 posts en el
  WordPress (la lista está en la 08 del archivo, `density.json`).
- La bio no menciona el doctorado (2023) ni Art Blocks.
- Todo el texto de la web es el de su WordPress, sin inventar nada. Los
  campos a mano de cada proyecto (`name`, `line`, `medium`, `facts`, `links`,
  `exhibitions`, `press`, `geek`) están vacíos esperando a Anna. Hay un
  borrador nuestro de seis proyectos en `content/curated.json` del commit
  `9cf0b4a`, por si sirve de ejemplo.
- Sin `name`, las portadas enseñan el título largo del WordPress
  («“Arrels” at Social Codes, Feral File»).

## Preguntas para Anna

1. ¿Fondo único con carácter por proyecto (como ahora) o una pieza suya en
   cada proyecto?
2. ¿Añadimos Ganxillo, Discs, Estratosfèric y L'algorisme despullat? ¿O los
   103?
3. ¿Web en catalán, en inglés o en los dos?
4. ¿Podemos usar el Racó geek y el Diccionari de la tesis?
5. ¿Qué contacto quiere enseñar? (email, Instagram, X, galería)
