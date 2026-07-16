---
service: AWS Lambda
seedKey: saa-c03-script-lambda
batch: B3
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
  - https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html
  - https://aws.amazon.com/blogs/aws/aws-lambda-snapstart-for-python-and-net/
status: draft
---

# AWS Lambda

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Lambda = **Code ohne Server**: Du lädst eine Funktion hoch, AWS führt sie bei einem Event aus (S3-Upload, API-Gateway-Request, EventBridge-Regel, SQS-Nachricht) und rechnet **pro Millisekunde** ab — ohne Aufruf keine Kosten. Skaliert automatisch von 0 auf tausende parallele Ausführungen.

Der SAA prüft Lambda vor allem an seinen **Grenzen**: Timeout, Speicher, Concurrency, Cold Starts — und der VPC-Falle.

---

## 🎯 SAA-Vertiefung

### Die Limits, an denen sich Antworten entscheiden

**Das Problem:** Die halbe Prüfung besteht aus Fragen, bei denen Lambda *fast* passt — und die Kunst ist zu erkennen, an welcher harten Grenze es scheitert.

**Die Lösung — die Zahlen, die man wirklich können muss:**

| Grenze | Wert |
|---|---|
| **Timeout** | **max. 15 Minuten** |
| Memory | 128 MB – **10.240 MB (10 GB)** — die **vCPU-Leistung skaliert mit dem Memory** |
| `/tmp` (ephemeral) | 512 MB – 10.240 MB |
| Deployment Package | 50 MB (zipped) / 250 MB (entpackt) · **Container Image bis 10 GB** |
| Payload | **6 MB synchron** / 256 KB asynchron |
| Concurrency (Account) | Default **1.000** parallel (erhöhbar) |

Daraus fallen die Reflexe:
- **„Job läuft 45 Minuten"** → **nicht Lambda** (15-Min-Limit) → **Fargate** oder **AWS Batch**.
- **„Funktion ist zu langsam / CPU-gebunden"** → **mehr Memory zuweisen** — denn die CPU wächst mit. Der Distraktor „mehr vCPU einstellen" existiert nicht: Es gibt keinen separaten CPU-Regler.
- **„Große Datei verarbeiten"** → nicht als Payload durchreichen (6 MB!), sondern **S3-Event mit Objekt-Referenz**.
- **„Braucht 50 GB gemeinsamen Speicher"** → nicht `/tmp` (max. 10 GB, pro Instanz), sondern **EFS via Access Point**.

> **💡 Merksatz:** **15 Minuten** ist die härteste Lambda-Grenze — darüber gehört der Job zu Fargate/Batch. Und **mehr CPU gibt es nur über mehr Memory**.

### Concurrency: Der Nachbar, der die ganze Etage lahmlegt

**Das Problem:** Eine unwichtige Report-Funktion läuft Amok und verbraucht alle 1.000 parallelen Ausführungen des Accounts — die **Checkout-Funktion** wird gedrosselt. Der Shop steht.

**Die Lösung:** Zwei Regler mit sehr verschiedenen Zwecken:
- **Reserved Concurrency** = eine **Quote**, die einer Funktion garantiert *und* sie zugleich deckelt. Zwei Effekte in einem: Sie sichert der Checkout-Funktion ihren Anteil und **begrenzt** die Amok-Funktion (Schutz für nachgelagerte Systeme wie eine RDS, die nicht 1.000 Verbindungen verträgt).
- **Provisioned Concurrency** = eine **vorgewärmte** Anzahl Instanzen — gegen Cold Starts, nicht gegen Überlastung.

