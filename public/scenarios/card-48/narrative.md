---
cardNumber: 48
slug: iam-identity-center-permission-sets-uhlenbrook-maschinenbau-eine-identitaet-dreissig-accounts
title: "IAM Identity Center · Permission Sets — eine Identität, dreißig Accounts"
services:
  - AWS IAM Identity Center
  - AWS Organizations
  - AWS STS
  - AWS IAM
domains:
  - D1
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/organization-instances-identity-center.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/account-instances-identity-center.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/control-account-instance.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/enable-account-instance-console.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/howtocreatepermissionset.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/howtosessionduration.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/user-interactive-sessions.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/user-session-duration-prereqs-considerations.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/limits.html"
  - "https://docs.aws.amazon.com/singlesignon/latest/userguide/howtocmp.html"
  - "https://aws.amazon.com/blogs/security/define-a-custom-session-duration-and-terminate-active-sessions-in-iam-identity-center"
---

## Die Grundidee zuerst

Uhlenbrook Maschinenbau, 200 Mitarbeiter, 30 AWS-Accounts. Gewachsener Zustand: IAM-User in jedem Account, geteilte Zugangsdaten für Teamkonten, Access Keys in Konfigurationsdateien auf Entwicklerrechnern. Beim letzten Austritt fiel auf, dass das Konto der Person drei Wochen später in mehreren Accounts noch aktiv war — niemand hatte eine Liste, in welchen.

**Weg eins:** Jede Tür im Werk hat ein eigenes Schloss und einen eigenen Schlüsselbund. Wer neu anfängt, bekommt dreißig Schlüssel. Wer geht, gibt hoffentlich dreißig zurück. Es gibt kein Verzeichnis, welcher Schlüssel wohin gehört, und Kopien sind billig.

**Weg zwei:** Alle Türen bekommen Kartenleser. Es gibt eine Personalkarte pro Person und eine Liste, welche Karte welche Tür öffnet. Wer geht, wird in **einem** Verzeichnis deaktiviert. Die Türen selbst ändern sich nicht.

Der Unterschied ist nicht die Zahl der Türen. Es sind immer noch dreißig. Der Unterschied ist, dass die Berechtigung nicht mehr **an** der Tür hängt, sondern an einer zentralen Stelle, und die Tür nur noch nachfragt.

**IAM Identity Center ist das Kartenleser-System. Die IAM-Rolle im Zielaccount ist das Schloss.** Beide existieren weiterhin — nur die Verwaltung ist umgezogen.

## Was es eigentlich ist — das Permission Set

Ein Permission Set ist kein Rechtekonstrukt eigener Bauart. Es ist eine **Vorlage**, aus der in jedem zugewiesenen Account eine echte IAM-Rolle entsteht:

```json
{
  "Name": "FertigungReadOnly",
  "SessionDuration": "PT4H",
  "ManagedPolicies": [
    "arn:aws:iam::aws:policy/ReadOnlyAccess",
    "arn:aws:iam::aws:policy/AWSSupportAccess"
  ],
  "CustomerManagedPolicyReferences": [
    { "Name": "UhlenbrookTelemetrieRead", "Path": "/" }
  ],
  "InlinePolicy": "{ \"Version\": \"2012-10-17\", \"Statement\": [ ... ] }",
  "PermissionsBoundary": { "ManagedPolicyArn": "arn:aws:iam::aws:policy/PowerUserAccess" }
}
```

`ManagedPolicies` sind AWS-Policies; sie funktionieren sofort. `CustomerManagedPolicyReferences` sind nur **Verweise** — Name und Pfad. Identity Center legt diese Policies nicht an. Sie müssen in jedem Zielaccount vorher existieren, mit exakt diesem Namen und Pfad, sonst schlägt die Zuweisung fehl.

Das ist der praktische Unterschied, an dem Rollouts scheitern: Ein Permission Set mit AWS-managed Policies rollt man in Minuten auf 30 Accounts aus. Eins mit customer-managed Policies erfordert, dass die Policies vorher in 30 Accounts liegen.

