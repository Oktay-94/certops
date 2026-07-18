---
nr: 30
title: "Verifizierbare Änderungshistorie — QLDB, Aurora PostgreSQL, S3 Object Lock"
services:
  - Amazon QLDB
  - Amazon Aurora PostgreSQL
  - Amazon S3 Object Lock
signalwords:
  - cryptographically verifiable
  - immutable transaction log
  - complete and verifiable history of changes
  - central trusted authority
  - audit trail, who changed what and when
  - WORM, retention period, compliance mode
domains: [D1, D2]
assets:
  png: battle_card_30.png
  pdf: battle_card_30.pdf
  svg: battle_card_30.svg
status_note: >
  QC-Skript (gepatchte Fassung): 0 Befunde — 8 Boxen, 40 Texte, 18 Segmente,
  3 Badges. Footer 1084 px. Alle Palettenfarben im PNG nachweisbar, fünf
  definierte Freizonen rein weiß, Nicht-Weiß-Anteil 52,9 % (dichteste Karte
  des Batches). SICHTPRÜFUNG DURCH CHAT-CLAUDE NICHT MÖGLICH (Regel F9) —
  liegt bei Oktay.
---

# Battle Card 30 — Verifizierbare Änderungshistorie

## 🔴 Vorbemerkung: Dieser Dienst existiert nicht mehr

**Amazon QLDB wurde am 31.07.2025 abgeschaltet.** Nicht für Neukunden
geschlossen wie Timestream for LiveAnalytics (Karte 27) — vollständig
beendet. Es gab **keine formale Ankündigung**: keine Keynote, kein Blogpost.
AWS aktualisierte die Dokumentation und verschickte eine E-Mail an
Bestandskunden. Neukunden konnten sich bereits vorher nicht mehr registrieren,
alle bestehenden Ledger wurden binnen eines Jahres abgeschaltet.

QLDB war auf der re:Invent 2018 angekündigt und 2019 allgemein verfügbar
geworden. AWS galt lange als Anbieter, der bestehende Dienste nicht
abschaltet; QLDB reiht sich ein neben OpsWorks, Aurora Serverless v1 und
Honeycode.

**Deshalb ist diese Karte anders gebaut als die anderen 29.** Sie zeigt kein
Architekturmuster mit einem Dienst im Zentrum, sondern **drei Antworten auf
eine Frage** — und macht die Unterschiede zwischen ihnen zum eigentlichen
Lehrinhalt. Dieses Wissen bleibt gültig, auch wenn QLDB irgendwann aus dem
Fragenpool verschwindet.

**Ehrlicher Vorbehalt:** Ob SAA-C03 QLDB weiterhin abfragt, ist nicht
messbar. Prüfungsleitfäden hinken solchen Abschaltungen nach, aber irgendwann
fällt der Dienst heraus. Lerne die **Unterscheidung**, nicht den Produktnamen.

## Szenario

**Rheinkontor Versicherung** führt Schadensakten. Bei einem Rechtsstreit muss
zehn Jahre später belegbar sein, **was wann in der Akte stand** — und dass
niemand nachträglich etwas geglättet hat. Auch niemand aus dem eigenen Haus.

Das ist die Frage, an der sich die drei Wege scheiden. Und die Karte zwingt
zu der Rückfrage, die in der Prüfung den Ausschlag gibt:

> **Was genau muss bewiesen werden — die Unverändertheit, der Verlauf oder
> die Aufbewahrung?**

## Die drei Wege

### 1 — Amazon QLDB: beweisbar

QLDB war eine vollständig verwaltete Ledger-Datenbank mit einem
**transparenten, unveränderlichen und kryptografisch überprüfbaren
Transaktionsprotokoll**, das einer zentralen vertrauenswürdigen Stelle gehört.

Der Aufbau ist die eigentliche Idee: Das **Journal** ist ein
Append-only-Protokoll, in dem Transaktionen als Folge von Blöcken angehängt
und über Hashes miteinander verkettet werden. Die **Tabellen sind nur Sichten
darauf** — nicht die Quelle der Wahrheit, sondern das Ergebnis der Anwendung
aller Journal-Einträge. Man kann keine Zeile ändern, ohne einen neuen
Journal-Eintrag zu erzeugen.

