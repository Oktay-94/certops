---
nr: 70
title: "AWS WAF Fraud Control (ACFP) — Fake-Account-Registrierungen an der Kante abwehren"
services:
  - AWS WAF Fraud Control (ACFP)
  - Amazon CloudFront
  - AWS WAF Application Integration SDK
  - Amazon Fraud Detector (verworfen, für Neukunden geschlossen)
  - Amazon SageMaker AI (verworfen)
domains:
  - D1
  - D3
signalwords:
  - "fake account creation / bulk sign-ups"
  - "promotional bonus abuse"
  - "stolen credentials / credential stuffing"
  - "block at the edge"
  - "no data science team"
assets:
  - battle_card_70.svg
  - battle_card_70.png
  - battle_card_70.pdf
status_note: |
  qc.py: 0 Befunde im ERSTEN Lauf.
  Gemeldet: 11 Boxen, 62 Texte, 16 Segmente, 6 Badges, 1 X-Kreis.
  Segment-Aufschlüsselung nach R5: 4 Marker in <defs> erzeugen 8
  Phantom-Segmente -> 16 - 8 = 8 echte Segmente (6 Pfeile + 2 X-Striche).

  Korrekturrunden — ALLE VOR dem Zeichnen:
  (1) 1 Titelbefund: 'Stolen-Credential' 217,4 px bei Innenmaß 234 ->
      Reserve 16,6 px. Behoben durch zweizeiligen Titel
      'Stolen' / 'Credential-DB'.
  (2) 1 R16-Befund: Label 'durchlassen' (90,3 px) ragte über die Kante der
      acfp-Box; Korridor 90 px, zulässig höchstens 82 px.
      Behoben durch 'passieren' (72,3 px).
      FÜNFTE Karte in Folge mit dieser Ursachenklasse (K66, K67, K68, K69,
      K70). Siehe Vorschlag für Batch 15 unten.
  (3) Footer-Variante 1 mit 1.454,2 px über dem Stil-Guide-Maß (~1.420).
      Variante 2 mit 1.354,2 px genommen.

  NACH dem Zeichnen: keine Korrektur nötig.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie abgeleitet
  (36 belegte Rechtecke). Planvorhersage 0 — PNG 0. Keine Zone
  nachgeschnitten.

  R13: 0 px reines (0,0,0). Merksatz-y = 863 AUS DEM SVG gelesen;
  Band y 843..871 ebenfalls 0 px.
  R18 Titelband: 0 px Kanaldivergenz.
  R12: NULL <path> mit stroke — alle 8 Verbindungen als <line>.
  Palettenfarben: Quelle 7.087 · Transport 4.679 · Compute 12.724 ·
  Storage 2.389 · Governance 12.639 · Verworfen 2.470 px. Alle sechs.
  Footer: 1.354,2 px.

  Sichtprüfung: VERSUCHT, FEHLGESCHLAGEN. Der Viewer gab '[image]' ohne
  lesbaren Inhalt zurück. NEUNTER Fehlschlag in Folge.
  RECHNERISCH GEPRÜFT, NICHT GESEHEN.
---

# Battle Card 70 — AWS WAF Fraud Control (ACFP)

## Szenario

Ein Online-Marktplatz vergibt 20 € Startguthaben bei Neuregistrierung. Seit
Wochen legen Bots massenhaft Konten an, kassieren das Guthaben und
verschwinden. Die Registrierungsseite läuft hinter CloudFront. Das Team hat
keine Data Scientists und will keine Trainingsdaten aufbauen.

Ein Architekt schlägt vor, ein eigenes Betrugsmodell auf SageMaker zu
trainieren — für einen Angriff, der an der Kante abgewehrt gehört, bevor er die
Anwendung überhaupt erreicht.

## Ablauf

**1 — Bots senden Registrierungsanfragen.**
ACFP prüft zwei Endpunkte: GET-Requests vom Typ `text/html` auf die
Registrierungsseite und POST-Requests auf den Sign-up-Endpoint. Beide Pfade
werden in der Rule-Group-Konfiguration hinterlegt.

**2 — CloudFront und Web ACL nehmen den Traffic an.**
Die Rule Group `AWSManagedRulesACFPRuleSet` (50 WCU) wird über eine Managed
Rule Group Reference in das Protection Pack (Web ACL) eingebunden.

**3 — ACFP prüft und lässt nur Echtes passieren.**
Der Abgleich umfasst: E-Mail- und Passwortkombination gegen die
Stolen-Credential-Datenbank, Bewertung der E-Mail-Domain, Prüfung von Telefon-
und Adressfeldern. Die Rule Group vergibt Labels und behandelt die Requests
entsprechend.

