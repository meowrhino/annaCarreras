#!/usr/bin/env python3
"""
Trae proyectos del WordPress de annacarreras.com (su API REST) a la forma de
la casa: work/<slug>/project.json + img/1.webp, 2.webp…

    python3 scripts/scrape.py                  # los de SLUGS que aún no están
    python3 scripts/scrape.py ganxillo discs   # estos

Solo trae lo que no tiene carpeta: lo que ya está en work/ se edita a mano y
no se toca nunca. Las fotos bajan en su tamaño original y las pasa a webp
scripts/webp.mjs (sharp: q85, como imgToWeb); los gif animados y los mp4, a
webm con su fotograma (ffmpeg, como videoToWeb). Después, el slug va a mano en
data/site.json → lists → work, en su sitio (por año), y el "title" corto.

Solo stdlib (y node para las fotos).
"""

import json
import os
import re
import html as htmlmod
import subprocess
import sys
import urllib.request
import urllib.parse
from pathlib import Path

SITE = "https://www.annacarreras.com"
API = SITE + "/wp-json/wp/v2"
ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "work"

SLUGS = [
    "mediate",
    "water-games",
    "hamelin",
    "magia-per-a-pixeloscopi",
    "app-n-jorge-drexler",
    "walking-man",
    "kit-libertad-expresion",
    "my-city-my-playground",
    "3d-forms-sounds",
    "tesi",
    "tops-m",
    "trossets",
    "arrels",
]

# ---------------------------------------------------------------- http ------

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (scraper)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def get_json(url):
    return json.loads(get(url).decode("utf-8"))


# ------------------------------------------------------------ html utils ----

VOID = {"br", "img", "hr", "input", "meta", "source"}
KEEP_INLINE = {"strong", "em", "a", "br", "code", "sup", "sub"}
RENAME = {"b": "strong", "i": "em"}


def top_level_blocks(markup):
    """Yield (tag, attrs_string, outer_html) for every top-level element."""
    i, n = 0, len(markup)
    while i < n:
        lt = markup.find("<", i)
        if lt == -1:
            break
        m = re.match(r"<([a-zA-Z0-9]+)([^>]*)>", markup[lt:])
        if not m:
            i = lt + 1
            continue
        tag, attrs = m.group(1).lower(), m.group(2)
        start = lt
        if tag in VOID or attrs.rstrip().endswith("/"):
            end = lt + m.end()
            yield tag, attrs, markup[start:end]
            i = end
            continue
        # walk forward matching nested same-name tags
        depth, j = 1, lt + m.end()
        open_re = re.compile(r"<%s\b" % tag, re.I)
        close_re = re.compile(r"</%s\s*>" % tag, re.I)
        while depth > 0 and j < n:
            o = open_re.search(markup, j)
            c = close_re.search(markup, j)
            if not c:
                j = n
                break
            if o and o.start() < c.start():
                depth += 1
                j = o.end()
            else:
                depth -= 1
                j = c.end()
        yield tag, attrs, markup[start:j]
        i = j


def attr(attrs, name):
    m = re.search(r'%s="([^"]*)"' % name, attrs)
    return m.group(1) if m else None


def cls(attrs):
    return (attr(attrs, "class") or "").split()


def inner(outer):
    """Strip the outermost element, return its inner html."""
    m = re.match(r"<[a-zA-Z0-9]+[^>]*>(.*)</[a-zA-Z0-9]+\s*>\s*$", outer, re.S)
    return m.group(1) if m else outer


def abs_url(url):
    if not url:
        return url
    url = url.strip()
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return SITE + url
    return url.replace("http://www.annacarreras.com", "https://www.annacarreras.com")


def rewrite_link(url, known_slugs):
    """Internal links to scraped projects become root-relative paths."""
    u = abs_url(url)
    m = re.match(r"https://www\.annacarreras\.com/([^/?#]+)/?$", u)
    if m and m.group(1) in known_slugs:
        return "/" + m.group(1)
    return u


