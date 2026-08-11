---
cardNumber: 43
slug: kms-envelope-encryption-sse-kms-dreiburg-klinikverbund-patientenakten
title: "KMS · Envelope Encryption · S3 SSE-KMS — eigener Schlüssel mit Rotation und Nachweis"
services:
  - AWS KMS
  - Amazon S3 (SSE-KMS)
  - S3 Bucket Keys
  - AWS CloudTrail
domains:
  - D1
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/default-bucket-encryption.html"
  - "https://docs.aws.amazon.com/kms/latest/APIReference/API_Encrypt.html"
  - "https://docs.aws.amazon.com/kms/latest/APIReference/API_RotateKeyOnDemand.html"
  - "https://docs.aws.amazon.com/kms/latest/APIReference/API_EnableKeyRotation.html"
  - "https://docs.aws.amazon.com/kms/latest/APIReference/API_ScheduleKeyDeletion.html"
  - "https://docs.aws.amazon.com/kms/latest/developerguide/rotating-keys-on-demand.html"
  - "https://docs.aws.amazon.com/kms/latest/developerguide/resource-limits.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/04/aws-kms-automatic-key-rotation/"
  - "https://aws.amazon.com/about-aws/whats-new/2025/06/aws-kms-on-demand-key-rotation-imported-keys"
---

## Die Grundidee zuerst

Der Klinikverbund Dreiburg hat 40 Millionen eingescannte Patientenakten, im Schnitt 8 MB je Datei. Die Aufsichtsbehörde will drei Dinge: einen Schlüssel unter Kontrolle des Verbunds, nachweisbare Rotation, und eine Spur, wer wann womit entschlüsselt hat.

**Weg eins:** Du bringst jede einzelne Akte zum Notar. Er sperrt sie in seinen Panzerschrank, du bekommst eine Quittung. Der Panzerschrank ist erstklassig — aber der Briefschlitz, durch den du die Akte reichst, ist genau 4.096 Bytes breit. Eine 8-MB-Akte passt nicht hindurch. Das ist `kms:Encrypt` direkt, der verworfene Pfad links unten.

**Weg zwei:** Der Notar gibt dir ein frisches Vorhängeschloss samt Schlüssel. Du sperrst deine Akte selbst zu, gibst den Schlüssel zurück, und der Notar packt *ihn* in ein Kuvert, das nur er öffnen kann. Das Kuvert klebst du auf die Akte. Deine Akte bleibt bei dir. Der Notar sieht sie nie.

Das ist Envelope Encryption, und daher der Name: **Im Umschlag steckt der Schlüssel, nicht die Daten.**

Diese eine Verschiebung erklärt die ganze Karte. Sie erklärt, warum die 4-KB-Grenze kein Hindernis mehr ist. Sie erklärt, warum KMS die Akten nie zu sehen bekommt. Und sie erklärt, warum die Audit-Spur, die die Behörde verlangt, nicht in S3 entsteht, sondern bei jedem Gang zum Notar — also in CloudTrail.

## Was es eigentlich ist — die Key Policy

