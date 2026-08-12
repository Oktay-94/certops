---
cardNumber: 70
slug: waf-fraud-control-acfp-signup
title: "AWS WAF Fraud Control (ACFP) — Fake-Account-Registrierungen an der Kante abwehren"
services: ["AWS WAF Fraud Control (ACFP)", "Amazon CloudFront", "AWS WAF Application Integration SDK", "Amazon Fraud Detector", "Amazon SageMaker AI"]
domains: ["D1", "D3"]
correctAnswer: "A"
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/waf/latest/developerguide/waf-acfp.html"
  - "https://docs.aws.amazon.com/waf/latest/developerguide/waf-acfp-components.html"
  - "https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-acfp.html"
  - "https://docs.aws.amazon.com/waf/latest/developerguide/waf-acfp-deploying.html"
  - "https://docs.aws.amazon.com/frauddetector/latest/ug/frauddetector-availability-change.html"
  - "https://docs.aws.amazon.com/waf/latest/APIReference/API_AWSManagedRulesACFPRuleSet.html"
---

## Die Grundidee zuerst

Stell dir einen Club, der am Eröffnungsabend jedem Gast einen Getränkegutschein über 20 € in die Hand drückt.

**Variante eins:** Du lässt alle rein. Drinnen sitzt ein Analyst mit Laptop, beobachtet das Verhalten der Gäste und markiert nachträglich, wer verdächtig wirkte. Er ist gut. Er hat aus zehntausend früheren Abenden gelernt. Aber die Gutscheine sind längst ausgegeben, bevor er den ersten markiert. Und damit er überhaupt lernen kann, brauchtest du erst einmal zehntausend Abende — die du nicht hast, weil der Angriff seit drei Wochen läuft.

**Variante zwei:** Du stellst jemanden an die Tür. Er hat eine Liste geleakter Ausweisnummern, er sieht, ob dreißig Leute mit derselben Adresse und Telefonnummer anstehen, und er erkennt, ob jemand ein Formular ausgefüllt hat oder eine Maschine es befüllt hat. Wer nicht durchkommt, bekommt keinen Gutschein — weil er den Raum nie betritt.

Variante eins ist ein eigenes ML-Modell hinter der Anwendung. Variante zwei ist AWS WAF Fraud Control, und der ganze Unterschied ist, wo die Entscheidung fällt: **hinter der Anwendung oder davor.**

Das ist auch der Grund, warum das Team ohne Data Scientists in diesem Szenario nicht im Nachteil ist. Der Türsteher bringt seine Liste mit.

## Was es eigentlich ist — die Rule-Group-Konfiguration

ACFP ist kein Dienst, den du buchst. Es ist eine **Managed Rule Group**, die du mit einer Referenz in dein Protection Pack — den Web ACL — einbindest, plus einem Konfigurationsblock, der ihr sagt, wo deine Registrierung liegt und wo in der Anfrage die Felder stehen.

```json
{
  "AWSManagedRulesACFPRuleSet": {
    "RegistrationPagePath": "/registrieren",
    "CreationPath": "/api/signup",
    "EnableRegexInPath": false,
    "RequestInspection": {
      "PayloadType": "JSON",
      "UsernameField":    { "Identifier": "/form/email" },
      "PasswordField":    { "Identifier": "/form/passwort" },
      "EmailField":       { "Identifier": "/form/email" },
      "PhoneNumberFields": [{ "Identifier": "/form/telefon" }],
      "AddressFields":     [{ "Identifier": "/form/plz" }]
    },
    "ResponseInspection": {
      "StatusCode": { "SuccessCodes": [201], "FailureCodes": [400, 409] }
    }
  }
}
```

`VendorName: AWS`, `Name: AWSManagedRulesACFPRuleSet`, **50 WCU**.

Lies den Block von oben nach unten: welche Seite (`RegistrationPagePath`), welcher Endpunkt (`CreationPath`), wo im Payload die Felder liegen (`RequestInspection`), und woran die Anwendung Erfolg von Misserfolg unterscheidet (`ResponseInspection`).

