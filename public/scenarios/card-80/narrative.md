---
cardNumber: 80
slug: sieben-r-migrationsstrategien
title: "Die 7 R's der Migration — Wellenplan statt Technologiediskussion"
services: ["AWS Transform MGN", "Amazon EVS", "AWS Database Migration Service", "AWS Migration Hub", "AWS Application Discovery Service"]
domains: ["D4", "D3"]
badgeCount: 0
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html"
  - "https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/welcome.html"
  - "https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-migration/detailed-portfolio-discovery.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/06/aws-transform-mgn-rebrand/"
  - "https://aws.amazon.com/application-migration-service/"
  - "https://aws.amazon.com/vmware/faqs"
  - "https://aws.amazon.com/about-aws/whats-new/2025/08/aws-general-availability-amazon-elastic-evs"
---

## Die Grundidee zuerst

Stell dir vor, eine Firma mit 300 Räumen muss in 18 Monaten aus ihrem Gebäude raus.

**Weg eins:** Alle setzen sich zusammen und reden über LKWs. Wie groß? Wie viele? Mit oder ohne Hebebühne? Nach drei Monaten steht die Logistik, und niemand hat einen einzigen Raum betreten. Dann fängt der Umzug an, und im Raum 47 steht ein Archivschrank, den seit elf Jahren niemand geöffnet hat. Er wird eingeladen, transportiert, ausgeladen und wieder hingestellt. Bezahlt wurde für das Nichts darin der volle Preis.

**Weg zwei:** Jemand geht mit einem Set Klebepunkte durch alle 300 Räume. Sieben Farben. Grauer Punkt: kommt weg. Zweiter grauer Punkt: bleibt vorerst stehen, mit Begründung. Blau: der Raum wird als Ganzes verschoben, mitsamt Regalen. Und so weiter bis zum orangen Punkt: der Raum wird am neuen Ort neu gebaut.

Erst wenn alle Punkte kleben, redet jemand über LKWs.

Das ist der Unterschied zwischen einer Technologiediskussion und einem Wellenplan. Die 7 R's sind nicht sieben Werkzeuge, aus denen du eines auswählst. Sie sind sieben Klebepunktfarben, und der Vorstand will das Ergebnis der Punkteverteilung sehen — nicht die Farbenlehre.

## Was es eigentlich ist — die Portfolio-Zeile

Das zentrale Objekt dieser Karte ist kein AWS-Dienst. Es ist eine Zeile pro Anwendung. AWS nennt den Vorgang „rationalization of this data against the seven Rs" — das Portfolio wird gegen die sieben Strategien abgeglichen, und daraus entsteht der Wellenplan.

So sieht eine solche Zeile aus, wenn du sie als Datensatz schreibst:

```json
{
  "applicationId": "APP-0147",
  "name": "Rechnungsarchiv Legacy",
  "servers": 3,
  "avgCpuPercent": 2.1,
  "inboundConnections90d": 0,
  "strategy": "retire",
  "rationale": "Zombie-Anwendung. Kein eingehender Verkehr seit 90 Tagen.",
  "wave": null,
  "owner": "Finanzbuchhaltung",
  "decisionDate": "2026-03-04"
}
```

Lies das einmal durch: Es steht keine Technologie darin. Keine Instanzgröße, kein Zielservice, kein Netzwerk. Es stehen zwei Messwerte darin (`avgCpuPercent`, `inboundConnections90d`), eine Entscheidung, eine Begründung und ein Datum.

Genau diese Messwerte sind nicht erfunden. AWS nennt in der Prescriptive Guidance konkrete Schwellen für den Retire-Fall: Anwendungen mit durchschnittlich unter 5 Prozent CPU- und Speichernutzung heißen dort *zombie applications*, solche zwischen 5 und 20 Prozent über 90 Tage *idle applications*. Und: keine eingehende Verbindung in den letzten 90 Tagen.

300 solche Zeilen sind der Wellenplan. Das Diagramm auf der Karte ist die Legende dazu.

## Der Weg durch die Karte

### Retire — die billigste Migration ist die, die nicht stattfindet

