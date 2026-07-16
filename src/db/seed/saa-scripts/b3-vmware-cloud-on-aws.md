---
service: VMware Cloud on AWS
seedKey: saa-c03-script-vmware-cloud-on-aws
batch: B3
domains: [D2, D3]
sourceRef:
  - https://aws.amazon.com/vmware/vmwarecloudonaws/
  - https://press.aboutamazon.com/aws/2025/8/aws-announces-general-availability-of-amazon-elastic-vmware-service
status: draft
---

# VMware Cloud on AWS

## 📋 CLF-Recap

> *Kein CLF-Skript vorhanden — NEU im SAA-Track (und ein Sonderfall, siehe Aktualitätshinweis).* Kurzeinordnung: **Dein vSphere-Rechenzentrum, aber auf AWS-Hardware.** Der komplette VMware-Stack (vSphere, vSAN, NSX) läuft auf dedizierten AWS-Bare-Metal-Servern — deine VMs ziehen um, ohne umgebaut zu werden.

---

## 🎯 SAA-Vertiefung

### Der Umzug ohne Renovierung

**Das Problem:** Ein Unternehmen muss sein Rechenzentrum räumen — der Mietvertrag läuft in neun Monaten aus. Dort stehen 800 VMs auf VMware vSphere: alte Windows-Server, ein SAP-System, Datenbanken, ein Sammelsurium aus zwanzig Jahren. Alle 800 als EC2-Instanzen neu aufzubauen (oder auch nur zu konvertieren, zu testen und abzunehmen) dauert Jahre, nicht Monate.

**Die Lösung:** **VMware Cloud on AWS** stellt genau dieselbe VMware-Umgebung auf AWS-Hardware bereit. Die VMs werden **live migriert (vMotion)**, die Admins arbeiten weiter im gewohnten vCenter, dieselben Tools, dieselben Prozesse — **kein Refactoring, kein Neuaufbau, keine Umschulung**. Der Vorteil gegenüber „echtem" Lift-and-Shift zu EC2: maximale Geschwindigkeit bei minimalem Risiko. Der Preis: Man bekommt keine Cloud-nativen Vorteile geschenkt — es bleibt VMware, nur woanders. (Typischerweise Zwischenschritt: erst rüberziehen, dann Stück für Stück modernisieren.) Zweiter klassischer Use Case: **DR-Standort** — das eigene RZ bleibt primär, VMware Cloud on AWS ist das Ausweichrechenzentrum (mit VMware SRM).

> **💡 Merksatz:** „**vSphere/VMware-Workloads ohne Umbau**, RZ-Exit unter Zeitdruck, Admins behalten vCenter" → das VMware-Muster. Es kauft **Zeit und Risikoarmut**, keine Cloud-Nativität.

### 🛑 Aktualität — der wichtigste Teil dieses Skripts

Hier weicht die Prüfungswelt von der echten Welt ab, und beides muss man kennen:

- **AWS verkauft VMware Cloud on AWS seit dem 30.04.2024 nicht mehr.** Nach der Broadcom-Übernahme von VMware wird der Dienst **nur noch über Broadcom** (bzw. dessen Reseller) vertrieben; Bestandskunden werden weiter bedient.
- **Die AWS-eigene Antwort darauf ist Amazon EVS (Elastic VMware Service)**, GA seit **August 2025**: VMware Cloud Foundation läuft direkt in der eigenen VPC — die VCF-Lizenz muss man weiterhin von Broadcom haben.

**Was heißt das für die Prüfung?** Steht VMware Cloud on AWS noch im Exam Guide, muss man das **Konzept** kennen (VMware-Stack auf AWS-Hardware, Lift-and-Shift ohne Umbau). In der Praxis — und zunehmend in aktuellen Fragen — ist es aber **eher Distraktor als Lösung**: Bei „Migration nach AWS" ist die moderne, AWS-native Antwort meist **MGN (Application Migration Service)**, das VMs in echte EC2-Instanzen überführt.

> **💡 Merksatz:** 🛑 **Kein AWS-Vertrieb mehr seit 04/2024 (nur noch Broadcom); AWS-Nachfolger = Amazon EVS.** Konzept kennen, aber in neuen Szenarien meist Distraktor.

### Die Abgrenzung: Vier Wege, eine VM zu bewegen

| Das Szenario sagt … | Antwort |
|---|---|
| VMware-Workloads **unverändert** übernehmen, vCenter behalten, RZ-Exit unter Zeitdruck | **VMware Cloud on AWS / Amazon EVS** |
| VMs nach AWS migrieren und dort als **echte EC2-Instanzen** betreiben (Lift-and-Shift, Rehost) | **AWS MGN** (Application Migration Service) |
| AWS-Dienste **im eigenen RZ** betreiben (Daten bleiben im Haus) | **Outposts** |
| Anwendung neu bauen/modernisieren | **ECS/EKS/Lambda** (Refactor) |

Die Trennlinie: **MGN konvertiert** (aus der VM wird eine EC2-Instanz — man landet in der echten AWS-Welt). **VMware Cloud on AWS konserviert** (die VM bleibt eine VMware-VM — man landet in derselben Welt auf fremdem Boden). Und **Outposts** dreht die Richtung um: Statt die VMs zu AWS zu bringen, bringt es AWS zu den VMs.

> **💡 Merksatz:** **MGN konvertiert zu EC2 · VMware Cloud on AWS konserviert die VM · Outposts bringt AWS ins eigene RZ.**

---

## ⚠️ Prüfungs-Knackpunkte

- Konzept: kompletter **VMware-Stack (vSphere/vSAN/NSX) auf dedizierter AWS-Bare-Metal-Hardware**; Migration per **vMotion**, Verwaltung weiter über **vCenter**; kein Refactoring.
- Use Cases: **RZ-Exit unter Zeitdruck**, große vSphere-Bestände, **DR-Standort** (mit SRM).
- 🛑 **Seit 30.04.2024 kein Verkauf mehr über AWS** (nur Broadcom); AWS-Nachfolger **Amazon EVS** (GA 08/2025).
- In modernen Migrations-Szenarien meist **Distraktor** — AWS-native Antwort für Rehost: **MGN** (VM → EC2).
- Abgrenzung: **MGN konvertiert · VMware konserviert · Outposts bringt AWS ins eigene RZ · ECS/EKS/Lambda = Refactor**.

## 💡 Der eine Satz zum Mitnehmen

**VMware Cloud on AWS ist der Umzug ohne Renovierung** — man muss das Konzept kennen, sollte aber wissen, dass AWS es nicht mehr verkauft und in aktuellen Fragen fast immer MGN oder Amazon EVS die bessere Antwort ist.
