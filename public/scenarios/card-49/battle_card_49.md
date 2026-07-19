---
nr: 49
title: "CloudTrail-Forensik mit Athena · Partition Projection"
services:
  - AWS CloudTrail (Organization Trail, Insights)
  - Amazon S3
  - Amazon Athena
  - AWS Glue Data Catalog
domains:
  - D1
signalwords:
  - "who deleted the bucket"
  - "investigate API activity after the fact"
  - "audit trail across all accounts"
  - "older than 90 days"
  - "forensic investigation"
  - "query logs with SQL"
  - "minimize query cost"
assets:
  - battle_card_49.svg
  - battle_card_49.png
  - battle_card_49.pdf
status_note: |
  QC (qc.py): 0 Befunde. 8 Boxen, 44 Texte, 16 Segmente, 5 Badges.
  Segmente aufgeschlüsselt (R5): 16 gemeldet − 8 Phantom-Segmente aus
  4 Marker-Definitionen (je 2) = 8 echte Segmente: 5 Ablaufpfeile +
  1 verworfener Pfad + 2 Striche des roten X.
  Badges aufgeschlüsselt (R6): 5 gezählt. Das rote X (r=20, weiß gefüllt,
  roter Rand) wurde von Prüfung (d) korrekt ausgenommen.

  Korrekturrunden:
  1. Gold-Box-Titel "Query ohne Partitionsfilter" bei 317,4 px gemessen,
     verfügbar 324 px — nur 6,6 px Reserve. Vor dem Zeichnen gekürzt auf
     "Ohne Partitionsfilter" (242,4 px, 82 px Reserve). Die Messung hätte
     rechnerisch bestanden; die Reserve war zu knapp für Rundungsunterschiede
     zwischen PIL und dem Renderer.
  Sonst keine Korrekturrunde: 44 Texte gemessen, Geometrieplan mit
  0 Kollisionen im ersten Durchgang.

  Render-Sanity (R7): acht geometrisch abgeleitete Freizonen, **alle im
  ersten Durchgang rein weiß**. Das ist der direkte Effekt der Lehre aus
  Karte 48: Marker skalieren mit stroke-width (markerWidth 10 × stroke 3 =
  30 px). Alle Markerbreiten wurden diesmal vor dem Zonenschnitt berechnet
  und die Zonen entsprechend außerhalb gelegt — keine Nachbesserung nötig,
  gegenüber drei Nachbesserungen auf Karte 47 und einer auf Karte 48.
  Alle vierzehn geprüften Palettenfarben im PNG nachweisbar (Teal 17496 px,
  Grün 4670 px, Gold 5108 px, Rot 5712 px, Füllungen und dunkle Textfarben
  je > 0).

  Schwarz-Prüfung (R13): reines Schwarz (0,0,0) = 0 px.

  Footer von Hand gemessen (R3): 1145,5 px. Unter Stil-Guide (~1420 px) und
  unter der R3-Warnschwelle (~1400 px).

  Sichtprüfung (R8): versucht. Zurück kam ein Bildobjekt, dessen Inhalt ich
  nicht lesen konnte — weder ein leerer Platzhalter noch etwas Beschreibbares.
  Rechnerisch geprüft ist nicht gesehen. Die Karte ist visuell unbestätigt.
---

## Szenario

Montagmorgen: Ein Produktions-Bucket mit sechs Monaten Analysedaten ist leer.
Niemand meldet sich. Die Rekonstruktion ergibt, dass die Löschung rund vier
Monate zurückliegt — und damit außerhalb dessen, was die CloudTrail-Konsole
noch zeigt.

Das Unternehmen betreibt 30 Accounts. Die Revision will drei Dinge wissen:
welcher Principal die Objekte gelöscht hat, von welcher IP-Adresse aus, und
was in derselben Session sonst noch passiert ist.

## Ablauf

