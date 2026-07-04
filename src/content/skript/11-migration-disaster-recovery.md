# Kapitel 11 — Migration & Disaster Recovery

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne — zwei Themen, die man sauber trennen muss:**
- **Migration** = etwas **einmalig** in die Cloud bringen (danach ist der Umzug fertig). Der Ablauf ist immer: **Entdecken → Planen → Umziehen**.
- **Disaster Recovery (DR)** = eine **dauerhafte** Notfall-Absicherung, damit die IT einen Katastrophenfall überlebt. Hier dreht sich alles um **RTO/RPO** und die vier DR-Strategien.

Die Migrations-Werkzeuge nach Aufgabe:

| Aufgabe | Dienst |
|---|---|
| Vorher: „Was läuft überhaupt im RZ?" | **Application Discovery Service** |
| Zentrale Umzugs-Übersicht | **Migration Hub** |
| Ganze **Server** umziehen (Lift-and-Shift) | **MGN** |
| **Datenbanken** umziehen (online) | **DMS** (+ **SCT** bei anderer Engine) |
| **Riesige Datenmengen offline** per Post | **Snow Family** |

---

## AWS Application Discovery Service

**Metapher / Konzept**

> Die Taschenlampe fürs eigene Rechenzentrum — er durchleuchtet vor einer Migration, was da überhaupt läuft und wie alles zusammenhängt.

**Das Problem & Die Lösung**

Vor einer großen Cloud-Migration steht die Frage: **Was haben wir überhaupt?** Welche Server laufen im Rechenzentrum, mit welcher Auslastung, welche Anwendungen — und vor allem: **welche Server hängen voneinander ab?** Ohne diese Bestandsaufnahme kann man keine sinnvolle Migration planen.

**Application Discovery Service** sammelt automatisch Informationen über das eigene On-Premises-Rechenzentrum als Grundlage für die Planung: Server, deren Konfiguration und Auslastung, laufende Prozesse und **Netzwerk-Abhängigkeiten** zwischen Servern. Zwei Erfassungsarten:
- **Agentless Discovery:** über eine virtuelle Appliance (z. B. in VMware), ohne Agent auf jedem Server.
- **Agent-based Discovery:** ein Agent pro Server für detailliertere Daten (Prozesse, Abhängigkeiten).

Die Ergebnisse fließen in den **Migration Hub** zur Planung.

**⚠️ Prüfungs-Knackpunkte**
- Vor Migration: On-Premises-Inventar + Abhängigkeiten erfassen → **Application Discovery Service**.
- Arbeitet mit **Migration Hub** zusammen.
- **Abgrenzung:** Discovery = **herausfinden, was da ist** (Planung); MGN/DMS = der eigentliche Umzug.

---

## AWS Migration Hub

**Metapher / Konzept**

> Die zentrale Kommandozentrale, die dir den Überblick über deinen gesamten Cloud-Umzug auf einem Bildschirm gibt.

**Das Problem & Die Lösung**

Eine Firma zieht nicht eine Sache um, sondern ihr **ganzes Rechenzentrum**: 200 Server, 50 Datenbanken, dutzende Anwendungen. Für die einzelnen Umzüge gibt es Spezial-Werkzeuge (DMS für Datenbanken, MGN für Server). Aber: Welcher Server ist schon umgezogen? Welche DB steckt mittendrin? Was hängt voneinander ab? Zeigt jedes Werkzeug seinen Status in einem eigenen Fenster, hat der Projektleiter **keinen Gesamtüberblick** mehr.

**Migration Hub** ist die zentrale Übersichts- und Steuerzentrale:
- **Zentrales Tracking:** ein Dashboard zeigt den Status jeder Anwendung und jedes Servers — „migriert", „in Arbeit", „noch nicht gestartet".
- **Discovery (Bestandsaufnahme):** hilft vorab herauszufinden, was im RZ läuft und welche Server voneinander abhängen.
- **Werkzeuge bündeln:** die eigentlichen Umzüge laufen weiter über DMS/MGN — Migration Hub **überwacht und koordiniert** sie nur zentral.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Migration zentral verfolgen", „Überblick über den gesamten Umzug", „Fortschritt mehrerer Migrationen an einem Ort" → **Migration Hub**.
- **Abgrenzung:** Migration Hub macht den Umzug **nicht selbst** — er überwacht ihn zentral. **Merksatz: Migration Hub = der Bildschirm in der Leitstelle, DMS/MGN = die Umzugswagen.**

