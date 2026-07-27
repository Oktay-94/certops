---
nr: 84
title: "Route 53 Health Checks + Failover"
services: ["Amazon Route 53", "Amazon CloudWatch", "Elastic Load Balancing", "Amazon Application Recovery Controller"]
domains: [D2]
signalwords:
  - "automatically route traffic to the standby Region"
  - "DNS failover"
  - "health check"
  - "TTL"
  - "endpoint in a private subnet"
assets: ["battle_card_84.svg", "battle_card_84.png", "battle_card_84.pdf"]
status_note: |
  qc.py: 0 Befunde. 8 Boxen, 37 Texte, 8 Segmente, 4 Badges, 1 X-Kreis.
  Segmente aufgeschlüsselt: 4 echte Pfeilsegmente + 2 X-Diagonalen + 2
  Phantom-Segmente aus dem einen Marker-<defs>-Pfad. Ein Marker, eine
  Pfeilfarbe (Navy).
  Korrekturrunden: keine. Die Karte lief im ersten Durchgang durch qc.py,
  render.py und zones.py. Alle Pfeilgeometrien wurden vor dem Zeichnen aus
  den Boxkanten abgeleitet (Lücken 90 px waagerecht, 100 px senkrecht;
  Badges jeweils 35–40 px hinter dem Segmentanfang, Markerkopf belegt die
  hinteren 30 px bei stroke-width 3).
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde.
  R12-Gegencheck: 0 gestrokte <path> ohne fill="none".
  R16: engster gemessener Abstand eines freien Labels zu einer Boxkante
  39,4 px — der größte Abstand aller fünf Karten dieses Batches. Die Karte
  hat außer Titel und Untertitel keine freien Labels.
  Footer von Hand gemessen: 1311 px (Grenze 1420 px).
  Sichtprüfung: AUSSTEHEND. Erfolgt lokal durch Oktay vor dem Repo-Einbau.
---

# Battle Card 84 — Route 53 Health Checks + Failover

**Szenario:** Der Warm Standby aus Karte 83 steht in us-west-2. Der Betriebsleiter will wissen, wie lange es nach einem Ausfall der Primärregion dauert, bis der letzte Kunde in der Standby-Region ankommt.

## Ablauf

- **1 — Health Checker (Governance):** Über das Netz verteilte Prüfstellen fragen den Primary-Endpoint ab. Zwei Stellschrauben: das Intervall (30 Sekunden Standard, 10 Sekunden als schnelle Variante) und der Failure Threshold, also die Anzahl aufeinanderfolgender Fehlschläge — wählbar von 1 bis 10, Standard sind 3 Beobachtungen. Beide Werte lassen sich nach dem Anlegen des Health Checks nicht mehr ändern.

- **2 — Die 18-%-Regel (Governance):** Die einzelnen Prüfstellen stimmen sich nicht untereinander ab; Route 53 aggregiert ihre Urteile. Melden mehr als 18 % der Health Checker den Endpoint als gesund, gilt er als gesund. Der Wert klingt willkürlich niedrig, hat aber einen Zweck: Er verhindert, dass ein Endpoint nur deshalb als tot gilt, weil Netzprobleme ihn von einigen Prüfstandorten abgeschnitten haben. Ein einzelner regionaler Netzfehler kippt das Urteil also nicht.

- **3 — Failover-Record (Transport):** Ist der Primary unhealthy, antwortet Route 53 auf DNS-Anfragen mit dem Secondary-Record. Das ist der eigentliche Umschaltvorgang — und er besteht darin, dass eine *Antwort* sich ändert, nicht darin, dass Verkehr umgeleitet wird. Route 53 kann keinen bereits laufenden Verbindungsaufbau umbiegen.

- **4 — Der Client folgt (Quelle):** Und zwar erst, wenn seine TTL abgelaufen ist. AWS empfiehlt für zeitnahes Umschalten eine TTL von 60 Sekunden. Resolver und Anwendungen halten Antworten in der Praxis aber häufig länger fest, als die TTL erlaubt. Dieser Teil der Failover-Zeit liegt außerhalb der eigenen Kontrolle.

- **Die Zeitformel (Governance):** Failover-Zeit = Intervall × Failure Threshold + Aggregation + TTL. Mit den Standardwerten sind das 30 × 3 = rund 90 Sekunden allein für die Erkennung, danach die Verbreitung der neuen Antwort, danach der Ablauf der Zwischenspeicher. Wer eine RTO von 15 Minuten zugesagt hat, kommt damit hin; wer 30 Sekunden zugesagt hat, nicht.

- **✗ Verworfen — Health Check direkt auf eine Instanz im privaten Subnetz:** Die Health Checker arbeiten aus dem öffentlichen Internet und erreichen private IP-Adressen nicht. Für solche Endpunkte gibt es metrikbasierte Health Checks: Ein CloudWatch-Alarm wird zum Health Check. AWS hat diese Variante genau für Endpunkte eingeführt, die ein Standard-Health-Check nicht erreichen kann.

## Prüfungs-Kernsatz

**Die Failover-Zeit ist Intervall × Failure Threshold plus Aggregation plus TTL — DNS-Failover kann nie schneller sein als der Cache der Clients.**

## Abgrenzungen

- **84 ↔ 83:** Karte 83 macht die Standby-Region bereit, Karte 84 schickt den Verkehr hin.
- **Failover-Routing ↔ Active/Active:** Failover-Routing ist die Aktiv-Passiv-Bauform. Für Aktiv-Aktiv nutzt man Weighted-, Latency-, Geolocation-, Geoproximity- oder Multivalue-Answer-Routing mit Health Checks an jedem Record.
- **Health Check ↔ Evaluate Target Health:** Zeigt ein Alias-Record auf einen Load Balancer, kann statt eines eigenen Health Checks „Evaluate Target Health" genutzt werden — dann zählt die Gesundheit der Ziele hinter dem Load Balancer. Sind beide gesetzt, müssen beide gesund sein.

