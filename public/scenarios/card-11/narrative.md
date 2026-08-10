---
cardNumber: 11
slug: s3-lifecycle-glacier-deep-archive-rechnungsarchiv
title: "Rechnungsarchiv über 10 Jahre — Lifecycle in den Deep Archive"
services:
  - "Amazon S3"
  - "S3 Lifecycle"
  - "S3 Standard-IA"
  - "S3 Glacier Deep Archive"
  - "S3 Batch Operations"
domains: ["D4", "D1"]
badgeCount: 8
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/glacier-storage-classes.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects-retrieval-options.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/07/s3-removes-30-day-transitions-standard-ia-one-zone-ia/"
  - "https://aws.amazon.com/s3/storage-classes/glacier/"
  - "https://aws.amazon.com/s3/pricing/"
---

## Die Grundidee zuerst

Stell dir einen Aktenkeller mit vier Räumen vor. Vorne der helle Raum mit dem kurzen Weg, dann zwei kühlere, dann ganz hinten der Tiefkeller, in dem die Regale auf Schienen stehen und erst herausgefahren werden müssen.

**Weg eins:** Einmal im Quartal geht jemand mit einer Liste durch den Keller und räumt um. Er muss wissen, welcher Ordner wie alt ist, er vergisst Jahrgänge, er wird krank, und wenn er kündigt, weiß niemand mehr, nach welcher Regel er sortiert hat. Am Ende steht alles vorne im teuren Raum, weil Umräumen Arbeit ist und Liegenlassen keine.

**Weg zwei:** Du schreibst einmal einen Zettel an die Kellertür: *Nach 30 Tagen in Raum zwei. Nach einem Jahr in den Tiefkeller. Nach elf Jahren in den Reißwolf.* Und der Keller macht es selbst, jede Nacht, für jeden Ordner, ohne dass jemand hingeht.

S3 Lifecycle ist der Zettel an der Tür. Kein Prozess, kein Cronjob, keine Lambda — eine **Konfiguration**, die S3 selbst auswertet.

Das ist die ganze Idee, und sie beantwortet das Signalwort „keine manuelle Verwaltung" wörtlich: Es gibt niemanden, der etwas verwaltet.

## Was es eigentlich ist — die Lifecycle-Regel

Eine Regel, kein Skript. Sie besteht aus einem Filter — *worauf* wirkt sie — und einer Liste von Aktionen mit Altersangaben:

```json
{
  "Rules": [{
    "ID": "rechnungen-10-jahre",
    "Status": "Enabled",
    "Filter": {
      "And": {
        "Prefix": "invoices/",
        "ObjectSizeGreaterThan": 131072
      }
    },
    "Transitions": [
      { "Days": 30,  "StorageClass": "STANDARD_IA" },
      { "Days": 365, "StorageClass": "DEEP_ARCHIVE" }
    ],
    "Expiration": { "Days": 4015 },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 },
    "NoncurrentVersionExpiration": { "NoncurrentDays": 30 }
  }]
}
```

Lies es von oben nach unten: Worauf (`Filter`), wohin und wann (`Transitions`), wann weg (`Expiration`), und zwei Aufräumklauseln, die in der Praxis eigene Kostenfallen zumachen.

Das Wichtigste steht im `Filter`: **`Prefix` ist der Steuerhebel.** Weil alle Rechnungen unter `invoices/` liegen, greift die Regel — die Ablagestruktur ist hier kein kosmetisches Detail, sondern der Grund, warum eine einzige Regel reicht.

## Der Weg durch die Karte

### Badge 1 — PUT: das ERP schreibt direkt nach S3

Zwei Millionen PDFs im Jahr, je 400 KB bis 2 MB, rund 1,5 TB pro Jahrgang. Kein Fileserver dazwischen, kein Archivsystem, keine Zwischenstation.

Das ist die unspektakulärste Stelle der Karte und trotzdem eine Entscheidung: Weil das ERP direkt in den Zielspeicher schreibt, gibt es keinen zweiten Ort, an dem dieselbe Rechnung nochmal liegt. Ein Archiv mit zwei Kopien an zwei Stellen kostet doppelt und driftet auseinander.

