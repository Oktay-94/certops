---
service: AWS Client VPN
seedKey: saa-c03-script-client-vpn
batch: B4
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/what-is.html
  - https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/split-tunnel-vpn.html
status: draft
---

# AWS Client VPN

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Client VPN = der **verschlüsselte Zugang für einzelne Menschen**: Remote-Mitarbeiter verbinden sich per **OpenVPN-Client** vom Laptop in die VPC (und von dort optional weiter ins Firmennetz). Managed und elastisch — im Gegensatz zum selbst betriebenen VPN-Server. Abgrenzung: **Site-to-Site = Standorte, Client VPN = Personen.**

Der SAA vertieft drei Punkte: **die Authentifizierungs-Optionen, die Split-Tunnel-Kostenfalle — und wann Client VPN der Overkill-Distraktor ist.**

---

## 🎯 SAA-Vertiefung

### Wer darf rein? Drei Authentifizierungs-Wege

**Das Problem:** „Die Remote-Mitarbeiter sollen sich mit ihren **bestehenden Firmen-Logins** verbinden — keine neuen Passwörter, und beim Ausscheiden soll der Zugang automatisch erlöschen."

**Die Lösung:** Client VPN authentifiziert auf drei Wegen — das Szenario-Signalwort wählt aus:
- **Active Directory** (via AWS Directory Service, auch mit on-prem-AD verbunden): „bestehende AD-Konten" → dieser Weg. Konto deaktiviert = Zugang weg.
- **SAML 2.0 / Federated** (IAM Identity Center oder externer IdP wie Okta/Entra): „Single Sign-On", „bestehender Identity Provider" → SAML. Bonus: MFA kommt vom IdP gleich mit.
- **Mutual Certificate Authentication:** jedes Gerät bekommt ein Client-Zertifikat (ACM) — „nur verwaltete Geräte, keine Nutzerinteraktion", auch für Maschinen-zu-Cloud.

Die Wege sind kombinierbar (Zertifikat **plus** AD/SAML). Danach steuern **Authorization Rules**, *wohin* ein Nutzer darf — z. B. Entwickler nur ins Dev-Subnetz, Admins überallhin (gruppenbasiert via AD/SAML-Gruppen). Das ist Least Privilege auf VPN-Ebene und ein eigener Fragetyp: „Verschiedene Nutzergruppen sollen verschiedene Subnetze erreichen" → **Authorization Rules**, nicht Security Groups.

> **💡 Merksatz:** **AD = Firmen-Login · SAML = SSO/IdP · Mutual Cert = Geräte statt Menschen.** Wer wohin darf → **Authorization Rules** (gruppenbasiert).

### Split-Tunnel: Warum der ganze Netflix-Traffic durch AWS lief

**Das Problem:** Nach dem Client-VPN-Rollout explodieren die Datentransferkosten — und Nutzer klagen, dass „das Internet langsam" sei, sobald das VPN an ist. Was ist passiert?

**Die Lösung:** Per Default ist Client VPN ein **Full-Tunnel**: **Sämtlicher** Traffic des Laptops — auch YouTube, Windows-Updates, private Cloud-Speicher — läuft durch den Tunnel, durch die VPC und über deren NAT wieder hinaus. AWS kassiert für jeden Umweg-Gigabyte, und die Latenz leidet.

Die Antwort heißt **Split-Tunnel**: Nur die Routen der Endpoint-Route-Table (also die Firmen-/VPC-Netze) gehen durch den Tunnel — der Rest nimmt den normalen Internetweg des Nutzers. Ergebnis: weniger Kosten, bessere Performance, kleinerer Blast-Radius. Full-Tunnel bleibt richtig, wenn die Compliance **allen** Traffic inspizieren will.

Zur Kapazität: 🔴 Pro Nutzerverbindung gilt eine Baseline von **50 Mbps** — der in altem Material kursierende 10-Mbps-Wert ist veraltet.

> **💡 Merksatz:** **Default = Full-Tunnel (alles durch AWS = Kosten + Latenz).** „VPN-Kosten senken / nur Firmentraffic durch den Tunnel" → **Split-Tunnel aktivieren**.

### Wann Client VPN der falsche Hammer ist

**Das Problem:** „Drei Admins brauchen gelegentlich Shell-Zugriff auf private EC2-Instanzen." Client VPN würde funktionieren — ist aber die teuerste und schwerste Antwort.

**Die Lösung — die Staffelung nach Bedarf:**
- **Nur Shell/Session-Zugriff auf Instanzen** → **SSM Session Manager**: kein VPN, kein Bastion, kein offener Port, IAM-gesteuert, CloudTrail-protokolliert. Der moderne Bastion-Ersatz und bei „Admin-Zugriff" fast immer die schlankere Antwort.
- **Voller Netzwerkzugriff auf viele private Ressourcen** (interne Web-Apps, Datei-Shares, Datenbanken vom Laptop) → **Client VPN**.
- **Ganze Standorte/Netzwerke** verbinden → **Site-to-Site VPN**.

Wichtig fürs Erkennen: Client VPN skaliert elastisch mit den Nutzern und wird **pro aktiver Verbindung + pro Stunde** abgerechnet — bei „hunderte Mitarbeiter im Homeoffice" die richtige Wahl, bei „drei Admins ab und zu" der Overkill-Distraktor.

> **💡 Merksatz:** **Shell-Zugriff → Session Manager · Netzwerkzugriff für Menschen → Client VPN · Netzwerke verbinden → Site-to-Site.** Client VPN ist die Antwort für die Belegschaft, nicht für drei Admins.

---

## ⚠️ Prüfungs-Knackpunkte

- **OpenVPN-basiert**, managed, elastisch; Personen statt Standorte.
- Auth: **Active Directory** (Directory Service), **SAML 2.0/SSO** (IdP, MFA inklusive), **Mutual Certificate** (Geräte) — kombinierbar.
- Zugriffssteuerung nach Gruppen → **Authorization Rules** (wer erreicht welches Netz).
- **Default Full-Tunnel** → Kosten-/Latenzfalle; „nur Firmentraffic durchs VPN" → **Split-Tunnel**.
- 🔴 **50 Mbps Baseline pro Nutzerverbindung** (10 Mbps = veralteter Wert).
- Abgrenzung: **Session Manager** (nur Shell, kein VPN nötig) · **Client VPN** (Netzwerkzugriff für Nutzer) · **Site-to-Site** (Standorte).
- Abrechnung pro Endpoint-Assoziation + aktiver Verbindung/Stunde → bei wenigen Admins Overkill.

## 💡 Der eine Satz zum Mitnehmen

**Client VPN ist der managed Heimarbeiter-Tunnel** — die Prüfung testet fast immer eines von dreien: welcher Auth-Weg zum Szenario passt, dass Split-Tunnel die Kostenfalle des Full-Tunnel-Defaults löst, und dass für bloßen Admin-Shell-Zugriff der Session Manager die schlankere Antwort ist.
