# Kapitel 5 — Netzwerk & Content Delivery

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne:** Stell dir deine **VPC als ummauerten Garten** vor. Alles in diesem Kapitel beantwortet eine von vier Fragen: **(1) Welche Tür führt rein/raus?** (IGW, NAT, Endpoints, Peering/Transit Gateway) — **(2) Wie verbinde ich mein eigenes Rechenzentrum?** (VPN, Direct Connect, Client VPN) — **(3) Wer verteilt den Verkehr innen?** (ELB) — **(4) Wie erreiche ich Nutzer weltweit schnell?** (Route 53, CloudFront, Global Accelerator). Die Prüfung testet fast immer die **Abgrenzung**: welches Tor, welche Firewall, welcher Beschleuniger für welches Szenario.

---

## AWS Netzwerk-Grundlagen

**Metapher / Konzept**

> Die Hausnummern und Straßen der Cloud — die Adress- und Netzwerk-Basics, die man kennen muss.

**Die Bausteine (deine Karte, wortgetreu):**

- **ARN (Amazon Resource Name):** die eindeutige Kennung jeder AWS-Ressource, nach festem Schema: `arn:aws:service:region:account-id:resource`. Über den ARN wird eine Ressource in Policies, Befehlen usw. eindeutig angesprochen. *Bild: die vollständige Postadresse einer Ressource.*
- **CIDR (Classless Inter-Domain Routing):** die Notation für IP-Adressbereiche, z. B. `10.0.0.0/16`. Die Zahl nach dem `/` sagt, wie viele Adressen im Block sind: **kleinere Zahl = größerer Bereich**. /16 = 65.536 Adressen, /24 = 256. Damit definierst du die Größe deiner VPC und Subnetze.
- **RFC 1918 (private IP-Bereiche):** die drei für private Netze reservierten Bereiche (nicht im Internet routbar): **10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16**. Diese solltest du als „privat" wiedererkennen.
- **169.254.169.254 (Instance Metadata Service):** die spezielle, feste Adresse, die jede EC2-Instanz intern abfragen kann, um Metadaten über sich selbst zu bekommen (IAM-Rollen-Credentials, Instanz-ID, Region). **Wichtig:** Über diese Adresse holen sich Anwendungen die temporären Credentials der IAM-Rolle. (Merkzahl, kommt gern als Frage.)
- **Elastic IP (EIP):** eine **statische, feste öffentliche IPv4-Adresse**, die dir gehört und die du einer Instanz zuweisen kannst. Bleibt gleich, auch beim Neustart (normale öffentliche IPs ändern sich bei Stopp/Start). Für Dienste, die eine dauerhaft gleiche IP brauchen.
- **Wichtige Ports (auswendig!):** 22 = SSH (Linux) · 3389 = RDP (Windows) · 80 = HTTP · 443 = HTTPS · 3306 = MySQL/Aurora · 5432 = PostgreSQL · 1433 = MS SQL Server · 53 = DNS.

**⚠️ Prüfungs-Knackpunkte**
- Eindeutige Ressourcen-Kennung → **ARN**.
- IP-Bereich/Größe definieren → **CIDR** (kleinere /-Zahl = mehr Adressen).
- Private IP-Bereiche → **RFC 1918** (10.x, 172.16–31.x, 192.168.x).
- EC2 holt eigene Metadaten/Rollen-Credentials → **169.254.169.254**.
- Feste öffentliche IP → **Elastic IP**.
- Ports: SSH 22, RDP 3389, HTTP 80, HTTPS 443, MySQL 3306, PostgreSQL 5432.

---

## Amazon VPC (Virtual Private Cloud)

**Architektonische Einordnung**

Die VPC ist **das Fundament jeder AWS-Architektur** — dein privates Netzwerk, in dem EC2, RDS, Lambda-mit-VPC und fast alles andere lebt. Alle folgenden Karten dieses Kapitels sind letztlich **Türen, Straßen und Wächter dieser einen VPC**.

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Dein privates, virtuell isoliertes Netzwerk in der AWS Cloud. Hier startest du deine EC2-Instanzen und Datenbanken.

**Der absolute Prüfungs-Fokus (Sicherheit)** — der Unterschied zwischen den beiden „Firewalls" einer VPC:
- **Security Groups:** die Firewall **für deine Instanz** (z. B. einen EC2-Server). **Prüfungswort: Stateful** (zustandsbehaftet) — erlaubst du eingehenden Traffic (Inbound), wird die Antwort darauf **automatisch** hinausgelassen.
- **NACLs (Network Access Control Lists):** die Firewall **für dein gesamtes Subnetz**. **Prüfungswort: Stateless** (zustandslos) — Regeln für Inbound **UND** Outbound müssen **völlig separat** eingestellt werden.

**Zusatz-Tipp:** **VPC Peering** verbindet zwei VPCs, ist aber **nicht-transitiv**: Wenn A mit B verbunden ist und B mit C, können A und C trotzdem **nicht** direkt miteinander reden.