Daraus folgt die Eigenschaft, für die es den Dienst gab: Aus einem **Digest**
(kryptografischer Hash-Wert des Journals zu einem Zeitpunkt) und einem
**Proof** lässt sich mathematisch nachweisen, dass ein bestimmter Datensatz
unverändert ist. Der Beweis hängt **nicht am Vertrauen in den Betreiber** —
auch nicht in AWS und nicht in die eigenen Administratoren.

Weitere Merkmale: serverless ohne Kapazitätsplanung, ACID-Transaktionen,
**PartiQL** als Abfragesprache.

### 2 — Aurora PostgreSQL: nur nachvollziehbar

AWS empfiehlt Bestandskunden ausdrücklich die Migration zu **Aurora
PostgreSQL**, das über Extensions ledger-ähnliche Fähigkeiten bietet: Audit-
Protokollierung und dauerhafte Log-Aufbewahrung, die Historie als eigene
Tabelle geführt.

**Was dabei verloren geht, ist die kryptografische Verifizierbarkeit** — genau
die Eigenschaft, wegen der QLDB gewählt wurde. Wer Schreibrechte hat, kann
auch die Historientabelle ändern. Der Nachweis hängt damit an
Zugriffskontrolle und Protokollierung, nicht mehr an Mathematik.

Das ist kein Detail: Kunden, die Compliance-Abläufe auf QLDB gebaut hatten,
riskierten beim Umzug ihre Integritätsgarantien. Für die Prüfung ist es die
saubere Trennlinie zwischen **„wir können zeigen, wer was geändert hat"** und
**„wir können beweisen, dass nichts geändert wurde"**.

### 3 — S3 Object Lock: unlöschbar, aber nicht beweisend

Der dritte Weg beantwortet eine **andere Frage** und steht bewusst als
Abgrenzung auf der Karte. Object Lock hält ein Objekt im
Aufbewahrungszeitraum unlöschbar und unüberschreibbar — WORM, mit
Governance- und Compliance-Modus, Versioning als Voraussetzung.

**Was Object Lock nicht leistet:** Es sagt nichts über die **Reihenfolge**
oder **Vollständigkeit** von Änderungen. Es schützt eine abgelegte Datei, kein
fortlaufendes Änderungsprotokoll. Wer nie eine Version abgelegt hat, hat auch
nichts geschützt.

## Prüfungs-Kernsatz

> **QLDB beweist. Aurora protokolliert. Object Lock bewahrt auf.**
> Das Signalwort für den Beweis ist „cryptographically verifiable"; für das
> Protokoll „audit trail"; für die Aufbewahrung „WORM" oder „retention".

Merkhilfe: Object Lock ist der Safe — was drin ist, bleibt drin. Ein Audit-Log
ist das Kassenbuch — vollständig, solange niemand eine Seite herausreißt. QLDB
war das notariell beglaubigte Kassenbuch, bei dem jede Seite die vorige
besiegelt: Man kann keine Seite entfernen, ohne dass alle folgenden nicht mehr
passen.

## 🔴 Pflicht-Abgrenzung: 30 ↔ 15

Karte 15 behandelt S3 Versioning, Object Lock und MFA Delete als
Ransomware-Schutz. **Die beiden Karten dürfen nicht vermischt werden:**

| | Karte 15 | Karte 30 |
|---|---|---|
| Frage | Kann jemand meine Backups löschen? | Kann jemand meine Historie fälschen? |
| Mittel | WORM-Aufbewahrung | Hash-Kette über alle Änderungen |
| Schutzrichtung | gegen **Löschen und Überschreiben** | gegen **unbemerktes Ändern** |
| Beweis gegenüber Dritten | nein — Vertrauen in die Konfiguration | ja — mathematisch prüfbar |

**Der Satz, der beide trennt:** Object Lock schützt ein **Objekt**. Ein Ledger
schützt eine **Reihenfolge**.

## Klassiker-Fallen

**1. „Ledger ist Blockchain."**
Nein. QLDB hatte einen **zentralen Eigentümer** — eine vertrauenswürdige
Stelle, die den Ledger besitzt. Eine Blockchain existiert gerade deshalb, weil
es **keine** solche zentrale Stelle gibt. Beides nutzt Hash-Ketten, aber die
Frage „wer entscheidet, was wahr ist" wird gegensätzlich beantwortet. Steht
in einer Frage „mehrere Parteien, die einander nicht vertrauen", ist es
**nicht** QLDB, sondern Managed Blockchain.

