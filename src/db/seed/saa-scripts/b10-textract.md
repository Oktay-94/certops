---
service: Amazon Textract
seedKey: saa-c03-script-textract
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/textract/latest/dg/what-is.html
  - https://aws.amazon.com/textract/features/
status: draft
---

# Amazon Textract

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Textract = die KI, die gescannte Dokumente nicht nur abtippt, sondern ihre **Struktur versteht** — Formularfelder, Tabellen, Werte. Mehr als OCR: **reiner Text** + **Key-Value-Paare** + **Tabellen**. Praxis: Scan in S3 → Lambda → Textract → strukturierte Felder in die DB. Abgrenzung: **Textract holt den Text raus, Comprehend versteht ihn**; Rekognition = Text in Szenen. Eselsbrücke: Text + extract.

Der SAA vertieft: **die fünf API-Gruppen, Queries/Analyze-Spezialisierungen, sync vs. async — und die Rekognition-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Mehr als OCR: die fünf API-Gruppen

**Das Problem:** Tausende gescannte Rechnungen sollen automatisch verarbeitet werden. Reine OCR liefert nur rohen Text — sie weiß nicht, welcher Betrag zu „Gesamtsumme" gehört oder was eine Tabellenzeile ist.

**Die Lösung:** Textract extrahiert Text **und Struktur** über fünf API-Gruppen:
- **Detect Document Text**: reines OCR (Text + Handschrift).
- **Analyze Document**: mit Features **FORMS** (Key-Value-Paare), **TABLES**, **QUERIES** (natürlichsprachliche Fragen wie „Was ist die Rechnungsnummer?"), SIGNATURES, LAYOUT.
- **Analyze Expense**: Rechnungen/Belege (Vendor, Total, Line Items, Steuern — normalisiert).
- **Analyze ID**: Ausweisdokumente (Name, Geburtsdatum, Ablauf).
- **Analyze Lending**: vorkonfigurierte Pipeline für Kredit-/Hypothekenunterlagen.

Ausgabe: JSON mit Bounding Boxes und Confidence Scores. „Formulare/Tabellen/Rechnungen strukturiert extrahieren" → Textract (nicht reine OCR).

> **💡 Merksatz:** Fünf Gruppen: **Detect Document Text** (OCR) · **Analyze Document** (FORMS/TABLES/QUERIES) · **Analyze Expense** (Rechnungen) · **Analyze ID** (Ausweise) · **Analyze Lending** (Kredite). Mehr als OCR = **Struktur**.

### Sync, Async und die serverlose Pipeline

**Das Problem:** Einzelne Belege sollen sofort verarbeitet werden, mehrseitige PDFs asynchron im Hintergrund.

**Die Lösung:**
- **Synchron**: Einzelseite/kleine Bilder, niedrige Latenz.
- **Asynchron**: mehrseitige PDFs (größere Dateien), Ergebnis über SNS/Abholung.

Typische **serverlose Pipeline**: Scan landet in **S3** → Upload triggert **Lambda** → Lambda ruft Textract → extrahierte Felder (Rechnungsnummer, Betrag) strukturiert in eine Datenbank. Tausende Dokumente automatisch, kein Abtippen.

> **💡 Merksatz:** **Sync** (Einzelseite, schnell) vs. **Async** (mehrseitige PDFs). Muster **S3 → Lambda → Textract → DB**.

### Die Rekognition- und Comprehend-Abgrenzung

**Das Problem:** Textract, Rekognition und Comprehend berühren alle „Text".

**Die Lösung:**
- **Textract** = Text **und Struktur** aus **Dokumenten** (Formulare, Tabellen).
- **Rekognition DetectText** = Text in **Szenen/Bildern** (Schilder, Nummernschilder) — **keine** Dokumentstruktur.
- **Comprehend** = den extrahierten Text **inhaltlich verstehen** (Sentiment, Entities).

Reflex: „Dokument/Formular/Tabelle" → Textract; „Text im Foto/Szene" → Rekognition; „Sinn des Textes" → Comprehend. Oft Kette: Textract → Comprehend.

> **💡 Merksatz:** **Textract (Dokumente/Struktur) vs. Rekognition DetectText (Text in Szenen) vs. Comprehend (Sinn verstehen)**. Kette: Textract → Comprehend.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Text aus Dokumenten/PDFs/Scans", „OCR", „Formulare/Tabellen auslesen", „Key-Value-Paare" → Textract.
- Fünf API-Gruppen: **Detect Document Text · Analyze Document (FORMS/TABLES/QUERIES) · Analyze Expense · Analyze ID · Analyze Lending**.
- **Sync** (Einzelseite) vs. **Async** (mehrseitige PDFs); Muster **S3 → Lambda → Textract**.
- **Textract (Dokumente) vs. Rekognition DetectText (Szenen) vs. Comprehend (verstehen)**.

## 💡 Der eine Satz zum Mitnehmen

**Textract zieht aus Dokumenten nicht nur Text, sondern Struktur — Formulare, Tabellen, Rechnungen und Ausweise über fünf API-Gruppen, meist im Muster S3→Lambda→Textract — und ist damit klar getrennt von Rekognition (Text in Szenen) und Comprehend (den Text inhaltlich verstehen).**
