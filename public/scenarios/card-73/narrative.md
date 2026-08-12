---
cardNumber: 73
slug: datasync-nfs-nach-s3-inkrementell
title: "AWS DataSync — geplanter, inkrementeller Massentransfer über die Leitung"
services: ["AWS DataSync", "Amazon S3", "Amazon EFS", "AWS Storage Gateway", "AWS Snowball Edge"]
domains: ["D3", "D4"]
correctAnswer: "C"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/datasync/latest/userguide/choosing-task-mode.html"
  - "https://docs.aws.amazon.com/datasync/latest/userguide/configure-data-verification-options.html"
  - "https://docs.aws.amazon.com/datasync/latest/apireference/API_CreateTask.html"
  - "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-datasync-task-taskschedule.html"
  - "https://docs.aws.amazon.com/cli/latest/reference/datasync/update-task.html"
  - "https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html"
  - "https://aws.amazon.com/datasync/features/"
  - "https://aws.amazon.com/datasync/faqs/"
  - "https://aws.amazon.com/datasync/pricing/"
  - "https://aws.amazon.com/documentation-overview/datasync/"
  - "https://aws.amazon.com/snowball/"
---

## Die Grundidee zuerst

Stell dir vor, du musst jede Nacht denselben Aktenschrank in ein zweites Gebäude spiegeln.

**Weg eins:** Du fährst selbst. Handkarre, Liste, Stirnlampe. Du gehst Ordner für Ordner durch und vergleichst mit deiner Liste vom Vortag, um zu erkennen, was neu ist. Bei Ordner 400 verlierst du die Konzentration. Wenn dir jemand einen Ordner vor der Nase wegnimmt, merkst du es nicht. Ob drüben wirklich alles ankam, weißt du nie sicher — du hast es ja selbst gezählt. Und die Notiz auf jedem Ordner, wer ihn anlegen durfte, nimmt niemand mit. Das ist ein selbstgebautes Skript mit `rsync` und Cron.

**Weg zwei:** Du schließt einen Vertrag mit einer Spedition. Sie kommt stündlich, täglich oder wöchentlich — du sagst nur wann. Sie schaut selbst nach, was sich seit dem letzten Mal geändert hat, und nimmt nur das mit. Sie quittiert jedes einzelne Paket beim Abholen und beim Abliefern. Sie überträgt die Beschriftung mit, inklusive der Zugriffsvermerke. Und sie fährt mit gedrosseltem Tempo, wenn du sagst, dass die Straße tagsüber gebraucht wird.

DataSync ist die Spedition. Nicht schneller, weil die Straße breiter wäre, sondern weil du das Fahren nicht mehr selbst machst und die Quittung schon eingebaut ist.

Das erklärt die Formulierung, die in solchen Aufgaben immer auftaucht: **minimal operational overhead.** Nicht „am schnellsten", nicht „am billigsten" — am wenigsten selbst gebaut.

## Was es eigentlich ist — der Task

Der zentrale Gegenstand heißt Task. Er ist kein Programm, das läuft, sondern ein Datensatz, der zwei Orte verbindet und beschreibt, wie zwischen ihnen kopiert wird:

```json
{
  "Name": "fileserver-nach-s3",
  "SourceLocationArn":      "arn:aws:datasync:eu-central-1:1234:location/loc-NFS-SHARE",
  "DestinationLocationArn": "arn:aws:datasync:eu-central-1:1234:location/loc-S3-ARCHIV",
  "TaskMode": "BASIC",
  "Schedule": { "ScheduleExpression": "rate(1 hour)" },
  "Options": {
    "VerifyMode": "ONLY_FILES_TRANSFERRED",
    "TransferMode": "CHANGED",
    "PreserveDeletedFiles": "PRESERVE",
    "PosixPermissions": "PRESERVE",
    "Uid": "INT_VALUE",
    "Gid": "INT_VALUE",
    "BytesPerSecond": 26214400
  },
  "Excludes": [
    { "FilterType": "SIMPLE_PATTERN", "Value": "/tmp|/*.lock" }
  ]
}
```

