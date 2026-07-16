---
service: AWS Directory Service
seedKey: saa-c03-script-directory-service
batch: B5
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/whitepapers/latest/active-directory-domain-services/directory-services-options-in-aws.html
  - https://aws.amazon.com/directoryservice/other-directories/
  - https://docs.aws.amazon.com/directoryservice/latest/admin-guide/directory_simple_ad.html
status: draft
---

# AWS Directory Service

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Directory Service bringt **Microsoft Active Directory** in die Cloud — als Managed Service. AD ist das Verzeichnis, gegen das sich Windows-Workloads, WorkSpaces, FSx und RDS-SQL-Windows authentifizieren. Kernvariante: **AWS Managed Microsoft AD** (echtes AD, von AWS betrieben).

Der SAA testet fast ausschließlich **die Wahl zwischen den drei Varianten** — Managed Microsoft AD, AD Connector, Simple AD — anhand harter Ausschlusskriterien.

---

## 🎯 SAA-Vertiefung

### Die drei Varianten und ihre Ausschlusskriterien

**Das Problem:** „Ein Unternehmen mit bestehendem on-prem AD will Workload X in AWS betreiben." Je nach Detail ist die richtige Directory-Variante eine andere — und die falsche scheitert an einem konkreten technischen Ausschluss.

**Die Lösung — die drei Varianten, an ihren Grenzen unterschieden:**

| | **AWS Managed Microsoft AD** | **AD Connector** | **Simple AD** |
|---|---|---|---|
| Was es ist | echtes MS AD in AWS | **Proxy** zum on-prem AD | Samba (AD-kompatibel) |
| Verzeichnisdaten in der Cloud? | **ja** (eigenes AD) | **nein** (nur Weiterleitung) | ja (eigenständig) |
| Trust zu on-prem AD? | **ja** | n/a (nutzt on-prem direkt) | **nein** |
| RDS SQL Server / FSx Windows? | **ja** | **nein** | **nein** |
| MFA? | ja | ja (via RADIUS) | **nein** |
| Typische Größe | >5.000 Nutzer, Enterprise | bestehendes on-prem AD | klein, standalone |

Daraus fallen die Entscheidungen fast mechanisch:
- **Trust zu on-prem AD nötig, oder >5.000 Nutzer, oder RDS SQL Server / FSx for Windows** → **AWS Managed Microsoft AD** (die einzige Variante, die echtes AD mit Trusts und RDS-SQL-Support bietet).
- **On-prem AD soll die maßgebliche Quelle bleiben, keine Nutzerdaten in der Cloud** → **AD Connector** (ein reiner Durchreicher — Authentifizierung passiert weiter on-prem, Security-Policies gelten dort).
- **Klein, günstig, standalone, keine echten AD-Features nötig** → **Simple AD**.

Die beiden schärfsten Distraktor-Fallen: **AD Connector und Simple AD können kein RDS SQL Server / FSx for Windows** — steht das im Szenario, bleibt nur Managed Microsoft AD. Und **Simple AD kann keine Trust-Beziehungen und kein MFA** — „Vertrauensstellung zum Firmen-AD" schließt Simple AD sofort aus.

> **💡 Merksatz:** **Trust / >5.000 User / RDS-SQL / FSx → Managed Microsoft AD.** On-prem bleibt Quelle → **AD Connector** (Proxy, keine Cloud-Daten). Klein & standalone → **Simple AD** (kein Trust, kein MFA, kein RDS-SQL).

### Der AD Connector im Detail: Ein Fenster, kein Lager

**Das Problem:** Compliance verlangt, dass **keine** Nutzer-/Passwortdaten in der Cloud gespeichert werden — die Identitäten müssen physisch im eigenen Rechenzentrum bleiben. Trotzdem sollen AWS-Dienste wie WorkSpaces gegen das Firmen-AD authentifizieren.

**Die Lösung:** Der **AD Connector** ist genau dafür gebaut: Er ist ein **Directory-Gateway/Proxy**, das Authentifizierungsanfragen **an das on-prem AD durchreicht** — er **speichert und cached keine Verzeichnisdaten**. Die Nutzer werden weiterhin ausschließlich on-prem verwaltet, on-prem-Passwort-Policies und MFA (via RADIUS) gelten unverändert. Es ist ein **Fenster** zum bestehenden AD, kein zweites **Lager**. Das ist das Signalwort-Muster „bestehende AD-Nutzer, Daten bleiben on-prem" — und der Grund, warum hier weder Managed AD (würde ein zweites Verzeichnis hosten) noch Simple AD (eigenständig) passt.

> **💡 Merksatz:** **AD Connector = Proxy/Fenster zum on-prem AD, speichert nichts in der Cloud.** „Daten müssen on-prem bleiben, trotzdem AWS-Auth" → AD Connector.

### Die Integrationen — wofür man AD überhaupt braucht

Directory Service ist selten Selbstzweck; es ist die Auth-Grundlage für andere Dienste. Managed Microsoft AD integriert mit **WorkSpaces** (virtuelle Desktops mit Firmen-Login), **Amazon RDS** (SQL Server / auch PostgreSQL/MySQL mit Kerberos), **FSx for Windows** (Dateifreigaben mit NTFS-Rechten) und **IAM Identity Center** (AD als Identity Source für SSO). Wenn eine Frage „Windows-Dateiserver mit AD-Berechtigungen" oder „RDS SQL Server mit Windows-Authentifizierung" nennt, ist im Hintergrund fast immer **Managed Microsoft AD** die notwendige Zutat.

🛑 Aktualität: **Simple AD nimmt ab dem 30. Juli 2026 keine Neukunden mehr an** (Bestandskunden behalten es). Für neue Architekturen wandert die Standardempfehlung damit zu Managed Microsoft AD — bei „klein & günstig"-Fragen bleibt Simple AD aber die vom Prüfungsguide vorgesehene Antwort, solange sie gestellt wird.

> **💡 Merksatz:** AD ist die Auth-Basis für **WorkSpaces, RDS SQL (Windows Auth), FSx Windows, Identity Center**. „RDS SQL Windows Auth / FSx Windows" → **Managed Microsoft AD** ist Pflichtzutat.

---

## ⚠️ Prüfungs-Knackpunkte

- **Managed Microsoft AD:** echtes AD, **Trusts**, RDS SQL Server, FSx Windows, MFA, >5.000 Nutzer, Multi-Region (Enterprise).
- **AD Connector:** **Proxy** zum on-prem AD, **keine Cloud-Daten**, **kein RDS SQL / FSx Windows**; „Daten bleiben on-prem".
- **Simple AD:** Samba, klein/günstig, **kein Trust, kein MFA, kein RDS SQL**.
- Entscheidungsreflex: **Trust/>5.000/RDS-SQL/FSx → Managed AD** · on-prem-Quelle → **AD Connector** · klein → **Simple AD**.
- Integrationen: WorkSpaces, RDS, FSx for Windows, **IAM Identity Center** (AD als Identity Source).
- 🛑 **Simple AD: keine Neukunden ab 30.07.2026** (Bestand bleibt).

## 💡 Der eine Satz zum Mitnehmen

**Die Directory-Frage entscheidet sich an Ausschlusskriterien: Sobald Trust, >5.000 Nutzer, RDS SQL Server oder FSx for Windows fallen, kann es nur Managed Microsoft AD sein — „Daten bleiben on-prem" zeigt auf den AD Connector, und „klein & günstig" auf Simple AD.**
