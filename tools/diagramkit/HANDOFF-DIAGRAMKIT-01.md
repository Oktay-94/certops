# HANDOFF-DIAGRAMKIT-01

Phase 0 des Visualisierungs-Neubaus. Ergebnis: ein lauffähiges Paket, das aus
einer YAML-Spec ein geprüftes Architekturdiagramm erzeugt — in Druck- und
Web-Fassung plus Schrittliste als JSON.

## Was in diesem ZIP liegt

```
certops_diagram/
  icons.py          82 Kurznamen -> Icon-Dateien, plus Auto-Slugs für alle 809
  theme.py          Design-Tokens: Farben, Schriftgrößen, Maße
  canvas.py         Zeichenprimitive + eingebaute Qualitätsprüfung
  cli.py            python -m certops_diagram build …
  templates/
    fanout.py       Template 1 von 5: Verteiler mit N gleichartigen Bahnen
vendor/aws-icons/   809 offizielle AWS-Icons, Stand aws-icons 3.3.0
specs/
  card-005.yaml     Beispiel-Spec (Szenario 5, Fan-out)
build/              Beispielausgabe
```

## Sofort ausprobieren

```
cd <zielverzeichnis>
pip install pyyaml pillow cairosvg --break-system-packages
python -m certops_diagram build specs/card-005.yaml -o build
python -m certops_diagram icons kendra
python -m certops_diagram check
```

## Ausgabeformate je Karte

| Datei | Zweck |
|---|---|
| `<id>.svg` | Druckfassung mit Titel und Legende, für Keynote und PDF |
| `<id>.web.svg` | nur die Zeichnung, ohne Titel und Legende, für die App |
| `<id>.pdf` | Vektor für Folien |
| `<id>.png` | Raster, doppelte Auflösung |
| `<id>.json` | Titel, Untertitel, Schrittliste für die App |

Die Trennung ist die Umsetzung der Mobil-Entscheidung: Auf 380 Pixel Breite ist
eine im SVG eingebackene Legende unlesbar, egal wie gut die Zoom-Ansicht ist.
Die App rendert die Schritte deshalb als HTML neben dem Diagramm — lesbar ohne
Zoom, durchsuchbar, markierbar, später übersetzbar.

## Die Qualitätsprüfung

Läuft bei jedem `render()` und bricht standardmäßig hart ab. Vier Regeln:

1. **ZU BREIT** — Text passt nicht in seine Box (gemessen mit PIL gegen DejaVu)
2. **ZU HOCH** — Text läuft unten aus der Box, inklusive Unterlängen
3. **ÜBERLAPPUNG** — zwei Knoten oder ein Knoten und eine Rahmenbeschriftung liegen übereinander
4. **PFEIL DURCH BOX** — ein Pfeilsegment kreuzt eine fremde Box, statt an ihr anzudocken

Regel 3 und 4 ersetzen `zones.py` und `r16.py` vollständig. Regel 1 und 2 sind
`precheck.py` in eingebauter Form. Alle vier haben beim Nachbau der fünf
Handdiagramme echte Fehler gefunden, darunter zwei, die mir visuell durchgerutscht
waren.

Mit `--lax` wird trotz Befunden ausgegeben — nur zum Debuggen, nie für einen Batch.

## Was Claude Code als Nächstes bauen soll

### 1. Vier weitere Templates

Vorbilder liegen als Handskripte vor (`build_diagram.py`, `build_szenario3.py`,
`build_api.py`, `build_szenario4.py`). Jedes wird nach dem Muster von
`templates/fanout.py` überführt: feste Spalten als Modulkonstanten, variable
Anzahl von Elementen aus der Spec berechnet.

| Template | Form | Vorbild |
|---|---|---|
| `hybrid` | Rechenzentrum links, Brücke, Region, Querschnittsband | Kendra-Karte |
| `flow` | Eingang, Ablaufgruppe mit Zuständen, Ergebnisse, Querschnitt | Step-Functions-Karte |
| `chain` | eine durchgehende Kette mit verschachtelten Rahmen | API-Gateway-Karte |
| `beforeafter` | zwei gestapelte Panels, rot und grün | Fehlersuche-Karte |

Abnahme je Template: zwei echte Szenarien damit gebaut, QC ohne Befund,
optischer Vergleich mit dem Handvorbild.

### 2. Regel für Handkarten

Eine Karte darf von Hand gebaut werden, wenn sie in kein Template passt — aber
nur mit dokumentierter Begründung in der Spec (`manual_reason:`). Taucht dieselbe
Begründung dreimal auf, ist es kein Sonderfall mehr, sondern Template Nummer sechs.

### 3. App-Seite

Assets nach `public/scenarios/card-NN/`. Die Umstellung folgt der Big-Bang-Entscheidung:
Neue Dateien wandern nach jedem Batch ins Repo, die App rendert weiter die alten
Karten, und am Ende schaltet ein einziger Commit eine Konstante um. Rollback ist
dann ein `git revert`.

Komponentenskizze:

```tsx
// components/ScenarioDiagram.tsx
export function ScenarioDiagram({ card }: { card: string }) {
  const [zoom, setZoom] = useState(false);
  return (
    <figure>
      <button onClick={() => setZoom(true)} aria-label="Diagramm vergrößern">
        <img src={`/scenarios/${card}/${card}.web.svg`} alt="" className="w-full" />
      </button>
      <ol>{steps.map(s => <li key={s}>{s}</li>)}</ol>
      {zoom && <ZoomLayer src={`/scenarios/${card}/${card}.web.svg`} onClose={() => setZoom(false)} />}
    </figure>
  );
}
```

Für `ZoomLayer` eine Bibliothek nehmen, nicht selbst bauen. Pinch-Geste, Trägheit
und Randbegrenzung sind rund dreihundert Zeilen Sonderfälle, die niemand besitzen
will. Das ist die Begründung für die Dependency.

Offen und bewusst nicht entschieden: Dark Mode. Die Diagramme haben weißen
Hintergrund. Entweder ein heller Rahmen um das Diagramm oder eine zweite
Farbvariante in `theme.py`.

## Design-Freeze

Nach den ersten zehn Karten wird `theme.py` eingefroren. Jede Änderung danach
kostet einen Neulauf über alle fertigen Karten — billig bei zehn, teuer bei achtzig.

## Icon-Aktualisierung

AWS veröffentlicht die Icon-Pakete quartalsweise. Das Vendor-Verzeichnis ist
absichtlich eingecheckt und gepinnt, damit ein Update das Layout nicht unbemerkt
verschiebt. Vorgehen beim Update: neues Paket auspacken, `python -m certops_diagram check`
laufen lassen, gemeldete Kurznamen in `icons.py` nachziehen, alle Karten neu bauen,
QC muss ohne Befund durchlaufen.

## Lizenz

AWS erlaubt Kunden und Partnern ausdrücklich die Verwendung dieser Icons für
Architekturdiagramme, auch in Präsentationen und Lehrmaterial. Grenze ist die
Trademark-Richtlinie: kein Nachahmen des AWS-Erscheinungsbilds, kein Erwecken des
Eindrucks einer Partnerschaft. Der Quellenhinweis steht in jeder Druckfassung und
kommt aus `theme.FOOTER`. Falls CertOps je ein bezahltes Produkt wird, vor dem
Launch erneut prüfen.
