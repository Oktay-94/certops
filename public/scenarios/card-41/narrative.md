---
cardNumber: 41
slug: iam-roles-sts-instance-profile-talheim-spedition-ohne-access-keys
title: "IAM Roles · STS · Instance Profile — temporäre Credentials überall"
services:
  - IAM Roles
  - AWS STS
  - EC2 Instance Profile
  - IAM Roles Anywhere
  - Lambda Execution Role
  - Amazon S3
  - Amazon DynamoDB
domains:
  - D1
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_enable-regions.html"
  - "https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-IMDS-new-instances.html"
  - "https://aws.amazon.com/about-aws/whats-new/2025/04/aws-sts-global-endpoint-requests-locally-regions-default"
  - "https://aws.amazon.com/blogs/security/how-to-use-regional-aws-sts-endpoints/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/03/set-imdsv2-default-new-instance-launches"
  - "https://docs.aws.amazon.com/general/latest/gr/sts.html"
  - "https://aws.amazon.com/blogs/aws/amazon-ec2-instance-metadata-service-imdsv2-by-default/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, jemandem Zutritt zu einem Gebäude zu geben.

**Art eins:** Du drückst ihm einen Schlüssel in die Hand. Der Schlüssel funktioniert immer. Er funktioniert nachts, er funktioniert in fünf Jahren, und er funktioniert auch dann, wenn der Mann längst nicht mehr für dich arbeitet. Er lässt sich nachmachen, ohne dass du es merkst. Und wenn jemand mit einer Kopie hereinspaziert, sieht das Protokoll an der Tür aus wie ein ganz normaler Arbeitstag.

**Art zwei:** Er zeigt am Empfang seinen Ausweis vor. Der Empfang schaut nach, ob er auf der Liste steht, und druckt ihm einen Besucherausweis — gültig bis 18 Uhr. Um 18:01 ist der Ausweis Papier. Es gibt nichts zurückzugeben und nichts zu sperren, weil nichts übrig bleibt.

Das ist der ganze Unterschied zwischen einem Access Key und einer Rolle. **Nicht „besser verwahrte Schlüssel", sondern gar keine.**

Der Empfang heißt AWS STS. Und die Karte zeigt drei verschiedene Ausweise, die er akzeptiert: ein Zertifikat aus dem eigenen Rechenzentrum, die Tatsache, dass jemand auf einer bestimmten EC2-Instanz läuft, und die Tatsache, dass jemand eine bestimmte Lambda-Funktion ist.

## Was es eigentlich ist — zwei Policies, die verschiedene Fragen beantworten