def clean_inline(markup, known_slugs=()):
    """Keep only a small set of inline tags; drop every attribute but href."""
    out = []
    for m in re.finditer(r"<[^>]+>|[^<]+", markup, re.S):
        tok = m.group(0)
        if not tok.startswith("<"):
            # normalise entities to real characters, re-escaping only what HTML needs
            txt = htmlmod.unescape(tok)
            out.append(txt.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            continue
        t = re.match(r"</?([a-zA-Z0-9]+)([^>]*)>", tok)
        if not t:
            continue
        name = RENAME.get(t.group(1).lower(), t.group(1).lower())
        if name not in KEEP_INLINE:
            continue
        closing = tok.startswith("</")
        if closing:
            out.append("</%s>" % name)
        elif name == "br":
            out.append("<br>")
        elif name == "a":
            href = attr(t.group(2), "href")
            if not href:
                continue
            out.append('<a href="%s">' % htmlmod.escape(rewrite_link(href, known_slugs), quote=True))
        else:
            out.append("<%s>" % name)
    s = "".join(out)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"(<br>\s*)+$", "", s).strip()
    return s


def plain(markup):
    s = re.sub(r"<br\s*/?>", " ", markup)
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", htmlmod.unescape(s)).strip()


# --------------------------------------------------------------- assets -----

def original_url(src):
    """Strip WordPress' -WIDTHxHEIGHT suffix to reach the uploaded original."""
    return re.sub(r"-\d{2,4}x\d{2,4}(\.[a-zA-Z0-9]+)$", r"\1", src)


downloaded = {}


