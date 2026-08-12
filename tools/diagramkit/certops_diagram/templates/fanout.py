"""Template "fanout": ein Verteiler, davor ein Erzeuger, dahinter N gleichartige Bahnen.

Passt für: SNS-Fan-out, EventBridge-Regeln auf mehrere Ziele, Kinesis mit
mehreren Consumern. Die Geometrie ist einmal von Hand gesetzt; die Zahl der
Bahnen (2 bis 4) rechnet das Template selbst aus.
"""
from ..canvas import Canvas
from .. import theme as T

# Feste Spalten
X_OUT, W_OUT = 40, 150
X_PROD, W_PROD = 290, 170
X_HUB, W_HUB = 530, 200
X_Q, W_Q = 800, 190
X_DLQ, W_DLQ = 820, 150
X_WRK, W_WRK = 1050, 170
X_TGT, W_TGT = 1280, 190
CLOUD_X, CLOUD_W = 230, 1330
REGION_X, REGION_W = 252, 1288

ROW0, PITCH = 230, 260
H_ROW, H_DLQ, GAP_DLQ = 115, 85, 30
H_HUB = 195
CHANNEL = X_HUB + W_HUB + 35


def build(spec):
    lanes = spec["lanes"]
    n = len(lanes)
    if not 2 <= n <= 4:
        raise ValueError(f"Template 'fanout' unterstützt 2 bis 4 Bahnen, nicht {n}")

    rows = [ROW0 + i * PITCH for i in range(n)]
    lanes_bottom = rows[-1] + H_ROW + GAP_DLQ + H_DLQ
    region_h = lanes_bottom + 25 - 165
    cloud_h = region_h + 110
    legend_y = 110 + cloud_h + 45
    height = legend_y + 135

    c = Canvas(1600, height, strict=spec.get("strict", True))
    c.title(spec["title"], spec.get("subtitle"))
    c.group(CLOUD_X, 110, CLOUD_W, cloud_h, "grp-cloud", "AWS Cloud", T.CLOUD, isize=24, lsize=14)
    c.group(REGION_X, 165, REGION_W, region_h, "grp-region",
            spec.get("region", "Region eu-central-1 (Frankfurt)"), T.REGION)

    hub_cy = (rows[0] + rows[-1] + H_ROW) / 2
    hub_y = hub_cy - H_HUB / 2
    prod_y = hub_cy - H_ROW / 2

    # Erzeugerseite
    out = spec.get("outside")
    if out:
        c.node(X_OUT, prod_y, W_OUT, H_ROW, out["icon"], out["title"], out.get("subs", []),
               isize=42, badge=1)
        c.arrow([(X_OUT + W_OUT + 4, hub_cy), (X_PROD - 4, hub_cy)], check=False)

    prod = spec["producer"]
    c.node(X_PROD, prod_y, W_PROD, H_ROW, prod["icon"], prod["title"], prod.get("subs", []))

    if spec.get("store"):
        s = spec["store"]
        sy = prod_y + 170
        c.node(X_PROD, sy, W_PROD, H_ROW, s["icon"], s["title"], s.get("subs", []))
        c.arrow([(X_PROD + W_PROD / 2, prod_y + H_ROW + 4), (X_PROD + W_PROD / 2, sy - 4)],
                badge=2, label_at=(X_PROD + W_PROD / 2, sy - 28))

    hub = spec["hub"]
    c.arrow([(X_PROD + W_PROD, hub_cy), (X_HUB - 4, hub_cy)], badge=3,
            label_at=(X_PROD + W_PROD + 33, hub_cy))
    c.hero(X_HUB, hub_y, W_HUB, H_HUB, hub["icon"], hub["title"], hub.get("subs", []),
           fill=hub.get("fill", "#FDF1F6"), border=hub.get("border", "#E7157B"))

    if spec.get("aside"):
        a = spec["aside"]
        c.node(X_HUB, hub_y + H_HUB + 15, W_HUB, H_ROW, a["icon"], a["title"],
               a.get("subs", []), ssize=10)

    if spec.get("lane_note"):
        c.text(X_Q + 80, ROW0 - 16, spec["lane_note"], T.FS_LABEL, True, T.ACCENT)

    # Bahnen
    for i, (y, lane) in enumerate(zip(rows, lanes)):
        cy = y + H_ROW / 2
        exit_y = hub_y + 40 + (i * (H_HUB - 80) / (n - 1)) if n > 1 else hub_cy
        if abs(exit_y - cy) < 6:
            pts = [(X_HUB + W_HUB + 4, cy), (X_Q - 4, cy)]
            badge_at = (CHANNEL, cy)
        else:
            pts = [(X_HUB + W_HUB + 4, exit_y), (CHANNEL, exit_y),
                   (CHANNEL, cy), (X_Q - 4, cy)]
            badge_at = (CHANNEL, (exit_y + cy) / 2)
        c.arrow(pts, badge=4 + i, label_at=badge_at, check=False)

        q = lane["queue"]
        c.node(X_Q, y, W_Q, H_ROW, q["icon"], q["title"], q.get("subs", []), ssize=10,
               border=T.ACCENT if q.get("accent") else T.NODE_BORDER,
               bw=2.2 if q.get("accent") else T.NODE_BW)

        if lane.get("dlq"):
            d = lane["dlq"]
            dy = y + H_ROW + GAP_DLQ
            c.node(X_DLQ, dy, W_DLQ, H_DLQ, d["icon"], d["title"], d.get("subs", []),
                   isize=28, tsize=11, ssize=10)
            c.arrow([(X_DLQ + W_DLQ / 2, y + H_ROW + 4), (X_DLQ + W_DLQ / 2, dy - 4)],
                    dashed=True, color=T.FAIL, badge=9,
                    label_at=(X_DLQ + W_DLQ / 2, y + H_ROW + 15))

        w = lane["worker"]
        c.arrow([(X_Q + W_Q, cy), (X_WRK - 4, cy)], badge=7,
                label_at=(X_Q + W_Q + 28, cy))
        c.node(X_WRK, y, W_WRK, H_ROW, w["icon"], w["title"], w.get("subs", []),
               title_lines=w.get("title_lines"))

        t = lane["target"]
        c.arrow([(X_WRK + W_WRK, cy), (X_TGT - 4, cy)], badge=8,
                label_at=(X_WRK + W_WRK + 28, cy))
        c.node(X_TGT, y, W_TGT, H_ROW, t["icon"], t["title"], t.get("subs", []), ssize=10)

    if spec.get("callout"):
        co = spec["callout"]
        c.callout(X_PROD - 10, lanes_bottom - 160, 440, 120, co["headline"], co["lines"])

    c.legend(spec.get("legend", []), legend_y)
    c.footer(height - 15)
    return c
