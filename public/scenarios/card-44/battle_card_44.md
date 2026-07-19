---
nr: 44
title: "Secrets Manager vs Parameter Store — Rotation gegen Konfiguration"
services:
  - AWS Secrets Manager
  - AWS Systems Manager Parameter Store
  - AWS Lambda (Rotation)
  - Amazon RDS
  - AWS KMS
domains:
  - D1
  - D4
signalwords:
  - "automatically rotate database credentials"
  - "store configuration data securely"
  - "most cost-effective solution"
  - "credentials must be rotated every 30 days"
  - "without changing application code"
  - "encrypted parameters"
assets:
  svg: battle_card_44.svg
  png: battle_card_44.png
  pdf: battle_card_44.pdf
status_note: >
  QC 0 Befunde nach zwei Korrekturrunden. Gemeldet: 9 Boxen, 51 Texte,
  22 Segmente, 6 Badges. Segmentzahl aufgeschlüsselt: 4
  Marker-Definitionen in <defs> erzeugen 8 Phantom-Segmente bei
  (0,0)-(8,4)-(0,8); real gezeichnet sind damit 14 Segmente — 6
  nummerierte Pfade mit zusammen 12 Teilstrecken und 2 X-Striche.
  6 Badges = 6 Nummern-Badges; das rote X ist weiß gefüllt mit Rand
  und wird von qc.py korrekt nicht als Badge gezählt.
  Erste Runde: zwei (c)-Befunde, beide echte R2-Fälle — Pfad 5 lief
  senkrecht bei x=220 durch die Microservices-Box (420–540), Pfad 6
  bei x=1005 durch die Gold-Box (430–540). Beide Pfade seitlich
  vorbeigeführt (x=55 bzw. x=1200).
  Zweite Runde: das Label "verworfen" kreuzte danach den neuen
  Pfad 6. Erster Verschiebeversuch auf y=640 traf exakt die
  Horizontale desselben Pfades — geschätzt statt gerechnet, derselbe
  Fehlertyp wie R2. Danach die Freistelle tatsächlich ausgerechnet
  (Gold-Box endet 540, Pfad liegt bei 640, Zonenrand bei 600) und
  auf y=575 gesetzt.
  Render-Sanity: PNG 2400x1350. Fünf abgeleitete Freizonen geprüft,
  drei leer, zwei belegt und aufgeklärt — beide enthalten
  ausschließlich schwarzen Text (kursive Box-Zeilen, deren
  Unterlängen unter die zu eng geschnittene Zonengrenze ragen).
  Keine Kollision. Alle acht Palettenfarben nachweisbar.
  Footer von Hand gemessen: 1279.6 px (Stil-Guide ~1420). Zwei
  breitere Varianten (1440.3 und 1398.5 px) wurden verworfen.
  Sichtprüfung: versucht, unbrauchbar — leerer Platzhalter, wie bei
  Karte 42 und 43. Die Karte ist rechnerisch geprüft, aber von
  niemandem gesehen.
---

## Szenario

Ein Versicherungsunternehmen betreibt 40 Microservices. In deren Konfiguration
stecken zwei sehr verschiedene Dinge: Zugangsdaten für eine RDS-Instanz, die
laut Konzernrichtlinie alle 30 Tage rotiert werden müssen — und rund 3.000
Konfigurationswerte wie Feature-Flags, Endpunkt-URLs und Timeouts, die sich
selten ändern und nie rotiert werden.

Der erste Entwurf legte alles in Secrets Manager ab. Die Rechnung wuchs mit
jedem Service, obwohl der weitaus größte Teil der Werte nie eine Rotation
brauchte.

## Ablauf

**1 — Der Rotations-Zeitplan startet die Rotation Lambda.**
Secrets Manager ruft dieselbe Funktion viermal hintereinander auf und teilt ihr
über den `Step`-Parameter mit, welcher Abschnitt gerade dran ist. Für RDS,
Aurora, DocumentDB und Redshift liefert AWS fertige Vorlagen; für alles andere
schreibt man die Funktion selbst.

**2 — Die vier Schritte laufen ab.**
`createSecret` erzeugt den neuen Wert und legt ihn unter dem Staging-Label
`AWSPENDING` ab. `setSecret` schreibt ihn ins Zielsystem, hier also in RDS.
`testSecret` baut mit den neuen Zugangsdaten eine Verbindung auf und prüft, ob
sie funktionieren. Erst `finishSecret` hängt `AWSCURRENT` auf die neue Version
um; die alte wird zu `AWSPREVIOUS`. Der Testschritt ist der Grund, warum eine
fehlgeschlagene Rotation die Anwendung nicht mitreißt — solange der Test nicht
besteht, bleibt `AWSCURRENT` unverändert.