Der letzte Block ist der einzige optionale — und der einzige, der an CloudFront gebunden ist.

## Der Weg durch die Karte

### Kasten — Bot-Traffic: warum genau hier

Das Startguthaben ist kein Detail des Szenarios, es ist der Grund für den Angriff. Konten anzulegen kostet nichts und bringt 20 €. Bei zweitausend Konten sind das 40.000 €, und die Grenzkosten für den Angreifer bestehen aus Rechenzeit.

AWS nennt drei Motive für Account Creation Fraud: **das Ausnutzen von Sign-up-Boni, das Auftreten unter fremdem Namen und Cyberangriffe wie Phishing.** Ein Szenario, in dem eines dieser drei Motive vorkommt, zeigt in Richtung ACFP.

### Pfeil 1 — Angriff: zwei Endpunkte, nicht einer

ACFP prüft an zwei Stellen: **GET-Requests vom Typ `text/html`** auf die Registrierungsseite und **POST-Requests** auf den Sign-up-Endpunkt. Beide Pfade stehen in der Rule-Group-Konfiguration.

Warum die GET-Seite überhaupt? Weil der Bot, der nur POST feuert, die Seite nie geholt hat. Der GET-Aufruf ist die Gelegenheit, dem Client das Token unterzuschieben, das später beweist, dass er ein Browser mit einem Menschen davor war.

**Das Bild dazu:** Der Türsteher zählt nicht nur, wer hineingeht, sondern auch, wer vorher am Aushang stand. Wer direkt an der Tür steht, ohne je den Aushang gesehen zu haben, ist auffällig.

Achte auf die Pfad-Semantik: Präfixe genügen. `/web/newaccount` deckt auch `/web/newaccount/`, `/web/newaccountPage` und `/web/newaccount/thisPage` ab — aber nicht `/website/newaccount`.

### Pfeil 2 — prüfen: CloudFront und das Protection Pack

Die Rule Group wird über eine **Managed Rule Group Reference** in den Web ACL eingebunden, und der Web ACL hängt an der CloudFront-Distribution. Damit fällt die Entscheidung an einem Edge Location, nicht in deiner Region und nicht in deiner Anwendung.

Die 50 WCU sind der harte Teil der Rechnung: Ein Web ACL hat ein WCU-Budget, und ACFP belegt davon einen großen Block. Wer schon Core Rule Set, Bot Control und IP-Reputationslisten eingebunden hat, muss rechnen, bevor er ACFP dazunimmt.

### Pfeil 3 — passieren: was hinten ankommt

Was die Rule Group als echt einstuft, geht weiter an den Registrierungs-Endpunkt. Der Blockierungspfad ist auf der Karte bewusst nicht gezeichnet — was geblockt wird, verlässt den Fluss vorher und erreicht deine Anwendung nie.

Eine Einschränkung, die in der Dokumentation nur ein Halbsatz ist und ein ganzes Szenario kippen kann: **Die Rule Group arbeitet mit Benutzernamen im E-Mail-Format.** Wer Wunschnamen ohne At-Zeichen zulässt, verliert den Abgleich gegen die Stolen-Credential-Datenbank für genau diese Konten.

### Pfeil 4 — Abgleich: die Stolen-Credential-Datenbank

ACFP prüft die Kombination aus E-Mail und Passwort gegen eine Datenbank geleakter Zugangsdaten, die **laufend ergänzt wird, wenn neue Leaks im Dark Web auftauchen**. Dazu bewertet es die Domain der E-Mail-Adresse und prüft Telefonnummern- und Adressfelder auf Plausibilität.

Der eigentliche Hebel gegen Massenanlage ist aber die vierte Prüfung: **Aggregation nach IP-Adresse und Client Session.** Ein einzelnes Konto mit einem geleakten Passwort ist ein Kunde, der sein Passwort überall benutzt. Vierzig Konten aus einer Session sind ein Angriff.

Das ist der Unterschied zwischen Regeln, die einen Request bewerten, und Regeln, die ein Muster über viele Requests bewerten. ACFP macht beides.

### Pfeil 5 — Rückkanal: Response Inspection, nur bei CloudFront

