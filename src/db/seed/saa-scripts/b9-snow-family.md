---
service: AWS Snow Family (Migrations-Perspektive)
seedKey: saa-c03-script-snow-family
batch: B9
domains: [D3, D4]
sourceRef:
  - https://aws.amazon.com/snowball/faqs/
  - https://docs.aws.amazon.com/snowball/latest/developer-guide/whatisedge.html
  - https://aws.amazon.com/blogs/storage/aws-snow-device-updates/
status: draft
---

# AWS Snow Family (Migrations-Perspektive)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Snow Family = die **physischen Datentransporter** — robuste Boxen per Post, wenn das Internet für die Datenmenge zu langsam ist. Man lädt vor Ort, schickt zurück, AWS lädt verschlüsselt in **S3**. **Snowball Edge** hat zwei Varianten: **Storage Optimized** (Datentransport) und **Compute Optimized** (kann vor Ort rechnen — Edge ohne Internet). Merksatz: **DMS fließt durchs Kabel, Snow fährt mit dem LKW.** Größenordnung entscheidet.

Der SAA vertieft: **die Snow-vs-Netzwerk-Rechnung, Edge-Compute, die aktuelle Familien-Schrumpfung — und die Abgrenzung zu DataSync.**

---

## 🎯 SAA-Vertiefung

### Die Kernentscheidung: Snow oder Netzwerk?

**Das Problem:** 500 TB sollen nach S3. Über die vorhandene Leitung würde der Upload Wochen bis Monate dauern und die Bandbreite blockieren. Wann lohnt der physische Versand?

**Die Lösung:** Die Faustregel ist eine **Bandbreiten-/Zeit-Rechnung**: Übertragungszeit ≈ Datenmenge ÷ verfügbare Bandbreite. Würde der Online-Transfer (DataSync/Direct Connect) unpraktikabel lange dauern und ist die Bandbreite limitiert → **Snow (offline)**. Ist genug Bandbreite oder eine Direct-Connect-Leitung vorhanden → **DataSync online**. Die AWS-Illustration „1 Exabyte über 10 Gbit/s = Jahrzehnte" zeigt das Extrem; in der Praxis gilt heute **online-first**, Snow nur beim echten Bandbreiten-Engpass oder an Orten **ohne brauchbares Internet** (Schiff, Ölplattform, abgelegene Fabrik).

Signalwörter: „Internetleitung zu langsam", „kein Internet vor Ort", „Offline-Transfer großer Mengen (TB/PB)", „physisches Gerät" → Snow Family.

> **💡 Merksatz:** **Snow vs. Netzwerk = Datenmenge ÷ Bandbreite.** Dauert online zu lange / keine Bandbreite / kein Internet → **Snow (offline)**; genug Bandbreite/Direct Connect → **DataSync**.

### Edge-Compute und die aktuelle Familie

**Edge-Compute:** **Snowball Edge Compute Optimized** kann vor Ort **rechnen** (EC2-kompatible Instanzen, Lambda via IoT Greengrass, ML-Inferenz, Video-Vorverarbeitung) — für disconnected/rugged Umgebungen ohne Internet. Signalwort „Datenverarbeitung/ML vor Ort ohne Internet" → Snowball Edge Compute Optimized (nicht Storage Optimized, das auf Kapazität optimiert).

🛑 **Aktualität (Familie schrumpft):** **Snowmobile** (der Exabyte-LKW) ist **eingestellt** (2024); **Snowcone** ebenfalls (Ende 2024). Seit Nov 2025 ist **Snowball Edge nur noch für Bestandskunden** verfügbar; Neukunden verweist AWS auf **DataSync** (online) bzw. **Outposts** (Edge-Compute). Verbleibende Geräte: **Snowball Edge Storage Optimized 210 TB** und **Compute Optimized 104 vCPU** (🔴 Kapazitätswerte = aktuelle Gerätegeneration). **Fürs Examen bleibt Snow Family der Standard-Begriff für Offline-Massen-Transfer** — Snowmobile/Snowcone können als veraltete Distraktoren auftauchen.

> **💡 Merksatz:** **Compute Optimized** = Edge-Rechnen ohne Internet; **Storage Optimized** = Kapazität. 🛑 Snowmobile + Snowcone eingestellt, Snowball nur noch Bestandskunden — Snow bleibt aber die Examens-Antwort für Offline-Transfer.

### Abgrenzung zu DataSync

**Das Problem:** DataSync und Snow bewegen beide große Datenmengen. Wann welches?

**Die Lösung:** Die Frage ist **online vs. offline**:
- **DataSync**: **online** über Netzwerk/Direct Connect, für wiederkehrende oder große Transfers, wenn Bandbreite ausreicht; Integritätscheck und Filter eingebaut.
- **Snow**: **offline** per Hardware-Versand, wenn Bandbreite fehlt oder kein Internet vorhanden ist.

Reflex: „online synchronisieren, Bandbreite ok" → DataSync; „offline, keine/zu wenig Bandbreite" → Snow.

> **💡 Merksatz:** **DataSync = online (Bandbreite ausreichend); Snow = offline (keine/zu wenig Bandbreite).** Bei genug Bandbreite immer DataSync bevorzugen.

---

## ⚠️ Prüfungs-Knackpunkte

- Snow vs. Netzwerk = **Datenmenge ÷ Bandbreite**; zu langsam/kein Internet → Snow, sonst DataSync.
- **Compute Optimized** = Edge-Rechnen ohne Internet; **Storage Optimized** = Kapazität.
- 🛑 **Snowmobile + Snowcone eingestellt** (2024), **Snowball nur Bestandskunden** (Nov 2025); Neukunden → DataSync/Outposts. Snow bleibt Examens-Standardbegriff.
- 🔴 Kapazitäten (210 TB / 104 vCPU) = aktuelle Gerätegeneration.
- **DataSync (online) vs. Snow (offline)**; alles verschlüsselt (KMS), Ziel S3.

## 💡 Der eine Satz zum Mitnehmen

**Snow Family ist der Offline-Weg für Massendaten, wenn die Leitung zu langsam ist oder kein Internet vorhanden ist — die Wahl fällt über Datenmenge geteilt durch Bandbreite, Compute Optimized rechnet zusätzlich am Edge, und bei ausreichender Bandbreite gewinnt immer DataSync online.**
