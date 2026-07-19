---
nr: 50
title: "AWS WAF Bot Control · Challenge vs. CAPTCHA"
services:
  - AWS WAF (Bot Control Common/Targeted)
  - Amazon CloudFront
  - AWS WAF CAPTCHA und Challenge Actions
  - Rate-based Rules
domains:
  - D1
signalwords:
  - "bots that mimic human behavior"
  - "scalping / inventory hoarding"
  - "without impacting legitimate users"
  - "allow search engine crawlers"
  - "rotating IP addresses"
  - "minimize friction at checkout"
  - "credential stuffing"
assets:
  - battle_card_50.svg
  - battle_card_50.png
  - battle_card_50.pdf
status_note: |
  QC (qc.py): 0 Befunde. 9 Boxen, 51 Texte, 17 Segmente, 6 Badges.
  Segmente aufgeschlüsselt (R5): 17 gemeldet − 8 Phantom-Segmente aus
  4 Marker-Definitionen (je 2) = 9 echte Segmente: 6 Ablaufpfeile +
  1 verworfener Pfad + 2 Striche des roten X.
  Badges aufgeschlüsselt (R6): 6 gezählt. Das rote X (r=20, weiß gefüllt,
  roter Rand) wurde von Prüfung (d) korrekt ausgenommen.

  Korrekturrunden:
  1. Gold-Box-Titel "Targeted ohne Scope-Down" bei 324,2 px gemessen,
     verfügbar 284 px — zu breit. Auch bei Schriftgröße 20 noch 308,7 px.
     Vor dem Zeichnen ersetzt durch "Ohne Scope-Down" (215,5 px).
  2. Titel der verworfenen Box von "Rate-based auf Client-IP" (288,2 px bei
     304 verfügbar, nur 15,8 px Reserve) auf "Rate-based nur auf IP"
     (258,0 px) geändert — dieselbe Aussage, mehr Reserve.
  Beide Befunde vor dem Zeichnen abgefangen; Geometrieplan mit
  0 Kollisionen im ersten Durchgang.

  Render-Sanity (R7): elf geometrisch abgeleitete Freizonen, am Ende alle
  rein weiß. Eine Zone musste nachgeschnitten werden: Zone D
  (x1112..1394, y336..384) meldete 1165 nicht-weiße Pixel in
  Antialiasing-Farbtönen. Ursache: das freie Label "alle Kunden",
  berechnet x 1206..1294 / y 348..364, gemessen x 1206,0..1292,7 /
  y 348,0..359,3 — exakte Übereinstimmung, kein Grafikfehler. Zone in
  D1/D2/D3 um das Label herum neu geschnitten, danach 0 nicht-weiße Pixel.
  Alle Markerflächen (markerWidth 10 × stroke-width 3 = 30 px, Lehre aus
  Karte 48) waren diesmal vorab berechnet und verursachten keinen Befund.
  Alle vierzehn geprüften Palettenfarben im PNG nachweisbar (Teal 22240 px,
  Blau 4457 px, Gold 5196 px, Rot 5041 px, Füllungen und dunkle Textfarben
  je > 0).

  Schwarz-Prüfung (R13): reines Schwarz (0,0,0) = 0 px.

  Footer von Hand gemessen (R3): 1268,0 px. Unter Stil-Guide (~1420 px)
  und unter der R3-Warnschwelle (~1400 px).

  Sichtprüfung (R8): versucht. Zurück kam ein Bildobjekt ohne für mich
  lesbaren Inhalt — dasselbe Muster wie bei den Karten 46 bis 49 und in
  Batch 8 und 9. Rechnerisch geprüft ist nicht gesehen. Die Karte ist
  visuell unbestätigt.
---

## Szenario

Ein Sneaker-Shop bringt limitierte Modelle in angekündigten Drops heraus.
Beim letzten Drop war der Bestand nach elf Sekunden weg. Die Auswertung
ergab: 94 % der Bestellungen kamen von Scalper-Bots, die vollständige
Browser-Signaturen nachbilden und ihre Anfragen über Residential Proxies
verteilen — jede Anfrage von einer anderen, echt aussehenden Privatadresse.

