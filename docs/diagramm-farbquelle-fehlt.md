# Diagramm-Farben haben keine gemeinsame Quelle in TS

Notiert am 2026-08-14. **Bekannte Schuld, niedrig-Prio, bewusst nicht gelöst.**

## Der konkrete Fall

`#232F3E` — das Diagramm-Ink — steht jetzt an zwei Stellen:

| Ort | Form |
|---|---|
| `tools/diagramkit/certops_diagram/theme.py:~31` | `INK`, gilt für alles Gezeichnete: Badge-Ring, Badge-Ziffer, Knotenrahmen |
| `src/app/[exam]/szenarien/[nr]/page.tsx` (Legenden-Badge) | hartkodiert als `border-[#232F3E]` und `text-[#232F3E]` |

Entstanden beim Mobil-Lesbarkeits-Fix (siehe `diagramm-mobil-variante.md`):
Das Legenden-Badge bildet seit dem das SVG-Badge nach — weiße Füllung,
dunkler Ring, dunkle fette Ziffer — statt wie vorher accent-gefüllt mit
weißer Ziffer. Damit die beiden Ziffern als dieselbe Zahl lesbar sind,
muss die Web-Seite eine Farbe kennen, die bisher nur der Python-Renderer
kannte.

## Warum das eine Schuld ist und keine Kleinigkeit

Die Farbe ist jetzt an einer Stelle definiert und an einer anderen
**abgeschrieben**. Ändert jemand `T.INK` im Renderer und rendert die Karten
neu, bleibt das Legenden-Badge auf dem alten Wert stehen — und der Bruch ist
genau der Bezug, den die Angleichung herstellen sollte. Es gibt keinen Test,
der das bemerkt.

Das Projekt hat für so etwas ansonsten zentrale Quellen:
`src/lib/domain-colors.ts` und `src/lib/saa-script-categories.ts`. Für
Diagramm-Farben gibt es keine.

## Was fehlt

Ein `src/lib/diagram-colors.ts` als TS-Gegenstück zu
`tools/diagramkit/certops_diagram/theme.py` — mindestens `INK`, vermutlich
auch `ACCENT` (`#146EB4`) und die Hint-Farben, sobald weitere Diagramm-Details
in der Web-UI auftauchen.

Der ehrliche Teil des Problems: zwei Sprachen, eine Wahrheit. Handgepflegte
Spiegelung verschiebt die Schuld nur. Sauber wäre, `theme.py` beim Rendern
eine kleine JSON-Datei mit ausschreiben zu lassen, die die TS-Seite importiert
— dann ist der Renderer weiterhin die Quelle und die Web-Seite kann nicht
auseinanderlaufen.

## Warum jetzt nicht

Der Auftrag war die Mobil-Lesbarkeit, nicht eine Farb-Infrastruktur. Eine
Datei anzulegen, die genau eine Konstante spiegelt, wäre die Abstraktion vor
dem zweiten Anwendungsfall. Sinnvoller Auslöser: sobald eine **dritte** Stelle
eine Diagramm-Farbe braucht — oder sobald `theme.py` das erste Mal wirklich
angefasst wird.