🛑 **Pro-Tipp SAA — was „öffentlich" und „privat" wirklich heißt:** Ein Subnetz ist **öffentlich**, wenn seine **Route Table einen Eintrag zum Internet Gateway** hat — sonst ist es **privat**. Es gibt kein „public"-Häkchen; die Route entscheidet. Zweite Nuance: Security Groups kennen **nur ALLOW**-Regeln; NACLs können auch **explizit DENY** (z. B. eine bestimmte IP aussperren). Signalwort „bestimmte IP-Adresse blockieren" → **NACL**, nicht Security Group.

---

## NAT Gateway

**Metapher / Konzept**

> Die Einwegklappe, durch die abgeschirmte Server raus ins Internet dürfen — aber von außen kommt keiner rein.

**Das Problem & Die Lösung**

In deiner VPC liegen die wichtigen Server (Datenbank, App-Server) bewusst im **privaten Subnetz** — von außen unerreichbar, genau das ist der Sicherheitssinn. Das Dilemma: Sie müssen trotzdem **raus** ins Internet (Sicherheits-Updates laden, externe API aufrufen). Normaler Internetzugang würde sie aber auch von außen erreichbar machen. Du brauchst eine Verbindung, die **nur in eine Richtung** funktioniert: raus ja, rein nein.

Ein **NAT Gateway** (Network Address Translation) sitzt im **öffentlichen Subnetz** und arbeitet als **Einweg-Vermittler**: private Server schicken Anfragen ans Gateway, es leitet sie nach außen (mit seiner eigenen öffentlichen Adresse als Absender) und reicht die Antwort zurück:
- **Ausgehend erlaubt:** Updates laden, APIs aufrufen.
- **Eingehend blockiert:** Niemand kann von außen eine Verbindung zu den privaten Servern aufbauen — nur Antworten auf selbst gestartete Anfragen kommen durch.
- **Verwaltet & hochverfügbar:** AWS betreibt es, es skaliert automatisch.

**Die wichtige Abgrenzung — nicht mit dem Internet Gateway (IGW) verwechseln:**
- **Internet Gateway** = die Tür für **öffentliche** Subnetze, Verkehr in **beide Richtungen** (Webserver, den Kunden erreichen sollen).
- **NAT Gateway** = die **Einbahnstraße** für private Subnetze: nur raus, nie rein.
- **Merksatz:** Internet Gateway = **Haustür** (rein und raus). NAT Gateway = **Katzenklappe** (nur von innen nach außen).

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „private Instanzen brauchen Internetzugang für Updates", „ausgehender Internetzugang ohne eingehende Erreichbarkeit", „private Subnetze ins Internet" → **NAT Gateway**.
- Die Killer-Abgrenzung: NAT = **nur ausgehend** (privat → Internet). IGW = **beide Richtungen** (öffentlich).
- **NAT Gateway liegt im öffentlichen Subnetz, dient aber den privaten Servern** — beliebte Detailfalle.

🛑 **Pro-Tipp SAA:** Ein NAT Gateway ist **AZ-gebunden** — für Hochverfügbarkeit stellt man **ein NAT Gateway pro AZ** auf (fällt die AZ aus, verlieren sonst alle privaten Subnetze den Ausweg). Und: NAT Gateway kostet pro Stunde **plus pro GB** — bei viel Traffic zu AWS-Diensten sind **VPC Endpoints** (nächste Karte) die günstigere und sicherere Route.

---

## VPC Endpoints

**Metapher / Konzept**

> Der direkte Privatgang zu AWS-Diensten, der den Umweg übers öffentliche Internet komplett spart.

**Das Problem & Die Lösung**

Deine privaten Server müssen z. B. auf **S3** zugreifen. Das Überraschende: Standardmäßig läuft dieser Verkehr — obwohl S3 zu AWS gehört — **über das öffentliche Internet** hinaus und wieder hinein (via NAT/Internet Gateway). Zwei Nachteile: Der Umweg kostet **Bandbreite und NAT-Gebühren**, und sicherheitsbewusste Firmen (Banken, Behörden) wollen, dass ihre Daten **das AWS-Netzwerk niemals verlassen**.

Ein **VPC Endpoint** schafft eine direkte, private Verbindung von deiner VPC zu einem AWS-Dienst — der Verkehr bleibt **komplett im AWS-Netzwerk**. Zwei Typen:
- **Gateway Endpoint:** Nur für **S3 und DynamoDB**. **Kostenlos.** Wird als Eintrag in die Routing-Tabelle gesetzt.
- **Interface Endpoint:** Für **fast alle anderen** AWS-Dienste. Technisch eine private Netzwerkkarte (ENI) mit privater IP im Subnetz (basiert auf **AWS PrivateLink**). Kostet pro Stunde.

**Vorteile:** mehr Sicherheit (Daten bleiben privat), oft günstiger (kein NAT-Umweg), geringere Latenz.