🛑 **Und die Skalierung selbst ist seit Ende 2023 neu:** Jede Funktion skaliert **um 1.000 parallele Ausführungen alle 10 Sekunden — pro Funktion, unabhängig voneinander** (bis das Account-Limit erreicht ist). Die alte, gern auswendig gelernte Burst-Tabelle („500–3.000 initial, dann +500/Minute, account-weit") ist damit **überholt** und in neuen Fragen ein veralteter Distraktor.

> **💡 Merksatz:** **Reserved** Concurrency = garantieren *und* deckeln (Nachbarschaftsschutz). **Provisioned** Concurrency = vorwärmen (Cold Starts). 🛑 Skalierung: **1.000 / 10 s pro Funktion**.

### Cold Starts: Aufwachen kostet Zeit

**Das Problem:** Die erste Anfrage nach einer Ruhephase dauert 3 Sekunden — bei einer Java-Funktion mit schwerem Framework sogar länger. Für eine API hinter einem SLA ist das inakzeptabel.

**Die Lösung — drei Hebel, in dieser Reihenfolge:**
1. **Provisioned Concurrency:** hält N Instanzen initialisiert und warm. Wirkt immer, kostet dauerhaft.
2. 🛑 **SnapStart:** friert die **initialisierte** Funktion als Snapshot ein und startet daraus — verfügbar für **Java, Python (3.12+) und .NET (8+)** (Python/.NET seit 11/2024). Deutlich billiger als Provisioned Concurrency, aber: **nicht kombinierbar** mit Provisioned Concurrency, EFS oder großem `/tmp`, und es gibt sie nicht für Node.js/Ruby oder Container-Images.
3. **Weniger Ballast:** kleinere Pakete, Lambda **Layers** für geteilte Abhängigkeiten, Initialisierung außerhalb des Handlers.

> **💡 Merksatz:** Cold Starts: **SnapStart** (Java/Python/.NET, günstig) oder **Provisioned Concurrency** (jede Runtime, teurer) — nie beides zusammen.

### Die VPC-Falle: Lambda im privaten Netz verliert das Internet

**Das Problem:** Eine Lambda soll auf eine RDS im privaten Subnetz zugreifen — funktioniert. Gleichzeitig ruft sie eine externe Payment-API auf — und die Aufrufe laufen plötzlich in den Timeout.

**Die Lösung:** Sobald man Lambda **in eine VPC** hängt, gilt normales VPC-Networking: Die Funktion sitzt in einem **privaten Subnetz ohne Internetzugang**. Für Aufrufe nach draußen braucht sie ein **NAT Gateway**; für AWS-Dienste (S3, DynamoDB, Secrets Manager) reichen **VPC Endpoints** — der billigere und sicherere Weg. Eine „öffentliche IP für Lambda" gibt es nicht — dieser Distraktor ist immer falsch.

Das Gegenstück: **Lambda braucht nur dann eine VPC, wenn sie auf private Ressourcen zugreift** (RDS, ElastiCache, interne Services). Ohne diesen Bedarf ist die VPC-Anbindung unnötig.

> **💡 Merksatz:** Lambda in der VPC = **kein Internet ohne NAT Gateway**; für AWS-Dienste **VPC Endpoints**. Eine „public IP für Lambda" existiert nicht.

### Das Ökosystem: Events, Fehler, Rand

- **Event Source Mappings** (SQS, Kinesis, DynamoDB Streams): Lambda *pollt* hier selbst. Stellschrauben: **Batch Size**, **Batch Window**, **Partial Batch Response** (nur die wirklich fehlgeschlagenen Nachrichten zurück in die Queue — sonst wird der ganze Batch erneut verarbeitet).
- **Fehlerbehandlung:** **DLQ** (nur die fehlgeschlagene Nachricht) vs. **Destinations** (moderner: Erfolg *und* Fehler mit vollem Kontext an SQS/SNS/EventBridge/Lambda).
- **Kosten:** **Graviton (arm64)** ist bei gleichem Code günstiger; **Compute Savings Plans decken Lambda-Duration ab**.
- **Abgrenzung am Edge:** **Lambda@Edge** (volle Runtime, für Request-/Response-Manipulation an CloudFront) vs. **CloudFront Functions** (winzige JS-Snippets, Mikrosekunden, nur Header/URL-Rewrites — billiger und schneller für Einfaches).

> **💡 Merksatz:** SQS-Batch nur teilweise fehlerhaft → **Partial Batch Response**. Fehler *und* Erfolg mit Kontext weiterleiten → **Destinations** (statt DLQ). Simple Header-Manipulation am Edge → **CloudFront Functions**, nicht Lambda@Edge.

---

## ⚠️ Prüfungs-Knackpunkte

- **Timeout 15 min** (darüber: Fargate/Batch) · Memory 128 MB–10 GB (**CPU skaliert mit Memory**) · `/tmp` bis 10 GB · Payload **6 MB sync** / 256 KB async · Container Image bis 10 GB.
- Geteilter/großer persistenter Speicher → **EFS via Access Point** (nicht `/tmp`).
- **Reserved Concurrency** = garantieren + deckeln (schützt Nachbarn und nachgelagerte DBs); **Provisioned Concurrency** = vorwärmen.
- 🛑 Skalierung **1.000 / 10 s pro Funktion** — alte Burst-Tabelle ist überholt.
- Cold Starts → 🛑 **SnapStart** (Java/Python/.NET, nicht mit Provisioned Concurrency/EFS kombinierbar) oder **Provisioned Concurrency**.
- Lambda in VPC → **kein Internet ohne NAT Gateway**; AWS-Dienste über **VPC Endpoints**; keine public IP.
- Zu viele DB-Verbindungen durch Lambda → **RDS Proxy** (siehe B2).
- **Partial Batch Response** bei SQS/Kinesis; **Destinations** statt DLQ für Erfolg+Fehler mit Kontext.
- Kosten: **Graviton/arm64**, **Compute Savings Plans** decken Lambda.
- Edge: **CloudFront Functions** (leicht, JS) vs. **Lambda@Edge** (voll).

## 💡 Der eine Satz zum Mitnehmen

**Lambda-Fragen sind Grenzfragen** — 15 Minuten, 10 GB, 6 MB, 1.000 parallel: Wer weiß, an welcher Wand die Funktion zerschellt, kennt automatisch die richtige Alternative (Fargate, Batch, EFS, S3, RDS Proxy).
