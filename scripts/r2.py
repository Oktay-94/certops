#!/usr/bin/env python3
"""R2: Text gegen Boxgeometrie. Vollstaendig enthalten = ok (Boxzeile).
Teilweise ueberlappend = Befund. Zonenrahmen (fill=none) werden getrennt
gemeldet, weil ein Pfeil-Label sie kreuzen darf (HANDOFF-14 §2.3)."""
import re, pathlib, html, sys
from PIL import ImageFont

FONTS = {
    ("normal", "normal"): "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ("bold", "normal"): "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ("normal", "italic"): "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
    ("bold", "italic"): "/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf",
}
cache = {}


def font(w, s, size):
    k = (w, s, size)
    if k not in cache:
        cache[k] = ImageFont.truetype(FONTS[(w, s)], size)
    return cache[k]


def attr(tag, name, default=None):
    m = re.search(rf'{name}="([^"]*)"', tag)
    return m.group(1) if m else default


def rects(t):
    out = []
    for tag in re.findall(r"<rect[^>]*>", t):
        x, y = attr(tag, " x"), attr(tag, " y")
        if x is None or y is None:
            continue
        x, y = float(x), float(y)
        w = float(attr(tag, "width", "0")), 
        w = float(attr(tag, "width", "0"))
        h = float(attr(tag, "height", "0"))
        fill = attr(tag, "fill", "")
        if h < 60:
            continue
        out.append({"x0": x, "y0": y, "x1": x + w, "y1": y + h,
                    "zone": fill == "none"})
    return out


def texts(t):
    out = []
    for m in re.finditer(r"<text([^>]*)>(.*?)</text>", t, re.S):
        tag, inner = m.group(1), m.group(2)
        txt = html.unescape(re.sub(r"<[^>]+>", "", inner)).strip()
        if not txt:
            continue
        x = float(attr(tag, "x", "0"))
        y = float(attr(tag, "y", "0"))
        size = int(float(attr(tag, "font-size", "16")))
        weight = "bold" if attr(tag, "font-weight") in ("bold", "700") else "normal"
        style = "italic" if attr(tag, "font-style") == "italic" else "normal"
        anchor = attr(tag, "text-anchor", "start")
        w = font(weight, style, size).getlength(txt)
        x0 = x - w / 2 if anchor == "middle" else (x - w if anchor == "end" else x)
        out.append({"t": txt, "x0": x0, "x1": x0 + w,
                    "y0": y - 0.78 * size, "y1": y + 0.22 * size})
    return out


for n in [int(a) for a in sys.argv[1:]] or [43, 44, 45]:
    t = pathlib.Path(f"battle_card_{n}.svg").read_text(encoding="utf-8")
    rs, ts = rects(t), texts(t)
    boxen = [r for r in rs if not r["zone"]]
    zonen = [r for r in rs if r["zone"]]
    print("=" * 24, "Karte", n, f"({len(ts)} Texte, {len(boxen)} Boxen, {len(zonen)} Zonen)")
    treffer = 0
    for el in ts:
        for r in boxen:
            ox = min(el["x1"], r["x1"]) - max(el["x0"], r["x0"])
            oy = min(el["y1"], r["y1"]) - max(el["y0"], r["y0"])
            if ox <= 0 or oy <= 0:
                continue
            drin = (el["x0"] >= r["x0"] and el["x1"] <= r["x1"]
                    and el["y0"] >= r["y0"] and el["y1"] <= r["y1"])
            if drin:
                continue
            treffer += 1
            print(f"  SCHNITT Box x[{r['x0']:.0f}..{r['x1']:.0f}] y[{r['y0']:.0f}..{r['y1']:.0f}]"
                  f" ox={ox:.1f} oy={oy:.1f}")
            print(f"     {el['t']!r} x[{el['x0']:.0f}..{el['x1']:.0f}] y[{el['y0']:.0f}..{el['y1']:.0f}]")
    if not treffer:
        print("  kein Text schneidet eine Inhaltsbox")
    print()
