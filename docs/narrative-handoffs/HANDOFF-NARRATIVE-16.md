# HANDOFF-NARRATIVE-16 — Narrativ-Batch 16 (Karten 46, 47, 48)

> **Erstellt:** 11.08.2026 · **Spec:** NARRATIVE-SPEC **v1.1** (§4-Patch in HANDOFF-05 §5.1, weiterhin nicht im Project-Knowledge-Text; §6 seit 10.08. im Repo unter `docs/`) + Konventionen aus HANDOFF-02 §2 bis -15 §2
> **Ablage empfohlen:** `~/Projekte/certops/docs/narrative-handoffs/`

---

## 1. Stand

| | |
|---|---|
| Geschrieben | **48 von 100** (Karten 1–48) |
| Dieser Batch | Karten 46, 47, 48 — Schwachstellen finden, Daten finden, Zugang zentralisieren |
| Nächster Batch | Karten 49, 50, 51 |
| Guard-Tests §7 | **0 Befunde** |
| Wortzahlen | Karte 46: 2.304 · Karte 47: 2.245 · Karte 48: 2.266 |
| Repo-Integration | Narrative 1–39 sind live; 40–48 per Copy nachzuziehen |
| Kartenbefunde | 12 neue (128–139), davon **drei schwere Sachbefunde** und **sechs R2-Positionsfehler** |
| Kartenfixe | **Ein Sachfix und sechs R2-Fixes beschlossen, als `r2-fix-46-47-48.py` mitgeliefert** |

**Zur Wortzahl.** Die Prognose lag zum dritten Mal in Folge unter der Marke: 7/8/7 Kästen ergeben 2.100/2.250/2.100. `Syntax lesen` war auf allen drei von Anfang an eingeplant. Trotzdem lagen alle drei nach dem ersten Durchgang unter 2.200 (2.169 / 2.007 / 2.113). Gelöst über **Stufe 1** — je ein zusätzlicher H3 für ein Kartenelement, das noch keinen hatte (Randnotiz links auf 46, EventBridge-Kasten auf 47, Randnotiz links unten auf 48). Nur Karte 47 brauchte danach noch Stufe 3.

> **Für Batch 17: Der Faustwert von 150 Wörtern je H3 ist zu optimistisch, wenn viele H3 Pfeile statt Kästen beschreiben.** Pfeil-H3 landen erfahrungsgemäß bei 110–130 Wörtern, Kasten-H3 bei 160–190. Rechne mit `Kästen × 175 + Badges × 120 + 900`.

---

## 2. Konventionen aus diesem Batch

### 2.1 🚨 Der Ganzheitsdurchgang hat zum zweiten Mal in Folge die schwersten Befunde geliefert — und diesmal in einer neuen Richtung

In Batch 15 (§2.2) war das Muster: *zwei wahre Zeilen auf der Karte, die zusammen etwas Falsches ergeben*. In Batch 16 tritt eine Variante auf, die zeilenweise noch schwerer zu finden ist:

**Die Karte ist in jeder Zeile korrekt, und die Architektur löst das Szenario trotzdem nur, wenn man eine Einstellung ändert, die nicht auf der Karte steht.**

- **129 (Karte 46):** Beim Einschalten von Enhanced Scanning erkennt Inspector nur Images, die in den letzten 14 Tagen gepusht wurden. Das Szenario-Image ist acht Monate alt. Nichts auf der Karte ist falsch — die Karte gewinnt trotzdem nur, weil der Default-Modus *Last in use date* die Frist über die laufenden Fargate-Tasks verlängert.
- **133 (Karte 48):** „ein Entzug, überall wirksam" trägt. Die laufende Access-Portal-Session läuft danach aber weiter, default acht Stunden.

Der Unterschied zum Befundtyp aus Batch 15: Dort widersprachen sich zwei Kartenaussagen. Hier widerspricht die Karte einer **Voreinstellung des Dienstes**, die sie nicht zeigt.

> **Konvention: Beim Ganzheitsdurchgang wird nicht nur gefragt, ob die Karte sich selbst widerspricht, sondern auch: Welche Default-Einstellung muss wahr sein, damit der gezeigte Weg das versprochene Ergebnis liefert — und steht sie auf der Karte? Wenn nein, gehört sie ins Narrativ.**

### 2.2 ⚠️ Eine Zahl auf der Karte kann falsch sein, ohne dass irgendeine Quelle sie widerlegt

Befund 128 ist der erste Fall dieser Art. Die Zeile „Re-Scan bei neuer CVE, 90 Tage" ist nicht widerlegt — **90 Tage ist ein gültiger Wert.** Er ist nur nicht der Default, und die Karte präsentiert ihn als einen.

Der Fehler entsteht dadurch, dass eine Option aus einer Auswahlliste als Voreinstellung gelesen wird. Das fällt bei einem Faktencheck, der nach „ist 90 Tage belegt?" fragt, nicht auf — 90 Tage steht in der Optionsliste. Es fällt nur auf, wenn man fragt, **was passiert, wenn niemand etwas einstellt**.

> **Konvention: Bei jeder Zahl auf einer Karte wird zusätzlich zur Belegprüfung gefragt, ob sie ein Default, ein Limit oder eine wählbare Option ist. Optionen ohne dieses Attribut sind auf einer Karte irreführend, auch wenn sie belegt sind.**

### 2.3 Die Kastenzahl-Abweichung von `qc.py` ist jetzt dreimal in Folge konstant

`qc.py` meldet laut `status_note` 8 / 9 / 8 Boxen. Der korrigierte Grep aus HANDOFF-14 §2.1 ergibt **7 / 8 / 7** — wieder auf allen drei Karten genau eine zu viel, und zwar unabhängig davon, wie viele Zonenrahmen die Karte hat (alle drei Karten dieses Batches haben **null** Zonenrahmen). Damit ist die frühere Vermutung, die Abweichung hänge an Zonen, widerlegt: Sie tritt auch ohne Zonen auf. Der Footer-Rect ist der wahrscheinlichste Kandidat.

Für die Umfangsprognose zählt weiter der Grep, nicht die `status_note`.

### 2.4 Der Umlaut-Grep war zum ersten Mal seit Batch 15 wieder leer — er läuft trotzdem weiter

0 Kandidaten auf allen drei Karten. Stufe 2 entfiel. Die Regel aus HANDOFF-15 §2.3 bleibt unverändert: Der Grep läuft in **jedem** Batch, und ein Treffer ist ein Kandidat, kein Befund.

