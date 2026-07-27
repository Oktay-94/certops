---
nr: 100
title: Ein Netz für viele Accounts
services: [AWS Resource Access Manager, Amazon VPC, AWS Organizations]
domains: [D1, D4]
signalwords:
  - "multiple accounts share centrally managed subnets"
  - "avoid duplicating network infrastructure per account"
  - "resource share with an organizational unit"
  - "owner keeps control of the VPC"
assets: [battle_card_100.svg, battle_card_100.png, battle_card_100.pdf]
status_note: |
  qc.py 0 Befunde. Gemeldet: 6 Boxen, 22 Texte, 11 Segmente, 3 Badges,
  1 X-Kreis. Aufschlüsselung Boxen: 4 Boxen der Hauptkette + 1 verworfene
  Box + 1 Footer-Rect = 6; keine Zonen. Segmente: 3 Kettenpfeile + 2
  Segmente des Bypass + 2 X-Diagonalen = 7 gezeichnete, dazu 4
  Phantomsegmente aus zwei Marker-IDs ("kette", "verworfen") = 11.
  Korrekturrunden: keine. Untertitel vor dem Zeichnen gegen den echten
  Render gemessen (Reserve 14,6 px).
  precheck.py vor dem Zeichnen: 16 Texte, 0 Befunde, engste Reserve 51,2 px
  ("Eigene Ressourcen" 235/286 px).
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde. R12-Gegencheck: 0 Verstöße.
  r16.py: 16,7 px am freien Label "Subnetze nur innerhalb der Organization".
  Korridorbreite des Bypass 1.025 px gegen ein Label, dessen Breite vor dem
  Zeichnen per assert im Generator geprüft wurde.
  Footer von Hand gemessen: 1.039 px — der höchste Wert des Batches, immer
  noch deutlich unter der Grenze von 1.420 px.
  Achtung bei Sammelprüfungen: Das Muster battle_card_9*.svg trifft diese
  Karte NICHT. R12-Gegencheck, r16-Sammellauf und ZIP-Vollständigkeit wurden
  mit einem Muster geprüft, das battle_card_100 einschließt.
  Sichtprüfung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter
  lieferte einen leeren Platzhalter.
---

## Abweichung vom Masterplan

Die Masterplan-Zeile 100 lautet: „Ground Station · Satellitendaten empfangen
und direkt in S3 verarbeiten (Antenne als Service)". Diese Karte setzt
stattdessen AWS RAM um.

**Grund:** Der offizielle SAA-C03-Exam-Guide führt im Anhang eine
Out-of-Scope-Liste mit der Kategorie „Satellite", und dort steht AWS Ground
Station namentlich. Es handelt sich also nicht um eine Auslassung, sondern
um einen ausdrücklichen Ausschluss. Die Masterplan-Zeile ist fachlich
korrekt beschrieben, aber prüfungsdidaktisch wertlos — die letzte Karte der
Serie hätte einen Dienst behandelt, der in der Prüfung nicht vorkommt.

**Warum RAM als Ersatz:** in derselben Exam-Guide-Liste unter „Security,
Identity, and Compliance" als in-scope geführt, im gesamten Masterplan
bislang nicht vertreten, und mit dem Multi-Account-Netzentwurf ein Thema mit
echtem Prüfungsgewicht in Domain 1 und Domain 4.

Die Entscheidung wurde vor der Skizze vorgelegt und von Oktay getroffen; die
Alternativen waren AWS Service Catalog sowie ein Beibehalten von Ground
Station als markierter Exkurs.

## Szenario

Ein Unternehmen betreibt fünf Team-Accounts in AWS Organizations. Jedes Team
bräuchte Netzanbindung: NAT Gateway für ausgehenden Verkehr, Interface
Endpoints für private Dienstzugriffe, eine Anbindung ans Rechenzentrum. Fünf
Mal dasselbe zu bauen kostet fünf Mal, muss fünf Mal gepflegt werden und
zwingt zu einer Peering-Vollvermaschung samt konfliktfreier IP-Planung.

## Ablauf

1. **Netzwerk-Account.** Ein zentraler Account besitzt die VPC, die
   Subnetze, das NAT Gateway, das Routing und die Direct-Connect-Anbindung.
   Gebaut wird einmal.
2. **Resource Share.** Über AWS RAM werden die Subnetze geteilt. Als
   Principal genügt die Organisationseinheit, einzelne Konto-IDs müssen
   nicht aufgezählt werden. Je Ressourcentyp gilt eine Managed Permission.
   VPC-Subnetze lassen sich ausschließlich innerhalb der eigenen
   Organization teilen — anders als etliche andere Ressourcentypen.
3. **Team-Account.** Die geteilten Subnetze erscheinen im Konto des
   Participants in der VPC-Konsole und in API-Antworten, als lägen sie dort.
   Es gibt keinen zweiten Ort, an dem man nachsehen müsste.
