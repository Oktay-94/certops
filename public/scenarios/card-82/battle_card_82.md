---
nr: 82
title: "AWS Backup — zentral über Accounts"
services: ["AWS Backup", "AWS Backup Vault Lock", "AWS Organizations", "Amazon S3", "Amazon EBS", "Amazon RDS"]
domains: [D1, D2]
signalwords:
  - "centrally manage and monitor backups across accounts"
  - "backups cannot be deleted or altered"
  - "not even by the root user"
  - "meet regulatory retention requirements"
  - "protect against accidental or malicious deletion"
assets: ["battle_card_82.svg", "battle_card_82.png", "battle_card_82.pdf"]
status_note: |
  qc.py: 0 Befunde. 7 Boxen, 33 Texte, 12 Segmente, 4 Badges, 1 X-Kreis.
  Segmente aufgeschlüsselt: 6 echte Pfeilsegmente (der Steuerungspfeil ist
  dreiteilig) + 2 X-Diagonalen + 4 Phantom-Segmente aus zwei Marker-<defs>-
  Pfaden (bekannte qc.py-Blindstelle). Zwei Marker, weil zwei Pfeilfarben.
  Korrekturrunde (VOR dem Zeichnen durch svgkit-assert gefunden):
    1. Footer mit 1554 px über der Grenze von 1420 px. Zwei Merksätze gekürzt,
       Ergebnis 1402 px.
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde.
  R12-Gegencheck: 0 gestrokte <path> ohne fill="none".
  R16: engster gemessener Abstand eines freien Labels zu einer Boxkante
  24,4 px. Keine Überlappung. Die Zonenlabels wurden bewusst per label_x nach
  rechts versetzt (620 bzw. 1180), damit sie nicht mit dem Steuerungspfeil und
  dem Badge 1 kollidieren — das ist die Zonenrand-Falle aus Batch 16.
  Footer von Hand gemessen: 1402 px (Grenze 1420 px) — knapp, bei jeder
  Textänderung neu prüfen.
  Sichtprüfung: AUSSTEHEND. Erfolgt lokal durch Oktay vor dem Repo-Einbau.
---

# Battle Card 82 — AWS Backup, zentral über Accounts

**Szenario:** Ein Medizintechnik-Hersteller muss nachweisen, dass die Backups aus 40 AWS-Accounts sieben Jahre lang unveränderlich aufbewahrt werden — auch dann, wenn ein Administrator-Account übernommen wird.

## Ablauf

- **1 — AWS Organizations (Governance):** Die Backup Policy wird einmal zentral definiert und an die Organisationseinheiten vererbt. Die Ressourcenauswahl läuft über Tags, nicht über Listen einzelner ARNs. Das ist der eigentliche Gewinn gegenüber Eigenbau: Ein neues Team, das einen neuen Account bekommt, ist am ersten Tag abgedeckt, ohne dass jemand daran denken muss. Die Verwaltung lässt sich an einen delegierten Administrator-Account übertragen, damit nicht im Management-Account gearbeitet werden muss.

- **2 — Backup Plan (Governance):** Der Plan besteht aus Regeln, und eine Regel ist im Kern Zeitplan plus Lifecycle. Er läuft im Workload-Account, dort, wo die Ressourcen liegen.

- **3 — Lokaler Vault (Storage):** Der Recovery Point entsteht **immer zuerst im Quell-Account**. Das ist ein Punkt, an dem viele Entwürfe scheitern: Man kann kein Backup direkt in einen fremden Account schreiben. Erst die **Copy Action** legt eine Kopie im zentralen Vault des Backup-Accounts ab, und dabei gleich in einer zweiten Region. Erst diese Kopie überlebt die Kompromittierung des Workload-Accounts.

- **4 — Vault Lock (Governance):** Der zentrale Vault wird im **Compliance Mode** verschlossen. Es gibt eine Grace Time, die mindestens drei Tage (72 Stunden) betragen muss. Bis dahin lässt sich der Lock noch entfernen oder ändern. Danach ist er unveränderlich — von keinem Benutzer, nicht vom Root-Benutzer und nicht von AWS. Das ist der Teil, der den Nachweis gegenüber dem Prüfer trägt.

- **✗ Verworfen — Governance Mode als Schutz vor Ransomware:** Im Governance Mode kann jeder Benutzer mit ausreichenden IAM-Rechten den Lock wieder entfernen. Gegen genau das Angriffsbild, um das es hier geht — der Angreifer hat Administratorrechte — schützt er also nicht. Der Governance Mode ist eine Leitplanke gegen Versehen, kein Schloss gegen Absicht.

## Prüfungs-Kernsatz

**Nur der Compliance Mode macht Backups unveränderlich; der Governance Mode lässt sich von jedem mit ausreichenden IAM-Rechten wieder aufheben.**

## Abgrenzungen

