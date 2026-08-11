---
cardNumber: 44
slug: secrets-manager-parameter-store-ankerstein-rotation-gegen-konfiguration
title: "Secrets Manager vs Parameter Store — Rotation gegen Konfiguration"
services:
  - AWS Secrets Manager
  - AWS Systems Manager Parameter Store
  - AWS Lambda (Rotation)
  - Amazon RDS
  - AWS KMS
domains:
  - D1
  - D4
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html"
  - "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_managed.html"
  - "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda.html"
  - "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda-functions.html"
  - "https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_turn-on-cli.html"
  - "https://docs.aws.amazon.com/secretsmanager/latest/userguide/troubleshoot_rotation.html"
  - "https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html"
  - "https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html"
  - "https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/rotate-secret.html"
---

## Die Grundidee zuerst

Die Ankerstein Versicherung betreibt 40 Microservices. In deren Konfiguration stecken zwei sehr verschiedene Dinge, die auf den ersten Blick gleich aussehen, weil beide „vertraulich" heißen.

**Das eine:** ein Zimmerschlüssel im Hotel. Er wird bei jedem Gastwechsel neu codiert, der alte verliert seine Gültigkeit, und der Wechsel muss stattfinden, ob jemand daran denkt oder nicht. Das sind die RDS-Zugangsdaten, die laut Konzernrichtlinie alle 30 Tage rotieren müssen.

**Das andere:** die Hausordnung im Rahmen an der Wand. Auch sie hängt hinter Glas, auch sie ändert nicht jeder. Aber sie hat keinen Lebenszyklus. Sie steht da und gilt, bis jemand sie ändert. Das sind die 3.000 Feature-Flags, Endpunkt-URLs und Timeouts.

Der erste Entwurf des Teams hat beides ins Hotelschließfach gelegt. Die Rechnung wuchs mit jedem Service, obwohl der weitaus größte Teil der Werte nie eine Rotation brauchte.

**Secrets Manager kauft man für den Lebenszyklus, nicht für die Verschlüsselung.** Verschlüsseln kann der Parameter Store auch — mit demselben KMS darunter. Das ist der Trennstrich, und die ganze Karte ist um ihn herum gebaut.

## Was es eigentlich ist — das Rotations-Event

Ein Secret ist ein benanntes Objekt mit mehreren Versionen. Jede Version trägt Staging Labels, und die Labels sind der eigentliche Mechanismus. Wenn Secrets Manager rotiert, ruft er dieselbe Lambda-Funktion viermal auf und sagt ihr über einen einzigen Parameter, welcher Abschnitt gerade dran ist:

```json
{
  "Step": "create_secret",
  "SecretId": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:ankerstein/rds-schaden-AbCdEf",
  "ClientRequestToken": "8f3d1c2a-4b5e-6789-abcd-ef0123456789",
  "RotationToken": "b91e...af7"
}
```

Vier Felder, und drei davon sind wichtiger, als sie aussehen. `Step` nimmt genau vier Werte an: `create_secret`, `set_secret`, `test_secret`, `finish_secret`. `ClientRequestToken` ist die Versions-ID der neuen Fassung und sorgt für Idempotenz — bricht ein Durchlauf ab und wird wiederholt, findet die Funktion die halbfertige Version wieder, statt eine zweite anzulegen. `RotationToken` braucht man nur bei kontenübergreifender Rotation, wenn die Funktion eine Rolle annimmt und Secrets Manager prüfen muss, wer da wirklich anruft.

**Was in diesem Event nicht steht, ist das Passwort.** Die Funktion erzeugt es selbst — typischerweise über `get_random_password` — und legt es unter dem Label `AWSPENDING` ab. Erst am Ende wandert `AWSCURRENT` darauf.

## Der Weg durch die Karte

### Pfeil 1 — der Zeitplan startet die Rotation Lambda

Secrets Manager hält einen Rotationszeitplan und ruft zum Termin die Funktion auf. Für RDS, Aurora, Redshift und DocumentDB liefert AWS fertige Vorlagen; für alles andere schreibt man die Funktion selbst.

