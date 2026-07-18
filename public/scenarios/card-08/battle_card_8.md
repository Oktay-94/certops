---
nr: 8
title: "Elastic Beanstalk · RDS — Web-App hochladen, Plattform macht den Rest"
services:
  - AWS Elastic Beanstalk
  - Elastic Load Balancing (ALB)
  - EC2 Auto Scaling
  - Amazon RDS (Multi-AZ)
  - CloudFormation (unter der Haube)
signalwords:
  - einfach hochladen
  - Plattform kummert sich
  - Provisionierung / Deployment / Load Balancing / Scaling
  - schnell online, wenig Ops
domains: [D2, D3]
assets:
  - battle_card_8.svg
  - battle_card_8.png
  - battle_card_8.pdf
status_note: "Beanstalk aktiv gepflegt (AL2023-Plattformen aktuell). AL2-basierte Plattformen laufen mit Amazon Linux 2 zum 30.06.2026 aus → AL2023 wählen. Faktencheck 17.07.2026."
---

## Szenario

Ein kleines Team hat eine klassische Web-App (z. B. eine Node/PHP-Anwendung) und
will sie **schnell und ohne eigenes Ops-Team** online bringen. Es soll sich
niemand um EC2, Load Balancer, Auto Scaling oder Deployments kümmern müssen —
„Code hochladen, läuft". Die Datenbank soll **stabil** bleiben, auch wenn die
App-Umgebung neu gebaut oder gelöscht wird.

## Ablauf

1. **Upload:** Der Developer schiebt nur den **Code** (`eb deploy` / .zip) in
   Elastic Beanstalk — **keine Infrastruktur-Definition**. Das ist der ganze
   Berührungspunkt.
2. **EB baut die Environment:** Beanstalk provisioniert über **CloudFormation**
   den kompletten Stack — **Application Load Balancer**, **Auto Scaling Group**
   und **EC2-Instances** — und deployt den Code darauf. Der ALB verteilt den
   Traffic auf die EC2-Web-Instances (Pfeil 2).
3. **Betrieb:** Die ASG skaliert nach Last, EB fährt **Rolling Deployments** und
   **Health-Checks**. Das alles ist „managed" — du behältst aber vollen Zugriff
   auf die darunterliegenden Ressourcen (anders als bei reinem Serverless).
4. **DB extern:** Die EC2-App spricht eine **separat provisionierte RDS** an
   (Multi-AZ, Endpoint über eine **Umgebungsvariable**, Security Group EB → RDS).
   Weil sie **außerhalb** der Environment lebt, übersteht sie jeden EB-Neuaufbau.

## Prüfungs-Kernsatz

**Beanstalk = PaaS: du lieferst Code, die Plattform baut ELB + ASG + EC2 — RDS
gehört aber immer außerhalb der Environment.**

## Klassiker-Fallen

- **RDS in der Environment = Datenverlust-Falle:** EB kann RDS *innerhalb* der
  Environment anlegen — dann ist die DB an deren **Lebenszyklus** gekoppelt und
  wird beim Terminieren der Environment **mitgelöscht**. Das ist nur für
  Dev/Test akzeptabel; in Prod immer **separat provisionieren** und per
  Endpoint/Env-Var verbinden.
- **Beanstalk vs. „reines" IaaS:** Wer „minimaler Aufwand, aber trotzdem EC2 &
  volle Kontrolle" liest, landet bei **Beanstalk** — nicht bei manuell
  aufgesetztem ELB+ASG (mehr Arbeit) und nicht bei Lambda (kein klassisches
  „Web-App-.zip auf EC2"-Modell).
- **Beanstalk vs. CloudFormation:** CloudFormation ist das **Werkzeug darunter**
  (Infrastructure as Code, beliebige Ressourcen). Beanstalk ist die **fertige
  App-Plattform** obendrauf. „Ich will nur meine App hochladen" → Beanstalk.
- **AL2 läuft aus:** Amazon-Linux-2-Plattformbranches erreichen zum
  **30.06.2026** EOL — neue Environments auf **AL2023**-Plattformen aufsetzen.
