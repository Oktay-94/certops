---
service: EC2 Auto Scaling (+ AWS Auto Scaling)
seedKey: saa-c03-script-auto-scaling
batch: B3
domains: [D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/autoscaling/ec2/userguide/launch-configurations.html
  - https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html
  - https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html
status: draft
---

# EC2 Auto Scaling

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Die ASG = die **selbstregulierende Server-Herde**: Launch Template als Bauplan, **Min/Desired/Max** als Leitplanken, Scaling Policies (Target Tracking, Step, Scheduled, Predictive) als Steuerung — und Health Checks, die kranke Instanzen automatisch ersetzen (**Selbstheilung**). Das Standard-Trio für Hochverfügbarkeit: **ASG über mehrere AZs + ELB + CloudWatch**.

Der SAA fragt nach den Feinheiten: **Welcher Health Check? Welche Policy? Wie updatet man die Flotte ohne Ausfall — und wie mischt man Spot dazu?**

---

## 🎯 SAA-Vertiefung

### Die Health-Check-Falle: Die Instanz lebt, die App ist tot

**Das Problem:** Der Java-Prozess auf einer Instanz ist abgestürzt, die Website liefert 502 — aber die ASG unternimmt **nichts**. Warum?

**Die Lösung:** Weil sie den falschen Puls misst. Die ASG kennt zwei Health Checks:
- **EC2 Health Check** (Default): prüft nur, ob die **Instanz** läuft (System-/Instance-Status). Eine Instanz mit totem Anwendungsprozess ist aus dieser Sicht kerngesund.
- **ELB Health Check:** übernimmt das Urteil des Load Balancers, der die **Anwendung** über einen HTTP-Pfad (z. B. `/health`) prüft. Erst damit erkennt die ASG „App tot" und ersetzt die Instanz.

Das ist einer der zuverlässigsten Prüfungsklassiker: „Ausgefallene Anwendung wird nicht ersetzt" → **ELB Health Check aktivieren**. Dazu gehört die **Health Check Grace Period**: Zeit, in der eine frisch gestartete Instanz booten darf, ohne gleich als krank aussortiert zu werden (zu kurz eingestellt = Endlosschleife aus Starten und Töten).

> **💡 Merksatz:** EC2-Check = „Läuft der Server?" · **ELB-Check = „Läuft die Anwendung?"** — bei App-Fehlern ist nur der ELB-Check die Antwort.

### Die vier Scaling Policies: reagieren, stufen, planen, vorhersagen

**Das Problem:** „CPU über 80 % → mehr Server" klingt simpel, aber die Prüfung unterscheidet vier Werkzeuge nach *Charakter der Last*.

**Die Lösung:**
- **Target Tracking** — „Halte die CPU bei 50 %." Der Thermostat: einfachster und **empfohlener** Standard. Antwort auf „einfachste Methode".
- **Step Scaling** — gestufte Reaktion je nach Alarmgröße („+2 bei 70 %, +4 bei 90 %"). Für abgestufte, differenzierte Reaktionen.
- **Scheduled Scaling** — der Wecker: **bekannter Zeitplan** („werktags 8 Uhr hoch"). Signalwort: „wir wissen genau, wann".
- **Predictive Scaling** — ML prognostiziert die Last und skaliert **vorher** hoch. Signalwort: „wiederkehrendes Muster, aber die Instanzen brauchen zu lang zum Booten, um reaktiv zu skalieren".

Und die Ergänzung für lange Boot-Zeiten: **Warm Pools** halten vorgewärmte, gestoppte Instanzen bereit, die in Sekunden statt Minuten einsatzbereit sind — die Antwort auf „Scale-out ist zu langsam, weil das Bootstrapping 10 Minuten dauert" (Alternative zu Predictive Scaling, oft gemeinsam getestet).

> **💡 Merksatz:** Standard → **Target Tracking**. Bekannter Zeitplan → **Scheduled**. Wiederkehrende Muster + langsamer Start → **Predictive** (oder **Warm Pools**).

### Lifecycle Hooks: Die Pausetaste beim Kommen und Gehen

**Das Problem:** Beim Scale-in reißt die ASG eine Instanz weg, die gerade noch einen 3-minütigen Upload verarbeitet — die Daten sind futsch. Und beim Scale-out nimmt der ELB eine Instanz in den Dienst, bevor die Anwendung fertig deployed ist.

**Die Lösung:** **Lifecycle Hooks** setzen die Instanz beim Starten (`Pending:Wait`) oder Terminieren (`Terminating:Wait`) in eine **Warteschleife** — Zeit für Bootstrapping, Log-Abtransport oder **Connection Draining**. Die klassische Antwort auf „Instanzen dürfen nicht mitten in der Arbeit sterben".

Zwei verwandte Betriebsdetails: **Termination Policies** legen fest, wer zuerst geht (Default: älteste Konfiguration, dann die mit der nächsten Abrechnungsstunde), und **Instance Refresh** rollt eine neue AMI-/Template-Version rollierend durch die Flotte — die ASG-Antwort auf „Patch ausrollen ohne Downtime".

> **💡 Merksatz:** „Nicht mitten in der Arbeit sterben / erst fertig bootstrappen" → **Lifecycle Hooks**. Flottenweites Update ohne Ausfall → **Instance Refresh**.

### Launch Templates und die Spot-Mischung

🛑 **Launch Configurations sind Geschichte:** Seit **01.01.2023** keine neuen Instance-Typen, und **seit 01.10.2024** kann kein neuer Account sie überhaupt noch anlegen. Alles Moderne — **Versionierung, Mixed Instances Policy, Warm Pools, Attribute-basierte Instanzauswahl, T-Unlimited-Modus** — gibt es **nur mit Launch Templates**. Taucht „Launch Configuration" in einer Antwortoption auf, ist sie der veraltete Distraktor.

Und der Kosten-Hebel, den die Prüfung liebt: die **Mixed Instances Policy** — eine ASG mischt **On-Demand als Basis** (garantierte Mindestkapazität) mit **Spot für den Aufwuchs** (bis 90 % billiger). Mit **Capacity Rebalancing** ersetzt die ASG gefährdete Spot-Instanzen proaktiv, bevor sie zurückgeholt werden. Das ist die Standardantwort auf „elastische Web-/Worker-Flotte, deutlich günstiger, ohne Verfügbarkeit zu opfern".

Zum Schluss die Namensverwirrung: **EC2 Auto Scaling** skaliert EC2-Gruppen. **AWS Auto Scaling** ist der übergreifende Dienst, der mehrere Ressourcentypen (ECS-Services, DynamoDB, Aurora Replicas) über Scaling Plans gemeinsam skaliert.

> **💡 Merksatz:** 🛑 Nur noch **Launch Templates**. Kosten senken ohne Verfügbarkeitsverlust → **Mixed Instances Policy (On-Demand-Basis + Spot)** + Capacity Rebalancing.

---

## ⚠️ Prüfungs-Knackpunkte

- App abgestürzt, Instanz wird nicht ersetzt → **ELB Health Check** (EC2-Check sieht nur den Server); **Grace Period** nicht zu kurz setzen.
- Policies: **Target Tracking** = Standard · **Step** = abgestuft · **Scheduled** = bekannter Zeitplan · **Predictive** = ML-Prognose bei langsamem Boot.
- Langsamer Scale-out wegen Bootstrapping → **Warm Pools** (oder Predictive Scaling).
- Instanz soll erst fertig arbeiten/draining → **Lifecycle Hooks**; flottenweites Update → **Instance Refresh**.
- 🛑 **Launch Configurations deprecated** (kein neuer Account seit 10/2024) → **Launch Templates**, Pflicht für Mixed Instances/Warm Pools/Versionierung.
- Kostenoptimierte elastische Flotte → **Mixed Instances Policy** (On-Demand-Basis + Spot) + **Capacity Rebalancing**.
- HA: ASG **über mehrere AZs** spannen — eine ASG in einer AZ ist nicht hochverfügbar.
- **EC2 Auto Scaling** (nur EC2) vs. **AWS Auto Scaling** (übergreifend: ECS, DynamoDB, Aurora).

## 💡 Der eine Satz zum Mitnehmen

**Die ASG ist nur so schlau wie ihr Health Check und nur so elastisch wie ihre Policy** — ELB-Check für die Anwendung, Target Tracking als Default, Lifecycle Hooks für saubere Übergänge und die Mixed Instances Policy, wenn dieselbe Elastizität die Hälfte kosten soll.
