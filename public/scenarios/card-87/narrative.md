---
cardNumber: 87
slug: compute-optimizer-rightsizing
title: "Compute Optimizer, Rightsizing"
services: ["AWS Compute Optimizer", "Amazon CloudWatch", "Amazon EC2", "AWS Cost Explorer", "AWS Savings Plans", "AWS Graviton"]
domains: ["D4", "D3"]
correctAnswer: "B"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/compute-optimizer/latest/ug/requirements.html"
  - "https://docs.aws.amazon.com/compute-optimizer/latest/ug/metrics.html"
  - "https://docs.aws.amazon.com/compute-optimizer/latest/ug/ec2-metrics-analyzed.html"
  - "https://docs.aws.amazon.com/compute-optimizer/latest/ug/enhanced-infrastructure-metrics.html"
  - "https://aws.amazon.com/about-aws/whats-new/2021/11/aws-compute-optimizer-enhanced-infrastructure-metrics-ec2-instances/"
  - "https://aws.amazon.com/about-aws/whats-new/2023/03/aws-compute-optimizer-ec2-instances-non-consecutive-utilization-data/"
  - "https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html"
  - "https://aws.amazon.com/savingsplans/compute-pricing/"
  - "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-enable.html"
---

## Die Grundidee zuerst

Stell dir vor, du mietest eine Lagerhalle. Der Vermieter bietet dir kräftigen Rabatt, wenn du dich für drei Jahre festlegst.

**Weg eins:** Du misst, wie viel Platz dein Zeug heute einnimmt. 400 Quadratmeter. Du unterschreibst über 400 Quadratmeter, drei Jahre, mit Rabatt, und freust dich über den Preis pro Quadratmeter.

**Weg zwei:** Du gehst erst einmal durch die Halle. Dabei stellst du fest: Zwölf der Regale sind leer, in dreißig Kartons ist Verpackungsmaterial von Geräten, die es nicht mehr gibt, und die Hälfte der Fläche steht nur voll, weil beim Einzug niemand Zeit zum Sortieren hatte. Nach zwei Tagen Aufräumen brauchst du 90 Quadratmeter. *Dann* unterschreibst du.

Beide bekommen denselben Rabattsatz. Weg eins zahlt ihn auf 400 Quadratmeter, Weg zwei auf 90. Der Rabatt war nie das Problem — die Grundfläche war es.

Und der bittere Teil: Weg eins *fühlt* sich richtiger an. Er handelt sofort, er sichert einen Preisvorteil, und er hat eine Zahl, die man in einer Präsentation zeigen kann. Weg zwei besteht aus zwei Tagen Aufräumen ohne sichtbares Ergebnis. Deshalb ist die falsche Reihenfolge nicht die Ausnahme, sondern der Normalfall.

Genau das ist die Karte. Die Flotte aus 40 `m5.4xlarge` läuft seit einem Jahr bei durchschnittlich 8 Prozent CPU-Last. Ein Savings Plan darauf ist der Dreijahresvertrag über 400 Quadratmeter.

**Rightsizing kommt vor Commitment.** Nicht weil es eleganter ist, sondern weil die Reihenfolge in eine Richtung funktioniert und in der anderen nicht: Nach dem Verkleinern kannst du immer noch binden. Nach dem Binden kannst du drei Jahre lang nicht mehr verkleinern, ohne den Rabatt zu verlieren, für den du bezahlt hast.

## Was es eigentlich ist — eine Datenbasis, kein Messgerät

AWS Compute Optimizer misst nichts. Es liest CloudWatch. Das klingt nach einem Detail und ist die halbe Karte, denn es bedeutet: Was nicht in CloudWatch steht, existiert für Compute Optimizer nicht.

Und `MemoryUtilization` steht bei EC2 standardmäßig **nicht** in CloudWatch. Der Hypervisor sieht, wie viel CPU eine Instanz zieht und wie viele Pakete über ihre Interfaces gehen. Was innerhalb des Gastbetriebssystems im Arbeitsspeicher liegt, sieht er nicht. Dafür braucht es einen Agenten *in* der Instanz. Das zentrale Objekt dieser Karte ist deshalb nicht die Empfehlung — es ist die Konfigurationsdatei, die die Empfehlung überhaupt erst belastbar macht:

