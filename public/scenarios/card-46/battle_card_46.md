---
nr: 46
title: "Inspector · ECR Enhanced Scanning · Security Hub CSPM"
services:
  - Amazon Inspector
  - Amazon ECR (Enhanced Scanning)
  - Amazon EventBridge
  - AWS Security Hub CSPM
  - Amazon ECS Fargate
  - AWS Systems Manager (SSM Agent)
domains:
  - D1
signalwords:
  - "newly disclosed CVE"
  - "already deployed images"
  - "continuously scan"
  - "without redeploying"
  - "shift security left"
  - "vulnerability management"
  - "no agent to install"
assets:
  - battle_card_46.svg
  - battle_card_46.png
  - battle_card_46.pdf
status_note: |
  QC (qc.py): 0 Befunde. 8 Boxen, 42 Texte, 14 Segmente, 5 Badges.
  Segmente aufgeschlüsselt (R5): 14 gemeldet − 6 Phantom-Segmente aus 3
  Marker-Definitionen (je 2) = 8 echte Segmente: 5 Ablaufpfeile + 1
  verworfener Pfad + 2 Striche des roten X.
  Badges aufgeschlüsselt (R6): 5 gezählt. Das rote X (Kreis r=20, weiß
  gefüllt, roter Rand) wurde von Prüfung (d) korrekt ausgenommen und ist
  in den 5 nicht enthalten.

  Korrekturrunden:
  1. Titel gemessen bei 1667 px — sprengt die Karte (ab x=60 stehen 1540 px
     zur Verfügung). Ursache: zu lange Service-Aufzählung. Gekürzt auf
     "Battle Card 46 — Inspector · ECR Enhanced Scanning" = 1190,7 px.
  2. Boxzeile "Service-Aktivierung nicht nötig" bei 216,5 px, verfügbar
     194 px in der CI/CD-Box. Ersetzt durch "ohne Service-Aktivierung"
     = 176,4 px.
  3. Footer-Variante A bei 1436,9 px gemessen — über der R3-Warnschwelle
     von ~1400 px, hätte qc.py (Limit 1542) durchgewinkt. Verworfen
     zugunsten Variante C.
  Alle drei Befunde entstanden vor dem Zeichnen durch die PIL-Messung (R4);
  keine Korrekturrunde am fertigen SVG nötig.

  Render-Sanity (R7): sechs geometrisch abgeleitete Freizonen, alle rein
  weiß. Erster Durchlauf meldete 36 nicht-weiße Pixel in Zone 2 — Ursache
  war ein Zonenfehler, kein Grafikfehler: die Zone reichte bis x=425, die
  äußere Kante des X-Kreises liegt bei x = 445 − 20 − 1,5 = 423,5, also
  1,5 px Überschneidung. Zone auf x≤420 nachgezogen, danach 0 nicht-weiße
  Pixel. Alle zehn geprüften Palettenfarben im PNG nachweisbar
  (Teal 19868 px, Navy 9630 px, Rot 5258 px, Füllungen und Textfarben je > 0).

  Schwarz-Prüfung (R13): reines Schwarz (0,0,0) = 0 px. Alle <path>-Elemente
  tragen explizit fill (Marker) bzw. sind als <line> ausgeführt; R12 greift
  hier nicht, da keine geknickten stroke-Pfade verwendet wurden.

  Footer von Hand gemessen (R3): 1206,2 px. Unter dem Stil-Guide-Wert
  (~1420 px) und unter der R3-Warnschwelle (~1400 px).

  Sichtprüfung (R8): versucht. Zurück kam ein Bildobjekt ohne für mich
  lesbaren Inhalt — dasselbe Muster wie in Batch 8 und 9. Rechnerisch
  geprüft ist nicht gesehen. Die Karte ist visuell unbestätigt und braucht
  einen Blick von Oktay.
---

## Szenario

Ein Fintech betreibt 40 Microservices als Container auf ECS Fargate. Ein
Pentest findet eine kritische CVE in einer Base-Image-Schicht, die seit acht
Monaten in Produktion läuft. Das Image war beim Push gescannt worden — und
war damals sauber. Die Schwachstelle wurde erst danach veröffentlicht.

Das Security-Team stellt zwei Forderungen: CVEs sollen vor dem Merge
auffallen, **und** bereits deployte Images sollen neu bewertet werden, wenn
später eine CVE bekannt wird. Der zweite Teil ist der eigentliche Kern —
er ist mit einem Scan zum Push-Zeitpunkt grundsätzlich nicht erfüllbar.

