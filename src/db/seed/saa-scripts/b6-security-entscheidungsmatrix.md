---
service: Security-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-security-decision-matrix
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/security/
status: draft
---

# Security-Entscheidungsmatrix

## 📋 Einordnung

> Wie bei Compute und Netzwerk gilt: Die meisten Security-Fragen testen die **Wahl zwischen ähnlich klingenden Diensten**. Dieses Skript bündelt die fünf Entscheidungstabellen des Batches — als Schnellzugriff vor der Prüfung. Die Detection-Suite (Matrix 1) ist die meistgeprüfte Verwechslung des gesamten Kapitels.

---

## 🎯 Matrix 1: Die Detection-Suite — „Wer macht was?"

| Das Szenario sagt … | Antwort |
|---|---|
| Kompromittiert, Krypto-Mining, ungewöhnliche API-Calls, Malicious IP, **Malware scannen** | **GuardDuty** |
| **CVE**, Schwachstelle, Patch fehlt, EC2/ECR/Lambda scannen | **Inspector** |
| **PII / Kreditkarten / sensible Daten in S3** | **Macie** |
| **Root Cause**, Vorfall untersuchen, Umfang, forensische Analyse | **Detective** |
| **Single Pane of Glass**, Findings aggregieren, CIS/PCI-Checks, Security Score | **Security Hub** |

Der Selbsttest (wortgetreu bewährt):
- „Liegen Kreditkartennummern offen in S3?" → **Macie**
- „Läuft veraltete Software mit Lücken?" → **Inspector**
- „Instanz schürft plötzlich Krypto?" → **GuardDuty**
- „Alle Alarme + Compliance-Score auf einem Dashboard?" → **Security Hub**
- „Wie kam der Angreifer rein und was hat er angefasst?" → **Detective**

Die schärfste Einzelfalle: **Malware → GuardDuty** (Malware Protection), **nicht** Inspector (der findet CVEs, keine Malware).

## 🎯 Matrix 2: Encryption & Keys

| Bedarf | Antwort |
|---|---|
| Standard-Verschlüsselung, AWS-managed, tiefe Integration | **KMS** (multi-tenant) |
| Dediziert, single-tenant, FIPS 140-2/3 L3, AWS ohne Zugriff, eigene PKI, SQL-TDE | **CloudHSM** |
| Secrets mit **automatischer Rotation** (RDS/Aurora/Redshift/DocumentDB) | **Secrets Manager** (kostet) |
| Config/Secrets **kostenlos, keine Rotation** | **Parameter Store** |

Killer-Detail: KMS **Key Policy ist Pflicht** (IAM allein genügt nicht); direkter `Encrypt` **max. 4 KB** → Envelope Encryption.

## 🎯 Matrix 3: S3-Verschlüsselung

| Typ | Wann |
|---|---|
| **SSE-S3** | einfach, AWS-managed, kein Key-Log — der Default |
| **SSE-KMS** | Key-Policy-Kontrolle + **CloudTrail-Log** + Role-Separation (Bucket Keys sparen Kosten) |
| **SSE-C** | Kunde liefert Key pro Request, AWS speichert ihn nie |
| **Client-Side** | Kunde verschlüsselt vor Upload, AWS sieht nie Klartext |

## 🎯 Matrix 4: Firewall- & Schutz-Ebenen

| Ebene | Werkzeug | Signalwort |
|---|---|---|
| Instanz/ENI | **Security Group** (stateful, nur Allow) | „Instanz X darf Port Y" |
| Subnetz | **NACL** (stateless, Deny möglich) | „IP-Adresse aussperren" |
| L7 HTTP | **WAF** (CloudFront/ALB/API GW — **nicht NLB**) | „SQL-Injection, XSS" |
| DDoS | **Shield** (Standard L3/4 · Advanced +L7) | „DDoS-Angriff" |
| VPC L3–7 | **Network Firewall** | „Domains filtern, ganze VPC" |
| org-weit | **Firewall Manager** (braucht Organizations) | „zentral über viele Konten" |

## 🎯 Matrix 5: Compliance

| Frage | Antwort |
|---|---|
| **AWS'** eigene Zertifikate/Reports herunterladen (SOC/ISO/PCI); BAA/DPA | **Artifact** |
| **Eigene** Compliance-Evidence sammeln + Auditor-Report | **Audit Manager** (🛑 ab 30.04.2026 keine Neukunden) |
| **Ressourcen-Konfiguration** gegen Regeln prüfen (+ Historie) | **AWS Config** |
| Laufende **Security-Posture** gegen Benchmarks + Score | **Security Hub** |

## ⚠️ Die zehn häufigsten Security-Fehlgriffe

1. **Malware-Scan → Inspector** gewählt (falsch; das ist **GuardDuty** Malware Protection).
2. **Inspector für aktive Angriffe** (falsch; Inspector = CVEs, GuardDuty = Angriffe).
3. **KMS-Zugriff nur über IAM** gedacht (Key Policy ist Pflicht).
4. **Großes File direkt mit KMS** verschlüsselt (4-KB-Limit → Envelope Encryption).
5. **ACM-Zertifikat auf EC2** (nicht exportierbar → ALB davor / Private CA).
6. **CloudFront-Zertifikat in falscher Region** (muss us-east-1).
7. **NLB + WAF** (WAF ist L7; NLB → Network Firewall/Shield).
8. **Parameter Store trotz Rotation-Anforderung** (Rotation → Secrets Manager).
9. **Artifact vs. Audit Manager verwechselt** (AWS' Nachweise vs. eigene Evidence).
10. **Security Hub als Detektor** gedacht (es aggregiert nur; GuardDuty/Inspector/Macie erkennen).

## 💡 Der eine Satz zum Mitnehmen

**Security-Fragen beantworten sich über fünf Tabellen: Wer erkennt (Detection-Suite)? Welcher Key-Dienst? Welche S3-Verschlüsselung? Welche Firewall-Ebene? Und welcher Compliance-Dienst?** — das Signalwort im Szenario zeigt fast immer auf genau eine Zeile.