---

## AWS Application Migration Service (MGN)

**Metapher / Konzept**

> Der automatische Umzugshelfer, der komplette Server samt allem, was darauf läuft, originalgetreu in die AWS-Cloud verfrachtet.

**Das Problem & Die Lösung**

Eine Firma will ihr Rechenzentrum nach AWS migrieren — nicht nur Datenbanken (das macht DMS), sondern **komplette Server**: Betriebssystem, installierte Anwendung, alle Konfigurationen, Abhängigkeiten. Alles von Hand nachzubauen wäre für hunderte Server extrem aufwendig und fehleranfällig. Du willst den Server **so wie er ist (Lift-and-Shift / Rehost)** in die Cloud heben, ohne ihn umzubauen.

**MGN** ist der **empfohlene Hauptdienst für Lift-and-Shift-Migrationen** von Servern:
- **Block-Level-Replikation:** kleiner Agent auf dem Quellserver → MGN kopiert kontinuierlich den kompletten Server (OS, App, Daten) live nach AWS, **während er weiterläuft**.
- **Automatische Umwandlung:** beim Umschalten (**Cutover**) konvertiert MGN das Ganze automatisch in eine lauffähige **EC2-Instanz** — kein manuelles Nachbauen.
- **Minimale Ausfallzeit** + **Test vorab** (migrierten Server testen, bevor du final umschaltest).

**Die Migrations-Familie sortieren (SAA-relevant!):** **MGN** = ganze Server (OS + App) — Lift-and-Shift/Rehost. **DMS** = nur Datenbanken. **Snow Family** = große Datenmengen offline per Hardware. **Merksatz: MGN zieht ganze Server um, DMS nur Datenbanken, Snow transportiert Datenmassen per Post.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Server migrieren", „Lift-and-Shift / Rehost", „komplette Anwendung/VM in die Cloud", „minimale Ausfallzeit beim Server-Umzug" → **MGN**.
- MGN vs. DMS: ganze Server → MGN. Nur Datenbanken → DMS.

🛑 **Pro-Tipp SAA — die 7 R's der Migration:** MGN ist die typische Antwort für **Rehost** („Lift-and-Shift"). Die Prüfung testet gern die Migrations-Strategien: **Rehost** (unverändert umziehen), **Replatform** („Lift-and-Reshape", kleine Optimierungen, z. B. auf RDS), **Repurchase** (auf SaaS wechseln), **Refactor** (neu bauen/cloud-native), **Retire** (abschalten), **Retain** (vorerst behalten), **Relocate** (VMware-Umzug). Signalwort „schnellster Umzug ohne Änderungen" → Rehost → MGN.

---

## AWS DMS (Database Migration Service)

**Metapher / Konzept**

> Der Umzugsdienst, der deine Datenbank in die Cloud verfrachtet — und das Geschäft läuft währenddessen ungestört weiter.

**Das Problem & Die Lösung**

Eine laufende Datenbank umzuziehen ist wie einen Motor im Flug zu wechseln: Sie ist das **Herz des laufenden Geschäfts**, darf nicht stundenlang offline gehen — und während du gigantische Datenmengen kopierst, kommen ständig **neue, sich ändernde Daten** rein. Wie kopiert man etwas, das sich permanent bewegt, ohne Datenverlust und ohne Ausfallzeit?