### Die Klammer über der Zeitachse — eine Regel, drei Aktionen

Auf der Karte ist die Lifecycle-Regel als **Klammer** über den ganzen Verlauf gezeichnet, nicht als drei Steuerpfeile auf die drei Übergänge. Das ist fachlich korrekt und didaktisch der wichtigste Strich der Karte: Die Transitions bei Tag 30, Tag 365 und die Expiration bei Tag 4015 sind **Aktionen derselben Regel**, kein Dreiklang aus drei Konfigurationen.

S3 wertet sie täglich aus. Es läuft keine Lambda, kein Scheduler, kein Skript. Wenn eine Prüfungsfrage einen Wartungsjob, ein Custom-Script oder eine EventBridge-Regel als Antwortoption anbietet, ist genau das die Falle — die richtige Antwort ist die deklarative Konfiguration.

Der Filterzusatz `ObjectSizeGreaterThan 131072` verdient eine eigene Notiz. Seit **September 2024** verhindert S3 standardmäßig, dass Objekte unter 128 KB überhaupt transitioniert werden — vorher galt das nur für die Nicht-Glacier-Ziele. Konfigurationen, die vor diesem Zeitpunkt angelegt wurden, behalten das alte Verhalten, bis sie jemand anfasst. Der Filter auf der Karte macht das Standardverhalten also nur sichtbar, er ändert es nicht.

### Badge 2 — Tag 30: Transition nach S3 Standard-IA

Nach 30 Tagen ist der operative Zugriff vorbei. Standard-IA kostet rund die Hälfte, liefert weiter in **Millisekunden**, und du zahlst zusätzlich eine Abrufgebühr pro GB, wenn doch jemand liest.

**Zu dieser Zahl gibt es aktuell zwei widersprüchliche offizielle AWS-Quellen.** Der Widerspruch steht unten unter „Die ehrliche Feinheit" — er ist zu wichtig, um ihn hier in einem Halbsatz abzuräumen.

Für die Prüfung gilt die Zeile auf der Karte: In die IA-Klassen darf Lifecycle erst nach 30 Tagen transitionieren.

### Badge 3 — Tag 365: Transition nach S3 Glacier Deep Archive

Ab hier ist die Rechnung reine Aufbewahrung. Deep Archive ist die günstigste S3-Klasse, mit einem Preis in der Größenordnung von einem Dollar pro Terabyte und Monat — rund ein Zwanzigstel von S3 Standard.

Bezahlt wird das mit Wartezeit. Ein Objekt ist nicht mehr direkt lesbar. Und genau hier trifft die Karte eine saubere Entscheidung: Das Szenario räumt „mehrere Werktage Frist" ein, also ist Deep Archive nicht übervorsichtig, sondern korrekt. Ohne diesen Satz im Aufgabentext wäre es die falsche Klasse.

**Merk dir die Kopplung: Die Frist im Text bestimmt die Klasse, nicht der Preis.**

### Badge 4 — Tag 4015: Expiration

Die Regel löscht das Objekt, wenn die Frist abgelaufen ist. 4015 Tage sind bewusst mehr als 10 × 365: Die handelsrechtliche Aufbewahrungsfrist läuft ab **Ende des Kalenderjahres** der Erstellung, eine Januarrechnung muss also fast elf Jahre überleben.

Das Löschen gehört zur Kostenrechnung. Ein Archiv, das nie etwas wegwirft, wächst linear für immer — bei 1,5 TB im Jahr sind das nach zwanzig Jahren 30 TB, von denen die Hälfte niemand mehr aufbewahren muss.

### Badge 5 — Die Betriebsprüfung: der gestrichelte Akteur

Der Prüfer ist gestrichelt gezeichnet, weil er nicht zur Architektur gehört. Er löst sie nur aus.

Sein wichtigstes Attribut ist die **Frist**, nicht die Datenmenge. Stünde dort „binnen 15 Minuten", wäre Deep Archive raus und die Karte hätte eine andere Lösung — Glacier Instant Retrieval oder gleich Standard-IA.