### 2.5 Regel F9 galt zum zehnten Mal in Folge nicht

Die PNGs waren als auswertbare Bilder verfügbar. `Build bricht ab` und `bei Critical` auf Karte 46 waren im Bild als Schnitt erkennbar, bevor `r2.py` sie bestätigte. Label-Wortlaut wie immer aus dem SVG gelesen; PNG und SVG stimmten auf allen drei Karten überein.

HANDOFF-07 §2.1 gilt unverändert: **nicht als aufgehoben behandeln**, im nächsten Batch ergebnisoffen versuchen.

---

## 3. Slugs und Nummern nach diesem Batch (48 Stück)

| Nr | Slug |
|---|---|
| 46 | `inspector-ecr-enhanced-scanning-weissdorn-finanz-cve-nach-dem-push` |
| 47 | `macie-automated-discovery-targeted-job-immenried-versicherung-sampling-vor-vollscan` |
| 48 | `iam-identity-center-permission-sets-uhlenbrook-maschinenbau-eine-identitaet-dreissig-accounts` |

**In der mitgelieferten `check.py` ist alles bis einschließlich Karte 45 hinterlegt.** Für Batch 17 sind die drei Zeilen oben plus `46, 47, 48: "Batch 16"` nachzutragen.

**Der Nachtrag aus Batch 15 wurde selbst getestet:** `card-43-narrative.md` gegen die gepatchte `check.py` ergab **2 Befunde** (Nummer *und* Slug), Exit 1. Der Guard beißt nachweislich.

**Firmennamen — drei neu, alle kollisionsfrei:** „Weißdorn Finanz" (46), „Immenried Versicherung" (47), „Uhlenbrook Maschinenbau" (48). Endungen `-dorn`, `-ried`, `-brook` sind neu, Präfixe `Weiß-`, `Immen-`, `Uhlen-` ebenfalls.

⚠️ Bei der Wahl gemieden: `Nord*` (dreimal), `Falke*` (zweimal), `Berg*` (Bergmann 14/24), `Tal*` (Talheim 41), `*bach` (Wildbach 29), `*kontor` (Rheinkontor 30), `*stein` (Ankerstein 44), `*werk`, `*bank`, `* Payments`.

⚠️ **Branchendublette, nicht vermeidbar:** Karte 47 ist ein Versicherer, Karte 44 war ebenfalls Versicherung. Die Branche steht im Kartenszenario (`Ein Versicherer betreibt rund 1.400 S3-Buckets`) und ist nicht frei wählbar. Karte 46 (Fintech) liegt zudem nah an Karte 45 (Zahlungsdienstleister). **Ab Karte 49 ist die Branchenverteilung enger als die Namensverteilung — bei der nächsten frei wählbaren Branche bewusst gegensteuern.**

---

## 4. Kartenbefunde dieses Batches (Nr. 128–139)

### 4.1 Karte 46 — drei Befunde, zwei schwer

**128 🚨🚨 „90 Tage" ist keine Default-Zahl von AWS.**

Der Inspector User Guide, Seite *Configuring the Amazon ECR re-scan duration*, sagt wörtlich: *The default scan duration for new accounts, including new accounts added to an organization, is 14 days.* Wählbar sind 3, 7, 14 (Default), 30, 60, 90 und 180 Tage für den Modus **Last in use date** bzw. **Last pull date**, und dieselbe Liste plus **Lifetime** für das Push-Datum. 90 Tage ist eine Option, kein Default.

Vierfacher Quellenstand:

| Quelle | Default |
|---|---|
| Inspector User Guide, *Configuring the ECR re-scan duration* | **14 Tage** |
| Inspector User Guide, *Scan behaviors for Amazon ECR scanning* | **14 Tage** (Erstaktivierung) |
| ECR User Guide, *Scan images for OS and programming language package vulnerabilities* | **14 Tage** (Erstaktivierung) |
| Inspector-FAQ (global) | **14 Tage** |
| Inspector-FAQ (China-Seite) | **30 Tage** |
| ECR User Guide, *Troubleshooting image scanning* | **30 Tage** |
| ECR User Guide, *Changing the enhanced scanning duration* | **Lifetime**, kennt nur 180 und 30 als Alternativen |

Der Inspector User Guide erklärt die Divergenz selbst: *All re-scan duration settings configured prior to May 16, 2025, will remain unchanged.* Die 30-Tage- und Lifetime-Seiten beschreiben ältere Stände.

**Oktays Entscheidung 11.08.: Weg A1 — Zahl auf 14 ändern.** Gemessen und umgesetzt in `r2-fix-46-47-48.py`; der Ersatztext ist mit 256,1 px exakt gleich breit wie der alte. Dieselbe Korrektur an zwei Stellen der `battle_card_46.md` (Zeile 104 und 164), ebenfalls im Skript.

**129 🚨🚨 Ganzheitsdurchgang: Beim Einschalten sieht Inspector das Szenario-Image gar nicht.**

ECR User Guide und Inspector User Guide, beide wörtlich: Bei der Erstaktivierung von Enhanced Scanning erkennt Inspector nur Images, die **in den letzten 14 Tagen gepusht** wurden. Ältere stehen sofort auf `SCAN_ELIGIBILITY_EXPIRED`; um sie einzubeziehen, muss man sie erneut pushen.

Das Kartenszenario ist ein acht Monate altes Image in Produktion. Am Tag des Einschaltens ist es exakt der Fall, den die Karte zu lösen verspricht.

Was es rettet: Der Default-Modus **Last in use date** misst die Frist am letzten Einsatz auf einem ECS-/EKS-Cluster. Solange das Image auf Fargate läuft, wird die Frist fortlaufend erneuert. Der Mechanismus, der das Szenario trägt, ist also die Nutzungsverfolgung — dieselbe Technik wie beim Image-zu-Task-Mapping in Pfeil 5, das die Karte nur als Reaktionsweg zeichnet.

**Kein Kartenfix.** Die Inspector-Box ist voll, und die Aussage braucht mehr als eine Zeile. Vollständig im Narrativ unter „Die ehrliche Feinheit".

⚠️ **Für Multi-Architektur-Images wird die Nutzungsverfolgung ausdrücklich nicht unterstützt** — AWS empfiehlt dort, die Frist am Push- oder Pull-Ereignis auszurichten. Damit fällt bei Multi-Arch-Images genau der Mechanismus weg, der das Szenario rettet. Steht im Narrativ, nicht auf der Karte.

