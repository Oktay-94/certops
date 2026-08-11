---
cardNumber: 42
slug: cognito-user-pool-identity-pool-formkurve-eigener-prefix
title: "Cognito User Pools · Identity Pools — Login und direkter S3-Zugriff pro Nutzer"
services:
  - Amazon Cognito User Pools
  - Amazon Cognito Identity Pools
  - AWS STS
  - IAM Roles
  - Amazon S3
domains:
  - D1
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/cognito/latest/developerguide/authentication-flow.html"
  - "https://docs.aws.amazon.com/cognito/latest/developerguide/iam-roles.html"
  - "https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools-security-best-practices.html"
  - "https://docs.aws.amazon.com/cognito/latest/developerguide/managed-login-endpoints.html"
  - "https://docs.aws.amazon.com/cognito/latest/developerguide/managed-login-branding.html"
  - "https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-refresh-token.html"
  - "https://aws.amazon.com/blogs/aws/improve-your-app-authentication-workflow-with-new-amazon-cognito-features/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/11/amazon-cognito-managed-login"
---

## Die Grundidee zuerst

Stell dir einen Selbstbedienungs-Lagerraum vor, in dem zweihunderttausend Leute je eine Box gemietet haben.

**Die schlechte Bauweise:** An der Eingangstür hängt ein Schlüsselkasten, und in jeder App steckt derselbe Generalschlüssel. Die App weiß, dass Nutzer 4711 nur in Box 4711 darf, und hält sich daran. Sie ist ordentlich programmiert. Aber der Generalschlüssel öffnet trotzdem alle Boxen — wer die App auseinandernimmt, holt ihn heraus und geht durch die Reihe. Die Trennung existierte nur als Absicht im Code, nicht als Schloss an der Box.

**Die richtige Bauweise:** Am Empfang zeigst du deinen Ausweis. Du bekommst einen Chip, der ausschließlich Box 4711 öffnet, und der um 15 Uhr abläuft. Die App kann sich jetzt beliebig danebenbenehmen — sie kommt an Box 4712 nicht heran, weil das Schloss selbst nicht aufgeht.

**Der Unterschied ist nicht, wie höflich die App fragt, sondern wer Nein sagt.** In der schlechten Bauweise sagt die App Nein. In der richtigen sagt S3 Nein.

Und weil zwei verschiedene Fragen zu beantworten sind — *wer bist du* am Ausweis und *wohin darfst du* am Chip —, gibt es bei Cognito zwei Dienste statt einem.

## Was es eigentlich ist — eine Policy, die für alle gleich ist und für jeden anders wirkt

