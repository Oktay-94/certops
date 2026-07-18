#!/usr/bin/env python3
"""QC fuer Battle-Card-SVGs. Geometrie wird DIREKT aus dem SVG geparst.

Aufruf: python3 scripts/qc.py <datei.svg>   (benoetigt Pillow + DejaVu-Fonts)

Pruefungen:
  (a) Textbreiten (PIL getlength) gegen die umgebende Box, 8 px Padding
  (b) Label-Bounding-Box gegen alle Pfeilsegmente
  (c) Segmente gegen Boxen (Liang-Barsky, 6 px Inset)
  (d) Badges: Ziffer passt in den Kreis, Kreis liegt auf einem Segment,
      Ziffern-y = cy + 6

Ausnahmen: gestrichelte Zonen (dasharray 4,4) sind keine Text-Container und
keine Kollisionsobjekte; Badge-Ziffern sind von (a)/(b) ausgenommen; das
Hintergrund-Rect (x=0,y=0) wird ignoriert.
"""
import os, sys, re, xml.etree.ElementTree as ET
from PIL import ImageFont

NS = "{http://www.w3.org/2000/svg}"

# Die SVGs sind in DejaVu Sans gesetzt. Mit einem anderen Font gemessen waeren
# alle Breiten falsch und das Skript wuerde still gruen melden -> lieber
# abbrechen als raten. Suchpfade fuer Linux (Container) und macOS.
FONT_FILES = {
    ("normal", "normal"): "DejaVuSans.ttf",
    ("bold", "normal"):   "DejaVuSans-Bold.ttf",
    ("normal", "italic"): "DejaVuSans-Oblique.ttf",
    ("bold", "italic"):   "DejaVuSans-BoldOblique.ttf",
}
FONT_DIRS = [
    os.environ.get("QC_FONT_DIR", ""),
    "/usr/share/fonts/truetype/dejavu",
    "/opt/homebrew/share/fonts",
    "/usr/local/share/fonts",
    os.path.expanduser("~/Library/Fonts"),
    "/Library/Fonts",
]


def font_path(weight, style):
    name = FONT_FILES[(weight, style)]
    for d in FONT_DIRS:
        if d and os.path.isfile(os.path.join(d, name)):
            return os.path.join(d, name)
    sys.exit(
        f"ABBRUCH: {name} nicht gefunden.\n"
        "  Die Battle-Card-SVGs sind in DejaVu Sans gesetzt; mit einem anderen\n"
        "  Font waeren alle Messwerte falsch.\n"
        "  macOS : brew install --cask font-dejavu\n"
        "  Linux : apt-get install fonts-dejavu\n"
        "  Sonst : Verzeichnis per QC_FONT_DIR=<pfad> angeben.\n"
        f"  Durchsucht: {[d for d in FONT_DIRS if d]}"
    )


_cache = {}


def font(size, weight="normal", style="normal"):
    key = (round(size), weight, style)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(font_path(weight, style), round(size))
    return _cache[key]


def num(el, attr, default=0.0):
    v = el.get(attr)
    return float(v) if v is not None else default


def collect(root):
    rects, texts, segs, circles = [], [], [], []
    for el in root.iter():
        tag = el.tag.replace(NS, "")
        if tag == "rect":
            x, y, w, h = num(el, "x"), num(el, "y"), num(el, "width"), num(el, "height")
            if x == 0 and y == 0 and w >= 1600:
                continue  # Hintergrund
            rects.append({"x0": x, "y0": y, "x1": x + w, "y1": y + h,
                          "dash": el.get("stroke-dasharray", ""),
                          "zone": el.get("stroke-dasharray", "") == "4,4"})
        elif tag == "text":
            size = num(el, "font-size", 15)
            weight = el.get("font-weight", "normal")
            style = el.get("font-style", "normal")
            width = 0.0
            parts = []
            if el.text:
                parts.append((el.text, weight, style))
            for child in el:
                if child.text:
                    parts.append((child.text, child.get("font-weight", weight),
                                  child.get("font-style", style)))
                if child.tail:
                    parts.append((child.tail, weight, style))
            label = "".join(p[0] for p in parts).strip()
            for txt, w_, s_ in parts:
                width += font(size, w_, s_).getlength(txt)
            texts.append({"x": num(el, "x"), "y": num(el, "y"), "size": size,
                          "anchor": el.get("text-anchor", "start"),
                          "text": label, "width": width})
        elif tag == "line":
            segs.append((num(el, "x1"), num(el, "y1"), num(el, "x2"), num(el, "y2")))
        elif tag == "path":
            d = el.get("d", "")
            pts = re.findall(r"[ML]\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)", d)
            pts = [(float(a), float(b)) for a, b in pts]
            for i in range(len(pts) - 1):
                segs.append((pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]))
        elif tag == "circle":
            circles.append({"cx": num(el, "cx"), "cy": num(el, "cy"), "r": num(el, "r"),
                            "fill": el.get("fill", ""), "stroke": el.get("stroke", "")})
    return rects, texts, segs, circles


def text_bbox(t):
    if t["anchor"] == "middle":
        x0, x1 = t["x"] - t["width"] / 2, t["x"] + t["width"] / 2
    elif t["anchor"] == "end":
        x0, x1 = t["x"] - t["width"], t["x"]
    else:
        x0, x1 = t["x"], t["x"] + t["width"]
    return x0, t["y"] - t["size"] * 0.80, x1, t["y"] + t["size"] * 0.22


