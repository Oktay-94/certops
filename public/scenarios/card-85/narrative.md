---
cardNumber: 85
slug: savings-plans-reserved-instances-spot-kaufoptionen
title: "Savings Plans vs Reserved Instances vs Spot"
services: ["AWS Savings Plans", "Amazon EC2 Reserved Instances", "Amazon EC2 Spot Instances", "AWS Fargate", "AWS Lambda", "Amazon EC2 Auto Scaling"]
domains: ["D4"]
correctAnswer: "C"
badgeCount: 0
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/savingsplans/latest/userguide/plan-types.html"
  - "https://docs.aws.amazon.com/savingsplans/latest/userguide/sp-services.html"
  - "https://aws.amazon.com/savingsplans/faqs"
  - "https://aws.amazon.com/about-aws/whats-new/2025/12/database-savings-plans-savings"
  - "https://aws.amazon.com/ec2/pricing/reserved-instances/pricing/"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ri-limits.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/apply_ri.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/rebalance-recommendations.html"
  - "https://docs.aws.amazon.com/whitepapers/latest/cost-optimization-reservation-models/regional-and-zonal-reserved-instances.html"
---

## Die Grundidee zuerst

Stell dir drei Arten vor, Bahnfahren zu bezahlen.

**Die alte Art:** Du kaufst eine Zeitkarte für eine bestimmte Verbindung, in einer bestimmten Wagenklasse, für drei Jahre. Billig pro Fahrt — aber wenn du umziehst, ist die Karte wertlos und wird trotzdem weiter abgebucht. Und noch etwas ist sie nicht: eine Sitzplatzgarantie. Die Zeitkarte sagt, *was du zahlst*, nicht *dass ein Platz frei ist*.

**Die neue Art:** Du sagst dem Verkehrsbetrieb zu, drei Jahre lang mindestens zwölf Euro pro Stunde zu verfahren. Welche Strecke, welcher Zug, welche Klasse — dein Problem. Ziehst du um, fährst du eben andere Strecken; der Rabatt zieht mit. Du bindest dich an einen **Betrag**, nicht an einen Gegenstand.

**Die dritte Art:** Du steigst kurz vor Abfahrt in einen Zug, der ohnehin fährt, und zahlst fast nichts. Dafür darf dich der Schaffner an jeder Station bitten auszusteigen, wenn ein zahlender Fahrgast den Platz will. Du bekommst zwei Minuten Vorwarnung.

Diese drei Arten heißen bei AWS Savings Plans, Reserved Instances und Spot Instances. Und der Satz mit der Sitzplatzgarantie ist der wichtigste der ganzen Karte, weil er in der Prüfung am häufigsten geprüft und im Alltag am häufigsten falsch verstanden wird.

Das Handelsunternehmen aus dem Szenario hat drei Lastprofile gleichzeitig — konstante Grundlast auf EC2 und Fargate, nächtliches Batch-Rendering, einen RDS-Cluster — und eine terminierte Graviton-Migration. Es sucht deshalb nicht *eine* Kaufoption, sondern eine Zuordnung.

## Was es eigentlich ist — eine Zusage in Dollar pro Stunde

Ein Savings Plan ist kein Objekt in deinem Konto, das Rechenleistung enthält. Er ist eine Abrechnungszusage:

```json
{
  "savingsPlanArn": "arn:aws:savingsplans::123456789012:savingsplan/8f2c…",
  "savingsPlanType": "Compute",
  "paymentOption": "No Upfront",
  "termDurationInSeconds": 94608000,
  "commitment": "7.20",
  "currency": "USD",
  "state": "active"
}
```

Sechs Zeilen, die alles festlegen. `savingsPlanType: "Compute"` bestimmt den Geltungsbereich. `termDurationInSeconds: 94608000` sind drei Jahre. `commitment: "7.20"` heißt: Du zahlst pro Stunde 7,20 USD zum vergünstigten Tarif — ob du sie verbrauchst oder nicht.