Der eigentliche Trick dieser Karte steht in einer einzigen IAM-Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": [
      "arn:aws:s3:::videos-prod/users/${cognito-identity.amazonaws.com:sub}/*"
    ]
  }]
}
```

Es gibt **eine** Policy für alle 200.000 Nutzer. Sie steht an einer einzigen Rolle. Trotzdem trifft jeder Nutzer einen anderen Ordner.

Der Grund ist die geschweifte Klammer. `${cognito-identity.amazonaws.com:sub}` ist kein fester Wert, sondern eine Variable, die IAM **beim Auswerten** durch die Identity ID des gerade aufrufenden Nutzers ersetzt. Für den einen wird daraus `users/eu-central-1:8a3f.../`, für den nächsten ein anderer Pfad.

**Das ist der Unterschied zwischen einer Regel und 200.000 Regeln.** Und weil die Auswertung in S3 passiert, nicht in der App, ist die Trennung auch dann noch da, wenn die App manipuliert wurde.

## Der Weg durch die Karte

### Der Kasten links unten — Formkurve und der Schlüssel im Binary

Eine Fitness-App mit 200.000 Nutzern lädt Trainingsvideos direkt vom Handy nach S3. Die erste Version hatte einen fest eingebauten Access Key mit Schreibrecht auf den gesamten Bucket.

Der rote Kasten nennt den Grund, warum das keine kleine Nachlässigkeit ist: *Reverse Engineering legt ihn offen*. **Ein Schlüssel in einer verteilten App ist kein Geheimnis** — er liegt auf zweihunderttausend Geräten, die dir nicht gehören. Er lässt sich aus dem Binary ziehen, er gilt für alle gleich, und er erlaubt keinerlei Trennung zwischen Nutzern.

Die Aufgabe nennt zwei Anforderungen, die sich nur zusammen lösen lassen: Anmeldung per E-Mail **und** per Google, und jeder Nutzer nur in seinem Ordner.

### Badge 1 und der User-Pool-Kasten — bis hierher gibt es kein einziges AWS-Recht

Der User Pool ist ein eigenes Nutzerverzeichnis: Registrierung, Anmeldung, Passwort-Reset, MFA. Zurück kommen Tokens. Die letzte Zeile im Kasten — *wer bist du* — ist die Zusammenfassung.

Der wichtigste Satz zu diesem Kasten ist ein negativer: **Bis hierher ist noch kein einziges AWS-Recht vergeben.** Ein angemeldeter Nutzer mit gültigem Token darf in AWS bis zu diesem Punkt exakt nichts.

**Auf der Karte steht in diesem Kasten `(früher Hosted UI)` — richtig ist, dass die Hosted UI nicht „früher" ist, sondern weiterhin wählbar.** Managed Login und die klassische Hosted UI sind zwei **Branding-Versionen** derselben Sache; die Doku beschreibt den Unterschied ausdrücklich als sichtbar, nicht funktional, und in der API stehen beide als gleichrangige Werte nebeneinander. Managed Login ist die neuere Version mit dem No-Code-Branding-Editor, nicht der neue Name der alten.

Der Fix ist beschlossen und gemessen — die Zeile lautet künftig `oder klassische Hosted UI` (193,3 px bei rund 200 px Innenbreite, keine Geometrieänderung nötig).

### Badge 2 und der Google-Kasten — warum beide Wege gleich enden

Der gestrichelte graue Kasten ist bewusst gestrichelt: Google steht außerhalb, es ist ein externer IdP.

Entscheidend ist, wohin der Pfeil zeigt — **nicht** am User Pool vorbei, sondern **in ihn hinein**. Der User Pool nimmt die Google-Anmeldung entgegen und legt trotzdem ein eigenes Verzeichnisprofil an.

Deshalb kann die App später beide Anmeldewege gleich behandeln: Sie enden im selben User Pool und liefern dieselbe Art Token. Die zweite Zeile im Kasten — *optionaler Weg* — sagt, dass die Karte auch ohne Google funktioniert. Der Rest der Kette ändert sich nicht.

### Badge 3 und der Identity-Pool-Kasten — hier wechselt die Frage

`GetId` tauscht das Token gegen eine **Identity ID** — eine im Identity Pool vergebene Kennung, die stabil beim Nutzer bleibt, auch über Geräte hinweg. Danach liefert `GetCredentialsForIdentity` die AWS-Credentials.

Das sind **zwei Aufrufe, nicht drei** — genau das steht als *Enhanced Flow: zwei Aufrufe* im Kasten. Der ältere Basic Flow brauchte drei: `GetId`, `GetOpenIdToken`, `AssumeRoleWithWebIdentity`.

Die letzte Zeile — *was darfst du in AWS* — ist der Gegensatz zum *wer bist du* im User Pool. **Zwischen diesen beiden Zeilen liegt die ganze Karte.**

### Badge 4 und der STS-Kasten — wer den Aufruf macht

Im Hintergrund läuft tatsächlich `AssumeRoleWithWebIdentity`, aber der Identity Pool ruft es selbst auf: Der Enhanced Flow führt `GetOpenIdToken` und `AssumeRoleWithWebIdentity` für dich im Hintergrund aus. Die Kartenzeile *Pool ruft es im Hintergrund auf* ist damit exakt richtig.

**Darin liegt der eigentliche Sicherheitsvorteil.** Beim Basic Flow stellt die App die STS-Anfrage selbst zusammen — und damit liegt die **Rollenauswahl im App-Code**, wo sie sich auslesen lässt. Beim Enhanced Flow liegt sie in der Pool-Konfiguration.

*Credentials 1 Stunde gültig* ist belegt: Die AWS-Credentials aus der Enhanced Authentication sind eine Stunde gültig. Beim Basic Flow lässt sich die Sitzungsdauer dagegen selbst anfordern — ein Unterschied, den die Karte bewusst nicht zeigt.

### Badge 5 und die authenticated Role — zwei Rollen, eine davon für Fremde

Der Identity Pool kennt zwei Rollen: eine für angemeldete Nutzer und eine für Gäste. Die dritte Zeile im Kasten sagt *guest Role: enger gefasst*.

Das ist der Mechanismus, mit dem eine App eine begrenzte Funktion auch ohne Anmeldung anbieten kann. Er ist auch die Falle: **Ist der unauthentifizierte Zugriff versehentlich aktiv, gilt die Gastrolle für jeden** — auch für den, der sich nie angemeldet hat.

AWS baut hier ein zusätzliches Netz ein, das kaum jemand kennt: Auf Credentials für unauthentifizierte Identitäten legt Cognito im Enhanced Flow eine **Scope-down-Policy** — eine Session Policy, die als Obergrenze wirkt, unabhängig davon, was in der Rollen-Policy steht. Im Basic Flow gibt es diesen Schutz nicht automatisch.

### Badge 6 und der IAM-Policy-Kasten — die Zeile, an der die meisten scheitern

Die dritte Zeile im Kasten ist die wichtigste der ganzen Karte: *Identity ID, nicht User-Pool-sub*.

Beide Werte heißen `sub`. Der eine ist der `sub`-Claim des Nutzers im User Pool, der andere die Identity ID aus dem Identity Pool. In den Bucket-Pfad gehört die **Identity ID** — die AWS-Doku hebt das eigens in einem Hinweiskasten hervor.

Die Verwechslung ist deshalb so gefährlich, weil sie **keinen Fehler erzeugt**. Die Policy ist syntaktisch gültig, sie lässt sich speichern, sie erzeugt keine Warnung. Sie trifft nur nie zu, und jeder Upload scheitert mit `AccessDenied` an einer Stelle, an der niemand einen Tippfehler vermutet.

### Badge 7 und der S3-Kasten — wer Nein sagt

*S3 setzt die Grenze durch.* Der Upload läuft mit den erhaltenen Credentials, S3 wertet die Policy aus, und die Variable wird durch die Identity ID des Aufrufers ersetzt.

Im Diagramm führt der Weg von der Policy zu S3. Tatsächlich signiert die App den S3-Aufruf selbst; die Policy wird bei der Auswertung herangezogen. Die Zeichnung betont, *wodurch* der Zugriff begrenzt wird — eine bewusste Vereinfachung, die in der `.md` notiert ist.

Praktisch bedeutet das: Zwischen Handy und Bucket steht **kein eigener Server**. Kein API Gateway, keine Lambda, kein EC2-Upload-Endpunkt, der die Videos entgegennimmt und weiterreicht. Bei 200.000 Nutzern und Videodateien ist das der Unterschied zwischen einer Rechnung für Datentransfer durch die eigene Infrastruktur und einer Rechnung für S3-Speicher. Genau deshalb steht in solchen Aufgaben *uploads directly to S3* — es ist eine Kosten- und Skalierungsaussage, verkleidet als Architekturdetail.

### Der rote Kasten und das X — was verworfen wird

Der eingebettete Access Key fällt weg, sobald die Kette steht. Bemerkenswert ist, was er **nicht** war: Er war kein Fehler in der Anmeldung. Die App hätte einen tadellosen Login haben können und wäre trotzdem angreifbar gewesen, weil der Schlüssel danach für alle derselbe war.

### Die Merksätze-Fußzeile

Vier Sätze. Der letzte — *S3 setzt die Trennung durch, nicht der Client* — ist der, der in der Prüfung zwischen zwei plausibel klingenden Antworten entscheidet.

## Die entscheidende Unterscheidung

| | User Pool | Identity Pool |
|---|---|---|
| Beantwortet | wer bist du | was darfst du in AWS |
| Liefert | JWT-Tokens | AWS-Credentials |
| Braucht man für | eigene API, eigenes Backend | direkten Aufruf von AWS-Diensten |
| Ohne den anderen nutzbar | ja | ja (auch mit fremdem IdP) |
| Kennt IAM-Rollen | nein | ja |

Die vorletzte Zeile ist die, die Aufgaben entscheidet. **Wer eine eigene API zwischen App und S3 hat, braucht keinen Identity Pool** — dann reicht das User-Pool-Token zur Autorisierung, und die Lambda-Funktion dahinter hat ihre eigene Execution Role.

## Die ehrliche Feinheit

**Der Enhanced Flow kostet Flexibilität, die man selten vermisst — aber manchmal doch.** Er verlangt, dass die IAM-Rolle im **selben AWS-Konto** wie der Identity Pool liegt. Beim Basic Flow, wo die App die Anfrage selbst zusammenbaut, lässt sich eine Rolle in einem anderen Konto anfordern. Wer eine kontoübergreifende Architektur plant, stößt genau hier an die Grenze der empfohlenen Variante.

**Der Basic Flow ist nicht abgekündigt.** Die Doku beschreibt ihn weiterhin und rät lediglich davon ab; ein Abkündigungsdatum ließ sich nicht finden. Auf der Karte steht deshalb *Enhanced Flow: zwei Aufrufe* als Aussage über den empfohlenen Weg, nicht über den einzig möglichen.

**Drei Tokens kommen zurück, aber nur zwei sind JWTs.** Die Kartenzeile *JWT: ID + Access* ist an dieser Stelle präziser als `battle_card_42.md`, die von „JWT-Tokens: ID-Token, Access-Token, Refresh-Token" spricht. Der Refresh Token ist **opak** — er lässt sich nicht dekodieren, man schickt ihn zurück und bekommt neue Tokens. Er läuft standardmäßig 30 Tage nach der Anmeldung ab und ist beim Anlegen der Anwendung auf Werte zwischen 60 Minuten und 10 Jahren einstellbar; setzt man ihn auf 0, überschreibt Cognito den Wert mit den 30 Tagen. Hier ist die `.md` zu korrigieren, nicht die Karte.

**Die Identity ID gehört dem Pool, nicht dem Nutzer.** Sie wird vom Identity Pool vergeben und bleibt stabil beim Nutzer — aber sie ist an *diesen* Pool gebunden. Legst du einen zweiten Identity Pool an, bekommt derselbe Mensch dort eine andere Identity ID. Da die Ordnernamen in S3 aus dieser ID gebaut sind, hängen die Daten deiner Nutzer damit an einem Cognito-Objekt, das man nicht ohne Weiteres neu anlegen kann. Wer den Pool ersetzt, findet die Videos nicht mehr — sie liegen unter Pfaden, die niemand mehr trifft.

**Die Stunde auf der Karte und die Stunde im Token sind nicht dieselbe Stunde.** Die Credentials aus dem Identity Pool gelten eine Stunde. Die ID- und Access-Tokens aus dem User Pool haben ihre eigene Lebensdauer mit eigenem Default. Wer beide gleichsetzt, baut eine Auffrischungslogik, die zur falschen Zeit greift — und merkt es erst, wenn ein Upload mitten im Video abbricht.

## Syntax lesen — zwei `sub`, zwei Statements

Die vollständige Policy braucht zwei Statements, und nur eines davon benutzt `s3:prefix`:

```text
Statement 1  — Objekte lesen und schreiben
  Action    s3:GetObject, s3:PutObject
  Resource  arn:aws:s3:::videos-prod/users/${cognito-identity.amazonaws.com:sub}/*
                                            └── Variable steht im ARN

Statement 2  — den eigenen Ordner auflisten
  Action    s3:ListBucket
  Resource  arn:aws:s3:::videos-prod
  Condition StringLike  s3:prefix = users/${cognito-identity.amazonaws.com:sub}/*
                                            └── Variable steht in der Condition
```

Der Unterschied ist der Grund für die Kartenzeile *StringLike auf s3:prefix*. `GetObject` und `PutObject` zielen auf **Objekte**, die Variable gehört also in den Objekt-ARN. `ListBucket` zielt auf den **Bucket** — dort gibt es keinen Objektpfad, den man einschränken könnte, und die Begrenzung muss über eine Condition auf `s3:prefix` laufen.

Wer nur Statement 1 schreibt, bekommt eine App, in der Upload und Download funktionieren, das Auflisten der eigenen Dateien aber fehlschlägt. Wer in beiden Statements den User-Pool-`sub` einsetzt, bekommt eine Policy, die nie greift.

## Was du dadurch nicht baust

- **Keine Autorisierung für die eigene API.** Dafür schützt ein Cognito Authorizer am API Gateway die eigene API — der Identity Pool öffnet AWS-Dienste direkt.
- **Keine Mitarbeiterverwaltung.** Cognito ist für App-Endnutzer. Mitarbeiter mit Zugriff auf AWS-Accounts gehören zu IAM Identity Center (Karte 48).
- **Keine Bucket-weite Regel.** Der Zuschnitt pro Nutzer gehört in die Rollen-Policy. Eine Bucket Policy kennt die Identity ID des Aufrufers nicht in derselben Form und skaliert nicht auf 200.000 Nutzer.
- **Keine Verschlüsselung pro Nutzer.** Die Trennung ist eine Zugriffs-, keine Kryptografiegrenze.
- **Keine dauerhafte Sitzung.** Nach einer Stunde sind die Credentials weg. Die App muss auffrischen.

## Wenn du dir eine Sache merkst

**User Pool sagt, wer du bist; Identity Pool sagt, was du in AWS darfst — und die Trennung der Nutzerordner steht in der IAM-Policy, nicht im App-Code.**

*Access Key in der App* fällt, weil er auf fremden Geräten liegt. *Bucket Policy pro Nutzer* fällt, weil sie den Aufrufer nicht in derselben Form kennt und nicht skaliert. *Nur User Pool* fällt, sobald der Client AWS-Dienste direkt aufruft — Tokens sind keine AWS-Credentials.

## Prüfungsknackpunkte

**Signalwörter:** *sign in with social identity providers*, *users must only access their own files*, *mobile application uploads directly to S3*, *without embedding credentials in the app*, *temporary AWS credentials for app users*.

**Warum „nur User Pool" hier verliert:** Ein JWT ist kein AWS-Credential. Solange die App S3 **direkt** aufruft, braucht sie den Identity Pool. Läge eine eigene API dazwischen, wäre die Antwort umgekehrt.

**Warum „Identity Pool zusätzlich, obwohl eine API dazwischen liegt" verliert:** Läuft der Upload über API Gateway und Lambda, reicht das User-Pool-Token; die Funktion hat ihre eigene Execution Role. Der Identity Pool wäre überflüssige Komplexität.

**Warum „Bucket Policy mit Nutzerpfaden" verliert:** Sie müsste 200.000 Einträge tragen und kennt die Identity ID nicht als Variable in derselben Form.

**Warum „ein IAM User je App-Nutzer" verliert:** IAM ist nicht für Endkundenzahlen gebaut. Sobald von Zehntausenden Nutzern die Rede ist, ist IAM-Benutzerverwaltung ausgeschlossen.

**Warum der User-Pool-`sub` im Pfad verliert:** Es ist der falsche `sub`. Gemeint ist die Identity ID aus dem Identity Pool — die Policy bleibt gültig und trifft trotzdem nie zu.