Eine IAM Role ist kein Benutzer und kein Passwort. Sie ist ein Paar aus zwei Dokumenten, die man ständig verwechselt:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "rolesanywhere.amazonaws.com" },
    "Action": ["sts:AssumeRole", "sts:TagSession", "sts:SetSourceIdentity"],
    "Condition": {
      "ArnEquals": {
        "aws:SourceArn": "arn:aws:rolesanywhere:eu-central-1:1234:trust-anchor/ta-abc"
      }
    }
  }]
}
```

Das ist die **Trust Policy**. Sie beantwortet die Frage *wer darf diese Rolle annehmen* — hier: der Roles-Anywhere-Dienst, und zwar nur im Namen eines bestimmten Trust Anchors. Sie sagt kein einziges Wort darüber, was danach erlaubt ist.

Was danach erlaubt ist, steht in der **Permissions Policy**, einem völlig getrennten Dokument mit `s3:PutObject` und einem Bucket-ARN darin.

Auf der Karte stehen die beiden als zwei Zeilen im IAM-Role-Kasten: *Trust Policy: wer darf* und *Permissions: was er darf*. **Diese Zweiteilung ist der Kern jeder Rollenfrage in der Prüfung.** Wer sie verwechselt, sucht einen Berechtigungsfehler in der Trust Policy und findet ihn nie.

## Der Weg durch die Karte

### Der Kasten links — Talheim Spedition und ein Schlüssel, der älter ist als das Projekt

Die Auftragsverarbeitung läuft in `eu-central-1`. Im eigenen Rechenzentrum steht ein Altsystem, das nachts Bestandslisten nach S3 lädt — mit einem Access Key, der seit vier Jahren in einer Konfigurationsdatei liegt.

Zwei Zeilen im Kasten tragen die ganze Aufgabe. *X.509 aus eigener CA* sagt, dass es bereits eine funktionierende PKI gibt. *kein Code-Umbau erlaubt* sagt, dass jede Lösung, die eine neue Bibliothek oder einen neuen Aufruf im Anwendungscode verlangt, ausscheidet.

Zusammen ergeben sie genau eine Antwort. Ohne die erste Zeile wäre Roles Anywhere nicht möglich; ohne die zweite wäre es nicht nötig.

### Badge 1 und das Zertifikat — das Problem dorthin schieben, wo es gelöst ist

Das Altsystem zeigt sein X.509-Zertifikat vor. Der entscheidende Punkt: **Es hält keinen AWS-Schlüssel.** Es hält einen privaten Schlüssel aus der eigenen PKI — derselben, die ohnehin schon existiert, ohnehin schon Ablaufdaten kennt und ohnehin schon rotiert.

Das Bild dazu: Du gibst dem Boten keinen Werksschlüssel, sondern akzeptierst seinen Firmenausweis, den seine eigene Personalabteilung ausstellt und einzieht. Du musst nichts mehr verwalten, weil jemand anderes es schon tut.

Deshalb ist Roles Anywhere in der Prüfung immer dann die Antwort, wenn *workloads running outside of AWS* und eine bestehende Zertifikatsinfrastruktur zusammen auftauchen.

### Badge 2 und der Roles-Anywhere-Kasten — Trust Anchor und Profile sind zwei Stellschrauben

Roles Anywhere ruft `CreateSession` auf, prüft die Signatur und prüft, ob das Zertifikat von der hinterlegten CA stammt. Erst dann lässt es über STS eine Rollensitzung entstehen.

Im Kasten stehen vier Zeilen, und die erste ist die, die man überliest: *Trust Anchor + Profile*. Das sind **zwei getrennte Objekte**. Der **Trust Anchor** registriert die CA — er beantwortet „wessen Zertifikate erkenne ich überhaupt an". Das **Profile** legt fest, welche Rollen über diesen Weg annehmbar sind, und begrenzt zusätzlich die Sitzungsdauer.

Die vierte Zeile — *Rolle vertraut Service Principal* — ist die dritte Bedingung: Ohne `rolesanywhere.amazonaws.com` in der Trust Policy nützen Anchor und Profile nichts.

**Zur Karte:** Genau an dieser Zeile überlappt im gerenderten PNG das Pfeil-Label `CreateSession`. Der Text ist lesbar, aber die beiden Zeilen laufen ineinander — siehe „Die ehrliche Feinheit".

### Badge 3 und der EC2-Kasten — der Ausweis, den niemand anfassen muss

Das Instance Profile ist **nicht die Rolle**, sondern der Behälter, der sie an die Instanz bindet. In der Konsole entsteht er unsichtbar mit, über die API sind es zwei Objekte. Prüfungsfragen spielen mit dieser Unsichtbarkeit.

Abgerufen wird über IMDSv2: erst ein `PUT` für ein Session-Token, dann das eigentliche `GET` mit dem Token im Header. Das SDK erledigt beides von allein — **damit ist die Anforderung „kein Code-Umbau" erfüllt**, ohne dass jemand eine Zeile anfasst.

Die dritte Zeile im Kasten — *regional Default, nicht rückwirkend* — ist eine Betriebsfalle, die zwei Dinge sagt. Die IMDS-Voreinstellung wird auf Kontoebene **je Region** gesetzt, gilt also nicht automatisch überall. Und sie setzt bestehende Instanzen **nicht** zurück: Wer heute den Kontodefault auf IMDSv2 stellt, ändert nichts an den Instanzen, die gestern gestartet sind.

### Badge 4 und der Lambda-Kasten — hier ist der Pfeil ungenau

Lambda hat kein Instance Profile und keinen Metadata-Endpunkt im EC2-Sinn. Die Credentials der Execution Role stehen der Funktion über die Laufzeitumgebung zur Verfügung und werden vom SDK automatisch aufgegriffen.

**Auf der Karte trägt Pfeil 4 von der Lambda-Box zu STS das Label `AssumeRole` — richtig ist, dass nicht die Funktion diesen Aufruf macht, sondern der Lambda-Dienst beim Invoke.** Die Doku ist an dieser Stelle ungewöhnlich deutlich: Lambda nimmt die Execution Role automatisch an, und man soll `sts:AssumeRole` **nicht** im Funktionscode aufrufen, um an die eigene Rolle zu kommen. Der Pfeil aus der Lambda-Box suggeriert genau die Handlung, von der die Doku abrät.

Zwei Wege, das aufzulösen — die Entscheidung ist vertagt, deshalb stehen beide hier:

- **Weg A:** Das Label ändern, etwa auf `Rolle vom Dienst angenommen`. Die Karte wird für sich genau; der Pfeil verliert die Symmetrie zu Badge 3, wo tatsächlich die Instanz aktiv wird.
- **Weg B:** Die Karte bleibt. `AssumeRole` beschreibt korrekt, *was* passiert, nur nicht *wer* es tut — der Vorbehalt lebt in diesem Absatz. Wer nur die Karte sieht, hält den Aufruf für Aufgabe des Funktionscodes.

Für die Prüfung zählt der Unterschied selten. Für den Betrieb schon: Ein `AssumeRole` im Handler auf die **eigene** Rolle scheitert, solange die Rolle sich nicht selbst als Principal in ihrer Trust Policy führt.

### Badge 5 und der IAM-Role-Kasten — die Reihenfolge der zwei Prüfungen

Bevor Credentials entstehen, entscheidet die Trust Policy, *wer* die Rolle annehmen darf. Erst danach entscheidet die Permissions Policy, *was* der Anrufer damit tun darf.

Das Bild: Der Empfang prüft erst, ob dein Ausweis echt ist, und schaut dann in die Liste, welche Stockwerke dein Besucherausweis öffnet. Ein echter Ausweis ohne Listeneintrag bringt dich durch die Tür und sonst nirgendwohin — und genau dieser Fall erzeugt die Fehlermeldung, die Leute in der Trust Policy suchen lässt, obwohl sie in der Permissions Policy steht.

### Der STS-Kasten — wo der Ausweis ausgestellt wird

Drei Zeilen, die zusammengehören. *stellt Credentials aus* ist die Funktion. *regionaler Endpoint* ist die Empfehlung. *Token gilt in allen Regionen* ist die **Folge** der Empfehlung, nicht eine allgemeine Wahrheit.

Denn genau hier liegt der Unterschied: Session-Tokens von **regionalen** STS-Endpoints sind in allen AWS-Regionen gültig. Tokens vom **globalen** Endpoint `sts.amazonaws.com` sind nur in den Regionen gültig, die standardmäßig aktiviert sind. Wer eine Opt-in-Region neu aktiviert, stolpert genau darüber.

Die Karte hat die drei Zeilen in der richtigen Reihenfolge — die dritte gilt, *weil* die zweite gilt.

### Badge 6 und 7 — S3 und DynamoDB, und eine bewusste Verzeichnung

Beide Zugriffe laufen mit kurzlebigen Credentials, die von allein ablaufen. Es gibt nichts zu rotieren, weil nichts Dauerhaftes existiert.

Im Diagramm hängen S3 und DynamoDB an STS. Tatsächlich rufen EC2 und Lambda diese Dienste **direkt** auf und signieren die Aufrufe mit den von STS erhaltenen Credentials. Die Zeichnung betont bewusst, *wodurch* der Zugriff legitimiert ist, und nicht die Netzwerktopologie. Das steht so auch in der `.md` als bewusste Vereinfachung.

### Der rote Kasten — warum Rotation die zweitbeste Antwort ist

*Key seit 4 Jahren unrotiert, liegt in Konfigdatei, vom Audit verworfen.* Drei Zeilen, drei getrennte Probleme: unbegrenzte Haltbarkeit, beliebige Kopierbarkeit, und — das schlimmste — Missbrauch, der im CloudTrail wie normale Nutzung aussieht.

**In Szenarien mit dem Signalwort *no long-term credentials* ist „Access Keys regelmäßig rotieren" immer die zweitbeste Antwort.** Rotation verwaltet das Problem. Die Rolle löst es auf.

### Die Merksätze-Fußzeile

Vier Sätze. Der zweite — *STS stellt aus, IMDSv2 liefert aus* — ist der, den die Prüfung am häufigsten prüft, weil er zwei Dinge trennt, die in Kursmaterial gern verschmelzen.

## Die entscheidende Unterscheidung

| | Trust Policy | Permissions Policy |
|---|---|---|
| Frage | wer darf annehmen | was darf er danach |
| Sitzt an | der Rolle selbst | der Rolle (oder als Session Policy) |
| Enthält | `Principal` | `Resource` |
| Fehlerbild | `AccessDenied` schon beim Annehmen | `AccessDenied` beim eigentlichen Aufruf |
| Typische Falle | Service Principal vergessen | zu weit gefasst und nie geprüft |

Die Zeile „Fehlerbild" ist die praktisch nützlichste: **Wann die Ablehnung kommt, sagt dir, in welchem Dokument der Fehler steht.**

## Die ehrliche Feinheit

**Das On-Prem-System bekommt seine Credentials nicht aus Frankfurt, wenn es den globalen Endpoint benutzt.** Seit April 2025 werden Anfragen an `sts.amazonaws.com` in standardmäßig aktivierten Regionen lokal in der Region der Workload bedient statt in N. Virginia. Der Haken steht im Kleingedruckten: Anfragen aus **Opt-in-Regionen** und Anfragen von **außerhalb AWS** — also aus dem eigenen Rechenzentrum — werden weiterhin in N. Virginia bedient. Genau der Kasten links auf dieser Karte ist der Fall, für den die Verbesserung *nicht* gilt. Roles Anywhere selbst verhält sich richtig: Es benutzt den regionalen STS-Endpoint, der zum Trust Anchor gehört.

**Der Default hat sich gedreht, und die Doku ist nicht überall nachgezogen.** Seit dem 31.07.2025 verwenden neue SDK-Versionen ohne Zusatzkonfiguration den regionalen STS-Endpoint. Im selben AWS-Security-Blog steht weiter unten aber noch die Tabelle mit `legacy (default) — verwendet den globalen Endpoint`. Zwei Angaben, eine Seite. Für die Prüfung gilt die neuere Aussage; im eigenen Konto gilt, was die installierte SDK-Version tut.

**Die Karte hat zwei Textkollisionen im Render.** Im PNG überlappen `CreateSession` und die Zeile *Rolle vertraut Service Principal*, sowie `Key gelöscht` und *regional Default, nicht rückwirkend*. Das zweite Label liegt zusätzlich innerhalb der EC2-Box. Das ist kein Inhaltsfehler — alle vier Texte sind sachlich richtig —, aber ein Renderfehler, der die Lesbarkeit beschädigt und im Sammelpass zu beheben ist.

**`battle_card_41.md` ist an einer Stelle zu scharf.** Sie schreibt, die IMDS-Einstellung sei „regional, nicht kontoweit". Die Doku sagt: Kontoebene, gesetzt **je Region**. Der Unterschied klingt kleinlich, entscheidet aber, wo man in der Konsole sucht. Die Kartenzeile selbst ist mit *regional Default, nicht rückwirkend* korrekt.

## Syntax lesen — der IMDSv2-Abruf

Warum IMDSv2 sicherer ist, sieht man erst an den zwei Aufrufen.

```text
PUT  http://169.254.169.254/latest/api/token
     Header: X-aws-ec2-metadata-token-ttl-seconds: 21600
     Antwort: AQAAAO1z...   ← das Token

