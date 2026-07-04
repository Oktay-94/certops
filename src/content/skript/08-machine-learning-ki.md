# Kapitel 8 — Machine Learning & KI

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne — die EINE Frage, die fast jede KI-Prüfungsaufgabe entscheidet:** AWS bietet KI auf **zwei Ebenen** an. Willst du ein **maßgeschneidertes Modell selbst bauen** → **SageMaker** (die Küche). Willst du eine **fertige Standardfunktion per API** → der passende vortrainierte Dienst (die gelieferte Pizza). Willst du ein **fertiges Fremd-Modell nur mieten** → **Bedrock** (das Restaurant). Merk dir diese drei — dann sortiert sich der ganze Block.

`Bedrock (fremde KI mieten) — Fertige KI-Dienste (API, kein ML-Wissen) — SageMaker (eigene KI selbst bauen)`

---

## Amazon Bedrock

**Metapher / Konzept**

> Das Kaufhaus für fertige KI-Gehirne. Amazon **Bedrock (Das Edel-Restaurant):** Du gehst hin, bestellst ein fertiges 5-Sterne-Menü (eine fertige KI wie z. B. von Anthropic oder Meta) und kannst es sofort konsumieren.

**Das Problem & Die Lösung**

Will ein Unternehmen eine eigene schlaue KI (wie z. B. ChatGPT) für seine Software bauen, bräuchte es riesige Datenmengen, extrem teure Spezial-Server und monatelange Trainingszeit. Für **99 % der Firmen unbezahlbar und viel zu komplex**.

Mit **Bedrock** musst du keine eigene KI mehr trainieren. AWS hat sich mit den weltbesten KI-Forschern (**Anthropic, Meta, Mistral, Stability AI**) zusammengetan und bietet deren fertige **Foundation Models** zur sofortigen Miete. Warum Bedrock so mächtig ist:
- **Freie Auswahl (Das Menü):** Du bist nicht an eine KI gebunden — du wählst, welche gerade am besten passt. Geniale Texte/Code? „Claude" von Anthropic. Fotorealistische Bilder? „Stable Diffusion".
- **Der einfache Stecker (API):** keine komplizierte KI-Infrastruktur — mit wenigen Zeilen Code direkt als Funktion in App/Website.
- **Absoluter Datenschutz — der Hauptgrund für große Firmen:** Gibst du der KI streng geheime Firmen-Dokumente, garantiert AWS, dass **diese Daten niemals das weltweite Basismodell weiter trainieren**. Deine Daten bleiben für immer in deiner privaten Cloud eingesperrt.

**Der Unterschied zu SageMaker:** Bei **SageMaker** bekommst du Schaufel, Sand und Zement, um dir ein eigenes ML-Modell von Grund auf selbst zu mauern. Bei **Bedrock** bekommst du den Schlüssel für ein fertiges, hochintelligentes Haus, das andere schon gebaut haben — sofort benutzbar.

🛑 **Aktualität (verifiziert):** Das Modellangebot in Bedrock wächst laufend — neben Anthropic/Meta/Mistral/Stability sind über die Zeit weitere Anbieter dazugekommen (u. a. Amazons eigene **Titan/Nova**-Modelle und, im Zuge der AWS-OpenAI-Partnerschaft 2026, auch OpenAI-Modelle). **Fürs Skript wichtig ist nicht die Modell-Liste** (die veraltet ständig), sondern das Konzept: *ein* API-Zugang, *viele* austauschbare Foundation Models, Daten bleiben privat. Nenn in einer Prüfung „Claude/Titan/Llama" als Beispiele, nicht als abschließende Liste.

