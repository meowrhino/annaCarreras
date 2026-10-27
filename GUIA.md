# Guia: com canviar la teva web

Aquesta guia és perquè canviïs la web tu mateixa: els projectes, els seus
textos i fotos, l'About. Tot es fa amb **Visual Studio Code**, un programa
gratuït: canvies els fitxers al teu ordinador, els puges amb un botó i la web
es publica sola en un parell de minuts.

> **La regla d'or**: només es toquen **dues carpetes**: `data/` (el general i
> l'About) i `work/` (cada projecte, a la seva carpeta, amb les seves fotos).
> La resta és el codi: millor no tocar-lo.

Si t'equivoques, la web **no es trenca**: es queda com estava fins que ho
arregles (punt 7).

---

## 0. Abans de començar (només el primer cop)

1. Instal·la **Visual Studio Code**: https://code.visualstudio.com
2. Obre'l i porta-hi la web: a l'esquerra, la icona de les branques (**Source
   Control**) → **Clone Repository** → **Clone from GitHub** → entra amb el teu
   compte → tria la teva còpia de la web → tria una carpeta → **Open**. Si et
   demana instal·lar Git, accepta.
   **La carpeta, fora de Google Drive, iCloud o Dropbox**: el que sincronitzen
   espatlla la carpeta de Git i fa parpellejar la vista prèvia.
3. Instal·la l'extensió **Live Server** (a l'esquerra, la icona dels
   quadradets, busca *Live Server*, **Install**). És per veure els canvis abans
   de pujar-los (punt 2).

Per preparar les fotos, **imgToWeb**: https://meowrhino.github.io/imgToWeb/
(les passa a `.webp`, a la mida justa, i les numera `1.webp, 2.webp…`).
**Obre'l amb Chrome o Firefox**, no amb Safari: Safari no sap fer `.webp`.

---

## 1. Com està organitzada

```
data/
  site.json         ← el nom, la frase de Google, la pàgina Contact i
                      la llista de projectes: quins surten i en quin ordre
  about.json        ← la bio, el CV i el que ve (Upcoming)
work/
  trossets/
    project.json    ← el text, l'any, la fitxa…
    img/            ← les seves fotos: 1.webp, 2.webp… (i algun vídeo, 5.mp4)
  arrels/
  …
```

**Un projecte, una carpeta.** El nom de la carpeta és la seva adreça:
`work/trossets/` surt a `annacarreras.com/trossets/`.

---

## 2. Com es fa un canvi

1. **Abans de res, baixa l'última versió**: a baix de tot, les fletxes ⟳
   (**Sync**).
2. Obre el fitxer (per exemple `work/trossets/project.json`), canvia el que
   vulguis i guarda (**Cmd+S**).
   Si alguna cosa surt **subratllada en vermell**, hi ha una coma o unes
   cometes malament, o un camp mal escrit: arregla-ho abans de seguir (punt 7).
   **VS Code t'ajuda**: si passes el ratolí per sobre d'un camp (`"title"`,
   `"year"`…) et diu què és, i amb **Ctrl+Espai** t'ensenya quins hi pots
   posar. Ho sap per la primera línia de cada JSON (`"$schema": …`): **no
   l'esborris**.
3. **Mira-ho abans de pujar-ho**: clic dret a `index.html` → **Open with Live
   Server**. S'obre la web al navegador i es recarrega sola cada cop que
   guardes. Si alguna cosa està malament, en comptes de la web surt en blanc
   què és i on.
