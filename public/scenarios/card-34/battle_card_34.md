---
nr: 34
title: "NAT Gateway vs VPC Endpoints — ab wann sich ein Endpoint rechnet"
services:
  - Amazon VPC
  - NAT Gateway
  - Gateway VPC Endpoint
  - Interface VPC Endpoint
  - Amazon S3
signalwords:
  - reduce data transfer costs
  - private subnets without internet access
  - most cost-effective way to access S3
  - minimize NAT Gateway charges
  - no changes to the application
domains: [D3, D4]
assets:
  png: battle_card_34.png
  pdf: battle_card_34.pdf
  svg: battle_card_34.svg
status_note: >
  QC 0 Befunde, Render-Sanity bestanden (Freizone "zwischen Titel und NAT"
  zunächst als Befund gemeldet — Ursache war die zu breite Zonendefinition,
  nicht die Karte). SICHTPRÜFUNG NICHT MÖGLICH.
---

# Karte 34 — NAT Gateway vs VPC Endpoints

**Szenario.** Nordlicht Analytics GmbH betreibt in `eu-central-1` eine
Datenplattform in privaten Subnetzen über drei Availability Zones, mit **drei
NAT Gateways** für Hochverfügbarkeit. Durch den NAT laufen monatlich 8 TB nach
S3, 2,5 TB ECR-Image-Pulls, 400 GB CloudWatch Logs und 300 GB echter
Internetverkehr — zusammen 11,4 TB. Die Rechnung: 3 × $32,85 Stundenkosten
plus 11.452 GB × $0,045 Datenverarbeitung ≈ **$614 im Monat**.

## Ablauf

**1 — Heute verlässt aller Verkehr das Subnetz über den NAT.** Das ist der
Default nach dem VPC-Assistenten, und niemand hat ihn je gewählt. Jede
S3-Anfrage, jeder Image-Pull und jede Log-Zeile passiert dasselbe Gateway.

**2 — Der NAT rechnet zweimal ab.** $0,045 pro Stunde und AZ, unabhängig vom
Verkehr, plus $0,045 pro verarbeitetem GB in beide Richtungen. Bei 720 GB im
Monat sind die Verarbeitungskosten so hoch wie die Stundenkosten; darüber
dominieren sie.

**3 — S3 wandert auf den Gateway Endpoint.** Der ist für S3 und DynamoDB
**kostenlos** — keine Stundengebühr, keine Datenverarbeitung. Er ist kein
Gerät, sondern ein Eintrag in der Route-Table, der auf eine Prefix List zeigt.
8 TB fallen damit ersatzlos aus der NAT-Rechnung: **$369 gespart, ohne eine
Zeile Anwendungscode.** Das ist die mit Abstand ertragreichste Einzelmaßnahme
der Karte.

**4 — ECR bekommt Interface Endpoints.** ECR braucht zwei: `ecr.api` und
`ecr.dkr`. Über drei AZs kosten sie 2 × 3 × $0,01 × 730 = $43,80 fix, plus
2.560 GB × $0,01 = $25,60 — zusammen $69,40 gegen $115,20 über den NAT.
**Ersparnis $45,80.** Nebenbei: die eigentlichen Image-Layer holt ECR aus S3,
und dieser Anteil läuft bereits über den kostenlosen Gateway Endpoint.

**5 — CloudWatch Logs bleibt auf dem NAT.** 400 GB im Monat kosten über den
NAT $18. Ein Interface Endpoint über drei AZs kostet $21,90 fix plus $4
Datenverarbeitung — **$25,90, also mehr.** Ein Endpoint ist kein Sparknopf,
den man überall drückt.

**6 — Die Bilanz.** Aus $614 werden rund **$199 im Monat**, etwa 67 Prozent
weniger. Der NAT bleibt bestehen, weil echter Internetverkehr weiter durch ihn
muss — er wird nur entlastet.

## Prüfungs-Kernsatz

**Gateway Endpoint für S3 und DynamoDB immer, Interface Endpoint erst ab rund
626 GB pro Monat und Dienst.**

Die Zahl kommt aus einer Zeile: ein Interface Endpoint über drei AZs kostet
$21,90 fix im Monat und spart $0,035 pro GB gegenüber dem NAT. $21,90 ÷ $0,035
= **626 GB**. Bei nur einer AZ sinkt die Schwelle auf rund 209 GB, bei sechs AZs
steigt sie auf über 1,2 TB. Die Schwelle skaliert mit der Zahl der AZs, nicht
mit dem Verkehr.

## Klassiker-Fallen