**3 — Die Microservices lesen immer `AWSCURRENT`.**
Sie fragen nie nach einer Versionsnummer, sondern nach dem Label. Deshalb
brauchen sie keine Kenntnis vom Rotationszeitpunkt und keinen Neustart. Das ist
der eigentliche Mehrwert von Secrets Manager gegenüber einem selbstgebauten
Rotationsskript.

**4 — Die 3.000 Konfigurationswerte liegen im Parameter Store.**
Standard Tier: bis zu 10.000 Parameter je Region und Account, 4 KB je Wert, kein
Aufpreis. Sensible Werte werden als `SecureString` abgelegt und dabei von KMS
verschlüsselt — die Verschlüsselung ist also kein Argument für Secrets Manager,
sie gibt es hier auch.

**5 und 6 — KMS ist die gemeinsame Basis.**
Beide Dienste verschlüsseln mit KMS und werden über IAM abgesichert. Sie sind
nicht Alternativen auf derselben Ebene, sondern zwei Aufsätze auf demselben
Fundament.

**Verworfen — alles in Secrets Manager.**
Der erste Entwurf zahlt für einen Lebenszyklus-Dienst bei 3.000 Werten, die
keinen Lebenszyklus haben. Secrets Manager wird je Secret und Monat berechnet,
der Parameter Store im Standard Tier nicht.

## Prüfungs-Kernsatz

**Secrets Manager kauft man für den Lebenszyklus, nicht für die Verschlüsselung
— die kann Parameter Store auch.**

## Abgrenzungen

- **Rotation ↔ Verschlüsselung:** Der einzige belastbare Trennstrich. Beide
  Dienste verschlüsseln mit KMS, beide binden an IAM. Nur Secrets Manager
  rotiert von sich aus, repliziert regionsübergreifend und erzeugt Zufallswerte.
- **Standard Tier ↔ Advanced Tier:** Standard bis 10.000 Parameter und 4 KB,
  ohne Aufpreis, ohne Parameter Policies. Advanced bis 100.000 Parameter und
  8 KB, mit Parameter Policies, kostenpflichtig.
- **Karte 44 ↔ Karte 43:** Dort ging es um den Schlüssel selbst (KMS,
  Envelope Encryption). Hier um das, was mit dem Schlüssel geschützt wird.
  Secrets Manager und Parameter Store sitzen beide *auf* KMS.
- **Secrets Manager ↔ Karte 41:** Ein Secret ist ein Geheimnis, das gespeichert
  und rotiert wird. Eine Rolle ist gar kein Geheimnis. Wo eine Rolle möglich
  ist (Karte 41), braucht man kein Secret — Secrets Manager ist für Fälle, in
  denen ein Passwort unvermeidlich ist, etwa bei einer Datenbank-Engine.

## Klassiker-Fallen

- **Secrets Manager wählen, weil "es verschlüsselt ist".** Der häufigste
  Denkfehler dieser Karte. `SecureString` im Parameter Store ist ebenfalls
  KMS-verschlüsselt. Fragt das Szenario nach Kostenoptimierung *ohne*
  Rotationsanforderung, ist Parameter Store die Antwort.
- **Advanced Tier für umkehrbar halten.** Standard → Advanced geht jederzeit,
  Advanced → Standard **nie**. Der Rückweg würde den Wert von 8 KB auf 4 KB
  abschneiden und alle Parameter Policies löschen. Wer zurück will, muss den
  Parameter löschen und neu anlegen.
- **Den Testschritt übersehen.** In Fragen zu fehlgeschlagenen Rotationen ist
  `testSecret` die Stelle, an der der Ablauf abbricht — die Anwendung läuft
  dabei ungestört weiter, weil `AWSCURRENT` noch auf dem alten Wert steht.
- **Parameter Policies im Standard Tier erwarten.** Ablaufdaten und
  Benachrichtigungen bei Nichtänderung gibt es nur im Advanced Tier.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**Advanced Tier ist eine Einbahnstraße.** Die AWS-Doku ist hier eindeutig: Ein
Standard-Parameter lässt sich jederzeit zu Advanced heraufstufen, der Rückweg
ist gesperrt, weil er Datenverlust bedeuten würde (Kürzung von 8 KB auf 4 KB
und Verlust aller Policies). Vergleichstabellen in Kursmaterial führen die
Tiers meist als gleichwertige Optionen auf, ohne die Einbahnstraße zu nennen.
Quelle: Systems Manager API Reference, `PutParameter`; Systems Manager User
Guide, "Managing parameter tiers".

**Advanced Parameter nutzen eine andere Verschlüsselungsform als Standard.** Das
steht so in der AWS-Doku und wird in praktisch jeder Vergleichstabelle
unterschlagen.
Quelle: Systems Manager User Guide, "Managing parameter tiers", mit Verweis auf
"How Systems Manager Parameter Store uses AWS KMS".