Der Aufbau ist das Szenario. Zwei **Locations** — nicht „ein Server und ein Bucket", sondern zwei registrierte Orte, die DataSync symmetrisch behandelt. Ein **Zeitplan**. Und ein Block Optionen, in dem jede einzelne Zeile eine Entscheidung ist, die du sonst selbst programmieren müsstest: Wird geprüft (`VerifyMode`), wird nur Geändertes übertragen (`TransferMode`), was passiert mit Dateien, die es am Ziel gibt und an der Quelle nicht mehr (`PreserveDeletedFiles`), kommen Rechte und Eigentümer mit (`PosixPermissions`, `Uid`, `Gid`), und wie viel Bandbreite darf das Ganze ziehen (`BytesPerSecond`, hier 25 MiB/s).

Merk dir die Zeile `PreserveDeletedFiles: PRESERVE`. Sie steht später im Zentrum der ehrlichen Feinheit.

## Der Weg durch die Karte

### Kasten links — der NFS-Fileserver

Er bleibt produktiv, und das ist keine Nebenbemerkung, sondern der Grund für die gesamte Architektur: Auf dem Fileserver selbst wird nichts installiert. Er sieht nur einen weiteren NFS-Client.

Damit ist auch klar, was DataSync **nicht** sieht: Es liest über das Dateiprotokoll, also das, was ein Client sehen darf. Was in einer Datei gerade offen und halb geschrieben ist, kopiert es genauso halb — ein Transferwerkzeug ist kein konsistenter Snapshot.

### Badge 1 — der Agent liest über NFS

Der Pfeil zeigt nach unten, weil der Agent zieht, nicht der Fileserver schiebt.

Der Agent mountet den Share wie jeder andere Client und braucht dafür Leserechte. Bei einer Migration heißt das in der Praxis: einen eigenen Export für den Agenten einrichten, statt ihm die Rechte des Anwendungskontos zu geben.

### Kasten — der DataSync Agent

Eine virtuelle Maschine im eigenen Rechenzentrum, ausgeliefert als Image für die üblichen Hypervisoren. Sie ist der **einzige** Fußabdruck des Dienstes vor Ort.

Warum braucht es sie überhaupt? Weil AWS nicht in dein Netz kommt. NFS ist ein Protokoll für lokale Netze, nicht für das Internet. Der Agent ist der Übersetzer zwischen „lokales Dateiprotokoll" und „AWS-API über TLS" — er spricht drinnen NFS und draußen DataSync.

Das ist zugleich die Stelle, an der man in echten Projekten stolpert: Der Agent ist eine VM mit CPU, RAM und einer Netzkarte. Ist er zu klein oder teilt er sich die Leitung mit allem anderen, ist nicht DataSync langsam, sondern dein Agent.

### Badge 2 — über die Leitung, TLS und komprimiert

Hier passiert das, was den Dienst von einem Kopierbefehl unterscheidet. AWS beschreibt es als eigenes Transferprotokoll, das vom Speicherprotokoll **entkoppelt** ist. Es optimiert selbst: inkrementelle Übertragung, Inline-Kompression, Erkennung von Sparse Files, Prüfung und Verschlüsselung im Fluss.

Das Bild dazu: Die Spedition fragt nicht bei jedem Karton beim Archiv nach, ob sie ihn nehmen darf. Sie hat vorher inventarisiert und fährt dann durch. NFS ist ein gesprächiges Protokoll — viele kleine Anfragen, jede mit Wartezeit. Über eine Leitung mit hoher Latenz ist genau diese Gesprächigkeit der Flaschenhals, nicht die Bandbreite. Deshalb bleibt NFS im lokalen Netz, und über die Fernstrecke geht etwas anderes.

**Nach der Erstkopie bewegt sich nur noch, was neu oder geändert ist.** Das ist die Eigenschaft, die aus einer Migration eine Synchronisation macht — und die einzige, ohne die das Szenario „stündlich" unbezahlbar wäre.

### Kasten Mitte — der DataSync Service

Der verwaltete Teil. Er nimmt die Daten an, prüft sie und schreibt sie ins Ziel. Er ist auch der Ort, an dem der Zeitplan liegt und an dem die Metriken und Logs entstehen.