Der erste Punkt kostet nichts und spart am meisten. Anwendungen abschalten, die niemand mehr benutzt.

AWS führt für diese Entscheidung vier Gründe auf: kein Geschäftswert, Wegfall der Betriebs- und Hostingkosten, Reduktion des Sicherheitsrisikos durch nicht mehr unterstützte Betriebssysteme, und die Zombie-/Idle-Messung von oben.

Das Bild dazu: Du zahlst nicht für den Transport des Archivschranks, du zahlst auch nicht mehr für den Raum, in dem er stand. Doppelte Ersparnis, ein einziger Beschluss.

Der Haken, den die Karte nicht zeigt: Retire braucht jemanden, der unterschreibt. Wenn der ursprüngliche Entwickler die Firma vor sechs Jahren verlassen hat, traut sich niemand. Deshalb ist Retire in der Praxis die Strategie mit der längsten Diskussion und der kürzesten Umsetzung.

### Retain — eine Entscheidung, kein Versäumnis

Grau wie Retire, aber aus dem gegenteiligen Grund: Diese Anwendung bewegt sich nicht, und das ist beschlossen.

AWS nennt dafür unter anderem: Datenresidenz-Vorgaben, hohes Risiko ohne vorherige Detailanalyse, ungelöste Abhängigkeiten zu anderen Anwendungen, gerade erst durchgeführte Modernisierung, physische Abhängigkeiten ohne Cloud-Entsprechung — etwa Maschinen in einer Fertigungshalle — und Mainframe- oder Nicht-x86-Unix-Systeme.

Die Konsequenz für den Wellenplan: Retain hat immer eine Wiedervorlage. Eine Zeile mit `"strategy": "retain"` und ohne `reviewDate` ist keine Entscheidung, sondern ein Zettel, der vom Tisch gefallen ist.

### Relocate — der ganze Raum am Stück

Hier wird nicht Server für Server umgezogen, sondern eine ganze virtualisierte Umgebung an einem Stück. AWS beschreibt Relocate als den Transfer einer großen Zahl von Servern von einer On-Premises-Plattform auf eine Cloud-Version derselben Plattform — ohne neue Hardware, ohne Umschreiben von Anwendungen, ohne Änderung des Betriebs. Und: Relocate ist laut AWS der schnellste Weg, weil die Gesamtarchitektur der Anwendung unangetastet bleibt.

Das Bild: Du hebst nicht die Möbel aus dem Raum, du hebst den Raum.

**Und hier steht auf der Karte etwas, das 2026 nicht mehr stimmt.** Die Karte nennt als Werkzeug „VMware Cloud on AWS". Dieser Dienst wird seit dem 30. April 2024 nicht mehr von AWS oder seinen Channel-Partnern verkauft; bestehende Kunden werden weiter bedient, neue Abonnements laufen über Broadcom. Der AWS-eigene Weg für dasselbe Muster heißt seit August 2025 **Amazon EVS** (Elastic VMware Service) und lässt VMware Cloud Foundation auf EC2-Bare-Metal-Instanzen in deiner eigenen VPC laufen.

Für die Prüfung: Das Muster Relocate bleibt unverändert. Der Produktname darunter hat sich bewegt.

### Rehost — Lift and Shift, ohne eine Zeile Code

Server auf EC2, Anwendung unverändert. AWS: Du migrierst von mehreren Quellplattformen — physisch, virtuell oder aus einer anderen Cloud — ohne dich um Kompatibilität, Performance-Einbrüche, lange Cutover-Fenster oder Fernreplikation kümmern zu müssen. Die Anwendung bedient währenddessen weiter ihre Nutzer.

Das Werkzeug dafür heißt auf der Karte „Application Migration Service". Seit dem 8. Juni 2026 heißt derselbe Dienst **AWS Transform MGN**. APIs, Funktionsumfang und Replikationstechnik sind unverändert — es ist eine Umbenennung, die MGN als Replikations-Engine unter AWS Transform einordnet.