### Badge 6 — `RestoreObject` über S3 Batch Operations

Ein Restore ist **pro Objekt** ein eigener Auftrag. Ein kompletter Jahrgang sind zwei Millionen Aufträge. Deshalb S3 Batch Operations: Es bekommt eine Objektliste — typischerweise aus dem S3 Inventory — und arbeitet sie als verwalteter Job ab, statt dass jemand zwei Millionen Einzelaufrufe skriptet.

Beim Restore wählst du das **Tier**. Für Deep Archive gibt es genau zwei: Standard liefert typischerweise innerhalb von 12 Stunden, Bulk innerhalb von 48 Stunden zu einem Bruchteil der Kosten.

Eine Präzisierung, die auf der Karte nicht steht: Die AWS-Doku nennt für Deep-Archive-Standard-Restores **über S3 Batch Operations** einen Start innerhalb von 9 Stunden statt 12. Die Karte stellt Batch Operations und „12 h Std." nebeneinander, ohne dass der Zusammenhang gezogen wird.

Zur Beschriftung: `12 h Std.` meint das **Standard-Tier**, nicht „12 Stunden Stunden". Direkt neben einer Zeitangabe ist das eine Lesefalle.

### Badge 7 — Die temporäre Kopie

Der am häufigsten missverstandene Schritt, und deshalb auf der Karte als **eigene gestrichelte Box** gezeichnet.

**Ein Restore verschiebt das Objekt nicht zurück.** Das Original bleibt in Deep Archive, und ein `HeadObject` oder `GetObject` meldet weiterhin die Storage Class `DEEP_ARCHIVE`. Was entsteht, ist eine zeitlich begrenzte, lesbare Kopie unter demselben Schlüssel; ihre Gültigkeit steuert der Parameter `RestoreDays`.

In dieser Zeit zahlst du **beide**: das Archiv zur Deep-Archive-Rate und die Kopie zur S3-Standard-Rate. Die AWS-Doku sagt das wörtlich.

Wer die Daten dauerhaft warm braucht, muss das Objekt aktiv **kopieren** — ein COPY auf sich selbst mit anderer Storage Class. Ein Restore allein genügt dafür nie.

Das Bild dazu: Du bekommst aus dem Tiefkeller keine Akte, sondern eine Fotokopie mit Ablaufdatum. Das Original fährt nie aus dem Regal.

### Badge 8 — Download, und warum es keinen Aufräumschritt gibt

Der Rückweg zum Prüfer ist gestrichelt: Ergebnis, kein Datenfluss der Architektur. Danach verfällt die Kopie von selbst, und der Kostenzustand kehrt automatisch auf die Deep-Archive-Rate zurück.

Das ist der stille Vorzug dieser Lösung: Es gibt keinen Aufräumschritt, den jemand vergessen könnte. Der teure Zustand hat ein eingebautes Ablaufdatum.

## Die entscheidende Unterscheidung

Auf dieser Karte stehen **zwei verschiedene 30**, und ihre Verwechslung ist der klassische Punktverlust:

| | Transitions-Wartezeit | Mindestspeicherdauer |
|---|---|---|
| Was ist es? | Wie lange ein Objekt liegen muss, **bevor** Lifecycle es verschieben darf | Wie lange du eine Klasse **bezahlst**, auch wenn du früher löschst |
| Gilt für | Standard-IA, One Zone-IA | Standard-IA 30 · Glacier IR 90 · Glacier FR 90 · **Deep Archive 180** |
| Gilt nicht für | alle Glacier-Klassen — Transition ab Tag 0 möglich | S3 Standard |
| Folge bei Verstoß | Regel wird abgelehnt bzw. Übergang findet nicht statt | anteilige Restlaufzeit wird trotzdem berechnet |

Der Satz, den die Karte im Footer trägt — „30-Tage-Regel gilt nur für IA, nicht für Glacier" — meint die **linke** Spalte. Die rechte gilt weiter und unverändert.

## Die ehrliche Feinheit

