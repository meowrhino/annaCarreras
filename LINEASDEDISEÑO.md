# Líneas de diseño

Opciones para el front de annacarreras.com. Todas en HTML, CSS y JS a pelo, sin
frameworks ni build. Cada prueba se archiva, también las descartadas, en
[meowrhino/annaCarreras-disenos](https://github.com/meowrhino/annaCarreras-disenos).

## Referencias del cliente

**[monicarikic.com](https://monicarikic.com)**: por lo claros que son los
apartados que necesita cualquier artista.
- Menú de tres: *work*, *about*, *contact*.
- *Work* es una columna de proyectos seleccionados: imagen grande, título y
  una línea «2023. Qué es y para quién». Debajo, un *archive* con el resto,
  clasificado por tipo (games, education).
- *About* empieza por **upcoming** (fechas próximas), luego bio, statement,
  premios, colecciones y docencia.

**[annalucia.io/selected](https://annalucia.io/selected.html)**: por lo
minimalista al explicar cada proyecto y lo claro que enseña el portfolio con
título y año.
- Portfolio: una tarjeta por obra con imagen, título, año (o rango «2025 –
  now»), soporte como etiqueta (digital, textile, print) y una frase.
- Proyecto: título, luego una **ficha** (año, edición, enlace a Art Blocks,
  publicaciones, exposiciones), dos párrafos y una rejilla de outputs.
  Nada más.
- Muy cercana a Anna: también es artista de Art Blocks.

**[v3ga.net](https://www.v3ga.net)**: por cómo mete cosas propias de JavaScript
y de su práctica en cada proyecto, y por las páginas ocultas que usa para
trabajar.
- La portada tiene detrás un `<canvas>` generativo propio (una esfera).
- Algunas páginas de proyecto llevan **el algoritmo vivo**: el dibujo se
  genera en la página y se controla con parámetros en la URL
  (`?mode=random&animate=1…`).
- Páginas **no enlazadas desde el menú**: readmes de algoritmos, protocolos,
  herramientas. Sirven para trabajar y para mandar a coleccionistas o
  comisarios.

## En prueba

**1. Índice cronológico.** Portada como lista de 2024 a 2001: año, título,
categoría. Al pasar el ratón aparece la portada del proyecto. Prueba en
[`prueba/`](prueba/), archivada como
[01](https://meowrhino.github.io/annaCarreras-disenos/01-indice-cronologico/).

## Ideas de las referencias (brainstorming)

**5. Selección + archivo** (Rikić + Anna Lucia). Dos niveles:
- *Work*: 5 a 8 proyectos elegidos, grandes, con título, año, soporte y
  una frase.
- *Archive*: todo, como la línea 1 (el índice cronológico pasa a ser esto).
- *About* con *upcoming* arriba y *contact* aparte.

Resuelve la estructura de artista sin tirar la línea 1. Falta que Anna elija
la selección y escriba la frase de cada una.

**6. Proyecto como ficha** (Anna Lucia). La página de proyecto empieza con una
ficha: año, soporte, edición, enlaces (Art Blocks, Feral File, OpenSea),
exposiciones y prensa. Después, texto corto y outputs en rejilla. Los
`credits` que ya tenemos (etiqueta: valor) son casi esa ficha; faltarían
exposiciones y prensa por proyecto, que ahora solo están en el CV del about.

**7. Código vivo** (v3ga). Un tipo de bloque nuevo, `sketch`: un `<canvas>` con
un algoritmo suyo corriendo en la página del proyecto (Trossets con sus
teselas de Truchet, por ejemplo), con botón de regenerar y parámetros en la
URL. Opcional: una pieza pequeña suya de fondo en la portada. Depende de que
Anna quiera o pueda compartir ese código.

**8. Páginas ocultas** (v3ga). Una carpeta `lab/` con `noindex`, sin enlace en
el menú: dossier de prensa, CV largo, readmes de algoritmos, borradores de
proyectos. Barato de hacer; hay que saber qué usa ella para trabajar.

Las cuatro se pueden combinar: 5 da la estructura, 6 la página de proyecto,
7 y 8 lo que la diferencia.

## Aparcadas

**2. Índice + un detalle generativo.** La 1, más un elemento pequeño hecho con
código (`<canvas>`) en la cabecera o en la transición entre proyectos. Queda
absorbida por la 7 si esa sale adelante. ~5 h.

**3. Galería de portadas.** Grid de imágenes grandes con filtro por categoría.
Lo seguro y lo más parecido al WordPress actual, pero indistinguible de
cualquier portfolio. ~3 h.

**4. Estética de código.** Monoespaciada, aire de terminal, jugando con el
`&&` de su lema («generative art && interactive installations»). Barata, pero la
más previsible para una artista que programa. ~2 h.

## Preguntas para Anna

1. ¿Qué 5 a 8 proyectos van en la selección?
2. ¿Tiene código de alguna pieza (Trossets, Arrels, tesi…) que quiera poner
   vivo en la web?
3. ¿Qué páginas internas le servirían? (dossier, CV largo, precios,
   borradores…)
4. ¿Qué contacto quiere enseñar? (email, Instagram, X, galería)
