# Líneas de diseño — 2026-09-29

Segunda ronda, a partir de las tres webs que mandó Anna (ver
[`LINEASDEDISEÑO.md`](LINEASDEDISEÑO.md)). Todo en HTML, CSS y JS a pelo.

La estructura no cambia: *Work / Archive / About / Contact* (Rikić) y el
proyecto como ficha (Anna Lucia), como ya está en [`prueba/`](prueba/). Lo
nuevo es la capa v3ga: que se note que la web la hace alguien que programa.

**Elegidas: A + B.** Pendiente de saber qué código de sus piezas podemos usar.

## A. La web es un output ⭐ (~6 h)

Cada visita genera un `hash`, como un token de Art Blocks. El hash decide la
paleta, un patrón de Truchet en los márgenes y el ritmo de la rejilla. El
contenido sigue sobrio (Anna Lucia); lo generativo es solo el marco.

- Al pie: `seed 0x3fa2…` con enlace `?seed=` para reproducir esa versión.
- Encaja con su práctica (Art Blocks, Trossets). Puede escribirlo ella en p5
  cuando quiera: nosotros dejamos el hueco y una primera versión.

## B. Portadas vivas (~5 h)

En *Work*, cada tarjeta es una imagen fija. Al pasar el ratón (o al entrar en
pantalla, en móvil) arranca su sketch p5 en modo instancia.

- Solo corre uno a la vez (`IntersectionObserver` + pausar el resto).
- p5 se carga solo si hay algún sketch en la página.
- Depende del código de cada pieza, o de una versión reducida hecha para la web.

## C. Proyecto con el algoritmo dentro (~4 h por pieza)

Ficha a la izquierda, canvas a la derecha. Parámetros como
`<input type="range">` sincronizados con la URL (`?tiles=12&seed=…`). Botones
«regenerar» y «ver código» (el sketch en monoespaciada). Lo de v3ga.

## D. Archivo como raíces (~6 h)

Alternativa al índice cronológico: los proyectos como nodos que crecen como
en *Arrels* (hormigueros, complejidad, su tesis), unidos por etiquetas
compartidas. El índice en lista se queda como vista accesible. La más
espectacular y la más arriesgada en claridad.

## E. `lab/` oculto (~2 h, se combina con cualquiera)

Páginas `noindex` sin enlace en el menú: archivo de semillas, readmes de sus
algoritmos, dossier, CV imprimible (CSS de impresión → PDF).

## Cambio técnico propuesto

Pasar de la SPA con `#/rutas` a **un HTML real por proyecto**, generado por un
script Python (stdlib, como `scrape.py`) que se corre a mano; el resultado se
commitea y GitHub Pages lo sirve tal cual. Da URLs limpias, previews al
compartir (og:image) y SEO. Transiciones entre páginas con
`@view-transition` nativo, sin JS.

Choca con el «sin build» acordado: decidir si un generador que se corre a mano
cuenta como build.

## Código de las piezas (para A + B)

- **Trossets**: el script está on-chain en Art Blocks (proyecto 147), es
  público. Se puede sacar, pero es obra de Anna: pedirle permiso y preguntarle
  si prefiere una versión reducida para la web.
- **Arrels**: en Feral File. Puede que el HTML generativo sea accesible;
  por comprobar.
- **El resto** (tesi, TOPS-M, instalaciones): no hay código público. Imagen
  fija, o un sketch nuevo que escriba ella.

## Preguntas para Anna

1. ¿Nos deja usar el código de Trossets y Arrels en la web?
2. ¿Quiere escribir ella el sketch del marco (A), o le hacemos uno y lo cambia?
3. ¿Qué piezas quiere vivas en *Work* (B)?