def fetch_asset(src, slug):
    """Download to work/<slug>/img/, preferring the full-size original."""
    src = abs_url(src)
    name = urllib.parse.unquote(src.rsplit("/", 1)[-1].split("?")[0])
    key = (slug, name)
    if key in downloaded:
        return downloaded[key]
    dest_dir = WORK / slug / "img"
    dest_dir.mkdir(parents=True, exist_ok=True)
    candidates = []
    orig = original_url(src)
    if orig != src:
        candidates.append(orig)
    candidates.append(src)

    saved = None
    for url in candidates:
        fname = urllib.parse.unquote(url.rsplit("/", 1)[-1].split("?")[0])
        dest = dest_dir / fname
        if dest.exists() and dest.stat().st_size > 0:
            saved = dest
            break
        try:
            data = get(url)
            if len(data) < 100:
                raise ValueError("too small")
            dest.write_bytes(data)
            print("      ↓ %s (%d KB)" % (fname, len(data) // 1024))
            saved = dest
            break
        except Exception as e:
            print("      ! %s: %s" % (fname, e))
    if saved is None:
        return {"src": src}
    info = {"src": saved.name}
    downloaded[key] = info
    return info


# ------------------------------------------------------------- blocks -------

def fetch_tweet(tid, slug):
    """Text, date and media of a tweet from X's public syndication endpoint.

    The oEmbed blockquote WordPress stores has no images, and some posts only
    keep the bare URL because the embed never resolved. Returns {} on failure
    so the blockquote fallback stays in place.
    """
    try:
        d = get_json("https://cdn.syndication.twimg.com/tweet-result?id=%s&lang=en&token=4" % tid)
    except Exception as e:
        print("      ! tweet %s: %s" % (tid, e))
        return {}
    # display_text_range would trim the media link, but its offsets drift with
    # emoji, so drop the media t.co links and expand the rest instead
    text = d.get("text") or ""
    entities = d.get("entities") or {}
    for m in entities.get("media", []):
        text = text.replace(m["url"], "")
    for u in entities.get("urls", []):
        text = text.replace(u["url"], u.get("expanded_url") or u["url"])
    media = []
    for m in d.get("mediaDetails") or []:
        # "small" is ~680px wide: enough for a tweet card, a fraction of the weight
        info = fetch_asset(m["media_url_https"] + "?name=small", slug)
        item = {"src": info["src"]}
        media.append(item)
    out = {"text": htmlmod.unescape(text).strip(), "date": (d.get("created_at") or "")[:10] or None,
           "author": (d.get("user") or {}).get("screen_name")}
    if media:
        out["media"] = media
    return out


def parse_embed(outer, attrs, slug):
    classes = " ".join(cls(attrs))
    iframe = re.search(r"<iframe[^>]*>", outer)
    title = attr(iframe.group(0), "title") if iframe else None
    title = htmlmod.unescape(title) if title else None
    src = attr(iframe.group(0), "src") if iframe else None

    if src and "youtube" in src:
        vid = re.search(r"/embed/([A-Za-z0-9_\-]+)", src)
        return {"type": "embed", "provider": "youtube",
                "id": vid.group(1) if vid else None,
                "url": "https://www.youtube.com/watch?v=%s" % vid.group(1) if vid else src,
                "title": title}
    if src and "vimeo" in src:
        vid = re.search(r"/video/(\d+)", src)
        return {"type": "embed", "provider": "vimeo",
                "id": vid.group(1) if vid else None,
                "url": "https://vimeo.com/%s" % vid.group(1) if vid else src,
                "title": title}
    if "twitter" in classes:
        wrapper = inner(outer)
        link = None
        for m in re.finditer(r'href="(https://twitter\.com/[^"]*/status/\d+[^"]*)"', wrapper):
            link = m.group(1)
        if not link:
            m = re.search(r"(https://twitter\.com/\S+?/status/\d+)", htmlmod.unescape(plain(wrapper)))
            link = m.group(1) if m else None
        if link:
            link = link.split("?")[0]
        quote = re.search(r"<blockquote[^>]*>(.*?)</blockquote>", wrapper, re.S)
        tid = re.search(r"/status/(\d+)", link or "")
        block = {"type": "embed", "provider": "twitter",
                 "id": tid.group(1) if tid else None,
                 "url": link,
                 "text": plain(quote.group(1)) if quote else None}
        if block["id"]:
            block.update(fetch_tweet(block["id"], slug))
        return block
    if src:
        return {"type": "embed", "provider": "iframe", "url": abs_url(src), "title": title}
    return None


def parse_image(outer, slug, known_slugs):
    img = re.search(r"<img[^>]*>", outer)
    if not img:
        return None
    src = attr(img.group(0), "src")
    info = fetch_asset(src, slug)
    caption = re.search(r"<figcaption[^>]*>(.*?)</figcaption>", outer, re.S)
    block = {"type": "image", "src": info["src"]}
    if caption:
        block["caption"] = clean_inline(caption.group(1), known_slugs)
    return block


LABEL_RE = re.compile(r"^([^<>:]{2,45}?):\s")


def parse_credits(markup, known_slugs):
    lines = re.split(r"<br\s*/?>", markup)
    out = []
    for line in lines:
        h = clean_inline(line, known_slugs)
        if not h:
            continue
        text = plain(h)
        m = LABEL_RE.match(text)
        label = None
        if m and "http" not in m.group(1) and "://" not in m.group(1):
            label = m.group(1).strip()
            # drop the label from the html value, keeping inline markup intact
            cut = len(m.group(0))
            consumed, idx = 0, 0
            while consumed < cut and idx < len(h):
                if h[idx] == "<":
                    idx = h.index(">", idx) + 1
                    continue
                step = len(htmlmod.unescape(h[idx]))
                consumed += step
                idx += 1
            h = h[idx:].strip()
        out.append({"label": label, "html": h})
    return out


def parse_content(markup, slug, known_slugs):
    blocks, credits = [], []
    for tag, attrs, outer in top_level_blocks(markup):
        classes = cls(attrs)
        cstr = " ".join(classes)

        if tag == "p":
            body = inner(outer)
            if "has-background" in classes:
                credits = parse_credits(body, known_slugs)
                continue
            h = clean_inline(body, known_slugs)
            if h:
                blocks.append({"type": "text", "html": h})

        elif tag in ("div", "figure") and "wp-block-image" in cstr:
            b = parse_image(outer, slug, known_slugs)
            if b:
                blocks.append(b)

        elif tag == "figure" and "wp-block-video" in cstr:
            v = re.search(r"<video[^>]*>", outer)
            if v:
                info = fetch_asset(attr(v.group(0), "src"), slug)
                blocks.append({"type": "video", "src": info["src"]})

        elif tag == "figure" and "wp-block-embed" in cstr:
            b = parse_embed(outer, attrs, slug)
            if b:
                blocks.append(b)

        elif tag == "blockquote":
            body = inner(outer)
            cite = re.search(r"<cite[^>]*>(.*?)</cite>", body, re.S)
            body_wo = re.sub(r"<cite[^>]*>.*?</cite>", "", body, flags=re.S)
            parts = [clean_inline(inner(o), known_slugs)
                     for t, a, o in top_level_blocks(body_wo) if t == "p"]
            parts = [p for p in parts if p]
            block = {"type": "quote", "html": " ".join(parts) or clean_inline(body_wo, known_slugs)}
            if cite:
                block["cite"] = clean_inline(cite.group(1), known_slugs)
            if block["html"] or block.get("cite"):
                blocks.append(block)

        elif re.fullmatch(r"h[1-6]", tag):
            h = clean_inline(inner(outer), known_slugs)
            if h:
                blocks.append({"type": "heading", "level": int(tag[1]), "html": h})

        elif tag in ("ul", "ol"):
            items = [clean_inline(inner(o), known_slugs)
                     for t, a, o in top_level_blocks(inner(outer)) if t == "li"]
            items = [i for i in items if i]
            if items:
                blocks.append({"type": "list", "ordered": tag == "ol", "items": items})

    return blocks, credits


# ------------------------------------------------------------- project ------

def year_of(title, credits, date):
    m = re.search(r"\{(\d{4})\}", title)
    if m:
        return int(m.group(1))
    years = []
    for c in credits:
        for y in re.findall(r"\b\d{2}\.\d{2}\.(\d{4})\b", plain(c["html"])):
            years.append(int(y))
        for y in re.findall(r"\b(19|20)(\d{2})\b", plain(c["html"])):
            years.append(int(y[0] + y[1]))
    if years:
        return min(years)
    return int(date[:4])


def clean_title(t):
    t = htmlmod.unescape(re.sub(r"<[^>]+>", "", t))
    t = re.sub(r"\s*\{\d{4}\}\s*$", "", t)
    return re.sub(r"\s+", " ", t).strip()


def scrape_project(slug, cats, known):
    """Un post de WordPress → la forma de antes (bloques); to_house la pasa a la de la casa."""
    data = get_json("%s/posts?slug=%s" % (API, urllib.parse.quote(slug)))
    if not data:
        return None
    p = data[0]
    blocks, credits = parse_content(p["content"]["rendered"], slug, known)
    cover = None
    if p.get("featured_media"):
        try:
            media = get_json("%s/media/%d" % (API, p["featured_media"]))
            cover = fetch_asset(media["source_url"], slug)
        except Exception as e:
            print("    ! cover: %s" % e)
    if cover is None:
        cover = next((b for b in blocks if b["type"] == "image"), None)
    return {
        "title": clean_title(p["title"]["rendered"]),
        "year": year_of(p["title"]["rendered"], credits, p["date"]),
        "categories": [cats[c] for c in p.get("categories", []) if c in cats],
        "cover": cover,
        "blocks": blocks,
        "credits": credits,
    }


# ---------------------------------------------------- la forma de la casa ---

def md(h):
    """El html reducido (a, strong, em, br) → el mini-markdown de los JSON."""
    h = re.sub(r'<a href="([^"]*)">(.*?)</a>', lambda m: "[%s](%s)" % (m.group(2), htmlmod.unescape(m.group(1))), h, flags=re.S)
    h = re.sub(r"</?strong>", "**", h)
    h = re.sub(r"</?em>", "*", h)
    h = h.replace("<br>", "\n")
    h = re.sub(r"</?(code|sup|sub)>", "", h)  # shortcut: se pierden (no hay en los 13); si salen, al md
    return htmlmod.unescape(h)


def to_house(p, num):
    """Un proyecto con bloques (lo que da scrape_project, o content/ de antes)
    → project.json. num(src) da el número de cada foto o vídeo en img/."""
    out = {"$schema": "../../schema/project.json", "title": p.get("name") or p["title"], "year": p["year"]}
    medium = p.get("medium") or [re.sub(r"[_-]", " ", c) for c in p["categories"]]
    if medium:
        out["medium"] = medium
    if p.get("line"):
        out["line"] = p["line"]
    if p.get("cover"):
        out["cover"] = num(p["cover"]["src"])
    text = []
    for b in p["blocks"]:
        t, prev = b["type"], (text[-1] if text else None)
        if t == "text":
            text.append(md(b["html"]))
        elif t == "heading":
            text.append("#" * b["level"] + " " + md(b["html"]))
        elif t == "list":
            text.append([md(i) for i in b["items"]])  # shortcut: las numeradas salen con puntos
        elif t == "image":
            n, cap = num(b["src"]), b.get("caption")
            if not cap and isinstance(prev, str) and re.fullmatch(r"\[\[\d+( \d+)*\]\]", prev):
                text[-1] = prev[:-2] + " " + n + "]]"
            else:
                text.append("[[%s%s]]" % (n, " | " + md(cap) if cap else ""))
        elif t == "video":
            text.append("[[video:%s]]" % num(b["src"]))
        elif t == "quote":
            text.append("> " + md(b["html"]) + ("\n" + md(b["cite"]) if b.get("cite") else ""))
        elif b["provider"] in ("youtube", "vimeo"):
            text.append("[[%s:%s%s]]" % (b["provider"], b["id"], " | " + b["title"] if b.get("title") else ""))
        elif b["provider"] == "twitter":
            tw = {"tweet": b["url"]}
            if b.get("date"):
                tw["date"] = b["date"]
            if b.get("text"):
                tw["text"] = b["text"]
            if b.get("media"):
                tw["photos"] = [num(m["src"]) for m in b["media"]]
            text.append(tw)
        else:
            text.append("[[iframe:%s]]" % b["url"])
    out["text"] = text
    rows = [{"role": f["label"], "name": md(f["html"])} for f in p.get("facts", [])]
    rows += [{"role": c["label"], "name": md(c["html"])} for c in p["credits"] if c["label"]]
    press = ["[%s](%s)" % (l["label"], l["url"]) for l in p.get("press", [])]
    press += [md(c["html"]) for c in p["credits"] if not c["label"]]
    links = ["[%s](%s)" % (l["label"], l["url"]) for l in p.get("links", [])]
    for k, v in (("credits", rows), ("links", links), ("exhibitions", p.get("exhibitions")),
                 ("press", press), ("geek", [md(g) for g in p.get("geek", [])])):
        if v:
            out[k] = v
    return out


def numerador():
    """Numera fotos y vídeos por orden de aparición (la portada, la 1)."""
    nums = {}
    def num(src):
        name = src.rsplit("/", 1)[-1]
        return nums.setdefault(name, str(len(nums) + 1))
    return num, nums


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("  → %s" % path.relative_to(ROOT))


def main(slugs):
    cats = {c["id"]: c["slug"] for c in get_json("%s/categories?per_page=100" % API)}
    known = set(slugs) | {d.name for d in WORK.iterdir() if d.is_dir()}
    for slug in slugs:
        if (WORK / slug).exists():
            print("  · %s: ya está en work/, no se toca" % slug)
            continue
        print("  · %s" % slug)
        p = scrape_project(slug, cats, known)
        if not p:
            print("    ! no está en el WordPress")
            continue
        num, nums = numerador()
        house = to_house(p, num)
        img = WORK / slug / "img"
        for name, n in nums.items():
            src = img / name
            if src.exists():
                src.rename(img / (n + src.suffix.lower()))
        for f in img.iterdir():
            if not re.fullmatch(r"\d+\.\w+", f.name):
                f.unlink()  # bajada y sin usar (una versión que no era la que se usa)
        write(WORK / slug / "project.json", house)
        sys.stdout.flush()
        subprocess.run(["node", str(ROOT / "scripts" / "webp.mjs"), str(img)], check=True)
    print("Hecho. Los nuevos, a data/site.json → lists → work, y su \"title\" corto.")


if __name__ == "__main__":
    main(sys.argv[1:] or SLUGS)
