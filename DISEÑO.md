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
- **Contenido grande encima** (feedback de Anna, 2026-10-06): sin hoja
  flotante con scroll por dentro, que se veía de principios de los 2000.
  Hace scroll la página. Las imágenes van directas sobre el fondo y el
  texto sobre papel (el color de fondo de la paleta), en columnas de 44rem.
  El fondo es un canvas fijo y no se redibuja al hacer scroll. La hoja
  flotante está archivada como 07.
- **Al entrar**: el fondo sale rajola a rajola (~1 s).
- **Bloques**: los 13 de Trossets, con su azar ponderado (qué bloques
  salen juntos) y sus adornos, sacados del script on-chain y pasados de p5 a
  canvas sin cambiar la geometría.
- **Vivo**: cada 0,25 s una rajola cambia de bloque, o se parte en
  cuatro, o se vuelve a unir (la diversidad de Trossets, en el tiempo). Y
  las celdas por donde pasa el ratón o el dedo se regeneran y a los 5 s
  vuelven a lo que eran. Cada cambio se funde en 0,4 s. Quieto con
  «reducir movimiento» y con la pestaña oculta.
- **Pie**: `‹ 29.09.2026 › · paleta Paella · ↻`. Las flechas cambian de día,
  la paleta abre las 18 muestras (y «del día») y ↻ saca otra combinación con
  la misma paleta. Todo queda en la URL: `?dia=`, `?llavor=`, `?paleta=`.

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

- Menú **Work · About · Contact**. *About* empieza por *upcoming* si hay.
- **Work**: todos los proyectos, del más nuevo al más viejo, con la portada a
  sangre y el título y el año encima (v3ga). Dos columnas apaisadas en
  ordenador (tres en pantallas muy anchas) y una en vertical en el móvil.
- **Proyecto** (La Diegol, más ancho): arriba el primer vídeo a todo el ancho,
  con la portada y ▶ hasta que se clica (sin vídeo, la portada); la cabecera
  centrada con el título; la ficha; el cuerpo, con las imágenes hasta 110rem;
  **Racó geek** (solo si hay texto en `curated.json`); más nuevo · todos ·
  más viejo.

## Hecho

- [`js/rajoles.js`](js/rajoles.js): el estado en la URL, la tinta (el
  color de la paleta que más contrasta con el fondo, mínimo 4.5:1), la rejilla y
  los mandos del pie.
- [`js/fondo.js`](js/fondo.js): el canvas. Solo pinta las filas visibles;
  la intro y las dos animaciones.
- [`js/trossets.js`](js/trossets.js): los bloques y paletas de Anna.
- [`js/app.js`](js/app.js): Work, proyecto con Racó geek, About,
  Contact.
- Tipografía: Jost (geométrica, de la familia de Futura), 400 y 500.

## Falta

- **Permiso de Anna** para usar el código de Trossets en su web (pregunta
  1). Si dice que no, hay que dibujar bloques nuevos en `TROSSETS` (`js/trossets.js`).
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

1. ¿Nos deja usar el código de Trossets en el fondo (ya está puesto), o
   prefiere dibujar bloques nuevos para la web?
2. ¿Qué 5 a 8 proyectos van en la selección?
3. ¿Añadimos Ganxillo, Discs, Estratosfèric y L'algorisme despullat?
4. ¿Web en catalán, en inglés o en los dos?
5. ¿Podemos usar el Racó geek y el Diccionari de la tesis?
6. ¿Qué contacto quiere enseñar? (email, Instagram, X, galería)
