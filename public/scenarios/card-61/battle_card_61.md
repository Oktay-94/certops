---
nr: 61
title: "Bildmoderation im Marktplatz — Rekognition, Lambda, S3, A2I"
services: ["Amazon Rekognition", "AWS Lambda", "Amazon S3", "Amazon Augmented AI (A2I)"]
domains: ["D3"]
signalwords:
  - "user-uploaded images must be reviewed before they are visible"
  - "no machine learning expertise on the team"
  - "flag inappropriate content automatically"
  - "borderline cases should be reviewed by a human"
  - "without training a model"
assets:
  svg: "battle_card_61.svg"
  png: "battle_card_61.png"
  pdf: "battle_card_61.pdf"
status_note: |
  QC (scripts/qc.py, Stand mit Prüfung (e)): 0 Befunde.
  Gemeldet: 7 Boxen, 37 Texte, 17 Segmente, 5 Badges, 1 X-Kreis.
  Aufschlüsselung R5: 17 gemeldete Segmente = 9 reale + 8 Phantom
  (4 Marker in <defs> × 2). Die 9 realen = 7 Pfeilsegmente
  (davon 2 als Teilstücke des rechtwinkligen Rückwegs) + 2 X-Striche.
  7 Boxen = 6 Knoten + Footer-Leiste.
  R6: der eine X-Kreis ist weiß gefüllt mit rotem Rand und damit korrekt
  von Prüfung (d) ausgenommen.

  Korrekturrunden — alle VOR dem Zeichnen im Geometrieplan gefunden,
  keine einzige danach:
  1. "Bild-Key" lag mittig im Korridor Lambda→Rekognition (84 px) und
     überlappte die Lambda-Box. Nach R17 über das Segment gesetzt,
     text-anchor="middle" auf x=682.
  2. "Confidence hoch" kreuzte das Segment Rekognition→Public UND die
     Public-Box. Nach links oben auf (1063, 224) versetzt.
  3. Badge 3 lag auf keinem Segment (geschätzte Position). Auf der
     Segmentgeraden s3 bei u=0,4 berechnet → (1083,2 / 274,0).
  4. Badge 4 ebenso auf s4 bei u=0,4 berechnet → (1083,2 / 388,0).
  5. "Urteil zurück" überlappte Badge 5. Rückweg-Knick von x=1080 auf
     x=1010 und y=465 auf y=500 verlegt, Badge 5 auf das horizontale
     Teilstück (1130 / 500).
  6. "Graubereich" kreuzte danach die Diagonale s4. Auf (1063, 342)
     oberhalb der Diagonale gesetzt.
  7. "kein Batch-Job" überlappte den X-Kreis, danach in zweiter Runde
     den vertikalen Rückweg, danach das vertikale verworfene Segment.
     Endstand: seitlich neben dem Segment, text-anchor="start" auf
     (900, 546).
  8. Footer-Variante 1 (1746,7 px) und 2 (1517,6 px) verworfen,
     Variante 3 mit 997,5 px gewählt.

  Render-Sanity: 11 Freizonen, alle aus der Elementgeometrie abgeleitet
  (R7/R15), **keine musste nachgeschnitten werden** — die Labelgrenzen
  aus dem Geometrieplan gingen direkt in die Zonendefinition ein.
  Alle 11 Zonen 0 px belegt. Alle sechs Palettenfarben im PNG
  nachweisbar (Quelle 4823 px, Compute 11539, Storage 2269,
  Governance 8542, Verworfen 2679, Titeltext 24903).

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 855, aus dem
  SVG gelesen, nicht angenommen.

  R12-Gegencheck: **null <path> mit stroke** — alle sieben Verbindungen
  sind <line>. Die vier <path> im Dokument sind ausschließlich die
  Marker-Dreiecke in <defs>. Damit ist der R12-Fehlerfall strukturell
  ausgeschlossen.

  R18 Titelband-Kanaldivergenz: **erst 18.795 px, nach Korrektur 0 px.**
  Ursache war nicht die CairoSVG-Version (2.9.0 korrekt), sondern das
  Default-Antialiasing der Cairo-Bibliothek im Container: sie rendert
  Text mit Subpixel-AA und erzeugt farbige Glyphensäume (nachgewiesen
  u. a. (108,35,19) und (53,129,206) an schwarzem Titeltext). Gegenmittel:
  cairocffi-Context auf ANTIALIAS_GRAY zwingen (scripts/render.py).
  **Das ist eine neue Erkenntnis dieses Batches und betrifft jede
  künftige Karte, die im Chat-Container gerendert wird.**

  R16 von Hand nachkontrolliert (qc.py findet diese Klasse nicht):
  sechs Spalte zwischen Labelende und Boxaußenkante (Kante inkl.
  stroke/2 = 1,25) gezielt auf die jeweilige Label-Textfarbe geprüft,
  nicht auf "nicht weiß". Fünf Spalte 0 px. Im sechsten ein einzelnes
  Pixel bei (983,3 / 549,3) — das ist die Unterlänge des "b" in
  "Batch-Job" auf der berechneten Labelunterkante, 29,5 px von der
  Boxoberkante entfernt. Keine Kollision.

  Footer von Hand mit PIL gemessen (R3): 997,5 px. Textende x=1059,5,
  Leistenende x=1550, Luft 490,5 px. Deutlich unter der Stil-Guide-
  Grenze von ~1420 px.

  Sichtprüfung (R8): **versucht, fehlgeschlagen.** Zurück kam ein
  Bildobjekt ohne für Claude lesbaren Inhalt — dasselbe Muster wie in
  den Batches 8–11. Die Karte ist rechnerisch vollständig geprüft,
  aber **nicht gesehen**. Freigabe durch Oktay steht aus.

  Toolchain: CairoSVG 2.9.0, Pillow 12.3.0 (im Container von 12.1.1
  auf die gepinnte Version gebracht), Graustufen-AA erzwungen.