`SessionDuration` ist standardmäßig eine Stunde und maximal zwölf. Merk dir die Zahl — sie kommt in der ehrlichen Feinheit wieder.

## Der Weg durch die Karte

### Kasten — der externe IdP bleibt führend

Blau, weil er außerhalb von AWS steht: Entra ID, Okta, Ping, JumpCloud, Google Workspace. Dort laufen die Personalprozesse, und dort sollen sie bleiben.

Die Zeile „bleibt führend" ist eine Architekturentscheidung, keine Beschreibung. Man könnte Nutzer auch direkt im Identity Store von Identity Center pflegen. Für 200 Mitarbeiter mit bestehendem Verzeichnis wäre das ein zweites Personalsystem — genau das Problem, das gelöst werden soll, nur eine Ebene höher.

### Pfeil 1 — SCIM schiebt Nutzer und Gruppen

SCIM synchronisiert Nutzer und Gruppen vom IdP nach Identity Center. Deaktiviert die Personalabteilung jemanden im IdP, verschwindet die Identität auf AWS-Seite nach.

Ein Detail, das im Betrieb überrascht: Nach Aktivierung der automatischen Provisionierung lassen sich Nutzer in der Identity-Center-Konsole nicht mehr von Hand ändern. Alle Änderungen kommen aus dem IdP. Das ist gewollt — zwei Schreibrichtungen auf dasselbe Verzeichnis wären genau die Inkonsistenz, die die Drei-Wochen-Lücke erzeugt hat.

### Kasten — Organization Instance, nicht Account Instance

Identity Center gibt es in zwei Ausprägungen, und die Unterscheidung entscheidet Prüfungsfragen.

Eine **Organization Instance** wird im Management Account der Organization aktiviert, unterstützt alle Funktionen und ist die einzige, mit der sich Berechtigungen über mehrere Accounts verteilen lassen. Eine **Account Instance** hängt an einem einzelnen Account und einer Region und dient dazu, unterstützte AWS-Anwendungen für einen abgegrenzten Nutzerkreis bereitzustellen — ein befristeter Test, ein isoliertes Team, eine Lage, in der man die Organization selbst nicht kontrolliert.

Wer vor dem 15.11.2023 aktiviert hat, hat automatisch eine Organization Instance. Der laufende Betrieb kann per Delegated Administration an einen Member Account übergeben werden, damit für Alltagsaufgaben niemand den Management Account betreten muss; die Rolle des delegierten Administrators als Muster ist auf Karte 45 ausgeführt.

Die graue Zeile „früher AWS SSO, seit 2022" steht dort, weil sie Prüfungsmaterial betrifft: Am 26.07.2022 wurde AWS Single Sign-On in AWS IAM Identity Center umbenannt. Es ist derselbe Dienst.

### Pfeil 2 — das Permission Set zuweisen

Eine Zuweisung besteht aus drei Teilen: **wer** (Gruppe oder Nutzer), **was** (Permission Set), **wo** (Account oder OU).

AWS empfiehlt ausdrücklich, an Gruppen zuzuweisen, nicht an Personen. Der Grund ist derselbe wie beim IdP: Wechselt jemand das Team, genügt ein Gruppenwechsel, statt Zuweisungen in dreißig Accounts nachzuziehen.

Die Kartenzeile `bis 10 Policies + 1 inline` hat einen doppelten Boden — siehe „Die ehrliche Feinheit".

### Pfeil 3 — eine Zuweisung, dreißig IAM-Rollen

Hier passiert das, was die meisten Erklärungen zu vage lassen: **Identity Center legt im Zielaccount eine echte IAM-Rolle an.**

Sie heißt nach dem Muster `AWSReservedSSO_<PermissionSetName>_<Suffix>` und liegt unter dem Pfad `/aws-reserved/sso.amazonaws.com/<region>/`. Sie taucht in CloudTrail auf, sie taucht in Zugriffsanalysen auf, sie ist eine gewöhnliche Rolle mit einer ungewöhnlichen Herkunft.

