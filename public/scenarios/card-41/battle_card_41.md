---
nr: 41
title: "IAM Roles · STS · Instance Profile — temporäre Credentials überall"
services:
  - IAM Roles
  - AWS STS
  - EC2 Instance Profile
  - IAM Roles Anywhere
  - Lambda Execution Role
  - Amazon S3
  - Amazon DynamoDB
domains:
  - D1
signalwords:
  - "no long-term credentials"
  - "temporary security credentials"
  - "without embedding access keys"
  - "workloads running outside of AWS"
  - "rotate credentials automatically"
  - "instance profile"
  - "assume a role"
assets:
  svg: battle_card_41.svg
  png: battle_card_41.png
  pdf: battle_card_41.pdf
status_note: >
  QC 0 Befunde. Gemeldet: 10 Boxen, 53 Texte, 27 Segmente, 7 Badges.
  Segmentzahl aufgeschlüsselt: 4 Marker-Definitionen in <defs> erzeugen
  8 Phantom-Segmente bei (0,0)-(8,4)-(0,8); real gezeichnet sind damit
  19 Segmente (7 nummerierte Pfade mit zusammen 12 Teilstrecken,
  1 verworfener Pfad mit 2 Teilstrecken, 2 X-Striche, 3 weitere
  Teilstrecken der rechtwinkligen Wege). 7 Badges = 6 Nummern-Badges
  plus das rote X, das qc.py korrekt von Prüfung (d) ausnimmt.
  Zwei Befunde wurden vor der Abgabe behoben: "Key gelöscht" lag bei
  y=672 innerhalb der Lambda-Box (660–780) — R2-Fall, Boxgrenze war
  geschätzt statt gerechnet, Label auf y=600 verschoben; "holt
  Credentials" kreuzte das vertikale Segment von Pfad 2 bei x=845,
  auf x=800/y=545 versetzt.
  Render-Sanity: PNG 2400x1350. Fünf aus der Elementgeometrie
  abgeleitete Freizonen geprüft; zwei leer, drei belegt und einzeln
  aufgeklärt — (A) nur der graue Zonenrand #9A9A9A bei x=420,
  (B) Label und roter verworfener Pfad bei y=630, (C) die Pfeile 6 und
  7 bei x=1240. Keine davon ist eine Kollision. Alle acht
  Palettenfarben im PNG nachweisbar.
  Footer von Hand mit PIL gemessen: 1172.9 px (Stil-Guide ~1420).
  Sichtprüfung: versucht, unbrauchbar — die Bildansicht lieferte ein
  Bildobjekt ohne lesbaren Inhalt. Die Karte ist rechnerisch geprüft,
  aber von niemandem gesehen.
---

## Szenario

Ein Logistikunternehmen betreibt seine Auftragsverarbeitung in `eu-central-1`.
Eine EC2-Flotte nimmt Sendungsdaten entgegen und schreibt sie nach S3, eine
Lambda-Funktion liest daraus und schreibt verarbeitete Aufträge nach DynamoDB.
Im eigenen Rechenzentrum läuft zusätzlich ein Altsystem, das nächtlich
Bestandslisten nach S3 hochlädt — bisher mit einem IAM User und einem Access
Key, der seit vier Jahren unrotiert in einer Konfigurationsdatei steht.

Ein Security-Audit fordert: keine langlebigen Credentials mehr, nirgends. Die
Anwendungen dürfen dabei nicht umgeschrieben werden.

## Ablauf

**1 — Das On-Prem-Altsystem zeigt sein X.509-Zertifikat vor.**
Das Zertifikat stammt aus der firmeneigenen CA, die als Trust Anchor in AWS
registriert ist. Der entscheidende Punkt: das System hält keinen AWS-Schlüssel,
sondern einen privaten Schlüssel aus der eigenen PKI, die ohnehin schon
existiert und schon rotiert wird. Damit wandert das Credential-Problem dorthin,
wo es bereits gelöst ist.

**2 — IAM Roles Anywhere ruft `CreateSession` auf.**
Der Dienst prüft die Signatur, prüft dass das Zertifikat von der im Trust
Anchor hinterlegten CA ausgestellt wurde, und lässt dann eine Rollensitzung
über STS erzeugen. Damit die Rolle überhaupt annehmbar ist, muss ihre Trust
Policy dem Service Principal `rolesanywhere.amazonaws.com` vertrauen. Das
Profile bestimmt, welche Rollen über diesen Weg angenommen werden dürfen —
Trust Anchor und Profile sind zwei getrennte Stellschrauben, nicht eine.

