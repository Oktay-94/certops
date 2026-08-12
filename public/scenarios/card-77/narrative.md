---
cardNumber: 77
slug: ecs-anywhere-eks-hybrid-nodes-control-plane
title: "Container im eigenen Rechenzentrum — ECS Anywhere, EKS Hybrid Nodes, EKS Anywhere"
services: ["Amazon ECS Anywhere", "Amazon EKS Hybrid Nodes", "Amazon EKS Anywhere", "AWS Systems Manager", "AWS IAM Roles Anywhere"]
domains: ["D3", "D1"]
correctAnswer: "A"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-anywhere.html"
  - "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-anywhere-registration.html"
  - "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-anywhere-troubleshooting.html"
  - "https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-prereqs.html"
  - "https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html"
  - "https://anywhere.eks.amazonaws.com/docs/concepts/eksafeatures/"
  - "https://anywhere.eks.amazonaws.com/docs/overview/faq/"
  - "https://docs.aws.amazon.com/app-mesh/latest/userguide/doc-history.html"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, eine Werkshalle in Schichten zu fahren.

**Weg eins:** Du stellst einen eigenen Schichtleiter ein. Er schreibt den Plan, verteilt die Leute, entscheidet über Urlaub — und wenn er krank wird, brauchst du eine Vertretung, die den Plan genauso schreiben kann. Du hast jetzt zwei Berufe im Haus: den, den du eigentlich ausübst, und den der Schichtplanung. Der Gegenwert ist echt: Auch wenn die Leitung zur Zentrale gekappt ist, läuft die Halle weiter. Der Mann sitzt ja im Gebäude.

**Weg zwei:** Der Plan kommt aus der Zentrale. Ein Anruf, eine Liste. Die Leute stehen weiter an denselben Maschinen, die Werkstücke verlassen die Halle nie — nur der Plan reist. Fällt das Telefon aus, wird nichts Neues mehr angefangen. Dafür hast du nie einen Schichtleiter eingestellt.

Beide Wege lassen die Arbeit im Werk. Sie unterscheiden sich nur darin, **wo geplant wird**.

Das Szenario auf der Karte hat sich für Weg zwei entschieden, bevor es zu Ende gelesen ist. Ein Fertigungsunternehmen will Container an der Produktionslinie betreiben, die Maschinendaten dürfen das Werk nicht verlassen — und es will „kein zweites Orchestrierungs-Team aufbauen". Der erste Halbsatz sagt: Die Arbeit bleibt hier. Der zweite sagt: Die Planung nicht.

Genau darin steckt die Falle dieser Karte. Das Wort „Anywhere" sagt nichts darüber, wo geplant wird. Bei ECS heißt „Anywhere": Die Steuerung bleibt in AWS, nur die Worker stehen bei dir. Bei EKS heißt „Anywhere" das Gegenteil: Der komplette Cluster zieht zu dir, Steuerung inbegriffen. Zwei Produkte, ein Wortbestandteil, entgegengesetzte Architektur.

## Was es eigentlich ist — die external instance

Das zentrale Objekt bei ECS Anywhere ist weder ein Server noch ein Cluster, sondern ein **Registrierungsvorgang**. Der Werksserver wird über eine Hybrid Activation zu einem von Systems Manager verwalteten Knoten und danach zu einer *external instance*:

```bash
aws ssm create-activation \
  --iam-role ecsAnywhereRole \
  --registration-limit 12 \
  --default-instance-name "werk-linie-3"
```

Das liefert `ActivationId` und `ActivationCode`. Beide gehen in ein Installationsskript, das auf dem Werksserver läuft und drei Dinge einrichtet: SSM Agent, ECS Agent, Docker. Danach steht die Maschine in der ECS-Konsole neben deinen EC2-Instanzen, gekennzeichnet mit dem Attribut `ecs.capability.external`.

Ab da ist alles wieder gewöhnliches ECS, mit genau zwei Auffälligkeiten:

