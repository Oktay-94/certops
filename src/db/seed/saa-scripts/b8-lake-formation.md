---
service: AWS Lake Formation
seedKey: saa-c03-script-lake-formation
batch: B8
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/lake-formation/latest/dg/what-is-lake-formation.html
  - https://docs.aws.amazon.com/lake-formation/latest/dg/tag-based-access-control.html
status: draft
---

# AWS Lake Formation

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Lake Formation = der **Baumeister, der einen sicheren Data Lake in Tagen statt Monaten errichtet** — mit **zentralen, feingranularen Zugriffsrechten**. Es legt sich über Glue und S3. Kernstück: Rechte zentral bis auf **Tabellen-, Spalten- und Zeilenebene**, die **automatisch für alle Analyse-Dienste** (Athena, Redshift, EMR, QuickSight) gelten. Merksatz: **Glue liefert ETL + Katalog, Lake Formation baut daraus den sicheren Data Lake mit zentralen Rechten.** Die Beschränkung sitzt **auf den Daten, nicht auf der Abfrage**.

Der SAA vertieft: **die feingranulare Zugriffssteuerung, LF-Tags — und die Abgrenzung zu reinen IAM/S3-Policies.**

---

## 🎯 SAA-Vertiefung

### Feingranular: Die Beschränkung sitzt auf den Daten

**Das Problem:** Das Marketing-Team darf die Mitarbeitertabelle sehen — aber **nicht** die Gehaltsspalte, und nur Zeilen der eigenen Region. Mit reinen S3-/IAM-Rechten geht das kaum: Die wirken auf Bucket-/Objekt-Ebene, nicht auf Spalten oder Zeilen innerhalb einer Tabelle.

**Die Lösung:** **Lake Formation** setzt Berechtigungen (GRANT/REVOKE wie in einer Datenbank) bis auf **Database-, Table-, Column-, Row- und Cell-Ebene** — und **durchgesetzt in Athena, Redshift Spectrum, Glue ETL, EMR (Spark) und QuickSight** zugleich. Der entscheidende Punkt, der geprüft wird: Die Beschränkung sitzt **auf den Daten, nicht auf der Abfrage**. Tippt Marketing `SELECT * FROM mitarbeiter`, läuft die Query normal — aber es kommen **alle Spalten außer Gehalt** und nur die erlaubten Zeilen zurück. Man muss also nicht Abfragen einschränken, sondern definiert einmal zentral, **welche Daten** ein Principal überhaupt zu sehen bekommt — und das gilt engine-übergreifend.

> **💡 Merksatz:** Lake Formation = **Column-/Row-/Cell-Level-Rechte**, durchgesetzt über **Athena/Spectrum/Glue/EMR/QuickSight**. Die Beschränkung sitzt **auf den Daten** (jede Query sieht nur Erlaubtes), nicht auf der Abfrage.

### LF-Tags: Governance, die mitskaliert

**Das Problem:** Bei hunderten Tabellen und dutzenden Teams einzelne GRANTs pro Ressource zu pflegen, wird zum Verwaltungs-Albtraum.

**Die Lösung:** **LF-Tags (Tag-Based Access Control)** vergeben Berechtigungen **attributbasiert**: Man taggt Datenbanken/Tabellen/Spalten mit Key-Value-Paaren (z. B. `sensitivity=high`) und erteilt Rechte **auf die Tags** statt auf jede Ressource einzeln — die Tags vererben sich Database→Table→Column. Kommt eine neue Tabelle dazu, bekommt sie den passenden Tag und ist sofort korrekt berechtigt, ohne neue GRANTs. Das ist das ABAC-Prinzip für den Data Lake — und die Antwort auf „Governance über viele Ressourcen/Teams skalieren". Wichtig: **LF-Tags ≠ IAM-Tags** (nicht austauschbar). Für Zeilen-/Cell-Level nutzt man **Data Filters** (z. B. Row-Filter `marketplace='US'`).

> **💡 Merksatz:** **LF-Tags (TBAC)** = attributbasierte Rechte auf Tags statt pro Ressource (vererbt, skaliert). **Data Filters** für Row/Cell-Level. LF-Tags ≠ IAM-Tags.

### Die Abgrenzung: Lake Formation vs. IAM/S3-Policies

**Das Problem:** „Zugriff auf Data-Lake-Daten steuern" — warum nicht einfach IAM- und Bucket-Policies?

**Die Lösung:** IAM- und S3-Bucket-Policies sind **grob**: Sie wirken auf **Objekt-/Prefix-Ebene** und kennen **keine Spalten oder Zeilen** innerhalb einer Tabelle. Sobald „nur bestimmte Spalten/Zeilen sehen" oder „zentrale Rechte über mehrere Analytics-Dienste hinweg" gefragt ist, reicht das nicht — dann **Lake Formation**. Der Reflex: „feingranular (Spalten-/Zeilenebene) / zentral für Athena+Redshift+EMR" → Lake Formation; „ganzen Bucket/Prefix freigeben" → IAM/S3-Policy.

> **💡 Merksatz:** **IAM/S3-Policies = grob (Objekt/Prefix), keine Spalten/Zeilen.** **Lake Formation = feingranular + zentral über alle Analytics-Dienste.** Column/Row-Level → immer Lake Formation.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Data Lake absichern", „zentrale Zugriffsrechte", „feingranular (Spalten-/Zeilenebene)", „Rechte für Athena/Redshift/EMR zentral" → Lake Formation.
- **Column-/Row-/Cell-Level**, durchgesetzt über Athena/Spectrum/Glue/EMR/QuickSight; Beschränkung **auf den Daten**, nicht der Abfrage.
- **LF-Tags (TBAC)** = attributbasiert, skaliert (vererbt); **Data Filters** für Row/Cell. LF-Tags ≠ IAM-Tags.
- Abgrenzung: **IAM/S3-Policies (grob, Objekt/Prefix) vs. Lake Formation (feingranular, zentral)**.
- Baut auf Glue Data Catalog; Blueprints für Ingest; Cross-Account-Sharing.

## 💡 Der eine Satz zum Mitnehmen

**Lake Formation ist die Governance-Schicht des Data Lake: Es setzt Spalten-, Zeilen- und Zell-Rechte, die auf den Daten selbst sitzen und automatisch in Athena, Redshift, EMR und QuickSight gelten — und wo IAM/S3-Policies nur ganze Buckets kennen, macht Lake Formation feingranulare, skalierende Kontrolle über LF-Tags.**
