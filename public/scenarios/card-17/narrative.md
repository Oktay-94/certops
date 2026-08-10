---
cardNumber: 17
slug: snowball-edge-landesmedienarchiv-500tb-migration
title: "Snowball Edge — 500 TB, wenn die Leitung zu langsam ist"
services: ["AWS Snowball Edge Storage Optimized", "AWS OpsHub", "Amazon S3", "AWS KMS", "AWS DataSync"]
domains: ["D3", "D4", "D1"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html"
  - "https://docs.aws.amazon.com/snowball/latest/developer-guide/data-protection.html"
  - "https://docs.aws.amazon.com/snowball/latest/developer-guide/encryption.html"
  - "https://docs.aws.amazon.com/snowball/latest/developer-guide/unlockdevice.html"
  - "https://docs.aws.amazon.com/snowball/latest/developer-guide/mailing-storage.html"
  - "https://aws.amazon.com/blogs/storage/aws-snow-device-updates"
  - "https://aws.amazon.com/snowball/faqs/"
---

## Die Grundidee zuerst

Ein Umzug, fünfhundert Kisten, achtzehn Stockwerke, ein Treppenhaus.

**Weg eins:** Du trägst jede Kiste einzeln hoch. Das Treppenhaus ist dabei belegt — alle anderen Bewohner kommen langsamer voran, und du selbst brauchst Monate. Am Tag deiner Kündigung bist du bei Kiste 180.

**Weg zwei:** Du stellst einen LKW vor die Tür, lädst alles auf einmal ein, und der LKW fährt. Das Treppenhaus bleibt frei. Die drei Kisten, die während der Fahrt noch dazukommen, trägst du hinterher selbst hoch — das sind ja nur drei.

Snowball Edge ist der LKW. Und der zweite Absatz ist der Teil, den die meisten in der Prüfung vergessen: **Der LKW löst nur den Bulk. Für das, was während der Fahrt entsteht, brauchst du trotzdem das Treppenhaus.**

Die Entscheidung zwischen beiden Wegen fällt nicht nach Gefühl. Sie fällt nach einer Rechnung, und die Prüfung liefert dir dafür immer beide Zahlen.

## Was es eigentlich ist — der Import-Job

Ein Snowball-Vorgang ist kein Gerät, das man mietet. Er ist ein **Job**, den du in der Konsole anlegst und der ein Gerät als Nebenprodukt hat:

```json
{
  "JobType": "IMPORT",
  "Resources": {
    "S3Resources": [{ "BucketArn": "arn:aws:s3:::lma-filmarchiv" }]
  },
  "AddressId": "ADID1a2b3c4d5e6f",
  "RoleARN": "arn:aws:iam::1234:role/snowball-import-role",
  "KmsKeyARN": "arn:aws:kms:eu-central-1:1234:key/8f1c-...",
  "Description": "Landesmedienarchiv Filmbestand, Gerät 1 von 3"
}
```

Was hier steht, entscheidet alles Weitere: Richtung (`JobType: IMPORT`), Zielbucket, Lieferadresse, das Recht, mit dem AWS am Ende in den Bucket schreibt — und der KMS-Key.

Und beim KMS-Key wird es interessant, weil fast alle ihn falsch verstehen. **Er verschlüsselt nicht deine Objekte im Bucket.** Die Kette läuft so: Der Key verschlüsselt den *Unlock-Code* deines Jobs. Der Unlock-Code entschlüsselt die oberste Schicht der *Manifest-Datei*. Und die Schlüssel, die im Manifest liegen, ver- und entschlüsseln die Daten auf dem Gerät.

Drei Glieder, und jedes hängt am nächsten. Deshalb ist ein gestohlenes Gerät wertlos: Ohne Manifest und Unlock-Code ist es ein sehr schwerer Briefbeschwerer.

## Der Weg durch die Karte

### Badge 1 — Daten aufs Gerät kopieren

Für 500 TB liefert AWS **drei Snowball Edge Storage Optimized** mit je 210 TB. 630 TB Kapazität für 500 TB Nutzdaten, weil Dateisystem-Overhead und Kopierfehler Reserve brauchen.

Im Rechenzentrum hängen die Geräte am lokalen Netz. Kopiert wird entweder über einen **NFS-Mount** oder über die **S3-kompatible API** des Geräts. Die NVMe-Bestückung schafft bis zu **1,5 GB/s** — von hier an ist der Flaschenhals das eigene LAN und die Leseleistung des alten SAN, nicht mehr die WAN-Leitung.

Zwischen NFS und S3-API liegt ein Unterschied, den die Karte nicht zeigt: Über die **S3-kompatible API** schreibst du Objekte und Keys, über den **NFS-Mount** Dateien — und die Datei-Metadaten landen dann im User-Metadata-Teil des entstehenden Objekts. Wer POSIX-Rechte und Zeitstempel erhalten will, nimmt den Dateiweg.

Auf der Karte ist das eine Box mit „3 ×" davor. Real sind es drei getrennte Jobs mit drei Manifesten und drei Unlock-Codes — es sei denn, man bestellt einen **Cluster**. Dann teilen sich alle Geräte *ein* Manifest und *einen* Unlock-Code und verhalten sich wie ein einziger, größerer Speicher. Für eine reine Migration lohnt das selten; interessant wird es, wenn während des Kopierens Ausfallsicherheit auf dem Gerät gebraucht wird. Drei Boxen hätten auf der Karte dreimal denselben Ablauf gezeigt.

### Badge 2 — Entsperren und überwachen mit OpsHub

Das Gerät kommt gesperrt an. Zum Entsperren brauchst du **zwei getrennte Dinge**: die Manifest-Datei aus der Konsole und einen **29-stelligen Unlock-Code**, der dort separat angezeigt wird. Beides ist kryptografisch an genau dieses Gerät und dein Konto gebunden und funktioniert mit keinem anderen.

Das Bild dazu: Tresorschlüssel und Zahlencode werden getrennt verschickt. Wer den Umschlag abfängt, hat die Hälfte.

Vor dem Entsperren steht allerdings etwas, das keine Software prüft. Die Doku verlangt ausdrücklich, das Gerät bei Ankunft **auf Beschädigung und Manipulationsspuren zu untersuchen** — und bei Verdacht nicht ans interne Netz zu hängen, sondern den AWS Support zu kontaktieren, der dann ein neues Gerät schickt. Im selben Abschnitt steht die vielleicht bodenständigste Zeile der gesamten AWS-Dokumentation: Lass das Gerät nicht auf der Laderampe stehen. So robust es gebaut ist, Wetter ruiniert auch stabile Hardware.

Beides sind keine Randnotizen. Ein Migrationsplan, der die Übergabe im Wareneingang nicht regelt, hat eine Lücke genau dort, wo 210 TB unbeaufsichtigt herumstehen.

**AWS OpsHub** ist das grafische Werkzeug dafür; über die Kommandozeile geht dasselbe mit dem Snowball-Edge-Client. Der Pfeil auf der Karte ist gestrichelt, weil hier Steuerung fließt und keine Nutzdaten.

### Badge 3 — Rückversand

Kopieren fertig, Gerät ausschalten. Jetzt kommt das Detail, das jeder mag: Das **E-Ink-Versandlabel schaltet automatisch auf die AWS-Rückadresse um**. Es gibt keinen Zettel, der falsch beschriftet werden kann — die Doku sagt sogar ausdrücklich, dass man niemals ein eigenes Label aufkleben soll.

Der Carrier holt ab. Die Daten sind auf dem gesamten Weg verschlüsselt, das Gehäuse ist manipulationsgeschützt, und ein TPM protokolliert, ob unterwegs etwas verändert wurde. Beim Eintreffen prüft AWS genau das.

### Badge 4 — AWS importiert in den Bucket

Im AWS-Rechenzentrum werden die Daten in den Zielbucket geschrieben. Es entstehen ein **Job-Report** und CloudWatch-Logs, aus denen hervorgeht, welche Objekte importiert wurden und welche nicht. Danach werden die Geräte nach **NIST-Vorgaben gelöscht**, bevor sie zum nächsten Kunden gehen.

Die Betriebsregel dazu steht auf keiner Karte, gehört aber in jeden Migrationsplan: **Erst nach dem Report darf die Quelle gelöscht werden.** Nie vorher.

In der Zielbucket-Box steht außerdem „danach Lifecycle nach Glacier". Das ist der zweite Teil des Auftrags und passiert vollständig **nach** dem Import: Snowball liefert in eine normale Storage-Klasse, und erst eine Bucket-Regel schiebt die Masterdateien ins Archiv. Das Gerät kennt keine Lifecycle-Regeln, und der Job auch nicht. Für ein Filmarchiv, das zehn Jahre aufbewahren muss und praktisch nie liest, ist das der eigentliche Kostenhebel — der Transport ist einmalig, die Lagerung läuft ein Jahrzehnt.

Und hier steht auf der Karte etwas, das nicht gedeckt ist. In der Zielbucket-Box steht „SSE-KMS wie im Job definiert", am Pfeil steht „SSE-KMS bleibt erhalten". Beides ist falsch verknüpft. Der Job-KMS-Key gehört zur Unlock-Kette von oben. Die Verschlüsselung im Zielbucket ist eine **Bucket-Entscheidung**: Die Doku beschreibt für den Import SSE-S3 und sagt wörtlich, dass dafür weder in der Snow-Konsole noch auf dem Gerät etwas konfiguriert wird — man setzt es über die Bucket-Policy durch. Es wird auch nichts „erhalten": Die Geräteverschlüsselung endet beim Ingest, die Bucket-Verschlüsselung beginnt dort neu. *Fixvorschlag, entschieden: beide Textstellen streichen.*

### Badge 5 — Delta nachziehen mit DataSync

Zwischen Kopierstart und abgeschlossenem Import vergehen zwei bis drei Wochen. In dieser Zeit digitalisiert das Archiv weiter. Diese Differenzmenge ist klein genug für die Leitung — also übernimmt sie **AWS DataSync**: inkrementell, geplant, mit Prüfsummenvergleich.

Das ist der zweite Teil der richtigen Antwort, den Prüfungsfragen erwarten. **Snowball für den Bulk, DataSync für das Delta.**

### Der verworfene Pfad — Direktupload über die Leitung

Der graue, durchgestrichene Weg ist die Antwortoption, die immer danebensteht: „Kopieren Sie die Daten mit der S3 CLI und Multipart Upload hoch."

Rechne nach, warum sie fällt — die Rechnung steht unter „Syntax lesen“. Kurzfassung: 154 Tage gegen 8 Wochen Deadline, und die Leitung wäre monatelang für den Regelbetrieb blockiert.

### Der Kasten „Stand 2026"

Er trägt die unbequemste Zeile der Karte, und er steht bewusst dort, wo man beim Lernen zuletzt hinschaut: **Snowball Edge gibt es seit dem 7. November 2025 nur noch für Bestandskunden.**

Die drei Wege, auf die AWS Neukunden verweist, lösen jeweils nur einen Teil des Problems. **DataSync** ist der Online-Weg — wieder dieselbe Rechnung, nur diesmal mit der Option, für die Dauer der Migration eine Hosted Connection über Direct Connect zu mieten und die Bandbreite damit zu vergrößern. Das **AWS Data Transfer Terminal** dreht die Logistik um: Statt dass ein Gerät zu dir kommt, bringst du deine eigenen Datenträger zu einem AWS-Standort, reservierst vorab einen Termin und lädst dort in einer abgetrennten Kabine über eine sehr schnelle Anbindung hoch. Und **Partner-Appliances** aus dem Marketplace ersetzen die Hardware, nicht den Ablauf.

Für ein Archiv mit einer Achtwochenfrist ist der Unterschied nicht akademisch: Beim Terminal fährt jemand hin, beim Snowball kommt das Gerät. Wer die Wahl hat, sollte die Fahrzeit mit einplanen.

## Die entscheidende Unterscheidung

Drei Dienste bewegen Daten nach S3, und sie unterscheiden sich nicht in der Qualität, sondern in der Frage, die sie beantworten:

| | Was es ist | Endet wann | Signalwort |
|---|---|---|---|
| **AWS DataSync** | Online-Kopierjob, inkrementell | wenn der Task durch ist | „wiederkehrende Synchronisation", „Delta" |
| **Snowball Edge** | einmaliger physischer Transport | wenn das Gerät zurück ist | „die Leitung reicht nicht", „Deadline" |
| **S3 File Gateway** | dauerhafter NFS/SMB-Mount | gar nicht | „die Anwendung schreibt weiter" |

Die Karte zeigt zwei davon gleichzeitig, und das ist kein Zufall. Fast jede realistische Migration braucht **Snowball plus DataSync** — der Transport für den Bestand, der Online-Weg für alles, was währenddessen weiterläuft. Prüfungsfragen, die nur eine Antwortoption mit beiden Diensten enthalten, meinen genau diese Kombination.

Rechne die Reihenfolge einmal rückwärts: Deadline in 8 Wochen, davon zwei bis drei Wochen Transport und Ingest, plus Lieferzeit der Geräte, plus die Zeit fürs Kopieren im Haus. Das Zeitfenster für die eigentliche Arbeit ist kleiner, als es aussieht — und der DataSync-Lauf am Ende ist der Teil, den man planen kann, weil er nicht an einem Carrier hängt.

## Die ehrliche Feinheit

Die wichtigste Feinheit dieser Karte betrifft nicht die Technik, sondern die Verfügbarkeit.

**Seit dem 7. November 2025 gibt AWS Snowball Edge nur noch an Bestandskunden aus.** Neukunden werden auf DataSync für Online-Transfers, das AWS Data Transfer Terminal für physische Übergabe an einem AWS-Standort oder auf Partner-Appliances aus dem Marketplace verwiesen; für Edge-Compute auf Outposts. Snowcone wurde am 12. November 2024 eingestellt, die Vorgängergeräte ebenfalls, Snowmobile ist zurückgezogen.

Das erzeugt eine Lücke, die du bewusst aushalten musst: **Für die SAA-C03-Prüfung ist Snowball weiterhin die erwartete Antwort** auf „Leitung zu langsam, Petabyte-Migration". Im Projektalltag musst du zuerst prüfen, ob du überhaupt bestellen darfst. Prüfungsstand und Produktstand sind hier zwei verschiedene Dinge, und wer das nicht trennt, verliert entweder Punkte oder Zeit.

Die zweite Feinheit ist organisatorisch: Ein Snowball-Job ist ein **Vorgang mit Status**, den du nicht aus den Augen verlieren darfst. Vom Anlegen über „Preparing shipment" bis zum abgeschlossenen Import läuft er in der Snow-Family-Konsole; Statuswechsel lassen sich per SNS als Mail oder SMS zustellen, und der Carrier liefert eine Sendungsnummer. Zwischen „das Gerät ist abgeholt" und „die Daten sind im Bucket" liegen Tage, in denen niemand etwas tun kann — das gehört in den Projektplan, nicht in die Hoffnung.

Die dritte Feinheit: Ein Snowball ist **kein Backup und keine Anbindung**. Das Gerät ist Wochen im Haus und geht dann zurück. Wer nach der Migration weiter Dateizugriff braucht, braucht zusätzlich etwas anderes — siehe Karte 16.

## Syntax lesen — die Migrationsrechnung

Die Trennlinie zwischen online und offline ist arithmetisch. So rechnest du sie:

```
Datenmenge    500 TB        = 500 × 8      = 4.000 Tbit = 4.000.000 Gbit
Bandbreite    300 Mbit/s    = 0,3 Gbit/s

4.000.000 Gbit ÷ 0,3 Gbit/s = 13.333.333 s
13.333.333 s ÷ 86.400 s/Tag ≈ 154 Tage
```

Drei Handgriffe: Bytes in Bits (`× 8`), teilen, Sekunden in Tage. **154 Tage gegen 8 Wochen Deadline** — der Online-Weg fällt aus, und zwar nicht knapp.

Zwei Ehrlichkeiten dazu: Die 300 Mbit/s sind die *frei verfügbare* Bandbreite, nicht die Anschlussgeschwindigkeit. Und die Rechnung ignoriert Protokoll-Overhead, real wäre es länger. Sie liefert die Größenordnung, nicht die Kapazitätsplanung.

## Was du dadurch nicht baust

- keine dauerhafte Leitung und kein Direct Connect für diesen Zweck
- keine Kopier-Skripte mit Wiederaufsetzlogik über Monate
- kein monatelang blockierter Internetanschluss
- keine Anbindung, die nach der Migration bestehen bleibt
- keinen Dateizugriff für die Anwendung — das Gerät verschwindet wieder
- kein Vertrauen auf einen einzelnen Faktor: Manifest allein reicht nie

Übrig bleiben drei Jobs, drei Geräte für ein paar Wochen und ein DataSync-Task für den Rest.

## Wenn du dir eine Sache merkst

**Bandbreite × Zeit < Datenmenge → physischer Transport. Ein Snowball Edge Storage Optimized fasst 210 TB; was während des Transports entsteht, holt DataSync nach.**

DataSync allein scheitert an der Rechnung. Direct Connect braucht Wochen bis Monate Vorlaufzeit und löst die Deadline nicht. Storage Gateway ist Dauerbetrieb, kein Massentransport. Und ein einzelnes Gerät reicht bei 500 TB nicht.

## Prüfungsknackpunkte

**Signalwörter:** „hunderte Terabyte" oder „Petabyte", „begrenzte Bandbreite", „die Übertragung würde Monate dauern", „das Rechenzentrum wird geschlossen", „einmalige Migration". Kommen Datenmenge *und* Bandbreite *und* eine Frist in derselben Frage vor, ist das die Aufforderung zu rechnen.

**Warum DataSync allein hier verliert:** Es ist die richtige Antwort, wenn die Rechnung aufgeht. Hier geht sie nicht auf — 154 Tage passen nicht in 8 Wochen.

**Warum Compute Optimized hier verliert:** Das Gerät mit 104 vCPUs und 28 TB NVMe ist für Verarbeitung am entlegenen Standort gebaut, nicht für Kapazität. Signalwort „wir wollen die Daten schon unterwegs analysieren" → Compute Optimized. „Möglichst viel pro Gerät" → Storage Optimized.

**Warum S3 File Gateway hier verliert:** Es ist dauerhafter Betrieb, kein Einmaltransport. Enthält die Frage beides, ist die Antwort beides.

**Warum Direct Connect hier verliert:** Eine dedizierte Leitung löst das Bandbreitenproblem grundsätzlich, aber ihre Bereitstellung dauert Wochen bis Monate. Gegen eine Achtwochenfrist ist sie kein Migrationswerkzeug, sondern ein Infrastrukturprojekt. Für eine geplante Migration ohne Frist ist sie dagegen eine ernsthafte Option — dann zusammen mit DataSync.

**Die Manifest-Falle.** „Ein Mitarbeiter hat das Manifest, kann das Gerät aber nicht entsperren." Er braucht zusätzlich den Unlock-Code aus der Konsole. Die Trennung ist Absicht — ein einzelnes geleaktes Artefakt darf nicht reichen.

**Die Löschfalle.** Antwortoptionen, in denen die Quelldaten nach dem Rückversand gelöscht werden, sind falsch. Erst der Job-Report bestätigt, was tatsächlich im Bucket liegt.