```json
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "CWAgent",
    "append_dimensions": {
      "InstanceId": "${aws:InstanceId}"
    },
    "metrics_collected": {
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
```

Vier Zeilen tragen das Ergebnis. `namespace` muss `CWAgent` heißen, `measurement` muss `mem_used_percent` liefern, und `append_dimensions` muss die `InstanceId` mitschicken. Fehlt die Dimension oder wird sie durch einen eigenen Namen überschrieben, kann Compute Optimizer die Speicherdaten der Instanz nicht zuordnen — die Metrik liegt dann in CloudWatch und wird trotzdem nicht ausgewertet.

AWS schreibt dazu einen Satz, der in der Praxis Stunden kostet: **Namespaces und Metriknamen sind case sensitive.** `cwagent` ist nicht `CWAgent`.

Auf Windows heißt die Metrik nicht `mem_used_percent`, sondern `Available MBytes`. Wer beides konfiguriert hat, bekommt `Available MBytes` als primäre Speichermetrik.

## Der Weg durch die Karte

### Kasten — CloudWatch-Metriken

Die blaue Quelle ganz links. Drei Bedingungen stehen darin, und alle drei sind Ausschlusskriterien.

**Mindestens 30 Stunden Metrikdaten aus den letzten 14 Tagen.** Das gilt für EC2-Instanzen und Auto Scaling Groups gleichermaßen. Seit März 2023 müssen diese 30 Stunden bei EC2-Instanzen nicht mehr zusammenhängend sein — eine Instanz, die nur werktags von 8 bis 18 Uhr läuft, bekommt also Empfehlungen. Bei Auto Scaling Groups und EBS-Volumes verlangt AWS weiterhin 30 *aufeinanderfolgende* Stunden.

**Memory nur mit CloudWatch-Agent.** Siehe oben. Alternativ akzeptiert Compute Optimizer Speicherdaten aus genau vier externen Produkten: Datadog, Dynatrace, Instana und New Relic.

Beachte, was in dieser Bedingung *nicht* steht: Detailed Monitoring wird nicht verlangt. Compute Optimizer kommt mit den Standardmetriken im Fünf-Minuten-Takt aus. Wer glaubt, für Rightsizing erst überall die kostenpflichtige Ein-Minuten-Auflösung einschalten zu müssen, kauft eine Voraussetzung, die es nicht gibt.

**Cost Explorer muss aktiviert sein.** Ohne diese Freischaltung kann Compute Optimizer keine Preisinformationen und keine Sparbeträge ausweisen — du bekommst dann eine technische Empfehlung ohne Eurobetrag daneben. AWS empfiehlt zusätzlich das Opt-in für den Cost Optimization Hub, damit bestehende Reserved Instances und Savings Plans in die Rechnung einfließen und die Empfehlung nicht gegen den On-Demand-Preis rechnet, den du längst nicht mehr zahlst.

### Badge 1 — Compute Optimizer klassifiziert

Der Dienst muss aktiviert werden, er läuft nicht von selbst. Nach dem Opt-in dauert die Analyse **bis zu 24 Stunden**, danach steht je Ressource ein Befund: `Over-provisioned`, `Under-provisioned` oder `Optimized`.

Für Flotten mit Monats- oder Quartalsmustern gibt es Enhanced Infrastructure Metrics — ein kostenpflichtiges Feature, das den Rückblick von 14 Tagen auf bis zu 93 Tage verlängert. Preis laut AWS: 0,0003360215 US-Dollar pro Ressource und Stunde. Für eine durchlaufende Instanz sind das gut 25 Cent im Monat. Bei 40 Instanzen also rund 10 Dollar, um eine Fehlentscheidung über einen Dreijahresvertrag zu vermeiden.

Das Bild dazu: Der Standardrückblick ist ein Foto aus zwei Wochen. Enhanced Infrastructure Metrics ist ein Foto aus einem Quartal. Wer am Monatsende einen schweren Abrechnungslauf fährt, ist auf dem ersten Foto nicht drauf.

