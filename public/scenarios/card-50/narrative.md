---
cardNumber: 50
slug: waf-bot-control-challenge-captcha-ostwall-sneaker-drop-scalper
title: "AWS WAF Bot Control · Challenge vs. CAPTCHA"
services:
  - "AWS WAF (Bot Control Common/Targeted)"
  - "Amazon CloudFront"
  - "AWS WAF CAPTCHA und Challenge Actions"
  - "Rate-based Rules"
domains:
  - "D1"
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/waf/latest/developerguide/waf-tokens-immunity-times.html"
  - "https://docs.aws.amazon.com/waf/latest/APIReference/API_ImmunityTimeProperty.html"
  - "https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-bot.html"
  - "https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-managed-rule-group.html"
  - "https://aws.amazon.com/waf/pricing/"
  - "https://aws.amazon.com/blogs/networking-and-content-delivery/protect-against-bots-with-aws-waf-challenge-and-captcha-actions/"
  - "https://aws.amazon.com/about-aws/whats-new/2022/10/aws-waf-challenge-rule-action-bot-control-targeted-bots"
---

## Die Grundidee zuerst

Stell dir zwei Türsteher vor einem Laden vor, in dem es einmal im Monat etwas gibt, das nach elf Sekunden weg ist.

**Der alte Türsteher** führt eine Liste mit Adressen. Wer zu oft kommt, fliegt raus. Das trägt genau so lange, bis die Gegenseite Boten anheuert — jeder mit einer anderen Meldeadresse, jeder genau einmal da. Die Liste füllt sich und trifft niemanden. Senkt er die Schwelle, sperrt er die Wohngemeinschaft aus, in der vier Leute hinter demselben Anschluss sitzen.

**Der neue Türsteher** hat gar keine Liste. Er hat eine Tür. Die ist so gebaut, dass man sie wie ein Mensch bedienen muss — Klinke drücken, schieben, durchgehen. Ein Mensch merkt davon nichts. Ein Automat scheitert daran, ganz gleich, von welcher Adresse er kommt.

Das ist der Abstand zwischen einer Rate-based Rule auf die Client-IP und Bot Control mit Challenge. Die eine fragt *woher kommst du*. Die andere fragt *wie bewegst du dich*.

Bei Ostwall, dem Sneaker-Händler auf dieser Karte, kamen beim letzten Drop 94 % der Bestellungen von Scalper-Bots. Sie bilden vollständige Browser-Signaturen nach und verteilen ihre Anfragen über Residential Proxies. Die Adressliste war chancenlos, bevor sie geschrieben war.

## Was es eigentlich ist — eine Regel mit zwei Schaltern

Bot Control ist keine eigene Konsole und kein eigener Dienst. Es ist **eine** Managed Rule Group in deinem Web ACL, und alles, was diese Karte zeigt, sind zwei Felder darin:

```json
{
  "Name": "bot-control-drop",
  "Priority": 10,
  "Statement": {
    "ManagedRuleGroupStatement": {
      "VendorName": "AWS",
      "Name": "AWSManagedRulesBotControlRuleSet",
      "ManagedRuleGroupConfigs": [
        { "AWSManagedRulesBotControlRuleSet": { "InspectionLevel": "TARGETED" } }
      ],
      "ScopeDownStatement": {
        "OrStatement": { "Statements": [
          { "ByteMatchStatement": { "SearchString": "/drop/", "PositionalConstraint": "STARTS_WITH" } },
          { "ByteMatchStatement": { "SearchString": "/checkout", "PositionalConstraint": "EXACTLY" } }
        ]}
      }
    }
  },
  "OverrideAction": { "None": {} }
}
```

Lies es von unten nach oben, dann steht die Karte da. `ScopeDownStatement` entscheidet, **welche** Anfragen überhaupt hineinlaufen. `InspectionLevel` entscheidet, **wie teuer** sie geprüft werden — `COMMON` oder `TARGETED`. Zwei Felder, zwei Boxreihen auf der Karte.

Der Rest — Challenge, CAPTCHA — sind Actions an Regeln, nicht Bestandteile dieses Blocks.

## Der Weg durch die Karte

### Kasten — CloudFront + WAF

