---
nr: 43
title: "KMS · Envelope Encryption · S3 SSE-KMS — eigener Schlüssel mit Rotation und Nachweis"
services:
  - AWS KMS
  - Amazon S3 (SSE-KMS)
  - S3 Bucket Keys
  - AWS CloudTrail
domains:
  - D1
signalwords:
  - "customer managed key"
  - "encryption at rest with your own key"
  - "prove who decrypted the data"
  - "automatic key rotation for compliance"
  - "reduce KMS request costs"
  - "audit trail for key usage"
  - "data larger than 4 KB"
assets:
  svg: battle_card_43.svg
  png: battle_card_43.png
  pdf: battle_card_43.pdf
status_note: >
  QC 0 Befunde im ersten Durchgang, keine Korrekturrunde nötig.
  Gemeldet: 9 Boxen, 52 Texte, 24 Segmente, 7 Badges. Segmentzahl
  aufgeschlüsselt: 5 Marker-Definitionen in <defs> erzeugen 10
  Phantom-Segmente bei (0,0)-(8,4)-(0,8); real gezeichnet sind damit
  14 Segmente — 7 nummerierte Pfade mit zusammen 11 Teilstrecken,
  1 verworfener Pfad mit 1 Teilstrecke, 2 X-Striche. 7 Badges =
  6 Nummern-Badges plus das rote X, das qc.py korrekt von Prüfung (d)
  ausnimmt.
  Render-Sanity: PNG 2400x1350. Fünf aus der Elementgeometrie
  abgeleitete Freizonen geprüft, alle fünf tatsächlich leer — erste
  Karte dieser Serie ohne aufzuklärende Belegung. Alle acht
  Palettenfarben im PNG nachweisbar, einschließlich Gold #A16E00.
  Footer von Hand mit PIL gemessen: 1382.8 px (Stil-Guide ~1420).
  Eine erste Variante lag bei 1418.2 px — rechnerisch innerhalb des
  Limits, aber mit zwei Pixeln Abstand zu knapp, deshalb verworfen.
  Sichtprüfung: versucht, unbrauchbar — die Bildansicht lieferte
  einen leeren Platzhalter, dasselbe Fehlerbild wie bei Karte 42.
  Die Karte ist rechnerisch geprüft, aber von niemandem gesehen.
---

## Szenario

Ein Krankenhausverbund legt Scans von Patientenakten in S3 ab: rund 40 Millionen
Objekte, im Schnitt 8 MB je Datei. Die Aufsichtsbehörde verlangt drei Dinge —
einen eigenen Schlüssel unter Kontrolle des Verbunds, nachweisbare Rotation,
und für jeden Zugriff einen Audit-Eintrag darüber, wer welchen Schlüssel wann
benutzt hat.

Der erste Entwurf des Teams wollte die Dateien per `kms:Encrypt` direkt
verschlüsseln. Das scheitert an der Größengrenze. Der zweite Entwurf aktivierte
SSE-KMS ohne Bucket Keys — die KMS-Rechnung sprengte das Budget, weil jeder
einzelne Lese- und Schreibzugriff einen eigenen KMS-Aufruf auslöste.

## Ablauf

**1 — Die Anwendung lädt die Akte nach S3 hoch.**
Die Anwendung verschlüsselt nichts selbst und kennt keinen Schlüssel. Sie setzt
lediglich `PutObject` ab; die Verschlüsselung passiert serverseitig. Das ist der
Unterschied zwischen SSE und clientseitiger Verschlüsselung — bei SSE trägt AWS
die Mechanik, der Kunde bestimmt nur, mit wessen Schlüssel.

**2 — S3 fordert bei KMS einen Data Key an.**
Der Aufruf heißt `GenerateDataKey` und ist der Kern der Envelope Encryption. S3
sagt KMS: "gib mir einen frischen Schlüssel für dieses Objekt". Wichtig für die
Prüfung: Die Akte selbst wird **nie** an KMS geschickt. KMS sieht die Daten
nicht, nur den Schlüssel.

**3 — KMS liefert zwei Fassungen desselben Data Key.**
Zurück kommen eine Klartext-Fassung und eine mit dem Customer Managed Key
verschlüsselte Fassung. Der CMK selbst verlässt das HSM nie — er wird
ausschließlich benutzt, um den Data Key einzupacken. Deshalb der Name:
der Schlüssel steckt im Umschlag, nicht die Daten.

**4 — Die Klartext-Fassung verschlüsselt das Objekt und wird verworfen.**
S3 verschlüsselt die 8-MB-Datei lokal mit dem Klartext-Data-Key und löscht ihn
danach aus dem Speicher. Was beim Objekt liegen bleibt, ist die verschlüsselte
Fassung. Zum Lesen muss S3 sie erst von KMS wieder öffnen lassen — das ist der
`Decrypt`-Aufruf, und genau dieser Aufruf ist es, der im Audit auftaucht.

