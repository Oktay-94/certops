---
cardNumber: 46
slug: inspector-ecr-enhanced-scanning-weissdorn-finanz-cve-nach-dem-push
title: "Amazon Inspector · ECR Enhanced Scanning — der Scan, der nach dem Push weitergeht"
services:
  - Amazon Inspector
  - Amazon ECR
  - Amazon EventBridge
  - AWS Security Hub CSPM
  - Amazon ECS Fargate
  - AWS Systems Manager
domains:
  - D1
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/inspector/latest/user/scanning_resources_configure_duration_setting_ecr.html"
  - "https://docs.aws.amazon.com/inspector/latest/user/scanning-ecr.html"
  - "https://docs.aws.amazon.com/inspector/latest/user/scanning-resources.html"
  - "https://docs.aws.amazon.com/inspector/latest/user/scanning-ec2.html"
  - "https://docs.aws.amazon.com/inspector/latest/user/getting_started.html"
  - "https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning-enhanced.html"
  - "https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning-filters.html"
  - "https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning-enhanced-duration.html"
  - "https://docs.aws.amazon.com/inspector/v1/userguide/inspector-migration.html"
  - "https://aws.amazon.com/inspector/faqs/"
  - "https://aws.amazon.com/about-aws/whats-new/2023/11/amazon-inspector-image-security-developer-tools"
  - "https://aws.amazon.com/about-aws/whats-new/2024/04/amazon-inspector-agentless-vulnerability-assessments-ec2-ga"
---

## Die Grundidee zuerst

Weißdorn Finanz betreibt 40 Microservices als Container auf ECS Fargate. Ein Pentest findet eine kritische Schwachstelle in einer Base-Image-Schicht, die seit acht Monaten läuft. Das Image war beim Push geprüft worden — und war damals sauber.

**Weg eins:** Die Lebensmittelkontrolle kommt am Tag der Anlieferung in die Küche, prüft jede Kiste, klebt eine Plakette drauf und geht wieder. Die Plakette gilt für immer. Dass sechs Monate später ein Rückruf für genau diese Charge herauskommt, erfährt die Küche nicht — es kommt ja niemand mehr vorbei.

**Weg zwei:** Dieselbe Kontrolle beim Wareneingang, aber der Prüfer nimmt die Chargennummer mit. Wenn irgendwo ein Rückruf veröffentlicht wird, gleicht er ihn gegen alle Chargen ab, die er je erfasst hat, und ruft in der Küche an — auch acht Monate später, ohne dass dort jemand etwas getan hätte.

Der Unterschied ist nicht die Gründlichkeit der Prüfung. Beide Prüfer schauen gleich genau hin. Der Unterschied ist, ob nach der Prüfung noch etwas passiert.

**Ein Scan zum Push-Zeitpunkt kann eine Schwachstelle nicht finden, die es zum Push-Zeitpunkt noch nicht gab.** Das ist keine Qualitätsfrage, das ist Logik. Und es ist der ganze Grund, warum es auf dieser Karte zwei Scan-Arten gibt und eine davon rot durchgestrichen ist.

## Was es eigentlich ist — die Scanning-Konfiguration der Registry

Enhanced Scanning ist kein Schalter am Repository. Es ist ein Datensatz an der **privaten Registry**, und der sieht so aus:

```json
{
  "scanType": "ENHANCED",
  "rules": [
    {
      "scanFrequency": "CONTINUOUS_SCAN",
      "repositoryFilters": [ { "filter": "prod", "filterType": "WILDCARD" } ]
    },
    {
      "scanFrequency": "SCAN_ON_PUSH",
      "repositoryFilters": [ { "filter": "*", "filterType": "WILDCARD" } ]
    }
  ]
}
```

Drei Dinge stehen darin, und alle drei sind prüfungsrelevant.

`scanType` gilt für die **gesamte Registry einer Region**, nicht pro Repository. Beim Aktivieren konvertiert Inspector alle Repositories der privaten Registry von Basic auf Enhanced — das steht so im Inspector User Guide. Es gibt keinen Mischbetrieb.

