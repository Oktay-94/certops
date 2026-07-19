---
nr: 36
title: "Route 53 Routing Policies — vier Ebenen in einer DNS-Antwort"
services:
  - Amazon Route 53
  - Route 53 Health Checks
  - Application Load Balancer
  - Amazon S3
domains: [D2, D3]
signalwords:
  - "customer data must remain in the EU"
  - "route users to the endpoint that provides the lowest latency"
  - "automatically fail over if the primary Region becomes unavailable"
  - "gradually shift a small percentage of traffic to the new version"
  - "some users receive an empty response"
assets:
  png: battle_card_36.png
  pdf: battle_card_36.pdf
  svg: battle_card_36.svg
status_note: >
  QC 0 Befunde (12 Boxen, 52 Texte, 28 gemeldete Segmente — davon 4
  Phantom-Segmente aus den beiden Marker-Definitionen, also 24 gezeichnet,
  6 Badges). Render-Sanity bestanden: vier aus der Elementgeometrie
  abgeleitete Freizonen rein weiss, zehn Palettenfarben im PNG nachweisbar.
  Footer zusaetzlich von Hand mit PIL gemessen: 1288,9 px (Stil-Guide ~1420).
  Sichtpruefung: Bildansicht lieferte ein Bildobjekt ohne fuer Claude lesbaren
  Inhalt — visuell NICHT geprueft, Oktay muss draufschauen.
---

# Battle Card 36 — Route 53 Routing Policies

## Szenario

**Vermeer Legal Cloud**, Kanzlei-SaaS aus Utrecht. Mandantendaten europäischer
Kunden dürfen die EU nicht verlassen; nordamerikanische Kunden werden aus
`us-east-1` mit eigener Datenbasis bedient. In Europa laufen zwei Deployments:
`eu-central-1` (Frankfurt) und `eu-west-1` (Dublin). Version **4.3** soll als
Canary an 10 % der EU-Nutzer ausgerollt werden, zunächst nur in Frankfurt.

Die Anforderung lautet also gleichzeitig: **Compliance-Grenze halten,
schnellsten Endpunkt wählen, Regionsausfall überleben, Rollout dosieren.**
Keine einzelne Routing Policy kann das. Route 53 löst es durch Verschachteln
von vier Record-Ebenen in derselben Hosted Zone.

## Ablauf

**1 — Der Client fragt `app.vermeer.eu`.** Ein Rechner in München stellt eine
DNS-Anfrage. Wichtig für das Verständnis der ganzen Karte: Route 53 gibt eine
**Adresse** zurück und ist danach aus dem Spiel. Der eigentliche
Anwendungs-Traffic fließt **nie durch Route 53**. Alles, was die vier Ebenen
tun, passiert in den Millisekunden der Namensauflösung.

**2 — Geolocation entscheidet die Compliance-Grenze.** Die äußerste Ebene ist
bewusst keine Performance-Entscheidung, sondern eine Regel: Anfragen aus Europa
gehen in den EU-Baum, Anfragen aus Nordamerika nach `us-east-1`. Geolocation ist
**deterministisch** — ein Nutzer in Deutschland landet immer im EU-Baum, auch
wenn `us-east-1` in diesem Moment schneller antworten würde. Genau das will man
bei Datenresidenz. Der **Default-Record (`*`)** ist hier kein Komfort, sondern
Pflicht: Er fängt IP-Adressen ab, die Route 53 keiner Location zuordnen kann.

**3 — Failover schützt die Grenze.** Der Primary-Record ist ein Alias auf die
darunterliegende Latency-Gruppe, mit *Evaluate Target Health*. Fallen **beide**
EU-Regionen aus, gilt der Primary als unhealthy und der Secondary greift — eine
statische **Wartungsseite in S3, in der EU**. Das ist der eigentliche Merkwert
dieser Ebene: Der naheliegende Failover nach `us-east-1` wäre technisch trivial
und würde die Datenresidenz brechen. Deshalb liegt er auf der Karte als roter
Pfad mit X quer über die Zonengrenze.

