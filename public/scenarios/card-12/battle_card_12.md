---
nr: 12
title: "Unbekanntes Zugriffsmuster — S3 Intelligent-Tiering statt Ratespiel"
services:
  - S3
  - S3 Intelligent-Tiering
  - S3 Standard-IA (Abgrenzung)
  - S3 Lifecycle (Abgrenzung)
signalwords:
  - "Zugriffsmuster unbekannt oder unvorhersehbar"
  - "ändert sich über die Zeit"
  - "keine Anwendungsänderung"
  - "keine Abrufgebühren"
  - "automatisch die günstigste Klasse"
domains: [D4, D3]
assets:
  - battle_card_12.svg
  - battle_card_12.png
  - battle_card_12.pdf
status_note: "Sichtprüfung des gerenderten PNG durch Chat-Claude nicht möglich (view liefert leeres Bild) — rechnerische QC grün, optische Freigabe durch Oktay ausstehend."
---

# Battle Card 12 — S3 Intelligent-Tiering

**Services:** Amazon S3, S3 Intelligent-Tiering (Frequent / Infrequent / Archive Instant Access, optional Archive Access + Deep Archive Access) — zur Abgrenzung: S3 Lifecycle und S3 Standard-IA

**Szenario:**
Die **Pixelwerk GmbH** startet eine Asset-Plattform für Agenturen: Nutzer laden Fotos, Video-Renders und Projektdateien hoch, aktuell **40 Millionen Objekte mit 900 TB**. Das Zugriffsverhalten ist **pro Objekt völlig unterschiedlich und über die Zeit instabil**: Ein Teil der Assets wird jahrelang täglich ausgeliefert, der größte Teil nach einer Woche nie wieder — und ein dritter Teil liegt monatelang still und wird plötzlich wieder heiß, weil eine Kampagne neu aufgelegt wird. Niemand im Team kann eine Regel benennen, ab welchem Tag ein Objekt kalt ist. Vorgaben: **keine Latenzverschlechterung**, **keine Änderung am Anwendungscode**, **keine Abrufgebühren**, und die Speicherkosten sollen trotzdem sinken.

Signalwörter der Prüfung: *unbekanntes / unvorhersehbares / wechselndes Zugriffsmuster* · *ohne Performance-Einbußen* · *keine Retrieval-Gebühren* · *ohne operativen Aufwand*.

---

## Ablauf

**1 — Upload in die Storage Class S3 Intelligent-Tiering.**
Die Anwendung setzt beim `PUT` schlicht `StorageClass = INTELLIGENT_TIERING` (alternativ eine Lifecycle-Regel, die neue Objekte an Tag 0 dorthin legt). Das ist die **einzige** Entscheidung, die ein Mensch hier trifft. Danach ist Intelligent-Tiering eine ganz normale S3-Storage-Class: gleiche API, gleiche Bucket-Struktur, gleiche Berechtigungen — deshalb ist die Anforderung „keine Code-Änderung" erfüllt.

**Jedes neue Objekt landet im Frequent Access Tier.**
Preis und Verhalten entsprechen S3 Standard. Ab hier misst S3 den **letzten Zugriff pro Objekt** — nicht pro Bucket, nicht pro Prefix. Genau das ist der Unterschied zur Lifecycle-Regel: Intelligent-Tiering entscheidet auf Objektebene anhand von Beobachtung, Lifecycle auf Regelebene anhand von Alter.

**2 — 30 aufeinanderfolgende Tage ohne Zugriff → Infrequent Access Tier.**
Der Preis fällt auf das Niveau von S3 Standard-IA, die **Latenz bleibt bei Millisekunden**, und — der entscheidende Punkt — es fällt **keine Abrufgebühr** an. Die Umlagerung selbst ist ebenfalls kostenfrei. Der Zähler ist ein reiner Inaktivitätszähler: Jeder Zugriff setzt ihn zurück (u. a. `GetObject`, `PutObject`, `CopyObject`, `CompleteMultipartUpload`, `SelectObjectContent`, `RestoreObject`).