**2. „Ein Audit-Log ist auch unveränderlich."**
Nur, solange niemand mit Schreibrechten es ändert. Der Unterschied zwischen
*nachvollziehbar* und *beweisbar* ist genau diese Annahme. Distraktoren
setzen gern auf ein Audit-Log, wenn die Frage nach Verifizierbarkeit verlangt.

**3. „CloudTrail macht das doch."**
CloudTrail protokolliert **API-Aufrufe** gegen AWS-Dienste — wer hat den
Bucket gelöscht (Karte 49). Es protokolliert nicht die Änderungen an
**Anwendungsdaten** innerhalb einer Tabelle. Andere Ebene.

**4. Die Abschaltung selbst ist eine Lehre.**
Ein Ledger, der mit seinem Anbieter verschwindet, ist streng genommen kein
Ledger, sondern eine Datenbank mit Aufbewahrungsversprechen. Für die Prüfung
irrelevant, für eine Architekturentscheidung nicht.

## Bewusste Vereinfachungen im Diagramm

- **Die Hash-Kette ist nicht gezeichnet.** Journal, Blöcke, Digest und Proof
  stehen als Text; eine Kette aus verketteten Blöcken hätte die
  Dreier-Gegenüberstellung gesprengt, die der Kern dieser Karte ist.
- **Die Karte zeigt keinen Datenfluss, sondern eine Entscheidung.** Die drei
  Pfeile aus der Anwendung sind Alternativen, keine Schritte nacheinander —
  die Nummern 1, 2, 3 geben nur eine Lesereihenfolge vor.
- **Aurora-Extensions sind nicht benannt.** Welche Extension welche
  Ledger-Eigenschaft nachbildet, ist Praxiswissen und für die Prüfung ohne
  Belang.
- **Governance- und Compliance-Modus stehen nur als Begriffe.** Der
  Unterschied gehört auf Karte 15.
- **Managed Blockchain fehlt als Box**, obwohl es die vierte Antwort wäre. Es
  steht als Falle 1 im Text — eine vierte Spur hätte die Karte überfüllt.
- **Rheinkontor und die zehn Jahre sind Szenariozahlen.**

## Farbkonvention

Diese Karte nutzt eine Anordnung, die es vorher nicht gab, und sie ist
absichtlich einfach gehalten:

- **Linke Spalte = die Technik**, in ihrer jeweiligen Dienstfarbe: QLDB
  **grau gestrichelt** (abgeschaltet, passiv — dieselbe Behandlung wie
  „extern" im Stil-Guide), Aurora **Navy**, S3 **Grün**.
- **Rechte Spalte = die Sicht des Prüflings**, durchgehend **Blau** — dieselbe
  Farbe wie die Anwendungsbox links. Blau steht auf dieser Karte für „was der
  Mensch wissen will", nicht für einen Dienst.
- Die roten Textzeilen markieren die zwei Sätze, die man sich merken muss:
  die Abschaltung und den Verlust der Verifizierbarkeit bei der Migration.

## Faktencheck-Quellen (geprüft 18.07.2026)

- AWS-Doku QLDB, „Was ist Amazon QLDB" — Hinweis zum Ende des Supports am
  31.07.2025, Verweis auf Migration zu Aurora PostgreSQL; Definition als
  vollständig verwaltete Ledger-Datenbank mit transparentem, unveränderlichem
  und kryptografisch überprüfbarem Transaktionsprotokoll einer zentralen
  vertrauenswürdigen Stelle
- AWS re:Post — Bestandskunden konnten QLDB bis 31.07.2025 nutzen
- AWS QLDB FAQ — Empfehlung Aurora PostgreSQL mit ledger-ähnlichen
  Fähigkeiten über Extensions
- InfoQ, Juli 2024 — keine formale Ankündigung, Doku-Update und E-Mail an
  Bestandskunden, Abschaltung binnen eines Jahres, GA seit 2019
- Microsoft-Migrationsleitfaden, September 2024 — Aurora bietet detaillierte
  Audit-Protokollierung und dauerhafte Log-Aufbewahrung, **aber keine
  kryptografische Verifizierbarkeit**
- Referenzübersicht QLDB — Journal als unveränderliches Transaktionsprotokoll
  mit verketteten Blöcken, Tabellen als Sichten, PartiQL, serverless, ACID