## Ablauf

**1 — Build-Zeit: Scan vor dem Push.** Das Inspector-Plugin läuft als
Schritt in der CI/CD-Pipeline (Jenkins, TeamCity, GitHub Actions oder
CodeCatalyst) und bewertet das Image, bevor es die Registry erreicht. Bei
einem Critical-Finding bricht der Build ab. Bemerkenswert: dieser Weg
funktioniert **ohne aktivierten Inspector-Service im Account** — es genügt
ein gültiger AWS-Account. Die Pipeline darf on-premises, in AWS oder hybrid
laufen.

**2 — Push in ECR mit Enhanced Scanning.** Das Image landet in einer
privaten Registry, für die Enhanced Scanning aktiv ist. Enhanced Scanning
ist die Integration mit Inspector; es erkennt Schwachstellen sowohl in
Betriebssystem-Paketen als auch in Sprachpaketen (npm, pip, Maven, Go,
Corretto und weitere). Wichtig für die Prüfung: Das Aktivieren konvertiert
**alle** Repositories der privaten Registry von Basic auf Enhanced — die
Entscheidung fällt registry-weit, nicht pro Repository. Über Filter lässt
sich anschließend steuern, welche Repositories nur beim Push und welche
kontinuierlich gescannt werden; überlappen die Filter, gewinnt der
Continuous-Filter.

**3 — Continuous Scanning: der eigentliche Fix.** Inspector bewertet
bestehende Images neu, sobald eine neue CVE veröffentlicht wird. Ein Image,
das letzte Woche sauber war, kann heute Findings tragen, ohne dass jemand
etwas gepusht hat. Standardmäßig überwacht Inspector ein Image 90 Tage;
die Dauer ist über Push-Datum, Pull-Datum und "last in use" konfigurierbar
bis hin zu "Lifetime". Gescannt werden nur Images mit `imageStatus = ACTIVE`.
Läuft die Frist ab, zeigt der Scan-Status `SCAN_ELIGIBILITY_EXPIRED`.

**4 — Dieselbe Aktivierung deckt EC2 mit ab.** Wer Inspector einschaltet,
bekommt EC2-Scanning im Hybrid-Modus dazu: Wo der SSM Agent läuft, sammelt
Inspector das Software-Inventar darüber, ereignisgetrieben. Wo kein SSM
Agent vorhanden ist, greift agentloses Scanning über EBS-Snapshots, das
mindestens alle 24 Stunden läuft. Neue Accounts landen automatisch im
Hybrid-Modus. Network-Reachability-Scans laufen unabhängig davon alle
12 Stunden.

**5 — Reaktion über EventBridge und Security Hub CSPM.** Inspector emittiert
Events, wenn ein Erstscan fertig ist und wenn ein Finding erzeugt, geändert
oder geschlossen wird. EventBridge routet das an Ticket-System und Alarm.
Seit Mai 2025 mappt Inspector ECR-Images zusätzlich auf laufende ECS-Tasks
und EKS-Pods — dadurch lässt sich unterscheiden, ob eine verwundbare Schicht
nur in der Registry liegt oder tatsächlich in Produktion läuft. Diese
Zuordnung kostet nichts extra.

**Verworfen — ECR Basic Scanning.** Basic Scanning ist in ECR eingebaut und
kostenlos, scannt aber ausschließlich zum Push-Zeitpunkt. Genau der Fall aus
dem Szenario — eine CVE, die erst nach dem Push veröffentlicht wird — bleibt
damit unsichtbar. Basic ist nicht "die günstigere Variante desselben", es
löst die Anforderung strukturell nicht.

## Prüfungs-Kernsatz

**Basic scannt beim Push. Enhanced scannt auch danach.** Steht in der Frage
"newly disclosed", "already deployed" oder "without redeploying", ist Basic
raus.

## Abgrenzungen

**46 ↔ 45:** Inspector findet **bekannte Schwachstellen im Softwarebestand**
(CVEs in Paketen und Images). GuardDuty findet **Verhalten zur Laufzeit**
(Krypto-Mining, verdächtige API-Aufrufe, C2-Kommunikation). Inspector findet
die verwundbare Bibliothek, GuardDuty findet den, der sie ausnutzt. Beide
liefern nach Security Hub CSPM.