Das Feature lässt sich auf drei Ebenen einschalten — für die gesamte Organisation, für ein Konto oder für einzelne Ressourcen. Für unser Szenario ist die dritte Ebene die vernünftige: Man aktiviert es auf den 40 Kandidaten, nicht auf allem, was im Konto läuft.

Wichtig für das Verständnis des Befunds selbst: `Over-provisioned` heißt nicht „zu teuer", sondern „mindestens eine Dimension lässt sich verkleinern, ohne dass die Last darunter leidet". Und `Optimized` heißt nicht „günstig", sondern „passt". Eine Instanz kann optimiert und trotzdem der größte Posten auf der Rechnung sein — dann ist Rightsizing der falsche Hebel und der nächste Schritt gehört auf eine andere Karte.

### Badge 2 — die Instanz wird verkleinert

Zwei Wege, dieselbe Wirkung: ein kleinerer Typ derselben Familie, oder ein Wechsel auf Graviton. Für die Karte zählt nur das Ergebnis.

**Die Baseline sinkt dauerhaft.** Das ist die Zahl, auf die im nächsten Schritt der Vertrag gebaut wird — und es ist der Grund, warum dieser Kasten vor dem nächsten steht und nicht danach.

Der Graviton-Weg hat einen Haken, den die Karte verschweigt: Das ist ein Architekturwechsel von x86 auf ARM. Container-Images müssen neu gebaut werden, kompilierte Abhängigkeiten ebenso. Bei einer JVM-Anwendung ist das oft ein Nachmittag, bei einer Anwendung mit nativen Bibliotheken kann es ein Projekt sein.

### Badge 3 — erst jetzt wird gebunden

Der Savings Plan läuft auf die neue, kleinere Baseline. Ein oder drei Jahre, verpflichtend als Betrag pro Stunde — nicht als Instanzenzahl. AWS definiert dabei ein Jahr als 365 Tage und drei Jahre als 1.095 Tage.

Der Rabatt greift jetzt auf Kapazität, die tatsächlich gebraucht wird. Alles, was über die Verpflichtung hinausgeht, wird weiterhin zu On-Demand-Preisen abgerechnet — nach unten gibt es dagegen keine Rückerstattung: Nicht ausgeschöpfte Verpflichtung verfällt Stunde für Stunde.

Diese Asymmetrie ist der eigentliche Grund für die Reihenfolge der Karte. Ein zu klein gewähltes Commitment kostet dich nur den entgangenen Rabatt auf den Überhang — ärgerlich, aber ein Rundungsfehler. Ein zu groß gewähltes Commitment kostet dich den vollen Betrag für Kapazität, die es nicht gibt. Die Entscheidung ist also nicht symmetrisch riskant, und das spricht dafür, die Baseline erst zu senken und dann eher vorsichtig zu binden.

Der Compute Savings Plan gilt dabei über Instanzfamilien, Größen, Betriebssysteme, Tenancy und Regionen hinweg und zusätzlich für Fargate und Lambda. Er überlebt also den Wechsel von `m5` auf `m7g`, den Badge 2 gerade gemacht hat — der EC2 Instance Savings Plan mit dem höheren Rabatt tut das nicht, weil er auf eine Familie in einer Region festgelegt ist.

### Der rote Bypass — Savings Plan auf die Ist-Flotte

Der verworfene Pfad zweigt direkt von den Metriken ab und überspringt beides: Klassifikation und Verkleinerung.

Was danach passiert, ist arithmetisch simpel und schmerzhaft: Der Rabatt gilt für 40 zu große Instanzen. Die Rightsizing-Ersparnis ist für die Laufzeit des Vertrags nicht mehr abrufbar — verkleinerst du später doch, sinkt deine Nutzung unter die Verpflichtung, und du zahlst die Differenz für nichts.

