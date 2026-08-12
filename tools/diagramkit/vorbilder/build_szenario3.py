#!/usr/bin/env python3
import os
from diagramlib import icon, txt, node, group, path, badge, warnings

SVC = "architecture-service/"
RES = "resource/"

W, H = 1600, 1065
p = []
p.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p.append('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#4A5568"/></marker></defs>')
p.append(f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>')

# ---------- Title ----------
p.append(txt(40, 48, "Szenario 3 · Event-getriebene Medienverarbeitung", 26, True, "#232F3E", "start"))
p.append(txt(40, 78, "Serverlose Orchestrierung mit AWS Step Functions: ein Ereignis startet den Ablauf, "
                     "jeder Schritt wird gesteuert, wiederholt und im Fehlerfall sauber abgefangen",
             15, False, "#5A6570", "start"))

# ---------- Groups ----------
p.append(group(230, 110, 1230, 780, "architecture-group/AWSCloud.svg", "AWS Cloud", "#232F3E", isize=24, lsize=14))
p.append(group(252, 165, 1188, 690, "architecture-group/Region.svg", "Region eu-central-1 (Frankfurt)", "#00A4A6"))
p.append(group(650, 205, 560, 400, SVC + "AWSStepFunctions.svg",
               "AWS Step Functions · Zustandsautomat", "#E7157B", dash="6 4", isize=24, lsize=14))
p.append(txt(700, 252, "Standard-Workflow · steuert die Reihenfolge, wiederholt bei Fehlern, "
                       "merkt sich den Zustand", 11, False, "#8A5A72", "start"))
p.append(f'<rect x="272" y="680" width="1148" height="155" rx="6" fill="#FCFCFD" stroke="#B7BDC6" '
         f'stroke-width="1.6" stroke-dasharray="6 4"/>')
p.append(txt(288, 702, "Querschnitt: Sicherheit, Betrieb und Beobachtbarkeit — wirkt auf alle Bausteine oben",
             13, True, "#146EB4", "start"))

# ---------- Outside the cloud ----------
p.append(node(40, 270, 145, 120, RES + "Users.svg", "Redaktion",
              ["lädt eine Videodatei", "in den Bucket"], isize=42, ssize=11))
p.append(node(40, 445, 145, 120, RES + "Users.svg", "Betriebsteam",
              ["bekommt eine E-Mail", "mit Fehlerdetails"], isize=42, ssize=11))

# ---------- Entry ----------
p.append(node(272, 270, 166, 120, SVC + "AmazonSimpleStorageService.svg", "Amazon S3 (Eingang)",
              ["Rohvideos, KMS-", "verschlüsselt"], isize=44, ssize=11))
p.append(node(464, 270, 160, 120, SVC + "AWSLambda.svg", "AWS Lambda (Start)",
              ["startet die", "Ausführung"], isize=44, ssize=11))
p.append(node(462, 445, 160, 120, SVC + "AmazonSimpleNotificationService.svg", "Amazon SNS",
              ["Fehlermeldung an", "das Betriebsteam"], isize=44, ssize=11))

# ---------- State machine ----------
p.append(node(675, 270, 150, 120, SVC + "AWSLambda.svg", "Prüfen",
              ["Format, Größe, Codec", "Retry 3×, wachsend"], isize=42, ssize=10))
p.append(node(855, 270, 150, 120, RES + "Question.svg", "Choice-Zustand",
              ["Ist die Datei gültig?", "reine Weiche, kein Code"], isize=42, ssize=10))
p.append(node(1035, 270, 150, 120, SVC + "AWSLambda.svg", "Umwandeln",
              ["Transcodieren und", "Vorschaubild, Retry 3×"], isize=42, ssize=10))
p.append(node(855, 445, 150, 120, RES + "Alert.svg", "Fehler-Zustand",
              ["Catch fängt jeden", "endgültigen Fehler"], isize=42, ssize=10))
p.append(node(1035, 445, 150, 120, SVC + "AWSLambda.svg", "Speichern",
              ["legt Ergebnis ab und", "schreibt Metadaten"], isize=42, ssize=10))

# ---------- Results ----------
p.append(node(1250, 270, 170, 120, SVC + "AmazonDynamoDB.svg", "Amazon DynamoDB",
              ["Job-Status jedes", "Schritts, Metadaten"], isize=44, ssize=11))
p.append(node(1250, 445, 170, 120, SVC + "AmazonSimpleStorageService.svg", "Amazon S3 (Ausgabe)",
              ["fertige Datei und", "Vorschaubild"], isize=44, ssize=11))

# ---------- Cross-cutting ----------
sec = [
    (SVC + "AWSIdentityandAccessManagement.svg", "AWS IAM", ["Rollen für Lambda", "und Step Functions"]),
    (SVC + "AWSKeyManagementService.svg", "AWS KMS", ["verschlüsselt beide", "Buckets"]),
    (SVC + "AmazonCloudWatch.svg", "Amazon CloudWatch", ["Logs, Metriken,", "Alarm bei Fehlern"]),
    (SVC + "AWSXRay.svg", "AWS X-Ray", ["zeigt, welcher Schritt", "wie lange braucht"]),
    (SVC + "AWSCloudTrail.svg", "AWS CloudTrail", ["protokolliert", "jeden Aufruf"]),
]
for i, (ip, t, subs) in enumerate(sec):
    p.append(node(386 + i * 190, 715, 160, 115, ip, t, subs, isize=38, tsize=12, ssize=10))

# ---------- Arrows ----------
A = []
A.append(path([(189, 330), (268, 330)]))                                   # 1
A.append(path([(438, 330), (460, 330)]))                                   # 2
A.append(path([(624, 330), (671, 330)]))                                   # 3
A.append(path([(825, 330), (851, 330)]))                                   # 4
A.append(path([(1005, 330), (1031, 330)]))                                 # 5
A.append(path([(1110, 390), (1110, 441)]))                                 # 6
A.append(path([(1185, 505), (1246, 505)]))                                 # 7
A.append(path([(1185, 330), (1246, 330)]))                                 # 8
A.append(path([(930, 390), (930, 441)]))                                   # 9
A.append(path([(851, 505), (626, 505)]))                                   # 10
A.append(path([(458, 505), (189, 505)]))                                   # 11
A.append(path([(750, 390), (750, 420), (890, 420), (890, 441)],
              dashed=True, color="#8A94A6"))                               # catch aus Prüfen
A.append(path([(1080, 390), (1080, 420), (970, 420), (970, 441)],
              dashed=True, color="#8A94A6"))                               # catch aus Umwandeln
p.append("".join(A))

# ---------- Arrow labels ----------
p.append(txt(1018, 266, "gültig", 11, True, "#3B7D2F"))
p.append(txt(952, 412, "ungültig", 11, True, "#A32D2D", "start"))
p.append(txt(820, 437, "Catch", 10, False, "#8A94A6"))
p.append(txt(1000, 437, "Catch", 10, False, "#8A94A6"))
p.append(txt(738, 487, "Fehlermeldung", 11, False, "#5A6570"))

# ---------- Badges ----------
for x, y, n in [(208, 330, 1), (449, 330, 2), (638, 330, 3), (838, 330, 4), (1018, 330, 5),
                (1110, 415, 6), (1228, 505, 7), (1228, 330, 8), (930, 415, 9),
                (740, 505, 10), (330, 505, 11)]:
    p.append(badge(x, y, n))

# ---------- Legend ----------
leg = [
    "1  Die Redaktion legt eine Videodatei im Eingangs-Bucket ab",
    "2  S3 meldet das neue Objekt (Event Notification) an Lambda",
    "3  Lambda startet die Ausführung des Zustandsautomaten",
    "4  Schritt 1 prüft die Datei und übergibt an die Weiche",
    "5  Ist die Datei gültig, geht es zum Umwandeln weiter",
    "6  Nach dem Umwandeln folgt automatisch der Speicher-Schritt",
    "7  Die fertige Datei landet im Ausgabe-Bucket",
    "8  Jeder Schritt schreibt seinen Status nach DynamoDB",
    "9  Ist die Datei ungültig, geht es direkt in den Fehler-Zustand",
    "10  Von dort meldet SNS den Fehler weiter",
    "11  Das Betriebsteam bekommt die Nachricht per E-Mail",
    "Graue Pfeile: Catch — schlägt ein Schritt endgültig fehl, greift derselbe Fehlerpfad",
]
p.append(txt(40, 925, "Ablauf Schritt für Schritt", 13, True, "#232F3E", "start"))
for i, s in enumerate(leg):
    col, row = divmod(i, 4)
    p.append(txt(40 + col * 520, 950 + row * 21, s, 12, False, "#3C4552", "start"))
p.append(txt(40, 1050, "Icons: AWS Architecture Icons (© Amazon Web Services, Inc.)", 10, False, "#8A94A6", "start"))

p.append("</svg>")

os.makedirs("/home/claude/out", exist_ok=True)
out = "/home/claude/out/stepfunctions-medien-architektur.svg"
open(out, "w", encoding="utf-8").write("".join(p))
print("SVG geschrieben:", out, os.path.getsize(out), "bytes")
print("QC-Warnungen:", len(warnings))
for w in warnings:
    print(" ", w)