**46 ↔ Security Hub CSPM:** Inspector erzeugt Findings, Security Hub CSPM
aggregiert und korreliert sie über Accounts und Dienste hinweg. Security Hub
scannt nichts selbst.

**Inspector ↔ Inspector Classic:** Zwei verschiedene Dienste mit demselben
Namen. Siehe Faktencheck.

## Klassiker-Fallen

**"Inspector braucht einen Agent."** Für Container-Image-Scanning,
Lambda-Scanning und Network Reachability sind gar keine Agents nötig. Für
EC2-Package-Scanning wird der SSM Agent empfohlen, ist aber im Hybrid-Modus
ebenfalls nicht zwingend. Einen eigenen Inspector-Agent gibt es im aktuellen
Dienst überhaupt nicht.

**"Enhanced Scanning pro Repository aktivieren."** Die Umstellung
Basic → Enhanced gilt registry-weit. Nur die Scan-*Frequenz* (on-push vs.
continuous) ist per Filter steuerbar.

**"Continuous Scanning läuft ewig."** Standardmäßig 90 Tage. Danach
`SCAN_ELIGIBILITY_EXPIRED`. Wer dauerhafte Überwachung will, muss die Dauer
aktiv hochsetzen.

**"Das CI/CD-Plugin braucht einen aktivierten Inspector-Service."** Nein —
das Plugin arbeitet mit einem gültigen AWS-Account, ohne den Dienst im
Account zu aktivieren.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**Inspector Classic ist seit dem 20.05.2026 abgeschaltet.** AWS nahm ab
20.05.2025 keine neuen Kunden mehr an; nach dem 20.05.2026 ist weder die
Classic-Konsole noch sind Classic-Ressourcen erreichbar. Jedes Kursmaterial,
das *Assessment Targets*, *Assessment Templates*, *Rules Packages*,
*Assessment Runs* oder die Installation von `awsagent` per
`AmazonInspector-ManageAWSAgent` beschreibt, beschreibt einen Dienst, den es
nicht mehr gibt. Diese Karte ist zwei Monate nach der Abschaltung entstanden.
*Quelle: docs.aws.amazon.com/inspector/v1/userguide/inspector-migration.html*