Zwei Konsequenzen daraus. Erstens: Alles, was für IAM-Rollen gilt, gilt auch hier — Trust Policy, Permissions Boundary, Auswertung durch Access Analyzer. Zweitens: Ändert man das Permission Set, werden alle Accounts, in denen es provisioniert ist, neu bespielt. Die Vorlage ist die Wahrheit, die dreißig Rollen sind Kopien.

Standardmäßig können diese Rollen nur von Identity-Center-Nutzern angenommen werden. Das ist kein Kosmetikdetail: Es stellt sicher, dass die im Permission Set gesetzte Session-Dauer auch tatsächlich greift.

### Pfeil 4 — STS gibt temporäre Credentials

Der Nutzer wählt im Access Portal einen Account und eine Rolle. Im Hintergrund nimmt Identity Center die Rolle an und reicht Credentials von STS durch. Der Nutzer muss die Rollen-ARN nie kennen.

**Es gibt keine Access Keys mehr, die in einer Konfigurationsdatei liegen könnten** — das ist die direkte Antwort auf die dritte Zeile der roten Box. Die Credentials laufen ab, ohne dass jemand etwas widerrufen muss.

### Pfeil 5 — der SCP deckelt, er gewährt nicht

Die Forderung „in Produktion niemand außerhalb der freigegebenen Regionen, auch kein Administrator und auch nicht der Root-User" gehört nicht ins Permission Set. Sie gehört in eine Service Control Policy an der Produktions-OU.

Ein SCP definiert die **maximal verfügbaren** Rechte für alle IAM-Identitäten eines Accounts, einschließlich der von Identity Center erzeugten Rollen und einschließlich des Root-Users eines Member Accounts. Er gewährt nie etwas. Die effektiven Rechte sind der Schnitt aus Identity-Policy, Permissions Boundary und SCP — und ein expliziter Deny an irgendeiner Stelle gewinnt immer.

Genau darin liegt die Robustheit: Eine Policy im Permission Set kann ein Administrator umschreiben. Den SCP an der OU kann er das nicht.

Der Pfeil zeigt auf der Karte nach oben auf Identity Center. Fachlich wirkt ein SCP nicht auf Identity Center, sondern auf die Accounts und die dort entstehenden Rollen; der Pfeil meint die Begrenzungsrichtung, nicht einen Datenfluss.

### Die Randnotiz links unten — Effektiv = Permission Set ∩ SCP

Zwei Zeilen in Rot-Pink, ohne Kasten, ohne Pfeil. Sie sind die Formel, aus der sich jede Frage nach effektiven Rechten beantworten lässt.

Der Schnitt ist die leichte Hälfte: Was das Permission Set erlaubt und der SCP durchlässt, geht. Was eines von beiden nicht erlaubt, geht nicht. Ein SCP, der `ec2:*` zulässt, verschafft niemandem EC2-Rechte — er nimmt sie nur niemandem weg.

Die zweite Zeile ist die scharfe: **ein expliziter Deny gewinnt immer.** Nicht „meistens", nicht „außer bei Root". Ein `Deny` in der Identity-Policy, in der Permissions Boundary, in einem SCP oder in einer Resource Policy schlägt jedes `Allow` an jeder anderen Stelle.

Daraus folgt eine Betriebsregel, die auf keiner Karte Platz hat: Wenn ein Zugriff unerwartet scheitert, ist die Suche nach dem fehlenden `Allow` fast immer die falsche. Gesucht wird der `Deny`, und er liegt selten dort, wo man gerade arbeitet.

### Der verworfene Weg — IAM-User pro Account

200 Personen mal 30 Accounts. Das ist nicht die Alternative, das ist die Ausgangslage: eigene Passwörter, eigene Access Keys, kein zentrales Verzeichnis, wer wo Zugang hat. Der Austritt muss dreißigmal nachvollzogen werden, und beim letzten Mal hat es drei Wochen gedauert.

## Die entscheidende Unterscheidung

