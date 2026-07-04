# Kapitel 9 — Anwendungsintegration

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne:** Das große Architekturprinzip heißt **Entkopplung (Decoupling)** — Dienste sollen nicht direkt verdrahtet sein, sonst reißt einer den anderen mit. Dieses Kapitel liefert den „Klebstoff", und die Prüfung fragt immer: **Welche Kommunikations-Form braucht das Szenario?**

| Form | Dienst | Bild |
|---|---|---|
| Puffern, 1 → 1, abholen | **SQS** | Warteschlange |
| Verteilen, 1 → viele, zustellen | **SNS** | Lautsprecher |
| Auf Ereignisse reagieren, zeitgesteuert | **EventBridge** | Nervenbahn |
| Mehrstufigen Ablauf steuern | **Step Functions** | Regisseur |
| Anfragen von außen kontrolliert reinlassen | **API Gateway** | Empfangshalle |
| Klassischen Broker migrieren | **Amazon MQ** | alter Briefkasten |
| SaaS-Daten ohne Code anbinden | **AppFlow** | Datenbrücke |

---

## Amazon SQS (Simple Queue Service)

**Metapher / Konzept**

> Die geduldige Warteschlange, die Aufgaben zwischenparkt, bis jemand Zeit hat, sie abzuarbeiten.

**Das Problem & Die Lösung**

Ein Online-Shop: Der Bestell-Service ruft **direkt** den Versand-Service auf. Solange beide laufen, super. Aber: Der Versand-Service stürzt für 10 Minuten ab → **jede Bestellung in diesen 10 Minuten läuft ins Leere** — Kunden haben bezahlt, es wird nie versandt. Oder Black Friday: 10.000 Bestellungen/Minute prasseln rein, der Versand schafft 1.000 und erstickt. Das Problem: **tight coupling** — fällt einer, fällt alles.

**SQS** schiebt eine **Warteschlange (Queue)** dazwischen: Der Bestell-Service legt jede Bestellung als Nachricht in die Queue — fertig. Der Versand-Service **holt sie sich, wann er Zeit hat**. Das ist **Entkopplung (decoupling)**:
- **Crash-sicher:** Fällt der Versand aus, warten die Nachrichten geduldig — nichts geht verloren. Kommt er zurück, arbeitet er den Stau ab.
- **Lastspitzen abfedern (Buffer):** Die Queue füllt sich mit 10.000 Nachrichten, der Versand arbeitet in seinem Tempo. Die Spitze wird **abgepuffert statt durchgereicht**.
- **Ein Empfänger pro Nachricht:** Eine Nachricht wird von **genau einem** Verarbeiter genommen und danach gelöscht. *(Der Kernunterschied zu SNS!)*

**Praxis — das klassische Bild:** SQS-Queue zwischen einem Produzenten und einer **Auto-Scaling-Gruppe** von Verarbeitern. Queue lang → mehr Worker; Queue leer → runterfahren. Das System skaliert automatisch mit der Last.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Queue", „entkoppeln / decouple", „Nachrichten zwischenspeichern", „Lastspitzen abpuffern", „keine Nachricht verlieren" → **SQS**.
- Kernmodell: **1 Nachricht → 1 Empfänger, Pull-Prinzip** (Verarbeiter holen sich die Arbeit ab).
- Nachrichten warten geduldig, **bis zu 14 Tage** — das macht das System ausfallsicher.
- **Eselsbrücke:** Queue → SQS → Warteschlange.

🛑 **Pro-Tipp SAA:** Aufbewahrung default **4 Tage** (max. 14), Nachrichtengröße max. **256 KB** (größer → Verweis auf S3). Und **Long Polling** merken: Der Verarbeiter wartet bis zu 20 s auf Nachrichten, statt pausenlos leer anzufragen — weniger API-Calls, weniger Kosten. Signalwort „leere Antworten/Kosten beim Abfragen reduzieren" → Long Polling.

---

## Amazon SNS (Simple Notification Service)

**Metapher / Konzept**

> Der Lautsprecher, der eine Nachricht gleichzeitig an alle Abonnenten ausruft.

**Das Problem & Die Lösung**

Eine Bestellung geht ein — und **mehrere Systeme** müssen es gleichzeitig erfahren: Lager packen, Buchhaltung Rechnung erstellen, Kunde E-Mail, Analyse-System Statistik. Mit SQS umständlich — eine Nachricht geht ja nur an **einen** Empfänger.

