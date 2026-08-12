"""R7-Freizonen-Check, aus der Element-Geometrie abgeleitet.

Die erlaubten Tintenflaechen werden AUS DEM SVG berechnet, bevor das PNG
gemessen wird: Box-Rahmen (rect +- stroke/2), Segmente (+- stroke/2),
Badge-/X-Kreise (Aussenradius), Marker-Endbereiche, Text-Bounding-Boxen.
Alles andere ist Freizone. Findet das Skript dort Tinte, ist ein Element
ausserhalb seiner geplanten Geometrie gelandet.

Aufruf: python3 zones.py battle_card_76.svg
"""
import sys, re, xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
from qc import collect, text_bbox, NS, num

PAD_BOX = 3.0      # rect stroke 2.5 -> 1.25, plus Rundung/AA
PAD_SEG = 3.0      # arrow stroke 3 -> 1.5, plus AA
# PIL/getlength unterschaetzt die CairoSVG-Renderbreite; gemessen an einem
# 40px-Titel: 1144.2 px gemessen vs 1148.0 px gerendert (~0,6 %). Der
# Textpuffer ist deshalb proportional, nicht konstant.
PAD_TEXT = 3.0
PAD_TEXT_REL = 0.012
# markerUnits=strokeWidth: das 10x10-Markerfenster wird mit stroke-width
# skaliert. Gemessen an CairoSVG 2.9.0 belegt der Marker ein Rechteck von
# markerWidth*sw (rueckwaerts entlang des letzten Segments) mal
# markerHeight*sw (quer, mittig). Ein Kreis um den Endpunkt trifft die Ecken
# nicht -> richtungsabhaengiges Rechteck.
MARKER_W = 10.0
MARKER_H = 10.0
WHITE_TOL = 8      # Abweichung von 255, ab der ein Pixel als Tinte gilt


def stroke_widths(root):
    """stroke-width je Pfad/Kreis mitlesen, statt sie zu raten."""
    segs, circ = [], []
    for el in root.iter():
        tag = el.tag.replace(NS, "")
        sw = float(el.get("stroke-width", 0) or 0)
        if tag == "path":
            pts = [(float(a), float(b)) for a, b in
                   re.findall(r"[ML]\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)", el.get("d", ""))]
            has_marker = el.get("marker-end") is not None
            for i in range(len(pts) - 1):
                segs.append((pts[i], pts[i + 1], sw,
                             has_marker and i == len(pts) - 2))
        elif tag == "line":
            # NACHGETRAGEN: <line> wurde nie verarbeitet. Alle Pfeile, die als
            # <line> statt <path> gezeichnet sind, galten damit als Freizone
            # und erzeugten Streupixel-Fehlalarme (Batch 18).
            p0 = (num(el, "x1"), num(el, "y1"))
            p1 = (num(el, "x2"), num(el, "y2"))
            segs.append((p0, p1, sw, el.get("marker-end") is not None))
        elif tag == "circle":
            circ.append((num(el, "cx"), num(el, "cy"), num(el, "r"), sw))
    return segs, circ


def run(svg):
    png = svg[:-4] + ".png"
    root = ET.parse(svg).getroot()
    rects, texts, _, _ = collect(root)
    segs, circles = stroke_widths(root)

    im = Image.open(png).convert("RGB")
    W, H = im.size
    s = W / 1600.0
    a = np.asarray(im).astype(np.int16)
    ink = (255 - a.min(axis=2)) > WHITE_TOL          # Tinte-Maske
    allowed = np.zeros((H, W), dtype=bool)
    ys, xs = np.mgrid[0:H, 0:W]
    xs = xs / s
    ys = ys / s

    def add_rect(x0, y0, x1, y1):
        allowed[(xs >= x0) & (xs <= x1) & (ys >= y0) & (ys <= y1)] = True

    # Boxen und Zonen: nur der Rahmen traegt Tinte, die Fuellung aber auch
    for r in rects:
        add_rect(r["x0"] - PAD_BOX, r["y0"] - PAD_BOX,
                 r["x1"] + PAD_BOX, r["y1"] + PAD_BOX)
    # Hintergrund-Rect wurde von collect() verworfen -> Titelzeilen separat
    for t in texts:
        x0, y0, x1, y1 = text_bbox(t)
        px = PAD_TEXT + PAD_TEXT_REL * t["width"]
        add_rect(x0 - px, y0 - PAD_TEXT, x1 + px, y1 + PAD_TEXT)
    for (p0, p1, sw, endmark) in segs:
        pad = sw / 2.0 + PAD_SEG
        add_rect(min(p0[0], p1[0]) - pad, min(p0[1], p1[1]) - pad,
                 max(p0[0], p1[0]) + pad, max(p0[1], p1[1]) + pad)
        if endmark:
            dx, dy = p1[0] - p0[0], p1[1] - p0[1]
            L = (dx * dx + dy * dy) ** 0.5
            if L:
                dx, dy = dx / L, dy / L
                vx, vy = xs - p1[0], ys - p1[1]
                t = -(vx * dx + vy * dy)          # rueckwaerts entlang Pfeil
                u = vx * -dy + vy * dx            # quer zum Pfeil
                back, half = MARKER_W * sw, MARKER_H * sw / 2.0
                allowed[(t >= -PAD_SEG) & (t <= back + PAD_SEG) &
                        (abs(u) <= half + PAD_SEG)] = True
    for (cx, cy, r, sw) in circles:
        rad = r + sw / 2.0 + PAD_SEG
        allowed[((xs - cx) ** 2 + (ys - cy) ** 2) <= rad ** 2] = True

    stray = ink & ~allowed
    n = int(stray.sum())
    print(f"== R7 {png}")
    if n:
        yy, xx = np.nonzero(stray)
        pts = sorted({(round(x / s), round(y / s)) for x, y in zip(xx[:400], yy[:400])})
        print(f"   ! {n} Tintenpixel ausserhalb der geplanten Geometrie, z.B. {pts[:6]}")
        return 1
    print("   0 Befunde (keine Tinte ausserhalb der Element-Geometrie)")
    return 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1]))
