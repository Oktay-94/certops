---
cardNumber: 83
slug: dr-muster-pilot-light-warm-standby-active-active
title: "Pilot Light vs Warm Standby vs Active/Active"
services: ["AWS Elastic Disaster Recovery", "Amazon Route 53", "AWS CloudFormation", "Amazon RDS", "Amazon S3", "AWS Backup"]
domains: ["D2"]
correctAnswer: "C"
badgeCount: 0
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html"
  - "https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/capacity-reservation-overview.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ri-limits.html"
---

## Die Grundidee zuerst

Stell dir vor, du willst für den Fall, dass dein Haus unbewohnbar wird, ein zweites bereithalten.

**Der alte Weg** kennt genau zwei Antworten: Du hast ein zweites Haus, oder du hast keins. Wer keins hat, steht im Ernstfall auf der Straße. Wer eins hat, zahlt es doppelt — Miete, Heizung, Grundsteuer, das ganze Jahr, für ein Haus, in dem niemand wohnt. Deshalb hatten die meisten Firmen jahrzehntelang entweder gar kein Ausweichrechenzentrum oder ein teures, das im Ernstfall trotzdem nicht funktionierte, weil es seit drei Jahren niemand betreten hatte.

**Der neue Weg** ist kein Schalter, sondern ein Drehregler mit vier Rasten:

- **Raste eins:** Du besitzt ein leeres Grundstück, die Baupläne liegen im Schrank, die Möbel stehen im Lager. Im Ernstfall baust du. Das dauert, kostet aber im Wartezustand fast nichts.
- **Raste zwei:** Das Haus steht fertig da. Wasser und Strom sind angeschlossen, der Kühlschrank läuft und wird täglich neu befüllt. Aber die Heizung ist aus und kein Bett ist bezogen. Du kannst nicht einfach einziehen — du musst erst aufdrehen.
- **Raste drei:** Im Haus wohnt bereits jemand. Es ist geheizt, das Bad funktioniert, Handtücher hängen. Es ist nur zu klein für die ganze Familie. Im Ernstfall stellst du Betten dazu, mehr nicht.
- **Raste vier:** Die Familie lebt tatsächlich in beiden Häusern gleichzeitig. Fällt eines aus, merkt es kaum jemand — dafür musst du dich jeden Tag darum kümmern, dass in beiden Küchen dieselben Vorräte stehen.

Diese vier Rasten heißen bei AWS Backup and Restore, Pilot Light, Warm Standby und Multi-Site Active/Active. Der Reliability Pillar führt sie in genau dieser Reihenfolge auf: **steigend in Kosten und Komplexität, fallend in RTO und RPO.**

Damit ist die Aufgabe des SaaS-Anbieters aus dem Szenario schon halb gelöst. Er hat eine RTO-Zusage von vier Stunden auf 15 Minuten zu senken. Er sucht also nicht die beste Raste, sondern die *linkeste, die noch reicht*.

## Was es eigentlich ist — eine Zahl im Template

Der Unterschied zwischen Pilot Light und Warm Standby sieht in der Architekturzeichnung dramatisch aus. In der Infrastruktur ist er oft eine einzige Zahl:

```yaml
Parameters:
  StackMode:
    Type: String
    AllowedValues: [pilotlight, warmstandby, production]
    Default: pilotlight

Conditions:
  IsPilotLight: !Equals [!Ref StackMode, pilotlight]

Resources:
  AppFleet:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize:         !If [IsPilotLight, 0, 2]
      DesiredCapacity: !If [IsPilotLight, 0, 2]
      MaxSize:         40
      VPCZoneIdentifier: [!Ref PrivateSubnetA, !Ref PrivateSubnetB]

  ReplicaDb:
    Type: AWS::RDS::DBInstance
    Properties:
      SourceDBInstanceIdentifier: !Ref PrimaryRegionDbArn
      DBInstanceClass: db.r7g.large
```

