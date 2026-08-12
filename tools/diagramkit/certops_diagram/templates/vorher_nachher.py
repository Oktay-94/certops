"""Template "vorher_nachher": zwei gestapelte Paneele, kaputt oben, repariert unten.

Passt für jede Fehlersuch-Karte: Warum funktioniert das nicht, und was genau
ändert sich, damit es funktioniert. Der didaktische Wert entsteht erst dadurch,
dass beide Hälften **dasselbe Skelett** zeigen und sich nur an den Stellen
unterscheiden, um die es geht. Deshalb wird das Grundgerüst genau einmal in der
Spec beschrieben (`base`) und je Panel nur das Delta (`panels`).

Wäre das Gerüst zweimal beschreibbar, würden die Hälften über die Zeit
auseinanderdriften und die Karte verlöre genau die Eigenschaft, für die es sie
gibt. Das ist der Grund, warum hier bewusst weniger in der Spec steht.

Gerechnet wird: Panelhöhe aus dem Inhalt, Position der Zusatzknoten im Subnetz,
Höhe des Einschubs aus der Zeilenzahl.
"""
from ..canvas import Canvas, content_height, text_width
from .. import theme as T

CANVAS_W = 1600
MARGIN = 40
PANEL_W = CANVAS_W - 2 * MARGIN
PANEL_GAP = 30

HEAD_H = 55              # Kopfzeile des Panels bis zum Regionsrahmen
REGION_PAD = 20
NODE_DY = 110            # Regionsoberkante bis Knotenzeile
LEFT_X = 90
LEFT_W = 200
CORRIDOR = 110           # Luft zwischen linkem Knoten und VPC-Rahmen
VPC_X = 730              # feste Spalte: beide Paneele müssen deckungsgleich sein
VPC_W = 780
SUB_PAD = 25
INNER_DX = 35            # Abstand Subnetzkante zum inneren Knoten
GAP_NODE = 55
INSERT_GAP = 35
INSERT_W = 260

COLORS = {
    "cloud": T.CLOUD, "region": T.REGION, "vpc": T.VPC,
    "subnet-private": T.SUBNET_PRIVATE, "subnet-public": T.SUBNET_PUBLIC,
    "datacenter": T.DATACENTER, "band": T.BAND, "accent": T.ACCENT,
    "ok": T.OK, "fail": T.FAIL,
}


def _color(name):
    if name in COLORS:
        return COLORS[name]
    if isinstance(name, str) and name.startswith("#"):
        return name
    raise ValueError(f"Unbekannte Farbe '{name}'. Erlaubt: {sorted(COLORS)} oder #RRGGBB")


def _h(it, isize=44):
    return content_height(len(it.get("title_lines") or [it["title"]]),
                          len(it.get("subs", [])), it.get("isize", isize),
                          T.FS_NODE_TITLE, it.get("ssize", T.FS_NODE_SUB))


