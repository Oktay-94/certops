# Kapitel 10 — Entwickler-Tools & DevOps

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne — zwei Fabrikstraßen:** **(1) Infrastruktur als Code (IaC)** — die *Umgebung* per Bauplan statt Klicken erstellen (CloudFormation, CDK). **(2) CI/CD** — den *Anwendungscode* automatisch bauen, testen und ausliefern (die „Code-Familie"). Die absolute Lieblings-Zuordnungsfrage beider Prüfungen ist die Code-Familie:

`CodeCommit (speichern) → CodeBuild (bauen/testen) → CodeDeploy (ausliefern) → CodePipeline (der Dirigent, der alle verbindet)`

> 🛑 **Wichtig für dieses ganze Kapitel:** Auffällig viele DevOps-Dienste hier sind **abgekündigt** (für Neukunden geschlossen). Für die **CLF-C02/SAA-C03 lernst du sie trotzdem ganz normal** — sie sind weiter prüfungsrelevant. Aber in der Praxis (und für dein CertOps-Projekt) sind sie tot. Ich markiere jeden mit 🛑 an der jeweiligen Karte.

---

## AWS CloudFormation

**Metapher / Konzept**

> Der Bauplan, aus dem AWS deine komplette Infrastruktur per Knopfdruck automatisch und beliebig oft identisch aufbaut.

**Das Problem & Die Lösung**

Du sollst eine komplette Umgebung aufbauen: VPC, Subnetze, Security Groups, EC2-Server, Load Balancer, RDS, S3. In der Konsole zusammenklicken dauert Stunden. Der Haken: Nächste Woche brauchst du **exakt dieselbe** Umgebung fürs Testing, in drei Monaten für einen neuen Kunden. Klickst du das jedes Mal fehlerfrei identisch? **Niemals** — irgendein Häkchen ist immer anders, und genau das verursacht später mysteriöse Fehler („auf Test läuft's, auf Prod nicht").

**CloudFormation** ist der **Infrastructure-as-Code (IaC)**-Dienst von AWS. Du beschreibst deine gesamte Infrastruktur einmal in einer **Vorlage (Template)** — JSON oder YAML — und CloudFormation baut alle Ressourcen automatisch auf:
- **Template (der Bauplan):** Du schreibst **deklarativ**, *was* du willst („eine VPC, 2 Subnetze, 3 EC2 t3.micro..."), nicht *wie*. CloudFormation kümmert sich um Reihenfolge und Abhängigkeiten.
- **Stack (das fertige Gebäude):** Alle Ressourcen aus einem Template = ein **Stack**. Löschst du den Stack, werden **alle zugehörigen Ressourcen sauber entfernt** — keine vergessenen Kosten-Leichen.
- **Wiederholbar & konsistent:** Dasselbe Template erzeugt immer exakt dieselbe Umgebung — einmal oder hundertmal, Frankfurt oder Tokio.
- **Kostenlos:** du zahlst nur die erzeugten Ressourcen.

**Die Abgrenzungen (SAA-relevant):** **CloudFormation** = IaC mit JSON/YAML-Templates (deklarativ). **CDK** = IaC mit echten Programmiersprachen, die zu CloudFormation kompilieren. **Elastic Beanstalk** = du lädst nur App-Code hoch, AWS baut die Infrastruktur (du definierst sie nicht). **Merksatz: CloudFormation ist der Bauplan, den du selbst zeichnest (YAML/JSON). CDK programmiert diesen Bauplan. Beanstalk baut ganz ohne deinen Bauplan.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Infrastructure as Code", „Template", „JSON/YAML", „wiederholbar bereitstellen", „Stack", „identische Umgebungen" → **CloudFormation**.
- CloudFormation vs. CDK: „JSON/YAML-Vorlage" → CloudFormation. „Python/TypeScript" → CDK.
- **Stack löschen = alle Ressourcen weg** (sauberes Aufräumen) — beliebtes Detail.
- Regions- und kontenübergreifend wiederverwendbar (mit **StackSets** sogar über viele Konten) — gern in SAA gefragt.

---

## AWS CDK (Cloud Development Kit)

**Metapher / Konzept**

> Infrastruktur bauen mit deiner Lieblings-Programmiersprache statt mit kilometerlangen Vorlagen.

**Das Problem & Die Lösung**

Infrastruktur von Hand zusammenklicken skaliert nicht. Die Antwort ist **IaC** — der AWS-Klassiker **CloudFormation** mit JSON/YAML-Templates. Funktioniert, aber: Diese Templates werden schnell **tausende Zeilen lang**, sind starr und fühlen sich für Entwickler an wie das Ausfüllen endloser Formulare. Keine Schleifen, keine Funktionen, keine Logik.

Mit dem **CDK** definierst du Infrastruktur in einer **echten Programmiersprache** (TypeScript, Python, Java, C#, Go). Statt 500 Zeilen YAML schreibst du in Python sinngemäß „Erstelle mir einen S3-Bucket mit Verschlüsselung" — drei Zeilen:
- **Volle Programmiersprachen-Power:** Schleifen („erstelle 10 Buckets"), Bedingungen, Variablen, Wiederverwendung.
- **Constructs:** fertige, intelligente Bausteine mit sinnvollen Voreinstellungen — ein Construct verdrahtet im Hintergrund dutzende Ressourcen korrekt.
- **IDE-Unterstützung:** Autovervollständigung und Fehlerprüfung beim Tippen (bei YAML merkst du Tippfehler erst beim Ausrollen).

**Der entscheidende Punkt:** Das CDK **ersetzt CloudFormation nicht — es setzt obendrauf!** Bei `cdk deploy` wird dein Code in ein normales CloudFormation-Template **übersetzt (synthesized)**, und CloudFormation rollt aus. **Merke: CDK ist der Übersetzer, CloudFormation ist der Maschinenraum.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Infrastruktur mit vertrauten Programmiersprachen" (Python, TypeScript...) → **CDK**.
- **CDK vs. CloudFormation:** „JSON oder YAML" → CloudFormation. „Python/TypeScript" → CDK (kompiliert intern zu CloudFormation).
- **Merksatz: CloudFormation = Bauplan-Formular ausfüllen. CDK = den Bauplan programmieren, der das Formular automatisch ausfüllt.**

---

## AWS CodeCommit 🛑 *(abgekündigt für Neukunden — 25.07.2024)*

**Metapher / Konzept**

> Das private GitHub, das in deiner AWS-Cloud wohnt.

**Das Problem & Die Lösung**

Quellcode lebt in **Git** — dem Versionskontrollsystem, mit dem Teams gemeinsam am Code arbeiten, Änderungen nachverfolgen und zu alten Versionen zurückspringen. Bekannte Anbieter: **GitHub, GitLab**. Aber manche Firmen dürfen ihren Code nicht extern lagern — und wenn das Projekt ohnehin in AWS läuft, wäre es praktisch, wenn der Code direkt daneben liegt und mit IAM geschützt ist.

**CodeCommit** ist ein vollständig verwalteter **Git-Repository-Dienst** — ganz normales Git (`git push`, `git pull`, Branches), nur dass die Repos sicher in deinem AWS-Konto liegen:
- **Privat & verschlüsselt:** standardmäßig privat, verschlüsselt (mit **KMS**!), Zugriff über **IAM**.
- **Vollständig verwaltet:** kein eigener Git-Server, keine Größenlimits, hochverfügbar.
- **Integration:** nahtlos mit CodeBuild (baut), CodeDeploy (verteilt), CodePipeline (automatisiert die Kette).

**Praxis — der typische CI/CD-Flow:** Entwickler pusht nach CodeCommit → triggert **CodePipeline** → **CodeBuild** kompiliert und testet → **CodeDeploy** rollt auf die EC2-Server aus. Vom `git push` bis zur Live-Website komplett automatisch — das ist **CI/CD (Continuous Integration / Continuous Delivery)**.

**Git & CI/CD — die Grundlagen (dein Exkurs, wortgetreu):** Niemand arbeitet direkt am „heiligen" **main-Branch** (der Live-Version). Für ein neues Feature erstellst du einen eigenen **Branch** — eine Abzweigung, eine Parallelwelt deines Codes, in der du experimentieren kannst, ohne dass es jemanden stört. Ist das Feature fertig und getestet, wird dein Branch per **Merge** (oft über einen **Pull Request**, bei dem Kollegen deinen Code vorher reviewen) zurück in main geführt. **Kurz-Zusammenfassung:** Git ist die **Zeitmaschine fürs Team** (commit = lokal speichern, push = hochschieben, pull = runterziehen). CI/CD ist die **automatische Fabrikstraße**, die nach jedem Push den Code baut, testet und live bringt — und die AWS-Code-Familie sind die einzelnen Maschinen dieser Fabrikstraße.

🛑 **Aktualität (verifiziert):** AWS hat **CodeCommit am 25.07.2024 für Neukunden geschlossen** und empfiehlt GitHub/GitLab. Bestandskunden können weiter, aber es kommen keine neuen Features. **In der CLF-C02 taucht CodeCommit weiter auf — normal mitlernen.** *(Deine Karte hatte das bereits als Randnotiz — hier bestätigt.)* **CertOps:** steht schon auf deiner Deprecated-Liste.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Git-Repository", „Quellcode-Verwaltung", „Source Control", „privates Repository in AWS" → **CodeCommit**.
- **Die Rollenverteilung der Code-Familie (Zuordnungsfrage!):** Commit = **speichern** (Git), Build = **bauen/testen**, Deploy = **ausliefern**, Pipeline = **der Dirigent**. Die Eselsbrücken stecken in den Namen!
- „CI/CD" oder „kompletten Release-Prozess automatisieren" → **CodePipeline**. „Code kompilieren + Tests" → **CodeBuild**. „Auf EC2/Lambda ausrollen" → **CodeDeploy**.
- **CI** = Fehler früh finden durch automatisches Bauen & Testen bei jedem Push. **CD** = automatisches Ausliefern.
- **Bonus-Wissen:** **CodeArtifact** (Lager für Programmbibliotheken/Pakete) und **CodeStar/CodeCatalyst** (Projekt-Rundumpakete) können am Rande auftauchen. 🛑 *Beide ebenfalls abgekündigt: CodeStar EoS 31.07.2024, CodeCatalyst seit Nov 2025 in Maintenance/für Neukunden geschlossen.*

---

## AWS CodeBuild

**Metapher / Konzept**

> Die automatische Fabrik, die deinen Quellcode kompiliert, testet und zu einem fertigen, auslieferbaren Produkt verpackt.

**Das Problem & Die Lösung**

Ein Entwickler hat seinen Code nach CodeCommit (oder GitHub) gepusht. Aber Quellcode ist noch **kein lauffähiges Programm**! Er muss erst **kompiliert** werden, alle **Tests** müssen durchlaufen, und alles muss zu einem auslieferbaren **Paket (Artefakt** — Container-Image oder ZIP) verpackt werden. Früher: eigener **Build-Server**, der ständig laufen, gewartet und bezahlt werden musste — auch wenn gerade nichts gebaut wurde.

**CodeBuild** ist der vollständig verwaltete, **serverlose Build-Dienst**: nimmt den Quellcode, kompiliert, testet, erzeugt das Artefakt:
- **Kein Build-Server:** startet bei Bedarf eine Build-Umgebung, macht den Job, fährt wieder runter.
- **Bezahlung pro Build-Minute:** nur für die tatsächliche Build-Zeit.
- **Gesteuert per `buildspec.yml`:** eine Datei im Projekt beschreibt die Build-Schritte.
- **Skaliert automatisch:** mehrere Builds gleichzeitig kein Problem.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Code kompilieren", „Tests ausführen", „Build", „Artefakte erstellen", „serverloser Build-Dienst", „buildspec" → **CodeBuild**.
- CodeBuild ist **serverlos** (kein Build-Server, Zahlung pro Build-Minute) — beliebtes Detail.
- **Eselsbrücke:** Build = bauen.

> **🧠 Mini-Merkkasten dieses Blocks (wortgetreu):** **Beratung/Optimierung:** Trusted Advisor (breiter 5-Bereiche-Check) ↔ Compute Optimizer (Spezialist fürs Compute-Rightsizing). **Multi-Account:** Organizations (Konten verwalten) ↔ RAM (Ressourcen teilen) ↔ IAM Identity Center (ein Login). **6 Säulen Well-Architected:** Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability. **Code-Familie:** CodeCommit → CodeBuild → CodeDeploy → CodePipeline.

---

## AWS CodeDeploy

**Metapher / Konzept**

> Der automatische Lieferdienst, der die fertige Software-Version sicher auf alle Zielserver ausrollt — ohne Ausfall und mit Notfall-Rückwärtsgang.

**Das Problem & Die Lösung**

CodeBuild hat dein fertiges Paket erzeugt. Aber wie kommt es auf die Produktivserver? Die neue Version manuell auf 50 EC2-Instanzen zu spielen hat **drei Risiken:** (1) **Ausfallzeit** — schaltest du alle gleichzeitig ab, ist die Website kurz offline. (2) **Menschliche Fehler** — auf Server 37 vergisst du einen Schritt. (3) Am schlimmsten: Die neue Version hat einen **kritischen Bug**, der erst live auffällt — jetzt läuft kaputter Code auf allen Servern. Wie machst du das schnell rückgängig?

**CodeDeploy** rollt deine neue Version automatisch auf EC2, On-Premises-Server, **Lambda oder ECS** aus. Der Clou sind die **Deployment-Strategien**:
- **Rolling / In-Place:** Server nach und nach aktualisieren (erst 10 %, dann die nächsten), während die übrigen weiterlaufen — **keine Ausfallzeit**.
- **Blue/Green:** eine komplett neue Umgebung („Green") mit der neuen Version parallel zur alten („Blue"). Erst wenn Green einwandfrei läuft, wird der Verkehr umgeschaltet. Bei Problemen sofort zurück auf Blue.
- **Canary (bei Lambda):** erst ein kleiner Teil des Traffics bekommt die neue Version (Versuchskaninchen); ist alles gut, folgt der Rest.
- **Automatisches Rollback:** feuert beim Deployment ein CloudWatch-Alarm, macht CodeDeploy die Auslieferung automatisch rückgängig.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Anwendung ausrollen/deployen", „auf EC2/Lambda/ECS bereitstellen", „Blue/Green", „Canary", „Rolling", „automatisches Rollback" → **CodeDeploy**.
- **Deployment-Strategien merken (SAA-relevant!):** Blue/Green = neue Umgebung parallel, dann umschalten (schnelles Rollback). Canary/Rolling = schrittweise. „Keine Downtime / schnelles Zurückrollen" → diese Strategien. *(Dieselben Strategien wie bei Beanstalk, Kapitel 2 — hier für CodeDeploy.)*
- **Eselsbrücke:** Deploy = ausliefern/stationieren.

---

## AWS CodePipeline

**Metapher / Konzept**

> Der Dirigent, der die gesamte Software-Fabrikstraße taktet.

**Das Problem & Die Lösung**

CodeCommit speichert, CodeBuild baut, CodeDeploy rollt aus — aber das sind **drei separate Dienste, die von alleine nichts voneinander wissen**. Jemand müsste nach jedem Push manuell CodeBuild anstoßen, warten, dann CodeDeploy starten... Damit wäre die Automatisierung dahin. Du brauchst etwas, das die Kette **selbstständig in der richtigen Reihenfolge abspult** — und bei einem Fehler sofort stoppt.

**CodePipeline** ist der **CI/CD-Orchestrierungsdienst**: Du definierst die Pipeline einmal als Abfolge von **Stages**:
- **Source-Stage:** Woher kommt der Code? (CodeCommit, **aber auch GitHub oder S3!**) Ein Push ist der Startschuss.
- **Build-Stage:** CodeBuild kompiliert und testet.
- **Optional — Approval-Stage:** ein **Mensch** muss per Klick freigeben, bevor es weitergeht (z. B. vor Produktion). Das ist der Unterschied zwischen **Continuous Delivery und Deployment** in der Praxis!
- **Deploy-Stage:** CodeDeploy (oder Beanstalk, CloudFormation...) bringt die Version live.
- **Schlägt eine Stage fehl, stoppt die Pipeline sofort** — kaputter Code erreicht nie die Kunden.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „CI/CD-Pipeline", „Release-Prozess automatisieren", „Schritte orchestrieren", „kontinuierliche Auslieferung" → **CodePipeline**.
- **Die Zuordnungsfrage (fast garantiert):** Commit = speichern, Build = bauen/testen, Deploy = ausliefern, **Pipeline = orchestriert alle anderen**. Frage nach „Gesamtprozess" / „Verbindung der Schritte" → Pipeline!
- CodePipeline kann auch **GitHub** anzapfen — nicht auf CodeCommit angewiesen.
- **Eselsbrücke:** Pipeline = Rohr, durch das der Code von Quelle bis Produktion fließt.

---

## Amazon Q Developer 🛑 *(wird durch Kiro ersetzt — IDE-Plugins EoS 30.04.2027)*

**Metapher / Konzept**

> Der KI-Kollege, der neben dir sitzt, AWS auswendig kennt und deinen Code mitschreibt.

**Das Problem & Die Lösung**

Entwickler tippen täglich Standardcode (die hundertste Datei-Einlese-Funktion, API-Boilerplate) und hängen ständig in der Doku („Wie hieß nochmal der Parameter für...?"). Und in AWS: „Warum kann meine Lambda nicht auf S3 zugreifen?" — dafür wühlt man sich durch Policies und Foren. Zeit, die für die kniffligen Probleme fehlt.

**Q Developer** ist der KI-Assistent von AWS speziell für **Entwickler-Aufgaben** (der Nachfolger von **CodeWhisperer** — der alte Name kann in Fragen noch auftauchen!):
- **Code-Vervollständigung in der IDE:** Kommentar „// lädt eine Datei nach S3 hoch" → Q schlägt den fertigen Code vor (VS Code, IntelliJ...).
- **Chat über deinen Code und AWS:** „Erkläre diesen Code", „Wo ist der Bug?", „Wie baue ich eine DynamoDB-Abfrage in Python?"
- **AWS-Hilfe direkt in der Konsole:** „Welche Instanztypen passen für meine Workload?", Troubleshooting.
- **Sicherheits-Scans:** durchsucht Code auf Schwachstellen.

**Die zwei Q-Geschwister:** **Q Developer** (für Entwickler: Code, IDE, AWS-Konsole) und **Q Business** (für Büro-Mitarbeiter: Fragen aus internen Firmendokumenten, ohne Code).

🛑 **Aktualität (verifiziert):** Q Developer wird durch **Kiro** ersetzt — AWS' neue, **spec-driven** agentische IDE (auf VS-Code-Basis, läuft auf Claude via Bedrock). Zeitplan: neue Signups **seit 15.05.2026 blockiert**; ab 29.05.2026 nur noch ältere Modelle auf Q Developer Pro; **IDE-Plugins & Subscriptions End of Support 30.04.2027**. Q Developer in AWS-Konsole/Docs/Slack bleibt. **Für die Prüfung** ist Q Developer weiter der Standard-Begriff für „KI-Coding-Assistent". **CertOps:** Kiro als Nachfolger auf die Watch-Liste (Q Developer steht schon drauf).

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „KI-Coding-Assistent", „Code-Vorschläge generieren", „generative AI für Entwickler" → **Q Developer**.
- **Q Developer vs. Q Business:** Developer = Code & AWS-Hilfe für Entwickler. Business = Wissens-Chatbot über Firmendaten für alle.
- Alter Name **CodeWhisperer** → Vorgänger von Q Developer.
- **Nicht verwechseln mit Bedrock:** Bedrock = Baukasten, um eigene generative-AI-Apps mit Foundation Models zu bauen. Q = das **fertige** KI-Produkt zum direkten Benutzen. **Merksatz: Q = fertiger Assistent, Bedrock = Baukasten für eigene KI-Apps.**

---

## AWS X-Ray

**Metapher / Konzept**

> Das Röntgengerät, das eine Anfrage auf ihrer ganzen Reise durch viele Microservices verfolgt und zeigt, wo genau es klemmt.

**Das Problem & Die Lösung**

Moderne Anwendungen bestehen aus vielen kleinen Diensten (**Microservices**): Eine Nutzer-Anfrage wandert z. B. durch **API Gateway → Lambda A → Lambda B → DynamoDB → weiterer Service**. Nutzer beschweren sich: „Die App ist langsam!" Aber **wo genau**? Lambda A? Die DB-Abfrage? Ein externer Dienst? Bei zehn Komponenten: Nadel im Heuhaufen. **CloudWatch** sagt dir *dass* es hakt (hohe Latenz), aber nicht, **an welcher Station**.

**X-Ray** ist ein **Distributed-Tracing-Dienst**: Er verfolgt eine **einzelne Anfrage** auf ihrem kompletten Weg durch alle Dienste und misst jede Station:
- **Service Map (die Landkarte):** eine visuelle Karte aller Komponenten und ihrer Zusammenhänge — die ganze Architektur als Diagramm.
- **Trace (die Reise einer Anfrage):** „API Gateway 5 ms → Lambda A 12 ms → **DynamoDB 890 ms ← Flaschenhals!** → Lambda B 8 ms."
- **Fehler & Engpässe punktgenau finden.**

**Die Killer-Unterscheidung X-Ray vs. CloudWatch:** **CloudWatch** = überwacht Metriken/Logs/Alarme einzelner Ressourcen — „Wie ist die Gesamt-Gesundheit?". **X-Ray** = verfolgt **eine Anfrage durch die ganze Kette** — „An welcher Station hängt es?". **Merksatz: CloudWatch sagt dir, DASS das System krank ist (Fieber messen). X-Ray ist das Röntgenbild, das zeigt, WO der Bruch sitzt.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Microservices", „Distributed Tracing", „Anfrage durch mehrere Dienste verfolgen", „Bottleneck finden", „debuggen, welcher Service langsam ist" → **X-Ray**.
- Performance/Metriken einzelner Ressourcen → **CloudWatch**. Eine Anfrage quer durch viele Dienste → **X-Ray**.
- X-Ray ist das Werkzeug für **serverlose/Microservice-Architekturen** (API Gateway + Lambda + DynamoDB).

---

## AWS Cloud9 🛑 *(abgekündigt für Neukunden — 25.07.2024)*

**Metapher / Konzept**

> Die komplette Programmierwerkstatt im Browser — eine fertige Entwicklungsumgebung, ohne lokal etwas installieren zu müssen.

**Das Problem & Die Lösung**

Eine lokale Entwicklungsumgebung (IDE, Compiler, Tools, AWS-CLI) einzurichten kostet Zeit, und im Team haben alle leicht unterschiedliche Setups („bei mir läuft's"). Außerdem will man manchmal von überall am Code arbeiten.

**Cloud9** ist eine **cloudbasierte IDE im Browser**: Code-Editor, Terminal und Debugger fertig dabei, läuft auf einer (EC2-)Instanz, vorkonfiguriert für AWS (CLI und Anmeldedaten schon eingerichtet):
- **Nichts lokal installieren:** entwickeln direkt im Browser, von jedem Gerät.
- **AWS-integriert:** ideal für Lambda & Co.
- **Team-Collaboration:** mehrere Entwickler in Echtzeit in derselben Umgebung (Pair Programming).

🛑 **Aktualität (verifiziert):** AWS hat **Cloud9 am 25.07.2024 für Neukunden geschlossen** (kein direkter Nachfolger; AWS verweist auf **IDE Toolkits, CloudShell** und VS-Code-basierte Umgebungen). Bestandskunden können weiter. **Für die Prüfung normal mitlernen.** **CertOps:** Cloud9 auf die Deprecated-Liste ergänzen (steht dort noch nicht).

**⚠️ Prüfungs-Knackpunkte**
- Cloud-IDE im Browser, kein lokales Setup, AWS-integriert → **Cloud9**.
- Gut für Lambda-/serverless-Entwicklung und kollaboratives Coding. Reines DevOps-Tool, Randthema.

---

## AWS Device Farm

**Metapher / Konzept**

> Das Test-Labor mit echten Handys und Browsern in der Cloud, auf denen du deine App automatisiert testen kannst.

**Das Problem & Die Lösung**

Eine Mobile-App muss auf vielen echten Geräten funktionieren (verschiedene iPhones, Android-Modelle, Bildschirmgrößen, OS-Versionen). Alle Geräte selbst zu kaufen und manuell zu testen ist unbezahlbar und langsam.

**Device Farm** stellt **echte physische Geräte** (Smartphones, Tablets) und Browser in der AWS-Cloud bereit, auf denen du automatisiert oder manuell testest:
- **Echte Geräte (nicht nur Emulatoren)** → realistische Ergebnisse.
- **Automatisierte Tests parallel** auf vielen Geräten.
- Fehler/Performance geräteübergreifend früh erkennen; Remote-Zugriff auf einzelne Geräte möglich.

**⚠️ Prüfungs-Knackpunkte**
- App auf echten Mobilgeräten/Browsern testen → **Device Farm**.
- Stichwort „Mobile-App-Tests auf realen Geräten" → Device Farm. Reines DevOps-/Test-Tool, in CLF/SAA Randthema.

---

*Ende Kapitel 10 — Entwickler-Tools & DevOps.*
