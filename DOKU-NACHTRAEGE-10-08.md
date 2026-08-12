# Doku-Nachträge nach der Narrative-Integration (10.08.2026)

Drei Stellen sind zu aktualisieren. Teil 1 und 2 kann Claude Code übernehmen,
Teil 3 gehört in Project Knowledge und muss Oktay selbst einfügen.

---

## Teil 1 — `NARRATIVE-SPEC.md` §6 ersetzen

Der bisherige §6 beschreibt den Renderer, als stünde das Narrativ allein auf der
Seite. Seit dem 10.08.2026 ist ihm die Kurzfassung vorgeschaltet. §6 gilt
unverändert weiter — aber **innerhalb** der langen Ansicht.

Alten §6 komplett durch das Folgende ersetzen:

```markdown
## 6. Rendering-Vertrag

**Stand 10.08.2026: gebaut und live.** Die ursprüngliche Fassung dieses
Abschnitts beschrieb das Narrativ als einzigen Seiteninhalt. Tatsächlich
umgesetzt ist eine zweistufige Ansicht.

### 6.1 Zwei Fassungen, ein Umschalter

Die Szenario-Seite `/[exam]/szenarien/[nr]` zeigt zwei Fassungen desselben
Szenarios:

- **Kurz** (Default): der gefilterte Body aus `battle_card_N.md`.
- **Ausführlich**: das Narrativ aus `narrative.md`.

Umgeschaltet wird über den URL-Parameter `?v=lang`. Jeder andere Wert und ein
fehlender Parameter bedeuten *kurz*. Die URL ist der einzige Zustand — kein
`useState`, kein Sync-Effect.

**Der Umschalter erscheint nur, wenn `narrative.md` existiert.** Bei Karten ohne
Narrativ wird er nicht gerendert — keine deaktivierte Schaltfläche, kein
Hinweistext, und `?v=lang` bleibt dort wirkungslos.

Gemeinsam für beide Fassungen und nur einmal im DOM: Breadcrumb, Titel,
Signalwörter, PDF-Link, **die Battle Card** und der Prev/Next-Pager. Umgeschaltet
wird ausschließlich der Sektionsbereich darunter. Damit steht die Karte in beiden
Fassungen oben, und das SVG wird nicht doppelt ausgeliefert.

### 6.2 Aufbau der langen Ansicht

Unverändert gegenüber der ursprünglichen Fassung:

- **Standardmäßig offen:** `Die Grundidee zuerst` und
  `Wenn du dir eine Sache merkst`.
- **Eingeklappt:** alle übrigen, mit dem vollen H2-Text als Klapp-Titel —
  inklusive der variablen Suffixe nach `" — "`.
- **`Der Weg durch die Karte`** klappt als Ganzes auf, die H3 bleiben darin
  sichtbar.

Technisch native `<details>`/`<summary>`: kein JavaScript, Tastatur- und
Screenreader-Verhalten kommen vom Browser.

### 6.3 Der Notizfilter

`battle_card_N.md` enthält neben Lernstoff auch Produktionsnotizen —
Farbkonventionen, Faktencheck-Notizen, bewusste Vereinfachungen, „Nicht
bestätigt". Diese wandern **nicht** ins Frontend. Die Dateien bleiben
unangetastet, nur das Rendering filtert.

`classifySection()` in `src/lib/scenario-content.ts` klassifiziert jede H2 als
`learn`, `note` oder `unknown`. Die Prüfreihenfolge ist **Allow vor Block** und
bindend: `Faktencheck — Divergenzen zu älterem Kursmaterial` ist Lernstoff und
würde sonst vom Block-Präfix `faktencheck` verschluckt.

Bei `unknown` wird **gerendert** (fail-open, damit nie Lernstoff verschwindet);
stattdessen bricht der Guard-Test in `scenario-content.test.ts` und nennt
Kartennummer und Überschrift. Ein neuer Kartenbatch mit unbekannter Überschrift
erzwingt so eine bewusste Einordnung.

Stand 10.08.2026: 68 verschiedene H2-Namen über 100 Karten, davon 24 Namen mit
238 Sektionen als `note`, 44 Namen mit 479 Sektionen als `learn`, 0 `unknown`.

### 6.4 Bekannte Eigenschaft, kein Fehler

Der Umschalter liegt hinter einer `<Suspense>`-Grenze — ohne sie kippt
`useSearchParams()` die gesamte Route ins Client-Side-Rendering und die 100
prerenderten SSG-Pfade gehen verloren. Konsequenz: Im statischen HTML steht der
**Fallback**, also die Kurzfassung. Wer `?v=lang` direkt aufruft, sieht kurz die
kurze Fassung, bevor die lange erscheint.

Die Alternative wäre ein eigenes Route-Segment (`/szenarien/37/lang`) mit echtem
SSG für beide Fassungen. Bewusst nicht gebaut: zwei Routen und doppelte
`generateStaticParams` für ein kosmetisches Detail.

Ohne JavaScript ist die Kurzfassung sichtbar und die `<details>` klappbar.
```