Rechne den Fall einmal grob durch, ohne konkrete Listenpreise: Angenommen, die Flotte kostet On-Demand den Faktor 1, und Rightsizing halbiert sie auf 0,5. Ein Savings Plan mit 40 Prozent Rabatt auf die Ist-Flotte landet bei 0,6. Derselbe Plan auf die verkleinerte Flotte landet bei 0,3. Die falsche Reihenfolge kostet also nicht ein bisschen Rabatt, sondern verdoppelt das Ergebnis — und zwar für ein bis drei Jahre.

Das ist der Grund, warum der rote Pfad auf dieser Karte kein Konstruktionsfehler ist, sondern der häufigste reale Ablauf: Der Rabatt ist sichtbar, verhandelbar und steht in einer Präsentation gut da. Die Überdimensionierung ist unsichtbar, technisch und steht nirgends.

Der Kasten bleibt golden, nicht rot. Ein Savings Plan ist auch dann eine Governance-Entscheidung, wenn es die falsche ist.

## Die entscheidende Unterscheidung

Drei Hebel, die im Examen ständig verwechselt werden, weil alle drei „Kosten senken" auf der Verpackung stehen haben:

| | Auto Scaling | Rightsizing | Savings Plan |
|---|---|---|---|
| Stellschraube | Anzahl der Instanzen | Größe der Instanz | Preis pro Stunde |
| Wirkt auf | Lastspitzen und Täler | dauerhafte Überdimensionierung | Grundlast |
| Reaktionszeit | Minuten | einmalig, mit Neustart | 1 oder 3 Jahre bindend |
| Umkehrbar | jederzeit | jederzeit | nein |
| Werkzeug | ASG-Policies | Compute Optimizer | Cost Explorer, Purchase Analyzer |

Die Zeile „Umkehrbar" ist die Antwort auf die Frage, warum die Reihenfolge auf der Karte nicht verhandelbar ist. Man legt sich zuletzt auf das fest, was man nicht zurücknehmen kann.

## Die ehrliche Feinheit

**Die 72 Prozent gehören nicht dem Plan, den die meisten kaufen.** AWS nennt „bis zu 72 Prozent" für Savings Plans — dieser Bestwert gilt für EC2 Instance Savings Plans, die auf eine Instanzfamilie in einer Region festgelegt sind. Der flexible Compute Savings Plan, der über Familien, Regionen, Fargate und Lambda hinweg gilt, kommt laut AWS auf bis zu 66 Prozent. Das Finance-Team im Szenario rechnet also mit einer Zahl, die zu einem strengeren Vertrag gehört, als es haben will.

**Compute Optimizer sieht nur Maxima im Fünf-Minuten-Raster.** AWS wertet für EC2, ASGs, EBS, Lambda und Software-Lizenzen den höchsten Auslastungspunkt je Fünf-Minuten-Intervall aus. Eine Anwendung, die alle drei Minuten für zwei Sekunden auf 100 Prozent geht, erscheint darin als dauerhaft ausgelastet. Umgekehrt verschwindet nichts: Ein kurzer Spike wird eher überbetont als übersehen. Wer eine Empfehlung „over-provisioned" bekommt, kann sich darauf verlassen — wer keine bekommt, nicht automatisch auf das Gegenteil.

**Ohne Memory-Metrik ist die Empfehlung eine CPU-Empfehlung.** Das ist kein Fehler des Dienstes, sondern eine ehrliche Konsequenz seiner Datenlage. Eine speicherhungrige JVM auf einer Instanz, die rechnerisch passt, fängt danach an zu swappen — und der Performance-Einbruch wird dann dem „Rightsizing" angelastet statt der fehlenden Metrik.

**Und der Dienst kann mehr, als die Karte zeigt.** Compute Optimizer bewertet auch EBS-Volumes, Lambda-Funktionen, ECS-Services auf Fargate, RDS- und Aurora-Instanzen sowie SQL-Server-Lizenzen. Zwei Bedingungen daraus lohnen sich zu merken, weil sie überraschen: Lambda-Empfehlungen entstehen nur für Funktionen mit höchstens 1.792 MB konfiguriertem Speicher und mindestens 50 Aufrufen in 14 Tagen. Und für „over-provisioned"-Befunde bei RDS muss Performance Insights aktiviert sein.

## Syntax lesen — „30 Stunden aus 14 Tagen"

