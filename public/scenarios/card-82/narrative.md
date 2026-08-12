---
cardNumber: 82
slug: aws-backup-vault-lock-zentral
title: "AWS Backup — zentral über Accounts"
services: ["AWS Backup", "AWS Backup Vault Lock", "AWS Organizations", "Amazon S3", "Amazon EBS", "Amazon RDS"]
domains: ["D1", "D2"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html"
  - "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-properties-backup-backupvault-lockconfigurationtype.html"
  - "https://docs.aws.amazon.com/aws-backup/latest/devguide/API_Lifecycle.html"
  - "https://docs.aws.amazon.com/aws-backup/latest/devguide/plan-options-and-configuration.html"
  - "https://docs.aws.amazon.com/aws-backup/latest/devguide/creating-a-backup-plan.html"
  - "https://docs.aws.amazon.com/prescriptive-guidance/latest/security-best-practices/safeguard.html"
  - "https://aws.amazon.com/about-aws/whats-new/2022/11/aws-backup-delegation-organization-wide-backup-administration"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/aws-backup-direct-to-logically-air-gapped-vault"
---

## Die Grundidee zuerst

Ein Medizintechnik-Hersteller muss dem Prüfer zeigen, dass die Backups aus 40 AWS-Accounts sieben Jahre lang unverändert vorliegen — auch dann, wenn jemand einen Administrator-Account übernimmt.

**Der alte Weg:** In jedem der 40 Häuser steht ein Tresor. Jedes Team hat seinen eigenen, jedes hat einen eigenen Schlüssel, jedes hat eigene Regeln aufgeschrieben. Der Prüfer will einen Nachweis und bekommt 40 Antworten, von denen sechs lauten „ich schau mal nach". Und jeder, der den Hausschlüssel hat, hat auch den Tresorschlüssel — dieselbe Person, die die Daten anlegt, kann sie löschen.

**Der neue Weg:** Es gibt weiterhin 40 Häuser, aber die Hausordnung wird einmal zentral geschrieben und hängt in jedem Haus. Was gesichert wird, entscheidet nicht eine Liste, sondern ein Aufkleber am Regal. Und die Zweitschrift jedes Dokuments wandert in ein Depot in einer anderen Stadt, das dem Hausmeister **nicht** gehört und dessen Schloss nach drei Tagen zuschnappt — für alle, für immer, auch für den Depotbetreiber.

Der ganze Rest der Karte erklärt zwei Dinge: warum die Zweitschrift ein eigener Schritt ist, und warum es zwei Schlösser gibt, von denen nur eines wirklich schließt.

## Was es eigentlich ist — die Regel

Der Backup Plan ist kein Programm und kein Zeitplan-Dienst. Er ist eine Liste von Regeln, und eine Regel besteht im Kern aus zwei Dingen: wann, und wie lange.

```json
{
  "RuleName": "taeglich-7-jahre",
  "TargetBackupVaultName": "vault-workload-local",
  "ScheduleExpression": "cron(0 2 ? * * *)",
  "ScheduleExpressionTimezone": "Europe/Berlin",
  "StartWindowMinutes": 60,
  "CompletionWindowMinutes": 600,
  "Lifecycle": {
    "MoveToColdStorageAfterDays": 30,
    "DeleteAfterDays": 2555
  },
  "CopyActions": [
    {
      "DestinationBackupVaultArn":
        "arn:aws:backup:eu-west-1:999988887777:backup-vault:vault-central",
      "Lifecycle": { "MoveToColdStorageAfterDays": 30, "DeleteAfterDays": 2555 }
    }
  ]
}
```

Lies das von oben nach unten, es ist die komplette Lösung der Aufgabe:

- `TargetBackupVaultName` — ein Vault-**Name**, kein ARN. Das ist kein Zufall: Das Ziel liegt zwingend im selben Account.
- `Lifecycle` — 30 Tage warm, danach cold, gelöscht nach 2555 Tagen. 2555 Tage sind sieben Jahre.
- `CopyActions[0].DestinationBackupVaultArn` — hier steht ein **ARN** mit einer fremden Account-ID und einer anderen Region. Erst hier verlässt das Backup den Workload-Account.
- Die Copy Action hat ihren **eigenen** Lifecycle. Die Kopie kann länger leben als das Original.

Der Unterschied zwischen Name und ARN in diesen zwei Feldern ist die eigentliche Lehre der Karte.

## Der Weg durch die Karte

### AWS Organizations — die Hausordnung

Die Backup Policy wird einmal definiert und an die Organisationseinheiten vererbt. Die Ressourcenauswahl läuft über **Tags**, nicht über Listen einzelner ARNs.

Das ist der eigentliche Gewinn gegenüber Eigenbau, und er zeigt sich erst in zwei Jahren: Ein neues Team bekommt einen neuen Account, setzt seine Tags, und ist am ersten Tag abgedeckt. Niemand muss daran denken. Bei 40 Accounts ist „niemand muss daran denken" der Unterschied zwischen einer Richtlinie und einer Hoffnung.

Die Verwaltung lässt sich an einen **delegierten Administrator-Account** übertragen. AWS hat das im November 2022 ausdrücklich dafür freigegeben, damit Backup-Administratoren nicht mehr im Management-Account arbeiten müssen — delegierte Administratoren können Backup Policies anlegen, verwalten und die kontenübergreifende Überwachung nutzen.

### Badge 1 — die Vererbung nach unten

Der goldene Pfeil von Organizations in den Workload-Account ist keine Datenbewegung. Es ist eine **Steuerungsbewegung**: Die Policy wandert nach unten, nicht das Backup nach oben.

Das ist der Grund für die zwei Pfeilfarben auf dieser Karte. Gold = Steuerung. Navy = Daten. Wer den goldenen Pfeil als Datenfluss liest, sucht anschließend das Backup im Management-Account.

Ein Detail aus der Doku, das im Alltag beißt: Bei Plänen, die von Organizations verwaltet werden, überschreiben die Resource-Opt-in-Einstellungen des Management-Accounts die des Mitgliedskontos — auch dann, wenn ein delegierter Administrator konfiguriert ist. Der delegierte Administrator ist ein Mitgliedskonto mit erweiterten Rechten, kein zweites Management-Konto.

### Backup Plan — läuft dort, wo die Ressourcen liegen

Der Plan wird zentral definiert, aber er **läuft** im Workload-Account. Das ist keine Feinheit, sondern die Erklärung für alles, was danach kommt.

Das Bild dazu: Die Hausordnung hängt in jedem Haus. Gekehrt wird trotzdem in jedem Haus einzeln.

### Badge 2 — der Backup-Job entsteht lokal

Der Job läuft, greift die getaggten Ressourcen ab und schreibt einen Recovery Point. Wohin? In den lokalen Vault. Immer.

### Lokaler Vault — der Punkt, an dem viele Entwürfe scheitern

**Der Recovery Point entsteht zuerst im Quell-Account.** Du kannst ein Backup nicht direkt in einen fremden Account schreiben. Es gibt kein Feld dafür — siehe das JSON oben, `TargetBackupVaultName` nimmt einen Namen und keinen fremden ARN.

Warum ist das so wichtig? Weil ein Angreifer, der den Workload-Account übernimmt, genau hier alles findet: die Ressourcen **und** ihre Backups, im selben Konto, unter derselben IAM-Kontrolle. Der lokale Vault überlebt die Kompromittierung des Workload-Accounts nicht.

Hier steht auf der Karte außerdem die Cold-Storage-Bedingung, und die ist eine Rechenfalle: Backups, die in Cold Storage überführt werden, müssen dort **mindestens 90 Tage** bleiben. Die Retention muss also 90 Tage **über** dem Transitionswert liegen. Wer 30 Tage warm und 60 Tage gesamt einstellt, bekommt keinen Fehler beim Nachdenken, sondern beim Backup.

### Badge 3 — die Copy Action

Erst dieser Pfeil verlässt den Account. Die Copy Action legt eine Kopie im zentralen Vault des Backup-Accounts ab, und dabei gleich in einer zweiten Region.

Zwei Trennungen in einem Schritt: **andere Vertrauensgrenze** (der Angreifer im Workload-Account kommt nicht heran) und **andere Region** (der Regionsausfall trifft die Kopie nicht). Das ist der Grund, warum diese Karte in D1 und D2 gleichzeitig liegt.

### Zentraler Vault — die Kopie, die überlebt

Der Vault im Backup-Account ist das, was der Prüfer eigentlich sehen will. Er liegt in einem Konto, in dem keine Workloads laufen, dessen einziger Zweck Aufbewahrung ist und dessen Zugriffsrechte man an einer Hand abzählen kann.

Bis hierher ist das gute Architektur. Ein Nachweis ist es noch nicht — denn wer im Backup-Account genug IAM-Rechte hat, kann noch immer löschen.

### Badge 4 — den Vault verschließen

Der letzte Pfeil ist wieder golden, weil er Steuerung ist und keine Daten bewegt. Er setzt eine Lock-Konfiguration auf einen bestehenden Vault.

### Vault Lock — Compliance Mode, und was danach nicht mehr geht

Der zentrale Vault wird im **Compliance Mode** verschlossen. Es gibt eine Grace Time, die AWS als Cooling-off-Periode von mindestens **drei Tagen (72 Stunden)** erzwingt — in der API heißt der Parameter `ChangeableForDays` und muss 3 oder größer sein. Bis zum Lock-Datum lässt sich der Lock noch entfernen oder ändern.

Danach: Der Vault und sein Lock sind unveränderlich und können **von keinem Benutzer und nicht von AWS** geändert oder gelöscht werden. Das ist der Teil, der den Nachweis gegenüber dem Prüfer trägt.

Und derselbe Absatz der Doku enthält die Warnung dazu: Backups in einem verschlossenen Vault können bis zum Ende ihres Lifecycles nicht gelöscht werden, was zu dauerhaften Kosten führt, wenn man nicht aufpasst. AWS nennt das Beispiel ausdrücklich — Recovery Points mit der Retention „Always" bleiben nach Ablauf der Grace Time **für immer** erhalten.

### ✗ Verworfen — Governance Mode als Schutz vor Ransomware

Im Governance Mode kann jeder Benutzer mit ausreichenden IAM-Rechten den Lock wieder entfernen. Genau gegen das Angriffsbild, um das es hier geht — der Angreifer *hat* Administratorrechte —, schützt er also nicht.

Der Governance Mode ist eine Leitplanke gegen Versehen, kein Schloss gegen Absicht. In der API erkennst du ihn daran, dass `ChangeableForDays` fehlt.

## Die entscheidende Unterscheidung

| | Governance Mode | Compliance Mode |
|---|---|---|
| Lock entfernbar durch | Benutzer mit ausreichenden IAM-Rechten | niemanden, auch nicht AWS |
| API-Merkmal | `ChangeableForDays` **weglassen** | `ChangeableForDays` **setzen** (≥ 3) |
| Grace Time | keine | mindestens 72 Stunden |
| Schützt gegen | Versehen, unbefugte Änderung | Löschung durch privilegierte Benutzer |
| Fehlkonfiguration | korrigierbar | bleibt stehen und kostet |
| Taugt als Nachweis | nein | ja — mit Einschränkung, siehe unten |

## Die ehrliche Feinheit

**Erstens: „unveränderlich" ist präziser gemeint, als es klingt.** Der *Lock* im Compliance Mode kann nicht mehr entfernt werden. Der *Vault* selbst kann laut Doku dennoch gelöscht werden — wenn er leer ist und keine Recovery Points enthält. Für den Nachweis ändert das nichts, aber die Aussage „der Vault ist für immer da" ist falsch. Richtig ist: Solange ein Recovery Point darin liegt, geht nichts weg.

**Zweitens, und das ist für das Szenario dieser Karte wichtig:** AWS Prescriptive Guidance hält ausdrücklich fest, dass AWS Backup Vault Lock **nicht** gegen SEC-Regel 17a-4(f) und CFTC 17 C.F.R. 1.31(b)-(c) bewertet wurde. Wenn dein Prüfer nach einer dieser Regularien fragt, ist Vault Lock ein starkes technisches Argument und kein Zertifikat. Auf die Karte gehört das nicht — in ein Auditgespräch schon.

**Drittens: „das Backup entsteht immer zuerst lokal" hat seit November 2025 eine Ausnahme.** AWS Backup kann einen **logically air-gapped vault** als primäres Backup-Ziel annehmen. Bei vollständig verwalteten Ressourcentypen — Amazon S3, DynamoDB, EFS — wird direkt dorthin geschrieben, ohne Zwischenkopie. Bei den übrigen — EBS, Aurora, FSx — legt AWS Backup weiterhin einen temporären Snapshot im Quell-Account an, kopiert ihn und räumt ihn wieder ab.

Für Standard-Vaults in einem fremden Account, also für genau das Bild auf dieser Karte, gilt die Kartenaussage unverändert: erst lokal, dann Copy Action. Der logically air-gapped vault ist eine dritte Vault-Art in einem AWS-eigenen Konto, kein Gegenbeispiel — aber wer die Regel als Naturgesetz auswendig lernt, stolpert über die Ausnahme.

**Viertens: die 8-Tage-Empfehlung, die niemand kennt.** AWS empfiehlt, Backups frühestens nach 8 Tagen in Cold Storage zu überführen. Grund: Bei Ressourcentypen mit inkrementellen Backups muss mindestens ein warmes Vollbackup existieren. Wird das Vollbackup zu früh in Cold Storage geschoben — etwa nach einem Tag —, erzeugt AWS Backup ein weiteres warmes Vollbackup. Du sparst also nichts, du bezahlst zweimal.

**Fünftens, eine offene Baustelle:** AWS Backup hat inzwischen eine weitere Schutzschicht, **Multi-party approval**, die den Zugriff auf Vaults auch dann absichern soll, wenn Backup- oder Management-Account kompromittiert sind. Sie steht bewusst nicht auf dieser Karte — sie würde den Ablauf überladen —, ist aber der logische nächste Schritt nach dem Compliance Mode.

## Syntax lesen — die Organizations Backup Policy

Der eine Ort in diesem Szenario, an dem echte Syntax steht, ist die Policy in Organizations. Sie sieht aus wie JSON, verhält sich aber wie ein Vererbungsdokument — und die Doppel-At-Operatoren sind das, was man lesen können muss:

```
{
  "plans": {
    "org-plan-7y": {
      "regions":  { "@@assign": ["eu-central-1"] },
      "rules": {
        "taeglich": {
          "schedule_expression":     { "@@assign": "cron(0 2 ? * * *)" },
          "target_backup_vault_name":{ "@@assign": "vault-workload-local" },
          "lifecycle": {
            "move_to_cold_storage_after_days": { "@@assign": "30"   },
            "delete_after_days":               { "@@assign": "2555" }
          },
          "copy_actions": {
            "arn:aws:backup:eu-west-1:999988887777:backup-vault:vault-central": {
              "target_backup_vault_arn": { "@@assign": "arn:aws:backup:..." }
            }
          }
        }
      },
      "selections": {
        "tags": {
          "getaggt-fuer-backup": {
            "iam_role_arn": { "@@assign": "arn:aws:iam::$account:role/BackupRole" },
            "tag_key":      { "@@assign": "backup" },
            "tag_value":    { "@@assign": ["ja"] }
          }
        }
      }
    }
  }
}
```

Drei Dinge zum Entziffern:

```
"@@assign"           →  setzt den Wert und überschreibt geerbte Werte
"@@append"           →  hängt an eine geerbte Liste an
"$account"           →  wird je Mitgliedskonto ersetzt
"selections.tags"    →  KEINE Liste von Ressourcen, sondern eine Bedingung
```

Der letzte Punkt ist der wichtigste im ganzen Dokument. Unter `selections` steht kein einziger ARN. Es steht dort eine Bedingung: „alles, was `backup=ja` trägt". Deshalb ist ein neuer Account am ersten Tag abgedeckt — nicht weil ihn jemand eingetragen hat, sondern weil niemand ihn eintragen muss.

## Was du dadurch nicht baust

- **Keine Wiederherstellung.** Restore und Restore Testing sind auf der Karte nicht dargestellt. Ein Backup, das nie zurückgespielt wurde, ist eine Vermutung.
- **Keine OU-Struktur.** Die 40 Accounts stehen als eine Zone. Wie die Organisationseinheiten geschnitten sind, entscheidet in der Praxis, wer welche Policy erbt.
- **Keine IAM-Rolle im Bild.** AWS Backup nimmt für Backup und Copy eine Service-Rolle an; sie ist weggelassen, existiert aber und ist der häufigste Grund für fehlschlagende Jobs.
- **Keinen Schutz vor Datenverfälschung *innerhalb* der Retention.** Ein Recovery Point von gestern hilft nicht, wenn die Korruption vorgestern begann.
- **Keine Verschlüsselungsdiskussion.** Wer den KMS-Key hält, ist bei kontenübergreifenden Kopien eine eigene Frage.
- **Keinen Ersatz für die Wiederanlaufplanung.** Diese Karte beantwortet die Aufbewahrungsfrage.

## Wenn du dir eine Sache merkst

**Nur der Compliance Mode macht Backups unveränderlich; der Governance Mode lässt sich von jedem mit ausreichenden IAM-Rechten wieder aufheben.**

Warum die üblichen Alternativen fallen: „S3 Object Lock" sichert Objekte in einem Bucket — gleiches Prinzip, andere Reichweite; Vault Lock sichert Recovery Points über viele Dienste hinweg. „Ein Backup-Konto ohne Lock" schützt gegen den kompromittierten Workload-Account, aber nicht gegen den kompromittierten Backup-Account. „SCPs gegen Löschen" sind eine Leitplanke im selben Modell wie Governance Mode — wer die Policy ändern kann, kann sie auch entfernen.

## Prüfungsknackpunkte

**Signalwörter:** „centrally manage backups across accounts" zeigt auf Organizations plus Backup Policy. „Cannot be deleted or altered", „not even by the root user" und „regulatory retention" zeigen ausnahmslos auf Compliance Mode. Steht „protect against accidental deletion" ohne den Zusatz zu privilegierten Benutzern, kann Governance Mode ausreichen — das ist die einzige Stelle, an der er gewinnt.

**Backup direkt in den zentralen Account schreiben.** Geht nicht. Erst lokaler Recovery Point, dann Copy Action. Antwortoptionen, die diesen Zwischenschritt weglassen, sind falsch.

**Cold Storage falsch rechnen.** Retention muss mindestens 90 Tage über dem Transitionswert liegen. Eine Antwortoption mit „30 Tage warm, 60 Tage gesamt" ist arithmetisch ausgeschlossen.

**Compliance Mode aus Versehen scharf schalten.** Nach Ablauf der Grace Time bleibt jede Fehlkonfiguration stehen — inklusive der Kosten. Deshalb testet man im Governance Mode und schaltet erst danach um.

**Governance Mode für regulatorische Nachweise nehmen.** Genügt nicht, sobald der Prüfer nach Schutz vor privilegierten Benutzern fragt.

**Warum AWS Backup und nicht ein Lambda mit Snapshot-Skript:** Das Skript deckt keine neuen Accounts ab, kennt keine Tags über Kontogrenzen, hat kein Vault Lock und keinen Auditbericht. Der Nachweis entsteht nicht aus den Snapshots, sondern aus der zentral erzwungenen Regel.

**Warum S3 Versioning hier verliert:** Versionierung schützt Objekte in einem Bucket gegen Überschreiben, nicht EBS-Volumes und RDS-Datenbanken aus 40 Accounts — und ein Benutzer mit ausreichenden Rechten kann Versionen dauerhaft löschen.