Wichtig für das Architekturbild: Der Service, nicht der Agent, schreibt ins Ziel. Der Agent kennt dein S3-Bucket nicht und braucht keine Bucket-Rechte. Die Berechtigung auf der AWS-Seite hängt an einer IAM-Rolle des Dienstes.

### Badge 3 — Objekte nach S3

Jede Datei wird **ein** S3-Objekt, eins zu eins. Kein Container, kein Archivformat, keine Sammeldatei.

Und der Punkt, der diese Karte von einer beliebigen Kopieraufgabe unterscheidet: Die POSIX-Metadaten aus dem NFS-Share — Rechte, Zeitstempel, Eigentümer — wandern als **Objekt-Metadaten** mit. Kopierst du die Objekte später zurück in ein Dateisystem, stellt DataSync daraus wieder die ursprünglichen Dateimetadaten her.

Das Bild: Der Ordner wird nicht ausgepackt und neu beschriftet. Die alte Beschriftung klebt als Zettel mit auf dem Regal, und beim Rückweg wird sie wieder aufgeklebt.

### Kasten — das S3 Bucket

Damit ist das Ziel ein Objektspeicher mit allem, was daran hängt: Lifecycle-Regeln, Versionierung, Storage-Klassen. Genau deshalb steht dieser Weg in Kostenaufgaben — nach dem Transfer kann Altbestand automatisch in günstigere Klassen wandern.

Ein Detail, das Prüflinge überrascht: Der Objektschlüssel entsteht aus dem Pfad. Aus `/projekte/2026/plan.xlsx` wird der Schlüssel `projekte/2026/plan.xlsx`. Es gibt drüben keine Ordner — es gibt Schlüssel, die wie Pfade aussehen.

### Badge 4 — alternativ nach EFS

Derselbe Task-Typ, anderes Ziel. Der Unterschied ist nicht technischer, sondern fachlicher Natur.

### Kasten — Amazon EFS

Wenn die Anwendungen, die später mit den Daten arbeiten, weiterhin Datei-Semantik brauchen — Verzeichnisse, Sperren, teilweises Schreiben mitten in einer Datei —, dann ist ein Objektspeicher das falsche Ziel. Dann geht es nach EFS, und die POSIX-Rechte sind dort nicht Metadaten, sondern wieder echte Rechte.

Die Entscheidung S3 gegen EFS ist damit keine Speicherfrage, sondern eine Frage über die Anwendung: Liest sie Dateien oder Objekte?

### Kasten oben — der Zeitplan

Der gestrichelte Pfeil trägt keine Nutzlast, er trägt einen Auslöser. Der Zeitplan ist Teil des Tasks, kein eigener Dienst: keine Lambda, keine EventBridge-Regel, kein Cron auf einer VM.

Genau das ist der Kern des Szenarios „wiederkehrend ohne eigene Skripte". Die Konsole bietet stündlich, täglich und wöchentlich direkt an. Und es gibt eine Grenze, die man kennen sollte: Die Dokumentation nennt ein Mindestintervall von **einer Stunde**. Wer alle fünf Minuten synchronisieren will, ist mit DataSync-Zeitplänen am Ende — dann startet man Läufe über die API oder braucht ein anderes Muster.

## Die entscheidende Unterscheidung

Drei Dienste, die in Aufgaben ständig gegeneinander stehen. Die Achse ist nicht Größe und nicht Geschwindigkeit, sondern **wofür die Daten danach gebraucht werden**:

| | DataSync | Storage Gateway (File Gateway) | Snowball Edge |
|---|---|---|---|
| Zweck | Daten bewegen und abgeglichen halten | dauerhafter lokaler Zugriff auf Daten in AWS | Daten offline transportieren |
| Vor Ort | Agent-VM, nur beim Lauf aktiv | Gateway-Appliance, permanent im Pfad | ausgeliehenes Gerät |
| Läuft wann | nach Zeitplan oder auf Abruf | ständig | einmalig |
| Leitung nötig | ja, ausreichend dimensioniert | ja | nein — das ist der Punkt |
| Typisches Signalwort | „recurring", „scheduled", „incremental" | „applications continue to access" | „insufficient bandwidth" |