Was in diesem Objekt **nicht** steht, ist der eigentliche Punkt: kein Instanztyp, keine Availability Zone, keine Region, kein Betriebssystem, keine Instanzanzahl. Ein Compute Savings Plan gilt laut AWS-Dokumentation unabhängig von Instanzfamilie, Instanzgröße, Region, Betriebssystem und Tenancy — und zusätzlich für Fargate und Lambda.

Zum Vergleich derselbe Vorgang als Reserved Instance:

```json
{
  "ReservedInstancesId": "b1c2…",
  "InstanceType": "m5.2xlarge",
  "AvailabilityZone": "eu-central-1a",
  "Scope": "Availability Zone",
  "ProductDescription": "Linux/UNIX",
  "OfferingClass": "standard",
  "InstanceCount": 8
}
```

Hier steht plötzlich alles drin. Und genau `"Scope": "Availability Zone"` ist die Zeile, die diese Karte trägt: **Nur mit diesem Wert entsteht neben dem Rabatt auch eine Kapazitätsreservierung.** Steht dort `"Region"`, bekommst du Flexibilität über die Zonen und über Instanzgrößen — aber keine reservierte Kapazität.

Die Zusage lässt sich nach dem Kauf nicht ändern. AWS formuliert das für Savings Plans als eigene Anmerkung: Die Bedingungen der Verpflichtung sind nach dem Kauf unveränderlich; ändert sich deine Nutzung, kaufst du zusätzliche Pläne.

## Der Weg durch die Karte

### Die Leserichtung — Lastprofil zuerst, Kaufoption danach

Die Karte ist eine Matrix und wird zeilenweise gelesen: links das Lastprofil, in der Mitte die passende Kaufoption, rechts Rabatt und Bindung. Das ist die Reihenfolge, in der auch die Prüfungsfragen gebaut sind — sie beschreiben eine Last und fragen nach der Option, nie umgekehrt.

Wer die Karte spaltenweise liest, landet automatisch bei „welche Option gibt am meisten Rabatt" und damit fast immer bei der falschen Antwort.

### Zeile 1 — Konstante Grundlast, Architektur in Bewegung → Compute Savings Plans

Bis 66 % unter On-Demand. Die Bindung ist ein Betrag pro Stunde, die Laufzeit ein oder drei Jahre.

Die AWS-Dokumentation nennt die drei Bewegungen, die dieser Plan aushält, sogar beispielhaft: eine Workload von c5 auf m5 verschieben, die Nutzung von Irland nach London verlagern, eine Anwendung von EC2 auf ECS mit Fargate migrieren. Alles drei ohne Rabattverlust.

Für das Szenario ist damit entschieden: Die Graviton-Migration von m5 auf m7g ist genau so eine Bewegung. Der Compute Savings Plan überlebt sie, weil er die Instanzfamilie nie gekannt hat. Dass er zusätzlich Fargate abdeckt — und die Grundlast läuft teils auf Fargate — ist der zweite Treffer in derselben Zeile.

### Zeile 2 — Stabile Familie in stabiler Region → EC2 Instance Savings Plans

Bis 72 %. Du legst dich auf eine Instanzfamilie in einer gewählten Region fest, zum Beispiel m5 in Virginia. Innerhalb dieser Grenze bleibst du frei: Größe, Betriebssystem und Tenancy darfst du wechseln — von c5.xlarge auf c5.2xlarge, von Windows auf Linux, von Dedicated auf Default.

Sechs Prozentpunkte mehr Rabatt gegen den Verzicht auf Familien- und Regionswechsel. Das ist ein guter Handel, solange die gebundene Familie ausgelastet bleibt. Im Szenario ist er ein schlechter Handel, weil das Ende der Familie m5 bereits terminiert ist.

Das Bild dazu: Du mietest einen Parkplatz direkt vor dem Büro und ziehst nächstes Quartal in ein anderes Gebäude.

### Zeile 3 — Unterbrechbarer Batch → Spot Instances

Bis 90 %. Die AWS-Dokumentation beschreibt Spot als freie EC2-Kapazität und formuliert den Unterschied zu On-Demand in einem einzigen Satz: Der einzige Unterschied ist, dass Spot-Instanzen mit zwei Minuten Vorankündigung unterbrochen werden können, wenn EC2 die Kapazität zurückholt.

