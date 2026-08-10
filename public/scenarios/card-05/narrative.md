---
cardNumber: 5
slug: app-runner-ecr-container-ohne-infra
title: "Battle Card 5 — AWS App Runner · ECR"
services: ["AWS App Runner", "Amazon ECR", "Amazon ECS Express Mode", "AWS Fargate"]
domains: ["D3"]
badgeCount: 2
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html"
  - "https://aws.amazon.com/apprunner/pricing/"
  - "https://docs.aws.amazon.com/apprunner/latest/dg/network-vpc.html"
  - "https://docs.aws.amazon.com/apprunner/latest/api/API_VpcConnector.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, in einer fremden Stadt zu übernachten.

**Weg eins:** Du mietest eine leere Wohnung. Vorher: Mietvertrag, Kaution, Strom anmelden, Internet bestellen, Möbel besorgen, Schlüssel für die Haustür, Namensschild an die Klingel, Müllabfuhr klären. Danach wohnst du gut, und alles darin gehört dir. Du kannst Wände streichen und den Sicherungskasten umbauen.

**Weg zwei:** Du gehst ins Hotel. Koffer abstellen, Schlüsselkarte einstecken, fertig. Strom, WLAN, Handtücher, Reinigung, Brandmelder — alles da. Du wirst nie erfahren, wo die Heizungsanlage steht, und du wirst es auch nie brauchen.

Die leere Wohnung ist ein Container auf ECS Fargate mit VPC, Subnetzen, Security Groups, Load Balancer, Target Group, Task-Definition und Cluster. Das Hotel ist **AWS App Runner**: Du zeigst auf ein Image, du bekommst eine HTTPS-URL.

Und jetzt die Wendung, die diese Karte 2026 besonders macht: **Das Hotel nimmt keine neuen Gäste mehr auf.** Wer schon eincheckt hat, wohnt weiter. Nebenan hat derselbe Betreiber ein neues Haus eröffnet, mit derselben Rezeption — aber diesmal darfst du auch in den Keller. Das Haus heißt **Amazon ECS Express Mode**.

## Was es eigentlich ist — ein Service ohne Umgebung

Bei ECS beschreibst du eine Umgebung: Cluster, Task-Definition, Service, Netzwerkkonfiguration, Load Balancer, Listener, Target Group. Bei App Runner beschreibst du nur, was laufen soll:

```json
{
  "ServiceName": "zettelwerk-web",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/zettelwerk:1.4.2",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": { "Port": "8080" }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": { "Cpu": "1 vCPU", "Memory": "2 GB" }
}
```

Lies das einmal von oben nach unten. Was steht drin? Ein Name. Ein Image. Ein Port. Ob bei einem neuen Image automatisch deployt werden soll. Wie groß die Instanz ist.

Interessanter ist, was **nicht** drinsteht: keine `subnets`, keine `securityGroups`, keine `targetGroupArn`, keine `taskDefinition`, kein `cluster`, kein `certificateArn`. Diese Dinge existieren trotzdem — App Runner baut und betreibt sie, nur eben in *seinem* Konto und außerhalb deines Blickfelds.

**Das ist die ganze Idee der höchsten Abstraktionsebene: nicht dass es keine Infrastruktur gibt, sondern dass sie dir nicht gehört.**

## Der Weg durch die Karte

### Kasten links — Amazon ECR, der Startpunkt

Am Anfang steht ein fertig gebautes Container-Image im ECR-Repository, dorthin gebracht mit einem `docker push`. Der Ausgangspunkt der Aufgabe ist bewusst so gewählt: Das Team hat schon ein Image. Es fehlt nicht das Bauen, es fehlt das Betreiben.

App Runner kann alternativ auch aus einem Quell-Repository bauen — ein Feature, das der Nachfolger nicht mitbringt. Für dieses Szenario ist der Weg über ECR der relevante.

### Badge 1 — Image ziehen

App Runner holt das Image und erzeugt daraus einen Service. Kein Cluster wird angelegt, keine Task-Definition geschrieben, keine Capacity-Provider-Strategie gewählt.

Das Bild dazu: Du gibst an der Rezeption deinen Koffer ab und sagst „Zimmer bitte". Was das Haus daraufhin intern tut — Zimmer zuweisen, Bettwäsche holen, Schlüsselkarte codieren — steht nicht in deinem Vertrag.

### Kasten Mitte — was „AWS erledigt intern alles" wirklich umfasst

Die vier kleinen Kästen im orangen Rahmen sind genau die Arbeit, die dir sonst gehört:

**Load Balancing + HTTPS-Endpunkt.** Bei ECS wärst du hier bei ALB, Listener, Rules, Target Group und Health-Check-Pfad. Hier ist es die Voreinstellung.

