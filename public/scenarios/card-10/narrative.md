---
cardNumber: 10
slug: batch-ec2-gpu-spot-naechtliches-rendering
title: "AWS Batch · EC2 GPU · S3 — nächtliches Rendering als Job-Queue"
services:
  - "AWS Batch"
  - "EC2 GPU"
  - "EC2 Spot"
  - "Amazon S3"
  - "AWS Fargate"
domains: ["D4", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/batch/latest/userguide/gpu-jobs.html"
  - "https://docs.aws.amazon.com/batch/latest/userguide/batch-gpu-ami.html"
  - "https://docs.aws.amazon.com/batch/latest/APIReference/API_ResourceRequirement.html"
  - "https://docs.aws.amazon.com/batch/latest/userguide/fargate-compute-environments.html"
  - "https://docs.aws.amazon.com/batch/latest/userguide/managed_compute_environments.html"
  - "https://docs.aws.amazon.com/batch/latest/userguide/job_retries.html"
  - "https://docs.aws.amazon.com/batch/latest/APIReference/API_RetryStrategy.html"
  - "https://aws.amazon.com/blogs/hpc/aws-batch-best-practices/"
  - "https://aws.amazon.com/ec2/instance-types/g6/"
  - "https://aws.amazon.com/ec2/instance-types/g5/"
  - "https://docs.aws.amazon.com/lambda/latest/dg/configuration-timeout.html"
---

## Die Grundidee zuerst

Stell dir vor, du hast jede Nacht 400 Druckaufträge und zwei Möglichkeiten.

**Weg eins:** Du kaufst zehn Großkopierer und stellst sie in den Keller. Nachts laufen sie heiß, tagsüber stehen sie da. Du zahlst Miete für den Raum, Strom für die Bereitschaft und Wartung für Maschinen, die 16 von 24 Stunden nichts tun. Und wenn eine Nacht 900 Aufträge bringt statt 400, bist du bis mittags nicht fertig.

**Weg zwei:** Du legst den Stapel abends auf den Tresen eines Kopierladens mit Nachtschalter, mit einem Zettel obendrauf: „bis morgen früh". Der Laden entscheidet selbst, wie viele Maschinen er dafür anwirft — bei 400 Aufträgen vier, bei 900 neun. Um sechs Uhr früh liegt der Stapel fertig da, und der Laden hat wieder null Maschinen laufen.

AWS Batch ist der Tresen. Du reichst Arbeit ein, nicht Infrastruktur.

Das erklärt den Satz aus der Aufgabe: „keinen Cluster verwalten". Es gibt keinen Cluster, den du besitzt. Es gibt eine Warteschlange und eine Regel, wie viel Maschine sie sich holen darf.

## Was es eigentlich ist — die Job Definition

Der Tresen allein reicht nicht. Damit der Laden weiß, *was* ein Auftrag braucht, gehört zu jedem Job eine Vorlage — die **Job Definition**. Sie ist das zentrale Objekt dieses Szenarios, und sie steht nicht auf der Karte:

```json
{
  "jobDefinitionName": "render-frame",
  "type": "container",
  "platformCapabilities": ["EC2"],
  "containerProperties": {
    "image": "1234.dkr.ecr.eu-central-1.amazonaws.com/blender:3.6",
    "resourceRequirements": [
      { "type": "GPU",    "value": "1" },
      { "type": "VCPU",   "value": "8" },
      { "type": "MEMORY", "value": "32768" }
    ],
    "command": ["render.sh", "Ref::szene", "Ref::frame"]
  },
  "retryStrategy": {
    "attempts": 3,
    "evaluateOnExit": [
      { "onStatusReason": "Host EC2*", "action": "RETRY" },
      { "onReason": "*",               "action": "EXIT"  }
    ]
  }
}
```

Lies das von oben nach unten, es ist die halbe Lösung der Aufgabe. Auf welcher Plattform (`platformCapabilities`), mit welchem Container (`image`), mit wie viel GPU (`resourceRequirements`), mit welchem Befehl (`command`) — und, entscheidend, **was bei einem Abbruch passiert** (`retryStrategy`).

Der letzte Block ist der wichtigste des ganzen Szenarios. Merk dir seine Existenz; im Abschnitt zum Spot-Kasten wird klar, warum.

## Der Weg durch die Karte

### Badge 1 — `submit-job`: 400 Zettel auf den Tresen

Das Render-Team schickt abends 400 Jobs an die Queue. Kein Provisionieren, kein Warten auf eine Instanz, kein „ist der Cluster schon oben?". Ein API-Aufruf pro Szene.

Der Kasten auf der Karte sagt richtig: **kein Server-Setup**. Was er nicht sagt: Zwischen `submit-job` und der Queue liegt die Job Definition von oben. Der Aufruf verweist auf sie, statt die Anforderungen mitzuschicken.

Das Bild dazu: Du legst nicht 400 einzeln erklärte Aufträge hin, sondern 400 Zettel mit derselben Auftragsnummer und je einer Szenennummer drauf. Was Auftragsnummer 17 bedeutet, steht einmal beim Laden hinterlegt.

### Der Kasten „Batch Job Queue" — Priorität, Retry, Dependencies

Die Queue ist kein Puffer, sie ist ein **Scheduler mit Meinung**. Sie hält jeden Job in einem Zustand (`SUBMITTED`, `PENDING`, `RUNNABLE`, `STARTING`, `RUNNING`) und entscheidet, wer als Nächstes dran ist — nach Priorität, nach erfüllten Dependencies, nach verfügbarer Kapazität.

`RUNNABLE` ist der Zustand, in dem die meiste Zeit vergeht und in dem die meisten Fehler sichtbar werden: Der Job *könnte* laufen, aber es gibt keine passende Instanz. Wenn ein GPU-Job dort dauerhaft hängt, ist fast immer das Compute Environment schuld, nicht der Container.

### Badge 2 — Dispatch in das Managed Compute Environment

Jetzt erst entsteht Rechenleistung. Batch schaut in die Queue, rechnet zusammen, wie viele vCPUs und GPUs die wartenden Jobs anfordern, und startet genau so viele Instanzen.

„Managed" heißt konkret: Batch legt in deinem Konto Launch Templates, Auto Scaling Groups, Spot Fleets und einen ECS-Cluster an und pflegt sie. Die AWS-Doku warnt ausdrücklich davor, diese Ressourcen von Hand anzufassen — ein manuell geändertes Batch-Objekt kann das Compute Environment auf `INVALID` setzen.

Das ist die Konsequenz von „managed": Du bekommst die Automatik, aber du gibst die Fernbedienung ab.

### Der Rahmen — `minvCpus 0` und was das kostet

Der orange gestrichelte Rahmen um die Compute-Kästen trägt den Satz `Batch startet und stoppt die Instanzen selbst — minvCpus 0`.

`minvCpus 0` ist die Zeile, an der die Kostenvorgabe der Aufgabe hängt. Sie sagt: Wenn die Queue leer ist, darf die untere Grenze null sein. Keine Warm-Reserve, keine Bereitschaftsinstanz, tagsüber keine Rechnung.

Der Preis dafür ist Anlaufzeit. Der erste Job der Nacht wartet, bis eine GPU-Instanz gestartet, das GPU-optimierte AMI geladen und der Container gezogen ist. Bei einem Container jenseits von 4 GB ist das spürbar. Bei einem Nachtlauf ist es egal — und genau deshalb passt Batch hier und nicht überall.

### Badge 3 — Input aus S3: warum die Instanz nichts besitzt

Der Container zieht Szenen und Texturen aus dem S3-Input-Bucket. Kein gemeinsames Dateisystem, keine EBS-Volumes, die jemand vorher befüllt.

Das ist kein Detail, das ist die Bedingung dafür, dass der Rest funktioniert. Eine Instanz, die nichts besitzt, darf jederzeit sterben. Eine Instanz mit lokalem Zustand darf das nicht — und dann kannst du kein Spot fahren, und dann kippt die ganze Kostenrechnung.

**Zustandslosigkeit ist hier keine Eleganz, sondern die Voraussetzung für den Rabatt.**

### Der Kasten „EC2 GPU (p-Familie)" — hier steht ein Kartenbefund

**Auf der Karte steht `EC2 GPU (p-Familie)` — für ein Rendering-Szenario ist die G-Familie die bessere Antwort.**

Falsch ist die Karte nicht. Die Batch-Doku listet für GPU-Jobs `p3, p4, p5, p6, g3, g3s, g4, g5, g6` — P-Instanzen können rendern. Aber AWS positioniert die beiden Familien selbst unterschiedlich: Die G6-Produktseite nennt als Anwendungsfall wörtlich das Erzeugen und Rendern von Grafik in Kinoqualität, die G5-Seite nennt Video-Rendering und Remote-Workstations. Die P-Familie ist AWS' Linie für ML-Training und HPC.

Für die Prüfung heißt das: „3D-Rendering" plus „GPU" zeigt auf **G**, „Modelltraining" plus „GPU" zeigt auf **P**. Der Fixvorschlag für die Karte lautet `EC2 GPU (g-Familie)`.

Richtig und wichtig ist der zweite Satz im Kasten: **GPU-optimiertes AMI nötig.** In einem Managed Compute Environment nimmt Batch dieses AMI automatisch, sobald eine der genannten Instanzfamilien konfiguriert ist. In einem unmanaged Environment musst du es selbst setzen — sonst sieht der Container die GPU schlicht nicht.

### Badge 4 — Spot: der Rabatt und seine Bedingung

Hier sitzt der schwerste Befund dieser Karte.

**Auf der Karte steht `Batch retryt den Job` — das gilt nur mit konfigurierter `retryStrategy`.**

Die AWS-Doku ist eindeutig: Standardmäßig bekommt jeder Job **genau einen Versuch**, in `SUCCEEDED` oder `FAILED` zu laufen. Erst wenn du in der Job Definition oder beim `submit-job` eine `retryStrategy` mit `attempts` zwischen 1 und 10 setzt, wird ein abgebrochener Job zurück in `RUNNABLE` gelegt.

Ohne diese Zeile ist eine zurückgeholte Spot-Instanz kein Retry, sondern ein verlorener Frame.

Die Karte stellt damit eine **Konfigurationsentscheidung als Serviceeigenschaft** dar. Das ist die gefährlichere Sorte Fehler, weil sie sich richtig anfühlt: Batch *kann* das, aber nur wenn du es sagst.

Der saubere Weg für Spot ist nicht nur `attempts`, sondern `evaluateOnExit` — die Liste im JSON oben. Sie unterscheidet, *warum* ein Job starb: `onStatusReason: "Host EC2*"` fängt den Fall „die Instanz wurde weggenommen" und wiederholt. Alles andere — ein Absturz im eigenen Code, ein kaputter Pfad — fällt auf `EXIT`.

**Wiederhol den Infrastrukturfehler, nicht den Programmierfehler.** Ein Job mit `attempts: 3` und ohne `evaluateOnExit` rendert einen kaputten Frame dreimal kaputt und zahlt dreimal dafür.

### Badge 5 — Output nach S3 und der Scale-down auf 0

Die fertigen Frames gehen in den Output-Bucket, später per Lifecycle-Regel in eine Glacier-Klasse. Wie das im Detail läuft, ist der Stoff von Karte 11.

Nach dem letzten Job fährt Batch das Compute Environment auf null Instanzen. Der Satz `tagsüber keine GPU-Kosten` auf der Karte ist die Belohnung für `minvCpus 0` — und er ist der Grund, warum ein dauerhaft laufender EC2- oder EKS-Cluster diese Aufgabe technisch löst und trotzdem falsch beantwortet.

### Der graue Pfad mit dem roten X — Fargate

Der abgelehnte Weg: dieselbe Job Queue, aber ein Fargate Compute Environment.

Das ist der attraktivste Irrweg der Karte, weil er in die richtige Richtung zeigt — noch weniger Verwaltung, keine Instanztypen, keine AMIs. Die AWS-API-Referenz beendet ihn in einem Satz: GPUs stehen für Jobs auf Fargate-Ressourcen nicht zur Verfügung.

Zwei Randnotizen zur Karte: Die Farbe des Pfads ist **grau**, obwohl die Konvention für Verworfenes Rot vorsieht — Karte 12 macht denselben Fall komplett rot. Und der Kasten sagt richtig `ok für CPU-Jobs`: Fargate ist im Batch-Kontext kein schlechter Modus, nur einer ohne GPU.

## Die entscheidende Unterscheidung

Die eine Achse, die dieses Szenario trägt:

| | EC2 Compute Environment | Fargate Compute Environment |
|---|---|---|
| GPU | ja, mit GPU-Instanzfamilie + GPU-AMI | **nein** |
| Instanztyp wählbar | ja (`instanceTypes`) | nein, Parameter unzulässig |
| `minvCpus` / `desiredvCpus` | ja | Parameter unzulässig |
| Custom AMI, Launch Template | ja | nein |
| Anlaufzeit | Instanzstart + AMI + Image | nur Task-Start |
| Passt für | GPU, lange Läufe, große Images | kurze CPU-Jobs |

Die Zeile, die alles entscheidet, ist die erste. Die übrigen erklären nur, warum.

## Die ehrliche Feinheit

Drei Dinge, die die Karte nicht zeigt.

**Erstens: Die Job Definition fehlt im Bild.** Die Karte geht von der Queue direkt ins Compute Environment. Dazwischen liegt das Objekt, das GPU-Anforderung *und* Retry-Strategie trägt. Genau deshalb liest sich der Spot-Kasten falsch — ohne das fehlende Objekt sieht Retry wie eine Eigenschaft der Warteschlange aus.

**Zweitens: Spot warnt, aber kurz.** Eine zurückgeforderte Instanz bekommt zwei Minuten Vorlauf. Ein Renderjob, der drei Stunden läuft und keinen Checkpoint schreibt, kann damit nichts anfangen — er beginnt von vorn. Für 400 unabhängige Frames ist das verschmerzbar. Für einen einzelnen 20-Stunden-Job wäre es ruinös, und dann ist On-Demand die richtige Antwort, obwohl „unterbrechbar" im Text steht.

**Drittens: `retryStrategy` und Idempotenz hängen zusammen.** Ein wiederholter Job schreibt denselben Output-Schlüssel noch einmal. Bei Frames in S3 ist das harmlos, weil ein Überschreiben dasselbe Ergebnis liefert. Bei einem Job, der eine Rechnung verschickt oder einen Zähler erhöht, wäre `attempts: 3` ein Fehler mit Faktor drei.

## Syntax lesen — `evaluateOnExit`

Der Block aus der Job Definition entscheidet über Erfolg oder Verschwendung bei Spot. Er liest sich wie eine Firewall-Regel: von oben nach unten, **erster Treffer gewinnt**.

```
"evaluateOnExit": [
  { "onStatusReason": "Host EC2*", "action": "RETRY" },
  { "onReason":       "*",         "action": "EXIT"  }
]
      │                  │              │
      │                  │              └─ RETRY oder EXIT
      │                  └─ Mustertext, * als Platzhalter
      └─ welches Feld verglichen wird
```

Drei Felder stehen zum Vergleich zur Verfügung, und sie meinen Verschiedenes:

- **`onStatusReason`** — der Klartext, warum der Job endete. `Host EC2 instance-id ... was terminated` ist die Spur einer zurückgeholten Instanz. Das ist der Spot-Fall.
- **`onReason`** — der technische Grund aus dem Container-Stopp.
- **`onExitCode`** — der Exit-Code deines Programms. Für „Renderer hat sich verschluckt" gegen „Szene ist kaputt".

Zwei Regeln, die man beim ersten Mal übersieht:

**`attempts` ist Pflicht, sobald `evaluateOnExit` gesetzt ist.** Die Liste ohne Versuchszahl ist keine gültige Konfiguration — sie sagt *wann* wiederholt wird, nicht *wie oft*.

**Trifft keine Zeile zu, wird wiederholt.** Der Default am Ende der Liste ist RETRY, nicht EXIT. Deshalb steht in der Konfiguration oben eine letzte Zeile mit `"onReason": "*"` und `EXIT` — sie ist der bewusst gesetzte Auffangfall. Ohne sie wiederholt Batch auch den Tippfehler in deinem Renderskript, bis `attempts` erschöpft ist.

Maximal fünf solcher Bedingungen sind erlaubt. Das reicht, weil die interessante Unterscheidung binär ist: Infrastruktur oder Code.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Cluster, den jemand dimensioniert, patcht oder überwacht
- keine Scheduler-Software (Slurm, Nextflow-Runner) auf einer eigenen Instanz
- kein gemeinsames Dateisystem, kein EFS, kein FSx
- kein Cronjob, der nachts etwas anstößt und morgens etwas abräumt
- keine Kapazitätsplanung — 400 oder 900 Jobs ändern nur die Instanzzahl
- keine Bereitschaftskosten zwischen zwei Nachtläufen

Übrig bleiben: zwei Buckets, eine Job Definition, eine Queue und ein Compute Environment mit `minvCpus 0`.

## Wenn du dir eine Sache merkst

**AWS Batch ist eine Warteschlange plus managed Scaling — und GPUs gibt es dort nur im EC2-Compute-Environment, weil Fargate keine hat.**

Lambda scheidet doppelt aus: 900 Sekunden Maximallaufzeit und keine GPU. Ein dauerhafter EC2- oder EKS-Cluster löst die Aufgabe und verfehlt die Kostenvorgabe. EFS statt S3 löst ein Problem, das dieses Szenario nicht hat.

## Prüfungsknackpunkte

**Signalwörter:** „hunderte unabhängige Jobs" plus „GPU" plus „kein Cluster verwalten" plus „nur nachts". Stapelarbeit mit variabler Menge und ohne Betriebsmannschaft ist Batch. Kommt „unterbrechbar" oder „wiederholbar" dazu, ist Spot mitgemeint.

**Die Falle mit dem Retry.** Wenn eine Antwortoption behauptet, Batch wiederhole unterbrochene Spot-Jobs von selbst, ist das ohne `retryStrategy` falsch. Der Default ist ein Versuch.

**Die Falle mit der Instanzfamilie.** Rendering und Grafik zeigen auf die G-Familie, Modelltraining und HPC auf die P-Familie. Beide funktionieren in Batch, aber die Frage prüft die Zuordnung.

**Warum Fargate hier verliert:** Weniger Verwaltung, aber keine GPU — die API-Referenz schließt GPU-Ressourcen für Fargate-Jobs aus. Für kurze CPU-Jobs bleibt es die richtige Wahl.

**Warum Lambda hier verliert:** 900 Sekunden Maximum und keine GPU. Ein Renderjob über Stunden passt in keine der beiden Grenzen.

**Warum ein permanenter EC2- oder EKS-Cluster hier verliert:** Technisch möglich, aber 16 Stunden am Tag bezahlte Leerlaufzeit. `minvCpus 0` ist genau die Antwort darauf.

**Warum EFS statt S3 hier verliert:** Ein gemeinsames Dateisystem lohnt nur bei echter POSIX-Semantik zwischen Jobs. „Input rein, Output raus" ist entkoppelt, günstiger und macht die Instanzen wegwerfbar.

**Warum On-Demand statt Spot hier verliert:** Die Jobs sind unabhängig und wiederholbar, die Aufgabe nennt Kostenoptimierung ausdrücklich. Dreht die Frage auf „harte Deadline" oder „kein Checkpoint", kippt die Antwort auf On-Demand.
