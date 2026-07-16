---
service: AWS Elastic Disaster Recovery (DRS)
seedKey: saa-c03-script-elastic-disaster-recovery
batch: B9
domains: [D2]
sourceRef:
  - https://aws.amazon.com/disaster-recovery/
  - https://docs.aws.amazon.com/drs/latest/userguide/FAQ.html
  - https://docs.aws.amazon.com/drs/latest/userguide/CloudEndure-Concepts.html
status: draft
---

# AWS Elastic Disaster Recovery (DRS)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> DRS = der **automatische Notfallknopf**, der eine ständig bereitgehaltene Server-Kopie in AWS vorhält und bei einer Katastrophe blitzschnell hochfährt. **Kontinuierliche Block-Level-Replikation** in eine **günstige** Bereitschaft (nur billiger Speicher im Normalbetrieb); im Ernstfall in **Minuten** vollwertige EC2-Instanzen; **Failback** möglich. Abgrenzung: **MGN zieht dauerhaft um (Migration), DRS hält eine Notfall-Kopie bereit (DR).** DRS setzt typischerweise **Pilot Light / Warm Standby** um.

Der SAA vertieft: **die RPO/RTO-Charakteristik, PIT-Recovery gegen Ransomware, wann DRS statt manueller DR-Architektur — und die MGN-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Kontinuierliche Replikation: RPO Sekunden, RTO Minuten

**Das Problem:** Eine Firma will niedrige RPO/RTO für ihre Server, aber kein teures zweites Rechenzentrum in Vollbetrieb und keine manuell gebaute, gepflegte DR-Architektur.

**Die Lösung:** **DRS** repliziert Server (aus dem eigenen RZ oder aus AWS) **kontinuierlich block-level** in eine kostengünstige **Staging Area** (günstige EBS + minimaler Compute). Weil die Replikation kontinuierlich ist, liegt das **RPO im Sekundenbereich**; im Ernstfall fährt DRS vollwertige EC2-Instanzen hoch → **RTO typischerweise 5–20 Minuten** (🔴 abhängig von OS-Bootzeit und Change-Rate). Man zahlt im Normalbetrieb fast nur für Storage — das ist der Kostenvorteil gegenüber einer laufenden Vollreserve. Nicht-disruptive **Drills** verifizieren die Recovery, ohne das RPO zu beeinträchtigen.

Konzeptionell setzt DRS einen **Pilot-Light-Ansatz** um: Daten + „ausgeschaltete" Ressourcen in Bereitschaft, bei Failover Full-Capacity-Deployment. Signalwort „RPO Sekunden / RTO Minuten für Server ohne teures Duplikat" → DRS.

> **💡 Merksatz:** DRS = **kontinuierliche Block-Replikation** → 🔴 **RPO Sekunden, RTO 5–20 Min**, im Normalbetrieb nur Storage-Kosten. Setzt konzeptionell **Pilot Light** um; nicht-disruptive Drills.

### PIT-Recovery gegen Ransomware

**Das Problem:** Ransomware verschlüsselt die Produktion. Eine einfache Replikation hätte die Verschlüsselung mitrepliziert — die Kopie wäre ebenfalls korrupt.

**Die Lösung:** DRS bietet **Point-in-Time (PIT) Recovery**: Man kann auf einen **früheren, sauberen Zeitpunkt** vor dem Angriff zurückfailen, statt nur auf den letzten (bereits korrupten) Stand. Das macht DRS auch zu einem Ransomware-Schutz — im Gegensatz zu reiner Replikation (S3 CRR, Read Replicas), die Korruption unweigerlich mit repliziert. Signalwort „Ransomware / auf sauberen früheren Stand zurück" → DRS PIT (nicht Read Replica/CRR).

> **💡 Merksatz:** **PIT-Recovery** = Failover auf früheren sauberen Zeitpunkt → Ransomware-Schutz. Reine Replikation (CRR/Read Replica) repliziert Korruption mit.

### DRS vs. MGN und die manuelle Alternative

**DRS vs. MGN:** Beide replizieren Server mit derselben Block-Level-Technik — der Zweck trennt sie:
- **MGN = einmalige Migration**: Server dauerhaft nach AWS umziehen, danach ist die Quelle weg.
- **DRS = laufende DR-Absicherung**: Server bleiben am Ursprung produktiv, AWS ist die dauerhaft bereitgehaltene Reserve.

**DRS vs. manuelles Pilot Light/Warm Standby:** Man *könnte* Pilot Light selbst bauen (Cross-Region Read Replicas, AMIs, Skripte). DRS liefert denselben Pilot-Light-Ansatz **cloud-native und managed** mit verbesserten, konsistenten RPO/RTO-Zielen — die Antwort, wenn „niedrige RPO/RTO ohne teures Duplikat und ohne manuelle DR-Architektur" gefragt ist.

> **💡 Merksatz:** **MGN (einmalige Migration) vs. DRS (laufende DR-Reserve)** — gleiche Technik, anderer Zweck. DRS = **managed Pilot Light** statt selbstgebauter DR-Architektur.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Disaster Recovery", „RTO/RPO minimieren", „kostengünstige DR", „Failover nach AWS" → DRS.
- 🔴 **RPO Sekunden / RTO 5–20 Min**; im Normalbetrieb nur Storage-Kosten; nicht-disruptive Drills; Failback.
- **PIT-Recovery** → Ransomware-Schutz (reine Replikation repliziert Korruption mit).
- **DRS (laufende DR-Reserve) vs. MGN (einmalige Migration)** — gleiche Block-Level-Technik.
- DRS = **managed Pilot Light**; Nachfolger von CloudEndure Disaster Recovery.
- Scope-Hinweis: DR-Konzept ist prüfungsrelevant (Domain 2); DRS steht nicht namentlich in der Dienstliste, wird aber als Umsetzung erwartet.

## 💡 Der eine Satz zum Mitnehmen

**DRS hält per kontinuierlicher Block-Replikation eine günstige, startbereite Server-Kopie in AWS vor — RPO in Sekunden, RTO in Minuten, PIT-Recovery gegen Ransomware; es ist managed Pilot Light und unterscheidet sich von MGN dadurch, dass es laufend absichert statt einmalig zu migrieren.**