**Der aktuelle Inspector nutzt den SSM Agent, keinen eigenen.** Der Classic-
Agent ist obsolet. Der neue Dienst scannt kontinuierlich und automatisch;
manuelle Assessment Runs existieren nicht mehr.
*Quelle: docs.aws.amazon.com/inspector/v1/userguide/inspector-migration.html,
aws.github.io/aws-security-services-best-practices/guides/inspector/*

**Agentless Scanning ist seit 22.04.2024 GA, Hybrid ist Default.** Neue
Accounts werden automatisch in Hybrid Scanning eingeschrieben. Kursmaterial
von vor Mitte 2024 kennt nur den agentbasierten Weg und behauptet, ohne SSM
Agent sei kein EC2-Scanning möglich.
*Quelle: aws.amazon.com/about-aws/whats-new/2024/04/amazon-inspector-agentless-vulnerability-assessments-ec2-ga,
docs.aws.amazon.com/inspector/latest/user/scanning-ec2.html*

**Scan-Kadenzen sind unterschiedlich und werden oft vermischt.**
Network Reachability alle 12 Stunden; agentless Package-Scans mindestens
alle 24 Stunden; agentbasierte Scans ereignisgetrieben (z. B. bei
Paketinstallation), nicht auf festem Intervall.
*Quelle: docs.aws.amazon.com/inspector/latest/user/scanning-ec2.html*

**CI/CD-Integration ist breiter als oft dargestellt.** Seit 30.11.2023
Jenkins und TeamCity, seit 06.06.2024 zusätzlich GitHub Actions und
CodeCatalyst — vier Werkzeuge, nicht zwei.
*Quelle: aws.amazon.com/about-aws/whats-new/2024/06/amazon-inspector-container-image-scanning-codecatalyst-github-actions*

**Image-zu-Task-Mapping seit 19.05.2025.** Inspector ordnet ECR-Images
laufenden ECS-Tasks und EKS-Pods zu, ohne Zusatzkosten. In älterem Material
nicht enthalten.
*Quelle: aws.amazon.com/about-aws/whats-new/2025/05/amazon-inspector-container-security-images*

**Scan-Abdeckung wurde 2025 mehrfach erweitert.** Seit 14.02.2025 neue
Scan-Engine für ECR (bestehende Findings können sich dadurch schließen oder
neu auftauchen); seit 12.03.2025 Unterstützung für scratch-, distroless- und
Chainguard-Images sowie zusätzliche Ökosysteme (Go, Oracle JDK/JRE, Corretto,
Tomcat, httpd, WordPress, Node.js). Kursmaterial, das Inspector auf
OS-Pakete reduziert, ist überholt.
*Quelle: aws.amazon.com/about-aws/whats-new/2025/02/amazon-inspector-security-engine-container-images-scanning,
aws.amazon.com/about-aws/whats-new/2025/03/amazon-inspector-container-base-images-enhanced-detections*

## Nicht bestätigt

**Preise für Inspector-Scans.** Es existiert ein Preis pro EC2-Instanz und
pro Container-Image-Scan; konkrete Beträge wurden in dieser Recherche nicht
gegen die AWS-Preisseite verifiziert und stehen deshalb nicht auf der Karte.
Die Karte sagt zu Kosten nur, dass Basic Scanning in ECR eingebaut ist und
das Image-zu-Task-Mapping ohne Aufpreis kommt — beides ist durch AWS-Quellen
gedeckt.

**15-Tage-Testphase.** Die Inspector-FAQ nennt einen 15-tägigen kostenlosen
Test für neue Accounts. Nicht auf der Karte, da für die Prüfungslogik
irrelevant und in FAQs erfahrungsgemäß volatil.

**Windows-Agentless-Erweiterung vom 18.03.2026.** Eine Ankündigung nennt
erweitertes agentloses Scanning inklusive Windows-OS und KB-basierter
Findings. Nur über die Ankündigungsseite belegt, nicht in der
Service-Dokumentation gegengeprüft — deshalb nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

**Der Rückfluss der Findings zur Registry ist nicht gezeichnet.** Findings
sind in ECR *und* in der Inspector-Konsole sichtbar; die Karte zeigt nur den
Weg nach Inspector, um Pfeil 2 nicht bidirektional zu machen.

**"EC2 Hybrid Scanning" steht als eigene Box, ist aber kein eigener Dienst.**
Es ist eine Scan-Methode desselben Inspector. Der gestrichelte Pfeil 4 mit
dem Label "dieselbe Aktivierung" soll das ausdrücken; eine Zone hätte das
sauberer gezeigt, kollidierte aber mit dem verworfenen Pfad.

**Der Weg von Fargate zurück zu Inspector fehlt.** Das Image-zu-Task-Mapping
ist technisch eine Rückmeldung aus der Laufzeitumgebung an Inspector. Die
Karte zeigt Pfeil 5 nur in eine Richtung (EventBridge → Fargate), weil der
Kartenkern die Scan-Kette ist, nicht die Mapping-Mechanik.

**Security Hub CSPM ist als Zeile in der EventBridge-Box geführt**, nicht als
eigene Box. Fachlich sind es zwei getrennte Dienste; die Trennung hätte eine
siebte Box gekostet, ohne den Prüfungskern zu schärfen. Der korrekte Name
seit Juni 2025 ist **Security Hub CSPM** — nicht "Security Hub", siehe die
Aufspaltung aus Batch 9.

## Farbkonventionen dieser Karte

**Teal #0F7C8C** — Inspector, ECR, EventBridge/Security Hub CSPM, EC2 Hybrid
Scanning. Alles Regel- und Konfigurationsinstanzen nach der in Batch 9
festgeschriebenen Konvention.

**Navy #232F3E** — CI/CD Pipeline und ECS Fargate als Eintrittspunkte in die
Kette. Die Pipeline speist Images ein, Fargate ist der Laufzeit-Endpunkt.

**Rot #C7161D** — ausschließlich der verworfene Pfad: Box-Rand von ECR Basic
Scanning und das rote X auf dem Pfeil zur Registry.

**Kein Gold auf dieser Karte.** Basic Scanning ist nicht "die billigere
Option, die deshalb verworfen wird" — es erfüllt die Anforderung fachlich
nicht. Rot allein sagt hier korrekt: verworfen, und der Grund steht in der
Box, nicht in einer zweiten Farbe.

**Keine neue Farbkategorie eingeführt.**