def build(spec):
    base = spec["base"]
    panels = spec["panels"]
    if len(panels) != 2:
        raise ValueError(f"Template 'vorher_nachher' braucht genau zwei Paneele, nicht {len(panels)}")
    states = [p.get("state") for p in panels]
    if states != ["broken", "fixed"]:
        raise ValueError("Die Paneele müssen in der Reihenfolge 'broken', 'fixed' stehen — "
                         "die Karte erzählt erst das Problem, dann die Lösung")

    left, inner = base["left"], base["inner"]

    # --- Höhen aus dem Inhalt ---
    all_nodes = [left, inner] + [e for p in panels for e in p.get("extras", [])]
    h_node = max(110, max(_h(n) for n in all_nodes))

    def insert_height(ins):
        """Beide Einschub-Arten auf ein Maß gebracht: der gestrichelte
        Fehlkasten wächst mit der Zeilenzahl, der Knoten mit seinem Inhalt."""
        if ins.get("kind") == "gap":
            return 46 + len(ins["lines"]) * 24
        return _h(ins, 40)

    ins_h = max((insert_height(p["insert"]) for p in panels if p.get("insert")), default=0)

    node_y_rel = HEAD_H + NODE_DY
    ins_y_rel = node_y_rel + h_node + INSERT_GAP
    region_h = (ins_y_rel + ins_h + 40 if ins_h else node_y_rel + h_node + 40) - HEAD_H
    panel_h = HEAD_H + region_h + 25

    legend = spec.get("legend", [])
    cols = spec.get("legend_cols", 2)
    legend_y = 140 + 2 * panel_h + PANEL_GAP + 45
    rows = -(-len(legend) // cols) if legend else 0
    height = legend_y + 25 + rows * 21 + 45

    c = Canvas(CANVAS_W, height, strict=spec.get("strict", True))
    c.title(spec["title"], spec.get("subtitle"))

    step = 1
    for pi, p in enumerate(panels):
        top = 140 + pi * (panel_h + PANEL_GAP)
        broken = p["state"] == "broken"
        edge = T.FAIL if broken else T.OK
        tint = "#FDF6F5" if broken else "#F5FAF3"

        c.parts.append(f'<rect x="{MARGIN}" y="{top}" width="{PANEL_W}" height="{panel_h}" rx="10" '
                       f'fill="{tint}" stroke="{edge}" stroke-width="1.6"/>')
        c._check_width(p["headline"], 16, True, PANEL_W - 40, "Panelüberschrift")
        c.text(MARGIN + 20, top + 34, p["headline"], 16, True, edge, "start")

        c.group(MARGIN + 20, top + HEAD_H, PANEL_W - 40, region_h, "grp-region",
                base.get("region", "Region eu-central-1"), T.REGION)

        node_y = top + node_y_rel
        cy_fwd = node_y + h_node * 0.30
        cy_back = node_y + h_node * 0.78

        c.node(LEFT_X, node_y, LEFT_W, h_node, left["icon"], left["title"],
               left.get("subs", []), isize=left.get("isize", 44),
               title_lines=left.get("title_lines"))

        # --- VPC und Subnetz, in beiden Paneelen deckungsgleich ---
        # Die Oberkanten folgen aus der Knotenzeile, nicht aus festen Abständen:
        # sonst schiebt sich die Rahmenbeschriftung bei flachen Knoten in die
        # oberste Box hinein.
        sub_top = node_y - 48
        vpc_top = sub_top - 42
        region_bottom = top + HEAD_H + region_h
        c.group(VPC_X, vpc_top, VPC_W, region_bottom - 25 - vpc_top,
                "grp-vpc", base.get("vpc_label", "VPC"), T.VPC, isize=20, lsize=12)
        sub_x = VPC_X + SUB_PAD
        sub_w = VPC_W - 2 * SUB_PAD
        c.group(sub_x, sub_top, sub_w, h_node + 78, "grp-private-subnet",
                base.get("subnet_label", "Privates Subnetz"), T.SUBNET_PRIVATE, isize=18, lsize=11)

        inner_x = sub_x + INNER_DX
        inner_w = inner.get("w", 200)
        c.node(inner_x, node_y, inner_w, h_node, inner["icon"], inner["title"],
               inner.get("subs", []), isize=inner.get("isize", 44),
               title_lines=inner.get("title_lines"))

        # --- Zusatzknoten rechts daneben, Position gerechnet ---
        # Die Nummern kommen erst nach den Pfeilen: Die Karte erzählt zuerst den
        # Weg und danach die Ursache. Zeichenreihenfolge ist nicht Lesereihenfolge.
        pending = []
        x = inner_x + inner_w
        for e in p.get("extras", []):
            ew = e.get("w", 190)
            x += GAP_NODE
            if x + ew > sub_x + sub_w - 15:
                raise ValueError(
                    f"Zusatzknoten '{e['title']}' passt nicht mehr ins Subnetz "
                    f"({x + ew:.0f} > {sub_x + sub_w - 15:.0f}). Weniger Knoten oder schmaler ('w').")
            c.node(x, node_y, ew, h_node, e["icon"], e["title"], e.get("subs", []),
                   isize=e.get("isize", 44), ssize=e.get("ssize", T.FS_NODE_SUB),
                   border=_color(e["accent"]) if e.get("accent") else T.NODE_BORDER,
                   bw=2.2 if e.get("accent") else T.NODE_BW,
                   title_lines=e.get("title_lines"))
            if e.get("badge"):
                pending.append((x, node_y))
            x += ew

        # --- Hinweg: funktioniert in beiden Paneelen ---
        fx0, fx1 = LEFT_X + LEFT_W + 4, inner_x - 4
        c.arrow([(fx0, cy_fwd), (fx1, cy_fwd)], check=False)
        c.text((fx0 + fx1) / 2, cy_fwd - 14, base["forward"], T.FS_LABEL, False, T.INK_SOFT)
        c.badge(fx0 + 66, cy_fwd, step)
        step += 1

        # --- Rückweg: hier unterscheiden sich die Paneele ---
        back = p["back"]
        c.arrow([(fx1, cy_back), (fx0, cy_back)], dashed=broken, color=edge, check=False)
        c.text((fx0 + fx1) / 2, cy_back + 25, back, T.FS_LABEL, True, edge)
        (c.cross if broken else c.tick)(fx1 - 31, cy_back)
        c.badge(fx0 + 66, cy_back, step)
        step += 1

        for bx, by in pending:
            c.badge(bx, by, step)
            step += 1

        # --- Einschub unten links ---
        ins = p.get("insert")
        if ins:
            iy = top + ins_y_rel
            ix = LEFT_X + 310
            if ins.get("kind") == "gap":
                c.parts.append(f'<rect x="{ix}" y="{iy}" width="{INSERT_W}" height="{ins_h}" rx="8" '
                               f'fill="#FFFFFF" stroke="{T.FAIL}" stroke-width="2" '
                               f'stroke-dasharray="8 5"/>')
                ty = iy + 40
                for k, ln in enumerate(ins["lines"]):
                    size = T.FS_GROUP if k < ins.get("bold_lines", 2) else T.FS_LABEL
                    c._check_width(ln, size, k < ins.get("bold_lines", 2), INSERT_W - 24, "Einschub")
                    c.text(ix + INSERT_W / 2, ty, ln, size,
                           k < ins.get("bold_lines", 2), T.FAIL if k < ins.get("bold_lines", 2)
                           else "#8A5A5A")
                    ty += 24
                c.nodes.append((ix, iy, INSERT_W, ins_h, f"Einschub '{ins['lines'][0]}'"))
            else:
                c.node(ix, iy, INSERT_W, ins_h, ins["icon"], ins["title"], ins.get("subs", []),
                       isize=ins.get("isize", 40), fill="#F5FAF3", border=T.OK, bw=2.2,
                       title_lines=ins.get("title_lines"))

    c.legend(legend, legend_y, spec.get("legend_heading", "Was in welchem Schritt passiert"),
             cols=cols, colw=spec.get("legend_colw", 780))
    c.footer(height - 15)
    return c