Lies das von oben nach unten. `StackMode` ist der Drehregler. `DesiredCapacity: 0` ist Pilot Light: Das Netz existiert, die Subnetze existieren, die Auto Scaling Group existiert, die Launch-Konfiguration existiert — nur läuft keine einzige Instanz darin. `DesiredCapacity: 2` ist Warm Standby: dieselbe Vorlage, dieselben Ressourcen, zwei laufende Server.

`ReplicaDb` steht in beiden Modi außerhalb der Bedingung. Das ist der Punkt, den die meisten beim ersten Lesen überspringen: **Die Datenbank läuft in beiden Fällen.** Der Reliability Pillar sagt es ausdrücklich — beim Pilot Light sind die Ressourcen für Datenreplikation und Backup, also Datenbanken und Objektspeicher, dauerhaft eingeschaltet.

Der Unterschied ist nicht die Replikation. Der Unterschied ist die Compute-Ebene. Genau deshalb liegt auf der Karte die orange Zeile — die Compute-Zeile — über der grünen Datenzeile, und genau in der orangen Zeile stehen die vier verschiedenen Antworten.

AWS beschreibt diesen Trick selbst: Mit CloudFormation-Parametern und bedingter Logik steuerst du aus **einer** Vorlage, ob ein Stack aktiv oder Standby ist. Damit hast du auch die Antwort auf die Frage, warum CloudFormation im Frontmatter dieser Karte steht.

## Der Weg durch die Karte

### Spalte 1 — Backup & Restore: in der DR-Region läuft nichts

RPO in Stunden, RTO in 24 Stunden oder weniger. Mit automatisierten oder kontinuierlichen Backups und damit Point-in-Time-Recovery sinkt der RPO in manchen Fällen auf bis zu 5 Minuten.

Im Ernstfall passiert alles zur gleichen Zeit: Infrastruktur ausrollen, Code deployen, Daten zurückspielen. Das ist die einfachste Strategie und die mit dem größten Zeitverbrauch.

Ein Punkt, den Kurse oft unterschlagen: AWS hält diese Variante nicht für minderwertig. Das DR-Whitepaper sagt sinngemäß, dass für eine gut gebaute, hochverfügbare Anwendung Backup and Restore ausreicht, solange „Desaster" den Verlust eines einzelnen Rechenzentrums bedeutet. Erst wenn dein Desaster-Begriff eine ganze Region umfasst — oder eine Aufsichtsbehörde das verlangt —, brauchst du die Spalten zwei bis vier.

### Spalte 2 — Pilot Light: alles außer Compute

RPO in Minuten, RTO in Zehnerminuten. Eine Kopie der Kern-Infrastruktur steht in der Recovery-Region, die Daten werden dorthin repliziert und dort zusätzlich gesichert. Anwendungsserver oder serverlose Compute-Ressourcen sind **nicht ausgerollt**, können aber bei Bedarf mit der nötigen Konfiguration und dem Anwendungscode erzeugt werden.

Das Bild der Zündflamme trägt genau so weit: Sie brennt dauerhaft, kostet fast nichts und heizt kein Zimmer. Sie sorgt nur dafür, dass beim Aufdrehen niemand mehr ein Streichholz suchen muss.

### Spalte 3 — Warm Standby: klein, aber vollständig

RPO in Sekunden, RTO in Minuten. Eine verkleinerte, aber voll funktionsfähige Version der Workload läuft dauerhaft in der Recovery-Region. Geschäftskritische Systeme sind vollständig dupliziert und dauerhaft an, nur eben mit einer verkleinerten Flotte. Die Daten sind repliziert und in der Recovery-Region live.

Und jetzt der Satz, den man sich für die Prüfung anstreicht: **Je weiter hochskaliert der Warm Standby bereits ist, desto niedriger sind RTO und Control-Plane-Abhängigkeit.** Läuft die Recovery-Region in voller Kapazität, heißt dieselbe Bauform Hot Standby.

