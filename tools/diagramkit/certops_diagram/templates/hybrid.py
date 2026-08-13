"""Template "hybrid": Rechenzentrum links, Brücke in der Mitte, AWS rechts.

Die Grundform aller Hybrid-Szenarien: Etwas steht im eigenen Haus, etwas steht
in der Cloud, und dazwischen liegt eine Verbindung. Im Masterplan trägt der
Block „Migration & Hybrid" allein zehn Karten, dazu kommen verstreute Fälle —
Outposts, Storage Gateway, Snowball Edge, VPN und Direct Connect, DMS, DRS.

**Das Raster im Rechenzentrum bricht automatisch um.** Die Spaltenzahl folgt aus
der verfügbaren Breite, die Zeilenzahl aus der Anzahl der Knoten. Ein
handgesetztes 2×2 wäre für genau eine Karte richtig und für die neunzehn
anderen falsch.

Rechts liegen ein oder mehrere **Bänder** — waagerechte Abschnitte mit eigener
Überschrift, jeweils eine Kette gleichartiger Knoten. Der zentrale Dienst der
Karte steht als **Hero** rechts daneben und wird von allen Bändern erreicht;
seine Höhe folgt aus der Zahl der Bänder, die er überspannt.
"""
from ..canvas import Canvas, content_height
from .. import theme as T

CANVAS_W = 1600
MARGIN = 30
TOP_MARGIN = 100

DC_X = 30                # Rechenzentrum
DC_W = 310
DC_PAD = 16
DC_GAP = 10
DC_NODE_W = 130

BRIDGE_X = 360
BRIDGE_W = 160
BRIDGE_GAP = 35

BAND_X = 585             # erste Spalte der Bänder
BAND_NODE_W = 180
BAND_GAP_X = 25
BAND_GAP_Y = 55          # senkrechter Abstand zweier Bänder
BAND_LABEL = 25          # Platz für die Bandüberschrift

HERO_GAP = 111
HERO_W = 210

CROSS_GAP = 45
CLOUD_OVER = 55
INSET = 23

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


def _h(items, isize, tsize=T.FS_NODE_TITLE, ssize=T.FS_NODE_SUB, floor=110):
    if not items:
        return floor
    return max([floor] + [content_height(len(it.get("title_lines") or [it["title"]]),
                                         len(it.get("subs", [])), it.get("isize", isize),
                                         tsize, it.get("ssize", ssize))
                          for it in items])