- **82 ↔ 79 (Storage Gateway):** Karte 79 bringt eine bestehende Backup-Software an AWS heran. Karte 82 ersetzt die Backup-Software durch einen AWS-Dienst.
- **82 ↔ 81/83:** AWS Backup ist die Datenschicht jeder DR-Strategie. Der Reliability Pillar hält fest, dass **alle** DR-Strategien Backups innerhalb der Region und deren Kopie in die Recovery-Region verlangen — auch Active/Active, weil Replikation allein nicht gegen Datenverfälschung schützt.
- **Vault Lock ↔ S3 Object Lock:** Gleiches Prinzip, andere Reichweite. Object Lock sichert Objekte in einem Bucket, Vault Lock sichert Recovery Points über viele Dienste hinweg.

## Klassiker-Fallen

1. **„Backup direkt in den zentralen Account schreiben."** → Geht nicht. Erst lokaler Recovery Point, dann Copy Action. Antwortoptionen, die diesen Zwischenschritt weglassen, sind falsch.
2. **Cold Storage falsch gerechnet.** → In Cold Storage überführte Backups müssen dort mindestens 90 Tage bleiben. Die Retention muss also 90 Tage **über** dem Transitionswert liegen. Wer 30 Tage warm und 60 Tage gesamt einstellt, bekommt einen Fehler statt eines Backups. AWS empfiehlt zusätzlich, frühestens nach 8 Tagen in Cold Storage zu überführen, weil sonst ein weiteres warmes Vollbackup erzeugt wird.
3. **Compliance Mode aus Versehen scharf schalten.** → Nach Ablauf der Grace Time bleibt jede Fehlkonfiguration stehen. AWS warnt ausdrücklich vor Recovery Points mit Retention „Always": Die bleiben dann für immer erhalten und kosten dauerhaft.
4. **Governance Mode für regulatorische Nachweise nehmen.** → Genügt nicht, sobald der Prüfer nach Schutz vor privilegierten Benutzern fragt.

## Faktencheck-Notizen (23.07.2026)

- **Zwei Vault-Lock-Modi, Wirkung** — AWS-Dokumentation „AWS Backup Vault Lock": Vaults im Governance Mode können von Benutzern mit ausreichenden IAM-Rechten entsperrt werden; ein Lock im Compliance Mode kann von keinem Benutzer und nicht von AWS geändert oder gelöscht werden. Primärquelle.
- **Grace Time mindestens 72 Stunden** — bestätigt aus zwei AWS-Quellen: der CloudFormation-Referenz zu `LockConfigurationType` (72-Stunden-Cooling-off, `ChangeableForDays` muss 3 oder größer sein) und der re:Post-Anleitung von AWS („mindestens drei Tage (72 Stunden)"). Governance Mode = `ChangeableForDays` weglassen.
- **Cold Storage: mindestens 90 Tage** — AWS-Dokumentation `API_Lifecycle` und „Backup plan options and configuration", gleichlautend. Primärquelle.
- **Empfehlung 8 Tage warm** — AWS-Dokumentation „Create a backup plan": bei zu früher Überführung erzeugt AWS Backup ein weiteres warmes Vollbackup.
- **Kostenwarnung „Always"** — AWS-Dokumentation „AWS Backup Vault Lock", wörtliche Warnung.

### Nicht bestätigt / offener Punkt

- **Wer Organizations-Backup-Policies anlegen darf.** Der AWS Storage Blog kündigt an, dass die Verwaltung von Backup-Policies und die kontenübergreifende Überwachung an Mitgliedskonten delegiert werden kann. Eine re:Post-Antwort (Community, keine Primärquelle) behauptet dagegen, das Anlegen von Policies bleibe dem Management-Account vorbehalten. Auf der Karte steht deshalb nur „zentral definiert, an alle OUs vererbt" ohne Aussage darüber, welcher Account sie anlegt. Für SAA-C03 ist diese Tiefe nicht prüfungsrelevant.
- **Logically air-gapped Vault** ist bewusst nicht auf der Karte. Der Dienst existiert und ist für dieses Szenario relevant, führt aber eine dritte Vault-Art ein und hätte den Ablauf überladen. Kandidat für eine eigene Karte oder eine Erweiterung beim Sammelpass.

### Bewusste Vereinfachungen im Diagramm

- Die 40 Workload-Accounts sind als eine Zone gezeichnet („Workload-Account (40×)"). Es gibt keine Darstellung der OU-Struktur.
- Die IAM-Rolle, die AWS Backup für Backup und Copy annimmt, ist weggelassen.
- Wiederherstellung (Restore) und Restore Testing sind nicht dargestellt — die Karte beantwortet die Aufbewahrungsfrage, nicht die Wiederanlauffrage.

### Farbkonventionen dieser Karte

Rollenkonform. Gold für alle drei Governance-Elemente (Organizations, Backup Plan, Vault Lock) und für den Steuerungspfeil, Grün für die beiden Vaults als Speicherorte, Navy für die Datenfluss-Pfeile, Rot für den verworfenen Pfad. Die zwei Pfeilfarben unterscheiden Steuerung (Gold) von Datenfluss (Navy); Badges tragen jeweils die Farbe ihres Pfeils.