Ganz links steht nicht „die Kunden", sondern die **ungeteilte** Anfragemenge: 400.000 echte Kunden und die Scalper, ununterscheidbar. Genau das ist das Problem.

Dass WAF hier an CloudFront hängt und nicht am ALB, ist keine Nebensache: Die Entscheidung fällt am Edge, bevor eine Anfrage die Region erreicht. Ein abgewiesener Bot kostet dich keine Origin-Kapazität.

Die Kursivzeile „Residential Proxies" ist der Grund für alles Weitere. Jede Anfrage kommt von einer anderen, echt aussehenden Privatadresse.

### Pfeil 1 — Request

Der erste Pfeil trägt keine Bedingung. Alles kommt an: Produktbilder, Stylesheets, Schriftarten, Suchanfragen, `/drop/`, `/checkout`.

Das ist wichtig zu sehen, weil der nächste Schritt der einzige ist, der diese Menge kleiner macht.

### Kasten — Scope-Down

**Der wichtigste Kasten der Karte ist der langweiligste.** Ein Scope-Down-Statement ist eine ganz normale WAF-Bedingung, die *vor* die Regelgruppe geschaltet wird: nur `/drop/*` und `/checkout` laufen hinein.

Das Bild dazu: Du stellst den teuren Gutachter nicht an den Haupteingang, sondern nur an die Tür zum Tresorraum. Alles andere geht an ihm vorbei, ohne dass er hinschaut.

Die Kursivzeile sagt „Kosten und Latenz" — beides, nicht nur Kosten. Inspektion, die nicht läuft, kostet auch keine Zeit.

### Pfeil 2 — gefiltert

Was hier ankommt, ist nur noch der Verkehr auf zwei Pfaden. Ein Produktbild, ein Font, eine CSS-Datei hat es gar nicht bis hierher geschafft.

### Kasten — Common Level

Die Common-Stufe erkennt Bots, **die sich zu erkennen geben** oder namentlich bekannt sind: Suchmaschinen, Social-Media-Crawler, Monitoring-Werkzeuge, bekannte Schadbots. Sie stützt sich auf Merkmale der HTTP-Anfrage selbst.

Für Ostwall zählt vor allem ein Fall: Der Googlebot wird hier als verifizierter guter Bot erkannt und durchgelassen — er landet gar nicht erst in der teuren Analyse. Die Produktseiten tragen den organischen Traffic, und ein ausgesperrter Crawler kostet Ostwall mehr als die Scalper.

Die Kursivzeile „10 Mio./Monat frei" ist kein Preisschild, sondern ein Reihenfolge-Argument. Merk sie dir, sie kommt bei Badge 6 wieder.

Was Common **nicht** kann, steht nicht auf der Karte, gehört aber zum Verständnis: Es prüft Anfragemerkmale — User-Agent, Header-Zusammenstellung, verifizierte Herkunft. Ein Bot, der einen vollständigen Chrome-Fingerabdruck mitschickt, sieht auf dieser Ebene aus wie ein Kunde. Genau deshalb reicht Common allein hier nicht, und genau deshalb steht der nächste Kasten daneben.

### Pfeil 3 — Rest

Was Common geklärt hat, muss Targeted nicht mehr anfassen. Übrig bleibt der Verkehr, der weder harmlos-erkennbar noch bekannt-schädlich ist — also genau die Gegner aus dem Szenario.

**Die Regelreihenfolge im Web ACL ist damit eine Kostenentscheidung**, keine Geschmacksfrage.

### Kasten — Targeted Level

Hier arbeitet WAF mit Browser-Interrogation, Fingerprinting und Verhaltensanalyse. Die Stufe erkennt Bots, die sich absichtlich als reguläre Nutzer ausgeben, baut selbstständig eine Baseline je Gerät auf und begrenzt dynamisch, wenn ein Zugriffsmuster davon abweicht.

**Der entscheidende Unterschied zur klassischen Rate-based Rule steht in einem Wort: Niemand muss eine Schwelle raten.**