| | Permission Set | Service Control Policy | Permissions Boundary |
|---|---|---|---|
| Wirkung | gewährt | begrenzt | begrenzt |
| Geltungsbereich | Nutzer in einem Account | alle Identitäten eines Accounts oder einer OU | eine einzelne Rolle oder ein User |
| Trifft Root des Member Accounts | nein | ja | nein |
| Verwaltet in | Identity Center | Organizations | IAM |
| Typischer Einsatz | Rollenprofil je Team | Regionssperre, Dienstverbot | Selbstbedienung mit Deckel |

## Die ehrliche Feinheit

**„Ein Entzug, überall wirksam" stimmt — „sofort" steht bewusst nicht auf der Karte.**

Der Grund sind zwei unabhängige Uhren. Die **Access-Portal-Session** läuft standardmäßig acht Stunden und ist von 15 Minuten bis 90 Tage konfigurierbar. Die **Session-Dauer des Permission Sets** ist davon getrennt: eine Stunde als Default, maximal zwölf. Wer im IdP deaktiviert wird, verliert die Möglichkeit, sich neu anzumelden — laufende Sitzungen enden davon nicht.

Der User Guide rechnet den Extremfall selbst vor: Bei einer Portal-Session von 20 Stunden und einem Permission Set von 12 Stunden kann eine CLI-Sitzung, kurz vor Ablauf erneuert, insgesamt 32 Stunden laufen. Und AWS bietet für diesen Fall einen eigenen Vorgang an — *aktive Sitzungen beenden* — und nennt als Beispiel im Security-Blog ausdrücklich Sitzungen ehemaliger Mitarbeiter.

Für Uhlenbrook heißt das: Aus drei Wochen werden nicht null Sekunden, sondern die Restlaufzeit der Sitzung — oder null, wenn jemand sie aktiv beendet. Das ist immer noch der ganze Gewinn der Karte. Es ist nur nicht dasselbe wie „sofort".

**Der zweite Punkt betrifft die Zehn.** Es sind zwei gestapelte Kontingente. Identity Center erlaubt laut Quotas-Seite 25 AWS-managed und customer-managed Policies je Permission Set und lässt diesen Wert nicht erhöhen. IAM erlaubt gleichzeitig nur 10 Managed Policies je Rolle — und *diese* Grenze ist erhöhbar, aber pro Zielaccount einzeln, über die Service-Quota *Managed policies attached to an IAM role*. Wirksam ist immer die kleinere. Die Inline-Policy ist davon unabhängig: genau eine, maximal 32.768 Zeichen.

**Der dritte Punkt ist eine Einbahnstraße, deren Richtung vom Alter der Organization abhängt.** Für Organisationen, die Identity Center vor November 2023 aktiviert haben, ist das Freischalten von Account Instances für Member Accounts eine einmalige, **nicht umkehrbare** Operation. Für Organisationen, deren Instanz nach dem 15.11.2023 entstand, dürfen Member Accounts von vornherein eigene Account Instances anlegen. In beiden Fällen bleibt als Steuerung nur ein SCP auf `sso:CreateInstance`. Nebenbei: Die Troubleshooting-Seite des User Guide nennt für denselben Sachverhalt den 14.09.2023, alle anderen Seiten den 15.11.2023 — ein Datum, das man in einer Prüfung nicht auf den Tag genau brauchen sollte.

## Syntax lesen