Bis hierhin hat ACFP nur Anfragen gelesen. Response Inspection dreht die Blickrichtung um und liest, was deine Anwendung **antwortet** — Erfolgs- und Fehlerraten, gemessen an Statuscode, Header, Body oder JSON-Feld.

Warum das etwas anderes ist als alles davor: Der Angreifer probiert. Nicht jede Kombination funktioniert. Wer viermal `409 Conflict` bekommt und beim fünften Mal `201 Created`, hat einen Fingerabdruck hinterlassen, den man an der Anfrage allein nicht sieht. ACFP kann Sessions oder IPs mit zu vielen Fehlversuchen **temporär sperren**.

Zwei Fakten dazu, die beide prüfungsrelevant sind: Es gibt Response Inspection **nur für CloudFront-Distributionen**. Und AWS führt sie **asynchron** aus, sodass sie die Latenz im Webtraffic nicht erhöht.

### Kasten — das JavaScript SDK: die Voraussetzung ohne Pfeil

Das SDK hängt auf der Karte an keinem Pfeil, weil es kein Schritt im Requestfluss ist. Es ist eine Bedingung.

Die Rule Group nutzt **Request-Tokens**, um Informationen über den Client-Browser und über den Grad menschlicher Interaktion zu sammeln. Die Regeldokumentation formuliert es unmissverständlich: **Alle Regeln der Rule Group brauchen ein Web Request Token — bis auf die ersten beiden.**

Ohne eingebundenes SDK ist die Rule Group also eingebunden, kostet Geld, belegt 50 WCU und wirkt größtenteils nicht. Es gibt keine Fehlermeldung. Es gibt nur weniger Treffer, als du erwartet hast.

### Badge 6 — verworfen: das eigene SageMaker-Modell

Der Architekt schlägt vor, ein Betrugsmodell zu trainieren. Rechne die Kette einmal durch: Trainingsdaten sammeln — die es nicht gibt, weil bisher niemand gelabelt hat, welche der bestehenden Konten Fake waren. Modell trainieren. Endpunkt betreiben und rund um die Uhr bezahlen. Modell nachtrainieren, wenn die Angreifer ihr Verhalten ändern.

Und am Ende säße das Modell **hinter** der Anwendung und bewertete Requests, die bereits durchgelassen wurden.

Der Punkt ist nicht, dass das Modell schlecht wäre. Der Punkt ist, dass es an der falschen Stelle sitzt und dass AWS für genau diesen Fall selbst etwas anderes empfiehlt.

### Gold-Kasten — die Grenzen

Vier Einschränkungen, jede einzelne ein Prüfungs-Distraktor:

- **ACFP steht für Amazon Cognito User Pools nicht zur Verfügung.** Wer die Registrierung über Cognito abwickelt, kann ACFP dafür nicht einsetzen. Punkt, kein Workaround in der Dokumentation.
- **SDK-Pflicht** — siehe oben.
- **Zusatzkosten.** Für diese Managed Rule Group fallen zusätzliche Gebühren an, über die normale WAF-Abrechnung hinaus.
- **Erst im Count-Modus.** AWS empfiehlt ausdrücklich, die Rule Group zunächst so einzubinden, dass sie das bestehende Web-ACL-Verhalten nicht ändert, und alle Regelaktionen mit „Override all rule actions → Count" zu überschreiben. Erst nach der Auswertung wird scharf geschaltet.

### Gold-Kasten — warum ein Quellenkonflikt auf der Karte steht

Ein Kasten, der keinen Dienst zeigt, sondern die Qualität der Quellenlage. Das ist ungewöhnlich und hier notwendig: Zwei AWS-Seiten sagen Verschiedenes darüber, ob ACFP Machine Learning einsetzt. Der nächste Abschnitt zerlegt den Widerspruch.

Auf die Karte kommt er, weil er eine Prüfungsfrage berührt, die es tatsächlich gibt — die Abgrenzung „regelbasiert gegen ML-basiert". Wer diese Achse auswendig lernt, lernt etwas Falsches. Wer stattdessen lernt, dass sie umstritten ist und die Frage über den **Schutzgegenstand** entschieden wird, kommt durch.