**SNS** arbeitet nach dem **Publish/Subscribe-Modell (Pub/Sub)**: Du erstellst ein **Topic** (einen „Kanal"), mehrere Empfänger **abonnieren** es. Wird eine Nachricht gepublisht, bekommt sie **sofort jeder Abonnent gleichzeitig** — wie eine Lautsprecher-Durchsage. Empfänger können sein: **SQS-Queues, Lambda-Funktionen, E-Mail, SMS, HTTP-Endpunkte**.

**Der fundamentale Unterschied zu SQS:**
- **SNS:** eine Nachricht → **alle Abonnenten** (1-zu-viele), aktiv hingeschickt (**Push**).
- **SQS:** eine Nachricht → **ein Verarbeiter** (1-zu-1), abgeholt (**Pull**).

**Praxis — das berühmte „Fan-Out"-Muster (Königsdisziplin der Prüfung):** Eine Bestellung → **SNS-Topic** → mehrere **abonnierte SQS-Queues** (Lager, Buchhaltung, Analyse). SNS verteilt an alle gleichzeitig, jedes System arbeitet seine eigene Queue **in Ruhe und ausfallsicher** ab. **Beides zugleich: Breitenverteilung von SNS + Puffersicherheit von SQS.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Notification", „Pub/Sub", „Topic", „eine Nachricht an mehrere Empfänger", „Fan-Out", „SMS/E-Mail/Push" → **SNS**.
- **Die Killer-Abgrenzung SQS vs. SNS (kommt fast garantiert!):** SQS = Warteschlange, 1→1, Pull, Nachrichten warten. SNS = Megafon, 1→viele, Push, sofort raus.
- **Fan-Out = SNS + SQS kombiniert** — das Lieblings-Architekturmuster der Prüfung.
- **Eselsbrücke:** SNS → **N**otification → benachrichtigt viele auf einmal.

---

## SQS & SNS Details

**Metapher / Konzept**

> Die Feinheiten der Warteschlange und des Lautsprechers — die Details, die in der Prüfung den Unterschied machen.

**SQS-Details (deine Karte, wortgetreu):**

- **Zwei Queue-Typen:**
  - **Standard Queue:** maximaler Durchsatz, aber **mindestens-einmal**-Zustellung (selten Duplikate) und **keine garantierte Reihenfolge**.
  - **FIFO Queue (First-In-First-Out):** **garantierte Reihenfolge + exakt-einmal-Verarbeitung** (keine Duplikate) — dafür begrenzter Durchsatz. Für Fälle, wo Reihenfolge zählt (Finanztransaktionen). **Stichwort „Reihenfolge/keine Duplikate" → FIFO.**
- **Visibility Timeout:** Holt ein Verarbeiter eine Nachricht, wird sie **für andere unsichtbar** — damit nicht zwei Worker dieselbe bearbeiten. Erfolgreich verarbeitet → gelöscht; nicht rechtzeitig geschafft → wieder sichtbar, ein anderer übernimmt. **Zu kurz → Doppelverarbeitung; zu lang → Verzögerung bei Fehlern.**
- **Dead-Letter Queue (DLQ):** die separate **„Auffang"-Queue** für Nachrichten, die mehrfach nicht verarbeitet werden konnten. Statt ewig zu kreisen, landen sie nach X Versuchen in der DLQ zur Analyse. **Verhindert, dass eine kaputte Nachricht das System blockiert.** Stichwort „fehlgeschlagene Nachrichten isolieren" → DLQ.

**SNS-Details (deine Karte, wortgetreu):**

- **Topic & Subscriptions:** Sender publisht an ein Topic, viele Empfänger (SQS, Lambda, E-Mail, SMS, HTTP) abonnieren.
- **Fan-Out-Muster:** SNS-Topic → mehrere SQS-Queues — Breitenverteilung + Puffersicherheit in einem.
- **Message Filtering:** Abonnenten erhalten per Filter nur bestimmte Nachrichten eines Topics (z. B. nur Bestellungen aus „DE").

**⚠️ Prüfungs-Knackpunkte**
- Reihenfolge wichtig / keine Duplikate → **SQS FIFO Queue**.
- Zwei Worker sollen nicht dieselbe Nachricht bearbeiten → **Visibility Timeout**.
- Fehlerhafte Nachrichten auffangen → **Dead-Letter Queue (DLQ)**.
- Eine Nachricht an mehrere Systeme verteilen + puffern → **Fan-Out (SNS → mehrere SQS)**.

---

## Amazon EventBridge

**Metapher / Konzept**

> Die zentrale Nervenbahn, die auf Ereignisse aus ganz AWS lauscht und automatisch die richtige Reaktion auslöst.

**Das Problem & Die Lösung**

Ständig passieren in deinem Konto **Ereignisse**: EC2 startet, Datei landet in S3, GuardDuty meldet einen Vorfall, ein Backup ist fertig. Du willst, dass **automatisch etwas folgt**: „Wenn GuardDuty Alarm schlägt → isoliere die Instanz." Oder zeitgesteuert: „Jeden Tag um 2 Uhr → Backup." Selbst überwachen und verdrahten? Riesenaufwand.

**EventBridge** ist ein **serverloser Event-Bus** — eine zentrale Leitung, durch die Ereignisse fließen. Du definierst **Regeln (Rules)**: „WENN dieses Ereignis, DANN jene Aktion":
- **Lauscht auf fast ganz AWS:** über 100 Dienste schicken automatisch ihre Ereignisse.
- **Filtert intelligent:** Regeln erkennen ein **Ereignismuster** („nur EC2 → Status stopped") und leiten nur diese an ein Ziel — **Lambda, SNS-Topic, SQS-Queue**.
- **Zeitplan-Funktion (Scheduler):** zeitgesteuerte Aktionen („jeden Montag 8 Uhr") — der Nachfolger der alten „CloudWatch Events".
- **Partner-Events:** sogar SaaS-Anbieter (Zendesk, Shopify) speisen Ereignisse ein.

**Praxis:** GuardDuty erkennt kompromittierte Instanz → Finding-Event → EventBridge-Regel → **Lambda isoliert die Instanz vom Netz**. Vollautomatische Reaktion in Sekunden. EventBridge ist der „Klebstoff" der **ereignisgesteuerten Architektur (event-driven architecture)**.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Event-driven", „auf Ereignisse reagieren", „Regeln basierend auf Events", „zeitgesteuert/Scheduled (Cron)" → **EventBridge**.
- **Abgrenzung zu SNS (die feine Falle!):** SNS = einfaches Megafon, **du schickst aktiv**. EventBridge = **reagiert intelligent auf Ereignisse** aus AWS, mit Filterregeln und 100+ Diensten. **Merksatz: SNS rufst du selbst, EventBridge lauscht von alleine auf ganz AWS.**
- „Zeitplan / jeden Tag um X Uhr / Cron-Job" → **EventBridge (Scheduler)**.
- „Auf einen GuardDuty/S3/EC2-Zustand automatisch reagieren" → **EventBridge**.

> **🧠 Der ultimative Merkkasten: Das Integration-Trio (DIE Verwechslungsfrage! — wortgetreu)** — Selbsttest zur Kontrolle:
> - „Bestellungen zwischenpuffern, damit keine verloren geht" → **SQS**
> - „Bei jeder Bestellung gleichzeitig 4 Systeme informieren" → **SNS** (bzw. Fan-Out = SNS+SQS)
> - „Jede Nacht um 3 Uhr automatisch ein Backup starten" → **EventBridge**
> - „Wenn GuardDuty Alarm schlägt, automatisch Lambda auslösen" → **EventBridge**

---

## AWS Step Functions

**Metapher / Konzept**

> Der Regisseur, der viele einzelne Dienste zu einem geordneten Workflow zusammenschnürt — mit Ablaufplan, Wartezeiten und Notfallplänen.

**Das Problem & Die Lösung**

Ein mehrstufiger Geschäftsprozess — Bestellabwicklung: 1. Zahlung prüfen → 2. Lager reservieren → 3. wenn vorrätig versenden, sonst Kunde benachrichtigen → 4. Rechnung → 5. bei Fehler 3× wiederholen, dann Support alarmieren. Jeder Schritt eine eigene Lambda. Die Logik in den Code programmieren? Dann ist sie **im Code vergraben**, niemand blickt durch — und stürzt ein Schritt ab, weißt du nicht mal, **wo** der Prozess hängt.

**Step Functions** ist ein **Orchestrierungsdienst für Workflows**: Du definierst den Ablauf als **State Machine** (Zustandsautomat) — ein Flussdiagramm aus Schritten (States). Step Functions führt sie in der richtigen Reihenfolge aus:
- **Reihenfolge & Verzweigungen:** „Mach A, dann B. Wenn X → C, sonst D."
- **Fehlerbehandlung & Wiederholungen:** automatisches **Retry**, definierte Notfallpfade (**Catch**).
- **Wartezeiten:** „Warte 24 Stunden, dann weiter" — ohne dass irgendwo teuer ein Server läuft.
- **Visuell sichtbar:** Live-Diagramm — welcher Schritt läuft, welcher ist fertig, wo klemmt es. Perfekt zum Überwachen und Debuggen.

**Die Prüfungsfalle — Step Functions vs. EventBridge:** **EventBridge** = reagiert auf **ein einzelnes Ereignis** → eine Reaktion. Reaktiv. **Step Functions** = steuert einen **kompletten mehrstufigen Ablauf** mit Logik, Reihenfolge, Fehlerbehandlung. **Merksatz: EventBridge ist der Türklingel-Knopf (ein Ereignis → eine Reaktion). Step Functions ist das Drehbuch für den ganzen Film.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Workflow", „orchestrieren", „mehrere Schritte koordinieren", „State Machine", „mehrere Lambda-Funktionen verbinden" → **Step Functions**.
- Mehrstufiger Ablauf mit Logik → Step Functions. Einzelnes Ereignis → EventBridge.
- Häufiger Partner: koordiniert **mehrere Lambdas** zu einem Gesamtprozess. *(Und: Lambda-Limit 15 Minuten überschreiten → Step Functions, siehe Compute-Kapitel.)*

🛑 **Pro-Tipp SAA — die zwei Workflow-Typen:** **Standard Workflows** = langlaufend (bis zu **1 Jahr**), exactly-once, voller Audit-Verlauf — für Geschäftsprozesse. **Express Workflows** = kurz (**max. 5 Minuten**), extrem hoher Durchsatz, günstiger — für massenhafte Event-Verarbeitung/IoT. Signalwort „hochvolumig + kurzlebig" → Express; „langlaufend + nachvollziehbar" → Standard.

---

## Amazon API Gateway

**Metapher / Konzept**

> Die Empfangshalle mit Pförtner, durch die jede Anfrage von außen muss, bevor sie deine Backend-Dienste erreicht.

**Das Problem & Die Lösung**

Deine App muss mit dem Backend reden (z. B. einer Lambda). Aber du kannst die Lambda doch nicht **nackt ins Internet** stellen! Wer kümmert sich um **Authentifizierung** (wer darf anfragen?), **Überlastungsschutz** (1 Million Anfragen/Sekunde?), **API-Versionen** und die Übersetzung zwischen Außenwelt und internen Diensten? Selbst bauen = enormer Aufwand + Sicherheitsrisiko.

**API Gateway** ist die verwaltete **„Eingangstür" (Front Door)** für deine APIs — jede Anfrage läuft erst durchs Gateway:
- **Entgegennehmen & weiterleiten** ans richtige Backend (Lambda, EC2, andere Dienste).
- **Authentifizierung & Autorisierung** — oft zusammen mit **Cognito** für Nutzer-Logins!
- **Throttling (Drosselung):** begrenzt Anfragen pro Nutzer — schützt das Backend.
- **Caching:** häufige Antworten zwischenspeichern.
- **Versionierung:** mehrere API-Versionen parallel.

**Praxis — die berühmte serverlose Architektur:** **API Gateway + Lambda + DynamoDB.** App → Gateway (nimmt an, prüft Berechtigung) → Lambda (Logik) → DynamoDB (Daten) → Antwort zurück. **Komplett serverlos, kein Server zu verwalten, skaliert von 0 auf Millionen.** Dieses Trio musst du als „die serverlose API" im Kopf haben.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „API erstellen/verwalten/bereitstellen", „REST-API", „Front Door", „Throttling", „APIs sichern" → **API Gateway**.
- **Das serverlose Trio:** API Gateway (Eingang) → Lambda (Logik) → DynamoDB (Daten). Lieblings-Architektur der Prüfung.
- Sichern oft mit **Cognito**.
- **Eselsbrücke:** Gateway = Tor → der kontrollierte Eingang zu deinen APIs.

🛑 **Pro-Tipp SAA — die drei API-Typen:** **REST API** = voller Funktionsumfang (Caching, API Keys, Request-Validierung). **HTTP API** = die schlankere, **deutlich günstigere** Variante für einfache Lambda-/HTTP-Proxys (Signalwort „kostengünstigste API für Lambda"). **WebSocket API** = **bidirektionale Echtzeit**-Verbindungen (Chat, Live-Dashboards). Und die Grenze merken: API Gateway hat ein Default-Limit von **10.000 Anfragen/Sekunde** — kombiniert mit Lambdas 1.000er-Concurrency die klassische Throttling-Rechenfrage (siehe Lambda-Karte).

---

## Amazon MQ

**Metapher / Konzept**

> Der verwaltete klassische Briefkasten für Apps, die schon einen Standard-Message-Broker sprechen und ihn 1:1 in die Cloud mitnehmen wollen.

**Das Problem & Die Lösung**

Eine Firma migriert eine bestehende Unternehmensanwendung nach AWS. Die App nutzt seit Jahren einen klassischen **Message Broker** — **Apache ActiveMQ oder RabbitMQ**, mit Standard-Protokollen (**MQTT, AMQP, STOMP, JMS**). SQS/SNS wäre moderner — aber dann müsste man die App **umschreiben** (SQS/SNS sprechen eigene APIs, nicht diese Protokolle). Bei einer **„nur-umziehen, nicht-umbauen"**-Migration (Rehost/Lift-and-Shift) ein echtes Hindernis.

**Amazon MQ** ist ein **verwalteter Message-Broker für ActiveMQ und RabbitMQ**: AWS betreibt den Broker (Setup, Patches, HA), aber es ist die **echte, vertraute Broker-Software**:
- **Kompatibilität ohne Umbau:** Die bestehende App zieht fast unverändert um — nur die Broker-Adresse ändert sich.
- **Standard-Protokolle:** JMS, AMQP, MQTT, STOMP, OpenWire — genau was Altsysteme erwarten.
- **Verwaltet:** kein eigener Broker-Server mehr.

**Die zentrale Abgrenzung (sehr wichtig!) — Amazon MQ vs. SQS/SNS:** **SQS/SNS** = die cloud-native AWS-Lösung, erste Wahl für **neue** Anwendungen (serverlos, unbegrenzt skalierbar). **Amazon MQ** = wenn eine **bestehende** App bereits einen klassischen Broker/Standard-Protokolle nutzt und **ohne Code-Umbau** migrieren soll. **Merksatz: Neue App in AWS? → SQS/SNS. Alte App mit ActiveMQ/RabbitMQ migrieren ohne Umschreiben? → Amazon MQ.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „ActiveMQ", „RabbitMQ", „Standard-Messaging-Protokolle (AMQP, MQTT, JMS, STOMP)", „bestehenden Broker migrieren", „ohne Anwendung umzuschreiben" → **Amazon MQ**.
- **Eselsbrücke:** MQ = Message Queue im klassischen Industrie-Stil (zum Mitnehmen bestehender Systeme). *(Gleiches Muster wie Keyspaces↔DynamoDB: „Bestehende Open-Source-Technik behalten" → der kompatible Managed Service.)*

---

## Amazon AppFlow

**Metapher / Konzept**

> Die fertige Datenbrücke zwischen SaaS-Anwendungen und AWS — ohne eigenen Integrations-Code.

**Das Problem & Die Lösung**

Firmendaten liegen oft in **SaaS-Anwendungen**: Salesforce, SAP, Slack, Google Analytics, ServiceNow, Zendesk. Diese Daten will man nach AWS holen (z. B. nach **S3/Redshift** zur Analyse) — oder umgekehrt. Eine Integration selbst zu programmieren (API-Anbindung, Authentifizierung, Transformation) ist aufwendig und wartungsintensiv.

**AppFlow** ist ein vollständig verwalteter Integrationsdienst — Daten fließen **per Klick** zwischen SaaS-Apps und AWS, über **fertige Konnektoren, ohne Code**. Du richtest einen **„Flow"** ein (Quelle, Ziel, Zeitplan, optionale Transformation):
- **Fertige Konnektoren** für viele SaaS-Dienste (Salesforce, SAP, Slack, ...).
- **Kein Code:** Integration per Konfiguration, inkl. Filter/Transformation.
- **Sicher & geplant:** verschlüsselt, zeitgesteuert oder ereignisbasiert.

**Die Abgrenzung — AppFlow vs. Glue vs. Lambda:**
- **AppFlow** = fertige SaaS-↔-AWS-Integration ohne Code (Salesforce & Co.).
- **Glue** (Karte 56) = allgemeiner **ETL** (v. a. innerhalb AWS / Data Lakes), serverlos, mächtiger/technischer.
- **Lambda** = du programmierst beliebige Integration **selbst** (maximale Flexibilität, aber Code nötig).
- **Merksatz: AppFlow = SaaS-Daten ohne Code anbinden; Glue = ETL-Pipelines; Lambda = selbst programmieren.**

**⚠️ Prüfungs-Knackpunkte**
- Daten aus SaaS (Salesforce/SAP/Slack) ohne Code nach AWS → **AppFlow**.
- AppFlow (SaaS, fertig) ↔ Glue (ETL) ↔ Lambda (Custom-Code).

---

*Ende Kapitel 9 — Anwendungsintegration.*