IP-Sperren greifen deshalb nicht. Gleichzeitig darf der Googlebot nicht
ausgesperrt werden, weil die Produktseiten organischen Traffic tragen. Und
die 400.000 echten Kunden sollen keine Puzzles lösen müssen, um ein Paar
Schuhe zu kaufen.

## Ablauf

**1 — Scope-Down zuerst: was gar nicht erst geprüft wird.** Ein
Scope-Down-Statement begrenzt, welche Anfragen die Bot-Control-Regelgruppe
überhaupt erreichen. Auf dieser Karte: nur `/drop/*` und `/checkout`, nicht
Bilder, CSS oder Schriftarten. Das ist kein Feinschliff, sondern der
wichtigste Hebel — sowohl für die Kosten als auch dafür, dass die teure
Inspektion nicht auf jeder statischen Datei läuft.

**2 — Common Level als günstiger Vorfilter.** Die Common-Stufe erkennt Bots,
die sich selbst zu erkennen geben (Suchmaschinen, Social-Media-Crawler,
Monitoring-Werkzeuge) sowie bekannte schädliche Bots, und stützt sich dabei
auf Merkmale der HTTP-Anfrage. Der Googlebot wird hier als verifizierter
guter Bot erkannt und durchgelassen, statt später in einer teuren Analyse zu
landen. Die Regelreihenfolge im Web ACL ist damit eine Kostenentscheidung:
Was Common schon klärt, muss Targeted nicht mehr anfassen.

**3 — Targeted Level gegen die eigentlichen Gegner.** Die Targeted-Stufe
arbeitet mit Browser-Interrogation, Fingerprinting und Verhaltensanalyse und
erkennt Bots, die sich absichtlich als reguläre Nutzer ausgeben — genau die
Scalper aus dem Szenario. Sie erstellt selbstständig eine Baseline je Gerät
und wendet dynamische, ratenbasierte Begrenzung an, wenn ein Zugriffsmuster
davon abweicht. Der entscheidende Unterschied zur klassischen Rate-based
Rule: **Niemand muss eine Schwelle raten.**

**4 — Challenge als Normalfall.** Die Challenge-Action führt einen stillen
JavaScript-Test aus, der prüft, ob eine echte Browser-Umgebung vorliegt, und
erzeugt anschließend ein Token. Kein Puzzle, keine Interaktion, kein
Reibungsverlust. Für die 400.000 echten Kunden bleibt der Drop damit ein
normaler Seitenaufruf.

**5 — CAPTCHA nur dort, wo der Schaden entsteht.** Das sichtbare Puzzle
kostet Nutzer Zeit und Nerven und gehört deshalb ausschließlich auf
risikoreiche Aktionen — hier den Checkout. Beide Aktionen erzeugen dasselbe
verschlüsselte, manipulationssichere Token (`aws-waf-token`).

**Die Token-Mechanik ist der Teil, den man verstehen muss.** Bei einem
Treffer entscheidet AWS WAF anhand des Token-Zustands und der konfigurierten
Immunity Time: Liegt ein **gültiges Token** vor, verhält sich die Regel wie
eine `Count`-Action — Labels und Anpassungen werden angewendet, die
Auswertung läuft mit den übrigen Regeln weiter, und der Nutzer sieht nichts.
Die Immunity Time bestimmt, wie lange diese Ruhe anhält: Standard 300
Sekunden auf Web-ACL-Ebene, pro Regel überschreibbar, zulässiger Bereich 60
bis 259.200 Sekunden — **für die Challenge-Action beträgt das Minimum
allerdings 300 Sekunden**.

**6 — Die Kostenfalle.** Targeted ohne Scope-Down auf allen Pfaden laufen zu
lassen ist der teuerste Konfigurationsfehler dieser Architektur. Common Bot
Control enthält 10 Millionen Anfragen pro Monat ohne Zusatzkosten, Targeted
Bot Control nur 1 Million — Faktor zehn. Wer die teure Stufe ungefiltert auf
den gesamten Traffic legt, bezahlt Bot-Analyse für jedes ausgelieferte
Produktbild.