Die ehrliche Konsequenz von Rehost, die AWS selbst benennt: Diese Strategie skaliert deine Anwendung, ohne irgendeine Cloud-Optimierung umzusetzen, die Zeit oder Geld sparen würde. Eine ineffiziente Anwendung bleibt ineffizient — sie läuft jetzt nur auf fremder Hardware.

### Repurchase — der Betrieb verschwindet mitsamt dem Server

Nicht migrieren, sondern kaufen. Exchange-Server abgeben, Microsoft 365 abonnieren. AWS nennt drei Fälle: Wechsel von klassischer Lizenz zu SaaS, Versionssprung oder Drittanbieter-Äquivalent, und Ersatz einer Eigenentwicklung durch ein Standardprodukt statt Neuprogrammierung.

Das Bild: Du transportierst den Kopierer nicht, du kündigst den Kopierer und schließt am neuen Ort einen Servicevertrag.

Was AWS in derselben Beschreibung mitliefert und was auf der Karte keinen Platz hat: Nach dem Kauf kommen Schulung, Datenmigration, Anbindung an das Verzeichnis und Netzwerkkonfiguration. Repurchase ist im Wellenplan billig und im Projektplan nicht umsonst.

### Replatform — lift and reshape

Umzug mit kleiner Optimierung, ohne die Architektur anzufassen. AWS' eigenes Beispiel: eine Microsoft-SQL-Server-Datenbank nach Amazon RDS for SQL Server. Die Aliasnamen sind aufschlussreich — *lift, tinker, and shift* beziehungsweise *lift and reshape*. Getunt wird, nicht neu gebaut.

AWS führt darunter auch Dinge auf, die man nicht sofort als Replatform lesen würde: Wechsel auf Graviton-Prozessoren, Wechsel von Windows auf Linux mitsamt Portierung von .NET Framework auf .NET Core, und das Überführen virtueller Maschinen in Container ohne Codeänderung.

**Das letzte Beispiel ist die häufigste Verwechslung im ganzen Thema:** Container allein machen aus Replatform noch kein Refactor. Erst wenn die Architektur zerlegt wird, kippt die Zuordnung.

### Refactor — der größte Nutzen und der größte Aufwand

Architektur ändern, cloud-native Eigenschaften ausnutzen. AWS nennt als Auslöser unter anderem: ein Mainframe, der die Anforderungen nicht mehr trägt oder zu teuer ist; ein Monolith, der die Auslieferung bremst; eine Anwendung, die niemand mehr warten kann oder deren Quellcode fehlt; sehr niedrige Testabdeckung; und den Compliance-Fall, in dem einzelne Tabellen — Kundendaten, Patientendaten — vor Ort bleiben müssen und die Datenbank dafür aufgetrennt wird.

AWS' eigener Satz dazu ist deutlich: Refactoring ist die komplexeste und teuerste der Migrationsstrategien, weil du während der Migration modernisierst. Bei einer großen Migration soll Refactor nur dann gewählt werden, wenn keine andere Strategie akzeptabel ist.

### ✗ Verworfen — alles refactoren, weil „cloud-native"

Das ist der Pfad, gegen den die ganze Karte gebaut ist, und er stammt nicht aus einem Lehrbuch, sondern aus AWS' eigener Guidance für große Migrationen: Refactor wird für große Migrationen **nicht** empfohlen. Es ist die komplexeste Strategie und über hunderte Anwendungen kaum steuerbar. Empfohlen wird stattdessen rehost, relocate oder replatform — und die Modernisierung **nach** abgeschlossener Migration.

Als gängige Strategien für große Migrationen nennt AWS vier: rehost, replatform, relocate und retire.

Und weil das Szenario „300 Anwendungen" heißt: AWS zieht die Grenze zur *large migration* bei 300 oder mehr Servern. Dieses Szenario liegt also genau auf der Schwelle, ab der die Empfehlung gilt.

## Die entscheidende Unterscheidung

Vier der sieben R's bewegen tatsächlich etwas. Die Frage, die sie auseinanderhält, lautet nicht „wie viel Arbeit", sondern **„was genau ändert sich".**

