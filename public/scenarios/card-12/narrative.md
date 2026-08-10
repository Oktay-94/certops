---
cardNumber: 12
slug: s3-intelligent-tiering-unbekanntes-zugriffsmuster
title: "Unbekanntes Zugriffsmuster — S3 Intelligent-Tiering statt Ratespiel"
services:
  - "Amazon S3"
  - "S3 Intelligent-Tiering"
  - "S3 Standard-IA"
  - "S3 Lifecycle"
domains: ["D4", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/intelligent-tiering-overview.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/restoring-objects-retrieval-options.html"
  - "https://aws.amazon.com/s3/storage-classes/"
  - "https://aws.amazon.com/s3/pricing/"
  - "https://aws.amazon.com/about-aws/whats-new/2021/11/s3-intelligent-tiering-archive-instant-access-tier/"
---

## Die Grundidee zuerst

Stell dir eine Werkstatt mit einer Werkbank vorne und drei Regalreihen dahinter vor.

**Weg eins:** Einmal im Jahr räumst du auf. Du gehst durch und entscheidest nach Gefühl: „Die Stichsäge nehme ich selten, die kommt nach hinten." Manchmal stimmt es. Manchmal brauchst du die Stichsäge drei Wochen später jeden Tag und läufst nun jedes Mal nach hinten. Und für jeden Weg nach hinten zahlst du eine Wegegebühr.

**Weg zwei:** Die Werkbank merkt sich für **jedes einzelne Werkzeug**, wann du es zuletzt in der Hand hattest. Was 30 Tage liegt, rutscht eine Reihe nach hinten. Was 90 Tage liegt, noch eine. Und wenn du eines wieder greifst, liegt es beim nächsten Mal wieder vorne — ohne Wegegebühr, ohne Wartezeit, ohne dass du etwas sagen musst.

S3 Intelligent-Tiering ist die zweite Werkstatt.

Der Unterschied ist nicht „automatisch statt manuell". Der Unterschied ist **Beobachtung statt Vermutung**: Eine Lifecycle-Regel entscheidet nach Alter für alle Objekte gleich, Intelligent-Tiering entscheidet nach tatsächlichem Zugriff für jedes Objekt einzeln.

Das ist die Antwort auf den Satz in der Aufgabe: „Niemand kann eine Regel benennen, ab welchem Tag ein Objekt kalt ist." Du musst es nicht wissen. Das ist der Punkt.

## Was es eigentlich ist — eine Storage Class, kein Dienst

Der wichtigste Satz zuerst, weil er dem Namen widerspricht: **Intelligent-Tiering ist eine Storage Class wie S3 Standard, kein Automatismus über alle Klassen hinweg.**

Beim Schreiben ist es eine einzige Angabe:

```
PUT /assets/kampagne-2026/hero.psd
x-amz-storage-class: INTELLIGENT_TIERING
```

Danach ändert sich nichts: gleiche API, gleiche Bucket-Struktur, gleiche Berechtigungen, gleiche Latenz. Deshalb ist die Vorgabe „keine Änderung am Anwendungscode" erfüllt.

Die drei automatischen Tiers sind eingebaut. Die beiden Archivstufen sind es nicht — die schaltest du pro Bucket oder Prefix mit einem eigenen Objekt frei:

```json
{
  "Id": "assets-tiefkuehl",
  "Status": "Enabled",
  "Filter": { "Prefix": "assets/" },
  "Tierings": [
    { "AccessTier": "ARCHIVE_ACCESS",      "Days": 180 },
    { "AccessTier": "DEEP_ARCHIVE_ACCESS", "Days": 365 }
  ]
}
```

`PutBucketIntelligentTieringConfiguration` mit diesem Körper ist der einzige Weg, an die Opt-in-Stufen zu kommen. Wer den Aufruf nie macht, hat drei Tiers und keinen Restore — und für das Szenario der Karte ist genau das die richtige Konfiguration.

## Der Weg durch die Karte

### Badge 1 — PUT mit `StorageClass = INTELLIGENT_TIERING`

Die Asset-Plattform schreibt 40 Millionen Objekte mit 900 TB in diese Klasse. Alternativ ginge auch eine Lifecycle-Regel, die neue Objekte an Tag 0 nach `INTELLIGENT_TIERING` legt — das Ergebnis ist dasselbe.

**Das ist die einzige Entscheidung, die in diesem Szenario ein Mensch trifft.** Alles Weitere auf der Karte ist Beobachtung durch S3.

### Der Kasten „Frequent Access" — die Landezone

Jedes neue Objekt beginnt hier. Preis und Verhalten entsprechen S3 Standard.

Ab diesem Moment misst S3 den letzten Zugriff **pro Objekt** — nicht pro Bucket, nicht pro Prefix, nicht pro Tag. Genau darin liegt der Unterschied zur Lifecycle-Regel, und genau darauf zielt der Aufgabentext mit „pro Objekt völlig unterschiedlich".

Ein Detail, das in der Prüfung Punkte kostet: Bei den Tier-Wechseln bleibt die Storage Class **durchgehend `INTELLIGENT_TIERING`**. Ein `ListObjects` meldet nie „STANDARD_IA", egal in welchem Tier ein Objekt gerade liegt. Der Tier ist ein interner Zustand, keine Klasse.

### Badge 2 — 30 aufeinanderfolgende Tage ohne Zugriff → Infrequent Access

Der Preis fällt auf das Niveau von S3 Standard-IA. Die **Latenz bleibt bei Millisekunden**, und — der entscheidende Punkt — es fällt **keine Abrufgebühr** an. Die Umlagerung selbst kostet ebenfalls nichts.

„Aufeinanderfolgend" ist wörtlich zu nehmen: Der Zähler ist ein reiner Inaktivitätszähler. Ein Zugriff an Tag 29 setzt ihn auf null, und die Uhr läuft neu.

### Badge 3 — 90 aufeinanderfolgende Tage ohne Zugriff → Archive Instant Access

Trotz des Wortes „Archive" ist das **kein Glacier**: weiterhin Millisekunden, weiterhin kein Restore, weiterhin keine Abrufgebühr — bei rund einem Sechstel des Frequent-Access-Preises.

Dieses Tier ist automatisch aktiv und muss nicht eingeschaltet werden. Bei User-generated Content liegt hier in der Praxis der größte Teil der Ersparnis, weil der Großteil der Objekte dauerhaft kalt bleibt: 900 TB, von denen der überwiegende Teil nach einer Woche nie wieder gelesen wird.

### Badge 4 — Ein Zugriff hebt das Objekt sofort zurück

Der Rückweg ist auf der Karte als **eigener langer Pfeil** über die ganze Breite gezeichnet, und das ist die richtige Gewichtung: Er ist das Alleinstellungsmerkmal.

**Kein Restore, keine Abrufgebühr, keine Wartezeit.** Der Lesevorgang selbst wird ganz normal beantwortet; die Rückstufung nach Frequent Access passiert im Hintergrund.

Damit ist der Fall „altes Asset wird plötzlich wieder heiß" — die neu aufgelegte Kampagne aus dem Aufgabentext — kostenneutral. Genau dieser Fall macht eine feste Lifecycle-Regel teuer.

Die Karte zeichnet den Rückweg nur von Archive Instant Access aus. Tatsächlich springt ein Objekt aus **jedem automatischen** Tier zurück, wenn es gelesen wird.

### Der rote Pfad — die feste Lifecycle-Regel als Falschantwort

Der verworfene Weg: `Tag 30 → S3 Standard-IA`. Er ist die naheliegende Falschantwort und deshalb rot durchgestrichen.

Drei Gründe, in aufsteigender Schwere:

**Erstens** kostet jeder Lesezugriff auf ein IA-Objekt eine Abrufgebühr pro GB. Bei wieder erwachenden Assets zahlst du also ausgerechnet für den Erfolg.

**Zweitens** gilt für Standard-IA eine Mindestspeicherdauer von 30 Tagen: Wer ein Objekt früher löscht oder in eine andere Klasse schiebt, zahlt die Restlaufzeit anteilig trotzdem.

**Drittens und grundsätzlich:** Eine Lifecycle-Regel setzt voraus, dass du das Muster **kennst**. Steht im Fragetext „unbekannt" oder „unvorhersehbar", ist Lifecycle unabhängig von allen Kosten die falsche Antwort.

### Der Kasten „Monitoring & Automation" — der Preis der Automatik

Intelligent-Tiering kostet eine monatliche Gebühr **pro Objekt, nicht pro GB** — in der Größenordnung von 0,0025 $ je 1.000 Objekte und Monat.

Für die 40 Millionen Objekte des Szenarios sind das rund 100 $ im Monat, gegen eine Ersparnis bei 900 TB, die um Größenordnungen darüber liegt. Klar lohnend.

Umgekehrt kippt die Rechnung, wenn ein Bucket aus sehr vielen sehr kleinen Objekten besteht. Deshalb die Grenze: **Objekte unter 128 KB werden nicht überwacht.** Sie kosten keine Monitoring-Gebühr, werden aber auch nie herabgestuft und bleiben dauerhaft zur Frequent-Access-Rate liegen.

Das Bild dazu: Die Werkbank führt Buch über jedes Werkzeug einzeln. Bei 40 Millionen Schrauben lohnt das Buchführen nicht mehr — also führt sie über Schrauben kein Buch und lässt sie vorne liegen.

### Badge 5 — Die beiden Opt-in-Stufen

Archive Access ab mindestens 90 Tagen Inaktivität, Deep Archive Access ab mindestens 180. Beide Schwellen sind frei wählbar bis 730 Tage.

Der Preis ist ein **Bruch der Millisekunden-Zusage**: Objekte in diesen Stufen brauchen ein `RestoreObject`. Archive Access liefert typischerweise in 3–5 Stunden, Deep Archive Access innerhalb von 12. Deshalb ist die Box auf der Karte gestrichelt — sie gehört nur dann in die Architektur, wenn die Anwendung asynchron warten kann.

Im Szenario der Pixelwerk GmbH wäre das ein Fehler: Die Plattform liefert Assets synchron aus.

## Die entscheidende Unterscheidung

Die Karten 11 und 12 sind zwei Seiten derselben Entscheidung:

| | S3 Lifecycle | S3 Intelligent-Tiering |
|---|---|---|
| Entscheidet nach | Alter, nach Regel | letztem Zugriff, pro Objekt |
| Voraussetzung | Muster ist **bekannt** | Muster ist **unbekannt** |
| Bewegung | einseitig, nur abwärts | in beide Richtungen |
| Abrufgebühr in kalten Stufen | ja (IA, Glacier) | nein bei den drei Auto-Tiers |
| Wiedererwärmen | Restore oder COPY nötig | passiert von selbst beim Lesen |
| Zusatzkosten | keine laufende Gebühr | Gebühr **pro Objekt** und Monat |
| Günstiger bei | vielen kleinen Objekten, klarem Zeitverlauf | großen Objekten, wechselndem Muster |

**Muster bekannt → Lifecycle. Muster unbekannt → Intelligent-Tiering.** Beides in einem Satz, und du beantwortest beide Kartenfragen.

## Die ehrliche Feinheit

Drei Punkte, die selbst gute Zusammenfassungen falsch wiedergeben.

**Erstens: Es gibt zwei verschiedene Zugriffslisten, nicht eine.** Die AWS-Doku führt getrennt auf, welche Operationen ein Objekt *nach oben* holen und welche das Absinken *in die Opt-in-Stufen* verhindern. `SelectObjectContent` steht nur auf der zweiten Liste. Die Doku sagt ausdrücklich, dass ein `SelectObjectContent` ein Objekt **nicht** nach Frequent Access zurückhebt und auch das Herabstufen von Frequent über Infrequent nach Archive Instant **nicht** verhindert.

Auch `HeadObject`, `GetObjectTagging`, `PutObjectTagging` und die `List`-Operationen zählen nicht als Zugriff. Wer ein Inventar über den Bucket laufen lässt, wärmt damit nichts auf — was gut ist, aber überrascht.

*Hinweis für den Sammelpass:* Die bestehende `battle_card_12.md` zählt `SelectObjectContent` unter den Operationen, die den Zähler zurücksetzen. Das ist nach der Doku falsch. Auf der Karte selbst steht es nicht.

**Zweitens: „keine Abrufgebühr" stimmt, aber nicht für jede Option.** Standard- und Bulk-Restores sind laut Preisseite in **allen fünf** Tiers kostenlos. Es gibt jedoch ein **Expedited-Retrieval für den Archive Access Tier**, und das wird zum Expedited-Satz berechnet. Die Aussage lautet also präzise: Alles, was automatisch passiert, kostet keinen Abruf — und bei den Opt-in-Stufen kostet dich nicht der Abruf, sondern die Wartezeit, es sei denn, du kaufst sie ab.

**Drittens: Archive Access mit 90 Tagen ersetzt Archive Instant Access.** Die Doku formuliert es als Warnung: Aktiviere Archive Access nur dann auf 90 Tage, wenn du Archive Instant Access **umgehen** willst. Die Karte zeichnet beide Stufen nebeneinander, als ergänzten sie sich. Bei gleicher Schwelle tun sie das nicht — du tauschst Millisekunden gegen einen kleinen Preisvorteil.

Und eine Grenze ohne Trostpflaster: Seit 2021 hat Intelligent-Tiering **keine Mindestspeicherdauer** mehr, die 30-Tage-Falle von Standard-IA entfällt also. Garantiert ist die Ersparnis trotzdem nicht. Wird jedes Objekt regelmäßig gelesen, bleibt alles im Frequent Access Tier — und du zahlst S3-Standard-Preis **plus** Monitoring.

## Syntax lesen — `Days` heißt hier etwas anderes

Zwei Konfigurationen aus derselben Familie, dasselbe Feld, entgegengesetzte Bedeutung. Das ist die böseste Verwechslung zwischen den Karten 11 und 12:

```
Lifecycle-Regel                     Intelligent-Tiering-Konfiguration
──────────────────────────          ─────────────────────────────────
"Transitions": [                    "Tierings": [
  { "Days": 365,                      { "Days": 180,
    "StorageClass":                     "AccessTier":
      "DEEP_ARCHIVE" }                    "ARCHIVE_ACCESS" }
]                                   ]
     │                                   │
     └─ Tage seit ERSTELLUNG             └─ Tage OHNE ZUGRIFF
        Uhr läuft einmal,                   Uhr wird bei jedem
        unabhängig vom Lesen                Lesen auf null gesetzt
```

Links eine Stoppuhr, die beim Upload startet und durchläuft. Rechts eine Sanduhr, die jeder Zugriff umdreht.

Die Wertebereiche verraten es zusätzlich: In `Tierings` sind für `ARCHIVE_ACCESS` mindestens 90 Tage erlaubt, für `DEEP_ARCHIVE_ACCESS` mindestens 180, beide bis maximal 730. Das Maximum existiert, weil ein Inaktivitätszähler ohne Obergrenze bedeuten würde, dass das Tier nie greift.

Und was in dem Block **nicht** steht, ist genauso aussagekräftig:

```
Frequent Access        ← nicht konfigurierbar, immer da
Infrequent Access      ← 30 Tage, fest verdrahtet
Archive Instant Access ← 90 Tage, fest verdrahtet
```

Die drei automatischen Tiers tauchen in keiner Konfiguration auf, weil sich an ihnen nichts einstellen lässt. Wer in einer Prüfungsfrage eine Option sieht, die die 30- oder 90-Tage-Schwelle der automatischen Tiers verändert, kann sie sofort streichen — dieses Feld gibt es nicht.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- keine Analyse, ab wann ein Asset kalt ist
- keine Lifecycle-Regel, die jemand pflegt und halbjährlich korrigiert
- kein Code im Upload-Pfad, der eine Klasse auswählt
- keine Abrufgebühr, wenn eine alte Kampagne neu anläuft
- kein Restore und keine Wartezeit in den drei automatischen Tiers
- keine Mindestspeicherdauer, die frühes Löschen bestraft

Übrig bleiben: ein Header beim PUT und eine Gebühr pro Objekt.

## Wenn du dir eine Sache merkst

**Intelligent-Tiering misst, Lifecycle rät.**

Steht im Text „unbekanntes, wechselndes oder unvorhersehbares Zugriffsmuster" und zugleich „keine Performance-Einbußen und keine Abrufgebühren", ist die Antwort S3 Intelligent-Tiering — und die drei automatischen Tiers liefern alle in Millisekunden.

Standard-IA verlangt Wissen, das der Fragetext ausdrücklich verneint. Glacier Instant Retrieval kostet Abrufgebühren. Eine eigene Analyse mit Storage Class Analysis beantwortet die Frage, statt sie zu lösen.

## Prüfungsknackpunkte

**Signalwörter:** „Zugriffsmuster unbekannt oder unvorhersehbar" plus „ändert sich über die Zeit" plus „keine Anwendungsänderung" plus „keine Abrufgebühren". Das Wort **unbekannt** ist der Schalter — es schließt jede regelbasierte Antwort aus.

**„Archive Instant Access" ist kein Glacier.** Der Name legt Wartezeit nahe, das Tier liefert in Millisekunden ohne Restore. Verwechselt wird es mit der eigenständigen Storage Class **S3 Glacier Instant Retrieval**, die 90 Tage Mindestspeicherdauer *und* Abrufgebühren hat. Merkhilfe: Alles, was in Intelligent-Tiering automatisch passiert, ist synchron und ohne Abrufgebühr; nur die beiden Opt-in-Stufen sind asynchron.

**Die Gebühr hängt an Objekten, nicht an Bytes.** „Intelligent-Tiering ist immer günstiger" ist falsch. Bei Millionen kleiner Objekte frisst die Monitoring-Gebühr die Ersparnis — und Objekte unter 128 KB werden ohnehin nie herabgestuft.

**Es bewegt nichts über die eigenen Tiers hinaus.** Intelligent-Tiering verschiebt nichts nach Standard-IA, One Zone-IA oder in eine Glacier-Storage-Class. Wer eine echte Glacier-Klasse will, braucht eine Lifecycle-Transition.

**Warum eine feste Lifecycle-Regel nach Standard-IA hier verliert:** Sie setzt ein bekanntes Muster voraus, das der Aufgabentext verneint, und bestraft jedes Wiedererwärmen mit einer Abrufgebühr pro GB.

**Warum S3 Glacier Instant Retrieval hier verliert:** Millisekunden ja, aber mit Abrufgebühr und 90 Tagen Mindestspeicherdauer. Die Vorgabe „keine Abrufgebühren" schließt es direkt aus.

**Warum S3 Glacier Flexible Retrieval oder Deep Archive hier verliert:** Beide verlangen ein `RestoreObject` und Wartezeit. Die Plattform liefert synchron aus — „keine Latenzverschlechterung" ist die Vorgabe, die das kippt.

**Warum S3 Storage Class Analysis hier verliert:** Es ist ein Analysewerkzeug, keine Storage Class. Es liefert eine Empfehlung, aus der jemand eine Regel baut — genau der manuelle Aufwand, den die Aufgabe ausschließt.

**Warum eigener Code im Upload-Pfad hier verliert:** Er müsste das Muster im Voraus kennen und verstößt gegen „keine Änderung am Anwendungscode". Zwei Ausschlusskriterien in einer Option.
