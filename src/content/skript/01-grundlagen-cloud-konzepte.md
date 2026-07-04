# Kapitel 1 — Grundlagen & Cloud-Konzepte

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Warum dieses Kapitel zuerst?** Bevor es um einzelne Dienste geht, testet die **CLF-C02** vor allem *Verständnis*: Was ist die Cloud überhaupt, warum nutzt man sie, und wer ist für was verantwortlich? Diese Konzepte sind reine Punkte-Geschenke — wenn man sie sauber drauf hat. Sie tauchen außerdem als „Frame" in fast jeder Szenario-Frage der **SAA-C03** wieder auf.

---

## Was ist Cloud Computing — und die 6 Vorteile 🛑 *(neue Karte — CLF-Kernstoff)*

**Konzept**

Cloud Computing heißt: IT-Ressourcen (Rechenleistung, Speicher, Datenbanken) **auf Abruf über das Internet** beziehen und **nach Verbrauch bezahlen**, statt eigene Server zu kaufen und zu betreiben. Der fundamentale Wechsel: von **Kapitalkosten (CapEx** — großer Kauf im Voraus) zu **Betriebskosten (OpEx** — laufend, verbrauchsabhängig).

🛑 **Die 6 Vorteile der Cloud (offizielle AWS-Liste — auswendig können, „Welcher ist KEIN Vorteil?" ist eine Standardfrage):**

1. **Fixkosten in variable Kosten tauschen** — nicht vorab in Rechenzentren investieren, sondern nur zahlen, was du verbrauchst.
2. **Von massiven Skaleneffekten profitieren** — weil Hunderttausende Kunden gebündelt werden, sind die Pay-as-you-go-Preise niedriger, als du sie allein je erreichen könntest.
3. **Keine Kapazität mehr raten** — kein Über- oder Unterprovisionieren; du skalierst in Minuten hoch und runter, genau nach Bedarf.
4. **Tempo & Agilität steigern** — neue Ressourcen sind einen Klick entfernt (Wochen → Minuten); Experimentieren wird billig.
5. **Kein Geld mehr für Betrieb & Wartung von Rechenzentren** — Fokus aufs eigentliche Geschäft statt aufs „Racking und Stacking" von Servern.
6. **In Minuten global gehen** — mit wenigen Klicks in mehreren Regionen weltweit ausrollen → niedrigere Latenz für Nutzer überall.

🛑 **Pro-Tipp CLF — die Distraktor-Masche:** Falsche Antworten sind oft **umgedrehte** Vorteile („variable Kosten in Fixkosten tauschen", „Kapazität im Voraus festlegen"). Wenn eine Option das Gegenteil eines echten Vorteils behauptet → falsch.

---

## Cloud-Deployment-Modelle: Cloud, Hybrid & On-Premises 🛑 *(neue Karte — CLF-Kernstoff)*

**Konzept** *(Achtung: nicht mit den Service-Modellen weiter unten verwechseln — das ist die häufigste Anfänger-Verwirrung.)*

Das **Deployment-Modell** beantwortet die Frage: **Wo** läuft deine Infrastruktur?

- **Cloud (Cloud-native / „All-in"):** Alles läuft in der Cloud (z. B. komplett bei AWS). Keine eigene Hardware, schnellste Innovation, volle Elastizität. Der Normalfall für neue Projekte.
- **Hybrid:** Eine **Mischung** aus Cloud und eigenem Rechenzentrum (on-premises), verbunden über **Direct Connect** oder **VPN**. Für schrittweise Migration, oder wenn ein Teil der Daten aus rechtlichen/Latenz-Gründen im Haus bleiben muss. Brücken-Dienste dafür: **AWS Outposts**, **Storage Gateway** (siehe Compute- bzw. Storage-Kapitel).
- **On-Premises / Private Cloud:** Alles im **eigenen** Rechenzentrum, oft mit Virtualisierung. Maximale Kontrolle, aber hohe Kapitalkosten und Eigenverantwortung. (AWS verkauft das nicht direkt — es ist der Ausgangspunkt, von dem aus Firmen *in* die Cloud migrieren.)

🛑 **Pro-Tipp CLF:** Signalwort „**ein Teil bleibt im eigenen RZ, ein Teil in AWS**" → **Hybrid**. „Regulatorische Daten müssen physisch im Haus bleiben, aber mit AWS-Diensten" → **Hybrid via Outposts**.

---

## Cloud-Service-Modelle: IaaS / PaaS / SaaS / CaaS / DaaS

**Metapher / Konzept**

> Wer baut was — und wer ist wofür verantwortlich: die Grundpfeiler des Cloud-Verständnisses. Die Service-Modelle beantworten: **wie viel macht der Anbieter, wie viel du?**

**Die Modelle (aus deiner Karte, wortgetreu):**

- **IaaS (Infrastructure as a Service):** Du bekommst die Bausteine (virtuelle Server, Netzwerk, Speicher) und baust alles darauf selbst. **Beispiel: EC2.** Maximale Kontrolle, maximaler Eigenaufwand.
- **PaaS (Platform as a Service):** Der Anbieter stellt eine Plattform bereit; du lädst nur deinen Code hoch, um die Infrastruktur kümmert sich AWS. **Beispiel: Elastic Beanstalk.**
- **SaaS (Software as a Service):** Fertige Software, die du nur nutzt — keine Verwaltung. **Beispiel: Gmail, Amazon WorkMail, viele AWS-Konsolen-Dienste.**
- **CaaS (Containers as a Service):** Container ausführen, ohne die zugrunde liegende Infrastruktur zu verwalten. **Beispiel: ECS/EKS mit Fargate.**
- **DaaS (Desktop as a Service):** Desktops aus der Cloud. **Beispiel: WorkSpaces (Karte 108).**

🛑 **Pro-Tipp CLF/SAA — die Achse merken:** Von **IaaS → PaaS → SaaS** übernimmt AWS immer mehr, du immer weniger. Das ist exakt dieselbe „Wie viel nimmt AWS mir ab?"-Achse wie im Compute-Kapitel: **EC2 (IaaS) → Beanstalk (PaaS) → fertige Software (SaaS).**

---

## Das Modell der geteilten Verantwortung (Shared Responsibility Model)

**Konzept**

> **Shared Responsibility Model (geteilte Verantwortung): DIE Grundlagen-Frage der CLF!**

- **AWS ist verantwortlich für die Sicherheit *der* Cloud (Security OF the Cloud):** die physische Hardware, Rechenzentren, Netzwerk-Infrastruktur, die Hypervisor-Ebene, verwaltete Dienste.
- **DU bist verantwortlich für die Sicherheit *in* der Cloud (Security IN the Cloud):** deine Daten, Verschlüsselung, IAM-Rechte/Passwörter, Betriebssystem-Patches (bei EC2!), Security Groups, Anwendungskonfiguration.

**Faustregel:** Je „managed" der Dienst, desto mehr übernimmt AWS. Bei EC2 patchst du das OS; bei Lambda/S3/RDS übernimmt AWS mehr.

🛑 **Pro-Tipp — die Verantwortung wandert mit dem Dienst-Typ:**

| Bereich | Immer AWS | Immer Kunde | Hängt vom Dienst ab |
|---|---|---|---|
| Rechenzentrum, Hardware, Hypervisor | ✅ | | |
| **Deine Daten** | | ✅ (immer!) | |
| IAM-Nutzer, Passwörter, Zugriffsrechte | | ✅ | |
| Verschlüsselung konfigurieren | | ✅ | |
| **OS-Patches** | | bei **EC2** | bei **RDS** macht's AWS |
| Netzwerk-/Firewall-Konfiguration | | ✅ (Security Groups) | |

🛑 **Pro-Tipp SAA — die Klassiker-Fallen:**
- „Wer patcht das Betriebssystem einer **EC2**?" → **der Kunde.** Bei verwalteten Diensten wie **RDS** macht es **AWS** (aber DB-Nutzer/Verschlüsselung/Netzwerk konfigurierst *du*).
- Ein **falsch konfigurierter S3-Bucket** (öffentlich zugänglich) ist **Kundenschuld** — AWS betreibt S3 sicher, aber die Zugriffskonfiguration liegt bei dir.
- **Daten gehören IMMER dem Kunden** — die Verantwortung dafür liegt nie bei AWS.

**⚠️ Prüfungs-Knackpunkte**
- „Security OF the Cloud" = **AWS** (Hardware, RZ, Infrastruktur). „Security IN the Cloud" = **Kunde** (Daten, IAM, OS-Patches bei EC2, Verschlüsselung).
- EC2 = IaaS (du verwaltest OS), Beanstalk = PaaS, fertige Software = SaaS.
- Beliebte Falle: Wer patcht das Betriebssystem einer EC2? → **Der Kunde!**
- Daten gehören **immer** dem Kunden.

---

## AWS Global Infrastructure kompakt 🛑 *(neue Karte — CLF-Grundlagen, Details in späteren Kapiteln)*

**Konzept**

Die physische Landkarte hinter AWS — drei Ebenen, die du fürs CLF-Fundament sicher zuordnen können musst:

- **Region:** Ein **geografisches Gebiet** (z. B. Frankfurt, `eu-central-1`) mit mehreren, physisch getrennten **Availability Zones**. Du wählst eine Region nach **Latenz** (nah an Nutzern), **Compliance/Datenhoheit**, **verfügbaren Diensten** und **Preis**.
- **Availability Zone (AZ):** Ein oder mehrere **diskrete Rechenzentren** innerhalb einer Region, mit eigener Strom-/Kühl-/Netzwerkversorgung, aber untereinander schnell verbunden. **Warum wichtig:** Verteilst du deine App über **mehrere AZs**, überlebt sie den Ausfall eines ganzen Rechenzentrums (→ **Hochverfügbarkeit**; siehe RDS Multi-AZ und Auto Scaling Groups).
- **Edge Location (CloudFront PoP):** Hunderte Standorte weltweit, **noch näher am Endnutzer** als Regionen, zum **Cachen** von Inhalten (das absolute Signalwort für **CloudFront**) und für schnelle DNS-Antworten (Route 53).

🛑 **Pro-Tipp CLF/SAA — die Zuordnung:**
- „Hochverfügbarkeit gegen RZ-Ausfall" → über **mehrere AZs** verteilen.
- „Statische Inhalte weltweit mit niedriger Latenz ausliefern / cachen" → **Edge Locations** (CloudFront).
- „Daten müssen in einem bestimmten Land bleiben" → passende **Region** wählen (Datenhoheit).
- *Feinere Standort-Typen* (Local Zones, Wavelength, Outposts) → siehe Compute-Kapitel, Karte „Hybrid & Edge".

---

> **Querverweis:** Das **AWS Well-Architected Framework** mit seinen **6 Säulen** (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability) ist ebenfalls Grundlagenwissen — es steht ausführlich in **Karte 95 (Well-Architected Tool)** im Kapitel *Management & Governance*. Dort auch die Eselsbrücke und die „Welche ist KEINE Säule?"-Falle.

---

*Ende Kapitel 1 — Grundlagen & Cloud-Konzepte.*