| | Betriebssystem / VM | Plattform darunter | Architektur | Alias bei AWS |
|---|---|---|---|---|
| **Relocate** | unverändert | Hypervisor zieht um | unverändert | — |
| **Rehost** | zieht um | EC2 statt eigenem Blech | unverändert | lift and shift |
| **Replatform** | evtl. anders | Managed Service | im Kern unverändert | lift and reshape |
| **Refactor** | fällt evtl. weg | beliebig | **wird neu geschnitten** | re-architect |

Lies die Tabelle von oben nach unten: Die Änderung wandert von rechts nach links durch die Schichten. Genau das meint die unbeschriftete Achse auf der Karte mit „wachsende Änderungstiefe".

## Die ehrliche Feinheit

**Erstens: Es gibt keine amtliche Aufwandsrangfolge.** Die Kette „Retire < Retain < Relocate < Rehost < Repurchase < Replatform < Refactor", die in Kursen und Cheat Sheets kursiert, steht so in keiner AWS-Quelle. Belegt sind nur zwei Aussagen: Refactor ist die komplexeste und teuerste Strategie, und Relocate ist der schnellste Weg. Alles dazwischen ist Konvention. Deshalb trägt die Karte eine unbeschriftete Achse und keine Nummerierung.

Interessant wird es, wenn du AWS' eigene Reihenfolge auf der Übersichtsseite nachschlägst: Dort steht **Rehost vor Relocate**, auf der Karte ist es umgekehrt. Beides ist vertretbar, weil keine der beiden Reihenfolgen eine Rangfolge behauptet — aber wer in einer Prüfungsfrage eine „offizielle Reihenfolge" erkennen will, sucht etwas, das es nicht gibt.

**Zweitens: sechs oder sieben R's?** Die Zahl schwankt je nach Quelle und Alter, und das ist keine Schlamperei, sondern Historie. Gartner beschrieb 2011 fünf R's. AWS' eigene Guidance baut darauf auf und nennt heute in Prescriptive Guidance durchgehend **sieben**: Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor/Re-architect. Ältere AWS-Materialien — auch archivierte Prescriptive-Guidance-PDFs — sprechen an einzelnen Stellen noch von „six common migration strategies". Der Unterschied ist fast immer **Relocate**, das später hinzukam.

Für die Prüfung heißt das: Nenne die Strategie, nicht die Zahl. Eine Antwortoption, die „die 6 R's" oder „die 7 R's" als Ganzes zum Gegenstand macht, prüft nichts.

**Drittens: die Werkzeugnamen haben sich bewegt, die Muster nicht.** MGN heißt seit Juni 2026 AWS Transform MGN. VMware Cloud on AWS wird seit April 2024 nicht mehr von AWS verkauft, der AWS-eigene Nachfolgepfad heißt Amazon EVS. Wenn eine Prüfungsfrage nach dem *Muster* fragt — „welche Strategie für eine vSphere-Landschaft mit 18 Monaten Restlaufzeit" —, ist die Antwort Relocate, unabhängig davon, welcher Produktname gerade auf der Rechnung steht.

## Syntax lesen — die Entscheidungskaskade

Die 7 R's haben keine Kommandosyntax. Was sie haben, ist eine Reihenfolge von Fragen, die du pro Anwendung durchläufst. Genau diese Kaskade ist das, was du „lesen" musst:

```
Anwendung APP-0147
   │
   ├─ Nutzt sie noch jemand?  ────── nein ──►  RETIRE
   │                                            (0 Server bewegt)
   ├─ Darf/kann sie überhaupt weg?  ─ nein ──►  RETAIN
   │                                            (+ Wiedervorlage)
   ├─ Zieht die ganze Plattform?  ─── ja ────►  RELOCATE
   │
   ├─ Gibt es das fertig zu kaufen? ─ ja ────►  REPURCHASE
   │
   ├─ Reicht ein Managed Service
   │  bei gleichem Code?  ─────────── ja ────►  REPLATFORM
   │
   ├─ Genügt derselbe Server
   │  auf EC2?  ───────────────────── ja ────►  REHOST
   │
   └─ sonst ─────────────────────────────────►  REFACTOR
                                                (nur wenn nichts anderes trägt)
```

