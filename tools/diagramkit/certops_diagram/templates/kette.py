"""Template "kette": ein Weg von links nach rechts durch geschachtelte Rahmen.

Passt für: Anfrage erreicht API Gateway, läuft über VPC Link ins eigene Netz,
über Direct Connect ins Rechenzentrum. Allgemein für jede Karte, in der eine
Anfrage nacheinander mehrere Stationen durchläuft und dabei Zonengrenzen
überquert — die häufigste Form überhaupt.

Nichts an der Geometrie steht in der Spec. Gerechnet wird:

  * **x je Glied** aus der Summe der vorherigen Breiten. Der Abstand wächst an
    jeder Rahmengrenze, sonst klebt der Pfeil an der Rahmenkante.
  * **Zeilenhöhe** aus dem inhaltsreichsten Glied (content_height), statt eine
    Konstante zu raten, die bei zwei Titelzeilen plus zwei Unterzeilen platzt.
  * **Rahmen** aus der Zugehörigkeit der Glieder. Ein Glied sagt
    `in: [cloud, region, vpc]`, das Template legt die Rahmen um die Spanne und
    leitet die Schachtelung aus den Mengenverhältnissen ab. Ein Glied, das
    `cloud` nicht nennt, liegt außerhalb der Wolke — so kommt das
    Rechenzentrum an die richtige Stelle, ohne dass jemand Koordinaten tippt.

Stünden Rahmenkoordinaten in der Spec, wäre das keine Generalisierung, sondern
eine Handkarte mit YAML-Mantel.
"""
from ..canvas import Canvas, content_height
from .. import theme as T

CANVAS_W = 1600
MARGIN = 40
TOP_MARGIN = 100         # Unterkante von Titel und Unterzeile
H_ROW_MIN = 110          # Untergrenze; die echte Zeilenhöhe folgt aus dem Inhalt
W_NODE = 160
GAP_BASE = 26            # Abstand zwischen zwei Gliedern derselben Zone
GAP_FRAME = 26           # Aufschlag je überquerter Rahmengrenze

PAD_TIGHT = 40           # Abstand engster Rahmen zu enthaltenem Glied
PAD_TIGHT_STEP = 20      # ... je Schachtelungsebene weniger
TIGHT_TOP = 85           # Oberkante des äußersten engen Rahmens über der Zeile
TIGHT_LABEL_STEP = 43    # Platz für die Rahmenbeschriftung je Ebene
TIGHT_BOT = 60
TIGHT_BOT_STEP = 20

PAD_FULL = 52            # Abstand des äußersten vollhohen Rahmens zum Inhalt
PAD_FULL_STEP = 22
INSET_TOP = 55           # senkrechter Versatz je Ebene, muss die Beschriftung fassen

BRANCH_GAP = 100         # Abstand Hauptkette zu Nebenzweig
BAND_GAP = 40            # Abstand Inhalt zu Querschnittsband

COLORS = {
    "cloud": T.CLOUD, "region": T.REGION, "vpc": T.VPC,
    "subnet-private": T.SUBNET_PRIVATE, "subnet-public": T.SUBNET_PUBLIC,
    "datacenter": T.DATACENTER, "band": T.BAND, "accent": T.ACCENT,
    "ok": T.OK, "fail": T.FAIL, "ink-soft": T.INK_SOFT,
}


def _color(name):
    if name in COLORS:
        return COLORS[name]
    if isinstance(name, str) and name.startswith("#"):
        return name
    raise ValueError(f"Unbekannte Farbe '{name}'. Erlaubt: {sorted(COLORS)} oder #RRGGBB")


def _layout(items, x0):
    """x-Positionen der Glieder. Der Abstand wächst an jeder Rahmengrenze."""
    xs, x = [], x0
    prev = frozenset()
    for i, it in enumerate(items):
        here = frozenset(it.get("in", []))
        if i:
            crossed = len(here ^ prev)      # betretene plus verlassene Zonen
            x += GAP_BASE + GAP_FRAME * crossed
        xs.append(x)
        x += it.get("w", W_NODE)
        prev = here
    return xs


def _row_height(items, default_isize=40):
    """Zeilenhöhe aus dem Inhalt: so hoch wie das inhaltsreichste Glied."""
    if not items:
        return H_ROW_MIN
    need = [content_height(len(it.get("title_lines") or [it["title"]]),
                           len(it.get("subs", [])),
                           it.get("isize", default_isize),
                           T.FS_NODE_TITLE,
                           it.get("ssize", T.FS_NODE_SUB))
            for it in items]
    return max([H_ROW_MIN] + need)


