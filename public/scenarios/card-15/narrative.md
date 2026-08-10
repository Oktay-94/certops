---
cardNumber: 15
slug: s3-object-lock-compliance-mfa-delete-ransomware
title: "Ransomware-sichere Backups — Versioning, Object Lock, MFA Delete"
services:
  - "S3 Versioning"
  - "S3 Object Lock (Governance / Compliance / Legal Hold)"
  - "MFA Delete"
  - "S3 Batch Operations"
  - "S3 Replication"
  - "AWS Backup Vault Lock"
domains: ["D1", "D2"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/MultiFactorAuthenticationDelete.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingMFADelete.html"
  - "https://aws.amazon.com/s3/features/object-lock/"
  - "https://aws.amazon.com/blogs/storage/protecting-data-with-amazon-s3-object-lock/"
  - "https://aws.amazon.com/blogs/storage/how-to-manage-retention-periods-in-bulk-using-amazon-s3-batch-operations/"
  - "https://repost.aws/knowledge-center/s3-object-lock-delete"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, Akten für sieben Jahre wegzuschließen.

**Weg eins:** Ein solider Stahlschrank mit einem sehr guten Schloss. Die Mitarbeiter kommen nicht heran. Der Hausmeister allerdings hat einen Generalschlüssel, weil das nun einmal so ist bei Hausmeistern. Solange niemand den Generalschlüssel missbraucht, funktioniert der Schrank tadellos. Der Schutz ist eine Frage der Disziplin.

**Weg zwei:** Der Raum wird zugemauert, und in die Mauer wird ein Datum eingelassen. Vor diesem Datum kommt niemand hinein — nicht der Hausmeister, nicht der Geschäftsführer, nicht der, der die Mauer bezahlt hat. Es gibt keinen Generalschlüssel, weil es keine Tür gibt.

Der Unterschied ist nicht die Dicke des Materials. Der Unterschied ist, dass es im zweiten Fall **niemanden gibt, der das Recht hätte, die Regel aufzuheben.** Weg eins ist Governance Mode. Weg zwei ist Compliance Mode.

Und weil die Geschäftsführung der Stadtwerke Lippetal genau diesen Satz hören will — auch der Administrator nicht, auch der Root-Benutzer nicht —, führt an Weg zwei nichts vorbei.

## Was es eigentlich ist — eine Regel am Bucket, kein Programm

Es gibt in dieser Lösung keine Software, die Löschversuche abfängt. Es gibt eine Bucket-Konfiguration:

```json
{
  "ObjectLockEnabled": "Enabled",
  "Rule": {
    "DefaultRetention": {
      "Mode": "COMPLIANCE",
      "Years": 7
    }
  }
}
```

Fünf sinnvolle Zeilen. `ObjectLockEnabled` schaltet den Mechanismus für den Bucket ein und zieht dabei die Versionierung automatisch mit hoch. `DefaultRetention` sorgt dafür, dass jedes neu geschriebene Objekt seine Frist bekommt, ohne dass der Backup-Job etwas davon weiß.

An einem einzelnen Objekt sieht dieselbe Regel dann so aus:

```json
{
  "ObjectLockMode": "COMPLIANCE",
  "ObjectLockRetainUntilDate": "2033-07-29T02:15:00Z",
  "ObjectLockLegalHoldStatus": "OFF",
  "VersionId": "3sL9x.mZq0OeRk1pT7uVbA2cYw8dNfGh"
}
```

**Diese vier Felder hängen an der Objektversion, nicht am Objektnamen.** Der Satz klingt nach Detail und ist die halbe Karte: Ein Schlüssel wie `backups/erp/2026-07-29.tar` ist nur ein Name. Geschützt ist die Version mit der ID `3sL9x…`, und zwar bis zum Datum in `RetainUntilDate`.

## Der Weg durch die Karte

### Der Backup-Job-Kasten — der Schutz sitzt nicht im Absender

Links steht der nächtliche Job, der ERP und Abrechnung wegschreibt. Der wichtigste Satz steht klein darunter: *schreibt ganz normal per PUT*.

Kein Agent, kein Sonderweg, keine Anpassung des Sicherungswerkzeugs. Und genau daraus folgt, warum diese Lösung gegen einen kompromittierten Backup-Server hilft: **Der Server darf schreiben — er darf nur nichts wegnehmen.** Wer die Anmeldedaten des Backup-Servers erbeutet, erbeutet damit kein einziges zusätzliches Recht am Bestand.

### Badge 1 — PUT, und die Voraussetzung entsteht nebenbei

Jeder PUT auf denselben Schlüssel erzeugt eine neue Version mit eigener `versionId`. Die alte bleibt liegen, unverändert, vollständig abrufbar.

Ein `DELETE` ohne `versionId` löscht deshalb nichts. Es setzt einen **Delete Marker** — eine leere Platzhalterversion, die zur aktuellen wird. Das Objekt verschwindet aus der normalen Auflistung, die Daten sind unangetastet. Wer den Marker entfernt, sieht die Datei sofort wieder.

Das Bild dazu: Der Delete Marker ist ein Zettel „ausgeliehen" vor dem Regalfach. Das Buch steht dahinter.

### Der Versioning-Kasten — Voraussetzung, nicht Lösung

Der kursive Satz in diesem Kasten ist der, den du in die Prüfung mitnimmst: **Object Lock schützt Versionen, nicht Schlüssel.**

Ohne Versionierung gibt es keine Versionen, die man sperren könnte, und damit auch kein Object Lock. Umgekehrt gilt: Wer Object Lock einschaltet, bekommt Versionierung automatisch dazu.

Versionierung allein ist aber noch keine Verteidigung. Wer `DeleteObjectVersion` mit einer konkreten `versionId` aufruft, löscht wirklich — Versionierung hält ihn nicht auf. Sie hält nur den Sorglosen auf, nicht den Angreifer.

### Badge 2 — Default Retention setzt die Frist

Der Weg vom Bucket zur Objektversion ist auf der Karte als `Default Retention pro Objekt` abgekürzt. Tatsächlich gibt es drei Wege, eine Frist zu setzen: die Bucket-Vorgabe für alles Neue, eine Angabe direkt am `PUT`, die die Vorgabe überschreibt, und nachträglich `PutObjectRetention` je Objekt.

Wichtig für den Umbau eines bestehenden Bestands: **Die Default Retention gilt nur für neu geschriebene Objekte, nicht rückwirkend.** Für die Millionen Objekte, die schon im Bucket liegen, führt der Weg über S3 Batch Operations auf Basis eines S3-Inventory-Reports.

### Der Object-Lock-Kasten — Compliance Mode

Bis zum `Retain Until Date` kann diese Objektversion weder gelöscht noch überschrieben werden — und die Frist kann nicht verkürzt werden. Nicht durch einen Administrator, nicht durch den Bucket-Eigentümer, nicht durch den Root-Benutzer. Verlängern geht, verkürzen nicht.

Die Doku benennt den einzigen verbleibenden Ausweg unverblümt: Um ein Objekt im Compliance Mode vor Fristablauf loszuwerden, müsste man das zugehörige AWS-Konto löschen.

**Legal Hold** ist die zweite Sperre und arbeitet unabhängig davon: derselbe Schutz, aber ohne Ablaufdatum. Er gilt, bis ihn jemand mit dem Recht `s3:PutObjectLegalHold` wieder entfernt. Eine Objektversion kann beides tragen, eines von beiden oder nichts.

### Badge 3 — die Wiederherstellung ist unspektakulär

Nach dem Vorfall holt man per `GET` mit der `versionId` die letzte saubere Version — oder entfernt schlicht den Delete Marker, wenn nur „gelöscht" wurde.

Es gibt keinen Restore-Vorgang, keine Wartezeit, keine Verhandlung. **Der Angriff hat die Daten nie erreicht.** Das ist der Unterschied zwischen einer Sicherung, die man wiederherstellen muss, und einer, die nie weg war.

### Der Angreifer-Kasten — gültige Rechte, kein Exploit

Der Angreifer ist gestrichelt gezeichnet, und das ist kein Schmuck. Er hat keine Lücke ausgenutzt. Er hat Administrator-Anmeldedaten, und er benutzt sie so, wie sie gedacht sind.

Das ist die Bedrohungslage, die diese Karte adressiert. Gegen sie helfen weder IAM-Policies noch Netzwerkgrenzen, weil der Angreifer auf der richtigen Seite von beidem steht.

### Badge 4 — beide naheliegenden Züge scheitern

Mit erbeuteten Admin-Rechten sind zwei Aufrufe naheliegend: `DeleteObjectVersion`, also die echte Löschung einer bestimmten Version, und `PutObjectRetention`, um die Frist zu verkürzen.

Im Compliance Mode werden **beide abgewiesen, unabhängig von der IAM-Policy.** Der Pfeil endet deshalb am roten X: Er hat gültige Rechte — sie nützen ihm nur nichts. Das ist der Kern der Karte, und es ist auch der Grund, warum Compliance Mode so unangenehm ist, wenn man ihn versehentlich zu weit gesetzt hat.

### Badge 5 — MFA Delete, und hier hat die Karte einen Fehler

Der zweite Angriff auf der Karte ist der klügere: nicht Objekte löschen, sondern die Versionierung abschalten (`PutBucketVersioning` mit Status `Suspended`). MFA Delete soll ihn aufhalten.

**Auf der Karte hält MFA Delete einen Angriff auf, den es auf diesem Bucket nicht gibt.** Der User Guide sagt in einem Important-Kasten: Nach dem Aktivieren von Object Lock auf einem Bucket lässt sich Object Lock nicht mehr abschalten und die Versionierung nicht mehr suspendieren. Auf einem Object-Lock-Bucket ist der Suspend-Weg also generell zu — mit MFA Delete und ohne.

Fixvorschlag für die Karte: den Suspend-Pfeil streichen und den Kasten auf die Wirkung umtexten, die bleibt — MFA Delete verlangt für das **endgültige Löschen einer Objektversion** einen gültigen MFA-Code.

Denn wirkungslos ist MFA Delete nicht. Es schützt weiterhin das, was Object Lock nicht schützt: Delete Marker sind ausdrücklich **nicht** WORM-geschützt, und Versionen nach Fristablauf sind es auch nicht mehr. Und auf jedem versionierten Bucket *ohne* Object Lock ist der Suspend-Schutz genau der richtige Punkt.

Die beiden Betriebsdetails im Kasten stimmen unverändert: MFA Delete kann nur der Bucket-Eigentümer, also der Root-Benutzer, einschalten, und nur über CLI, SDK oder API — in der Konsole geht es nicht.

### Der Kasten „Zusätzliche Schichten"

Object Lock ist die technische Sperre, nicht die ganze Verteidigung.

Backups gehören in einen **eigenen AWS-Account**, zu dem die kompromittierten Anmeldedaten keinen Zugang haben. Das ist auch die Antwort auf den einzigen verbleibenden Ausweg aus dem Compliance Mode: Wer das Konto nicht erreicht, kann es nicht schließen.

**S3 Replication** funktioniert mit Object-Lock-Buckets und repliziert die Sperren mit. Zwei Bedingungen nennt die Karte nicht: Der Zielbucket muss ebenfalls Object Lock aktiviert haben, und die Replikationsrolle braucht zusätzlich `s3:GetObjectRetention` und `s3:GetObjectLegalHold`.

**AWS Backup Vault Lock** ist das Gegenstück für Sicherungen über AWS Backup. Und **CloudTrail Data Events** protokollieren jeden Löschversuch — ohne sie bemerkt niemand, dass gerade jemand am Backup gescheitert ist.

## Die entscheidende Unterscheidung

Drei Mechanismen, die ständig verwechselt werden, an der einzigen Achse, die zählt — *wer kann die Regel aufheben*:

| | Governance Mode | Compliance Mode | Legal Hold |
|---|---|---|---|
| Aufhebbar durch | Recht `s3:BypassGovernanceRetention` | niemanden, auch nicht Root | Recht `s3:PutObjectLegalHold` |
| Ablaufdatum | ja, `RetainUntilDate` | ja, `RetainUntilDate` | keines |
| Frist verkürzbar | ja, mit Bypass-Recht | nein | entfällt |
| Gedacht für | versehentliches Löschen mit Notausgang | regulatorische Unveränderbarkeit | laufende Rechtsstreitigkeiten |

Zum Bypass gehört ein Detail, das die Antwortoptionen gern nutzen: Der Aufruf muss den Header `x-amz-bypass-governance-retention: true` mitführen. Die Konsole setzt ihn automatisch, wenn der Aufrufer das Recht besitzt — was heißt, dass Governance Mode für einen Angreifer mit Admin-Rechten ein Klick ist.

## Die ehrliche Feinheit

**Erstens die Kehrseite von Compliance, die zur ehrlichen Antwort dazugehört: Ein Irrtum ist irreversibel.** Wer aus Versehen sieben Jahre statt sieben Tage setzt, hat sieben Jahre. Es gibt keinen Support-Weg, keine Ausnahme, keine Kulanz. Und ein Löschbegehren nach DSGVO lässt sich für eine gesperrte Version nicht erfüllen — die beiden Anforderungen widersprechen sich, und Compliance Mode entscheidet den Widerspruch zugunsten der Aufbewahrung. Vorher mit einem Test-Bucket und einer Frist von einem Tag üben.

**Zweitens ein Widerspruch, der zwei Empfehlungen dieser Karte gegeneinanderstellt.** Die Doku sagt: MFA Delete kann nicht zusammen mit Lifecycle-Konfigurationen verwendet werden. Setzt du MFA Delete auf einen Bucket, der bereits eine Lifecycle-Regel trägt, scheitert der Aufruf mit `InvalidBucketState`.

Das trifft direkt die naheliegende Aufräumstrategie. Jede Version kostet Speicher, und bei nächtlichen Backups summiert sich das; normalerweise räumt eine Lifecycle-Regel mit `NoncurrentVersionExpiration` auf. Beides zusammen geht nicht. Du entscheidest dich für eines:

- **Lifecycle** — Aufräumen automatisiert, kein MFA Delete auf diesem Bucket.
- **MFA Delete** — zusätzliche Hürde für endgültige Löschungen, Aufräumen von Hand oder über Batch Operations.

Gesperrte Versionen kann eine Lifecycle-Regel ohnehin nicht löschen; sie verschwinden erst nach Fristablauf. Lifecycle läuft auf geschützten Objekten normal weiter, darf Delete Marker setzen und Speicherklassen wechseln — nur die geschützte Version selbst bleibt unberührt, und Object Lock bleibt über jeden Klassenwechsel hinweg erhalten.

**Drittens ein Angriffspfad, den Object Lock offen lässt.** Die Doku ist an dieser Stelle ungewöhnlich deutlich: Object Lock verhindert Löschen und Überschreiben, schützt aber nicht davor, den Zugang zu den Verschlüsselungsschlüsseln zu verlieren. Sind die Objekte mit SSE-KMS verschlüsselt und wird der KMS-Key gelöscht, können die Objekte unlesbar werden.

Die Version liegt dann unantastbar sieben Jahre im Bucket, und niemand kann sie mehr entschlüsseln. Wer Compliance Mode ernst meint, muss die Schlüsselverwaltung mit derselben Ernsthaftigkeit behandeln wie den Bucket.

## Syntax lesen — was `head-object` verrät

Die schnellste Prüfung, ob ein Objekt wirklich geschützt ist, ist ein `head-object`. Die relevanten Felder:

```
"ObjectLockMode":            "COMPLIANCE"   ← COMPLIANCE | GOVERNANCE | (fehlt)
"ObjectLockRetainUntilDate": "2033-07-29…"  ← bis dahin gesperrt
"ObjectLockLegalHoldStatus": "OFF"          ← ON blockiert unabhängig vom Datum
"VersionId":                 "3sL9x.mZq…"   ← DAS ist das geschützte Ding
```

Drei Lesarten, die du beherrschen solltest:

**Felder fehlen ganz** → Diese Version trägt keine Sperre. Der Bucket kann Object Lock aktiviert haben und die Version trotzdem ungeschützt sein, etwa weil sie vor dem Einschalten der Default Retention geschrieben wurde.

**`LegalHoldStatus: ON` bei abgelaufenem `RetainUntilDate`** → immer noch gesperrt. Der Legal Hold hat kein Datum und überlebt die Frist.

**`ObjectLockMode: GOVERNANCE`** → die Sperre ist mit dem passenden Recht aushebelbar. Für die Anforderung „auch der Administrator nicht" ist das die falsche Antwort.

Um sie zu sehen, brauchst du übrigens Rechte: `s3:GetObjectRetention` für Modus und Frist, `s3:GetObjectLegalHold` für den Hold.

## Was du dadurch nicht baust

- keinen Agenten auf dem Backup-Server und keine Änderung am Sicherungswerkzeug
- keine Software, die Löschversuche abfängt — S3 weist sie selbst ab
- keinen Restore-Vorgang und keine Wiederherstellungswartezeit
- keine IAM-Policy, auf deren Korrektheit der Schutz beruht
- keine Möglichkeit, einen Irrtum zurückzunehmen
- kein automatisches Aufräumen alter Versionen, solange MFA Delete aktiv ist

Übrig bleiben: eine Bucket-Konfiguration, ein separater Account und ein Protokoll, das zeigt, dass jemand gescheitert ist.

## Wenn du dir eine Sache merkst

**Versioning bewahrt auf, Object Lock verbietet das Löschen, MFA Delete schützt die Konfiguration — und geschützt ist immer die Version, nie der Schlüssel.**

Steht in der Frage „auch ein Administrator" oder „auch der Root-Benutzer darf nicht löschen können", ist die Antwort Compliance Mode. Governance Mode wäre mit dem passenden Recht aushebelbar, und ein Angreifer mit Admin-Rechten hat dieses Recht meistens.

## Prüfungsknackpunkte

**Signalwörter:** *WORM*, *unveränderlich / immutable*, *revisionssicher*, *auch nicht durch den Root-Benutzer*, *Ransomware*, *Innentäter*, *gesetzliche Aufbewahrungsfrist*.

**Warum Governance Mode hier verliert:** Es sperrt nur den aus, der `s3:BypassGovernanceRetention` nicht hat. Die Frage sagt ausdrücklich „auch mit Administrator-Zugangsdaten" — und damit ist der Notausgang das Ausschlusskriterium, nicht das Feature.

**Warum eine Bucket Policy mit `Deny` hier verliert:** Sie ist eine Berechtigungsregel, und Berechtigungsregeln lassen sich von dem ändern, der die Berechtigung dazu hat. Object Lock ist keine Berechtigungsregel — es wird unabhängig von der IAM-Auswertung durchgesetzt.

**Warum Versioning allein hier verliert:** Es schützt vor dem einfachen `DELETE`, nicht vor `DeleteObjectVersion`. Ein Angreifer mit Admin-Rechten löscht Version für Version, und Versionierung sieht dabei zu.

**Warum Glacier Deep Archive hier verliert — der Querverweis auf Karte 11:** Eine Speicherklasse ist eine Preisentscheidung, keine Schutzentscheidung. **Kosten sind nicht Unveränderbarkeit.** Karte 11 beantwortet „sieben Jahre aufbewahren, möglichst billig", diese Karte beantwortet „sieben Jahre aufbewahren, unlöschbar". Wer die Frage nach Unveränderbarkeit mit einer Speicherklasse beantwortet, hat die falsche Achse erwischt — beide zusammen sind übrigens möglich, denn Object Lock bleibt über Lifecycle-Transitionen hinweg bestehen.

**Die Falle mit dem Delete Marker.** Auch in einem Object-Lock-Bucket darf ein `DELETE` ohne `versionId` weiterhin einen Delete Marker setzen. Das ist kein Loch im Schutz — die gesperrte Version liegt unverändert darunter. Panik an dieser Stelle ist die eigentliche Falle.

**Die veraltete Aussage, die in vielen Lernmaterialien noch steht:** „Object Lock geht nur bei neuen Buckets." Das war bis zum 20. November 2023 richtig. Seitdem lässt es sich auch auf bestehenden Buckets einschalten, ohne Support-Ticket. Zwei Einschränkungen bleiben: Versionierung muss aktiv sein, und rückwirkend gesperrt wird nichts.
