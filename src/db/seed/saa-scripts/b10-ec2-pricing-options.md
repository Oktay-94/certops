---
service: EC2-Kaufoptionen (Savings Plans, RIs, Spot, On-Demand)
seedKey: saa-c03-script-ec2-pricing-options
batch: B10
domains: [D4]
sourceRef:
  - https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html
  - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html
  - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html
status: draft
---

# EC2-Kaufoptionen

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Die Spar-Werkzeuge: **Savings Plans** (Verpflichtung zu einem Stundenbetrag, 1/3 Jahre → Rabatt; **Compute SP** flexibel über EC2/Fargate/Lambda vs. **EC2 Instance SP** mehr Rabatt, an Family gebunden). **Reserved** = stabile Dauerlast, bis 72 %, Bindung. **Spot** = unterbrechbar, bis 90 %, jederzeit durch AWS kündbar. **On-Demand** = flexibel, teuer, kein Commitment. Faustregel: **vorhersehbar → Reserved/SP; unterbrechbar → Spot; unvorhersehbar/kurz → On-Demand.**

Der SAA vertieft: **die exakten Rabatte/Flexibilitäten, Kapazitätsreservierung, die Anwendungsreihenfolge — die Kaufoptionen-Matrix ist prüfungskritisch.**

---

## 🎯 SAA-Vertiefung

### Savings Plans vs. Reserved Instances

**Das Problem:** Eine Firma hat einen wechselnden Mix aus EC2, Fargate und Lambda und will maximal sparen, aber nicht an eine feste Instanz-Config gebunden sein — ein anderes Team hat eine seit Jahren stabile DB-Instanz.

**Die Lösung — die vier Commitment-Optionen an ihren Zahlen (🔴 Rabatte offiziell, aber „bis zu"):**
- **Compute Savings Plan**: **bis 66 %**, **flexibelste** Option — deckt jede EC2-Family/Region/OS **plus Fargate und Lambda**. Commitment in **$/Stunde**. Für wechselnde/serverlose Workloads. Vergleichbar mit Convertible RIs.
- **EC2 Instance Savings Plan**: **bis 72 %**, gebunden an eine **Instance-Family + Region** (Size/OS/Tenancy flexibel). Vergleichbar mit Standard RIs.
- **Standard RI**: **bis 72 %**, gebunden an Instance-Type/Region/OS/Tenancy; auf dem RI Marketplace **verkaufbar**; Family/Region nicht wechselbar.
- **Convertible RI**: **bis 66 %**, **austauschbar** (Family/OS/Tenancy) gegen gleich-/höherwertige Reservierungen.

Reflex: „max. Flexibilität über EC2/Fargate/Lambda" → Compute SP; „stabile feste Config, 3 Jahre, max. Rabatt" → Standard RI.

> **💡 Merksatz:** **Compute SP** (bis 66 %, flexibel EC2/Fargate/Lambda) · **EC2 Instance SP** (bis 72 %, Family-gebunden) · **Standard RI** (bis 72 %, fixe Config, verkaufbar) · **Convertible RI** (bis 66 %, austauschbar). SP-Commitment in $/h.

### Kapazität und Spot

**Das Problem:** Man braucht garantierte Kapazität in einer bestimmten AZ — und separat einen billigen, unterbrechbaren Batch-Cluster.

**Die Lösung — zwei oft verwechselte Punkte:**
- **Kapazitätsreservierung**: Nur **Zonal RIs** reservieren **Kapazität** in einer bestimmten AZ. **Regional RIs** geben nur Rabatt (AZ-flexibel, keine Kapazitätsgarantie), und **Savings Plans reservieren KEINE Kapazität**. „garantierte Kapazität in einer AZ" → Zonal RI (oder On-Demand Capacity Reservation, wenn Kapazität ohne Rabatt reicht).
- **Spot**: **bis 90 % Rabatt**, aber jederzeit durch AWS mit **2 Minuten Vorwarnung** unterbrechbar — nur für **fault-tolerant/stateless** Workloads (Batch, CI/CD, Big-Data-Task-Nodes). „unterbrechbar, Kosten minimieren" → Spot.

> **💡 Merksatz:** **Nur Zonal RIs reservieren Kapazität** (AZ); Regional RIs/**Savings Plans reservieren KEINE Kapazität**. **Spot** bis 90 % (2 Min Vorwarnung, fault-tolerant).

### Die Anwendungsreihenfolge und die Entscheidungslogik

**Das Problem:** Man hat SPs und RIs gleichzeitig — wie werden die Rabatte angewendet, und welche Option wählt man je Szenario?

**Die Lösung:**
- **Anwendungsreihenfolge** der Rabatte: **Zonal RI → Regional RI → EC2 Instance SP → Compute SP** (spezifischer zuerst).
- Entscheidungslogik nach **Vorhersehbarkeit + Flexibilität**: vorhersehbare, feste Config → Standard RI (max. Rabatt); vorhersehbarer, aber wechselnder Mix → Compute SP; schwankend/kurz → On-Demand; unterbrechbar/fault-tolerant → Spot; garantierte Kapazität nötig → Zonal RI.

> **💡 Merksatz:** Rabatt-Reihenfolge **Zonal RI → Regional RI → EC2 Instance SP → Compute SP**. Wahl nach **Vorhersehbarkeit + Flexibilität**: fix→Standard RI, flexibel→Compute SP, kurz→On-Demand, unterbrechbar→Spot.

---

## ⚠️ Prüfungs-Knackpunkte

- **Compute SP** (bis 66 %, flexibel EC2/Fargate/Lambda) · **EC2 Instance SP** (bis 72 %, Family) · **Standard RI** (bis 72 %, fix, verkaufbar) · **Convertible RI** (bis 66 %, austauschbar).
- **Spot bis 90 %** (2 Min Vorwarnung, fault-tolerant/stateless).
- **Nur Zonal RIs reservieren Kapazität**; Regional RIs / **SPs reservieren KEINE Kapazität**.
- SP-Commitment in **$/h**; RI-Commitment auf **Instanz-Config**.
- Anwendungsreihenfolge: **Zonal RI → Regional RI → EC2 Instance SP → Compute SP**.
- Wahl: fix→Standard RI, flexibel→Compute SP, kurz/schwankend→On-Demand, unterbrechbar→Spot, Kapazität→Zonal RI.

## 💡 Der eine Satz zum Mitnehmen

**Die Kaufoptionen staffeln sich nach Commitment und Flexibilität: Compute Savings Plans (bis 66 %) sind am flexibelsten, EC2 Instance SP und Standard RIs geben bis 72 % bei fester Bindung, Spot bis 90 % für unterbrechbare Workloads — und nur zonale RIs reservieren tatsächlich Kapazität, Savings Plans nie.**