Empfohlen werden sie für zustandslose, fehlertolerante, flexible Anwendungen — die Dokumentation nennt Big Data, containerisierte Workloads, CI/CD, zustandslose Webserver, HPC und **Rendering**. Das nächtliche Batch-Rendering aus dem Szenario steht damit wörtlich in der Empfehlungsliste.

Zusätzlich gibt es die Rebalance Recommendation: ein Signal, dass eine Instanz erhöhtes Unterbrechungsrisiko hat. Es kann früher eintreffen als die Zwei-Minuten-Warnung — aber die Doku schränkt selbst ein, dass das nicht immer möglich ist und das Signal auch gemeinsam mit der Warnung ankommen kann. Deshalb steht auf der Karte „oft früher" und nicht „immer früher". Jede Architektur, die mehr als zwei Minuten braucht, ist auf Spot falsch gebaut.

### Zeile 4 — Datenbanken → Reserved Instances (Prüfungsstand)

Bis 72 %, gebunden an Instanzklasse, Engine und Region. Für den Prüfungsstand ist die Regel einfach: Savings Plans decken Compute ab, für Datenbanken gibt es Reserved Instances.

Und hier hängt der Merksatz der ganzen Karte. Die AWS-Preisseite zu Reserved Instances sagt es in einem Satz: Sind Reserved Instances einer bestimmten Availability Zone zugewiesen, liefern sie eine Kapazitätsreservierung. Das EC2-User-Guide-Kapitel zu den Kontingenten wiederholt es und zieht die praktische Folge daraus: Mit zonalen Reserved Instances darfst du dein On-Demand-Limit überschreiten.

Ein Savings Plan kann das nie — egal welcher Typ, egal welche Laufzeit.

### Der graue Block — Realitätsstand seit Dezember 2025

Am 2. Dezember 2025 hat AWS Database Savings Plans angekündigt: bis zu 35 % Ersparnis für eine einjährige Bindung ohne Vorauszahlung, verfügbar in allen Regionen außer China. Zum Start abgedeckt waren Aurora, RDS, DynamoDB, ElastiCache, DocumentDB, Neptune, Keyspaces, Timestream und DMS.

Der Rabatt greift laut Dokumentation auf die jeweils **neuesten** provisionierten Instanzgenerationen — unabhängig von Engine, Familie, Größe, Availability Zone und Region — und zusätzlich auf serverlose Nutzung. Das AWS-Beispiel dafür: von Aurora db.r7g auf db.r8g wechseln, eine Workload von Irland nach London schieben, von RDS for Oracle auf Aurora PostgreSQL modernisieren oder von RDS zu DynamoDB umziehen, ohne den Rabatt zu verlieren.

Für die Prüfung ändert das vorerst nichts: Der SAA-C03-Fragenpool bildet den Stand von Dezember 2025 mit hoher Wahrscheinlichkeit noch nicht ab. Wer eine Frage nach der günstigsten Option für RDS sieht, antwortet mit Reserved Instances. Der graue Block steht auf der Karte, damit dich die Realität später nicht überrascht — nicht, damit du ihn in der Prüfung anwendest.

### ✗ Verworfen — Standard RI auf m5, während die Graviton-Migration terminiert ist

Die Standard Reserved Instance ist an Instanzklasse, Region und bei zonalem Scope an die Availability Zone gebunden. Nach dem Wechsel auf m7g passt sie auf nichts mehr — und läuft trotzdem bis zum Laufzeitende weiter.

Der Ausweg, den man dann sucht, existiert nur eingeschränkt: Convertible Reserved Instances lassen sich gegen andere Convertible RIs gleichen oder höheren Werts tauschen, kosten aber Rabatttiefe (bis 66 % statt 72 %) und verlangen einen aktiven Tauschvorgang. Savings Plans dagegen greifen automatisch.

## Die entscheidende Unterscheidung

Die drei Optionen, die sich im Szenario tatsächlich ähneln, unterscheiden sich in genau drei Zeilen:

