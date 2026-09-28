# Líneas de diseño

Opciones para el front de annacarreras.com. Todas en HTML, CSS y JS a pelo, sin
frameworks ni build. La página de proyecto es parecida en todas (título, año,
bloques en una columna, créditos al final); lo que cambia es sobre todo la
portada.

## En prueba

**1. Índice cronológico.** Portada como lista de 2024 a 2001: año, título,
categoría. Al pasar el ratón aparece la portada del proyecto. Enseña 25 años de
trayectoria de un vistazo y deja que la obra ponga las imágenes. Prueba en
[`prueba/`](prueba/).

## Aparcadas

**2. Índice + un detalle generativo.** La 1, más un elemento pequeño hecho con
código (`<canvas>`) en la cabecera o en la transición entre proyectos. Un guiño
a su práctica sin competir con las imágenes. Se puede sumar encima de la 1 si
funciona. ~5 h.

**3. Galería de portadas.** Grid de imágenes grandes con filtro por categoría.
Lo seguro y lo más parecido al WordPress actual, pero indistinguible de
cualquier portfolio. ~3 h.

**4. Estética de código.** Monoespaciada, aire de terminal, jugando con el
`&&` de su lema («generative art && interactive installations»). Barata, pero la
más previsible para una artista que programa. ~2 h.
