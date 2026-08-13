# HANDOFF — Diagramm-Rollout (Teil A), 13.08.2026

> Setzt `HANDOFF-UI-01.md` fort (Teile B–D). Auftrag war
> `~/Downloads/HANDOFF-UI-SZENARIEN.md`, Teil A.

## 🔴 Zuerst: der Stand ist nicht auf main

Vier Commits liegen lokal auf Branch `ui-dashboard-szenarien`,
**nicht gepusht, nicht gemergt**:

| Commit | Inhalt |
|---|---|
| `8fe7fd5` | UI Teile B–D |
| `a9e643d` | Handoff 01 |
| `d381d33` | **kit** — fehlende Templates |
| `c188e30` | **assets** — 90 Specs + 270 Dateien |
| `a780835` | **ui** — Auflösung, Guards, Panelbreite |

`main` und `origin` kennen nichts davon.

## Wo wir stehen

Teil A ist ausgeführt. **90 von 100 Karten zeigen ein generiertes Diagramm**,
die übrigen zehn ihr bestehendes `battle_card_N.svg`.

## Der Befund, der den ersten Anlauf gestoppt hat

Der erste Sammellauf meldete „90 gebaut, 0 abgelehnt" — tatsächlich waren es 62.
Ursache war nicht die Renderqualität, sondern ein **unvollständiges Repo-Kit**:
`templates/ablauf.py` (12 Karten) und `templates/hybrid.py` (16 Karten) fehlten.

Ein vollständiger Diff gegen `certops-diagramkit.zip` zeigte: `canvas.py`,
`cli.py`, `icons.py`, `theme.py` und alle drei vorhandenen Templates sind
**byte-identisch**. Das Kit war nicht älter, nur unvollständig — deshalb wurden
nur die zwei Templates plus die vier Kit-Fixtures nachgezogen, kein Vollersatz.

**Wichtig für später:** ein Vollersatz wäre schädlich gewesen. Die ZIP-Fassung
von `specs/card-005.yaml` ist die alte Fan-out-Demo; das Repo trägt die echte
Karte 5 (App Runner · ECR).

## ⚠️ Bekannter Mangel in `cli.py` — nicht behoben

Steht ausführlich in `docs/diagramm-specs-fehlend.md`. Kurz: `main()` fängt nur
`Finding`; `load()` steht vor dem `try`, und ein fehlendes Template wirft
`ModuleNotFoundError`. Beides gibt einen Traceback statt `ABGELEHNT`.

**Wer den Sammellauf auf das Wort „ABGELEHNT" filtert, zählt Fehler als
Erfolge.** Genau so entstand die Falschmeldung oben. Bis das behoben ist:
**Erfolg am Vorhandensein der Ausgabedatei messen.** Die ZIP-Fassung von
`cli.py` behebt es nicht.

## Ergebnis des Sammellaufs

Whitelist 1–100, Einzelaufruf je Spec, strict, kein `--lax`.

- **gebaut: 90** — alle außer den zehn unten
- **QC-abgelehnt: 0**
- **abgestürzt: 0**
- **keine Spec: 10** — 4, 7, 9, 25, 30, 37, 40, 54, 55, 80

Kein einziger echter QC-Befund über alle 90 Karten und fünf Templates.

## Antialiasing: Fontconfig-Patch war nicht nötig

Der Auftrag schrieb ihn prophylaktisch vor. Erst gemessen, an sechs Karten über
alle fünf Templates:

- reines Schwarz im Titelband: **0 px** überall
- jedes Bandpixel liegt auf der Mischlinie zwischen Weiß und der Titelfarbe
  (`#232F3E`), **maximale Abweichung 1,0, keine Ausreißer**

Die anfangs auffällige Kanaldivergenz von 27 ist exakt die Füllfarbe des Titels,
kein Subpixel-Saum. Rendering ist Graustufen-antialiast.

→ **`~/.config/fontconfig/fonts.conf` wurde NICHT angelegt.** Außerhalb des
Repos ist nichts entstanden.

## Auflösung mit Rückfall

