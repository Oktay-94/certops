---
cardNumber: 60
slug: redshift-serverless-rpu-quartalslast
title: "Data Warehouse fuer schubweise Quartalslast mit Redshift Serverless und Zero-ETL"
services: ["Amazon Redshift Serverless", "Amazon Aurora PostgreSQL", "Amazon Redshift Spectrum", "Amazon S3", "Amazon QuickSight"]
domains: ["D1", "D3", "D4"]
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing-on-demand.html"
  - "https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html"
  - "https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing-reserved.html"
  - "https://docs.aws.amazon.com/redshift-serverless/latest/APIReference/API_UsageLimit.html"
  - "https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-console-configuration.html"
  - "https://docs.aws.amazon.com/redshift/latest/mgmt/zero-etl.reqs-lims.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/zero-etl.html"
  - "https://aws.amazon.com/redshift/pricing"
  - "https://aws.amazon.com/about-aws/whats-new/2024/10/amazon-aurora-postgresql-zero-etl-integration-redshift-generally-available/"
  - "https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-redshift-serverless-ai-driven-scaling-default/"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-redshift-serverless-4-rpu-minimum-capacity"
---

## Die Grundidee zuerst

Stell dir vor, deine Schule braucht viermal im Jahr eine Aula.

**Weg eins:** Ihr baut eine. Sie steht das ganze Jahr da, wird geheizt, gereinigt, versichert und gewartet. An 353 Tagen ist sie leer. Der Hausmeister fragt euch trotzdem jeden Monat, welche Heizstufe ihr wollt, und ihr müsst es wissen, obwohl niemand drin sitzt. Das ist ein Data-Warehouse-Cluster, der rund um die Uhr läuft.

**Weg zwei:** Ihr bucht den Saal im Bürgerhaus für die drei Tage, an denen ihr ihn braucht. Ihr sagt nicht, wie viele Heizkörper aufgedreht werden sollen, sondern wie viele Leute kommen. Und ihr sagt der Verwaltung vorher: mehr als 400 € im Monat gebt ihr nicht aus, egal was passiert.

Redshift Serverless ist das Bürgerhaus.

Damit sind die beiden Sätze der Aufgabe beantwortet, die auf den ersten Blick nichts miteinander zu tun haben: „niemand will Knotentypen dimensionieren" und „harte Obergrenze für die monatlichen Kosten". **Beides sind Fragen an dieselbe Konfiguration** — und wer sie verwechselt, baut genau das Falsche. Welche Frage welche Einstellung meint, ist der eigentliche Prüfungsstoff dieser Karte.

## Was es eigentlich ist — eine Workgroup und ein Limit

Kein Cluster, keine Knoten. Zwei Datensätze, wie die API sie entgegennimmt:

```json
{
  "workgroupName": "controlling-quartal",
  "baseCapacity": 32,
  "maxCapacity": 512,
  "publiclyAccessible": false,
  "configParameters": [
    { "parameterKey": "enable_case_sensitive_identifier", "parameterValue": "true" }
  ]
}
```

```json
{
  "resourceArn": "arn:aws:redshift-serverless:eu-central-1:1234:workgroup/controlling-quartal",
  "amount": 400,
  "period": "monthly",
  "breachAction": "deactivate"
}
```

Der obere Datensatz beschreibt die **Rechenleistung**, der untere das **Budget**. Sie sehen ähnlich aus und wirken völlig verschieden.

`baseCapacity` ist die Kapazität, mit der jede Abfrage startet, gemessen in **RPU** — Redshift Processing Units. **Ein RPU stellt 16 GB Arbeitsspeicher bereit**; laut Preisseite reicht die Basis von **4 bis 1.024 RPU**. `maxCapacity` ist die Obergrenze, bis zu der hochskaliert wird. `enable_case_sensitive_identifier` steht nicht zufällig da: Ohne diesen Parameter lehnt Redshift die Zero-ETL-Integration ab.

