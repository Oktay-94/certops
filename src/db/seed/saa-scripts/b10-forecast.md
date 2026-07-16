---
service: Amazon Forecast
seedKey: saa-c03-script-forecast
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/forecast/latest/dg/what-is-forecast.html
  - https://aws.amazon.com/blogs/machine-learning/transition-your-amazon-forecast-usage-to-amazon-sagemaker-canvas/
status: draft
---

# Amazon Forecast

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Forecast = die **Kristallkugel für Zeitreihen** — ML-Vorhersagen über die Zukunft aus historischen Daten (Verkäufe, Lagerbedarf, Energie). Man gibt historische Zeitreihen + optionale Faktoren (Wetter, Feiertage), Forecast baut automatisch das Prognosemodell (Amazon.com-Technik). Abgrenzung: **Forecast sagt vorher (ML) ↔ Timestream speichert Zeitreihen (Datenbank)**. Und: **Empfehlungen für Nutzer = Personalize ↔ Vorhersage über die Zeit = Forecast**.

Der SAA vertieft: **den Zeitreihen-Use-Case, die Abgrenzungen — und den wichtigen Legacy-Status.**

---

## 🎯 SAA-Vertiefung

### Zeitreihen-Vorhersage aus der Vergangenheit

**Das Problem:** Ein Händler muss die Nachfrage des nächsten Monats vorhersagen, um Lagerbestand zu planen — zu viel bindet Kapital, zu wenig verliert Umsatz. Ein eigenes Prognosemodell braucht Data-Science-Wissen.

**Die Lösung:** **Forecast** ist ein fertiger Dienst für **Zeitreihen-Prognosen**: historische Zeitreihen (Verkäufe der letzten Jahre) plus optionale zugehörige Faktoren (Preise, Wetter, Feiertage) rein → Forecast wählt/kombiniert automatisch Algorithmen und liefert die Vorhersage. Use Cases: Nachfrage-/Verkaufsprognose, Lagerplanung, Ressourcen-/Personalplanung, Finanzprognose. „zukünftige Werte/Nachfrage über die Zeit vorhersagen" → Forecast.

> **💡 Merksatz:** Forecast = **Zeitreihen-Vorhersage** (historische Daten + Faktoren → Prognose), automatische Algorithmuswahl, kein ML-Wissen. „Nachfrage/Zukunft über die Zeit" → Forecast.

### Die Abgrenzungen

**Das Problem:** Forecast wird mit Timestream und Personalize verwechselt.

**Die Lösung:**
- **Forecast** = ML, das Zeitreihen **vorhersagt** (Zukunft).
- **Timestream** = Zeitreihen-**Datenbank** zum Speichern/Abfragen (z. B. IoT-Sensordaten) — sagt **nichts** vorher.
- **Personalize** = **Empfehlungen** für Nutzer (was gefällt), nicht Vorhersage über die Zeit.

Reflex: „Zukunft prognostizieren" → Forecast; „Zeitreihen speichern/abfragen" → Timestream; „Produktempfehlung" → Personalize.

> **💡 Merksatz:** **Forecast (vorhersagen, ML) ↔ Timestream (speichern, DB) ↔ Personalize (empfehlen)**. „vorhersagen über Zeit" → Forecast.

### Der Legacy-Status (wichtig)

🛑 **Aktualität:** AWS hat **Forecast am 29.07.2024 für Neukunden geschlossen**; Bestandskunden nutzen weiter, als Nachfolger empfiehlt AWS **SageMaker Canvas** (No-Code-ML inkl. Zeitreihen-Prognose). **Aber:** Forecast steht **weiterhin im offiziellen SAA-C03-Exam-Guide** — Prüfungsfragen können es als richtige „Zeitreihen-Vorhersage"-Antwort verwenden. Praktische Konsequenz: In einer Frage nach dem **richtigen Dienst-Konzept** ist Forecast korrekt; in einer Frage nach einer **Neuimplementierung 2026** kann SageMaker Canvas die bessere Antwort sein. Beides kennen.

> **💡 Merksatz:** 🛑 Forecast = **Legacy** (keine Neukunden seit 29.07.2024, Nachfolger **SageMaker Canvas**), aber **weiter im Guide**. Konzept-Frage → Forecast; Neuimplementierung → ggf. Canvas.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Nachfrage/Verkauf/Bedarf vorhersagen", „Zeitreihen-Prognose", „zukünftige Werte" → Forecast.
- **Forecast (vorhersagen, ML) vs. Timestream (Zeitreihen-DB) vs. Personalize (Empfehlungen)**.
- 🛑 **Legacy**: keine Neukunden seit 29.07.2024, Nachfolger **SageMaker Canvas** — aber weiter im Guide.
- Fertiger Dienst (kein SageMaker-Modellbau nötig).

## 💡 Der eine Satz zum Mitnehmen

**Forecast ist die Kristallkugel für Zeitreihen — es sagt aus historischen Daten die künftige Nachfrage voraus (nicht speichern wie Timestream, nicht empfehlen wie Personalize) — und bleibt trotz Legacy-Status die Guide-Antwort für ML-Zeitreihen-Vorhersage, während Neuimplementierungen zu SageMaker Canvas wandern.**
