# HANDOFF — Diagramm auf Mobilgeräten, 14.08.2026

> Setzt `HANDOFF-UI-02.md` (Diagramm-Rollout, 13.08.) fort. Auslöser war ein
> Befund vom Handy, nicht ein geplanter Auftrag.

## Wo wir stehen

Das Diagramm ist auf Mobilgeräten lesbar, das Vollbild lässt sich verlassen,
und ein Seitenüberlauf auf Szenario 17 ist gefunden und behoben.
**Am Gerät bestätigt am 14.08.** — nicht nur in der Emulation.

Drei Commits auf Branch `feat/diagram-mobile-readable`:

| Commit | Inhalt |
|---|---|
| `b27eb7f` | Vollbild als Scroll-Container auf schmal, Legende als Mobil-Lesepfad, Badge an das SVG angeglichen |
| `57dc272` | `pre`-Override im Markdown-Renderer — Scroll-Box für Code-Fences |
| `8a87b9c` | Backdrop schließt auf Touch, Wischschutz, Streifen zum Antippen |

## Der Ausgangsbefund

Das Panel ist auf einem 390-px-Gerät **358 px** breit
(`globals.css`: `min(calc(100vw - var(--sbw) - 2rem), var(--diagram-w, 860px))`)
bei einem auf **1600 px** gezeichneten Bild — Maßstab 0,22, Beschriftungen bei
3–4 px. Das Vollbild war **kein Ausweg**: es rendert dasselbe Bild
`object-contain` in einem `fixed inset-0 p-4`-Container, also wieder 358 px.

Lesbar wird es ab etwa 1100 px Renderbreite. Deshalb ist das Vollbild auf
schmalen Viewports ein nativer Scroll-Container bei `max(1100px, 100vw)` —
Panning macht der Browser, es gibt bewusst keine Gestenlogik.

## Der Fund auf Karte 17

Die Seite ließ sich seitlich schieben, und das Diagramm wirkte kleiner. Es war
**nicht das Diagramm**: `card-017.web.svg` ist 1600×746, Ratio 2,14 —
unauffällig im Feld aller 90 (1,17 bis 3,00).

Ursache war ein `<pre>` ohne Auffangbecken. `SkriptMarkdown.tsx` hatte
Overrides für `code` und `table` — für `table` sogar mit genau diesem
Scroll-Container — aber **keinen für `pre`**. Die Rechnung in
`card-17/narrative.md:145–151` ist 418 px breit gegen 342 px Textspalte, macht
**88 px** Dokumentüberlauf. Das Diagramm bleibt dabei bei `100vw` gleich groß
und sitzt nur in einer breiteren Seite — daher der Eindruck.

**Sweep über alle 100 Karten in beiden Erzähl-Zweigen (`?v=lang` mitgeprüft):**
Karte 17 ist die einzige Seite der App mit einem gerenderten `<pre>`. In den
CLF-Kapiteln und SAA-Skripten gibt es überhaupt keine Code-Fences. Die neue
Regel regiert derzeit genau ein Element.

Umbrechen statt Scrollen wurde verworfen: der Block ist mit Leerzeichen
spaltenweise ausgerichtet, `pre-wrap` würde genau das zerstören.

## Verifikation

397 Tests grün, `tsc --noEmit` und ESLint sauber. Sweep nach dem Fix: alle 100
Karten, Dokumentüberlauf 0.

**Am echten Gerät bestätigt (14.08.):**
- Wischschutz — ein Wisch im Overlay schließt nicht und schaltet nicht um
- Streifen-Tap — der Bereich über und unter dem Bild schließt das Vollbild
- Karte-17-Überlauf — die Seite lässt sich nicht mehr seitlich schieben

**Am Rechner geprüft:** Tap aufs Bild schaltet um (1425 → 1393) und schließt
nicht · ✕ schließt · Leseposition nach dem Schließen unverändert (an
gescrollter Stelle gemessen, 900 → 900) · Fokus zurück aufs Panel · Desktop
ab 900 px unverändert (keine Knöpfe im Overlay, Fit-Ansicht, Cmd schließt
nicht, jede andere Taste schließt).

## Entscheidungen aus dem Chat, die nicht im Code stehen

- **Panelbreite bleibt bei 358 px auf Mobil.** Bewusst: bei 700–900 px würde
  das Panel eine Übersicht, keine Lesefläche — die kleinsten Schriftgrade
  (`FS_NODE_SUB = 11`) lägen bei 5–6 px. Gemessene Grundlage steht in
  `docs/diagramm-mobil-variante.md`.
- **Panel und Vollbild sind zwei Rollen, keine zwei Meinungen:** Übersicht im
  Fließtext, Lesefläche im Vollbild.
- **Schließverhalten ist nach Viewport geteilt** — Desktop behält „jeder Klick,
  jede Taste außer Modifiern", schmal bekommt ✕/Backdrop/Escape. Der Split
  nutzt `DRAG_MIN_VIEWPORT` (900) mit, statt eine zweite Grenze einzuführen;
  diese eine Zahl regiert Ziehgriff, Zoom-Modus und Schließverhalten.
- **Der Backdrop-Bug war in Runde 1 fälschlich als geprüft gemeldet**, weil der
  Test `ov.click()` auf dem Dialog aufrief — das setzt `target` künstlich auf
  den Dialog, was ein echter Tap nie tut. **Schließwege nur noch mit echten
  Koordinaten-Klicks prüfen.**

## Was noch offen ist

Alles drei ist bereits dokumentiert — hier steht nur der Verweis, der bisher
von keiner Stelle aus zu finden war:

1. **Die zehn Karten ohne Spec** (4, 7, 9, 25, 30, 37, 40, 54, 55, 80) zeigen
   weiter ihr `battle_card_N.svg` und haben **keine Legende** — auf Mobil
   fällt damit der Lesepfad weg, den die anderen 90 haben, und das Vollbild
   trägt den Fall allein. → `docs/diagramm-specs-fehlend.md`
2. **Nummern-Kollision zwischen Fließtext und Badges:** viele Karten nummerieren
   ihre Prosa-Schritte, und diese Zahlen decken sich **nicht** mit den Badges
   im Bild. Die Legendenüberschrift sagt deshalb „zum Diagramm" — das ist die
   billige Hälfte der Lösung, nicht die ganze.
   → `docs/diagramm-nummern-kollision.md`
3. **`#232F3E` steht an zwei Stellen** (`theme.py` als `T.INK`, hartkodiert im
   Legenden-Badge) — es fehlt eine gemeinsame Farbquelle für Diagramm-Farben
   in TS. → `docs/diagramm-farbquelle-fehlt.md`

Dazu als Langfrist-Option, bewusst nicht gezogen: eine eigene Mobil-Variante
der Diagramme (~800 px Canvas, umgebrochenes Layout). Aufwand Tage, inklusive
QC-Kette über 90 Karten. → `docs/diagramm-mobil-variante.md`
