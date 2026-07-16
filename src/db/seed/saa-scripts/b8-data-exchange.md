---
service: AWS Data Exchange
seedKey: saa-c03-script-data-exchange
batch: B8
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html
  - https://aws.amazon.com/data-exchange/faqs/
status: draft
---

# AWS Data Exchange

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Data Exchange ist im CLF-Kurs nicht behandelt — hier die Einordnung: Data Exchange = der **Marktplatz für Third-Party-Daten**. Man findet und **abonniert** fremde Datensätze (Wetter, Finanzen, Demografie u. a.) und nutzt sie direkt in AWS — statt sie mühsam von Anbietern zu beziehen und selbst einzuspielen. Abrechnung über den AWS Marketplace.

Der SAA testet vor allem **die Rolle im Analytics-Stack** und die **Abgrenzung** zu den Data-Lake-/Warehouse-Diensten.

---

## 🎯 SAA-Vertiefung

### Third-Party-Daten abonnieren statt selbst beschaffen

**Das Problem:** Ein Analytics-Team braucht externe Referenzdaten (z. B. Marktdaten eines Anbieters) und will sie regelmäßig aktuell in Redshift abfragen — ohne für jede Aktualisierung einen manuellen Export/Import-Prozess zu bauen.

**Die Lösung:** **AWS Data Exchange** ist die **Datendistributionsschicht**: Man abonniert einen Datensatz eines Anbieters, und Data Exchange liefert ihn in verschiedenen Formen — **Files, APIs (über API Gateway), Amazon S3, und direkt in Amazon Redshift**. Besonders prüfbar ist **Data Exchange for Amazon Redshift**: Third-Party-Daten stehen als **read-only Datashare** direkt im Cluster zur Verfügung — **ohne Extract/Transform/Load**; der Zugriff wird automatisch mit Beginn des Abonnements gewährt und mit dessen Ende entzogen. Das ist die Antwort auf „Third-Party-Datensatz abonnieren und ohne ETL in Redshift abfragen" → Data Exchange (nicht eine selbstgebaute Glue-Pipeline).

Wichtig fürs Verständnis: Data Exchange ist **selbst kein Data Lake und kein Warehouse** — es **speist** S3-Data-Lakes und Redshift-Warehouses mit externen Daten. Die Bausteine sind Data Sets → Revisions → Assets.

> **💡 Merksatz:** **Data Exchange = Third-Party-Daten abonnieren** (Files/API/S3/Redshift). **for Redshift** = read-only Datashare ohne ETL. Es ist die **Distributionsschicht**, kein eigener Lake/Warehouse.

### Die Abgrenzung im Analytics-Stack

**Das Problem:** Data Exchange, S3-Data-Lake und Redshift klingen alle nach „Daten für Analysen". Wann welches?

**Die Lösung:** Die Rollen sind verschieden:
- **Data Exchange** = **Bezugsquelle** für **fremde** Daten (finden, abonnieren, einspeisen).
- **S3-Data-Lake / Lake Formation** = das **Sammelbecken** und die Governance für die **eigenen** Daten.
- **Redshift / Athena** = die **Abfrage/Analyse** darüber.

Der Reflex: „**externe/gekaufte** Daten beziehen und einspeisen" → **Data Exchange**; „eigene Daten sammeln/absichern" → S3/Lake Formation; „abfragen" → Athena/Redshift. Distraktoren sind meist „eine eigene ETL-Pipeline bauen" (unnötig, wenn ein Anbieter die Daten via Data Exchange liefert) oder „manueller S3-Transfer" (kein automatisches Abo-Update).

> **💡 Merksatz:** **Data Exchange = fremde Daten beziehen**, S3/Lake Formation = eigene Daten sammeln/absichern, Athena/Redshift = abfragen. „externe/gekaufte Daten einspeisen" → Data Exchange.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Third-Party-Daten", „Datensatz abonnieren", „externe Daten finden/beziehen" → Data Exchange.
- Dataset-Typen: **Files, APIs, S3, Redshift** (+ Lake Formation Preview); **for Redshift** = read-only Datashare **ohne ETL**.
- Data Exchange = **Distributionsschicht**, kein eigener Data Lake/Warehouse (speist S3/Redshift).
- Abgrenzung: **Data Exchange (fremde Daten) vs. S3/Lake Formation (eigene Daten) vs. Athena/Redshift (Abfrage)**.
- Distraktoren: eigene ETL-Pipeline / manueller S3-Transfer (statt Abo).

## 💡 Der eine Satz zum Mitnehmen

**Data Exchange ist der Marktplatz, über den man fremde Datensätze abonniert und ohne ETL direkt in S3 oder Redshift nutzt — es beschafft externe Daten, während S3/Lake Formation die eigenen sammeln und Athena/Redshift sie abfragen.**