**5 — Die Key Policy entscheidet, wer den Schlüssel benutzen darf.**
Bei KMS ist das kein Detail: Ohne Eintrag in der Key Policy hilft keine noch so
großzügige IAM-Policy. KMS-Schlüssel sind eine der wenigen Ressourcen, bei denen
die ressourcenbasierte Policy zwingend mitspielen muss.

**6 — Der S3 Bucket Key senkt die Zahl der KMS-Aufrufe.**
Statt für jedes Objekt einzeln bei KMS anzufragen, holt S3 einen kurzlebigen
Schlüssel auf Bucket-Ebene und leitet daraus die Data Keys ab. Bei 40 Millionen
Objekten ist das der Unterschied zwischen einer tragbaren und einer
unbezahlbaren Rechnung. Die Einstellung ist standardmäßig nicht aktiv — sie
muss bewusst gesetzt werden.

**7 — CloudTrail protokolliert jeden Schlüssel-Aufruf.**
Jeder `GenerateDataKey` und jeder `Decrypt` erscheint als Eintrag mit Aufrufer,
Zeitpunkt und Schlüssel-ARN. Das ist die eigentliche Antwort auf die
Behördenforderung: Der Nachweis lebt nicht in S3, sondern in CloudTrail.

**Verworfen — `kms:Encrypt` direkt auf die Datei.**
Die Encrypt-Operation nimmt höchstens 4.096 Bytes entgegen. Eine 8-MB-Akte wird
abgelehnt. Genau diese Grenze ist der Grund, warum es Envelope Encryption gibt.

## Prüfungs-Kernsatz

**KMS verschlüsselt nicht deine Daten, sondern deinen Data Key — und der
Nachweis, wer entschlüsselt hat, steht in CloudTrail, nicht in S3.**

## Abgrenzungen

- **SSE-S3 ↔ SSE-KMS ↔ SSE-C:** Bei SSE-S3 verwaltet S3 den Schlüssel
  vollständig, es gibt keinen Audit-Eintrag pro Objekt-Zugriff. SSE-KMS bringt
  den eigenen Schlüssel, die Key Policy und die CloudTrail-Spur — der Grund,
  warum in Compliance-Szenarien fast immer SSE-KMS die Antwort ist. Bei SSE-C
  liefert der Kunde den Schlüssel bei jedem Request mit und trägt die
  Verwaltung selbst.
- **Key Policy ↔ IAM Policy:** Bei den meisten Diensten reicht eine der beiden.
  Bei KMS muss die Key Policy den Zugriff zulassen; sie ist nicht optional.
- **Karte 43 ↔ Karten 41/42:** Dort ging es darum, *wer* etwas darf
  (Rollen, Credentials). Hier geht es darum, *womit* verschlüsselt wird. Beide
  Fragen treffen sich in der Key Policy, sind aber verschiedene Ebenen.
- **KMS ↔ Secrets Manager (Karte 44):** KMS verwaltet Schlüssel, Secrets
  Manager verwaltet Geheimnisse und rotiert sie über Lambda. Secrets Manager
  benutzt KMS im Hintergrund — die Dienste sind gestapelt, nicht alternativ.
- **CloudTrail ↔ S3 Server Access Logs:** Beide protokollieren Zugriffe. Für
  "wer hat welchen Schlüssel benutzt" ist CloudTrail die Quelle, weil dort die
  KMS-API-Aufrufe landen.

## Klassiker-Fallen

- **"KMS verschlüsselt die Datei."** Der häufigste Denkfehler. KMS bekommt die
  Nutzdaten nie zu sehen; es verschlüsselt ausschließlich den Data Key. Wer das
  verinnerlicht hat, beantwortet die 4-KB-Frage automatisch richtig.
- **Rotation für ausreichend halten, ohne die Key Policy zu prüfen.** Ein
  rotierter Schlüssel, den die falschen Principals benutzen dürfen, erfüllt
  keine Compliance-Anforderung.
- **Bucket Keys als aktiv voraussetzen.** Sie sind eine Opt-in-Einstellung. In
  Kostenfragen zu SSE-KMS mit vielen Objekten ist "Bucket Keys aktivieren" fast
  immer die gesuchte Antwort.
- **Annehmen, unverschlüsselte Objekte seien noch möglich.** Seit dem 05.01.2023
  wird jeder neue Upload mindestens per SSE-S3 verschlüsselt. Die Prüfungsfrage
  lautet nicht mehr *ob*, sondern *mit wessen Schlüssel*.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**KMS-Rotation ist seit April 2024 konfigurierbar und on-demand auslösbar.** Die
Rotationsperiode lässt sich zwischen 90 Tagen und 7 Jahren (2560 Tage) frei
wählen; zusätzlich gibt es `RotateKeyOnDemand` für eine sofortige Rotation,
maximal 25 Mal pro Schlüssel. Kursmaterial sagt nahezu durchgehend "einmal
jährlich, nicht änderbar" — das war vor der Ankündigung richtig und ist es
heute nicht mehr. Der Standardwert ohne eigene Angabe bleibt 365 Tage.
Quelle: AWS-Ankündigung "AWS KMS announces more flexible automatic key
rotation" (April 2024), KMS API Reference zu `EnableKeyRotation` und
`RotateKeyOnDemand`.

