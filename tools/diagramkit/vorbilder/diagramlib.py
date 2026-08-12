#!/usr/bin/env python3
import re, html, os
from PIL import ImageFont

ICON = "/home/claude/icons/package/icons"
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
F_REG = os.path.join(FONT_DIR, "DejaVuSans.ttf")
F_BLD = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
_cache = {}
warnings = []


def w_of(text, size, bold=False):
    key = (size, bold)
    if key not in _cache:
        _cache[key] = ImageFont.truetype(F_BLD if bold else F_REG, size)
    return _cache[key].getlength(text)


def fit(text, size, bold, maxw, where):
    got = w_of(text, size, bold)
    if got > maxw:
        warnings.append(f"[ZU BREIT] {where}: '{text}' = {got:.0f}px > {maxw}px")
    return text


_uid = [0]


def icon(path, x, y, size):
    """Embed an AWS icon, scaled to `size`, top-left at (x, y)."""
    src = open(os.path.join(ICON, path), encoding="utf-8").read()
    vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src)
    vw = float(vb.group(1))
    inner = src[src.index(">", src.index("<svg")) + 1: src.rindex("</svg>")]
    inner = re.sub(r"<title>.*?</title>", "", inner, flags=re.S)
    _uid[0] += 1
    pref = f"i{_uid[0]}_"
    inner = re.sub(r'id="([^"]+)"', lambda m: f'id="{pref}{m.group(1)}"', inner)
    inner = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{pref}{m.group(1)})", inner)
    s = size / vw
    return f'<g transform="translate({x},{y}) scale({s:.5f})">{inner}</g>'


def txt(x, y, s, size, bold=False, fill="#232F3E", anchor="middle"):
    fw = ' font-weight="bold"' if bold else ""
    return (f'<text x="{x}" y="{y}" font-family="DejaVu Sans, Arial, sans-serif" '
            f'font-size="{size}"{fw} fill="{fill}" text-anchor="{anchor}">{html.escape(s)}</text>')


def node(x, y, w, h, ipath, title, subs, isize=48, tsize=12, ssize=11,
         fill="#FFFFFF", border="#B7BDC6", bw=1.2, title_lines=None):
    cx = x + w / 2
    o = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" '
         f'stroke="{border}" stroke-width="{bw}"/>']
    o.append(icon(ipath, cx - isize / 2, y + 12, isize))
    ty = y + 12 + isize + 20
    tl = title_lines or [title]
    for line in tl:
        fit(line, tsize, True, w - 16, title)
        o.append(txt(cx, ty, line, tsize, True))
        ty += tsize + 3
    ty += 4
    for s in subs:
        fit(s, ssize, False, w - 14, title)
        o.append(txt(cx, ty, s, ssize, False, "#5A6570"))
        ty += ssize + 3
    last = ty - (ssize + 3) if subs else ty - (tsize + 3)
    bottom = last + 0.25 * (ssize if subs else tsize)
    if bottom > y + h:
        warnings.append(f"[ZU HOCH] {title}: Text endet bei {bottom:.0f}, Box bei {y+h}")
    return "".join(o)


def group(x, y, w, h, ipath, label, color, dash=None, isize=22, lsize=13):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    o = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="none" '
         f'stroke="{color}" stroke-width="1.8"{d}/>']
    o.append(icon(ipath, x + 14, y + 12, isize))
    o.append(txt(x + 14 + isize + 8, y + 12 + isize - 5, label, lsize, True, color, "start"))
    return "".join(o)


def path(pts, dashed=False, color="#4A5568", both=False):
    d = "M" + " L".join(f"{px},{py}" for px, py in pts)
    da = ' stroke-dasharray="7 5"' if dashed else ""
    ms = ' marker-start="url(#ah)"' if both else ""
    return (f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2"{da} '
            f'marker-end="url(#ah)"{ms} stroke-linejoin="round"/>')


def badge(x, y, n):
    return (f'<circle cx="{x}" cy="{y}" r="11.5" fill="#FFFFFF" stroke="#232F3E" stroke-width="1.6"/>'
            + txt(x, y + 4, str(n), 12, True, "#232F3E"))