**1 — „Der wahre NAT-Preis ist $0,135/GB." Für S3 stimmt das nicht.** Die
Rechnung $0,045 Verarbeitung + $0,09 Egress gilt für Ziele **im Internet**.
Datentransfer von EC2 nach S3 **in derselben Region ist kostenlos** — AWS'
eigenes Preisbeispiel sagt das ausdrücklich. Für S3-Verkehr über den NAT fällt
also allein die Verarbeitung von $0,045/GB an. Die $0,135 stehen in mehreren
gut rankenden Artikeln und sind für den häufigsten Anwendungsfall zu hoch.

**2 — Interface Endpoints sind nicht automatisch billiger.** Zwei Effekte
werden übersehen: die Stundengebühr fällt **pro AZ** an, und manche Dienste
brauchen **mehrere** Endpoints (ECR zwei, SSM drei). Wer für einen Dienst mit
50 GB Monatsvolumen in drei AZs einen Endpoint anlegt, zahlt $21,90 statt
$2,25. Endpoint Policies ändern daran übrigens nichts — sie sind
Sicherheitswerkzeug, nicht Kostenwerkzeug, und beeinflussen kein Routing.

**3 — Regional NAT Gateway ist keine Sparmaßnahme.** Seit dem **19.11.2025**
gibt es einen regionalen Modus: ein NAT Gateway dehnt sich automatisch über
die AZs aus, in denen Workloads liegen, und zieht sich zurück, wenn sie
verschwinden. Kein Public Subnet nötig, keine Route-Table-Pflege bei neuen
AZs. Abgerechnet wird aber weiterhin **pro AZ-Stunde**. Es ist eine
Betriebsvereinfachung, keine Kostensenkung — wer es in einer Kostenfrage
ankreuzt, liegt falsch. Steht in keinem gängigen SAA-Kursmaterial.

## Nicht bestätigt

Ein Preisrechner nennt einen „Provisioned"-Modus für NAT Gateway mit
Gbps-Stunden-Preis und kostenloser Datenverarbeitung. Die AWS-Preisseite zeigt
in den abrufbaren Abschnitten nur „NAT Gateway" und „Regional NAT Gateway".
Eine einzelne Drittquelle reicht nach der Batch-6-Erfahrung nicht — deshalb
weder auf der Karte noch als Falle. **Vor dem nächsten Netzwerk-Batch
nachprüfen.**

## Abgrenzung zu Karte 20

Karte 20 beantwortet die **Zugriffsfrage**: Gateway Endpoint gegen Interface
Endpoint, welcher Dienst welchen Typ unterstützt, und dass ein Gateway Endpoint
nur aus der eigenen VPC erreichbar ist — nicht aus einer gepeerten VPC oder von
on-premises. Karte 34 setzt darauf auf und beantwortet die **Kostenfrage**: was
NAT-Datenverarbeitung gegen Endpoint-Gebühr kostet und wo die Schwelle liegt.
Wer Karte 20 kennt, weiß *ob* es geht; Karte 34 sagt, *ob es sich lohnt*.

## Bewusste Vereinfachungen im Diagramm

- Die drei NAT Gateways sind als **ein** Kasten gezeichnet; die Preise stehen
  pro Stunde und AZ daneben.
- Die privaten Subnetze aus drei AZs sind zu **einem** Kasten
  zusammengefasst.
- Cross-AZ-Datentransfer zwischen Instanz und NAT ist nicht dargestellt. Er
  fällt an, wenn beide in verschiedenen AZs liegen, und ist im
  Rechenbeispiel nicht enthalten.
- Der rote X-Stub unter den Interface Endpoints markiert den **verworfenen**
  CloudWatch-Endpoint, nicht einen Ausfall.

## Farben

Keine neue Kategorie. Blau = private Subnetze (User/App) · Navy = NAT Gateway
und AWS-Dienste ohne eigene Farbe, konsistent mit TGW auf 31/32 und NLB auf
33 · Grün = Endpoints und S3, entspricht der Palettenregel „Grün = S3, Storage,
Ziel" · Grau gestrichelt = Internet als externe Strecke · Rot = verworfen ·
Gold = Kosten.

## Technische Notiz

Beim Rendern ist aufgefallen, dass cairosvg Text mit Subpixel-Antialiasing
ausgibt: rund 5 % der Pixel im Titelbereich sind farbige Kantensäume. Das gilt
für alle bisherigen Karten gleichermaßen. Auf dem Bildschirm unsichtbar, im
Druck können dunkle Überschriften leicht farbstichig wirken. Das PDF ist als
Vektorformat nicht betroffen. Dokumentiert, nicht behoben.
