# Kapitel 2 — Compute, Container & Edge

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).** *(Kapitel 1 „Grundlagen & Cloud-Konzepte" wird separat erstellt und beim Merge vorangestellt.)*

**Die Kernidee dieser Domäne:** „Compute" heißt schlicht *Rechenleistung*. Die zentrale Frage bei jedem Dienst hier lautet immer gleich: **Wie viel Verwaltungsarbeit nimmt AWS mir ab — und wie viel Kontrolle behalte ich?** Auf dieser einen Achse ordnet sich alles ein, von „ich baue jeden Server selbst" (EC2) bis „ich sehe nie wieder einen Server" (Lambda). Merk dir diese Achse — sie ist die häufigste Zuordnungsfrage beider Prüfungen.

`EC2 (alles selbst) → Beanstalk → ECS/EKS auf EC2 → Fargate/App Runner → Lambda (nichts selbst)`

---

## Amazon EC2 (Elastic Compute Cloud) 🛑 *(neue Karte — Kern-Dienst)*

**Architektonische Einordnung**

EC2 ist der **Urbaustein von AWS** — der virtuelle Server, auf dem historisch fast alles andere aufsetzt. Auto Scaling Groups vermehren EC2-Instanzen, Load Balancer verteilen Traffic auf sie, EBS-Volumes hängen an ihnen, sie leben in einem VPC-Subnetz, und selbst „bequemere" Dienste wie **Beanstalk** oder der **ECS/EKS-EC2-Launch-Type** bauen im Hintergrund echte EC2-Server. EC2 ist **IaaS** (Infrastructure as a Service): AWS liefert die virtuelle Hardware, ab dem Betriebssystem bist *du* verantwortlich.

**Metapher / Konzept**

> EC2: Du baust dir den Motor und das Auto komplett selbst zusammen (volle Kontrolle, sehr komplex). Es ist der „Rohbau" — ein leerer, virtueller Computer in AWS' Rechenzentrum, den du mietest und komplett selbst einrichtest.

**Das Problem & Die Lösung**

Du brauchst einen Server — für eine Website, eine Datenbank, eine Anwendung. Einen physischen Server zu kaufen bedeutet: hohe Vorabkosten, Wochen Lieferzeit, Wartung, und du sitzt auf der Hardware fest, egal ob sie ausgelastet ist oder nicht.

**EC2** löst das: Du startest per Klick oder API einen **virtuellen Server (Instanz)** in Minuten und zahlst nur für die Laufzeit. Beim Starten wählst du:

- **AMI (Amazon Machine Image):** die Vorlage = Betriebssystem + vorinstallierte Software (z. B. Amazon Linux, Ubuntu, Windows Server). Der „Bauplan" für die Festplatte.
- **Instanztyp:** die Größe/Ausstattung (CPU, RAM, Netzwerk). Benennung = *Familie + Generation + Größe*, z. B. `m5.large`.
- **Netzwerk:** in welches **VPC/Subnet** die Instanz kommt.
- **Security Group:** die Firewall direkt vor der Instanz.
- **Key Pair:** der SSH-Schlüssel für den Login.

🛑 **Pro-Tipp SAA — Instanz-Familien (Signalwort-Zuordnung):**

| Familie | Typische Kürzel | Wofür |
|---|---|---|
| **General Purpose** | M, T | ausgewogen; Web, kleine DBs, Allrounder (T = günstig, burstbar) |
| **Compute Optimized** | C | rechenintensiv; Batch, HPC, Gaming-Server, Encoding |
| **Memory Optimized** | R, X | RAM-hungrig; große In-Memory-DBs, Caches, Analytics |
| **Storage Optimized** | I, D | hoher lokaler Durchsatz/IOPS; NoSQL, Data Warehouses |
| **Accelerated Computing** | P, G | GPU; ML-Training, Grafik, Inferenz |

🛑 **Pro-Tipp SAA — die häufigsten EC2-Fallen:**
- **Security Group = stateful und nur ALLOW.** Sie merkt sich ausgehende Verbindungen und lässt die Antwort automatisch zurück; du kannst nur *erlauben*, nichts explizit *verbieten*. (Gegenstück: **NACL** auf Subnetz-Ebene = *stateless*, kann auch DENY — kommt in der Netzwerk-Domäne.) Klassische Verwechslungsfrage.
- **EBS vs. Instance Store.** **EBS** = netzgebundene Festplatte, überlebt Stop/Neustart (persistent). **Instance Store** = lokal an der Hardware, **blitzschnell, aber flüchtig** — bei Stop oder Terminate sind die Daten **weg**. Signalwort „temporärer Scratch-/Cache-Speicher, maximaler Durchsatz" → Instance Store; „Daten müssen bleiben" → EBS.
- **Stop ≠ Terminate.** Stop = Instanz pausiert, EBS-Root bleibt (du zahlst nur Storage). Terminate = Instanz + (standardmäßig) EBS-Root gelöscht.
- **User Data:** ein Skript, das beim **ersten** Start automatisch läuft (Bootstrapping, z. B. Software installieren).
- **IMDSv2 (Instance Metadata Service):** eine interne Adresse (`169.254.169.254`), über die die Instanz Infos über sich selbst und ihre IAM-Rolle abruft. **Best Practice: IMDSv2 erzwingen** (session-basiert) — schützt vor SSRF-Angriffen, die sonst temporäre Credentials abgreifen könnten.

*(Kaufoptionen/Rabatte, physische Anordnung und automatische Skalierung sind so prüfungsrelevant, dass sie eigene Karten bekommen — siehe direkt im Anschluss.)*

**💡 Merksatz**

EC2 = **maximale Kontrolle, maximale Verantwortung.** Alles ab dem OS gehört dir. Willst du weniger Arbeit, gehst du die Compute-Achse Richtung Serverless nach unten.

---

## EC2 Kaufoptionen & Savings Plans

**Architektonische Einordnung**

Keine eigenen Dienste, sondern **Abrechnungsmodelle** für EC2-Rechenzeit (Savings Plans greifen zusätzlich auf Fargate und Lambda). Das ist ein **Kern-Hebel der Kostenoptimierung** — eine der fünf Well-Architected-Säulen — und ein Dauerbrenner in beiden Prüfungen.

**Metapher / Konzept**

> Fünf Einkaufsstrategien für Serverzeit — von teuer-aber-flexibel bis spottbillig-aber-mit-Haken.

**Das Problem & Die Lösung**

EC2 nach Standardpreis dauerhaft laufen zu lassen ist teuer. Je nachdem, wie **vorhersehbar** und **unterbrechbar** deine Last ist, gibt es deutlich günstigere Optionen:

- **On-Demand:** Du zahlst pro Sekunde/Stunde, keine Bindung, jederzeit starten/stoppen. Teuerste Variante, aber maximal flexibel. Für kurze, unvorhersehbare Workloads, Tests, neue Projekte ohne bekannte Last.
- **Reserved Instances (RI):** Du verpflichtest dich für 1 oder 3 Jahre zu einer bestimmten Instanz → **bis zu ~72 % Rabatt**. Für stabile, vorhersehbare Dauerlast (z. B. eine Datenbank, die immer läuft). Varianten: **Standard RI** (max. Rabatt, wenig flexibel) und **Convertible RI** (etwas weniger Rabatt, dafür Instanztyp änderbar).
- **Savings Plans:** Du verpflichtest dich zu einem bestimmten **Ausgabenbetrag pro Stunde** (z. B. „10 $/h für 1 Jahr") statt zu einer konkreten Instanz → ähnliche Rabatte wie RIs, aber flexibler. Zwei Arten: **Compute Savings Plans** (gelten für EC2, **Fargate, Lambda** — maximal flexibel) und **EC2 Instance Savings Plans** (nur EC2 einer Familie, mehr Rabatt). Der moderne, flexible Weg, Rabatte zu bekommen.
- **Spot Instances:** Du nutzt ungenutzte AWS-Kapazität mit **bis zu ~90 % Rabatt** — der Haken: AWS kann sie mit **2 Minuten Vorwarnung** jederzeit zurücknehmen. Nur für unterbrechbare, flexible Workloads: Batch-Jobs, Big-Data-Verarbeitung (EMR!), Bildrendering, CI/CD. **Nicht** für Datenbanken oder kritische Dauerdienste.
- **Dedicated Host / Dedicated Instance:** Du bekommst physisch eigene Hardware (nicht mit anderen Kunden geteilt).
  - **Dedicated Host:** ein ganzer physischer Server nur für dich — du siehst sogar die Hardware-Details. Wichtig für Lizenzen, die an physische Kerne/Sockets gebunden sind (z. B. „Bring Your Own License" bei Windows/Oracle), und strengste Compliance.
  - **Dedicated Instance:** läuft auf dedizierter Hardware, aber ohne die volle Sichtbarkeit/Kontrolle eines Dedicated Hosts.

**⚠️ Prüfungs-Knackpunkte**
- Unvorhersehbar/kurz/flexibel → **On-Demand**.
- Stabile Dauerlast, max. sparen, 1–3 Jahre → **Reserved Instances** oder **Savings Plans** (flexibler).
- Bis 90 % billig, aber unterbrechbar → **Spot** (Batch, Big Data, fault-tolerant).
- Eigene physische Hardware / lizenzgebunden (BYOL) → **Dedicated Host**.
- Faustregel: **Flexibilität ↔ Preis** — je mehr du dich bindest oder Unterbrechung akzeptierst, desto billiger.

🛑 **Pro-Tipp SAA — der Distraktor, auf den viele reinfallen:** „Maximale Ersparnis bei planbarer Dauerlast" → Reserved/Savings Plans, **nicht** Spot. Spot ist zwar billiger, wird aber *terminiert* → für Dauerbetrieb ungeeignet. Und **RI vs. Savings Plan:** brauchst du eine *garantierte Kapazitätsreservierung* in einer bestimmten AZ, ist das eine **zonale RI** (bzw. *On-Demand Capacity Reservation*) — reine Savings Plans reservieren nur den *Preis*, keine Kapazität.

---

## Placement Groups

**Architektonische Einordnung**

Eine **Platzierungs-Strategie für EC2-Instanzen** auf der physischen Hardware. Reines SAA-Thema — es geht um den Trade-off zwischen **Netzwerk-Performance** und **Ausfall-Isolation**.

**Metapher / Konzept**

> Drei Anordnungs-Strategien, die bestimmen, WIE nah oder verteilt deine EC2-Instanzen auf der physischen Hardware platziert werden.

**Das Problem & Die Lösung**

Standardmäßig verteilt AWS deine Instanzen beliebig. Aber manchmal willst du sie bewusst **dicht zusammen** (für Speed) oder bewusst **weit auseinander** (für Ausfallsicherheit) haben. Dafür gibt es drei Strategien:

- **Cluster Placement Group:** Packt die Instanzen physisch eng zusammen (möglichst auf derselben Hardware/im selben Rack, in *einer* AZ). Ergebnis: **niedrigste Latenz und höchster Netzwerkdurchsatz**. Für HPC, Big-Data-Jobs, alles, wo Instanzen extrem schnell miteinander reden müssen. Nachteil: Geht das Rack kaputt, sind evtl. alle betroffen (Risiko gebündelt). *Bild: alle in einem Raum für maximale Geschwindigkeit.*
- **Spread Placement Group:** Verteilt die Instanzen bewusst auf verschiedene, getrennte Hardware (jede auf eigener physischer Maschine, auch über mehrere AZs). Ergebnis: **maximale Ausfallsicherheit**. Für wenige, besonders kritische Instanzen. Limit: **max. 7 Instanzen pro AZ**. *Bild: jeder in einem eigenen Gebäude.*
- **Partition Placement Group:** Der Mittelweg für große verteilte Systeme. Instanzen in **Partitionen**; jede Partition auf eigener Hardware. Fällt eine Partition aus, sind die anderen nicht betroffen. Für **Hadoop, Cassandra, Kafka**, die selbst über Knoten replizieren. *Bild: mehrere Gruppen in getrennten Brandabschnitten.*

**⚠️ Prüfungs-Knackpunkte**
- Niedrigste Latenz / max. Netzwerk-Performance / HPC → **Cluster**.
- Maximale Ausfallsicherheit / kritische einzelne Instanzen trennen → **Spread**.
- Große verteilte Systeme (Hadoop/Cassandra/Kafka), Fehler isolieren → **Partition**.
- **Eselsbrücke:** Cluster = zusammen (schnell), Spread = verstreut (sicher), Partition = in Gruppen aufgeteilt (großskalig isoliert).

---

## Auto Scaling Group (ASG)

**Architektonische Einordnung**

Die ASG ist das **Elastizitäts-Herz** von EC2-Architekturen und der Grund, warum „die Cloud" bei Last mitwächst. Sie spielt fest mit **Elastic Load Balancing** (verteilt Traffic) und **CloudWatch** (liefert die Metriken) zusammen — dieses Trio ist *das* Standard-Muster für Hochverfügbarkeit über mehrere AZs.

**Metapher / Konzept**

> Die Server-Herde, die sich selbst reguliert — automatisch mehr Server bei Last, weniger bei Ruhe.

**Das Problem & Die Lösung**

Feste Serveranzahl ist entweder zu wenig (Überlastung bei Spitzen) oder zu viel (Geldverschwendung bei wenig Last). Eine **ASG** verwaltet eine Gruppe gleichartiger EC2-Instanzen und passt deren Anzahl automatisch an:

- **Launch Template:** Die Vorlage, wie neue Instanzen aussehen sollen (AMI, Instanztyp, Security Groups...).
- **Min / Desired / Max:** Minimum (immer mindestens X), Desired (Soll-Anzahl) und Maximum (nie mehr als Y). Die ASG hält die Desired-Zahl zwischen Min und Max.
- **Scaling Policies:**
  - **Target Tracking:** „Halte die CPU bei 50 %" — einfachste, empfohlene Methode.
  - **Step / Simple Scaling:** stufenweise nach CloudWatch-Alarmen („bei CPU > 80 % +2 Server").
  - **Scheduled Scaling:** zeitbasiert („jeden Werktag 8 Uhr hochskalieren").
  - **Predictive Scaling:** ML sagt Last vorher und skaliert vorausschauend.
- **Health Checks:** Meldet ein EC2- oder ELB-Health-Check „unhealthy", ersetzt die ASG die Instanz automatisch → **Selbstheilung**.
- **Zusammenspiel:** ASG + Elastic Load Balancer + CloudWatch = das klassische elastische, hochverfügbare Setup über mehrere AZs.

**⚠️ Prüfungs-Knackpunkte**
- Automatisch mehr/weniger EC2 nach Last → **Auto Scaling Group**.
- „Halte CPU bei X %" → **Target Tracking** (Standard).
- Zeitgesteuert → **Scheduled**; vorausschauend → **Predictive**.
- Ausgefallene Instanz automatisch ersetzen → **ASG Health Check** (Selbstheilung).
- Hochverfügbarkeit: ASG über mehrere AZs verteilen + ELB davor.
- **Merke:** ASG = Elastizität (Kosten + Verfügbarkeit), arbeitet mit ELB + CloudWatch zusammen.

🛑 **Pro-Tipp SAA — Distraktor „Skalierung vs. Verfügbarkeit":** Eine ASG allein macht dich **nicht** hochverfügbar, wenn sie in nur *einer* AZ läuft. Für HA musst du sie über **mehrere AZs** spannen. Und: **Elastizität ≠ Vertical Scaling.** Größere Instanz nehmen (scale *up*) heißt Neustart; die ASG macht **scale *out*** (mehr Instanzen) ohne Ausfall — das ist der Cloud-Weg.

---

## Container-Grundlagen: Docker, Kubernetes, ECS, EKS & Fargate

**Architektonische Einordnung**

Container sind die **portable Verpackung** für Anwendungen und der Standard für moderne, microservice-basierte Deployments. In AWS teilt sich das in drei Fragen: **Womit verpacke ich?** (Docker) — **Wer orchestriert?** (ECS oder EKS) — **Worauf läuft es?** (EC2 selbst verwalten oder Fargate serverless).

**Metapher / Konzept**

> **Container** = ein digitaler Frachtcontainer: Du packst deine fertige App und absolut alles, was sie zum Überleben braucht, in eine Kiste, die auf jedem Computer der Welt exakt gleich läuft. **Kubernetes** = der oberste Hafen-Manager (Orchestrator). **Fargate** = der vollautomatische Verladekran.

**Das Problem & Die Lösung**

Stell dir vor, du programmierst eine App. Auf deinem Mac läuft sie perfekt, aber auf dem Live-Server stürzt sie ab, weil dort irgendeine kleine Datei oder Einstellung fehlt. Das war früher ein riesiges Problem.

- **Container:** verpackt die App mit allem Nötigen in eine Kiste, die überall gleich läuft.
- **Docker:** die bekannteste Marke/Technologie, die diese Container herstellt. „Container" meint meist „Docker-Container".
- **Kubernetes:** der Orchestrator. Weiß, auf welchem Server noch Platz ist; startet abgestürzte Container automatisch neu. Weltweiter Open-Source-Standard, extrem mächtig, aber echt kompliziert einzurichten.

Jetzt in der AWS-Cloud — du hast viele Container und brauchst einen Manager. AWS bietet **genau zwei Optionen**:

- **Amazon ECS (Elastic Container Service):** der hauseigene Container-Manager. Einfacher zu bedienen als Kubernetes, perfekt mit anderen AWS-Diensten. Super für den Einstieg und für Projekte, die ohnehin komplett bei AWS bleiben.
- **Amazon EKS (Elastic Kubernetes Service):** die AWS-Version von Kubernetes. Für: „Ich will den weltweiten Standard, aber AWS soll mir die schwere Installation abnehmen." Vorteil: **portabel** — Container später leichter zu Google/Microsoft umziehbar.

Und egal ob ECS oder EKS — am Ende brauchen die Container physische Computer (EC2-Server). Hier kommt der Gamechanger:

- **AWS Fargate:** der vollautomatische Verladekran. Statt eigene EC2-Server zu mieten, updaten und bewachen, sagst du nur: „Hier ist mein Container, lass ihn laufen!" Fargate besorgt unsichtbar die Server-Power, führt den Container aus, und du **zahlst nur für die exakten Sekunden**. Du verwaltest nie wieder einen Server.

🛑 **Pro-Tipp SAA — die Entscheidungs-Matrix (sehr häufig gefragt):**
- **AWS-nativ, einfach, ganz bei AWS** → **ECS**.
- **Kubernetes-Standard / portabel / Team kennt schon K8s** → **EKS**.
- **Keine Server verwalten wollen** → **Fargate** (funktioniert mit ECS *und* EKS).
- **Volle Kontrolle / spezielle Instanztypen / GPU / günstiger bei Dauerlast** → **EC2-Launch-Type**.
- **Distraktor:** Fargate ist *nicht* zwingend billiger — bei konstant hoher Auslastung ist der EC2-Launch-Type oft günstiger; Fargate glänzt bei schwankender/unvorhersehbarer Last und minimalem Betriebsaufwand.

---

## Container, ECS & ECR im Detail

**Metapher / Konzept**

> Alles rund um Container in AWS — wie man sie speichert, ausführt und verwaltet.

**Das Problem & Die Lösung**

Ein Container (Docker) verpackt eine App mit allem, was sie braucht — läuft überall gleich. Für die Verwaltung vieler Container braucht man einen Orchestrierer. Die Bausteine:

- **Task Definition (ECS):** Der **Bauplan** für einen Container-Task — eine JSON-Datei: welches Image, wie viel CPU/RAM, welche Ports, Umgebungsvariablen, IAM-Rolle. *Bild: das Rezept, wie ein Container laufen soll.*
- **ECS Service:** Sorgt dafür, dass **immer die gewünschte Anzahl** Container-Tasks läuft. Fällt einer aus, startet der Service Ersatz; skaliert bei Last und arbeitet mit einem Load Balancer. *Bild: der Manager, der z. B. immer 5 Container am Laufen hält.*
- **ECR (Elastic Container Registry):** Das **private Lager** für Container-Images („Docker Hub für AWS"). Images verschlüsselt, über IAM gesichert; von hier zieht ECS/EKS die Images. *(Erinnerung: **Inspector** scannt ECR-Images auf Schwachstellen.)*
- **Node Groups (EKS):** Gruppen von **EC2-Worker-Knoten**, auf denen die Container-Pods tatsächlich laufen. Als **Managed Node Groups** automatisch verwaltbar.

Die zwei Orchestrierer + die zwei „Wo-läuft-es"-Optionen (SAA-wichtig): **ECS** (AWS-eigen, einfacher) · **EKS** (Kubernetes, portabel, komplexer) · **Fargate** (serverlos, mit ECS & EKS) · **EC2-Launch-Type** (eigene Server, mehr Kontrolle).

**⚠️ Prüfungs-Knackpunkte**
- Container-Image speichern → **ECR**.
- Bauplan eines Containers (CPU/RAM/Image/Ports) → **Task Definition**.
- Gewünschte Anzahl Container am Laufen halten → **ECS Service**.
- ECS vs. EKS: AWS-eigen/einfacher → **ECS**; Kubernetes/portabel → **EKS**.
- Container ohne Server-Verwaltung → **Fargate**. Volle Kontrolle/eigene Server → **EC2-Launch-Type**.
- EKS Node Groups = die EC2-Worker-Knoten in Kubernetes.

🛑 **Pro-Tipp SAA — Deprecation-Hinweis:** Der früher hier gern genannte **AWS App2Container** und einzelne Registry-Alternativen sind Randthemen; für Bilder-Scanning gilt heute **ECR image scanning (basic/enhanced via Inspector)** als Standardantwort.

---

## AWS Lambda 🛑 *(neue Karte — Kern-Dienst)*

**Architektonische Einordnung**

Lambda ist das **Herz von Serverless** und der universelle **Klebstoff** ereignisgesteuerter Architekturen. Das kanonische Muster: **API Gateway → Lambda → DynamoDB** (bzw. über den **RDS Proxy** zu RDS). Ausgelöst wird Lambda von fast allem: ein **S3**-Upload, eine **SQS**-Nachricht, ein **DynamoDB-Stream**, ein **EventBridge**-Ereignis oder ein Timer. Du stellst **keinen Server** bereit und zahlst **nichts**, solange nichts passiert.

**Metapher / Konzept**

> Lambda ist die **Funktion auf Abruf**: Du hinterlegst nur ein Stück Code und einen Auslöser. Tritt das Ereignis ein, führt AWS deinen Code aus, skaliert bei Bedarf auf tausende parallele Ausführungen und schläft danach wieder ein. *(Aus deiner Batch-Karte: „Für kleine, blitzschnelle Reaktionen — ein Nutzer lädt ein Profilbild hoch → Lambda macht es in 2 Sekunden quadratisch.")*

**Das Problem & Die Lösung**

Für viele Aufgaben einen EC2-Server rund um die Uhr laufen zu lassen ist Verschwendung: Er kostet auch dann, wenn nichts zu tun ist, und du musst ihn patchen und skalieren. Bei stark schwankender oder seltener Last passt das nicht.

**Lambda** ist **Function-as-a-Service (FaaS)**: Du lädst nur deine Funktion hoch und verknüpfst sie mit einem Auslöser. AWS kümmert sich um Server, Betriebssystem, Skalierung und Verfügbarkeit — **jede** gleichzeitige Anfrage bekommt eine eigene, isolierte Ausführungsumgebung. Abgerechnet wird pro **Anfrage** und pro **GB-Sekunde** tatsächlicher Laufzeit (auf die Millisekunde).

🛑 **Pro-Tipp SAA — die Limits, die Prüfungsfragen entscheiden (aktuell geprüft):**
- **Maximale Laufzeit: 15 Minuten** pro Ausführung (harte Grenze). Länger nötig → **Step Functions**, **ECS/Fargate** oder **AWS Batch**.
- **RAM: 128 MB – 10.240 MB (10 GB)** — CPU wächst **proportional** zur RAM-Einstellung (mehr RAM = auch mehr CPU/Netzwerk).
- **`/tmp`-Speicher: 512 MB – 10 GB** (flüchtig, nicht über Ausführungen hinweg garantiert). Für Persistenz → **S3** oder **EFS**.
- **Concurrency: standardmäßig 1.000** gleichzeitige Ausführungen pro Region (**Soft Limit**, erhöhbar). Neue Konten starten reduziert.
- **Payload: 6 MB** bei synchronem Aufruf (256 KB asynchron). Größer → über **S3** referenzieren.
- **Deployment: 50 MB** (gezippt, direkt) bzw. **250 MB** entpackt, oder **10 GB** als Container-Image.

🛑 **Pro-Tipp SAA — Betriebs-Fallen:**
- **Cold Start:** Beim ersten Aufruf (oder nach Ruhe) muss die Umgebung hochfahren → Verzögerung. Gegenmittel: **Provisioned Concurrency** (hält Umgebungen warm).
- **Reserved vs. Provisioned Concurrency:** **Reserved** *garantiert* einer kritischen Funktion Kapazität aus dem Konto-Pool (und deckelt sie); **Provisioned** hält Umgebungen *vorgewärmt* (kostet extra). Beide zählen gegen das Konto-Limit.
- **Throttling:** Über dem Concurrency-Limit → synchrone Aufrufe bekommen **429**, asynchrone werden wiederholt und landen ggf. in einer **DLQ**. Häufige Kombi-Falle: **API Gateway** (10.000 rps default) kann mehr durchlassen, als Lambda (1.000 Concurrency) verarbeitet → Concurrency erhöhen.
- **VPC-Anbindung** (um auf private RDS zuzugreifen) kann Cold Starts verlängern; für viele parallele DB-Verbindungen → **RDS Proxy** davor.

**⚠️ Prüfungs-Knackpunkte**
- Ereignisgesteuert, kurz, „nur bei Bedarf zahlen", kein Server → **Lambda**.
- Länger als 15 Min / komplexer Ablauf mit Schritten → **Step Functions** (+ Lambda) statt einer Riesen-Lambda.
- Kleine, blitzschnelle Reaktion → **Lambda**; schwere, stundenlange Massenverarbeitung → **Batch**; langlaufender Container-Dienst → **Fargate/ECS**; volle Kontrolle/Dauerlast → **EC2**.

**💡 Merksatz**

**Lambda** = Code + Auslöser, sonst nichts. Zahlst nur, wenn er läuft; skaliert von 0 auf tausende automatisch — aber **15 Minuten sind die Wand**.

---

## AWS Batch

**Architektonische Einordnung**

Batch ist die Antwort für **große Mengen unabhängiger Rechenaufgaben** (Batch Computing). Es orchestriert im Hintergrund **EC2** oder **Fargate** und kombiniert sich stark mit **Spot Instances** (günstige, unterbrechbare Rechenzeit) — der klassische Weg, riesige, kostensensitive Jobs abzuarbeiten.

**Metapher / Konzept**

> Die „Waschmaschine": Du wirfst deine Schmutzwäsche (Jobs) in einen Korb (Job Queue), die Maschine berechnet den Aufwand, besorgt automatisch die passende Menge Server (Compute Environment), wäscht — und schaltet danach alles wieder ab.

**Das Problem & Die Lösung**

Stell dir vor, du hast nicht *eine* kleine Rechenaufgabe, sondern **100.000 gleichzeitig** — nachts 100.000 hochgeladene Videos in HD/4K umwandeln, oder DNA-Sequenzen durchrechnen. Auf einem Server dauert das Wochen; selbst auf Tausende Server aufzuteilen ist ein Verwaltungs-Albtraum.

**AWS Batch** übernimmt vollautomatisch Planung, Einteilung und Ausführung:

- **Job Queue:** Du definierst Aufgaben („Wandle Video XY um") und wirfst sie alle in einen virtuellen Korb.
- **Aufwand berechnen:** Batch analysiert die Menge der Arbeit.
- **Compute Environment:** Batch bestellt automatisch genau die richtige Menge **EC2-Server oder Fargate-Container**, verteilt die Aufgaben und lässt Hunderte/Tausende Server gleichzeitig arbeiten.
- **Strom sparen:** Ist der Korb leer, schaltet Batch alle Server sofort ab — kein Cent zu viel.

**Abgrenzung — wann Batch, wann nicht:**
- **AWS Lambda:** für kleine, blitzschnelle Reaktionen (Profilbild in 2 Sekunden quadratisch machen).
- **AWS Batch:** für schwere, **stundenlange „Schwerstarbeit"** im Hintergrund — nicht sekundenkritisch (asynchron), aber schiere Masse.

Typische Praxis: **Filmindustrie** (jedes Bild eines 3D-Films als „Job"), **Finanzen** (nächtliche Risiko-/Portfolioberechnung), **KI** (gigantische Datensätze für z. B. SageMaker-Training vorbereiten).

🛑 **Pro-Tipp SAA — die Zuordnungsfalle Batch vs. Lambda vs. Step Functions:** „Viele *unabhängige* Rechenjobs, kostenoptimiert, dürfen unterbrochen werden" → **Batch (auf Spot)**. „Kurze, ereignisgetriebene Einzelaktion" → **Lambda**. „Mehrere *abhängige* Schritte koordinieren (Workflow)" → **Step Functions**. Batch ist ideal mit **Spot**, weil Jobs fault-tolerant sind und einfach neu gestartet werden.

---

## AWS Elastic Beanstalk

**Architektonische Einordnung**

Beanstalk ist eine **Orchestrierungsschicht (PaaS)**, kein eigener Baustein — es sitzt *über* den echten Diensten und verdrahtet sie: **EC2**, **ELB**, **Auto Scaling Group**, **CloudWatch**, optional **RDS** und **S3** (für das Code-Bundle). Auf der „Wie viel nimmt AWS mir ab?"-Achse liegt es **zwischen** reinem EC2 und Serverless: AWS baut die Infrastruktur, aber sie bleibt **sichtbar und zugänglich**.

**Metapher / Konzept**

> Du drückst AWS einfach deine ZIP-Datei mit dem Code in die Hand und sagst: „Hier ist mein Code, er ist in Python geschrieben. Mach, dass es läuft!" Beanstalk ist also **keine schwarze Box**, sondern eher ein **extrem fleißiger Assistent**, der dir die Routineaufgaben abnimmt.

**Das Problem & Die Lösung**

Du bist reiner Softwareentwickler, hast deinen Code als ZIP-Datei und müsstest normalerweise selbst: Server mieten (EC2), OS updaten, Laufzeitumgebung installieren, Load Balancer aufstellen, Auto-Scaling-Regeln festlegen. Lästige „Infrastruktur-Arbeit", die vom Programmieren abhält.

Mit **Elastic Beanstalk** umgehst du das komplett. Beanstalk analysiert deinen Code, bestellt automatisch EC2-Server, installiert alle Programme, richtet Load Balancer und Auto Scaling ein, startet die App und gibt dir am Ende nur den fertigen **Link (URL)**.

**Der große Unterschied zu Lambda/Fargate:** Dort sind die Server **unsichtbar und unzugänglich**. Bei Beanstalk **behältst du die volle Kontrolle** — du siehst die EC2-Server in deiner Liste und könntest dich jederzeit per Terminal einloggen und manuell etwas ändern.

**⚠️ Prüfungs-Knackpunkte & Fallen**
- **Signalwörter:** „nur Code/ZIP hochladen", „AWS soll Provisionierung + Load Balancer + Auto Scaling übernehmen", „schnell deployen ohne Infrastruktur-Know-how, aber mit voller Server-Kontrolle" → **Elastic Beanstalk**.
- 🛑 **Pro-Tipp SAA — die Abgrenzungsfalle:** **Beanstalk** (du gibst *Code*, AWS baut Infra, Server sichtbar) · **CloudFormation** (*du* schreibst den Infra-Bauplan; Beanstalk *nutzt es intern selbst*) · **CDK** (du *programmierst* den Bauplan) · **App Runner** (noch simpler, voll serverless, keine EC2-Sicht).
- 🛑 **Pro-Tipp SAA — Deployment-Policies („zero-downtime / schneller Rollback?"):** **All at once** (Downtime), **Rolling** (reduzierte Kapazität), **Rolling with additional batch** (volle Kapazität), **Immutable** (neue ASG, sicherer Rollback), **Traffic splitting** (Canary). **Blue/Green** ist hier *keine* Policy, sondern die **„Swap Environment URLs"-/CNAME-Technik**.
- 🛑 **Pro-Tipp SAA — Datenbank-Falle:** Eine von Beanstalk *selbst* erstellte RDS hängt am Lebenszyklus der Umgebung → beim Swap/Terminate gingen Daten verloren. **Best Practice: RDS entkoppeln** (eigenständig, per Retain-Option).
- 🛑 **Aktuell:** Beanstalk-Plattformen auf **Amazon Linux 2 werden am 30.06.2026 abgekündigt** → Migration auf **Amazon Linux 2023** (via Immutable/Blue-Green).

**💡 Merksatz**

**EC2** = du baust Motor *und* Auto selbst. **Beanstalk** = du gibst deinen Code, AWS baut das Auto drumherum (und du darfst unter die Haube schauen). **Lambda/Fargate/App Runner** = du bekommst nur den Schlüssel, die Motorhaube ist verschweißt.

---

## AWS App Runner

**Architektonische Einordnung**

App Runner ist die **radikal vereinfachte, voll serverlose Container-Veröffentlichung** — der Gegenpol zu Beanstalk auf der Kontroll-Achse. Er verbirgt ECS, Fargate, Load Balancer, Zertifikat und VPC hinter einem einzigen „Code/Image rein → HTTPS-URL raus".

**Metapher / Konzept**

> Das vollautomatische Fließband ins Internet für moderne Apps.

**Das Problem & Die Lösung**

Du hast eine App sauber in einen Container gepackt. Um ihn erreichbar zu machen, wäre bei AWS normalerweise ein Hindernislauf nötig: **ECS** einrichten, **Fargate** konfigurieren, einen **Load Balancer** davorschalten, ein **SSL-Zertifikat (https)** beantragen, ein **VPC** aufbauen. Viel „Infrastruktur-Bürokratie", wenn man nur schnell veröffentlichen will.

**AWS App Runner** ist der Express-Weg — der einfachste Weg in ganz AWS, um Container oder reinen Quellcode sicher live zu schalten:

- **Verbinden:** mit deinem Quellcode (z. B. GitHub) oder deinem Container-Bild (im **ECR**).
- **Zurücklehnen:** App Runner besorgt Rechenleistung, richtet den Load Balancer ein, verschlüsselt mit SSL und skaliert automatisch hoch.
- **Fertig:** nach Minuten ein fertiger, sicherer **HTTPS-Link**.
- **Highlight:** Auf Wunsch überwacht App Runner deinen Code — bei jeder Änderung zieht es automatisch die neue Version und aktualisiert die Live-Seite ohne Unterbrechung.

**App Runner vs. Elastic Beanstalk:** Beanstalk ist der ältere, klassische Weg mit **sichtbaren EC2-Servern**, auf denen du dich einloggen kannst. App Runner ist hochmodern und **komplett Serverless** — kein Zugriff auf das Betriebssystem, pure Bequemlichkeit: **Code rein → URL raus**.

🛑 **Pro-Tipp SAA:** App Runner ist bewusst **eng gefasst** (HTTP-Web-Apps/APIs, auto-scaling, HTTPS out-of-the-box). Signalwort „einfachste Web-App-/Container-Veröffentlichung ohne jede Infrastruktur" → **App Runner**. Brauchst du feinere Netzwerk-/OS-Kontrolle → **Beanstalk** oder **ECS/Fargate**.

---

## Amazon Lightsail

**Architektonische Einordnung**

Lightsail ist ein **VPS-Komplettpaket** mit fester monatlicher Pauschale — bewusst **außerhalb** der komplexen AWS-Standardwelt für Einsteiger und kleine Projekte. Eigene, vereinfachte Konsole, aber **Upgrade-Pfad** zurück ins „große" EC2.

**Metapher / Konzept**

> Lightsail: Du gehst ins Autohaus und kaufst einen fertigen Kleinwagen zum monatlichen Festpreis (einfach, günstig, sofort fahrbereit).

**Das Problem & Die Lösung**

Die normale AWS-Welt ist wie ein gigantischer Flugzeugträger. Für einen kleinen Blog, eine WordPress-Seite oder einen Test-Server erschlägt dich das „echte" AWS (wie EC2) mit Optionen: VPC aufbauen, Sicherheitsgruppen, IP-Adressen, Festplatten verknüpfen. Für Einsteiger absoluter Overkill und zu teuer.

**Amazon Lightsail** ist die Antwort für alle, die sagen: „Gebt mir einfach einen Server für 5 Euro im Monat, auf dem mein System schon installiert ist!" Technisch ein **VPS (Virtual Private Server)** — ein perfekt geschnürtes Komplettpaket:

- **Feste, vorhersehbare Preise:** feste Monatspreise inklusive Server, Speicher und Datenübertragung. Keine bösen Rechnungs-Überraschungen.
- **1-Klick-Apps:** WordPress, Joomla, Node.js per Logo-Klick in Sekunden fertig aufgesetzt — ohne eine Zeile Code.
- **Eigener Sandkasten:** stark vereinfachte, aufgeräumte Oberfläche, getrennt von der großen AWS-Konsole.

**Der Haken:** Es ist eben „nur" ein Segelkutter. Wird dein Projekt plötzlich berühmt, stößt Lightsail an Grenzen (kein massives Auto Scaling / riesige Load Balancer wie EC2). Aber der Clou: Du kannst dein Lightsail-Projekt **auf Knopfdruck in einen großen EC2-Server exportieren**.

**Zusammenfassung:** **EC2** = Motor + Auto selbst bauen (volle Kontrolle, komplex). **Beanstalk** = du gibst Code, AWS baut das Auto. **Lightsail** = fertiger Kleinwagen zum Festpreis.

🛑 **Pro-Tipp CLF/SAA:** Signalwort „**vorhersehbare, feste monatliche Kosten** für eine einfache App / WordPress / kleiner VPS für Einsteiger" → **Lightsail**. Sobald „Auto Scaling, feingranulare VPC-Kontrolle, Enterprise-Skalierung" fällt → **EC2**.

---

## Hybrid & Edge — Local Zones, Wavelength & Outposts

**Architektonische Einordnung**

Diese drei bringen AWS **geografisch näher an dich**, wenn die normale Region zu weit weg ist (Latenz) oder Daten vor Ort bleiben müssen (Compliance). Wichtige Abgrenzung: Das sind **Infrastruktur-Standorte** (wo AWS läuft) — im Gegensatz zu **Greengrass**, das Software-Edge auf *deinem eigenen* Gerät ist.

**Metapher / Konzept**

> Drei Wege, wie AWS näher zu dir kommt — wenn die normale Region zu weit weg ist.

**Grundlage:** Eine **Region** (z. B. Frankfurt) ist ein geografisches Gebiet mit mehreren **Availability Zones (AZs)** (getrennte Rechenzentren). Aber manchmal ist selbst die nächste Region zu weit weg (Latenz) oder Daten müssen vor Ort bleiben. Dafür drei Lösungen:

- **AWS Local Zones:** Kleine AWS-Ableger näher an großen Städten/Ballungszentren, die weit von der Hauptregion entfernt sind. Bringen ausgewählte Dienste (Compute, Storage) geografisch näher an die Nutzer → **niedrigere Latenz**. Für latenzkritische Anwendungen in einer bestimmten Stadt (Echtzeit-Gaming, Medienproduktion). *Bild: ein Mini-AWS-Außenposten in deiner Stadt.*
- **AWS Wavelength:** AWS-Infrastruktur direkt in den **5G-Netzen** der Mobilfunkanbieter. Daten mobiler Geräte machen nicht den Umweg ins Internet/zur Region, sondern werden am Rand des 5G-Netzes verarbeitet → **ultraniedrige Latenz** für mobile/5G-Anwendungen (AR/VR am Handy, vernetzte Autos, mobile Echtzeit-Spiele). **Stichwort: 5G + Edge.**
- **AWS Outposts:** AWS liefert echte **AWS-Hardware-Racks in dein eigenes Rechenzentrum** (on-premises). Du betreibst dieselben AWS-Dienste (EC2, EBS, RDS...) lokal, verwaltet wie in der Cloud. Für Daten, die aus rechtlichen Gründen im Haus bleiben müssen, oder sehr niedrige Latenz zu lokalen Systemen (Fabrik, Krankenhaus) — mit dem Wunsch nach AWS-Erfahrung. *Bild: ein Stück echtes AWS-Rechenzentrum bei dir im Keller.*

**Outposts im Detail (deine eigene Karte dazu):** Es gibt Unternehmen, die *nicht* alles in die Cloud legen können — **Krankenhäuser/Behörden** (sensible Daten dürfen das Gebäude nicht verlassen) oder **Fabriken mit Robotern** (der Weg der Daten nach Frankfurt und zurück ist für Millisekunden-Entscheidungen zu langsam). Bestellst du **Outposts**, lädt Amazon buchstäblich einen physischen Server-Schrank auf einen LKW, stellt ihn in deinen lokalen Serverraum, schließt ihn an und wartet ihn. Du steuerst ihn über **dieselbe AWS-Konsole** im Browser und startest ganz normal EC2-Instanzen oder S3-Buckets — es fühlt sich an wie Cloud, obwohl die Hardware zwei Türen weiter steht. Das nennt man eine **Hybrid-Cloud** (Mischung aus lokalem Rechenzentrum und öffentlicher Cloud).

**⚠️ Prüfungs-Knackpunkte**
- Niedrige Latenz in einer bestimmten **Stadt/Region** (nah an Nutzern) → **Local Zones**.
- Ultraniedrige Latenz für **mobile/5G**-Geräte → **Wavelength** (Stichwort 5G).
- **AWS-Hardware im eigenen Rechenzentrum**, Daten bleiben on-premises → **Outposts**.
- **Merke:** Local Zones = nah an Stadt, Wavelength = im 5G-Netz, Outposts = bei dir im RZ.
- **Abgrenzung:** Infrastruktur-Standorte (Local Zones/Wavelength/Outposts) vs. **Greengrass** = Software-Edge auf deinem eigenen Gerät.

---

## AWS Launch Wizard

**Metapher / Konzept**

> Der geführte Installations-Assistent, der komplexe Enterprise-Software (SAP, SQL Server) korrekt dimensioniert auf AWS aufsetzt.

**Das Problem & Die Lösung**

Große Standard-Anwendungen wie **SAP** oder **Microsoft SQL Server** (z. B. Always-On-Cluster) auf AWS einzurichten ist komplex: Welche Instanztypen? Wie viel Speicher? Welche Netzwerk-/HA-Konfiguration? Von Hand richtig zu dimensionieren erfordert tiefes Wissen und ist fehleranfällig.

**Launch Wizard** führt dich geführt durch die Bereitstellung: Du gibst deine Anforderungen an (Größe, Leistung), der Wizard **empfiehlt die passenden Ressourcen** und richtet alles korrekt ein (im Hintergrund oft via **CloudFormation**). Vorteile: geführte, korrekte Dimensionierung; spart Zeit und vermeidet Fehler; erstellt Ressourcen nach **Best Practices**.

**⚠️ Prüfungs-Knackpunkte**
- Komplexe Enterprise-Software (**SAP/SQL Server**) geführt bereitstellen → **Launch Wizard**.
- **Abgrenzung:** Launch Wizard = geführte Einrichtung *bestimmter* Anwendungen; **CloudFormation** = generische IaC; **Elastic Beanstalk** = Web-Apps.
- Nischen-/SAA-Randthema — Stichwort „geführtes Setup für SAP/SQL Server" zuordnen.

---

*Ende Kapitel 2 — Compute, Container & Edge.*