**1 — Organization Trail: die Voraussetzung, nicht der Luxus.** Ein
Organization Trail wird im Management Account definiert und sammelt die
Events aller Mitgliedskonten in einem einzigen S3-Bucket, typischerweise im
Log-Archive-Account. Ohne ihn liegt jede Spur im jeweiligen Account, und eine
accountübergreifende Frage lässt sich gar nicht stellen. Wichtiges Detail für
Prüfungsfragen: `AssumeRole`-Events erscheinen im CloudTrail des Accounts,
dem die **Rolle** gehört — bei accountübergreifenden Zugriffen muss man an
beiden Enden schauen, und genau deshalb ist die zentrale Sammlung so
wertvoll.

**2 — Die S3-Prefix-Struktur ist bereits das Partitionsschema.** CloudTrail
legt die Dateien unter `AWSLogs/<account-id>/CloudTrail/<region>/<yyyy>/<mm>/<dd>/`
ab. Diese Struktur ist keine Nebensache, sondern der Grund, warum Athena hier
effizient arbeiten kann: Account, Region und Tag stehen bereits im Schlüssel.
Ohne Partitionierung scannt jede noch so kleine Abfrage sämtliche Dateien
unterhalb des Root-Prefix.

**3 — Partition Projection statt Glue-Crawler.** Athena kann die
Partitionswerte aus dem Schlüsselmuster **berechnen**, statt sie im Glue Data
Catalog nachzuschlagen. Das erspart zweierlei: den wiederkehrenden Aufwand
für `MSCK REPAIR TABLE` oder `ALTER TABLE ADD PARTITION`, wenn täglich neue
Partitionen entstehen, und die Metadaten-Abfragen zur Laufzeit. Die
Konfiguration erfolgt über Tabelleneigenschaften, in denen Wertebereiche und
Projektionstypen je Partitionsspalte hinterlegt werden.

**4 — Die Abfrage selbst.** Ein SQL-Statement filtert auf
`eventName = 'DeleteObject'` beziehungsweise `DeleteObjects`, und — das ist
der teure oder billige Teil — auf Tag und Account als Partitionsprädikate.
Zurück kommen `userIdentity.arn`, `sourceIPAddress`, `eventTime` und die
Request-Parameter. Über die Session-ID lässt sich anschließend
rekonstruieren, was derselbe Principal im selben Zeitfenster sonst getan hat.

**5 — CloudTrail Insights hätte parallel gemeldet.** Insights ist die
eingebaute Anomalieerkennung auf Management-Events: ungewöhnliche Raten von
API-Aufrufen im Vergleich zum gelernten Normalverhalten. Ein Massenlöschen
hätte dort zum Zeitpunkt auffallen können. Insights ersetzt die Forensik
nicht — es hätte den Zeitpunkt verkürzt, an dem jemand hinschaut.

**Kostenfalle — die Gold-Box.** Athena rechnet nach **gescannten Bytes** ab,
nicht nach Laufzeit. Eine Abfrage ohne Partitionsprädikate liest die gesamte
Historie und kann für eine einzige Frage erhebliche Kosten erzeugen. Die
Regel lautet: Datumsbedingungen gehören auf die **Partitionsspalten** in der
`WHERE`-Klausel, nicht auf `eventTime` allein — `eventTime` ist keine
Partitionsspalte, ein Filter darauf reduziert die gescannte Datenmenge nicht.
Zusätzliche Hebel: nur benötigte Spalten selektieren statt `SELECT *`, und
für wiederkehrende Auswertungen die JSON-Logs per CTAS-Abfrage in ein
spaltenorientiertes Format überführen.

**Verworfen — Event History.** Die Ereignisübersicht in der CloudTrail-Konsole
zeigt die letzten 90 Tage und ausschließlich Management Events. Sie ist
**kein Trail**: Es werden keine Events nach S3 geliefert, es besteht keine
Anbindung an CloudWatch Logs, und sie ist für Athena nicht abfragbar. Für
einen vier Monate zurückliegenden Vorfall ist sie doppelt ungeeignet — zu
kurz und nicht auswertbar.

## Prüfungs-Kernsatz

