---
cardNumber: 8
slug: elastic-beanstalk-rds-lebenszyklus-trennen
title: "Battle Card 8 — Elastic Beanstalk · RDS"
services: ["AWS Elastic Beanstalk", "Elastic Load Balancing", "EC2 Auto Scaling", "Amazon RDS", "AWS CloudFormation"]
domains: ["D2", "D3"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-schedule.html"
  - "https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-support-policy.html"
  - "https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/platforms-shared-responsibility.html"
  - "https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-retiring.html"
  - "https://docs.aws.amazon.com/elasticbeanstalk/latest/relnotes/relnotes-2026.html"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, einen Laden zu eröffnen.

**Weg eins:** Du mietest ein leeres Ladenlokal. Dann bestellst du Regale, lässt Strom verlegen, meldest den Internetanschluss an, kaufst eine Kasse, richtest die Beleuchtung ein und stellst eine Reinigungskraft ein. Nach sechs Wochen kannst du zum ersten Mal etwas verkaufen. Das ist EC2 mit selbst aufgesetztem Load Balancer und selbst gebauter Auto Scaling Group.

**Weg zwei:** Du mietest eine fertig eingerichtete Filiale. Regale stehen, Strom läuft, Kasse ist da, geputzt wird auch. Du bringst deine Ware und schließt auf. Nach einem Nachmittag machst du den ersten Umsatz.

Elastic Beanstalk ist die fertige Filiale. Du lieferst den Code, die Plattform stellt alles darunter — Load Balancer, Auto Scaling Group, EC2-Instanzen, Deployment, Health-Checks.

Und jetzt die Pointe, um die sich diese ganze Karte dreht.

In der fertigen Filiale ist ein Tresor eingebaut. Praktisch, denkst du, und legst deine Buchhaltung hinein. Zwei Jahre später kündigst du den Mietvertrag, weil du in eine größere Filiale ziehst. Der Vermieter baut die Einrichtung zurück — inklusive Tresor. **Mit deiner Buchhaltung darin.**

Der eingebaute Tresor ist die RDS-Instanz innerhalb der Beanstalk-Environment. Sie ist bequem, sie ist ein Klick, und sie hat denselben Lebenszyklus wie die Filiale. Deine Kundendaten gehören nicht dorthin. Sie gehören in ein Schließfach, das dir gehört und das bleibt, wenn du umziehst.

## Was es eigentlich ist — die Environment

Eine Beanstalk-Environment ist kein Server und kein Dienst, den du buchst. Sie ist ein **CloudFormation-Stack, den jemand anders für dich schreibt**.

Du beschreibst nicht, was gebaut werden soll. Du beschreibst nur, wie das Ergebnis eingestellt sein soll:

```yaml
option_settings:
  aws:elasticbeanstalk:environment:
    EnvironmentType: LoadBalanced
  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 8
  aws:autoscaling:trigger:
    MeasureName: CPUUtilization
    UpperThreshold: 70
  aws:elasticbeanstalk:application:environment:
    DB_HOST: orders-prod.abc123.eu-central-1.rds.amazonaws.com
    DB_NAME: orders
  aws:elasticbeanstalk:command:
    DeploymentPolicy: Rolling
    BatchSizeType: Percentage
    BatchSize: 25
```

Lies das von oben nach unten, und achte darauf, was **nicht** dasteht.

Es steht keine AMI-ID darin. Kein Subnetz-Layout, keine Listener-Regel, keine Target Group, keine Launch Template Version. Kein `Type: AWS::ElasticLoadBalancingV2::LoadBalancer`. Du sagst „load-balanced, zwischen zwei und acht Instanzen, hoch bei 70 Prozent CPU, Deployment in 25-Prozent-Wellen" — und Beanstalk übersetzt das in einen vollständigen CloudFormation-Stack.

Ein Detail verdient besondere Aufmerksamkeit: `DB_HOST` ist eine **Umgebungsvariable**, kein Ressourcenverweis. Beanstalk legt an dieser Stelle nichts an. Es reicht deiner Anwendung eine Zeichenkette durch. Die Datenbank dahinter existiert unabhängig, wurde woanders erzeugt und weiß von Beanstalk nichts.

Genau diese eine Zeile ist der Unterschied zwischen „Datenbank überlebt" und „Datenbank stirbt mit".

## Der Weg durch die Karte

### Kasten links — der Developer

`eb deploy / .zip` und darunter `nur Code, keine Infra`.

Der zweite Teil ist die eigentliche Aussage. Was hier hochgeht, ist ein Anwendungsartefakt — ein ZIP mit deiner Node- oder PHP-Anwendung. Keine Terraform-Datei, kein CloudFormation-Template, keine Ansible-Rolle.

Das ist die Antwort auf „kleines Team ohne Ops". Nicht weil Beanstalk mächtiger wäre als CloudFormation, sondern weil es **weniger von dir verlangt**.

### Badge 1 — upload

Ein Kommando. Beanstalk nimmt die Version an, legt sie in S3 ab und startet die Bereitstellung.

Ab hier passiert etwas, das man beim ersten Mal unterschätzt: Beanstalk baut nicht „einen Server". Es baut über CloudFormation den kompletten Stack — Application Load Balancer, Auto Scaling Group, EC2-Instanzen, Security Groups, CloudWatch-Alarme. Beim ersten Anlegen dauert das einige Minuten, und in dieser Zeit siehst du in der Konsole eine Ereignisliste, die exakt wie ein CloudFormation-Log aussieht. Weil es eines ist.

### Der gestrichelte Rahmen — die Environment

Alles innerhalb der grün gestrichelten Linie gehört **zusammen** und, das ist der Punkt, **vergeht zusammen**.

Der Rahmen ist keine Dekoration. Er ist eine Lebenszyklus-Grenze. Wenn du diese Environment terminierst — weil sie kaputt ist, weil du auf eine neue Plattformversion umziehst, weil ein Blue/Green-Wechsel ansteht — dann räumt CloudFormation alles innerhalb dieser Linie ab.

Das Bild dazu: Der Rahmen ist der Grundriss der gemieteten Filiale. Beim Auszug wird alles zurückgebaut, was innerhalb der Wände steht.

Auf der Karte steht im Rahmentitel `AL2023-Plattform`. Das ist die aktuelle Plattformgeneration, und sie ist bewusst dort vermerkt — dazu unten mehr.

### Kasten — Application LB

`Traffic verteilen`, `von EB angelegt`.

Der Zusatz ist wichtig. Dieser ALB ist nicht deiner. Du hast ihn nicht angelegt, du verwaltest ihn nicht, und er verschwindet mit der Environment. Du kannst ihn in der EC2-Konsole sehen und anfassen — aber jede Änderung, die du dort von Hand machst, ist beim nächsten Deployment möglicherweise wieder weg, weil Beanstalk den Stack als Ganzes verwaltet.

Wer etwas ändern will, ändert es über `option_settings`, nicht in der Konsole der darunterliegenden Ressource.

### Badge 2 — Traffic

Der ALB verteilt auf die EC2-Instanzen der Auto Scaling Group. Nichts Überraschendes, und genau das ist die Aussage: Es ist derselbe Aufbau, den du von Hand gebaut hättest. Beanstalk erfindet keine eigene Architektur, es spart dir nur das Bauen.

### Kasten — Auto Scaling Group

`EC2 Web-Instances`, `App-Code läuft hier`, `skaliert nach Last`, `Health-Checks · Rolling Deploy`.

Hier läuft dein Code, auf echten EC2-Instanzen, in die du dich per SSH einloggen kannst. Das unterscheidet Beanstalk von Lambda oder App Runner: **Du hast die Maschinen noch.** Du siehst sie, du kannst sie debuggen, du kannst Logs von ihnen ziehen.

Das ist Segen und Bürde zugleich. Segen, weil du bei einem seltsamen Fehler nachschauen kannst. Bürde, weil du dich um das Betriebssystem trotzdem kümmern musst — nicht um die Patches selbst, die kommen von der Plattform, aber um die Frage, auf welcher Plattformversion du eigentlich fährst.

Der Zusatz `Rolling Deploy` erklärt, warum `MinSize: 2` in der Konfiguration oben keine Willkür ist: Bei einer einzigen Instanz gibt es nichts, worauf während des Deployments umgeleitet werden könnte.

### Der rote X-Pfeil — RDS in der Environment

Der wichtigste Kasten auf dieser Karte ist der, der durchgestrichen ist.

Beanstalk **kann** dir eine RDS-Instanz innerhalb der Environment anlegen. Es ist ein Häkchen im Assistenten, und es fühlt sich beim Aufsetzen richtig an: alles an einem Ort, Verbindungsdaten werden automatisch als Umgebungsvariablen gesetzt, Security Groups passen von selbst.

Und dann steht auf der Karte in Rot: `Environment terminiert → DB weg`.

Das ist keine Warnung vor einem Bedienfehler. Es ist die dokumentierte Konsequenz der Lebenszyklus-Kopplung. Die Datenbank ist eine Ressource *im* CloudFormation-Stack der Environment. Stack weg, Ressource weg.

Und der Fall tritt häufiger ein, als „Environment terminieren" klingt. Ein Blue/Green-Deployment baut eine zweite Environment auf und wirft die alte weg. Ein Plattform-Upgrade auf eine neue Major-Version läuft in vielen Fällen genauso. Wer eine kaputte Environment durch eine frische ersetzt, tut es ebenfalls. **Der Normalbetrieb von Beanstalk beinhaltet, dass Environments verschwinden.** Genau deshalb darf nichts Wertvolles darin liegen.

Auf der Karte steht dazu `nur für Dev/Test`, und das ist die richtige Einordnung: Für eine Testumgebung, die man ohnehin wegwirft, ist die eingebaute Datenbank bequem und harmlos.

### Badge 3 — DB-Query zur externen RDS

Der Pfeil verlässt den gestrichelten Rahmen und geht nach rechts. Das ist die Lösung, und sie sieht bewusst unspektakulär aus.

Die Anwendung auf den EC2-Instanzen verbindet sich über den Endpoint, den sie als Umgebungsvariable bekommt, mit einer RDS-Instanz, die außerhalb liegt. Technisch ist das ein ganz normaler Datenbankaufruf. Organisatorisch ist es der ganze Unterschied.

Damit das funktioniert, braucht es zwei Dinge, die beide auf der Karte stehen: den Endpoint als Umgebungsvariable und eine Security-Group-Regel von der Beanstalk-Instanz-Gruppe zur RDS-Gruppe.

### Kasten rechts — RDS separat provisioniert

`Multi-AZ · eigener Lebenszyklus`, `überlebt EB-Neuaufbau`.

Diese Datenbank wurde separat angelegt — von Hand, per CloudFormation, per Terraform, egal. Sie kennt Beanstalk nicht. Sie ist ein eigenständiges Stück Infrastruktur mit eigenem Backup-Plan, eigenem Wartungsfenster und eigener Deletion Protection.

Du kannst die Environment darüber zehnmal neu bauen. Die Daten bleiben.

`Multi-AZ` steht dabei aus einem anderen Grund auf der Karte als der Rest: Es hat mit dem Lebenszyklus nichts zu tun, sondern mit Verfügbarkeit. Es ist trotzdem richtig platziert, weil beides zusammen das ergibt, was man von einer Produktionsdatenbank erwartet — sie überlebt sowohl den Ausfall einer Availability Zone als auch den Neuaufbau der Anwendung.

## Die entscheidende Unterscheidung

Dieselbe Datenbank, zwei Orte, zwei völlig verschiedene Risikoprofile:

| | RDS in der Environment | RDS separat provisioniert |
|---|---|---|
| Angelegt von | Beanstalk, im Stack der Environment | dir, unabhängig |
| Lebt so lange wie | die Environment | bis du sie löschst |
| Bei Environment-Terminierung | wird mit abgeräumt | unberührt |
| Blue/Green-Deployment | Datenbank müsste mitwandern | beide Environments zeigen darauf |
| Verbindung | automatisch gesetzt | Endpoint als Umgebungsvariable |
| Sinnvoll für | Dev, Test, Wegwerf-Umgebungen | alles mit echten Daten |

Der Blue/Green-Fall ist die Zeile, an der es in der Praxis kippt. Eine Datenbank, die in der Environment liegt, macht das Standard-Deployment-Muster von Beanstalk unbenutzbar — und dann fährt man Produktion ohne saubere Deployment-Strategie, um die Datenbank nicht zu verlieren.

## Die ehrliche Feinheit

**Erstens: Der Plattform-Lebenszyklus ist der eigentliche Ops-Aufwand, den Beanstalk dir lässt.**

Elastic Beanstalk übernimmt Patches und Minor-Updates für unterstützte Plattformversionen. Aber Plattform-Branches werden zurückgezogen, wenn eine ihrer Komponenten das End of Life ihres Herstellers erreicht — Betriebssystem, Runtime, Application Server oder Web Server. Für eine zurückgezogene Branch gibt es keine Wartungsupdates mehr, auch keine Sicherheitsupdates, und neue Environments lassen sich darauf nicht mehr anlegen.

**Und hier ein Punkt, den ich offenlegen muss, statt ihn zu glätten.** Die Altdatei `battle_card_8.md` schreibt in ihrer letzten Falle: „Amazon-Linux-2-Plattformbranches erreichen zum 30.06.2026 EOL". Dieses Datum ist inzwischen verstrichen. Der naheliegende Reflex wäre, den Satz ins Präsens zu setzen — „sind ausgelaufen". Das wäre eine Behauptung, die die Dokumentation nicht deckt.

Der Stand ist folgender: Die AL2-Branches — Docker, ECS, Go, Corretto, Tomcat, .NET Core — stehen weiterhin in der Tabelle der *geplanten* Retirements mit Zieldatum 30. Juni 2026, nicht in der Historie der bereits vollzogenen. Die Tabelle ist gepflegt; andere Branches sind nach ihrem Datum sauber in die Historie gewandert. Eine Release Note zum Vollzug gibt es nicht. Und eine zweite offizielle Seite meldet, es gebe derzeit gar keine anstehenden Retirements.

**Zwei offizielle Quellen, zwei verschiedene Aussagen.** Deshalb steht hier kein Datum als Tatsache. Was du für die Prüfung mitnimmst, ist die Richtung, nicht der Stichtag: AL2 ist am Ende seines Lebenszyklus, AL2023 ist die aktuelle Generation, neue Environments gehören auf AL2023. Genau das steht auch auf der Karte — dort ist das Datum nirgends vermerkt, nur `AL2023-Plattform`. **Die Karte ist an dieser Stelle korrekt; die Altdatei daneben nicht.**

**Zweitens: Die Karte zeigt einen von zwei möglichen Environment-Typen.**

Eine Beanstalk-Environment kann load-balanced sein — dann gibt es ALB und Auto Scaling Group wie im Bild. Sie kann aber auch Single-Instance sein: eine EC2-Instanz, eine Elastic IP, kein Load Balancer. Für eine kleine interne Anwendung ist das die günstigere Wahl, und der ganze linke Teil der Karte sähe dann anders aus. Die Karte zeigt den Produktionsfall, nicht den einzigen Fall.

**Drittens: „Managed" heißt hier nicht „ohne Rechnung".**

Für Elastic Beanstalk selbst zahlst du nichts. Du zahlst die EC2-Instanzen, den Load Balancer, die EBS-Volumes und die RDS-Instanz — also genau das, was du auch bezahlt hättest, wenn du es selbst gebaut hättest. Beanstalk spart Arbeit, keine Infrastrukturkosten. Wer „günstiger als EC2" liest, ist auf der falschen Fährte.

**Viertens, für die Praxis:** Wenn eine Produktionsdatenbank bereits in einer Environment steckt, ist der Weg heraus nicht „umkonfigurieren". Er läuft über einen Snapshot, eine daraus neu erzeugte eigenständige Instanz und das Umbiegen der Umgebungsvariable — mit Ausfallzeit. Das ist der Grund, warum diese Entscheidung am ersten Tag richtig getroffen werden sollte.

## Was du dadurch nicht baust

Zähl durch, was in dieser Architektur nicht existiert:

- kein CloudFormation-Template, das jemand schreibt und pflegt
- keine Launch Templates, keine Target Groups, keine Listener-Regeln von Hand
- keine Deployment-Pipeline für das Ausrollen auf die Instanzen
- kein selbst gebautes Health-Check-Handling
- keine AMI-Bauerei für neue Runtime-Versionen
- kein Skalierungsskript

Was du behältst: EC2-Instanzen, auf die du dich einloggen kannst, und die Verantwortung, deine Environment auf einer unterstützten Plattformversion zu halten.

## Wenn du dir eine Sache merkst

**Die Environment ist ein Wegwerf-Artefakt — die Datenbank darf keins sein.**

CloudFormation wäre das Werkzeug darunter und verlangt, dass du jede Ressource selbst beschreibst. Manuelles ELB plus ASG ist derselbe Aufbau mit mehr Arbeit. Lambda passt nicht, weil hier eine klassische Web-Anwendung als Artefakt auf Instanzen läuft. Beanstalk ist die Antwort auf „schnell online, wenig Ops, trotzdem EC2 darunter".

## Prüfungsknackpunkte

**Signalwörter:** „einfach hochladen", „kleines Team ohne Ops", „Plattform kümmert sich um Provisionierung und Skalierung", „schnell online". Kommt zusätzlich „die Datenbank muss erhalten bleiben" vor, ist die gesuchte Antwort fast immer die Trennung von Environment und RDS — nicht die Wahl des Compute-Dienstes.

**Warum „RDS innerhalb der Environment anlegen" hier verliert:** Die Datenbank teilt dann den Lebenszyklus der Environment und wird bei deren Terminierung mit abgeräumt. Da Blue/Green-Deployments und Plattform-Upgrades regelmäßig neue Environments erzeugen, ist das kein Randfall, sondern ein Konflikt mit dem normalen Betriebsmuster.

**Warum CloudFormation hier verliert:** Es ist das Werkzeug, das Beanstalk selbst benutzt. Es kann alles, verlangt aber genau die Infrastrukturarbeit, die das Team in der Aufgabe nicht leisten will. Als Antwort richtig, sobald die Frage „beliebige Ressourcen, versioniert und reproduzierbar" lautet.

**Warum manuelles ELB + ASG + EC2 hier verliert:** Gleiches Ergebnis, mehr Handarbeit, und du baust Deployment, Health-Checks und Rolling Updates selbst nach. Die Aufgabe fragt nach weniger Aufwand, nicht nach mehr Kontrolle.

**Warum Lambda hier verliert:** Es gibt kein Web-Anwendungs-Artefakt, das auf einer Instanz mit Application Server läuft. Eine bestehende klassische Anwendung auf Lambda zu bringen bedeutet Umbau, nicht Deployment.

**Warum ECS oder EKS hier verlieren:** Beides setzt voraus, dass die Anwendung containerisiert ist und jemand Cluster-Konzepte beherrscht. Für „wir haben ein ZIP und kein Ops-Team" ist das ein Schritt in die falsche Richtung.