## Klassiker-Fallen

1. **Beide Records unhealthy.** → Route 53 gibt dann den **Primary** zurück. Es gibt keinen Zustand „keine Antwort". Wer auf ausbleibende DNS-Antworten alarmiert, alarmiert nie; man muss auf den Health-Check-Status alarmieren.
2. **Secondary ohne Health Check.** → Fehlt am Secondary-Record der Health Check, antwortet Route 53 bei ungesundem Primary immer mit dem Secondary — auch wenn dessen Endpoint längst tot ist.
3. **„Automatisch" mit „sofort" verwechseln.** → Das Umschalten der DNS-Antwort ist automatisch, die Wirkung beim Client nicht sofort.
4. **Automatisches Failover als Standardempfehlung.** → Der Reliability Pillar rät zur Vorsicht: Ein Failover aufgrund eines Fehlalarms kostet selbst Verfügbarkeit und Daten. AWS beschreibt manuell ausgelöstes Failover als häufigen Weg — mit vollständig automatisierten Schritten, sodass die Auslösung ein Knopfdruck ist.

## Faktencheck-Notizen (23.07.2026)

- **Intervall 30 s oder 10 s, 18-%-Regel** — AWS-Dokumentation „How Amazon Route 53 determines whether a health check is healthy": Intervall wahlweise 10 oder 30 Sekunden; melden mehr als 18 % der Health Checker den Endpoint gesund, gilt er als gesund. Der Text nennt auch die Begründung (Schutz gegen netzbedingte Isolation einzelner Prüfstandorte) und den Hinweis, dass der Wert sich künftig ändern kann.
- **Failure Threshold 1–10, Standard 3** — AWS News Blog „Route 53 Health Check Improvements": Anzahl aufeinanderfolgender Beobachtungen zwischen 1 und 10 wählbar, Standardwert 3.
- **TTL-Empfehlung 60 Sekunden** — derselbe AWS-Beitrag.
- **Verhalten bei Aktiv-Passiv** — AWS-Dokumentation „Active-active and active-passive failover": Route 53 gibt nur gesunde Primary-Ressourcen zurück; sind alle Primary-Ressourcen ungesund, nur noch gesunde Secondary-Ressourcen.
- **Beide unhealthy → Primary** — bestätigt aus zwei AWS-Quellen: dem Networking-&-Content-Delivery-Blog „Creating Disaster Recovery Mechanisms Using Amazon Route 53" und der SDK-Referenz zum `failover`-Element („wenn der Secondary-Record ungesund ist, antwortet Route 53 mit dem Primary, unabhängig von dessen Gesundheit"). Diese Falle stand zunächst nur in einer Drittquelle und wurde deshalb gezielt nachgeprüft, bevor sie auf die Karte kam.
- **Metrikbasierte Health Checks für private Endpunkte** — AWS-Ankündigung „Metric Based Health Checks, DNS Failover for Private Hosted Zones": ausdrücklich für Endpunkte gedacht, die ein Standard-Health-Check nicht erreicht, etwa Instanzen mit ausschließlich privaten IP-Adressen.

### Divergenz zur Masterplan-Themenzeile

Die Zeile 84 verspricht „automatisches Umschalten auf die Standby-Region". Das ist mechanisch richtig, didaktisch aber irreführend: Der Reliability Pillar empfiehlt für DR gerade **nicht**, blind auf automatisches Failover zu setzen, weil ein Fehlalarm-Failover selbst Schaden anrichtet. Die Karte bildet das im Untertitel („warum ‚automatisch' nicht ‚sofort' heißt") und in Falle 4 ab.

### Nicht bestätigt / bewusst weggelassen

- **Anzahl der Health-Checker-Standorte.** Der AWS News Blog spricht von „einem Dutzend oder so" und schreibt ausdrücklich, dass sich das ändern kann; die aktuelle Dokumentation nennt keine feste Zahl. Auf der Karte steht deshalb nur „verteilte Prüfstellen im Netz".
- **Amazon Application Recovery Controller (ARC)** ist im Frontmatter als angrenzender Dienst geführt, aber nicht auf der Karte. Der Reliability Pillar nennt ihn als Weg zum manuell ausgelösten Failover über eine hochverfügbare Data-Plane-API. Der Dienst hieß früher „Route 53 Application Recovery Controller" — für den Prüfungsstand kann noch der alte Name auftauchen. Eigene Karte wäre sinnvoll, ist im Masterplan bis 100 aber nicht vorgesehen.
- **Konkrete Aggregationsdauer.** Nicht dokumentiert; auf der Karte steht „Aggregation" ohne Zeitwert.

### Bewusste Vereinfachungen im Diagramm

- Die Health Checker sind eine Box, kein verteiltes Netz. Das Diagramm zeigt die Logik, nicht die Topologie.
- Die Primärregion kommt als eigenes Element nicht vor — sie ist im Ablauf nur als „Primary ist unhealthy" präsent.
- Calculated Health Checks und String-Matching sind weggelassen.

### Farbkonventionen dieser Karte

Rollenkonform. Gold für die drei Governance-Elemente (Health Checker, 18-%-Regel, Zeitformel), Teal für den Failover-Record als Transportentscheidung, Blau für den Client als Quelle, Orange für die Standby-Region als Compute-Ziel, Navy für alle Ablaufpfeile, Rot für den verworfenen Pfad.