---

## Teil 2 — `CHAT-CONTEXT.md`: neuen Nachtrag am Ende anhängen

Die Datei arbeitet mit Nachträgen; oberhalb wird nichts geändert. Das Folgende
ans Dateiende anhängen:

```markdown
---

# NACHTRAG 10.08.2026 — Narrative-Integration + Notizfilter

> **Lesehinweis:** Oberhalb dieser Linie wurde kein Zeichen geändert. Wo dieser
> Nachtrag früheren Abschnitten widerspricht, gilt der Nachtrag.

## 12.1 Was sich geändert hat

**Szenarien-Stand korrigiert.** §11 nennt 55 Karten. Tatsächlich ist
`SCENARIO_COUNT` **100**, alle 100 Pfade werden prerendert. Zusätzlich liegen
für die Karten **1–39** erzählende Langfassungen als
`public/scenarios/card-NN/narrative.md` im Repo. Karten 40–100 haben keine —
das ist Normalzustand, kein Fehler.

**Zwei Features live:**

1. **Notizfilter.** Produktionsnotizen aus `battle_card_N.md` erscheinen nicht
   mehr im Frontend — 238 von 717 Sektionen. Die Dateien bleiben unangetastet.
   Details in NARRATIVE-SPEC.md §6.3.
2. **Kurz/Ausführlich-Umschalter** über `?v=lang`, nur bei Karten mit Narrativ.
   Details in NARRATIVE-SPEC.md §6.1–6.2.

## 12.2 Commits

| Commit | Inhalt |
|---|---|
| `b411832` | Notizfilter: `normalizeHeading`, `classifySection`, `splitScenarioBody` |
| `54dc2e3` | `readNarrative`, `NarrativeView`, `NarrativeSwitch`, 39 narrative.md, Guard-Tests |

Branch `feat/narrative-integration`, per Fast-forward auf `main` gemerged und
gepusht. 393 Tests grün, Build grün, Route weiterhin ● SSG mit 100 Pfaden.

## 12.3 Die eine Zahl, die bei jeder Änderung zu prüfen ist

```
pnpm build 2>&1 | grep -A5 "szenarien/\[nr\]"
```

Dort muss **● (SSG) mit 100 Pfaden** stehen. Steht `ƒ`, ist die Route dynamisch
geworden — praktisch immer, weil `searchParams` in eine Server Component
gerutscht ist oder eine `<Suspense>`-Grenze fehlt. Derselbe Fehlertyp wie bei den
SAA-Skript-Detailseiten (§10, `a07f745`): **im Dev unsichtbar, nur unter
`next start` sichtbar.**

## 12.4 Verifiziert im Browser, nicht nur im Test

Karte 37: Umschalter da, Kurzfassung ohne Farbkonventionen/Faktencheck-Notizen,
lange Fassung mit Grundidee und Merksatz offen, H3 im Weg-Abschnitt sichtbar,
Scrollposition beim Umschalten erhalten. Karte 45: Divergenz-Sektion korrekt
**erhalten** — der kritische Grenzfall des Filters. Karten 45 und 100: kein
Umschalter, `?v=lang` wirkungslos.

## 12.5 Offene Punkte

1. **Narrative 40–100 fehlen** — rund 20 weitere Batch-Chats à drei Stück.
2. **Kartenkorrekturen aus dem Sammelpass** sind unverändert offen (106 Befunde,
   HANDOFF-NARRATIVE-02 §4 bis -13 §4). Zwei davon sind Oktay-vertagt und tragen
   beide Lösungswege im Narrativ: Befund 99 (Karte 38, „jeder Treffer geloggt")
   und Befund 102 (Karte 39, „~1 Minute" zweimal).
3. **Masterplan-Debt:** Karte 39 ist Aurora Global Database, der Masterplan nennt
   dort Client VPN. Aurora Global Database steht nirgends im Masterplan; Client
   VPN fällt damit aus den 100, obwohl es Exam-Guide-Stoff ist.
4. **Farb-Debt und Umlaut-Defekt** unverändert (§11.5, HANDOFF-13).
5. **`NARRATIVE-SPEC.md` liegt nicht im Repo** — nur im Project Knowledge. Der
   Spec-Patch v1.1 (§4, Wortkorridor) steht bis heute nur in
   HANDOFF-NARRATIVE-05 §5.1.

*Ende NACHTRAG 10.08.2026. Ein neuer Chat startet mit: 100 Battle Cards im Repo
und in der App, 39 davon mit Langfassung hinter einem Umschalter, Notizfilter
aktiv, `main` auf `54dc2e3`. Nächster Narrativ-Batch: 14 = Karten 40, 41, 42.*
```