Wichtig für das Verständnis der nächsten vier Absätze: Es ist **eine** Funktion, die viermal aufgerufen wird, nicht vier Funktionen. Der Handler entscheidet anhand von `Step`, welchen Zweig er ausführt.

### Kasten — die vier Schritte

`create_secret` erzeugt den neuen Wert und legt ihn unter `AWSPENDING` ab. Zu diesem Zeitpunkt weiß die Datenbank noch nichts davon.

`set_secret` schreibt den Wert ins Zielsystem, hier also in die RDS-Instanz. Jetzt existiert das neue Passwort an zwei Stellen.

`test_secret` baut mit den neuen Zugangsdaten tatsächlich eine Verbindung auf und prüft, ob sie funktionieren. **Das ist der Schritt, den Kursmaterial regelmäßig unterschlägt**, und er ist der Grund, warum eine fehlgeschlagene Rotation die Anwendung nicht mitreißt.

`finish_secret` hängt `AWSCURRENT` auf die neue Version um; die alte wird zu `AWSPREVIOUS`.

Solange der Test nicht besteht, bleibt `AWSCURRENT` auf dem alten Wert stehen. Die Microservices lesen also weiter das alte Passwort — und weil `set_secret` es in der Datenbank noch nicht ersetzt hat, funktioniert es auch weiter. Scheitert irgendein Schritt, wiederholt Secrets Manager den gesamten Ablauf mehrmals innerhalb der offenen Rotationsfenster.

### Pfeil 2 — setzt Passwort in RDS

Der Pfeil zeigt in eine Richtung, aber es passiert etwas in beide: `set_secret` schreibt, `test_secret` liest zurück. Der Rückweg ist auf der Karte nicht gezeichnet und in der Zeile `Verbindung getestet` in der RDS-Box mitgemeint.

Wer die Funktion selbst schreibt, sollte an dieser Stelle wissen, dass es zwei Strategien gibt. **Single user** ändert das Passwort desselben Nutzers — einfach, aber es gibt ein kurzes Fenster, in dem eine Verbindung mit dem alten Passwort scheitern kann. **Alternating users** legt einen Klon des ersten Nutzers an und wechselt zwischen zweien hin und her — unterbrechungsfrei, verlangt aber ein zusätzliches Superuser-Secret, weil das Klonen Rechte braucht, die ein normaler Nutzer nicht hat. Ein Detail mit Praxisfolgen: **RDS Proxy unterstützt die Alternating-users-Strategie nicht.**

### Pfeil 3 — die Microservices lesen immer AWSCURRENT

Sie fragen nie nach einer Versionsnummer, sondern nach dem Label. Deshalb brauchen sie keine Kenntnis vom Rotationszeitpunkt und keinen Neustart.

Das Bild dazu: Du fragst nicht nach „Zimmer 214, Schlüssel Nummer 7", sondern nach „dem aktuellen Schlüssel für Zimmer 214". Wer der ist, entscheidet die Rezeption.

Genau das ist der Mehrwert gegenüber einem selbstgebauten Rotationsskript. Ein Skript, das Passwörter tauscht, ist in einem Nachmittag geschrieben. Der Teil, der weh tut, ist die koordinierte Umschaltung über 40 Services hinweg — und den erledigt das Staging Label.

### Kasten — Parameter Store, 3.000 Konfigurationswerte

Standard Tier: bis zu 10.000 Parameter je Region und Account, 4 KB je Wert, ohne Aufpreis. Sensible Werte werden als `SecureString` abgelegt und dabei von KMS verschlüsselt.

**Das ist der Satz, an dem die meisten Prüfungsfragen dieser Art hängen:** Die Verschlüsselung ist kein Argument für Secrets Manager. Sie gibt es hier auch, mit demselben Dienst darunter, und im Standard Tier kostenlos.

### Pfeil 4 — bei Bedarf in den Advanced Tier

Advanced Tier: bis zu 100.000 Parameter, 8 KB je Wert, Parameter Policies — und kostenpflichtig.