---

# Battle Card 61 — Bildmoderation im Marktplatz

## Szenario

Ein Online-Marktplatz lässt Händler Produktbilder hochladen. Bis zur Freigabe
darf kein Bild öffentlich sichtbar sein. Das Team hat kein ML-Know-how und
will kein Modell trainieren. Grenzfälle sollen Menschen entscheiden, nicht
ein Schwellwert allein.

## Ablauf

**1 — Händler lädt das Bild in den Upload-Bucket.** Der Bucket ist privat, kein
Public Access. Das ist keine Nebensache, sondern der Kern der Anforderung: Ein
Bild, das noch nicht geprüft ist, darf nicht erreichbar sein. Die S3 Event
Notification auf `s3:ObjectCreated:*` löst die Lambda aus. Der Aufruf ist
**asynchron** — Lambda wiederholt bei Fehler zweimal von selbst, und eine DLQ
kann fehlgeschlagene Ereignisse auffangen.

**2 — Lambda erhält den Bild-Key und ruft Rekognition auf.** Lambda transportiert
das Bild nicht, sondern reicht nur die S3-Referenz weiter; `DetectModerationLabels`
nimmt Bucket und Key entgegen. Die Funktion setzt `MinConfidence` — ohne diesen
Parameter liefert AWS alle Labels ab 50 Prozent zurück, und die
Schwellwertlogik läge dann versehentlich im Anwendungscode statt in der API.

**3 — Bei hoher Confidence wandert das Bild in den Public-Bucket.** Der zweite
Bucket ist die Antwort auf eine konkrete Falle: Schriebe die Lambda das Ergebnis
in denselben Bucket zurück, der sie ausgelöst hat, triggerte sie sich selbst.
AWS nennt in der Dokumentation genau zwei Gegenmittel — zwei Buckets oder ein
Prefix-Filter. Hier sind es zwei Buckets, weil das gleichzeitig die
Sichtbarkeitsgrenze zieht.

**4 — Liegt die Confidence im Graubereich, öffnet A2I einen Human Loop.** Rekognition
ist direkt mit A2I integriert; es gibt einen vorgefertigten Workflow
„Rekognition – Image moderation". Die Antwort von `DetectModerationLabels`
enthält dafür bereits das Feld `HumanLoopActivationOutput`. Man baut also keine
Review-Oberfläche und verwaltet keine Reviewer-Warteschlange selbst.