**130 (klein) `.md`: „konfigurierbar bis hin zu Lifetime"** gilt nur für das Push-Datum. Der Last-in-use- und der Pull-Modus enden bei 180 Tagen. Kein Kartenfehler, `.md`-Ungenauigkeit.

**Belegketten geprüft — alle tragen.** Bestätigt: CI/CD-Plugin ohne Service-Aktivierung (What's New 30.11.2023, wörtlich); registry-weite Konvertierung Basic → Enhanced (Inspector UG *Automated scan types*); Continuous-Filter gewinnt über Scan-on-Push-Filter; nur `ACTIVE`-Images, `ARCHIVED` wird nicht gescannt; Hybrid-Modus automatisch bei Erstaktivierung; agentloses Scanning alle 24 Stunden; Network Reachability alle 12 Stunden; agentbasierte Scans ereignisgetrieben; Inspector Classic seit 20.05.2026 abgeschaltet, keine neuen Kunden ab 20.05.2025.

**Neu belegt, nicht auf der Karte:** Filter ohne Wildcard sind ein Enthaltensein-Test, kein exakter Name (`prod` trifft auch `staging-prod-mirror`); maximal zwei `rules` je Registry; Repositories ohne passenden Filter stehen auf `Off`, nicht auf „manuell"; manuelle Scans gibt es bei Enhanced nicht; die Re-Scan-Dauer wird vom delegierten Administrator für die gesamte Organization gesetzt; erhöht man die Push-Frist, bleiben bereits inaktive Images inaktiv.

### 4.2 Karte 47 — zwei Befunde, keiner schwer

**131 (mittel) Ganzheitsdurchgang: Die versprochene Abdeckung hat zwei Voraussetzungen, die nicht auf der Karte stehen.**

Die Karte verspricht Sicht über 1.400 Buckets in 30 Accounts, und die Zeile „Default an, startet in 48 h" liest sich wie eine Eigenschaft des Bestands. Tatsächlich gilt:

- **Macie ist regional.** Aktivierung in `eu-central-1` sagt nichts über andere Regionen; AWS weist im User Guide ausdrücklich darauf hin, die Schritte je Region zu wiederholen.
- **Über 30 Accounts läuft alles über den Macie-Administrator.** Standardmäßig ist Automated Discovery dann für alle vorhandenen und neu beitretenden Mitgliedskonten aktiv — aber erst, nachdem der Administrator es für die Organization eingeschaltet hat.

Die 48 Stunden sind belegt (User Guide *Enabling automated sensitive data discovery*, wörtlich). Kein Kartenfehler, aber die Karte zeigt einen Strang, wo ein Raster aus Accounts und Regionen steht. Im Narrativ ausgeschrieben.

**132 (klein) Quellenkonflikt bei der Finding-Aufbewahrung.** Der User Guide sagt an drei Stellen 90 Tage (*Reviewing and analyzing Macie findings*, *Reviewing Macie findings by using the console*, *Analyzing findings from automated sensitive data discovery*). Die Dokumentationsübersicht auf `aws.amazon.com/documentation-overview/macie/` sagt 30 Tage. Regel *User Guide vor Übersichtsseite* → 90. **Keine Zahl auf der Karte, kein Fix**, Widerspruch steht im Narrativ.

**Unverändert bestätigt — die `.md` hatte in der Sache durchgehend recht:** Allow List sticht Managed **und** Custom Data Identifier (User Guide wörtlich); Discovery Results 90 Tage und nur über einen selbst konfigurierten, KMS-verschlüsselten S3-Bucket dauerhaft; Findings enthalten den Inhalt nicht; Bucket-Posture ohne Objektzugriff und ohne Inspektionsgebühr; Sampling gruppiert nach Bucket-Name, Dateityp und Präfix; Automated Discovery und Discovery Job dürfen gleichzeitig laufen.

**Neu belegt, nicht auf der Karte:** Sensitivity Score reicht von −1 bis 100; beim ersten Einschalten bekommt jeder Bucket **50** und das Label *Not yet analyzed*, leere Buckets 1 und *Not sensitive*; **verwehrt eine Bucket-Policy den Zugriff, setzt Macie den Score zurück auf 50** — ein unlesbarer Bucket sieht damit aus wie ein noch nicht analysierter; Findings enthalten je nach Dateityp die Position von **bis zu 15 Fundstellen**; CDI-Parameter `maximumMatchDistance` 1–300 Zeichen, **Default 50**; bis zu 50 Keywords (3–90 Zeichen, nicht case-sensitiv) und bis zu 10 Ignore Words (4–90 Zeichen, case-sensitiv); Regex bis 512 Zeichen; **ohne `severityLevels` bekommen alle Funde eines Custom Identifiers Severity Medium**, unabhängig von der Trefferzahl; bis zu 1.000 Buckets lassen sich von Automated Discovery ausschließen; eine Allow List in S3, die Macie nicht lesen oder entschlüsseln kann, wird **stillschweigend nicht angewendet**.

⚠️ **In der `.md` unbelegt geblieben:** die Angabe „bis zu zehn Beispielen" beim temporären Abruf sensibler Daten. Der User Guide nennt an der geprüften Stelle 15 Fundstellen im Finding; die Zahl 10 für den Sample-Abruf wurde nicht bestätigt. **Steht deshalb nicht im Narrativ** — dort ist nur der Mechanismus beschrieben (kundenverwalteter KMS-Schlüssel, gleiche Region für Objekt, Finding und Analyseprotokoll). Bei der nächsten Macie-Berührung nachprüfen.

### 4.3 Karte 48 — vier Befunde, einer schwer

**133 🚨 Ganzheitsdurchgang: „ein Entzug, überall wirksam" ist wahr, „sofort" wäre es nicht.**

Die Karte sagt „überall wirksam" und vermeidet „sofort" — sie ist damit sauber. Die `.md` schreibt im Szenario „ein Entzug, überall **sofort** wirksam". Belegt gilt:

- **Access-Portal-Session:** Default 8 Stunden, konfigurierbar 15 Minuten bis 90 Tage.
- **Session-Dauer des Permission Sets:** davon getrennt, Default 1 Stunde, maximal 12.
- Der User Guide rechnet den Extremfall selbst vor: Portal-Session 20 Stunden plus Permission Set 12 Stunden ergibt eine CLI-Sitzung von bis zu **32 Stunden**, wenn kurz vor Ablauf erneuert wird.
- AWS bietet für genau diesen Fall einen eigenen Vorgang an und nennt im Security-Blog ausdrücklich *sessions for former employees* als Beispiel.

**Kein Kartenfix** — die Karte behauptet es nicht. Vollständig im Narrativ unter „Die ehrliche Feinheit", inklusive der Konsequenz: Aus drei Wochen werden nicht null Sekunden, sondern die Restlaufzeit der Sitzung.

**134 (mittel) `.md`: Die Einbahnstraße bei Account Instances gilt nur für alte Organisationen.**

Die `.md`-Klassiker-Falle stellt es universell dar. Belegt gilt (User Guide *Use Service Control Policies to control account instance creation*, wörtlich):

- **Vor November 2023 aktiviert:** Das Freischalten für Member Accounts ist eine einmalige, nicht umkehrbare Operation.
- **Nach dem 15.11.2023:** Member Accounts dürfen **standardmäßig** eigene Account Instances anlegen.

In beiden Fällen bleibt als Steuerung nur ein SCP auf `sso:CreateInstance`. **Datumsdivergenz nebenbei:** Die Troubleshooting-Seite des User Guide nennt für denselben Sachverhalt den **14.09.2023**, alle anderen Seiten den **15.11.2023**. Dritter Fall dieser Art nach Befund 120 und dem Athena-Datum aus Batch 14.

**135 🚨 Belegketten: Vier Faktencheck-Blöcke der `.md` stützen sich ausschließlich auf Drittquellen.**

Betroffen: Umbenennung AWS SSO → IAM Identity Center (cloudquery.io, hidekazu-konishi.com), unveränderte Namespaces (hidekazu-konishi.com), Policy-Namen (hidekazu-konishi.com), Trusted Identity Propagation und Kostenfreiheit (towardsthecloud.com).

**Kein Sachfehler gefunden** — die Aussagen stimmen. Aber die Umbenennung steht wörtlich im Identity-Center-User-Guide selbst: *On July 26, 2022, AWS Single Sign-On was renamed to AWS IAM Identity Center.* Regel „eine einzelne Drittquelle genügt nie" (Spec §5.3) verletzt, obwohl die Primärquelle danebenliegt. Fünfter Fall von „Belegkette trägt nicht" nach 109, 115, 117 und 122 — und der erste, bei dem nicht die Adresse falsch ist, sondern die **Quellenklasse**.

> **Konvention: Steht in einer `.md` unter „Faktencheck" eine Quelle, die nicht auf `aws.amazon.com` oder `docs.aws.amazon.com` liegt, wird zusätzlich geprüft, ob es eine AWS-Primärquelle für dieselbe Aussage gibt. Findet sich eine, ist die Drittquelle ein Befund, auch wenn die Aussage stimmt.**

**136 (klein) `.md`: Die Aussage unter „Nicht bestätigt" ist widerlegt.** Die `.md` schreibt, die Doku nenne die anhebbare Grenze nicht in Zahlen. Die Quotas-Seite nennt **25** AWS-managed und customer-managed Policies je Permission Set (nicht erhöhbar) und verweist für die 10 auf die IAM-Quota *Managed policies attached to an IAM role*, erhöhbar je Zielaccount. Zwei gestapelte Kontingente, wirksam ist das kleinere. Die Kartenzeile „bis 10 Policies + 1 inline" bleibt korrekt.

**Unverändert bestätigt:** Organization Instance im Management Account, einzige mit Multi-Account Permissions; wer vor dem 15.11.2023 aktiviert hat, hat eine Organization Instance; `AWSReservedSSO_<Name>_<Suffix>` unter `/aws-reserved/sso.amazonaws.com/<region>/`; Inline-Policy genau eine, maximal 32.768 Zeichen; SCP begrenzt, gewährt nie, trifft den Root-User des Member Accounts; expliziter Deny gewinnt immer; Zuweisung an Gruppen empfohlen.

**Neu belegt, nicht auf der Karte:** `CustomerManagedPolicyReferences` sind nur Verweise — die Policies müssen in **jedem Zielaccount vorher** mit exaktem Namen und Pfad existieren, sonst schlägt die Zuweisung fehl; von Identity Center erzeugte Rollen sind default nur von Identity-Center-Nutzern annehmbar, damit die Session-Dauer greift; nach Aktivierung der SCIM-Provisionierung lassen sich Nutzer in der Konsole nicht mehr von Hand ändern; Änderungen am Permission Set lösen eine Neuprovisionierung aller zugewiesenen Accounts aus.

### 4.4 R2-Befunde — beschlossen und geliefert

**137 Karte 46: drei Labels, vier Textzeilen.**

```
Build bricht ab       schneidet CI/CD-Box (18,7) UND ECR-Box (10,7)
bei Critical          schneidet CI/CD-Box (4,1)
deckt Fall 3 nicht ab schneidet EC2-Hybrid-Box (25,5)
```

**138 Karte 47: ein Label.** `inventarisiert` schneidet die Bucket-Posture-Box mit 6,0 px.

**139 Karte 48: ein Label.** `Nutzer + Gruppen` schneidet die Identity-Center-Box mit 24,5 px.

**Oktays Entscheidung 11.08.: alle sechs übernehmen.** Umgesetzt in `r2-fix-46-47-48.py` (idempotent, zweimal getestet). Nach Anwendung: **0 Schnitte, 0 Textkollisionen**, verifiziert mit `r2.py` und `collide.py`. Textelementzahl unverändert (42 / 49 / 42), **kein Wortverlust auf keiner Karte**.

**Bemerkenswert — zwei der drei Karten haben dasselbe Muster:** Ein zweizeiliges bzw. langes Pfeil-Label steht in einem 80 px breiten Korridor zwischen zwei Boxen. `Build bricht ab` misst 109,4 px, `Nutzer + Gruppen` misst 137,0 px. Horizontal ist das nicht lösbar — es gibt kein `x`, bei dem das Label in den Korridor passt. Beide wurden über die Boxoberkante gezogen.

> **Konvention für die Kartenkette: Ein Pfeil-Label, das breiter ist als der Korridor zwischen den beiden Boxen, gehört über die Boxoberkante, nicht neben den Pfeil. Der Korridor ist in dieser Kartenfamilie durchgängig 80 px breit; alles über ~75 px Labelbreite muss nach oben.**

⚠️ **PNG und PDF von Karte 46, 47 und 48 müssen nach dem Fix neu gerendert werden.** Karte 46 zusätzlich wegen Befund 128.

---

## 5. Systematische Befunde

### 5.1 Die Vorhersage der riskanten Kategorie hat zum ersten Mal seit drei Batches getroffen

HANDOFF-15 §7 sagte für Batch 16 voraus: **Umbenennungen und Dienstgrenzen, nicht Zahlen.** Das traf zu:

- Inspector Classic gegen Inspector v2 — Abschaltung am 20.05.2026 bestätigt, `.md` korrekt.
- AWS SSO gegen IAM Identity Center — Umbenennung bestätigt, aber Belegkette nur über Drittquellen (135).
- Macie Classic — kein Treffer, der Dienst taucht in aktueller Doku nicht mehr auf.
- Security Hub gegen Security Hub CSPM — auf allen drei Karten korrekt geführt.

**Zusätzlich traf die Warnung vor Macie-Preisen:** Drittquellen nennen konkrete Beträge, die `.md` hat sie korrekt draußen gelassen.

**Nicht vorhergesehen war Befund 128** — eine Zahl, die keine Umbenennung und kein Limit ist, sondern eine Option, die als Default gelesen wurde. Siehe §2.2.

### 5.2 Keine Masterplan-Schuld — zweiter Batch in Folge

| Karte | Masterplan-Zeile gleicher Nr. | Thema woanders? | Typ |
|---|---|---|---|
| 46 | Inspector, ECR Scanning, CVEs, CI-Pipeline | nein | deckungsgleich |
| 47 | Macie, personenbezogene Daten, DSGVO | nein | deckungsgleich |
| 48 | IAM Identity Center (SSO), Organizations, Permission Sets | nein | deckungsgleich |

Nebentreffer geprüft und unkritisch: `ECR` steht auch in Zeile 2 (ECS Fargate) und Zeile 5 (App Runner) — dort als Registry für Deployment, nicht als Scanning-Thema. `STS` steht auch in Zeile 41 — dort für Maschinen-Credentials, und beide Narrative verweisen aufeinander statt neu herzuleiten.

Die Schuld aus Batch 13/14 bleibt unverändert: Client VPN fällt aus den 100 (Karte 39), **Karte 53 ist IPv6 statt Athena** (Oktays Entscheidung 11.08.), weil Karte 40 das Athena-Data-Lake-Thema bereits vollständig trägt.

### 5.3 Kartenübergreifende Verweise haben zum ersten Mal in beide Richtungen funktioniert

HANDOFF-15 §7 forderte, die Sammelpunkt-Rolle von Security Hub CSPM auf den Karten 46 und 47 **nicht neu herzuleiten**, sondern auf Karte 45 zu verweisen. Umgesetzt: Beide Narrative nennen Security Hub CSPM als Zeile und verweisen für die Mechanik auf 45.

Ebenso auf Karte 48: Die Rolle des delegierten Administrators wird nicht zum zweiten Mal erklärt, sondern auf Karte 45 verwiesen. Die Abgrenzungen zu Karte 41 (Maschine gegen Mitarbeiter) und 42 (Belegschaft gegen Endnutzer) stehen in den Prüfungsknackpunkten, nicht als eigene Herleitung.

> **Das spart pro Karte rund 150 Wörter — was bei der chronischen Unterlänge dieses Batches gegen die Marke arbeitet. Beides gegeneinander abwägen: Verweis ist inhaltlich richtig, kostet aber Umfang, der dann anderswo entstehen muss.**

### 5.4 Der 30-Tage-Transitionskonflikt (Karte 11) wurde erneut nicht geprüft

Stand unverändert offen seit HANDOFF-05 §5.5. Karten 46–48 berühren S3 Lifecycle nicht.

---

## 6. Was im Narrativ steht, aber nicht auf der Karte

- **Karte 46:** die vollständige Registry-Scanning-Konfiguration als JSON mit `scanType`, `rules` und `repositoryFilters`; die Wildcard-Semantik der Filter samt der Falle, dass ein Filter ohne Wildcard ein Enthaltensein-Test ist; dass der Continuous-Filter den Scan-on-Push-Filter überstimmt; die 14-Tage-Grenze bei der Erstaktivierung (129) und der Last-in-use-Modus als der Mechanismus, der das Szenario trägt; die fehlende Nutzungsverfolgung bei Multi-Architektur-Images; der Vierfach-Quellenkonflikt zum Default (128); dass Repositories ohne Filter auf `Off` stehen und Enhanced keine manuellen Scans kennt; die drei getrennten Kadenzen 12 h / 24 h / ereignisgetrieben; die Abschaltung von Inspector Classic am 20.05.2026.
- **Karte 47:** der vollständige Custom Data Identifier als JSON samt `maximumMatchDistance` (Default 50, Bereich 1–300), Keyword- und Ignore-Word-Grenzen und `severityLevels`; dass ohne `severityLevels` alle Funde Severity Medium bekommen; die Score-Skala und die Falle, dass ein unlesbarer Bucket auf 50 zurückgesetzt wird und damit wie ein unanalysierter aussieht; Regionalität und Administrator-Voraussetzung (131); der Aufbewahrungskonflikt 90 gegen 30 Tage (132); die Struktur eines Findings mit `count` statt Inhalt; dass eine unlesbare Allow List stillschweigend nicht angewendet wird; die Abgrenzung Allow List gegen Suppression Rule.
- **Karte 48:** die beiden getrennten Session-Uhren und die 32-Stunden-Rechnung aus dem User Guide (133); die zwei gestapelten Policy-Kontingente 25 und 10 (136); dass `CustomerManagedPolicyReferences` nur Verweise sind und die Policies vorher in jedem Zielaccount liegen müssen; der SCP für die Regionssperre als vollständiges JSON mit `NotAction` für globale Dienste und `aws:RequestedRegion`; der vollständige `AWSReservedSSO_`-ARN und der Rat, Auswertungen am Namensteil statt am Pfad festzumachen; die altersabhängige Einbahnstraße bei Account Instances samt Datumsdivergenz (134); dass SCIM-Provisionierung die manuelle Pflege in der Konsole abschaltet.

---

## 7. Zu prüfen vor dem Schreiben (Batch 17 = Karten 49, 50, 51)

**Generell:** Umlaut-Grep **mit zweiter Stufe**. Bounding-Box-Kollisionscheck. **R2-Check mit Vollenthaltungs-Prüfung**. Kastenzählung über Rect-Attribute (`qc.py` meldet reproduzierbar einen zu viel). Zweistufige Masterplan-Gegenprüfung. Karte und `.md` gegeneinander lesen. Jede `.md`-Belegkette gegen die genannte Seite öffnen — **und zusätzlich prüfen, ob eine Drittquelle durch eine AWS-Primärquelle ersetzbar wäre** (§2.5 dieses Handoffs). **Ganzheitsdurchgang mit der neuen Frage: Welche Default-Einstellung muss wahr sein, damit der gezeigte Weg funktioniert?** (§2.1). **Bei jeder Zahl klären, ob sie Default, Limit oder wählbare Option ist** (§2.2).

**Masterplan-Zeilen zur Gegenprüfung:**
- **49.** CloudTrail, Athena · „Wer hat den Bucket gelöscht?" — API-Forensik über alle Accounts
- **50.** WAF Bot Control, CAPTCHA · Sneaker-Shop gegen Scalper-Bots beim Drop verteidigen
- **51.** Kinesis Data Streams vs SQS · Clickstream in Echtzeit, mehrere Konsumenten, Replay — warum kein SQS

**🚨 Athena-Schuld wird in Batch 17 fällig.** HANDOFF-15 Punkt (f) steht offen: Die Ankündigung vom 10.02.2026 nennt ein Reservierungsminimum von **4 DPU**, User Guide und API-Referenz nennen weiterhin **24**. Karte 49 ist die erste Athena-Berührung seit dieser Notiz. **Vor dem Schreiben neu prüfen und den Punkt schließen oder als Konflikt ins Narrativ schreiben.**

**Riskante Zahlenkategorie für Batch 17: Durchsatz- und Aufbewahrungsgrenzen.** Kinesis Data Streams ist die zahlenreichste Karte der bisherigen Kette — Shard-Durchsatz, Aufbewahrung von 24 Stunden bis 365 Tage, Konsumentenzahl mit und ohne Enhanced Fan-Out, On-Demand- gegen Provisioned-Modus. Bei CloudTrail die Trennung zwischen **Event History** (90 Tage, kostenlos, nur Management Events) und einem **Trail** oder **Event Data Store** mit eigener Aufbewahrung. Bei WAF die WCU-Grenzen und die Frage, welche Bot-Control-Stufe welche Erkennung enthält. **Jede dieser Zahlen ist ein Kandidat für den Fehlertyp aus Befund 128 — Option gegen Default.**

**Kartenübergreifend:** Karte 49 (Athena) trifft dasselbe Werkzeug wie Karte 40 (Athena, Glue, S3, Speicherlayout). **Zuerst prüfen, ob Karte 40 die Partitionierungs- und Kostenmechanik bereits trägt**, bevor sie ein zweites Mal hergeleitet wird — genau die Situation, in der Batch 16 den Verweis statt der Wiederholung gewählt hat (§5.3). Ebenso: CloudTrail ist auf Karte 43 als Nachweisebene geführt; Karte 49 macht es zum Hauptgegenstand.

**Farb-Debt:** Teal als „Regel- und Konfigurationsinstanz" ist jetzt **fünfzehnmal in Folge** verwendet (Karten 34–48). Karte 46 nutzt es für vier Boxen, Karte 47 für fünf. Der Festschreibungsvorschlag aus Karte 38 ist weit überfällig. **Neu auf Karte 48: Rot-Pink #B0084D ist doppelt belegt** — die Batch-9-Konvention legt den Ton auf relationale Datenbank-Engines, der Stil-Guide führt ihn unter SCP. Auf Karte 48 kollidiert nichts, weil keine Datenbank vorkommt. Sobald eine Karte SCP und eine relationale Engine gemeinsam zeigt, braucht einer der beiden einen eigenen Ton. Reiht sich ein neben Athena gegen Redshift Spectrum (beide Lila) und Neptune gegen Teal.

**Kartendateien anfordern:** Für jede Karte `battle_card_N.png`, `.svg` und `.md`, einzeln hochgeladen, nicht als ZIP. PDFs nicht.

---

## 8. Paste-Block für den Folgechat

```
Narrativ-Batch 17. Lies NARRATIVE-SPEC.md und narrative-reference-scheduler.md
aus dem Project Knowledge, bevor du schreibst.

STAND
Spec:            NARRATIVE-SPEC.md v1.1 (§4 geändert 29.07.2026) + Konventionen
                 aus HANDOFF-NARRATIVE-02 §2 bis -16 §2
                 ACHTUNG: der Spec-Patch liegt in -05 §5.1 und ist noch NICHT
                 im Project-Knowledge-Text. check.py erzwingt die neue Marke bereits.
                 §6 (Renderer) ist seit 10.08.2026 neu gefasst und liegt im Repo
                 unter docs/NARRATIVE-SPEC.md.
Referenz:        narrative-reference-scheduler.md (Maßstab ist die Referenz, nicht der letzte Text)
Geschrieben:     48 von 100  (Karten 1–48)
Dieser Batch:    Karten 49, 50, 51 — Masterplan ZWEISTUFIG gegenprüfen
Ablage:          public/scenarios/card-NN/narrative.md — battle_card_N.md bleibt.
                 Narrative sind LIVE, readNarrative() liest sie, check.py ist
                 Deploy-Vorbedingung. Nicht erst am Ende laufen lassen.
Frontmatter:     correctAnswer wird ausgelassen (kein Aufgaben-Track vorhanden)
                 sources MUSS YAML-Blockliste sein ("  - url"), kein Inline-Array
Code-Blöcke:     KEINE Zeile darf mit "# " beginnen — Guard-Test 5 wertet das auch
                 im Code-Block als H1. Kommentare als Prosa davor (HANDOFF-08 §2.2)
H2-Namen:        nur die neun kanonischen aus Spec §3. Variable Suffixe nach " — "
                 sind erlaubt (HANDOFF-09 §2.3)
Länge:           2.200–2.500 Wörter, VERBINDLICH und Guard-Test Nr. 9 in check.py.
                 Untergrenze intern als 2.250, Obergrenze als 2.450.
                 NEUER Faustwert (HANDOFF-16 §1): Kästen × 175 + Badges × 120 + 900.
                 Der alte Wert (150 je H3) war dreimal in Folge zu optimistisch.
                 Reihenfolge bei Unterlänge: (1) H3 für Kartenelemente ohne eigenen
                 H3 — Randnotizen und Nebenkästen zählen, (2) "Syntax lesen",
                 (3) erst dann Absätze ausbauen
Kästen zählen:   NICHT len(rects)-2. qc.py meldet reproduzierbar EINEN Kasten zu
                 viel, DREIMAL bestätigt und unabhängig von Zonen — Batch 16 hatte
                 null Zonenrahmen und dieselbe Abweichung (HANDOFF-16 §2.3)
Kollisionscheck: Bounding-Box mit PIL, text-anchor auflösen. Skript collide.py im ZIP
R2-Check:        r2.py im ZIP. Vollständig in einer Box enthaltener Text ist eine
                 BOXZEILE und nie ein Befund. Zonenrahmen kreuzen ist erlaubt.
                 NEU: Ein Pfeil-Label, das breiter ist als der 80-px-Korridor
                 zwischen zwei Boxen, ist horizontal NICHT lösbar und gehört über
                 die Boxoberkante (HANDOFF-16 §4.4)
Umlaut-Grep:     läuft in JEDEM Batch, ZWEISTUFIG. Ein Treffer ist ein KANDIDAT.
                 Batch 16 hatte 0 Kandidaten — das hebt die Regel nicht auf
GANZHEITSDURCH-
GANG:            Zwei Fragen, nicht mehr eine. (a) Widerspricht sich die Karte
                 selbst? (b) NEU: Welche Default-Einstellung des Dienstes muss
                 wahr sein, damit der gezeigte Weg das versprochene Ergebnis
                 liefert — und steht sie auf der Karte? Befunde 129 und 133 fielen
                 nur über (b) auf (HANDOFF-16 §2.1)
ZAHLEN:          NEU UND WICHTIG. Bei jeder Zahl auf einer Karte zusätzlich zur
                 Belegprüfung klären, ob sie ein DEFAULT, ein LIMIT oder eine
                 WÄHLBARE OPTION ist. Befund 128 war eine belegte Option, die als
                 Default gelesen wurde — kein Faktencheck der Form "ist X belegt?"
                 findet das (HANDOFF-16 §2.2)
Belegketten:     Jede .md-Aussage "belegt durch [Seite X]" gegen X öffnen. NEU:
                 Liegt X nicht auf aws.amazon.com oder docs.aws.amazon.com, prüfen
                 ob es eine AWS-Primärquelle für dieselbe Aussage gibt. Findet sich
                 eine, ist die Drittquelle ein Befund — auch wenn die Aussage
                 stimmt (HANDOFF-16 §2.5, Befund 135)
check.py:        Slugs UND Nummern des Vorbatches nachtragen, beides, immer.
                 Für Batch 17: 46/47/48 aus HANDOFF-16 §3.
                 Nachtrag selbst testen: eine Vorbatch-Karte gegen die gepatchte
                 Fassung laufen lassen, es MÜSSEN 2 Befunde kommen
Prüfungsknack-
punkte:          Abgrenzungen statt Distraktoren, Format "Warum X hier verliert:"
Kartenfehler:    im Narrativ explizit benennen, immer mit konkretem Fixvorschlag.
                 Gibt es mehrere Fixwege, Oktay im Chat entscheiden lassen.
                 In Batch 16 hat er Weg A1 (Kartenfix, Zahl korrigiert) und alle
                 sechs R2-Fixes übernommen. Textfixe mit PIL GEMESSEN
Karte vs .md:    gegeneinander lesen. In Batch 16 hatte die .md dreimal recht in
                 der Sache und dreimal nicht in der Vollständigkeit (130, 134, 136)
Masterplan:      ZWEISTUFIG. Erst die Zeile gleicher Nummer, dann das Kartenthema
                 über den GESAMTEN Masterplan greppen. Batch 15 und 16 waren
                 deckungsgleich — zwei saubere Batches in Folge
Kartenübergrei-
fend:            widersprechen sich zwei Karten nur in der Formulierung, trägt das
                 SPÄTERE Narrativ den Ausgleich; die Karte bleibt unangetastet.
                 Zuerst prüfen, OB die spätere Karte dieselbe Aussage trifft.
                 Sechsmal bestätigt in Batch 12 bis 16. ACHTUNG Umfang: Verweisen
                 statt Herleiten spart rund 150 Wörter je Karte und arbeitet
                 gegen die Längenmarke (HANDOFF-16 §5.3)
Kleinbefunde:    dürfen auf Oktays Entscheidung aus dem Narrativ fallen, NIE aus dem
                 Handoff (HANDOFF-07 §2.3)
Zahlen:          ohne AWS-Primärquelle nicht wiederholen, Größenordnung nennen und offenlegen
Quellenkonflikt: widersprechen sich zwei offizielle AWS-Seiten, wird der Widerspruch
                 geschrieben — kein Kompromisswert, kein Datum als Tatsache.
                 Rangfolge inzwischen dreifach bestätigt: User Guide DES BESITZENDEN
                 DIENSTES vor User Guide eines Nachbardienstes vor FAQ vor
                 Übersichtsseite vor generierter SDK-Seite. Batch 16 hatte einen
                 VIERFACH-Konflikt zur ECR-Re-Scan-Dauer (14 / 30 / Lifetime)
Firmennamen:     48 vergeben. SUFFIX-Prüfung wichtiger als Präfix. Neu belegt:
                 -dorn (Weißdorn 46), -ried (Immenried 47), -brook (Uhlenbrook 48).
                 BRANCHENVERTEILUNG ist inzwischen enger als die Namensverteilung:
                 Versicherung zweimal (44, 47), Finanz/Zahlung dreimal (45, 46, 39)
Offene Karten-
befunde:         139 Stück, vollständig in HANDOFF-NARRATIVE-02 §4 bis -16 §4.
                 GEMESSENE Fixvorschläge liegen vor für Karte 20, 31, 34, 39, 41,
                 42, 43 und 44
Beschlossen:     Befund 128 (Karte 46, "90 Tage" -> "14 Tage", gemessen, gleiche
                 Breite) und Befunde 137-139 (sechs R2-Fixes auf 46/47/48).
                 r2-fix-46-47-48.py liegt im ZIP, idempotent, zweimal getestet,
                 gegen r2.py UND collide.py verifiziert. Das Skript korrigiert
                 zusätzlich zwei Stellen in battle_card_46.md.
                 PNG UND PDF VON 46, 47 UND 48 MÜSSEN NEU GERENDERT WERDEN.
                 Textelementzahl bleibt 42 / 49 / 42
Vertagt:         Befund 99 (Karte 38), 102 (Karte 39), 114 (Karte 41), 118 (Karte 43),
                 121 (Karte 44), 129 (Karte 46, Ganzheitsbefund), 133 (Karte 48,
                 Session-Dauer) — bei 129 und 133 trägt das Narrativ, ein Kartenfix
                 ist nicht sinnvoll (Box voll bzw. Karte behauptet es nicht)
RENDERFEHLER:    Karte 41 hat ZWEI Textkollisionen im PNG (Befund 112). Fixvorschlag
                 gemessen UND verifiziert: CreateSession y=395 -> y=428,
                 Key gelöscht x=630 -> x=415. Kartenkette, vorrangig
Laufender Fix:   Umlaut-Defekt. Karten 6–10, Karte 27, Karte 30. Grenze "6–10" widerlegt
Farb-Debt:       Teal als "Regel-/Konfigurationsinstanz" FÜNFZEHNMAL in Folge (34-48).
                 Festschreibungsvorschlag überreif. NEU: Rot-Pink #B0084D ist doppelt
                 belegt — Batch-9-Konvention sagt relationale Engine, Stil-Guide sagt
                 SCP (Karte 48). Kollidiert erst, wenn eine Karte beides zeigt
Masterplan-
Debt:            Karte 39 = Aurora Global Database, Client VPN fällt aus den 100.
                 KARTE 53 IST IPv6, NICHT ATHENA (Oktays Entscheidung 11.08.).
                 Karte 40 nimmt Nebenkästen von 56 (QuickSight) und 57 (Glue ETL)
                 vorweg. Batch 16 hat NICHTS hinzugefügt
Nachprüfen:      (a) Hat der S3 User Guide die 30-Tage-Transitionsregel nachgezogen?
                     Stand 11.08.2026: NEIN, nicht erneut geprüft. Karte 11 hängt daran
                 (b) 50-Listener-Grenze bei PrivateLink-NLBs — unbelegt
                 (c) Regionsumfang Cross-Region PrivateLink
                 (d) "Provisioned"-Modus des Regional NAT Gateway — keine Primärquelle
                 (e) Sekundärregionen-Limit Aurora Global Database: User Guide 10,
                     Prescriptive Guidance und Whitepaper 5
                 (f) 🚨 FÄLLIG IN DIESEM BATCH: Athena-Reservierungsminimum.
                     Ankündigung 10.02.2026 sagt 4 DPU, User Guide und API-Referenz
                     sagen 24. Karte 49 ist die erste Athena-Berührung seit der Notiz
                 (g) ERLEDIGT bis auf die Gegenprobe: R2-Fehlalarm auf Karte 41.
                     Einmal "python3 r2.py 41" mit dem neuen Skript laufen lassen
                 (h) Zieht AWS die 10 in KMS-FAQ und CLI-Referenz auf 25 nach —
                     oder die 25 zurück? Bei der nächsten KMS-Berührung prüfen
                 (i) NEU: Macie — "bis zu zehn Beispiele" beim temporären Abruf
                     sensibler Daten ist unbelegt. Der User Guide nennt 15 Fundstellen
                     im Finding; die 10 für den Sample-Abruf wurde nicht bestätigt

KARTEN ANFORDERN
Für jede Karte werden battle_card_N.png, .svg und .md gebraucht — einzeln hochgeladen,
nicht als ZIP. PDFs nicht.

Sammel-Befehl für Oktay:
  mkdir -p /tmp/n17 && cd ~/Projekte/certops/public/scenarios
  for n in 49 50 51; do
    d=$(printf "card-%02d" $n)
    cp "$d/battle_card_${n}.png" "$d/battle_card_${n}.svg" "$d/battle_card_${n}.md" /tmp/n17/
  done
  ls -1 /tmp/n17 | wc -l
  open /tmp/n17

Badges und Kastentexte aus dem SVG ziehen:
  python3 -c "import re,pathlib,html;[print(f'{n}: '+html.unescape(re.sub(r'<[^>]+>','',m))) for n in (49,50,51) for m in re.findall(r'<text[^>]*>(.*?)</text>', pathlib.Path(f'battle_card_{n}.svg').read_text(encoding='utf-8'), re.S)]"

Kastenzählung und Umfangsprognose (zählt Zonenrahmen NICHT mit):
  python3 -c "import re,pathlib
for n in (49,50,51):
    t=pathlib.Path(f'battle_card_{n}.svg').read_text(encoding='utf-8')
    r=re.findall(r'<rect[^>]*>', t)
    k=[x for x in r if 'x=' in x and 'fill=\"none\"' not in x and float(re.search(r'height=\"([\d.]+)\"',x).group(1))>=60]
    b=len(re.findall(r'<circle[^>]*r=\"15\"', t))
    print(n,'| echte Kaesten',len(k),'| Badges',b,'| Wortprognose ca',len(k)*175+b*120+900)"

Umlaut-Grep, Stufe 1 (Kandidaten):
  python3 -c "import re,pathlib,html
for n in (49,50,51):
    t=pathlib.Path(f'battle_card_{n}.svg').read_text(encoding='utf-8')
    s=[html.unescape(re.sub(r'<[^>]+>','',m)) for m in re.findall(r'<text[^>]*>(.*?)</text>',t,re.S)]
    print(n,'Texte',len(s),'| Kandidaten:',[x for x in s if any(u in x for u in (chr(196),chr(214),chr(220)))])"

Umlaut-Grep, Stufe 2 (Bytes je Kandidat, C3 84 / C3 96 / C3 9C ist korrekt):
  grep -n "KANDIDATENTEXT" battle_card_N.svg | cat -A

KOLLISION und R2 — beide Skripte liegen im ZIP:
  python3 collide.py 49 50 51
  python3 r2.py 49 50 51

ABLAUF
Karten lesen → bestehende .md lesen → Kästen zählen UND Umfang prognostizieren →
Kollisions- und R2-Check laufen lassen → Umlaut-Grep zweistufig →
Masterplan-Zeile ZWEISTUFIG prüfen → Faktencheck per Web-Suche, .md-Belegketten
mitprüfen, Quellenklasse mitprüfen → JEDE ZAHL auf Default/Limit/Option prüfen →
GANZHEITSDURCHGANG mit beiden Fragen →
KARTENBEFUNDE MELDEN BEVOR TEXT ENTSTEHT → auf meine Entscheidungen warten →
schreiben → check.py gegen Spec §7 → ZIP + HANDOFF-NARRATIVE-17.md +
Sammelbefehle für die Ablage.

Kein Repo-Schreiben, kein SCENARIO_COUNT, keine Commits.
```