Der Weg dorthin ist offen, der Weg zurück ist gesperrt. Ein Standard-Parameter lässt sich jederzeit heraufstufen; ein Advanced-Parameter lässt sich **nie** zurückstufen. Die Doku begründet das mit drei Folgen, die ein Rückweg hätte: Der Wert würde von 8 KB auf 4 KB abgeschnitten, alle Parameter Policies wären weg, und — das nennen Vergleichstabellen praktisch nie — **Advanced-Parameter nutzen eine andere Verschlüsselungsform als Standard-Parameter**. Wer zurück will, muss löschen und neu anlegen.

Und die Kontingente ersetzen einander nicht, sie addieren sich: 100.000 Advanced **und** 10.000 Standard in derselben Region desselben Accounts sind zulässig.

### Pfeile 5 und 6 — KMS ist die gemeinsame Basis

Beide Dienste verschlüsseln mit KMS, beide binden an IAM. Sie sind keine Alternativen auf derselben Ebene, sondern zwei Aufsätze auf demselben Fundament. Wie das Fundament arbeitet, steht auf Karte 43: Envelope Encryption, ein Data Key je Wert, der CMK verlässt das HSM nie.

### Der verworfene Weg — alles in Secrets Manager

Der erste Entwurf zahlt einen Lebenszyklus-Dienst für 3.000 Werte, die keinen Lebenszyklus haben. Secrets Manager wird je Secret und Monat berechnet, der Parameter Store im Standard Tier nicht. Bei 3.000 Werten ist das kein Rundungsfehler, sondern die ganze Rechnung.

## Die entscheidende Unterscheidung

| | Secrets Manager | Parameter Store Standard | Parameter Store Advanced |
|---|---|---|---|
| **Rotation eingebaut** | ja | nein | nein |
| **KMS-Verschlüsselung** | ja | ja, als `SecureString` | ja, andere Form |
| **Wertgröße** | größer als 4 KB möglich | 4 KB | 8 KB |
| **Anzahl je Region/Account** | — | 10.000 | 100.000 |
| **Parameter Policies** | — | nein | ja |
| **Kosten** | je Secret und Monat | ohne Aufpreis | kostenpflichtig |
| **Rückweg** | — | → Advanced jederzeit | **gesperrt** |

Die einzige Zeile, die wirklich trennt, ist die erste. Alles andere ist Größe und Preis. Nur Secrets Manager rotiert von sich aus, repliziert regionsübergreifend und erzeugt Zufallswerte.

Die andere Abgrenzung, die in Prüfungsfragen mitläuft, steht schon auf Karte 41 und wird hier nicht neu hergeleitet: Ein Secret ist ein Geheimnis, eine Rolle ist keines. Wo eine IAM-Rolle möglich ist — also bei allem, was AWS-Dienste untereinander tun —, braucht man weder Secrets Manager noch Parameter Store. Secrets Manager ist für die Fälle, in denen ein Passwort unvermeidlich ist, etwa weil eine Datenbank-Engine keine Rollen kennt.

## Die ehrliche Feinheit

**Für genau dieses Szenario gibt es einen Weg ohne Lambda, und die Karte zeigt ihn nicht.**

Der Secrets-Manager-User-Guide führt drei Rotationsarten auf, und die Lambda-Rotation steht an dritter Stelle. An erster steht **Managed Rotation**: Der verwaltende Dienst konfiguriert und betreibt die Rotation, und sie benutzt **keine Lambda-Funktion**. Angeboten wird sie von Amazon RDS und Aurora für die Master-User-Credentials, von Redshift für Admin-Passwörter und von ECS Service Connect für Private-CA-Zertifikate.

Das Szenario auf der Karte ist RDS mit 30-Tage-Pflicht — also der Lehrbuchfall für Managed Rotation. Man legt das Secret dabei nicht in Secrets Manager an, sondern über den verwaltenden Dienst: In RDS heißt die Option, das Master-Passwort von AWS verwalten zu lassen, und RDS legt das Secret dann selbst an und pflegt es über den gesamten Lebenszyklus.