**Die Bepreisung der Rotation hat sich mitgeändert.** Früher kostete jede
einzelne Rotation zusätzlich 1 $/Monat pro Schlüssel. Heute schlagen nur die
erste und zweite Rotation mit je 1 $/Monat zu Buche, alle weiteren sind nicht
berechnet — der Aufschlag ist bei der zweiten Rotation gedeckelt.
Quelle: dieselbe AWS-Ankündigung.

**On-demand Rotation gibt es seit dem 06.06.2025 auch für importiertes
Schlüsselmaterial.** BYOK-Schlüssel ließen sich vorher nur durch Anlegen eines
neuen Schlüssels rotieren, was alle Referenzen auf die alte Key-ARN brach.
Heute bleibt die ARN erhalten.
Quelle: AWS-Ankündigung "AWS KMS launches on-demand key rotation for imported
keys", AWS Security Blog.

**S3 verschlüsselt seit dem 05.01.2023 automatisch.** Jeder neue Upload wird
mindestens per SSE-S3 verschlüsselt, ohne Zusatzkosten und ohne
Performance-Einfluss. Älteres Material behandelt "Default Encryption
aktivieren" noch als Aufgabe des Kunden.
Quelle: S3 User Guide, "Setting default server-side encryption behavior".

**S3 Bucket Keys senken die KMS-Requestkosten um bis zu 99 % und sind nicht
standardmäßig aktiv.** Nicht unterstützt bei DSSE-KMS.
Quelle: S3 User Guide, "Reducing the cost of SSE-KMS with Amazon S3 Bucket Keys".

## Nicht bestätigt

Konkrete Preisangaben in Dollar pro 10.000 KMS-Requests kursieren in
Drittquellen, ließen sich aber nicht gegen eine AWS-Preisseite absichern und
stehen deshalb **nicht** auf der Karte. Was auf der Karte steht, ist der
relative Effekt ("bis zu 99 % weniger Aufrufe") — dieser Wert stammt direkt aus
der AWS-Doku.

Die Angabe "1. und 2. Rotation je 1 $/Monat" steht auf der Karte, weil sie aus
der AWS-Ankündigung selbst stammt. Sie ist die einzige Geldangabe auf dieser
Karte; sollte AWS die Bepreisung ändern, ist das die Zeile, die zuerst
veraltet.

## Bewusste Vereinfachungen im Diagramm

- **Der Lesepfad ist nicht gezeichnet.** Die Karte zeigt den Schreibvorgang; der
  `Decrypt`-Aufruf beim Lesen läuft spiegelbildlich. Beide Richtungen zu
  zeichnen hätte die Karte verdoppelt, ohne einen neuen Gedanken zu bringen —
  der Decrypt-Aufruf ist in der CloudTrail-Box als "jeder Aufruf" mitgemeint.
- **Der Data Key ist als eigene Box dargestellt**, obwohl er kein dauerhaftes
  Objekt ist, sondern zwei Fassungen desselben Schlüssels für kurze Zeit. Die
  Box macht sichtbar, dass es ihn gibt — das ist der Punkt, den die Karte
  erklären soll.
- **Der Bucket Key hängt an der Key Policy, nicht am Datenfluss.** Er ist eine
  Optimierung des Aufrufverhaltens, kein Zwischenschritt im Verschlüsselungsweg.
  Der gestrichelte goldene Pfeil nach oben zeigt eine Wirkung, keinen Datenfluss.
- **Die Anwendung ruft S3 direkt auf**, ohne API Gateway oder Zwischenschicht.
  Das Szenario handelt von Verschlüsselung, nicht von Zugriffswegen.

## Farbkonventionen dieser Karte

Dritte Karte nach der festgeschriebenen Konvention. **Diese Karte ist die
erste, auf der KMS in Teal steht:**

- **Teal #0F7C8C** — Regel- und Konfigurationsinstanz: KMS Customer Managed Key,
  Key Policy, Data Key. Damit ist die in dieser Session getroffene Entscheidung
  erstmals angewandt. **Auf Karte 37 steht KMS noch in Navy** — die Abweichung
  ist bekannt, dokumentiert und wird nicht nachgezogen.
- **Gold #A16E00** — S3 Bucket Key, in der Stil-Guide-Bedeutung "kostet Geld".
  Der Bucket Key ist genau die Stellschraube, an der die Rechnung hängt. Die
  Umdeutung "kostet Daten" von Karte 39 bleibt zurückgenommen.
- **Navy #232F3E** — CloudTrail als Nachweis-/Account-Ebene.
- **Grün #3F8624** — S3 als Speicherort. **Blau #2E6BE6** — die Anwendung als
  Client. Beide nach Stil-Guide unverändert.
- **Rot #C7161D** — verworfener Pfad: `kms:Encrypt` direkt, an der 4-KB-Grenze
  gescheitert, mit rotem X.