**3 — 90 aufeinanderfolgende Tage ohne Zugriff → Archive Instant Access Tier.**
Trotz des Wortes „Archive" ist das **kein Glacier**: weiterhin Millisekunden, weiterhin kein Restore, weiterhin keine Abrufgebühr — nur ungefähr ein Sechstel des Frequent-Access-Preises. Dieses Tier ist automatisch aktiv und muss nicht eingeschaltet werden. Bei User-generated Content liegt hier in der Praxis der größte Teil der Ersparnis, weil der Großteil der Objekte dauerhaft kalt bleibt.

**4 — Ein Zugriff hebt das Objekt sofort zurück in Frequent Access.**
Der Rückweg ist im Diagramm bewusst als **eigener, langer Pfeil** über die ganze Breite gezeichnet, weil er das Alleinstellungsmerkmal ist: **kein Restore, keine Abrufgebühr, keine Wartezeit** — der Lesevorgang selbst wird normal beantwortet, die Rückstufung passiert im Hintergrund. Damit ist der Fall „altes Asset wird plötzlich wieder heiß" kostenneutral. Genau dieser Fall ist es, der eine feste Lifecycle-Regel teuer macht.

**Verworfen: die feste Lifecycle-Regel nach S3 Standard-IA (rotes X).**
Sie ist im Diagramm als abgelehnter Pfad gezeichnet, weil sie in der Prüfung die naheliegende Falschantwort ist. Zwei Gründe: Erstens kostet jeder Lesezugriff auf ein IA-Objekt eine **Abrufgebühr pro GB** — bei wieder erwachenden Assets zahlt man also ausgerechnet für den Erfolg. Zweitens gilt eine **Mindestspeicherdauer von 30 Tagen**. Und der grundsätzliche Einwand: Eine Lifecycle-Regel setzt voraus, dass man das Muster **kennt**. Steht im Fragetext „unbekannt" oder „unvorhersehbar", ist Lifecycle die falsche Antwort.

**Der Preis der Automatik: Monitoring & Automation.**
Intelligent-Tiering kostet **0,0025 $ je 1.000 Objekte und Monat** — eine Gebühr **pro Objekt, nicht pro GB**. Für die 40 Mio. Objekte im Szenario sind das rund **100 $ im Monat**, gegen eine Ersparnis im vier- bis fünfstelligen Bereich bei 900 TB: klar lohnend. Umgekehrt kippt die Rechnung, wenn ein Bucket aus sehr vielen sehr kleinen Objekten besteht. Deshalb gilt: Objekte **unter 128 KB werden nicht überwacht**, sie kosten keine Monitoring-Gebühr, werden aber auch nie herabgestuft und bleiben dauerhaft zur Frequent-Access-Rate liegen.

**5 — Optional und nur nach Opt-in: Archive Access und Deep Archive Access.**
Diese beiden Stufen sind **nicht** automatisch aktiv; sie werden pro Bucket/Prefix konfiguriert (`PutBucketIntelligentTieringConfiguration`). Archive Access greift ab mindestens 90 Tagen Inaktivität (Abruf in Minuten bis Stunden, typisch 3–5 h), Deep Archive Access ab mindestens 180 Tagen (Abruf bis 12 h); beide Schwellen sind bis 730 Tage frei wählbar. Der Preis dafür ist ein **Bruch der Millisekunden-Zusage**: Objekte in diesen Stufen brauchen ein **`RestoreObject`**. Die Box ist deshalb gestrichelt gezeichnet — sie gehört nur dann in die Architektur, wenn die Anwendung asynchron warten kann. Im Szenario der Pixelwerk GmbH wäre das ein Fehler, weil die Plattform Assets synchron ausliefert.

---

## Prüfungs-Kernsatz