**Verworfen — Rate-based Rule allein auf die Client-IP.** Eine
ratenbasierte Regel zählt Anfragen je Aggregationsschlüssel über ein
rollierendes Fenster. Gegen rotierende Residential Proxies läuft das ins
Leere: Setzt man die Schwelle hoch, trifft sie keinen einzigen Bot; setzt man
sie tief, trifft sie Familien hinter einem gemeinsamen Anschluss und
Firmennetze hinter NAT. Die Schwelle ist immer geraten — das ist der
strukturelle Unterschied zum dynamischen Rate-Limiting der Targeted-Stufe.
Als *zusätzliche* Schicht bleibt die Rate-based Rule sinnvoll; als alleinige
Antwort auf Scalping ist sie es nicht.

## Prüfungs-Kernsatz

**Challenge ist still und für alle, CAPTCHA ist sichtbar und für wenige.**
Wer CAPTCHA breit ausrollt, bestraft Kunden für ein Bot-Problem — und wer
Targeted ohne Scope-Down laufen lässt, bezahlt dafür.

## Abgrenzungen

**50 ↔ 45:** GuardDuty beobachtet die AWS-Kontrollebene (API-Aufrufe,
Netzwerkverhalten von Ressourcen). WAF arbeitet auf HTTP-Ebene **vor** der
Anwendung und sieht Anfragen, die noch gar nichts in AWS ausgelöst haben.
Ein Scalper-Bot erzeugt keinen einzigen GuardDuty-Fund.

**50 ↔ Fraud Control (ATP/ACFP):** Bot Control fragt *ist das ein Bot*.
Account Takeover Prevention fragt *ist das ein Angriff auf ein bestehendes
Konto* (Credential Stuffing, Abgleich gegen gestohlene Zugangsdaten). Account
Creation Fraud Prevention fragt *ist diese Neuanmeldung echt*. Bot Control
gehört in der Regelreihenfolge **davor**, weil es offensichtliche Bots zu
niedrigeren Kosten je Anfrage aussortiert.

**Challenge ↔ CAPTCHA:** Beide erzeugen dasselbe Token. Der Unterschied ist
allein die Nutzerinteraktion — still gegen sichtbar — und damit die Frage,
wie viel Reibung man wem zumutet.

**Common ↔ Targeted:** Common erkennt Bots, die sich zu erkennen geben oder
bekannt sind. Targeted erkennt Bots, die genau das vermeiden. Steht in einer
Frage "mimics human behavior", "evades detection" oder "sophisticated bots",
ist Common raus.

## Klassiker-Fallen

**"CAPTCHA überall einschalten."** Das ist die teuerste und
kundenfeindlichste Variante. Challenge ist der Normalfall, CAPTCHA die
Ausnahme für risikoreiche Aktionen.

**"Der Client bekommt immer ein Puzzle."** Nur wenn er HTML erwartet. Die
CAPTCHA- und Challenge-Skripte sind als HTML-Inhalt ausgelegt und lassen sich
nur von einem Client sinnvoll verarbeiten, der HTML erwartet. Fehlt der
`Accept: text/html`-Header, antwortet AWS WAF mit **HTTP 405 Method Not
Allowed** und dem Header `x-amzn-waf-action` mit dem Wert `captcha`. Für
JavaScript-Anwendungen im Browser ist dieser Header nur innerhalb der eigenen
Domain sichtbar, nicht domänenübergreifend — und die CAPTCHA- oder
Challenge-Antwort enthält **keine CORS-Header**. Wer eine API oder eine SPA
hinter eine CAPTCHA-Regel stellt, ohne die Anwendung anzupassen, produziert
genau hier stille Fehler.

**"Ein gültiges Token heißt, die Regel wird übersprungen."** Nein — sie
verhält sich wie `Count`. Labels und Anpassungen greifen, die weiteren Regeln
werden weiterhin ausgewertet.

**"Die Immunity Time kann ich beliebig kurz setzen."** Der Bereich reicht von
60 bis 259.200 Sekunden, aber für die Challenge-Action liegt das Minimum bei
300 Sekunden.

**"Bot Control ersetzt eine Rate-based Rule."** Es ersetzt sie nicht, es
löst ein anderes Problem. Rate-based Rules bleiben die Standardantwort auf
Brute Force und Application-Layer-Floods.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**Targeted Bot Control existiert erst seit dem 27.10.2022.** Vorher gab es
Bot Control nur in der heutigen Common-Ausprägung. Kursmaterial aus 2021 und
früher beschreibt Bot Control deshalb als reinen Filter für
self-identifying Bots und kennt weder Fingerprinting noch Verhaltensanalyse
noch dynamisches Rate-Limiting.
*Quelle: aws.amazon.com/about-aws/whats-new/2022/10/aws-waf-challenge-rule-action-bot-control-targeted-bots*

