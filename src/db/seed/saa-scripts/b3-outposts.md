---
service: AWS Outposts
seedKey: saa-c03-script-outposts
batch: B3
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html
  - https://aws.amazon.com/outposts/rack/features/
status: draft
---

# AWS Outposts

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Outposts = **ein Stück echtes AWS-Rechenzentrum bei dir im Keller**: AWS liefert seine eigene Hardware (Racks oder 1U/2U-Server) in dein Rechenzentrum, betreibt und wartet sie — du startest darauf EC2, EBS, S3, ECS/EKS und RDS über **dieselbe AWS-Konsole und dieselben APIs** wie in der Cloud. Für Daten, die das Haus nicht verlassen dürfen (Krankenhaus, Behörde), und für Millisekunden-Latenz zu lokalen Systemen (Fabrik, Roboter).

Der SAA prüft Outposts fast nie isoliert, sondern **immer in der Abgrenzung**: Warum Outposts und nicht Local Zone, Storage Gateway, Direct Connect oder einfach die Region?

---

## 🎯 SAA-Vertiefung

### Was lokal läuft — und was trotzdem in der Cloud bleibt

**Das Problem:** „Wir installieren AWS im eigenen RZ" klingt nach völliger Unabhängigkeit von der Cloud. Ist es aber nicht — und genau diese Nuance wird geprüft.

**Die Lösung:** Auf dem Outpost läuft die **Data Plane** lokal: **EC2, EBS, S3 on Outposts, ECS und EKS, RDS on Outposts, ElastiCache, EMR, ALB**. Die **Control Plane bleibt in der Parent Region** und erreicht den Outpost über eine dauerhafte Verbindung, den **Service Link**. Daraus folgen zwei Prüfungswahrheiten:

1. **Outposts braucht Konnektivität zur Region.** Fällt der Service Link aus, laufen die vorhandenen Instanzen weiter, aber du kannst nichts mehr *starten*, *ändern* oder verwalten. „Vollständig autark ohne jede Cloud-Verbindung" ist **kein** Outposts-Szenario.
2. **Nicht jeder Dienst ist verfügbar** — und die kleineren **Outposts Servers** (1U/2U) können deutlich weniger als die **Racks** (z. B. **EKS und RDS gibt es nur auf Racks**). Signalwort „nur ein kleiner Standort, wenig Platz, EC2 und Container reichen" → Servers; „vollwertiges lokales AWS inkl. Datenbanken" → Racks.

> **💡 Merksatz:** Outposts = **Data Plane lokal, Control Plane in der Region** (Service Link nötig). Ohne Verbindung: läuft weiter, aber nicht steuerbar. **Autark ist Outposts nicht.**

### Die drei Gründe, die Outposts rechtfertigen

Die Prüfung nennt praktisch immer einen dieser drei — und nur dann ist Outposts die richtige Antwort:

- **Data Residency:** Die Daten dürfen das Gebäude/Land physisch nicht verlassen (Gesundheitsdaten, Behörden, strenge Regulierung) — aber man will trotzdem AWS-APIs nutzen.
- **Latenz zu lokalen Systemen:** Eine Fabriksteuerung, ein Handelssystem oder medizinische Geräte im selben Gebäude brauchen **single-digit-Millisekunden** — der Weg in die Region (auch über Direct Connect) ist zu weit.
- **Lokale Datenverarbeitung:** Riesige Datenmengen entstehen vor Ort (Videoüberwachung, Sensorik) und sollen lokal vorverarbeitet werden, statt komplett hochgeladen zu werden.

Fehlt jeder dieser Gründe, ist Outposts der teure Distraktor — dann gehört der Workload in die Region.

> **💡 Merksatz:** Outposts nur bei **Data Residency**, **lokaler Latenz** oder **lokaler Vorverarbeitung** — sonst gehört der Workload in die Region.

### Die Abgrenzung, an der die Punkte hängen

| Das Szenario sagt … | Antwort |
|---|---|
| AWS-Hardware **im eigenen RZ**, Daten bleiben im Haus, AWS-APIs lokal | **Outposts** |
| Niedrige Latenz in einer **Stadt/Metropolregion**, aber AWS-eigener Standort reicht | **Local Zone** |
| Ultraniedrige Latenz für **5G-/Mobilgeräte** | **Wavelength** |
| On-Prem-App braucht nur **Cloud-Speicher** mit lokalem Cache | **Storage Gateway** |
| Nur eine **private, schnelle Leitung** zur Region | **Direct Connect** |
| Daten **offline transportieren** (keine Leitung) | **Snow Family** |
| Software-Edge auf **eigenen Geräten** (IoT) | **Greengrass** |

Die häufigsten Fehlgriffe: **Direct Connect** löst die *Leitung*, aber nicht die *Latenz-Physik* (Frankfurt bleibt Frankfurt) und schon gar nicht Data Residency. **Storage Gateway** bringt nur Speicher, kein lokales Compute. Und **Local Zones sind AWS-eigene Standorte** — sie stehen nicht bei dir im Keller, sind also keine Antwort auf „Daten dürfen das Haus nicht verlassen".

> **💡 Merksatz:** **Outposts = bei mir im RZ · Local Zone = in meiner Stadt · Wavelength = im 5G-Netz · Storage Gateway = nur Speicher · Direct Connect = nur Leitung.**

---

## ⚠️ Prüfungs-Knackpunkte

- Outposts = AWS-Hardware im **eigenen** Rechenzentrum, gleiche APIs/Konsole; **Racks** (voller Umfang, inkl. **EKS/RDS**) vs. **Servers** (klein, eingeschränkt).
- **Service Link zur Parent Region ist Pflicht** — Control Plane bleibt in der Cloud; ohne Verbindung keine Verwaltung. Kein Offline-/Autark-Szenario.
- Berechtigte Gründe: **Data Residency**, **lokale Latenz (single-digit ms)**, **lokale Vorverarbeitung großer Datenmengen**.
- Abgrenzung: Local Zone (AWS-Standort in der Stadt) · Wavelength (5G) · Storage Gateway (nur Speicher) · Direct Connect (nur Leitung) · Snow (offline) · Greengrass (Software-Edge auf eigenen Geräten).
- Ohne Residency-/Latenz-Grund ist Outposts der **teure Distraktor** → Region wählen.

## 💡 Der eine Satz zum Mitnehmen

**Outposts ist die Antwort auf genau eine Frage: „Wie bekomme ich echte AWS-Dienste dorthin, wo die Daten physisch bleiben müssen oder die Millisekunden zählen?"** — alles andere (Leitung, Speicher, Nähe zur Stadt) lösen billigere Nachbarn.
