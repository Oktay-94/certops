---
service: Front-End- & Business-Apps-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-frontend-business-decision-matrix
batch: B10
domains: [D1, D3]
sourceRef:
  - https://aws.amazon.com/products/
status: draft
---

# Front-End- & Business-Apps-Entscheidungsmatrix

## 📋 Einordnung

> Dieser Block hat zwei prüfungsentscheidende Verwechslungs-Achsen: das **End-User-Computing-Trio** (WorkSpaces/AppStream/Secure Browser) und die **Kommunikations-Falle** (SES/SNS/SQS/Pinpoint/WorkMail). Dazu Front-End-Hosting und der Contact-Center-Zusammenlauf. Scope-Hinweis: **offiziell in-scope** sind nur **Amplify, API Gateway, Device Farm** (Front-End); die übrigen Dienste sind v. a. Abgrenzungs-/Distraktor-Training. Und: mehrere Business-Apps sind **auslaufend** (siehe Aktualitäts-Tabelle).

---

## 🎯 Matrix 1: End-User-Computing-Trio (die Kern-Verwechslung)

| Bedarf | Antwort |
|---|---|
| vollständiger, **persistenter** Desktop (Win/Linux) für tägliche Arbeit | **WorkSpaces** |
| **einzelne App** gestreamt, keine Installation, non-persistent | **AppStream 2.0 / WorkSpaces Applications** |
| nur sicherer **Browser**-Zugriff auf interne Websites/SaaS, kein VPN | **WorkSpaces Secure Browser** |
| stundenweise abgerechnete Desktops (Teilzeit) | **WorkSpaces AutoStop** |
| managed Desktop nötig (kein Selbstbetrieb) | **WorkSpaces** (nicht EC2 Windows) |

## 🎯 Matrix 2: Kommunikation/Messaging (Human vs. Application)

| Bedarf | Antwort |
|---|---|
| App schickt **E-Mail an Kunden** (Bestätigung/Newsletter) | **SES** |
| **System-Benachrichtigung/Alarm** zwischen Diensten (Pub/Sub, Fan-out) | **SNS** |
| **CloudWatch-Alarm** per E-Mail an Ops-Team | **SNS** (native Integration, nicht SES) |
| Nachrichten **puffern/entkoppeln** (Worker) | **SQS** |
| **Multichannel-Marketing** (Segmentierung/Journeys/Analytics) | **Pinpoint** (auslaufend → **Connect Outbound / End User Messaging**) |
| **Mitarbeiter-Postfächer + Kalender** (Exchange-Ersatz) | **WorkMail** (auslaufend → M365/Google Workspace) |

**Trennlinie:** **Human-Email** (SES an Kunden, WorkMail-Postfächer) vs. **Application-Messaging** (SNS/SQS zwischen Systemen).

## 🎯 Matrix 3: Front-End-Hosting & APIs

| Bedarf | Antwort |
|---|---|
| **Full-Stack** Web/Mobile (Frontend + Backend + Git-CI/CD) | **Amplify** |
| **nur statische** Website global ausliefern | **S3 + CloudFront** |
| **Backend-Server-App** deployen (Java/Python/Node), managed | **Elastic Beanstalk** |
| **REST-API** (Standard-Eingang) | **API Gateway** |
| **GraphQL-API** (flexible Abfrage + Realtime) | **AppSync** |
| **echte Geräte** für Mobile-App-Tests | **Device Farm** |

## 🎯 Matrix 4: Contact Center (Connect-Zusammenlauf)

| Bedarf | Antwort |
|---|---|
| Cloud-**Callcenter/Contact Center** (omnichannel, elastisch) | **Amazon Connect** |
| Bot/Absicht im Callcenter | **Connect + Lex** |
| dynamische Sprachansagen | **Connect + Polly** |
| Transkription + Sentiment der Gespräche | **Connect + Contact Lens** (Transcribe/Comprehend) |
| custom Logik im Anruf-Flow | **Connect + Lambda** |
| mehrsprachige Interaktion | **Connect + Translate** |

## ⚠️ Aktualitäts-Tabelle (auslaufende/abgekündigte Dienste)

| Dienst | Status | Konsequenz |
|---|---|---|
| **WorkDocs** | 🛑 tot (EoS 25.04.2025) | veralteter Distraktor → S3/EFS/FSx |
| **Pinpoint** | 🛑 EoS 30.10.2026 (aufgeteilt) | → Connect Outbound / End User Messaging / SES |
| **WorkMail** | 🛑 EoS 31.03.2027 | → M365/Google Workspace |
| **Chime (Client)** | 🛑 EoS 20.02.2026 | Chime **SDK** bleibt (Embedding) |
| **Honeycode** | 🛑 eingestellt (29.02.2024) | veralteter Distraktor |
| **WorkSpaces Web** | Rebrand → **Secure Browser** (2024) | beide Namen kennen |
| **AppStream 2.0** | Rebrand → **WorkSpaces Applications** (2025) | beide Namen kennen |

## ⚠️ Die zehn häufigsten Fehlgriffe

1. **AppStream** trotz „vollständiger persistenter Desktop" (→ WorkSpaces).
2. **WorkSpaces** trotz „nur eine einzelne App streamen" (→ AppStream).
3. **WorkSpaces/AppStream** trotz „nur interne Website im Browser, kein VPN" (→ Secure Browser).
4. **EC2 Windows** trotz „managed DaaS" (→ WorkSpaces).
5. **SES** trotz „CloudWatch-Alarm-Mail" (→ SNS).
6. **SNS** trotz „reiche E-Mail an Kunden/Newsletter" (→ SES).
7. **SES** trotz „Mitarbeiter-Postfächer + Kalender" (→ WorkMail).
8. **Pinpoint** in Neu-Architektur (→ Connect Outbound / End User Messaging).
9. **S3-Static-Hosting** trotz „Full-Stack mit Auth/Backend" (→ Amplify).
10. **WorkDocs** für Datei-Sharing (tot → S3/EFS/FSx).

## 💡 Der eine Satz zum Mitnehmen

**Dieser Block löst sich über zwei Achsen: End-User-Computing (ganzer Desktop = WorkSpaces, einzelne App = AppStream, nur Browser = Secure Browser) und Kommunikation (E-Mail an Menschen = SES/WorkMail, Benachrichtigung zwischen Systemen = SNS/SQS) — plus Amplify fürs Full-Stack-Hosting und Connect als KI-Contact-Center-Hub; mehrere Business-Apps sind auslaufend und heute nur noch Distraktoren.**