GET  http://169.254.169.254/latest/meta-data/iam/security-credentials/
     Header: X-aws-ec2-metadata-token: AQAAAO1z...
     Antwort: die temporaeren Credentials
```

Der Trick steckt im ersten Aufruf: Er ist ein **PUT**, kein GET. Eine verwundbare Anwendung, die man über eine präparierte URL dazu bringt, eine fremde Adresse abzurufen, macht in aller Regel ein GET — und bekommt ohne Token nichts. Dazu kommt eine Hop-Limit-Grenze, die verhindert, dass die Antwort die Instanz verlässt.

IMDSv2 löst damit ein **SSRF-Problem, keine Berechtigungsfrage**. Wer die beiden gleichsetzt, beantwortet in der Prüfung die falsche Frage: IMDSv2 ändert nichts daran, *was* die Rolle darf.

## Was du dadurch nicht baust

- **Keine Benutzerverwaltung.** Roles Anywhere authentifiziert Maschinen mit Zertifikaten. Menschen mit Login gehören zu IAM Identity Center (Karte 48).
- **Keine Verschlüsselung.** Diese Karte klärt, *wer* etwas darf. *Womit* Daten verschlüsselt werden, steht auf Karte 43.
- **Keine Rotation.** Es gibt nichts zu rotieren — das ist der Punkt, nicht eine Lücke.
- **Keine CA.** AWS wird nicht zur Zertifizierungsstelle. Der Trust Anchor **registriert** eine bestehende CA, er ersetzt sie nicht.
- **Keine Zahl für die Sitzungsdauer.** Sie wird vom Profile begrenzt und kann zusätzlich durch die Rolle gedeckelt werden. Weil zwei Stellschrauben ineinandergreifen, steht auf der Karte bewusst keine Minutenangabe.

## Wenn du dir eine Sache merkst

**Wer eine Rolle annehmen kann, braucht keinen Access Key — und STS ist immer der Aussteller, egal ob der Anrufer in EC2, in Lambda oder im eigenen Rechenzentrum sitzt.**

*Access Keys rotieren* fällt, weil es das Geheimnis verwaltet statt es abzuschaffen. *Keys auf die Instanz legen* fällt, weil das Instance Profile dasselbe liefert, ohne dass ein Geheimnis die Instanz je erreicht. *Secrets Manager für den Access Key* fällt, weil ein gut verwahrter Dauerschlüssel immer noch ein Dauerschlüssel ist.

## Prüfungsknackpunkte

**Signalwörter:** *no long-term credentials*, *temporary security credentials*, *without embedding access keys*, *workloads running outside of AWS*, *rotate credentials automatically*, *instance profile*, *assume a role*.

**Warum „Access Keys regelmäßig rotieren" hier verliert:** Die Aufgabe verlangt, dass es keine langlebigen Credentials mehr gibt. Rotation verkürzt die Lebensdauer, schafft sie aber nicht ab.

**Warum „Access Key im Secrets Manager ablegen und automatisch rotieren" verliert:** Es beantwortet die Frage nach der Aufbewahrung, nicht die nach der Existenz. Für Datenbankpasswörter ist es die richtige Antwort, für AWS-Zugriff aus einer AWS-Umgebung nicht.

**Warum „IAM User für das On-Prem-System" verliert:** Sobald eine PKI erwähnt wird, ist Roles Anywhere gemeint. Ein Zertifikat läuft ab und wird verwaltet, ein Access Key nicht.

**Warum IMDSv2 keine Antwort auf Berechtigungsfragen ist:** Es ist der Ausliefermechanismus auf der Instanz, nicht der Aussteller. Fragen nach *welche Rechte* beantwortet die Permissions Policy.

**Warum IAM Identity Center hier verliert:** Es ist für Menschen mit Login über mehrere Accounts. Diese Karte handelt von Maschinen ohne Interaktion.

**Der Klassiker aus altem Kursmaterial:** Ein `curl` auf `169.254.169.254/latest/meta-data/` ohne vorheriges Token schlägt auf IMDSv2-only-Instanzen fehl. Wer das Muster auswendig gelernt hat, hält den Fehler für ein Berechtigungsproblem — es ist ein Protokollproblem.