**4 — Stolen-Credential-Datenbank und Aggregation.**
Die Datenbank wird laufend aktualisiert, wenn neue geleakte Zugangsdaten im
Dark Web auftauchen. Zusätzlich aggregiert ACFP nach IP-Adresse und Client
Session und blockt Clients, die zu viele verdächtige Anfragen senden — das ist
der Hebel gegen Massenanlage.

**5 — Response Inspection, nur bei CloudFront.**
Bei geschützten CloudFront-Distributionen prüft ACFP zusätzlich die **Antworten**
der Anwendung, um Erfolgs- und Fehlerraten zu messen, und kann Sessions oder
IPs mit zu vielen Fehlversuchen temporär sperren. Das läuft **asynchron** und
erhöht die Latenz im Webtraffic nicht.

**6 — Verworfen: eigenes SageMaker-Modell.**
Trainingsdaten sammeln, Modell trainieren, Endpoint betreiben und dauerhaft
bezahlen — für ein Problem, das eine Managed Rule Group an der Kante löst,
bevor der Request die Anwendung erreicht.

## Die Grenzen-Box

Vier Einschränkungen, die in Prüfungsfragen als Fallstricke auftauchen:

- **ACFP ist für Amazon Cognito User Pools nicht verfügbar.** Wer die
  Registrierung über Cognito abwickelt, kann ACFP dafür nicht einsetzen.
- **SDK-Pflicht.** Mehrere Regeln der Rule Group arbeiten mit Request-Tokens.
  Ohne eingebundenes JavaScript-SDK bleiben sie wirkungslos.
- **Zusatzkosten.** Für diese Managed Rule Group fallen zusätzliche Gebühren an.
- **Erst im Count-Modus ausrollen.** AWS empfiehlt ausdrücklich, die Rule Group
  zunächst mit "Override all rule actions → Count" einzubinden, damit sich das
  bestehende Web-ACL-Verhalten nicht ändert, und erst nach der Auswertung
  scharf zu schalten.

## Die Quellenkonflikt-Box

Zwei AWS-Dokumentationsseiten widersprechen sich:

- Die **Fraud-Detector-Seite** schreibt, die Fraud-Detection-Fähigkeit von WAF
  beruhe auf Managed Rules und **nicht** auf Machine-Learning-Modellen.
- Die **ACFP-Doku** schreibt, die Rule Group nutze Request Identifiers,
  Verhaltensanalyse **und Machine Learning**, um betrügerische Anfragen zu
  erkennen.

Beide Seiten sind aktuell und von AWS. Der Widerspruch ist nicht auflösbar,
deshalb steht auf der Karte **keine Aussage darüber, ob ACFP ML einsetzt** —
nur der benannte Konflikt. Nach Projektregel: Widersprechen sich zwei
AWS-Quellen, kommt keine Zahl und keine Behauptung auf die Karte.

Für die Prüfung ist die Unterscheidung trotzdem relevant: Wenn eine Frage
explizit "ML-basierte Betrugserkennung" fordert und Fraud Detector als Option
anbietet, ist Fraud Detector gemeint. Fordert sie "Schutz der
Registrierungsseite", ist es ACFP.

## Prüfungs-Kernsatz

**ACFP schützt die Sign-up-Seite an der Kante. Response Inspection gibt es nur
bei CloudFront, und für Cognito User Pools gar nicht.**

## Abgrenzungen

- **ACFP ↔ ATP (Account Takeover Prevention):** ACFP schützt die
  **Anlage** neuer Konten, ATP die **Anmeldung** an bestehenden. Signalwort:
  "fake accounts" gegen "credential stuffing beim Login".
- **ACFP ↔ Amazon Fraud Detector:** Fraud Detector bewertete beliebige Events
  (Zahlungen, Anmeldungen, Kontoanlage) mit ML-Modellen aus eigenen
  historischen Daten. ACFP schützt genau einen Punkt — die Registrierung — mit
  einer Managed Rule Group. Fraud Detector ist seit 07.11.2025 für Neukunden zu.
- **ACFP ↔ Bot Control:** Bot Control erkennt Bots allgemein. ACFP ist auf
  Kontoanlage spezialisiert und prüft Formularfelder inhaltlich.
- **ACFP ↔ eigenes SageMaker-Modell:** Das Modell säße hinter der Anwendung und
  bewertete Requests, die bereits durchgelassen wurden. ACFP blockt davor.
- **WAF ↔ Shield:** Shield ist DDoS-Abwehr, WAF ist Request-Filterung auf
  Layer 7.

## Klassiker-Fallen

