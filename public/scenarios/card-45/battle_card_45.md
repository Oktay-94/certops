---
nr: 45
title: "GuardDuty · Security Hub · EventBridge — zentrale Erkennung und automatische Reaktion"
services:
  - Amazon GuardDuty
  - GuardDuty Extended Threat Detection
  - AWS Security Hub CSPM
  - Amazon EventBridge
  - AWS Lambda
  - Amazon SNS
  - Amazon S3
domains:
  - D1
signalwords:
  - "detect threats across multiple accounts"
  - "centralized view of security findings"
  - "respond automatically without manual intervention"
  - "delegated administrator account"
  - "retain findings beyond the default period"
  - "isolate the compromised instance"
assets:
  svg: battle_card_45.svg
  png: battle_card_45.png
  pdf: battle_card_45.pdf
status_note: >
  QC 0 Befunde nach einer Korrekturrunde. Gemeldet: 10 Boxen,
  59 Texte, 26 Segmente, 7 Badges. Segmentzahl aufgeschlüsselt:
  5 Marker-Definitionen in <defs> erzeugen 10 Phantom-Segmente bei
  (0,0)-(8,4)-(0,8); real gezeichnet sind damit 16 Segmente —
  7 nummerierte Pfade mit zusammen 13 Teilstrecken, 1 verworfener
  Pfad mit 1 Teilstrecke, 2 X-Striche. 7 Badges = 6 Nummern-Badges
  plus das rote X, das qc.py korrekt von Prüfung (d) ausnimmt.
  Erste Runde: zwei Befunde aus derselben Ursache — Pfad 5 lief bei
  y=240 quer durch die Delegated-Admin-Box (215–345), das Label
  "Findings" kreuzte denselben Pfad. R2-Fall: "oben herum" wurde
  angenommen, ohne die Boxoberkante gegen die geplante y-Höhe zu
  halten. Neu geführt über y=195, im Korridor zwischen Zonenlabel
  und Boxoberkante, mit Zwischenstück bei x=575 zwischen den beiden
  Zonen.
  Render-Sanity: PNG 2400x1350. Fünf abgeleitete Freizonen geprüft,
  vier leer, eine belegt und aufgeklärt — ausschließlich schwarzer
  Text (kursive Zeile "Security Group ohne Regeln" bei y=546, deren
  Unterlängen unter die bei y=575 zu eng gesetzte Zonengrenze
  ragen). Keine Kollision. Alle acht Palettenfarben nachweisbar.
  Footer von Hand gemessen: 1221.9 px (Stil-Guide ~1420).
  Sichtprüfung: versucht, unbrauchbar — leerer Platzhalter. Vierte
  Karte dieses Batches in Folge mit diesem Fehlerbild (42, 43, 44,
  45); bei Karte 41 war es ein Bildobjekt ohne lesbaren Inhalt.
  Die Karte ist rechnerisch geprüft, aber von niemandem gesehen.
---

## Szenario

Ein Zahlungsdienstleister betreibt 30 AWS-Accounts unter einer Organization.
Nach einem Audit gilt: Bedrohungen müssen kontenübergreifend zentral sichtbar
sein, und auf kritische Funde muss automatisch reagiert werden — nicht erst,
wenn jemand morgens die Konsole öffnet.

Der erste Entwurf ließ jedes Team seine eigenen GuardDuty-Findings im eigenen
Account prüfen. Ergebnis: Ein kompromittierter EC2-Schlüssel blieb elf Tage
unbemerkt, weil im betroffenen Account niemand die Konsole aufmachte.

## Ablauf