**Auto Scaling.** App Runner skaliert nach *gleichzeitigen Anfragen*, nicht nach CPU. Du legst eine Concurrency fest — wie viele parallele Requests eine Instanz verträgt — und der Rest ergibt sich daraus. Nach oben begrenzt du das über ein Maximum an aktiven Instanzen, damit die Rechnung das Budget nicht überholt. Dazu eine Abrechnungsfeinheit, die man erst im zweiten Monat bemerkt: Sobald eine provisionierte Instanz anfängt, Requests zu verarbeiten, gilt für die vCPU eine **Mindestabrechnung von einer Minute**. Bei sehr sporadischem Traffic zahlst du also Minuten für Arbeit, die Millisekunden gedauert hat.

Auf der Karte steht hinter „Auto Scaling" in Klammern „inkl. scale-to-zero". Das ist falsch, und weil es die Kostenlogik betrifft, steht es weiter unten mit Zahlen.

**Deploy + CI/CD.** Wird ein neues Image mit demselben Tag nach ECR gepusht, deployt App Runner automatisch nach. Kein Pipeline-Schritt, kein Deployment-Skript. Bequemlichkeit mit Preisschild: Für automatische Deployments berechnet AWS eine feste monatliche Gebühr je Anwendung, und wer statt eines fertigen Images Quellcode hinterlegt, zahlt zusätzlich eine Build-Gebühr für die Zeit, die App Runner zum Bauen des Containers braucht. Kleine Beträge — aber sie zeigen, wo abgerechnet wird: genau an den Stellen, an denen dir Arbeit abgenommen wird.

**TLS-Zertifikat + CloudWatch-Logs.** Das Zertifikat für die Standard-URL kommt mit, Logs landen ohne Konfiguration in CloudWatch.

### Der graue Streifen — die vier Verneinungen

„kein VPC · kein ALB · keine Task-Definition · kein Cluster" ist die eigentliche Antwort auf die Aufgabenstellung. Die Frage lautete ja nicht „welcher Service kann Container ausführen" — das können vier oder fünf. Sie lautete: **„ohne VPC, ALB und Scaling anzufassen".** Diese vier Wörter sind die Prüfungsfrage, und dieser Streifen ist die Antwort.

Eine Einschränkung dazu steht in „Die ehrliche Feinheit": *kein VPC* gilt für den Happy Path.

### Badge 2 — HTTPS-URL

Der Dienst ist unter einer fertigen Adresse im Muster `*.awsapprunner.com` erreichbar, inklusive TLS. Niemand hat ein Zertifikat beantragt, keinen DNS-Eintrag gesetzt, keine Listener-Regel geschrieben.

Eigene Domains sind möglich — dafür braucht es dann doch wieder ein ACM-Zertifikat und DNS-Arbeit. Die Abstraktion endet an der Grenze deines eigenen Namensraums.

### Kasten rechts — Nutzer

Der Kasten steht da, damit klar wird, dass hier tatsächlich Schluss ist. Kein CloudFront davor, kein WAF, kein API Gateway. Ein öffentlicher HTTPS-Endpunkt, direkt.

### Der rote Kasten — Service-Status

Der auffälligste Kasten der Karte enthält keine Architektur, sondern eine Nachricht: App Runner geht in den Maintenance Mode.

Der Stand laut AWS: Im März 2026 hat AWS eine Sammelankündigung zu Serviceverfügbarkeiten veröffentlicht, in der App Runner unter „Services moving to Maintenance" steht — **ab dem 30. April 2026 keine Neukunden mehr**. Bestandskunden nutzen den Service weiter, ausdrücklich einschließlich des Anlegens neuer Ressourcen und Services. AWS investiert weiter in Sicherheit und Verfügbarkeit, plant aber **keine neuen Features**.

Die Karte formuliert das im Futur — „ab 30.04.2026". Dieses Datum liegt inzwischen hinter uns, und die App-Runner-Dokumentation schreibt heute im Präsens: App Runner ist für Neukunden nicht mehr geöffnet. Inhaltlich stimmt die Karte, sprachlich ist sie abgelaufen.

Als Migrationspfad empfiehlt AWS **Amazon ECS Express Mode**: ein API-Aufruf, ein Container-Image, zwei IAM-Rollen — und ECS provisioniert einen kompletten Anwendungsstack **in deinem Konto**: ECS-Service auf Fargate, Application Load Balancer, Auto Scaling, Networking. Für Express Mode selbst berechnet AWS nichts; du zahlst die darunterliegenden Ressourcen.

## Die entscheidende Unterscheidung

Die Achse heißt Einfachheit gegen Kontrolle — und ECS Express Mode hat sie verschoben:

| | App Runner | ECS Express Mode | ECS Fargate | AWS Lambda |
|---|---|---|---|---|
| Du lieferst | Image **oder** Quellcode | Image + 2 IAM-Rollen | Task-Definition, Service, Netzwerk | Funktions-Code |
| Wo liegt die Infrastruktur | im AWS-Konto von App Runner | **in deinem Konto, sichtbar** | in deinem Konto | keine sichtbare |
| ALB / VPC / Scaling | unsichtbar | automatisch angelegt, danach zugänglich | deine Aufgabe | entfällt |
| Laufzeitmodell | dauerhafter Webservice | dauerhafter Webservice | beliebig, auch Batch | Funktion, max. 15 Minuten |
| Für Neubau heute | nicht mehr wählbar | ja | ja | ja |

Der Grund für App Runners Ende steht in dieser Tabelle: Express Mode liefert dieselbe Einfachheit, ohne die Ressourcen zu verstecken. Zwei Produkte für dieselbe Aufgabe, eines davon mit weniger Nachteilen — da fällt die Entscheidung.

## Die ehrliche Feinheit

**Erstens: „scale-to-zero" auf der Karte ist falsch, und zwar in der teuren Richtung.** App Runner skaliert die *aktiven* Instanzen herunter, aber nicht auf null. Die AWS-Preisseite sagt es wörtlich: Wenn die aktiven Instanzen im Leerlauf sind, fällt der Service zurück auf die **provisionierten** Container-Instanzen — Voreinstellung **eins** — und für deren Speicher zahlst du weiter, damit der Dienst ohne Cold Start antworten kann. In AWS' eigenem Beispiel für eine latenzsensitive API mit acht aktiven Stunden am Tag stehen dennoch **24 Stunden provisionierter Speicher** in der Rechnung.

Rechne es einmal für Zettelwerk mit 1 vCPU und 2 GB durch, bei null Anfragen an einem Tag: 24 h × 1 provisionierte Instanz × 2 GB × 0,007 USD je GB-Stunde = **0,34 USD pro Tag**, also gut zehn Dollar im Monat für einen Dienst, den niemand aufruft. Das ist wenig Geld und ein großer konzeptioneller Unterschied. Es gibt Pause und Resume — aber das ist ein manueller Schalter, kein Autoscaling-Zustand.

**Richtig ist also:** App Runner ist serverless im Sinne von „keine Server zu verwalten", aber **nicht** scale-to-zero im Sinne von „bei null Traffic null Kosten". Lambda ist das. App Runner nicht.

**Zweitens: „kein VPC" gilt nur, solange dein Dienst allein ist.** Sobald er eine RDS-Datenbank oder einen ElastiCache-Cluster im privaten Subnetz erreichen muss, brauchst du einen **VPC Connector** — App Runners Weg, ausgehenden Verkehr in deine VPC zu leiten, technisch über AWS Hyperplane und ENIs in deinen Subnetzen. Beim erstmaligen Anlegen kostet das laut Doku eine einmalige Startverzögerung von **zwei bis fünf Minuten**, bis der Service auf „Running" geht.

Das ist der lehrreichste Satz der ganzen Karte: **Die Abstraktion hält, bis dein Dienst nicht mehr allein auf der Welt ist.** In der Prüfung ist „App Runner kann gar keine privaten Ressourcen erreichen" deshalb eine Falschaussage, kein Vorteil.

**Drittens: Der Ausstieg ist leichter, wenn du eine eigene Domain hast.** Der offizielle Migrationsweg zu ECS Express Mode ist ein Blue/Green-Wechsel über gewichtetes Routing in Route 53: Beide Dienste laufen parallel, du verschiebst den Traffic in Stufen — 10/90, dann 25/75, dann 50/50 — und drehst bei Problemen die Gewichte zurück. Das setzt einen gemeinsamen Hostnamen voraus. Läuft dein Dienst nur unter der Standard-URL `*.awsapprunner.com`, gibt es diesen gemeinsamen Namen nicht: Der Express-Mode-Service bekommt einen anderen Endpunkt, und du musst die Clients umstellen. **Der bequeme Weg hinein macht den Weg hinaus teurer** — das ist der Preis jeder gemieteten Adresse.

**Viertens: Die Karte zeigt einen Service, den du für ein neues Design nicht mehr wählen kannst.** Sie bleibt trotzdem richtig — weil die *Frage* dahinter bleibt. Prüfungsaufgaben testen die Abstraktionsebene, nicht den Produktnamen. Wenn im Szenario „kleines Team, kein DevOps, nur ein Image, keine Infrastrukturarbeit" steht, ist die gesuchte Ebene diese hier. In aktuellen Prüfungsfragen heißt die Antwort noch App Runner; in einem realen Neubau heißt sie ECS Express Mode. Beides gleichzeitig zu wissen ist die ehrliche Position.

## Syntax lesen — der Image-Identifier

Der einzige String in der Konfiguration, der wirklich etwas entscheidet:

```
123456789012.dkr.ecr.eu-central-1.amazonaws.com/zettelwerk:1.4.2
      │        │   │        │                        │        │
      │        │   │        │                        │        └─ Tag
      │        │   │        │                        └─ Repository-Name
      │        │   │        └─ Region
      │        │   └─ Service (Elastic Container Registry)
      │        └─ Docker-Registry-Endpunkt
      └─ AWS-Account-ID
```

Die Account-ID am Anfang ist der Grund, warum App Runner eine **Access Role** braucht, um überhaupt ziehen zu dürfen — das Repository gehört dir, der ziehende Service nicht.

Der Tag am Ende trägt die Falle. Steht dort `:latest` und ist `AutoDeploymentsEnabled` gesetzt, deployt jeder `docker push` sofort in Produktion — auch der aus Versehen. Ein versionierter Tag wie `1.4.2` macht aus dem Automatismus eine Entscheidung.

## Was du dadurch nicht baust

Zähl durch, was in diesem Szenario **nicht** existiert:

- keine VPC, keine Subnetze, keine Route Tables, kein Internet Gateway
- kein Application Load Balancer, kein Listener, keine Target Group, kein Health-Check-Pfad
- keine Task-Definition und kein ECS-Cluster
- keine Auto Scaling Group und keine Skalierungsrichtlinie
- kein ACM-Zertifikat und kein DNS-Eintrag für die Standard-URL
- keine Deployment-Pipeline für den Rollout

Übrig bleiben: ein Image, ein Port, eine Instanzgröße — und eine URL, die funktioniert.

## Wenn du dir eine Sache merkst

**App Runner ist die höchste Abstraktionsebene für Container auf AWS: Image rein, HTTPS-URL raus, die Infrastruktur existiert außerhalb deines Kontos. Für einen Neubau heißt dieselbe Ebene heute ECS Express Mode.**

ECS Fargate nimmt dir die Server ab, aber nicht die Umgebung — Task-Definition, Netzwerk und Load Balancer bleiben deine Arbeit. Lambda nimmt dir noch mehr ab, taugt aber nicht als dauerhaft laufender Webservice aus einem vorhandenen Docker-Image. Elastic Beanstalk provisioniert klassische EC2-Instanzen, die du danach sehen und pflegen kannst.

## Prüfungsknackpunkte

**Signalwörter:** „einfachster Weg", „kleines Team ohne DevOps", „vorhandenes Container-Image", „ohne ALB/VPC/Scaling zu konfigurieren", „minimaler operativer Aufwand", „soll einfach unter einer URL erreichbar sein".

**Die Kernachse:** Steht im Szenario *Einfachheit*, ist diese Ebene gemeint. Steht *Kontrolle* — eigene VPC, spezielle IAM-Konstruktion, Sidecars, Batch-Jobs, GPU —, ist ECS oder EKS gemeint.

**Warum ECS Fargate hier verliert:** Es löst die Aufgabe, verlangt dafür aber genau die Arbeit, die das Szenario ausschließt: Cluster, Task-Definition, VPC-Konfiguration, ALB. Wenn eine Frage „ohne Infrastruktur anzufassen" sagt und eine Antwort verlangt, Infrastruktur anzufassen, ist sie die schlechtere — auch wenn sie technisch funktioniert.

**Warum AWS Lambda hier verliert:** Beide sind serverless, aber Lambda ist ereignis- und anfragegetrieben mit 15 Minuten Maximallaufzeit und einem Programmiermodell für Funktionen. Das Szenario nennt ein fertiges Container-Image und einen dauerhaft laufenden Webservice. Das ist ein anderes Laufzeitmodell, keine andere Bequemlichkeitsstufe.

**Warum Elastic Beanstalk hier verliert:** Beanstalk ist ebenfalls „Code rein, Plattform baut", provisioniert im Hintergrund aber klassische EC2-Instanzen in einer Environment, die dir gehört und die du sehen, patchen und überwachen kannst. Es ist eine Stufe *unter* der gesuchten Abstraktion — und nicht container-first.

**Warum Amazon EKS hier verliert:** Ein Kubernetes-Cluster für einen einzelnen Webservice eines Teams ohne DevOps-Kapazität ist die Antwort mit dem höchsten Betriebsaufwand im Feld. In dieser Fragenklasse ist das immer der falsche Weg.

**Warum „EC2 mit Auto Scaling Group und ALB" hier verliert:** Es ist die vollständige Gegenthese: eigenes Betriebssystem, eigene Patches, eigene Skalierungsregeln, eigener Load Balancer. Jede einzelne Anforderung des Szenarios wird verletzt.

**Der Zeitbezug:** Die Neukunden-Sperre zum 30. April 2026 ist Kontextwissen, keine auswendig zu lernende Prüfungszahl. Was du wirklich mitnimmst, ist die Rangfolge der Abstraktionsebenen — die ändert sich nicht, wenn AWS die Produktnamen tauscht.