**Praxis:** Eine Bank betreibt ihre App in einer streng abgeschotteten VPC **ganz ohne Internetzugang** — trotzdem müssen Backups nach S3. Lösung: **Gateway Endpoint für S3** — Backups fließen auf direktem, privatem Weg, ohne je das Internet zu sehen. Compliance erfüllt.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „auf AWS-Dienste zugreifen ohne Internet", „privat / ohne öffentliches Internet", „Verkehr soll im AWS-Netzwerk bleiben", „PrivateLink" → **VPC Endpoint**.
- Die zwei Typen (beliebte Frage): **Gateway** Endpoint nur **S3 + DynamoDB (kostenlos)**; **Interface** Endpoint (PrivateLink) für alle anderen (kostenpflichtig).
- Kernnutzen: Daten verlassen das AWS-Netzwerk nicht → **Sicherheit + Kostenersparnis**.

---

## VPC Flow Logs

**Metapher / Konzept**

> Die Überwachungskamera, die jede Verbindung im Netzwerk protokolliert — wer mit wem, und ob's durchkam.

**Das Problem & Die Lösung**

Etwas stimmt nicht: Dein Server erreicht eine Datenbank nicht — aber warum? Blockiert eine Security Group? Eine NACL? Falsches Routing? Du tappst im Dunkeln. Oder schlimmer: Verdacht, dass ein gehackter Server heimlich Daten an einen fremden Server im Ausland funkt — aber keinerlei Aufzeichnung der tatsächlichen Verbindungen. Ohne Protokoll kannst du weder Fehler diagnostizieren noch Angriffe nachweisen.

**VPC Flow Logs** zeichnen Informationen über den **IP-Verkehr** in der VPC auf — pro Verbindung: **Quell-IP, Ziel-IP, Ports, Protokoll, Datenmenge** — und vor allem, ob der Verkehr **ACCEPTED** (durchgelassen) oder **REJECTED** (blockiert) wurde. Wichtig:
- Es werden **Metadaten** protokolliert, **nicht der Inhalt**: Du siehst, *dass* Server A mit B auf Port 443 geredet hat — nicht, *was* sie sich gesagt haben.
- Die Logs landen in **CloudWatch Logs oder S3** (analysierbar z. B. mit **Athena**!).