## Die entscheidende Unterscheidung

| | ACFP | ATP | Bot Control |
|---|---|---|---|
| Rule Group | `AWSManagedRulesACFPRuleSet` | `AWSManagedRulesATPRuleSet` | `AWSManagedRulesBotControlRuleSet` |
| Schützt | Konten**anlage** | Konten**anmeldung** | Traffic allgemein |
| Signalwort | „fake accounts", „bulk sign-ups" | „credential stuffing", „brute force login" | „scrapers", „crawlers" |
| Prüft Formularfelder inhaltlich | ja (E-Mail, Telefon, Adresse) | Zugangsdaten | nein |
| WCU | 50 | 50 | 50 bzw. 500 |

Anlage gegen Anmeldung — das ist die eine Achse, auf der diese Frage entschieden wird. Beide heißen Fraud Control, beide kosten 50 WCU, beide brauchen das SDK. Wer die Achse nicht sieht, rät.

## Die ehrliche Feinheit

**Zwei AWS-Seiten widersprechen sich darüber, ob ACFP Machine Learning einsetzt.**

Die ACFP-Seite im WAF Developer Guide schreibt, die Rule Group nutze Request Identifiers, Verhaltensanalyse **und Machine Learning**, um betrügerische Anfragen zu erkennen.

Die Availability-Change-Seite von Amazon Fraud Detector schreibt im selben Atemzug, in dem sie auf WAF Fraud Control verweist, die aktuelle Fraud-Detection-Fähigkeit von WAF beruhe auf Managed Rules und **nicht** auf Machine-Learning-Modellen.

Beide Seiten sind aktuell, beide sind von AWS, beide sind Primärquellen ihres jeweiligen Dienstes. Nach der Rangfolge müsste der User Guide des besitzenden Dienstes gewinnen — die ACFP-Seite. Nach Projektregel bleibt der Widerspruch trotzdem stehen: **Auf der Karte steht keine Aussage darüber, ob ACFP ML einsetzt, sondern nur der benannte Konflikt.**

Für die Prüfung ist die Unterscheidung trotzdem entscheidbar, nur an einem anderen Merkmal. Fordert eine Frage ausdrücklich **ML-basierte Betrugsbewertung über beliebige Events** — Zahlungen, Anmeldungen, Kontoanlage — und bietet Fraud Detector an, ist Fraud Detector gemeint. Fordert sie den **Schutz der Registrierungsseite**, ist es ACFP.

**Und der Dienst, der die ML-Antwort war, nimmt keine Neukunden mehr.** Amazon Fraud Detector ist seit dem **07.11.2025** für Neukunden geschlossen. AWS empfiehlt an seiner Stelle AutoGluon als Open-Source-AutoML-Bibliothek, SageMaker AI für das Deployment der damit trainierten Modelle — und für Account-Creation-Fraud-Fälle ausdrücklich AWS WAF Fraud Control. Ein Enddatum gibt es nicht; Bestandskunden nutzen ihn weiter.

**Was AWS bewusst nicht veröffentlicht:** die genaue Schwelle, ab der eine Session gesperrt wird, und die vollständige Wirkweise der einzelnen Regeln. Die Dokumentation sagt selbst, sie veröffentliche gerade so viel, dass man die Regeln benutzen kann, ohne Angreifern die Umgehung zu erklären. Wer in einer Frage eine konkrete Schwellenzahl liest, sollte misstrauisch werden.

## Syntax lesen — die Feld-Identifier

Der `RequestInspection`-Block ist der Teil, den man beim ersten Mal falsch ausfüllt. Er sagt ACFP nicht, *wie* dein Formular heißt, sondern **wo in der Anfrage** die Werte stehen. Und die Schreibweise hängt am `PayloadType`.

