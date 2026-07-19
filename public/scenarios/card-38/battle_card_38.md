---
nr: 38
title: "AWS Network Firewall — Egress-Kontrolle über Domain-Allowlist"
services:
  - AWS Network Firewall
  - Amazon VPC
  - NAT Gateway
  - Internet Gateway
  - Route 53 Resolver DNS Firewall
domains: [D1, D2]
signalwords:
  - "outbound traffic must be restricted to approved domains"
  - "prevent data exfiltration to unknown destinations"
  - "security groups cannot filter by domain name"
  - "inspect and log all egress traffic centrally"
  - "meet compliance requirements for outbound filtering"
assets:
  png: battle_card_38.png
  pdf: battle_card_38.pdf
  svg: battle_card_38.svg
status_note: >
  QC 0 Befunde (10 Boxen, 42 Texte, 19 gemeldete Segmente — davon 8
  Phantom-Segmente aus den vier Marker-Definitionen, also 11 gezeichnet,
  6 Badges). Render-Sanity bestanden: vier aus der Elementgeometrie
  abgeleitete Freizonen rein weiss, alle 11 Palettenfarben nachweisbar.
  Footer von Hand mit PIL gemessen: 1391,2 px (Stil-Guide ~1420).
  Sichtpruefung: Bildansicht lieferte einen leeren Platzhalter — visuell
  NICHT geprueft, Oktay muss draufschauen.
---

# Battle Card 38 — Network Firewall · Egress-Kontrolle

## Szenario

**Halden Pharma** verarbeitet Zulassungsdaten auf EC2-Instanzen in privaten
Subnetzen. Die Auflage des Auditors lautet: Ausgehender Verkehr **nur** zu einer
freigegebenen Liste von Domains — Paketquellen, interne Repositories,
AWS-Endpunkte. Alles andere wird verworfen und protokolliert. Anlass war ein
kompromittiertes Build-Paket in einer anderen Firma, das Daten an einen
Paste-Dienst geschickt hatte.

Security Groups helfen hier nicht: Sie kennen IP-Adressen, Ports und Prefix
Lists — **keine Domainnamen**. Eine Allowlist auf IP-Basis wäre bei Zielen
hinter CDNs praktisch nicht pflegbar.

## Ablauf

**1 — Die Instanz baut eine Verbindung auf.** Die Route-Tabelle des privaten
Subnetzes schickt `0.0.0.0/0` **nicht** zum NAT Gateway, sondern zum
**Firewall-Endpoint derselben Availability Zone**. Die Instanz merkt davon
nichts; für sie ist es eine normale ausgehende Verbindung.

**2 — Die Firewall Policy entscheidet.** Zuerst laufen die **Stateless Rule
Groups** — sie arbeiten paketweise auf dem 5-Tupel und geben den Verkehr per
`forward to stateful` an die zweite Stufe weiter. Dort greift die **Stateful
Domain List**. Bei HTTPS liest die Firewall den **SNI aus dem TLS-Handshake**,
bei HTTP den **Host-Header**. Sie macht dabei **keine eigenen DNS-Lookups** und
bewertet **keine IP-Adressen**. Steht der Name auf der Allowlist, wird
durchgelassen.

**3 — Der erlaubte Verkehr geht weiter zum NAT Gateway.** Die Route-Tabelle des
Firewall-Subnetzes zeigt für `0.0.0.0/0` auf das NAT Gateway in **derselben AZ**.
Diese Reihenfolge — erst Firewall, dann NAT — ist der Punkt: So sieht die
Firewall die **echten privaten Quell-IPs** der Workloads und man kann
5-Tuple-Regeln pro Instanz schreiben.

**4 / 5 — NAT Gateway und Internet Gateway.** Das NAT Gateway übersetzt auf
seine Elastic IP, die Route-Tabelle des öffentlichen Subnetzes zeigt auf das
IGW. Beide sind reine Transportstationen, **keine Kontrollinstanzen**.

**6 — Alles Relevante wird protokolliert.** Alert-Logs (Regeltreffer) und
Flow-Logs (Verbindungsmetadaten) gehen nach S3, CloudWatch Logs oder Kinesis
Data Firehose. Für den Auditor ist genau das der Nachweis.