> **Intelligent-Tiering misst, Lifecycle rät.** Steht im Text „unbekanntes, wechselndes oder unvorhersehbares Zugriffsmuster" und zugleich „keine Performance-Einbußen und keine Abrufgebühren", ist die Antwort S3 Intelligent-Tiering — und die drei automatischen Tiers liefern alle in Millisekunden.

---

## Klassiker-Fallen

**1. „Archive Instant Access" ist kein Glacier.**
Der Name legt Wartezeit nahe, aber das Tier liefert in **Millisekunden ohne Restore**. Verwechselt wird es gern mit der Storage Class **S3 Glacier Instant Retrieval** — die ist ein eigenständiges Produkt mit 90 Tagen Mindestspeicherdauer und **Abrufgebühren**, während das gleichnamige Tier innerhalb von Intelligent-Tiering keine hat. Merkhilfe: Alles, was in Intelligent-Tiering **automatisch** passiert, kostet keinen Abruf; nur die beiden **Opt-in**-Stufen sind asynchron.

**2. Die Gebühr hängt an Objekten, nicht an Bytes.**
„Intelligent-Tiering ist immer günstiger" ist falsch. Bei Millionen kleiner Objekte kann die Monitoring-Gebühr die Ersparnis auffressen — und Objekte unter 128 KB werden gar nicht erst herabgestuft. Bei **bekanntem, zeitbasiertem** Muster (Logs, Backups, Rechnungsarchiv) ist die feste Lifecycle-Regel die **billigere** Lösung, weil sie diese Gebühr nicht kennt. Die beiden Karten 11 und 12 sind damit die zwei Seiten derselben Entscheidung: **Muster bekannt → Lifecycle. Muster unbekannt → Intelligent-Tiering.**

**3. Intelligent-Tiering ist eine Storage Class, kein Automatismus über alle Klassen hinweg.**
Es bewegt Objekte **innerhalb** seiner eigenen Access Tiers. Es verschiebt nichts nach S3 Standard-IA, One Zone-IA oder in eine Glacier-Storage-Class, und es kündigt sich in `ListObjects` auch nicht als „STANDARD_IA" an — die Storage Class bleibt durchgehend `INTELLIGENT_TIERING`. Wer eine echte Glacier-Klasse will, braucht eine Lifecycle-Transition.

**4. Es gibt keine Mindestspeicherdauer — aber auch keine Garantie.**
Seit 2021 hat Intelligent-Tiering **keine Mindestspeicherdauer** mehr (die 30-Tage-Falle von Standard-IA entfällt also). Dafür ist die Ersparnis nicht garantiert: Wird jedes Objekt regelmäßig gelesen, bleibt alles im Frequent Access Tier und man zahlt S3-Standard-Preis **plus** Monitoring.

---

## Bewusste Vereinfachungen im Diagramm

- **Die Rückstufung ist nur von Archive Instant Access aus gezeichnet.** Tatsächlich springt ein Objekt aus **jedem** Tier bei Zugriff zurück nach Frequent Access — aus den beiden Opt-in-Stufen allerdings erst nach einem `RestoreObject`.
- **Preise sind Größenordnungen** (Listenpreise us-east-1) und dienen nur dem Verhältnis der Tiers zueinander.
- **Der Zeitzähler ist als „Tage inaktiv" verkürzt.** Fachlich sind es *aufeinanderfolgende* Tage ohne Zugriff, und die Liste der zählenden Zugriffsoperationen ist länger als der Platz auf der Karte (u. a. auch `UploadPartCopy` und S3 Batch Replication auf der Quellseite).
- **Die 40 KB Metadaten-Overhead pro Objekt** der beiden Opt-in-Archivstufen sind nicht dargestellt.
- **Verschlüsselung, Replikation und Storage Lens** fehlen bewusst; die Karte beantwortet die Frage „welche Klasse bei unbekanntem Muster", nicht den Betrieb des Buckets.
