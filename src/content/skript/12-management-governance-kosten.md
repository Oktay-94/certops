# Kapitel 12 — Management, Governance & Kosten

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne — drei Fragen, die alles ordnen:**
- **Observability („Wie geht es meiner Cloud?")** — CloudWatch (Performance), CloudTrail (Aktionen), Config (Konfiguration), Grafana/Prometheus (Visualisierung).
- **Governance („Wie halte ich Ordnung & Standards?")** — Systems Manager, Trusted Advisor, Compute Optimizer, Well-Architected Tool, Service Catalog, License Manager, Health Dashboard, Chatbot.
- **Kosten („Was zahle ich — und wie spare ich?")** — Cost Explorer, Budgets, Cost-Optimierung.

**Das absolute Herzstück-Trio der CLF-C02** (kommt fast garantiert): **CloudWatch = WIE läuft es** (Performance) · **CloudTrail = WER hat WAS getan** (Aktionen) · **Config = WIE ist/war es konfiguriert** (Zustand).

---

## Amazon CloudWatch

**Metapher / Konzept**

> Der Wachhund mit Fitness-Tracker für deine gesamte Cloud.

**Das Problem & Die Lösung**

Du hast 20 EC2-Server, Datenbanken, Lambdas und Load Balancer am Laufen. Aber: **Wie geht es denen gerade?** Ist ein Server bei 99 % CPU und kurz vorm Kollaps? Ohne Überwachung erfährst du von Problemen erst, wenn wütende Kunden anrufen — viel zu spät.

**CloudWatch** ist der zentrale **Monitoring-Dienst** und beantwortet: „Wie ist die **PERFORMANCE** meiner Ressourcen?". Vier Werkzeuge:
- **Metrics (Die Vitalwerte):** fast jeder Dienst sendet automatisch Messwerte (CPU, Netzwerk, Anfragen) — wie ein Fitness-Tracker.
- **Alarms (Das Bellen):** Schwellenwerte („CPU > 80 % für 5 Min → Alarm!"). Der Alarm kann eine **SNS**-Benachrichtigung schicken oder **automatisch handeln** (via Auto Scaling einen Server starten).
- **Logs (Das Tagebuch):** sammelt Anwendungsprotokolle zentral, durchsuchbar.
- **Dashboards (Das Cockpit):** alle Werte auf einen Blick.

**Praxis — der Klassiker mit Auto Scaling:** CloudWatch misst die CPU → Black Friday, Last steigt, Alarm feuert → Auto Scaling startet 10 Server. Nachts sinkt die Last → Server werden abgeschaltet. **CloudWatch ist das Nervensystem, das diese Automatik möglich macht.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Performance überwachen", „Metriken", „CPU-Auslastung", „Alarme", „Monitoring" → **CloudWatch**.
- **Merke: CloudWatch beantwortet „WIE läuft mein System?"** (Performance) — nicht „WER hat was gemacht?" (das ist CloudTrail).
- Standard-Metriken bei EC2 alle **5 Minuten kostenlos**; **Detailed Monitoring** (jede Minute) kostet extra.

---

## CloudWatch Details

**Metapher / Konzept**

> Der Wachhund mit vielen Sinnen — Metriken, Logs, Alarme und Agent.

**Die vier Bausteine im Detail (deine Karte, wortgetreu):**
- **Metrics:** Standard-Metriken alle 5 Min kostenlos; **Detailed Monitoring** (jede Minute) kostet extra. **Custom Metrics** kannst du selbst senden (z. B. RAM-Auslastung, die EC2 nicht von allein meldet).
- **Logs:** sammelt Protokolle zentral (Log Groups → Log Streams). Mit **CloudWatch Logs Insights** per Abfragesprache durchsuchen. Logs können via **Metric Filter** Alarme auslösen („zähle, wie oft ‚ERROR' im Log steht").
- **Alarms:** lösen bei Schwellenwerten aus. Drei Zustände: **OK, ALARM, INSUFFICIENT_DATA**. Kann SNS benachrichtigen, Auto Scaling auslösen oder eine EC2-Aktion (stoppen/neustarten). **Composite Alarms** kombinieren mehrere.
- **CloudWatch Agent:** Software auf EC2/On-Premises, um Daten zu sammeln, die AWS von außen **nicht** sieht — vor allem **RAM-Auslastung und Festplattenplatz**.

**⚠️ Prüfungs-Knackpunkte**
- **RAM/Disk-Auslastung einer EC2 überwachen → CloudWatch Agent** (RAM ist keine Standard-Metrik! — beliebte Falle).
- Jede Minute statt alle 5 → **Detailed Monitoring** (kostet extra).
- Bei Schwellenwert handeln (Auto Scaling/SNS) → **Alarm**.
- Logs durchsuchen → **Logs Insights**; Muster im Log zählen → **Metric Filter**.

---

## AWS CloudTrail

**Metapher / Konzept**

> Der Spurensucher, der jeden Handgriff im Konto protokolliert.

**Das Problem & Die Lösung**

Montagmorgen, die Produktionsdatenbank ist weg. Panik. War es ein Hacker? Ein Kollege, der sich verklickt hat? Ohne Protokoll stehst du vor einem Rätsel — und vor dem Wirtschaftsprüfer, der wissen will, wer in den letzten 12 Monaten auf die Finanzdaten zugegriffen hat, komplett blamiert.

**CloudTrail** protokolliert **jeden einzelnen API-Aufruf** in deinem Konto — und in AWS ist alles ein API-Aufruf (jeder Klick, jeder CLI-Befehl, jede Service-Aktion). Für jedes Ereignis: **Wer? Was? Wann? Von wo (IP)?** Das beantwortet: „**WER hat WAS, WANN und VON WO** gemacht?" — die perfekte Grundlage für **Auditing, Compliance und Forensik**. Logs lassen sich langfristig in **S3** archivieren.

**Praxis:** CloudTrail ist **standardmäßig aktiv (90 Tage Event-Historie)**. **GuardDuty** liest die CloudTrail-Logs, um verdächtiges Verhalten per ML zu erkennen. Und jede **KMS**-Schlüsselnutzung landet in CloudTrail. **CloudTrail ist die Datenquelle, auf der die halbe AWS-Sicherheitswelt aufbaut.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „WER hat was gemacht?", „API-Aufrufe protokollieren", „Audit", „Compliance", „Governance" → **CloudTrail**.
- **Die Killer-Abgrenzung: CloudWatch = Performance (WIE?), CloudTrail = Aktivitäten (WER hat WAS?).** Kommt zu 99 % dran.
- **Eselsbrücke:** Trail = Spur.

---

## CloudTrail Details

**Metapher / Konzept**

> Die lückenlose Spurensicherung für jeden API-Aufruf.

**Die Details (deine Karte, wortgetreu):**
- **Trail:** eine Konfiguration, die Ereignisse dauerhaft in **S3** (oder CloudWatch Logs) speichert — über die 90 Tage hinaus, für Langzeit-Audit. Kann **multi-region und organisationsweit** sein.
- **Event-Typen:** **Management Events** (Verwaltungsaktionen, z. B. EC2 starten — standardmäßig aufgezeichnet) und **Data Events** (Daten-Ebene, z. B. einzelne S3-Objekt-Zugriffe `GetObject`, Lambda-Aufrufe — sehr viele, daher optional und kostenpflichtig).
- **CloudTrail Insights:** erkennt automatisch **ungewöhnliche Aktivitätsmuster** (plötzlich viele Löschungen, viele fehlgeschlagene Aktionen) — Anomalien in den API-Aufrufen.
- **CloudTrail Lake:** ein verwalteter Datenspeicher, in dem du Ereignisse langfristig sammelst und **direkt per SQL** abfragst — ohne erst Logs aus S3 nach Athena zu schaufeln.

**⚠️ Prüfungs-Knackpunkte**
- Logs über 90 Tage hinaus → **Trail nach S3**. Ungewöhnliche API-Aktivität → **CloudTrail Insights**. Events per SQL langfristig abfragen → **CloudTrail Lake**. Einzelne S3-Objektzugriffe protokollieren → **Data Events** aktivieren.

---

## AWS Config

**Metapher / Konzept**

> Der penibelste Inventar-Prüfer mit fotografischem Gedächtnis.

**Das Problem & Die Lösung**

Deine Firma hat Sicherheitsregeln („Alle S3-Buckets müssen verschlüsselt sein", „Kein Security Group darf Port 22 für die ganze Welt öffnen"). Bei 200 Konten und tausenden Ressourcen: Wer prüft das? Und der Auditor fragt: „Wie sah die Konfiguration am 15. März aus, und wer hat sie wann geändert?"

**Config** macht zwei Dinge:
- **Die Inventarliste mit Verlauf:** erfasst kontinuierlich die Konfiguration aller Ressourcen und speichert **jede Änderung als Verlauf**. Du kannst zurückspulen: „Diese Security Group hatte Port 22 offen vom 3. bis 17. Mai — geändert von User X." Beantwortet: „**WIE ist/war meine Ressource konfiguriert**, und wie hat sie sich verändert?"
- **Die Regelprüfung (Config Rules):** Du hinterlegst Regeln, Config prüft permanent dagegen und markiert Verstöße als **„non-compliant"**. Dashboard: 197 grün, 3 rot. Mit Automatisierung sogar **Auto-Remediation**.

**Praxis:** Ein Entwickler öffnet „nur mal kurz zum Testen" eine Security Group für die ganze Welt und vergisst es. Config erkennt den Verstoß in Minuten, markiert non-compliant, benachrichtigt das Security-Team — oder macht die Änderung automatisch rückgängig.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Konfigurationsänderungen verfolgen", „Compliance prüfen", „Ressourcen-Inventar", „Audit der Konfigurationshistorie" → **Config**.
- Config ist **nicht kostenlos** und muss aktiv eingerichtet werden — anders als die CloudTrail-Grundfunktion.

> **🧠 Der ultimative Merkkasten: Das Management-Trio (DIE Verwechslungsfrage der CLF-C02 — wortgetreu):**
> - „Server ist langsam" → **CloudWatch** (Performance)
> - „Wer hat den Server gelöscht?" → **CloudTrail** (Aktion)
> - „War der Server jemals unverschlüsselt?" → **Config** (Konfiguration)

---

## Access Logs & Protokollierung

**Metapher / Konzept**

> Wer hat was wann angefasst — die verschiedenen Protokollierungsmöglichkeiten quer durch AWS.

**Die Logging-Quellen (deine Karte, wortgetreu — oft verwechselt!):**
- **CloudTrail:** API-Aufrufe / Verwaltungsaktionen (WER hat WAS getan). Audit/Compliance.
- **CloudWatch Logs:** Anwendungs-/System-Logs (Lambda, EC2-App-Logs) — zentral, durchsuchbar.
- **VPC Flow Logs (Karte 79):** Netzwerkverkehr (welche IP mit welcher, accepted/rejected) — Metadaten, kein Inhalt.
- **S3 Server Access Logging:** detaillierte Zugriffe auf S3-Buckets.
- **ELB Access Logs:** Zugriffe auf den Load Balancer (Anfragen, Antwortzeiten, Quell-IPs).
- **CloudFront Access Logs:** Zugriffe auf die CDN-Verteilung.
- **AWS Config (Karte 47):** Konfigurationsänderungen und -historie.

**Die Kern-Unterscheidung (DIE Prüfungsfrage):** WER hat eine AWS-Aktion ausgeführt? → **CloudTrail**. WIE ist die Performance / App-Logs? → **CloudWatch**. Welcher Netzwerkverkehr floss? → **VPC Flow Logs**. Wie war/ist die Konfiguration? → **Config**.

**⚠️ Prüfungs-Knackpunkte**
- S3-Zugriffe → Server Access Logging. Load-Balancer-Anfragen → ELB Access Logs. **Die meisten Logs lassen sich in S3 archivieren und mit Athena analysieren.**

---

## AWS Systems Manager (SSM)

**Metapher / Konzept**

> Die zentrale Werkzeugkiste für die Verwaltung deiner gesamten Server-Flotte.

**Das Problem & Die Lösung**

Du verwaltest 500 EC2-Server. Ein kritisches Sicherheits-Update kommt raus. Willst du dich 500-mal per SSH einloggen? Und SSH heißt: Port 22 öffnen (Angriffsfläche!) und SSH-Schlüssel verwalten (stehlbar). Dazu will der Chef wissen, welche Software-Versionen wo laufen.

Auf jedem Server läuft ein kleiner **SSM Agent**, und ab dann steuerst du die Flotte zentral. Die Werkzeuge:
- **Run Command:** einen Befehl gleichzeitig auf hunderten Servern ausführen — ohne Einloggen.
- **Patch Manager:** OS-Updates vollautomatisch nach Zeitplan auf die ganze Flotte. **Das Signal-Feature!**
- **Session Manager:** sichere Terminal-Sitzung zu jedem Server im Browser — **ganz ohne SSH, ohne offenen Port 22, ohne Schlüssel**. Jede Sitzung wird protokolliert (Audit!).
- **Parameter Store:** Konfigurationswerte und Passwörter — **kostenlos, aber ohne automatische Rotation** (vs. Secrets Manager).
- **Inventory:** sammelt automatisch, welche Software in welcher Version wo installiert ist.

**Praxis:** Systems Manager funktioniert **hybrid** — der Agent läuft auch auf **On-Premises**-Servern. Du verwaltest Cloud- und lokale Server über ein Dashboard.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Patching automatisieren", „Befehle auf vielen Instanzen", „Server-Flotte zentral verwalten", „ohne SSH zugreifen" → **Systems Manager**.
- **Session Manager statt SSH** = Best-Practice-Antwort für sicheren EC2-Zugriff ohne offene Ports.
- **Parameter Store vs. Secrets Manager:** kostenlos & ohne Rotation vs. kostenpflichtig & mit automatischer Rotation.
- Funktioniert auch **on-premises (Hybrid)** — beliebtes Detail.

---

## AWS Trusted Advisor

**Metapher / Konzept**

> Der kostenlose Unternehmensberater, der ungefragt dein Konto durchleuchtet.

**Das Problem & Die Lösung**

Dein Konto läuft — aber läuft es *gut*? Wahrscheinlich zahlst du für EC2-Server, die bei 2 % dümpeln. Vielleicht ist ein S3-Bucket öffentlich. Vielleicht hat der Root-User kein MFA. Vielleicht stehst du kurz vor einem Service-Limit. Niemand hat Zeit, das ständig manuell zu prüfen.

**Trusted Advisor** scannt dein Konto kontinuierlich gegen die AWS-Best-Practices — ein Dashboard mit grünen/gelben/roten Häkchen. Geprüft in **fünf Kategorien (auswendig können!):**
- **Cost Optimization:** „Diese EC2 ist kaum ausgelastet — verkleinere sie."
- **Performance:** „Dieses EBS-Volume bremst deine Instanz."
- **Security:** „Dein S3-Bucket ist öffentlich!", „MFA am Root fehlt!"
- **Fault Tolerance:** „Deine DB hat kein Multi-AZ."
- **Service Limits:** „Du nutzt schon 80 % deines EC2-Limits."

**Der Haken, den die Prüfung liebt:** Wie viele Checks du bekommst, hängt vom **Support-Plan** ab. Mit **Basic/Developer** nur die Kern-Checks (einige Security-Checks + Service Limits). Den **vollen Umfang** gibt es erst mit **Business- oder Enterprise-Support**.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Best-Practice-Empfehlungen", „Kosten senken", „Konto-Check" → **Trusted Advisor**.
- **Die 5 Kategorien auswendig** — Frage: „Welche ist KEINE Trusted-Advisor-Kategorie?"
- **Volle Checks nur mit Business/Enterprise Support** — klassische Prüfungsfrage.
- **Abgrenzung:** Trusted Advisor = Empfehlungen über alle Bereiche. Config = deine eigenen Regeln. Inspector = Schwachstellen in Instanzen.

---

## AWS Compute Optimizer

**Metapher / Konzept**

> Der Rightsizing-Berater, der per Machine Learning ausrechnet, welche Instanzgröße wirklich zu deiner Last passt — nicht zu groß, nicht zu klein.

**Das Problem & Die Lösung**

Beim Start wählt man die Instanzgröße meist „großzügig" — lieber eine Nummer größer. Ergebnis: überall überdimensionierte Server. Eine EC2 dümpelt bei 8 % CPU, ist aber für 64 GB RAM bezahlt. Über hunderte Instanzen = enorme Geldverschwendung. Andersherum bremst eine zu kleine Instanz die App aus. Welche Größe ist richtig? Von Hand für jede Ressource nicht machbar.

**Compute Optimizer** analysiert mit ML die **tatsächliche Auslastung** (aus **CloudWatch-Metriken**) und empfiehlt die optimale Konfiguration — **Rightsizing**:
- **EC2:** „Diese m5.xlarge ist überdimensioniert — wechsle auf m5.large und spare 40 %."
- **Auto-Scaling-Gruppen, EBS-Volumes, Lambda:** ebenfalls Empfehlungen.
- **Konkrete Vorschläge mit Zahlen:** erwartete Ersparnis + Performance-Auswirkung — datenbasiert.

**Die Abgrenzung zu Trusted Advisor:** **Trusted Advisor** = breiter Best-Practice-Check über fünf Bereiche. **Compute Optimizer** = tiefer, spezialisierter ML-Dienst **nur für Rightsizing** von Compute (EC2, ASG, EBS, Lambda). **Merksatz: Trusted Advisor gibt den groben Rundum-Check. Compute Optimizer berechnet präzise die richtige Instanzgröße.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Rightsizing", „optimale Instanzgröße", „EC2/Lambda/EBS richtig dimensionieren", „über-/unterdimensionierte Ressourcen" → **Compute Optimizer**.
- Basis sind **CloudWatch-Metriken** (echte Auslastung).

---

## AWS Well-Architected Tool

**Metapher / Konzept**

> Der Architektur-TÜV, der deine Cloud-Lösung gegen die offiziellen AWS-Best-Practices prüft.

**Das Problem & Die Lösung**

Deine Anwendung läuft — aber ist sie *gut architektiert*? Hält sie einem AZ-Ausfall stand? Ist sie gegen Angriffe abgesichert? Verschwendet sie Geld? Diese Fragen beantwortet niemand, bis beim ersten Ausfall die Mängel schmerzhaft sichtbar werden.

**Der entscheidende Unterschied (die Prüfung liebt ihn):**
- Das **Framework** ist die Sammlung von Best Practices selbst — organisiert in den **sechs Säulen**: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability.
- Das **Tool** ist das konkrete Werkzeug in der Konsole, das deine Architektur anhand des Frameworks bewertet.

Im Tool beantwortest du einen **geführten Fragenkatalog** → das Tool liefert **identifizierte Risiken** (High/Medium), **konkrete Verbesserungsvorschläge** und einen **Bericht mit Verlauf**.

**Praxis:** Vor dem Go-Live macht das Team ein **Well-Architected Review** → „Hohes Risiko bei Reliability — deine DB läuft nur in einer AZ" → Umbau auf Multi-AZ, bevor der erste Ausfall kommt.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Architektur bewerten", „gegen Best Practices prüfen", „Well-Architected Review", „die sechs Säulen" → **Well-Architected Tool**.
- **Framework vs. Tool:** Framework = die Best-Practice-Lehre (6 Säulen). Tool = das Werkzeug, das bewertet.
- **Die 6 Säulen auswendig** (beliebte Frage „Welche ist KEINE Säule?"): Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability.
- **Eselsbrücke:** „Ohne Sorgfalt Rennt Performance Coole Sachen" (Operational, Security, Reliability, Performance, Cost, Sustainability).

---

## AWS Service Catalog

**Metapher / Konzept**

> Der genehmigte Bestellkatalog der IT — Mitarbeiter wählen nur aus vorab freigegebenen Produkten, ohne selbst in der AWS-Konsole zu hantieren.

**Das Problem & Die Lösung**

In großen Firmen sollen Teams sich selbst Ressourcen erstellen können. Aber gibt man ihnen volle Konsolen-Rechte, entsteht **Wildwuchs**: falsch konfigurierte, unsichere, zu teure Ressourcen. Du willst **Self-Service ohne Kontrollverlust**.

**Service Catalog** ist ein verwalteter **Katalog genehmigter IT-Produkte**. Administratoren definieren die erlaubten Produkte als **CloudFormation-Templates** („Standard-Webserver", „freigegebene Datenbank") und legen sie in den Katalog. Mitarbeiter wählen daraus und starten per Klick — **ohne direkte AWS-Rechte oder Detailwissen**:
- **Self-Service mit Governance:** eigenständig, aber nur innerhalb erlaubter Vorlagen.
- **Standardisierung & Compliance:** alle Ressourcen nach denselben sicheren Mustern.
- **Versionierung & Zugriffssteuerung.**

**⚠️ Prüfungs-Knackpunkte**
- Genehmigte Produkte für Self-Service, ohne volle Rechte → **Service Catalog**.
- **Abgrenzung:** CloudFormation = du baust Infrastruktur als Code; Service Catalog = Admins **kuratieren** erlaubte CloudFormation-Produkte für Endnutzer.

---

## AWS License Manager

**Metapher / Konzept**

> Der Lizenz-Polizist, der dafür sorgt, dass du bei mitgebrachter Software (BYOL) keine Lizenzregeln verletzt.

**Das Problem & Die Lösung**

Viele Firmen bringen eigene Softwarelizenzen in die Cloud (**BYOL = Bring Your Own License**) — teure Oracle-, SQL-Server- oder SAP-Lizenzen, oft an **physische Kerne/Sockets** gebunden. Startet man zu viele Instanzen, verletzt man die Bedingungen → **teure Strafen bei Audits**.

**License Manager** verwaltet Lizenzen zentral und **erzwingt Regeln**: Du definierst Lizenzregeln („max. 16 Kerne für Oracle"), der Dienst überwacht und **verhindert** z. B. das Starten weiterer Instanzen bei erreichtem Limit:
- **Lizenz-Compliance:** verhindert Überschreitungen und Strafzahlungen.
- **Zentraler Überblick** über Konten/Regionen (mit Organizations).
- **Funktioniert mit Dedicated Hosts** (wo lizenzgebundene Workloads oft laufen).

**⚠️ Prüfungs-Knackpunkte**
- BYOL-Lizenzen verwalten / Compliance erzwingen → **License Manager**.
- SAA-relevant: oft zusammen mit **Dedicated Hosts** (an physische Hardware gebundene Lizenzen).

---

## AWS Health Dashboard

**Metapher / Konzept**

> Die Arztpraxis für dein AWS-Konto — zeigt den Gesundheitszustand der AWS-Dienste, allgemein und speziell für deine Ressourcen.

**Das Problem & Die Lösung**

Läuft AWS gerade normal, oder gibt es eine Störung? Und betrifft sie **dich** konkret? Ohne zentrale Info rätselst du, ob es an dir oder an AWS liegt.

**Die zwei Varianten (DIE Unterscheidung dieser Karte!):**
- **Service Health Dashboard** (jetzt „AWS Health Dashboard – Service health"): der **allgemeine, öffentliche** Status aller AWS-Dienste in allen Regionen — „läuft alles?". Für jeden zugänglich, **nicht kontospezifisch**.
- **Personal Health Dashboard** (jetzt „AWS Health Dashboard – Your account health"): Ereignisse, die **speziell deine** Ressourcen/dein Konto betreffen — personalisiert. Z. B. „eine deiner EC2 läuft auf Hardware, die gewartet werden muss". Gezielte, proaktive Benachrichtigungen.

**⚠️ Prüfungs-Knackpunkte**
- Allgemeiner AWS-weiter Dienststatus → **Service Health** (öffentlich, generisch).
- Ereignisse, die DEINE Ressourcen betreffen → **Personal Health Dashboard** (personalisiert).
- **Merksatz: Service Health = AWS allgemein; Personal Health = dein Konto persönlich.**

---

## AWS Chatbot

**Metapher / Konzept**

> Der Bote, der AWS-Alarme und -Infos direkt in deine Slack- oder Microsoft-Teams-Kanäle bringt — und sogar Befehle von dort erlaubt.

**Das Problem & Die Lösung**

AWS-Benachrichtigungen (CloudWatch-Alarme, Sicherheitsmeldungen) landen per E-Mail oder im SNS — aber Teams arbeiten heute in **Slack oder Microsoft Teams**. Wichtige Alarme gehen unter, und für jede Reaktion muss man erst in die Konsole wechseln. Das verlangsamt die **Incident Response**.

**AWS Chatbot** bringt AWS-Benachrichtigungen **direkt in Slack und Microsoft Teams**. Du verbindest **SNS-Topics** mit einem Chat-Kanal, Alarme erscheinen sofort dort, wo das Team ohnehin ist. Zusätzlich kann man bestimmte **AWS-Befehle direkt aus dem Chat** ausführen:
- **Schnellere Incident Response:** Alarme im Team-Chat in Echtzeit.
- **ChatOps:** ausgewählte AWS-Aktionen aus Slack/Teams.
- **Einfache Einrichtung über SNS.**

**⚠️ Prüfungs-Knackpunkte**
- AWS-Alarme in Slack/Microsoft Teams + Befehle aus dem Chat → **AWS Chatbot**.
- Verbessert Incident Response (ChatOps); arbeitet mit **SNS + CloudWatch-Alarmen**.

---

## Amazon Managed Grafana

**Metapher / Konzept**

> Das fertige Grafana-Dashboard aus der Cloud — die beliebte Visualisierungsplattform, verwaltet und ohne eigenen Betrieb.

**Das Problem & Die Lösung**

**Grafana** ist ein sehr verbreitetes Open-Source-Tool zum Visualisieren von Metriken in schönen, interaktiven Dashboards — oft über viele Datenquellen hinweg. Es selbst zu betreiben (installieren, skalieren, absichern, updaten) ist Aufwand.

**Managed Grafana** ist Grafana als **vollständig verwalteter Dienst**: die vertraute Oberfläche, aber AWS betreibt sie. Stärke: verbindet sich mit **vielen Datenquellen gleichzeitig** — CloudWatch, Prometheus, OpenSearch, Drittquellen — und vereint sie in einheitlichen Dashboards:
- **Vertrautes Grafana, kein Betrieb** (verwaltet, skalierbar, AWS-SSO).
- **Viele Datenquellen vereint.**

**Die Abgrenzung — Managed Grafana vs. CloudWatch Dashboards:** **CloudWatch Dashboards** = einfache Dashboards innerhalb AWS (gut für reine AWS-Metriken). **Managed Grafana** = mächtigere, flexiblere Visualisierung über **viele/verschiedene** Datenquellen (auch außerhalb AWS). **Merksatz: CloudWatch Dashboards = einfache AWS-Metriken; Managed Grafana = umfangreiche Multi-Source-Visualisierung.**

**⚠️ Prüfungs-Knackpunkte**
- Grafana-Dashboards verwaltet, viele Datenquellen vereinen → **Managed Grafana**.

---

## Amazon Managed Service for Prometheus

**Metapher / Konzept**

> Die verwaltete Metrik-Sammelstelle für Container — die populäre Open-Source-Monitoring-Engine, ohne sie selbst zu betreiben.

**Das Problem & Die Lösung**

**Prometheus** ist der De-facto-Standard zum Sammeln von Metriken in **Container-/Kubernetes**-Umgebungen — extrem verbreitet. Aber Prometheus selbst zu betreiben und vor allem **skalierbar und langfristig zu speichern** (bei riesigen Metrikmengen) ist aufwendig.

**Managed Service for Prometheus** ist Prometheus als verwalteter Dienst — kompatibel mit der Abfragesprache **PromQL** und dem Prometheus-Ökosystem, aber AWS übernimmt Betrieb, Skalierung und langfristige Speicherung. Besonders für **EKS/ECS-/Kubernetes**-Workloads:
- **Prometheus-kompatibel (PromQL):** bestehende Setups/Tools funktionieren.
- **Skaliert & verwaltet:** riesige Metrikmengen aus Containern, hochverfügbar.
- **Perfekter Partner:** liefert die Metriken, die man oft in **Managed Grafana** visualisiert.

**Das Zusammenspiel (gern gefragt):** Managed Prometheus **sammelt/speichert** die Container-Metriken → Managed Grafana **visualisiert** sie. Zusammen ein verwalteter Open-Source-Monitoring-Stack für Container.

**⚠️ Prüfungs-Knackpunkte**
- Prometheus-Metriken (Container/Kubernetes) verwaltet sammeln, PromQL → **Managed Service for Prometheus**.
- Häufiges Duo: **Prometheus (sammeln) + Grafana (visualisieren)**.
- **Abgrenzung:** CloudWatch = AWS-natives Monitoring; Managed Prometheus = für die Prometheus-/Kubernetes-Welt (Open-Source-kompatibel).

---

## AWS Cost Explorer

**Metapher / Konzept**

> Das Mikroskop, mit dem du deine vergangenen und aktuellen AWS-Kosten in alle Richtungen aufschlüsselst und verstehst.

**Das Problem & Die Lösung**

Ende des Monats: AWS-Rechnung 47.000 €. Schluck. Aber wofür genau? Welcher Dienst? Welches Team? Gestiegen seit letztem Monat, warum? Ohne Werkzeug starrst du auf eine undurchsichtige Zahl.

**Cost Explorer** ist das **Analyse- und Visualisierungswerkzeug** für deine Kosten — vergangene und aktuelle Ausgaben als Diagramme, beliebig hineinzoombar:
- **Aufschlüsseln nach allem:** nach Dienst, Region, Zeitraum, oder **Tags** (pro Projekt/Team/Kostenstelle).
- **Trends erkennen:** „Die EC2-Kosten steigen seit März."
- **Prognose:** schätzt, wohin die Kosten laufen.
- **Spar-Empfehlungen:** Hinweise auf Einsparungen durch Reserved Instances / Savings Plans.

**Wichtig: Cost Explorer ist rückblickend und analysierend** — es zeigt und versteht, was war/ist. Es **handelt nicht von selbst und stoppt nichts**.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Kosten analysieren/visualisieren", „vergangene Ausgaben verstehen", „nach Dienst/Region/Tag aufschlüsseln", „Kostentrends/Prognose" → **Cost Explorer**.
- **Cost Explorer = analysieren & verstehen (rückblickend).** Die Abgrenzung zu Budgets (vorausschauend).

---

## AWS Budgets

**Metapher / Konzept**

> Der Kostenwächter mit Alarmanlage, der dir Bescheid gibt, bevor die Rechnung aus dem Ruder läuft.

**Das Problem & Die Lösung**

Cost Explorer zeigt, was **war** — aber ein Entwickler startet aus Versehen eine teure Instanz und vergisst sie. Mit Cost Explorer merkst du das erst beim Nachschauen, vielleicht Ende des Monats, wenn das Geld weg ist. Du willst **rechtzeitig gewarnt** werden, während es passiert.

Mit **Budgets** legst du ein **Kostenlimit** fest und wirst automatisch alarmiert — **vorausschauend und überwachend**:
- **Budget setzen:** „Monatslimit für EC2: 5.000 €" oder „Gesamtrechnung max. 50.000 €".
- **Alarme (Frühwarnung):** Schwellen („benachrichtige bei 80 %" und bei 100 %) — per E-Mail oder **SNS**, **während** der Monat läuft.
- **Auf Prognose-Basis:** warnt sogar, wenn die Hochrechnung zeigt, dass du das Limit voraussichtlich sprengst.
- **Budget-Typen:** für Kosten, Nutzungsmengen, oder RI/Savings-Plan-Auslastung.

**Die Killer-Frage Cost Explorer vs. Budgets:** **Cost Explorer** = analysieren & verstehen (rückblickend, du schaust aktiv rein). **Budgets** = Limit setzen & alarmiert werden (vorausschauend, meldet sich selbst). **Merksatz: Cost Explorer ist das Mikroskop (du untersuchst die Vergangenheit). Budgets ist der Rauchmelder (er piept, bevor das Haus abbrennt).**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Kostenlimit / Budget festlegen", „Alarm bei Kostenüberschreitung", „gewarnt werden, bevor Kosten zu hoch" → **Budgets**.
- Budgets verschickt Alarme oft via **SNS**.

> **🧠 Mini-Merkkasten dieses Blocks (wortgetreu):** **IaC:** CloudFormation (YAML/JSON) ↔ CDK (Programmiersprache, kompiliert zu CloudFormation) ↔ Beanstalk (nur App-Code, AWS baut). **Überwachung:** CloudWatch (Metriken/Performance) ↔ X-Ray (eine Anfrage quer durch Microservices) ↔ CloudTrail (wer hat was getan). **Kosten:** Cost Explorer (analysieren, rückblickend) ↔ Budgets (Limit + Alarm, vorausschauend).

---

## Cost-Optimierung Details

**Metapher / Konzept**

> Sparen mit System — die Werkzeuge und Strategien, mit denen du gezielt AWS-Kosten senkst und überwachst.

**Die Bausteine (deine Karte, wortgetreu):**
- **Savings Plans:** Verpflichtung zu einem Stundenbetrag (1/3 Jahre) → Rabatt. **Compute Savings Plans** (flexibel: EC2, Fargate, Lambda) vs. **EC2 Instance Savings Plans** (mehr Rabatt, an Instanzfamilie gebunden).
- **Reserved vs. Spot:** Reserved = stabile Dauerlast, bis 72 % Rabatt, Bindung. Spot = unterbrechbare Workloads, bis 90 % Rabatt, jederzeit kündbar durch AWS. **Faustregel: vorhersehbar → Reserved/Savings Plans; unterbrechbar → Spot; unvorhersehbar/kurz → On-Demand.**
- **Cost Allocation Tags:** Ressourcen mit Tags versehen (Projekt=X, Abteilung=Marketing) → in Cost Explorer nach Tags aufschlüsseln („Was kostet Projekt X?"). AWS-generierte und selbst definierte Tags. Grundlage für Kostenzuordnung pro Team/Projekt.
- **Cost Anomaly Detection:** nutzt **ML**, um ungewöhnliche Kostenausschläge automatisch zu erkennen und zu alarmieren („Deine S3-Kosten sind heute 300 % höher als üblich"). Erkennt unerwartete Kostenexplosionen, **bevor die Monatsrechnung kommt** (ergänzt Budgets, das auf feste Limits warnt).

**⚠️ Prüfungs-Knackpunkte**
- Kosten pro Projekt/Abteilung aufschlüsseln → **Cost Allocation Tags** (+ Cost Explorer).
- Ungewöhnliche Kostenausschläge automatisch erkennen (ML) → **Cost Anomaly Detection**.
- Festes Limit + Alarm → **Budgets**; analysieren/verstehen → **Cost Explorer**.
- Flexibel sparen über EC2/Fargate/Lambda → **Compute Savings Plans**.

---

> *🧠 Der „Große Mini-Merkkasten (157–172)" am Ende deines Originals war eine eingebettete Tabelle und als Text nicht extrahierbar — die Inhalte aller Karten dieses Blocks sind oben vollständig erhalten.*

---

*Ende Kapitel 12 — Management, Governance & Kosten.*
