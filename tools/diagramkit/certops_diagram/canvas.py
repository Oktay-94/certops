"""Zeichenfläche mit eingebauter Qualitätsprüfung.

Die Prüfungen laufen bei jedem Aufruf von render() und decken die drei
Fehlerklassen ab, die beim Handzeichnen immer wieder aufgetreten sind:
  1. Text ist breiter oder höher als seine Box
  2. Zwei Knoten überlappen sich
  3. Ein Pfeil läuft quer durch eine fremde Box
Zusätzlich: alles muss innerhalb der Zeichenfläche liegen.
"""
import html
import os
import re

from PIL import ImageFont

from . import theme as T
from .icons import resolve

# DejaVu Sans wird sowohl zum Messen (PIL) als auch zum Rendern (cairosvg)
# gebraucht. Beide müssen dieselbe Datei sehen, sonst prüft die QC gegen eine
# andere Schrift, als am Ende gezeichnet wird.
FONT_DIRS = [
    os.environ.get("CERTOPS_FONT_DIR", ""),
    "/usr/share/fonts/truetype/dejavu",          # Debian, Ubuntu
    "/usr/share/fonts/dejavu",                   # Fedora, Arch
    "/opt/homebrew/share/fonts",                 # Homebrew, Apple Silicon
    "/usr/local/share/fonts",                    # Homebrew, Intel
    os.path.expanduser("~/Library/Fonts"),       # macOS, benutzerinstalliert
    "/Library/Fonts",                            # macOS, systemweit
]
_F = {}
_uid = [0]


def _font_path(bold):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for d in FONT_DIRS:
        if d and os.path.exists(os.path.join(d, name)):
            return os.path.join(d, name)
    raise FileNotFoundError(
        f"{name} nicht gefunden. Gesucht in: {[d for d in FONT_DIRS if d]}. "
        f"Auf macOS: 'brew install --cask font-dejavu', oder Verzeichnis über "
        f"die Umgebungsvariable CERTOPS_FONT_DIR setzen.")


def _font(size, bold):
    key = (size, bold)
    if key not in _F:
        _F[key] = ImageFont.truetype(_font_path(bold), size)
    return _F[key]


def font_report():
    """Welche Schriftdatei benutzt die Messung tatsächlich?"""
    return {"regular": _font_path(False), "bold": _font_path(True)}


def text_width(s, size, bold=False):
    return _font(size, bold).getlength(s)


def _esc(s):
    return html.escape(str(s))


class Finding(Exception):
    pass