**Oktays Entscheidung 11.08.: Die Karte bleibt unverändert, das Narrativ trägt die Ergänzung.** Nichts auf der Karte ist falsch — die Lambda-Rotation für RDS existiert weiter, ist vollständig unterstützt, und die Zeile `für RDS fertige Vorlage` stimmt. Es fehlt der Weg, den AWS heute zuerst nennt.

Die Grenze zwischen beiden ist scharf und prüfungsrelevant: **Managed Rotation deckt die Master-User-Credentials ab, nicht die Zugangsdaten deiner Anwendung.** Für einen Anwendungsnutzer mit eingeschränkten Rechten bleibt es beim Lambda-Weg mit den vier Schritten. Ein Szenario, das „the database master password" sagt, zeigt auf Managed Rotation; eines, das von Anwendungszugangsdaten spricht, auf die Rotation Lambda.

**Zweite Feinheit: der Advanced Tier lässt sich betreten, ohne ihn zu wählen.** Die Karte sagt korrekt „Rückweg gesperrt". Sie sagt nicht, dass es eine dritte Einstellung für den Default Tier gibt: **Intelligent-Tiering**. Ist sie aktiv, stuft Parameter Store einen Standard-Parameter automatisch hoch, sobald ein Wert 4 KB überschreitet, eine Parameter Policy angehängt wird oder das 10.000er-Kontingent voll ist. Gedacht ist das für CloudFormation-Läufe, die sonst mittendrin abbrechen würden. Die Nebenwirkung ist, dass ein Team in der Einbahnstraße landen und zahlen kann, ohne je eine Entscheidung getroffen zu haben.

**Dritte Feinheit, klein aber verwirrend:** AWS schreibt die vier Schritte auf zwei benachbarten Doku-Seiten unterschiedlich. Die Seite „Rotation by Lambda function" gibt die Werte des `Step`-Parameters als `create_secret`, `set_secret`, `test_secret`, `finish_secret` an. Die Seite „Lambda rotation functions" überschreibt denselben Abschnitt mit „Four steps in a rotation function" und schreibt `createSecret`. Die CLI-Referenz zu `rotate-secret` schreibt ebenfalls `testSecret`. Beides ist AWS-Primärquelle. Wer Code schreibt, braucht die Unterstriche; wer über den Ablauf redet, darf beides sagen. Die Karte trägt die camelCase-Fassung und ist damit gedeckt.

## Syntax lesen

Der Unterschied zwischen den beiden Diensten ist im Abruf kleiner, als man denkt — und genau das ist die Falle. Links Secrets Manager, rechts Parameter Store:

```bash
aws secretsmanager get-secret-value \
  --secret-id ankerstein/rds-schaden \
  --version-stage AWSCURRENT

aws ssm get-parameter \
  --name /ankerstein/checkout/timeout-ms \
  --with-decryption
```

Zwei Zeilen, zwei Gedanken. `--version-stage AWSCURRENT` ist der Default und steht hier nur, um sichtbar zu machen, was sonst implizit passiert: Du fragst nach einem *Label*, nicht nach einer Version. Willst du während einer Rotation gezielt die alte Fassung, setzt du `AWSPREVIOUS`.

`--with-decryption` ist der Schalter, den Anfänger vergessen. Ohne ihn bekommst du bei einem `SecureString` den Chiffretext zurück, nicht den Wert — und zwar ohne Fehlermeldung. Mit ihm braucht die aufrufende Rolle zusätzlich `kms:Decrypt` auf dem Schlüssel; die reine `ssm:GetParameter`-Erlaubnis reicht nicht.

Ein dritter Befehl, der in Prüfungsfragen zur Rotationsprüfung auftaucht:

```bash
aws secretsmanager rotate-secret \
  --secret-id ankerstein/rds-schaden \
  --no-rotate-immediately
```

`RotateImmediately` steht standardmäßig auf `true`. Setzt du es auf `false`, rotiert Secrets Manager nicht, sondern testet die Konfiguration, indem es den `testSecret`-Schritt ausführt — es legt dabei eine `AWSPENDING`-Version an und entfernt sie wieder. Der Weg, eine Rotation zu prüfen, ohne sie auszulösen.