Der untere Datensatz kennt drei Felder, die zählen. `amount` sind **RPU-Stunden**. `period` ist `daily`, `weekly` oder `monthly` — ohne Angabe gilt monatlich. `breachAction` ist `log`, `emit-metric` oder `deactivate`: Eintrag in eine Systemtabelle, Metrik samt Benachrichtigung, oder Nutzerabfragen abschalten.

## Der Weg durch die Karte

### Badge 1 — repliziert: Aurora gibt ab, ohne sich zu ändern

Das Bestellsystem läuft unverändert weiter. Aurora PostgreSQL ist eine OLTP-Datenbank: Sie ist gebaut für viele kleine Transaktionen, für „Bestellung #48117 anlegen" in wenigen Millisekunden.

Was sie nicht ist: ein Ort für Joins über Bestellungen, Lieferanten und Retouren mit zwanzig gleichzeitigen Analysten. Solche Abfragen halten Sperren, füllen den Puffer-Cache mit Daten, die das Bestellsystem nicht braucht, und machen genau die Datenbank langsam, an der das Geschäft hängt. **Deshalb steht das Warehouse daneben und nicht an ihrer Stelle.**

### Der Kasten Zero-ETL — was da eigentlich steht

Zero-ETL ist kein Dienst mit eigener Oberfläche, sondern eine Integration zwischen zwei Diensten. Auf der Karte ist es eine eigene Box, weil ihre Aussage negativ ist: **Hier steht kein Glue-Job.**

Seit dem 15.10.2024 ist die Integration für Aurora PostgreSQL allgemein verfügbar. Die Daten stehen **innerhalb von Sekunden** nach dem Schreiben in Aurora für Abfragen in Redshift bereit. Als Ziel kommen Redshift-Serverless-Workgroups oder provisionierte Cluster mit RA3-Instanztypen in Frage, quellseitig Aurora-provisioned-Cluster und Aurora Serverless v2.

Zwei Bedingungen, die Kursmaterial gern unterschlägt: **Jede replizierte Tabelle braucht einen Primärschlüssel** — Tabellen ohne einen landen im Zustand `failed`. Und die Zieldatenbank in Redshift ist **schreibgeschützt**; du kannst darin keine Tabellen, Views oder materialisierten Sichten anlegen.

„Zero" heißt außerdem nicht „alles". Über Data Filtering lässt sich auf Ebene von Datenbank, Schema oder Tabelle festlegen, was repliziert wird und was nicht — bei einem Bestellsystem mit Zahlungsdaten ist das keine Feinheit, sondern der Unterschied zwischen einem Warehouse und einer zweiten Kopie personenbezogener Daten.

### Badge 2 — landet: RPU statt Knotentypen

Was in Redshift ankommt, liegt in einer Workgroup, nicht auf Knoten. Statt „vier Knoten vom Typ ra3.4xlarge" gibst du eine Zahl an: die Basiskapazität.

Seit April 2026 ist die **KI-gestützte Skalierung die Voreinstellung für neue Workgroups**. Sie sagt den Bedarf aus Abfragekomplexität, Datenvolumen und erwarteter Scangröße voraus und passt die Kapazität an, **bevor** Abfragen in die Warteschlange laufen. Statt einer Basiszahl setzt du dann einen Regler zwischen Kosten und Leistung.

Das Bild dazu: Der Hausmeister heizt nicht mehr, wenn es kalt geworden ist, sondern wenn er sieht, dass ihr kommt.

### Der Kasten RPU + AI-Scaling — was eine Kapazitätseinheit ist

Ein RPU ist eine Bündelung, kein Prozessor. AWS gibt genau eine Zahl dazu heraus: **16 GB Arbeitsspeicher je RPU**. Wie viele Kerne dahinterstehen, ist nicht dokumentiert und auch nicht die Frage — du kaufst Antwortzeit, keine Hardware.

Die Speicherzahl ist trotzdem nützlich, weil sie die Faustregeln der Karte erklärt. Bei 4 RPU stehen 64 GB bereit; AWS nennt für diese Einstiegsgröße bis zu 32 TB verwalteten Speicher und höchstens 100 Spalten je Tabelle. Ein Join über mehrere große Tabellen braucht Speicher für Zwischenergebnisse, und wenn er nicht reicht, weicht Redshift auf SSD und schließlich auf S3 aus. Genau das ist gemeint, wenn Kursmaterial sagt, Joins und Aggregationen „brauchen hohen Speicher".