1. **Fraud Detector als Antwort in einem Neubau-Szenario.** Seit 07.11.2025
   für Neukunden zu. Bei Bestandskunden-Szenarien bleibt er korrekt.
2. **ACFP und ATP verwechseln.** Anlage gegen Anmeldung.
3. **Response Inspection ohne CloudFront erwarten.** Gibt es nur dort.
4. **ACFP für eine Cognito-Registrierung vorschlagen.** Nicht verfügbar.
5. **Das SDK vergessen.** Ohne SDK laufen die Token-Regeln ins Leere — die
   Rule Group ist eingebunden und wirkt trotzdem nur teilweise.
6. **Direkt im Block-Modus ausrollen.** AWS empfiehlt Count zuerst.

## Faktencheck

- **Amazon Fraud Detector nimmt seit dem 07.11.2025 keine Neukunden mehr an.**
  AWS empfiehlt AutoGluon (Open-Source-AutoML-Bibliothek), SageMaker AI für
  Deployment der damit trainierten Modelle, und für
  Account-Creation-Fraud-Fälle ausdrücklich AWS WAF Fraud Control.
  *Quelle: AWS-Doku, "Amazon Fraud Detector availability change"; identischer
  Hinweis auf der Produktseite und in der API-Referenz.*
- **ACFP-Rule-Group-Kennung:** VendorName AWS, Name
  `AWSManagedRulesACFPRuleSet`, 50 WCU.
  *Quelle: AWS-Doku, "AWS WAF Fraud Control account creation fraud prevention
  (ACFP) rule group".*
- **Geprüfte Endpunkte:** GET-`text/html`-Requests an den
  Registrierungs-Endpoint und POST-Requests an den Sign-up-Endpoint; bei
  geschützten CloudFront-Distributionen zusätzlich die Antworten.
  *Quelle: AWS-Doku, "AWS WAF ACFP components".*
- **Prüfumfang:** Abgleich von E-Mail- und Passwortkombinationen gegen eine
  Stolen-Credential-Datenbank, die laufend um neu im Dark Web gefundene
  Leaks ergänzt wird; Bewertung der E-Mail-Domains; Prüfung von Telefonnummern
  und Adressfeldern; Aggregation nach IP-Adresse und Client Session.
  *Quelle: AWS-Doku, "AWS WAF Fraud Control account creation fraud prevention
  (ACFP)".*
- **Response Inspection:** nur für CloudFront-Distributionen, misst Erfolgs-
  und Fehlerraten, kann Sessions oder IPs mit zu vielen Fehlversuchen
  temporär sperren, läuft asynchron und erhöht die Latenz nicht.
  *Quelle: ebenda.*
- **Cognito-Ausschluss:** Die ACFP-Funktion steht für Amazon Cognito User
  Pools nicht zur Verfügung.
  *Quelle: ebenda, Note-Block.*
- **Zusatzkosten:** Für die Nutzung dieser Managed Rule Group fallen
  zusätzliche Gebühren an.
  *Quelle: ebenda, Note-Block.*
- **SDK-Pflicht:** Die Rule Group nutzt Request-Tokens, um Informationen über
  den Client-Browser und den Grad menschlicher Interaktion zu sammeln; für die
  volle Wirkung ist die Einbindung der Application Integration SDKs nötig.
  *Quelle: ebenda und "Using application integration SDKs with ACFP".*
- **Count-Modus zuerst:** AWS empfiehlt, die Rule Group zunächst so
  einzubinden, dass sie das bestehende Verhalten nicht verändert, und alle
  Regelaktionen auf Count zu überschreiben.
  *Quelle: AWS-Doku, "Testing and deploying ACFP".*

## Korrektur am Batch-Start-Dokument

Das Batch-Dokument führt Karte 70 als einzige **ohne** Faktencheck-Warnung.
Tatsächlich ist Amazon Fraud Detector seit dem **07.11.2025** für Neukunden
geschlossen — von allen fünf Diensten dieses Batches am längsten.

**Damit trägt jede Karte 66–70 eine Verfügbarkeitsänderung:**

| Karte | Dienst | Stichtag Neukunden-Stopp |
|---|---|---|
| 66 | Amazon Forecast | 29.07.2024 |
| 67 | SageMaker Model Monitor u. a. | 30.07.2026 |
| 68 | Bedrock Agents Classic | 30.07.2026 |
| 69 | Amazon Kendra | 30.07.2026 |
| 70 | Amazon Fraud Detector | **07.11.2025** |

## Nicht bestätigt

- **Ob ACFP Machine Learning einsetzt.** Zwei AWS-Quellen widersprechen sich
  (siehe Quellenkonflikt-Box). Keine Aussage auf der Karte.