def liang_barsky(x0, y0, x1, y1, r):
    dx, dy = x1 - x0, y1 - y0
    p = [-dx, dx, -dy, dy]
    q = [x0 - r["x0"], r["x1"] - x0, y0 - r["y0"], r["y1"] - y0]
    u0, u1 = 0.0, 1.0
    for pi, qi in zip(p, q):
        if pi == 0:
            if qi < 0:
                return False
        else:
            t = qi / pi
            if pi < 0:
                u0 = max(u0, t)
            else:
                u1 = min(u1, t)
    return u0 <= u1


def main(path):
    root = ET.parse(path).getroot()
    rects, texts, segs, circles = collect(root)
    boxes = [r for r in rects if not r["zone"]]
    findings = []

    badge_texts = set()
    for i, t in enumerate(texts):
        for c in circles:
            if abs(t["x"] - c["cx"]) < 1 and abs(t["y"] - (c["cy"] + 6)) < 1:
                badge_texts.add(i)

    # (a) Textbreiten gegen die kleinste umgebende Box
    for i, t in enumerate(texts):
        if i in badge_texts:
            continue
        bx0, by0, bx1, by1 = text_bbox(t)
        cont = [b for b in boxes
                if b["x0"] <= t["x"] <= b["x1"] and b["y0"] <= t["y"] <= b["y1"]]
        if not cont:
            continue
        box = min(cont, key=lambda b: (b["x1"] - b["x0"]) * (b["y1"] - b["y0"]))
        if bx0 < box["x0"] + 8 or bx1 > box["x1"] - 8 or by0 < box["y0"] + 4 or by1 > box["y1"] - 4:
            findings.append(
                f"(a) Text '{t['text']}' [{bx0:.0f}..{bx1:.0f} x {by0:.0f}..{by1:.0f}] "
                f"sprengt Box [{box['x0']:.0f}..{box['x1']:.0f} x {box['y0']:.0f}..{box['y1']:.0f}]")

    # (b) freie Labels gegen alle Segmente.
    # Zonen (dasharray 4,4) sind KEINE Text-Container -> ihre Texte gelten als
    # freie Labels und werden hier mitgeprueft. Nur echte Boxen nehmen aus.
    for i, t in enumerate(texts):
        if i in badge_texts:
            continue
        if any(b["x0"] <= t["x"] <= b["x1"] and b["y0"] <= t["y"] <= b["y1"] for b in boxes):
            continue
        bx0, by0, bx1, by1 = text_bbox(t)
        r = {"x0": bx0, "y0": by0, "x1": bx1, "y1": by1}
        for s in segs:
            if liang_barsky(*s, r):
                findings.append(f"(b) Label '{t['text']}' kreuzt Segment {s}")

    # (c) Segmente gegen Boxen, 6 px Inset
    for s in segs:
        for b in boxes:
            inset = {"x0": b["x0"] + 6, "y0": b["y0"] + 6, "x1": b["x1"] - 6, "y1": b["y1"] - 6}
            if inset["x0"] >= inset["x1"] or inset["y0"] >= inset["y1"]:
                continue
            if liang_barsky(*s, inset):
                findings.append(
                    f"(c) Segment {s} laeuft durch Box "
                    f"[{b['x0']:.0f}..{b['x1']:.0f} x {b['y0']:.0f}..{b['y1']:.0f}]")

    # (d) Badges. Nummern-Badges sind laut Stil-Guide randlos und in der
    # Linienfarbe gefuellt. Weiss gefuellte Kreise mit Rand sind das rote X
    # des verworfenen Pfades und keine Badges.
    badges = [c for c in circles
              if not c["stroke"] and c["fill"].upper() not in ("#FFFFFF", "WHITE", "NONE", "")]
    for c in badges:
        hit = [i for i in badge_texts
               if abs(texts[i]["x"] - c["cx"]) < 1 and abs(texts[i]["y"] - (c["cy"] + 6)) < 1]
        if not hit:
            findings.append(f"(d) Badge-Kreis ({c['cx']:.0f},{c['cy']:.0f}) ohne Ziffer bei y=cy+6")
            continue
        t = texts[hit[0]]
        if t["width"] > 2 * c["r"] - 6:
            findings.append(f"(d) Ziffer '{t['text']}' zu breit fuer Kreis r={c['r']}")
        on_seg = False
        for x0, y0, x1, y1 in segs:
            dx, dy = x1 - x0, y1 - y0
            L2 = dx * dx + dy * dy
            if L2 == 0:
                continue
            u = max(0.0, min(1.0, ((c["cx"] - x0) * dx + (c["cy"] - y0) * dy) / L2))
            px, py = x0 + u * dx, y0 + u * dy
            if (px - c["cx"]) ** 2 + (py - c["cy"]) ** 2 <= 4:
                on_seg = True
                break
        if not on_seg:
            findings.append(f"(d) Badge ({c['cx']:.0f},{c['cy']:.0f}) liegt auf keinem Segment")

    print(f"== {path}")
    print(f"   {len(boxes)} Boxen, {len(texts)} Texte, {len(segs)} Segmente, {len(badges)} Badges")
    if findings:
        for f in findings:
            print("   ! " + f)
        print(f"   {len(findings)} BEFUNDE")
        return 1
    print("   0 Befunde")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