**Die Challenge-Action kam gemeinsam mit Targeted Bot Control.** Wer nur
CAPTCHA kennt (allgemein verfügbar seit 21.06.2022, zuvor ab 04.11.2021 in
einzelnen Regionen), hat die stille Variante gar nicht im Werkzeugkasten —
und rollt CAPTCHA dort aus, wo Challenge richtig wäre. Das ist die
praktisch folgenreichste Lücke in älterem Material.
*Quelle: aws.amazon.com/about-aws/whats-new/2022/10/aws-waf-challenge-rule-action-bot-control-targeted-bots,
aws.amazon.com/about-aws/whats-new/2022/06/aws-waf-captcha-generally-available,
aws.amazon.com/about-aws/whats-new/2021/11/aws-waf-captcha-support*

**Freikontingente unterscheiden sich um Faktor zehn.** Common Bot Control
enthält die ersten 10 Millionen Anfragen pro Monat kostenlos, Targeted Bot
Control die erste 1 Million. Diese Zahlen stehen auf der AWS-Preisseite und
sind der belastbare Teil der Kostenaussage. Kursmaterial, das "Bot Control
kostet extra" ohne diese Unterscheidung sagt, verschenkt das eigentliche
Argument für die Regelreihenfolge.
*Quelle: aws.amazon.com/waf/pricing*

**Firewall Manager unterstützt Targeted Bot Control erst seit dem
10.04.2023.** Wer eine organisationsweite Ausrollung anhand älterer
Anleitungen plant, findet die Option dort noch nicht.
*Quelle: aws.amazon.com/about-aws/whats-new/2023/04/aws-firewall-manager-waf-features*

