---
service: Amazon ElastiCache
seedKey: saa-c03-script-elasticache
batch: B2
domains: [D2, D3, D4]
sourceRef:
  - https://aws.amazon.com/elasticache/pricing/
  - https://aws.amazon.com/blogs/database/reduce-your-amazon-elasticache-costs-by-up-to-60-with-valkey-and-cudos/
status: draft
---

# Amazon ElastiCache

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> ElastiCache = der **Espresso-Tresen vor der Datenbank**: häufig bestellte Daten stehen fertig im RAM (Mikrosekunden), statt jedes Mal frisch aus der DB gebrüht zu werden. Muster: App → ElastiCache → RDS. Zwei klassische Engines: **Redis** (Datenstrukturen, Persistenz, Replikation) und **Memcached** (simpel, multi-threaded, flüchtig). Für DynamoDB gibt es den Spezial-Cache DAX.

Der SAA fragt dreifach nach: **Welche Engine (und was ist Valkey)? Welche Caching-Strategie gegen veraltete Daten? Und wann ist der Cache die richtige Antwort — und wann der Distraktor?**

---

## 🎯 SAA-Vertiefung

### Die Engine-Wahl: Feature-Fülle gegen schlichte Kraft — und der neue Fork

**Das Problem:** „Redis oder Memcached?" wirkt wie Geschmackssache — ist es nicht. Die Prüfung versteckt in jedem Szenario genau **ein Feature-Wort**, das die Entscheidung erzwingt.

**Die Lösung:** Die Matrix, an der sich alles entscheidet:

| Das Szenario verlangt … | Valkey/Redis | Memcached |
|---|---|---|
| Persistenz, Backup/Restore | ✅ | ❌ |
| Replikation, Multi-AZ-Failover | ✅ | ❌ |
| Datenstrukturen (Sorted Sets → **Leaderboards**), Pub/Sub | ✅ | ❌ |
| Cluster Mode (server-seitiges Sharding) | ✅ | client-seitig |
| Multi-Threading, maximale Schlichtheit | eingeschränkt | ✅ |

Merkregel: **Sobald das Szenario irgendein Feature jenseits von rohem Get/Set nennt** — Ausfallsicherheit, Ranglisten, Sitzungen, die einen Node-Ausfall überleben — ist die Antwort Valkey/Redis. Memcached gewinnt nur die Nische „maximal simpel, multi-threaded, Datenverlust egal".

