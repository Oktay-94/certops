---
nr: 11
title: "Rechnungsarchiv über 10 Jahre — Lifecycle in den Deep Archive"
services:
  - S3
  - S3 Lifecycle
  - S3 Standard-IA
  - S3 Glacier Deep Archive
  - S3 Batch Operations
signalwords:
  - "10 Jahre gesetzliche Aufbewahrungspflicht"
  - "praktisch nie abgerufen"
  - "Kosten minimieren"
  - "Abruf darf Stunden bis Tage dauern"
  - "keine manuelle Verwaltung"
domains: [D4, D1]
assets:
  - battle_card_11.svg
  - battle_card_11.png
  - battle_card_11.pdf
status_note: "Sichtprüfung des gerenderten PNG durch Chat-Claude nicht möglich — rechnerische QC (Textbreiten, Kollisionen, Render-Sanity) grün, optische Freigabe durch Oktay ausstehend."
---

# Battle Card 11 — S3 Lifecycle · S3 Glacier Deep Archive

**Services:** Amazon S3, S3 Lifecycle, S3 Standard-IA, S3 Glacier Deep Archive, S3 Batch Operations (RestoreObject)

**Szenario:**
Die **Hansa Logistik GmbH** erzeugt aus ihrem ERP rund **2 Millionen Rechnungs-PDFs pro Jahr** (je 400 KB bis 2 MB, zusammen ca. 1,5 TB pro Jahr). Gesetzlich müssen die Belege **10 Jahre aufbewahrt** werden. In den ersten Wochen greifen Versand, Mahnwesen und Kundenservice täglich darauf zu, im ersten Jahr kommen noch vereinzelte Rückfragen und Reklamationen. **Danach wird faktisch nie wieder gelesen** — außer die Betriebsprüfung fordert einen Jahrgang an, und dafür stehen mehrere Werktage Frist zur Verfügung. Das Team hat **kein Ops-Personal für Archivpflege** und will die Speicherkosten so weit wie möglich drücken.

Signalwörter der Prüfung: *10 Jahre Aufbewahrungspflicht* · *fast nie Zugriff* · *niedrigstmögliche Kosten* · *Abruf darf Stunden dauern* · *ohne manuellen Aufwand*.

---

## Ablauf

**1 — Das ERP schreibt die PDFs direkt nach S3 (PUT).**
Es gibt keine Zwischenstation, keinen Fileserver und kein Archivsystem. Alle Rechnungen landen unter einem gemeinsamen Prefix (`invoices/`) in einem einzigen Bucket. Das ist wichtig für später: Der Prefix ist der **Filter**, an dem die Lifecycle-Regel greift — die Ablagestruktur ist damit kein kosmetisches Detail, sondern der Steuerhebel der ganzen Architektur.

**Die S3 Lifecycle-Regel (Klammer über der Zeitachse) — eine Konfiguration, kein Cronjob.**
S3 wertet die Regel **selbst** täglich aus und verschiebt Objekte anhand ihres Alters. Es läuft keine Lambda, kein Scheduler, kein Skript. Genau darauf zielt das Signalwort „keine manuelle Verwaltung": Wenn eine Prüfungsfrage einen Wartungsjob oder ein Custom-Script als Antwortoption anbietet, ist das die Falle — die richtige Antwort ist die deklarative Lifecycle-Konfiguration. Der Filter enthält zusätzlich `ObjectSizeGreaterThan 131072` (128 KB), was seit **September 2024 ohnehin das Standardverhalten** neuer bzw. geänderter Lifecycle-Konfigurationen ist.

**2 — Tag 30: Transition nach S3 Standard-IA.**
Nach 30 Tagen ist der operative Zugriff vorbei. S3 Standard-IA kostet rund die Hälfte von S3 Standard, liefert aber weiterhin **Millisekunden-Zugriff** — es fällt lediglich eine Abrufgebühr pro GB an. Tag 30 ist hier kein willkürlicher Wert, sondern der **frühestmögliche**: In die IA-Klassen darf Lifecycle erst transitionieren, wenn ein Objekt mindestens 30 Tage in S3 gelegen hat.

