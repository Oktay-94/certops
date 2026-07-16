---
service: AWS Elastic Beanstalk
seedKey: saa-c03-script-elastic-beanstalk
batch: B3
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.rolling-version-deploy.html
  - https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.CNAMESwap.html
status: draft
---

# AWS Elastic Beanstalk

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Beanstalk = der **extrem fleißige Assistent**: Du drückst ihm deine ZIP-Datei in die Hand, er baut EC2, Load Balancer, Auto Scaling Group und CloudWatch drumherum und gibt dir eine URL zurück. Anders als bei Lambda/Fargate bleiben die **Server sichtbar und zugänglich** — Beanstalk ist keine Blackbox, sondern eine Orchestrierungsschicht (die intern **CloudFormation** nutzt).

Der SAA prüft Beanstalk fast ausschließlich an **einer** Stelle: **den Deployment-Policies.** Dazu kommt die berüchtigte RDS-Falle.

---

## 🎯 SAA-Vertiefung

### Die Deployment-Policies — DIE Beanstalk-Prüfungsfrage

**Das Problem:** Eine neue Version soll ausgerollt werden. Das Szenario nennt immer zwei der drei Größen: **Downtime**, **Kapazität während des Deployments** und **Kosten/Rollback-Geschwindigkeit**. Genau daran hängt die richtige Policy.

**Die Lösung — fünf Wege, eine Tabelle:**

| Policy | Downtime? | Kapazität während des Deploys | Extra-Kosten | Rollback |
|---|---|---|---|---|
| **All at once** | **Ja** (kurz) | – | keine | neu deployen (langsam) |
| **Rolling** | nein | **reduziert** (Batches werden nacheinander getauscht) | keine | Redeploy |
| **Rolling with additional batch** | nein | **volle Kapazität** (temporäre Zusatz-Instanzen) | gering, temporär | Redeploy |
| **Immutable** | nein | volle + **komplett neue ASG** | **am höchsten** (Flotte kurzzeitig doppelt) | **schnell** (neue ASG einfach verwerfen) |
| **Traffic Splitting** | nein | volle + neue ASG | hoch | schnell (**Canary**) |

Die Übersetzungen, mit denen man die Frage knackt:
- „**Schnellstes und billigstes** Deployment, kurze Downtime ist ok (Dev/Test)" → **All at once**.
- „**Keine Downtime**, aber Kapazität darf während des Deploys sinken" → **Rolling**.
- „Keine Downtime **und volle Kapazität** halten" → **Rolling with additional batch**.
- „**Sicherster** Weg, **schneller Rollback**, Kosten egal" → **Immutable**.
- „**Canary** — erst einen kleinen Prozentsatz des Traffics auf die neue Version" → **Traffic Splitting**.

Und die Begriffsfalle: **Blue/Green ist bei Beanstalk keine Deployment-Policy**, sondern eine **Technik** — zwei Umgebungen, dann **„Swap Environment URLs" (CNAME-Swap)**. Das ist die einzige Variante mit **DNS-Wechsel** — Signalwort: „komplett getestete zweite Umgebung, dann umschalten, jederzeit zurückschaltbar".

> **💡 Merksatz:** **Rolling** = Kapazität sinkt · **Rolling with additional batch** = Kapazität bleibt · **Immutable** = neue ASG, teuerster, aber sicherster Rollback · **Traffic Splitting** = Canary · **Blue/Green = CNAME-Swap**, keine Policy.

### Die RDS-Falle: Die Datenbank, die beim Umschalten stirbt

**Das Problem:** Ein Team lässt Beanstalk beim Anlegen der Umgebung „gleich eine RDS mit dazu" erstellen. Monate später macht es einen Blue/Green-Swap — und die Produktionsdatenbank ist weg.

**Die Lösung:** Eine von Beanstalk **selbst erstellte RDS hängt am Lebenszyklus der Umgebung**. Wird die Umgebung terminiert (oder beim Blue/Green-Swap die alte abgeräumt), stirbt die Datenbank mit. **Best Practice: die RDS entkoppeln** — eigenständig außerhalb von Beanstalk betreiben und die Anwendung nur per Environment-Variable auf den Endpoint zeigen lassen.

Dieselbe Denke wie überall in AWS: **Zustand gehört nicht in die Compute-Schicht.**

> **💡 Merksatz:** Beanstalk-eigene RDS = **Datenbank am Lebenszyklus der Umgebung** → beim Swap/Terminate verloren. **Immer eigenständige RDS** anbinden.

### Einordnung: Wie viel Kontrolle willst du?

Beanstalk sitzt auf der Kontroll-Achse in der Mitte — und die Prüfung testet genau diese Nachbarschaft:
- **EC2** = du baust alles selbst.
- **Beanstalk** = du gibst *Code*, AWS baut die Infrastruktur — **aber du siehst und betrittst die EC2-Instanzen** (Signalwort: „schnell deployen, trotzdem Server-Zugriff behalten").
- **CloudFormation** = **du** schreibst den Bauplan (Beanstalk nutzt es intern selbst).
- **ECS/Fargate/Lambda** = Server unsichtbar.
- **App Runner** = noch einfacher, aber 🛑 **Vorsicht: App Runner nimmt ab 30.04.2026 keine neuen Kunden mehr an** (Maintenance Mode) — in aktuellen Szenarien nur noch ein Distraktor, nicht mehr die empfohlene Antwort.

Konfiguriert wird über **`.ebextensions`** (YAML-Dateien im Quellpaket) — die Antwort auf „Beanstalk-Umgebung anpassen, ohne die Kontrolle abzugeben".

🛑 **Aktualität:** Beanstalk-Plattformen auf **Amazon Linux 2 laufen zum 30.06.2026 aus** → Migration auf **Amazon Linux 2023**, sinnvollerweise per Immutable- oder Blue/Green-Deployment.

> **💡 Merksatz:** Beanstalk = **Code rein, Infrastruktur raus — aber die Server bleiben sichtbar.** Willst du sie *nicht* sehen → Fargate/Lambda. Willst du den Bauplan selbst schreiben → CloudFormation.

---

## ⚠️ Prüfungs-Knackpunkte

- Deployment-Policies auswendig: **All at once** (Downtime, billig) · **Rolling** (Kapazität sinkt) · **Rolling with additional batch** (volle Kapazität) · **Immutable** (neue ASG, sicherster/schnellster Rollback, teuerste) · **Traffic Splitting** (Canary).
- **Blue/Green = „Swap Environment URLs" (CNAME-Swap)**, keine Policy — einzige Variante mit DNS-Wechsel.
- **Beanstalk-eigene RDS stirbt mit der Umgebung** → RDS immer entkoppelt betreiben.
- Beanstalk nutzt intern **CloudFormation**; Konfiguration über **`.ebextensions`**.
- Abgrenzung: Beanstalk = Code + sichtbare Server · CloudFormation = eigener Bauplan · Fargate/Lambda = Server unsichtbar · 🛑 **App Runner: keine Neukunden ab 30.04.2026** (Distraktor).
- 🛑 Amazon Linux 2-Plattformen laufen **30.06.2026** aus → Migration auf AL2023.

## 💡 Der eine Satz zum Mitnehmen

**Beanstalk-Fragen sind fast immer Deployment-Fragen** — die richtige Policy fällt aus zwei Angaben im Szenario heraus: „Downtime erlaubt?" und „Kapazität/Kosten während des Deployments?" — und wenn ein sofortiger Rollback gefordert ist, heißt die Antwort **Immutable** oder **CNAME-Swap**.
