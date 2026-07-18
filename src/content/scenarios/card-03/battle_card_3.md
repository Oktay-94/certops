---
nr: 3
title: "Battle Card 3 — EC2 Auto Scaling · ALB · CloudWatch"
services: ["EC2 Auto Scaling", "Application Load Balancer", "Amazon CloudWatch", "Amazon EC2"]
signalwords: ["Last schwankt im Tagesverlauf", "automatisch skalieren", "nachts wenig / mittags viel", "keine Instanzen manuell zu-/abschalten"]
domain: "Compute & Serverless"
assets: ["battle_card_3.png", "battle_card_3.pdf", "battle_card_3.svg"]
---

# Battle Card 3 — EC2 Auto Scaling · ALB · CloudWatch

**Szenario:** Der Webshop **DailyDeals** hat einen klaren Tageszyklus: nachts reichen 2 Instanzen, mittags braucht er bis zu 40. Niemand soll morgens hoch- und abends runterskalieren müssen, und in der Nacht sollen keine 40 Instanzen leer mitlaufen. Die Kapazität soll der Last automatisch folgen. Signalwörter: *„Last schwankt im Tagesverlauf", „automatisch skalieren", „keine idle-Kosten in der Nacht", „keine manuellen Eingriffe"*.

## Ablauf

- **1 — HTTPS:** Nutzer treffen auf den **Application Load Balancer**. Der ALB ist der stabile Eintrittspunkt; dahinter darf sich die Instanzzahl beliebig ändern, ohne dass Clients etwas merken.
- **2 — Routing:** Der ALB verteilt auf alle **gesunden** EC2-Instanzen der Auto Scaling Group. Neue Instanzen registrieren sich nach dem Health-Check automatisch in der Target Group, entfernte werden abgemeldet — Load Balancing bleibt korrekt.
- **3 — Metriken publizieren:** Die Instanzen liefern Metriken (z. B. Ø CPU-Auslastung oder Requests je Target) an **CloudWatch**. CloudWatch ist das Messinstrument — es entscheidet nicht selbst, sondern liefert die Datengrundlage.
- **4 — Alarm → desired capacity:** Weicht die Metrik vom Zielwert ab, passt die Scaling-Policy die *desired capacity* der ASG an; AWS startet oder terminiert Instanzen bis zum neuen Sollwert (immer innerhalb min=2 / max=40). Bei **Target Tracking** legt AWS die nötigen CloudWatch-Alarme selbst an und pflegt sie — man definiert nur Metrik + Zielwert.

## Prüfungs-Kernsatz

**ASG hält die Instanzzahl zwischen min und max. CloudWatch misst, die Scaling-Policy handelt. Target Tracking = Thermostat (Zielwert halten), Scheduled = Wecker (zur festen Zeit skalieren).**

## Klassiker-Fallen

1. **Reaktiv vs. proaktiv (die Hauptfalle bei genau diesem Szenario):** Ein *vorhersehbares* Tagesmuster ist der Lehrbuchfall für **Scheduled Scaling** (oder Predictive Scaling) — hochskalieren, *bevor* die Spitze kommt, statt auf sie zu reagieren. Target Tracking funktioniert auch, hat aber einen Reaktions-Lag. „vorhersehbar/wiederkehrend" → Scheduled/Predictive; „unregelmäßig/nicht planbar" → Target Tracking.
2. **Target Tracking vs. Step Scaling:** Target Tracking = Metrik auf Zielwert halten, AWS managt die Alarme. Step Scaling = du definierst Alarme + gestufte Anpassungen selbst (mehr Kontrolle, mehr Aufwand). Default-Empfehlung ist Target Tracking.
3. **ASG ≠ Load Balancer:** Auto Scaling verändert die *Anzahl* der Instanzen; der ALB *verteilt* den Traffic. Zwei getrennte Aufgaben, die zusammenspielen — die Prüfung testet gern, wer für „Skalierung" vs. „Verteilung" zuständig ist.
4. **CloudWatch skaliert nicht selbst:** CloudWatch misst und alarmiert; die eigentliche Skalier-Aktion führt die Auto-Scaling-Policy aus. „Welcher Service fügt Instanzen hinzu?" → EC2 Auto Scaling, nicht CloudWatch.