**1 — GuardDuty erkennt, Extended Threat Detection verknüpft.**
GuardDuty wertet CloudTrail-Ereignisse, VPC Flow Logs und DNS-Abfragen aus.
Es ist ein managed Service: Es gibt keine eigenen Regeln zu schreiben und keine
Threat-Intelligence-Feeds zu pflegen. Extended Threat Detection setzt darauf
auf und korreliert Signale über längere Zeiträume — aus "Credential-Diebstahl"
plus "ungewöhnlicher Datenabfluss" wird **ein** Critical-Finding statt zweier
Einzelmeldungen, die niemand zusammenbringt. Das Finding trägt eine
Ereignis-Zeitleiste und eine Zuordnung zu MITRE ATT&CK.

**2 — Die Findings laufen im Delegated Admin Account zusammen.**
In einer Organization wird ein Account zum delegierten Administrator ernannt.
Dort landen die Findings aller Mitgliedskonten. Genau das löst das Problem des
ersten Entwurfs: Es gibt eine Stelle zum Hinschauen, nicht dreißig.

**3 — Security Hub CSPM sammelt und normalisiert.**
Neben GuardDuty fließen Inspector (Schwachstellen), Macie (sensible Daten) und
IAM Access Analyzer (öffentliche oder kontenübergreifende Ressourcen) ein.
Alles wird ins AWS Security Finding Format (ASFF) übersetzt, damit Findings
verschiedener Herkunft vergleichbar werden.

**4 — Was länger bleiben soll, wird weggeschrieben.**
GuardDuty hält Findings 90 Tage. Wer für Audits längere Zeiträume nachweisen
muss, exportiert nach S3 oder leitet die Findings über EventBridge an ein
eigenes Ziel weiter. Diese Frist ist ein häufiges Prüfungsdetail.

**5 — GuardDuty veröffentlicht jedes Finding an EventBridge.**
Das läuft parallel zur Sammlung in Security Hub, nicht danach. Jedes Finding
mit eigener Finding-ID erzeugt ein EventBridge-Ereignis.

**6 — Eine Regel filtert auf Severity und startet Lambda.**
Die Lambda-Funktion isoliert die betroffene Instanz, typischerweise durch
Zuweisen einer Security Group ohne Regeln. Das ist der Unterschied zwischen
"jemand sieht es irgendwann" und "die Instanz ist in Sekunden vom Netz".

**7 — SNS weckt das Bereitschaftsteam.**
Automatische Isolierung ersetzt keine Benachrichtigung. Die Automatik gewinnt
Zeit, die Entscheidung über das weitere Vorgehen bleibt bei Menschen.

**Verworfen — jedes Team prüft selbst.**
Dezentral ohne zentrale Sicht heißt: Erkennung findet statt, Reaktion nicht.

## Prüfungs-Kernsatz

**GuardDuty findet, Security Hub sammelt, EventBridge handelt — und was länger
als 90 Tage bleiben soll, muss weggeschrieben werden.**

## Abgrenzungen

- **GuardDuty ↔ Security Hub CSPM:** GuardDuty *erkennt Bedrohungen* aus
  Log-Analyse. Security Hub CSPM *prüft Konfigurationen* gegen Standards und
  *sammelt* Findings anderer Dienste. Erkennung gegen Sammlung und
  Posture-Prüfung.
- **GuardDuty ↔ Inspector ↔ Macie:** GuardDuty sucht nach Verhalten (jemand tut
  etwas Verdächtiges), Inspector nach Schwachstellen (etwas ist angreifbar),
  Macie nach sensiblen Daten (etwas Schützenswertes liegt irgendwo). Drei
  verschiedene Fragen, ein gemeinsamer Sammelpunkt.
- **Security Hub CSPM ↔ AWS Config:** Config liefert den Zustand der Ressourcen
  und ist die Grundlage vieler CSPM-Prüfungen. Wer CSPM ohne Config betreibt,
  bekommt einen Teil der Kontrollen nicht.
- **EventBridge ↔ SNS:** EventBridge ist der Verteiler mit Filterlogik, SNS die
  Benachrichtigung. In Fragen nach "automatisch reagieren" ist EventBridge die
  Antwort; SNS allein benachrichtigt nur.
