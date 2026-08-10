---
cardNumber: 6
slug: eks-karpenter-spot-nodepools
title: "Battle Card 6 — EKS · Karpenter · Spot"
services: ["Amazon EKS", "Karpenter", "EC2 Spot", "EC2 On-Demand", "Amazon EventBridge", "Amazon SQS", "Cluster Autoscaler"]
domains: ["D4", "D3"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://aws.amazon.com/blogs/containers/announcing-karpenter-1-0"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/rebalance-recommendations.html"
  - "https://docs.aws.amazon.com/eks/latest/userguide/fargate.html"
  - "https://karpenter.sh/docs/concepts/disruption/"
  - "https://aws.github.io/aws-eks-best-practices/karpenter/"
---

## Die Grundidee zuerst

Stell dir eine Umzugsfirma vor, die zwei Wege kennt, an Fahrzeuge zu kommen.

**Weg eins:** Die Firma hat drei Fahrzeugtypen fest im Hof stehen — Kleintransporter, 7,5-Tonner, Sattelzug. Kommt ein Auftrag, wählst du aus diesen dreien. Ein Sofa und vier Kartons? Der Kleintransporter ist schon unterwegs, also nimmst du den Sattelzug. Er fährt zu einem Fünftel beladen los. Das fällt niemandem auf, weil es immer so war.

**Weg zwei:** Es steht nichts im Hof. Du siehst dir erst an, was transportiert werden muss — Maße, Gewicht, Zerbrechlichkeit —, und rufst dann genau das passende Fahrzeug. Aus einem Angebot von Hunderten. Und wenn abends drei halb leere Wagen unterwegs sind, packt jemand um und schickt zwei davon nach Hause.

Weg eins ist der **Cluster Autoscaler**: Er skaliert vordefinierte Node Groups, und die Instanztypen darin stehen vorher fest. Weg zwei ist **Karpenter**: Er liest die tatsächlichen Anforderungen der wartenden Pods und startet passgenaue EC2-Instanzen — ohne Gruppen dazwischen.

Der Satz, der die ganze Karte trägt: **Nicht die Gruppe wächst, sondern die Instanz entsteht.**

## Was es eigentlich ist — der NodePool

Karpenter ist ein Controller, der im Cluster läuft, und seine Konfiguration ist eine Kubernetes-Ressource. Genau zwei NodePools lösen das Szenario dieser Karte. Der interessantere ist der für Spot:

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: spot-stateless
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot"]
        - key: karpenter.k8s.aws/instance-category
          operator: In
          values: ["c", "m", "r"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      taints:
        - key: workload
          value: batch
          effect: NoSchedule
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m
  limits:
    cpu: "2000"
```

Lies das von oben nach unten, es ist die halbe Karte:

`requirements` sind **keine Instanztypliste**, sondern ein Suchraum. „capacity-type: spot" und „Kategorien c, m, r" lassen Karpenter Dutzende Typen als zulässig gelten — er wählt daraus den günstigsten, der passt. Je weiter du diesen Raum aufmachst, desto besser die Spot-Verfügbarkeit.

`nodeClassRef` zeigt auf die EC2NodeClass — dort stehen AMI, IAM-Rolle, Subnetze und Security Groups. Der NodePool sagt *was für eine Art Node*, die NodeClass sagt *wie sie in AWS aussieht*.

`taints` ist der Zaun. Der Spot-Pool ist mit `workload=batch:NoSchedule` markiert, und nur Pods mit passender Toleration landen darauf. **Das ist die eigentliche Trennung zwischen kritisch und unkritisch** — nicht der Wunsch, sondern eine Regel, die der Scheduler durchsetzt.

`disruption` ist die Consolidation, die auf der Karte fehlt. Dazu unten mehr.

`limits` ist die Reißleine: eine Obergrenze in CPU-Kernen für alles, was dieser Pool starten darf. Ohne sie hat ein fehlerhafter Deployment-Loop kein Ende.

Der zweite NodePool ist derselbe Block mit `values: ["on-demand"]` und ohne Taint. Zwei Dateien, ein Kostenmodell.

## Der Weg durch die Karte

### Badge 1 — Developer deployt

`kubectl apply`, ein Deployment mit dreißig Replicas. Der Developer hat keinen Autoscaler angesprochen und weiß nicht, wie viele Nodes existieren. Er beschreibt nur, was laufen soll.

### Kasten — EKS Control Plane und der kube-scheduler

Der kube-scheduler versucht, jeden Pod auf einen Node zu legen. Er prüft freie CPU und freien Speicher, Taints und Tolerations, Node-Affinity, Topology Spread. Findet er nichts, tut er das Ehrlichste, was ein Scheduler tun kann: **nichts**.

Der Pod bekommt den Zustand `Unschedulable` und bleibt `Pending`. Er wartet nicht auf eine Warteschlange und löst keinen Alarm aus. Er steht einfach da.

### Badge 2 — Pending ist das Signal

**Hier liegt das gedankliche Zentrum der ganzen Karte:** Node-Autoscaling wird nicht durch CPU-Auslastung ausgelöst, sondern durch Pods, die nirgends hinpassen.

Das Bild dazu: Ein Restaurant kauft keine Stühle, weil die vorhandenen warm sind, sondern weil Leute an der Tür stehen.

Karpenter beobachtet die Kubernetes-API und sieht diese wartenden Pods. Und jetzt kommt der Unterschied zum Cluster Autoscaler: Er sieht nicht nur *dass* sie warten, sondern **was sie verlangen** — jeden Resource Request, jede Toleration, jede Affinity-Regel.

### Kasten — Karpenter wählt die Instanz

Aus den Anforderungen der wartenden Pods rechnet Karpenter eine Instanz aus, die sie gemeinsam trägt, und ruft direkt die EC2-API auf. Kein Auto Scaling Group, kein `desiredCapacity`, das jemand hochzählt.

Der Cluster Autoscaler kann das strukturell nicht: Er darf nur den Zähler einer bestehenden ASG erhöhen, und welcher Instanztyp dabei entsteht, hat jemand vor Wochen festgelegt.

### Badge 3 — Provision On-Demand für die kritischen Pods

Die API- und stateful Pods tragen keine Toleration für den Spot-Taint. Also bleibt nur der On-Demand-NodePool, und Karpenter startet dort. **Stabilität vor Preis**, und zwar erzwungen durch den Zaun, nicht durch Disziplin.

### Badge 4 — Provision Spot für die unkritischen Pods

Die Transcoding- und Batch-Pods tolerieren `workload=batch` und landen auf Spot-Nodes. Reicht die Spot-Kapazität für den gewählten Typ nicht, weicht Karpenter innerhalb des Suchraums aus — und wenn im ganzen Raum nichts frei ist, auf On-Demand.

Das ist der Grund für die weit gefassten `requirements` oben. **Ein Spot-Pool, der nur zwei Instanztypen zulässt, ist kein Spot-Pool, sondern eine Wette.**

### Badge 5 — Die Unterbrechung: EC2 kündigt an, EventBridge fängt

Spot-Kapazität ist geliehen. Braucht EC2 sie zurück, sendet es zwei Minuten vorher eine **Spot Instance Interruption Notice**. Diese Nachricht ist ein EventBridge-Event; auf der Karte ist es der lila Pfeil von der Spot-Node zur EventBridge Rule.

Die Rule schreibt das Event in eine SQS-Queue. Warum der Umweg über eine Queue statt einer direkten Zustellung? Weil Events flüchtig sind und ein Controller, der gerade neu startet, sie sonst verpasst. **Die Queue macht aus einem Ruf eine Nachricht, die liegen bleibt, bis jemand sie liest.**

Der Pfeil zwischen EventBridge Rule und SQS-Queue trägt auf der Karte keine Nummer. Er gehört fachlich zu Badge 5 — es ist ein Vorgang in zwei Schritten, nicht zwei Vorgänge.

### Badge 6 — Karpenter liest die Queue, cordon und drain

Karpenter pollt die Queue. Findet er darin eine Unterbrechungsmeldung für eine seiner Nodes, tut er drei Dinge in dieser Reihenfolge: Er markiert die Node als nicht mehr beplanbar (**cordon**), er räumt die Pods herunter (**drain**, unter Beachtung der Pod Disruption Budgets), und er startet rechtzeitig Ersatzkapazität.

**Eine Anmerkung zur Karte:** Der Pfeil mit Badge 6 zeigt von der SQS-Queue zu Karpenter, das Label daneben sagt „cordon + drain, Ersatz-Node". Gezeichnet ist der Lesevorgang, beschriftet ist die Reaktion darauf — die in die Gegenrichtung läuft, nämlich von Karpenter zur betroffenen Node. Lies den Pfeil als „Karpenter holt die Meldung ab und handelt", nicht als „die Queue drainiert die Node".

### Der gestrichelte Kasten — Cluster Autoscaler mit dem roten X

Der Kasten unten links ist ein Anti-Muster im Bild: Er zeigt, was hier **nicht** verwendet wird und warum.

Das rote X bedeutet nicht „CAS ist schlecht". Es bedeutet: für diese Anforderungen — passgenaue Nodes, Spot-Kostenoptimierung, aktives Aufräumen — ist er das falsche Werkzeug, weil er nur vordefinierte Gruppen skalieren kann.

Auf der Karte steht dazu „langsamer 3–5 min". Für diese Zahl gibt es keine AWS-Primärquelle; sie stammt aus Praxisvergleichen. Die Aussage dahinter stimmt und reicht auch: **Karpenter ruft die EC2-API direkt auf, der Cluster Autoscaler geht über eine Auto Scaling Group — der Umweg kostet Zeit.** Merk dir die Richtung, nicht die Minuten.

## Die entscheidende Unterscheidung

| | Karpenter | Cluster Autoscaler |
|---|---|---|
| Auslöser | Pending Pods | Pending Pods |
| Entscheidungsgrundlage | Resource Requests des einzelnen Pods | Definition der Node Group |
| Startet | EC2-Instanz direkt über die API | erhöht `desiredCapacity` einer ASG |
| Instanztyp | wählt aus dem erlaubten Suchraum | steht in der Node Group fest |
| Spot | nativ, mit Fallback auf On-Demand | über Mixed Instances Policy der ASG |
| Aufräumen | Consolidation packt um und terminiert | Scale-down leerer Nodes |
| Betriebsmodell | gruppenlos | gruppenbasiert |

Und die Regel dazu: **Auf einem Cluster fährt man das eine oder das andere.** Zwei Autoscaler, die dieselben Nodes beanspruchen, treffen widersprüchliche Entscheidungen — einer skaliert hoch, der andere räumt ab.

## Die ehrliche Feinheit

**Erstens: Die halbe Ersparnis fehlt auf der Karte.** Consolidation steht nur im Footer-Merksatz, nicht als Pfeil — eine bewusste Vereinfachung, aber eine folgenreiche. Denn Karpenter spart nicht nur, indem er *richtig* startet, sondern indem er laufend *umpackt*: Sinkt die Auslastung, simuliert er, ob die Pods auf weniger oder kleineren Nodes Platz hätten, verschiebt sie und terminiert das Übriggebliebene. Das ist die Zeile `consolidationPolicy: WhenEmptyOrUnderutilized` im Block oben. Ohne sie hättest du einen Autoscaler, der wächst und nie schrumpft — und genau darin lag ja das Kostenproblem des Szenarios.

Zum Namen: In der v1-API heißt die Policy `WhenEmptyOrUnderutilized`; in älteren Beispielen im Netz findest du `WhenUnderutilized`. AWS hat sie im Zuge von Karpenter 1.0 umbenannt, die Funktion ist dieselbe. Wer eine v1beta1-Datei kopiert, bekommt einen Validierungsfehler.

**Zweitens: „entweder Karpenter oder CAS" ist eine Vereinfachung, und zwar eine, die eine schöne Pointe verdeckt.** Karpenter läuft selbst als Deployment *im* Cluster — und er darf nicht auf einer Node laufen, die er selbst verwaltet. Sonst könnte eine Consolidation den Controller mitten in der Entscheidung wegräumen, und danach ist niemand mehr da, der eine neue Node startet. Der EKS-Best-Practices-Guide sagt das ausdrücklich: nicht auf selbstverwalteten Nodes betreiben, sondern auf einer kleinen Managed Node Group mit mindestens einem Worker — **oder auf EKS Fargate**.

Damit ist der graue Kasten auf der Karte präziser zu lesen: Es gibt praktisch immer ein kleines Stück Kapazität, das *nicht* von Karpenter kommt. Nur skaliert es niemand mit, und deshalb steht kein zweiter Autoscaler daneben.

**Drittens: Die zwei Minuten sind eine Zusage mit Sternchen.** AWS schreibt, die Interruption Notice werde zwei Minuten vor Stopp oder Terminierung ausgeliefert — aber „on a best effort basis", und die Doku sagt offen, dass eine Instanz auch unterbrochen werden kann, bevor die Warnung ankommt. Wer Spot einsetzt, baut für den Fall, dass die Node ohne Vorwarnung verschwindet. Die Warnung ist ein Geschenk, keine Garantie.

**Viertens: Es gibt ein früheres Signal, das die Karte nicht zeigt — und das Karpenter nicht nutzt.** Die **Rebalance Recommendation** meldet, dass eine Spot-Instanz *erhöhtes Unterbrechungsrisiko* hat, und kann früher eintreffen als die Zwei-Minuten-Notice. EC2 Auto Scaling und EC2 Fleet können damit über Capacity Rebalancing proaktiv Ersatz starten. Karpenter reagiert darauf standardmäßig nicht; die Karpenter-Dokumentation verweist für diesen Fall auf den AWS Node Termination Handler und warnt zugleich, dass dieser mehr Node-Churn erzeugt. Und die Doku ist auch hier ehrlich: Das Signal kann gleichzeitig mit der Zwei-Minuten-Notice ankommen, statt davor.

**Fünftens, zum Interruption-Handling insgesamt:** Ohne konfigurierte Queue ist es **komplett aus**. Karpenter erfährt dann von der Unterbrechung erst, wenn die Node aus der Kubernetes-API verschwindet — also nachdem die Pods schon weg sind. Die SQS-Queue auf der Karte ist deshalb kein Detail für Fortgeschrittene, sondern Teil der Mindestausstattung.

## Syntax lesen — das EventBridge-Event-Pattern

Der Filter, der aus allen EC2-Ereignissen genau die Unterbrechungswarnungen herausschneidet:

```json
{
  "source": ["aws.ec2"],
  "detail-type": ["EC2 Spot Instance Interruption Warning"]
}
```

Zwei Felder, mehr braucht es nicht. `source` grenzt auf den Dienst ein, `detail-type` auf die Ereignisart.

Was hier auffällig **nicht** steht: eine Einschränkung auf deinen Cluster. EventBridge kann Spot-Warnungen nicht nach Tags filtern, deshalb bekommt die Queue sämtliche Spot-Unterbrechungen des Kontos in dieser Region. Karpenter verwirft, was ihn nicht betrifft.

Daneben das Label, das die Kapazitätsart wählt:

```
karpenter.sh/capacity-type: spot        # oder: on-demand
```

Als `requirement` im NodePool ist es eine Vorgabe. Als Label auf einer laufenden Node ist es eine Auskunft — damit kannst du per `kubectl get nodes -L karpenter.sh/capacity-type` in einer Zeile sehen, wie viel deines Clusters geliehen ist.

## Was du dadurch nicht baust

Zähl durch, was in diesem Szenario **nicht** existiert:

- keine Managed Node Group je Instanztyp und je Kapazitätsart
- keine Auto Scaling Group, deren Zähler jemand hochsetzt
- keine Mixed Instances Policy mit handgepflegter Typenliste
- kein zweiter Autoscaler neben Karpenter
- kein Skript, das leere Nodes sucht und abräumt
- kein Node Termination Handler für den Standardfall
- keine feste Nachtkapazität, die durchläuft, weil das Hochfahren zu lange dauert

Übrig bleiben: zwei NodePool-Dateien, eine EC2NodeClass, eine Queue und vier EventBridge-Regeln.

## Wenn du dir eine Sache merkst

**Karpenter provisioniert EC2-Instanzen direkt aus den Anforderungen wartender Pods — es gibt keine Node Groups mehr, in denen gedacht wird.**

Der Cluster Autoscaler skaliert ausschließlich vordefinierte ASGs und ist an deren Instanztypen gebunden. Der Horizontal Pod Autoscaler skaliert Pods, keine Nodes — er *erzeugt* die Pending Pods, die Karpenter dann bedient. EKS auf Fargate nimmt dir die Nodes ganz ab und scheidet hier schon deshalb aus, weil es kein Spot kennt.

## Prüfungsknackpunkte

**Signalwörter für Karpenter:** „Pods bleiben Pending", „richtig dimensionierte Nodes", „ohne Node Groups zu verwalten", „unterschiedlichste Pod-Größen", „Nodes laufen halb leer", „kostenoptimal skalieren".

**Signalwörter für die Spot-Trennung:** „unkritische / stateless / unterbrechbare Workloads" gegen „kritische / stateful Pods". Sobald ein Szenario diese beiden Gruppen nennt, ist die Antwort **zwei Pools**, nicht eine Sparmaßnahme für alles.

**Warum der Cluster Autoscaler hier verliert:** Er kann nur vergrößern, was schon definiert ist. Das Szenario verlangt aber *passend dimensionierte* Nodes für wechselnde Pod-Größen — das ist genau die Fähigkeit, die an der Node-Group-Grenze endet. Zusätzlich fehlt ihm die aktive Consolidation, die das Halb-leer-Problem des Szenarios löst.

**Warum EKS auf Fargate hier verliert:** Es nimmt dir das Node-Management vollständig ab und klingt deshalb wie die bequemste Antwort. Aber die EKS-Dokumentation ist eindeutig: **Amazon EKS unterstützt kein Fargate Spot.** Damit fällt die Kostenanforderung weg, und GPUs gibt es dort ebenfalls nicht. Bei „Spot-Ersparnis mit Kontrolle über die Nodes" ist immer Karpenter gemeint.

**Warum der Horizontal Pod Autoscaler hier verliert:** Er ist keine Alternative, sondern die Ebene darüber. Der HPA erhöht die Replica-Zahl, dadurch entstehen Pending Pods, und *dann* erst wird ein Node-Autoscaler gebraucht. Eine Antwort, die nur den HPA nennt, hat den Cluster nicht vergrößert.

**Warum „alles auf Spot" hier verliert:** Stateful und kritische Pods auf unterbrechbarer Kapazität sind eine Verfügbarkeitswette. Die Aufgabe nennt beide Gruppen ausdrücklich — die gesuchte Lösung trennt sie, statt zu sparen, bis es weh tut.

**Warum „Spot einfach im NodePool aktivieren" hier verliert:** Ohne SQS-Queue und EventBridge-Regeln ist das Interruption-Handling abgeschaltet. Der Cluster merkt die Unterbrechung erst, wenn die Node bereits fort ist. Eine Antwort, die Spot ohne Interruption-Pfad vorschlägt, ist unvollständig.
