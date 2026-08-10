---
cardNumber: 30
slug: qldb-aurora-object-lock-rheinkontor-verifizierbare-historie
title: "Verifizierbare Änderungshistorie — QLDB, Aurora PostgreSQL, S3 Object Lock"
services: ["Amazon QLDB", "Amazon Aurora PostgreSQL", "Amazon S3 Object Lock"]
domains: ["D1", "D2"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/pdfs/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.pdf"
  - "https://aws.amazon.com/jp/blogs/news/migration-from-amazon-qldb/"
  - "https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide_C03.pdf"
  - "https://repost.aws/questions/QUaY32ffDmSoajSETUhEfbJg/why-has-aws-decided-to-abandon"
  - "https://techcommunity.microsoft.com/blog/azuresqlblog/moving-from-amazon-quantum-ledger-database-qldb-to-ledger-in-azure-sql/4246237"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Kassenbuch zu führen.

**Art eins: ein Ringbuch.** Jede Seite lässt sich herausnehmen und durch eine andere ersetzen. Ob das passiert ist, siehst du dem Buch nicht an — die Seiten liegen sauber hintereinander, die Handschrift stimmt, die Summen gehen auf. Du kannst nur *hoffen*, dass niemand mit Zugang zum Schrank eine Seite getauscht hat. Wer beweisen will, dass nichts getauscht wurde, muss auf das Schloss am Schrank verweisen, nicht auf das Buch.

**Art zwei: ein Buch, in dem jede Seite oben die Quersumme der vorigen trägt.** Willst du Seite 40 austauschen, musst du 41 bis heute neu schreiben, weil sonst die erste Quersumme nicht mehr passt. Und jeder — auch jemand, der dir nicht vertraut — kann das mit einer Minute Rechnen prüfen.

Der Unterschied zwischen beiden ist nicht Sicherheit gegen Unsicherheit. Er ist **Vertrauen gegen Beweis**.

Rheinkontor Versicherung führt Schadensakten. Bei einem Rechtsstreit muss zehn Jahre später belegbar sein, was wann in der Akte stand — und dass niemand nachträglich etwas geglättet hat. Auch niemand aus dem eigenen Haus. Genau an dieser letzten Einschränkung scheidet sich Art eins von Art zwei.

Deshalb ist diese Karte anders gebaut als die anderen 29. Sie zeigt kein Architekturmuster mit einem Dienst im Zentrum, sondern **drei Antworten auf eine Frage** — und macht den Unterschied zwischen ihnen zum eigentlichen Lehrinhalt.

## Was es eigentlich ist — die Frage, nicht der Dienst

Bevor du irgendeinen Dienst wählst, musst du eine Rückfrage stellen, und die Karte schreibt sie in ihre Fußzeile:

> **Was genau muss bewiesen werden — die Unverändertheit, der Verlauf oder die Aufbewahrung?**

Wie unterschiedlich die Antworten ausfallen, siehst du am besten am dritten Weg, weil er der konkreteste ist. So sieht es aus, wenn du eine Aktenversion nach S3 legst und sie unlöschbar machst:

```json
{
  "Bucket": "rheinkontor-schadensakten",
  "Key": "RK-2019-4471/v7.json",
  "ObjectLockMode": "COMPLIANCE",
  "ObjectLockRetainUntilDate": "2036-03-14T00:00:00Z",
  "ObjectLockLegalHoldStatus": "OFF"
}
```

Lies das und frag dich, was hier eigentlich zugesichert wird.

`ObjectLockMode: COMPLIANCE` heißt: Bis zum Datum kann **niemand** dieses Objekt löschen oder überschreiben. Kein Administrator, kein Root-Benutzer des Kontos, niemand. `GOVERNANCE` wäre die schwächere Variante, bei der ein besonders berechtigtes Konto die Sperre aufheben darf.

`ObjectLockRetainUntilDate` ist eine Aufbewahrungsfrist, kein Beweis. Zehn Jahre sind zugesichert — nicht mehr.

`RK-2019-4471/v7.json` ist der Punkt, an dem es kippt. Das ist Version 7. Ob es eine Version 6 gab, ob zwischen 6 und 7 noch eine andere existierte und wieder verschwand, ob 7 überhaupt aus derselben Bearbeitung stammt — dazu sagt dieser Aufruf **nichts**.

**Object Lock schützt ein Objekt. Ein Ledger schützt eine Reihenfolge.** Das ist der Satz, der die Karte trägt, und er ist der Grund, warum die dritte Spur überhaupt darauf steht.

## Der Weg durch die Karte

### Der Kasten links — die Anforderung

`Schadensakte`, `jede Änderung muss nachweisbar`, `10 Jahre Prüfpflicht`. Von hier gehen drei Pfeile ab, und das ist die erste Besonderheit dieser Karte.

**Die Karte zeigt keinen Datenfluss, sondern eine Entscheidung.** Die drei Pfeile sind Alternativen, keine Schritte nacheinander. Die Nummern 1, 2, 3 geben nur eine Lesereihenfolge vor — sie bedeuten nicht, dass etwas zuerst nach QLDB und danach nach Aurora läuft.

### Badge 1 — Amazon QLDB, grau gestrichelt

Grau gestrichelt ist im Stil-Guide die Behandlung für „extern" und hier für „abgeschaltet, passiv". Der Kasten trägt zwei Zeilen, die einander zu widersprechen scheinen: `Support endete am 31.07.2025 — Dienst abgeschaltet` in Rot und darunter `bleibt die erwartete Prüfungsantwort`.

Beides stimmt gleichzeitig. Dazu weiter unten mehr.

Der Aufbau war die eigentliche Idee: Das **Journal** ist ein Append-only-Protokoll, in dem Transaktionen als Folge von Blöcken angehängt und über Hashes miteinander verkettet werden. Die **Tabellen sind nur Sichten darauf** — nicht die Quelle der Wahrheit, sondern das Ergebnis der Anwendung aller Journal-Einträge.

Lies diesen Satz zweimal, denn er ist die Umkehrung dessen, was du von jeder anderen Datenbank kennst. Sonst ist die Tabelle der Zustand und das Log ein Nebenprodukt. Hier ist das Log der Zustand und die Tabelle das Nebenprodukt. Du kannst keine Zeile ändern, ohne einen neuen Journal-Eintrag zu erzeugen.

### Das Ergebnis rechts — `Beweisbar`

`Digest und Proof zeigen: nichts wurde geändert`, `Vertrauen in den Betreiber nicht nötig`.

Ein **Digest** ist ein kryptografischer Hashwert des Journals zu einem Zeitpunkt. Ein **Proof** ist die Kette der Hashes, die von einem einzelnen Datensatz bis zu diesem Digest führt. Wer beides hat, kann nachrechnen, dass der Datensatz unverändert ist.

Die letzte Zeile ist die entscheidende und in Prüfungsfragen das Signal: Der Beweis hängt **nicht am Vertrauen in den Betreiber**. Nicht in AWS, nicht in die eigene IT-Abteilung, nicht in den Vorstand.

### Badge 2 — Aurora PostgreSQL

`AWS-Empfehlung für die Migration`, `Audit-Log, dauerhafte Aufbewahrung, Extensions`, `Historie als eigene Tabelle geführt`.

AWS empfiehlt Bestandskunden ausdrücklich den Umzug nach Aurora PostgreSQL, das über Extensions ledger-ähnliche Fähigkeiten bietet: Audit-Protokollierung, dauerhafte Log-Aufbewahrung, die Historie als eigene Tabelle.

Achte auf das Wort **ähnlich**.

### Das Ergebnis rechts — `Nur nachvollziehbar`

`Wer schreiben darf, kann die Historie ändern` und, rot: `Die Migration verliert die Verifizierbarkeit`.

Das ist die härteste Zeile der Karte. Eine Historientabelle ist eine Tabelle. Wer Schreibrechte auf die Datenbank hat, hat auch Schreibrechte auf sie. Der Nachweis hängt damit an Zugriffskontrolle und Protokollierung — also an einer Konfiguration, der man vertrauen muss — und nicht mehr an Mathematik.

Für Kunden, die Compliance-Abläufe auf QLDB gebaut hatten, war das kein Detail: Der von AWS empfohlene Umzug kostete sie genau die Eigenschaft, wegen der sie den Dienst gewählt hatten.

Für die Prüfung ist es die saubere Trennlinie zwischen **„wir können zeigen, wer was geändert hat"** und **„wir können beweisen, dass nichts geändert wurde"**.

### Badge 3 — S3 Object Lock

`WORM, Versioning ist Voraussetzung`, `Governance- und Compliance-Modus`, `Karte 15 — hier nur zur Abgrenzung`.

Der dritte Weg beantwortet eine **andere Frage** und steht bewusst als Abgrenzung auf der Karte. Die Details des Modus-Unterschieds gehören auf Karte 15; hier zählt nur, was Object Lock kann und was nicht.

Die Voraussetzung ist die verräterische Zeile: **Versioning.** Object Lock schützt Objektversionen. Wer nie eine Version abgelegt hat, hat auch nichts geschützt — und ob jemand eine Version *nicht* abgelegt hat, ist genau die Lücke, die ein Ledger schließt und Object Lock nicht.

### Das Ergebnis rechts — `Unlöschbar, nicht beweisend`

`sagt nichts über die Reihenfolge der Änderungen`.

Das Bild dazu: Object Lock ist ein Safe. Was drin ist, bleibt drin und kommt unverändert wieder heraus. Der Safe sagt dir aber nicht, ob jemand einen zweiten Umschlag geschrieben und nie hineingelegt hat.

### Die Fußzeile — die Rückfrage steht unter den drei Spuren, nicht darüber

`Die Frage lautet nie „welche Datenbank", sondern: Was genau muss bewiesen werden — die Unverändertheit, der Verlauf oder die Aufbewahrung?`

Diese Zeile steht bewusst **unter** den drei Wegen und nicht als Überschrift darüber. Das ist die Leseanweisung der Karte: Du erkennst die richtige Antwort nicht, indem du die Dienste vergleichst, sondern indem du die Frage neu formulierst.

In Prüfungsfragen ist genau das die Arbeit. Eine Aufgabe schreibt selten „wir brauchen kryptografische Verifizierbarkeit". Sie schreibt: „Ein Regulator verlangt den Nachweis, dass Transaktionsdaten seit der Erfassung nicht verändert wurden." Zwei Sätze weiter steht dann etwas über zehn Jahre Aufbewahrung, und schon liegen zwei der drei Spuren auf dem Tisch, von denen nur eine gefragt ist.

Der Test in drei Schritten: Steht in der Frage ein Wort für **Beweis** gegenüber Dritten, ist es die Hash-Kette. Steht dort ein Wort für **Nachvollziehen** im eigenen Haus, reicht das Protokoll. Steht dort eine **Frist** oder ein Dateiformat, ist es die Aufbewahrung. Steht mehreres davon, entscheidet das strengste — Beweis schlägt Protokoll schlägt Aufbewahrung.

## Die entscheidende Unterscheidung — drei Fragen, die gleich klingen

| Die Frage lautet wirklich | Antwort | Signalwort |
|---|---|---|
| Ist dieser Datensatz **unverändert**, und kann ich das einem Dritten beweisen? | QLDB | „cryptographically verifiable" |
| Kann ich **zeigen**, wer wann was geändert hat? | Aurora PostgreSQL, Audit-Log | „audit trail", „who changed what and when" |
| Bleibt diese Datei für **zehn Jahre** unlöschbar liegen? | S3 Object Lock | „WORM", „retention", „compliance mode" |

Der Merksatz in drei Wörtern: **QLDB beweist. Aurora protokolliert. Object Lock bewahrt auf.**

## Die ehrliche Feinheit

**Zuerst die Frage, die auf der Karte als Behauptung steht: Ist ein abgeschalteter Dienst überhaupt noch Prüfungsstoff?** Die Antwort ist belegbar und lautet ja. Der offizielle SAA-C03-Prüfungsleitfaden führt im Appendix unter *Database* ausdrücklich Amazon Quantum Ledger Database als **in-scope**. Die Kartenzeile `bleibt die erwartete Prüfungsantwort` ist damit keine Vermutung.

Der ehrliche Zusatz gehört daneben: Der Leitfaden trägt Versionsstand 1.0 und wurde seit der Abschaltung nicht nachgezogen. Ein Prüfungsleitfaden hinkt solchen Ereignissen nach. Irgendwann fällt der Dienst heraus, und niemand kündigt das vorher an. **Lerne die Unterscheidung, nicht den Produktnamen** — die Unterscheidung zwischen Beweis, Protokoll und Aufbewahrung bleibt gültig, auch wenn QLDB aus dem Fragenpool verschwindet.

**Zweite Feinheit: Die `.md` dieser Karte nennt Managed Blockchain als richtige Antwort — für SAA-C03 kann sie das nicht sein.** Die Falle ist fachlich richtig formuliert: Steht in einer Frage „mehrere Parteien, die einander nicht vertrauen", ist das Muster keine Ledger-Datenbank mit zentralem Eigentümer. Nur listet derselbe Prüfungsleitfaden Amazon Managed Blockchain unter **out-of-scope**. Als Antwortoption wird sie in dieser Prüfung nicht auftauchen; als Distraktor kann sie es. Fixvorschlag: Die Unterscheidung behalten, den Out-of-scope-Status danebenschreiben.

**Dritte Feinheit: Ledger ist nicht Blockchain, und der Unterschied ist eine Machtfrage.** QLDB hatte einen **zentralen Eigentümer** — eine vertrauenswürdige Stelle, die den Ledger besitzt. Eine Blockchain existiert gerade deshalb, weil es **keine** solche Stelle gibt. Beide nutzen Hash-Ketten. Die Frage „wer entscheidet, was wahr ist" wird gegensätzlich beantwortet.

**Vierte Feinheit, und die ist keine Prüfungsfrage, sondern eine Architekturlehre:** Die Abschaltung kam ohne formale Ankündigung — keine Keynote, kein Blogpost. AWS aktualisierte die Dokumentation und schickte Bestandskunden eine E-Mail; die Ledger wurden binnen eines Jahres abgeschaltet. Daraus folgt ein Satz, der über diese Karte hinausgeht: **Ein Ledger, der mit seinem Anbieter verschwindet, ist streng genommen kein Ledger, sondern eine Datenbank mit einem Aufbewahrungsversprechen.** Wer Beweise braucht, die einen Anbieterwechsel überleben, muss fragen, ob der Beweis auch ohne den Anbieter prüfbar bleibt.

## Syntax lesen — was ein Aufbewahrungsdatum zusichert und was nicht

Nimm noch einmal die drei Zeilen aus dem Aufruf oben und lies sie als Zusicherung:

```
"ObjectLockMode":            "COMPLIANCE"
"ObjectLockRetainUntilDate": "2036-03-14T00:00:00Z"
"ObjectLockLegalHoldStatus": "OFF"
 │                            │
 │                            └─ unabhängige, unbefristete Sperre — hier aus
 └─ COMPLIANCE: niemand darf löschen, auch nicht Root
    GOVERNANCE: ein besonders berechtigtes Konto darf aufheben
```

Die Zusicherung lautet in Prosa: *Diese eine Version dieses einen Objekts bleibt bis zum 14.03.2036 so, wie sie ist.*

Was in diesem Satz fehlt, ist alles, wonach Rheinkontor gefragt hat. Es steht nichts über die **Vollständigkeit** der Aktenhistorie darin und nichts über die **Reihenfolge**. Version 7 ist geschützt. Dass es zwischen Version 6 und 7 keine achte Bearbeitung gab, die niemand hochgeladen hat, folgt daraus nicht.

Und der zweite Blick lohnt sich: `LegalHoldStatus` ist von der Frist **unabhängig**. Ein Legal Hold hat kein Ablaufdatum und wirkt zusätzlich. Das ist die Zeile, die in Prüfungsfragen auftaucht, wenn von einem laufenden Rechtsstreit die Rede ist, dessen Ende niemand kennt.

## Was du dadurch nicht baust

Zähl durch, was in keiner der drei Spuren enthalten ist:

- kein verteiltes Netzwerk mehrerer Parteien — alle drei haben einen Eigentümer
- keine Prüfbarkeit ohne den Anbieter: Der QLDB-Proof brauchte den QLDB-API-Zugang
- kein Schutz gegen etwas, das nie geschrieben wurde
- keine Protokollierung von **Anwendungsdaten** durch CloudTrail — das ist eine andere Ebene
- kein Ersatz für Zugriffskontrolle: Aurora und Object Lock hängen beide an der Konfiguration
- und seit dem 31.07.2025 kein QLDB mehr

## Wenn du dir eine Sache merkst

**Die Frage lautet nie „welche Datenbank", sondern: Was genau muss bewiesen werden — die Unverändertheit, der Verlauf oder die Aufbewahrung?**

Ein Audit-Log ist unveränderlich, solange niemand mit Schreibrechten es ändert. Object Lock ist unlöschbar, sagt aber nichts über Reihenfolge und Vollständigkeit. Strenge IAM-Policies verkleinern den Kreis derer, die etwas ändern könnten, beweisen aber nicht, dass keiner von ihnen es getan hat. Nur eine Hash-Kette macht aus „wir haben nichts geändert" eine Aussage, die jemand nachrechnen kann, ohne dir zu glauben.

## Prüfungsknackpunkte

**Signalwörter:** „cryptographically verifiable", „immutable transaction log", „complete and verifiable history of changes", „central trusted authority". Die Kombination aus *verifizierbar* und *zentrale vertrauenswürdige Stelle* ist QLDB und nichts anderes.

**Die Audit-Log-Falle.** Der häufigste Distraktor bietet ein Audit-Log oder eine Historientabelle an, wenn die Frage nach Verifizierbarkeit verlangt. Der Test: Steht in der Frage „prove" oder „verifiable", reicht Protokollieren nicht. Steht dort „track who changed what", reicht es.

**Die Blockchain-Falle.** Steht in der Frage „mehrere Organisationen, die einander nicht vertrauen", ist das Muster **nicht** QLDB — dort fehlt die zentrale vertrauenswürdige Stelle, die QLDB voraussetzt. Achte darauf, dass die Blockchain-Option in SAA-C03 formal out-of-scope ist; die Unterscheidung wird trotzdem geprüft.

**Die Karte-15-Verwechslung.** Karte 15 fragt: Kann jemand meine Backups löschen? Diese Karte fragt: Kann jemand meine Historie fälschen? Beide Antworten enthalten das Wort „unveränderlich" und meinen Verschiedenes — Schutz gegen **Löschen** gegen Schutz gegen **unbemerktes Ändern**.

**CloudTrail:** protokolliert API-Aufrufe gegen AWS-Dienste, nicht Änderungen an Anwendungsdaten innerhalb einer Tabelle. Andere Ebene, klassischer Distraktor.

**DynamoDB Streams:** liefert Änderungen als Ereignisstrom mit begrenzter Aufbewahrung. Kein Beweis, keine Kette, keine zehn Jahre.

**S3 Versioning allein:** hält alte Versionen vor, verhindert das Löschen aber nicht. Ohne Object Lock ist es kein WORM.

**Aurora PostgreSQL:** richtig, sobald die Frage „audit trail" oder „migrate away from QLDB" sagt — und falsch, sobald sie „cryptographically verifiable" sagt.