**DMS** migriert Datenbanken nach AWS **mit minimaler oder gar keiner Ausfallzeit**. Der Clou: DMS kopiert nicht nur einmal die vorhandenen Daten, sondern führt anschließend **alle laufenden Änderungen kontinuierlich nach (Change Data Capture)**, bis Quelle und Ziel synchron sind. Erst dann schaltet man final um — die Quell-DB bleibt die ganze Zeit online. Zwei Migrations-Arten:
- **Homogen (gleiche Engine):** Oracle → Oracle, MySQL → MySQL. Einfacher 1:1-Umzug.
- **Heterogen (andere Engine):** die teure Oracle-DB → günstiges **Amazon Aurora**. Hier hilft der Partner **AWS SCT** (Schema Conversion Tool), das vorher die Struktur ins neue Format übersetzt.

**Praxis:** Firma will weg von teuren Oracle-Lizenzen. **SCT** übersetzt zuerst das Schema nach Aurora-PostgreSQL → **DMS** zieht die Daten um und hält sie live synchron, während das Altsystem weiterläuft → am Stichtag wird umgeschaltet. Kaum jemand merkt etwas.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Datenbank migrieren", „minimale Ausfallzeit", „Quelle bleibt während Migration verfügbar" → **DMS**.
- **Homogen vs. heterogen:** gleiche Engine = direkt mit DMS. Andere Engine = **DMS + SCT**.
- Kernvorteil: **kontinuierliche Replikation** → die DB bleibt während des Umzugs online.

---

## AWS Schema Conversion Tool (SCT)

**Metapher / Konzept**

> Der Übersetzer für Datenbank-Sprachen — er wandelt das Schema einer Datenbank in das Format einer anderen Datenbank-Engine um.

**Das Problem & Die Lösung**

Bei einer **heterogenen** Datenbankmigration (andere Engine → z. B. Oracle zu Aurora PostgreSQL) passt das Schema **nicht 1:1**: Datentypen, gespeicherte Prozeduren, Funktionen, Trigger sind unterschiedlich. Die reinen **Daten** kann DMS umziehen — aber die **Struktur/Logik** muss erst übersetzt werden.

**SCT** konvertiert das Datenbankschema (Tabellen, Datentypen, gespeicherte Prozeduren, Code) von der Quell- in die Ziel-Engine und zeigt an, welche Teile **automatisch** konvertiert wurden und welche **manuell** nachbearbeitet werden müssen:
- **Heterogene Migration ermöglichen:** macht den Engine-Wechsel erst praktikabel.
- **Zusammenspiel mit DMS:** SCT wandelt zuerst das Schema um → dann zieht DMS die Daten um.

**Merksatz: SCT übersetzt die Struktur (Schema), DMS transportiert die Daten.**

**⚠️ Prüfungs-Knackpunkte**
- Schema bei Wechsel der DB-Engine umwandeln (heterogen) → **SCT**.
- Homogen (gleiche Engine) = nur DMS. Heterogen (andere Engine) = **SCT + DMS**.

---

## AWS Snow Family

**Metapher / Konzept**

> Die physischen Datentransporter — robuste Boxen, die AWS dir per Post schickt, wenn das Internet für deine Datenmengen zu langsam ist.

**Das Problem & Die Lösung**

Du musst **petabyteweise** Daten in die Cloud bringen (Filmstudio mit 500 TB, ganzes RZ). Selbst mit guter Leitung würde der Upload von 100 TB **Wochen bis Monate** dauern — und die Leitung wäre verstopft. Oder die Daten entstehen an einem Ort **ganz ohne brauchbares Internet** (Schiff, Ölplattform, Fabrik im Nirgendwo).