`assetUrl()` in `src/lib/scenario-content.ts` prüft zur **Buildzeit**, ob
`card-NNN.web.svg` vorliegt, sonst `battle_card_N.*`. Die Feldnamen
`svgUrl`/`pdfUrl`/`pngUrl` blieben — dadurch greifen Detailseite,
Dashboard-Vorschau und der bestehende Existenz-Guard unverändert.

**Buildzeit heißt Buildzeit:** wer ein Asset nachlegt und nicht neu baut, sieht
weiter das Altbild. Der Fehler liegt dann nicht im Frontend.

Zwei neue Guards in `scenario-content.test.ts`: die Aufteilung als Untergrenze
mit Ist-Zahlen in der Meldung, und die zehn Rückfall-Karten nach Nummer gepinnt.

## Smoke-Test

Gegen den **Produktions-Build** gelaufen, nicht gegen den Dev-Server — dessen
CSS-Chunk kam abgeschnitten (`diagram-bleed {` am Dateiende), was zuerst wie ein
Fehler meiner Änderung aussah. Der Produktions-Build war die ganze Zeit korrekt.

| Prüfung | Ergebnis |
|---|---|
| Karte 60 (gebaut) | `card-060.web.svg` + `card-060.pdf` |
| Karte 7 (ohne Spec) | `battle_card_7.svg` + `battle_card_7.pdf` — konsistent alt |
| Karten 3, 14, 92 (neue Templates `ablauf`/`hybrid`) | alle 200, kein 404 |
| Panel | **1150 px**, zentriert 145/145 |
| Textspalte | 712 px, Ränder 364/364 symmetrisch, unverändert |
| Horizontaler Überlauf | keiner |
| Vollbild | öffnet/schließt, Scrollposition 900 → 900 und 1100 → 1100 |
| Cmd/Modifier | schließen nicht |
| Konsole | keine Seitenfehler, keine Hydration-Warnung, 0 fehlgeschlagene Requests |
| Dashboard | 6/6 Thumbnails, Ticker pausiert im Ruhezustand, läuft bei Hover |
| Thumbnail-Gewicht | **29 KB komprimiert** (117 KB roh), HTML 17 KB |

**Die Lücke aus Handoff 01 ist geschlossen:** dieser Lauf lief auf einem Fenster
mit echter 15-px-Scrollleiste, `--sbw` maß 15 px. Die `scrollbar-gutter`-Mechanik
ist damit erstmals unter Last geprüft — kein Ruck, kein Überlauf.

## Zwei Thumbnail-Details, beide durch Testen gefunden

1. **Feste Box `156×52` statt `w-auto`** — ein ungeladenes Bild mit
   Auto-Breite hat ein 0×0-Rechteck.
2. **Kein `loading="lazy"`** — Chrome lädt keine Lazy-Bilder, die von einem
   Vorfahren mit `overflow: hidden` beschnitten sind. Im 64-px-Fenster des
   Tickers blieb die Kachel dadurch **komplett leer**. Fiel erst im
   Screenshot auf, nicht in den Zahlen.

## Nächste Schritte

1. **Die zehn fehlenden Specs** (4, 7, 9, 25, 30, 37, 40, 54, 55, 80) klären —
   siehe `docs/diagramm-specs-fehlend.md`. Nachliefern erfordert **keine
   Codeänderung**: Spec dazu, bauen, Assets kopieren, neu bauen. Der Guard
   ist als Untergrenze formuliert und bricht dabei nicht.
2. `cli.py`-Mangel beheben, falls das Kit weiter genutzt wird.
3. Branch nach `main` und auf `origin` — offen.

## Offene Fragen

- Sind die zehn Specs gemeldet oder verloren?
- Soll `ui-dashboard-szenarien` gemergt und gepusht werden?
- `tools/diagramkit/build/` ist gitignored; die Druck-SVG und die
  JSON-Schrittlisten sind damit nicht versioniert, aber jederzeit
  reproduzierbar. Falls sie gebraucht werden, ist das eine Entscheidung.
