---
nr: 75
title: "VMware Cloud on AWS — vSphere-Landschaft heben, ohne umzubauen"
services:
  - "VMware Cloud on AWS"
  - "VMware HCX"
  - "Amazon VPC (ENI-Anbindung)"
  - "AWS Application Migration Service (MGN, Abgrenzung)"
domains: [D3, D4]
signalwords:
  - "existing VMware tooling and skills stay in use"
  - "no refactoring of applications"
  - "migrate with vMotion or bulk migration"
  - "dedicated bare metal hosts"
  - "fastest migration without rebuilding"
assets: [battle_card_75.svg, battle_card_75.png, battle_card_75.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
---
# Battle Card 75 — VMware Cloud on AWS

**Szenario:** Eine gewachsene vSphere-Landschaft soll in die Cloud, ohne Applikationen umzubauen und ohne das Team neu auszubilden — gleiche Tools, gleiche Admins, gleiche Runbooks.

## Ablauf

- **1 — HCX-Verbindung aufbauen:** Zwischen dem On-Premise-vCenter und dem VMC-SDDC wird VMware HCX gekoppelt. Das SDDC läuft auf **dedizierten Bare-Metal-Hosts** in AWS — kein Hypervisor unter dem Hypervisor, sondern echtes ESXi auf blankem Blech. Damit bleiben vSphere, vSAN und NSX exakt die Werkzeuge, die das Team schon kennt.
- **2 — VMs live hinüberheben:** Über HCX wandern die VMs per **vMotion** (einzeln, im laufenden Betrieb) oder als **Bulk-Migration** (ganze Wellen im Wartungsfenster). Kein Image-Umbau, keine Neuinstallation, keine Applikationsänderung — die VM ist auf der anderen Seite dieselbe VM.
- **3 — Native AWS-Services direkt anbinden:** Das SDDC hängt über eine ENI-Verbindung direkt am Kunden-VPC. S3, RDS und Co. sind mit niedriger Latenz erreichbar, ohne Umweg über das Internet. Genau das ist der Hebel: erst 1:1 herüber, dann Schritt für Schritt modernisieren.
- **✗ — Refactoring auf EC2-nativ:** Technisch möglich, aber es verfehlt die Anforderung. Umbau der Applikationen plus Neuschulung des Betriebsteams ist das Gegenteil von „gleiche Tools, gleiche Admins". In der Prüfung ist das die Ablenkungs-Antwort.

**Betrieb:** Patching, Host-Tausch und Lifecycle-Management des SDDC macht der Anbieter — die Managed-Komponente ist der eigentliche Unterschied zu „ESXi selbst auf Bare-Metal-Instanzen betreiben".

## Prüfungs-Kernsatz

**„Bestehende vSphere-Umgebung, kein Refactoring, vorhandenes VMware-Know-how weiternutzen" → VMware Cloud on AWS. Migration per HCX/vMotion, Betrieb managed.**

## Klassiker-Fallen

1. **Lift-and-Shift-Verwechslung:** MGN repliziert einzelne Server blockweise in native EC2-Instanzen. VMC hebt die **ganze vSphere-Plattform** samt Management-Layer. Signalwort „VMware-Tooling behalten" → VMC, nicht MGN.
2. **„Dedizierte Hosts" ≠ EC2 Dedicated Hosts:** Die SDDC-Hosts sind Bare Metal für den VMware-Stack, nicht für eigene EC2-AMIs.
3. **Kosten-Argument als Falle:** VMC ist kein Sparmodell. Wer nach niedrigsten Kosten fragt, meint Refactoring — wer nach schnellster Migration ohne Umbau fragt, meint VMC.

## Faktencheck-Notizen (22.07.2026)

- **Vertriebsstatus:** AWS verkauft VMware Cloud on AWS seit dem **30.04.2024 nicht mehr selbst**; der Vertrieb läuft ausschließlich über **Broadcom** (aws.amazon.com/vmware). Der Dienst existiert weiter, die Beschaffung hat sich geändert.
- **AWS-native Alternative:** **Amazon Elastic VMware Service (Amazon EVS)** ist seit dem **05.08.2025 allgemein verfügbar** und bringt den VMware Cloud Foundation Stack direkt in ein Kunden-VPC.
- **Prüfungsrelevanz:** Der SAA-C03-Fragenpool bildet diese Änderungen nicht ab. Bei „vorhandene VMware-Umgebung, kein Umbau" bleibt **VMware Cloud on AWS** die erwartete Antwort — die Karte lehrt den Prüfungsstoff, diese Notiz die Realität.
- SDDC-Architektur (vSphere/vSAN/NSX auf dedizierten Bare-Metal-Hosts, HCX mit vMotion und Bulk-Migration, ENI-Anbindung ans VPC) bestätigt über docs.vmware.com und aws.amazon.com/vmware.
