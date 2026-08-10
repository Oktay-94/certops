---
cardNumber: 2
slug: ecs-fargate-shopflow-container
title: "Battle Card 2 — ECS Fargate · ALB · ECR"
services: ["Amazon ECS", "AWS Fargate", "Application Load Balancer", "Amazon ECR"]
domains: ["D3"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html"
  - "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/security-iam-roles.html"
  - "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-networking.html"
  - "https://docs.aws.amazon.com/AmazonECR/latest/userguide/ECR_on_ECS.html"
---

## Die Grundidee zuerst

Du hast eine Kiste gepackt. Alles drin, was die App braucht — Code, Laufzeitumgebung, Bibliotheken, Konfiguration. Die Kiste ist fertig und sie funktioniert auf deinem Rechner. Jetzt muss sie irgendwohin, wo Kunden sie erreichen.

**Weg eins:** Du kaufst einen LKW. Dann brauchst du einen Führerschein, eine Garage, einen Werkstatttermin alle sechs Monate, jemanden, der tankt, und einen zweiten LKW für den Fall, dass der erste ausfällt. Die Kiste steht die ganze Zeit hinten drin und wartet darauf, dass sich endlich jemand um den LKW gekümmert hat. Du wolltest nie einen LKW besitzen. Du wolltest eine Kiste transportieren.

**Weg zwei:** Du bringst die Kiste zum Schalter, sagst wie schwer sie ist und wohin sie soll, und gibst sie ab. Was für ein Fahrzeug sie transportiert, wer es wartet und wo es nachts steht, erfährst du nie — weil es dich nichts angeht.

Weg eins ist der EC2-Launch-Type. Weg zwei ist Fargate.

ShopFlow hat seinen Container fertig. Die gesamte offene Frage in diesem Szenario lautet: Wie viel LKW muss man besitzen, um eine Kiste auszuliefern? Antwort: keinen.

## Was es eigentlich ist — die Task Definition

Es gibt kein Server-Objekt in dieser Architektur. Das zentrale Objekt ist ein **Formular**, auf dem steht, wie schwer die Kiste ist und wohin sie soll:

```json
{
  "family": "shopflow-web",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::1234:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::1234:role/shopflowAppRole",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "1234.dkr.ecr.eu-central-1.amazonaws.com/shopflow:v2.7.1",
      "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/shopflow-web",
          "awslogs-region": "eu-central-1"
        }
      }
    }
  ]
}
```

Lies das von oben nach unten — es ist die komplette Lösung der Aufgabe.

`networkMode: awsvpc` ist bei Fargate **nicht wählbar**, sondern vorgeschrieben. `cpu` und `memory` sind das einzige Kapazitätsgespräch, das noch stattfindet: 0,5 vCPU und 1 GB. Keine Instanzfamilie, keine AMI, keine Anzahl von Hosts.

Und dann zwei ARNs, die fast gleich aussehen und völlig Verschiedenes tun — `executionRoleArn` und `taskRoleArn`. Genau die sind der Kern der nächsten Abschnitte.

Kein Server in diesem Dokument. Nur eine Beschreibung dessen, was laufen soll.

## Der Weg durch die Karte

### Kasten links — Nutzer

Der blaue Startpunkt: die ShopFlow-Web-App, HTTPS-Traffic. Der Zusatz „(Docker-Container)" im Kasten ist streng genommen an der falschen Stelle — der Nutzer hat keinen Container, die App auf AWS-Seite hat einen. Lies ihn als Hinweis auf die Ausgangslage der Aufgabe: Der Container existiert bereits, er ist nicht Teil der Lösung, er ist ihre Voraussetzung.

### Badge 1 — HTTPS an den Application Load Balancer

Der erste Pfeil endet bei einer stabilen Adresse. Das ist der einzige Grund, warum der ALB auf dieser Karte steht.

Das Bild dazu: eine Firmenzentrale mit einer Postanschrift. Innen ziehen Abteilungen ständig um, Büros werden geteilt und zusammengelegt, Mitarbeiter kommen und gehen. Die Anschrift auf dem Briefkopf ändert sich nie. Genau das leistet der ALB — er entkoppelt „wohin schickt der Kunde seinen Request" von „welche Container laufen gerade".

Er terminiert außerdem TLS und arbeitet auf Layer 7, kann also nach Pfad und Host routen. Für dieses Szenario ist das Nebensache. Die Hauptsache ist die feste Adresse.

### Kasten — Application Load Balancer

„Target Group = Tasks" steht im Kasten, und das ist präziser, als es aussieht.

Bei klassischen EC2-Zielgruppen registrierst du **Instanzen**. Weil jeder Fargate-Task im `awsvpc`-Modus eine eigene ENI mit eigener privater IP bekommt, ist die Zielgruppe hier vom Typ **IP**, nicht vom Typ Instance. Das ist keine Formalie: Der ECS-Service trägt neue Tasks selbst in die Zielgruppe ein und ab, sobald sie den Health-Check bestehen oder verschwinden. Du pflegst diese Liste nie.

Die Konsequenz, wenn man es doch von Hand macht: ECS überschreibt es beim nächsten Deployment.

### Badge 2 — Routing auf die Tasks

Der ALB verteilt auf alle **gesunden** Tasks. Das Wort „gesund" trägt hier mehr Gewicht als bei EC2, weil Tasks sehr viel häufiger kommen und gehen als Instanzen.

Fällt ein Task aus, meldet ECS ihn ab und startet Ersatz. Skaliert der Service hoch, kommen Tasks hinzu und werden nach bestandenem Health-Check aufgenommen. Zwischen „Task existiert" und „Task bekommt Traffic" liegt immer der Health-Check — und wenn der falsch konfiguriert ist, bekommt ein perfekt laufender Container niemals einen Request.

### Der gestrichelte Rahmen — Amazon ECS, Launch Type Fargate

Der gestrichelte Kasten ist keine Ressource. Er markiert eine Zuständigkeitsgrenze: Alles darin gehört ECS, und ECS betreibt es im Launch Type Fargate.

Das ist die Stelle, an der die häufigste Verwechslung der ganzen Karte sitzt. **ECS und Fargate sind keine zwei Dienste nebeneinander.** ECS ist der Orchestrator — er entscheidet, wie viele Tasks laufen, startet Ersatz, führt Deployments aus. Fargate ist die Antwort auf die Frage, *worauf* diese Tasks laufen.

Das Bild dazu: ECS ist die Disposition einer Spedition, die entscheidet, welche Kiste wann fährt. Fargate ist die Entscheidung, keine eigenen LKW zu besitzen. Die Disposition bleibt dieselbe, wenn du dich für eigene LKW entscheidest — dann heißt es EC2-Launch-Type.

### Kasten — Fargate Task

Drei Zeilen, die alle dasselbe sagen: „1 Container, eigene ENI + IP, awsvpc-Modus".

Ein Task ist die laufende Ausprägung der Task Definition von oben. Er bekommt eine eigene Netzwerkkarte und eine eigene private IP **aus deinem Subnetz** — nicht aus einem AWS-internen Bereich, sondern aus dem CIDR, das du selbst vergeben hast.

Das ist bequem, weil Security Groups und VPC Flow Logs dadurch pro Task funktionieren wie bei einer eigenen Maschine. Und es hat eine Nebenwirkung, die weiter unten steht.

### Badge 3 — Image-Pull, und wer ihn wirklich ausführt

Der gestrichelte Pfeil von ECR nach unten zeigt den Weg des Images. Der Pfeil stimmt als Datenfluss — aber die Frage, die dich in der Prüfung erwischt, ist eine andere: **Wer holt das Image?**

Nicht der Container. Der existiert zu diesem Zeitpunkt noch gar nicht.

Es ist der **Fargate-Agent**, und er benutzt dafür die `executionRoleArn` aus der Task Definition — die **Task Execution Role**. Die AWS-Doku formuliert das eindeutig: Diese Rolle erlaubt es den ECS- und Fargate-Agenten, API-Aufrufe in deinem Namen zu machen, und ihr klassischer Anwendungsfall ist genau das Ziehen eines Images aus einer privaten ECR-Repository sowie das Schreiben von Logs nach CloudWatch.

Die Doku hält außerdem ausdrücklich fest, dass diese Berechtigungen dem Agenten zur Verfügung stehen und **nicht direkt für die Container im Task zugänglich** sind.

Das ist die Reihenfolge, die man sich merken muss: erst Rolle, dann Image, dann Container. Wer den Container als Akteur denkt, dreht die Kausalität um.

### Der grüne Kasten — AWS managt die Compute-Ebene

Dieser Kasten ist kein Ablaufschritt, sondern die Begründung der ganzen Karte. Vier Dinge, die aufhören zu existieren: EC2 provisionieren, AMIs pflegen, Kernel und Host patchen, Cluster-Kapazität planen.

Der letzte Punkt ist der unterschätzte. Beim EC2-Launch-Type stellt sich bei jedem Deployment die Frage, ob auf den vorhandenen Instanzen überhaupt genug freie CPU und RAM für die neuen Tasks sind. Passt es nicht, bleiben Tasks im Zustand `PENDING` hängen, und du löst ein Rätsel, das mit deiner Anwendung nichts zu tun hat.

Bei Fargate stellt sich die Frage nicht. Jeder Task bringt seine eigene Kapazität mit.

## Die entscheidende Unterscheidung

Zwei IAM-Rollen stehen in derselben Task Definition, sie sehen fast gleich aus, und sie werden regelmäßig verwechselt. Der Unterschied ist nicht akademisch — er bestimmt, ob dein Task startet und ob deine App danach arbeiten kann:

| | Task Execution Role | Task Role |
|---|---|---|
| Feld | `executionRoleArn` | `taskRoleArn` |
| Wer benutzt sie? | der ECS-/Fargate-Agent | dein Anwendungscode im Container |
| Wofür? | Image aus ECR ziehen, Logs nach CloudWatch schreiben, Secrets auflösen | S3 lesen, in DynamoDB schreiben, SQS-Nachrichten holen |
| Wann greift sie? | **vor** dem Start des Containers | **nach** dem Start, zur Laufzeit |
| Fehlt sie? | Task startet gar nicht erst | Task läuft, aber die App bekommt `AccessDenied` |

Die Fehlerbilder sind der beste Merkanker. **Task kommt nicht hoch → Execution Role. Task läuft und wirft AccessDenied → Task Role.** Wer das umdreht, sucht Berechtigungen an der Stelle, an der sie nie gebraucht wurden.

## Die ehrliche Feinheit

Der gestrichelte ECR-Pfeil auf der Karte sieht aus, als wäre er kostenlos und selbstverständlich. Er ist beides nicht.

**Ein Fargate-Task in einem privaten Subnetz kommt ohne Zutun nicht an ECR heran.** ECR ist ein regionaler Dienst mit öffentlichem Endpunkt; der Task hat nur eine private IP. Es gibt genau zwei Auswege, und beide muss jemand aktiv bauen: ein NAT Gateway im öffentlichen Subnetz, oder ein Interface-VPC-Endpoint für ECR, über den der Pull über die private IPv4-Adresse des Tasks läuft.

Das Fehlerbild dabei ist besonders unfreundlich: Der Task bleibt in `PENDING` hängen und stirbt mit `CannotPullContainerError`. Deine Anwendung ist völlig in Ordnung. Die Ursache liegt drei Ebenen tiefer im Routing. Wer nicht weiß, dass der Pull überhaupt Netzwerk braucht, sucht sehr lange.

**Zweite Feinheit, die aus dem `awsvpc`-Modus folgt:** Jeder Task verbraucht eine IP aus deinem Subnetz. Bei zwanzig Tasks fällt das nicht auf. Bei einem Deployment, das kurzzeitig alte und neue Tasks parallel hält, verdoppelt sich der Bedarf. Und ein `/27`-Subnetz mit 32 Adressen, von denen AWS fünf für sich behält, ist schneller voll, als man denkt. Die Subnetzgröße wird bei Fargate zur Skalierungsgrenze — ein Zusammenhang, der bei EC2 so nicht existiert, weil dort viele Container eine Instanz-IP teilen.

**Dritte Feinheit, die die Karte nicht zeigt:** Zwischen dem Kasten „Fargate Task" und dem Text „skaliert per Service Auto Scaling" fehlt ein Objekt — der **ECS Service**. Der Task allein skaliert nicht und startet auch nicht neu, wenn er stirbt. Erst der Service hält eine Soll-Anzahl aufrecht, führt Rolling Deployments aus und spricht mit der Target Group. Ein einzelner Task, mit `RunTask` gestartet, läuft und ist danach weg. Die Karte zeigt das Ergebnis, nicht den Regler.

**Vierte, und die kostet in der Prüfung Punkte:** Fargate kann kein GPU. Wenn im Szenario Machine-Learning-Inferenz oder Rendering auftaucht, ist Fargate raus — unabhängig davon, wie gut „kein Server verwalten" sonst passt.

## Syntax lesen — die ECR-Image-URI

Die längste Zeile der Task Definition ist keine URL, sondern eine Adresse mit fünf Bestandteilen:

```
1234.dkr.ecr.eu-central-1.amazonaws.com/shopflow:v2.7.1
 │        │        │                        │        │
 │        │        │                        │        └─ Tag
 │        │        │                        └─ Repository-Name
 │        │        └─ Region
 │        └─ fester Dienst-Bestandteil (dkr.ecr)
 └─ AWS-Account-ID
```

Zwei Dinge werden daran regelmäßig geprüft.

**Die Account-ID am Anfang** bedeutet, dass Registries kontogebunden sind. Ein Image aus einem fremden Account zu ziehen, ist möglich, verlangt aber eine Repository-Policy drüben **und** passende Rechte in deiner Task Execution Role hier. Zwei Seiten müssen zustimmen.

**Die Region in der Mitte** bedeutet, dass ECR regional ist. Ein Image, das in `eu-central-1` liegt, ist in `us-east-1` nicht automatisch vorhanden. Wer eine Anwendung in mehreren Regionen betreibt, braucht Cross-Region-Replikation oder einen Push pro Region — das wird gern als „Warum startet mein Task in der neuen Region nicht?" verpackt.

Und das Tag am Ende: `:latest` ist in Produktion eine Falle, weil dieselbe Task Definition dann zu verschiedenen Zeitpunkten verschiedene Images meint. Feste Versionen wie `v2.7.1` machen ein Deployment reproduzierbar und ein Rollback überhaupt erst möglich.

## Was du dadurch nicht baust

- keine EC2-Instanzen, keine Instanzfamilie, keine Instanzanzahl
- keine AMIs und keinen AMI-Aktualisierungszyklus
- kein Betriebssystem-Patching, kein Kernel-Update, keinen Neustartplan
- keinen ECS-Container-Agenten, den jemand aktuell halten müsste
- keine Cluster-Kapazitätsplanung und keine Frage, ob Tasks noch auf einen Host passen
- keine SSH-Zugänge, keine Bastion-Hosts, keine Schlüsselverwaltung für Hosts
- keine Entscheidung, wie viele Container sich eine Maschine teilen

Übrig bleiben: ein Image in ECR, ein JSON-Dokument, ein Service, der die Anzahl hält.

## Wenn du dir eine Sache merkst

**ECS entscheidet, was läuft. Fargate entscheidet, dass du dafür keine Maschine besitzt. Das sind zwei Antworten auf zwei verschiedene Fragen, nicht zwei Dienste zur Auswahl.**

Lambda ist ebenfalls serverless, aber kurzlebig und request-getrieben — ein fertiger, dauerhaft laufender Webdienst passt nicht in dieses Modell. EKS orchestriert ebenfalls Container, bringt aber die gesamte Kubernetes-Bedienoberfläche mit, die ShopFlow ausdrücklich nicht will. Der EC2-Launch-Type wäre technisch möglich und bringt genau die Instanzverwaltung zurück, die aus der Aufgabe gestrichen werden sollte.

## Prüfungsknackpunkte

**Signalwörter:** „bestehender Docker-Container", „kein Cluster-Management", „kein OS-Patching", „minimaler operativer Aufwand". Der Trenner zwischen Fargate und EC2-Launch-Type ist fast immer das Begriffspaar *operational overhead* gegen *control* beziehungsweise *cost at scale*.

**Die ECS-ist-nicht-Fargate-Falle.** Formulierungen wie „welcher Service ersetzt ECS durch Fargate" sind falsch gestellt. Fargate ist ein Launch Type innerhalb von ECS — und ebenso innerhalb von EKS. Wer das weiß, erkennt eine kaputte Antwortoption sofort.

**Die Rollen-Falle.** „Der Task kann das Image nicht ziehen" → Task Execution Role. „Die Anwendung im Container darf nicht auf S3 zugreifen" → Task Role. Diese beiden Formulierungen sind der häufigste Weg, die Unterscheidung abzufragen.

**Die Subnetz-Falle.** Taucht „Tasks lassen sich nicht weiter hochskalieren, obwohl das Konto-Limit nicht erreicht ist" auf, ist die Antwort meist der IP-Vorrat des Subnetzes — Folge davon, dass `awsvpc` jedem Task eine eigene ENI gibt.

**Warum der EC2-Launch-Type hier verliert:** Er ist billiger bei hoher konstanter Auslastung und erlaubt GPU sowie freie Instanzwahl — aber er bringt jede Aufgabe zurück, die die Aufgabenstellung ausdrücklich ausschließt.

**Warum Lambda hier verliert:** Der Container existiert bereits und läuft dauerhaft. Lambda müsste ihn umbauen und begrenzt jede Ausführung auf 15 Minuten.

**Warum EKS hier verliert:** gleiche Container, deutlich mehr Bedienoberfläche. Ohne ein Kubernetes-Signalwort im Text ist EKS bei „minimalem Ops-Aufwand" die falsche Antwort.
