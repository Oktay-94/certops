# HANDOFF-DIAGRAMKIT-02

Phase 1, erste Sitzung. Ergebnis: zwei von vier fehlenden Templates, vier
gemeinsame Bausteine in `canvas.py`, acht Befunde.

## Stand

| Template | Herkunft | Stand |
|---|---|---|
| `fanout` | Phase 0 | fertig, unverändert |
| `kette` | `vorbilder/build_api.py` | **neu, fertig** |
| `vorher_nachher` | `vorbilder/build_szenario4.py` | **neu, fertig** |
| `ablauf` | `vorbilder/build_szenario3.py` | offen |
| `hybrid` | `vorbilder/build_diagram.py` | offen |

Vier Specs bauen ohne Befund durch: `card-005` (Referenz, unverändert),
`card-api`, `card-kette-min`, `card-vpc-endpoint`.

## Was in diesem ZIP liegt

```
certops_diagram/
  canvas.py                 + crossband, cross, tick, content_height
                            + Regel LEGENDE ZU BREIT
  templates/
    kette.py                neu
    vorher_nachher.py       neu
specs/
  card-api.yaml             API-Gateway-Vorlage, vollständig überführt
  card-kette-min.yaml       Prüfkarte: dieselbe Vorlage in Minimalform
  card-vpc-endpoint.yaml    Vorher/Nachher-Vorlage, vollständig überführt
build/                      Beispielausgabe aller vier Karten
```

`vendor/` liegt **nicht** im ZIP. Es ist unverändert und in deinem Repo bereits
eingecheckt. `theme.py`, `icons.py`, `cli.py` sind unverändert.

## Template `kette`

Ein Weg von links nach rechts durch geschachtelte Rahmen. Die häufigste Form:
Anfrage erreicht einen Eingangsdienst, läuft über Zwischenstationen zum Ziel und
überquert dabei Zonengrenzen.

**Nichts an der Geometrie steht in der Spec.** Gerechnet wird:

* **x je Glied** aus der Summe der vorherigen Breiten. Der Abstand wächst an
  jeder Rahmengrenze — ohne diesen Aufschlag klebt der Pfeil an der Rahmenkante.
* **Zeilenhöhe** aus dem inhaltsreichsten Glied.
* **Rahmen** aus der Zugehörigkeit der Glieder. Ein Glied sagt
  `in: [cloud, region, vpc]`; das Template legt die Rahmen um die Spanne und
  leitet die Schachtelung aus den Mengenverhältnissen ab. Ein Glied, das `cloud`
  nicht nennt, liegt außerhalb der Wolke — so kommt das Rechenzentrum an die
  richtige Stelle, ohne dass jemand Koordinaten tippt.
* **Zeilenposition** aus der Schachtelungstiefe, damit der äußerste Rahmen nicht
  in die Unterzeile schneidet.

Optional: `outside` (Akteur vor der Wolke), `hero` (ein hervorgehobenes Glied),
`branch` (Nebenzweig unter der Kette), `crossband` (Querschnittsband),
`note` je Glied (Beschriftung über dem eingehenden Pfeil).

Der einzige Positionierungs-Eingriff, den die Spec kennt, ist `align_with` im
Nebenzweig: ein Glied unter einem bestimmten Kettenglied ausrichten. Das ist
eine Beziehung, keine Koordinate.

**Grenzen:** Bricht ab, wenn die Kette breiter als die Fläche wird — mit
Angabe, um wie viele Pixel. Zweizeilige Ketten kann sie nicht; das wäre ein
eigenes Template.

## Template `vorher_nachher`

Zwei gestapelte Paneele, kaputt oben, repariert unten. Für Fehlersuch-Karten.

Der didaktische Wert entsteht erst dadurch, dass beide Hälften **dasselbe
Skelett** zeigen und sich nur an den Stellen unterscheiden, um die es geht.
Deshalb steht das Grundgerüst genau einmal in der Spec (`base`) und je Panel nur
das Delta (`panels`). Wäre das Gerüst zweimal beschreibbar, würden die Hälften
über die Zeit auseinanderdriften.

Gerechnet werden Panelhöhe aus dem Inhalt, Position der Zusatzknoten im Subnetz,
Höhe des Einschubs aus der Zeilenzahl, Rahmenoberkanten aus der Knotenzeile.

