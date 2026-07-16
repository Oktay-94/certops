---
service: VPC Flow Logs
seedKey: saa-c03-script-vpc-flow-logs
batch: B4
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html
  - https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs-limitations.html
status: draft
---

# VPC Flow Logs

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Flow Logs = die **Überwachungskamera des Netzwerks**: Sie protokollieren pro Verbindung Quell-IP, Ziel-IP, Ports, Protokoll, Datenmenge — und vor allem **ACCEPT oder REJECT**. Wichtig: **nur Metadaten, kein Paketinhalt**. Ziele: CloudWatch Logs oder S3 (dort mit **Athena** auswertbar). Abgrenzung: **CloudTrail = API-Aufrufe (wer hat was getan), Flow Logs = Netzwerkverkehr (wer hat mit wem geredet)**.

Der SAA vertieft: **Was Flow Logs ausdrücklich NICHT sehen — und wann man stattdessen Traffic Mirroring braucht.**

---

## 🎯 SAA-Vertiefung

### Die Fehlersuche: REJECT ist das Wort, auf das es ankommt

**Das Problem:** Der App-Server erreicht die Datenbank nicht. Security Group? NACL? Routing? Man kann raten — oder nachsehen.

**Die Lösung:** Flow Logs auf ENI-, Subnetz- oder VPC-Ebene aktivieren und im Log nach **`REJECT`** auf dem betreffenden Port suchen. Das Feld **`action`** ist der eigentliche Diagnose-Schatz — es sagt, ob der Traffic durchgelassen wurde. Die Feinunterscheidung, die in Prüfungsfragen versteckt wird:

- Man sieht **eingehende REJECTs, aber gar keine ausgehenden Einträge** → die **Security Group** blockiert (stateful: sie verwirft den eingehenden Versuch, es entsteht nie eine Antwortrichtung).
- Man sieht den **eingehenden Request als ACCEPT, aber die Antwort als REJECT** → die **NACL** blockiert den Rückweg (stateless → fehlende **Ephemeral-Port**-Outbound-Regel).

Genau diese Zwei-Zeilen-Logik ist die klassische SAA-Detailfrage zur Netzwerk-Diagnose. Ausgewertet wird bei S3-Zielen mit **Athena** (SQL über Petabytes von Logs), bei CloudWatch Logs mit **Logs Insights**. Und: Flow Logs sind **nicht Echtzeit** — sie werden in Fenstern von **1 oder 10 Minuten** aggregiert.

> **💡 Merksatz:** Feld **`action = REJECT`** ist der Diagnose-Anker. **Nur Inbound-REJECT → Security Group. Inbound ACCEPT + Outbound REJECT → NACL** (Ephemeral Ports!).

### Die blinden Flecken — was Flow Logs nicht protokollieren

**Das Problem:** „Wir sehen im Flow Log keine DNS-Abfragen an den Amazon-Resolver — sind unsere Logs kaputt?" Nein, das ist Absicht — und die offizielle Ausnahmeliste ist prüfbar.

**Die Lösung:** Flow Logs erfassen **nicht**:
- Traffic zum **Amazon-DNS-Server** (ein *eigener* DNS-Server auf einer EC2 würde dagegen geloggt),
- **169.254.169.254** (Instance Metadata) und **169.254.169.123** (Time Sync),
- **DHCP**-Traffic,
- **Windows-Lizenzaktivierung**,
- Traffic zur reservierten VPC-Router-IP.

Wer also DNS-Abfragen überwachen will, braucht **Route 53 Resolver Query Logging** (und zum Blockieren die **DNS Firewall**) — Flow Logs helfen dort nicht.

> **💡 Merksatz:** Flow Logs sehen **kein Amazon-DNS, keine Metadaten (169.254.x), kein DHCP, keine Windows-Aktivierung**. DNS überwachen → **Route 53 Resolver Query Logs**.

### Metadaten vs. Payload: Wann Traffic Mirroring gebraucht wird

**Das Problem:** Das Security-Team betreibt ein **Intrusion Detection System** und will den **tatsächlichen Paketinhalt** analysieren — nicht nur wissen, *dass* Server A mit einer IP in Übersee geredet hat, sondern *was* dabei übertragen wurde.

**Die Lösung:** Dafür sind Flow Logs prinzipiell blind — sie sind ein **Verbindungsnachweis, keine Inhaltsaufzeichnung**. Die Antwort heißt **VPC Traffic Mirroring**: Es kopiert den **echten Netzwerkverkehr inklusive Payload** (gekapselt in VXLAN) an ein Analyse-Ziel (IDS/IPS, Wireshark-Appliance, NLB vor einer Appliance-Flotte). Einschränkung mit Punktwert: **nur auf Nitro-basierten Instanzen**.

Die Merkregel für die drei Beobachtungswerkzeuge:
- **CloudTrail** = Wer hat *in AWS* etwas getan (API-Ebene)?
- **Flow Logs** = Wer hat *mit wem* geredet (Metadaten)?
- **Traffic Mirroring** = *Was* wurde gesagt (Payload)?

> **💡 Merksatz:** Payload/Deep Packet Inspection/IDS → **Traffic Mirroring** (nur Nitro). Flow Logs liefern nie den Inhalt.

---

## ⚠️ Prüfungs-Knackpunkte

- Flow Logs = **Metadaten** (srcaddr, dstaddr, Ports, Protokoll, Bytes, **action ACCEPT/REJECT**) — **kein Paketinhalt**.
- Ebenen: **VPC / Subnetz / ENI**; Ziele: **CloudWatch Logs, S3 (Athena), Kinesis Data Firehose**; **nicht Echtzeit** (1- oder 10-Minuten-Fenster).
- Diagnose: **nur Inbound-REJECT → Security Group**; **Inbound ACCEPT + Outbound REJECT → NACL** (Ephemeral Ports).
- **Nicht geloggt:** Amazon-DNS, 169.254.169.254 (Metadata), 169.254.169.123 (Time Sync), DHCP, Windows-Lizenzaktivierung.
- DNS-Abfragen überwachen → **Route 53 Resolver Query Logging** (nicht Flow Logs).
- Payload/IDS → **Traffic Mirroring** (nur **Nitro**-Instanzen).
- Abgrenzung: **CloudTrail = API-Aktionen**, **Flow Logs = Verbindungen**, **Traffic Mirroring = Inhalte**. GuardDuty nutzt Flow Logs (u. a.) automatisch zur Bedrohungserkennung.

## 💡 Der eine Satz zum Mitnehmen

**Flow Logs beantworten „kam der Traffic an, und wurde er erlaubt?" — nie „was stand drin"**: Für Inhalte gibt es Traffic Mirroring, für API-Aktionen CloudTrail, für DNS die Resolver Query Logs.
