// src/db/seed/cards/clf-c02-concepts-architecture.ts

import type { NewFlashcard } from "../../schema";

export const clfC02ConceptsArchitectureCards: NewFlashcard[] = [
  // ── Cloud-Vorteile & Economics ── domain: Cloud Concepts

  // 1. Die 6 Vorteile der Cloud
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Die 6 Vorteile der Cloud (AWS) — welche?",
    back: "1. Fixe Kosten gegen variable tauschen (CapEx → OpEx). 2. Von massiven Skaleneffekten profitieren. 3. Kapazität nicht mehr raten müssen (elastisch skalieren). 4. Geschwindigkeit und Agilität erhöhen. 5. Kein Geld mehr für Rechenzentren-Betrieb ausgeben. 6. In Minuten global werden (go global in minutes).",
    difficulty: 2,
    sourceRef: "AWS Cloud Value Framework",
  },

  // 2. CapEx vs OpEx
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "CapEx vs OpEx in der Cloud?",
    back: "CapEx (Capital Expenditure): hohe Vorab-Investition in eigene Hardware/Rechenzentren, danach Abschreibung. OpEx (Operational Expenditure): laufende, variable Kosten je nach Nutzung — kein Vorab-Kauf. Cloud verschiebt CapEx → OpEx: du zahlst nur, was du nutzt, statt teure Infrastruktur im Voraus zu kaufen.",
    difficulty: 1,
    sourceRef: "AWS Cloud Economics",
  },

  // 3. Economies of Scale
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Economies of Scale (Skaleneffekte) in der Cloud?",
    back: "Weil AWS Infrastruktur für Millionen Kunden zusammen einkauft und betreibt, sind die Stückkosten viel niedriger als für ein einzelnes Unternehmen. Diese Ersparnis gibt AWS in Form niedrigerer Preise weiter (Preise sinken über die Zeit). Du profitierst von der Größe, ohne selbst groß sein zu müssen.",
    difficulty: 1,
    sourceRef: "AWS Cloud Economics",
  },

  // 4. Deployment-Modelle
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Cloud-Deployment-Modelle: Cloud, Hybrid, On-Premises?",
    back: "Cloud (Cloud-native): alles läuft in der Cloud. Hybrid: Mischung aus Cloud und eigenem Rechenzentrum (verbunden, z.B. via Direct Connect/VPN) — für Migration oder regulatorische Gründe. On-Premises (Private Cloud): eigene Infrastruktur vor Ort, ggf. mit Cloud-Technologien (z.B. AWS Outposts). Faustregel: Hybrid = Brücke zwischen On-Prem und Cloud.",
    difficulty: 2,
    sourceRef: "AWS Cloud Deployment Models",
  },

  // 5. IaaS vs PaaS vs SaaS
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "IaaS vs PaaS vs SaaS — Unterschied?",
    back: "IaaS (Infrastructure as a Service): du verwaltest OS, Apps; AWS liefert Rechenleistung/Storage/Netzwerk (z.B. EC2). PaaS (Platform as a Service): du verwaltest nur deinen Code, AWS kümmert sich um die Plattform (z.B. Elastic Beanstalk, RDS). SaaS (Software as a Service): fertige Software zum Nutzen, du verwaltest nichts (z.B. Gmail, Salesforce). Faustregel: je weiter zu SaaS, desto weniger verwaltest du selbst.",
    difficulty: 2,
    sourceRef: "AWS Cloud Computing Models",
  },

  // 6. Elastizität
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Elastizität (Elasticity) — was bedeutet das?",
    back: "Die Fähigkeit, Ressourcen automatisch hoch- UND runterzuskalieren, je nach aktueller Nachfrage. Bei Lastspitze kommen Ressourcen dazu, bei Flaute werden sie abgebaut (und du zahlst weniger). Verhindert Über- und Unterversorgung. Beispiel: Auto Scaling fügt EC2-Instanzen bei hohem Traffic hinzu und entfernt sie wieder.",
    difficulty: 2,
    sourceRef: "AWS Cloud Concepts",
  },

  // 7. Skalierbarkeit
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Vertikale vs horizontale Skalierung?",
    back: "Vertikal (scale up): eine Ressource größer machen (z.B. EC2-Instanz mit mehr CPU/RAM). Hat eine Obergrenze, erfordert oft Neustart. Horizontal (scale out): mehr Ressourcen hinzufügen (z.B. weitere EC2-Instanzen). Praktisch unbegrenzt, ideal für die Cloud. Faustregel: vertikal = größer, horizontal = mehr. Cloud bevorzugt horizontal.",
    difficulty: 2,
    sourceRef: "AWS Scalability Concepts",
  },

  // 8. Hochverfügbarkeit
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Hochverfügbarkeit (High Availability) — Prinzip?",
    back: "System bleibt auch bei Teilausfällen verfügbar, mit minimaler Downtime. Erreicht durch Redundanz: Ressourcen über mehrere Availability Zones verteilen, Load Balancer, automatischer Failover. Beispiel: RDS Multi-AZ schaltet bei AZ-Ausfall automatisch auf den Standby um. Faustregel: HA = möglichst immer erreichbar.",
    difficulty: 2,
    sourceRef: "AWS High Availability",
  },

  // 9. Fehlertoleranz
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Fehlertoleranz (Fault Tolerance) vs Hochverfügbarkeit?",
    back: "Fault Tolerance: System läuft OHNE Unterbrechung weiter, selbst wenn Komponenten ausfallen (kein spürbarer Ausfall, volle Redundanz). High Availability: System erholt sich schnell von Ausfällen (minimale, kurze Downtime erlaubt). Faustregel: Fault Tolerance = gar kein Ausfall, HA = sehr kurzer Ausfall. Fault Tolerance ist aufwändiger/teurer.",
    difficulty: 2,
    sourceRef: "AWS Reliability Concepts",
  },

  // 10. Agilität
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Agilität (Agility) als Cloud-Vorteil?",
    back: "Schnelles Bereitstellen von Ressourcen (Minuten statt Wochen/Monate wie bei eigener Hardware-Beschaffung). Ermöglicht schnelles Experimentieren, Fehlschläge sind billig (Ressourcen einfach wieder abschalten), schnellere Innovation und Time-to-Market. Faustregel: Agilität = schnell ausprobieren, ohne lange Vorlaufzeit oder hohe Kosten.",
    difficulty: 1,
    sourceRef: "AWS Cloud Benefits",
  },

  // ── Globale Infrastruktur ── domain: Cloud Technology and Services

  // 11. Regionen
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Region — was ist das?",
    back: "Ein geografisches Gebiet weltweit (z.B. eu-central-1 = Frankfurt), das mehrere isolierte Availability Zones enthält. Du wählst Regionen für Datennähe, Latenz, Compliance/Datenschutz und Preise. Regionen sind voneinander unabhängig — Daten bleiben standardmäßig in der gewählten Region (wichtig für DSGVO).",
    difficulty: 1,
    sourceRef: "AWS Global Infrastructure",
  },

  // 12. Availability Zones
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Availability Zone (AZ) — was ist das?",
    back: "Ein oder mehrere physische Rechenzentren innerhalb einer Region, voneinander isoliert (eigene Stromversorgung, Kühlung, Netzwerk), aber über schnelle Leitungen verbunden. Mehrere AZs pro Region (meist 3+). Workloads über mehrere AZs verteilen = Schutz gegen Ausfall eines einzelnen Rechenzentrums (Hochverfügbarkeit).",
    difficulty: 2,
    sourceRef: "AWS Global Infrastructure",
  },

  // 13. Edge Locations
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Edge Location — wofür?",
    back: "Standorte (viel zahlreicher als Regionen) nahe bei den Endnutzern, genutzt von CloudFront (CDN) und anderen Edge-Services, um Inhalte zu cachen und mit niedriger Latenz auszuliefern. Faustregel: Edge Location = näher am Nutzer als eine Region, für schnelle Content-Auslieferung.",
    difficulty: 2,
    sourceRef: "AWS Global Infrastructure",
  },

  // 14. Region-Auswahl
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Wie wählt man eine AWS-Region? (4 Faktoren)",
    back: "1. Compliance/Datenschutz (z.B. Daten müssen in der EU bleiben → Frankfurt/Irland). 2. Latenz/Nähe zu den Nutzern. 3. Verfügbarkeit der Services (nicht jeder Service ist in jeder Region). 4. Kosten (Preise variieren je Region). Diese vier Faktoren sind die Standard-Prüfungsantwort.",
    difficulty: 2,
    sourceRef: "AWS Region Selection",
  },

  // 15. Region vs AZ vs Edge
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Region vs Availability Zone vs Edge Location?",
    back: "Region: geografisches Gebiet mit mehreren AZs. AZ: isoliertes Rechenzentrum (oder mehrere) innerhalb einer Region. Edge Location: kleiner Standort nahe Nutzern für Content-Caching (CloudFront). Hierarchie: Region > enthält mehrere AZs; Edge Locations sind separat und zahlreicher, näher am Nutzer.",
    difficulty: 2,
    sourceRef: "AWS Global Infrastructure",
  },

  // ── Shared Responsibility ── domain: Security and Compliance

  // 16. Shared Responsibility Model
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Shared Responsibility Model — Grundidee?",
    back: "Sicherheit ist geteilte Verantwortung zwischen AWS und Kunde. AWS = Security OF the cloud (Hardware, Rechenzentren, Netzwerk-Infrastruktur, Hypervisor). Kunde = Security IN the cloud (eigene Daten, IAM-Zugriff, OS-Patches auf EC2, Verschlüsselung, Firewall-Regeln). Faustregel: AWS schützt die Wolke, du schützt, was du reinlegst.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model",
  },

  // 17. AWS-Verantwortung vs Kunde
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Shared Responsibility — wofür ist AWS zuständig, wofür der Kunde?",
    back: "AWS (OF the cloud): physische Sicherheit der Rechenzentren, Hardware, Netzwerk-Infrastruktur, Virtualisierungs-Layer, managed Services-Infrastruktur. Kunde (IN the cloud): Daten, Verschlüsselung, IAM-Nutzer/Rechte, Gastbetriebssystem-Patches (bei EC2), Netzwerk-/Firewall-Konfiguration (Security Groups), Anwendungssicherheit.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model",
  },

  // 18. Shared Responsibility nach Service-Typ
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Verschiebt sich die Shared Responsibility je nach Service?",
    back: "Ja. Bei IaaS (EC2) trägt der Kunde mehr (OS-Patches, alles darüber). Bei managed Services (RDS, Lambda, S3) übernimmt AWS mehr (z.B. OS- und DB-Engine-Patching bei RDS). Bei SaaS-artigen Services trägt AWS am meisten. Konstant beim Kunden bleibt IMMER: eigene Daten, IAM-Zugriffsverwaltung, Client-seitige Verschlüsselung.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model",
  },

  // ── Well-Architected Framework ── domain: Cloud Concepts

  // 19. Well-Architected Framework
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "AWS Well-Architected Framework — was ist das, wie viele Säulen?",
    back: "Ein Leitfaden von AWS mit Best Practices für gut gebaute Cloud-Architekturen, organisiert in 6 Säulen: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability. Hilft, Architekturen zu bewerten und zu verbessern. Das kostenlose Well-Architected Tool prüft deine Workloads dagegen.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected Framework",
  },

  // 20. Säule Operational Excellence
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Well-Architected-Säule: Operational Excellence?",
    back: "Fokus: Betrieb effizient ausführen und kontinuierlich verbessern. Prinzipien: Operations als Code (Automatisierung), häufige kleine Änderungen, aus Fehlern lernen, Dokumentation aktuell halten. Faustregel: Operational Excellence = den Betrieb laufend optimieren und automatisieren.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },

  // 21. Säule Security
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Well-Architected-Säule: Security?",
    back: "Fokus: Daten, Systeme und Assets schützen. Prinzipien: starke Identitäts-Grundlage (Least Privilege), Nachvollziehbarkeit (Logging/Monitoring), Sicherheit auf allen Ebenen, Daten in Ruhe und Transit verschlüsseln, automatisieren. Faustregel: Security-Säule = Schutz durch Identität, Verschlüsselung, Monitoring.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },

  // 22. Säule Reliability
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Well-Architected-Säule: Reliability?",
    back: "Fokus: Workload erfüllt zuverlässig seine Funktion und erholt sich von Ausfällen. Prinzipien: automatische Wiederherstellung, Wiederherstellungsprozeduren testen, horizontal skalieren, Kapazität nicht raten. Faustregel: Reliability = Ausfälle überstehen und sich automatisch erholen.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },

  // 23. Säule Performance Efficiency
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Well-Architected-Säule: Performance Efficiency?",
    back: "Fokus: Rechenressourcen effizient nutzen und Effizienz bei wachsender Nachfrage/sich ändernder Technologie halten. Prinzipien: fortschrittliche Technologien leichter nutzen (managed Services), global in Minuten gehen, serverless einsetzen, häufig experimentieren. Faustregel: Performance Efficiency = die richtigen Ressourcen passend einsetzen.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },

  // 24. Säule Cost Optimization
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Well-Architected-Säule: Cost Optimization?",
    back: "Fokus: niedrigste Kosten für den Geschäftswert erzielen. Prinzipien: Verbrauchsmodell nutzen (nur zahlen, was gebraucht wird), Effizienz messen, Ausgaben analysieren/zuordnen, managed Services nutzen (weniger Betriebskosten). Faustregel: Cost Optimization = keine unnötigen Ausgaben, Kosten transparent machen.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },

  // 25. Säule Sustainability
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Well-Architected-Säule: Sustainability?",
    back: "Fokus (seit 2021 die 6. Säule): Umweltauswirkungen der Cloud-Nutzung minimieren. Prinzipien: Energieverbrauch reduzieren, Auslastung der Ressourcen maximieren (keine Verschwendung), effiziente Hardware/Regionen wählen, managed Services nutzen. Faustregel: Sustainability = ökologischen Fußabdruck der Workloads senken.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },

  // ── Weitere Konzepte ── domain: Cloud Concepts

  // 26. Cloud Adoption Framework
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "AWS Cloud Adoption Framework (CAF) — die 6 Perspektiven?",
    back: "Hilft Organisationen, ihre Cloud-Migration zu planen, über 6 Perspektiven: Business, People, Governance (geschäftlich/organisatorisch) und Platform, Security, Operations (technisch). Faustregel: CAF = Fahrplan für die Cloud-Einführung, betrachtet Mensch und Technik. Nicht mit dem Well-Architected Framework verwechseln (das bewertet Architekturen).",
    difficulty: 2,
    sourceRef: "AWS Cloud Adoption Framework",
  },

  // 27. Well-Architected Tool
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "AWS Well-Architected Tool — wofür?",
    back: "Kostenloses Tool in der AWS-Konsole, das deine Workloads anhand der Well-Architected-Säulen bewertet. Du beantwortest Fragen, das Tool zeigt Risiken und Verbesserungsvorschläge. Faustregel: das Tool = Selbsttest deiner Architektur gegen Best Practices.",
    difficulty: 1,
    sourceRef: "AWS Well-Architected Tool",
  },

  // 28. TCO
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Total Cost of Ownership (TCO) — was bedeutet das?",
    back: "Die GESAMTEN Kosten einer Lösung über ihre Lebensdauer — nicht nur der Kaufpreis, sondern auch Strom, Kühlung, Wartung, Personal, Ausfallzeiten, Platz. Beim Cloud-Vergleich wichtig: On-Premises hat viele versteckte Kosten (Rechenzentrum, Admins), die in der Cloud entfallen. Faustregel: TCO = wahre Gesamtkosten, nicht nur der Sticker-Preis.",
    difficulty: 2,
    sourceRef: "AWS Cloud Economics",
  },

  // 29. Loose Coupling
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "Loose Coupling (lose Kopplung) — Prinzip?",
    back: "Komponenten so entkoppeln, dass der Ausfall einer Komponente nicht alle anderen mitreißt. Erreicht z.B. durch Message Queues (SQS) oder Load Balancer zwischen den Teilen. Gegenteil: tight coupling (Komponenten hängen direkt voneinander ab → fragil). Faustregel: lose Kopplung = Komponenten unabhängig + ausfallsicher machen.",
    difficulty: 2,
    sourceRef: "AWS Architecture Best Practices",
  },

  // 30. Design for Failure
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    front: "\"Design for Failure\" — was meint das Prinzip?",
    back: "Annehmen, dass alles irgendwann ausfällt, und das System von Anfang an dafür bauen: Redundanz über mehrere AZs, automatischer Failover, keine einzelnen Schwachpunkte (Single Points of Failure). Statt Ausfälle zu verhindern, sie einplanen und automatisch abfedern. Faustregel: Baue so, dass ein Ausfall niemanden überrascht.",
    difficulty: 2,
    sourceRef: "AWS Architecture Best Practices",
  },
];
