"""Template "ablauf": ein Zustandsautomat mit Erfolgszeile oben, Fehlerzeile unten.

Passt für Step Functions, jede Orchestrierung mit Weiche und Fehlerpfad, jeden
Ablauf, bei dem der gute Fall geradeaus läuft und der schlechte nach unten
abbiegt.

**Die obere Zeile definiert die Spalten.** Knoten der unteren Zeile setzen sich
per `col` in eine bestehende Spalte — sie erfinden keine eigene. Das ist der
Grund, warum die Karte lesbar ist: Ein Fehlerzustand steht senkrecht unter dem
Schritt, aus dem er entsteht. Dürfte die untere Zeile eigene x-Werte tragen,
ginge diese Ausrichtung beim ersten Umbau verloren.

Gerechnet wird: Spaltenpositionen aus den Breiten der oberen Zeile, Zeilenhöhe
aus dem Inhalt, Abstandsaufschlag an der Rahmengrenze des Automaten, Ausdehnung
des Automatenrahmens aus der Zugehörigkeit der Knoten.
"""
from ..canvas import Canvas, content_height
from .. import theme as T

CANVAS_W = 1600
MARGIN = 40
TOP_MARGIN = 100
W_NODE = 160
GAP_BASE = 28            # Abstand zwischen zwei Spalten
GAP_FRAME = 24           # Aufschlag an der Grenze des Automatenrahmens
ROW_GAP = 55             # senkrechter Abstand der beiden Zeilen
H_ROW_MIN = 110

OUTSIDE_W = 145
OUTSIDE_GAP = 87
MACHINE_TOP = 75         # Automatenrahmen über der oberen Zeile
MACHINE_BOT = 40         # ... unter der unteren Zeile
BAND_GAP = 75
REGION_OVER = 35         # Regionsrahmen über dem Automatenrahmen
CLOUD_OVER = 45          # Wolkenrahmen über dem Regionsrahmen
INSET = 22

COLORS = {
    "cloud": T.CLOUD, "region": T.REGION, "vpc": T.VPC, "accent": T.ACCENT,
    "subnet-private": T.SUBNET_PRIVATE, "datacenter": T.DATACENTER,
    "band": T.BAND, "ok": T.OK, "fail": T.FAIL, "ink-soft": T.INK_SOFT,
}


def _color(name):
    if name in COLORS:
        return COLORS[name]
    if isinstance(name, str) and name.startswith("#"):
        return name
    raise ValueError(f"Unbekannte Farbe '{name}'. Erlaubt: {sorted(COLORS)} oder #RRGGBB")


def _row_height(items, default_isize=44):
    if not items:
        return H_ROW_MIN
    need = [content_height(len(it.get("title_lines") or [it["title"]]),
                           len(it.get("subs", [])), it.get("isize", default_isize),
                           T.FS_NODE_TITLE, it.get("ssize", T.FS_NODE_SUB))
            for it in items]
    return max([H_ROW_MIN] + need)