**3 — Die EC2-Flotte holt sich Credentials über das Instance Profile.**
Das Instance Profile ist der Container, der die Rolle an die Instanz bindet;
die Anwendung selbst kennt keinen Schlüssel. Abgerufen wird über IMDSv2: erst
ein `PUT` für ein Session-Token, dann das eigentliche `GET` mit dem Token im
Header. Das SDK erledigt das von allein — deshalb ist der geforderte
"kein Code-Umbau" hier erfüllt.

**4 — Lambda nutzt seine Execution Role.**
Bei Lambda gibt es kein Instance Profile und keinen Metadata-Endpunkt im
EC2-Sinn; die Credentials stehen der Funktion über die Laufzeitumgebung zur
Verfügung und werden vom SDK automatisch aufgegriffen. Anderer Mechanismus,
gleiches Prinzip: die Identität hängt an der Rolle, nicht an einem Schlüssel.

**5 — STS prüft die Trust Policy der Rolle.**
Bevor Credentials ausgestellt werden, entscheidet die Trust Policy, *wer* die
Rolle annehmen darf; die Permissions Policy entscheidet danach, *was* der
Anrufer damit tun darf. Diese Zweiteilung ist der Kern jeder Rollenfrage in
der Prüfung — wer sie verwechselt, sucht den Fehler an der falschen Stelle.

**6 und 7 — Die temporären Credentials wirken auf S3 und DynamoDB.**
Beide Zugriffe laufen mit kurzlebigen Credentials, die von allein ablaufen. Es
gibt nichts zu rotieren, weil es nichts Dauerhaftes gibt. Das ist der eigentliche
Sicherheitsgewinn: nicht "besser verwahrte Schlüssel", sondern gar keine.

**Verworfen — IAM User und Access Key.**
Der alte Weg wird gestrichen, sobald Roles Anywhere steht. Ein Access Key in
einer Konfigurationsdatei ist ein Geheimnis mit unbegrenzter Haltbarkeit, das
sich beliebig kopieren lässt und dessen Missbrauch im CloudTrail wie normale
Nutzung aussieht.

## Prüfungs-Kernsatz

**Wer eine Rolle annehmen kann, braucht keinen Access Key — und STS ist immer
der Aussteller, egal ob der Anrufer in EC2, in Lambda oder im eigenen
Rechenzentrum sitzt.**

## Abgrenzungen

- **Instance Profile ↔ IAM Role:** Das Instance Profile ist nicht die Rolle,
  sondern der Behälter, der sie an eine EC2-Instanz bindet. In der Konsole
  entsteht es unsichtbar mit; über die API sind es zwei Objekte. Prüfungsfragen
  spielen mit dieser Unsichtbarkeit.
- **IMDSv2 ↔ STS:** IMDSv2 ist der *Ausliefermechanismus* auf der Instanz,
  STS der *Aussteller*. IMDSv2 löst ein SSRF-Problem, keine
  Berechtigungsfrage — wer die beiden gleichsetzt, beantwortet die falsche Frage.
- **Roles Anywhere ↔ IAM User:** Beides bedient Workloads außerhalb AWS. Der
  Unterschied ist die Haltbarkeit des Geheimnisses: ein Zertifikat läuft ab und
  wird von einer bestehenden PKI verwaltet, ein Access Key läuft nie ab.
- **Roles Anywhere ↔ Identity Center (Karte 48):** Roles Anywhere ist für
  *Maschinen* mit Zertifikat, Identity Center für *Menschen* mit Login.
- **Karte 41 ↔ Karte 43:** Hier geht es darum, *wer* etwas darf; auf Karte 43
  (KMS, Envelope Encryption) darum, *womit* Daten verschlüsselt werden.

## Klassiker-Fallen

- **"Access Keys regelmäßig rotieren" als richtige Antwort.** In Szenarien mit
  dem Signalwort *no long-term credentials* ist Rotation die zweitbeste Antwort;
  gefragt ist die Rolle, die das Problem auflöst statt es zu verwalten.
- **Access Keys auf die EC2-Instanz legen, weil "die Anwendung sie braucht".**
  Klassischer Distraktor. Das Instance Profile liefert dasselbe, ohne dass ein
  Geheimnis die Instanz je verlässt oder erreicht.
- **IMDSv1-Aufrufe aus altem Kursmaterial.** Ein `curl` auf
  `169.254.169.254/latest/meta-data/` ohne vorheriges Token schlägt auf
  IMDSv2-only-Instanzen fehl. Wer das Muster auswendig gelernt hat, hält den
  Fehler für ein Berechtigungsproblem.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**IMDSv2 ist heute die Voreinstellung, nicht die Ausnahme.** Seit dem
