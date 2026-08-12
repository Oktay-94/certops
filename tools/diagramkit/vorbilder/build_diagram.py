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


W, H = 1600, 1010
p = []
p.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p.append('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#4A5568"/></marker></defs>')
p.append(f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>')

# ---------- Title ----------
p.append(txt(40, 48, "Szenario 2 · Intelligente Wissenssuche über viele Dokumente", 26, True, "#232F3E", "start"))
p.append(txt(40, 78, "Hybride Lösungsarchitektur: Anbindung des Rechenzentrums, Weg der Dokumente in den Index, "
                     "Weg der Suchanfrage und die Sicherheitskontrollen", 15, False, "#5A6570", "start"))

# ---------- Groups ----------
p.append(group(545, 115, 1020, 715, "architecture-group/AWSCloud.svg", "AWS Cloud", "#232F3E", isize=24, lsize=14))
p.append(group(568, 170, 975, 630, "architecture-group/Region.svg", "Region eu-central-1 (Frankfurt)", "#00A4A6"))
p.append(group(30, 170, 310, 330, "architecture-group/Corporatedatacenter.svg", "Rechenzentrum vor Ort", "#7D8998"))
p.append(f'<rect x="980" y="412" width="215" height="160" rx="6" fill="none" stroke="#8C4FFF" stroke-width="1.8"/>')
p.append(icon("architecture-group/VirtualprivatecloudVPC.svg", 982, 390, 18))
p.append(txt(1006, 404, "VPC · privates Subnetz", 11, True, "#8C4FFF", "start"))
p.append(f'<rect x="578" y="600" width="930" height="175" rx="6" fill="#FCFCFD" stroke="#B7BDC6" '
         f'stroke-width="1.6" stroke-dasharray="6 4"/>')

# ---------- Band labels ----------
p.append(txt(585, 242, "A · So kommen die Dokumente in den Index", 13, True, "#146EB4", "start"))
p.append(txt(585, 420, "B · So wird eine Suchanfrage beantwortet", 13, True, "#146EB4", "start"))
p.append(txt(594, 622, "C · Querschnitt: Sicherheit, Identität und Betrieb — wirkt auf alle Bausteine oben",
            13, True, "#146EB4", "start"))

# ---------- On premises ----------
p.append(node(50, 220, 130, 115, "resource/Folders.svg", "Dateiserver",
              ["SMB-Freigaben,", "PDFs und Word"], isize=40))
p.append(node(192, 220, 130, 115, "resource/Documents.svg", "SharePoint, Wiki",
              ["interne", "Dokumente"], isize=40))
p.append(node(50, 355, 130, 115, "resource/Server.svg", "E-Mail-Server",
              ["Postfächer", "und Anhänge"], isize=40))
p.append(node(192, 355, 130, 115, "resource/GenericApplication.svg", "Active Directory",
              ["Benutzer", "und Gruppen"], isize=40))
p.append(node(105, 545, 160, 115, "resource/Users.svg", "Mitarbeitende",
              ["stellen Fragen", "in normaler Sprache"], isize=42))

# ---------- Bridge ----------
p.append(node(360, 235, 160, 115, "architecture-service/AWSDirectConnect.svg", "AWS Direct Connect",
              ["Standleitung ins RZ,", "nicht übers Internet"], isize=44))
p.append(node(360, 385, 160, 115, "architecture-service/AWSSnowball.svg", "AWS Snowball",
              ["Erstbefüllung,", "80 TB per Kurier"], isize=44))

# ---------- Band A ----------
p.append(node(585, 255, 180, 125, "architecture-service/AmazonSimpleStorageService.svg", "Amazon S3",
              ["Rohablage aller Dateien,", "verschlüsselt mit KMS"]))
p.append(node(790, 255, 180, 125, "architecture-service/AWSLambda.svg", "AWS Lambda",
              ["startet automatisch bei", "jedem neuen Objekt"]))
p.append(node(995, 255, 180, 125, "architecture-service/AmazonComprehend.svg", "Amazon Comprehend",
              ["erkennt Sprache, Thema", "und Personendaten"]))

# ---------- Band B ----------
p.append(node(585, 430, 180, 125, "architecture-service/AmazonCloudFront.svg", "Amazon CloudFront",
              ["öffentlicher Eingang", "der Such-Oberfläche"]))
p.append(node(790, 430, 180, 125, "architecture-service/AmazonAPIGateway.svg", "Amazon API Gateway",
              ["nimmt die Suchanfrage", "entgegen, prüft Token"]))
p.append(node(995, 430, 180, 125, "architecture-service/AWSLambda.svg", "AWS Lambda",
              ["fragt Kendra ab und", "reicht Gruppen mit"]))

# ---------- Kendra hub ----------
p.append(node(1290, 270, 210, 250, "architecture-service/AmazonKendra.svg", "Amazon Kendra",
              ["Der Kern der Lösung", "", "durchsuchbarer Index",
               "versteht ganze Fragen", "filtert nach Rechten"],
              isize=72, tsize=16, ssize=12, fill="#F0FAF8", border="#01A88D", bw=2.5))

# ---------- Band C ----------
sec = [
    ("architecture-service/AWSIAMIdentityCenter.svg", ["IAM Identity", "Center"], ["Anmeldung mit", "Firmenkonto"]),
    ("architecture-service/AWSWAF.svg", ["AWS WAF"], ["blockt Bots", "und Angriffe"]),
    ("architecture-service/AWSIdentityandAccessManagement.svg", ["AWS IAM"], ["Rollen mit", "minimalen Rechten"]),
    ("architecture-service/AWSKeyManagementService.svg", ["AWS KMS"], ["verschlüsselt S3", "und den Index"]),
    ("resource/AmazonVPCEndpoints.svg", ["VPC-Endpunkte"], ["Verkehr bleibt", "im AWS-Netz"]),
    ("architecture-service/AWSCloudTrail.svg", ["AWS CloudTrail"], ["protokolliert", "jeden Aufruf"]),
    ("architecture-service/AmazonCloudWatch.svg", ["Amazon", "CloudWatch"], ["Metriken, Logs", "und Alarme"]),
]
for i, (ip, tl, subs) in enumerate(sec):
    p.append(node(587 + i * 132, 630, 120, 125, ip, tl[0], subs, isize=38,
                  tsize=11, ssize=10, title_lines=tl))

# ---------- Arrows ----------
A = []
A.append(path([(340, 292), (356, 292)]))                                    # 1a on-prem -> DX
A.append(path([(520, 292), (581, 292)]))                                    # 1b DX -> S3
A.append(path([(520, 442), (552, 442), (552, 350), (581, 350)]))            # 2 Snowball -> S3
A.append(path([(765, 317), (786, 317)]))                                    # 3
A.append(path([(970, 317), (991, 317)]))                                    # 4
A.append(path([(1175, 317), (1286, 317)]))                                  # 5
A.append(path([(440, 235), (440, 215), (1395, 215), (1395, 266)]))          # 6 connectors
A.append(path([(265, 602), (530, 602), (530, 492), (581, 492)], both=True))  # 7
A.append(path([(765, 492), (786, 492)]))                                    # 8
A.append(path([(970, 492), (991, 492)]))                                    # 9
A.append(path([(1175, 492), (1286, 492)]))                                  # 10
A.append(path([(1395, 520), (1395, 586), (675, 586), (675, 559)], dashed=True))  # 11
A.append(path([(647, 559), (647, 626)], dashed=True, color="#8A94A6"))      # CloudFront -> IdC
p.append("".join(A))

# ---------- Arrow labels ----------
p.append(txt(1100, 206, "Kendra-Konnektoren holen SharePoint und Datenbank direkt ab", 11, False, "#5A6570"))
p.append(txt(1230, 302, "Dokument + Metadaten", 11, False, "#5A6570"))
p.append(txt(1230, 477, "Suchanfrage + AD-Gruppen", 11, False, "#5A6570"))
p.append(txt(880, 578, "Antwort, nach Berechtigung gefiltert", 11, False, "#5A6570"))

# ---------- Badges ----------
B = [(348, 292, 1), (552, 400, 2), (775.5, 317, 3), (980.5, 317, 4), (1230, 317, 5),
     (900, 215, 6), (530, 545, 7), (775.5, 492, 8), (980.5, 492, 9), (1230, 492, 10),
     (1040, 586, 11)]
for x, y, n in B:
    p.append(badge(x, y, n))

# ---------- Legend ----------
leg = [
    "1  Dokumente werden über die Standleitung nach S3 kopiert",
    "2  Altbestand einmalig per Snowball-Koffer nach S3",
    "3  Jedes neue Objekt in S3 startet automatisch Lambda",
    "4  Lambda schickt den Text zur Analyse an Comprehend",
    "5  Dokument und Metadaten wandern in den Kendra-Index",
    "6  Konnektoren holen SharePoint und Datenbank ohne Umweg über S3",
    "7  Mitarbeitende stellen ihre Frage im Browser",
    "8  CloudFront reicht die Anfrage an das API Gateway weiter",
    "9  API Gateway ruft Lambda im privaten Subnetz auf",
    "10  Lambda fragt Kendra ab und reicht die AD-Gruppen des Nutzers mit",
    "11  Kendra liefert die Antwort, gefiltert nach Zugriffsrechten",
]
p.append(txt(40, 872, "Datenfluss Schritt für Schritt", 13, True, "#232F3E", "start"))
for i, s in enumerate(leg):
    col, row = divmod(i, 4)
    p.append(txt(40 + col * 520, 896 + row * 21, s, 12, False, "#3C4552", "start"))
p.append(txt(40, 995, "Icons: AWS Architecture Icons (© Amazon Web Services, Inc.)", 10, False, "#8A94A6", "start"))

p.append("</svg>")

out = "/home/claude/out/kendra-architektur.svg"
os.makedirs("/home/claude/out", exist_ok=True)
open(out, "w", encoding="utf-8").write("".join(p))
print("SVG geschrieben:", out, os.path.getsize(out), "bytes")
print("QC-Warnungen:", len(warnings))
for w in warnings:
    print(" ", w)