- **Karte 45 ↔ Karte 49 (CloudTrail/Athena):** Hier geht es um *laufende
  Erkennung und sofortige Reaktion*, dort um *nachträgliche Forensik*.

## Klassiker-Fallen

- **GuardDuty für einen Konfigurationsprüfer halten.** GuardDuty findet
  Verhalten, keine Fehlkonfiguration. "Ist mein Bucket öffentlich?" beantwortet
  Security Hub CSPM oder IAM Access Analyzer, nicht GuardDuty.
- **Die 90-Tage-Frist übersehen.** Steht im Szenario eine Aufbewahrungspflicht
  über 90 Tage hinaus, ist Export nach S3 oder Weiterleitung über EventBridge
  die gesuchte Antwort — nicht "GuardDuty aktivieren".
- **Für jeden Account eine eigene Auswertung bauen.** In einer Organization ist
  der delegierte Administrator der vorgesehene Weg.
- **Vermeintliche Verzögerungen falsch deuten.** Neue Findings gehen nahezu in
  Echtzeit an EventBridge; **Wiederholungen** desselben Findings werden
  aggregiert und standardmäßig erst nach sechs Stunden gemeldet. Wer nur die
  Wiederholungen beobachtet, hält EventBridge fälschlich für langsam.
- **Beide Security Hubs verwechseln.** Siehe Faktencheck — das ist derzeit die
  gefährlichste Namensfalle im ganzen Security-Bereich.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**Security Hub wurde gespalten und umbenannt — das ist die stärkste Divergenz
dieses Batches.** Seit Juni 2025 heißt der bisherige Dienst **AWS Security Hub
CSPM** (Cloud Security Posture Management). Der Name "Security Hub" ging an
einen **neuen, anderen Dienst**, der auf CSPM aufsitzt und Findings korreliert
und priorisiert. Auf der re:Invent 2025 wurde die neue Fassung allgemein
verfügbar. Jedes Kursmaterial vor Mitte 2025 meint mit "Security Hub" das, was
heute Security Hub CSPM heißt. AWS hat für CSPM keinen Abkündigungszeitpunkt
genannt; beide Dienste existieren nebeneinander.
Quelle: AWS Security Blog, "Security Hub CSPM automation rule migration to
Security Hub" (Dezember 2025); AWS-Produktseite Security Hub CSPM; AWS News
Blog zur Preview (Juni 2025).

**Die beiden Dienste verwenden verschiedene Findings-Formate.** Security Hub
CSPM normalisiert nach **ASFF**, der neue Security Hub arbeitet mit **OCSF**.
Für die Prüfung relevant, weil bestehende Automatisierungen, die ASFF-Felder
auswerten, OCSF-Findings nicht verarbeiten. AWS beschreibt in der
Migrationsanleitung ausdrücklich Regeln, die sich wegen der Schema-Unterschiede
nicht automatisch übertragen lassen.
Quelle: AWS Security Blog, Migrationsanleitung für Automation Rules.

**GuardDuty Extended Threat Detection ist seit dem 01.12.2024 allgemein
verfügbar** — automatisch aktiv für alle neuen und bestehenden Kunden, ohne
Zusatzkosten. Es fasst mehrstufige Angriffe zu einem einzelnen
Critical-Severity-Finding zusammen, mit Ereignis-Zeitleiste und
MITRE-ATT&CK-Zuordnung. Seit dem 02.12.2025 auch für EC2 und ECS, mit den
Findings `AttackSequence:EC2/CompromisedInstanceGroup` und
`AttackSequence:ECS/CompromisedCluster`. Kursmaterial von vor 2025 kennt das
Konzept "Attack Sequence" nicht.
Quelle: AWS-Ankündigungen vom 01.12.2024, 14.03.2025 und 02.12.2025.

