---
service: Amazon DynamoDB (inkl. DAX & Global Tables)
seedKey: saa-c03-script-dynamodb
batch: B2
domains: [D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html
  - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html
  - https://aws.amazon.com/blogs/database/new-amazon-dynamodb-lowers-pricing-for-on-demand-throughput-and-global-tables/
status: draft
---

# Amazon DynamoDB

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> DynamoDB = die **serverlose NoSQL-Maschine**: Key-Value/Dokument, single-digit-Millisekunden bei praktisch jeder Skalierung, kein Server, kein Patching. Partition Key (+ Sort Key), Design „query-first". On-Demand vs. Provisioned Capacity. TTL löscht Items gratis, Streams triggern Lambda. **DAX** = vorgeschalteter Mikrosekunden-Cache, **Global Tables** = multi-aktive Replikation über Regionen.

Der SAA rechnet nach: **Wie viele RCUs kostet dieser Read? Warum throttlet die Tabelle trotz freier Kapazität? Und seit wann ist On-Demand die offizielle Default-Empfehlung?**

---

## 🎯 SAA-Vertiefung

### Die Kapazitäts-Mathematik: RCUs und WCUs rechnen können

**Das Problem:** Die Prüfung stellt Rechenaufgaben: „Eine App liest 10 Items pro Sekunde, je 6 KB, strongly consistent — wie viele RCUs?"

**Die Lösung:** Die vier Grundregeln, aus denen sich alles ableitet:
- **1 RCU** = 1 **strongly consistent** Read/s für Items bis **4 KB** — oder **2 eventually consistent** Reads (eventual kostet die Hälfte!).
- **1 WCU** = 1 Write/s für Items bis **1 KB**.
- **Transaktional = doppelt** (2 RCU pro Read, 2 WCU pro Write).
- Größen werden **aufgerundet**: 6 KB sind 2 Lese-Blöcke (nicht 1,5).

Die Beispielrechnung: 6 KB → aufgerundet 2 × 4-KB-Blöcke → 10 Items/s × 2 = **20 RCU** (eventually consistent wären es 10). Wer die Aufrundung vergisst oder eventual/strong verwechselt, landet exakt bei einer der Distraktor-Zahlen — die sind darauf gebaut.

Dazu zwei harte Grenzen: **Ein Item darf maximal 400 KB groß sein** (inklusive Attributnamen!) — größere Payloads gehören nach **S3, mit einem Pointer im Item**. Und Tabellen starten mit Default-Quotas von 40.000 RCU/WCU (erhöhbar).

> **💡 Merksatz:** RCU = 4 KB (eventual = halber Preis), WCU = 1 KB, transaktional = doppelt, **immer aufrunden**. Item-Limit **400 KB** → große Objekte nach S3 + Pointer.

### Die Hot Partition: Wenn die Tabelle throttlet, obwohl Kapazität frei ist

**Das Problem:** Eine Tabelle hat 10.000 WCU provisioniert, nutzt davon 4.000 — und wirft trotzdem `ProvisionedThroughputExceededException`. Wie kann das sein?

**Die Lösung:** Kapazität ist ein **Tabellen**-Versprechen, aber die Physik passiert **pro Partition** — und jede Partition schafft maximal **3.000 RCU und 1.000 WCU** (und hält ~10 GB). Schreiben 5.000 Requests/s auf denselben Partition Key (der virale Promi-Account, das heutige Datum als Key…), quetschen sie sich durch **eine** Partition — die drosselt, egal wie viel die Tabelle insgesamt frei hat. Das ist die **Hot Partition**.

Die Antwort ist immer **Key-Design**: den Zugriff verteilen — z. B. **Write Sharding** (dem Key ein berechnetes Suffix geben: `2026-07-14#1` … `#10`) oder einen Partition Key mit natürlicher Streuung wählen. Die eingebaute **Adaptive Capacity** hilft bei *gradueller* Schieflage, rettet aber keinen plötzlichen Spike auf einen einzelnen Key. Und wichtig: Der Wechsel auf On-Demand hilft ebenfalls **nicht** — die Partition-Limits gelten dort genauso.

> **💡 Merksatz:** Throttling trotz freier Kapazität = **Hot Partition** (3.000 RCU / 1.000 WCU pro Partition). Heilung: **Key-Design/Write Sharding** — nicht mehr Kapazität, nicht On-Demand.

### On-Demand vs. Provisioned: Die Preiswende von 2024

**Das Problem:** Jahrelang lautete die Faustregel „Provisioned ist bei stetiger Last deutlich billiger, On-Demand nur für Unvorhersehbares". Stimmt das noch?

**Die Lösung:** 🛑 Nein — seit **01.11.2024** hat AWS **On-Demand um 50 % gesenkt** (und replizierte Global-Table-Writes um bis zu 67 %) und erklärt On-Demand seitdem offiziell zum **„default and recommended mode"** für die meisten Workloads. Die alte Faustregel ist damit selbst zum Distraktor geworden. Provisioned (+ Auto Scaling) bleibt sinnvoll für sehr hohe, sehr stetige Dauerlast — mit der bekannten Schwäche, dass Auto Scaling auf Spikes **verzögert** reagiert.

Für den Extremfall „Ticketverkauf startet um Punkt 10 Uhr mit 100-fachem Traffic" gibt es seit 🛑 11/2024 **Warm Throughput**: einsehen, wie viel Kapazität *sofort* verfügbar ist, und die Tabelle gezielt **vorwärmen** — die Antwort auf „ab Sekunde 1 volle Last, kein Scaling-Delay". Dazu fürs Sparen bei kalten Daten: die **Standard-IA Table Class** (günstigerer Storage, teurere Requests).

> **💡 Merksatz:** 🛑 Seit 11/2024 ist **On-Demand der empfohlene Default** (−50 %). Planbare Mega-Spitzen ab Sekunde 1 → **Warm Throughput vorwärmen**; Auto Scaling ist immer der Verspätete.

### GSI vs. LSI: Zwei Indexe, drei Fallen

**Das Problem:** „Die App muss die Bestellungen jetzt auch nach `status` abfragen — die Tabelle ist aber nach `customerId` designt."

**Die Lösung:** Sekundärindexe — und die Prüfung testet ihre Unterschiede:
- **GSI (Global Secondary Index):** komplett **eigener** Partition/Sort Key, **jederzeit** nachrüstbar, hat **eigene Kapazität** — aber liefert nur **eventually consistent** Reads. Falle Nummer eins: Ist die GSI-Kapazität zu klein, **throttlet sie auch die Writes der Basistabelle** (jeder Write muss ja in den Index).
- **LSI (Local Secondary Index):** gleicher Partition Key, anderer Sort Key, **nur bei Tabellenerstellung** anlegbar, teilt sich die Kapazität der Tabelle — und deckelt jede Partition-Key-Gruppe auf **10 GB** (Items + alle LSIs zusammen). Dafür kann er strongly consistent.

> **💡 Merksatz:** Neue Abfrage-Dimension nachträglich → **GSI** (eigene Kapazität, eventual — und unterdimensioniert bremst er die ganze Tabelle). **LSI** nur bei Erstellung, 10-GB-Deckel, strongly consistent möglich.

### DAX: Der Turbolader mit klarem Einsatzprofil

**Das Problem:** Ein Produktkatalog wird millionenfach identisch gelesen; die Marketing-Seite verlangt **Mikrosekunden**. DynamoDB liefert Millisekunden — Faktor 1.000 zu langsam.

**Die Lösung:** **DAX** — der DynamoDB-eigene In-Memory-Cache: **API-kompatibel** (der Code ändert kaum eine Zeile, nur den Client), Read-through/Write-through, und aus single-digit-Millisekunden werden **Mikrosekunden**.

Aber DAX hat ein scharfes Profil, und die Prüfung testet die *Gegenanzeigen*: **Nicht** für strongly-consistent Reads (DAX bedient eventually), **nicht** für write-lastige Workloads, **nicht** wenn kaum wiederholte Reads kommen (DAX glänzt bei Cache-Hit-Raten jenseits von 90 %). Produktion: mindestens **3 Nodes über AZs**. 🔴 Das kursierende „max. 11 Nodes" ist ein Drittquellen-Wert — nicht lehren. Abgrenzung: DynamoDB-Kontext → **DAX**; genereller Cache (RDS, Sessions, eigene Datenstrukturen) → **ElastiCache**.

> **💡 Merksatz:** „DynamoDB + read-heavy + Mikrosekunden" → **DAX** (fast ohne Code-Änderung). Write-heavy oder strongly consistent → DAX ist raus.

### Global Tables: Überall schreiben — und seit 2025 sogar konsistent

**Das Problem:** Nutzer in Europa, Asien und den USA — alle sollen mit lokaler Latenz **lesen und schreiben**. (Aurora Global kann nur eine Writer-Region — hier verläuft die große Abgrenzungslinie.)

**Die Lösung:** **Global Tables** replizieren **multi-aktiv**: Jede Region ist vollwertig beschreibbar, Replikation typisch unter einer Sekunde, Konflikte löst **Last Writer Wins**. Für die meisten Apps perfekt — aber „Last Writer Wins" heißt auch: Ein gleichzeitiger Write in zwei Regionen kann still einen davon verlieren, und Reads in einer anderen Region können kurz veraltet sein.

Genau dafür gibt es seit 🛑 **06/2025 MRSC (Multi-Region Strong Consistency)**: **zero RPO** und strongly consistent Reads über Regionen hinweg (mit einer „Witness"-Region als Kosten-Optimierung), verfügbar in ausgewählten Regionen. Die neue Antwort auf „multi-region UND niemals veraltete Daten" — z. B. Finanz- und Zahlungs-Apps.

> **💡 Merksatz:** Überall schreiben, ms-Latenz → **Global Tables** (multi-aktiv, Last Writer Wins). „Reads dürfen nie stale sein, zero RPO" → 🛑 **MRSC**. Relational + global → Aurora Global (1 Writer) — die Gegenrichtung.

### Streams, Backups & der Rest des Ökosystems

- **DynamoDB Streams** (24 h Retention, geordnete Item-Änderungen, Lambda-Trigger) = die CDC-Antwort für „jede Bestellung löst eine Aktion aus". Für längere Retention und viele parallele Consumer: **Kinesis Data Streams for DynamoDB**.
- **PITR bis 35 Tage**, On-Demand-Backups (unbegrenzt), **Export nach S3** (Athena-Analysen ohne die Tabelle zu belasten — der Analytics-Distraktor-Killer), Import aus S3.
- **Transactions:** echtes ACID über mehrere Items — zum doppelten Kapazitätspreis.
- **TTL:** löscht abgelaufene Items **ohne WCU-Kosten** — Sessions, Tokens, temporäre Daten.

---

## ⚠️ Prüfungs-Knackpunkte

- RCU = 4 KB strongly (÷2 eventual), WCU = 1 KB, transaktional ×2, **aufrunden**; Item max. **400 KB** → S3 + Pointer.
- Throttling trotz freier Kapazität → **Hot Partition** (3.000 RCU / 1.000 WCU je Partition) → **Key-Design/Write Sharding**; weder mehr Kapazität noch On-Demand heilen das.
- 🛑 On-Demand seit 11/2024 **−50 % und offizieller Default**; Spike ab Sekunde 1 → **Warm Throughput**.
- **GSI**: jederzeit, eigene Kapazität, eventual — unterdimensioniert throttlet er die Basistabelle; **LSI**: nur bei Erstellung, 10-GB-Deckel, strongly möglich.
- Read-heavy + Mikrosekunden → **DAX** (nicht bei write-heavy/strong consistency); genereller Cache → ElastiCache.
- Multi-Region-Writes → **Global Tables** (LWW); nie stale + zero RPO → 🛑 **MRSC** (06/2025); relational-global → Aurora Global.
- CDC/Trigger → **Streams + Lambda**; Analytics ohne Tabellenlast → **Export nach S3 + Athena**; PITR ≤ 35 Tage; TTL löscht gratis.

## 💡 Der eine Satz zum Mitnehmen

**DynamoDB-Fragen sind entweder Mathe (RCU/WCU aufrunden!), Physik (Hot Partition schlägt Tabellen-Kapazität) oder Geografie (Global Tables schreiben überall, Aurora nur an einem Ort)** — und seit 2024/25 gilt: On-Demand ist der Default, MRSC die Antwort auf „niemals stale".