Die **Snow Family** dreht den Spieß um: AWS schickt dir ein robustes physisches Gerät per Spedition. Du füllst es vor Ort und schickst es zurück — AWS lädt den Inhalt in **S3** (alles verschlüsselt, für große Mengen viel schneller als jede Leitung). Die Mitglieder:
- **AWS Snowcone:** der kleinste Transporter — winzig, robust, tragbar (wenige TB). Für kleine Mengen, mobile/raue Einsätze (z. B. an einer Drohne).
- **AWS Snowball:** der Standard-Koffer (Dutzende bis ~80 TB). Zwei Varianten: **Storage Optimized** (vor allem Datentransport) und **Compute Optimized** (kann vor Ort auch rechnen — Edge Computing ohne Internet).
- **AWS Snowmobile:** der LKW (war für Exabytes gedacht — ein 14-m-Container auf einem Sattelschlepper). **Hinweis: eingestellt**, kann aber in Prüfungsfragen noch als „Lösung für extrem große Datenmengen" auftauchen.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „große Datenmengen (TB/PB) übertragen", „Internetleitung zu langsam", „physisches Gerät", „Standort ohne Internet", „Offline-Datentransfer" → **Snow Family**.
- **Größenordnung entscheidet:** klein/mobil = Snowcone, Standard (TB) = Snowball, gigantisch = Snowmobile.
- **Snowball Compute Optimized** kann vor Ort rechnen (Edge ohne Internet) — beliebtes Detail.
- **Abgrenzung zu DMS:** DMS = Datenbanken online migrieren. Snow Family = große Mengen offline per Post. **Merksatz: DMS fließt durchs Kabel, Snow fährt mit dem LKW.**

> **🧠 Mini-Merkkasten (wortgetreu):** Die zwei wichtigsten Architektur-Muster: **Serverlose API:** API Gateway → Lambda → DynamoDB. **Fan-Out:** SNS → mehrere SQS-Queues.

🛑 **Aktualität (verifiziert):** Neben dem eingestellten Snowmobile hat AWS im Nov 2025 auch **Snowball Edge Compute Optimized und Storage Optimized** in die **Maintenance-Phase** überführt — für **Bestandskunden** weiter nutzbar, für **neue Projekte** empfiehlt AWS andere Optionen (z. B. **DataSync** über die Leitung, wo möglich). **Fürs Examen bleibt Snow Family der Standard-Begriff für Offline-Massen-Transfer** — aber gut zu wissen, dass die Familie schrumpft.

---

## Snow Family im Detail

**Metapher / Konzept**

> Die drei physischen Transporter in verschiedenen Größen — von der Brotdose bis zum LKW — für Offline-Datentransfer und Edge-Computing.

**Die drei Mitglieder im Detail (deine Karte, wortgetreu):**

- **AWS Snowcone:** der Winzling — klein, leicht (ca. 2 kg), tragbar, robust. Speicher im Bereich einiger TB (~8–14 TB). Für kleine Mengen und mobile/raue Einsätze (Drohne, Geländewagen, entlegene Orte). Kann auch etwas **Edge-Computing**.
- **AWS Snowball Edge:** der Standard-Koffer — die häufigste Wahl, mehrere Dutzend TB (bis ~80 TB nutzbar). Zwei Varianten: **Storage Optimized** (maximaler Speicher, Datentransport) und **Compute Optimized** (mehr Rechenleistung, kann vor Ort richtig rechnen — ML-Inferenz oder Datenvorverarbeitung ohne Internet).
- **AWS Snowmobile:** der LKW — ein 14-m-Sattelschlepper-Container für Exabyte-Mengen (bis ~100 PB pro Truck), gedacht für ganze Rechenzentren. **Hinweis: eingestellt**, kann in Prüfungsfragen noch auftauchen.

**Praxis:** Die Größe der Datenmenge bestimmt die Wahl — wenige TB (Snowcone), Dutzende TB (Snowball), Exabyte (Snowmobile). Alle: Daten lokal draufladen → zurückschicken → AWS lädt in S3, alles verschlüsselt.

**⚠️ Die Prüfungs-Knackpunkte**
- Größe = Wahl: klein/mobil → **Snowcone**, normal (TB) → **Snowball**, gigantisch (PB/EB) → **Snowmobile**.
- Snowball Compute Optimized = Edge-Rechnen ohne Internet.
- Signalwort „Internet zu langsam / kein Internet / Offline-Transfer großer Mengen" → **Snow Family**.

---

## Disaster Recovery Strategien

**Metapher / Konzept**

> Vier Rettungspläne fürs Rechenzentrum — von billig-und-langsam bis teuer-und-sofort, je nachdem wie viel Ausfall du dir leisten kannst.