**Praxis — zwei Klassiker:** **Fehlersuche:** Server erreicht DB nicht → Flow Logs zeigen „REJECTED auf Port 3306" → eine Security Group/NACL blockiert den DB-Port. Gefunden. **Sicherheit:** Server kontaktiert ungewöhnlich oft eine unbekannte Auslands-IP → Hinweis auf Kompromittierung. *(Genau solche Logs nutzt **GuardDuty** — Karte 42 — automatisch zur Bedrohungserkennung!)*

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Netzwerkverkehr protokollieren/überwachen", „IP-Traffic aufzeichnen", „accepted/rejected analysieren", „Netzwerk-Fehlersuche" → **VPC Flow Logs**.
- **Abgrenzung zu CloudTrail:** CloudTrail = **API-Aufrufe** (wer hat *was in AWS getan*, z. B. „Instanz gelöscht"). Flow Logs = **Netzwerkverkehr** (wer hat *mit wem kommuniziert*). **Merksatz:** CloudTrail = Aktionen am Konto, Flow Logs = Verbindungen im Netzwerk.
- Sie erfassen **Metadaten, keinen Paketinhalt** — beliebtes Detail.

---

## AWS Netzwerk-Gateways (Übersicht)

**Metapher / Konzept**

> Die verschiedenen Tore, durch die Verkehr in und aus deinem AWS-Netzwerk fließt — jedes Tor für einen anderen Zweck.

**Das Problem & Die Lösung**

Deine VPC ist abgeschottet, aber Verkehr muss an verschiedenen Stellen rein und raus: ins Internet, zum eigenen Rechenzentrum, nur ausgehend... Die Prüfung wirft diese Gateways gern in einen Topf — du musst sie sauber auseinanderhalten:

- **Internet Gateway (IGW):** das Haupttor zum Internet für **öffentliche** Subnetze, **beide Richtungen**. Für Webserver, die Kunden erreichen sollen. *(Gegenstück: NAT Gateway = nur raus, Karte 77.)*
- **Virtual Private Gateway (VGW):** das Tor **auf der AWS-Seite** einer VPN-Verbindung (Site-to-Site VPN, Karte 81) — der VPN-Endpunkt an deiner VPC.
- **Customer Gateway (CGW):** das Gegenstück **auf der Kundenseite** — repräsentiert das physische Router-Gerät in deinem Rechenzentrum. Ein Site-to-Site VPN = **VGW (AWS-Seite) + CGW (deine Seite)**.
- **Egress-Only Internet Gateway:** wie ein NAT Gateway, aber **speziell für IPv6** — nur ausgehender Verkehr (egress = Ausgang).
- **Direct Connect Gateway:** verbindet eine Direct-Connect-Leitung (Karte 80) mit **mehreren VPCs** (auch in verschiedenen Regionen) — eine dedizierte Leitung für die gesamte AWS-Landschaft.

**⚠️ Die Prüfungs-Knackpunkte**
- **Merksatz VPN:** VGW = AWS-Seite, CGW = deine Seite.
- **Merksatz:** Egress-Only = **NAT für IPv6** (nur raus).
- IGW = beide Richtungen, NAT = nur raus — der Klassiker.

---

## AWS Transit Gateway (Der „Knotenpunkt")

**Das Konzept (deine Karte, wortgetreu):**

**Wie es wirklich funktioniert:** Früher musstest du **VPC Peering** nutzen. Bei 3 VPCs brauchst du 3 Verbindungen. Bei **100 VPCs plötzlich 4.950**! Kommt das lokale Rechenzentrum per VPN dazu, bricht das Chaos aus — die Routing-Tabellen werden zum Albtraum (**„Spaghetti-Routing"**).

Das **Transit Gateway** löst dieses **O(n²)-Problem**: ein zentraler, hochskalierbarer **Router (Layer 3)**. Jede VPC, jedes VPN und jede Direct-Connect-Leitung baut **genau eine** Verbindung zum Transit Gateway auf, das zentral alle Routing-Tabellen verwaltet (**wie eine Telefonzentrale**).

**Partner/Praxis:** **Palo Alto / Fortinet / Cisco** — man schickt den gesamten Traffic vom Transit Gateway durch eine zentrale VPC mit einer Firewall, die alles auf Viren scannt, bevor er weitergeht. **Großkonzerne (Siemens, Volkswagen)** — Hunderte Entwicklerteams mit eigenen VPCs; das Transit Gateway hält das gigantische Netz zusammen.

🛑 **Pro-Tipp SAA:** Signalwort-Abgrenzung: **2–3 VPCs verbinden** → VPC Peering (einfach, günstig, aber nicht-transitiv). **Viele VPCs + On-Premises, zentral & transitiv** → **Transit Gateway**. Sobald „Hub-and-Spoke", „Dutzende VPCs" oder „zentrale Netzwerk-Verwaltung" fällt → Transit Gateway.

---

## AWS PrivateLink (Der „Geheimgang")

**Das Konzept (deine Karte, wortgetreu):**

**Wie es wirklich funktioniert:** Deine App in der geschützten VPC muss Daten von einem **Drittanbieter-Service (SaaS)** abrufen. Normalerweise bräuchtest du ein Internet Gateway, und die Daten würden das geschützte AWS-Netzwerk kurz verlassen — ein Sicherheitsrisiko.

**PrivateLink** ermöglicht eine völlig **private, unidirektionale** (nur in eine Richtung initiierbare) Verbindung: Es erstellt einen **VPC Endpoint** direkt in deinem Subnetz, der wie eine lokale IP-Adresse aussieht, den Traffic aber **unterirdisch über das AWS-Backbone** zur VPC des Anbieters leitet. Niemand — auch nicht das öffentliche Internet — kann diesen Datenfluss sehen oder abfangen.

**Partner/Praxis:** **Datadog / Splunk / MongoDB Atlas / Snowflake** — die klassischen PrivateLink-Partner. Bei Snowflake stellst du sicher, dass hochsensible Finanzdaten auf dem Weg von deiner VPC **niemals das öffentliche Internet berühren**. Ein Segen für Compliance-Audits.

*(🛑 Querverweis: Technisch ist der **Interface Endpoint** aus Karte 78 genau das — PrivateLink ist die Technologie dahinter. Karte 78 = Zugriff auf **AWS-Dienste**, diese Karte = Zugriff auf **Drittanbieter/eigene Services**. Gleiche Technik, zwei Einsatzfälle.)*

---

## AWS Direct Connect

**Metapher / Konzept**

> Die eigene, fest verlegte Privatbahn vom Firmen-Rechenzentrum direkt zu AWS — komplett am öffentlichen Internet vorbei.

**Das Problem & Die Lösung**

Ein Hybrid-Setup: Teile im eigenen Rechenzentrum, Teile in AWS, ständiger Austausch großer Datenmengen. Normalerweise per **VPN über das öffentliche Internet** — aber das Internet ist ein **geteilter Weg**: Geschwindigkeit schwankt, Latenz mal gut, mal schlecht. Für eine Bank oder ein Krankenhaus mit Bedarf an **konstanter, vorhersehbarer Bandbreite** (Echtzeit-DB-Replikation) ist „mal schnell, mal langsam" inakzeptabel. Und hochsensible Daten übers öffentliche Internet fühlen sich unsicher an.

**Direct Connect** ist eine **dedizierte, physische Netzwerkverbindung** zwischen Firmen-RZ und AWS — eine echte eigene Leitung, die das Internet **komplett umgeht**:
- **Konstante, vorhersehbare Performance** (keine Schwankungen, stabile niedrige Latenz).
- **Hohe Bandbreite** für große, dauerhafte Datenmengen.
- **Mehr Sicherheit** (nie übers öffentliche Internet).
- Oft **günstiger bei sehr großem konstantem Volumen** (geringere Transferkosten).
- **Der Haken:** Einrichtung dauert **Wochen bis Monate** und ist teurer — kein „heute aktivieren"-Dienst.

**Die wichtige Abgrenzung — Direct Connect vs. Site-to-Site VPN (der ständige Prüfungsvergleich):**
- **Site-to-Site VPN** = verschlüsselte Verbindung **über das Internet**. Schnell eingerichtet, günstig, aber schwankend.
- **Direct Connect** = eigene physische Leitung, am Internet vorbei. Stabil, schnell, sicher — teurer, einrichtungsintensiv.
- **Merksatz:** VPN = **Tunnel durch die öffentliche Autobahn**. Direct Connect = **deine eigene Privatstraße**.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „dedizierte/private Verbindung", „konsistente/vorhersehbare Bandbreite", „nicht über das öffentliche Internet", „hohe stabile Performance zum eigenen RZ" → **Direct Connect**.
- „Kostengünstig und schnell eingerichtet" → **VPN**. „Konsistente Performance / dedizierte Leitung / Internet meiden" → **Direct Connect**.
- Beide dienen dem **Hybrid-Cloud-Szenario**.

> **🧠 Mini-Merkkasten Netzwerk-Block (wortgetreu):** Internet Gateway (beide Richtungen, öffentlich) ↔ NAT Gateway (nur raus, privat) · VPN (über Internet, günstig, schwankend) ↔ Direct Connect (eigene Leitung, stabil, teuer) · CloudTrail (API-Aktionen) ↔ VPC Flow Logs (Netzwerkverbindungen).

---

## AWS Site-to-Site VPN

**Metapher / Konzept**

> Der verschlüsselte Geheimtunnel, der dein Firmen-Rechenzentrum schnell und günstig mit AWS verbindet — durch das öffentliche Internet hindurch.

**Das Problem & Die Lösung**

Hybrid-Setup: eigenes RZ + VPC in AWS, beide müssen kommunizieren (Server im Keller ↔ Datenbank in AWS). Offen über das Internet könnte jeder mithören. Du brauchst eine **sichere, verschlüsselte** Verbindung — **schnell und ohne große Kosten**, nicht jede Firma kann monatelang auf eine physische Leitung warten.

**Site-to-Site VPN** baut einen **verschlüsselten Tunnel über das öffentliche Internet** zwischen RZ und VPC:
- **Schnell eingerichtet:** in Minuten bis Stunden startklar.
- **Günstig:** nutzt das vorhandene Internet.
- **Verschlüsselt & sicher (IPsec).**
- **Der Haken:** übers öffentliche Internet → **Performance schwankt** (Latenz/Geschwindigkeit nicht garantiert).

**Die zentrale Abgrenzung** — der direkte Gegenspieler von Direct Connect (Karte 80): **Merksatz:** VPN = der Geheimtunnel durch die öffentliche Autobahn (sofort nutzbar). Direct Connect = die eigene Privatstraße (muss erst gebaut werden). **Profi-Setup:** Viele Firmen nutzen ein VPN als **günstiges Backup** für ihre Direct-Connect-Leitung.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „verschlüsselte Verbindung zum Rechenzentrum", „schnell/günstig einzurichten", „sichere Verbindung über das Internet", „Hybrid-Cloud" → **Site-to-Site VPN**.
- VPN vs. Direct Connect: „schnell & kostengünstig, über Internet" → VPN. „dediziert, konsistent, Internet meiden" → Direct Connect.
- **VPN ist verschlüsselt — Direct Connect alleine ist es nicht** (kann aber mit VPN kombiniert werden). Beliebtes Detail.

---

## AWS Client VPN

**Metapher / Konzept**

> Das persönliche VPN-Ticket für jeden einzelnen Mitarbeiter, mit dem er sich von seinem Laptop aus sicher ins AWS-Netzwerk einwählt.

**Das Problem & Die Lösung**

Deine Ressourcen liegen in privaten Subnetzen — bewusst unerreichbar. Aber **einzelne Mitarbeiter im Homeoffice** sollen auf interne Dinge zugreifen (interne App, DB, Dev-Server). Ins Internet stellen? Sicherheit! Und **Site-to-Site VPN passt nicht**: Das verbindet ein **ganzes Standort-Netzwerk** mit AWS — nicht den einzelnen Laptop vom Sofa oder Café aus.

**AWS Client VPN** ist ein verwalteter VPN-Dienst **für einzelne Endgeräte/Nutzer**: Jeder installiert einen VPN-Client auf dem Laptop und baut eine sichere, verschlüsselte Verbindung direkt in die VPC — als säße er im Firmennetz:
- **Pro Nutzer/Gerät** (Remote Access VPN) — ideal für Homeoffice/verteilte Teams.
- **Zugriff auf private Ressourcen** (und optional das verbundene On-Premises-Netz), ohne sie öffentlich zu machen.
- **Authentifizierung:** Active Directory oder Zertifikate; verwaltet und skalierbar.

**Die Killer-Frage — Client VPN vs. Site-to-Site VPN:** **Client VPN** = einzelne Nutzer/Geräte wählen sich ein („ein VPN-Ticket pro Person"). **Site-to-Site VPN** = verbindet ein ganzes Netzwerk/Standort („eine Standleitung zwischen zwei Netzen"). **Merksatz:** Client VPN = einzelner Mitarbeiter von unterwegs. Site-to-Site = ganzes Büro-Netzwerk.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „einzelne Nutzer/Mitarbeiter", „Remote/Homeoffice", „vom Laptop sicher auf AWS-Ressourcen", „Remote Access VPN" → **Client VPN**.
- Einzelne Personen/Geräte → Client VPN. Ganzes Standort-Netzwerk → Site-to-Site VPN.

---

## AWS Verified Access (Der „sichere Zugang")

**Das Konzept (deine Karte, wortgetreu):**

**Wie es wirklich funktioniert:** Das klassische VPN ist wie eine **Burg mit einem dicken Tor** (dem Passwort) — einmal durch, bewegt man sich relativ frei. Stiehlt ein Hacker das VPN-Passwort, hat er Zugang zum internen Netz.

**Verified Access** setzt auf **„Zero Trust"** (Vertrauen ist gut, ständige Kontrolle ist besser): kein dickes VPN-Tor, sondern **jede einzelne Anfrage** wird live geprüft — nicht nur „Stimmt das Passwort?" (**Identity**), sondern parallel: „Von welchem Gerät? Firmen-Laptop? Virenscanner aktuell?" (**Device Posture**). Nur wenn alles stimmt, gibt es Zugriff.

**Partner/Praxis:** **CrowdStrike / Jamf / Okta** — Okta prüft die Identität (Passwort & MFA), CrowdStrike/Jamf melden live vom Laptop „Gerät ist sicher". AWS wertet die Signale aus und entscheidet. Echtes **„Arbeiten von überall" ohne VPN-Tunnel**.

🛑 **Pro-Tipp SAA:** Signalwort **„Zero Trust"** oder „Zugriff auf interne Apps **ohne VPN**, pro Anfrage geprüft" → **Verified Access**. Abgrenzung: Client VPN = klassischer Tunnel pro Person; Verified Access = VPN-los, jede Anfrage einzeln bewertet.

---

## AWS Network Firewall

**Metapher / Konzept**

> Die programmierbare Schutzmauer, die den gesamten Verkehr deiner VPC nach eigenen Regeln filtert.

**Das Problem & Die Lösung**

Security Groups (pro Instanz) und NACLs (pro Subnetz) sind gut, aber **begrenzt**: Sie filtern im Wesentlichen nach IP/Port. Was, wenn eine Bank fordert: „Blockiere alle bekannten bösartigen Webseiten", „verhindere Eindringversuche (Intrusion)", „erlaube nur Verkehr zu bestimmten Domains"? Solche tiefen, intelligenten Regeln über die ganze VPC können Security Groups nicht leisten.

**AWS Network Firewall** ist ein verwalteter, hochentwickelter Firewall-Dienst **für die gesamte VPC**:
- **Intrusion Prevention (IPS):** erkennt und blockiert aktiv Angriffsmuster.
- **Domain-Filterung:** „Nur Verkehr zu *.meinefirma.de" oder Sperren bekannter Schad-Domains.
- **Tiefe Verkehrsinspektion:** untersucht den **Inhalt**, nicht nur Absender/Port.
- **Zentral & skalierbar:** schützt die ganze VPC an einer Stelle, hochverfügbar verwaltet.

**Die drei Firewall-Ebenen auseinanderhalten:**
- **Security Group** = Wächter pro **Instanz** (einfach, IP/Port, stateful).
- **Network ACL** = Wächter pro **Subnetz** (einfach, IP/Port, stateless).
- **Network Firewall** = mächtige Mauer für die **ganze VPC** (komplexe Regeln, IPS, Domain-Filter).
- Und nicht mit der **WAF** (Karte 40) verwechseln: WAF schützt **Webanwendungen** vor SQL-Injection/XSS (**Layer 7, HTTP**); Network Firewall schützt das **gesamte VPC-Netzwerk** auf Netzwerkebene.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „VPC-weite Firewall", „Intrusion Prevention", „komplexe Filterregeln fürs Netzwerk", „Domain-Filterung", „gesamten VPC-Verkehr inspizieren" → **Network Firewall**.
- Einzelne Instanz → **Security Group**. Ganze VPC, anspruchsvolle Regeln → **Network Firewall**. Webanwendung (SQLi/XSS) → **WAF**. DDoS → **Shield**.

---

## Elastic Load Balancing (ELB)

**Architektonische Einordnung**

Der ELB ist die **Verteilerschicht** jeder skalierenden Architektur und bildet mit **Auto Scaling Group + CloudWatch** das Standard-Trio für Hochverfügbarkeit (siehe Compute-Kapitel). Er ist außerdem der **Health-Check-Geber**: meldet er eine Instanz „unhealthy", ersetzt die ASG sie.

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Der **„Verkehrspolizist"**, der eingehenden Traffic automatisch auf mehrere Server verteilt, damit kein einzelner überlastet wird. Sorgt für **hohe Verfügbarkeit**.

**Der Prüfungs-Fokus — die Load-Balancer-Typen:**
- **Application Load Balancer (ALB):** **Layer 7 (HTTP/HTTPS)**. „Intelligent" — leitet Traffic basierend auf dem **Inhalt** der Anfrage (z. B. `/bilder` zu anderen Servern als `/video`).
- **Network Load Balancer (NLB):** **Layer 4 (TCP/UDP)**. Auf **extreme Performance und geringste Latenz** ausgelegt. **Signalwort:** „Millionen Anfragen pro Sekunde" oder **„statische IP-Adresse"** → NLB.
- **Gateway Load Balancer (GWLB):** bindet **Firewalls von Drittanbietern** tief ins Netzwerk ein. Taucht im Practitioner selten auf.

🛑 **Pro-Tipp SAA — die Details, die Fragen entscheiden:**
- **Sticky Sessions** (Session Affinity): der ALB kann einen Nutzer per Cookie immer an **dieselbe** Instanz binden — Signalwort „Nutzer verliert Session-Daten beim Serverwechsel".
- **Pfad-/Host-basiertes Routing** ist ALB-exklusiv: `/api` → Target Group A, `shop.example.com` → Target Group B. Signalwort „Microservices hinter einem Load Balancer" → ALB.
- **NLB** kann pro AZ eine **Elastic IP** tragen — der einzige LB mit fester IP (Whitelisting-Szenarien!). ALB hat nur einen DNS-Namen.
- **Classic Load Balancer (CLB)** ist Legacy — in neuen Fragen praktisch nie die richtige Antwort.
- ELB verteilt standardmäßig **über mehrere AZs** (Cross-Zone) — das ist der HA-Kern.

---

## Amazon Route 53

**Architektonische Einordnung**

Route 53 ist der **globale Eingang** jeder Architektur — die DNS-Ebene *vor* CloudFront/ELB. Mit **Health Checks + Routing-Policies** ist es zugleich das wichtigste Werkzeug für **regionsübergreifendes Failover** (Disaster Recovery).

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Der hochverfügbare **DNS-Webservice** von AWS — übersetzt Namen wie `www.deine-website.de` in IP-Adressen. *(Heißt Route 53, weil DNS über **Port 53** läuft.)*

**Der Prüfungs-Fokus — Routing-Richtlinien:**
- **Failover Routing:** für **Disaster Recovery (Aktiv/Passiv)** — fällt der Hauptserver aus (Health Check schlägt fehl), leitet Route 53 automatisch auf Ersatz um.
- **Latency Routing:** leitet zur AWS-Region mit der **schnellsten Antwortzeit** für den Nutzer.
- **Weighted Routing:** Traffic **prozentual** verteilen (20 % Server A, 80 % Server B) — perfekt für **A/B-Tests** neuer Versionen.
- **Geolocation Routing:** basiert auf **Land/Kontinent** des Nutzers („alle Nutzer aus Deutschland → deutsche Seite").

🛑 **Pro-Tipp SAA — die vollständige Liste (verifiziert, 8 Policies):** Zusätzlich zu deinen vier:
- **Simple:** ein Record, keine Health Checks — der Basisfall.
- **Multivalue Answer:** antwortet mit **bis zu 8 zufälligen gesunden** Records — „DNS-Load-Balancing für Arme" mit Health Checks.
- **Geoproximity:** wie Geolocation, aber mit **Bias** — du kannst den Einzugsbereich einer Ressource künstlich vergrößern/verkleinern („schiebe 20 % der EU-Nutzer nach us-east-1"). Signalwort „Traffic zwischen Standorten **verschieben**".
- **IP-based:** Routing anhand der **Quell-IP-Bereiche** der Nutzer (z. B. bekannte ISP-Ranges gezielt lenken).

🛑 **Pro-Tipp SAA — Alias Records (der Klassiker):** Ein **Alias** zeigt direkt auf eine AWS-Ressource (ELB, CloudFront, S3-Website) statt auf eine IP. Vorteile gegenüber CNAME: funktioniert auch am **Zone Apex** (`example.com` ohne www — CNAME dort verboten!) und Alias-Abfragen sind **kostenlos**. Signalwort „Root-Domain auf einen Load Balancer zeigen" → **Alias Record**.

---

## Amazon CloudFront

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Das **CDN (Content Delivery Network)** von AWS — speichert Daten (Bilder, Videos, statische Webseiten) **weltweit zwischen**.

**Der Prüfungs-Fokus:**
- **Edge Locations:** **DAS absolute Signalwort** für CloudFront. Hunderte Standorte weltweit cachen Inhalte extrem nah am Endnutzer.
- **Typische Prüfungsfrage:** „Nutzer in Australien beschweren sich über hohe Ladezeiten der in Europa gehosteten Website. Welcher Service hilft?" → **CloudFront**, weil es die Latenz global massiv senkt.
- Schützt in Kombination mit **AWS Shield** hervorragend gegen **DDoS-Angriffe**.

---

## CloudFront – OAC, OAI, Lambda@Edge, Functions & SNI

**Die fünf Vertiefungs-Features (deine Karte, wortgetreu):**

- **OAI (Origin Access Identity):** der **ältere** Weg, einen S3-Bucket so abzusichern, dass er **nur über CloudFront** erreichbar ist — niemand umgeht das CDN.
- **OAC (Origin Access Control):** der **neue, empfohlene Nachfolger**. Gleicher Zweck, aber moderner: alle Regionen, **SSE-KMS-verschlüsselte Buckets**, mehr HTTP-Methoden. **Merksatz: Bei neuen Setups OAC statt OAI.**
- **Lambda@Edge:** Lambda-Funktionen laufen **direkt an den Edge-Standorten** — Code nah beim Nutzer. Für komplexere Logik: Anfragen/Antworten umschreiben, A/B-Tests, Authentifizierung, Personalisierung. Node.js/Python, mehr Leistung/Laufzeit.
- **CloudFront Functions:** leichtgewichtige Mini-Skripte (**nur JavaScript**) für sehr einfache, **ultraschnelle** Aufgaben am Edge: Header manipulieren, URL-Rewrites, Redirects, Token-Prüfung. Noch schneller und **billiger** als Lambda@Edge — aber nur für simple Dinge. **Abgrenzung:** einfach/schnell → CloudFront Functions; komplex → Lambda@Edge.
- **SNI (Server Name Indication):** erlaubt **mehrere HTTPS-Websites (verschiedene SSL-Zertifikate) über dieselbe IP**. Der Browser sagt beim Verbindungsaufbau, welche Domain er will → das richtige Zertifikat wird präsentiert. Spart IPs und Kosten.

**⚠️ Prüfungs-Knackpunkte**
- S3 nur über CloudFront zugänglich → **OAC** (neu) bzw. OAI (alt). Bei Neubau **OAC**.
- Einfaches am Edge (Header, Redirects, Rewrites) → **CloudFront Functions** (nur JS).
- Komplexere Logik am Edge (Auth, Personalisierung) → **Lambda@Edge**.
- Mehrere HTTPS-Zertifikate auf einer IP → **SNI**.
- **Merksatz Edge-Code:** Functions = leicht & ultraschnell (simpel); Lambda@Edge = mächtiger (komplex).

> *🧠 Der „Mini-Merkkasten dieser vier Sammelkarten" des Originals war eine eingebettete Tabelle in Pages und ist als Text nicht extrahierbar (nur `￼`-Platzhalter) — die Inhalte der vier Karten sind oben vollständig erhalten.*

---

## AWS Global Accelerator (Die „Schnellstraße")

**Das Konzept (deine Karte, wortgetreu):**

**Wie es wirklich funktioniert:** Das Internet basiert auf dem **Border Gateway Protocol (BGP)** — es sucht oft nicht den schnellsten, sondern den **billigsten** Weg zwischen Providern (Telekom, Vodafone, AT&T ...). Ein Datenpaket hüpft zigmal hin und her → Latenz und Störungen.

AWS besitzt eines der größten **privaten Glasfasernetzwerke** der Welt. Global Accelerator dreht den Spieß um: Er fängt den Traffic am **weltweit nächsten AWS-Edge-Standort** ab — ab da wandern die Daten nicht mehr über das öffentliche Chaos-Internet, sondern schießen **direkt über das optimierte private AWS-Netz** zur Anwendung.

**Der Anycast-Trick:** Du bekommst **zwei feste IP-Adressen**, die **„überall gleichzeitig"** an den Edge-Standorten existieren. Ein Nutzer in Tokio sendet an 1.2.3.4 und landet in Tokio; ein Nutzer in Berlin sendet an dieselbe 1.2.3.4 und landet in Frankfurt.

**Partner/Praxis:** **Gaming (Epic/Riot):** bei Multiplayer zählt jede Millisekunde (Ping) — Global Accelerator stabilisiert die Verbindung drastisch. **Skyscanner:** leitet Flugsuchanfragen global extrem schnell an die Backend-Server.

🛑 **Pro-Tipp SAA — die Killer-Abgrenzung CloudFront vs. Global Accelerator:**

| | **CloudFront** | **Global Accelerator** |
|---|---|---|
| Prinzip | **cached Inhalte** am Edge | **beschleunigt den Weg** zum Origin (kein Cache) |
| Protokolle | HTTP/HTTPS | **TCP + UDP** (auch Gaming, VoIP, MQTT) |
| IPs | wechselnde Edge-IPs (DNS) | **2 feste statische Anycast-IPs** |
| Ideal für | statische/cachebare Inhalte, Websites, Videos | **nicht-cachebare** Anwendungen, APIs, Gaming, schnelles **regionales Failover** |

Signalwort „statische IP-Adressen + globale Beschleunigung" oder „UDP/Gaming" → **Global Accelerator**. „Inhalte cachen / statische Website weltweit" → **CloudFront**.

---

*Ende Kapitel 5 — Netzwerk & Content Delivery.*