**Verworfen (rotes X):** Der Verbindungsversuch zu `paste.evil.example`. Der SNI
steht nicht auf der Allowlist, die Domain-List-Regel verwirft das Paket — die
Verbindung kommt gar nicht erst bis zum NAT Gateway.

## Prüfungs-Kernsatz

**Security Groups filtern Adressen, Network Firewall filtert Namen.** Sobald in
einer Frage „approved domains", „domain allowlist" oder „prevent exfiltration to
unknown destinations" steht, ist die Antwort Network Firewall (oder Route 53
Resolver DNS Firewall) — nie eine Security Group und nie eine NACL.

## Abgrenzungen

| Kontrolle | Ebene | Richtung | Filtert nach |
|---|---|---|---|
| Security Group | ENI, stateful | ein/aus | IP, Port, Prefix List, SG |
| Network ACL | Subnet, stateless | ein/aus | IP, Port |
| Network Firewall | VPC-Route, stateful | ein/aus | Domain (SNI/Host), 5-Tupel, Suricata-Signaturen |
| DNS Firewall | Route 53 Resolver | DNS-Anfragen | Domainname in der Query |
| AWS WAF | HTTP(S) an ALB/CloudFront/API GW | eingehend | HTTP-Inhalt, Rate, Geo |

**Network Firewall und DNS Firewall sind keine Alternativen, sondern zwei
Schichten.** DNS Firewall verhindert, dass ein Name überhaupt aufgelöst wird —
das greift auch gegen DNS-Tunneling. Network Firewall prüft die tatsächliche
Verbindung. Wer nur DNS Firewall einsetzt, ist umgangen, sobald jemand die
IP-Adresse kennt und direkt verbindet. Wer nur Network Firewall einsetzt, sieht
DNS-Exfiltration nicht. AWS empfiehlt in seinen eigenen Beispielen ausdrücklich
beides zusammen.

**Nicht zu verwechseln mit Gateway Load Balancer.** GWLB ist der Weg, wenn eine
**Appliance eines Drittanbieters** (Palo Alto, Fortinet) inspizieren soll.
Network Firewall ist die verwaltete AWS-eigene Variante desselben Musters.

## Klassiker-Fallen

**1. HOME_NET — die stille Lücke.** Standardmäßig inspiziert die Domain-List nur
Verkehr, der aus dem **CIDR-Bereich des Deployment-VPC** stammt. Steht die
Firewall zentral in einem Inspection-VPC und kommt der Verkehr über Transit
Gateway aus Spoke-VPCs, dann läuft dieser Verkehr **ungeprüft durch** — kein
Fehler, kein Log, kein Alarm. Man muss die CIDRs der Spokes explizit in die
Rule-Variable `HOME_NET` eintragen. Das ist die gefährlichste Fehlkonfiguration
dieser Karte, weil sie wie ein funktionierendes Setup aussieht.

**2. Action Order bei gemischten Domain-Listen.** Eine Allow-Domain-List erzeugt
implizit eine Drop-Regel für alles Übrige. In einer Policy mit *Default Action
Order* greift diese implizite Drop-Regel **vor** Reject- oder Alert-Regeln aus
anderen Domain-List-Gruppen. AWS rät deshalb davon ab, Allow-Listen und
Reject/Alert-Listen in derselben Policy mit Default-Reihenfolge zu mischen — wer
beides braucht, nimmt *Strict Evaluation Order*.

**3. SNI-Filterung ist umgehbar.** Die Firewall vertraut dem, was der Client in
den Handshake schreibt. Wer den Namen kennt, per DNS auflöst und dann **direkt
per IP** verbindet, taucht in keiner Domain-List-Regel auf. Die AWS-Doku sagt
dazu klar: Wer das abdecken will, schreibt **zusätzlich IP-basierte Regeln** —
und ergänzt DNS Firewall.

**4. Die Firewall macht kein NAT.** Ohne NAT Gateway davor oder dahinter
brauchen die Instanzen öffentliche IPs. Network Firewall ersetzt weder NAT
Gateway noch Internet Gateway.

**5. Das Firewall-Subnetz ist exklusiv.** In das Subnetz mit dem
Firewall-Endpoint gehört **nichts anderes** — keine Instanzen, kein NAT Gateway.

