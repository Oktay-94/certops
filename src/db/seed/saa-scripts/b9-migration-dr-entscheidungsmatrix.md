---
service: Migration- & DR-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-migration-dr-decision-matrix
batch: B9
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html
  - https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html
status: draft
---

# Migration- & DR-Entscheidungsmatrix

## 📋 Einordnung

> Migration und DR sind ein Verwechslungs-Minenfeld: DMS/MGN/DataSync/Snow/Transfer Family klingen alle nach „Daten bewegen", die vier DR-Strategien nach „Ausfallschutz", und MGN/DRS nutzen dieselbe Technik für verschiedene Zwecke. Dieses Skript bündelt die sieben Tabellen. Die Migrations-Tool-Wahl (1) und die DR-Strategie-Zuordnung (4) sind die meistgeprüften.

---

## 🎯 Matrix 1: Migrations-Tool-Wahl

| Das Szenario sagt … | Antwort |
|---|---|
| Datenbank migrieren, Quelle bleibt online, minimale Downtime | **DMS** |
| DB-Engine-Wechsel (Oracle→PostgreSQL) | **DMS + SCT/DMS Schema Conversion** (heterogen) |
| ganze Server / VMs / physische Server Lift-and-Shift nach EC2 | **MGN** |
| Dateien/Objekte online (NAS/NFS/SMB → S3/EFS/FSx), Bulk/wiederkehrend | **DataSync** |
| offline, sehr große Datenmenge, wenig/keine Bandbreite | **Snow Family** |
| laufende SFTP/FTPS/FTP-Übertragung mit Partnern | **Transfer Family** |

## 🎯 Matrix 2: DMS homogen vs. heterogen

| Bedarf | Antwort |
|---|---|
| gleiche Engine (MySQL→Aurora MySQL) | **DMS allein** (kein SCT) |
| Engine-Wechsel (Oracle→Aurora PostgreSQL) | **SCT/DMS SC + DMS** |
| Indizes/Procedures/Trigger/Views mitnehmen | **SCT** (DMS migriert die nicht automatisch) |
| online migrieren, minimale Downtime | **Full Load + CDC** |

## 🎯 Matrix 3: Datentransfer-Verwirrung

| Bedarf | Antwort |
|---|---|
| online migrieren/synchronisieren, Bandbreite ok | **DataSync** |
| hybrid, **dauerhafter** Zugriff auf Cloud-Storage + lokaler Cache | **Storage Gateway** |
| SFTP/FTPS/FTP mit Partnern | **Transfer Family** |
| offline, keine/zu wenig Bandbreite | **Snow Family** |

## 🎯 Matrix 4: Die 4 DR-Strategien (RTO/RPO & Kosten)

| Ziel | Strategie | Kosten |
|---|---|---|
| RTO Stunden, günstig, unkritisch | **Backup & Restore** | $ |
| RTO ~10er-Min, Daten live, Compute aus | **Pilot Light** | $$ |
| RTO Minuten, läuft verkleinert, nur hochskalieren | **Warm Standby** | $$$ |
| RTO/RPO ~null, zwei Regionen aktiv | **Multi-Site Active/Active** | $$$$ |
| RPO Sek/RTO Min für Server, ohne Duplikat/manuelle Architektur | **AWS Elastic Disaster Recovery (DRS)** | $ (nur Storage im Normalbetrieb) |

## 🎯 Matrix 5: Snow vs. Netzwerk

| Bedarf | Antwort |
|---|---|
| Online-Transfer dauert Wochen/Monate, Bandbreite limitiert | **Snow (offline)** |
| genug Bandbreite / Direct Connect vorhanden | **DataSync (online)** |
| Datenverarbeitung/ML vor Ort ohne Internet | **Snowball Edge Compute Optimized** |

## 🎯 Matrix 6: MGN vs. DRS (gleiche Technik, anderer Zweck)

| | **MGN** | **DRS** |
|---|---|---|
| Zweck | einmalige **Migration** | laufende **DR-Absicherung** |
| Danach | Quelle weg, läuft auf AWS | Quelle bleibt produktiv, AWS = Reserve |
| Signalwort | „Server umziehen/Lift-and-Shift" | „Disaster Recovery/Failover-Reserve" |

## 🎯 Matrix 7: Die 7 Rs

| Strategie | Bedeutung | Beispiel/Tool |
|---|---|---|
| **Retire** | abschalten | ungenutzte App |
| **Retain** | vorerst behalten | Compliance/Outposts |
| **Relocate** | verschieben ohne Redesign | VMware→VMware Cloud on AWS |
| **Rehost** | Lift-and-Shift, unverändert | **MGN** |
| **Repurchase** | auf SaaS wechseln | On-Prem-CRM→Salesforce |
| **Replatform** | kleine Optimierung | self-managed MySQL→**RDS** |
| **Refactor** | cloud-native Neubau | Monolith→Lambda/DynamoDB |

## ⚠️ Die zehn häufigsten Migration/DR-Fehlgriffe

1. **DMS allein** trotz Engine-Wechsel (→ + SCT).
2. **MGN** trotz „nur Datenbank" (→ DMS).
3. **DMS** trotz „ganzer Server" (→ MGN).
4. **Snow** trotz ausreichender Bandbreite (→ DataSync online).
5. **DataSync** trotz „hybrid + dauerhafter Zugriff + Cache" (→ Storage Gateway).
6. **Backup & Restore** trotz „RTO Minuten" (→ Warm Standby).
7. **Pilot Light** trotz „muss sofort Traffic verarbeiten" (→ Warm Standby).
8. **Read Replica/CRR** trotz „Ransomware / sauberer früherer Stand" (→ DRS PIT).
9. **MGN** trotz „laufende DR-Reserve" (→ DRS).
10. **SMS/Snowmobile** als Antwort (→ veraltet: MGN bzw. Snowball/DataSync).

## 💡 Der eine Satz zum Mitnehmen

**Migration/DR-Fragen beantworten sich über zwei Achsen: das Signalwort fürs Tool (DB→DMS, Server→MGN, Dateien→DataSync, offline→Snow, SFTP→Transfer Family) und die RTO/RPO-Zahl für die DR-Strategie (Stunden→Backup&Restore … ~0→Multi-Site) — und MGN migriert einmalig, während DRS laufend absichert.**