**Event History ist kein Trail.** Ohne explizit angelegtes Trail nach S3 gibt
es nichts zu untersuchen — und ohne Partitionsfilter bezahlt man die gesamte
Historie für eine einzige Frage.

## Abgrenzungen

**49 ↔ 45:** Dort laufende Erkennung und sofortige Reaktion (GuardDuty,
Insights), hier nachträgliche Rekonstruktion. Die Frage "was passiert gerade"
beantwortet 45, die Frage "was ist damals passiert" beantwortet 49. Insights
steht auf beiden Karten und ist die Brücke.

**49 ↔ 26/40:** Athena ist hier dasselbe serverlose Werkzeug wie auf Karte 40,
nur mit CloudTrail-Logs statt einem allgemeinen Data Lake als Quelle. Der
Glue Data Catalog ist beiden gemeinsam — mit dem Unterschied, dass Partition
Projection ihn für die Partitionsverwaltung gerade umgeht.

**49 ↔ 48:** Auf 48 wird Zugriff **gewährt und begrenzt**, auf 49 wird
nachgesehen, **was tatsächlich getan wurde**. Die von Identity Center
erzeugten Rollen tauchen in den CloudTrail-Logs als
`AWSReservedSSO_*`-Principals auf — das verbindet beide Karten in der Praxis.

**Was CloudTrail nicht loggt:** SSH- und RDP-Sitzungen auf EC2-Instanzen
(dafür Session Manager), Netzwerkverkehr innerhalb einer VPC (VPC Flow Logs),
DNS-Abfragen (Route 53 Resolver Query Logging) und den **Inhalt** von
S3-Objekten. CloudTrail beantwortet "wer hat welchen API-Aufruf gemacht",
nicht "was stand in der Datei".

## Klassiker-Fallen

**"Event History reicht doch."** 90 Tage, nur Management Events, nicht
abfragbar, keine S3-Lieferung. Der häufigste Fehler in Prüfungsfragen mit
einem Zeitbezug jenseits von drei Monaten.

**"Data Events sind automatisch dabei."** Sind sie nicht. Management Events
sind der Standard; S3-Objektebene und Lambda-Invocations sind Data Events und
müssen über Event Selectors aktiviert werden — und kosten dann pro Event.
Wer nach einem gelöschten **Objekt** sucht, braucht Data Events; wer nach
einem gelöschten **Bucket** sucht, kommt mit Management Events aus. Dieser
Unterschied entscheidet, ob die Spur überhaupt existiert.

**"Ein Filter auf eventTime spart Kosten."** Nein. `eventTime` ist eine
Spalte im Datensatz, keine Partitionsspalte. Nur Filter auf die
Partitionsspalten (Account, Region, Tag) verhindern das Scannen.

**"Ich nehme CloudTrail Lake, das ist der moderne Weg."** Seit dem 31.05.2026
nimmt CloudTrail Lake keine neuen Kunden mehr an. Siehe Faktencheck.