**Zwei offizielle AWS-Quellen widersprechen sich derzeit zur linken Spalte dieser Tabelle.**

- Eine AWS-Ankündigung vom **16.07.2026** meldet, dass das 30-Tage-Minimum für Transitions nach S3 Standard-IA und S3 One Zone-IA entfällt und Objekte ab Tag 0 dorthin transitioniert werden können.
- Der **S3 User Guide** trägt am 29.07.2026 unverändert die Überschrift, dass Objekte vor einer Transition nach Standard-IA oder One Zone-IA mindestens 30 Tage in S3 liegen müssen. Die Ankündigung verlinkt genau diese Seite als Beleg.
- Die SDK-Referenz nennt für `STANDARD_IA` und `ONEZONE_IA` weiterhin nur positive Ganzzahlen größer als 30 als gültige Werte.

Hier steht deshalb **keine Zahl als Tatsache**, sondern der Widerspruch selbst. Für die SAA-C03 ist die Sache trotzdem eindeutig: Die Prüfung fragt den dokumentierten Stand ab, und der lautet 30 Tage. Der Kartenfooter bleibt gültig.

Kenne beide Stände und verwechsle sie nicht — in der Prüfung antwortest du „30 Tage", in einem echten Konto von morgen kann Tag 0 funktionieren.

Zwei kleinere Feinheiten dazu. **Erstens:** Wer weiß, dass Daten sofort kalt sind, braucht den IA-Zwischenschritt ohnehin nicht — nach Glacier Instant, Flexible Retrieval oder Deep Archive darf Lifecycle ab Tag 1 transitionieren. Die Wartezeitfrage stellt sich nur, wenn IA im Pfad liegt. **Zweitens:** Du kannst keine einzelne Regel bauen, die schneller durch die Klassen läuft, als die Mindestspeicherdauern erlauben — von Glacier IR (90 Tage) nach Deep Archive geht frühestens ab Tag 94.

## Syntax lesen — die Zeitachse der Regel

Alle Altersangaben in einer Lifecycle-Regel zählen **ab Erstellung des Objekts**, nicht ab dem letzten Übergang. Das ist die häufigste Fehlannahme beim ersten eigenen Ruleset:

```
Erstellung          Tag 30            Tag 365                    Tag 4015
     │                 │                 │                          │
     ├─────────────────┼─────────────────┼──────────────────────────┤
     │   S3 Standard   │  Standard-IA    │  Glacier Deep Archive    │ weg
     │                 │                 │                          │
     └── Transitions[0].Days = 30 ───────┘                          │
     └── Transitions[1].Days = 365 ──────────────────────────────────┘
     └── Expiration.Days = 4015 ─────────────────────────────────────┘
```

`Transitions[1].Days = 365` heißt also **365 Tage nach Erstellung**, nicht 365 Tage nach dem Wechsel in Standard-IA. Wer „30 Tage warm, dann ein Jahr lauwarm" meint, muss `395` schreiben.

Die drei anderen Felder lesen sich anders und werden deshalb verwechselt:

```
"Filter": {
  "And": {
    "Prefix": "invoices/",              ← Schlüssel beginnt damit
    "ObjectSizeGreaterThan": 131072     ← Bytes, nicht KB
  }
},
"AbortIncompleteMultipartUpload": {
  "DaysAfterInitiation": 7              ← ab Upload-Beginn, nicht ab Erstellung
},
"NoncurrentVersionExpiration": {
  "NoncurrentDays": 30                  ← ab Verdrängung, nicht ab Erstellung
}
```

Drei verschiedene Nullpunkte in einer Regel: Objekterstellung, Upload-Beginn, Versionsverdrängung. `And` wird nötig, sobald mehr als ein Filterkriterium gilt — ein `Filter` mit zwei Schlüsseln direkt nebeneinander wird abgelehnt.