**5 — Der Mensch entscheidet, das Urteil fließt zurück.** Die Reviewer kommen aus
einer Private Workforce (eigene Mitarbeiter), aus Mechanical Turk oder von
vorgeprüften Vendoren. Das Ergebnis landet in S3 und steuert von dort die
Freigabe. Der Rückfluss ist gestrichelt gezeichnet, weil er ein Ergebnis
transportiert und keine neue Aktion auslöst.

**Verworfen — Batch Image Content Moderation.** Der Reflex „viele Bilder, also
Batch-Job" führt zu `StartMediaAnalysisJob`. Dieser Weg ist für neue Accounts
seit dem 30.04.2026 gesperrt.

## Prüfungs-Kernsatz

**Ein Bild, ein synchroner Call — der Schwellwert trennt, A2I entscheidet den Rest.**

## Abgrenzungen

- **61 ↔ 62 (Textract/A2I):** Beide holen bei Unsicherheit einen Menschen über
  denselben Dienst. Der Unterschied ist der Gegenstand: Rekognition beurteilt
  **Bildinhalt**, Textract liest **Struktur aus Dokumenten**. A2I ist in beiden
  Fällen dieselbe Mechanik mit unterschiedlichem Built-in-Workflow.
- **`DetectModerationLabels` ↔ `StartMediaAnalysisJob`:** synchron pro Bild
  gegen asynchronen Stapel über S3. Fachlich beides Bildmoderation — aber der
  Stapelweg ist für neue Accounts geschlossen.
- **S3 Event Notification ↔ EventBridge:** Die Notification ist Teil der
  Bucket-Konfiguration und filtert nur nach Prefix und Suffix. EventBridge ist
  eine eigene Ressource, erlaubt Fan-out an mehrere Ziele und komplexere
  Muster; S3 sendet aber erst nach ausdrücklicher Aktivierung dorthin, und dann
  **alle** Ereignisse.
- **Rekognition ↔ eigenes Modell:** Sobald die Frage „welche Kategorien" durch
  „unsere firmeneigene Kategorie" ersetzt wird, ist Custom Moderation
  (Adapter) oder ein eigenes Modell im Spiel — nicht die pretrained API.

## Klassiker-Fallen

1. **Ein Bucket statt zwei.** Die Antwortoption „Lambda schreibt das geprüfte
   Bild zurück in den Upload-Bucket" sieht sparsam aus und erzeugt eine
   Endlosschleife. Zwei Buckets oder Prefix-Filter — das steht so in der
   AWS-Dokumentation.
2. **`MinConfidence` weggelassen.** Ohne den Parameter liefert die API alles ab
   50 Prozent. Antwortoptionen, die die Schwelle „im Code" ziehen, verlagern
   Logik nach oben, die die API schon hat.
3. **„Viele Bilder" ⇒ Batch-Job.** Die intuitive Antwort ist seit dem
   30.04.2026 für neue Accounts keine Antwort mehr.