```json
{
  "family": "linien-telemetrie",
  "requiresCompatibilities": ["EXTERNAL"],
  "networkMode": "bridge",
  "containerDefinitions": [{
    "name": "aggregator",
    "image": "1234.dkr.ecr.eu-central-1.amazonaws.com/aggregator:1.4",
    "cpu": 512,
    "memory": 1024
  }]
}
```

`requiresCompatibilities: EXTERNAL` ist der Schalter. `networkMode: bridge` ist keine Stilfrage: `awsvpc` ist auf external instances nicht verfügbar, weil die Maschine keine ENI in einer VPC besitzt. Erlaubt sind `bridge`, `host` und `none`.

**Alles Übrige ist identisch — dieselben Task-Definitionen, dieselben IAM-Rollen, dieselbe Konsole.** Das ist der eigentliche Verkaufspunkt und genau das, was das Werk aus der Aufgabe will.

## Der Weg durch die Karte

Die Karte zeigt keinen Ablauf, sondern eine Abgrenzung: drei Spalten, zwei waagerechte Bänder. Die ganze Aussage steckt darin, ob ein Pfeil die Bandgrenze kreuzt — und in welche Richtung.

### Spalte 1, oberes Band — der ECS Control Plane

Er liegt in der AWS-Region und bleibt dort. Er plant Tasks, hält den Cluster-Zustand und zeigt dir eine Konsole. Er weiß, dass ein Server im Werk steht. Er weiß nicht, welche Maschinendaten dort durchlaufen.

Hier ist die Anforderung „die Daten dürfen das Werk nicht verlassen" bereits erfüllt: **Steuerbefehle reisen, Nutzdaten nicht.** Wer diese Trennung sauber im Kopf hat, hat die halbe Prüfungsfrage beantwortet.

### Badge 1 — vom Control Plane zur external instance

Der Pfeil zeigt von oben nach unten über die Bandgrenze, und man liest ihn intuitiv als „AWS verbindet sich zu meinem Server".

Falsch herum. Der SSM Agent auf dem Werksserver baut die Verbindung **von innen nach außen** auf und hält sie offen. AWS klopft nie an deiner Firewall an. Ausgehendes HTTPS auf Port 443 zu den ECS-, SSM- und EC2-Messages-Endpunkten genügt; eine eingehende Regel braucht es nicht.

Das Bild dazu: Nicht die Zentrale ruft an. Der Werksleiter ruft die Zentrale an und legt den Hörer nicht auf.

Praktisch heißt das: Deine Netzabteilung braucht keine DMZ und keine eingehende Regel, sondern eine Freigabeliste ausgehender Ziele. Die Doku zählt sie namentlich auf:

```
ecs-a-*.region.amazonaws.com    Task-Verwaltung
ecs-t-*.region.amazonaws.com    Task- und Container-Metriken
ecs.region.amazonaws.com        ECS-Service-Endpunkt
ssm.region.amazonaws.com        Systems Manager
ec2messages.region.amazonaws.com    Agent ↔ Service
ssmmessages.region.amazonaws.com    Session-Kanäle
```

Dazu kommt, was deine eigenen Container brauchen — ECR für die Images, CloudWatch für die Logs. Genau deshalb steht auf der Karte „ausgehend 443 genügt" und nicht „kein Netz nötig".

### Spalte 1, unteres Band — external instances

Hier laufen die Container. Und hier stehen die Grenzen, die diese Lösung von normalem ECS trennen. Die Doku benennt sie einzeln:

- **Kein Load Balancing.** Ein ALB oder NLB lässt sich vor external instances nicht hängen.
- **Keine Service Discovery.** Cloud Map fällt weg.
- **Keine EFS-Volumes**, kein `EFSVolumeConfiguration`.
- **Keine Capacity Provider.** Gestartet wird über den `EXTERNAL` Launch Type, nicht über eine Gruppe, die Kapazität nachschiebt.
- Kein SELinux, kein `UpdateContainerAgent`.

AWS zieht die Folgerung selbst: external instances sind für **ausgehenden Verkehr und Datenverarbeitung** gebaut. Braucht deine Anwendung eingehenden Verkehr, wird die Sache unhandlich. Für eine Linienanwendung, die Maschinendaten einsammelt und aggregiert, passt das exakt. Für einen Webshop wäre es die falsche Wahl.