def build(spec):
    top = spec["top"]
    bottom = spec.get("bottom", [])
    if len(top) < 2:
        raise ValueError("Template 'ablauf' braucht mindestens zwei Spalten in der oberen Zeile")

    for b in bottom:
        if not 0 <= b.get("col", -1) < len(top):
            raise ValueError(
                f"Knoten '{b['title']}' der unteren Zeile nennt Spalte {b.get('col')}, "
                f"es gibt aber nur die Spalten 0 bis {len(top) - 1}. "
                f"Die obere Zeile legt die Spalten fest.")
    used = [b["col"] for b in bottom]
    if len(used) != len(set(used)):
        raise ValueError("Zwei Knoten der unteren Zeile beanspruchen dieselbe Spalte")

    # --- Spalten aus der oberen Zeile ---
    widths = [it.get("w", W_NODE) for it in top]
    xs, x, prev = [], MARGIN + OUTSIDE_W + OUTSIDE_GAP if spec.get("outside_top") else MARGIN, False
    for i, it in enumerate(top):
        here = bool(it.get("machine"))
        if i:
            x += GAP_BASE + (GAP_FRAME if here != prev else 0)
        xs.append(x)
        x += widths[i]
        prev = here
    right = xs[-1] + widths[-1]
    if right > CANVAS_W - MARGIN:
        raise ValueError(f"Die Zeile ist {right - (CANVAS_W - MARGIN):.0f}px zu lang für die Fläche.")

    h_row = max(_row_height(top), _row_height([dict(b) for b in bottom]))
    # Von außen nach innen: Wolke, Region, Automat, Zeile. Fest gesetzt schob
    # sich der Automatenrahmen über die Oberkante der Region. Ohne Automat
    # entfällt sein Platzbedarf — sonst steht die Karte im Leerraum.
    mach = [i for i, it in enumerate(top) if it.get("machine")]
    mach += [b["col"] for b in bottom if b.get("machine")]
    over = MACHINE_TOP if mach else 30
    row_top = TOP_MARGIN + CLOUD_OVER + REGION_OVER + over
    machine_top = row_top - over
    region_top = machine_top - REGION_OVER
    row_bot = row_top + h_row + ROW_GAP

    band = spec.get("crossband") or {}
    band_items = band.get("items", [])
    band_h = 30 + 118 + 14
    band_y = row_bot + h_row + MACHINE_BOT + BAND_GAP
    inner_bottom = band_y + band_h if band_items else row_bot + h_row + MACHINE_BOT

    region_bottom = inner_bottom + 25
    legend_y = region_bottom + INSET + 55
    cols = spec.get("legend_cols", 3)
    rows = -(-len(spec.get("legend", [])) // cols) if spec.get("legend") else 0
    height = legend_y + 25 + rows * 21 + 45

    c = Canvas(CANVAS_W, height, strict=spec.get("strict", True))
    c.title(spec["title"], spec.get("subtitle"))

    # --- Wolke und Region ---
    left = xs[0] - 42
    c.group(left - INSET, region_top - CLOUD_OVER, (right + 42 + INSET) - (left - INSET),
            region_bottom + INSET - (region_top - CLOUD_OVER), "grp-cloud", "AWS Cloud",
            T.CLOUD, isize=24, lsize=14)
    c.group(left, region_top, right + 42 - left, region_bottom - region_top,
            "grp-region", spec.get("region", "Region eu-central-1 (Frankfurt)"), T.REGION)

    # --- Rahmen des Automaten aus der Zugehörigkeit ---
    if mach:
        m = spec.get("machine", {})
        lo, hi = min(mach), max(mach)
        mx = xs[lo] - 25
        mw = xs[hi] + widths[hi] + 25 - mx
        my = machine_top
        mh = row_bot + h_row + MACHINE_BOT - my
        c.group(mx, my, mw, mh, m.get("icon", "stepfunctions"), m["label"],
                _color(m.get("color", "accent")), dash="6 4", isize=24, lsize=14)
        if m.get("note"):
            c.text(mx + 50, my + 47, m["note"], T.FS_LABEL, False, "#8A5A72", "start")

    cy_top = row_top + h_row / 2
    cy_bot = row_bot + h_row / 2
    bcol = {b["col"]: b for b in bottom}

    def draw(it, i, y):
        c.node(xs[i], y, widths[i], h_row, it["icon"], it["title"], it.get("subs", []),
               isize=it.get("isize", 44), ssize=it.get("ssize", T.FS_NODE_SUB),
               title_lines=it.get("title_lines"),
               border=_color(it["accent"]) if it.get("accent") else T.NODE_BORDER,
               bw=2.2 if it.get("accent") else T.NODE_BW)

    step = 1
    # --- Akteur oben links ---
    if spec.get("outside_top"):
        o = spec["outside_top"]
        c.node(MARGIN, cy_top - h_row / 2, OUTSIDE_W, h_row, o["icon"], o["title"],
               o.get("subs", []), isize=42)
        c.arrow([(MARGIN + OUTSIDE_W + 4, cy_top), (xs[0] - 4, cy_top)], badge=step,
                label_at=(MARGIN + OUTSIDE_W + 20, cy_top))
        step += 1

    # --- Obere Zeile: verkettet sich von selbst ---
    for i, it in enumerate(top):
        draw(it, i, row_top)
        if i:
            px = xs[i - 1] + widths[i - 1]
            c.arrow([(px + 4, cy_top), (xs[i] - 4, cy_top)], badge=step,
                    label_at=(px + (xs[i] - px) / 2, cy_top))
            step += 1
        if it.get("note"):
            n = it["note"]
            # Die Notiz gehört über den eingehenden Pfeil, nicht über den Knoten:
            # "gültig" beschriftet den Übergang, nicht den Zielzustand.
            nx = (xs[i - 1] + widths[i - 1] + xs[i]) / 2 if i else xs[i] + widths[i] / 2
            c.text(nx, row_top - 12, n["text"] if isinstance(n, dict) else n,
                   T.FS_LABEL, True,
                   _color(n["color"]) if isinstance(n, dict) and n.get("color") else T.INK_SOFT)

    # --- Untere Zeile ---
    for b in bottom:
        i = b["col"]
        draw(b, i, row_bot)
        cx = xs[i] + widths[i] / 2
        if b.get("from_top"):
            c.arrow([(cx, row_top + h_row + 4), (cx, row_bot - 4)], badge=step,
                    label_at=(cx, row_top + h_row + 26))
            step += 1
            if b.get("from_label"):
                c.text(cx + 22, row_top + h_row + 32, b["from_label"],
                       T.FS_LABEL, True, _color(b.get("from_color", "fail")), "start")

    for b in bottom:
        if b.get("to") is None:
            continue
        i = b["col"]
        if b["to"] == "outside":
            if not spec.get("outside_bottom"):
                raise ValueError(f"'{b['title']}' zeigt auf 'outside', aber 'outside_bottom' fehlt")
            c.arrow([(xs[i] - 4, cy_bot), (MARGIN + OUTSIDE_W + 4, cy_bot)], badge=step,
                    label_at=(xs[i] - 60, cy_bot))
            step += 1
            continue
        j = b["to"]
        if j not in bcol:
            raise ValueError(f"'{b['title']}' zeigt auf Spalte {j}, dort steht kein unterer Knoten")
        if j > i:
            c.arrow([(xs[i] + widths[i] + 4, cy_bot), (xs[j] - 4, cy_bot)], badge=step,
                    label_at=(xs[i] + widths[i] + 25, cy_bot))
        else:
            c.arrow([(xs[i] - 4, cy_bot), (xs[j] + widths[j] + 4, cy_bot)], badge=step,
                    label_at=(xs[i] - 25, cy_bot))
        step += 1

    if spec.get("outside_bottom"):
        o = spec["outside_bottom"]
        c.node(MARGIN, cy_bot - h_row / 2, OUTSIDE_W, h_row, o["icon"], o["title"],
               o.get("subs", []), isize=42)

    # --- Catch-Pfade: gestrichelt, grau, aus einem oberen in einen unteren Zustand ---
    for k in spec.get("catches", []):
        i, j = k["from_col"], k["to_col"]
        if j not in bcol:
            raise ValueError(f"Catch zeigt auf Spalte {j}, dort steht kein unterer Knoten")
        sx = xs[i] + widths[i] / 2
        # Von links kommend links andocken, von rechts kommend rechts: sonst
        # laufen zwei Catch-Pfade im selben Korridor ineinander.
        tx = xs[j] + widths[j] * (0.25 if sx < xs[j] + widths[j] / 2 else 0.75)
        my = row_top + h_row + 30
        c.arrow([(sx, row_top + h_row + 4), (sx, my), (tx, my), (tx, row_bot - 4)],
                dashed=True, color=T.LEADER, check=False)
        c.text((sx + tx) / 2, my - 8, k.get("label", "Catch"), 10, False, T.INK_MUTED)

    if band_items:
        c.crossband(left + 20, band_y, (right + 42 - left) - 40, band_items, band["heading"])

    c.legend(spec.get("legend", []), legend_y,
             spec.get("legend_heading", "Ablauf Schritt für Schritt"),
             cols=cols, colw=spec.get("legend_colw", 520))
    c.footer(height - 15)
    return c