4. **A2I für den Regelfall.** A2I ist für den **Graubereich** da, nicht für
   jedes Bild. Eine Option, die alle Uploads durch Menschen prüfen lässt,
   verfehlt den Zweck der automatischen Moderation.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **Die Moderations-Taxonomie ist seit dem 01.02.2024 dreistufig (L1/L2/L3),
  nicht mehr zweistufig.** Dasselbe Update brachte 26 neue Labels und die
  Erkennung von „animated" und „illustrated" Content. Kursmaterial nennt
  meist noch den Stand von 2021/2022 („10 Top-Level-Kategorien, 35
  Subkategorien"). Jedes `ModerationLabel` trägt heute ein Feld
  `TaxonomyLevel` mit Werten von 1 bis 3.
  *Quelle: AWS What's New, 01.02.2024; API-Referenz `ModerationLabel`.*
- **Rekognition Streaming Video Analysis und Batch Image Content Moderation
  („Bulk Image Analysis") sind für neue Kunden seit dem 30.04.2026
  geschlossen.** Accounts, die diese Features in den letzten zwölf Monaten
  genutzt haben, behalten den Zugriff. **Nicht betroffen sind die übrigen
  Rekognition-Features**, insbesondere `DetectModerationLabels`.
  *Quelle: AWS-Doku „Amazon Rekognition feature availability changes"; AWS
  Service Availability Updates, 03/2026.*
- Im selben Zug gingen weitere Dienste in den Wartungsmodus, darunter
  **AWS App Runner**, **AWS Audit Manager**, **AWS CloudTrail Lake**, **AWS
  Glue Ray Jobs** und **Comprehend Topic Modeling / Event Detection**.
  App Runner betrifft Thema 5 dieses Masterplans, Comprehend das Thema 63.
  *Quelle: AWS Service Availability Updates, 03/2026.*

## Nicht bestätigt

- **Konkrete Anzahl der Moderationskategorien.** Die Quellenlage widerspricht
  sich: AWS-Ankündigungen von 2021/2022 nennen 10 Top-Level-Kategorien und 35
  Subkategorien, das Update von 2024 spricht von 26 zusätzlichen Labels und
  einer dritten Ebene, ohne eine neue Gesamtzahl zu nennen. **Deshalb steht
  keine Zahl auf der Karte.**
- **Empfohlene Confidence-Schwellen.** Ein Drittanbieter nennt 60–80 Prozent
  für Content Moderation und 99 Prozent für Identitätsabgleich. Die 99 Prozent
  für Face-Vergleiche stehen in der AWS-Doku; die 60–80 Prozent für Moderation
  konnte ich in der AWS-Dokumentation nicht bestätigen. Nicht auf der Karte.
- **Preise** stehen grundsätzlich nicht auf der Karte, auch nicht die von AWS
  selbst genannten A2I-Beträge pro geprüftem Bild.

## Bewusste Vereinfachungen im Diagramm

- **Die Freigabe-Entscheidung ist als Verzweigung an der Rekognition-Box
  gezeichnet.** Tatsächlich trifft sie die Lambda anhand der API-Antwort;
  Rekognition selbst verschiebt keine Objekte. Die Karte zeigt den
  Entscheidungspunkt dort, wo die Information entsteht.
- **Der Rückweg aus A2I führt im Bild zur Rekognition-Box.** Fachlich schreibt
  A2I sein Ergebnis nach S3, von wo eine weitere Verarbeitung die Freigabe
  auslöst. Der gestrichelte Pfeil steht für „Urteil kehrt in den Fluss zurück",
  nicht für einen direkten API-Rückruf.
- **IAM-Rollen und die S3-Berechtigung, mit der S3 die Lambda aufrufen darf,
  sind nicht gezeichnet.** Sie sind Voraussetzung, nicht Ablaufschritt.
- **Kein DLQ-Kasten**, obwohl die Karte die zwei automatischen Retries nennt.

## Farbkonventionen dieser Karte

Erste Karte nach der **rollenbasierten** Konvention (beschlossen 20.07.2026).

| Element | Rolle | Farbe |
|---|---|---|
| Upload-Bucket | **Quelle** | Blau `#2E6BE6` |
| Lambda | **Compute** | Orange `#D97706` |
| Rekognition | **Compute** | Orange `#D97706` |
| Public-Bucket | **Storage** | Grün `#3F8624` |
| A2I Human Loop | **Governance/Control** | Gold `#A16E00` |
| Batch Image Moderation | Compute-Rand, Ablehnung via X | Orange `#D97706` + Rot `#C7161D` |

Bemerkenswert an dieser Karte: **S3 trägt zwei verschiedene Farben.** Der
Upload-Bucket ist Blau, weil der Fluss dort entsteht; der Public-Bucket ist
Grün, weil der Fluss dort endet. Nach der alten service-basierten Palette
hätten beide dieselbe Farbe getragen und die Karte hätte ihre eigene Aussage
verdeckt. Genau dieser Fall ist der Grund für die Umstellung.

Die verworfene Alternative behält ihren **Compute-Rand in Orange**, damit der
Dienst identifizierbar bleibt; abgelehnt wird sie durch das rote X und den
roten Pfad, nicht durch die Randfarbe. Zusätzlich ist ihr Rand gestrichelt
(`7,5`), weil sie im Sinne des Stil-Guides passiv ist.
