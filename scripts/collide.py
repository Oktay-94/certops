#!/usr/bin/env python3
"""Echter Text-gegen-Text-Kollisionscheck via PIL-Bounding-Boxen.
Ergaenzt den dy<12-Grep, der nur identisches x prueft."""
import re, pathlib, html, itertools
from PIL import ImageFont

FONTS = {
    ("normal", "normal"): "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ("bold", "normal"): "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ("normal", "italic"): "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf",
    ("bold", "italic"): "/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf",
}
cache = {}


def font(weight, style, size):
    key = (weight, style, size)
    if key not in cache:
        cache[key] = ImageFont.truetype(FONTS[(weight, style)], size)
    return cache[key]


def attr(tag, name, default=None):
    m = re.search(rf'{name}="([^"]*)"', tag)
    return m.group(1) if m else default


def parse(pfad):
    t = pathlib.Path(pfad).read_text(encoding="utf-8")
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
        f = font(weight, style, size)
        w = f.getlength(txt)
        if anchor == "middle":
            x0 = x - w / 2
        elif anchor == "end":
            x0 = x - w
        else:
            x0 = x
        # Baseline y: Oberkante ~ y - 0.78*size, Unterkante ~ y + 0.22*size
        out.append({
            "t": txt, "x0": x0, "x1": x0 + w,
            "y0": y - 0.78 * size, "y1": y + 0.22 * size,
            "y": y, "x": x, "size": size, "anchor": anchor,
        })
    return out


def overlap(a, b):
    ox = min(a["x1"], b["x1"]) - max(a["x0"], b["x0"])
    oy = min(a["y1"], b["y1"]) - max(a["y0"], b["y0"])
    return ox, oy


import sys
nummern = [int(a) for a in sys.argv[1:]] or [40, 41, 42]
for n in nummern:
    els = parse(f"battle_card_{n}.svg")
    print("=" * 24, "Karte", n, f"({len(els)} Textelemente)")
    treffer = 0
    for a, b in itertools.combinations(els, 2):
        ox, oy = overlap(a, b)
        if ox > 0 and oy > 0:
            treffer += 1
            print(f"  KOLLISION ox={ox:6.1f} oy={oy:5.1f}")
            print(f"     A y={a['y']:.0f} x[{a['x0']:.0f}..{a['x1']:.0f}] {a['t']!r}")
            print(f"     B y={b['y']:.0f} x[{b['x0']:.0f}..{b['x1']:.0f}] {b['t']!r}")
    if not treffer:
        print("  keine Text-gegen-Text-Kollision")
    print()
