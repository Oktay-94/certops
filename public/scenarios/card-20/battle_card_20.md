---
nr: 20
title: "S3 Access Points + VPC Endpoints — ein Bucket, viele Teams, privater Traffic"
services:
  - Amazon S3 Access Points
  - S3 Gateway VPC Endpoint
  - S3 Interface VPC Endpoint (AWS PrivateLink)
  - S3 Bucket Policy / Access Point Policy
  - AWS Direct Connect
signalwords:
  - "gemeinsam genutzter Bucket"
  - "die Bucket Policy wird zu groß / unübersichtlich"
  - "jedes Team braucht eigene Berechtigungen"
  - "Traffic darf das Internet nicht berühren"
  - "kein Internet Gateway, kein NAT Gateway"
  - "Zugriff aus dem eigenen Rechenzentrum"
domains: [D1, D3, D4]
assets:
  png: battle_card_20.png
  pdf: battle_card_20.pdf
  svg: battle_card_20.svg
status_note: "Sichtprüfung des PNG durch Chat-Claude nicht möglich (Regel F9) — rechnerische QC bestanden (0 Befunde), Render-Sanity ok. Faktencheck 18.07.2026 gegen S3-User-Guide (Access Points, PrivateLink) und VPC-User-Guide (Gateway Endpoints)."
---

# Battle Card 20 — S3 Access Points · VPC Endpoints

## Szenario

**Helios Energy** betreibt einen zentralen Data Lake: **ein einziger S3-Bucket
mit 8 PB**. Drei Nutzergruppen greifen darauf zu:

- **Data Science** — EC2, EMR und SageMaker in einer eigenen VPC, liest und
  schreibt unter dem Präfix `/curated`.
- **Finance** — ein BI-Tool im **eigenen Rechenzentrum**, angebunden über Direct
  Connect, darf ausschließlich **lesen** und nur unter `/finance`.
- **Partner-Analytics** — externer Dienstleister in einem anderen AWS-Account.

Zwei Probleme drücken:

1. Die **Bucket Policy ist auf über 240 Statements gewachsen**. Niemand traut
   sich mehr, sie anzufassen, und sie nähert sich dem harten **Limit von 20 KB**.
   Jede neue Teamanforderung macht es schlimmer.
2. Die Compliance-Abteilung verlangt, dass **kein Byte über das öffentliche
   Internet** fließt — weder aus der VPC noch aus dem Rechenzentrum.

## Ablauf 1–6

**1 — Data Science spricht einen Access-Point-Hostnamen an, nicht den Bucket.**
Jedes Team bekommt einen **eigenen Access Point** mit **eigenem Hostnamen** und
**eigener Policy**. Die Anwendung richtet sich also nicht mehr an
`bucket.s3.region.amazonaws.com`, sondern an den Access Point. Der Denkfehler,
den diese Karte auflöst: Ein Access Point ist **keine Kopie und kein Proxy vor
den Daten**, sondern ein **zusätzlicher, benannter Zugangsweg zu demselben
Bucket** — mit eigener Türsteher-Regel.

**2 — Der Traffic verlässt die VPC über den Gateway Endpoint.**
Der **S3 Gateway Endpoint** ist ein **Eintrag in der Route Table**: Traffic zu
den S3-Präfixen wird nicht ans Internet Gateway, sondern an den Endpoint
geroutet. Er hat **kein ENI, keine IP und kostet nichts**. Damit fallen Internet
Gateway und NAT Gateway für S3-Zugriffe weg — was bei 8 PB auch ein
Kostenargument ist, weil NAT-Gateway-Datenverarbeitung pro GB abgerechnet wird.
Die **Endpoint-Policy** grenzt zusätzlich ein, welche Buckets über diesen
Endpoint überhaupt erreichbar sind (Standard wäre: **alle** Buckets in **allen**
Accounts — eine Tür, die man bewusst zumachen sollte).