**Die SDK-Integration hat eine Voraussetzung, die oft fehlt.** Die
Anwendungsintegration per JavaScript-SDK setzt mindestens eine Managed Rule
aus Targeted Bot Control oder Fraud Control voraus. Ohne SDK stützen sich
diese Regelgruppen allein auf die Inspektion einzelner Anfragen und verlieren
den Sitzungszusammenhang.
*Quelle: aws.amazon.com/blogs/networking-and-content-delivery/protect-against-bots-with-aws-waf-challenge-and-captcha-actions/*

**Die Konsolen-Terminologie ist im Umbruch.** Die aktuelle
AWS-Dokumentation schreibt an mehreren Stellen "protection pack (web ACL)"
und weist auf eine neue Konsolenoberfläche hin. Prüfungsfragen und älteres
Material sprechen durchgängig von "web ACL". Es ist dasselbe Objekt; die
Karte verwendet den etablierten Begriff nicht, weil sie ohne ihn auskommt.
*Quelle: docs.aws.amazon.com/waf/latest/developerguide/waf-tokens-immunity-times.html*

## Nicht bestätigt

**Konkrete Preise.** Mehrere Drittquellen nennen 10 US-Dollar
Monatsabonnement je Web ACL, 1 US-Dollar je Million Anfragen für Common und
10 US-Dollar je Million für Targeted (pump.co, hykell.com, awsglossary.org,
openappsec.io). Die AWS-Preisseite bestätigt in dieser Recherche nur die
**Freikontingente** (10 Mio. Common, 1 Mio. Targeted) und die
Abrechnungslogik für CAPTCHA-Versuche und Challenge-Antworten, nicht die
Beträge. Auf der Karte stehen deshalb ausschließlich die Freikontingente.

**"Challenge responses are provided at no charge."** Eine Drittquelle
behauptet das, die AWS-Preisseite führt Challenge-Antworten dagegen
ausdrücklich als abrechenbare Größe ("Challenge response is when a user is
served a challenge page … regardless of whether the user attempts the
challenge"). Widersprüchliche Angaben — deshalb steht **nichts zu den
Kosten von Challenge** auf der Karte.

**"CAPTCHA und Challenge können nicht auf POST oder OPTIONS laufen."** Diese
Formulierung stammt aus einer Drittquelle (tocconsulting.fr). Die AWS-Doku
sagt etwas anderes und Präziseres: Die Skripte sind HTML-Inhalte und
funktionieren nur bei einem Client, der HTML erwartet; ohne
`Accept: text/html` gibt es HTTP 405 und den Hinweis-Header. Das ist eine
Aussage über den **Accept-Header**, nicht über die HTTP-Methode. Auf der
Karte steht deshalb die AWS-Formulierung, nicht die Drittquellen-Version.

**Die Zahlen des Szenarios** (11 Sekunden, 94 %, 400.000 Kunden) sind eine
erzählerische Setzung, keine belegte Statistik.

**WCU-Überschreitungen und Body-Inspektion über 16 KB** als zusätzliche
Kostentreiber stammen aus einer Drittquelle und wurden nicht gegen die
AWS-Preisseite geprüft. Nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

**Der ALB oder die eigentliche Anwendung fehlt.** Die Karte endet bei der
WAF-Entscheidung, weil dahinter für den Prüfungskern nichts Interessantes
mehr passiert.

**Common und Targeted sind als getrennte Boxen gezeichnet**, obwohl beide
Teil derselben Managed Rule Group (`AWSManagedRulesBotControlRuleSet`) sind
und über die Inspektionsstufe konfiguriert werden. Die Trennung macht den
Kosten- und Reihenfolgeunterschied sichtbar, der sonst untergeht.

**Challenge und CAPTCHA erscheinen als parallele Ausgänge der
Targeted-Stufe.** Tatsächlich sind es Rule Actions, die an beliebigen Regeln
hängen können — auch an Common-Regeln oder an Rate-based Rules. Die
Zeichnung zeigt den im Szenario sinnvollen Weg, nicht die volle
Kombinationsfreiheit.

**Die Token-Mechanik ist nicht als Element gezeichnet.** Sie steht in der
Randnotiz und im Fließtext, weil sie ein Zustandskonzept ist und kein
Element im Datenfluss. Der Satz "Gültiger Token wirkt wie Count" ist die
prüfungsrelevante Verdichtung.

**Fraud Control (ATP/ACFP) fehlt vollständig.** Es ist die naheliegende
Erweiterung dieser Architektur und gehört fachlich in die Nachbarschaft,
hätte aber zwei weitere Boxen gekostet. Steht bei den Abgrenzungen.

**Der Gold-Pfeil zeigt auf Scope-Down, nicht auf Targeted.** Das ist bewusst:
Die Kostenfalle entsteht durch das *Fehlen* des Scope-Down, nicht durch die
Targeted-Stufe an sich. Wie bei Pfeil 5 auf Karte 49 trägt der Pfeil eine
Warnung über eine Eigenschaft, keinen Datenfluss.

## Farbkonventionen dieser Karte

**Blau #1F5FA8** — CloudFront + WAF als Eintrittspunkt und Ort der Clients.
Der Stil-Guide führt Blau für externe Systeme und Clients; hier steht die
Box für die eingehende Anfragemenge aus Kunden und Bots.

**Teal #0F7C8C** — Scope-Down, Common Level, Targeted Level, Challenge,
CAPTCHA. Alles Regel- und Konfigurationsinstanzen nach der
Batch-9-Konvention. Fünf Teal-Boxen sind viel für eine Karte; sie sind
gerechtfertigt, weil tatsächlich alle fünf Elemente Regelwerk sind und die
Karte ihre Struktur aus der Anordnung bezieht, nicht aus der Farbe.

**Gold #A16E00** — die Kostenfalle. Stil-Guide-Originalbedeutung "kostet
Geld", wie schon auf Karte 49 dieses Batches.

**Rot #C7161D** — ausschließlich der verworfene Pfad: Box-Rand der
Rate-based Rule und das rote X.

**Gold und Rot gemeinsam**, nach der Batch-9-Regel getrennt gehalten: Gold
sagt *warum* etwas teuer wird (fehlender Scope-Down), Rot sagt *dass* die
Rate-based Rule als alleinige Lösung ausscheidet. Verschiedene Objekte, keine
gemeinsame Box.

**Keine neue Farbkategorie eingeführt.**