## Die ehrliche Feinheit

Erstens, und es widerspricht dem Wort auf der Karte: **DataSync synchronisiert standardmäßig nicht in beide Richtungen des Löschens.** `PreserveDeletedFiles` steht per Vorgabe auf `PRESERVE` — löscht jemand eine Datei auf dem Fileserver, bleibt das Objekt in S3 liegen. Das ist als Voreinstellung sinnvoll, weil sie kein Datenverlustrisiko trägt, aber es heißt: Was du bekommst, ist standardmäßig eine wachsende Kopie, kein Spiegel. Wer einen echten Spiegel will, stellt auf `REMOVE` — und trägt ab da das Risiko, dass ein versehentliches Löschen an der Quelle sauber nach AWS repliziert wird.

Zweitens: **Inkrementell heißt nicht kostenlos.** Um zu wissen, was sich geändert hat, muss DataSync bei jedem Lauf beide Seiten abgleichen. Auf der S3-Seite sind das LIST- und HEAD-Anfragen auf den vorhandenen Bestand — AWS führt sie in den eigenen Preisbeispielen ausdrücklich als eigenen Posten neben der Übertragungsgebühr auf. Bei stündlichen Läufen über einen großen, kaum veränderlichen Bestand kann die Abtastung teurer werden als der Transfer. Zur Größenordnung, aus AWS' eigenem Beispiel: Eine Erstkopie von 10 TB liegt bei rund 128 US-Dollar Übertragungsgebühr, ein anschließendes Tagesdelta von 1 TB summiert sich auf rund 397 US-Dollar im Monat.

Drittens, ein dokumentierter Widerspruch, den ich nicht glattbügele: Es gibt zwei Task-Modi, `BASIC` und `ENHANCED`. Wofür `ENHANCED` verfügbar ist, steht in zwei AWS-Quellen unterschiedlich. Die User-Guide-Seite zur Modusauswahl führt neben S3-zu-S3 und den agentenlosen Cloud-Übertragungen auch NFS- und SMB-Fileserver nach S3 auf, wenn ein Enhanced-Mode-Agent verwendet wird. Die API-Referenz zu `CreateTask` nennt an derselben Stelle nur S3-zu-S3 und die agentenlosen Cloud-Fälle. Für dieses Szenario — NFS nach S3 — hängt daran, ob `ENHANCED` überhaupt wählbar ist. Ich setze deshalb keine Zahl und keine feste Aussage in den Text; im Zweifel gilt die User Guide des besitzenden Dienstes, aber die Divergenz gehört vor einer Architekturentscheidung geklärt.

Viertens, klein aber prüfungsfähig: Die Integritätsprüfung ist **konfigurierbar**, nicht schicksalhaft. `ONLY_FILES_TRANSFERRED` prüft, was in diesem Lauf bewegt wurde. `POINT_IN_TIME_CONSISTENT` prüft am Ende Quelle und Ziel vollständig gegeneinander — gründlicher, aber bei jedem Lauf teurer, weil wieder alles abgetastet wird. `NONE` prüft nur während der Übertragung.

## Syntax lesen — der Zeitplanausdruck

Was die Konsole als „stündlich" anbietet, ist darunter ein Ausdruck. Zwei Formen:

```
rate(1 hour)          cron(0 8 * * 3#1)
     │  │                  │ │ │ │  │
     │  └─ Einheit         │ │ │ │  └─ Wochentag mit Ordnungszahl:
     └─ Intervall          │ │ │ │     3#1 = erster Mittwoch
                           │ │ │ └─ Monat
                           │ │ └─ Tag im Monat
                           │ └─ Stunde
                           └─ Minute
```

`rate` nimmst du für „alle X" — es interessiert dich der Abstand. `cron` nimmst du für „an diesem Tag zu dieser Uhrzeit" — es interessiert dich der Termin. Das obige Cron-Beispiel steht so in der AWS-Dokumentation und bedeutet dort: 8 Uhr am ersten Mittwoch jedes Monats.