**6. AZ-Symmetrie.** Hin- und Rückweg müssen über **denselben** Firewall-Endpoint
laufen, sonst sieht die Stateful Engine nur eine Richtung des Verbindungsstatus.
Deshalb gehört pro AZ ein Endpoint, und die Routen bleiben AZ-lokal. Nebeneffekt:
Ein Endpoint je AZ kostet auch je Endpoint.

**7. Historische Reihenfolge.** Vor den VPC-Routing-Erweiterungen konnte Network
Firewall **nur zwischen IGW und NAT Gateway** stehen — dort sieht sie nur noch
die NAT-IP, alle Workloads sehen gleich aus. Seit man die `local`-Route in
Subnet-Route-Tabellen überschreiben kann, steht die Firewall **vor** dem NAT
Gateway. Ältere Diagramme und Kursmaterialien zeigen noch die alte Anordnung.

## Nicht bestätigt

**ESNI / Encrypted Client Hello.** Eine Drittquelle (Techoral, Juni 2026)
behauptet, bei verschlüsseltem SNI funktioniere die SNI-Filterung überhaupt
nicht und man brauche zwingend TLS-Inspektion oder IP-Blocking. Das ist
technisch plausibel und deckt sich mit dem Prinzip, aber **die AWS-Doku sagt es
nicht in dieser Form** — sie spricht nur allgemein von manipulierten SNI- oder
Host-Headern. Vor Verwendung im Unterricht gegenprüfen.

**Randnotiz, AWS-bestätigt:** Seit November 2025 gibt es das **Regional NAT
Gateway**, das die AZ-weise Vervielfachung von NAT Gateways in
Inspektionsarchitekturen vereinfacht. Für SAA-C03 ist das (noch) kein
Prüfungsstoff; für eine reale Architektur relevant. Bewusst nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- **Nur eine Availability Zone gezeichnet.** Real gehört das gesamte Muster —
  privates Subnetz, Firewall-Subnetz, öffentliches Subnetz, jeweils mit eigener
  Route-Tabelle — pro AZ dupliziert. Das zweimal zu zeichnen hätte die Karte
  verdoppelt, ohne etwas Neues zu zeigen. Die AZ-Symmetrie steht als Falle im
  Text.
- **Der Rückweg ist nicht gezeichnet.** Antwortpakete laufen denselben Weg
  zurück durch denselben Endpoint.
- **Die Route-Tabellen sind als Textzeilen in den Boxen abgebildet**, nicht als
  eigene Objekte. Real sind es drei getrennte Route-Tabellen pro AZ.
- **Stateless und Stateful Rule Groups stecken in einer Policy-Box.** Es sind
  zwei getrennte Verarbeitungsstufen mit eigener Kapazitätsrechnung.
- **DNS Firewall ist nicht gezeichnet**, obwohl sie in die Architektur gehört —
  sie hängt am Resolver, nicht am Datenpfad, und hätte die Ablauflinie
  gesprengt. Sie steht in der Abgrenzungstabelle.

## Farbkonventionen dieser Karte

- **Teal = Regelwerk / Policy-Kontrolle** — Network Firewall und Firewall
  Policy. Das setzt bewusst die Verwendung von Karte 37 fort (dort OAC), wo Teal
  ebenfalls eine Policy-Instanz und keinen Datenweg markiert hat. **Vorschlag:
  Teal als „Policy-/Regelinstanz" festschreiben** und die alte
  Stil-Guide-Bedeutung „Config" darin aufgehen lassen. Die Neptune-Belegung
  („Graph-Datenbank") wäre damit die Ausnahme, die einen eigenen Ton braucht.
  Zum Gegenlesen vorgelegt.
- **Navy = NAT Gateway und Internet Gateway** — konsistent mit der
  Batch-7-Verwendung „Infrastruktur-Eintrittspunkt". ⚠️ Auf Karte 37 hat Navy
  KMS markiert; diese Doppelbelegung steht weiterhin offen.
- **Blau = Workload/Client**, **Grün = erlaubtes Ziel und Log-Senke**, **Rot =
  verworfen/Falle**: unverändert aus dem Stil-Guide.
- **Der Hauptfluss ist Navy gezeichnet**, weil er ein reiner Netzwerkpfad ist —
  nicht in der Farbe eines einzelnen Dienstes.