Der Customer Managed Key ist kein Schlüsselbund und keine Datei. Er ist ein Objekt im HSM, das sein Material nie verlässt, plus ein Dokument, das entscheidet, wer es benutzen darf. Dieses Dokument ist die Key Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RootDarfVerwalten",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:root" },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "S3DarfBenutzen",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:role/AktenUpload" },
      "Action": ["kms:GenerateDataKey", "kms:Decrypt", "kms:DescribeKey"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "s3.eu-central-1.amazonaws.com",
          "kms:EncryptionContext:aws:s3:arn":
            "arn:aws:s3:::dreiburg-patientenakten"
        }
      }
    }
  ]
}
```

Lies das von unten nach oben, dann fällt der Groschen. `Resource: "*"` sieht großzügig aus und ist es nicht — in einer Key Policy meint der Stern *diesen einen Schlüssel*, weil das Dokument am Schlüssel hängt. Die beiden Actions, die S3 wirklich braucht, sind `GenerateDataKey` zum Schreiben und `Decrypt` zum Lesen. `kms:ViaService` sperrt die Nutzung auf Aufrufe zu, die über S3 hereinkommen. Und der Encryption Context bindet den Schlüssel an genau einen Bucket.

**Das Entscheidende steht im ersten Statement.** Fehlt es, ist der Schlüssel unbrauchbar — auch für den Account-Root, auch für einen Administrator mit `AdministratorAccess`. KMS gehört zu den wenigen Diensten, bei denen die ressourcenbasierte Policy nicht optional dazukommt, sondern die Grundlage ist. Eine IAM-Policy kann nur erlauben, was die Key Policy bereits zulässt.

## Der Weg durch die Karte

### Pfeil 1 — PutObject

Die Anwendung lädt eine Akte hoch. Sie verschlüsselt nichts, sie kennt keinen Schlüssel, sie ruft keine KMS-API auf. Sie setzt ein `PutObject` ab, mehr nicht.

Das ist die Trennlinie zwischen server-side und client-side: Bei SSE trägt AWS die gesamte Mechanik, der Kunde bestimmt nur, mit *wessen* Schlüssel gearbeitet wird. Bei clientseitiger Verschlüsselung läge die Arbeit in der Anwendung — und der Klartext-Data-Key liefe durch deinen eigenen Code.

Die Zeile `SSE-S3 ist der Grundzustand` im S3-Kasten ist wichtiger, als sie aussieht. Seit dem 05.01.2023 wird jeder neue Upload nach S3 automatisch verschlüsselt, mindestens mit SSE-S3, ohne Zusatzkosten und ohne Performance-Einfluss. Die Prüfungsfrage lautet also nicht mehr *ob* verschlüsselt wird, sondern **mit wessen Schlüssel**.

### Pfeil 2 — GenerateDataKey

S3 geht zum Notar. Der Aufruf heißt `GenerateDataKey` und ist das Herz des Verfahrens.

Was S3 sagt: „Gib mir einen frischen Schlüssel für dieses Objekt." Was S3 *nicht* sagt: irgendetwas über den Inhalt der Akte. **Die 8-MB-Datei wird nie an KMS geschickt.** Sie verlässt S3 nicht.

Das Bild dazu: Du rufst den Notar an und bestellst ein Vorhängeschloss. Du faxt ihm nicht die Akte.

### Pfeil 3 — zwei Fassungen desselben Schlüssels

Zurück kommen zwei Dinge, die dasselbe sind: der Data Key im Klartext, und derselbe Data Key, verschlüsselt mit dem Customer Managed Key.

Der CMK selbst bleibt im HSM. Er wird ausschließlich dafür benutzt, den Data Key einzupacken. Wenn du dir den Rest der Karte nicht merkst, merk dir diesen Satz: **KMS verschlüsselt Schlüssel, nicht Daten.**

Der Data Key steht als eigener Kasten auf der Karte, obwohl er kein dauerhaftes Objekt ist. Er existiert für Sekundenbruchteile in zwei Fassungen — und genau das ist der Punkt, den man sehen muss.

### Pfeil 4 — verschlüsselt Objekt

S3 verschlüsselt die Akte lokal mit dem Klartext-Data-Key und **löscht ihn danach aus dem Speicher**. Was beim Objekt liegen bleibt, ist die verschlüsselte Fassung.

Damit ist der Zustand nach dem Upload: Akte verschlüsselt, daneben ein Kuvert, das den passenden Schlüssel enthält und das nur KMS öffnen kann.

Beim Lesen läuft es spiegelbildlich: S3 reicht das Kuvert an KMS, KMS öffnet es mit dem CMK, S3 entschlüsselt die Akte. Dieser Rückweg ist auf der Karte nicht gezeichnet — er würde die Karte verdoppeln, ohne einen neuen Gedanken zu bringen. Der Aufruf heißt `Decrypt`, und er ist derjenige, der die Behörde interessiert.

### Kasten — KMS Customer Managed Key

Der Kasten trägt drei Zahlen, und alle drei sind neuer, als das meiste Kursmaterial glaubt.

**Rotation 90 Tage bis 7 Jahre.** Seit April 2024 ist die Rotationsperiode frei wählbar zwischen 90 und 2.560 Tagen. Gibst du nichts an, sind es 365 Tage. Kursmaterial sagt nahezu durchgehend „einmal jährlich, nicht änderbar" — das war vor April 2024 richtig.

**On-demand, maximal 25 Mal.** Zusätzlich lässt sich `RotateKeyOnDemand` aufrufen und sofort rotieren, unabhängig davon, ob automatische Rotation überhaupt an ist. Eine On-demand-Rotation verschiebt den automatischen Termin nicht.

**1. und 2. Rotation je 1 $/Monat.** Früher schlug jede einzelne Rotation mit einem Dollar pro Monat zu Buche. Heute ist der Aufschlag bei der zweiten Rotation gedeckelt; alles danach ist nicht berechnet. Das ist die einzige Geldangabe auf dieser Karte, und sie stammt wörtlich aus der AWS-Ankündigung.

Was bei jeder Rotation **nicht** passiert: Key ID, Key ARN, Aliase, Policies und Berechtigungen bleiben unverändert. Altes Schlüsselmaterial wird nicht weggeworfen — KMS behält es, um alte Ciphertexte weiter entschlüsseln zu können. Rotation ist deshalb rückwirkungsfrei: Du musst keine Anwendung anfassen und keine Datei neu verschlüsseln.

### Pfeil 5 — die Key Policy prüft

Bei jedem `GenerateDataKey` und jedem `Decrypt` wird die Key Policy ausgewertet. Ohne Eintrag dort hilft keine noch so großzügige IAM-Policy.

Das ist die häufigste Ursache für ein `AccessDenied`, das niemand versteht: Der Entwickler hat die IAM-Rolle bereits mit `kms:Decrypt` ausgestattet, wundert sich über die Ablehnung und sucht im falschen Dokument.

### Pfeil 6 — der S3 Bucket Key spart Aufrufe

40 Millionen Objekte, jedes mit eigenem KMS-Aufruf beim Schreiben *und* bei jedem Lesen. Das ist der zweite verworfene Entwurf des Teams: SSE-KMS ohne Bucket Keys, mit einer KMS-Rechnung, die das Budget sprengt.

Mit Bucket Key holt S3 einen kurzlebigen Schlüssel auf Bucket-Ebene und leitet daraus die Data Keys für einzelne Objekte ab. Die Doku nennt bis zu 99 Prozent weniger Anfragen an KMS. Wie viel es tatsächlich wird, hängt an der Zahl der Requester, am Zugriffsmuster und am Alter der Objekte — wenige Requester, die viele Objekte in kurzer Zeit lesen, sparen am meisten.

Zwei Dinge, die man wissen muss: Die Einstellung ist **nicht** standardmäßig aktiv, sie muss bewusst gesetzt werden. Und sie wirkt nur auf neue Objekte — bereits liegende Akten bekommen den Bucket Key erst über eine `CopyObject`-Operation.

### Pfeil 7 — CloudTrail protokolliert

Jeder KMS-Aufruf erscheint in CloudTrail mit Aufrufer, Zeitpunkt und Schlüssel-ARN. Das ist die eigentliche Antwort auf die Behördenforderung, und sie liegt nicht dort, wo man sie sucht: **Der Nachweis lebt nicht in S3, sondern in CloudTrail.**

S3 Server Access Logs protokollieren, wer welches Objekt geholt hat. Die Frage „wer hat welchen Schlüssel benutzt" beantworten sie nicht, weil die KMS-Aufrufe dort gar nicht auftauchen.

### Der verworfene Weg — kms:Encrypt direkt

Die `Encrypt`-Operation nimmt bei einem symmetrischen Schlüssel höchstens 4.096 Bytes entgegen. Eine 8-MB-Akte wird abgelehnt, und zwar nicht langsam oder teuer, sondern sofort und hart.

Genau diese Grenze ist der Grund, warum es Envelope Encryption überhaupt gibt. `Encrypt` ist für Kleinkram gedacht — eine Personalnummer, ein Datenbankpasswort. Für alles darüber gibt es `GenerateDataKey`.

## Die entscheidende Unterscheidung

| | Wer hält den Schlüssel | Audit je Zugriff | Kosten | Typisches Signalwort |
|---|---|---|---|---|
| **SSE-S3** | S3, vollständig | nein | keine | „encrypted at rest", ohne Zusatz |
| **SSE-KMS** | du, im eigenen CMK | ja, über CloudTrail | KMS-Requests | „your own key", „prove who decrypted" |
| **SSE-C** | du, außerhalb AWS | nein | keine KMS-Kosten | „keys must never be stored in AWS" |
| **DSSE-KMS** | du, zwei Lagen | ja | höher, **keine Bucket Keys** | „two independent layers", CNSSP 15 |

In Compliance-Szenarien ist fast immer SSE-KMS die Antwort, und der Grund steht in Spalte zwei und drei zusammen: Nur hier gehört dir der Schlüssel *und* du bekommst die Spur, wer ihn benutzt hat. SSE-C gibt dir den Schlüssel, aber du musst ihn bei jedem einzelnen Request mitschicken und selbst verwalten — bei 40 Millionen Objekten ein Betriebsalbtraum.

## Die ehrliche Feinheit

**Bucket Keys und der Nachweis pro Zugriff schließen einander teilweise aus. Die Karte stellt beide nebeneinander, als wären sie Freunde.**

Der Untertitel verspricht „Audit pro Zugriff". Der Bucket-Key-Kasten verspricht 99 Prozent weniger Aufrufe. Beides gleichzeitig geht nicht, und der S3 User Guide ist dabei ungewöhnlich offen:

- Der Bucket-Level-Key wird **mindestens einmal je Requester** geholt, damit dessen Zugriff überhaupt in einem KMS-CloudTrail-Ereignis landet.
- Alle Folge-Requests, die den zwischengespeicherten Schlüssel nutzen, erzeugen **keinen KMS-API-Aufruf** — und prüfen **die Key Policy nicht**.
- Nach dem Einschalten loggen die KMS-CloudTrail-Ereignisse die **Bucket-ARN statt der Objekt-ARN**, und es sind schlicht weniger Ereignisse.

Beide Kartenaussagen sind einzeln wahr. „Protokolliert jeden Aufruf" stimmt — es gibt nur 99 Prozent weniger Aufrufe. Zusammengenommen liefern sie aber nicht, was der Untertitel behauptet. Wer eine Spur *je Objektzugriff* braucht, verzichtet auf Bucket Keys und zahlt dafür; wer die Rechnung drücken will, bekommt eine Spur je Requester und Zeitfenster.

**Oktays Entscheidung 11.08.: Die Karte bleibt unverändert, das Narrativ trägt den Widerspruch.** Für die Prüfung ist die Karte trotzdem richtig gelesen, weil SAA-C03-Fragen fast nie beide Anforderungen im selben Szenario stellen. In der Praxis tun sie es ständig.

Ein Nebeneffekt derselben Mechanik: Der Encryption Context wechselt von der Objekt-ARN auf die Bucket-ARN. Eine Key Policy, die per Condition auf die Objekt-ARN einschränkt — wie im JSON-Block oben, nur mit Objektpfad — hört auf zu funktionieren, sobald jemand den Bucket Key aktiviert. Das ist kein Fehler, das ist dokumentiertes Verhalten, und es fällt erst im Betrieb auf.

**Zweite Feinheit: AWS widerspricht sich bei der Zahl der On-demand-Rotationen.** Developer Guide, die Seite „Resource quotas" und die API-Referenz sagen übereinstimmend **25**. Die KMS-FAQ, die CLI-Referenz und mehrere SDK-Referenzen sagen **10**. Alle sind AWS-Primärquellen. Die Karte trägt 25 und steht damit auf der Seite mit dem größeren Gewicht — der User Guide schlägt die FAQ. Für die Prüfung ist keine der beiden Zahlen relevant; relevant ist, dass es überhaupt ein Lebenszeit-Limit gibt.

## Syntax lesen

Der `GenerateDataKey`-Aufruf, den S3 für dich absetzt, sieht so aus:

```json
{
  "KeyId": "arn:aws:kms:eu-central-1:123456789012:key/1a2b3c4d-...",
  "KeySpec": "AES_256",
  "EncryptionContext": {
    "aws:s3:arn": "arn:aws:s3:::dreiburg-patientenakten/2026/akte-4711.pdf"
  }
}
```

Drei Felder, drei Gedanken. `KeyId` benennt den Umschlag-Schlüssel. `KeySpec` bestimmt, wie lang der Data Key wird. Und der `EncryptionContext` ist der interessante Teil: Er ist kein Geheimnis, er wird im Klartext in CloudTrail protokolliert — aber er wird als *additional authenticated data* mitverschlüsselt.

Praktisch heißt das: Wer später entschlüsseln will, muss denselben Context exakt mitliefern, sonst schlägt der `Decrypt` fehl. Und weil der Context in CloudTrail steht, kannst du im Log lesen, für welches Objekt ein Schlüssel geholt wurde.

Genau hier greift die Bucket-Key-Feinheit von oben ineinander: Mit Bucket Key steht in dieser Zeile nur noch `arn:aws:s3:::dreiburg-patientenakten` — ohne `/2026/akte-4711.pdf`. Der Objektbezug ist weg, und mit ihm die Zeile im Prüfbericht, die sagt, welche Akte jemand geöffnet hat.

## Was du dadurch nicht baust

- **Keinen Schutz gegen einen berechtigten Nutzer.** SSE-KMS verschlüsselt gegen Diebstahl der Festplatte und gegen Zugriff ohne Schlüsselrecht. Wer `Decrypt` darf, sieht die Akte im Klartext.
- **Keine Verschlüsselung im Client.** Der Klartext-Data-Key existiert kurz in S3, nicht in deiner Anwendung. Wer will, dass AWS die Daten nie im Klartext sieht, braucht clientseitige Verschlüsselung mit dem AWS Encryption SDK.
- **Keine automatische Rotation für importiertes Schlüsselmaterial.** BYOK-Schlüssel lassen sich seit dem 06.06.2025 on demand rotieren — die ARN bleibt dabei erhalten, was vorher nicht ging —, aber `EnableKeyRotation` bleibt für sie gesperrt. Seit dem 26.11.2025 gilt die On-demand-Rotation auch für Multi-Region-Keys mit importiertem Material.
- **Keine Rotation der Data Keys.** Rotiert wird der CMK. Die Data Keys der 40 Millionen Objekte bleiben, wie sie sind; sie wurden ohnehin je Objekt einmalig erzeugt.
- **Keine schnelle Rückabwicklung.** Einen KMS Key zu löschen dauert mindestens 7 und standardmäßig 30 Tage Wartezeit, und danach sind alle darunter verschlüsselten Daten unwiederbringlich weg. Das ist Absicht.

## Wenn du dir eine Sache merkst

**KMS verschlüsselt nicht deine Daten, sondern deinen Data Key — und der Nachweis, wer entschlüsselt hat, steht in CloudTrail, nicht in S3.**

Damit fallen drei Distraktoren von selbst:

- „`kms:Encrypt` auf die Datei anwenden" scheitert bei 4.096 Bytes, und diese Grenze ist der Existenzgrund von Envelope Encryption.
- „SSE-S3 aktivieren" erfüllt „verschlüsselt" und keine der drei Behördenforderungen — kein eigener Schlüssel, keine steuerbare Rotation, keine Spur je Zugriff.
- „S3 Server Access Logs auswerten" beantwortet, wer welches Objekt geholt hat, nicht, wer welchen Schlüssel benutzt hat.

## Prüfungsknackpunkte

**Signalwörter, die auf SSE-KMS zeigen:** „customer managed key", „encryption at rest with your own key", „prove who decrypted the data", „automatic key rotation for compliance", „audit trail for key usage". Steht dagegen nur „encrypted at rest" ohne Zusatz, reicht SSE-S3 — und ist die günstigere und damit richtige Antwort.

**Signalwort für Bucket Keys:** „reduce KMS request costs" in Kombination mit einer großen Objektzahl. In Kostenfragen zu SSE-KMS mit Millionen von Objekten ist „S3 Bucket Keys aktivieren" fast immer die gesuchte Antwort.

**Warum „KMS verschlüsselt die Datei" hier verliert:** Es ist der häufigste Denkfehler überhaupt. KMS bekommt die Nutzdaten nie zu sehen. Wer das verinnerlicht hat, beantwortet die 4-KB-Frage automatisch richtig.

**Warum „Rotation aktivieren" allein hier verliert:** Ein rotierter Schlüssel, den die falschen Principals benutzen dürfen, erfüllt keine Compliance-Anforderung. Rotation und Key Policy sind zwei Anforderungen, nicht eine.

**Warum „Objekte sind vielleicht unverschlüsselt" hier verliert:** Seit dem 05.01.2023 nicht mehr. Antwortoptionen, die „Default Encryption einschalten" als Aufgabe des Kunden darstellen, stammen aus älterem Material.

**Warum „IAM-Policy erweitern" hier verliert:** Bei KMS muss die Key Policy den Zugriff zulassen. Sie ist nicht optional, und keine IAM-Policy kann sie überstimmen.

**Die Falle mit den Bucket Keys:** Sie sind eine Opt-in-Einstellung und wirken nur auf neue Objekte. Eine Antwort, die stillschweigend voraussetzt, dass sie aktiv sind, oder die verspricht, bestehende Objekte würden automatisch profitieren, ist falsch.