Zwei Hinweise, die dir Ärger sparen. Das dokumentierte DataSync-Beispiel hat **fünf** Felder, während die von derselben Dokumentation verlinkte EventBridge-Syntax mit sechs Feldern arbeitet — verlass dich hier nicht auf Analogie, sondern auf einen Testlauf. Und: Der Ausdruck wird in UTC ausgewertet. Ein `cron(0 2 * * ? *)` läuft in Deutschland um 3 oder 4 Uhr, je nach Jahreszeit. Für ein nächtliches Fenster reicht das meist; für ein Fenster, das exakt vor Geschäftsbeginn enden muss, nicht.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Skript, das Dateilisten vergleicht, und kein Cronjob, der es startet
- keine eigene Wiederholungslogik, wenn die Leitung mitten im Lauf abbricht
- keine selbstgebaute Prüfsummenkontrolle
- keine Änderung am Fileserver — kein Agent, kein Dienst, kein Neustart
- kein dauerhafter Zugriffspfad für lokale Anwendungen; nach dem Lauf gibt es keine Verbindung
- keine Konsistenzgarantie über mehrere Dateien hinweg — es ist kein Snapshot

Übrig bleiben: eine VM, zwei Locations, ein Task mit Zeitplan und eine Rechnung pro übertragenem Gigabyte.

## Wenn du dir eine Sache merkst

**DataSync bewegt Daten nach Zeitplan; Storage Gateway hält sie erreichbar. Bewegen ist ein Ereignis, Zugriff ist ein Zustand.**

Deshalb fällt File Gateway hier durch — es löst ein Zugriffsproblem, das die Aufgabe nicht stellt. Deshalb fällt Snowball durch — die Leitung ist ausdrücklich vorhanden. Und deshalb fällt der `rsync`-Eigenbau durch, sobald „minimal operational overhead" im Text steht: Er kann dasselbe, aber du betreibst ihn.

## Prüfungsknackpunkte

**Signalwörter:** „recurring incremental transfer", „over the existing link", „scheduled hourly, daily or weekly", „preserve POSIX metadata", „verify integrity", „minimal operational overhead". Zeitplan plus inkrementell plus Leitung ergibt DataSync.

**Die Kombinationsfalle.** DataSync und File Gateway sind keine Gegner. AWS empfiehlt im DataSync-FAQ ausdrücklich beides nacheinander: DataSync für die Migration nach S3, danach File Gateway, damit lokale Anwendungen weiter auf die migrierten Daten zugreifen. Eine Antwortoption, die beide kombiniert, ist deshalb nicht automatisch falsch — entscheidend ist, ob die Aufgabe nach dem Umzug noch lokalen Zugriff verlangt (Karte 16) oder nicht.

**Die Snowball-Falle hat sich gedreht.** Bandbreitenmangel bleibt in der Prüfung das Signalwort für die Snow-Familie (Karte 17). In der Realität ist dieser Weg zu: Snowball Edge ist seit dem 7. November 2025 nur noch für Bestandskunden verfügbar, AWS verweist neue Kunden ausdrücklich auf DataSync, und die Snowball-Produktseite kündigt das Ende des Supports in allen kommerziellen Regionen zum 31. Dezember 2026 an. Antworte in der Prüfung nach dem Exam Guide, plane im Projekt nach der Produktseite.

**A — Storage Gateway (File Gateway):** dauerhafter lokaler Zugriffspfad. Löst „Anwendungen greifen weiter zu", nicht „Daten sollen rüber".

**B — Snowball Edge:** Offline-Transport für den Fall, dass die Leitung nicht reicht. Die Aufgabe sagt „über die bestehende Leitung" — damit ist die Option ausgeschlossen.

**C — AWS DataSync:** richtig. Einziger Kandidat mit Zeitplan, Inkrementalität, Metadatenerhalt und Integritätsprüfung ohne eigenen Code.

**D — Skript mit `rsync` oder S3-CLI auf einer EC2-Instanz:** funktioniert und ist in Aufgaben immer falsch, wenn „minimal operational overhead" dabeisteht. Du erbst Scheduling, Wiederholung, Prüfung und Metadatenbehandlung als eigenen Code.