---

## Teil 3 — Korrektur im Paste-Block für Narrativ-Batch 14

`HANDOFF-NARRATIVE-13.md` §8 enthält zwei Zeilen, die seit heute falsch sind.
Beim Start von Batch 14 ersetzen:

**Alt:**
```
Ablage:          public/scenarios/card-NN/narrative.md — NEUE Datei, battle_card_N.md bleibt
...
Ungetestet:      narrative.md-Leser in scenario-content.ts fehlt · Renderer Spec §6 nicht gebaut
```

**Neu:**
```
Ablage:          public/scenarios/card-NN/narrative.md — battle_card_N.md bleibt.
                 Die Dateien werden GELESEN und GERENDERT (seit 10.08.2026):
                 readNarrative() in scenario-content.ts, Umschalter ?v=lang.
                 Ein neues Narrativ ist damit sofort live, sobald es im Repo liegt.
Renderer:        gebaut. NARRATIVE-SPEC §6 ist umgesetzt, INNERHALB der langen
                 Ansicht. Die neun kanonischen H2 sind Vertrag gegenüber dem
                 Renderer — Abweichung bricht die Seite, nicht nur check.py.
Notizfilter:     battle_card_N.md wird gefiltert gerendert (Spec §6.3). Neue
                 H2-Überschriften auf KARTEN müssen in ALLOW_PREFIX oder
                 BLOCK_PREFIX eingeordnet werden, sonst bricht der Guard-Test.
                 Betrifft die Kartenkette, nicht die Narrativkette.
```

**Warum das wichtig ist:** Bisher waren die Narrative tote Dateien — ein Fehler
darin fiel erst beim späteren Integrationslauf auf. Jetzt rendert die App sie
direkt. Ein Narrativ mit fehlender Pflicht-H2 oder falscher `cardNumber` lässt
`readNarrative` werfen und **bricht den Build**. `check.py` ist damit nicht mehr
nur Qualitätssicherung, sondern Vorbedingung fürs Deploy.