🛑 **Pro-Tipp SAA:** Rund um Bedrock kennst du am besten drei Bausteine: **Knowledge Bases** (RAG — verbindet ein Modell mit deinen eigenen Dokumenten, damit es faktenbasiert antwortet), **Agents** (das Modell ruft Tools/APIs auf und erledigt mehrstufige Aufgaben) und **Guardrails** (Filter gegen unerwünschte Inhalte/PII). Signalwort „generative KI auf **eigenen** Firmendaten, ohne selbst zu trainieren" → Bedrock (+ Knowledge Base).

---

## Amazon SageMaker

**Metapher / Konzept**

> Die komplette Werkstatt, in der Profis ihre eigenen KI-Modelle von Grund auf bauen, trainieren und betreiben. **SageMaker (Die Großküche):** AWS stellt dir eine professionelle Industrieküche mit den besten Öfen der Welt zur Verfügung. Du bringst aber deine eigenen Zutaten (Trainingsdaten) und dein eigenes Geheimrezept (Code) mit und backst dir deine KI von Grund auf selbst.

**Das Problem & Die Lösung**

Eine Firma will ein **maßgeschneidertes** ML-Modell — z. B. eines, das aus Verkaufsdaten vorhersagt, welcher Kunde nächsten Monat kündigt. Ein langer, komplexer Prozess: Daten aufbereiten, Modell wählen und programmieren, auf teuren GPU-Servern trainieren, testen, optimieren, als zuverlässigen Dienst live bereitstellen. Jeden Schritt einzeln mit eigener Infrastruktur zu stemmen ist extrem aufwendig.

**SageMaker** ist die vollständig verwaltete Plattform für den **gesamten ML-Lebenszyklus** — die drei Stationen der Werkstatt:
- **Build:** SageMaker gibt dir auf Knopfdruck einen fertigen Arbeitsplatz im Browser (ein **Jupyter Notebook**) — dort schreibst du Python-Code und säuberst deine Rohdaten.
- **Train:** Beim Start des Trainings mietet SageMaker im Hintergrund vollautomatisch riesige GPU-Server, trainiert das Modell, speichert das fertige „Gehirn" — und **schaltet die teuren Server sofort wieder aus**, damit du dich nicht ruinierst.
- **Deploy:** Mit einem Klick stellst du das trainierte Modell als **Endpoint** live ins Internet — externe Apps rufen über eine Schnittstelle Echtzeit-Vorhersagen ab.

**Der entscheidende Punkt:** SageMaker ist für **Datenwissenschaftler und Entwickler, die ein individuelles Modell selbst bauen wollen** — mit voller Kontrolle.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „eigenes ML-Modell bauen/trainieren/deployen", „Machine-Learning-Lebenszyklus", „Datenwissenschaftler", „individuelles/custom Modell" → **SageMaker**.
- **Die Killer-Abgrenzung:** maßgeschneidertes Modell mit eigener Kontrolle → **SageMaker**. Fertige Standard-Funktion (Gesichter erkennen, Sprache umwandeln) per API → **fertiger KI-Dienst**.
- **Merksatz für den Lernzettel: SageMaker = die Küche zum Selberkochen. Rekognition/Lex/Polly = die fertig gelieferte Pizza.**

> **🧠 Die große Leitlinie für den ganzen KI-Block (wortgetreu):** Frage will ein **maßgeschneidertes Modell** → **SageMaker** (die Küche). Frage will eine **fertige Standardfunktion per API** → der passende vortrainierte Dienst (die gelieferte Pizza). Diese eine Unterscheidung beantwortet die meisten KI-Fragen.

---

## Amazon Rekognition

**Metapher / Konzept**

> Das fertige Auge, das dir per API sagt, was auf einem Bild oder Video zu sehen ist.

**Das Problem & Die Lösung**

Deine App lädt täglich 100.000 Nutzerfotos hoch — du müsstest sie automatisch durchsuchen: Wo sind anstößige Inhalte? Was ist auf dem Bild (Hund, Auto, Strand)? Ein eigenes Modell dafür zu trainieren würde Jahre dauern und ein Team von KI-Forschern brauchen — unrealistisch.