Das Bild dazu: Eine Rate-based Rule ist ein Drehzahlmesser mit einem roten Strich, den du selbst hingemalt hast. Die Targeted-Stufe misst erst, was in diesem Motor normal ist, und schlägt dann bei Abweichung an. Der rote Strich verschiebt sich mit dem Verkehr — nachts anders als beim Drop.

Der Preis dafür steht in der Kursivzeile: „nur 1 Mio./Monat frei". Die klügere Stufe ist die zehnmal teurere.

### Pfeil 4 — alle Kunden

Der Pfeil zur Challenge trägt kein „falls" und kein „ab". Er gilt für den gesamten Drop-Verkehr, für Kunden wie für Bots. Das ist die Aussage: Diese Prüfung darf jeden treffen, weil sie niemanden stört.

### Kasten — Challenge

Die Challenge-Action liefert einen stillen JavaScript-Test aus, der prüft, ob eine echte Browser-Umgebung vorliegt. Kein Puzzle, keine Interaktion. Fällt der Test positiv aus, entsteht ein verschlüsseltes, manipulationssicheres Token (`aws-waf-token`).

Für die 400.000 Kunden bleibt der Drop damit ein normaler Seitenaufruf — die Kursivzeile „Kunde merkt nichts" ist wörtlich gemeint.

### Pfeil 5 — nur Checkout

Der einzige gestrichelte Ablaufpfeil der Karte, und er ist der einzige mit einer Einschränkung. CAPTCHA läuft nicht auf dem Drop, sondern ausschließlich auf der Aktion, an der der Schaden entsteht.

### Kasten — CAPTCHA

Das sichtbare Puzzle kostet Nutzer Zeit und Geduld. Es erzeugt **dasselbe** Token wie die Challenge — der Unterschied ist allein die Interaktion.

Die Kursivzeile „Immunity Time default 300 s" trägt das Attribut aus gutem Grund. 300 Sekunden ist die Voreinstellung auf Web-ACL-Ebene; jede Regel mit CAPTCHA- oder Challenge-Action kann sie überschreiben und erbt sie sonst. Der zulässige Bereich reicht von 60 bis 259.200 Sekunden.

Und noch ein Grund, warum CAPTCHA nicht überall hingehört: Eine ausgelieferte Challenge-Antwort ist eine abgerechnete Größe — unabhängig davon, ob der Nutzer die Challenge überhaupt versucht. Breit ausgerollt zahlst du also nicht nur mit der Geduld deiner Kunden.

### Pfeil 6 und der Gold-Kasten — Ohne Scope-Down

Der einzige goldene Pfeil zeigt **zurück** auf Scope-Down, nicht auf Targeted. Das ist Absicht: Die Kostenfalle entsteht durch das Fehlen des Scope-Down, nicht durch die teure Stufe an sich.

Rechne mit: Common Bot Control enthält die ersten 10 Millionen Anfragen pro Monat ohne Zusatzkosten, Targeted die erste Million. Faktor zehn. Wer Targeted ungefiltert auf allen Verkehr legt, bezahlt Bot-Analyse für jedes ausgelieferte Produktbild — und ein Shop liefert pro Seitenaufruf zwei Dutzend davon aus.

### Der verworfene Weg — Rate-based nur auf IP

Eine ratenbasierte Regel zählt Anfragen je Aggregationsschlüssel über ein rollierendes Fenster. Gegen rotierende Residential Proxies läuft das ins Leere.

Setzt du die Schwelle hoch, trifft sie keinen einzigen Bot — jeder Bote kommt ja nur einmal. Setzt du sie tief, trifft sie Familien hinter einem Anschluss und Firmennetze hinter NAT. **Die Schwelle ist immer geraten.** Genau darum steht das rote X auf diesem Pfad.

Als *zusätzliche* Schicht gegen Brute Force und Floods bleibt die Regel sinnvoll. Als alleinige Antwort auf Scalping ist sie es nicht.

### Die Randnotiz links — drei Sätze, die keine Box brauchen

Diese drei Zeilen sind kein Datenfluss, sondern Zustandswissen — deshalb stehen sie frei und nicht in einem Kasten.

Die dritte ist die prüfungsrelevanteste: **Liegt ein gültiges Token vor, verhält sich die Regel wie `Count`.** Sie wird nicht übersprungen. Labels und Anpassungen greifen, die Auswertung läuft mit den übrigen Regeln weiter, und der Nutzer sieht nichts.

