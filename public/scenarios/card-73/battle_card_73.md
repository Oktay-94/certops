---
nr: 73
title: "AWS DataSync — geplanter, inkrementeller Massentransfer über die Leitung"
services:
  - "AWS DataSync"
  - "Amazon S3"
  - "Amazon EFS"
  - "AWS Storage Gateway (Abgrenzung — laufender Zugriff)"
  - "AWS Snowball (Abgrenzung — zu wenig Bandbreite)"
domains: [D3, D4]
signalwords:
  - "recurring incremental transfer over the existing link"
  - "scheduled hourly, daily or weekly"
  - "preserve POSIX metadata and verify integrity"
  - "minimal operational overhead"
  - "transfer over the network, not by shipping devices"
assets: [battle_card_73.svg, battle_card_73.png, battle_card_73.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 73 — AWS DataSync

**Szenario:** Wiederkehrende NFS→S3/EFS-Synchronisation über die bestehende Leitung, inkrementell.

## Ablauf

- **1 — Agent liest den Share:** Der DataSync Agent läuft als VM im eigenen Rechenzentrum und mountet den NFS-Share. Er ist der einzige on-prem Fußabdruck des Dienstes — auf dem Fileserver selbst wird nichts installiert.
- **2 — Über die Leitung:** Der Agent überträgt per TLS an den DataSync Service. Das AWS-eigene Transferprotokoll ist vom Speicherprotokoll entkoppelt und optimiert selbst: Inline-Kompression, Erkennung von Sparse Files, parallele Threads, Bandbreiten-Drosselung. Nach der Erstkopie laufen alle Folgeläufe **inkrementell** — nur Neues und Geändertes bewegt sich.
- **3 — Objekte nach S3:** Jede Datei wird 1:1 ein S3-Objekt; POSIX-Metadaten (Rechte, Timestamps, Owner) wandern als Objekt-Metadaten mit und lassen sich beim Rückweg wiederherstellen. Integritätsprüfung in transit und at rest ist eingebaut.
- **4 — Alternativ/zusätzlich EFS:** Gleiches Spiel Richtung POSIX-Dateisystem, wenn Anwendungen weiter Datei-Semantik brauchen.
- **Zeitplan (Governance, gestrichelt):** Tasks laufen stündlich, täglich oder wöchentlich per eingebautem Scheduler — der ganze Punkt des Szenarios „wiederkehrend ohne eigene Skripte".

## Prüfungs-Kernsatz

**DataSync = geplanter, inkrementeller Massentransfer über die Leitung — Migration und Sync, kein Dauerzugriff.**

## Klassiker-Fallen

1. **DataSync vs. Storage Gateway:** „Anwendungen sollen weiter on-prem auf die Daten zugreifen" → File Gateway. „Daten sollen rüber/synchron gehalten werden" → DataSync. AWS empfiehlt sogar die Kombination: DataSync für die Migration, File Gateway für den laufenden Zugriff danach.
2. **DataSync vs. Snowball:** Zu wenig Bandbreite oder zu viel Volumen für die Leitung → Snowball-Familie. Die Aufgabenstellung „über die Leitung" schließt Snowball aus.
3. **rsync-Eigenbau:** klingt billig, verliert aber Integritätsprüfung, Metadaten-Garantien, Scheduling und Parallelisierung — in der Prüfung nie die Antwort mit „minimal operational overhead".

## Faktencheck-Notizen (22.07.2026)

- Bestätigt via aws.amazon.com/datasync (Features/FAQ): Quellen NFS/SMB/HDFS/Objektspeicher (auch andere Clouds), Ziele S3/EFS/alle FSx-Typen; Scheduling stündlich/täglich/wöchentlich; inkrementelle Transfers, Inline-Kompression, TLS, Integritätsprüfung, Metadaten-Erhalt.
