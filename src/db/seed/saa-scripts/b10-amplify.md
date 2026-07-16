---
service: AWS Amplify
seedKey: saa-c03-script-amplify
batch: B10
domains: [D1, D3]
sourceRef:
  - https://docs.amplify.aws/react/how-amplify-works/
  - https://aws.amazon.com/amplify/
  - https://aws.amazon.com/about-aws/whats-new/2024/05/aws-amplify-gen-2-available/
status: draft
---

# AWS Amplify

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Amplify = der **Rundum-Stecker**, mit dem Frontend-Entwickler komplette Web-/Mobile-Apps **inklusive Backend** bauen und hosten — ohne Cloud-Experte zu sein. Bündelt **Cognito** (Auth), **AppSync/API Gateway** (APIs), **S3** (Storage), Datenbank hinter einer einfachen Oberfläche; **Frontend-Hosting mit CI/CD** (Git-Push → automatisch gebaut/veröffentlicht). Abgrenzung: **Amplify = Full-Stack-Komplettpaket für Frontends; S3 = nur statisch; Beanstalk = klassische Server-App.**

Der SAA vertieft: **Hosting vs. Backend, Gen 2, die Bausteine — und die Hosting-Abgrenzungen.**

---

## 🎯 SAA-Vertiefung

### Zwei Kernjobs: Hosting und Backend

**Das Problem:** Ein Frontend-Team will eine React-/Next.js-App mit Login, Daten-API und Datei-Upload live bringen — aber Cognito, AppSync, S3 und API Gateway einzeln zu verdrahten kostet Wochen.

**Die Lösung:** Amplify erledigt **zwei Dinge**:
- **Amplify Hosting**: Git-basierte **CI/CD** fürs Frontend — bei jedem Push wird automatisch gebaut und global ausgeliefert (statische Seiten, SPAs und **Server-Side-Rendered** Apps wie Next.js/Nuxt/Astro).
- **Backend**: fertige Bausteine — **Auth via Cognito**, **Storage via S3**, **APIs via AppSync (GraphQL) oder API Gateway (REST)**, Data/DataStore — ohne die Einzeldienste manuell zu konfigurieren.

„Full-Stack-Web-/Mobile-App schnell bauen und hosten, CI/CD aus Git" → Amplify.

> **💡 Merksatz:** Amplify = **Hosting** (Git-CI/CD, auch SSR) **+ Backend** (Cognito/S3/AppSync/API Gateway) hinter einer Oberfläche. Zwei Jobs: hosten und Backend verdrahten.

### Gen 2: Backend als TypeScript-Code

**Das Problem:** Backend über eine CLI/Konsole zu klicken skaliert schlecht und ist schwer versionierbar.

**Die Lösung:** 🛑 **Amplify Gen 2** (GA Mai 2024) definiert das Backend **code-first in TypeScript** — Auth, Data, Storage, Functions werden als Code beschrieben, die Infrastruktur wird automatisch provisioniert (unter der Haube **CDK/CloudFormation**). Gen 1 (Studio/CLI) und Gen 2 werden beide unterstützt; für Neuprojekte empfiehlt AWS Gen 2. Fürs Examen genügt: Amplify kann das Backend als Code definieren und deployen.

> **💡 Merksatz:** 🛑 **Gen 2** = Backend als **TypeScript-Code** (Auth/Data/Storage/Functions), provisioniert via CDK/CloudFormation. Gen 1 + Gen 2 supported.

### Die Hosting-Abgrenzungen

**Das Problem:** Amplify, S3+CloudFront, Beanstalk und AppSync klingen alle nach „App bereitstellen".

**Die Lösung:**
- **Amplify** = **Full-Stack** Web/Mobile (Frontend-Hosting + Backend + CI/CD).
- **S3 + CloudFront** = **nur statische** Website (kein Backend/Auth).
- **Elastic Beanstalk** = **PaaS** für Backend-Server-Apps (Java/Python/Node).
- **AppSync** = **nur** die GraphQL-API-Schicht (aus B7).

Reflex: „Frontend + Backend + CI/CD für Web/Mobile" → Amplify; „nur statische Seite" → S3+CloudFront; „Server-App deployen" → Beanstalk; „GraphQL-API" → AppSync.

> **💡 Merksatz:** **Amplify (Full-Stack Web/Mobile) vs. S3+CloudFront (statisch) vs. Beanstalk (Server-App-PaaS) vs. AppSync (GraphQL-API)**.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Full-Stack Web/Mobile", „Frontend + Backend", „Hosting mit CI/CD", „für Frontend-Entwickler" → Amplify.
- Bündelt **Cognito (Auth) · S3 (Storage) · AppSync/API Gateway (APIs) · Data**; Hosting auch für SSR (Next.js).
- 🛑 **Gen 2** = Backend als TypeScript-Code (CDK/CloudFormation), GA Mai 2024.
- Abgrenzung: **Amplify (Full-Stack) vs. S3+CloudFront (statisch) vs. Beanstalk (Server-App) vs. AppSync (GraphQL)**.
- Einer der wenigen **offiziell in-scope** Front-End-Dienste (neben API Gateway, Device Farm).

## 💡 Der eine Satz zum Mitnehmen

**Amplify ist das Full-Stack-Komplettpaket für Frontend-Entwickler — Git-CI/CD-Hosting plus fertige Backend-Bausteine (Cognito, S3, AppSync/API Gateway), seit Gen 2 als TypeScript-Code — und grenzt sich ab von reinem S3-Static-Hosting, Beanstalk (Server-Apps) und AppSync (nur GraphQL-API).**