**Die zwei Schlüsselbegriffe zuerst (DIE Prüfungsfrage!):**
- **RPO (Recovery Point Objective):** Wie viel **Datenverlust** verkraftest du? Der Zeitpunkt, bis zu dem Daten nach einem Ausfall wiederhergestellt sind. RPO = 1 Stunde → im schlimmsten Fall verlierst du die letzte Stunde an Daten. Bestimmt, wie oft du sichern/replizieren musst. **Merke: RPO blickt zurück (vergangene Daten).**
- **RTO (Recovery Time Objective):** Wie lange darf die **Wiederherstellung** dauern? Die maximal tolerierbare Ausfallzeit. RTO = 2 Stunden → nach spätestens 2 Stunden muss das System wieder online sein. **Merke: RTO blickt vorwärts (Zeit bis Betrieb).**
- **Faustregel: Je kleiner RPO/RTO gefordert, desto teurer die DR-Strategie.**

**Die vier DR-Strategien (von billig/langsam zu teuer/sofort):**
- **Backup & Restore:** nur regelmäßige Backups (z. B. nach S3/Glacier). Im Katastrophenfall baust du alles neu auf und spielst die Backups ein. **Billigste Option, langsamste Wiederherstellung** (hohes RTO, Stunden bis Tage). Für unkritische Systeme.
- **Pilot Light:** die **Kernkomponenten** laufen permanent minimal mit (die replizierte DB ist immer aktuell, aber die App-Server sind aus). Im Ernstfall „zündet" man die restliche Infrastruktur hoch. Günstig, schneller als Backup & Restore. *Bild: Die Zündflamme brennt schon, man dreht nur das Gas auf.*
- **Warm Standby:** eine **verkleinerte, aber voll funktionsfähige** Kopie der gesamten Umgebung läuft ständig mit (alles da, nur kleiner). Im Ernstfall skaliert man auf volle Größe. Teurer, **sehr schnelles Failover** (Minuten).
- **Multi-Site Active-Active (Hot Standby):** eine **vollwertige zweite Umgebung** läuft parallel in Vollbetrieb und verarbeitet schon Live-Traffic. Bei Ausfall übernimmt die andere Seite nahtlos (RTO/RPO nahe null). **Teuerste, schnellste Lösung** (Banken).

**⚠️ Prüfungs-Knackpunkte**
- **RPO = Datenverlust** (wie viel futsch), **RTO = Ausfallzeit** (wie lange down). **Nicht verwechseln!**
- Billigste / höchstes RTO → **Backup & Restore**. Schnellste / teuerste / ~0 Ausfall → **Multi-Site Active-Active**.
- Guter Kompromiss, Kern läuft mit → **Pilot Light** (Daten live, Rest aus) oder **Warm Standby** (alles klein, aber läuft).
- Querverweis: **DRS** setzt typischerweise **Pilot Light / Warm Standby** um.

---

## AWS Elastic Disaster Recovery (DRS)

**Metapher / Konzept**

> Der automatische Notfallknopf, der eine ständig bereitgehaltene Kopie deiner Server in AWS vorhält und bei einer Katastrophe blitzschnell hochfährt.

**Das Problem & Die Lösung**

Das Rechenzentrum fällt komplett aus — Brand, Hochwasser, Stromausfall, Ransomware. Die gesamte IT steht. Für Krankenhaus/Bank/Online-Händler bedeutet jede Stunde riesige Schäden. Die klassische Absicherung — ein **zweites komplettes Rechenzentrum** in Vollbetrieb — kostet Unsummen, obwohl es normalerweise Däumchen dreht. Du brauchst **schnelle Wiederherstellung ohne teure Vollreserve**.

**DRS** repliziert deine Server (aus dem eigenen RZ oder aus AWS) kontinuierlich nach AWS und hält dort eine **startbereite Kopie** vor — **kostengünstig**, weil im Normalbetrieb nur günstiger Speicher genutzt wird:
- **Kontinuierliche Replikation** (Block-Level) → die Kopie ist immer aktuell.
- **Günstige Bereitschaft (Pilot Light / Warm Standby):** im Normalfall nur minimale, billige Infrastruktur.
- **Schnelles Failover:** im Ernstfall fährt DRS in **Minuten** vollwertige EC2-Instanzen aus der Kopie hoch.
- **Failback:** ist das Original-RZ repariert, kann man kontrolliert zurückwechseln.