def _grid(n, width, node_w, gap, pad):
    """Wie viele Spalten passen nebeneinander, und wie viele Zeilen ergibt das?

    Der Kern des Templates: Bei vier Knoten entsteht 2×2, bei fünf 2×3, bei
    zwei 2×1. Nichts davon steht in der Spec.
    """
    usable = width - 2 * pad
    cols = max(1, int((usable + gap) // (node_w + gap)))
    cols = min(cols, n)
    rows = -(-n // cols)
    return cols, rows


def build(spec):
    bands = spec["bands"]
    if not bands:
        raise ValueError("Template 'hybrid' braucht mindestens ein Band")
    dc = spec.get("datacenter") or {}
    dc_nodes = dc.get("nodes", [])
    bridge = spec.get("bridge", [])
    hero = spec.get("hero")
    band_items = (spec.get("crossband") or {}).get("items", [])

    # --- Höhen aus dem Inhalt ---
    h_dc = _h(dc_nodes, 40, ssize=11, floor=115)
    h_bridge = _h(bridge, 44, floor=115)
    h_band = max(_h(b["nodes"], T.ICON_DEFAULT, floor=115) for b in bands)

    cols, rows = _grid(len(dc_nodes), DC_W, DC_NODE_W, DC_GAP, DC_PAD) if dc_nodes else (0, 0)
    dc_node_w = ((DC_W - 2 * DC_PAD - (cols - 1) * DC_GAP) / cols) if cols else 0

    # --- Senkrechte Anordnung ---
    band_top = TOP_MARGIN + CLOUD_OVER + 78
    band_ys, y = [], band_top
    for _ in bands:
        band_ys.append(y)
        y += h_band + BAND_GAP_Y + BAND_LABEL
    bands_bottom = band_ys[-1] + h_band

    band_w = max(len(b["nodes"]) for b in bands) * BAND_NODE_W \
        + (max(len(b["nodes"]) for b in bands) - 1) * BAND_GAP_X
    hero_x = BAND_X + band_w + HERO_GAP
    right = hero_x + HERO_W if hero else BAND_X + band_w
    if right > CANVAS_W - MARGIN:
        raise ValueError(
            f"Die Bänder sind {right - (CANVAS_W - MARGIN):.0f}px zu breit. "
            f"Weniger Knoten je Band, oder den Hero weglassen.")

    cross_h = 30 + 118 + 14
    cross_y = bands_bottom + CROSS_GAP
    inner_bottom = cross_y + cross_h if band_items else bands_bottom
    region_bottom = inner_bottom + 25

    # Die linke Seite steht außerhalb der Region und darf die Fläche trotzdem
    # verlängern. Ohne diese Rechnung passte die Druckfassung und die kürzere
    # Web-Fassung schnitt den Akteur ab.
    dc_y = band_ys[0] + 30
    grid_h = rows * h_dc + (rows - 1) * DC_GAP if rows else 0
    dc_bottom = dc_y + grid_h
    bridge_bottom = dc_y + len(bridge) * h_bridge + max(0, len(bridge) - 1) * BRIDGE_GAP
    actor = dc.get("actor")
    h_actor = _h([actor], 42, floor=115) if actor else 0
    actor_bottom = dc_bottom + 55 + h_actor if actor else 0
    left_bottom = max(dc_bottom, bridge_bottom, actor_bottom)

    legend_y = max(region_bottom + INSET, left_bottom + 20) + 55
    lcols = spec.get("legend_cols", 3)
    lrows = -(-len(spec.get("legend", [])) // lcols) if spec.get("legend") else 0
    height = legend_y + 25 + lrows * 21 + 45

    c = Canvas(CANVAS_W, height, strict=spec.get("strict", True))
    c.title(spec["title"], spec.get("subtitle"))

    region_left = BAND_X - 40
    region_right = right + 25
    region_top = TOP_MARGIN + CLOUD_OVER
    c.group(region_left - INSET, TOP_MARGIN, (region_right + INSET) - (region_left - INSET),
            region_bottom + INSET - TOP_MARGIN, "grp-cloud", "AWS Cloud", T.CLOUD,
            isize=24, lsize=14)
    c.group(region_left, region_top, region_right - region_left, region_bottom - region_top,
            "grp-region", spec.get("region", "Region eu-central-1 (Frankfurt)"), T.REGION)

    # --- Rechenzentrum mit automatischem Umbruch ---
    if dc_nodes:
        c.group(DC_X, dc_y - 60, DC_W, grid_h + 80, "grp-datacenter",
                dc.get("label", "Rechenzentrum vor Ort"), T.DATACENTER)
        for k, n in enumerate(dc_nodes):
            r, col = divmod(k, cols)
            nx = DC_X + DC_PAD + col * (dc_node_w + DC_GAP)
            ny = dc_y + r * (h_dc + DC_GAP)
            c.node(nx, ny, dc_node_w, h_dc, n["icon"], n["title"], n.get("subs", []),
                   isize=n.get("isize", 40), ssize=n.get("ssize", 11),
                   title_lines=n.get("title_lines"))

    step = 1
    # --- Brücke ---
    by = dc_y
    bridge_cy = []
    for k, n in enumerate(bridge):
        yy = by + k * (h_bridge + BRIDGE_GAP)
        c.node(BRIDGE_X, yy, BRIDGE_W, h_bridge, n["icon"], n["title"], n.get("subs", []),
               isize=n.get("isize", 44), ssize=n.get("ssize", 11),
               title_lines=n.get("title_lines"))
        bridge_cy.append(yy + h_bridge / 2)

    # --- Bänder: erst alle Knoten zeichnen ---
    band_node_cy = []
    for bi, b in enumerate(bands):
        y0 = band_ys[bi]
        c.text(BAND_X, y0 - 15, b["label"], T.FS_GROUP, True, T.ACCENT, "start")
        cy = y0 + h_band / 2
        band_node_cy.append(cy)
        for k, n in enumerate(b["nodes"]):
            nx = BAND_X + k * (BAND_NODE_W + BAND_GAP_X)
            c.node(nx, y0, BAND_NODE_W, h_band, n["icon"], n["title"], n.get("subs", []),
                   isize=n.get("isize", T.ICON_DEFAULT), ssize=n.get("ssize", T.FS_NODE_SUB),
                   title_lines=n.get("title_lines"))

    if hero:
        c.hero(hero_x, band_ys[0], HERO_W, bands_bottom - band_ys[0], hero["icon"],
               hero["title"], hero.get("subs", []), title_lines=hero.get("title_lines"))

    if actor:
        ah = h_actor
        ax, ay = DC_X + 75, dc_bottom + 55
        c.node(ax, ay, 160, ah, actor["icon"], actor["title"], actor.get("subs", []),
               isize=actor.get("isize", 42))

    # --- Danach die Pfeile, Band für Band in Erzählreihenfolge ---
    # Zeichenreihenfolge ist nicht Lesereihenfolge: Ohne diese Trennung bekäme
    # der Hero die 1 und die Standleitung die 3.
    corridor_b = (BRIDGE_X + BRIDGE_W + BAND_X) / 2
    corridor_a = BAND_X - 55

    for bi, b in enumerate(bands):
        cy = band_node_cy[bi]

        for k, n in enumerate(bridge):
            if n.get("to_band", 0) != bi:
                continue
            sy = bridge_cy[k]
            if abs(sy - cy) < 6:
                pts = [(BRIDGE_X + BRIDGE_W + 4, cy), (BAND_X - 4, cy)]
            else:
                pts = [(BRIDGE_X + BRIDGE_W + 4, sy), (corridor_b, sy),
                       (corridor_b, cy), (BAND_X - 4, cy)]
            c.arrow(pts, badge=step, label_at=(corridor_b, (sy + cy) / 2), check=False)
            step += 1
            if dc_nodes:
                c.arrow([(DC_X + DC_W + 4, sy), (BRIDGE_X - 4, sy)], check=False)

        if actor and actor.get("to_band", min(1, len(bands) - 1)) == bi:
            acy = dc_bottom + 55 + h_actor / 2
            c.arrow([(DC_X + 75 + 160 + 4, acy), (corridor_a, acy),
                     (corridor_a, cy), (BAND_X - 4, cy)],
                    both=actor.get("both", False), badge=step,
                    label_at=(corridor_a, acy - 30), check=False)
            step += 1

        for k in range(1, len(b["nodes"])):
            nx = BAND_X + k * (BAND_NODE_W + BAND_GAP_X)
            px = nx - BAND_GAP_X
            c.arrow([(px + 4, cy), (nx - 4, cy)], badge=step,
                    label_at=(px + BAND_GAP_X / 2, cy))
            step += 1

        if hero:
            lastx = BAND_X + (len(b["nodes"]) - 1) * (BAND_NODE_W + BAND_GAP_X) + BAND_NODE_W
            c.arrow([(lastx + 4, cy), (hero_x - 4, cy)], badge=step,
                    label_at=(lastx + (hero_x - lastx) / 2, cy))
            step += 1
            if b.get("hero_note"):
                c.text(lastx + (hero_x - lastx) / 2, cy - 18, b["hero_note"],
                       T.FS_LABEL, False, T.INK_SOFT)

    # --- Rückweg des Hero, falls die Karte einen hat ---
    if hero and hero.get("return_to_band") is not None:
        bi = hero["return_to_band"]
        cy = band_node_cy[bi]
        back_y = bands_bottom + 22
        c.arrow([(hero_x + HERO_W / 2, bands_bottom + 4), (hero_x + HERO_W / 2, back_y),
                 (BAND_X + BAND_NODE_W / 2, back_y),
                 (BAND_X + BAND_NODE_W / 2, cy + h_band / 2 + 4)],
                dashed=True, badge=step, label_at=((hero_x + BAND_X) / 2, back_y),
                check=False)
        c.text((hero_x + BAND_X) / 2 + 150, back_y - 8, hero.get("return_note", ""),
               T.FS_LABEL, False, T.INK_SOFT)
        step += 1

    if band_items:
        c.crossband(region_left + 12, cross_y, (region_right - region_left) - 24,
                    band_items, spec["crossband"]["heading"])

    c.legend(spec.get("legend", []), legend_y,
             spec.get("legend_heading", "Datenfluss Schritt für Schritt"),
             cols=lcols, colw=spec.get("legend_colw", 520))
    c.footer(height - 15)
    return c