Und ein zweiter Lesehinweis, weil AWS die Strategien fast nie beim Namen nennt, sondern beim Spitznamen. Das ist die eigentliche Falle in Prüfungstexten:

```
"lift and shift"          →  Rehost
"lift and reshape"        →  Replatform
"lift, tinker, and shift" →  Replatform
"drop and shop"           →  Repurchase
"re-architect"            →  Refactor
```

Wer diese fünf Zuordnungen sicher kann, löst die meisten Fragen zu diesem Thema, ohne die Definitionen aufsagen zu müssen.

## Was du dadurch nicht baust

Zähl durch, was diese Karte **nicht** enthält:

- keine Zielarchitektur — kein VPC-Schnitt, keine Instanzgrößen, keine Kostenrechnung
- keinen Zeitplan — die Wellen entstehen erst aus der fertigen Punkteverteilung
- keine Abhängigkeitsanalyse zwischen Anwendungen, obwohl genau die entscheidet, welche Anwendung in welcher Welle liegt
- keine Aussage darüber, wie viel Prozent des Portfolios typischerweise auf welche Strategie fallen — solche Zahlen kursieren bei Beratungshäusern, sind aber nicht AWS-belegt
- keine Modernisierung — die kommt laut AWS ausdrücklich **danach**

Übrig bleibt: eine Legende mit sieben Farben und der Beschluss, welche Farbe an welchen Raum kommt.

## Wenn du dir eine Sache merkst

**Bei Zeitdruck zuerst Retire, dann Rehost oder Relocate. Refactor ist die teuerste Strategie und gehört hinter die Migration, nicht davor.**

Warum die naheliegenden Gegenpositionen fallen: „Alles refactoren, weil sonst der Cloud-Nutzen ausbleibt" — AWS rät bei großen Migrationen explizit davon ab und empfiehlt Modernisierung nach der Migration. „Eine Strategie fürs ganze Portfolio" — reale Migrationen kombinieren mehrere R's, die Frage lautet immer „welches R für *diese* Anwendung". „Erst die Zielarchitektur, dann das Portfolio" — dreht die Reihenfolge um und produziert genau die Technologiediskussion, die das Szenario verhindern will.

## Prüfungsknackpunkte

**Signalwörter:** „data center contract ending" oder „lease expiring" plus eine dreistellige Anwendungszahl. Zeitdruck plus Portfoliogröße ist immer eine 7-R's-Frage, nie eine Servicefrage. Kommt „modernize" im Text vor, prüfe genau, ob es *während* oder *nach* der Migration gemeint ist — daran hängt die richtige Antwort.

**Refactor gegen Replatform.** Replatform ändert die Plattform bei weitgehend gleichem Code („lift and reshape"): Oracle auf einer EC2-Instanz wird zu Amazon RDS for Oracle. Refactor ändert die Architektur: derselbe Monolith wird in Services zerlegt. Auch der Wechsel Oracle → Aurora PostgreSQL zählt bei AWS als Refactor/Re-architect, weil Engine und Datenmodell mitwandern.

**Relocate gegen Rehost.** Relocate verschiebt eine ganze virtualisierte Umgebung, ohne einzelne Server zu konvertieren. Rehost bewegt Server auf EC2. Signalwort für Relocate ist praktisch immer „vSphere", „hypervisor" oder „ohne Änderung der bestehenden Betriebsprozesse".

**Retain als Nichtstun lesen.** Retain ist eine dokumentierte Entscheidung mit Begründung und Wiedervorlage — nicht die Restmenge nach der Sortierung. Antwortoptionen, die Retain als „später entscheiden" formulieren, sind falsch.

**Retire zu spät ansetzen.** Wer erst nach der Migration aufräumt, hat für die Aufräumkandidaten den vollen Transport bezahlt. Retire gehört in die Portfolio-Analyse, nicht in die Nachbereitung.

**Die Zahlenfalle.** Prozentangaben zur Portfolio-Verteilung („40–50 % rehost") stammen aus Beratungsmaterial, nicht von AWS. Eine Antwortoption, die mit solchen Anteilen argumentiert, argumentiert außerhalb der Doku.
