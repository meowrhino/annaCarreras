# annaCarreras, para Claude

La web de Anna Carreras, hecha por meowrhino con la receta del estudio
([meowrhino/JAMstack](https://github.com/meowrhino/JAMstack)). Se habla en
castellano. Cómo está hecha: [README.md](README.md); lo que edita Anna:
[GUIA.md](GUIA.md).

## Si el build falla (la web no se ha publicado)

Cuando falla, la web se queda como estaba. Para arreglarlo:

1. **El error**, en uno de estos sitios:
   - En las dos copias (la nuestra, `meowrhino/annaCarreras`, y la de Anna),
     la Action abre un issue con la etiqueta `build` y el mensaje dentro:
     `gh issue list --label build` y `gh issue view <n>` (en la suya, con
     `-R <su-usuario>/<su-repo>`). El registro entero: `gh run list -L 3` y
     `gh run view <id> --log-failed`.
   - En la de Anna publica Workers Builds, y su registro está en su
     Cloudflare. No hace falta ir: el paso 2 da el mismo mensaje.
2. **Reprodúcelo aquí**: `npm ci && node build/build.mjs`. Es el mismo build que
   en la nube y dice lo mismo: cada línea con ✗ trae el fichero y qué pasa.
3. **Arréglalo donde dice**, casi siempre en `data/*.json` o en
   `work/<slug>/project.json`:
   - "no es un JSON valido (linea 12…)": una coma de más o de menos, o unas
     comillas sin cerrar, cerca de esa línea.
   - "no es un campo de aquí", "falta…", "no tiene la forma que toca": lo dice
     el esquema (`schema/<tipo>.json`); el mensaje lleva cómo va el campo.
   - "dice "3", y no hay ningún work/<slug>/img/3.webp": una foto de
     `cover`, de una marca `[[3]]` o de un tuit que no está en `img/`. Pregunta
     si falta subirla; si no, quita el número y dilo.
   - "no es una marca que entienda": un párrafo `[[…]]` mal escrito; el
     mensaje lleva las que hay.
   - "lists dice …, y no hay ningún work/…/project.json": el slug de
     `data/site.json` → `lists` y el nombre de la carpeta no son iguales.
4. **Comprueba**: `node build/build.mjs` sin ✗ (los ⚠ no paran nada).

No cambies el build, las plantillas ni el esquema para que pase: si el dato
está bien y el build se queja, es un fallo del build, y hay que decírselo a
manu. No borres fotos ni proyectos.

Commit y push solo cuando te lo pidan: mensaje en castellano diciendo qué se
arregla. Cuando el build vuelve a pasar, la Action cierra el issue sola.