Für das Szenario heißt das: Zwanzig gleichzeitige Analysten mit komplexen Joins sind kein Fall für die kleinste Basis, auch wenn die Rechnung sie attraktiv aussehen lässt.

### Badge 3 — deckelt: „Max", und warum der Name täuscht

Hier sitzt die Falle dieser Karte. Die Box heißt „Max (RPU-Stunden)" und trägt die Zeile „kein Skalierungslimit!" — beides ist richtig, aber nur, weil die Box den vollen Namen nennt.

Die Maximum-RPU-hours-Nutzungsgrenze begrenzt **keine Kapazität**. Sie zählt Verbrauch über einen Zeitraum und löst beim Erreichen eine Aktion aus. Wer 400 RPU-Stunden im Monat setzt, hat gesagt: „Mehr Verbrauch will ich nicht bezahlen" — nicht: „Höher als 400 sollst du nicht skalieren."

Die Finanzabteilung bekommt damit genau das, was sie verlangt hat: eine harte Obergrenze, ohne die Skalierung zu beschneiden, solange Budget da ist.

### Badge 5 — extern: die sieben Jahre bleiben liegen

Die Historie wird **nicht geladen**. Sie liegt weiter als Parquet in S3, und genau das ist die Kostenentscheidung: Sieben Jahre Bestelldaten in Redshift Managed Storage zu halten, um sie viermal im Jahr anzufassen, wäre die teure Variante derselben Antwort.

**Hinweis zur Karte:** Der Pfeil 5 mit dem Label „extern" endet geometrisch an der Max-Box. Fachlich gehört er an **Redshift Spectrum** — S3 hat mit dem Budgetlimit nichts zu tun. Die Box lag im Layout unten links und die Spectrum-Box unten rechts; der Pfeil folgt der Geometrie, nicht der Fachlichkeit. Lies ihn als „S3 wird von außen mitgelesen".

### Badge 4 — erweitert: Redshift Spectrum

Spectrum macht die S3-Dateien als externe Tabellen abfragbar. Damit steht in **einer** SQL-Anweisung ein Join zwischen einer replizierten Aurora-Tabelle und sieben Jahren Parquet.

Bei Serverless ist die Abrechnung dafür bemerkenswert einfach: Es gibt **keinen getrennten Posten für Data-Lake-Abfragen**. Eine Abfrage auf S3-Daten wird nach derselben Transaktionszeit berechnet wie eine Abfrage auf lokale Daten. Concurrency Scaling ebenso. Beim provisionierten Cluster ist Spectrum dagegen eine eigene Position auf der Rechnung — das ist eine der wenigen echten Verhaltensunterschiede zwischen den beiden Betriebsarten.

### Badge 6 — Bericht: QuickSight

Das Controlling bekommt seine Quartalsauswertung. Zwischen Redshift und QuickSight steht real ein Dataset, entweder mit SPICE-Import oder mit Direct Query; die Karte kürzt das ab und verweist dafür auf Karte 56.

Für dieses Szenario ist die Wahl nicht gleichgültig: Direct Query würde bei jedem Öffnen des Berichts RPU verbrauchen, ein SPICE-Import genau einmal.

### Badge 7 — SQL: zwanzig Analysten, drei Tage

Das Lastprofil ist die eigentliche Begründung der ganzen Architektur, und es steht als Box auf der Karte, obwohl es keine Komponente ist. Drei Tage lang zwanzig Nutzer, danach tagelang niemand.

Wenn die Analysten gehen, fährt die Kapazität herunter. Nicht „wird günstiger" — **hört auf zu kosten**. Für die Zeit ohne Abfragen wird keine Rechenkapazität berechnet; Speicher wird weiter berechnet, denn der liegt weiter da.