| | Compute Savings Plan | EC2 Instance Savings Plan | Standard Reserved Instance |
|---|---|---|---|
| Rabatt | bis 66 % | bis 72 % | bis 72 % |
| Bindung an | Betrag pro Stunde | Betrag pro Stunde + Familie + Region | Instanztyp, Plattform, Region, ggf. AZ |
| Familienwechsel | ja, ohne Verlust | nein | nein (Convertible: Tausch, bis 66 %) |
| Region wechseln | ja | nein | nein |
| Deckt Fargate und Lambda | ja | nein | nein |
| Kapazitätsreservierung | nie | nie | **nur zonal** |
| Laufzeit | 1 oder 3 Jahre | 1 oder 3 Jahre | 1 oder 3 Jahre |

Die letzte inhaltliche Zeile ist die Prüfungszeile. Rabatt bekommst du von allen dreien. Kapazität nur von einer — und auch dort nur, wenn `Scope` auf die Availability Zone zeigt.

## Die ehrliche Feinheit

**Erstens: Die AWS-Dokumentation widerspricht sich bei der Zahl der Savings-Plans-Typen.** Die Seite „Savings Plans types" im User Guide nennt **vier** Typen — Compute, Database, EC2 Instance und SageMaker AI —, und die Savings-Plans-FAQ nennt ebenfalls vier. Die Seite „Services eligible for Savings Plans benefits" im selben User Guide nennt weiterhin **drei** und lässt Database aus. Nach der Quellen-Rangfolge gewinnt hier die spezifischere, offensichtlich gepflegte Seite, gestützt durch die FAQ und die Ankündigung vom 2. Dezember 2025. Aber merk dir: Wenn eine Prüfungsfrage nach der Anzahl fragt, fragt sie nach etwas, das AWS selbst nicht einheitlich schreibt.

**Zweitens: Die Diensteliste des Database Savings Plan ist bereits gewachsen.** Die Ankündigung nennt neun Dienste. Die aktuelle User-Guide-Seite führt zusätzlich **Amazon OpenSearch Service**. Die Karte bildet den Stand der Ankündigung ab und ist damit unvollständig, nicht falsch. Redshift fehlt in beiden Listen — Redshift hat sein eigenes Reservierungsmodell.

**Drittens: „bis X %" sind Obergrenzen, keine Erwartungswerte.** Die Höchstwerte gelten typischerweise für dreijährige Bindung mit vollständiger Vorauszahlung. Bei Reserved Instances gibt es drei Zahlungsoptionen — All Upfront, Partial Upfront, No Upfront —, und der Unterschied zwischen ihnen ist real. Die tatsächlichen Rabattsätze hängen zudem von Region und Instanztyp ab. Wer eine konkrete Zahl braucht, holt sie aus dem Pricing Calculator, nicht aus einer Karte.

**Viertens: Regionale und zonale Reserved Instances tauschen zwei Eigenschaften gegeneinander.** Die regionale Variante bietet Flexibilität über Availability Zones und Instanzgrößen — letztere nur bei Linux/Unix mit Default-Tenancy — aber keine Kapazitätsreservierung. Die zonale Variante bietet die Reservierung, dafür keine Größenflexibilität. Und sie reserviert nur für das besitzende Konto: Wer Kapazität über Konten hinweg teilen will, braucht eine On-Demand Capacity Reservation.

**Fünftens: Ein paar Posten bleiben immer unrabattiert.** Dedicated Instances kosten je Region, in der mindestens eine läuft, 2 USD pro Stunde Grundgebühr — auf diese Gebühr wirkt kein Savings Plan. Und bei EKS decken Compute- und EC2-Instance-Pläne zwar die zugrunde liegenden EC2-Instanzen ab, nicht aber die EKS-Gebühren selbst.

## Syntax lesen — die Bindung in Dollar pro Stunde

So wird eine Zusage von 7,20 USD pro Stunde tatsächlich abgerechnet:

```
Stunde 03:00   Verbrauch 5,10 $  ──►  5,10 rabattiert · 2,10 verfallen
Stunde 11:00   Verbrauch 7,20 $  ──►  7,20 rabattiert · 0,00 verfallen   ← Ziel
Stunde 20:00   Verbrauch 9,80 $  ──►  7,20 rabattiert · 2,60 zu On-Demand
                                          ▲                    ▲
                             bis hierher gilt die Bindung   darüber voller Preis
```