Die Frage, die in einem Werk sofort kommt: **Was passiert, wenn die Leitung reißt?** Die laufenden Container laufen weiter — sie hängen an Docker auf deinem Blech, nicht an einem Draht nach Frankfurt. Was aufhört, ist alles Neue: keine Deployments, keine Neuplanung, keine Reaktion auf einen ausgefallenen Task von AWS-Seite. Einen vollständig getrennten Betriebsmodus unterstützt ECS Anywhere ausdrücklich nicht. Der Unterschied zu air-gapped ist damit kein gradueller, sondern ein prinzipieller: Hier ist der Ausfall der Leitung ein Störfall, dort ist er der Normalzustand.

### Spalte 2, oberes Band — der EKS Control Plane

Dasselbe Prinzip, andere Orchestrierung. AWS betreibt den Kubernetes-Control-Plane, patcht ihn, hält ihn verfügbar. Du bekommst denselben API-Endpunkt wie bei einem reinen Cloud-Cluster und dieselbe Versionsunterstützung, Extended Support eingeschlossen.

### Badge 2 — Hybrid Nodes hängen sich ein

Deine eigenen VMs oder Bare-Metal-Server melden sich per `nodeadm` am Cluster an und erscheinen als Nodes. Die Anmeldedaten kommen entweder aus einer SSM Hybrid Activation — dieselbe Mechanik wie in Spalte 1 — oder aus AWS IAM Roles Anywhere, wenn du ohnehin eine eigene PKI mit Zertifikaten betreibst.

Und hier endet die Symmetrie. Hybrid Nodes verlangen eine **private Verbindung**: Direct Connect, Site-to-Site VPN oder dein eigenes VPN. Zusätzlich muss der Control Plane deine Nodes **erreichen** können, um mit dem kubelet zu sprechen. Der Pfeil hat in Wahrheit zwei Spitzen. AWS empfiehlt mindestens 100 Mbit/s und höchstens 200 ms Roundtrip.

Das schlägt bis in die Cluster-Anlage durch. Du gibst beim Erstellen zwei Felder mit, die es bei einem Cloud-Cluster nicht gibt: `RemoteNodeNetwork` und `RemotePodNetwork`, also die CIDR-Bereiche deiner Werksmaschinen und der Pods darauf. Sie dürfen sich weder untereinander noch mit der VPC überschneiden, und dein Router muss sie kennen. Wer bei ECS Anywhere eine Firewall-Regel schreibt, schreibt bei Hybrid Nodes ein Routing-Konzept.

### Spalte 3, oberes Band — kein Control Plane in AWS

Kein Kasten, nur ein Satz. Genau das ist die Aussage: In dieser Spalte gibt es oben nichts.

### Badge 3 mit ✗ — Cluster komplett lokal

Der rote Pfeil kreuzt die Bandgrenze und wird durchgestrichen. EKS Anywhere legt den gesamten Cluster in dein Rechenzentrum: Control Plane, etcd, Lifecycle. Upgrades fährst du mit `eksctl` und dem EKS-A-Tooling, auf VMware vSphere, Bare Metal oder Nutanix.

Der Gegenwert ist real: **EKS Anywhere läuft air-gapped, ganz ohne Verbindung zu AWS.** Das können die beiden anderen Modelle nicht.

Nur braucht das Werk aus der Aufgabe das nicht. Es hat eine Anbindung. Es würde für eine Eigenschaft bezahlen, die es nicht nutzt, und sich dafür den Schichtleiter einkaufen, den es ausdrücklich vermeiden wollte. Deshalb das Kreuz — nicht weil das Produkt schlecht wäre, sondern weil der Preis hier ohne Gegenleistung bleibt.

## Die entscheidende Unterscheidung