```
PayloadType: "JSON"                    PayloadType: "FORM_ENCODED"
──────────────────────────────         ──────────────────────────────
{ "form": {                            email=a%40b.de&passwort=xyz
    "email": "a@b.de",                          │
    "passwort": "xyz"                           │
} }                                             │
        │                                       │
Identifier: "/form/email"              Identifier: "email"
            └─┬──┘ └─┬─┘                          └──┬──┘
              │      └─ Feldname                     └─ Parametername,
              └─ jede Verschachtelungs-                  ohne Schrägstrich
                 ebene ein Segment
```

Bei JSON ist der Identifier ein **JSON Pointer**: führender Schrägstrich, dann ein Segment je Ebene. Bei `FORM_ENCODED` ist es schlicht der Parametername.

Zweite Stelle, an der die Syntax entscheidet — die Pfadangabe:

```
CreationPath: "/web/newaccount"
        ↓ trifft
   /web/newaccount          /web/newaccount/
   /web/newaccountPage      /web/newaccount/thisPage
        ↓ trifft NICHT
   /home/web/newaccount     /website/newaccount
```

**Präfix, nicht Gleichheit.** Der Pfad muss am Anfang übereinstimmen, darf danach aber weiterlaufen — deshalb fängt `/web/newaccount` auch `/web/newaccountPage`. Wer stattdessen ein Muster braucht, setzt `EnableRegexInPath` auf `true` und schreibt einen regulären Ausdruck. Wer beides verwechselt, hat eine Rule Group, die perfekt konfiguriert aussieht und keinen einzigen Request inspiziert.

## Was du dadurch nicht baust

- keine Trainingsdaten, kein Labeling, kein Modell
- kein SageMaker-Endpunkt, der rund um die Uhr läuft und abgerechnet wird
- keine eigene Liste geleakter Zugangsdaten und kein Dark-Web-Feed
- keine eigene Rate-Limiting-Logik nach IP oder Session
- kein Betrugs-Scoring-Code in der Registrierungsanwendung
- keine Nachtrainings-Pipeline, wenn die Angreifer ihr Verhalten ändern

Übrig bleiben: eine Rule Group Reference, ein Konfigurationsblock und ein Script-Tag auf der Registrierungsseite.

## Wenn du dir eine Sache merkst

**ACFP schützt die Sign-up-Seite an der Kante. Response Inspection gibt es nur bei CloudFront, und für Cognito User Pools gibt es ACFP gar nicht.**

ATP schützt die Anmeldung, nicht die Anlage. Bot Control erkennt Bots, prüft aber keine Formularfelder. Shield wehrt DDoS ab und filtert keine Requests auf Layer 7. Fraud Detector wäre die ML-Antwort gewesen und nimmt seit dem 07.11.2025 keine Neukunden mehr an.

## Prüfungsknackpunkte

**Signalwörter:** „fake account creation" oder „bulk sign-ups", „promotional bonus abuse", „block at the edge", „no data science team". Die letzten beiden zusammen schließen jede Eigenbau-Antwort aus.

**Die Fraud-Detector-Falle.** Sie ist die gemeinste in diesem Batch, weil Fraud Detector inhaltlich passt und nur am Datum scheitert. In einem Neubau-Szenario ist er seit dem 07.11.2025 falsch. Steht dagegen „our existing Fraud Detector models" im Text, bleibt er richtig.

**Die Cognito-Falle.** Ein Szenario, das beiläufig erwähnt, die Registrierung laufe über einen Cognito User Pool, macht ACFP als Antwort ungültig — auch wenn alles andere passt.

**Die Response-Inspection-Falle.** Steht ein Application Load Balancer statt CloudFront im Szenario, ist Response Inspection nicht verfügbar. Der Rest von ACFP schon.

**B — Amazon Fraud Detector:** die richtige Antwort von vor drei Jahren, für Neukunden geschlossen.

**C — Eigenes Modell auf SageMaker AI:** braucht Trainingsdaten, die es nicht gibt, und sitzt hinter statt vor der Anwendung.

**D — AWS Shield Advanced:** wehrt Volumenangriffe ab. Diese Registrierungen sind keine Flut, sie sind einzeln plausible Anfragen.

**E — Rate-based Rule auf die Sign-up-URL:** stumpft den Angriff ab und trifft bei einem verteilten Botnetz entweder zu spät oder echte Nutzer mit.