Der SCP für die Regionssperre ist kurz und hat drei Stellen, an denen man ihn falsch schreiben kann:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyAusserhalbEU",
    "Effect": "Deny",
    "NotAction": [ "iam:*", "sts:*", "organizations:*", "cloudfront:*", "route53:*", "support:*" ],
    "Resource": "*",
    "Condition": {
      "StringNotEquals": { "aws:RequestedRegion": [ "eu-central-1", "eu-west-1" ] }
    }
  }]
}
```

`Effect: Deny` mit `NotAction` heißt: verbiete alles **außer** dieser Liste. Die Ausnahmen sind kein Komfort, sondern Notwendigkeit — IAM, STS, Organizations, CloudFront und Route 53 sind globale Dienste, deren Aufrufe gegen `us-east-1` gehen. Ohne die Ausnahme sperrt man sich aus dem eigenen Login aus.

`aws:RequestedRegion` prüft die Region des **Aufrufs**, nicht den Wohnort der Ressource. Eine Konsolensitzung, die versehentlich in Ohio geöffnet wird, scheitert an dieser Bedingung, bevor irgendetwas entsteht.

Und `Resource: "*"` ist hier keine Großzügigkeit. Ein SCP gewährt nichts — ein Deny mit `Resource: "*"` ist die maximale Sperre, nicht die maximale Erlaubnis.

Zum Vergleich der Rollenname, der in CloudTrail erscheint:

```text
arn:aws:iam::444455556666:role/aws-reserved/sso.amazonaws.com/eu-central-1/AWSReservedSSO_FertigungReadOnly_a1b2c3d4e5f6a7b8
```

Wer Auswertungen darauf baut, sollte am Teil `AWSReservedSSO_<Name>_` festmachen und nicht am Pfad davor — der trägt die Region und ändert sich.

## Was du dadurch nicht baust

Keine Kundenanmeldung. Identity Center ist für die eigene Belegschaft. Endnutzer einer Anwendung gehören zu Cognito, Karte 42.

Keine Maschinenidentität. Ein EC2-Prozess bekommt seine Credentials über ein Instance Profile, Karte 41. Beide enden bei STS — das ist die Gemeinsamkeit, die in Prüfungsfragen als Ablenkung dient.

Keine Rechteerteilung durch Organizations. Der SCP kann die dreißig Rollen nur beschneiden. Ohne Permission Set passiert gar nichts, egal wie großzügig der SCP ist.

Kein vollständig geräumter Management Account. Delegated Administration verlagert den Alltag, aber bestimmte Aufgaben — allen voran die Zuweisung von Permission Sets an den Management Account selbst — bleiben dort.

## Wenn du dir eine Sache merkst

**Identity Center gewährt, der SCP begrenzt, und die IAM-Rolle im Zielaccount ist das, was am Ende wirklich existiert.**

Steht in der Frage „employees", „workforce" oder „corporate directory", ist es Identity Center — nicht Cognito.

Steht dort „even administrators" oder „including the root user", ist es der SCP — nicht das Permission Set.

Steht dort „no long-term credentials", ist es die STS-Kette über das Access Portal — nicht ein rotierter Access Key.

## Prüfungsknackpunkte

**Signalwörter für Identity Center:** *centrally manage access across multiple accounts*, *single sign-on for workforce users*, *existing corporate identity provider*, *deprovision immediately when an employee leaves*.

**Warum IAM-User pro Account verlieren:** Kein zentrales Verzeichnis, langlebige Access Keys, und der Entzug muss so oft wiederholt werden, wie es Accounts gibt.

**Warum eine Account Instance verliert:** Multi-Account Permissions gibt es ausschließlich in der Organization Instance. Für 30 Accounts ist sie die falsche Bauform, egal wie schnell sie eingerichtet ist.

**Warum „Region-Sperre ins Permission Set" verliert:** Sie greift dann nur für Nutzer dieses Permission Sets und nicht für den Root-User — und ein Administrator kann sie umschreiben.

**Warum „SCP gibt der Rolle die Rechte" verliert:** SCPs gewähren nie. Sie sind ein Filter über bereits erteilten Rechten.

**Warum „IAM Roles Anywhere" hier verliert:** Das ist die Antwort auf Maschinen außerhalb von AWS, nicht auf 200 Mitarbeiter mit Firmenlaptop.

**Die Falle mit den customer-managed Policies:** Sie werden von Identity Center nicht angelegt, nur referenziert. Wer sie nicht vorher in jedem Zielaccount erzeugt, bekommt eine fehlgeschlagene Zuweisung — und die Fehlermeldung nennt den fehlenden Namen, nicht den Grund.