**4 — Latency wählt innerhalb der Grenze das Tempo.** Erst jetzt, wo die
Compliance bereits gesichert ist, darf Performance entscheiden. Route 53
vergleicht gemessene Netz-Latenzen zwischen dem Netz des anfragenden Resolvers
und den beteiligten Regionen; für München gewinnt in aller Regel Frankfurt.
Jeder Latency-Record trägt einen eigenen Health Check — fällt Frankfurt allein
aus, antwortet diese Ebene mit Dublin, ohne dass Ebene 3 überhaupt anspringt.

**5 / 6 — Weighted dosiert den Rollout.** Unter dem Frankfurt-Zweig hängen zwei
gewichtete Records: 90 auf das ALB der Version 4.2, 10 auf das der Version 4.3.
Die **TTL von 60 Sekunden** ist der Hebel für die Rückrolle: Ein Gewicht auf 0
zu setzen nimmt den Canary sofort aus der Rotation — aber erst, wenn die
Resolver ihre gecachten Antworten ablaufen lassen. Dublin fährt bewusst nur
v4.2; ein Canary in beiden Regionen gleichzeitig verdoppelt die Fehlerquellen,
ohne den Erkenntnisgewinn zu verdoppeln.

## Prüfungs-Kernsatz

**Geolocation ist eine Regel, Latency ist eine Messung.** Wo beides gefordert
ist, liegt die Regel außen und die Messung innen — und der Failover-Secondary
muss innerhalb derselben Grenze bleiben wie der Primary.

## Abgrenzung zu Karte 35

Karte 35 zeichnet Route 53 Latency-Routing als **verworfene** Alternative zu
Global Accelerator: DNS steuert nur die Auflösung, die Pakete reisen danach
weiter über das öffentliche Internet. Diese Karte widerspricht dem nicht,
sondern ergänzt es: **DNS entscheidet, wohin ein Client sich verbindet — nicht,
wie die Pakete reisen.** Für Datenresidenz, Failover-Logik und
Rollout-Steuerung ist genau diese Entscheidung das Richtige; für stabile
Anycast-IPs und TCP-Routing ist sie das falsche Werkzeug.

## Klassiker-Fallen

**1. „Geoproximity geht nur über Traffic Flow."** Das war bis zum
**10.01.2024** richtig und steht bis heute in vielen Kursen, Cheat Sheets und
Fragensammlungen. Seitdem ist Geoproximity eine ganz normale Routing Policy für
Records in public **und** private Hosted Zones, über Console, API, SDK und CLI
konfigurierbar. Der Unterschied zu Geolocation bleibt: Geolocation fragt „wo
sitzt der Nutzer", Geoproximity rechnet Entfernung zwischen Nutzer und
**Ressource** und lässt sich per **Bias** (−99 bis +99) verzerren.

**2. Geolocation ohne Default-Record ist ein stiller Totalausfall.** Route 53
antwortet auf Anfragen aus nicht abgedeckten oder nicht zuordenbaren Locations
mit **rcode NOERROR und leerer ANSWER-Sektion** — kein Fehler, keine Adresse.
Die Anwendung wirkt tot, obwohl jede Region gesund ist. Analogie: eine
Telefonzentrale, die bei unbekannter Vorwahl kommentarlos auflegt, statt „kein
Anschluss" zu sagen. Sonderfall: Wer Records für alle US-Bundesstaaten anlegt,
braucht **zusätzlich** einen Record für „United States" — manche US-IPs sind
keinem Bundesstaat zugeordnet.

**3. Acht Policies, nicht sieben.** Simple, Weighted, Latency, Failover,
Geolocation, Geoproximity, Multivalue Answer und **IP-based** (seit Juni 2022).
IP-based fehlt in vielen Übersichten; es routet nach CIDR-Blöcken, die man
selbst pflegt — der Fall für „ein bestimmter ISP soll auf einen bestimmten
Endpunkt".

