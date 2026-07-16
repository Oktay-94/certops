---
service: Amazon RDS Proxy
seedKey: saa-c03-script-rds-proxy
batch: B2
domains: [D2, D3]
sourceRef:
  - https://aws.amazon.com/rds/proxy/
  - https://aws.amazon.com/rds/proxy/faqs/
status: draft
---

# Amazon RDS Proxy

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> RDS Proxy = der **Türsteher mit Gästeliste** zwischen Anwendung und Datenbank: Statt dass tausend Lambda-Funktionen gleichzeitig eigene DB-Verbindungen aufreißen, verwaltet der Proxy einen **Pool** echter Verbindungen und teilt sie effizient zu. Muster: API Gateway → Lambda → **RDS Proxy** → RDS/Aurora.

Der SAA vertieft: **Warum genau sterben Datenbanken an Lambda-Erfolg, was macht der Proxy beim Failover — und mit welchem Feature verträgt er sich ausdrücklich nicht?**

---

## 🎯 SAA-Vertiefung

### Der Erfolg, der die Datenbank umbringt

**Das Problem:** Eine serverlose App wird viral. Lambda skaliert wunderbar auf 3.000 parallele Ausführungen — und jede einzelne öffnet ihre eigene Verbindung zur RDS-Instanz. Die Datenbank hat aber nur Speicher für ein paar hundert Connections: **„too many connections"**, die App fällt ausgerechnet im Erfolgsmoment um. Das Tückische: Verbindungsaufbau ist teuer (Handshake, Auth, Speicher) — tausende kurzlebige Lambdas erzeugen genau das Gegenteil dessen, was eine DB mag: **Connection-Churn**.

**Die Lösung:** **RDS Proxy** sitzt dazwischen und betreibt **Connection Pooling mit Multiplexing**: Die 3.000 Lambda-„Gäste" teilen sich einen kleinen Pool dauerhaft offener, warmer DB-Verbindungen. Kommt mehr Andrang, als der Pool hergibt, **warteschlangt** der Proxy, statt die DB zu fluten — ein Stoßdämpfer, kein Verstärker. Wichtig fürs Verständnis: Der Proxy bündelt **Verbindungen, nicht Anfragen** — jede Query erreicht die DB, nur eben über geteilte Leitungen.

Warum nicht einfach eine größere Instanz? Mehr RAM erhöht zwar `max_connections`, aber der Churn (ständiger Auf-/Abbau) bleibt — man kauft sich nur eine höhere Wand, gegen die die nächste Skalierungswelle läuft.

> **💡 Merksatz:** „Lambda + RDS + too many connections" → **RDS Proxy**, reflexartig. Größere Instanz, Read Replica oder ElastiCache sind die drei Standard-Distraktoren — keiner davon poolt Verbindungen.

### Failover ohne Schrecksekunde

**Das Problem:** Multi-AZ-Failover funktioniert — aber die App braucht danach quälende Sekunden, weil sie an toten Verbindungen hängt und auf den DNS-Wechsel wartet.

**Die Lösung:** Der Proxy hält die **App-Verbindungen offen** und routet unter der Haube einfach zur neuen Primary — kein DNS-Warten auf App-Seite. Offiziell reduziert das Failover-Zeiten **„by up to 66 %"**. 🔴 In Blog-Benchmarks kursieren auch „bis 79 %" (Aurora MySQL) und „bis 32 %" (RDS MySQL) — kontextabhängige Messwerte, nicht mit der offiziellen Produktseiten-Zahl vermischen und keinesfalls als Garantie lehren.

Dazu die Sicherheits-Dividende (D1): Die DB-Credentials wohnen zwingend in **Secrets Manager**, und der Proxy kann **IAM-Authentifizierung erzwingen** — Lambda braucht dann gar kein DB-Passwort mehr, nur eine IAM-Rolle. Der Proxy selbst ist **nie öffentlich erreichbar**, er lebt im VPC.

> **💡 Merksatz:** Proxy = weicheres Failover (bis zu 66 % schneller, „up to"!) + passwortloser DB-Zugriff via **IAM-Auth + Secrets Manager**.

### Die Unverträglichkeit: Proxy vs. Scale-to-Zero

**Das Problem:** Ein Team kombiniert begeistert die zwei modernsten Bausteine — Aurora Serverless mit Scale-to-Zero und RDS Proxy — und wundert sich, dass die Datenbank **nie pausiert** und weiter Geld kostet.

**Die Lösung:** Auto-Pause setzt **null offene Verbindungen** voraus — der Proxy hält aber definitionsgemäß dauerhaft Verbindungen warm. Die beiden Features widersprechen sich konzeptionell: **Proxy = immer verbunden, Scale-to-Zero = ganz loslassen.** Entweder Verbindungs-Pooling oder Auto-Pause — nicht beides.

Zum Einordnen die unterstützten Engines: Aurora MySQL/PostgreSQL, RDS MySQL/MariaDB/PostgreSQL/SQL Server.

> **💡 Merksatz:** „Aurora Serverless pausiert nie" → prüfe, ob ein **RDS Proxy** (oder Monitoring) die Verbindung offen hält. Proxy und Auto-Pause schließen sich aus.

---

## ⚠️ Prüfungs-Knackpunkte

- Lambda/Serverless erschöpft DB-Connections → **RDS Proxy** (Pooling + Multiplexing + Warteschlange).
- Distraktoren: größere Instanz (Churn bleibt), Read Replica (skaliert Reads, poolt nichts), ElastiCache (senkt Query-Last, nicht Verbindungszahl).
- Failover: Proxy hält App-Connections und routet um — offiziell „**up to 66 %**" schneller (🔴 nie als Garantie).
- Credentials zwingend in **Secrets Manager**; optional **IAM-Auth** → kein DB-Passwort im Lambda-Code (D1-Punkt).
- Proxy ist **nie public**, lebt im VPC.
- **Proxy verhindert Aurora-Serverless-Auto-Pause** — Scale-to-Zero und Proxy vertragen sich nicht.
- Proxy bündelt Verbindungen, nicht Anfragen — Writes erreichen die DB alle.

## 💡 Der eine Satz zum Mitnehmen

**RDS Proxy ist der Stoßdämpfer zwischen elastischem Compute und starrer Datenbank** — er gewinnt jede „too many connections"-Frage, macht Failover weich und Lambda passwortlos, kostet dafür aber das Scale-to-Zero.
