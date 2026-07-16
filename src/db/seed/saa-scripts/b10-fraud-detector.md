---
service: Amazon Fraud Detector
seedKey: saa-c03-script-fraud-detector
batch: B10
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/frauddetector/latest/ug/what-is-frauddetector.html
  - https://aws.amazon.com/fraud-detector/faqs/
status: draft
---

# Amazon Fraud Detector

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Fraud Detector = der **fertige KI-Betrugsdetektiv** für Online-Betrug — ohne selbst ein ML-Modell zu bauen. Man füttert historische Daten (welche Transaktionen Betrug waren), er baut automatisch ein Modell und bewertet neue Aktivitäten in Echtzeit auf **Betrugsrisiko** (Amazon.com-Know-how). Für **Zahlungsbetrug, Fake-Accounts, Risiko-Score**. **Killer-Abgrenzung: Fraud Detector = Betrug durch Endnutzer in deiner App ↔ GuardDuty = Angriffe auf deine AWS-Infrastruktur.**

Der SAA vertieft: **den Ablauf (Modell + Regeln), die GuardDuty-Abgrenzung — und den Legacy-Status.**

---

## 🎯 SAA-Vertiefung

### Modell plus Regeln: Betrug in Echtzeit bewerten

**Das Problem:** Ein Online-Shop muss betrügerische Bestellungen und Fake-Registrierungen in Echtzeit erkennen. Ein eigenes SageMaker-Modell dafür bräuchte Data Scientists und Monate.

**Die Lösung:** **Fraud Detector** ist der fertige Weg: Man lädt historische Event-Daten (S3) hoch → wählt einen Modelltyp → der Dienst **trainiert/testet/deployt automatisch** ein Custom-Modell. Darauf setzt man einen **Detector** mit Modell **plus Regeln** (z. B. `IF model_score < 500 THEN review`), der jede neue Aktivität in **Millisekunden** per API bewertet — Outcome `approve`/`review`/`block`. Use Cases: Zahlungsbetrug, Fake-Account-Erstellung, Guest-Checkout-Betrug. „Online-Betrug in Echtzeit erkennen, ohne ML-Expertise" → Fraud Detector.

> **💡 Merksatz:** Ablauf: historische Daten → **automatisches Modell** → **Detector (Modell + Regeln)** → Echtzeit-Score (`approve`/`review`/`block`). Kein eigener Modellbau nötig.

### Die GuardDuty-Abgrenzung (die klassische Falle)

**Das Problem:** „Fraud Detector" und „GuardDuty" klingen beide nach „Bedrohung erkennen".

**Die Lösung — die entscheidende Trennung:**
- **Fraud Detector** schützt **dein Geschäft** vor Betrug durch **App-Endnutzer** (betrügerische Bestellungen, Fake-Accounts). Datenquelle: **deine** Transaktions-/Event-Daten. Kategorie: **Machine Learning**.
- **GuardDuty** schützt **deine AWS-Umgebung** vor **Infrastruktur-Bedrohungen** (kompromittierte Credentials, Cryptomining, Malware auf EC2). Datenquelle: CloudTrail, VPC Flow Logs, DNS Logs. Kategorie: **Security**.

Reflex: „betrügerische Bestellung/Fake-Registrierung/Zahlungsbetrug" → Fraud Detector; „kompromittiertes Konto/Cryptomining/anomale API-Aktivität" → GuardDuty.

> **💡 Merksatz:** **Fraud Detector = Endnutzer-Betrug (dein Geschäft, ML)** ↔ **GuardDuty = Infrastruktur-Bedrohung (deine AWS-Umgebung, Security)**. Nicht verwechseln.

### Der Legacy-Status

🛑 **Aktualität:** Fraud Detector nimmt **keine Neukunden mehr an** (AWS verweist auf SageMaker/AutoGluon/WAF), steht aber **weiter im SAA-C03-Guide**. Wie bei Forecast gilt: Als **Konzept-Antwort** für „fertige Online-Betrugserkennung" bleibt Fraud Detector prüfungsrelevant; die Abgrenzung zu GuardDuty ist das eigentlich Wichtige.

> **💡 Merksatz:** 🛑 Fraud Detector = **Legacy** (keine Neukunden), aber weiter im Guide. Prüfungsrelevant v. a. wegen der **GuardDuty-Abgrenzung**.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Betrug/Fraud", „betrügerische Transaktionen", „Fake-Accounts", „Online-Betrug in Echtzeit", „ohne ML-Expertise" → Fraud Detector.
- Ablauf: historische Daten → automatisches Modell → **Detector (Modell + Regeln)** → Echtzeit-Score.
- **Fraud Detector (Endnutzer-Betrug, ML) ↔ GuardDuty (Infrastruktur-Bedrohung, Security)** — die zentrale Falle.
- 🛑 Legacy (keine Neukunden), aber weiter im Guide.

## 💡 Der eine Satz zum Mitnehmen

**Fraud Detector ist der fertige Betrugsdetektiv, der App-Endnutzer-Betrug wie Fake-Accounts und Zahlungsbetrug per automatischem Modell plus Regeln in Echtzeit bewertet — und die prüfungsentscheidende Trennung lautet: Fraud Detector schützt dein Geschäft vor Nutzern, GuardDuty schützt deine AWS-Umgebung vor Angreifern.**