class Canvas:
    def __init__(self, width=1600, height=1000, strict=True):
        self.w, self.h = width, height
        self.strict = strict
        self.parts = []          # Zeichenbefehle in Reihenfolge
        self.overlay = []        # kommt zuletzt (Nummernkreise)
        self.nodes = []          # (x, y, w, h, label) für Kollisionsprüfung
        self.groups = []
        self.segments = []       # (x1, y1, x2, y2, label)
        self.findings = []

    # ---------- Bausteine ----------

    def icon(self, name, x, y, size):
        src = open(resolve(name), encoding="utf-8").read()
        vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src)
        vw = float(vb.group(1)) if vb else 64.0
        inner = src[src.index(">", src.index("<svg")) + 1: src.rindex("</svg>")]
        inner = re.sub(r"<title>.*?</title>", "", inner, flags=re.S)
        _uid[0] += 1
        pref = f"i{_uid[0]}_"
        inner = re.sub(r'id="([^"]+)"', lambda m: f'id="{pref}{m.group(1)}"', inner)
        inner = re.sub(r"url\(#([^)]+)\)", lambda m: f"url(#{pref}{m.group(1)})", inner)
        return f'<g transform="translate({x},{y}) scale({size/vw:.5f})">{inner}</g>'

    def text(self, x, y, s, size=T.FS_NODE_SUB, bold=False, fill=T.INK_SOFT, anchor="middle"):
        fw = ' font-weight="bold"' if bold else ""
        self.parts.append(f'<text x="{x}" y="{y}" font-family="{T.FONT}" font-size="{size}"{fw} '
                          f'fill="{fill}" text-anchor="{anchor}">{_esc(s)}</text>')

    def title(self, title, subtitle=None):
        self.text(40, 48, title, T.FS_TITLE, True, T.INK, "start")
        if subtitle:
            self.text(40, 78, subtitle, T.FS_SUBTITLE, False, T.INK_SOFT, "start")

    def group(self, x, y, w, h, icon=None, label=None, color=T.BAND, dash=None,
              isize=22, lsize=T.FS_GROUP, fill="none"):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{T.GROUP_RADIUS}" '
                          f'fill="{fill}" stroke="{color}" stroke-width="1.8"{d}/>')
        if icon:
            self.parts.append(self.icon(icon, x + 14, y + 12, isize))
            self.text(x + 14 + isize + 8, y + 12 + isize - 5, label, lsize, True, color, "start")
        elif label:
            self.text(x + 16, y + 24, label, lsize, True, color, "start")
        self.groups.append((x, y, w, h, label or "Rahmen"))
        # Rahmenbeschriftung belegt Platz: als Sperrfläche für Knoten merken
        if label:
            lw = text_width(label, lsize, True) + (isize + 22 if icon else 16)
            self.nodes.append((x + 4, y + 4, lw, (isize if icon else lsize) + 16,
                               f"Beschriftung '{label}'"))
        return self

    def node(self, x, y, w, h, icon, title, subs=(), isize=T.ICON_DEFAULT,
             tsize=T.FS_NODE_TITLE, ssize=T.FS_NODE_SUB, fill=T.NODE_FILL,
             border=T.NODE_BORDER, bw=T.NODE_BW, title_lines=None, badge=None):
        cx = x + w / 2
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{T.NODE_RADIUS}" '
                          f'fill="{fill}" stroke="{border}" stroke-width="{bw}"/>')
        self.parts.append(self.icon(icon, cx - isize / 2, y + 12, isize))
        ty = y + 12 + isize + 20
        lines = list(title_lines or [title])
        for line in lines:
            self._check_width(line, tsize, True, w - 16, title)
            self.text(cx, ty, line, tsize, True, T.INK)
            ty += tsize + 3
        ty += 4
        for s in subs:
            self._check_width(s, ssize, False, w - 14, title)
            self.text(cx, ty, s, ssize, False, T.INK_SOFT)
            ty += ssize + 3
        last_size = ssize if subs else tsize
        bottom = ty - (last_size + 3) + 0.25 * last_size
        if bottom > y + h:
            self._finding(f"[ZU HOCH] {title}: Text endet bei {bottom:.0f}, Box bei {y + h}")
        self.nodes.append((x, y, w, h, title))
        if badge is not None:
            self.badge(x + 12, y + 12, badge)
        return self

    def hero(self, x, y, w, h, icon, title, subs=(), **kw):
        kw.setdefault("isize", 72)
        kw.setdefault("tsize", T.FS_HERO_TITLE)
        kw.setdefault("ssize", T.FS_HERO_SUB)
        kw.setdefault("fill", T.HERO_FILL)
        kw.setdefault("border", T.HERO_BORDER)
        kw.setdefault("bw", T.HERO_BW)
        return self.node(x, y, w, h, icon, title, subs, **kw)

    def arrow(self, points, dashed=False, color=T.ARROW, both=False, badge=None,
              label=None, label_at=None, check=True):
        d = "M" + " L".join(f"{px},{py}" for px, py in points)
        da = ' stroke-dasharray="8 5"' if dashed else ""
        ms = ' marker-start="url(#ah)"' if both else ""
        mid = "url(#ahr)" if color == T.FAIL else "url(#ah)"
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{T.ARROW_BW}"{da} '
                          f'marker-end="{mid}"{ms} stroke-linejoin="round"/>')
        if check:
            for a, b in zip(points, points[1:]):
                self.segments.append((a[0], a[1], b[0], b[1], label or "Pfeil"))
        if badge is not None:
            p = label_at or points[len(points) // 2]
            self.badge(p[0], p[1], badge)
        if label:
            lx, ly = label_at or ((points[0][0] + points[-1][0]) / 2,
                                  min(points[0][1], points[-1][1]) - 14)
            self.text(lx, ly, label, T.FS_LABEL, False, T.INK_SOFT)
        return self

    def leader(self, points, color=T.LEADER):
        d = "M" + " L".join(f"{px},{py}" for px, py in points)
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.2" '
                          f'stroke-dasharray="4 4"/>')
        return self

    def badge(self, x, y, n):
        self.overlay.append(
            f'<circle cx="{x}" cy="{y}" r="{T.BADGE_R}" fill="#FFFFFF" stroke="{T.INK}" '
            f'stroke-width="1.6"/><text x="{x}" y="{y + 4}" font-family="{T.FONT}" font-size="12" '
            f'font-weight="bold" fill="{T.INK}" text-anchor="middle">{_esc(n)}</text>')
        return self

    def callout(self, x, y, w, h, headline, lines):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" '
                          f'fill="{T.HINT_BG}" stroke="{T.HINT_BORDER}" stroke-width="1.6"/>')
        self.text(x + 20, y + 28, headline, T.FS_GROUP, True, T.HINT_INK, "start")
        ty = y + 52
        for ln in lines:
            self._check_width(ln, T.FS_LABEL, False, w - 40, headline)
            self.text(x + 20, ty, ln, T.FS_LABEL, False, T.HINT_TEXT, "start")
            ty += 20
        self.nodes.append((x, y, w, h, f"Hinweis '{headline}'"))
        return self

    def legend(self, entries, y, heading="Ablauf Schritt für Schritt", cols=3, colw=520):
        self.text(40, y, heading, T.FS_GROUP, True, T.INK, "start")
        per = -(-len(entries) // cols)
        for i, s in enumerate(entries):
            col, row = divmod(i, per)
            self.text(40 + col * colw, y + 25 + row * 21, s, T.FS_LEGEND, False, T.INK_LEGEND, "start")
        return self

    def footer(self, y):
        self.text(40, y, T.FOOTER, T.FS_FOOTER, False, T.INK_MUTED, "start")
        return self

    # ---------- Prüfungen ----------

    def _finding(self, msg):
        self.findings.append(msg)

    def _check_width(self, s, size, bold, maxw, where):
        got = text_width(s, size, bold)
        if got > maxw:
            self._finding(f"[ZU BREIT] {where}: '{s}' = {got:.0f}px > {maxw:.0f}px")

    @staticmethod
    def _overlap(a, b):
        ax, ay, aw, ah, _ = a
        bx, by, bw, bh, _ = b
        return not (ax + aw <= bx or bx + bw <= ax or ay + ah <= by or by + bh <= ay)

    def _check_layout(self):
        for i, a in enumerate(self.nodes):
            for b in self.nodes[i + 1:]:
                if self._overlap(a, b):
                    self._finding(f"[ÜBERLAPPUNG] '{a[4]}' und '{b[4]}'")
            x, y, w, h, name = a
            if x < 0 or y < 0 or x + w > self.w or y + h > self.h:
                self._finding(f"[AUSSERHALB] '{name}' liegt nicht vollständig auf der Fläche")

        for (x1, y1, x2, y2, lab) in self.segments:
            if x1 != x2 and y1 != y2:
                self._finding(f"[SCHRÄG] Pfeilsegment '{lab}' ist weder waagerecht noch senkrecht")
                continue
            for (bx, by, bw, bh, name) in self.nodes:
                if name.startswith("Beschriftung"):
                    continue
                if self._seg_hits(x1, y1, x2, y2, bx, by, bw, bh):
                    self._finding(f"[PFEIL DURCH BOX] '{lab}' läuft durch '{name}'")

    @staticmethod
    def _seg_hits(x1, y1, x2, y2, bx, by, bw, bh, tol=3):
        """Trifft ein achsenparalleles Segment das Innere einer Box?

        Endpunkte, die genau auf dem Rand sitzen, gelten nicht als Treffer —
        so darf ein Pfeil an einer Box andocken, aber nicht hindurchlaufen.
        """
        if y1 == y2:
            if not (by + tol < y1 < by + bh - tol):
                return False
            lo, hi = sorted((x1, x2))
            return max(lo, bx + tol) < min(hi, bx + bw - tol)
        if not (bx + tol < x1 < bx + bw - tol):
            return False
        lo, hi = sorted((y1, y2))
        return max(lo, by + tol) < min(hi, by + bh - tol)

    # ---------- Ausgabe ----------

    def render(self):
        self._check_layout()
        if self.findings and self.strict:
            raise Finding("QC fehlgeschlagen:\n  " + "\n  ".join(self.findings))
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
                f'viewBox="0 0 {self.w} {self.h}">'
                f'<defs>'
                f'<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
                f'markerHeight="7" orient="auto-start-reverse">'
                f'<path d="M0 0 L10 5 L0 10 z" fill="{T.ARROW}"/></marker>'
                f'<marker id="ahr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
                f'markerHeight="7" orient="auto-start-reverse">'
                f'<path d="M0 0 L10 5 L0 10 z" fill="{T.FAIL}"/></marker>'
                f'</defs><rect width="{self.w}" height="{self.h}" fill="{T.BG}"/>')
        return head + "".join(self.parts) + "".join(self.overlay) + "</svg>"

    def save(self, path):
        svg = self.render()
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        return path
