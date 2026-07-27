---
nr: 77
title: "Container im eigenen Rechenzentrum — ECS Anywhere, EKS Hybrid Nodes, EKS Anywhere"
services:
  - "Amazon ECS Anywhere"
  - "Amazon EKS Hybrid Nodes"
  - "Amazon EKS Anywhere (verworfen — air-gapped nicht gefordert)"
  - "AWS Systems Manager (Hybrid Activation)"
domains: [D3, D1]
signalwords:
  - "run containers on premises at the production line"
  - "data must not leave the plant"
  - "control plane managed by AWS"
  - "without building a second operations team"
  - "air-gapped, no connection to AWS"
assets: [battle_card_77.svg, battle_card_77.png, battle_card_77.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 77 — Container im eigenen Rechenzentrum

**Szenario:** Ein Fertigungsunternehmen muss Container direkt an der Produktionslinie im Werk betreiben — die Maschinendaten dürfen das Werk nicht verlassen — will dafür aber kein zweites Orchestrierungs-Team aufbauen.

## Ablauf
Diese Karte ist eine Abgrenzungskarte: drei Spalten, zwei waagerechte Bänder. Die ganze Aussage steckt darin, ob der Steuerungspfeil die Bandgrenze kreuzt.

- **1 — ECS Anywhere:** Der Control Plane bleibt in der AWS-Region. Auf dem Werksserver laufen SSM Agent, ECS Agent und Docker; über eine SSM Hybrid Activation wird er als *external instance* registriert. Tasks starten mit Launch Type `EXTERNAL`, ausgehend genügt Port 443. Task-Definitionen, IAM-Rollen und Konsole sind dieselben wie in der Cloud. Grenzen: kein ALB/NLB, kein Cloud Map, kein EFS, keine Capacity Provider — der Load Balancer muss lokal stehen.
- **2 — EKS Hybrid Nodes:** Dasselbe Prinzip für Kubernetes. AWS betreibt und patcht den Control Plane, die eigenen VMs oder Bare-Metal-Server hängen sich als Nodes ein und verhalten sich wie EC2-Nodes. Eine dauerhafte Verbindung in die Region ist Voraussetzung.
- **3 — EKS Anywhere (✗ für dieses Szenario):** Hier liegt der Control Plane im eigenen Rechenzentrum, der Kunde verantwortet den kompletten Cluster-Lifecycle über eksctl und das EKS-A-Tooling. Der Vorteil: Es funktioniert air-gapped, ganz ohne Verbindung zu AWS. Genau das braucht das Werk nicht — es hat eine Anbindung und würde nur Betriebslast einkaufen.

## Prüfungs-Kernsatz
**Nicht der Name entscheidet, sondern wo der Control Plane liegt: „Anywhere" heißt bei ECS Steuerung in AWS, bei EKS Steuerung bei dir.**

## Klassiker-Fallen
1. **ECS Anywhere und EKS Anywhere als Gegenstücke lesen** → Sie sind keine. Das Gegenstück zu ECS Anywhere ist **EKS Hybrid Nodes**; die AWS-FAQ stellt genau diese beiden nebeneinander.
2. **Einen ALB vor external instances hängen** → Geht nicht. Wer eingehenden Verkehr braucht, stellt einen lokalen Load Balancer davor; ECS Anywhere ist auf ausgehende Last und Datenverarbeitung ausgelegt.
3. **Air-gapped als Verkaufsargument für ECS Anywhere** → Nur EKS Anywhere läuft ohne Verbindung zu AWS. ECS Anywhere und Hybrid Nodes brauchen sie dauerhaft.
4. **Cloud Map für Service Discovery einplanen** → Für external instances nicht verfügbar, ebenso wenig EFS-Volumes oder App Mesh.

## Faktencheck-Notizen (23.07.2026)
- Grenzen und Voraussetzungen aus der ECS-Doku (`AmazonECS/latest/developerguide/ecs-anywhere.html`): SSM Agent + ECS Agent + Docker, Launch Type `EXTERNAL`, keine Capacity Provider, kein EFS, kein App Mesh, fehlender ELB-Support ausdrücklich benannt.
- Die EKS-Anywhere-FAQ ordnet **ECS Anywhere ausdrücklich EKS Hybrid Nodes** zu, nicht EKS Anywhere. Die Vergleichsseite `anywhere.eks.amazonaws.com/docs/concepts/eksafeatures/` nennt Verbindungsanforderung und Lifecycle-Verantwortung als die beiden Unterscheidungsmerkmale.
- **Abweichung vom Masterplan:** Die Themenzeile „Container-Steuerungsebene in AWS, Worker im eigenen RZ" gilt nur für ECS Anywhere. Die Karte wurde deshalb bewusst als Dreier-Abgrenzung geschnitten (Freigabe Oktay, 23.07.2026).
- Ab 07.08.2026 unterstützt ECS Anywhere Amazon Linux 2, CentOS Stream 9 sowie RHEL 7 und 8 nicht mehr. Für die Prüfung irrelevant, für die Praxis nicht.
- EKS Anywhere wird per Enterprise Subscription (1 oder 3 Jahre, pro Cluster) lizenziert, EKS Hybrid Nodes stündlich nach vCPU. Keine Zahl auf der Karte, weil Preismodelle prüfungsfremd sind.