def build(spec):
    chain = spec["chain"]
    if len(chain) < 2:
        raise ValueError("Template 'kette' braucht mindestens zwei Glieder")

    outside = spec.get("outside")
    x0 = MARGIN + (outside.get("w", 150) + 54 if outside else 0)
    xs = _layout(chain, x0)
    widths = [it.get("w", W_NODE) for it in chain]
    right = xs[-1] + widths[-1]
    if right > CANVAS_W - MARGIN:
        raise ValueError(
            f"Kette ist {right - (CANVAS_W - MARGIN):.0f}px zu lang für die Fläche. "
            f"Weniger Glieder, schmalere Glieder ('w'), oder ein zweizeiliges Template.")

    branch = spec.get("branch") or {}
    branch_items = branch.get("items", [])
    band = spec.get("crossband") or {}
    band_items = band.get("items", [])

    heroes = [it for it in chain if it.get("hero")]
    plain = [it for it in chain if not it.get("hero")]
    h_row = _row_height(plain or chain)
    h_hero = max([h_row + 60] + [content_height(len(it.get("title_lines") or [it["title"]]),
                                                len(it.get("subs", [])), 72,
                                                T.FS_HERO_TITLE, T.FS_HERO_SUB)
                                 for it in heroes]) if heroes else h_row
    band_h = 30 + 118 + 14

    frames = spec.get("frames", [])
    members = {f["key"]: [i for i, it in enumerate(chain) if f["key"] in it.get("in", [])]
               for f in frames}
    for f in frames:
        if not members[f["key"]]:
            raise ValueError(f"Rahmen '{f['key']}' hat kein Glied — "
                             f"'in: [{f['key']}]' fehlt in der Kette")

    order = {f["key"]: i for i, f in enumerate(frames)}

    def depth(f):
        """Wie viele andere Rahmen umschließen diesen?

        Echte Obermenge zählt immer. Bei *gleicher* Mitgliedschaft — Cloud und
        Region umfassen oft dieselben Glieder — entscheidet die Reihenfolge in
        der Spec: früher deklariert heißt weiter außen. Ohne diese Regel landen
        beide auf derselben Ebene und ihre Beschriftungen überlagern sich.
        """
        me = set(members[f["key"]])
        n = 0
        for o in frames:
            if o["key"] == f["key"]:
                continue
            other = set(members[o["key"]])
            if me < other or (me == other and order[o["key"]] < order[f["key"]]):
                n += 1
        return n

    full = [f for f in frames if f.get("full_height")]
    tight = [f for f in frames if not f.get("full_height")]
    max_full = max([depth(f) for f in full], default=-1)

    # Die Zeile rutscht so weit nach unten, wie die Rahmen darüber Platz für
    # ihre Beschriftungen brauchen. Fest gesetzt schneidet der äußerste Rahmen
    # bei tiefer Schachtelung in die Unterzeile.
    ROW_Y = TOP_MARGIN + (max_full + 1) * INSET_TOP + TIGHT_TOP

    row_h = h_hero if heroes else h_row
    row_bottom = ROW_Y + row_h
    cy = ROW_Y + row_h / 2
    node_top = cy - h_row / 2
    h_branch = _row_height(branch_items) if branch_items else 0
    branch_y = row_bottom + BRANCH_GAP
    content_bottom = branch_y + h_branch if branch_items else row_bottom
    band_y = content_bottom + BAND_GAP
    inner_bottom = band_y + band_h if band_items else content_bottom

    # Enge Rahmen reichen unter die Zeile. Ohne diese Zeile ragt ein Subnetz bei
    # Karten ohne Nebenzweig und ohne Band unten aus der Region heraus — im
    # vollen Beispiel unsichtbar, weil das Band ohnehin tiefer liegt.
    if tight:
        inner_bottom = max(inner_bottom, row_bottom + TIGHT_BOT)

    frame_bottom = inner_bottom + 25
    top = TOP_MARGIN
    legend_y = frame_bottom + 30
    cols = spec.get("legend_cols", 3)
    legend_rows = -(-len(spec.get("legend", [])) // cols) if spec.get("legend") else 0
    height = legend_y + 25 + legend_rows * 21 + 45

    c = Canvas(CANVAS_W, height, strict=spec.get("strict", True))
    c.title(spec["title"], spec.get("subtitle"))

    # --- Vollhohe Rahmen: waagerecht über ihre Glieder, senkrecht über alles ---
    for f in full:
        d = depth(f)
        pad = PAD_FULL - d * PAD_FULL_STEP
        mem = members[f["key"]]
        gx = xs[mem[0]] - pad
        gw = xs[mem[-1]] + widths[mem[-1]] + pad - gx
        gy = top + d * INSET_TOP
        c.group(gx, gy, gw, frame_bottom - d * PAD_FULL_STEP - gy, f.get("icon"), f["label"],
                _color(f.get("color", "band")), isize=f.get("isize", 24 if d == 0 else 22),
                lsize=f.get("lsize", 14 if d == 0 else T.FS_GROUP))

    # --- Enge Rahmen: nur um die Zeile ---
    for f in tight:
        d = max(depth(f) - max_full - 1, 0)
        pad = PAD_TIGHT - d * PAD_TIGHT_STEP
        mem = members[f["key"]]
        gx = xs[mem[0]] - pad
        gw = xs[mem[-1]] + widths[mem[-1]] + pad - gx
        gy = ROW_Y - TIGHT_TOP + d * TIGHT_LABEL_STEP
        gh = row_bottom + TIGHT_BOT - d * TIGHT_BOT_STEP - gy
        c.group(gx, gy, gw, gh, f.get("icon"), f["label"], _color(f.get("color", "band")),
                isize=f.get("isize", 20), lsize=f.get("lsize", 12))

    def note_of(it, x, y_above):
        n = it.get("note")
        if not n:
            return
        if isinstance(n, str):
            n = {"text": n}
        c.text(x, y_above, n["text"], T.FS_LABEL, n.get("bold", False),
               _color(n["color"]) if n.get("color") else T.INK_SOFT)

    # --- Akteur vor der Wolke ---
    if outside:
        ow = outside.get("w", 150)
        oh = _row_height([outside])
        c.node(MARGIN, cy - oh / 2, ow, oh, outside["icon"], outside["title"],
               outside.get("subs", []), isize=outside.get("isize", 40))
        c.arrow([(MARGIN + ow + 4, cy), (xs[0] - 4, cy)], badge=1,
                label_at=(MARGIN + ow + (xs[0] - MARGIN - ow) / 2, cy))

    # --- Die Kette ---
    step = 2 if outside else 1
    for i, it in enumerate(chain):
        w = widths[i]
        if it.get("hero"):
            c.hero(xs[i], ROW_Y, w, h_hero, it["icon"], it["title"], it.get("subs", []),
                   title_lines=it.get("title_lines"), fill=it.get("fill", T.HERO_FILL),
                   border=_color(it["border"]) if it.get("border") else T.HERO_BORDER)
        else:
            c.node(xs[i], cy - h_row / 2, w, h_row, it["icon"], it["title"],
                   it.get("subs", []), isize=it.get("isize", 40),
                   ssize=it.get("ssize", T.FS_NODE_SUB), title_lines=it.get("title_lines"))
        if i:
            px = xs[i - 1] + widths[i - 1]
            mx = px + (xs[i] - px) / 2
            c.arrow([(px + 4, cy), (xs[i] - 4, cy)], badge=step, label_at=(mx, cy))
            note_of(it, mx, node_top - 14)
            step += 1

    # --- Nebenzweig ---
    if branch_items:
        anchor = branch.get("from", 0)
        ax = xs[anchor] + widths[anchor] / 2
        atop = ROW_Y + h_hero if chain[anchor].get("hero") else cy + h_row / 2
        bxs = []
        for j, it in enumerate(branch_items):
            if it.get("align_with") is not None:
                bx = xs[it["align_with"]]
            elif j == 0:
                bx = xs[anchor]
            else:
                bx = bxs[-1] + branch_items[j - 1].get("w", W_NODE) + GAP_BASE
            bxs.append(bx)

        c.arrow([(ax, atop + 4), (ax, branch_y - 4)], badge=step,
                label_at=(ax, atop + (branch_y - atop) / 2))
        step += 1
        bcy = branch_y + h_branch / 2
        for j, it in enumerate(branch_items):
            if j:
                px = bxs[j - 1] + branch_items[j - 1].get("w", W_NODE)
                mx = px + (bxs[j] - px) / 2
                c.arrow([(px + 4, bcy), (bxs[j] - 4, bcy)], badge=step, label_at=(mx, bcy))
                note_of(it, mx, branch_y - 16)
                step += 1
            c.node(bxs[j], branch_y, it.get("w", W_NODE), h_branch, it["icon"], it["title"],
                   it.get("subs", []), isize=it.get("isize", 40),
                   ssize=it.get("ssize", T.FS_NODE_SUB), title_lines=it.get("title_lines"))

    # --- Querschnittsband ---
    if band_items:
        # Das Band gehört in den innersten vollhohen Rahmen — sonst ragt es bei
        # Karten mit Rechenzentrum rechts aus der Region heraus.
        if full:
            inner = min(full, key=lambda f: -depth(f))
            mem = members[inner["key"]]
            pad = PAD_FULL - depth(inner) * PAD_FULL_STEP - 22
            bl = xs[mem[0]] - pad
            bw = xs[mem[-1]] + widths[mem[-1]] + pad - bl
        else:
            bl = min(xs) - PAD_TIGHT
            bw = right + PAD_TIGHT - bl
        c.crossband(bl, band_y, bw, band_items, band["heading"])

    c.legend(spec.get("legend", []), legend_y,
             spec.get("legend_heading", "Ablauf Schritt für Schritt"),
             cols=cols, colw=spec.get("legend_colw", 520))
    c.footer(height - 15)
    return c