**4. Multivalue Answer ist kein Load Balancer.** Route 53 antwortet mit **bis
zu acht** gesunden Records und wählt bei mehr als acht zufällig aus; sind alle
unhealthy, kommen bis zu acht **unhealthy** Records zurück. Kein Session
Affinity, kein Connection Draining, keine Lastkenntnis. In Fragen mit
„distribute traffic across instances" ist die Antwort ein ALB/NLB, nicht
Multivalue.

**5. TTL bestimmt das Rollback-Tempo, nicht das Gewicht.** Ein Gewicht von 0
entfernt einen Endpunkt sofort aus **neuen** Antworten; bereits ausgelieferte
Antworten leben bis zum TTL-Ablauf weiter. Wer Blue/Green über DNS fährt und
eine TTL von 86 400 s stehen lässt, hat einen Rollback von einem Tag.

**6. Latency-Routing ist nicht Geografie.** Route 53 nutzt gemessene
Latenzdaten, keine Luftlinie. Der geografisch nächste Endpunkt ist nicht
zwingend der schnellste — bei schlechtem Peering kann Dublin für einen
deutschen Provider schneller sein als Frankfurt.

## Bewusste Vereinfachungen im Diagramm

- **Die vier Boxen sind Record-Sets, keine Server.** Real sind es vier
  verkettete Record-Gruppen in einer Hosted Zone (bzw. ein Traffic-Flow-Baum);
  die Verkettung läuft über Alias-Records mit *Evaluate Target Health*.
- **Blue/Green als zwei ALBs** ist die DNS-Variante. Praktisch wird ein Canary
  oft in **einem** ALB über zwei Target Groups gewichtet — das ist dann
  ALB-Weighting, kein Route-53-Weighting, und die TTL-Falle entfällt.
- **Der Rückweg der DNS-Antwort ist nicht gezeichnet**, ebenso wenig der
  eigentliche HTTPS-Traffic zum ALB. Die Karte zeigt die Auflösungs-Kaskade.
- **Die Health-Check-Pfeile fehlen.** Route 53 Health Checks prüfen die
  Endpunkte von außen; das als eigene Pfeilschar zu zeichnen hätte die vier
  Ebenen unlesbar gemacht.

## Nicht bestätigt

Keine offenen Punkte. Alle Aussagen dieser Karte sind gegen die AWS-Doku bzw.
gegen die AWS-Ankündigung vom 10.01.2024 (Geoproximity) geprüft. Nichts auf der
Karte stützt sich allein auf eine Drittquelle.

## Farbkonventionen dieser Karte

- **Lila = Route 53** — alle vier Record-Ebenen und der gesamte Hauptfluss.
  Das folgt dem **ursprünglichen Stil-Guide** (Lila = Route 53). Die
  Batch-5-Erweiterung „Lila = Schicht davor, die etwas warm hält" (DAX,
  ElastiCache, RDS Proxy) kommt auf dieser Karte nicht vor, die Doppelbelegung
  bleibt hier also folgenlos — **aber ungelöst.** Gegenlesen steht weiter aus.
- **Grün = Endpunkt und Ziel** — ALBs, S3-Wartungsseite, `us-east-1`,
  `eu-west-1`. Konsistent mit Batch 7.
- **Blau = Nutzer/Client**, **Rot = verworfen/Gefahr**, **Grau gestrichelt
  (4,4) = Zone**: alle unverändert aus dem Stil-Guide.
- **Gestrichelter Boxenrand (7,5) = passiv oder temporär**: Wartungsseite
  (steht nur im Ausfall bereit), Canary-ALB v4.3 (temporäres Deployment),
  Warnbox (Fehlkonfiguration).
- **Keine neue Farbkategorie eingeführt.**
