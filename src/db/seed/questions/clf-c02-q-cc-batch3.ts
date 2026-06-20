// src/db/seed/questions/clf-c02-q-cc-batch3.ts
//
// Batch 3 — Cloud Concepts (24 Fragen).
// Verteilung im Batch-3-Gesamtplan: Cloud Concepts 24 / Security 30 /
// Cloud Tech 34 (17+17) / Billing 12 — analog zur echten CLF-C02-Gewichtung.
//
// Prüfungstreue EIGEN-Fragen (keine Original-/Brain-Dump-Fragen). Thematisch
// disjunkt zu den 43 bereits vorhandenen Cloud-Concepts-Fragen (Batch 1 + 2).
// Difficulty-Mix: 3× diff 1, 20× diff 2, 1× diff 3. Multiple-Response: 3 von 24.
//
// INTEGRATION (Code-Claude): in src/db/seed.ts in das `all`-Array mit
// aufnehmen (eigener Batch-3-Index analog zu questions/index.ts). Import-Pfad
// ggf. an finalen Ablageort anpassen.

import type { NewQuestion } from "../../schema";

export const clfC02QCloudConceptsB3: NewQuestion[] = [
  // ── 1.1 Benefits ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Amazon S3 speichert Objekte redundant über mehrere Einrichtungen hinweg und gibt eine Beständigkeit von 99,999999999 % (11 Neunen) an. Welche Cloud-Eigenschaft wird mit dieser Kennzahl beschrieben?",
    choices: [
      { id: "A", text: "Availability (Verfügbarkeit)" },
      { id: "B", text: "Durability (Beständigkeit)" },
      { id: "C", text: "Elasticity" },
      { id: "D", text: "Scalability" },
    ],
    correct: ["B"],
    explanation:
      "Durability beschreibt die Wahrscheinlichkeit, dass gespeicherte Daten NICHT verloren gehen — die 11 Neunen von S3 sind eine Durability-Angabe (Schutz vor Datenverlust durch redundante Speicherung über mehrere AZs). Availability beschreibt dagegen, wie oft Daten abrufbar sind (Uptime, z. B. 99,99 %). Elasticity = automatisches Skalieren nach Last; Scalability = Fähigkeit, mit der Last zu wachsen. Merksatz: Durability = nichts geht verloren, Availability = jederzeit erreichbar.",
    difficulty: 2,
    sourceRef: "Amazon S3 Durability / AWS Cloud Concepts",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Worin unterscheidet sich Skalierbarkeit (Scalability) von Elastizität (Elasticity)?",
    choices: [
      { id: "A", text: "Sie sind identische Begriffe für dasselbe Konzept." },
      {
        id: "B",
        text: "Scalability ist die Fähigkeit eines Systems, durch Hinzufügen von Ressourcen zu wachsen; Elasticity ist das automatische Hinzufügen UND Entfernen von Ressourcen passend zur aktuellen Nachfrage.",
      },
      { id: "C", text: "Scalability gilt nur für Speicher, Elasticity nur für Rechenleistung." },
      { id: "D", text: "Elasticity erfordert immer manuelles Eingreifen, Scalability läuft automatisch." },
    ],
    correct: ["B"],
    explanation:
      "Scalability ist die grundsätzliche Fähigkeit, durch mehr Ressourcen (horizontal oder vertikal) eine höhere Last zu bewältigen. Elasticity geht weiter: Ressourcen werden automatisch und bedarfsgerecht hinzugefügt, wenn die Last steigt, UND wieder entfernt, wenn sie sinkt — dadurch zahlt man nur für das, was gerade gebraucht wird. Ein System kann skalierbar sein, ohne elastisch zu sein (manuelles Hochskalieren). In AWS liefert z. B. EC2 Auto Scaling die Elastizität.",
    difficulty: 2,
    sourceRef: "AWS Cloud Concepts — Scalability vs Elasticity",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Eine relationale Datenbank auf einer einzelnen Amazon-RDS-Instanz stößt an ihre Grenzen, weil komplexe Abfragen mehr Arbeitsspeicher und CPU benötigen. Das Datenmodell lässt sich nicht einfach auf mehrere Knoten aufteilen. Welcher Skalierungsansatz ist hier am naheliegendsten?",
    choices: [
      { id: "A", text: "Horizontale Skalierung — viele kleine, identische Instanzen hinzufügen" },
      { id: "B", text: "Vertikale Skalierung — auf einen größeren Instanztyp mit mehr CPU und RAM wechseln" },
      { id: "C", text: "Die Datenbank durch einen S3-Bucket ersetzen" },
      { id: "D", text: "Edge Locations aktivieren, um die Datenbank zu beschleunigen" },
    ],
    correct: ["B"],
    explanation:
      "Vertikale Skalierung (scale up) bedeutet, einer einzelnen Ressource mehr Leistung zu geben (größerer Instanztyp). Das ist der typische Ansatz für klassische relationale Datenbanken, deren Schreib-Workload oder komplexe Joins sich nicht ohne Weiteres auf mehrere Knoten verteilen lassen. Horizontale Skalierung (scale out) passt besser zu zustandslosen Web-Servern oder NoSQL. S3 ist kein DB-Ersatz; Edge Locations dienen dem Content-Caching, nicht der Datenbank-Performance.",
    difficulty: 2,
    sourceRef: "AWS Cloud Concepts — Vertical vs Horizontal Scaling",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche Aussage beschreibt einen Sicherheits-VORTEIL der AWS Cloud gegenüber dem Betrieb eines eigenen Rechenzentrums?",
    choices: [
      { id: "A", text: "In der AWS Cloud ist der Kunde für keinerlei Sicherheit mehr verantwortlich." },
      {
        id: "B",
        text: "Kunden erben ein Rechenzentrums- und Netzwerk-Sicherheitsniveau, das AWS für sehr anspruchsvolle Organisationen aufgebaut hat, samt zahlreicher Compliance-Zertifizierungen.",
      },
      { id: "C", text: "AWS-Konten benötigen grundsätzlich keine Passwörter oder Zugriffskontrollen." },
      { id: "D", text: "Sicherheit in der Cloud ist grundsätzlich schlechter als On-Premises." },
    ],
    correct: ["B"],
    explanation:
      "Ein Kernvorteil der Cloud ist, dass AWS in physische Sicherheit, Netzwerk-Schutz und Compliance auf einem Niveau investiert, das einzelne Unternehmen kaum erreichen — und Kunden erben dieses Fundament (z. B. ISO 27001, SOC, PCI-DSS, abrufbar über AWS Artifact). Sicherheit bleibt aber geteilte Verantwortung (Shared Responsibility): der Kunde sichert weiterhin Daten, IAM und Konfiguration. A und C sind falsch (Kunde trägt weiter Verantwortung), D widerspricht dem Sicherheitsvorteil der Cloud.",
    difficulty: 1,
    sourceRef: "AWS Cloud Benefits — Security at Scale",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welcher der sechs Vorteile von Cloud Computing beschreibt, dass ein Unternehmen aufhören kann, Geld für Betrieb und Wartung eigener Rechenzentren auszugeben, und sich stattdessen auf sein Kerngeschäft konzentriert?",
    choices: [
      { id: "A", text: "Trade capital expense for variable expense" },
      { id: "B", text: "Stop spending money running and maintaining data centers" },
      { id: "C", text: "Go global in minutes" },
      { id: "D", text: "Massive economies of scale" },
    ],
    correct: ["B"],
    explanation:
      "'Stop spending money running and maintaining data centers' ist einer der sechs offiziellen Vorteile: Statt Personal und Budget für Racking, Stacking, Strom und Kühlung eigener Server zu binden (das sogenannte 'undifferentiated heavy lifting'), überlässt man das AWS und fokussiert auf Projekte, die das Geschäft differenzieren. 'Trade capital expense for variable expense' meint den Wechsel von Vorab-Investition zu nutzungsbasierter Abrechnung; 'Go global in minutes' das schnelle weltweite Deployment; 'economies of scale' die niedrigeren Stückkosten durch die Größe von AWS.",
    difficulty: 1,
    sourceRef: "AWS — Six Advantages of Cloud Computing",
  },

  // ── 1.2 Well-Architected / Design-Prinzipien ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche Säule des AWS Well-Architected Framework befasst sich damit, Rechenressourcen effizient einzusetzen, fortschrittliche Technologien leichter nutzbar zu machen und durch Experimente die optimale Ressourcenwahl zu finden?",
    choices: [
      { id: "A", text: "Reliability" },
      { id: "B", text: "Cost Optimization" },
      { id: "C", text: "Performance Efficiency" },
      { id: "D", text: "Operational Excellence" },
    ],
    correct: ["C"],
    explanation:
      "Performance Efficiency zielt darauf, Ressourcen passend und effizient für die Anforderungen einzusetzen und diese Effizienz bei sich änderndem Bedarf zu halten. Design-Prinzipien u. a.: fortschrittliche Technologien 'demokratisieren' (managed Services statt Eigenbau), in Minuten global gehen, serverlos nutzen, häufiger experimentieren. Reliability = Wiederherstellbarkeit/Ausfallsicherheit, Cost Optimization = unnötige Kosten vermeiden, Operational Excellence = Betrieb als Code und kontinuierliche Verbesserung.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected — Performance Efficiency Pillar",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Zu welcher Säule des Well-Architected Framework gehört das Design-Prinzip, eine starke Identitäts-Grundlage mit dem Prinzip der minimalen Rechte (Least Privilege) zu schaffen und Sicherheit auf allen Ebenen anzuwenden?",
    choices: [
      { id: "A", text: "Operational Excellence" },
      { id: "B", text: "Security" },
      { id: "C", text: "Reliability" },
      { id: "D", text: "Sustainability" },
    ],
    correct: ["B"],
    explanation:
      "Die Security-Säule umfasst Prinzipien wie: starke Identitäts-Grundlage und Least Privilege, Nachvollziehbarkeit aktivieren (Logging/Monitoring), Sicherheit auf allen Ebenen (Defense in Depth), Datenschutz in Transit und at Rest, Sicherheits-Best-Practices automatisieren und auf Sicherheitsvorfälle vorbereitet sein. Operational Excellence dreht sich um Betrieb, Reliability um Ausfallsicherheit, Sustainability um Umweltauswirkungen.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected — Security Pillar",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche ZWEI der folgenden sind Design-Prinzipien der Reliability-Säule des Well-Architected Framework? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Wiederherstellungs-Prozeduren automatisch testen" },
      { id: "B", text: "So viele Daten wie möglich öffentlich zugänglich machen" },
      { id: "C", text: "Sich automatisch von Ausfällen erholen (automatically recover from failure)" },
      { id: "D", text: "Den größtmöglichen Instanztyp wählen, um Performance zu garantieren" },
      { id: "E", text: "Manuelle Genehmigungen für jede Skalierung verlangen" },
    ],
    correct: ["A", "C"],
    explanation:
      "Reliability-Prinzipien sind u. a.: automatisch von Ausfällen erholen (z. B. via Health Checks und Auto Scaling), Wiederherstellung regelmäßig testen (nicht nur annehmen, dass Backups funktionieren), horizontal skalieren zur Erhöhung der Verfügbarkeit, Kapazität nicht raten und Änderungen automatisieren. B (öffentliche Daten) ist ein Sicherheitsrisiko; D (immer größte Instanz) widerspricht Cost Optimization/Rightsizing; E (manuelle Skalierung) widerspricht der Automatisierung.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected — Reliability Pillar",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt: "Was ist der Hauptzweck des AWS Well-Architected Framework?",
    choices: [
      { id: "A", text: "Es ist ein kostenpflichtiger Service, der Workloads automatisch in der Cloud bereitstellt." },
      {
        id: "B",
        text: "Es bietet bewährte Prinzipien und Leitfragen, anhand derer Architekturen auf Sicherheit, Zuverlässigkeit, Performance, Kosten, Betrieb und Nachhaltigkeit bewertet und verbessert werden können.",
      },
      { id: "C", text: "Es ist eine Programmiersprache zur Definition von Infrastruktur." },
      { id: "D", text: "Es garantiert, dass jede darauf basierende Architektur niemals ausfällt." },
    ],
    correct: ["B"],
    explanation:
      "Das Well-Architected Framework ist ein konzeptioneller Leitfaden (keine Software) aus sechs Säulen, Design-Prinzipien und Leitfragen, mit dem man Architektur-Entscheidungen bewerten und Risiken bzw. Verbesserungspotenziale erkennen kann. Die Bewertung selbst kann man kostenlos mit dem AWS Well-Architected Tool durchführen. Es ist weder ein Deployment-Service (A) noch eine Sprache (C), und es kann Ausfälle nicht 'garantiert' verhindern (D), sondern hilft, Risiken bewusst zu adressieren.",
    difficulty: 1,
    sourceRef: "AWS Well-Architected Framework — Overview",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche ZWEI der folgenden gehören zu den allgemeinen Design-Prinzipien für die Cloud nach dem Well-Architected Framework? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Kapazität raten und großzügig überdimensionieren" },
      { id: "B", text: "In Produktionsmaßstab testen (test systems at production scale)" },
      { id: "C", text: "Automatisierung nutzen, um Architektur-Experimente zu erleichtern" },
      { id: "D", text: "Architekturen nach einmaliger Festlegung nie wieder ändern" },
      { id: "E", text: "Alle Workloads dauerhaft in einer einzigen Availability Zone betreiben" },
    ],
    correct: ["B", "C"],
    explanation:
      "Allgemeine Cloud-Design-Prinzipien sind u. a.: aufhören, Kapazität zu raten (on-demand statt Schätzung), in Produktionsmaßstab testen (in der Cloud günstig durch temporäre Umgebungen), Automatisierung nutzen, um Experimente einfach und reversibel zu machen, evolutionäre Architekturen zulassen und datengetrieben weiterentwickeln. A widerspricht 'stop guessing capacity', D widerspricht evolutionären Architekturen, E ist ein Single Point of Failure.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected — General Design Principles",
  },

  // ── 1.3 Migration & Cloud Adoption Framework ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Das AWS Cloud Adoption Framework (CAF) beschreibt eine Cloud-Transformation in mehreren aufeinanderfolgenden Phasen. Welche Reihe nennt diese vier Phasen korrekt?",
    choices: [
      { id: "A", text: "Plan, Build, Test, Deploy" },
      { id: "B", text: "Envision, Align, Launch, Scale" },
      { id: "C", text: "Assess, Mobilize, Migrate, Operate" },
      { id: "D", text: "Strategy, Design, Develop, Maintain" },
    ],
    correct: ["B"],
    explanation:
      "Die vier CAF-Transformationsphasen sind Envision (Chancen und Geschäftsergebnisse identifizieren), Align (Lücken über die sechs Perspektiven hinweg erkennen, Stakeholder ausrichten), Launch (Pilotprojekte umsetzen, Wert demonstrieren) und Scale (Erfolgreiches ausweiten). Hinweis: 'Assess, Mobilize, Migrate & Modernize' (C) ist die AWS-Migrations-Methodik, nicht die CAF-Phasen — eine beliebte Verwechslung. A und D sind erfunden.",
    difficulty: 2,
    sourceRef: "AWS Cloud Adoption Framework — Transformation Phases",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt seit Jahren eine selbst gehostete CRM-Software auf eigenen Servern. Im Rahmen der Migration beschließt es, diese durch ein fertiges SaaS-CRM (Abo-Produkt) zu ersetzen, statt die Altsoftware zu migrieren. Welche der 7-Rs-Strategien beschreibt das?",
    choices: [
      { id: "A", text: "Rehost" },
      { id: "B", text: "Replatform" },
      { id: "C", text: "Repurchase" },
      { id: "D", text: "Retain" },
    ],
    correct: ["C"],
    explanation:
      "Repurchase ('drop and shop') bedeutet, eine bestehende Anwendung durch ein anderes, meist SaaS-basiertes Produkt zu ERSETZEN, statt sie zu migrieren — z. B. eigenes CRM → SaaS-CRM. Rehost = unverändert auf EC2 verschieben (Lift-and-Shift); Replatform = kleinere Cloud-Optimierungen ohne Architektur-Umbau (z. B. DB nach RDS); Retain = die Anwendung (vorerst) bewusst on-premises belassen.",
    difficulty: 2,
    sourceRef: "AWS Migration Strategies — 7 Rs",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Bei der Migrations-Analyse stellt ein Unternehmen fest, dass mehrere alte Anwendungen gar nicht mehr genutzt werden und abgeschaltet werden können. Welche der 7-Rs-Strategien trifft auf diese Anwendungen zu?",
    choices: [
      { id: "A", text: "Retain" },
      { id: "B", text: "Retire" },
      { id: "C", text: "Rehost" },
      { id: "D", text: "Refactor" },
    ],
    correct: ["B"],
    explanation:
      "Retire bedeutet, nicht mehr benötigte Anwendungen außer Betrieb zu nehmen (decommission) — das spart Kosten und reduziert die Migrations- und Sicherheitslast. Retain hieße, eine Anwendung bewusst (vorerst) NICHT zu migrieren und weiterzubetreiben; Rehost = unverändert verschieben; Refactor = cloud-native umbauen. In echten Portfolios ist 'Retire' oft überraschend wertvoll, weil ein erheblicher Teil der Altsysteme schlicht überflüssig ist.",
    difficulty: 2,
    sourceRef: "AWS Migration Strategies — 7 Rs",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Eine Anwendung steht kurz vor ihrer geplanten Ablösung und hat zudem eine komplexe Compliance-Bindung an das eigene Rechenzentrum. Das Unternehmen entscheidet, sie vorerst NICHT in die Cloud zu verschieben. Welche der 7-Rs-Strategien beschreibt diese Entscheidung?",
    choices: [
      { id: "A", text: "Retire" },
      { id: "B", text: "Relocate" },
      { id: "C", text: "Retain" },
      { id: "D", text: "Repurchase" },
    ],
    correct: ["C"],
    explanation:
      "Retain ('revisit') bedeutet, eine Anwendung bewusst (vorerst) am bisherigen Ort zu belassen — etwa weil sie bald abgelöst wird, eine Migration sich nicht lohnt oder regulatorische/technische Gründe dagegen sprechen. Sie wird später erneut bewertet. Retire = abschalten (wird nicht mehr gebraucht), Repurchase = durch SaaS ersetzen, Relocate = z. B. ganze Virtualisierungs-Umgebungen ohne Umbau verschieben.",
    difficulty: 2,
    sourceRef: "AWS Migration Strategies — 7 Rs",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Vor einer großen Migration möchte ein Unternehmen automatisch Bestandsdaten seiner On-Premises-Server (Konfiguration, Auslastung, Abhängigkeiten) sammeln, um die Migration zu planen, und den Fortschritt anschließend zentral verfolgen. Welche AWS-Dienste sind dafür vorgesehen?",
    choices: [
      { id: "A", text: "AWS Application Discovery Service zum Erfassen und AWS Migration Hub zum Verfolgen" },
      { id: "B", text: "Amazon CloudFront und AWS WAF" },
      { id: "C", text: "Amazon Polly und Amazon Rekognition" },
      { id: "D", text: "AWS Budgets und AWS Cost Explorer" },
    ],
    correct: ["A"],
    explanation:
      "AWS Application Discovery Service sammelt automatisch Informationen über On-Premises-Server (Spezifikationen, Performance, Abhängigkeiten) als Grundlage für die Migrationsplanung; AWS Migration Hub bietet einen zentralen Ort, um Migrationen über verschiedene Tools hinweg zu verfolgen. CloudFront/WAF sind Content-Delivery bzw. Web-Schutz, Polly/Rekognition sind KI-Dienste, Budgets/Cost Explorer sind Kosten-Tools — keiner davon dient der Migrationsplanung.",
    difficulty: 2,
    sourceRef: "AWS Migration Hub / Application Discovery Service",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche ZWEI Geschäfts-Vorteile nennt AWS typischerweise als Gründe für eine Cloud-Migration? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Höhere betriebliche Resilienz (operational resilience)" },
      { id: "B", text: "Garantiert null laufende Kosten für immer" },
      { id: "C", text: "Gesteigerte Geschäftsagilität (business agility) und schnellere Markteinführung" },
      { id: "D", text: "Vollständige Abschaffung jeglicher Sicherheitsverantwortung des Kunden" },
      { id: "E", text: "Eine fixe monatliche Pauschale unabhängig von der Nutzung" },
    ],
    correct: ["A", "C"],
    explanation:
      "AWS nennt als Migrations-Nutzen u. a. höhere betriebliche Resilienz (robustere, besser wiederherstellbare Systeme), gesteigerte Geschäftsagilität (schneller neue Ideen umsetzen), höhere Mitarbeiterproduktivität und Kostenreduktion. B ist falsch (Nutzung kostet), D ist falsch (Shared Responsibility bleibt), E widerspricht dem nutzungsbasierten Modell.",
    difficulty: 2,
    sourceRef: "AWS Cloud Adoption Framework — Business Outcomes",
  },

  // ── 1.4 Cloud Economics ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen vergleicht die Kosten des Eigenbetriebs eines Rechenzentrums mit AWS und will dabei nicht nur die Server-Hardware betrachten, sondern auch Strom, Kühlung, Stellfläche, Netzwerk und Administrations-Personal. Welches Konzept beschreibt diese ganzheitliche Kostenbetrachtung?",
    choices: [
      { id: "A", text: "Total Cost of Ownership (TCO)" },
      { id: "B", text: "Capital Expenditure (CapEx)" },
      { id: "C", text: "Service Level Agreement (SLA)" },
      { id: "D", text: "Return on Investment (ROI)" },
    ],
    correct: ["A"],
    explanation:
      "Total Cost of Ownership (TCO) erfasst ALLE direkten und indirekten Kosten einer Lösung — bei On-Premises also nicht nur die Server, sondern auch Strom, Kühlung, Rechenzentrumsfläche, Netzwerk, Wartung und Personal. Erst der TCO-Vergleich macht den wahren Kostenunterschied zur Cloud sichtbar. CapEx ist nur der Investitions-Anteil, ein SLA ist eine Verfügbarkeitszusage, ROI misst die Rentabilität einer Investition.",
    difficulty: 2,
    sourceRef: "AWS Cloud Economics — TCO",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Team betreibt seine Datenbank selbst auf EC2 und verbringt viel Zeit mit Patching, Backups und Failover-Konfiguration. Es wechselt zu Amazon RDS. Welcher wirtschaftliche Vorteil steht dabei im Vordergrund?",
    choices: [
      { id: "A", text: "RDS ist immer kostenlos." },
      {
        id: "B",
        text: "Durch die Verlagerung von Routine-Verwaltung ('undifferentiated heavy lifting') auf den Managed Service sinkt der operative Aufwand, sodass sich das Team auf wertschöpfende Aufgaben konzentrieren kann.",
      },
      { id: "C", text: "Managed Services schalten automatisch alle Sicherheitsverantwortung ab." },
      { id: "D", text: "RDS macht jede Anwendung automatisch schneller als jede andere Datenbank." },
    ],
    correct: ["B"],
    explanation:
      "Managed Services wie RDS übernehmen wiederkehrende, nicht-differenzierende Aufgaben (Patching, Backups, Multi-AZ-Failover, Monitoring). Dieses 'undifferentiated heavy lifting' bindet sonst teure Personalzeit. Der wirtschaftliche Vorteil liegt im reduzierten operativen Aufwand und schnellerem Fokus auf das Kerngeschäft — nicht in 'kostenlos' (A, falsch), nicht im Wegfall der Sicherheitsverantwortung (C, Shared Responsibility bleibt) und nicht in pauschal 'immer schneller' (D).",
    difficulty: 2,
    sourceRef: "AWS Cloud Economics — Managed Services / Operational Efficiency",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen vermutet, dass viele seiner EC2-Instanzen überdimensioniert sind und unnötig Kosten verursachen. Welcher AWS-Dienst liefert auf Basis tatsächlicher Auslastungsdaten Empfehlungen, auf welche Instanztypen man wechseln sollte (Rightsizing)?",
    choices: [
      { id: "A", text: "AWS Compute Optimizer" },
      { id: "B", text: "AWS Shield" },
      { id: "C", text: "Amazon Route 53" },
      { id: "D", text: "AWS Artifact" },
    ],
    correct: ["A"],
    explanation:
      "AWS Compute Optimizer analysiert mittels Machine Learning die reale Auslastung (CPU, RAM, Netzwerk) von u. a. EC2-Instanzen, Auto Scaling Groups, EBS-Volumes und Lambda-Funktionen und gibt konkrete Rightsizing-Empfehlungen — die Grundlage, um überdimensionierte Ressourcen kostengünstiger zu betreiben. Shield = DDoS-Schutz, Route 53 = DNS, Artifact = Compliance-Berichte.",
    difficulty: 2,
    sourceRef: "AWS Compute Optimizer / Cost Optimization",
  },

  // ── Globale Infrastruktur & Disaster Recovery ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Krankenhaus muss bestimmte Patientendaten aus regulatorischen Gründen lokal im eigenen Rechenzentrum verarbeiten, möchte aber dieselben AWS-Dienste, -APIs und -Werkzeuge wie in der Cloud nutzen. Welche AWS-Lösung passt am besten?",
    choices: [
      { id: "A", text: "AWS Outposts" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Local Zones" },
      { id: "D", text: "Eine zusätzliche Availability Zone" },
    ],
    correct: ["A"],
    explanation:
      "AWS Outposts ist vollständig verwaltete AWS-Infrastruktur (Racks/Server), die AWS-Dienste, -APIs und -Betriebsmodelle in das EIGENE Rechenzentrum oder einen Co-Location-Standort bringt — ideal, wenn Daten aus Compliance- oder Latenz-Gründen lokal verarbeitet werden müssen, aber ein konsistentes Cloud-Erlebnis gewünscht ist. CloudFront ist ein CDN; Local Zones bringen AWS näher an Ballungszentren (aber nicht ins eigene RZ); eine weitere AZ liegt weiterhin in der AWS-Region, nicht beim Kunden.",
    difficulty: 2,
    sourceRef: "AWS Outposts",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Spiele-Studio möchte für Spieler in einer großen Metropolregion, in der es KEINE vollständige AWS-Region gibt, einstellige Millisekunden-Latenz erreichen, indem es Compute und Storage näher an die Nutzer bringt. Welche AWS-Infrastruktur ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Local Zones" },
      { id: "B", text: "Amazon S3 Glacier" },
      { id: "C", text: "AWS Outposts im eigenen Rechenzentrum" },
      { id: "D", text: "Eine Edge Location für statisches Caching" },
    ],
    correct: ["A"],
    explanation:
      "AWS Local Zones platzieren AWS-Compute, -Storage und ausgewählte Dienste näher an große Bevölkerungs-, Industrie- und IT-Zentren, in denen (noch) keine eigene Region existiert — für latenzkritische Workloads wie Gaming, Live-Streaming oder Echtzeit-Analytik mit einstelliger ms-Latenz. Glacier ist Archiv-Storage; Outposts stünden im eigenen RZ (hier nicht gefordert); Edge Locations cachen nur Inhalte (CloudFront) und führen keine beliebigen Anwendungs-Workloads aus.",
    difficulty: 2,
    sourceRef: "AWS Local Zones",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche AWS-Infrastruktur bettet AWS-Compute und -Storage in die 5G-Netze von Telekommunikationsanbietern ein, um Anwendungen mit ultra-niedriger Latenz für mobile Endgeräte zu ermöglichen?",
    choices: [
      { id: "A", text: "AWS Wavelength" },
      { id: "B", text: "AWS Direct Connect" },
      { id: "C", text: "Amazon Route 53" },
      { id: "D", text: "AWS Snowball" },
    ],
    correct: ["A"],
    explanation:
      "AWS Wavelength bringt AWS-Dienste an den Rand der 5G-Netze von Telco-Partnern, sodass Datenverkehr das Mobilfunknetz nicht verlassen muss — ideal für ultra-niedrige Latenz bei z. B. AR/VR, autonomen Fahrzeugen oder industrieller Automatisierung. Direct Connect ist eine dedizierte Hybrid-Leitung, Route 53 ist DNS, Snowball ist physische Datenmigration.",
    difficulty: 2,
    sourceRef: "AWS Wavelength",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Im Rahmen der Notfallplanung legt ein Unternehmen fest, dass nach einem Ausfall maximal 15 Minuten an Daten verloren gehen dürfen. Welche Disaster-Recovery-Kennzahl beschreibt diese Vorgabe?",
    choices: [
      { id: "A", text: "Recovery Time Objective (RTO)" },
      { id: "B", text: "Recovery Point Objective (RPO)" },
      { id: "C", text: "Service Level Agreement (SLA)" },
      { id: "D", text: "Mean Time Between Failures (MTBF)" },
    ],
    correct: ["B"],
    explanation:
      "Das Recovery Point Objective (RPO) beschreibt den maximal tolerierbaren DATENVERLUST, gemessen in Zeit — hier 15 Minuten, was z. B. Backups oder Replikation mindestens alle 15 Minuten erfordert. Das Recovery Time Objective (RTO) beschreibt dagegen, wie LANGE die Wiederherstellung höchstens dauern darf. Merksatz: RPO = wie viel Daten darf ich verlieren, RTO = wie lange darf der Ausfall dauern.",
    difficulty: 2,
    sourceRef: "AWS Disaster Recovery — RTO/RPO",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Eine geschäftskritische Anwendung verlangt nahezu null Ausfallzeit und nahezu keinen Datenverlust bei einem Ausfall einer ganzen Region — höhere Kosten werden dafür akzeptiert. Welche Disaster-Recovery-Strategie passt am besten?",
    choices: [
      { id: "A", text: "Backup & Restore — Daten sichern und im Ernstfall neu aufbauen" },
      { id: "B", text: "Pilot Light — Kern-Komponenten minimal vorhalten und im Ernstfall hochfahren" },
      { id: "C", text: "Warm Standby — eine verkleinerte, aber laufende Kopie bereithalten" },
      { id: "D", text: "Multi-Site Active/Active — vollwertige Workloads gleichzeitig in mehreren Regionen betreiben" },
    ],
    correct: ["D"],
    explanation:
      "Die vier DR-Strategien bilden ein Spektrum von günstig/langsam zu teuer/schnell: Backup & Restore (höchste RTO/RPO, niedrigste Kosten) → Pilot Light → Warm Standby → Multi-Site Active/Active (niedrigste RTO/RPO, höchste Kosten). Für 'nahezu null Ausfallzeit und Datenverlust' bei höherem Budget ist Multi-Site Active/Active richtig: vollwertige Kopien laufen gleichzeitig in mehreren Regionen und übernehmen sofort. Backup & Restore wäre am langsamsten, Pilot Light und Warm Standby liegen dazwischen.",
    difficulty: 3,
    sourceRef: "AWS Disaster Recovery — Strategies",
  },
];