Und die Rechnung hinter 4015: 11 × 365 = 4015. Elf Jahre, weil die handelsrechtliche Frist erst zum Jahresende zu laufen beginnt. Die Zahl ist keine AWS-Größe, sondern eine Fachentscheidung, die in einem AWS-Feld landet — und genau solche Zahlen sollte man in einer Regel kommentieren, weil sie sonst niemand mehr herleiten kann.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Archivsystem, keine Bandbibliothek, kein Fileserver
- kein Cronjob und keine Lambda, die nachts umsortiert
- kein Kalender, in dem jemand Löschfristen führt
- kein zweiter Speicherort für dieselbe Rechnung
- kein Aufräumschritt nach einer Betriebsprüfung
- kein Skript für zwei Millionen Einzel-Restores

Übrig bleiben: ein Bucket, ein Prefix und eine JSON-Regel mit fünf Klauseln.

## Wenn du dir eine Sache merkst

**Lifecycle verschiebt, Restore kopiert.**

Deep Archive ist die richtige Klasse, sobald „Jahre aufbewahren", „praktisch nie lesen" und „Abruf darf Stunden dauern" zusammen im Text stehen. Und ein Restore holt das Objekt **nie** aus der Klasse heraus — er legt eine befristete Kopie daneben, für die du zusätzlich zahlst.

S3 Intelligent-Tiering wäre die Antwort bei *unbekanntem* Muster, nicht bei diesem. Object Lock macht unveränderbar, nicht billig. Glacier Flexible Retrieval kostet mehr und wäre nur nötig, wenn Minuten zählten.

## Prüfungsknackpunkte

**Signalwörter:** „gesetzliche Aufbewahrungspflicht über X Jahre" plus „praktisch nie abgerufen" plus „Abruf darf Stunden bis Tage dauern" plus „ohne manuellen Aufwand". Alle vier zusammen sind Lifecycle nach Deep Archive. Fehlt der dritte, kippt die Klasse.

**Die Namensfalle.** Die Glacier-Klassen wurden 2021 umbenannt: Aus „S3 Glacier" wurde **S3 Glacier Flexible Retrieval**, dazu kamen **Instant Retrieval** und **Deep Archive**. Antwortoptionen mit dem nackten Namen „Amazon Glacier" als eigenständigem Service sind meist Altbestand — die Objekte hier sind S3-Objekte und nur über die S3-API erreichbar.

**Deep Archive kennt kein Expedited.** Zwei Tiers, mehr nicht: Standard bis 12 Stunden, Bulk bis 48. Steht im Text „notfalls in fünf Minuten", zeigt das auf **Glacier Flexible Retrieval** (Expedited 1–5 Minuten) oder, bei echtem Millisekundenbedarf, auf Glacier Instant Retrieval.

**Viele kleine Objekte kippen die Rechnung.** Jedes Objekt in Glacier Flexible Retrieval und Deep Archive kostet 40 KB Metadaten-Overhead — 8 KB zur S3-Standard-Rate, 32 KB zur Archivrate — plus eine Transition-Anfrage. Bei Millionen Dateien von wenigen KB übersteigt der Overhead die Speicherersparnis. Im Szenario ist das entschärft, weil die PDFs 400 KB bis 2 MB groß sind.

**Warum S3 Intelligent-Tiering hier verliert:** Das Zugriffsmuster ist bekannt und zeitbasiert. Intelligent-Tiering würde eine Gebühr pro Objekt kosten, die eine feste Regel nicht kennt — bei zwei Millionen Objekten im Jahr ist das der teurere Weg.

**Warum S3 Object Lock hier verliert:** Es macht das Archiv fälschungssicher, nicht billig. Es ist orthogonal zur Storage Class und mit Lifecycle kombinierbar — aber die Frage lautet „Kosten minimieren", nicht „unveränderbar".

**Warum Glacier Instant Retrieval hier verliert:** Millisekunden-Abruf, den niemand braucht, zum mehrfachen Deep-Archive-Preis. Die Frist im Szenario bezahlt genau diesen Aufschlag nicht.

**Warum ein Skript oder ein Wartungsjob hier verliert:** Das Signalwort „keine manuelle Verwaltung" schließt jede Lösung aus, die jemand betreiben muss. Lifecycle ist Konfiguration, nicht Betrieb.