**Standard- und Advanced-Parameter zählen getrennt.** Man kann in derselben
Region und demselben Account bis zu 100.000 Advanced- **und** 10.000
Standard-Parameter haben. Die Kontingente addieren sich, sie ersetzen einander
nicht.
Quelle: Systems Manager User Guide, "AWS Systems Manager Parameter Store".

**Der Rotationsablauf hat vier benannte Schritte.** `createSecret`, `setSecret`,
`testSecret`, `finishSecret` — belegt durch die AWS-Troubleshooting-Seite, die
sie namentlich aufführt und zusätzlich den `RotationToken`-Parameter im
Lambda-Event dokumentiert. Kursmaterial beschreibt Rotation oft nur als
"Lambda tauscht das Passwort", wodurch der Testschritt und damit die
Absicherung gegen fehlgeschlagene Rotationen verlorengeht.
Quelle: Secrets Manager User Guide, "Troubleshoot AWS Secrets Manager rotation".

## Nicht bestätigt

**Die kursierenden Preise stehen nicht auf der Karte.** In Drittquellen finden
sich durchgehend 0,40 $ je Secret und Monat für Secrets Manager sowie 0,05 $ je
Advanced-Parameter und Monat. Diese Zahlen ließen sich nicht gegen eine
AWS-Preisseite absichern und stammen ausschließlich aus Blogs und
Vergleichsseiten. Auf der Karte steht deshalb nur, was die AWS-Doku deckt:
Standard Tier "ohne Aufpreis", Advanced Tier und Secrets Manager
"kostenpflichtig". Für die Prüfung reicht die Richtung der Aussage; wer konkrete
Zahlen braucht, schaut auf die AWS-Preisseiten.

Ebenfalls nicht auf der Karte: Angaben zur Durchsatzgrenze (TPS). Drittquellen
nennen unterschiedliche Werte für beide Dienste; die AWS-Doku beschreibt den
Durchsatz als separat einstellbar und koppelt ihn ausdrücklich nicht an den
Tier. Eine feste Zahl wäre irreführend.

## Bewusste Vereinfachungen im Diagramm

- **Die vier Rotationsschritte stehen als zwei Zeilen in der Lambda-Box**, nicht
  als vier einzelne Pfeile. Vier Pfeile zwischen denselben zwei Boxen hätten die
  Karte gefüllt, ohne die Reihenfolge klarer zu machen, als die Aufzählung es
  tut.
- **Der Rückweg von RDS zur Lambda (Testschritt) ist nicht gezeichnet.** Er ist
  in der Zeile "Verbindung getestet" in der RDS-Box mitgemeint.
- **Der Advanced Tier ist als eigene Box dargestellt**, obwohl er kein separater
  Dienst ist, sondern eine Einstellung pro Parameter. Die Box macht die
  Einbahnstraße sichtbar, die sonst als Fußnote untergegangen wäre.
- **Die Microservices lesen im Diagramm nur aus Secrets Manager.** Tatsächlich
  lesen sie auch aus dem Parameter Store; ein zweiter Pfeil quer über die Karte
  hätte die Zonentrennung zerschnitten, um die es hier gerade geht.

## Farbkonventionen dieser Karte

Vierte Karte nach der festgeschriebenen Konvention. Erste Karte, auf der
**Gold und Rot gemeinsam** vorkommen — bewusst und getrennt:

- **Teal #0F7C8C** — Regel- und Konfigurationsinstanz: Secrets Manager,
  Parameter Store, Advanced Tier, KMS. Vier Teal-Boxen, weil dies eine Karte
  über Konfigurationsdienste ist.
- **Gold #A16E00** — "kostet Geld", in der Stil-Guide-Bedeutung: die Box "Alles
  in Secrets Manager" trägt die Kostenaussage. **Rot #C7161D** markiert
  ausschließlich das X, also die Verwerfung. Auf Karte 39 waren diese beiden
  Bedeutungen vermischt; hier tragen sie getrennte Aufgaben — Gold sagt *warum*
  verworfen wurde, Rot sagt *dass* verworfen wurde.
- **Rot-Pink #B0084D** — RDS als relationale Datenbank-Engine, nach der in
  dieser Session festgeschriebenen Konvention. Der Stil-Guide führt diesen Ton
  unter "Redshift, Oracle"; die Erweiterung auf relationale Engines allgemein
  ist damit zum zweiten Mal angewandt.
- **Orange #D97706** — Lambda, nach Stil-Guide.
  **Blau #2E6BE6** — die Microservices als Clients.
- **Navy** kommt auf dieser Karte nicht vor: kein Eintrittspunkt, keine
  Account-Grenze im Szenario.