Zwei Details dieser Box entscheiden die Prüfungsfrage. „Zwanzig gleichzeitig" schließt Athena aus, weil das Volumenmodell bei anhaltender paralleler Last teuer wird. „Tagelang still" schließt einen provisionierten Cluster mit Reserved Instances aus, weil dessen Rechnung vom Leerlauf nichts weiß. **Beide Hälften des Lastprofils werden gebraucht** — mit nur einer davon ist die Frage nicht entscheidbar, und Prüfungsfragen nennen deshalb fast immer beide.

## Die entscheidende Unterscheidung

Redshift Serverless hat **zwei** Einstellungen, die beide „Max" heißen können und Gegenteiliges tun:

| | Max capacity | Maximum RPU hours |
|---|---|---|
| Begrenzt | die Kapazität zu jedem Zeitpunkt | den Verbrauch über einen Zeitraum |
| Einheit | RPU | RPU-Stunden |
| Zeitraum | keiner, gilt immer | daily, weekly, monthly |
| Bei Erreichen | Workgroup skaliert nicht weiter hoch | `log`, `emit-metric` oder `deactivate` |
| Laufende Abfragen | laufen weiter | können abgeschaltet werden |
| Abschalten mit | `-1` | Limit löschen |

Merksatz für die Prüfung: **Max capacity begrenzt, wie stark; Max RPU hours begrenzt, wie lange.**

## Die ehrliche Feinheit

**Erstens: Die Karte erzählt nur die halbe Max-Geschichte.** In der `.md` zur Karte steht, Kursmaterial stelle „Max" fälschlich als Gegenstück zur Basiskapazität dar. Das stimmt für die RPU-Stunden-Grenze — aber es gibt tatsächlich eine Einstellung namens **Max capacity**, die genau das ist: die RPU-Obergrenze für die Skalierung, laut Dokumentation bis 5.632 RPU. Beide Einstellungen existieren nebeneinander und lassen sich kombinieren. Wer in der Prüfung „Max" liest, muss weiterlesen, welches Max gemeint ist.

**Zweitens: Sekundengenau heißt nicht beliebig kurz.** Abgerechnet wird in RPU-Stunden auf Sekundenbasis, aber mit einer **Mindestabrechnung von 60 Sekunden**. Ein Dashboard, das im Minutentakt eine Abfrage von 200 Millisekunden feuert, zahlt jedes Mal eine volle Minute. Für zwanzig Analysten über drei Tage ist das irrelevant; für ein Monitoring-Skript wäre es der teuerste Weg, nichts zu tun.

**Drittens: Die Zahlenbereiche passen nicht ganz übereinander.** Die Basiskapazität reicht von 4 bis 1.024 RPU — aber die 4 RPU sind regional gestaffelt und kamen in Frankfurt erst im November 2025 an, und die KI-gestützte Skalierung unterstützt laut Ankündigung den Bereich **8 bis 512 RPU**. Wer die kleinste Basis wählt, ist außerhalb des Bereichs, für den die vorausschauende Skalierung gebaut wurde.

**Viertens: Zu den Rabatten der Serverless Reservations widersprechen sich zwei AWS-Seiten.** Die Preisseite nennt bis zu 45 %, die Abrechnungsdokumentation bis zu 24 % — vermutlich unterschiedliche Laufzeiten, aber keine der beiden Seiten sagt das. **Deshalb steht hier keine Zahl.** Gesichert und prüfungsrelevant ist nur die Struktur: Reservierungen gibt es für ein und für drei Jahre, sie werden stündlich abgerechnet und sekundengenau gemessen, und Verbrauch darüber hinaus läuft zum On-Demand-Satz.

## Syntax lesen — `create-usage-limit`

Vier Angaben, und drei davon werden regelmäßig verwechselt:

```
aws redshift-serverless create-usage-limit \
    --resource-arn  arn:aws:redshift-serverless:...:workgroup/controlling-quartal
    --amount        400            <- RPU-STUNDEN, nicht RPU, nicht Euro
    --period        monthly        <- daily | weekly | monthly (Woche beginnt Sonntag)
    --breach-action deactivate     <- log | emit-metric | deactivate
```

