---
nr: 79
title: "Storage Gateway Tape & Volume — Bandworkflow behalten, Bandroboter ersetzen"
services:
  - "AWS Storage Gateway (Tape Gateway)"
  - "AWS Storage Gateway (Volume Gateway, Cached und Stored)"
  - "Amazon S3 Glacier Flexible Retrieval"
  - "Amazon S3 Glacier Deep Archive"
  - "AWS Storage Gateway (S3 File Gateway, verworfen)"
domains: [D2, D4]
signalwords:
  - "backup software must not be changed"
  - "virtual tape library over iSCSI"
  - "seven year retention requirement"
  - "archive pool decides the storage class, not a lifecycle rule"
  - "cached keeps only hot data locally, stored keeps everything"
assets: [battle_card_79.svg, battle_card_79.png, battle_card_79.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 79 — Storage Gateway: Tape & Volume

**Szenario:** Ein Mittelständler sichert seit Jahren mit NetBackup auf LTO-Bänder; der Bandroboter ist am Lebensende, die Aufbewahrungspflicht läuft über sieben Jahre, und an den Backup-Prozessen soll sich nichts ändern.

## Ablauf
- **1 — Gateway:** Die Storage-Gateway-Appliance im Rechenzentrum präsentiert per iSCSI eine virtuelle Tape Library: einen Media Changer und mehrere Tape Drives. Die Backup-Software sieht einen Bandroboter und muss nicht angefasst werden — das ist der ganze Trick dieser Lösung.
- **2 — Schreiben:** Lokaler Cache und Upload Buffer nehmen den Schreibvorgang sofort an und bestätigen ihn; asynchron geht das Tape komprimiert und verschlüsselt nach S3. Der Backup-Job wartet also nicht auf die WAN-Leitung.
- **3 / 4 — Eject:** Beim Auswerfen wandert das virtuelle Tape in den Archiv-Pool, der beim Anlegen des Tapes gewählt wurde: Glacier Flexible Retrieval für Archive, die noch öfter gebraucht werden, oder Deep Archive für die lange, günstige Ablage. Entscheidend ist: **der Pool, nicht eine S3-Lifecycle-Regel.**
- **Volume Gateway (zur Abgrenzung):** Wer Block-Volumes statt Bändern braucht, nimmt Volume Gateway — *Cached* mit bis zu 32 TiB je Volume, wobei S3 der primäre Speicher ist und nur heiße Daten lokal liegen, oder *Stored* mit bis zu 16 TiB je Volume, wobei alle Daten lokal liegen und Snapshots nach AWS gehen. Beides über iSCSI, aber kein Tape-Workflow.
- **✗ — S3 File Gateway:** Ein NFS- oder SMB-Share als Backup-Ziel funktioniert technisch, verlangt aber, die Backup-Jobs von Tape- auf Disk-Targets umzubauen und die Aufbewahrung neu zu organisieren. Genau die Prozessänderung, die der Kunde ausgeschlossen hat.

## Prüfungs-Kernsatz
**Tape Gateway spricht iSCSI-VTL und bewahrt den bestehenden Bandworkflow; welche Archivklasse ein Tape bekommt, entscheidet der Pool beim Eject.**

## Klassiker-Fallen
1. **Lifecycle-Regeln auf den VTL-Bucket anwenden wollen** → Die Tapes liegen in von AWS verwalteten S3-Buckets. Gesteuert wird über den Archiv-Pool, nicht über eigene Lifecycle-Policies.
2. **Tape Gateway für schnelle Restores einplanen** → Archivierte Tapes müssen erst aus Glacier zurückgeholt werden. Für kurze RTOs ist das der falsche Baustein; abgerufene Tapes sind zudem nur lesbar.
3. **Cached und Stored vertauschen** → Cached: Primärdaten in S3, lokal nur der heiße Anteil. Stored: alle Daten lokal, S3 hält die Snapshots. Wer „low-latency für den gesamten Datenbestand" liest, braucht Stored.
4. **File Gateway als Bandersatz verkaufen** → File Gateway ist ein Datei-Share, kein Bandroboter. Es löst den Fall nur, wenn die Backup-Software umgebaut werden darf.

## Faktencheck-Notizen (23.07.2026)
- Volume-Quotas aus `docs.aws.amazon.com/storagegateway/latest/vgw/resource-gateway-limits.html`: Cached **32 TiB**, Stored **16 TiB** je Volume, je 32 Volumes pro Gateway, in Summe 1.024 TiB bzw. 512 TiB. Die Produkt-FAQ schreibt lax „32 TB" und „1 PB" — kein Sachkonflikt, nur Einheiten-Schlamperei; die Karte nimmt die Doku-Werte.
- **Quellenkonflikt, deshalb keine Zahl auf der Karte:** Die Tape-Gateway-Doku (`archiving-tapes-vtl.html`) beschreibt Glacier Flexible Retrieval als Ziel für Archive, die „in Minuten" gebraucht werden; das What's-New vom 27.03.2019 nennt für dieselbe Klasse 3–5 Stunden und für Deep Archive rund 12 Stunden. Beides sind AWS-Primärquellen. Die Karte sagt deshalb nur „schneller abrufbar" gegen „langsamer, günstiger".
- Maximale virtuelle Tape-Größe: 15 TiB (What's New, 06.10.2022, Erhöhung von 5 TiB). Nicht auf der Karte, weil für die Prüfung ohne Bedeutung.
- Die kursierende Angabe „1.500 Tapes bzw. 1 PiB pro Gateway" ließ sich nur über Drittquellen belegen und ist deshalb **weder auf der Karte noch hier als Fakt** geführt.
- Amazon FSx File Gateway nimmt seit 28.10.2024 keine Neukunden mehr an; AWS verweist auf FSx for Windows File Server direkt. Betrifft die Karte nicht, gehört aber zum Bild der Gateway-Familie.
- Alle AL2-basierten Storage-Gateway-Appliances mussten bis 30.06.2026 auf Amazon Linux 2023 migriert sein.