4. A **Source Control**, escriu en una línia què has canviat ("trossets: text
   nou") i **Commit**.
5. **Sync Changes** (el mateix botó blau).

En 2 o 3 minuts és a la web. Per saber si ja hi és: a GitHub, al costat de
l'últim canvi, surt una **boleta**: groga, s'està publicant; ✓ verda,
publicat; ✗ vermella, no s'ha publicat (punt 7).

---

## 3. Afegir un projecte

1. Copia la carpeta d'un projecte semblant dins de `work/` i posa-li el nom
   nou: **en minúscules, sense accents ni espais, amb guions**
   (`work/ganxillo/`).
2. Esborra les fotos del seu `img/` i posa-hi les noves, sortides d'imgToWeb
   (`1.webp, 2.webp…`).
3. Canvia el seu `project.json` (punt 4).
4. A `data/site.json`, a `"projects"`, afegeix el nom de la carpeta on vulguis
   que surti (van del més nou al més vell):

```json
"projects": [
  "ganxillo",
  "tesi",
  …
]
```

**Per treure'n un** de la web sense esborrar-lo, treu-lo d'aquesta llista: la
carpeta es queda i no surt.

---

## 4. Els camps d'un projecte

```json
{
  "$schema": "../../schema/project.json",
  "title": "Trossets",
  "year": 2021,
  "medium": ["generative"],
  "cover": "1",
  "text": [
    "Trossets explores the emergence of diversity…",
    "[[2 3]]",
    "You can browse Trossets on [Filter Blocks](https://…)."
  ],
  "credits": [
    { "role": "Developed at", "name": "Anna Carreras" }
  ]
}
```

| camp | què és | exemple |
|---|---|---|
| `title` | el nom curt: a la portada, al projecte i a Google | `"Trossets"` |
| `year` | l'any, sense cometes | `2021` |
| `medium` | *(opcional)* el suport, al costat de l'any | `["installation", "generative"]` |
| `line` | *(opcional)* una frase sota el títol | `"A game of interlocking blocks."` |
| `cover` | la foto de la portada i de compartir: el seu número | `"1"` |
| `text` | el cos, un paràgraf per línia (a sota, què pot ser cadascun) | |
| `credits` | *(opcional)* la fitxa del final: una línia per rol | `{ "role": "Photos", "name": "Ester Gorgues" }` |
| `links` | *(opcional)* enllaços del projecte | `["[Art Blocks](https://…)"]` |
| `exhibitions` | *(opcional)* on s'ha exposat | `["2022 — Sónar+D, Barcelona"]` |
| `press` | *(opcional)* premsa | `["[El País](https://…)"]` |
| `geek` | *(opcional)* Racó geek: com funciona, un paràgraf per línia | |
| `description` | *(opcional)* el que surt a Google i en compartir. Sense, el primer paràgraf | |

**Cada paràgraf de `text`** pot ser:

| escrius | surt |
|---|---|
| `"Un text amb **negreta**, *cursiva* i un [enllaç](https://…)."` | un paràgraf |
| `"[[3]]"` | la foto `img/3.webp` |
| `"[[3 4 5]]"` | tres fotos juntes, en graella |
| `"[[3 \| el peu de foto]]"` | una foto amb el seu peu |
| `"[[video:5]]"` | el vídeo `img/5.mp4` |
| `"[[vimeo:233722283 \| títol]]"` o `"[[youtube:bNONmWUsA70 \| títol]]"` | el vídeo; **el primer surt a dalt, gran** |
| `"> la cita\nde qui"` | una cita (`\n` és un salt de línia) |
| `"## Un títol"` | un títol |
| `["un", "dos"]` | una llista |
| `{ "tweet": "https://twitter.com/…", "date": "2021-09-11", "text": "…", "photos": ["4", "5"] }` | un tuit |

Per canviar l'ordre, mou els paràgrafs (amb la seva coma).

---

## 5. L'About i el general

- `data/about.json`: `"bio"` (un paràgraf per línia), `"cv"` (per apartats,
  una línia per cosa; si comença per l'any, l'any va a la seva columna) i
  `"upcoming"` (el que ve, a dalt de tot; buit, no surt).
- `data/site.json`: `"name"`, `"description"` (el que surt a Google i en
  compartir la portada), `"social"` (la pàgina Contact:
  `{ "X": "https://x.com/carreras_anna" }`) i la llista de projectes.

**El que surt a Google i en compartir**: el `title` i el primer paràgraf de
cada projecte (o la seva `description`), amb la foto de `cover`; la portada,
amb `name` i `description` de `site.json`.

---

## 6. Les fotos

- Sempre per **imgToWeb**: `.webp`, numerades, a la mida justa.
- Al JSON, per número i entre cometes: `"3"` és `img/3.webp`.
- Per canviar-ne una, substitueix el fitxer amb el mateix número.

---

## 7. Si surt en vermell

Si la boleta surt vermella (o la vista prèvia ensenya un error), **la web
segueix com estava**. També t'arriba un correu de GitHub amb l'error. Els
missatges són en castellà; volen dir:

- **"no es un JSON válido, línea 12"**: gairebé sempre **una coma**. Que en
  falta una entre dues coses, o que en sobra una després de l'última d'una
  llista. O unes cometes sense tancar. Mira aquella línia i la d'abans.
- **"no es un campo de aquí (¿mal escrito?)"**: un camp amb un altre nom
  (`"tittle"`). El missatge diu quins n'hi ha.
- **"dice "7", y no hay ningún work/…/img/7.webp"**: una foto que no hi és.
  Puja-la, o canvia el número.
- **"lists dice "x", y no hay ningún work/x/project.json"**: el nom de la
  llista i el de la carpeta no són iguals.

Arregla-ho, guarda, **Commit** i **Sync**: la boleta torna a verd i el correu
es tanca sol. Si no surt, escriu-nos amb la captura de l'error.
