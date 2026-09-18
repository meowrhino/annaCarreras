#!/usr/bin/env python3
"""
Scrape annacarreras.com (WordPress REST API) into plain JSON + local assets.

Usage:
    python3 scripts/scrape.py              # scrape the slugs in SLUGS
    python3 scripts/scrape.py --no-assets  # JSON only, skip downloads

Output:
    content/site.json
    content/about.json
    content/projects/index.json
    content/projects/<slug>.json
    assets/projects/<slug>/<file>
"""

import json
import os
import re
import html as htmlmod
import sys
import urllib.request
import urllib.parse
from pathlib import Path

SITE = "https://www.annacarreras.com"
API = SITE + "/wp-json/wp/v2"
ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
ASSETS = ROOT / "assets" / "projects"
ASSET_URL_PREFIX = "/assets/projects"

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

DOWNLOAD_ASSETS = "--no-assets" not in sys.argv


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


def image_size(path):
    with open(path, "rb") as f:
        head = f.read(32)
    try:
        if head[:8] == b"\x89PNG\r\n\x1a\n":
            import struct
            w, h = struct.unpack(">II", head[16:24])
            return int(w), int(h)
        if head[:3] == b"GIF":
            import struct
            w, h = struct.unpack("<HH", head[6:10])
            return int(w), int(h)
        if head[:2] == b"\xff\xd8":
            with open(path, "rb") as f:
                data = f.read()
            i = 2
            while i < len(data) - 9:
                if data[i] != 0xFF:
                    i += 1
                    continue
                marker = data[i + 1]
                if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                              0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    import struct
                    h, w = struct.unpack(">HH", data[i + 5:i + 9])
                    return int(w), int(h)
                if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                    i += 2
                    continue
                import struct
                seg = struct.unpack(">H", data[i + 2:i + 4])[0]
                i += 2 + seg
    except Exception:
        pass
    return None, None


downloaded = {}


def fetch_asset(src, slug):
    """Download to assets/projects/<slug>/, preferring the full-size original."""
    src = abs_url(src)
    name = urllib.parse.unquote(src.rsplit("/", 1)[-1].split("?")[0])
    key = (slug, name)
    if key in downloaded:
        return downloaded[key]
    dest_dir = ASSETS / slug
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
        if not DOWNLOAD_ASSETS:
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
        return {"src": src, "width": None, "height": None}
    w, h = image_size(saved) if saved.exists() else (None, None)
    info = {"src": "%s/%s/%s" % (ASSET_URL_PREFIX, slug, saved.name), "width": w, "height": h}
    downloaded[key] = info
    return info


# ------------------------------------------------------------- blocks -------

def parse_embed(outer, attrs):
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
        return {"type": "embed", "provider": "twitter",
                "id": tid.group(1) if tid else None,
                "url": link,
                "text": plain(quote.group(1)) if quote else None}
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
    alt = attr(img.group(0), "alt") or ""
    block = {"type": "image", "src": info["src"],
             "width": info["width"], "height": info["height"],
             "alt": htmlmod.unescape(alt)}
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
            b = parse_embed(outer, attrs)
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


def scrape_projects(cats, tags):
    known = set(SLUGS)
    index, projects = [], []
    for slug in SLUGS:
        print("  · %s" % slug)
        data = get_json("%s/posts?slug=%s" % (API, urllib.parse.quote(slug)))
        if not data:
            print("    ! not found")
            continue
        p = data[0]
        blocks, credits = parse_content(p["content"]["rendered"], slug, known)
        title = clean_title(p["title"]["rendered"])
        year = year_of(p["title"]["rendered"], credits, p["date"])

        cover = None
        if p.get("featured_media"):
            try:
                media = get_json("%s/media/%d" % (API, p["featured_media"]))
                info = fetch_asset(media["source_url"], slug)
                cover = {"src": info["src"], "width": info["width"],
                         "height": info["height"],
                         "alt": htmlmod.unescape(media.get("alt_text") or "")}
            except Exception as e:
                print("    ! cover: %s" % e)
        if cover is None:
            first = next((b for b in blocks if b["type"] == "image"), None)
            if first:
                cover = {k: first.get(k) for k in ("src", "width", "height", "alt")}

        project = {
            "slug": slug,
            "title": title,
            "year": year,
            "date": p["date"][:10],
            "summary": plain(p["excerpt"]["rendered"]),
            "categories": [cats[c] for c in p.get("categories", []) if c in cats],
            "tags": [tags[t] for t in p.get("tags", []) if t in tags],
            "cover": cover,
            "blocks": blocks,
            "credits": credits,
            "source": p["link"],
        }
        projects.append(project)
        index.append({
            "slug": slug, "title": title, "year": year,
            "summary": project["summary"],
            "categories": project["categories"], "tags": project["tags"],
            "cover": cover,
        })
    return projects, index


# --------------------------------------------------------------- about ------

def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", plain(s).lower())
    return s.strip("-")


def scrape_about(known):
    page = get_json("%s/pages?slug=about" % API)[0]
    markup = page["content"]["rendered"]
    bio, sections, current = [], [], None
    for tag, attrs, outer in top_level_blocks(markup):
        if tag != "p":
            continue
        body = inner(outer)
        h = clean_inline(body, known)
        if not h:
            continue
        # a paragraph that is nothing but bold text opens a new section
        if re.fullmatch(r"<strong>.*</strong>", h):
            name = plain(h)
            if name.lower() == "biography":
                current = None
                continue
            current = {"title": name, "slug": slugify(name), "entries": []}
            sections.append(current)
            continue
        if current is None:
            bio.append(h)
        else:
            text = plain(h)
            m = re.match(r"^(\d{4})", text)
            current["entries"].append({"year": int(m.group(1)) if m else None, "html": h})
    return {
        "title": "About",
        "bio": bio,
        "cv": sections,
        "source": page["link"],
    }


# ---------------------------------------------------------------- main ------

def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("  → %s" % path.relative_to(ROOT))


def main():
    print("Taxonomies…")
    cats = {c["id"]: c["slug"] for c in get_json("%s/categories?per_page=100" % API)}
    tags = {t["id"]: t["slug"] for t in get_json("%s/tags?per_page=100" % API)}

    print("Projects…")
    projects, index = scrape_projects(cats, tags)
    index.sort(key=lambda p: (-p["year"], p["title"].lower()))
    for p in projects:
        write(CONTENT / "projects" / ("%s.json" % p["slug"]), p)
    write(CONTENT / "projects" / "index.json", index)

    print("About…")
    write(CONTENT / "about.json", scrape_about(set(SLUGS)))

    root = get_json(SITE + "/wp-json/")
    write(CONTENT / "site.json", {
        "name": htmlmod.unescape(root["name"]),
        "description": htmlmod.unescape(root["description"]),
        "source": SITE,
        "nav": [
            {"label": "Work", "href": "/"},
            {"label": "About", "href": "/about"},
        ],
    })
    print("Done.")


if __name__ == "__main__":
    main()