- **Ein Enddatum für Amazon Fraud Detector.** Es gibt keines; Bestandskunden
  nutzen den Dienst weiter.
- **Die genaue Größe oder Herkunft der Stolen-Credential-Datenbank.** AWS
  nennt nur "regelmäßig aktualisiert aus neu gefundenen Dark-Web-Leaks".
- **Die konkrete Schwelle, ab der ACFP eine Session sperrt.** AWS
  veröffentlicht die Regeldetails bewusst nicht vollständig, um Angreifern
  keine Umgehung zu ermöglichen.

## Bewusste Vereinfachungen im Diagramm

- **Die einzelnen ACFP-Regeln sind nicht aufgeführt.** Die Rule Group enthält
  mehrere Regeln mit unterschiedlichen Aktionen; AWS veröffentlicht sie
  bewusst nur teilweise.
- **Das SDK hängt an keinem Pfeil.** Es ist eine Voraussetzung, kein Schritt
  im Requestfluss.
- **Der Blockierungspfad ist nicht gezeichnet.** Die Karte zeigt, was
  durchkommt; was geblockt wird, verlässt den Fluss vorher.
- **Labels und Label-Matching sind nicht dargestellt.** ACFP arbeitet
  intern mit Labels, die eigene Regeln auswerten können.
- **Response Inspection ist als Box neben der Kette gezeichnet**, obwohl sie
  Teil derselben Rule Group ist. Die Trennung macht die
  CloudFront-Einschränkung sichtbar.

## Farbkonventionen dieser Karte

| Knoten | Rolle | Begründung |
|---|---|---|
| Bot-Traffic | **Quelle** (Blau) | Origin der Requests |
| CloudFront + Web ACL | **Transport** (Teal) | Nimmt entgegen und reicht weiter |
| ACFP Rule Group | **Compute** (Orange) | Wertet aus und entscheidet |
| Registrierungs-Endpoint | **Quelle** (Blau) | Ziel im Fluss, aber kein AWS-Rechendienst |
| Stolen Credential-DB | **Storage** (Grün) | Datenbestand, gegen den geprüft wird |
| Response Inspection | **Compute** (Orange) | Wertet Antworten aus |
| JavaScript SDK | **Governance** (Gold) | Voraussetzung und Konfiguration |
| Grenzen | **Governance** (Gold) | Bilanz der Einschränkungen |
| Quellenkonflikt | **Governance** (Gold) | Metahinweis zur Quellenlage |
| Eigenes SageMaker-Modell | **Compute-Rand** (Orange), verworfen über X | Rollenfarbe bleibt, abgelehnt über X und roten Pfad |

**Zum Gegenlesen — die schwächste Rollenentscheidung dieser Karte:** Der
Registrierungs-Endpoint ist **Quelle-Blau**, obwohl er am Ende des Flusses
steht und kein Origin ist. Begründung nach dem Präzedenzfall Warenwirtschaft
(K66): Nicht-AWS-Anwendungen im Fluss bekommen Quelle-Blau, weil sie den
Fachfall repräsentieren, nicht den Dienst. Eine Alternative wäre Navy #232F3E
für Nicht-Dienst-Boxen gewesen — das hätte hier besser gepasst und wäre für
Batch 15 zu prüfen.

**Zweiter Punkt:** Drei Gold-Boxen auf einer Karte (SDK, Grenzen,
Quellenkonflikt) sind viel. Governance dominiert das Bild mit 12.639 px
gegenüber 2.389 px Storage. Vertretbar, weil die Karte von Einschränkungen
handelt — aber die Grenze des Formats ist erreicht.

## Vorschlag für Batch 15 — wiederkehrender Planbefund

Auf allen fünf Karten dieses Batches trat dieselbe Ursachenklasse auf:
**Ein Label passt nicht in den 90-px-Korridor** (K66 'Model anlegen', K67
'Model anlegen', K68 Titelbreite in 250-px-Box, K69 'exportieren',
K70 'durchlassen').

Das ist kein Zufall, sondern eine strukturelle Eigenschaft des Layouts:
Bei 250 px Boxbreite und 90 px Korridor ist die zulässige Labellänge
82 px — etwa 10 bis 12 Zeichen in 15 px DejaVu Sans. Deutsche Verben in
der Infinitivform überschreiten das regelmäßig.

Vorschlag: Der Geometrieplan sollte Labels **vor** der Kollisionsprüfung gegen
die Korridorbreite messen und zu lange Labels direkt melden, statt sie erst in
Block F als R16-Kollision auffallen zu lassen. Ein Vorschlagsmechanismus
(kürzere Synonyme) wäre möglich, aber die Wortwahl bleibt eine inhaltliche
Entscheidung.