Diese Bedingung wird fast immer als Wartezeit gelesen. Sie ist eine Abdeckungsangabe:

```
14 Tage  = 336 Stunden Beobachtungsfenster
             │
             ├─ mindestens 30 Stunden davon mit Metrikdaten
             │   (seit 03/2023 bei EC2 nicht mehr zusammenhängend)
             │
             └─ 30 / 336  ≈  9 % Abdeckung reichen für eine Empfehlung

mit Enhanced Infrastructure Metrics:
93 Tage  = 2.232 Stunden Fenster, weiterhin 30 Stunden Minimum
```

Zwei Konsequenzen, die man daraus ablesen kann. Erstens: Die Hürde ist niedrig. Eine Instanz, die im Fenster nur an zwei Arbeitstagen lief, bekommt bereits eine Empfehlung — auf Basis von zwei Arbeitstagen. Zweitens: Enhanced Infrastructure Metrics senkt die Hürde nicht, es vergrößert das Fenster. Die 30 Stunden bleiben, aber sie dürfen aus einem Quartal stammen, und die Bewertung sieht dabei auch den Monatsabschluss.

Die zweite Zeile ist deshalb im Szenario die wichtigere: Eine Flotte mit 8 Prozent CPU-Schnitt und einem harten Lastfenster am Monatsletzten wird ohne das Feature systematisch zu klein empfohlen.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** passiert:

- keine automatische Änderung — Compute Optimizer empfiehlt, es ändert nichts
- keine Kündigung eines laufenden Savings Plans; Verpflichtungen laufen aus, sie enden nicht
- keine Aussage über Speicher, solange kein Agent installiert ist
- kein Ersatz für Auto Scaling: Die Größe wird angepasst, nicht die Anzahl
- kein Blick auf Anomalien; stabil zu hohe Kosten sind für die Anomalieerkennung normal
- kein Eurobetrag neben der Empfehlung ohne aktivierten Cost Explorer

## Wenn du dir eine Sache merkst

**Erst rightsizen, dann binden — der Rabatt gilt für die Größe, die du beim Unterschreiben hast, drei Jahre lang.**

Auto Scaling ändert die Anzahl und löst Überdimensionierung nicht. Spot senkt den Preis, aber nicht die Größe. Reserved Instances zementieren dieselbe Flotte wie ein voreiliger Savings Plan. Und Cost Anomaly Detection findet Overprovisioning nie, weil daran nichts anomal ist.

## Prüfungsknackpunkte

**Signalwörter:** „instances are over-provisioned", „right-size the fleet", „reduce cost without impacting performance" und vor allem „before committing to a Savings Plan". Sobald in einer Frage Metriken und ein Commitment gleichzeitig vorkommen, wird die Reihenfolge geprüft.

**Die Reihenfolgefalle.** Die Antwortoption, die zuerst den Rabatt sichert und danach optimieren will, ist in dieser Aufgabenfamilie immer falsch.

**Die Memory-Falle.** Wird im Szenario eine speicherintensive Anwendung erwähnt und kein CloudWatch-Agent, ist „Agent installieren" Teil der richtigen Antwort.

**Die Zeitfalle.** 14 Tage Standard-Lookback gegen 93 Tage mit Enhanced Infrastructure Metrics. Steht „monthly batch" oder „quarter-end" im Text, ist das die gesuchte Unterscheidung.

**A — sofort einen Dreijahres-Savings-Plan auf die Ist-Flotte:** Bindet 40 zu große Instanzen. Genau der rote Pfad der Karte.

**C — die Auto Scaling Group verkleinern:** Ändert die Anzahl, nicht die Größe. Bei 8 Prozent Last auf jeder einzelnen Instanz bleibt jede einzelne zu groß.

**D — auf Spot umstellen:** Senkt den Preis derselben überdimensionierten Kapazität und bringt Unterbrechbarkeit als neues Problem mit. Für eine dauerhaft laufende Flotte keine Antwort auf die gestellte Frage.

**E — Reserved Instances kaufen:** Dasselbe Problem wie A, mit weniger Flexibilität. RIs binden zusätzlich an Instanztyp und Region.
