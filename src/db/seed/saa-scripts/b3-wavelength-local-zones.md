---
service: AWS Wavelength & Local Zones
seedKey: saa-c03-script-wavelength-local-zones
batch: B3
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/wavelength/latest/developerguide/what-is-wavelength.html
  - https://aws.amazon.com/about-aws/global-infrastructure/localzones/
status: draft
---

# AWS Wavelength & Local Zones

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Zwei Wege, wie AWS **näher zu den Nutzern rückt**, wenn die Region zu weit weg ist: **Local Zones** = ein Mini-AWS-Außenposten in einer großen Stadt (Compute/Storage nah am Nutzer). **Wavelength** = AWS-Infrastruktur direkt **im 5G-Netz** des Mobilfunkanbieters — für mobile Geräte, deren Daten gar nicht erst ins offene Internet müssen. Merksatz vom CLF: *Local Zone = nah an der Stadt, Wavelength = im 5G-Netz, Outposts = bei dir im Keller.*

Der SAA fragt: **Wie hängen diese Zonen technisch an der Region — und woran erkenne ich im Szenario, welches der fünf Edge-Werkzeuge gemeint ist?**

---

## 🎯 SAA-Vertiefung

### Local Zones: Die ausgelagerte AZ

**Das Problem:** Ein Studio in Los Angeles rendert Video in Echtzeit; die nächste Region ist Oregon. Die 30–40 ms Round-Trip machen interaktives Arbeiten unmöglich. Eine eigene Region in LA gibt es nicht — und lohnt sich für AWS auch nie.

**Die Lösung:** Eine **Local Zone** ist eine **Erweiterung einer Region** in eine Metropolregion hinein: technisch verhält sie sich wie eine zusätzliche **AZ deiner bestehenden VPC** (du dehnst dein Subnetz-Modell einfach dorthin aus), aber sie steht physisch in der Stadt. Damit bekommst du **single-digit-Millisekunden** zu lokalen Nutzern — bei unveränderter AWS-Verwaltung aus der **Parent Region**.

Die Grenzen, an denen Distraktoren ansetzen: Eine Local Zone bietet nur **eine Auswahl an Diensten** (typischerweise EC2, EBS, ECS/EKS-Nodes, ALB) — nicht den vollen Regions-Katalog. Sie ist außerdem **eine** Zone: **keine Multi-AZ-Redundanz** innerhalb der Local Zone. Hochverfügbarkeit baut man weiterhin gegen die Parent Region.

Typische Signalwörter: **Echtzeit-Gaming, Live-Streaming, Medien-Rendering, Remote-Desktops/VDI** in einer bestimmten Metropolregion.

> **💡 Merksatz:** Local Zone = **verlängerte AZ deiner VPC in eine Großstadt** — Millisekunden für lokale Nutzer, aber nur ausgewählte Dienste und **keine eigene Multi-AZ-Redundanz**.

### Wavelength: Die Abkürzung durchs Mobilfunknetz

**Das Problem:** Eine AR-App auf dem Handy braucht Antwortzeiten unter 20 ms. Selbst mit einer Local Zone in derselben Stadt muss der Datenverkehr erst durch das Mobilfunknetz **hinaus ins öffentliche Internet** und dann wieder zurück — und genau dieser Umweg über das Carrier-Gateway kostet die entscheidenden Millisekunden.

**Die Lösung:** **Wavelength Zones** stehen **innerhalb des 5G-Netzes des Providers** (Verizon, Vodafone, KDDI, SKT …). Der Traffic des Endgeräts erreicht deine EC2-Instanz, **ohne das Carrier-Netz zu verlassen** — der Umweg ins Internet entfällt komplett. Der Zugang läuft über ein spezielles **Carrier Gateway** statt eines Internet Gateways; die Zone hängt wie eine Local Zone an einer **Parent Region**.

Das Erkennungsmerkmal ist eindeutig: **Steht „5G" oder „mobile Endgeräte" im Szenario, ist Wavelength gemeint** — AR/VR am Handy, vernetzte Fahrzeuge, mobile Echtzeitspiele, industrielle 5G-IoT-Anwendungen.

🛑 **Aktualitätshinweis:** Wavelength wird gelegentlich als „abgekündigt" kolportiert. **Dafür gibt es keine offizielle AWS-Quelle** — im Gegenteil, AWS hat zuletzt (Mai 2025) sogar eine **neue Wavelength Zone** eröffnet. Für die Prüfung gilt Wavelength unverändert als aktives 5G-Edge-Angebot.

> **💡 Merksatz:** **„5G" oder „mobiles Endgerät" im Text → Wavelength.** Der Traffic bleibt im Carrier-Netz (Carrier Gateway statt Internet Gateway).

### Die Edge-Entscheidungsmatrix — die eigentliche Prüfungsfrage

Fünf Werkzeuge, die alle „näher am Nutzer" versprechen. Die Prüfung testet, ob du sie sauber trennst:

| Das Szenario sagt … | Antwort |
|---|---|
| Statische/dynamische **Inhalte weltweit** ausliefern, cachen | **CloudFront** (Edge Locations) |
| Niedrige Latenz für Nutzer in **einer Metropolregion**, Compute nötig | **Local Zone** |
| Ultraniedrige Latenz für **5G-/Mobilgeräte** | **Wavelength** |
| AWS-Dienste **im eigenen Rechenzentrum**, Data Residency | **Outposts** |
| Globale **TCP/UDP-Anycast-Beschleunigung** zu Regions-Endpunkten | **Global Accelerator** |

Die klassischen Fehlgriffe: **CloudFront** löst *Content-Auslieferung*, aber kein Compute nah am Nutzer. **Global Accelerator** beschleunigt den *Weg* zur Region, verschiebt aber nichts an die Kante. Und wer bei „Fabrik/Krankenhaus, Daten dürfen nicht raus" eine Local Zone wählt, verwechselt „AWS-Standort in meiner Stadt" mit „AWS-Hardware in meinem Haus" — das ist **Outposts**.

> **💡 Merksatz:** **CloudFront = Inhalte · Global Accelerator = Weg · Local Zone = Compute in der Stadt · Wavelength = Compute im 5G-Netz · Outposts = Compute im eigenen RZ.**

---

## ⚠️ Prüfungs-Knackpunkte

- **Local Zone** = Erweiterung der VPC/Region in eine Metropolregion; single-digit ms für Stadt-Nutzer; **nur ausgewählte Dienste**, **keine Multi-AZ-Redundanz** innerhalb der Zone; Verwaltung über die **Parent Region**.
- Signalwörter Local Zone: Echtzeit-Gaming, Live-Streaming, Medien-Rendering, VDI in einer bestimmten Stadt.
- **Wavelength** = AWS im **5G-Netz** des Carriers; Zugang über **Carrier Gateway**; Traffic verlässt das Carrier-Netz nicht.
- Signalwörter Wavelength: **5G, mobile Endgeräte**, AR/VR am Handy, vernetzte Fahrzeuge.
- 🛑 Wavelength ist **nicht** abgekündigt (keine offizielle Quelle; zuletzt sogar neue Zone 2025).
- Abgrenzung: **CloudFront** (Content-Caching) · **Global Accelerator** (Anycast-Weg zur Region) · **Outposts** (eigenes RZ) — keines davon ersetzt das andere.

## 💡 Der eine Satz zum Mitnehmen

**Local Zone und Wavelength verschieben nicht Inhalte, sondern Rechenleistung an die Kante** — die Stadt bekommt die Local Zone, das 5G-Netz bekommt Wavelength, und wenn die Hardware ins eigene Haus soll, heißt die Antwort Outposts.
