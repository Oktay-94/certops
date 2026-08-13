# Diagramm-Specs — Bestandsaufnahme 13.08.2026

Stand nach dem Entpacken der zehn `certops-specs-*.zip` aus `~/Downloads`:
**90 von 100 Specs liegen vor.**

## Nicht vorhanden

4, 7, 9, 25, 30, 37, 40, 54, 55, 80

## Beobachtung

Die zehn Nummern verteilen sich auf **fünf verschiedene Batches**, nicht auf einen:

| Batch-ZIP | enthält | nicht enthalten |
|---|---|---|
| `certops-specs-01-10` | 7 | 4, 7, 9 |
| `certops-specs-21-30` | 8 | 25, 30 |
| `certops-specs-31-40` | 8 | 37, 40 |
| `certops-specs-51-60` | 8 | 54, 55 |
| `certops-specs-71-80` | 9 | 80 |

Die übrigen fünf ZIPs (`11-20`, `41-50`, `61-70`, `81-90`, `91-100`) sind
vollständig. Es gibt keine Dubletten und keine Dateinamen-Kollisionen; das
`id`-Feld stimmt in allen 90 Specs mit dem Dateinamen überein.

Weil die Lücken über fünf Batches streuen und nicht an einer Bereichsgrenze
liegen, ist die naheliegende Lesart, dass sie in den jeweiligen Batch-Chats
aufgefallen und dort vermerkt sind.

**Diese Datei ist bewusst keine Aufgabenliste.** Warum die zehn Specs fehlen,
ist hier nicht bekannt — sie können in den Ursprungs-Batches längst erledigt,
bewusst zurückgestellt oder schlicht nicht mitverpackt worden sein. Ein
„nachliefern" zu behaupten, hieße einen Grund zu erfinden. Wer den Stand kennt,
trägt ihn hier nach.

## Nebenbefund: zwei Namenskonventionen

60 Specs sind dreistellig gepolstert (`card-005.yaml`), 30 nicht:
`card-41`–`card-50`, `card-61`–`card-70`, `card-81`–`card-90`.

Das ist beim späteren Rollout relevant, weil `build_one()` in
`tools/diagramkit/certops_diagram/cli.py` den Ausgabenamen aus dem `id`-Feld im
YAML zieht — ungepolstert entstünde `card-41.web.svg` neben `card-041.web.svg`.
Beim Entpacken ist auf `card-NNN` zu normalisieren, Dateiname **und** `id`.

## Bekannter Mangel in `cli.py` — Fehler werden als Erfolg gezählt

**Nicht behoben, bewusst nicht heute repariert.** Die Fassung aus
`certops-diagramkit.zip` ist byte-identisch mit der im Repo, bringt also keinen
Fix mit.

`main()` in `tools/diagramkit/certops_diagram/cli.py` fängt nur `Finding` ab.
Zwei Fehlerpfade laufen daran vorbei:

1. `spec = load(p)` steht **vor** dem `try` — ein defektes Spec wirft ungefangen.
2. `_template()` läuft zwar innerhalb von `build_one()` und damit im `try`, wirft
   aber `ModuleNotFoundError`, wenn das Template fehlt. Gefangen wird nur
   `Finding`.

In beiden Fällen erscheint ein Traceback statt der Meldung `ABGELEHNT`.

**Praktische Folge, einmal real passiert:** Wer den Sammellauf auf das Wort
„ABGELEHNT" filtert, zählt gescheiterte Karten als gebaut. Im ersten
Rollout-Anlauf am 13.08. meldete der Lauf „90 gebaut, 0 abgelehnt", tatsächlich
waren es 62 — die 28 Karten mit den damals fehlenden Templates `ablauf` und
`hybrid` waren mit Traceback gescheitert. Aufgefallen ist es erst beim Kopieren,
als nur 62 Zielordner Dateien bekamen.

**Bis das behoben ist:** Erfolg am *Vorhandensein der Ausgabedatei* messen, nicht
am Fehlen eines Schlüsselworts. Ein Fix würde `load()` in den `try` ziehen und
neben `Finding` auch `ModuleNotFoundError` sowie `Exception` behandeln, mit
unterscheidbaren Meldungen für „Spec kaputt", „Template fehlt" und „QC
abgelehnt".

## Nebenbefund: Kit-Vorlagen sind keine Karten

`tools/diagramkit/specs/` enthält neben den Kartenspecs die Vorlagen
`card-api.yaml`, `card-kette-min.yaml` und `card-vpc-endpoint.yaml`. Sie sehen
aus wie Karten, sind aber Testmaterial des Kits. Der Sammellauf darf sie nicht
als Karten rendern — Auswahl über eine Whitelist der Nummern 1–100, nicht über
einen Glob auf `card-*.yaml`.

Die im Repo liegende Fassung von `card-005.yaml` (Template `fanout`,
„Szenario 5 · Fan-out") ist ebenfalls eine Vorlage und beschreibt eine andere
Karte als die echte Nummer 5 (`battle_card_5.md`: „Battle Card 5 — AWS App
Runner · ECR"). Sie wird beim Rollout durch die ZIP-Fassung ersetzt.