## Was du dadurch nicht baust

- **Keine Rotation ohne Zielsystem-Unterstützung.** Rotation schreibt den neuen Wert irgendwohin. Hat der Ziel-Dienst keine API zum Ändern der Zugangsdaten, scheitert `set_secret`, und es hilft keine Konfiguration.
- **Keine Parameter Policies im Standard Tier.** Ablaufdaten und Benachrichtigungen bei Nichtänderung gibt es nur im Advanced Tier.
- **Keinen Ersatz für IAM-Rollen.** Wer AWS-Zugriffsschlüssel in Secrets Manager legt und rotiert, hat das Problem von Karte 41 nur verschoben, nicht gelöst.
- **Keine feste Durchsatzgarantie aus der Tier-Wahl.** Der Durchsatz des Parameter Store ist separat einstellbar und ausdrücklich nicht an Standard oder Advanced gekoppelt. Zahlen, die im Umlauf sind, stehen deshalb weder auf der Karte noch hier.
- **Keine Preisangaben.** Die kursierenden Beträge je Secret und je Advanced-Parameter ließen sich nicht gegen eine AWS-Preisseite absichern. Was gedeckt ist, ist die Richtung: Standard Tier ohne Aufpreis, Advanced Tier und Secrets Manager kostenpflichtig. Für die Prüfung reicht die Richtung.

## Wenn du dir eine Sache merkst

**Secrets Manager kauft man für den Lebenszyklus, nicht für die Verschlüsselung — die kann Parameter Store auch.**

Damit fallen drei Distraktoren:

- „Secrets Manager, weil die Werte verschlüsselt sein müssen" — `SecureString` ist ebenfalls KMS-verschlüsselt, im Standard Tier kostenlos.
- „Advanced Tier für alle Parameter, dann ist man auf der sicheren Seite" — der Rückweg ist gesperrt, und 3.000 Werte unter 4 KB brauchen ihn nicht.
- „Ein Cron-Job rotiert die Passwörter" — er kann tauschen, aber nicht koordiniert umschalten und nicht vorher testen.

## Prüfungsknackpunkte

**Signalwörter für Secrets Manager:** „automatically rotate database credentials", „credentials must be rotated every 30 days", „without changing application code", „cross-region replication of secrets". Rotation im Text ist das eine Wort, das die Entscheidung erzwingt.

**Signalwörter für Parameter Store:** „store configuration data securely", „most cost-effective solution", „encrypted parameters", „feature flags". Steht Kostenoptimierung im Szenario **ohne** Rotationsanforderung, ist Parameter Store die Antwort.

**Warum „Secrets Manager für alles" hier verliert:** Es wird je Secret und Monat berechnet. Bei 3.000 Werten ohne Lebenszyklus zahlt man für eine Eigenschaft, die niemand nutzt.

**Warum „Advanced Tier, dann später zurück" hier verliert:** Es gibt kein Zurück. Löschen und neu anlegen ist der einzige Weg, und dabei geht die Versionshistorie verloren.

**Warum „Parameter Store kann keine Geheimnisse" hier verliert:** Kann er, als `SecureString`, mit KMS. Ihm fehlt der Lebenszyklus, nicht der Schutz.

**Die Falle bei fehlgeschlagenen Rotationen:** Bei Fragen der Form „die Rotation schlägt fehl, was passiert mit der Anwendung" ist die Antwort: nichts. `test_secret` bricht ab, `AWSCURRENT` bleibt auf dem alten Wert, die Services lesen unverändert weiter. Antwortoptionen, die einen Ausfall behaupten, hängen an der Vorstellung, Rotation sei ein einzelner Schreibvorgang.

**Die Falle mit Managed Rotation:** Nennt ein Szenario ausdrücklich das *Master-Passwort* einer RDS- oder Aurora-Instanz und fragt nach dem geringsten operativen Aufwand, ist „RDS das Passwort verwalten lassen" die bessere Antwort als „Rotation Lambda einrichten". Beide funktionieren; nur eine kommt ohne eigenen Code aus.