`amount` ist die Angabe, an der es scheitert. Es sind **RPU-Stunden**, also Kapazität mal Zeit: 32 RPU über eine Stunde sind 32 RPU-Stunden. Wer hier „400" einträgt und an Euro denkt, hat je nach Region und Basiskapazität ein völlig anderes Limit gesetzt, als er glaubt.

`breachAction: deactivate` ist die einzige der drei Aktionen, die wirklich stoppt. `log` schreibt in `SYS_QUERY_HISTORY`, `emit-metric` benachrichtigt — beide lassen die Kosten weiterlaufen. Eine „harte Obergrenze" im Sinne der Aufgabe ist nur `deactivate`.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Knotentyp, keine Knotenzahl, kein Resizing
- kein Glue-Job, kein Zeitplan, keine Bookmarks, keine ETL-Pipeline
- kein Ladevorgang für sieben Jahre Historie
- kein zweiter Speicherort für Daten, die schon in S3 liegen
- keine getrennte Abrechnung für Data-Lake-Abfragen
- keine Kapazität, die zwischen zwei Quartalsläufen bezahlt wird

Übrig bleiben eine Workgroup, eine Integration und ein Limit.

## Wenn du dir eine Sache merkst

**Anhaltende Warehouse-Last mit Joins und vielen gleichzeitigen Nutzern ist Redshift — und wenn diese Last schubweise auftritt, ist es Redshift Serverless.**

Athena rechnet je Ad-hoc-Abfrage nach gescanntem Volumen und passt zu gelegentlichen Fragen an den Data Lake. Provisioned lohnt bei stetiger, vorhersagbarer Last. Aurora selbst ist der falsche Ort für Joins über Millionen Zeilen.

## Prüfungsknackpunkte

**Signalwörter:** „no clusters to manage", „usage is highly intermittent", „idle for days", „complex joins and aggregations", „hard monthly spending cap", „near real-time data from the operational database without building ETL pipelines".

**Warum Athena hier verliert:** Beide kommen ohne festen Cluster aus — die Trennlinie ist nicht „Cluster ja/nein", sondern das Abrechnungsmodell. Athena rechnet nach gescanntem Volumen je Abfrage, Redshift Serverless nach Rechenkapazität über die Zeit. Bei zwanzig Analysten, die stundenlang komplexe Joins fahren, ist das Volumenmodell der teurere Weg. Steht „ad hoc", „occasional" oder „query data in S3 directly", dreht sich die Antwort um.

**Warum Redshift Provisioned mit Reserved Instances hier verliert:** Rechnerisch attraktiv, im Szenario falsch. Reserved Instances zahlen sich bei stetiger Last aus; bei tagelangem Leerlauf zahlst du eine Kapazität, die niemand nutzt. Umgekehrt gilt: Steht „runs 24/7" oder „predictable workload" im Text, ist Provisioned richtig.

**Warum ein Glue-ETL-Job hier verliert:** Er ist die richtige Antwort, wenn **transformiert** werden muss — Format ändern, bereinigen, zusammenführen. Hier sollen Daten nur ankommen, und das Szenario sagt ausdrücklich „ohne Pipelines zu bauen".

**Warum „einfach Aurora abfragen" hier verliert:** Es beantwortet die fachliche Frage und zerstört dabei das Bestellsystem. OLTP und Analytik konkurrieren um dieselben Ressourcen.

**Warum EMR hier verliert:** Es ist die Antwort auf „eigene Spark- oder Hadoop-Jobs", nicht auf „SQL für zwanzig Analysten". Ein Cluster, den niemand dimensionieren will, ist mit EMR schwer zu bekommen.

**Die Betriebsart ist kein Funktionsumfang.** Provisioned und Serverless können dasselbe — SQL, Zero-ETL, Federated Query, Spectrum — und lassen sich in beide Richtungen migrieren. Die Wahl ist eine Frage des Lastprofils. Antwortoptionen, die Serverless eine fehlende Funktion unterstellen, sind fast immer falsch.