Für das Szenario mit 15 Minuten RTO ist das die Antwort. RTO in Minuten passt, RPO in Sekunden ist Zugabe, und die Kosten liegen unter Active/Active.

### Spalte 4 — Active/Active: beide Regionen tragen Last

RPO nahe null, RTO potenziell null. Die Workload ist in mehreren Regionen ausgerollt und bedient aus allen aktiv Verkehr. Fällt eine Region aus, wird sie geräumt, die übrigen tragen weiter.

Der Preis steht in derselben Quelle, und er ist kein Geldbetrag: Daten müssen über Regionen synchronisiert werden, und Schreibkonflikte auf denselben Datensatz in zwei regionalen Replikaten müssen vermieden oder behandelt werden — was komplex werden kann. AWS nennt Multi-Site Active/Active die operativ komplexeste der DR-Strategien.

### Die Kostenzeile — warum dort „am niedrigsten" steht und keine Zahl

Unter jedem der vier Strategienamen steht eine Kostenangabe, und alle vier sind Wörter: am niedrigsten, niedrig, mittel, am höchsten. Das ist keine Bequemlichkeit, sondern die genaue Wiedergabe dessen, was AWS zusagt.

Der Reliability Pillar ordnet die vier Strategien ausschließlich **relativ** zueinander: steigende Kosten und Komplexität, fallende RTO und RPO. Eine absolute Aussage gibt es nirgends, und sie wäre auch nicht zu haben — die Kosten von Warm Standby hängen davon ab, wie klein „verkleinert" bei dir bedeutet. Zwei Instanzen statt vierzig sind ein anderer Faktor als zwanzig statt vierzig.

AWS zeigt dazu eine zweite Grafik, die auf der Karte fehlt: eine Ebene aus maximal zulässigem RTO und maximal zulässigem Budget. Man trägt beide Grenzen ein und schaut, welche Strategien im verbleibenden Feld liegen. Im AWS-Beispiel erfüllen Pilot Light *und* Warm Standby beide Kriterien — dann nimmt man die günstigere.

Genau das ist die Denkbewegung, die geprüft wird: erst zwei Grenzen ziehen, dann von links nach rechts die erste Strategie nehmen, die beide erfüllt. Nicht die beste suchen, sondern die erste ausreichende.

### Die grüne Zeile — warum „Daten" unter allen vier Spalten steht

Weil kontinuierliche Replikation gegen manche Katastrophen schützt, aber nicht gegen alle. AWS schreibt es als eigenen Absatz zu *allen* Strategien: Replikation schützt dich nicht gegen Datenverfälschung oder Datenzerstörung, solange deine Lösung nicht zusätzlich Versionierung oder Point-in-Time-Recovery enthält. Du musst die replizierten Daten in der Recovery-Region auch noch sichern.

Das Bild dazu: Ein Spiegel zeigt zuverlässig, was vor ihm steht. Auch wenn das ein brennendes Sofa ist.

### Die Teal-Zeile — Elastic Disaster Recovery sitzt zwischen den Spalten

Der Reliability Pillar empfiehlt DRS für einen sehr konkreten Fall: Die Kosten drücken, aber du willst RPO- und RTO-Ziele auf Warm-Standby-Niveau. DRS arbeitet nach dem Pilot-Light-Muster, repliziert die Daten kontinuierlich, erreicht damit einen RPO in Sekunden und einen RTO in Minuten — und lässt dauerhaft nur die Ressourcen laufen, die für die Replikation nötig sind. Die Compute-Wiederherstellung orchestriert der Dienst selbst, ausgelöst durch Failover oder Drill.

Deshalb steht DRS auf der Karte nicht als fünfte Spalte, sondern als Zeile darunter: Es ist keine eigene Strategie, sondern eine Umsetzung, die zwei Spalten überbrückt.

### ✗ Verworfen — Active/Active als Standardwahl

AWS schreibt, Multi-Site Active/Active solle nur gewählt werden, wenn die Geschäftsanforderung es verlangt. Und einen Absatz weiter, bei den Umsetzungsschritten, steht der allgemeine Satz dazu: Vermeide eine Strategie, die strenger ist als nötig, denn sie erzeugt unnötige Kosten.

