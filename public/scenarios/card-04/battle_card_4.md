---
nr: 4
title: "Battle Card 4 — Lambda Cold Start: SnapStart vs. Provisioned Concurrency"
services: ["AWS Lambda", "Lambda SnapStart", "Provisioned Concurrency", "Amazon API Gateway"]
signalwords: ["Cold Start", "Java-Latenz", "p99-SLA einhalten", "erste Anfrage nach Pause ist langsam"]
domains: [D3]
assets: ["battle_card_4.png", "battle_card_4.pdf", "battle_card_4.svg"]
---

# Battle Card 4 — Lambda Cold Start: SnapStart vs. Provisioned Concurrency

**Szenario:** Die **PayFast**-API läuft als Java-Lambda hinter API Gateway und muss ein hartes Latenz-SLA von **p99 ≤ 200 ms** halten. Das Problem: Nach einer Ruhephase startet die JVM neu (Cold Start) und die erste Anfrage kann bis zu ~2 s dauern — das reißt das SLA. Gesucht ist die passende Cold-Start-Minderung. Signalwörter: *„Cold Start", „Java/JVM langsam beim ersten Request", „Latenz-SLA einhalten", „erste Anfrage nach Pause"*.

## Ablauf (das Problem)

- **1 — Request:** Der Client ruft die REST-API auf; das SLA verlangt p99 ≤ 200 ms.
- **2 — Weiterreichen:** API Gateway leitet an die Java-Lambda weiter (Default-Integrationstimeout 29 s — hier nicht das Problem, das Problem ist die *Latenz*, nicht das Timeout).
- **3 — Cold Start reißt SLA:** Ist keine Umgebung warm, muss die JVM erst initialisieren. Dieser eine Request nach einer Pause kann ~2 s brauchen und verletzt damit das 200-ms-SLA. Genau hier setzen die zwei Lösungen an.

## Die zwei Lösungen

**A — Lambda SnapStart:** AWS nimmt nach der Initialisierung einen **Snapshot** der Ausführungsumgebung und *restauriert* ihn beim Cold Start, statt neu zu initialisieren. Cold Start fällt von ~2 s auf einige Dutzend ms. Unterstützt Java 11+, Python 3.12+ und .NET 8. **Keine Standing-Kosten** — man zahlt nichts fürs Bereithalten. Kleiner Restore-Overhead bleibt (nie ganz 0 ms), und die Init muss snapshot-sicher sein (keine eingefrorenen Zufallswerte/Timestamps/offenen Verbindungen).

**B — Provisioned Concurrency:** Lambda hält **N Umgebungen dauerhaft vorgewärmt** — für die konfigurierte Concurrency gibt es **0 ms Cold Start**, sofort antwortbereit. Preis dafür: **24/7-Kosten** pro vorgehaltener Umgebung, auch wenn kein Traffic kommt. Per Application Auto Scaling nach Zeitplan/Metrik anpassbar.

## Prüfungs-Kernsatz

**Cold Start bekämpfen: SnapStart = Snapshot/Restore, keine Standing-Kosten, kleiner Rest-Overhead → für schwankenden Traffic. Provisioned Concurrency = dauerhaft warm, echte 0 ms, aber 24/7-Kosten → für planbare Dauerlast mit striktestem SLA.**

## Klassiker-Fallen

1. **SnapStart vs. Provisioned Concurrency (die Kernfrage):** „Kosten sparen / spikey / unregelmäßig" → SnapStart. „garantiert 0 ms / planbare Dauerlast / Budget vorhanden" → Provisioned Concurrency. Beide lassen sich seit 2026 sogar kombinieren.
2. **SnapStart ≠ nur Java mehr:** Ursprünglich Java-only, inzwischen auch Python 3.12+ und .NET 8. Eine Frage, die „SnapStart geht nur mit Java" behauptet, ist veraltet.
3. **Cold Start ≠ Timeout:** Der 29-s-Integrationstimeout von API Gateway ist ein *anderes* Thema. Hier geht es um Latenz beim Kaltstart, nicht um lange Verarbeitung.
4. **Warm-Ping als Distraktor:** Ein CloudWatch-Events-Cron, der die Funktion alle 5 Minuten „anpingt", hält *eine* Umgebung warm, skaliert aber nicht bei Spikes und ist kein sauberer SLA-Garant. In der Prüfung ist es die *unterlegene* Antwort gegenüber SnapStart/Provisioned Concurrency.
