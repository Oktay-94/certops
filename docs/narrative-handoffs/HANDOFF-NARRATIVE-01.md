# HANDOFF-NARRATIVE-01 — Karten 1, 2, 3

**Datum:** 28.07.2026 · **Spec:** NARRATIVE-SPEC v1 · **Referenz:** narrative-reference-scheduler.md

---

## 1. Entscheidungen dieses Chats — bindend für alle Folgebatches

| # | Entscheidung | Konsequenz |
|---|---|---|
| E1 | Narrativ liegt in **eigener Datei**, nicht in der Produktions-`.md` | `public/scenarios/card-NN/narrative.md`; `battle_card_N.md` bleibt unverändert |
| E2 | Dateiname ist die **Konstante `narrative.md`** | Keine Erweiterung von `cardStem()`. Die R11-Asymmetrie (`card-01` / `battle_card_1`) bleibt unangetastet |
| E3 | `correctAnswer` wird **ausgelassen**, nicht leer gesetzt | Karten 1–60 haben keine A–E-Optionen. Aufgaben entstehen später als eigener Track |
| E4 | „Prüfungsknackpunkte" arbeitet mit **Abgrenzungen** statt Distraktoren | Format: „Warum X hier verliert:" — je ein Satz |
| E5 | **Drei Narrative pro Chat**, nicht fünf | Kartenbatches waren fünf, Narrativbatches sind drei (Spec §8) |
| E6 | STAND lebt als **Paste-Block** aus dem Vorchat, zusätzlich als Datei | Diese Datei nach `~/Projekte/certops/docs/narrative-handoffs/` ablegen |
| E7 | Auslieferung als **ein flaches ZIP**, keine losen Dateien daneben | `certops-narratives-<von>-<bis>.zip`, gebaut mit `zip -j -X` — analog zur Battle-Card-Konvention |
| E8 | Dateien im ZIP heißen **`card-NN-narrative.md`**, nicht `narrative.md` | Ein flaches ZIP verträgt keine drei gleichnamigen Dateien, und die Download-Ansicht zeigt keine Ordner. Umbenennung auf `narrative.md` passiert bei der Integration |

### Ablage-Mapping für Claude Code

| Datei im ZIP | Ziel im Repo |
|---|---|
| `card-01-narrative.md` | `public/scenarios/card-01/narrative.md` |
| `card-02-narrative.md` | `public/scenarios/card-02/narrative.md` |
| `card-03-narrative.md` | `public/scenarios/card-03/narrative.md` |
| `HANDOFF-NARRATIVE-01.md` | `docs/narrative-handoffs/HANDOFF-NARRATIVE-01.md` |

Regel: `card-NN-narrative.md` → `public/scenarios/card-NN/narrative.md`. Der Ordner existiert bereits, `battle_card_N.md` bleibt unangetastet. Entpacken mit `unzip -j -o`, danach `chmod 644`.

## 2. Spec-Änderungen, die NARRATIVE-SPEC.md nachziehen muss

Ohne diese drei Korrekturen ist der Guard-Test ab Datei eins rot:

1. **§1 Ablage** — „ersetzt den bisherigen Inhalt der `.md`" ist überholt. Neu: eigene `narrative.md` neben `battle_card_N.md`.
2. **§2 Frontmatter** — `correctAnswer` von „Pflicht" auf **„Pflicht ab Aufgaben-Track"** ändern.
3. **§7.1 Guard-Test** — „Jede der 100 `.md`" auf **„jede vorhandene `narrative.md`"** umformulieren. Ebenso §7.2: `cardNumber` ist während der Produktion **nicht lückenlos 1–100**; die Lückenlosigkeit gilt erst nach Abschluss.

Zusatz für §3: Der Abschnitt „Prüfungsknackpunkte" verlangt „je einen Satz zu jeder falschen Antwort". Solange keine Antwortoptionen existieren, gilt E4.

## 3. Kartenbefunde (N2) — offen, Entscheidung bei Oktay

### Karte 1 — Badge 4 beginnt beim falschen Akteur
Der gestrichelte Rückpfeil „JSON-Antwort in Millisekunden" startet an der **DynamoDB**-Box und endet bei der App. Der reale Rückweg ist `DynamoDB → Lambda → API Gateway → Client`.
In `battle_card_1.md` ist das als bewusste Vereinfachung dokumentiert (Sammel-Rückpfeil).
**Im Narrativ behandelt:** eigener H3 „Badge 4 — der Rückpfeil, und was daran nicht stimmt", der den Sammelpfeil auseinandernimmt.
**Offen:** Karte so lassen (dokumentierte Schuld) oder im Sammelpass neu zeichnen.

### Karte 2 — Label-Kollision (kosmetisch)
„Image-Pull beim Task-Start" überlappt die gestrichelte ECS-Gruppenkante. Klassischer (e)-Befund.
**Fachlich sauber**, keine Auswirkung auf das Narrativ. Gehört in den Sammelpass.