`rules` sind maximal zwei, und beide zusammen entscheiden, welches Repository wie oft drankommt. Ein Repository, auf das **kein** Filter passt, wird gar nicht gescannt — es steht dann auf `Off`, nicht auf „manuell". Manuelle Scans gibt es bei Enhanced nicht.

Und wenn beide Filter dasselbe Repository treffen, gewinnt `CONTINUOUS_SCAN`. Im Beispiel oben heißt das: `prod-api` wird laufend gescannt, `dev-tools` nur beim Push.

## Der Weg durch die Karte

### Kasten — die CI/CD-Pipeline

Ganz links steht der Bauplatz, und er steht bewusst außerhalb der Teal-Kette: Die Pipeline ist kein AWS-Dienst, sie ist der Eintrittspunkt. Jenkins, TeamCity, GitHub Actions, CodePipeline — das Inspector-Plugin gibt es für alle vier, und wo es keins gibt, bauen die `inspector-sbomgen`-Kommandozeile und die `inspector-scan`-API eine eigene Integration.

Die graue Zeile darunter ist das, was am häufigsten falsch erinnert wird: **ohne Service-Aktivierung.** Die AWS-Ankündigung vom 30.11.2023 sagt es wörtlich — man installiert das Plugin und fügt einen Schritt hinzu, *ohne den Amazon-Inspector-Service aktivieren zu müssen*, vorausgesetzt es gibt einen aktiven AWS-Account. Die Pipeline darf on-premises stehen, in AWS, oder gemischt.

Das Bild dazu: Du brauchst keinen Vertrag mit dem Labor, um eine einzelne Probe einzuschicken. Du brauchst nur eine Kundennummer.

### Pfeil 1 — der Build bricht ab, bevor das Image die Registry sieht

Das Plugin fährt eine Container-Extraktion über das gebaute Image und erzeugt daraus eine SBOM im CycloneDX-Format — eine Stückliste aller Pakete. Die SBOM geht an Inspector, das Ergebnis kommt in nahezu Echtzeit zurück, und die Pipeline entscheidet: durchlassen oder abbrechen.

Wichtig für das Verständnis der ganzen Karte: **Hier verlässt kein Image den Bauplatz.** Was Inspector sieht, ist eine Liste von Paketnamen und Versionen, kein Layer. Deshalb funktioniert der Schritt auch außerhalb von AWS.

Ein Critical-Finding hier ist billig. Dasselbe Finding drei Monate später in Produktion kostet ein Deployment-Fenster.

### Kasten — Amazon ECR mit Enhanced Scanning

Das Image, das durchkommt, landet in einer privaten Registry mit aktivem Enhanced Scanning. Enhanced Scanning **ist** die Integration mit Inspector; es gibt keine zweite Scan-Engine dahinter.

Was dabei mehr gefunden wird als bei Basic, ist der Grund für den Aufwand: nicht nur Betriebssystempakete, sondern auch Sprachpakete — npm, pip, Maven, Go, Corretto und weitere Ökosysteme. Ein anfälliges `log4j` in einem Java-Layer ist kein OS-Paket. Basic sieht es nicht.

### Pfeil 2 — Push, und die Registry-Entscheidung

Der Push ist der unspektakulärste Pfeil der Karte und trägt trotzdem die schwerste Entscheidung: Sobald Enhanced eingeschaltet ist, ist es für alle Repositories dieser Region eingeschaltet. Wer es für ein einziges Team wollte, hat es für dreißig.

Das ist selten ein Problem, aber es ist ein Kostenposten, den niemand erwartet, weil Basic Scanning in ECR eingebaut und kostenlos ist. Enhanced rechnet pro gescanntem Image ab.

### Kasten — Amazon Inspector, und was „continuous" wirklich heißt

Hier liegt der Kern der Karte. Inspector bewertet bestehende Images **neu, sobald eine neue CVE veröffentlicht wird**. Ein Image, das letzte Woche sauber war, kann heute Findings tragen, ohne dass jemand etwas gepusht hat.

Zwei Grenzen stehen auf der Karte, und beide sind schärfer, als sie klingen.