**Die wichtige Abgrenzung — DRS vs. MGN (beide replizieren Server!):** **MGN** = **einmalige** Migration, du ziehst Server dauerhaft nach AWS um (danach fertig). **DRS** = **laufende** Notfall-Absicherung, die Server bleiben normal am Ursprungsort, AWS ist die bereitgehaltene Reserve. **Merksatz: MGN zieht dauerhaft um (Migration). DRS hält eine Notfall-Kopie bereit (Disaster Recovery).**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Disaster Recovery", „Notfallwiederherstellung", „RTO/RPO minimieren", „kostengünstige DR-Strategie", „Failover nach AWS" → **DRS**.
- DRS vs. MGN: Notfall-Absicherung (laufend bereithalten) → DRS. Dauerhafte Migration (einmal umziehen) → MGN.
- DRS setzt typischerweise **Pilot Light / Warm Standby** um.

> **🧠 Mini-Merkkasten dieser vier (wortgetreu):** **Streaming/Messaging:** MSK (Kafka behalten) ↔ Kinesis (AWS-nativ) — wie MQ ↔ SQS/SNS. **KI fertig vs. selbstgebaut:** Translate/Fraud Detector/Rekognition/Comprehend (fertige API) ↔ SageMaker (eigenes Modell). **KI-Betrug vs. Infra-Bedrohung:** Fraud Detector (App-Nutzer-Betrug) ↔ GuardDuty (AWS-Infrastruktur-Angriffe). **Server-Replikation:** MGN (dauerhafte Migration) ↔ DRS (Notfall-Reserve). **Sprach-KI-Richtungen:** Translate (übersetzen) ↔ Comprehend (verstehen) ↔ Transcribe (Audio→Text) ↔ Polly (Text→Audio).

---

## AWS Resilience Hub

**Metapher / Konzept**

> Der Belastungstest für deine Architektur — er prüft und misst, ob deine Anwendung deine Ausfall-Ziele (RTO/RPO) wirklich erfüllt.

**Das Problem & Die Lösung**

Du **glaubst**, deine Anwendung ist ausfallsicher — aber stimmt das? Erfüllt sie die geforderten **RTO/RPO** wirklich? Hält sie einem AZ- oder Regionsausfall stand? Ohne gezielte Prüfung weißt du es erst im echten Notfall — zu spät.

**Resilience Hub** bewertet und verbessert die **Ausfallsicherheit (Resilience)** deiner Anwendungen. Du definierst deine Resilienz-Ziele (RTO/RPO), und der Dienst:
- **Bewertet** deine Architektur gegen diese Ziele und deckt Schwachstellen auf („deine DB-Wiederherstellung dauert länger als dein RTO erlaubt").
- **Gibt Empfehlungen** zur Verbesserung (z. B. Multi-AZ, Backups).
- **Testet mit Fault Injection** (Chaos Engineering, via **FIS**) das Verhalten bei simulierten Ausfällen.
- **Überwacht** kontinuierlich den Resilienz-Status.

**Die Abgrenzung zum Well-Architected Tool:** **Well-Architected Tool** (Karte 95) = breite Bewertung über **alle 6 Säulen**. **Resilience Hub** = spezialisiert nur auf die Säule **Reliability/Resilienz** — misst konkret RTO/RPO und testet Ausfallszenarien. **Merksatz: Well-Architected = Gesamt-Check aller Säulen; Resilience Hub = Tiefenprüfung speziell für Ausfallsicherheit.**

**⚠️ Prüfungs-Knackpunkte**
- RTO/RPO prüfen, Ausfallsicherheit testen/bewerten → **Resilience Hub**.
- Resilience Hub (nur Reliability, RTO/RPO) ↔ Well-Architected Tool (alle 6 Säulen).
- SAA-Randthema; Stichwort „Resilienz messen / RTO-RPO validieren" zuordnen.

---

*Ende Kapitel 11 — Migration & Disaster Recovery.*