### Karte 2 — fehlendes Objekt (dokumentiert, kein Fehler)
Auf dem Task-Kasten steht „skaliert per Service Auto Scaling", aber der **ECS Service** ist als Objekt nicht gezeichnet. Im Narrativ unter „Die ehrliche Feinheit" benannt. Kein Handlungsbedarf.

### Karte 3 — Badge 3 hat drei verschiedene Absender ⚠️ substanziell
Der Pfeil „Metriken publizieren" startet bei den EC2-Instanzen. Der CloudWatch-Kasten nennt aber zwei Metriken:
- **`CPUUtilization`** — kommt von der **EC2-Plattform**, nicht von einem Agenten auf der Instanz. Kein Agent nötig.
- **Requests je Target** — `RequestCountPerTarget` gehört dem **ALB** (Namespace `AWS/ApplicationELB`). Die Instanz kennt diese Zahl nicht. Belegt dadurch, dass der Predefined-Metriktyp `ALBRequestCountPerTarget` zwingend ein `ResourceLabel` mit ALB- und Target-Group-ID verlangt.
- **RAM/Disk** — kämen tatsächlich von einem CloudWatch-Agenten, stehen aber nicht auf der Karte.

Ein Pfeil, drei mögliche Absender. **Im Narrativ ausführlich aufgelöst** (H3 „Badge 3 — drei Absender, ein Pfeil").
**Offen:** Karte belassen oder den ALB-Kasten um einen zweiten Metrik-Pfeil ergänzen.

### Karte 3 — Bild und Prüfungsantwort widersprechen sich ⚠️ didaktisch riskant
Die Karte zeichnet **Target Tracking**, während der gelbe Kasten korrekt sagt, dass bei einem vorhersehbaren Tagesmuster **Scheduled/Predictive** die Prüfungsantwort ist. In `battle_card_3.md` als Falle 1 dokumentiert, also gewollt.
Das Risiko ist real: Das Bild prägt sich ein, der Einwand im Textkasten nicht.
**Im Narrativ behandelt:** eigener fetter Satz in „Die ehrliche Feinheit" plus Lag-Rechnung mit konkreten Zahlen.
**Offen:** Bleibt so oder bekommt die Karte einen zweiten, gestrichelten Scheduled-Pfeil.

## 4. Faktenlage — geprüft am 28.07.2026

**Bestätigt und im Text verwendet:**
- API Gateway: Integration-Timeout Default 29 s; seit Juni 2024 für regionale und private REST APIs per Service Quota erhöhbar. **Neu gegenüber `battle_card_1.md`:** AWS weist darauf hin, dass die Erhöhung eine *Reduktion des kontoweiten Throttle-Kontingents* erfordern kann. Steht bisher auf keiner Karte.
- Lambda: 1-ms-Abrechnungsgranularität seit **Dezember 2020**, aufgerundet, ohne Mindestlaufzeit.
- Lambda: Account-Concurrency Default 1.000 pro Region; Skalierungsrate 1.000 Umgebungen pro 10 s **pro Funktion**.
- DynamoDB: neue On-Demand-Tabelle startet mit Warm Throughput 12.000 RU/s und 4.000 WU/s; Partitionslimit 1.000 WCU/s und 3.000 RCU/s; Pre-Warming seit November 2024; Konfigurierbares Maximum seit Mai 2024.
- ECS: Task Execution Role zieht das Image und schreibt Logs; Task Role gilt für den Anwendungscode. Die Doku hält fest, dass die Execution-Role-Credentials den Containern **nicht direkt zugänglich** sind.
- Fargate: `awsvpc` ist vorgeschrieben; privates Subnetz braucht NAT Gateway oder ECR-Interface-Endpoint.
- Auto Scaling: Target Tracking legt seine CloudWatch-Alarme selbst an und pflegt sie; Doku warnt ausdrücklich davor, sie zu bearbeiten. Thermostat-Vergleich stammt aus der AWS-Doku selbst.
- EC2: Basic Monitoring 5 Minuten, Detailed Monitoring 1 Minute und kostenpflichtig.

**Quellenkonflikte, die benannt werden mussten:**

| Konflikt | Beteiligte Quellen | Umgang |
|---|---|---|
| Lambda-Skalierung: „Initialburst 500–3.000, danach +500/min" (kontoweit) gegen „1.000 pro 10 s pro Funktion" | AWS-Blog *Understanding AWS Lambda scaling and throughput* (Fließtext) gegen Developer Guide `scaling-behavior` | Beide auf aws.amazon.com. Der Blog trägt einen Update-Hinweis auf die 12-fache Skalierung seit Dez. 2023, markiert sich also selbst als überholt. Im Narrativ als Konflikt **benannt**, maßgeblich ist der Developer Guide. |

**Widerlegte Drittquellen-Behauptungen — nicht übernehmen:**

| Behauptung | Wo gefunden | Tatsächlich (AWS) |
|---|---|---|
| Predictive Scaling braucht mindestens 14 Tage Historie | mehrere Blogs | **Minimum 24 Stunden**; 14 Tage führen zu *genaueren* Prognosen. Prognosehorizont 2 Tage. |
| Das 100-ms-Minimum bei Lambda fiel 2022 | Blog | **Dezember 2020** |

Beides ist ein Beleg für Spec §5.3: eine einzelne Drittquelle genügt nie.

## 5. Auffällige Masterplan-Zeilen für Batch 02 (Karten 4, 5, 6)

| Nr | Masterplan | Zu prüfen |
|---|---|---|
| 4 | „Lambda SnapStart / Provisioned Concurrency" | SnapStart war lange Java-only. Verfügbarkeit für Python und .NET **vor dem Schreiben verifizieren** — die Karte nennt ein 200-ms-Latenz-SLA, dazu gehören belastbare Zahlen. Ebenso prüfen, ob die Karte SnapStart und Provisioned Concurrency sauber trennt: unterschiedliche Mechanik, unterschiedliche Kostenstruktur. |
| 5 | „App Runner, ECR" | App Runner ist der Kandidat mit der dünnsten Mechanik im Batch. Kurzformat erwägen (siehe §7). Prüfen, ob das VPC-Connector-Feature auf der Karte auftaucht. |
| 6 | „EKS, Karpenter/Cluster Autoscaler, Spot" | Karte 6 existiert bereits (Batch 2, 18.07.). Laut CHAT-CONTEXT §10.3 ist Consolidation dort nur als Footer-Merksatz umgesetzt, nicht als Pfeil — gehört ins Narrativ unter „Die ehrliche Feinheit". Karpenter-Versionsstand verifizieren. |

## 6. Selbstprüfung gegen Spec §7

Maschinell geprüft über alle drei Dateien:

| Prüfung | card-01 | card-02 | card-03 |
|---|---|---|---|
| Keine H1 im Body | OK | OK | OK |
| Alle Pflicht-H2 vorhanden | OK | OK | OK |
| Kanonische Reihenfolge | OK | OK | OK |
| Keine unbekannten H2 | OK | OK | OK |
| H3 ≥ `badgeCount` | 9 ≥ 4 | 8 ≥ 3 | 10 ≥ 4 |
| `factCheckedAt` gesetzt | OK | OK | OK |
| `sources` mit AWS-Primärquelle | 5 | 4 | 6 |
| Wörter (Body) | 2.232 | 2.190 | 2.482 |

**Nicht prüfbar in diesem Chat:** Slug-Eindeutigkeit gegen `seed_key` anderer Content-Arten (§7.3) — braucht Repo-Zugriff, gehört in den Integrationsdurchgang.

**Vergebene Slugs (Liste im nächsten Handoff fortschreiben):**
```
1  serverless-rest-api-ticketwave
2  ecs-fargate-shopflow-container
3  ec2-auto-scaling-dailydeals-tageszyklus
```

## 7. Offener Punkt zur Entscheidung nach dem Lesen

Die drei Texte liegen bei 2.200–2.500 Wörtern, der Referenztext bei rund 1.800. Karte 3 rechtfertigt die Länge (zwei Kartenbefunde plus die reaktiv/proaktiv-Achse), Karte 2 vermutlich nicht vollständig.

Zu entscheiden, nachdem du gelesen hast: **einheitliche Länge oder Kurzformat für mechanikarme Karten** (App Runner, Elastic Beanstalk, S3 Intelligent-Tiering). Bei 100 Karten sind 700 Wörter Unterschied je Text rund 70.000 Wörter — also mehrere Chats.

---

## STAND-Block für den nächsten Chat

```
Spec:            NARRATIVE-SPEC.md v1 (28.07.2026) + Korrekturen aus HANDOFF-NARRATIVE-01 §2
Referenz:        narrative-reference-scheduler.md
Geschrieben:     3 von 100  (Karten 1, 2, 3)
Dieser Batch:    Karten 4, 5, 6
Ablage:          public/scenarios/card-NN/narrative.md  (NEUE Datei, battle_card_N.md bleibt)
Frontmatter:     correctAnswer wird ausgelassen (kein Aufgaben-Track vorhanden)
Batchgröße:      drei Narrative pro Chat
Slugs vergeben:  serverless-rest-api-ticketwave · ecs-fargate-shopflow-container ·
                 ec2-auto-scaling-dailydeals-tageszyklus
Offene Karten-
befunde:         Karte 1 Badge 4 (Akteur) · Karte 3 Badge 3 (drei Absender) ·
                 Karte 3 Bild zeigt Target Tracking statt Scheduled — alle im Narrativ
                 aufgelöst, Kartenkorrektur offen
Kein Repo-Schreiben, kein SCENARIO_COUNT, keine Commits in diesem Chat.
Integration aller Narrative als EIN Durchgang durch Claude Code im Plan-Mode.
```

## Einsammel-Befehl für den nächsten Chat

```
cd ~/Projekte/certops/public/scenarios
mkdir -p ~/Desktop/narrativ-02
cp card-04/battle_card_4.md card-04/battle_card_4.png card-05/battle_card_5.md card-05/battle_card_5.png card-06/battle_card_6.md card-06/battle_card_6.png ~/Desktop/narrativ-02/
open ~/Desktop/narrativ-02
```
