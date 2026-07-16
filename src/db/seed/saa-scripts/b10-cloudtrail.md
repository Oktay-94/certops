---
service: AWS CloudTrail
seedKey: saa-c03-script-cloudtrail
batch: B10
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
  - https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html
  - https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-management-and-data-events-with-cloudtrail.html
status: draft
---

# AWS CloudTrail

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> CloudTrail = der **Spurensucher, der jeden API-Aufruf protokolliert** (in AWS ist alles ein API-Call). Für jedes Event: **Wer? Was? Wann? Von wo?** → Basis für **Auditing, Compliance, Forensik**. Standardmäßig **90 Tage Event-Historie**; langfristig via **Trail nach S3**. **GuardDuty** liest CloudTrail. Killer-Abgrenzung: **CloudWatch = Performance (WIE?), CloudTrail = Aktivität (WER hat WAS?)**.

Der SAA vertieft: **Management vs. Data vs. Insights Events, Trails (Multi-Region/Organization), Log File Integrity — und die Config-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Die drei Event-Typen

**Das Problem:** Man will protokollieren, wer einzelne Objekte in einem sensiblen S3-Bucket liest — merkt aber, dass die Standard-CloudTrail-Historie diese Zugriffe gar nicht zeigt.

**Die Lösung — die drei Event-Typen:**
- **Management Events** (Control Plane): Verwaltungsaktionen wie `RunInstances`, `CreateBucket`, `ConsoleLogin` — **standardmäßig** aufgezeichnet. Das ist, was in der Event-Historie steht.
- **Data Events** (Data Plane): hochvolumige Datenzugriffe wie S3 `GetObject`/`PutObject` oder Lambda `Invoke` — **nicht** default, **kostenpflichtig** (wegen des Volumens explizit zu aktivieren). „einzelne S3-Objektzugriffe protokollieren" → Data Events aktivieren.
- **Insights Events**: erkennen automatisch **ungewöhnliche** API-/Fehlerraten (plötzlich viele Löschungen) — explizit zu aktivieren, kostenpflichtig. „Anomalien in der API-Aktivität" → Insights.

> **💡 Merksatz:** **Management Events** (Control Plane, default) · **Data Events** (S3-Objekt/Lambda-Invoke, opt-in, kostet) · **Insights Events** (Anomalien, opt-in). „einzelne Objektzugriffe" → Data Events.

### Event-Historie, Trails und Integrity

**Das Problem:** Ein Auditor will API-Aktivität der letzten zwei Jahre sehen, manipulationssicher, über alle Regionen und alle Accounts der Organisation.

**Die Lösung:**
- Die kostenlose **Event-Historie** deckt nur die letzten **90 Tage** an **Management Events** pro Region ab. Für alles darüber hinaus legt man einen **Trail** an, der Events dauerhaft nach **S3** liefert (optional zusätzlich an CloudWatch Logs/EventBridge).
- Ein **Multi-Region-Trail** erfasst alle Regionen; ein **Organization Trail** alle Accounts der Organisation zentral — das ist die Antwort auf „org-weites, langfristiges Audit".
- **Log File Integrity Validation** erzeugt signierte Digest-Dateien, mit denen sich nachweisen lässt, dass Logs nicht verändert wurden — wichtig für Forensik/Compliance.

> **💡 Merksatz:** **Event-Historie 90 Tage** (Management, gratis); darüber hinaus **Trail → S3**. **Multi-Region-/Organization-Trail** für org-weites Audit; **Log File Integrity Validation** für Manipulationsschutz.

### Die Config-Abgrenzung — das Trio schließen

**Das Problem:** „Wer hat die Security Group geöffnet?" vs. „Wann war sie offen?" — zwei Fragen, zwei Dienste.

**Die Lösung:** Das meistgeprüfte Management-Trio trennt sauber:
- **CloudWatch** → „**wie** läuft es" (Performance/Metriken).
- **CloudTrail** → „**wer** hat **was** wann getan" (API-Aufrufer).
- **Config** → „**wie war/ist** die Ressource konfiguriert, ist sie compliant" (Zustand über Zeit).

Der feine Punkt: **Config** zeigt, *dass* sich eine Konfiguration geändert hat und wann; **CloudTrail** zeigt, *wer* den API-Aufruf gemacht hat. Oft braucht man beide zusammen — aber „wer war der Aufrufer" ist immer CloudTrail.

> **💡 Merksatz:** **CloudWatch (wie) · CloudTrail (wer/was) · Config (Konfigurationszustand)**. Config zeigt *dass/wann* die Config sich änderte, CloudTrail zeigt *wer* aufrief.

---

## ⚠️ Prüfungs-Knackpunkte

- **Management** (default) · **Data** (S3-Objekt/Lambda, opt-in, kostet) · **Insights** (Anomalien, opt-in).
- **Event-Historie 90 Tage** (Management, gratis); langfristig **Trail → S3**; **Multi-Region/Organization Trail**.
- **Log File Integrity Validation** (signierte Digests) für Manipulationsschutz.
- Trio: **CloudWatch (wie) · CloudTrail (wer/was) · Config (Konfiguration)**.
- 🛑 CloudTrail Lake (SQL-Abfrage über Events) — keine Neukunden ab Mai 2026; Alternative: Athena auf S3-Trail.
- GuardDuty nutzt CloudTrail als Datenquelle; KMS-Nutzung landet in CloudTrail.

## 💡 Der eine Satz zum Mitnehmen

**CloudTrail protokolliert jeden API-Aufruf mit Wer/Was/Wann/Woher — Management-Events default, Data-Events für Objektzugriffe opt-in, 90 Tage Historie und darüber hinaus ein Trail nach S3; in der großen Verwechslung ist CloudTrail immer die Antwort auf „wer hat es getan".**