**Rekognition** ist ein **fertiger KI-Dienst für Bild- und Videoanalyse** — AWS hat das Modell bereits mit Millionen Bildern trainiert; du schickst ein Bild per API hin und bekommst die Analyse zurück. Was es erkennt:
- **Objekte & Szenen:** „Auf diesem Bild: Auto, Straße, Baum, Tageslicht."
- **Gesichtserkennung & -analyse:** Gesichter finden, vergleichen („dieselbe Person?"), Attribute schätzen (Emotion, Alter).
- **Text in Bildern:** Nummernschilder, Straßenschilder auslesen.
- **Inhaltsmoderation:** automatisch anstößige Inhalte markieren — riesiger Anwendungsfall für Social Media.

**Praxis — Inhaltsmoderation:** Nutzer lädt Foto hoch → **S3-Upload triggert Lambda** → Lambda schickt das Bild an die Rekognition-API → kommt „unangemessen" zurück, wird das Foto automatisch blockiert. Vollautomatisch, in Sekunden.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Bilder/Videos analysieren", „Gesichtserkennung", „Objekterkennung", „Inhaltsmoderation", „Text in Bildern" → **Rekognition**.
- Fertiger Dienst (vortrainiert, nur API) — kein SageMaker nötig. „Erkenne, was auf Bildern ist, ohne ML-Expertise" → Rekognition.
- **Eselsbrücke:** Rekognition = (Re)cognition = (Wieder-)Erkennen.

---

## Amazon Lex & Polly & Transcribe

**Metapher / Konzept**

> Die drei fertigen Sprach-Werkzeuge: Sprache verstehen, Text vorlesen, Gesprochenes mitschreiben.

**Das Problem & Die Lösung**

Du willst einen Chatbot, der Kundenfragen versteht. Oder eine App, die Texte mit echter Stimme vorliest. Oder tausende Telefon-Mitschnitte als durchsuchbaren Text. Jede Aufgabe erfordert hochkomplexe KI — selbst zu bauen aussichtslos. Wie Rekognition sind das **fertige, vortrainierte Dienste per API**:
- **Amazon Lex — Sprache/Text verstehen (der Chatbot-Baukasten):** Versteht die **Absicht (Intent)** des Nutzers, ob getippt oder gesprochen. Das ist die **Technologie hinter Alexa!** Für Chatbots/Sprachassistenten (versteht „Ich will meinen Flug umbuchen" und löst die Aktion aus).
- **Amazon Polly — Text → Sprache (Text-to-Speech):** verwandelt geschriebenen Text in natürlich klingende Sprache. Für Vorlese-Funktionen, Hörbücher, Telefonansagen. **Eselsbrücke:** ein Papagei (Polly the Parrot) spricht.
- **Amazon Transcribe — Sprache → Text (Speech-to-Text):** das Gegenteil von Polly — gesprochenes Wort wird geschriebener Text. Für Untertitel, Meeting-Protokolle, durchsuchbare Callcenter-Mitschnitte. **Eselsbrücke:** ein Transcript (Mitschrift).

**Praxis — die Dienste als Kette (Callcenter):** Kunde spricht → **Transcribe** macht Text → **Lex** versteht die Absicht und findet die Antwort → **Polly** spricht die Antwort mit echter Stimme zurück. Ein kompletter Sprach-Bot aus drei fertigen Bausteinen, ohne ein einziges Modell selbst zu trainieren.

**⚠️ Die Prüfungs-Knackpunkte — die Richtung ist die ganze Frage:**
- **Text → Sprache (vorlesen) = Polly.** **Sprache → Text (mitschreiben) = Transcribe.** **Sprache/Text verstehen + Chatbot = Lex.**
- Polly und Transcribe sind exakte Gegenstücke — die Prüfung vertauscht sie gern. **Merksatz: Polly Plappert (Text → Stimme), Transcribe Tippt mit (Stimme → Text).**
- Lex = Alexa-Technologie = Chatbots/Voicebots. Signalwort „Chatbot / Conversational Interface" → **Lex**.
- Alle drei: fertige API-Dienste, kein SageMaker.

---

## Amazon Textract

**Metapher / Konzept**

> Die KI, die gescannte Dokumente nicht nur abtippt, sondern ihre Struktur versteht — Formularfelder, Tabellen und Werte inklusive.

**Das Problem & Die Lösung**

Berge gescannter Dokumente (Formulare, Rechnungen, Ausweise, Verträge) als Bilder/PDFs. Für einen Computer ist ein Scan nur ein **Foto** — er sieht Pixel, keinen Text. Von Hand abtippen? Bei tausenden Dokumenten unbezahlbar. Klassische **OCR** hilft nur halb: Sie zieht rohen Text raus, versteht aber nicht, **was zusammengehört** (welcher Wert zu welchem Feld, was eine Tabelle ist).

**Textract** extrahiert Text **UND Struktur** automatisch — deutlich mehr als simple OCR:
- **Reiner Text (OCR):** der gesamte geschriebene Text.
- **Formularfelder (Key-Value-Paare):** versteht „Name: Max Mustermann" als zusammengehöriges Paar.
- **Tabellen:** erkennt Strukturen, behält Zeilen/Spalten bei.
- Fertige API, kein ML-Wissen.

**Praxis — serverlose Pipeline:** Scan landet in S3 → Upload triggert Lambda → Lambda schickt an Textract → extrahierte Felder (Rechnungsnummer, Betrag) strukturiert in eine Datenbank. Tausende Rechnungen automatisch, kein Abtippen.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Text aus Dokumenten/PDFs/Scans extrahieren", „OCR", „Formulare/Tabellen auslesen", „Key-Value-Paare aus Dokumenten" → **Textract**.
- Es ist **mehr als OCR:** versteht auch Struktur.
- **Abgrenzung:** Textract = Text **rausziehen**. Rekognition = Objekte/Gesichter erkennen. Comprehend = den Sinn **verstehen**. **Textract holt den Text raus, Comprehend versteht ihn inhaltlich.**
- **Eselsbrücke:** Text + extract → Text herausziehen.

---

## Amazon Comprehend

**Metapher / Konzept**

> Die KI, die geschriebenen Text nicht nur liest, sondern seinen Sinn versteht — Stimmung, Sprache, Themen und wichtige Begriffe.

**Das Problem & Die Lösung**

Deine Firma ertrinkt in Texten: zehntausende Bewertungen, Support-Tickets, Kommentare, E-Mails. Darin stecken Erkenntnisse (zufrieden oder wütend? welche Themen? worüber beschwert man sich gehäuft?), aber niemand kann 50.000 Bewertungen von Hand lesen.

**Comprehend** ist ein fertiger Dienst für **Natural Language Processing (NLP)** — er versteht die **Bedeutung** von Text:
- **Sentiment-Analyse:** positiv, negativ oder neutral? (Kundenstimmung aus Bewertungen.)
- **Entitäten-Erkennung:** Namen, Orte, Firmen, Daten, Produkte im Text.
- **Schlüsselwörter & Themen (Topic Modeling):** worum geht es in großen Textmengen?
- **Spracherkennung:** in welcher Sprache ist der Text?
- **Comprehend Medical:** Spezialvariante, zieht medizinische Infos aus Arztberichten/Akten.

**Praxis — die Kette:** eingescanntes Beschwerde-Schreiben: **Textract** zieht den Text raus → **Comprehend** erkennt „Sentiment: stark negativ, Thema: Lieferverzögerung" → Ticket automatisch als dringend markiert und ans richtige Team geleitet.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Sentiment/Stimmung", „NLP", „Text verstehen", „Entitäten/Schlüsselwörter extrahieren", „Themen erkennen", „Kundenfeedback auswerten" → **Comprehend**.
- **Textract vs. Comprehend:** Textract = Text **herausziehen** (OCR+Struktur). Comprehend = **Sinn verstehen** (Stimmung, Themen). Oft als Kette.
- **Nicht verwechseln:** Translate = **übersetzen**, Comprehend = **verstehen/analysieren**.
- **Eselsbrücke:** to comprehend = verstehen/begreifen.

> **🧠 Die KI-Text-Kette zum Merken (wortgetreu):** Scan in S3 → **Textract** (Text rausziehen) → **Comprehend** (Sinn verstehen) → automatische Reaktion.

---

## Amazon Translate

**Metapher / Konzept**

> Der automatische KI-Dolmetscher, der Text in Echtzeit zwischen dutzenden Sprachen übersetzt — per einfacher API.

**Das Problem & Die Lösung**

Deine App soll international funktionieren: Produktbeschreibungen in 20 Sprachen, Bewertungen aus aller Welt verstehen, Tickets auf Japanisch beantworten. Menschliche Übersetzer sind teuer und langsam — und bei laufend eingehenden Inhalten unmöglich.

**Amazon Translate** ist ein fertiger Dienst für **maschinelle Übersetzung (Neural Machine Translation)** — Text per API hin, Übersetzung zurück, viele Sprachen, kein ML-Wissen:
- **Inhalte lokalisieren:** Websites, Produktkataloge, Dokumente.
- **Echtzeit-Übersetzung:** Live-Chat, eingehende Nachrichten.
- **User-Content verstehen:** fremdsprachige Bewertungen/Tickets in die eigene Sprache.

**Praxis — internationales Callcenter (Connect):** Kunde schreibt Spanisch → **Translate** ins Deutsche → **Comprehend** erkennt die Stimmung → Agent antwortet Deutsch → **Translate** zurück ins Spanische.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „übersetzen", „Sprachübersetzung", „Lokalisierung", „mehrsprachige Inhalte" → **Translate**.
- **Die Abgrenzung im KI-Block (ähnlich klingend):** Translate = **übersetzen** (Sprache A → B) · Comprehend = **verstehen/analysieren** · Transcribe = **Sprache → Text** · Polly = **Text → Sprache**.
- **Eselsbrücke:** Translate = der Dolmetscher.

---

## Amazon Kendra

**Metapher / Konzept**

> Die intelligente Suchmaschine fürs Firmenwissen, die echte Fragen versteht und die präzise Antwort findet — nicht nur Stichwort-Treffer.

**Das Problem & Die Lösung**

Firmenwissen liegt in zig Systemen (SharePoint, Confluence, S3, Datenbanken, FAQ). Die eingebauten Suchen sind **stichwortbasiert**: Du suchst „Urlaubsanspruch erstes Jahr" und bekommst 500 Dokumente, in denen „Urlaub" vorkommt — aber nicht die **eine** Antwort. Die Suche versteht deine Frage nicht, sie matcht nur Wörter.

**Kendra** ist ein intelligenter **ML-Suchdienst**, der natürliche Fragen versteht und gezielt die passende Antwort liefert:
- **Natürliche Sprache:** „Wie viele Urlaubstage im ersten Jahr?" → die konkrete Stelle mit der Antwort.
- **Viele Quellen (Konnektoren):** S3, SharePoint, Confluence, Datenbanken, ServiceNow — gemeinsam durchsucht.
- **Versteht Bedeutung:** erkennt, dass „PTO", „Urlaub", „Abwesenheit" dasselbe meinen.

**Die Abgrenzung — Kendra vs. Q Business (gern abgefragt):** **Kendra** = findet und liefert die relevanten **Fundstellen/Passagen**. **Q Business** = der generative Assistent, der (oft auf Suchtechnik aufbauend) eine **fertig formulierte Antwort** im Chat gibt. **Merksatz: Kendra sucht und findet die Stelle. Q Business formuliert die fertige Antwort im Gespräch.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „intelligente Suche", „Enterprise Search", „Firmenwissen durchsuchen", „natürliche Fragen an Dokumente" → **Kendra**.
- **Kendra vs. OpenSearch (Karte 59):** OpenSearch = technische Volltextsuche/Log-Analyse (du baust die Suche selbst). Kendra = fertige ML-Suche, die Fragen versteht.

---

## Amazon Q Business

**Metapher / Konzept**

> Der KI-Assistent, der das gesamte Firmenwissen gelesen hat und jedem Mitarbeiter in normaler Sprache antwortet.

**Das Problem & Die Lösung**

Firmenwissen verstreut über zig Systeme: Urlaubsregeln im PDF, Projektdoku in Confluence, Verträge in SharePoint, Diskussionen in Slack, Tickets in Jira. Ein Mitarbeiter müsste durch fünf Systeme wühlen — Stunden für die simple Suche nach längst dokumentierten Infos.

**Q Business** ist ein **generativer KI-Assistent für die internen Daten** einer Firma. Über fertige **Konnektoren** einmal mit den Quellen (S3, SharePoint, Salesforce, Slack, Confluence...) verbunden, beantwortet er Fragen **in natürlicher Sprache** — mit Antworten aus den echten Firmendokumenten, **inklusive Quellenangabe**. „Wie viele Urlaubstage im ersten Jahr?" → Antwort direkt aus dem HR-Dokument.

**Die entscheidende Abgrenzung — die zwei Q-Geschwister:**
- **Q Developer** = für **Entwickler**: Code schreiben, AWS-Hilfe, IDE-Assistent.
- **Q Business** = für **alle Büro-Mitarbeiter**: Fragen über interne Firmendokumente, ganz ohne Code.

🛑 **Aktualität (verifiziert — wichtig, weil die Q-Familie im Umbruch ist):** **Q Business bleibt bestehen** und ist weiter der richtige Dienst für „interner Wissens-Chatbot". **Q Developer** dagegen (der Coding-Assistent, ausführlich in Kapitel 10) wird durch **Kiro** ersetzt: neue Signups seit **15.05.2026** blockiert, IDE-Plugins/Subscriptions **End of Support 30.04.2027**; Q Developer in AWS-Konsole/Docs/Slack bleibt. Für die Prüfung bleibt die Abgrenzung „Business = Wissens-Chatbot, Developer = Coding" gültig — nur weißt du jetzt, dass die Developer-Seite gerade zu Kiro migriert. **CertOps-Konsequenz:** Kiro als Nachfolger auf der Deprecated-/Watch-Liste vermerken (neben QLDB, CodeCommit, CodeCatalyst).

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Firmendaten durchsuchen", „interner Wissens-Chatbot", „Fragen zu internen Dokumenten", „natürliche Sprache über Geschäftsdaten" → **Q Business**.
- **Q Business vs. Q Developer:** Business = Wissens-Chatbot über Firmendaten für jeden. Developer = Code & AWS für Entwickler.
- **Kendra vs. Q Business:** Kendra sucht (Fundstellen), Q Business antwortet (fertige Antwort im Dialog).

---

## Amazon Fraud Detector

**Metapher / Konzept**

> Der fertige KI-Betrugsdetektiv, der verdächtige Online-Aktivitäten in Echtzeit erkennt — ohne dass du selbst ein Machine-Learning-Modell bauen musst.

**Das Problem & Die Lösung**

Ein Online-Shop muss Betrug in Echtzeit erkennen: gefälschte Registrierungen, betrügerische Bestellungen mit gestohlenen Karten, Fake-Bewertungen, Bonus-Missbrauch. Theoretisch könnte man mit **SageMaker** ein eigenes Modell bauen — aber das braucht Data Scientists, Zeit und tiefes ML-Wissen.

**Fraud Detector** ist ein **fertiger KI-Dienst speziell zur Betrugserkennung**: Du fütterst ihn mit historischen Daten (vergangene Transaktionen, welche Betrug waren), er erstellt automatisch ein Modell, das neue Aktivitäten in Echtzeit auf **Betrugsrisiko** bewertet — AWS bringt sein jahrzehntelang erprobtes Betrugs-Know-how (von Amazon.com) ein:
- **Zahlungsbetrug:** verdächtige Transaktionen in Echtzeit bewerten/blockieren.
- **Fake-Accounts:** betrügerische Neuanmeldungen erkennen.
- **Risiko-Score:** jede Aktivität bekommt eine Betrugswahrscheinlichkeit.

**Die Abgrenzung:** **Fraud Detector** = fertiger Betrugsdetektiv von der Stange. **SageMaker** = eigenes Erkennungsmodell selbst bauen.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Betrug erkennen / Fraud Detection", „betrügerische Transaktionen", „Fake-Accounts", „Online-Betrug in Echtzeit", „ohne ML-Expertise" → **Fraud Detector**.
- **Achtung Abgrenzung zu GuardDuty (Karte 42):** GuardDuty = Bedrohungen/Angriffe auf deine **AWS-Infrastruktur** (kompromittierte Konten/Instanzen). Fraud Detector = Betrug durch **Endnutzer in deiner Anwendung** (Zahlungen, Registrierungen). **Nicht verwechseln!**

---

## Amazon Personalize

**Metapher / Konzept**

> Der Netflix-/Amazon-Empfehlungsmotor zum Einbauen — fertige personalisierte Empfehlungen ohne eigenes ML.

**Das Problem & Die Lösung**

Du willst personalisierte Empfehlungen geben („Das könnte dir gefallen", „Andere kauften auch", personalisierte Startseite). Ein solches System mit SageMaker selbst zu bauen erfordert ML-Expertise und viel Zeit.

**Personalize** ist ein fertiger Dienst für **Empfehlungssysteme** — dieselbe Technologie, die Amazon.com nutzt. Du fütterst ihn mit Nutzer-Interaktionen (angeschaut/gekauft/geklickt) plus Artikel-/Nutzerdaten, und er erstellt automatisch ein Empfehlungsmodell:
- Produktempfehlungen im Online-Shop.
- Personalisierte Inhalte (Artikel, Videos, Musik) und Such-Ranking.
- **Echtzeit:** reagiert auf das aktuelle Verhalten, nicht nur auf historische Daten.

**⚠️ Prüfungs-Knackpunkte**
- „Personalisierte Empfehlungen / Kunden kauften auch" → **Personalize**.
- Fertig vs. selbstgebaut: Personalize (fertig) ↔ SageMaker (eigenes Modell).
- **Empfehlungen für Nutzer (Personalize) ↔ Vorhersage über die Zeit (Forecast)** — nicht verwechseln.

---

## Amazon Forecast 🛑 *(abgekündigt für Neukunden — 30.07.2024)*

**Metapher / Konzept**

> Die Kristallkugel für Zeitreihendaten — präzise ML-Vorhersagen über die Zukunft, basierend auf der Vergangenheit.

**Das Problem & Die Lösung**

Du musst zukünftige Werte vorhersagen: Wie viel verkaufe ich nächsten Monat? Wie viel Lagerbestand? Wie hoch der Energiebedarf morgen? Solche Zeitreihen-Prognosen sind komplex; ein eigenes Modell erfordert Data-Science-Wissen.

**Forecast** ist ein fertiger Dienst für **Zeitreihen-Vorhersagen**: Du gibst historische Zeitreihen (Verkäufe der letzten Jahre) plus optionale Faktoren (Wetter, Feiertage, Preise), und Forecast erstellt automatisch ein Prognosemodell — dieselbe Technik wie Amazon.com für die Nachfrageplanung:
- Nachfrage-/Verkaufsprognosen · Lagerbestandsplanung · Ressourcen-/Personalplanung · Finanzprognosen.

**Die wichtige Abgrenzung — Forecast vs. Timestream:** **Forecast** = ML-Dienst, der Zeitreihen **vorhersagt** (Zukunft prognostizieren). **Timestream** = Zeitreihen-**Datenbank** zum Speichern/Abfragen (z. B. IoT-Sensordaten) — sagt nichts vorher. **Merksatz: Forecast sagt die Zukunft voraus (ML). Timestream speichert Zeitreihen (Datenbank).**

**⚠️ Prüfungs-Knackpunkte**
- Zukünftige Werte/Nachfrage vorhersagen (Zeitreihen) → **Forecast**.
- Forecast = vorhersagen (ML) ↔ Timestream = speichern/abfragen (Datenbank).

🛑 **Aktualität (verifiziert):** AWS hat **Amazon Forecast am 30.07.2024 für Neukunden geschlossen** (Teil derselben Welle wie QLDB/CodeCommit/Cloud9). Bestandskunden nutzen weiter; als Nachfolger empfiehlt AWS **Amazon SageMaker Canvas** (No-Code-ML inkl. Zeitreihen-Prognosen). **Für die Prüfung bleibt Forecast der Standard-Begriff für „ML-Zeitreihen-Vorhersage" — normal mitlernen.** **CertOps:** Forecast auf die Deprecated-Liste ergänzen.

---

## Amazon ML-Dienste komplett (die spezialisierten Fertig-Dienste)

**Metapher / Konzept**

> Der vollständige KI-Werkzeugkasten — die spezialisierten fertigen ML-Dienste für konkrete Aufgaben. Alle sind **fertige** KI-Dienste (kein eigenes Modell bauen, vgl. SageMaker = selbst bauen).

**Die Sammel-Dienste (deine Karte, wortgetreu):**

- **Amazon Personalize:** personalisierte Empfehlungen („Das könnte dir gefallen") — dieselbe Technik wie Amazon.com. **Stichwort: Empfehlungen/Recommendations.** *(Eigene Karte oben.)*
- **Amazon Forecast:** Zeitreihen-Vorhersagen mit ML (Verkaufszahlen, Lagerbedarf, Energieverbrauch). **Stichwort: Vorhersage/Prognose über die Zeit.** *(Eigene Karte oben.)*
- **Amazon Lookout:** Familie zur **Anomalie-Erkennung** — **Lookout for Metrics** (ungewöhnliche Ausschläge in Geschäftskennzahlen), **Lookout for Equipment** (Maschinenausfälle aus Sensordaten vorhersagen), **Lookout for Vision** (Produktfehler auf Bildern erkennen). **Stichwort: Anomalien/Ausreißer automatisch finden.**
- **Amazon A2I (Augmented AI):** bindet **menschliche Überprüfung** in ML-Vorhersagen ein. Ist ein Modell unsicher (niedrige Konfidenz), geht die Entscheidung an einen Menschen. Für Fälle, wo Fehler teuer sind. **Stichwort: Mensch-im-Loop / Human Review.**
- **Comprehend Medical:** Spezialvariante von Comprehend, extrahiert medizinische Infos aus Arztberichten/Akten (Diagnosen, Medikamente, Dosierungen), **HIPAA-konform**. **Stichwort: medizinische NLP.**

**⚠️ Prüfungs-Knackpunkte**
- Produktempfehlungen → **Personalize**. Zukunft/Zeitreihen → **Forecast**. Anomalien (Metriken/Maschinen/Bilder) → **Lookout** (passende Variante). Menschliche Kontrolle bei unsicheren Entscheidungen → **A2I**. Medizinische Texte → **Comprehend Medical**.
- Alle fertig/vortrainiert (kein ML-Wissen) ↔ **SageMaker** (eigenes Modell bauen).

---

*Ende Kapitel 8 — Machine Learning & KI.*