Die erste: `nur Images mit Status ACTIVE`. Ein Image, das in ECR auf `ARCHIVED` steht, wird nicht gescannt.

Die zweite: **14 Tage.** Das ist der Default der Re-Scan-Dauer für neue Accounts, und er wird auf zwei Achsen gemessen — Push-Datum und *Last in use date*, also der letzte Einsatz auf einem ECS- oder EKS-Cluster. Läuft eine Frist ab, geht das Image auf `inactive` mit Grund `expired`, in ECR sichtbar als `SCAN_ELIGIBILITY_EXPIRED`, und alle zugehörigen Findings werden zum Schließen vorgemerkt. Wählbar sind 3, 7, 14, 30, 60, 90 und 180 Tage; `Lifetime` gibt es nur für das Push-Datum, nicht für den Nutzungs- oder Pull-Modus.

Genau hier hätte das Szenario beinahe verloren — siehe „Die ehrliche Feinheit".

### Pfeil 3 — Findings verlassen Inspector

Inspector schickt Ereignisse an EventBridge, wenn ein Erstscan fertig ist und wenn ein Finding erzeugt, geändert oder geschlossen wird. ECR selbst emittiert zusätzlich ein Ereignis, wenn sich die Scan-Frequenz eines Repositories ändert.

Von dort läuft es weiter nach Security Hub CSPM zur Aggregation über Accounts und Dienste hinweg und parallel ins Ticketsystem. Security Hub CSPM scannt nichts selbst — es ist der Sammelpunkt, den Karte 45 vollständig erklärt. Hier steht er nur als Zeile, weil er derselbe ist.

### Pfeil 4 — dieselbe Aktivierung deckt EC2 mit ab

Der gestrichelte Pfeil nach unten ist keine Datenleitung, sondern eine Aussage über den Umfang: Wer Inspector einschaltet, bekommt EC2-Scanning ohne zweiten Handgriff. Seit dem 22.04.2024 ist agentloses Scanning allgemein verfügbar, und neue Accounts landen automatisch im **Hybrid-Modus**.

Hybrid heißt: Wo der SSM Agent läuft, sammelt Inspector das Software-Inventar darüber, ereignisgetrieben — bei jeder Paketinstallation, bei jeder neuen CVE, nach jedem Update. Wo kein SSM Agent vorhanden ist, zieht Inspector stattdessen einen EBS-Snapshot und liest das Inventar daraus; diese Instanzen werden **alle 24 Stunden** gescannt.

Unabhängig von beidem laufen Network-Reachability-Scans **alle 12 Stunden**. Drei verschiedene Kadenzen für drei verschiedene Dinge, und Prüfungsfragen vermischen sie gern.

### Pfeil 5 — vom Finding zum laufenden Task

Seit dem 19.05.2025 ordnet Inspector ECR-Images den laufenden ECS-Tasks und EKS-Pods zu. Damit lässt sich die Frage beantworten, die bei 40 Microservices über die Dringlichkeit entscheidet: Liegt die verwundbare Schicht nur in der Registry, oder läuft sie gerade?

Für Multi-Architektur-Images wird die Nutzungsverfolgung ausdrücklich nicht unterstützt — dort empfiehlt AWS, die Frist am Push- oder Pull-Ereignis auszurichten.

### Die Randnotiz links — neue CVE trifft altes Image

Zwei Zeilen in Teal, ohne Pfeil, ohne Kasten. Sie stehen dort, weil sie der Auslöser der ganzen Kette sind und trotzdem nirgends als Kasten auftauchen können: Das Ereignis passiert **außerhalb** dieser Architektur.

Irgendwo veröffentlicht ein Projekt eine Sicherheitsmeldung, die in eine CVE-Datenbank wandert. Niemand bei Weißdorn Finanz tut dazu etwas. Kein Deployment, kein Commit, kein Konsolenklick. Der Zustand des Images hat sich nicht geändert — nur das Wissen der Welt über dieses Image.

Das Bild dazu: Nicht der Wein im Keller verdirbt, sondern das Gesundheitsamt veröffentlicht neue Grenzwerte. Der Kasten steht unverändert im Regal und ist trotzdem seit heute ein Problem.