Das Bild dazu: Das Token ist kein Freifahrtschein, sondern ein Stempel auf dem Handrücken. Der Türsteher lässt dich ohne erneute Prüfung durch — aber die Kollegen im Saal schauen weiterhin hin, und der Stempel wird protokolliert. Genau deshalb kannst du nachgelagerte Regeln auf die von Bot Control gesetzten Labels stützen, ohne dass ein gültiges Token sie aushebelt.

Und deshalb ist die Immunity Time keine Nebensache: Sie bestimmt, wie lange dieser Stempel hält, bevor der Test erneut läuft.

## Die entscheidende Unterscheidung

| | Challenge | CAPTCHA |
|---|---|---|
| Was der Nutzer tut | nichts | ein Puzzle lösen |
| Prüft | Browser-Umgebung per JS | menschliche Interaktion |
| Zumutbar für | alle Anfragen | riskante Aktionen |
| Erzeugt | `aws-waf-token` | dasselbe Token |
| Immunity Time 300 s | zugleich das **Minimum** | Voreinstellung, bis 60 s absenkbar |

Die letzte Zeile ist die Falle. Dieselbe Zahl bindet in der einen Action anders als in der anderen: Für die Challenge-Action ist 300 die Untergrenze, für CAPTCHA nur der Startwert.

## Die ehrliche Feinheit

**Erstens: Common und Targeted sind auf der Karte zwei Boxen, in Wirklichkeit eine Regelgruppe.** Beide gehören zu `AWSManagedRulesBotControlRuleSet` und werden über `InspectionLevel` umgeschaltet. Die Trennung im Bild macht den Kosten- und Reihenfolgeunterschied sichtbar, der sonst untergeht — sie ist eine Zeichnung, keine Architektur.

**Zweitens: Challenge und CAPTCHA sind keine Ausgänge der Targeted-Stufe.** Es sind Rule Actions, die an beliebigen Regeln hängen können, auch an Common-Regeln oder an einer Rate-based Rule. Die Karte zeigt den im Szenario sinnvollen Weg, nicht die volle Kombinationsfreiheit.

**Drittens, und das ist der stille Produktionsfehler:** Die CAPTCHA- und Challenge-Skripte sind HTML-Inhalte. Sie funktionieren nur bei einem Client, der HTML erwartet. Fehlt `Accept: text/html`, antwortet WAF mit HTTP 405 und dem Header `x-amzn-waf-action`. Und diese Antworten enthalten **keine CORS-Header** — eine SPA auf einer anderen Domain kann den Hinweis-Header also gar nicht lesen. Wer eine API hinter eine CAPTCHA-Regel stellt, ohne die Anwendung anzupassen, baut sich genau hier einen Fehler, den niemand im Log sieht.

**Viertens:** Die Anwendungsintegration per JavaScript-SDK setzt mindestens eine Managed Rule aus Targeted Bot Control oder Fraud Control voraus. Ohne SDK stützen sich diese Regelgruppen allein auf die Inspektion einzelner Anfragen und verlieren den Sitzungszusammenhang.

**Fünftens, das Unangenehme:** Bot Control ist kein Zustand, sondern ein Wettlauf. Die Targeted-Stufe erkennt heutige Scalper-Werkzeuge; die Gegenseite kauft morgen das nächste. Was diese Architektur dauerhaft leistet, ist nicht Unbesiegbarkeit, sondern eine **Kostenverschiebung**: Ein Scalper muss ab jetzt echte Browser fahren statt HTTP-Bibliotheken, und das ist um Größenordnungen teurer pro Bestellung. Der Drop ist nicht bot-frei — er ist für Bots unrentabler geworden als für Ostwall.

Wer in der Prüfung nach der Antwort sucht, die „Bots vollständig verhindert", sucht eine Antwort, die es nicht gibt. Gefragt ist immer die, die legitime Nutzer am wenigsten belastet.

## Syntax lesen — das Scope-Down-Statement von innen

Der Block aus dem zweiten Abschnitt sieht verschachtelt aus, ist aber flach, sobald du die Achsen kennst:

```
ScopeDownStatement
 └─ OrStatement                  ← eines von beidem genügt
     ├─ ByteMatchStatement
     │    SearchString      "/drop/"
     │    PositionalConstraint  STARTS_WITH
     └─ ByteMatchStatement
          SearchString      "/checkout"
          PositionalConstraint  EXACTLY
```

`PositionalConstraint` ist das Feld, das am häufigsten falsch gesetzt wird. `STARTS_WITH` deckt `/drop/aw-max-90` und alles darunter ab. `EXACTLY` trifft nur den einen Pfad und lässt `/checkout/confirm` durchrutschen — was hier gewollt sein kann oder eine Lücke ist, je nachdem, wo Ostwall den Kauf abschließt.

Die restlichen Werte sind `CONTAINS`, `ENDS_WITH` und `CONTAINS_WORD`. `CONTAINS` ist der bequeme und der gefährliche: Ein Suchstring `/drop/` als `CONTAINS` trifft auch `/img/drop/banner.png` — und zieht damit genau die statischen Dateien wieder herein, die das Scope-Down draußen halten sollte.

**Merke: Ein zu weites Scope-Down ist kein Sicherheitsfehler, sondern ein Rechnungsfehler.** Es blockiert nichts Falsches, es prüft nur zu viel.

## Was du dadurch nicht baust

- keine IP-Sperrliste, die jemand pflegen müsste
- keine geratene Schwelle, die halbjährlich nachjustiert wird
- kein eigenes Fingerprinting und keine eigene Gerätebaseline
- keinen Login-Zwang vor dem Drop
- **keinen Schutz gegen Credential Stuffing** — das ist Account Takeover Prevention, nicht Bot Control
- **keine Erkennung dessen, was nach der Anfrage in AWS passiert** — dafür gibt es GuardDuty

Übrig bleiben: ein Scope-Down-Statement, ein Schalter auf `TARGETED` und zwei Rule Actions.

## Wenn du dir eine Sache merkst

**Challenge ist still und für alle, CAPTCHA ist sichtbar und für wenige.**

Wer CAPTCHA breit ausrollt, bestraft 400.000 Kunden für ein Bot-Problem. Wer Targeted ohne Scope-Down laufen lässt, bezahlt dafür — und zwar für jedes Produktbild. Wer nur eine Rate-based Rule setzt, hat gegen rotierende Adressen gar nichts in der Hand.

## Prüfungsknackpunkte

**Signalwörter für Targeted:** „bots that mimic human behavior", „sophisticated bots", „evades detection", „rotating IP addresses". Steht eines davon in der Frage, ist Common raus.

**Signalwörter für Challenge statt CAPTCHA:** „without impacting legitimate users", „minimize friction". Sobald Reibungsfreiheit gefordert wird, ist das sichtbare Puzzle die falsche Antwort.

**Warum Rate-based Rules hier verlieren:** Sie aggregieren über einen Schlüssel, und der Schlüssel ist bei rotierenden Proxies wertlos. Sie bleiben richtig gegen Brute Force und Application-Layer-Floods — nur nicht gegen Scalping.

**Warum Common hier verliert:** Es erkennt Bots, die sich zu erkennen geben. Scalper tun genau das nicht.

**Warum Fraud Control hier verliert:** Account Takeover Prevention fragt, ob ein bestehendes Konto angegriffen wird, Account Creation Fraud Prevention, ob eine Neuanmeldung echt ist. Beide setzen ein Konto voraus. Der Scalper braucht keines.

**Warum GuardDuty hier verliert:** Es beobachtet die AWS-Kontrollebene. Ein Scalper-Bot, der an der WAF hängen bleibt, erzeugt keinen einzigen Fund.

**Die Token-Falle:** „Gültiges Token heißt, die Regel wird übersprungen" ist falsch. Sie verhält sich wie `Count` — die Auswertung läuft weiter.

**Die Zahlenfalle:** 300 Sekunden ist bei CAPTCHA die Voreinstellung und bei Challenge zugleich das Minimum. Eine Antwort, die „Immunity Time auf 60 Sekunden für alle Actions" anbietet, ist deshalb nur zur Hälfte richtig.