**3 — Die Bucket Policy delegiert an die Access Points.**
Statt 240 Statements steht in der Bucket Policy im Wesentlichen ein Satz:
*"Erlaube Zugriffe, die über einen Access Point dieses Accounts kommen"*
(Condition `s3:DataAccessPointAccount`). Die eigentliche Feinsteuerung — welches
Präfix, welche Aktionen, welcher Principal — lebt in der **Access Point Policy**
des jeweiligen Teams. Damit wird aus einem zentralen Monolithen eine Menge
kleiner, verständlicher, unabhängig änderbarer Regelwerke. **Wichtig für die
Prüfung: Beide Policies müssen den Zugriff erlauben.** Der Access Point kann
keine Rechte erfinden, die die Bucket Policy nicht delegiert hat.

**4 — Finance kommt über Direct Connect ins AWS-Netz.**
Das BI-Tool steht im eigenen Rechenzentrum. Die Anbindung liefert Direct Connect
(alternativ Site-to-Site VPN) — das ist die Voraussetzung, aber noch nicht die
Lösung für den privaten S3-Zugriff.

**5 — Für Finance braucht es einen Interface Endpoint, keinen Gateway Endpoint.**
Das ist die zentrale Abgrenzung dieser Karte. Ein **Gateway Endpoint funktioniert
nur aus der VPC heraus**, weil er über die Route Table der VPC arbeitet — ein
Rechenzentrum hat keine VPC-Route-Table. Für den Zugriff von on-premises (und
für gepeerte VPCs anderer Regionen oder Wege über ein Transit Gateway) braucht
man den **Interface Endpoint (AWS PrivateLink)**: eine **ENI mit privater
IP-Adresse** in den Subnetzen der VPC, erreichbar über die
Direct-Connect-Verbindung. Preis: **Stundensatz je AZ plus GB-Preis** — im
Gegensatz zum kostenlosen Gateway Endpoint.

**6 — Der Access Point `finance-ro` lässt nur Lesezugriffe durch.**
Seine Policy erlaubt ausschließlich `s3:GetObject` und ausschließlich unter
`/finance`. Zusätzlich ist der **Network Origin auf VPC** gesetzt: Requests, die
nicht aus der vorgesehenen VPC kommen, weist S3 **grundsätzlich ab** — auch dann,
wenn die IAM-Policy sie erlauben würde. Der Access Point hat außerdem eigene
**Block-Public-Access-Einstellungen**.

**Verworfen — der Gateway Endpoint für Finance.**
Der durchgestrichene Pfad ist die beliebteste falsche Antwortoption: "Legen Sie
einen S3 Gateway Endpoint an, damit das Rechenzentrum privat auf S3 zugreifen
kann." Das funktioniert nicht — Gateway Endpoints sind auf die VPC beschränkt.

## Prüfungs-Kernsatz

> **Access Point = eigener Hostname + eigene Policy je Zugriffsmuster; die
> Bucket Policy delegiert nur noch. Network Origin "VPC" sperrt alles andere
> aus. Und: Gateway Endpoint = kostenlos, aber nur aus der VPC — von
> on-premises führt der Weg über den Interface Endpoint (PrivateLink).**

## Klassiker-Fallen

**Falle 1 — Gateway Endpoint vs. Interface Endpoint.**
Die meistgeprüfte Unterscheidung dieser Karte. **Gateway**: Route-Table-Eintrag,
kein ENI, **kostenlos**, nur S3 und DynamoDB, **nur aus der eigenen VPC**.
**Interface (PrivateLink)**: ENI mit privater IP, kostet Stunden- und GB-Preis,
funktioniert auch **von on-premises über DX/VPN**, aus **gepeerten VPCs anderer
Regionen** und über **Transit Gateway**. Signalwort "on-premises" oder
"Direct Connect" in Kombination mit "privat auf S3" → Interface Endpoint.
Signalwort "Kosten senken, kein NAT Gateway mehr" → Gateway Endpoint.