Genau deshalb kann kein Scan zum Push-Zeitpunkt diese Klasse von Risiken abdecken, und genau deshalb ist das rote X auf der Karte kein Preisurteil.

### Der verworfene Weg — ECR Basic Scanning

Basic ist in ECR eingebaut und kostenlos. Es scannt beim Push, und es scannt auf Zuruf. Es scannt nie wieder von selbst.

Damit ist Basic nicht „die günstigere Variante desselben". Es löst die Anforderung strukturell nicht. Deshalb steht die Box in Rot und nicht in Gold: Sie scheitert nicht am Preis, sie scheitert am Auftrag.

## Die entscheidende Unterscheidung

| | Basic Scanning | Enhanced Scanning |
|---|---|---|
| Auslöser | Push oder manuell | Push **und** jede neue CVE |
| Abdeckung | OS-Pakete | OS- **und** Sprachpakete |
| Konfigurationsebene | Registry, Filter für Scan-on-Push | Registry, Filter für Push und Continuous |
| Manueller Scan | ja | nein |
| Kosten | in ECR enthalten | pro Image berechnet |
| Löst das Szenario | nein | ja, mit passender Frist |

## Die ehrliche Feinheit

**Beim Einschalten von Enhanced Scanning erkennt Inspector nur Images, die in den letzten 14 Tagen gepusht wurden.** Ältere stehen sofort auf `SCAN_ELIGIBILITY_EXPIRED`. So steht es im ECR User Guide und, mit denselben 14 Tagen, im Inspector User Guide unter „Scan behaviors".

Lies das gegen das Szenario: Das Image von Weißdorn Finanz ist acht Monate alt. Am Tag, an dem das Security-Team Enhanced Scanning einschaltet, ist es damit genau der Fall, den die Karte zu lösen verspricht — und wird trotzdem nicht bewertet.

Was es rettet, ist der Default-Modus **Last in use date**: Solange das Image auf einem Fargate-Cluster läuft, wird die Frist fortlaufend erneuert. Das Image bleibt in Überwachung, obwohl sein Push acht Monate zurückliegt. Der Mechanismus, der das Szenario trägt, ist also nicht die Scan-Dauer, sondern die Nutzungsverfolgung — dieselbe Technik wie beim Image-zu-Task-Mapping in Pfeil 5.

Wer sich darauf nicht verlassen will, hebt die Push-Datums-Frist auf `Lifetime` oder pusht die Altbestände einmal neu. Beides ist ein bewusster Schritt, den die Karte nicht zeigt.

**Und noch eine Ehrlichkeit: AWS ist sich beim Default nicht einig.** Der Inspector User Guide nennt 14 Tage, die globale Inspector-FAQ ebenfalls. Die ECR-Troubleshooting-Seite nennt 30 Tage, die China-FAQ auch. Die ECR-Seite „Changing the enhanced scanning duration" nennt `Lifetime (default), 180 days, 30 days` und kennt die anderen Optionen gar nicht. Maßgeblich ist der User Guide des Dienstes, dem die Einstellung gehört — das ist Inspector, und dort steht ein Hinweis, der die Divergenz erklärt: Alle vor dem 16.05.2025 konfigurierten Einstellungen bleiben unverändert bestehen. Die anderen Seiten beschreiben einen älteren Stand.

Der zweite Stolperstein ist der Name. **Amazon Inspector Classic ist seit dem 20.05.2026 abgeschaltet** — Konsole und Ressourcen sind nicht mehr erreichbar; neue Kunden wurden bereits ab dem 20.05.2025 nicht mehr angenommen. Wer Kursmaterial mit *Assessment Targets*, *Assessment Templates*, *Rules Packages* oder der Installation eines eigenen `awsagent` liest, liest über einen Dienst, den es nicht mehr gibt. Der heutige Inspector nutzt den SSM Agent und kennt keine manuellen Assessment Runs.

## Syntax lesen

Der Filter-Ausdruck in der Registry-Konfiguration sieht harmlos aus und verhält sich nicht so:

```text
filter: "prod"     ->  trifft prod, repo-prod, prod-repo, repo-prod-repo, prodrepo
filter: "prod*"    ->  trifft prod, prod-repo, prodrepo        nicht repo-prod
filter: "*prod"    ->  trifft prod, repo-prod                  nicht prod-repo
filter: "*prod*"   ->  trifft alle fuenf
```

Die erste Zeile ist die Falle. **Ein Filter ohne Wildcard ist kein exakter Name, sondern ein Enthaltensein-Test.** Wer `prod` schreibt und `prod-api` meint, hat auch `staging-prod-mirror` mitgefangen.

Und die Auflösung bei Überschneidung, aus dem ECR User Guide: Passen ein Scan-on-Push-Filter und ein Continuous-Filter auf dasselbe Repository, setzt ECR den Continuous-Filter durch. Die teurere Frequenz gewinnt, nicht die zuletzt definierte.

## Was du dadurch nicht baust

Keine Laufzeit-Erkennung. Inspector findet **bekannte Schwachstellen im Softwarebestand** — Pakete, Versionen, CVE-Nummern. Ob jemand die Lücke gerade ausnutzt, sieht GuardDuty, nicht Inspector.

Keinen Patch. Findings enthalten Empfehlungen, aber niemand aktualisiert das Base-Image für dich. Der Weg von der Erkenntnis zum neuen Image bleibt Arbeit für die Pipeline ganz links.

Keine Absicherung von Images, die außerhalb von ECR liegen. Ein Image in Docker Hub oder in einer selbstbetriebenen Registry ist für Enhanced Scanning unsichtbar; dafür bleibt nur der CI/CD-Weg.

Keine Mischkonfiguration. Ein Repository auf Basic und das Nachbarrepository auf Enhanced gibt es in derselben Registry und Region nicht.

## Wenn du dir eine Sache merkst

**Basic scannt beim Push. Enhanced scannt auch danach — aber nur so lange, wie die Re-Scan-Frist läuft.**

Steht in der Frage „newly disclosed", „already deployed" oder „without redeploying", ist Basic raus, egal wie günstig es ist.

Steht dort „shift security left" oder „block the build", ist es das CI/CD-Plugin, und dafür muss der Dienst nicht einmal aktiviert sein.

Steht dort „no agent to install", ist es entweder Container-Scanning, Lambda-Scanning oder agentloses EC2-Scanning — der alte Inspector-Agent existiert nicht mehr.

## Prüfungsknackpunkte

**Signalwörter für Enhanced Scanning:** *newly disclosed CVE*, *already deployed images*, *continuously scan*, *without redeploying*, *language package vulnerabilities*.

**Signalwörter für das CI/CD-Plugin:** *shift security left*, *fail the build*, *before the image is pushed*, *pipeline runs on-premises*.

**Warum ECR Basic Scanning hier verliert:** Es hat keinen Auslöser nach dem Push. Die Schwachstelle im Szenario wurde nach dem Push veröffentlicht — Basic hat schlicht keinen Anlass, noch einmal hinzusehen.

**Warum „Enhanced pro Repository aktivieren" verliert:** Die Umstellung Basic → Enhanced gilt registry-weit. Nur die *Frequenz* ist per Filter steuerbar, nicht der Scan-Typ.

**Warum „einen Agent installieren" verliert:** Für Container-Images, Lambda und Network Reachability ist kein Agent nötig. Für EC2-Paketscans wird der SSM Agent genutzt, und im Hybrid-Modus ist selbst der nicht zwingend. Einen eigenen Inspector-Agent gibt es nicht mehr.

**Warum „GuardDuty" verliert, wenn nach Schwachstellen gefragt wird:** Inspector findet die verwundbare Bibliothek, GuardDuty findet den, der sie ausnutzt. Beide liefern an Security Hub CSPM — die gemeinsame Zielbox ist die Ablenkung, nicht die Antwort.

**Die Frist-Falle:** Wenn eine Frage sagt, ein altes Image solle weiter überwacht werden, ist die Antwort nicht „Continuous Scanning aktivieren", sondern die Re-Scan-Dauer anpassen oder das Image neu pushen. Continuous allein hilft nichts, wenn die Frist abgelaufen ist.