**"Der Glue-Crawler muss laufen."** Mit Partition Projection nicht. Das ist
der eigentliche Grund, warum diese Technik auf der Karte steht.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**CloudTrail Lake ist seit dem 31.05.2026 für Neukunden geschlossen.** AWS
formuliert es so: Der Dienst nimmt keine neuen Kunden mehr an, Bestandskunden
können ihn normal weiternutzen, er erhält aber nur noch kritische Bugfixes
und Sicherheitsupdates. Als Alternative verweist AWS auf CloudWatch. Für
**Organization Event Data Stores** läuft der Betrieb inklusive neuer
Mitgliedskonten und zusätzlicher Regionen weiter; bei reinen **Account Event
Data Stores** werden neue Accounts der Organization nicht mehr aufgenommen.
Ausdrücklich **nicht betroffen** sind Trails, Insights und Aggregated Events —
CloudTrail selbst bleibt vollständig unterstützt.
Das ist die stärkste Divergenz dieses Batches: Kursmaterial aus 2023 bis
Anfang 2026 empfiehlt CloudTrail Lake regelmäßig als den bequemen Weg für
SQL-Abfragen auf Audit-Logs. Für jede neu aufzubauende Umgebung ist dieser Weg
seit sieben Wochen versperrt, und Athena über S3 ist damit nicht die
umständlichere Alternative, sondern der verbleibende Standardweg.
*Quelle: docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake-service-availability-change.html,
docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html,
aws.amazon.com/cloudtrail/ und aws.amazon.com/cloudtrail/features/*

**Der Zero-ETL-Weg von CloudTrail Lake nach Athena (26.11.2023)** war eine
der letzten größeren Erweiterungen des Dienstes. Kursmaterial, das ihn als
zukunftsweisende Integration darstellt, beschreibt eine Funktion, die nun
faktisch nur noch Bestandskunden offensteht.
*Quelle: aws.amazon.com/about-aws/whats-new/2023/11/aws-cloudtrail-lake-zero-etl-anlysis-athena*

**Partition Projection wird in älterem Material häufig gar nicht erwähnt.**
Dort steht stattdessen der Glue-Crawler oder manuelles
`ALTER TABLE ADD PARTITION`. Beides funktioniert weiterhin, ist aber für
täglich wachsende CloudTrail-Logs der schlechtere Weg. AWS selbst hat 2025
eine automatisierte Lösung für partitionierte CloudTrail-Tabellen in Athena
veröffentlicht — ein Hinweis darauf, dass dieser Bereich weiterhin
Aufmerksamkeit bekommt.
*Quelle: aws.amazon.com/blogs/mt/optimize-querying-aws-cloudtrail-logs-with-partitioning-in-amazon-athena,
docs.aws.amazon.com/athena/latest/ug/cloudtrail-logs.html*

**Die Athena-Dokumentation empfiehlt für accountübergreifende Abfragen
weiterhin CloudTrail Lake.** Diese Empfehlung stammt aus der Zeit vor der
Verfügbarkeitsänderung und ist für Neukunden nicht mehr umsetzbar. Zwei
AWS-Seiten stehen hier also nebeneinander, ohne sich direkt zu widersprechen —
die eine empfiehlt, die andere schließt für Neukunden. Auf der Karte steht
deshalb der Athena-Weg als Hauptpfad und die Lake-Lage als Randnotiz.
*Quelle: docs.aws.amazon.com/athena/latest/ug/cloudtrail-logs.html*

**"Create Athena table" in der CloudTrail-Konsole erzeugt eine
unpartitionierte Tabelle.** Für Organization Trails muss die Tabelle
ohnehin manuell angelegt werden, um den richtigen Speicherort anzugeben.
Kursmaterial, das den Konsolen-Knopf als vollständige Lösung zeigt, führt in
genau die Kostenfalle der Gold-Box.
*Quelle: docs.aws.amazon.com/athena/latest/ug/cloudtrail-logs.html*

## Nicht bestätigt

**Der Athena-Preis von 5 US-Dollar pro gescanntem Terabyte** erscheint in
mehreren Drittquellen (oneuptime.com, tomodahinata.com), teils selbst mit dem
Zusatz "verify". Er wurde nicht gegen die AWS-Preisseite geprüft und steht
deshalb **nicht auf der Karte**. Die Karte sagt nur "Abrechnung nach Bytes" —
die Abrechnungslogik ist durch AWS-Quellen gedeckt, der Betrag nicht.

**Die Zahl "99 % Kostenersparnis durch Partitionierung"** stammt aus einer
Drittquelle und ist eine Beispielrechnung, keine allgemeine Größe. Nicht auf
der Karte.

**Konkrete CloudTrail-Preisbestandteile** (erste Kopie der Management Events
kostenlos, Data Events pro 100.000 Events, Insights pro analysierte Events)
sind auf der AWS-Preisseite dokumentiert, wurden hier aber nicht im Detail
verifiziert und stehen nicht auf der Karte.

**"CloudWatch ist ein gleichwertiger Ersatz für CloudTrail Lake."** AWS
verweist auf CloudWatch, nennt es aber "capabilities similar". Mindestens ein
Praxisbericht (awsteele.com, Juni 2026) beschreibt die Erfahrung damit als
enttäuschend. Da hier nur eine Drittstimme gegen eine allgemein gehaltene
AWS-Empfehlung steht, steht dazu **nichts auf der Karte** und die `.md`
verzeichnet lediglich, dass AWS auf CloudWatch verweist.

## Bewusste Vereinfachungen im Diagramm

**Der Glue Data Catalog ist nicht als eigenes Element gezeichnet.** Er wird in
der Athena-Box durch die Zeile "kein Glue-Crawler nötig" nur negativ
adressiert. Fachlich braucht Athena weiterhin eine Tabellendefinition, die im
Katalog liegt — Partition Projection ersetzt nicht den Katalog, sondern die
laufende Partitionsverwaltung darin. Diese Feinheit hätte eine eigene Box
gekostet.

**Data Events gegen Management Events ist nicht im Bild.** Der Unterschied
entscheidet im Szenario darüber, ob die Löschung einzelner Objekte überhaupt
protokolliert wurde. Er steht bei den Klassiker-Fallen, weil zwei zusätzliche
Boxen die Kette gesprengt hätten.

**Der Pfeil 5 zeigt von der Kostenfalle nach oben auf Athena.** Das ist keine
Datenflussrichtung, sondern eine Warnung, die auf den Dienst zeigt. Wie beim
SCP auf Karte 48 trägt der Pfeil eine Aussage über eine Eigenschaft, nicht
über einen Ablauf.

**CloudTrail Insights ist als Box neben der SQL-Antwort platziert**, obwohl es
zeitlich *vor* der Forensik gewirkt hätte. Die räumliche Anordnung folgt der
Lesbarkeit; das Label "parallel" und der gestrichelte Pfeil sollen die
Gleichzeitigkeit ausdrücken.

**Die CloudTrail-Lake-Randnotiz steht als freier Text ohne Box.** Sie ist
weder Teil des Ablaufs noch ein verworfener Pfad im Sinne der Konvention —
sie ist eine Verfügbarkeitsinformation. Eine Box hätte sie fälschlich zu einer
Architekturoption gemacht.

## Farbkonventionen dieser Karte

**Teal #0F7C8C** — Organization Trail, Athena, SQL-Antwort, CloudTrail
Insights. Regel- und Konfigurationsinstanzen nach der Batch-9-Konvention;
CloudTrail und Athena sind beide Auswertungs- und Konfigurationsebene, keine
Datenhaltung.

**Grün #3F8624** — S3 Log-Archive als Datenbestand. Stil-Guide-Original.

**Gold #A16E00** — die Kostenfalle. Das ist die Stil-Guide-Originalbedeutung
"kostet Geld", nach der in Batch 9 zurückgenommenen Umdeutung von Karte 39.
Erste Karte dieses Batches, die Gold überhaupt verwendet.

**Rot #C7161D** — ausschließlich der verworfene Pfad: Box-Rand von Event
History und das rote X.

**Gold und Rot stehen gemeinsam auf der Karte** — nach der Batch-9-Regel
zulässig, solange sie getrennt bleiben: Gold sagt hier *warum* etwas teuer
wird (fehlender Partitionsfilter), Rot sagt *dass* Event History als Option
ausscheidet. Beide beziehen sich auf verschiedene Objekte, es gibt keine
gemeinsame Box.

**Die Randnotiz zu CloudTrail Lake ist in Teal-dunkel #0B5A66 gesetzt**, also
in der Textfarbe der Teal-Familie und nicht in Rot. Das ist bewusst: Der
Dienst ist nicht "verworfen", er ist für Neukunden nicht mehr verfügbar. Rot
hätte eine Architekturentscheidung suggeriert, wo eine
Verfügbarkeitstatsache steht.

**Keine neue Farbkategorie eingeführt.**