**Falle 2 — Der Access Point ersetzt die Bucket Policy nicht.**
Beide werden ausgewertet. Eine typische Fehlerbeschreibung lautet: "Der Access
Point erlaubt `PutObject`, der Zugriff wird trotzdem abgelehnt." Ursache: Die
Bucket Policy delegiert nicht (oder nicht für diese Aktion). Die Access Point
Policy kann Rechte nur **einschränken**, nicht schaffen.

**Falle 3 — `aws:SourceIp` funktioniert über VPC Endpoints nicht.**
Wer den Zugriff auf S3 auf bestimmte IP-Bereiche begrenzen will, stellt fest,
dass die Quelladresse durch den Endpoint zur **privaten** VPC-Adresse wird.
Richtige Condition-Keys: **`aws:SourceVpce`** (bestimmter Endpoint),
`aws:SourceVpc` (bestimmte VPC) oder `aws:VpcSourceIp`. Und Vorsicht: Eine
Bucket Policy mit `Deny` auf allem außer einem VPC Endpoint kann einen selbst
aus dem Bucket aussperren — inklusive der Konsole.

**Falle 4 — Access Points vs. Multi-Region Access Points vs. Object Lambda.**
Drei ähnlich klingende Dinge. **Access Point** = benannter Zugangsweg zu *einem*
Bucket in *einer* Region. **Multi-Region Access Point** = ein globaler Endpoint,
der Anfragen automatisch an den nächstgelegenen von mehreren Buckets in
mehreren Regionen leitet. **Object Lambda Access Point** = Zugangsweg, der die
Objekte beim Lesen durch eine Lambda-Funktion transformiert (z. B. PII
schwärzen). Die Frage verrät sich am Zweck: Governance → Access Point,
Geo-Latenz/Failover → MRAP, Inhalt verändern → Object Lambda.

**Falle 5 — "Ein Bucket pro Team" ist die Antwort, die man loswerden will.**
Antwortoptionen, die den Bucket aufteilen, klingen sauber, verlieren aber den
gemeinsamen Datenbestand, verdoppeln Lifecycle-, Verschlüsselungs- und
Replikationskonfiguration und lösen das Netzwerkproblem nicht. Access Points
existieren genau dafür: **ein Datenbestand, viele Zugriffsmuster**.

## Bewusste Vereinfachungen im Diagramm

- **Der dritte Konsument (Partner-Analytics, anderer Account) fehlt.** Er ist im
  Szenario genannt, weil er die Policy-Explosion mit verursacht, hätte aber eine
  vierte Zeile und eine Cross-Account-Diskussion gebraucht. Der Mechanismus ist
  derselbe: eigener Access Point, Delegation über die Bucket Policy.
- **Der Access Point ist als Box "zwischen" Endpoint und Bucket gezeichnet.**
  Das ist eine didaktische Vereinfachung: Ein Access Point ist **kein Gerät im
  Datenpfad**, sondern ein zusätzlicher benannter Endpunkt derselben
  S3-Regionalinfrastruktur. Der Traffic fließt nicht "durch" ihn hindurch wie
  durch einen Proxy.
- **Die beiden Access Points liegen im gestrichelten S3-Container.** Der
  Container ist eine logische Gruppierung ("das gehört alles zu S3"), keine VPC
  und kein Netzwerksegment.
- **Route Table, Subnetze und Security Groups sind nicht gezeichnet.** Der
  Gateway Endpoint *ist* im Kern ein Route-Table-Eintrag; das steht als Zeile im
  Kasten statt als eigener Knoten.
- **Der Interface Endpoint liegt in Wahrheit in einer VPC**, nicht "neben" dem
  Rechenzentrum. Im Diagramm steht er auf dem Weg von on-premises nach S3, weil
  das den Zweck zeigt; die korrekte Topologie ist: DX → VPC → ENI des Interface
  Endpoints → S3.
- **Die Rückflüsse (GET-Antworten) sind nicht gezeichnet.** Sie sind in den
  Request-Verbindungen implizit.
- **Verschlüsselung, CloudTrail-Data-Events und Lake Formation fehlen.** Alle drei
  gehören in eine echte Data-Lake-Governance, sind aber Thema anderer Karten
  (43, 49, 58).
