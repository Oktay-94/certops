# Mobil-Variante der Diagramme (Langfrist-Option, nicht umgesetzt)

Notiert am 2026-08-14 im Zuge des Mobil-Lesbarkeits-Fixes. **Kein Code, keine
Entscheidung** — eine Option, die bewusst nicht gezogen wurde, mit den Zahlen,
die man für die Entscheidung braucht.

## Befund

Das Architekturdiagramm auf `/saa/szenarien/NN` war auf Mobilgeräten unlesbar.
Gemessen am Gerät und im Code bestätigt:

- Panelbreite bei 390 px Viewport: **358 px**, aus
  `globals.css` → `width: min(calc(100vw - var(--sbw) - 2rem), var(--diagram-w, 860px))`.
- Der Ziehgriff ist unter 900 px nicht gemountet (`DRAG_MIN_VIEWPORT`), bewusst.
- Das Vollbild half nicht: es rendert dasselbe Bild `object-contain` in einem
  `fixed inset-0 p-4`-Container, also wieder ~358 px.

Canvas der Web-SVGs: **1600 px breit**
(`tools/diagramkit/certops_diagram/canvas.py:87`). Höhen über alle 90
generierten Karten gemessen: **534 bis 1365 px**, Seitenverhältnisse **3:1 bis
1,17:1**, Median ≈ 1,7:1.

Daraus die entscheidende Zahl: bei 358 px Anzeigebreite ist der Maßstab
**0,22**. Beschriftungen (`FS_*` im Theme, 12 px aufwärts) landen bei 3–4 px.
Lesbar wird es ab etwa **1000–1100 px Renderbreite** — Faktor ~3 gegenüber
„fit". Jede Lösung muss also in beiden Achsen schieben lassen oder das Layout
neu brechen.

## Was stattdessen gebaut wurde

Skalieren und schieben, nicht neu zeichnen:

- Vollbild ist auf schmalen Viewports ein nativer Scroll-Container, Diagramm
  bei `max(1100px, 100vw)`, Panning über Browser-Scrolling.
- Die Legende (`card-NNN.json`) ist auf schmalen Viewports der eigentliche
  Lesepfad; ihr Badge bildet jetzt das SVG-Badge nach.

Das löst den Befund. Es ändert aber nichts daran, dass das Bild für 1600 px
gezeichnet ist.

## Die eigentliche Option: zweite Renderstufe

Eine echte Mobil-Variante hieße: zweiter Durchlauf des diagramkit auf ~800 px
Canvas mit **umgebrochenem Layout** — nicht skaliert, sondern neu angeordnet
(Bahnen untereinander statt nebeneinander, kürzere Kantenwege, größere
relative Schriftgrade).

Kosten, realistisch:

- **Generator anfassen.** Das Layout in den Specs ist auf 1600 px
  Koordinaten geschrieben. Ein Umbruch ist kein Parameter, sondern eine
  zweite Layout-Entscheidung pro Karte.
- **90 Karten neu rendern** plus die 10 ohne Spec
  (4, 7, 9, 25, 30, 37, 40, 54, 55, 80 — siehe
  `docs/diagramm-specs-fehlend.md`), die dann erst recht auffallen.
- **Komplette QC-Kette** pro neuem Asset (CLAUDE.md, Render-Toolchain):
  Abmessung, **R13 = 0 px** reines `(0,0,0)`, **Kanaldivergenz im Titelband
  = 0** (Subpixel-AA-Regression). Titelband SVG y 38–104, x 60–1500 — die
  Untergrenze 104 ist nicht beliebig (Karte 51 hat oranges
  `Replay ab Zeitpunkt` bei y=118, Karte 22 rotes `Failover 60–120 s…` bei
  y=127). Bei geändertem Canvas müssen diese Bänder **neu bestimmt** werden;
  die bestehenden Koordinaten gelten für 1600 px.
- **Doppelte Assets** in `public/scenarios/` plus eine Auswahllogik in
  `assetUrl` (`src/lib/scenario-content.ts`), die heute genau eine
  Fallback-Ebene hat und dann zwei bräuchte.

**Aufwand: Tage, nicht Stunden.**

## Wann das trotzdem richtig wird

Wenn das Handy dauerhaft ein Hauptlesegerät wird. Solange es die Ausnahme ist,
ist Scrollen plus Legende das bessere Verhältnis von Aufwand zu Wirkung —
und die Legende ist auf einem Telefon ohnehin das angenehmere Medium als ein
Bild, das man in zwei Achsen absuchen muss.