25.03.2024 lassen sich neue Instance-Launches pro Region auf IMDSv2-only
stellen; ab Mitte 2024 unterstützen neu veröffentlichte EC2-Instanztypen
ausschließlich IMDSv2. Zwei Feinheiten, die Kursmaterial meist unterschlägt:
Die Einstellung ist **regional**, nicht kontoweit, und sie wirkt **nicht
rückwirkend** auf bestehende Instanzen.
Quelle: AWS-Ankündigung vom 25.03.2024 und AWS News Blog zu IMDSv2 by default.

**Der globale STS-Endpoint verhält sich seit April 2025 anders.** Requests an
`sts.amazonaws.com` werden in Regionen, die standardmäßig aktiviert sind,
inzwischen lokal in der Region der Workload bedient statt in N. Virginia. In
Opt-in-Regionen bleibt es bei N. Virginia. Zusätzlich defaulten neue
SDK-Versionen seit dem 31.07.2025 ohne Zusatzkonfiguration auf den regionalen
Endpoint. Ältere Kurse beschreiben STS pauschal als "globalen Dienst mit einem
Endpunkt in us-east-1" — das ist überholt.
Quelle: AWS-Ankündigung vom 18.04.2025, AWS Security Blog (Stand 10.07.2025).

**Prüfungsrelevanter Nebeneffekt der Endpoint-Wahl:** Session-Tokens von
regionalen STS-Endpoints sind in allen Regionen gültig; Tokens vom globalen
Endpoint nur in den standardmäßig aktivierten. Wer eine neue Region aktivieren
will, muss das entweder über regionale Endpoints lösen oder die
Regions-Kompatibilität für den globalen Endpoint umstellen.
Quelle: IAM User Guide, "Manage AWS STS in an AWS Region".

## Nicht bestätigt

Nichts auf dieser Karte stützt sich auf eine einzelne Drittquelle. Die drei
Divergenzen oben sind jeweils durch eine AWS-Ankündigung oder AWS-Doku belegt.

Nicht auf die Karte genommen: eine konkrete Zahl für die maximale
Sitzungsdauer bei Roles Anywhere. Die Sitzungsdauer wird vom Profile begrenzt
und kann zusätzlich durch die Rolle selbst gedeckelt werden; da zwei
Stellschrauben ineinandergreifen, wäre eine einzelne Zahl auf der Karte
irreführend. Für den Prüfungskontext reicht: kurzlebig und konfigurierbar.

## Bewusste Vereinfachungen im Diagramm

- **Der Rückfluss der Credentials ist nicht als eigener Pfeil gezeichnet.** Die
  Pfeile 2, 3 und 4 zeigen die Anforderung; dass Credentials zurückkommen, ist
  in der Anfrage implizit. Vier zusätzliche Rückpfeile hätten die Karte
  überladen, ohne etwas zu erklären.
- **S3 und DynamoDB hängen im Diagramm an STS**, tatsächlich rufen EC2 und
  Lambda diese Dienste direkt auf — mit den von STS erhaltenen Credentials. Die
  Darstellung betont bewusst, *wodurch* der Zugriff legitimiert ist, nicht die
  Netzwerktopologie.
- **Der Trust Anchor ist nicht als eigene Box gezeichnet**, sondern als Zeile in
  der Roles-Anywhere-Box. Als eigener Knoten hätte er suggeriert, dass ein
  Aufruf durch ihn hindurchläuft — er ist aber eine Registrierung, kein
  Durchgang.
- **Die CA im Rechenzentrum fehlt als Box.** Sie ist in der Zeile
  "X.509 aus eigener CA" mitgemeint; die Karte handelt von AWS-Seite der
  Vertrauensbeziehung.

## Farbkonventionen dieser Karte

Diese Karte ist die erste, die die in dieser Session festgeschriebene
Farbkonvention anwendet:

- **Navy #232F3E** — Infrastruktur-Eintrittspunkt und Account-Grenze:
  On-Prem-Altsystem, EC2-Flotte, STS. Die frühere Doppelbelegung mit
  Shield/Cutover ist zurückgenommen.
- **Teal #0F7C8C** — Regel- und Konfigurationsinstanz: IAM Role,
  IAM Roles Anywhere. Damit fällt **KMS aus Navy heraus** und wandert zu Teal;
  auf Karte 37 steht KMS noch in Navy. Diese Abweichung ist bekannt und
  dokumentiert, Karte 37 wird nicht neu gezeichnet.
- **Rot #C7161D** — verworfener Pfad: IAM User mit Access Key, gestrichelt und
  mit rotem X.
- **Grün #3F8624** — S3 als Ziel. **Dunkelblau #2E27AD** — DynamoDB.
  **Orange #D97706** — Lambda. Alle drei nach Stil-Guide unverändert.
- **Gold** kommt auf dieser Karte nicht vor: das Szenario hat keine
  Kostendimension. Die Bedeutung bleibt bei "kostet Geld"; die Umdeutung
  "kostet Daten" von Karte 39 ist zurückgenommen.
