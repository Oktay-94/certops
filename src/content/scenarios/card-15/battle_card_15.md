---
nr: 15
title: "Ransomware-sichere Backups — Versioning, Object Lock, MFA Delete"
services:
  - S3 Versioning
  - S3 Object Lock (Governance / Compliance / Legal Hold)
  - MFA Delete
  - S3 Batch Operations
  - S3 Replication
  - AWS Backup Vault Lock
signalwords:
  - "WORM / unveränderlich"
  - "auch ein Administrator darf nicht löschen können"
  - "Ransomware oder Innentäter"
  - "gesetzliche Aufbewahrung, revisionssicher"
  - "auch nicht mit Root-Zugang"
domain: "D1 Secure Architectures (primär) · D2 Resilient Architectures (Wiederherstellbarkeit)"
assets:
  - battle_card_15.svg
  - battle_card_15.png
  - battle_card_15.pdf
status_note: "Sichtprüfung des gerenderten PNG durch Chat-Claude nicht möglich (view liefert leeres Bild) — rechnerische QC grün, optische Freigabe durch Oktay ausstehend."
---

# Battle Card 15 — S3 Versioning · Object Lock · MFA Delete

**Services:** S3 Versioning, S3 Object Lock (Governance Mode, Compliance Mode, Legal Hold), MFA Delete, S3 Batch Operations, S3 Replication, AWS Backup Vault Lock, CloudTrail

**Szenario:**
Bei den **Stadtwerken Lippetal** hat ein Nachbarversorger einen Ransomware-Vorfall überstanden — knapp: Die Angreifer hatten zuerst die **Backups** gelöscht und danach verschlüsselt. Die Geschäftsführung will hören, dass genau das hier nicht passieren kann. Die nächtlichen Backups von ERP und Abrechnung liegen in S3. Die Anforderung ist bewusst hart formuliert: **Selbst wer gültige Administrator-Zugangsdaten besitzt, darf ein Backup nicht löschen, nicht überschreiben und die Schutzfrist nicht verkürzen können.** Die Aufbewahrung beträgt sieben Jahre, und der Wirtschaftsprüfer verlangt **WORM** (Write Once Read Many).

Signalwörter der Prüfung: *WORM* · *unveränderlich / immutable* · *auch nicht durch den Root-Benutzer* · *Ransomware* · *revisionssicher* · *Compliance-Mode*.

---

## Ablauf

**1 — Der Backup-Job schreibt ganz normal per PUT.**
Kein Agent, kein Sonderweg, keine Anpassung des Backup-Werkzeugs. Der gesamte Schutz liegt in der Bucket-Konfiguration, nicht in der schreibenden Anwendung. Das ist auch der Grund, warum diese Lösung gegen einen kompromittierten Backup-Server hilft: Der Server *darf* schreiben — er darf nur nichts mehr wegnehmen.

**S3 Versioning ist die Voraussetzung, nicht die Lösung.**
Mit Versionierung erzeugt jeder PUT auf denselben Key eine **neue Version mit eigener `versionId`**; alte Versionen bleiben liegen. Ein `DELETE` ohne `versionId` löscht deshalb nichts, sondern setzt nur einen **Delete Marker** — das Objekt verschwindet aus der normalen Auflistung, die Daten sind aber unangetastet. Der entscheidende Satz für die Prüfung steht kursiv in der Box: **Object Lock schützt Objektversionen, nicht Schlüssel.** Ohne Versionierung gibt es keine Versionen, die man sperren könnte, und damit auch kein Object Lock. Wer Object Lock per API oder CLI einschaltet, bekommt Versioning automatisch mit aktiviert.

**2 — Object Lock im Compliance Mode setzt ein Retain Until Date auf jede Version.**
Über eine **Default Retention** am Bucket bekommt jedes neu geschriebene Objekt automatisch seine Frist — hier sieben Jahre. Bis dahin lässt sich diese Version **weder löschen noch überschreiben, und die Frist lässt sich nicht verkürzen**: nicht durch einen Administrator, nicht durch den Bucket-Eigentümer, nicht durch den Root-Benutzer. Die einzige Möglichkeit, eine Version im Compliance Mode vor Ablauf loszuwerden, ist, das gesamte AWS-Konto zu schließen. **Legal Hold** ist die zweite Sperre: derselbe Schutz, aber **ohne Ablaufdatum** — er gilt, bis ihn jemand mit dem Recht `s3:PutObjectLegalHold` wieder entfernt. Beide Mechanismen sind unabhängig voneinander und wirken gleichzeitig.

**3 — Die Wiederherstellung ist unspektakulär, und das ist der Punkt.**
Nach dem Vorfall holt man per `GET` mit der `versionId` die letzte saubere Version — oder entfernt schlicht den Delete Marker, wenn nur „gelöscht" wurde. Es gibt keinen Restore-Vorgang, keine Wartezeit, keine Verhandlung. Der Angriff hat die Daten nie erreicht.

**4 — Der Angreifer versucht, die Objekte zu vernichten — und scheitert.**
Mit erbeuteten Admin-Rechten sind `DeleteObjectVersion` (die *echte* Löschung einer bestimmten Version) und `PutObjectRetention` (Frist verkürzen) die beiden naheliegenden Züge. Im Compliance Mode werden **beide abgewiesen**, unabhängig von der IAM-Policy. Genau deshalb ist der Angreifer im Diagramm gestrichelt gezeichnet und der Pfeil endet an einem roten X: Er hat gültige Rechte — sie nützen ihm nur nichts.

