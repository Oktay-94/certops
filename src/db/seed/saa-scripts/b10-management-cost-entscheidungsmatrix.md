---
service: Management-, Governance- & Kosten-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-management-cost-decision-matrix
batch: B10
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html
status: draft
---

# Management-, Governance- & Kosten-Entscheidungsmatrix

## 📋 Einordnung

> Dieser Themenblock ist ein Verwechslungs-Minenfeld: das Trio CloudWatch/CloudTrail/Config, die Rechte-Leitplanken (SCP/RCP/IAM), die Kosten-Werkzeuge (Cost Explorer/Budgets/CUR + Kaufoptionen) und die Assessment-Dienste (Trusted Advisor/Well-Architected/Compute Optimizer/Resilience Hub). Dieses Skript bündelt die neun Tabellen. Das Management-Trio (1) und die Kaufoptionen (5) sind die meistgeprüften.

---

## 🎯 Matrix 1: Das Management-Trio (DIE Verwechslung)

| Das Szenario fragt … | Antwort |
|---|---|
| „wie läuft es" — CPU/Memory/Latenz, Alarm, Dashboard | **CloudWatch** |
| „wer hat welche API aufgerufen" — Audit, ConsoleLogin, wer löschte X | **CloudTrail** |
| „ist die Ressource compliant / wie war sie konfiguriert" — Zustand über Zeit | **Config** |
| welcher Netzwerkverkehr floss (IP↔IP, accept/reject) | **VPC Flow Logs** |

## 🎯 Matrix 2: Rechte-Leitplanken (Guardrail vs. Grant)

| Bedarf | Antwort |
|---|---|
| Rechte tatsächlich gewähren | **IAM Policy** |
| org-weite Obergrenze für **Prinzipale** (Member Accounts) | **SCP** (gewährt nie, nicht Management Account) |
| org-weite Obergrenze für **Ressourcen** (Data Perimeter) | **RCP** (seit Nov 2024) |
| Max-Rechte eines **einzelnen** IAM-User/Rolle | **Permission Boundary** |

## 🎯 Matrix 3: Config-Management & IaC

| Bedarf | Antwort |
|---|---|
| Infrastruktur deklarativ als Code | **CloudFormation** |
| ein Template über viele Accounts + Regionen | **CloudFormation StackSets** |
| genehmigte Produkte für Self-Service ohne volle Rechte | **Service Catalog** |
| automatisierte Best-Practice-Landing-Zone | **Control Tower** |
| Feature Flags / Config ohne Redeploy, sicherer Rollout | **AppConfig** |

## 🎯 Matrix 4: Zugriff & Secrets

| Bedarf | Antwort |
|---|---|
| EC2-Zugriff ohne Bastion / Port 22 / Keys | **SSM Session Manager** |
| einfacher verschlüsselter Konfigwert, keine Rotation | **Parameter Store SecureString** |
| DB-Credentials mit automatischer Rotation | **Secrets Manager** |
| Patching der ganzen Flotte nach Zeitplan | **SSM Patch Manager** |

## 🎯 Matrix 5: Kaufoptionen

| Bedarf | Antwort |
|---|---|
| max. Flexibilität über EC2/Fargate/Lambda | **Compute Savings Plan** (bis 66 %) |
| stabile feste Config, 3 Jahre, max. Rabatt, verkaufbar | **Standard RI** (bis 72 %) |
| Family-gebunden, mehr Rabatt als Compute SP | **EC2 Instance SP** (bis 72 %) |
| austauschbar (Family/OS wechseln) | **Convertible RI** (bis 66 %) |
| garantierte Kapazität in einer AZ | **Zonal RI** |
| unterbrechbar, fault-tolerant, Kosten minimieren | **Spot** (bis 90 %) |
| kurz/schwankend/unvorhersehbar | **On-Demand** |

## 🎯 Matrix 6: Kosten-Werkzeuge

| Bedarf | Antwort |
|---|---|
| analysieren/visualisieren/aufschlüsseln (rückblickend) | **Cost Explorer** |
| Limit + Alarm (+ automatische Aktion), vorausschauend | **Budgets** (Budget Actions) |
| detaillierteste Rohdaten → Athena/QuickSight | **CUR** |
| ungewöhnliche Kostenausschläge per ML | **Cost Anomaly Detection** |
| Kosten pro Team/Projekt aufschlüsseln | **Cost Allocation Tags** |

## 🎯 Matrix 7: Assessment & Optimierung

| Bedarf | Antwort |
|---|---|
| generische Best-Practice-Checks (5 Kategorien) | **Trusted Advisor** |
| formales 6-Säulen-Architektur-Review | **Well-Architected Tool** |
| ML-Rightsizing einzelner Ressourcen | **Compute Optimizer** |
| RTO/RPO messen + Ausfall testen | **Resilience Hub** |
| eigene Compliance-Regeln über Konfigurationszustand | **Config** |

## 🎯 Matrix 8: Organizations vs. Control Tower

| Bedarf | Antwort |
|---|---|
| manuelle Multi-Account-Basis (OUs, SCPs, Billing) | **Organizations** |
| automatisierte Best-Practice-Landing-Zone + Guardrails | **Control Tower** |

## 🎯 Matrix 9: Health & Status

| Bedarf | Antwort |
|---|---|
| allgemeiner AWS-weiter Dienststatus (öffentlich) | **Health Dashboard – Service health** |
| Ereignisse, die **meine** Ressourcen betreffen (Retirement/Wartung) | **Health Dashboard – Your account health** |

## ⚠️ Die zwölf häufigsten Fehlgriffe

1. **CloudWatch** trotz „wer hat aufgerufen" (→ CloudTrail).
2. **CloudTrail** trotz „ist die Ressource compliant" (→ Config).
3. **Standard-Metrik** für RAM/Disk (→ CloudWatch Agent).
4. **IAM allein** trotz „org-weit verbieten" (→ SCP).
5. **SCP** trotz „externen Ressourcen-Zugriff verbieten" (→ RCP).
6. **Parameter Store** trotz „automatische Rotation" (→ Secrets Manager).
7. **Bastion Host** trotz „ohne Port 22/Keys" (→ Session Manager).
8. **Standard RI** trotz „flexibler Mix EC2/Fargate/Lambda" (→ Compute SP).
9. **Savings Plan** trotz „garantierte Kapazität in AZ" (→ Zonal RI).
10. **Cost Explorer** trotz „Alarm/Aktion bei Schwelle" (→ Budgets).
11. **Trusted Advisor** trotz „präzises ML-Rightsizing" (→ Compute Optimizer).
12. **Well-Architected Tool** trotz „RTO/RPO messen" (→ Resilience Hub).

## 💡 Der eine Satz zum Mitnehmen

**Dieser Block löst sich über klare Fragen: wie/wer/was-konfiguriert (CloudWatch/CloudTrail/Config), gewähren vs. deckeln (IAM vs. SCP/RCP), analysieren vs. alarmieren (Cost Explorer vs. Budgets) und Flexibilität vs. Rabatt vs. Kapazität bei den Kaufoptionen — fast immer zeigt genau ein Signalwort auf genau eine Zeile.**
