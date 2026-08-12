#!/usr/bin/env python3
import os
from diagramlib import icon, txt, node, group, path, badge, warnings

SVC = "architecture-service/"
RES = "resource/"
GRP = "architecture-group/"

W, H = 1600, 1095
p = []
p.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p.append('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#4A5568"/></marker></defs>')
p.append(f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>')

# ---------- Title ----------
p.append(txt(40, 48, "Eigene APIs verkaufen · Oktupus Co. KG", 26, True, "#232F3E", "start"))
p.append(txt(40, 78, "Hunderte bestehende REST-APIs im eigenen Rechenzentrum über API Gateway anbieten — "
                     "privater Backend-Weg, Kostenkontrolle und Abrechnung", 15, False, "#5A6570", "start"))

# ---------- Groups ----------
p.append(group(220, 110, 940, 815, GRP + "AWSCloud.svg", "AWS Cloud", "#232F3E", isize=24, lsize=14))
p.append(group(242, 165, 896, 735, GRP + "Region.svg", "Region eu-central-1 (Frankfurt)", "#00A4A6"))
p.append(group(650, 215, 290, 245, GRP + "VirtualprivatecloudVPC.svg", "VPC", "#8C4FFF", isize=20, lsize=12))
p.append(group(670, 258, 250, 182, GRP + "Privatesubnet.svg", "Privates Subnetz", "#3B7D2F",
               isize=18, lsize=11))
p.append(group(1380, 240, 200, 335, GRP + "Corporatedatacenter.svg", "Rechenzentrum", "#7D8998",
               isize=20, lsize=12))
p.append(f'<rect x="272" y="700" width="866" height="175" rx="6" fill="#FCFCFD" stroke="#B7BDC6" '
         f'stroke-width="1.6" stroke-dasharray="6 4"/>')
p.append(txt(288, 722, "Querschnitt: Zugangsschutz, Rechte, Beobachtung und Kostenkontrolle",
             13, True, "#146EB4", "start"))

# ---------- Main path ----------
p.append(node(40, 290, 150, 110, RES + "Users.svg", "API-Kunden",
              ["Drittanbieter, die", "die APIs nutzen"], isize=40, ssize=11))
p.append(node(272, 260, 180, 170, SVC + "AmazonAPIGateway.svg", "Amazon API Gateway",
              ["REST API mit VPC Link", "einziger Zugangspunkt"],
              isize=72, tsize=16, ssize=12, fill="#F3EEFC", border="#8C4FFF", bw=2.5,
              title_lines=["Amazon", "API Gateway"]))
p.append(node(482, 290, 140, 110, SVC + "AWSPrivateLink.svg", "VPC Link",
              ["private Brücke ins", "eigene Netz"], isize=40, ssize=11))
p.append(node(690, 290, 210, 110, RES + "ElasticLoadBalancingNetworkLoadBalancer.svg",
              "Network Load Balancer", ["Ziele sind IP-Adressen", "im Rechenzentrum"], isize=40, ssize=11))
p.append(node(970, 290, 140, 125, RES + "AmazonVPCVPNGateway.svg", "Virtual Private",
              ["Übergang zur", "Standleitung"], isize=40, ssize=11,
              title_lines=["Virtual Private", "Gateway"]))
p.append(node(1190, 290, 160, 110, SVC + "AWSDirectConnect.svg", "AWS Direct Connect",
              ["private VIF,", "kein Internet"], isize=40, ssize=11))
p.append(node(1400, 290, 160, 110, RES + "Firewall.svg", "Firewall, Router",
              ["Übergabepunkt", "im Rechenzentrum"], isize=40, ssize=11))
p.append(node(1400, 435, 160, 110, RES + "Servers.svg", "REST-API-Server",
              ["hunderte bestehende", "Schnittstellen"], isize=40, ssize=11))

# ---------- Monetisation ----------
p.append(node(272, 530, 180, 135, RES + "AmazonAPIGatewayEndpoint.svg", "Usage Plan und",
              ["Kontingent und", "Drosselung je Kunde"], isize=40, ssize=11,
              title_lines=["Usage Plan und", "API-Schlüssel"]))
p.append(node(482, 530, 170, 135, SVC + "AWSMarketplace.svg", "AWS Marketplace",
              ["AWS übernimmt", "die Abrechnung"], isize=40, ssize=11))
p.append(node(682, 530, 170, 135, SVC + "AWSLambda.svg", "AWS Lambda",
              ["oder eigene Abrechnung", "über einen Dienst"], isize=40, ssize=10))
p.append(node(1190, 530, 150, 135, RES + "GenericApplication.svg", "Zahlungsdienst",
              ["z. B. PayPal,", "über das Internet"], isize=40, ssize=11))

# ---------- Cross-cutting ----------
sec = [
    (SVC + "AWSWAF.svg", ["AWS WAF"], ["schützt den", "Eingang"]),
    (SVC + "AmazonCognito.svg", ["Amazon", "Cognito"], ["prüft, wer", "zugreifen darf"]),
    (SVC + "AWSIdentityandAccessManagement.svg", ["AWS IAM"], ["Rechte je", "Komponente"]),
    (SVC + "AmazonCloudWatch.svg", ["Amazon", "CloudWatch"], ["Aufrufe und", "Fehler im Blick"]),
    (SVC + "AWSCostExplorer.svg", ["AWS Cost", "Explorer"], ["zeigt, was der", "Betrieb kostet"]),
    (SVC + "AWSBudgets.svg", ["AWS Budgets"], ["Alarm, wenn es", "teuer wird"]),
    (SVC + "AWSCloudTrail.svg", ["AWS CloudTrail"], ["protokolliert", "jeden Aufruf"]),
]
for i, (ip, tl, subs) in enumerate(sec):
    p.append(node(275 + i * 125, 740, 110, 118, ip, tl[0], subs, isize=30,
                  tsize=11, ssize=10, title_lines=tl))

# ---------- Arrows ----------
A = []
A.append(path([(194, 345), (268, 345)]))       # 1
A.append(path([(452, 345), (478, 345)]))       # 2
A.append(path([(622, 345), (686, 345)]))       # 3
A.append(path([(900, 345), (966, 345)]))       # 4
A.append(path([(1110, 345), (1186, 345)]))     # 5
A.append(path([(1350, 345), (1396, 345)]))     # 6
A.append(path([(1480, 402), (1480, 431)]))     # 7
A.append(path([(362, 432), (362, 526)]))       # 8
A.append(path([(452, 597), (478, 597)]))       # 9
A.append(path([(652, 597), (678, 597)]))       # 10
A.append(path([(852, 597), (1186, 597)]))      # 11
p.append("".join(A))

# ---------- Notes on arrows ----------
p.append(txt(1270, 262, "privater Weg, kein Internet", 11, True, "#3B7D2F"))
p.append(txt(1019, 579, "nur ausgehend, betrifft das Rechenzentrum nicht", 11, False, "#5A6570"))

for x, y, n in [(206, 345, 1), (465, 345, 2), (636, 345, 3), (953, 345, 4), (1124, 345, 5),
                (1365, 345, 6), (1480, 416, 7), (362, 479, 8), (465, 597, 9),
                (665, 597, 10), (1019, 597, 11)]:
    p.append(badge(x, y, n))

# ---------- Legend ----------
leg = [
    "1  Ein Kunde ruft die gekaufte API über das Internet auf",
    "2  API Gateway prüft Schlüssel und Kontingent und leitet weiter",
    "3  Der VPC Link führt die Anfrage ins eigene Netz",
    "4  Der Load Balancer kennt die IP-Adressen der eigenen Server",
    "5  Vom Gateway aus geht es auf die Standleitung",
    "6  Direct Connect erreicht den Übergabepunkt im Rechenzentrum",
    "7  Dort beantwortet der bestehende REST-API-Server die Anfrage",
    "8  Jeder Aufruf wird gegen den Usage Plan des Kunden gezählt",
    "9  Über den Marketplace übernimmt AWS Verkauf und Abrechnung",
    "10  Alternativ rechnet man selbst ab und ruft dafür Lambda auf",
    "11  Lambda spricht den Zahlungsdienst an — nur ausgehend",
    "Die Antwort läuft jeweils denselben Weg zurück",
]
p.append(txt(40, 955, "Ablauf Schritt für Schritt", 13, True, "#232F3E", "start"))
for i, s in enumerate(leg):
    col, row = divmod(i, 4)
    p.append(txt(40 + col * 520, 980 + row * 21, s, 12, False, "#3C4552", "start"))
p.append(txt(40, 1080, "Icons: AWS Architecture Icons (© Amazon Web Services, Inc.)", 10, False, "#8A94A6", "start"))

p.append("</svg>")

os.makedirs("/home/claude/out", exist_ok=True)
out = "/home/claude/out/api-gateway-monetarisierung.svg"
open(out, "w", encoding="utf-8").write("".join(p))
print("SVG geschrieben:", out, os.path.getsize(out), "bytes")
print("QC-Warnungen:", len(warnings))
for w in warnings:
    print(" ", w)