**3 — Tag 365: Transition nach S3 Glacier Deep Archive.**
Ab hier ist die Rechnung reine Aufbewahrung. Deep Archive ist mit ca. **0,00099 $/GB-Monat (≈ 1 $ pro TB-Monat)** die günstigste Klasse in S3 — rund Faktor 23 unter S3 Standard. Der Preis wird mit Wartezeit bezahlt: Ein Objekt ist nicht mehr direkt lesbar, ein Restore dauert **12 Stunden (Standard-Tier)** oder **48 Stunden (Bulk-Tier)**. Genau dieses Zugeständnis erlaubt das Szenario ausdrücklich („mehrere Werktage Frist"), und deshalb ist Deep Archive hier korrekt und nicht etwa übervorsichtig.

**4 — Tag 4015: Expiration.**
Die Lifecycle-Regel löscht das Objekt, wenn die Aufbewahrungsfrist abgelaufen ist. Die 4015 Tage sind bewusst mehr als 10 × 365: Die handelsrechtliche Frist beginnt erst mit **Ende des Kalenderjahres** der Erstellung, eine im Januar erzeugte Rechnung muss also fast 11 Jahre überleben. Das Löschen gehört zur Kostenrechnung dazu — ein Archiv, das nie etwas wegwirft, wächst linear für immer.

**5 — Die Betriebsprüfung fordert einen Jahrgang an.**
Der externe Akteur ist gestrichelt gezeichnet: Er gehört nicht zur Architektur, er löst sie nur aus. Entscheidend ist seine **Frist** — mehrere Werktage. Wäre die Anforderung „binnen 15 Minuten", wäre Deep Archive die falsche Klasse und die Karte hätte eine andere Lösung (Glacier Instant Retrieval oder Standard-IA).

**6 — RestoreObject, ausgeführt über S3 Batch Operations.**
Ein Restore ist **pro Objekt** ein eigener Auftrag. Bei einem kompletten Jahrgang sind das Millionen Aufträge — deshalb S3 Batch Operations, das eine Objektliste (z. B. aus dem S3 Inventory) abarbeitet, statt Millionen Einzelaufrufe zu skripten. Beim Restore wählt man das **Tier**: Bulk (bis 48 h, am günstigsten) oder Standard (bis 12 h). Ein **Expedited-Tier gibt es bei Deep Archive nicht** — das ist der Unterschied zu Glacier Flexible Retrieval, wo Expedited in 1–5 Minuten liefert.

**7 — Nach Ablauf der Wartezeit entsteht eine temporäre Kopie.**
Das ist der am häufigsten missverstandene Schritt und deshalb im Diagramm als **eigene, gestrichelte Box** gezeichnet: Ein Restore **verschiebt das Objekt nicht zurück**. Das Original bleibt in Deep Archive, die Storage Class bleibt `DEEP_ARCHIVE`. Was entsteht, ist eine zeitlich begrenzte, lesbare Kopie — die Gültigkeit steuert der Parameter `RestoreDays`. In dieser Zeit **bezahlt man beide Kopien**. Wer die Daten dauerhaft wieder warm braucht, muss das Objekt aktiv **kopieren** (COPY in eine andere Storage Class); ein Restore allein genügt dafür nicht.

**8 — Der Prüfer lädt die Belege herunter.**
Der Rückweg ist gestrichelt: Er ist Ergebnis, kein Datenfluss der Architektur. Danach verfällt die temporäre Kopie von selbst, und der Kostenzustand kehrt automatisch auf „1 $ pro TB" zurück. Es gibt keinen Aufräumschritt, den jemand vergessen könnte.

---

## Prüfungs-Kernsatz

> **Lifecycle verschiebt, Restore kopiert.** Deep Archive ist die richtige Klasse, sobald „Jahre aufbewahren, praktisch nie lesen, Abruf darf Stunden dauern" zusammen im Text stehen — und ein Restore holt das Objekt **nie** aus der Klasse heraus, sondern legt nur eine befristete Kopie daneben.

---

## Klassiker-Fallen

**1. Die 30-Tage-Regel gilt nur für die IA-Klassen — nicht für Glacier.**
„Objekte müssen erst 30 Tage in S3 Standard liegen" stimmt **ausschließlich** für Transitions nach S3 Standard-IA und S3 One Zone-IA. Nach S3 Glacier Instant/Flexible Retrieval oder Deep Archive darf Lifecycle **ab Tag 1** transitionieren. Wer weiß, dass Daten sofort kalt sind, braucht den IA-Zwischenschritt nicht. Nicht verwechseln mit der **Mindestspeicherdauer**: IA 30 Tage, Glacier IR und FR 90 Tage, **Deep Archive 180 Tage** — wer früher löscht, zahlt die Restlaufzeit anteilig trotzdem.

**2. Deep Archive kennt kein Expedited.**
Zwei Tiers, mehr nicht: Standard bis 12 h, Bulk bis 48 h. „Wir brauchen die Daten notfalls in 5 Minuten" schließt Deep Archive damit aus und zeigt auf **Glacier Flexible Retrieval** (Expedited 1–5 min, Standard 3–5 h, Bulk 5–12 h kostenfrei) oder — bei echtem Millisekunden-Bedarf trotz Archivcharakter — auf **Glacier Instant Retrieval**.

**3. Viele kleine Objekte machen Deep Archive teuer statt billig.**
Jedes Objekt in Glacier Flexible Retrieval und Deep Archive kostet **40 KB Metadaten-Overhead** (32 KB zur Archiv-Rate, 8 KB zur S3-Standard-Rate), dazu Request-Kosten pro Transition. Bei Millionen Dateien von wenigen KB übersteigt der Overhead die eigentlichen Speicherkosten deutlich. Deshalb: kleine Objekte vorher **aggregieren** (tar/zip/Parquet) oder gar nicht erst transitionieren — genau dafür existiert der 128-KB-Default seit 09/2024. Im Szenario ist das entschärft, weil Rechnungs-PDFs 400 KB bis 2 MB groß sind.

**4. Abgrenzung: Kosten ≠ Unveränderbarkeit.**
Deep Archive macht das Archiv **billig**, nicht **fälschungssicher**. Sobald in der Frage „WORM", „unveränderbar", „Ransomware" oder „Compliance-Mode" auftaucht, ist die Antwort **S3 Object Lock** (plus Versioning) — orthogonal zur Storage Class und mit Lifecycle kombinierbar. Und wenn das Zugriffsmuster **unbekannt** statt bekannt ist, ist nicht Lifecycle die Antwort, sondern **S3 Intelligent-Tiering**.

---

## Bewusste Vereinfachungen im Diagramm

- **Die Lifecycle-Regel ist als Klammer über der Zeitachse gezeichnet**, nicht mit drei einzelnen Steuerpfeilen auf die Übergänge. Fachlich sind alle drei orangen Transitions (2, 3, 4) **Aktionen derselben Regel** — die Farbgleichheit trägt diese Zuordnung.
- **Preise sind Größenordnungen** (Listenpreise us-east-1, ohne Requests, ohne Metadaten-Overhead) und dienen nur dem Verhältnis der Klassen zueinander. Sie sind regionsabhängig und ändern sich.
- **Versionierung ist nicht gezeichnet.** `NoncurrentVersionExpiration` und `AbortIncompleteMultipartUpload` stehen nur als Text in der Regel-Box, obwohl beide in der Praxis eigene Kostenfallen sind.
- **Das S3 Inventory als Quelle der Objektliste für S3 Batch Operations** ist nicht als eigene Box dargestellt, sondern in Schritt 6 nur benannt.
- **Verschlüsselung, Bucket Policy und Object Lock** sind bewusst ausgelassen — diese Karte beantwortet die Kostenfrage, nicht die Sicherheitsfrage.