4. **Eigene Ressourcen.** Das Team startet EC2-Instanzen, RDS-Datenbanken
   und Lambda-Funktionen in den geteilten Subnetzen und verwaltet sie
   selbst. Ressourcen anderer Participants oder des Owners sieht und ändert
   es nicht. Der Owner behält Routing, DNS und die VPC-Einstellungen.

## Prüfungs-Kernsatz

Einmal zentral bauen und per Resource Share mitnutzen lassen: der Owner
behält das Netz, die Participants behalten ihre Ressourcen. Doppelte
Infrastruktur ist nicht doppelte Isolation.

## Abgrenzungen

- **VPC Peering und Transit Gateway** verbinden getrennte Netze. RAM teilt
  ein Netz, statt Verbindungen zwischen vielen zu schaffen. Beides kann
  nebeneinander stehen — das Transit Gateway selbst wird typischerweise
  ebenfalls per RAM geteilt.
- **Cross-Account-IAM-Rollen** geben Zugriff auf fremde Ressourcen über
  Rollenwechsel. RAM macht eine Ressource im fremden Konto sichtbar und
  benutzbar, ohne dass jemand das Konto wechselt.
- **Ressourcenbasierte Richtlinien** können manche Ressourcen ebenfalls
  freigeben. Ohne RAM fehlen dabei das Teilen mit einer ganzen OU und die
  Sichtbarkeit in der Konsole des Ursprungsdienstes.
- **AWS Organizations** ist die Voraussetzung, nicht das Werkzeug: es liefert
  die Kontenstruktur, RAM die Freigabe.

## Klassiker-Fallen

- Glauben, geteilte Subnetze hebelten die Kontotrennung aus. Abrechnung,
  IAM-Grenze und Sichtbarkeit der eigenen Ressourcen bleiben je Konto
  getrennt.
- Erwarten, dass Participants am Netz schrauben dürfen. Routing, DNS und
  VPC-Einstellungen bleiben beim Owner.
- Subnetze mit einem Konto außerhalb der Organization teilen wollen. Für
  diesen Ressourcentyp geht das nicht.
- Die Kostenersparnis bei RAM selbst suchen. Der Dienst kostet nichts; das
  Geld sparen die nicht mehrfach gebauten NAT Gateways und Endpoints.

## Faktencheck-Notizen

- Owner-Participant-Modell, Anlegen und Verwalten eigener Ressourcen in
  geteilten Subnetzen, Unsichtbarkeit fremder Ressourcen: Amazon VPC User
  Guide, „Share your VPC subnets with other accounts".
- Sichtbarkeit geteilter Ressourcen in Konsole und API des Ursprungsdienstes
  sowie der Einladungsprozess beim Teilen außerhalb der Organization: AWS
  RAM User Guide, „What is AWS Resource Access Manager?".
- Beschränkung von VPC-Subnetzen auf das Teilen innerhalb der Organization:
  AWS RAM User Guide, „Sharing your AWS resources".
- Teilen mit Organisation, OU, einzelnen Konten sowie mit IAM-Rollen und
  -Benutzern für unterstützte Ressourcentypen, Managed Permissions je
  Ressourcentyp: AWS RAM FAQs.
- Keine zusätzlichen Kosten: AWS RAM FAQs sowie „AWS Resource Access Manager
  in AWS GovCloud (US)" — zwei AWS-Quellen, übereinstimmend.

## Nicht bestätigt / bewusst weggelassen

- **Subnetz-Obergrenze je empfangendem Konto.** Die RAM-Dokumentation
  beschreibt diese Begrenzung im Fehlerbild „LIMIT EXCEEDED" ausdrücklich
  als dienstspezifische Beschränkung, ohne einen Wert zu nennen. Nach
  Projektregel steht deshalb keine Zahl auf der Karte.
- **Vollständige Liste teilbarer Ressourcentypen.** Sie ändert sich laufend;
  die Karte nennt Subnetze als Fall und lässt Transit Gateways, Route
  53 Resolver Rules, License Manager Configurations und Private
  Certificate Authorities in den Abgrenzungen.

## Bewusste Vereinfachungen im Diagramm

- Nur ein Team-Account ist gezeichnet, obwohl das Szenario fünf beschreibt.
  Die Aussage hängt an der Beziehung, nicht an der Anzahl.
- Security Groups lassen sich zusätzlich separat teilen. Das ist ein eigenes
  VPC-Feature und hätte die Kette überladen.
- Der Einladungs- und Annahmeprozess ist nicht dargestellt, weil er bei
  Freigabe innerhalb der Organization nicht anfällt.

## Farbkonventionen dieser Karte

Pfeilfarbe gold, weil die Kette ein Verwaltungsweg ist und keine Nutzdaten
transportiert — der Datenverkehr im geteilten Subnetz ist gerade nicht das
Thema. Die Resource-Share-Box ist gold (Governance), Netzwerk-Account blau
(Quelle), Team-Account und dessen Ressourcen orange (Compute). Die
verworfene Box behält die Rollenfarbe Quelle (blau); abgelehnt wird sie über
X-Kreis und roten Pfad. Kein Grau auf dieser Karte, weil kein Element im
Auslauf ist.
