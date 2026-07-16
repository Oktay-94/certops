---
service: Amazon Macie
seedKey: saa-c03-script-macie
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/macie/latest/user/what-is-macie.html
  - https://docs.aws.amazon.com/macie/latest/user/data-classification.html
status: draft
---

# Amazon Macie

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Macie = der **Datenschutz-Detektiv, der die S3-Buckets durchwühlt**. Findet und klassifiziert per Machine Learning **sensible Daten in S3**: PII, Finanzdaten (Kreditkarten), Zugangsdaten. Meldet „5.000 Kreditkartennummern — und der Bucket ist öffentlich!". Merksatz: **Macie schaut in die Dateien hinein und fragt „stehen hier Geheimnisse drin?"** Ausschließlich **S3 + sensible Daten**.

Der SAA vertieft: **die zwei Discovery-Modi, Managed vs. Custom Data Identifiers — und die eindeutige Abgrenzung in der Detection-Suite.**

---

## 🎯 SAA-Vertiefung

### Zwei Wege, sensible Daten zu finden

**Das Problem:** Ein Unternehmen hat hunderte Buckets mit Petabytes an Daten. Alles vollständig zu scannen wäre teuer — aber man will trotzdem wissen, wo sensible Daten liegen, und für ein DSGVO-Audit gezielt bestimmte Buckets tief prüfen.

**Die Lösung:** Macie bietet zwei Modi, die sich ergänzen:
- **Automated Sensitive Data Discovery**: läuft kontinuierlich und **sampling-basiert** über das gesamte S3-Inventar — es zieht Stichproben, um kostengünstig eine **Landkarte** zu erstellen, wo überall sensible Daten *wahrscheinlich* liegen. Für den breiten Überblick.
- **Sensitive Data Discovery Jobs**: gezielte, **tiefe** Scans mit definiertem Scope (bestimmte Buckets, bestimmte Datentypen). Für das gründliche Audit einzelner Buckets.

So bekommt man beides: den günstigen Gesamtüberblick und die tiefe Prüfung dort, wo es zählt. Parallel überwacht Macie die **Bucket-Sicherheitseinstellungen** und meldet als **Policy Findings**, wenn ein Bucket öffentlich oder unverschlüsselt ist — auch ohne die Inhalte zu scannen.

> **💡 Merksatz:** **Automated Discovery** = günstiger Sampling-Überblick übers ganze Inventar; **Discovery Jobs** = gezielte Tiefen-Scans (Audit). Dazu **Policy Findings** für öffentliche/unverschlüsselte Buckets.

### Managed vs. Custom Data Identifiers

**Das Problem:** Macie soll Standard-PII erkennen — aber auch firmenspezifische Muster wie interne Kundennummern im Format `KD-XXXXXX`.

**Die Lösung:** **Managed Data Identifiers** sind eingebaute, von AWS gepflegte Kriterien für viele Länder: Kreditkartennummern, Bankverbindungen, Passnummern, AWS Secret Access Keys, Private Keys, Gesundheitsdaten. Sie decken die Standard-PII/PHI/Finanzfälle sofort ab. Für Eigenes gibt es **Custom Data Identifiers** (Regex + Keywords) — z. B. das interne Kundennummern-Format. **Allow Lists** schließen bekannte Falsch-Positive aus (z. B. eine öffentliche Test-Adresse). Das ist die Antwort auf „auch unternehmens­spezifische sensible Muster erkennen".

> **💡 Merksatz:** **Managed Data Identifiers** = fertige PII/Finanz/Credential-Muster; **Custom Data Identifiers** (Regex+Keywords) = firmenspezifische Muster; Allow Lists gegen Falsch-Positive.

### Die eindeutige Zuordnung

Macie ist in der Detection-Suite der am klarsten abgegrenzte Dienst — es geht **immer um Daten-Inhalte in S3**:
- „Kreditkartennummern / PII / sensible Daten **in S3** finden" → **Macie**.
- „aktive Bedrohung / Krypto-Mining" → GuardDuty.
- „CVE / Schwachstelle" → Inspector.

Wenn eine Frage nach dem **Inhalt** von S3-Objekten fragt („liegen hier personenbezogene Daten?"), ist es Macie — kein anderer Dienst schaut in die Dateien hinein. Findings gehen an Security Hub / EventBridge; eine Auto-Reaktion kann einen öffentlichen Bucket sofort privat setzen.

> **💡 Merksatz:** **Daten-Inhalte in S3 (PII/Kreditkarten/Credentials) → immer Macie.** Kein anderer Dienst klassifiziert S3-Inhalte.

---

## ⚠️ Prüfungs-Knackpunkte

- **Ausschließlich S3 + sensible Daten** (schaut in die Dateien).
- **Automated Sensitive Data Discovery** (Sampling, Überblick) vs. **Discovery Jobs** (gezielt, tief).
- **Managed Data Identifiers** (fertig) + **Custom Data Identifiers** (Regex/Keywords) + Allow Lists.
- **Policy Findings** für öffentliche/unverschlüsselte Buckets (ohne Inhaltsscan).
- Findings → Security Hub / EventBridge (z. B. Auto-Remediation Bucket privat).
- Abgrenzung: **Macie (S3-Daten) ≠ GuardDuty (Threats) ≠ Inspector (CVEs)**.

## 💡 Der eine Satz zum Mitnehmen

**Macie ist der einzige Dienst, der in die S3-Objekte hineinschaut: Er klassifiziert PII, Kreditkarten und Credentials — mit günstigem Sampling-Überblick oder tiefem Audit-Scan — und ist damit die Antwort auf jede Frage nach sensiblen Daten in S3.**