🛑 **Und Valkey?** Seit 10/2024 bietet ElastiCache **Valkey** an — den Linux-Foundation-Fork von Redis 7.2 (entstanden nach Redis' Lizenzwechsel), **API-kompatibel** und dauerhaft günstiger: **node-based −20 %, Serverless −33 %** gegenüber Redis OSS. Bestehende Cluster wandern per **Zero-Downtime-In-Place-Upgrade** hinüber, Redis-Reservations gelten weiter. AWS empfiehlt Valkey für alles Neue — die Feature-Logik oben bleibt identisch, „Redis-Features" heißt jetzt praktisch „Valkey-Features".

> **💡 Merksatz:** Irgendein Feature-Wort (Failover, Leaderboard, Persistenz, Pub/Sub) → **Valkey/Redis**. Nur simpel + multi-threaded → Memcached. 🛑 Kosten senken ohne Umbau → **In-Place-Upgrade auf Valkey (−20/−33 %)**.

### Caching-Strategien: Frisch oder schnell — die ewige Abwägung

**Das Problem:** Der Shop cached Produktpreise — und verkauft nach der Preisänderung stundenlang zum alten Preis. Der Cache tut genau, was Caches tun: Er erinnert sich zu gut.

**Die Lösung:** Die zwei Grundstrategien und ihr Sicherheitsnetz:
- **Lazy Loading (Cache-aside):** Die App fragt erst den Cache; bei einem **Miss** holt sie aus der DB und legt eine Kopie in den Cache. Vorteil: Nur wirklich Gefragtes belegt RAM. Nachteile: Der erste Zugriff ist langsam (Miss-Penalty), und Daten können **veralten**.
- **Write-Through:** Jeder DB-Write aktualisiert **gleichzeitig** den Cache. Vorteil: Der Cache ist nie stale. Nachteile: Jeder Write kostet doppelt, und der RAM füllt sich mit Daten, die vielleicht nie gelesen werden.
- **TTL** ist das Sicherheitsnetz für beide: Nach Ablauf fliegt der Eintrag raus und wird frisch geladen — die Antwort auf jedes „Cache liefert veraltete Werte"-Szenario ist fast immer „**TTL setzen/verkürzen**" oder „Write-Through ergänzen", nie „Cache abschaffen".

In der Praxis (und in guten Antwortoptionen) kombiniert man: Write-Through für das Kritische, Lazy Loading + TTL für den Rest.

> **💡 Merksatz:** **Lazy Loading** = sparsam, aber Miss-Penalty + Staleness-Risiko; **Write-Through** = immer frisch, aber Write-Kosten; **TTL** = das Sicherheitsnetz gegen veraltete Daten.

### Session-Store: Das Gedächtnis der stateless Web-Flotte

**Das Problem:** Webserver in einer Auto-Scaling-Gruppe hinter einem ALB. Ein Nutzer loggt sich ein — sein nächster Request landet auf einer *anderen* Instanz, die ihn nicht kennt. Warenkorb weg, Login weg. Sticky Sessions? Funktionieren, aber binden Nutzer an Instanzen — und beim Scale-in stirbt die Session mit.

**Die Lösung:** Die Sessions gehören **aus den Instanzen heraus** in einen zentralen In-Memory-Store: **ElastiCache (Valkey/Redis)** — jede Instanz liest jede Session in Mikrosekunden, die Flotte wird wirklich **stateless**, Auto Scaling darf beliebig töten und gebären. Mit **Replikation + Multi-AZ-Failover** überlebt der Session-Store auch den Node-Ausfall — weshalb Memcached (keine Replikation!) hier die falsche Engine ist. Braucht die Session echte *Dauerhaftigkeit*, ist DynamoDB die Alternative.

Für Verfügbarkeit und Wachstum: **Cluster Mode enabled** shardet über viele Nodes (wenn ein einzelner RAM nicht mehr reicht), **Global Datastore** repliziert cross-region (DR/lokale Reads), und **ElastiCache Serverless** (seit 11/2023) nimmt die Kapazitätsplanung ab — ideal bei variabler Last; bei stetiger Hochlast bleibt der selbst dimensionierte Cluster (mit Reservations) günstiger.

> **💡 Merksatz:** „Stateless Web-Tier, Sessions überleben Scale-in/Node-Ausfall" → **ElastiCache Redis/Valkey mit Replikation** — Sticky Sessions sind die Krücke, Memcached die Falle.

### Die Abgrenzungs-Trilogie

- **vs. DAX:** Steht **DynamoDB** im Szenario → DAX (API-kompatibel, kein Umbau). Alles andere — RDS-Entlastung, Sessions, eigene Strukturen → **ElastiCache**.
- **vs. MemoryDB** *(nicht im SAA-Scope, Randnotiz)*: ElastiCache ist ein **Cache vor** einer Datenbank (flüchtig gedacht); MemoryDB ist eine **durable In-Memory-Primärdatenbank**. Signalwort „primary database, in-memory, durable" → MemoryDB — sonst immer ElastiCache.
- **vs. CloudFront:** ElastiCache cached **Daten/Query-Ergebnisse** hinter der App; CloudFront cached **HTTP-Antworten** am Edge vor der App. Verschiedene Stockwerke desselben Hauses.

---

## ⚠️ Prüfungs-Knackpunkte

- Feature-Wort im Szenario (Failover, Persistenz, Leaderboard/Sorted Sets, Pub/Sub) → **Valkey/Redis**; nur simpel+multi-threaded → Memcached.
- 🛑 **Valkey** (10/2024): −20 % node-based / −33 % Serverless, In-Place-Upgrade ohne Downtime — die Kostensenkungs-Antwort ohne Umbau.
- Veraltete Cache-Daten → **TTL** (und/oder Write-Through), nicht „Cache entfernen".
- Lazy Loading = Miss-Penalty + Staleness; Write-Through = doppelte Writes + immer frisch.
- Stateless Web-Tier / Sessions → **ElastiCache mit Replikation** (Memcached kann kein Failover; Sticky Sessions = Krücke).
- RAM-Grenze eines Nodes gesprengt → **Cluster Mode enabled** (Sharding); cross-region → **Global Datastore**; unbekannte Last → **Serverless**.
- DynamoDB-Kontext → **DAX**; „durable in-memory primary DB" → MemoryDB (Randnotiz); HTTP am Edge → CloudFront.

## 💡 Der eine Satz zum Mitnehmen

**ElastiCache gewinnt jede Frage, in der wiederholte Reads eine Datenbank quälen oder eine Web-Flotte ihr Gedächtnis auslagern muss** — die Engine entscheidet das Feature-Wort (im Zweifel Valkey), die Frische entscheidet die TTL.