| | ECS Anywhere | EKS Hybrid Nodes | EKS Anywhere |
|---|---|---|---|
| Control Plane | AWS-Region | AWS-Region | eigenes RZ |
| Netzrichtung | nur ausgehend, HTTPS 443 | privat und beidseitig | keine nötig |
| air-gapped | nein | nein | ja |
| Cluster-Lifecycle | AWS | AWS | Kunde |
| Werkzeug | Konsole, Task-Definition | `nodeadm`, kubectl | `eksctl`, EKS-A-Tooling |
| Abrechnung | je external instance und Stunde | je vCPU und Stunde | Subscription je Cluster |

Die Zeile, auf die es ankommt, ist die erste. **ECS Anywhere und EKS Hybrid Nodes sind das Paar, EKS Anywhere steht allein.** Die EKS-Anywhere-FAQ stellt genau diese Zuordnung selbst her: ECS Anywhere sei EKS Hybrid Nodes ähnlich, weil in beiden Fällen die Steuerungsebene in einer AWS-Region läuft und du nur deine Hosts anhängst.

Die letzte Zeile ist prüfungsfremd, erklärt aber die dritte Spalte: EKS Anywhere wird als Enterprise Subscription über ein oder drei Jahre je Cluster lizenziert, die beiden anderen laufen nutzungsabhängig pro Stunde. Ein Jahresvertrag für Software, die du selbst betreibst, gegen einen Stundenpreis für Steuerung, die jemand anderes betreibt — daran erkennst du auch ohne Architekturdiagramm, wer hier welche Arbeit übernimmt. Konkrete Beträge lernst du für die Prüfung nicht; die Struktur des Preismodells lohnt sich trotzdem.

## Die ehrliche Feinheit

Drei Dinge, die auf keiner Übersichtsfolie stehen.

**Erstens: Die Liste der unterstützten Betriebssysteme ist zusammengeschrumpft.** Seit dem 7. August 2026 trägt ECS Anywhere nur noch Amazon Linux 2023, Ubuntu 20, 22 und 24 sowie RHEL 9 — bei RHEL 9 musst du Docker vorher selbst installieren. Weggefallen sind Amazon Linux 2, CentOS Stream 9, RHEL 7 und 8, sämtliche Debian-Versionen, Ubuntu 18, Fedora, openSUSE, SUSE Enterprise 15 — und **Windows Server vollständig**. Die Doku formuliert das inzwischen grundsätzlich: Windows-Unterstützung für ECS Anywhere ist eingestellt. Wer eine Fertigungslinie mit Windows-Steuerrechnern vor Augen hat, muss den Fall neu denken.

**Zweitens: App Mesh war schon vorher keine Option und wird bald gar keine mehr sein.** Die ECS-Doku führt fehlende App-Mesh-Integration als Einschränkung von external instances. Unabhängig davon stellt AWS App Mesh am 30. September 2026 ein; neue Kunden werden seit dem 24. September 2024 nicht mehr aufgenommen. Eine Antwort, die App Mesh als Baustein anbietet, ist doppelt tot.

**Drittens: Die Aktivierung ist kleiner, als du denkst.** Eine SSM Activation hat standardmäßig ein Registrierungslimit von **einer** Instanz und läuft nach **24 Stunden** ab. Wer zwölf Maschinen an der Linie anmelden will und beides nicht setzt, registriert genau eine und sucht danach den Fehler an der falschen Stelle. Ein Ablauf betrifft übrigens nur Neuanmeldungen — bereits registrierte Maschinen bleiben verbunden. Deren Zugangsdaten rotiert der SSM Agent alle 30 Minuten über einen Hardware-Fingerprint; reißt die Leitung ab, holt er das nach der Wiederverbindung selbst nach.

## Syntax lesen — `create-activation`

Die beiden Optionen, die man beim ersten Mal übersieht:

```
aws ssm create-activation
    --iam-role ecsAnywhereRole              ← welche Rechte die Maschine bekommt
    --registration-limit 12                 ← wie viele Maschinen den Code nutzen dürfen
    --expiration-date 2026-08-20T12:00:00Z  ← bis wann der Code gültig ist
    --default-instance-name werk-linie-3    ← Anzeigename in der Konsole

    ohne --registration-limit  →  1 Maschine
    ohne --expiration-date     →  24 Stunden
```