Für 15 Minuten RTO ist Active/Active kein besserer Schutz, sondern ein anderes Problem: Du kaufst dir Konfliktbehandlung bei regionsübergreifenden Schreibvorgängen ein, die vorher niemand gebraucht hat.

## Die entscheidende Unterscheidung

AWS hält selbst fest, dass der Unterschied zwischen Pilot Light und Warm Standby manchmal schwer zu greifen ist, und löst ihn in einer eigenen Anmerkung auf:

| | Pilot Light | Warm Standby |
|---|---|---|
| Kann Anfragen beantworten? | nein, ohne zusätzliche Handlung nicht | ja, sofort — nur mit reduzierter Kapazität |
| Nötige Schritte im Ernstfall | Server einschalten, ggf. weitere Nicht-Kern-Infrastruktur ausrollen, hochskalieren | hochskalieren |
| Daten | repliziert, dauerhaft verfügbar | repliziert, live in der Recovery-Region |
| RPO / RTO | Minuten / Zehnerminuten | Sekunden / Minuten |
| Bei voller Kapazität | — | heißt Hot Standby |

Die Zeile „nötige Schritte" ist die eigentliche Antwort. Pilot Light verlangt *einschalten und* hochskalieren, Warm Standby nur hochskalieren. Ein Schritt Unterschied — und dieser eine Schritt kostet eine Größenordnung RTO.

## Die ehrliche Feinheit

**Erstens: „nicht ausgerollt" und „nicht gestartet" sind zwei verschiedene Sätze.** REL13-BP02 formuliert für Pilot Light, dass keine Compute-Instanzen deployed sind. Das DR-Whitepaper formuliert dieselbe Sache als „Server einschalten". Beides steht bei AWS, beides beschreibt denselben Zustand — nur einmal aus Sicht der Ressourcen und einmal aus Sicht der Handlung. Wenn eine Prüfungsfrage nach dem Unterschied fragt, ist die belastbare Formulierung immer die aus der Anmerkung: *kann ohne zusätzliche Handlung keine Anfragen verarbeiten.*

**Zweitens: Hochskalieren setzt voraus, dass Kapazität da ist.** Der Reliability Pillar hängt an den Warm-Standby-Absatz eine Empfehlung, die auf der Karte keinen Platz mehr hatte: Um sicherzugehen, dass die Kapazität im Bedarfsfall verfügbar ist, solltest du Capacity Reservations für EC2 in Betracht ziehen; bei Lambda leistet Provisioned Concurrency das Gegenstück. Genau hier hakt Karte 85 ein — eine zonale Reserved Instance oder eine On-Demand Capacity Reservation reserviert Kapazität, ein Savings Plan nie. Ein DR-Plan, dessen letzter Schritt „dann skalieren wir auf 40 Instanzen hoch" lautet, hat eine ungeprüfte Annahme im Kern.

**Drittens: Der RTO-Unterschied ist ein Control-Plane-Unterschied.** Unter den Anti-Patterns von REL13-BP02 steht die Abhängigkeit von Control-Plane-Operationen während der Wiederherstellung. Eine Strategie, die im Ernstfall erst neue Ressourcen anlegen muss, ruft genau die APIs auf, die im Regionsausfall am ehesten überlastet sind. Warm Standby ruft weniger davon auf als Pilot Light, Hot Standby noch weniger.

**Viertens: Es gibt keine Zahlen zu den Kosten.** AWS ordnet die vier Strategien nur relativ zueinander ein. Wer wissen will, was Warm Standby gegenüber Pilot Light konkret kostet, rechnet das für die eigene Landschaft aus — jede Prozentangabe aus einem Kurs ist geraten.

## Syntax lesen — die Zeitachse von RPO und RTO

Beide Kennzahlen messen Zeit, aber in entgegengesetzte Richtungen vom selben Punkt aus:

```
letzter Wiederherstellungspunkt        Katastrophe            wieder im Dienst
        │                                   │                        │
        ▼                                   ▼                        ▼
────────●───────────────────────────────────✕────────────────────────●────────▶
        └────────────  RPO  ────────────────┘└────────  RTO  ────────┘
             wie viel Datenzeit ist weg?          wie lange bin ich weg?
```

Links vom Kreuz liegt der Datenverlust, rechts davon die Ausfallzeit. Deshalb sind die beiden Zahlen unabhängig voneinander: Ein System darf stundenlang RTO haben und trotzdem nur Sekunden RPO vertragen — etwa ein Buchungsjournal, das langsam wieder anlaufen darf, aber keinen einzigen Vorgang verlieren.

Und deshalb steht auf der Karte in jeder Spalte ein Paar, nie eine einzelne Zahl.

## Was du dadurch nicht baust

Zähl durch, was in Warm Standby **nicht** enthalten ist:

- keine Kapazitätsgarantie in der DR-Region — die musst du separat kaufen
- kein Schutz gegen gelöschte oder verfälschte Daten, solange Versionierung oder PITR fehlen
- kein automatischer Verkehrsumzug — das leistet erst Karte 84
- kein Failback-Plan; der Weg zurück in die Primärregion ist ein eigenes Projekt
- keine Aussage darüber, ob dein Anwendungscode in beiden Regionen dasselbe tut — Configuration Drift ist ein eigener Best-Practice-Punkt
- keine Ersparnis gegenüber Pilot Light: Warm Standby ist die teurere der beiden

## Wenn du dir eine Sache merkst

**Nicht die Replikation trennt Pilot Light von Warm Standby — beide replizieren —, sondern die Frage, ob die DR-Region ohne zusätzliche Handlung bereits Anfragen beantworten kann.**

Backup and Restore fällt, weil ein RTO von bis zu 24 Stunden die 15-Minuten-Zusage um zwei Größenordnungen verfehlt. Pilot Light fällt, weil sein RTO in Zehnerminuten liegt und der Einschaltschritt an der Control Plane hängt — knapp daneben ist bei einer vertraglichen Zusage daneben. Active/Active fällt nicht an der Technik, sondern an der Vorgabe „ohne die DR-Kosten zu verdreifachen".

## Prüfungsknackpunkte

**Signalwörter:** „lowest cost while still meeting an RTO of …" ist die Aufforderung, die *knapp ausreichende* Strategie zu wählen, nicht die beste. „scaled-down but fully functional copy" ist wörtlich Warm Standby. „cannot serve requests without additional action" ist wörtlich Pilot Light. „always running in the recovery Region" plus „reduced capacity" ist wieder Warm Standby. „serving traffic from multiple Regions" ist Multi-Site Active/Active.

**Die Falle mit der strengsten Strategie.** Fragen mit „most cost-effective" und einer RTO-Vorgabe testen fast immer, ob du eine Raste zu weit rechts wählst. AWS warnt ausdrücklich vor Strategien, die strenger sind als nötig.

**Die Falle mit dem Vier-Stunden-Wert.** Manche Fragen nennen ein RTO, das auch Pilot Light noch schafft. Dann ist Pilot Light richtig und Warm Standby falsch — dieselbe Logik, andere Richtung.

**A — Backup and Restore:** RTO 24 Stunden oder weniger; verfehlt jede Zusage im Minutenbereich, egal wie gut die Automatisierung ist.

**B — Pilot Light:** RTO in Zehnerminuten, und der Ernstfall beginnt mit dem Anlegen von Compute-Ressourcen — genau der Control-Plane-Abhängigkeit, die AWS als Anti-Pattern führt.

**D — Multi-Site Active/Active:** erfüllt die RTO mühelos, ist aber die operativ komplexeste Strategie und laut AWS nur bei echter Geschäftsanforderung zu wählen; die Kostenvorgabe des Szenarios schließt sie aus.