**GuardDuty speichert Findings 90 Tage.** Danach sind sie weg, sofern sie nicht
nach S3 exportiert oder über EventBridge weitergeleitet wurden.
Quelle: GuardDuty User Guide, "Processing GuardDuty findings with Amazon
EventBridge".

**Die Benachrichtigungsfrequenz ist zweigeteilt.** Neue Findings mit eigener
Finding-ID gehen nahezu in Echtzeit an EventBridge; Wiederholungen desselben
Findings werden aggregiert und standardmäßig erst nach sechs Stunden gemeldet.
Der Wert ist einstellbar.
Quelle: GuardDuty User Guide, Abschnitt zur EventBridge-Benachrichtigungsfrequenz.

## Nicht bestätigt

Zur Frage, ob AWS Security Hub CSPM langfristig abkündigen wird, gibt es keine
AWS-Quelle. Drittquellen spekulieren in beide Richtungen. Auf der Karte steht
deshalb nur der heutige Stand ("früher einfach Security Hub"), keine Aussage
über die Zukunft.

Nicht auf die Karte genommen: Angaben zu GuardDuty-Preisen. Sie hängen vom
analysierten Log-Volumen und den aktivierten Protection Plans ab; eine einzelne
Zahl wäre irreführend. Dass Extended Threat Detection **ohne Aufpreis** kommt,
steht dagegen auf der Karte — das sagt die AWS-Ankündigung wörtlich.

## Bewusste Vereinfachungen im Diagramm

- **Die Mitgliedskonten sind nicht einzeln gezeichnet.** "30 Accounts der
  Organization" steht als Zeile in der GuardDuty-Box. Dreißig Boxen hätten die
  Karte gefüllt, ohne etwas zu erklären.
- **Inspector, Macie und IAM Access Analyzer sind keine eigenen Boxen**, sondern
  Zeilen in der Security-Hub-CSPM-Box. Die Karte handelt vom Sammelpunkt, nicht
  von den Quellen.
- **Der Pfad zu EventBridge geht im Diagramm von GuardDuty aus**, obwohl er
  optisch an der zentralen Sicht vorbeiläuft. Das ist fachlich richtig und
  bewusst so gezeichnet: Die Reaktion hängt **nicht** davon ab, dass Security
  Hub das Finding zuerst verarbeitet hat. Wer den Pfeil durch Security Hub
  führen würde, würde eine Abhängigkeit suggerieren, die es nicht gibt.
- **Der neue Security Hub ist keine eigene Box**, sondern eine kursive Zeile.
  Er gehört fachlich dazu, ist aber im Szenario nicht im Einsatz; als Box hätte
  er die Karte um eine Ebene erweitert, die das Szenario nicht braucht.
- **Die Isolierung der Instanz ist als Ergebnis dargestellt**, nicht als
  Aufrufkette Lambda → EC2 → Security Group. Die Karte zeigt den Auslöseweg.

## Farbkonventionen dieser Karte

Fünfte Karte nach der festgeschriebenen Konvention, keine Neuvergabe:

- **Teal #0F7C8C** — Regel- und Auswerteinstanz: GuardDuty, Extended Threat
  Detection, Security Hub CSPM. Alle drei entscheiden anhand von Regeln bzw.
  Modellen, was ein Finding ist.
- **Navy #232F3E** — der Delegated Admin Account als **Account-Grenze**. Das ist
  die Bedeutung, die in dieser Session für Navy neben "Eintrittspunkt"
  festgeschrieben wurde, und hier ihr klarster Anwendungsfall im Batch.
- **Orange #D97706** — EventBridge und Lambda, nach Stil-Guide.
- **Pink #E7157B** — SNS, nach Stil-Guide unverändert.
- **Grün #3F8624** — S3 als Langzeitablage.
- **Rot #C7161D** — verworfener Pfad: dezentrale Prüfung je Team, mit rotem X.
- **Gold** kommt nicht vor: Das Szenario ist eine Sicherheits-, keine
  Kostenfrage.
