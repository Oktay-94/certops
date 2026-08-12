#!/usr/bin/env python3
import os
from diagramlib import icon, txt, node, group, path, badge, warnings

SVC = "architecture-service/"
RES = "resource/"
GRP = "architecture-group/"

W, H = 1600, 1350
p = []
p.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p.append('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#4A5568"/></marker>'
         '<marker id="ahr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#C7161D"/></marker></defs>')
p.append(f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>')

p.append(txt(40, 48, "Szenario 4 · Große Dateien in Lambda verarbeiten — Fehlersuche", 26, True, "#232F3E", "start"))
p.append(txt(40, 78, "Warum eine Funktion im privaten Subnetz nicht auf S3 zugreifen kann — "
                     "und wie die korrigierte Architektur aussieht", 15, False, "#5A6570", "start"))


def cross(cx, cy):
    r = 10
    return (f'<circle cx="{cx}" cy="{cy}" r="15" fill="#FFFFFF" stroke="#C7161D" stroke-width="2"/>'
            f'<path d="M{cx-r*0.55} {cy-r*0.55} L{cx+r*0.55} {cy+r*0.55} M{cx+r*0.55} {cy-r*0.55} '
            f'L{cx-r*0.55} {cy+r*0.55}" fill="none" stroke="#C7161D" stroke-width="2.5" stroke-linecap="round"/>')


def tick(cx, cy):
    return (f'<circle cx="{cx}" cy="{cy}" r="15" fill="#FFFFFF" stroke="#3B7D2F" stroke-width="2"/>'
            f'<path d="M{cx-6} {cy} L{cx-1.5} {cy+5} L{cx+6.5} {cy-5.5}" fill="none" stroke="#3B7D2F" '
            f'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>')


def panel(T, broken):
    o = []
    tint = "#FDF6F5" if broken else "#F5FAF3"
    edge = "#C7161D" if broken else "#3B7D2F"
    head = ("Vorher — so ist es gebaut, und so scheitert es" if broken
            else "Nachher — die korrigierte Architektur")
    o.append(f'<rect x="40" y="{T}" width="1520" height="500" rx="10" fill="{tint}" '
             f'stroke="{edge}" stroke-width="1.6"/>')
    o.append(txt(60, T + 34, head, 16, True, edge, "start"))
    o.append(group(60, T + 55, 1480, 420, GRP + "Region.svg", "Region eu-central-1", "#00A4A6"))

    o.append(node(90, T + 165, 200, 120, SVC + "AmazonSimpleStorageService.svg", "Amazon S3",
                  ["Bucket mit Dateien", "von 1 bis 3 GB"], isize=44, ssize=11))

    o.append(group(730, T + 90, 740, 350, GRP + "VirtualprivatecloudVPC.svg", "VPC", "#8C4FFF",
                   isize=20, lsize=12))
    o.append(group(755, T + 130, 690, 245, GRP + "Privatesubnet.svg", "Privates Subnetz", "#3B7D2F",
                   isize=18, lsize=11))
    o.append(node(790, T + 165, 200, 120, SVC + "AWSLambda.svg", "AWS Lambda",
                  ["berechnet die", "Prüfsumme"], isize=44, ssize=11))

    if broken:
        o.append(node(1080, T + 165, 200, 120, RES + "AmazonVPCRouter.svg", "Routentabelle",
                      ["nur lokale Route,", "kein Weg zu S3"], isize=44, ssize=11,
                      border="#C7161D", bw=2.2))
        o.append(f'<rect x="400" y="{T+320}" width="260" height="110" rx="8" fill="#FFFFFF" '
                 f'stroke="#C7161D" stroke-width="2" stroke-dasharray="8 5"/>')
        o.append(txt(530, T + 360, "Hier fehlt der", 13, True, "#C7161D"))
        o.append(txt(530, T + 382, "VPC Gateway Endpoint", 13, True, "#C7161D"))
        o.append(txt(530, T + 406, "ohne ihn endet jeder Aufruf im Nichts", 11, False, "#8A5A5A"))
    else:
        o.append(node(1060, T + 165, 190, 120, RES + "AmazonVPCRouter.svg", "Routentabelle",
                      ["Präfixliste von S3", "zeigt auf den Endpunkt"], isize=44, ssize=10,
                      border="#3B7D2F", bw=2.2))
        o.append(node(1290, T + 165, 150, 120, RES + "AWSLambdaLambdaFunction.svg", "Einstellungen",
                      ["mehr Speicher,", "längeres Zeitlimit"], isize=40, ssize=10))
        o.append(node(400, T + 320, 260, 110, RES + "AmazonVPCEndpoints.svg", "VPC Gateway Endpoint",
                      ["kostenlos, privat, kein NAT nötig"], isize=40, ssize=11,
                      fill="#F5FAF3", border="#3B7D2F", bw=2.2))

    o.append(path([(294, T + 200), (786, T + 200)]))
    o.append(txt(540, T + 186, "S3 meldet die neue Datei — dieser Weg geht nicht durch die VPC",
                 11, False, "#5A6570"))

    if broken:
        o.append(f'<path d="M786 {T+255} L294 {T+255}" fill="none" stroke="#C7161D" stroke-width="2.2" '
                 f'stroke-dasharray="8 5" marker-end="url(#ahr)"/>')
        o.append(txt(540, T + 280, "die Funktion ruft S3 auf — request timed out", 11, True, "#C7161D"))
        o.append(cross(755, T + 255))
    else:
        o.append(f'<path d="M786 {T+255} L294 {T+255}" fill="none" stroke="#3B7D2F" stroke-width="2.2" '
                 f'marker-end="url(#ah)"/>')
        o.append(txt(540, T + 280, "der Aufruf läuft privat über den Endpunkt zu S3", 11, True, "#3B7D2F"))
        o.append(tick(755, T + 255))

    o.append(badge(360, T + 200, 1 if broken else 4))
    o.append(badge(360, T + 255, 2 if broken else 5))
    o.append(badge(1080 if broken else 1060, T + 165, 3 if broken else 6))
    return "".join(o)


p.append(panel(140, True))
p.append(panel(670, False))

leg = [
    "1  Das S3-Ereignis startet die Funktion — dieser Weg läuft über den Lambda-Dienst, nicht durch die VPC, und funktioniert",
    "2  Die Funktion selbst ruft S3 auf. Diese Anfrage verlässt das private Subnetz nie und läuft in die Zeitüberschreitung",
    "3  Die Ursache: In der Routentabelle des Subnetzes steht kein Weg zu S3",
    "4  Am Auslöser ändert sich nichts, der war nie das Problem",
    "5  Der Aufruf erreicht S3 jetzt über eine private Route, ohne einen Meter öffentliches Internet",
    "6  Der Gateway Endpoint trägt die S3-Präfixliste in die Routentabelle ein — kostenlos, kein NAT Gateway nötig",
]
p.append(txt(40, 1215, "Was in welchem Schritt passiert", 13, True, "#232F3E", "start"))
for i, s in enumerate(leg):
    col, row = divmod(i, 3)
    p.append(txt(40 + col * 780, 1240 + row * 21, s, 12, False, "#3C4552", "start"))
p.append(txt(40, 1335, "Icons: AWS Architecture Icons (© Amazon Web Services, Inc.)", 10, False, "#8A94A6", "start"))
p.append("</svg>")

os.makedirs("/home/claude/out", exist_ok=True)
out = "/home/claude/out/lambda-vpc-endpoint-fehlersuche.svg"
open(out, "w", encoding="utf-8").write("".join(p))
print("SVG geschrieben:", out, os.path.getsize(out), "bytes")
print("QC-Warnungen:", len(warnings))
for w in warnings:
    print(" ", w)