Die Rolle im ersten Parameter ist **nicht** die Rolle deiner Container. Sie gehört der Maschine und erlaubt dem Agenten, mit den AWS-APIs zu sprechen. Was deine Tasks dürfen, steht getrennt davon in der Task Role; was beim Image-Pull und beim Logging gilt, in der Execution Role. Drei Rollen, drei Zuständigkeiten — und in der Prüfung gern vertauscht.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein zweites Orchestrierungs-Team und kein eigener Cluster-Betrieb
- kein etcd, das jemand sichern und wiederherstellen müsste
- keine Kubernetes-Upgrades, die du selbst fährst
- kein ALB und kein NLB vor den Werksservern — der Load Balancer steht lokal oder gar nicht
- kein Cloud Map, kein EFS, keine Capacity Provider
- keine eingehende Firewall-Regel ins Werk
- keine Kopie der Maschinendaten in der Cloud

Übrig bleiben: ein Cluster-Eintrag in der Region, drei Agents auf dem Blech und Task-Definitionen, die du aus der Cloud schon kennst.

Und weil Negativlisten leicht wie Mängel klingen: Die Hälfte dieser Punkte ist der eigentliche Gewinn. Kein etcd zu sichern heißt, dass niemand um drei Uhr nachts ein Cluster-Backup zurückspielt. Keine eingehende Firewall-Regel heißt, dass die Netzabteilung nichts freigeben muss, was sie später verteidigen müsste. Die andere Hälfte — kein ALB, kein EFS, kein Cloud Map — ist echter Verzicht, und den musst du vorher gegen deine Anwendung halten. Ein Aggregator hat damit kein Problem. Eine Anwendung mit Weboberfläche für die Werkshalle schon.

## Wenn du dir eine Sache merkst

**Nicht der Name entscheidet, sondern wo der Control Plane liegt: „Anywhere" heißt bei ECS Steuerung in AWS, bei EKS Steuerung bei dir.**

EKS Anywhere ist deshalb keine Antwort auf „kein zweites Team" — es ist die Antwort auf „keine Leitung". EKS Hybrid Nodes wäre architektonisch richtig, verlangt aber Kubernetes im Haus und eine private, beidseitige Verbindung. Outposts löst das Problem mit AWS-Hardware im Werk und beantwortet damit eine Frage, die niemand gestellt hat.

## Prüfungsknackpunkte

**Signalwörter:** „run containers on premises", „data must not leave the plant", „control plane managed by AWS", „without building a second operations team". *Vor Ort* plus *keine eigene Steuerungsebene* ist immer ECS Anywhere oder EKS Hybrid Nodes. Taucht dagegen „air-gapped" oder „no connection to AWS" auf, kippt die Antwort auf EKS Anywhere.

**Die Namensfalle.** ECS Anywhere und EKS Anywhere klingen wie ein Paar und sind keines. Wer sie als Gegenstücke liest, wählt für ein verbundenes Werk EKS Anywhere und kauft Betriebslast ein.

**Die Load-Balancer-Falle.** Eine Antwort, die einen ALB vor die Werksserver stellt, ist unabhängig vom Rest falsch: Service Load Balancing ist für external instances nicht verfügbar. Wer eingehenden Verkehr braucht, stellt lokal einen Proxy davor.

**Die Richtungsfalle.** „Braucht eine eingehende Verbindung ins Rechenzentrum" gilt für EKS Hybrid Nodes, nicht für ECS Anywhere. Bei ECS Anywhere genügt ausgehendes HTTPS.

**B — EKS Anywhere:** Legt den Control Plane ins Werk und erzwingt genau das Team, das die Aufgabe ausschließt.

**C — EKS on Outposts:** Bringt AWS-Hardware ins Rechenzentrum. Löst das Datenproblem, aber mit einer Rack-Lieferung statt mit Software — und nach neuer Hardware fragt die Aufgabe nicht.

**D — Alles in die Region migrieren:** Verletzt die harte Bedingung, dass die Maschinendaten das Werk nicht verlassen dürfen. Kein Netzdesign repariert das.
