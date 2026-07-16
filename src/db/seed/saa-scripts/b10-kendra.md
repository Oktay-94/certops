---
service: Amazon Kendra
seedKey: saa-c03-script-kendra
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/kendra/latest/dg/what-is-kendra.html
  - https://aws.amazon.com/blogs/machine-learning/introducing-amazon-kendra-genai-index-enhanced-semantic-search-and-retrieval-capabilities/
status: draft
---

# Amazon Kendra

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Kendra = die **intelligente Suchmaschine fürs Firmenwissen**, die echte **Fragen** versteht und die präzise Antwort findet — nicht nur Stichwort-Treffer. Natürliche Sprache („Wie viele Urlaubstage im ersten Jahr?"), viele **Konnektoren** (S3/SharePoint/Confluence/DBs), erkennt Synonyme (PTO=Urlaub=Abwesenheit). Abgrenzung: **Kendra sucht/findet die Stelle; Q Business formuliert die fertige Antwort**; **OpenSearch** = technische Volltext-/Log-Suche.

Der SAA vertieft: **NLP-Suche vs. Keyword, Konnektoren + ACL-Respekt, GenAI-Index/RAG — und die OpenSearch/Bedrock-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### NLP-Frage-Antwort statt Stichwort-Matching

**Das Problem:** Firmenwissen liegt in zig Systemen. Die eingebauten Suchen sind stichwortbasiert: „Urlaubsanspruch erstes Jahr" liefert 500 Dokumente mit dem Wort „Urlaub" — aber nicht die *eine* Antwort.

**Die Lösung:** **Kendra** ist ein ML-Suchdienst, der **natürlichsprachliche Fragen** versteht und die konkrete Antwort/Passage liefert (mit Confidence Score und Quelle) — Factoid-, Descriptive- und Keyword-Fragen. Es versteht **Bedeutung/Synonyme** (PTO = Urlaub = Abwesenheit), statt nur Wörter zu matchen. „intelligente Enterprise-Suche / natürliche Fragen an Dokumente" → Kendra.

> **💡 Merksatz:** Kendra = **NLP-Frage-Antwort-Suche** (versteht die Frage + Synonyme, liefert konkrete Antwort mit Quelle), nicht bloßes Stichwort-Matching.

### Konnektoren, ACLs und der GenAI-Index

**Das Problem:** Die Dokumente liegen in SharePoint, Confluence, S3 und ServiceNow — und nicht jeder Mitarbeiter darf alles sehen.

**Die Lösung:**
- **Konnektoren** binden viele Quellen gemeinsam ein (S3, SharePoint, OneDrive, Confluence, Salesforce, ServiceNow, JDBC-DBs).
- **User Context Filtering**: Kendra **respektiert bestehende ACLs** — Nutzer sehen nur, wozu sie berechtigt sind.
- 🛑 **Kendra GenAI Index**: ein RAG-optimierter Managed Retriever, der mit **Bedrock Knowledge Bases** und **Amazon Q Business** integriert (🔴 43 Konnektoren) — Kendra als Retrieval-Baustein für generative Apps.

„viele Quellen durchsuchbar, Berechtigungen respektieren" → Kendra mit Konnektoren + ACL-Filtering.

> **💡 Merksatz:** **Konnektoren** (S3/SharePoint/Confluence/…), **ACL-Respekt** (User Context Filtering); 🛑 **GenAI Index** als RAG-Retriever für Bedrock KB / Q Business.

### Kendra vs. OpenSearch vs. Bedrock KB

**Das Problem:** Kendra, OpenSearch und Bedrock Knowledge Bases berühren alle „Suche über Daten".

**Die Lösung:**
- **Kendra** = fertige **NLP-Frage-Antwort-Enterprise-Suche** über Dokumente (business-freundlich, out-of-the-box).
- **OpenSearch** = **Keyword-/Log-/Volltext-** und Analytics-Suche über operationelle Daten (du baust die Suche selbst, technischer).
- **Bedrock Knowledge Bases** = **RAG** für generative Antworten (FM mit eigenen Daten grounden).

Reflex: „natürliche Frage an Firmendokumente, direkte Antwort" → Kendra; „Log-Analyse/Volltextindex/Dashboards" → OpenSearch; „generative Antwort mit LLM auf eigenen Daten" → Bedrock KB.

> **💡 Merksatz:** **Kendra (NLP-Frage-Antwort über Dokumente) vs. OpenSearch (Keyword/Log/Analytics) vs. Bedrock KB (generative RAG-Antwort)**.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „intelligente Suche", „Enterprise Search", „Firmenwissen durchsuchen", „natürliche Fragen an Dokumente" → Kendra.
- **NLP-Frage-Antwort** (Synonyme, konkrete Antwort mit Quelle), nicht Stichwort-Matching.
- **Konnektoren** (S3/SharePoint/Confluence/…), **ACL-Respekt**; 🛑 **GenAI Index** (RAG-Retriever, 🔴 43 Konnektoren).
- **Kendra (NLP-Suche) vs. OpenSearch (Keyword/Log) vs. Bedrock KB (RAG)**; **Kendra findet Stelle vs. Q Business formuliert Antwort**.

## 💡 Der eine Satz zum Mitnehmen

**Kendra ist die NLP-Enterprise-Suche, die natürliche Fragen versteht und die konkrete Antwort aus vielen Datenquellen findet — unter Respektierung bestehender Berechtigungen — und grenzt sich ab von OpenSearch (Keyword-/Log-Suche) und Bedrock Knowledge Bases (generative RAG-Antworten).**