Zwei Einschub-Arten: `kind: gap` zeichnet den gestrichelten roten Fehlkasten
(„hier fehlt etwas"), alles andere einen gewöhnlichen Knoten in Grün.

**Grenzen:** Genau zwei Paneele in der Reihenfolge `broken`, `fixed` — die Karte
erzählt erst das Problem, dann die Lösung. Die Spaltenaufteilung ist fest, weil
beide Paneele deckungsgleich sein müssen. Bricht ab, wenn die Zusatzknoten nicht
mehr ins Subnetz passen.

## Neu in `canvas.py`

| Baustein | Zweck |
|---|---|
| `crossband(x, y, w, items, heading)` | Querschnittsband. Knotenbreite aus verfügbarer Breite und Anzahl gerechnet — in den Handskripten dreimal mit leicht abweichenden Werten gesetzt. |
| `cross(cx, cy)` / `tick(cx, cy)` | rotes Kreuz, grüner Haken |
| `content_height(...)` | Wie hoch muss eine Box sein, damit ihr Text hineinpasst? Spiegelt die Setzung in `node()`. Templates raten damit keine Zeilenhöhe mehr. |

Neue Prüfregel **`[LEGENDE ZU BREIT]`**: meldet Legendeneinträge, die außerhalb
der Fläche gezeichnet würden, und eine Spaltenzahl, die nicht zur Anzahl der
Einträge passt.

## Befunde

**Aus den neuen Templates:**

1. **Rahmen mit gleicher Mitgliedschaft landeten auf derselben Ebene.** Cloud
   und Region umfassen oft dieselben Glieder; echte Teilmenge ist bei Gleichheit
   falsch. Jetzt entscheidet die Reihenfolge in der Spec. Wurzel zweier
   scheinbar unabhängiger Überlappungsbefunde.
2. **Das Rechenzentrum lag innerhalb der Region** — fachlich falsch. Behoben
   über das Mitgliedschaftsmodell.
3. **Enge Rahmen ragten unten aus den äußeren heraus.** Nur im Minimalfall
   sichtbar, in der vollen Karte vom Querschnittsband verdeckt. Das ist das
   Argument für die zweite Prüfkarte je Template.
7. **Nummern standen in Zeichenreihenfolge statt in Leserichtung** — die Ursache
   bekam die 1, der Weg die 2 und 3. Umgedreht.

**Aus dem Altbestand, beim Bauen aufgefallen:**

4. **Die Legende verlor zwei von elf Einträgen.** Die vierte Spalte begann bei
   x=1600 und wurde lautlos außerhalb der Fläche gezeichnet. Behoben, plus neue
   Regel.
5. **Die Web-Fassung trug die Legendenüberschrift**, obwohl sie titel- und
   legendenfrei sein soll. Betraf auch die Referenzkarte. Behoben.
6. **Flächenmaße waren Bruchzahlen**, seit die Höhen aus dem Inhalt kommen.
   Aufrundung zentral in `Canvas.__init__`. Behoben.
8. **`fanout.py` rechnet 135 Pixel Legendenraum fest ein**, unabhängig von den
   Einträgen. Die Web-Fassung von `card-005` trägt deshalb 135 Pixel Leerraum
   und ist genauso hoch wie die Druckfassung. **Nicht behoben** — jede Korrektur
   dort verschiebt auch die Druckhöhe der Referenzkarte. Entscheidung offen.

## Offen, für dich

**Quellenhinweis in der Web-Fassung.** Titel und Legende fallen dort bewusst
weg. Der Icon-Nachweis steht weiterhin drin. Das ist eine Lizenzfrage, keine
Layoutfrage — nicht ohne Entscheidung festschreiben.

**Umfang des Design-Freeze.** Das Übergabedokument friert nach Karte zehn nur
`theme.py` ein. Nach dieser Sitzung gehört `canvas.py` dazu: die Geometrieregeln
dort wirken inzwischen genauso karten-übergreifend wie die Farbtokens.

**Befund 8** siehe oben.

## Nächste Sitzung

Templates `ablauf` (aus `build_szenario3.py`) und `hybrid` (aus
`build_diagram.py`). Beim Hybrid-Template ist die offene Frage der automatische
Umbruch der Rechenzentrumsknoten bei variabler Anzahl — das handgesetzte
2×2-Raster wird ersetzt, nicht nachgebaut. Entschieden wird mit dem Rendering
vor Augen.

Je Template gilt weiterhin: eine vollständige Überführung der Vorlage **und**
eine bewusst gegensätzliche Prüfkarte. Befund 3 wäre ohne die Prüfkarte nicht
aufgefallen.