**5 — Der zweite Angriff zielt auf die Konfiguration, MFA Delete hält ihn auf.**
Der klügere Angriff versucht nicht, Objekte zu löschen, sondern **die Versionierung abzuschalten** (`PutBucketVersioning` mit Status `Suspended`). Dagegen wirkt **MFA Delete**: Es verlangt für das Ändern des Versionierungszustands und für das endgültige Löschen einer Version einen **gültigen MFA-Code**. Zwei Details, die gern geprüft werden: MFA Delete kann **nur der Bucket-Eigentümer, also der Root-Benutzer** einschalten, und **nur über CLI, SDK oder API** — in der Konsole geht es nicht.

**Zusätzliche Schichten (rechte untere Box).**
Object Lock ist die technische Sperre, aber nicht die ganze Verteidigung. Backups gehören in einen **eigenen AWS-Account**, zu dem die kompromittierten Anmeldedaten keinen Zugang haben — das schützt auch gegen den Fall, dass jemand das Konto schließen will. **S3 Replication** funktioniert seit 2023 auch mit Object-Lock-Buckets und repliziert die Sperren mit, sodass eine unveränderliche Zweitkopie in einer anderen Region oder einem anderen Account entsteht. Für Sicherungen über AWS Backup ist **Vault Lock** das Gegenstück. Und **CloudTrail Data Events** protokollieren jeden Löschversuch — sonst bemerkt niemand, dass gerade jemand am Backup gescheitert ist.

---

## Prüfungs-Kernsatz

> **Versioning bewahrt auf, Object Lock verbietet das Löschen, MFA Delete schützt die Konfiguration.** Steht in der Frage „auch ein Administrator" oder „auch der Root-Benutzer darf nicht löschen können", ist die Antwort **Compliance Mode** — Governance Mode wäre mit dem passenden Recht aushebelbar.

---

## Klassiker-Fallen

**1. Governance statt Compliance ankreuzen.**
Governance Mode sperrt nur diejenigen aus, die **kein** `s3:BypassGovernanceRetention` haben. Wer diese Berechtigung besitzt — und ein Angreifer mit Admin-Rechten hat sie meist —, kann die Sperre aufheben. Governance ist die richtige Antwort bei „Schutz vor **versehentlichem** Löschen mit Notausgang", Compliance bei „**regulatorisch** unveränderlich". Die Kehrseite von Compliance gehört zur ehrlichen Antwort dazu: Ein Irrtum ist irreversibel, und ein DSGVO-Löschbegehren lässt sich für eine gesperrte Version nicht erfüllen. Vorher mit einem Test-Bucket und kurzer Frist üben.

**2. „Object Lock geht nur bei neuen Buckets."**
Das war bis November 2023 richtig und steht bis heute in vielen Lernmaterialien. **Seitdem lässt sich Object Lock auch auf bestehenden Buckets einschalten** (Konsole, CLI, API — kein Support-Ticket mehr). Zwei Einschränkungen bleiben: Versionierung muss aktiv sein, und das Einschalten sperrt **rückwirkend nichts** — bereits vorhandene Objekte bekommen ihre Retention erst über `PutObjectRetention` je Objekt oder, bei großen Beständen, über **S3 Batch Operations** auf Basis eines S3-Inventory-Reports.

**3. Den Delete Marker mit Datenverlust verwechseln.**
Auch in einem Object-Lock-Bucket darf ein `DELETE` **ohne** `versionId` weiterhin einen Delete Marker setzen — das ist kein Fehler und kein Loch im Schutz. Das Objekt ist danach in der Standard-Auflistung unsichtbar, die gesperrte Version liegt unverändert darunter. Wer den Marker entfernt, sieht die Datei sofort wieder. Panik an dieser Stelle ist die eigentliche Falle.

**4. Versioning ohne Aufräumplan.**
Jede Version kostet Speicher, und bei nächtlichen Backups summiert sich das. Normalerweise räumt eine Lifecycle-Regel mit `NoncurrentVersionExpiration` auf — **gesperrte Versionen kann sie aber nicht löschen**, sie verschwinden erst nach Ablauf der Retention. Aufbewahrungsfrist und Speicherklasse (etwa Übergang nach Glacier Deep Archive, Karte 11) müssen deshalb zusammen geplant werden, sonst ist der Schutz zwar wasserdicht, aber unnötig teuer.

---

## Bewusste Vereinfachungen im Diagramm

- **Es ist nur ein Objekt mit einer Sperre gezeichnet**, in Wirklichkeit trägt jede Version ihr eigenes `Retain Until Date`. Der Versionsstapel selbst (v1, v2, v3, Delete Marker) ist nicht als Grafik dargestellt, sondern nur beschrieben.
- **Der Weg zur Sperre ist als „Default Retention" abgekürzt.** Eine Retention kann auch pro `PUT` mitgegeben werden und überschreibt dann die Bucket-Vorgabe; nachträglich läuft es über `PutObjectRetention` oder S3 Batch Operations.
- **MFA Delete und Object Lock stehen im Bild nebeneinander, sind aber unabhängige Funktionen.** MFA Delete braucht kein Object Lock und umgekehrt; sie schützen verschiedene Angriffsflächen (Konfiguration vs. Objektversionen).
- **Der separate Backup-Account ist nur als Zonentitel und Textzeile vorhanden**, nicht als eigene Account-Grenze mit IAM-Rollen und SCPs gezeichnet.
- **Verschlüsselung (SSE-KMS), Bucket Policies mit `Deny` auf Löschaktionen und Block Public Access** sind nicht dargestellt. Sie gehören in ein echtes Backup-Design, beantworten aber nicht die Frage dieser Karte.
