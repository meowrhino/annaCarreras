# Conceptos — 2026-09-29 (tarde)

Volvemos a empezar desde el concepto, antes de tocar código. Sale de leer los
13 proyectos, el about y la tesis entera (*Art generatiu. Estudi entorn la
complexitat des de la pràctica artística amb codi*, 2023).

Lo que ya teníamos ([`prueba-a/`](../prueba-a/), [`prueba-b/`](../prueba-b/))
funciona, pero parece hecho por una IA: tema oscuro, tarjetas, etiquetas en
pastilla, cristal desenfocado. Es genérico porque no sale de nada suyo. Se
queda la idea de **fondo + hoja pequeña**, y que **el fondo cargue primero**.

## Lo que dice la tesis y sirve para la web

1. **La obra es la pieza y el código a la vez** (3.1.2). La web puede ser un
   sistema suyo, no una plantilla con un canvas detrás.
2. **Cada proyecto aísla una propiedad de la complejidad** (4.5): L'algorisme
   despullat → interacción con el entorno; Trossets → diversidad; Ganxillo →
   dinamismo y repetición; Estratosfèric → ruido; Discs → interacción entre
   individuos. La web puede hacer lo mismo: elegir **una** y quedarse ahí.
3. **Cada proyecto de la tesis acaba en un «Racó geek»**: cómo funciona el
   algoritmo, con números y trozos de código. Es la capa v3ga, con nombre
   suyo.
4. **Tiene un Diccionari**: define con sus palabras *llavor*, *atzar*,
   *iteració*, *subdividir*… Material hecho para una página oculta.
5. **Small multiples** (Tufte): así colgó los dibujos de L'algorisme
   despullat, en rejilla, para ver el sistema de un vistazo. Sirve para el
   *Archive*.
6. **Memoria y paisaje** (3.3, su segunda obsesión): las 18 paletas de
   Trossets tienen nombre (Paella, Tortilla, Olivos, Palamós, Buganvilea…) y
   salen de sitios suyos. Sus capítulos empiezan con historias de su
   abuela, de hormigas, de buñuelos de bacalao. El tono es cercano, en
   catalán, con humor.
7. **Ritmo lento**: «jo vaig massa ràpida, la màquina encara més»; la
   máquina de L'algorisme despullat dibuja una vez al día, a mediodía, y se
   apaga.

## Base común (va en cualquier concepto)

- Menú: **Work · Archive · About · Contact** (Rikić). *About* empieza por
  *upcoming*.
- **Work**: la selección. Título, año y una línea (Anna Lucia).
- **Archive**: todo, en *small multiples*: portadas del mismo tamaño en
  rejilla cronológica, una fila por año. Como la pared de la instalación.
- **Proyecto**: ficha → texto corto → imágenes → **Racó geek** (cómo
  funciona, parámetros, código, sketch vivo si lo hay). Si no hay material,
  no sale.
- **Diccionari** oculto: las palabras técnicas de los textos llevan
  subrayado de puntos y abren su definición.
- **lab/** oculto, sin enlace en el menú (v3ga).

## Concepto 1. Rajoles ⭐

La web es una rejilla de Trossets. Es lo más cercano a Trossets.

- **Fondo**: rajoles multiescala sobre una de sus tres rejillas (6×3, 9×5,
  12×7, según la pantalla), subdivididas una sola vez, como en Trossets.
  Pintadas con una de sus paletas con nombre.
- **Hoja**: no flota encima con desenfoque. **Ocupa celdas de la rejilla**:
  es una rajola lisa más, del color de fondo de la paleta. Alrededor, las
  rajoles.
- **Al entrar**: las rajoles se pintan una a una (~1 s) y la hoja se asienta
  en su hueco.
- **Al navegar**: solo se repintan las celdas que cambian; la hoja cambia de
  tamaño por celdas.
- **Pie**: `paleta Paella` enlazado al tuit donde cuenta de dónde sale.
- **Riesgo**: que la web parezca un Trosset (una obra que se vende). Hacen
  falta su permiso, y que ella dé los bloques o los dibuje nuevos para la
  web.

## Concepto 2. Un dibuix al dia

La web se comporta como L'algorisme despullat.

- **Fondo**: un caminante aleatorio (pasos de 20 px, solo N/S/E/O, ~1.100
  pasos), el algoritme de la instalación.
- **Semilla = fecha**. Todo el mundo ve el mismo dibujo ese día; mañana,
  otro. La web no cambia a cada clic: cambia una vez al día.
- **Al entrar**: se ve dibujarse (acelerado, ~3 s) y después aparece la
  hoja.
- **Pie**: `dibuix del 29.09.2026 · lluna creixent`. La fase lunar se
  calcula: su pregunta de si la luna afecta a la máquina.
- **lab/**: el calendario de todos los dibujos en *small multiples*.
- **Riesgo**: poco. Es el más sobrio. Visualmente menos suyo que Trossets.

## Concepto 3. Estrats

La web como Estratosfèric: cada página empieza donde acabó la anterior.

- **Fondo**: vetas horizontales de líneas de 1 px que avanzan de izquierda a
  derecha. Al cambiar de página, la veta sigue desde donde estaba, como sus
  dípticos y trípticos. Tu recorrido deja sedimento.
- **Hoja**: un estrato más.
- **Riesgo**: el más poético y el menos claro. Pesado en pantallas retina
  (líneas de 1 px). Difícil de leer en móvil.

## Recomendación

**1 + la regla de la 2**: el fondo de rajoles, pero con la semilla del día,
no de cada visita. Se ve dibujarse al entrar, se ve igual todo el día. La
paleta del día viene en el pie con su nombre. El calendario de fondos va a
`lab/`.

Descarta la A de [`2026-09-29.md`](2026-09-29.md) (hash por visita + hoja
translúcida): la hoja deja de ser cristal y pasa a ser parte de la rejilla.

## Huecos de contenido

- De los 13 proyectos de la demo, 9 son instalaciones interactivas de antes
  de 2015. La web se leería como estudio de instalaciones, no como artista
  generativa.
- Los proyectos de la tesis existen en su web y no están en la demo:
  `ganxillo`, `discs`, `estratosferic`, `algorisme-despullat` (y
  `quarantena-generativa`, `llacades`, `franja`). Añadirlos es poner sus
  slugs en `SLUGS` de `scripts/scrape.py`.
- La bio no menciona el doctorado (2023) ni Art Blocks.

## Preguntas para Anna

1. ¿Rajoles le gusta como base? ¿Nos deja usar sus bloques de Trossets, o
   prefiere dibujar unos nuevos para la web?
2. ¿Web en catalán, en inglés o en los dos?
3. ¿Podemos usar el Racó geek y el Diccionari de la tesis?
4. ¿Añadimos a la demo Ganxillo, Discs, Estratosfèric y L'algorisme
   despullat?