Drei Dinge liest du daraus ab. **Unterverbrauch verfällt stündlich** — nicht am Monatsende, nicht am Jahresende; jede Stunde wird einzeln abgerechnet. **Überverbrauch ist nicht schlimm**, er kostet nur den vollen Preis. Und deshalb ist die Höhe der Zusage die eigentliche Entscheidung: Sie gehört auf die verlässliche Grundlast, nicht auf den Spitzenwert.

Genau darum steht in der ersten Zeile der Karte „Konstante Grundlast" und nicht „durchschnittliche Last".

## Was du dadurch nicht baust

- keine Kapazitätsgarantie — außer über zonale RI oder On-Demand Capacity Reservation
- keine Kündigungsmöglichkeit; die Bedingungen sind nach dem Kauf unveränderlich
- keinen Rabatt auf S3, CloudFront, Datentransfer oder EKS-Gebühren
- keine Absicherung gegen Spot-Unterbrechungen jenseits von zwei Minuten
- keine Rückerstattung für ungenutzte Stunden — Unterverbrauch verfällt stündlich
- keine Rechtsdimensionierung: Ein Savings Plan macht eine zu große Instanz billiger, nicht kleiner

## Wenn du dir eine Sache merkst

**Savings Plans und Reserved Instances kaufen Rabatt gegen Bindung — ein Kapazitätsversprechen ist beides nicht. Kapazität reserviert nur die zonale Reserved Instance oder eine On-Demand Capacity Reservation.**

Der EC2 Instance Savings Plan fällt im Szenario, weil er die Familie m5 bindet, die in einem Quartal verschwindet. Die Standard RI fällt aus demselben Grund und zusätzlich, weil sie Fargate und Lambda nicht kennt. On-Demand Capacity Reservations fallen, weil das Szenario nach Kostensenkung fragt und nicht nach Kapazitätssicherheit — sie kosten unabhängig von der Nutzung.

## Prüfungsknackpunkte

**Signalwörter:** „most cost-effective purchasing option" plus eine beschriebene Last ist immer eine Zuordnungsfrage. „flexibility to change instance family" schließt EC2 Instance SP und Standard RI aus. „interruption-tolerant" oder „fault-tolerant batch" ist Spot. Und **„capacity reservation"** ist das schärfste Signal überhaupt: Sobald es fällt, sind alle Savings Plans falsch.

**Die Kapazitätsfalle.** Häufigste Falle des Themas. Enthält die Frage „muss die Kapazität in dieser AZ sicher verfügbar sein", lautet die Antwort zonale RI oder On-Demand Capacity Reservation.

**Die Umbaufalle.** Erst rechtsdimensionieren und migrieren, dann binden. Eine Verpflichtung auf einen Verbrauch, den es in sechs Monaten nicht mehr gibt, ist gestrandetes Geld.

**Fargate und Lambda nicht vergessen.** Der Compute Savings Plan deckt beide mit ab. Wer nur EC2 optimiert, lässt bei containerisierten und serverlosen Lasten Rabatt liegen — im Szenario ist genau das der Unterschied zwischen 66 % auf einen Teil und 66 % auf die ganze Grundlast.

**A — Standard RI auf m5, drei Jahre, All Upfront:** maximaler Rabatt auf eine Instanzfamilie, die laut Szenario im nächsten Quartal verlassen wird; die Bindung überlebt die Migration nicht, die Zahlung schon.

**B — EC2 Instance Savings Plan auf m5:** sechs Prozentpunkte mehr als Compute, aber an Familie und Region gebunden; deckt weder Fargate noch Lambda und blockiert genau die Migration, die nicht blockiert werden soll.

**D — On-Demand Capacity Reservations für die Grundlast:** sichern Kapazität in einer Availability Zone und werden unabhängig von der Nutzung berechnet; sie lösen ein Verfügbarkeitsproblem, das das Szenario nicht hat, und senken die Kosten nicht.
