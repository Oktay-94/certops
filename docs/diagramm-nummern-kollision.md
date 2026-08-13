# Zwei Nummernkreise auf einer Seite

**Offen. Content-Arbeit, keine UI-Aufgabe.** Aufgenommen 13.08.2026 beim
Diagramm-Rollout.

## Der Befund

Die Szenario-Detailseite trägt zwei unabhängige Nummerierungen:

- die **Badges im Diagramm** (aus `card-NNN.yaml`, aufgelöst in der Legende)
- die **Schrittliste im Fließtext** von `battle_card_N.md` (`**N — …**`)

Sie stimmen bei den meisten Karten nicht überein. Gemessen über alle 90 Karten
mit generiertem Diagramm:

- **64 Karten** haben eine nummerierte Schrittliste im Fließtext
- **49 davon haben eine andere Anzahl Badges als Textschritte**
- Badges je Karte: 3 bis 8

## Warum das mehr ist als eine Zahlenungleichheit

Karte 92 als Beispiel:

| Nr. | Fließtext | Diagramm-Badge |
|---|---|---|
| 1 | Modell liegt in der Cloud | Modell als Artefakt in S3 — **deckt sich** |
| 2 | Deployment schiebt Komponenten aufs Gerät | dito — **deckt sich** |
| 3 | Core-Gerät rechnet lokal | **Stream Manager exportiert Gepuffertes** |
| 4 | Stream Manager puffert und holt nach | *(kein Badge)* |

**Dass die ersten beiden Nummern übereinstimmen, ist die eigentliche Falle.**
Wer 1 und 2 abgleicht und Übereinstimmung findet, setzt auch die 3 gleich — und
landet beim falschen Element. Textschritt 3 hat gar kein Badge, Badge 3 ist
Textschritt 4.

## Was bereits getan ist

Die Legende auf der Detailseite trägt die Überschrift **„Legende zum
Diagramm"**. Das macht sichtbar, zu welchem Nummernkreis die Ziffern gehören,
und nimmt der Verwechslung die Selbstverständlichkeit.

**Es behebt sie nicht.** Beide Nummernkreise stehen weiterhin nebeneinander auf
derselben Seite.

## Mögliche Lösungen

Beide sind Content-Arbeit über 49 Karten, keine Codeänderung:

1. **Specs umnummerieren** — die Badges an die Fließtext-Schritte angleichen.
   Bedeutet, Diagramme neu zu bauen und Karten mit mehr Textschritten als
   sinnvollen Badges zu klären.
2. **Fließtexte umnummerieren** — die Schrittliste in `battle_card_N.md` an die
   Badges angleichen. Berührt den Lernstoff und damit die inhaltliche Aussage.

Ein dritter Weg wäre, die Fließtext-Nummerierung ganz aufzugeben und die Schritte
unnummeriert zu führen. Das löst die Kollision ohne Abgleicharbeit, kostet aber
die Verweisbarkeit im Text.

## Betroffene Karten

11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 28, 29, 33, 34, 35, 36, 38,
39, 41, 42, 43, 44, 45, 46, 47, 48, 50, 51, 56, 61, 63, 64, 65, 66, 69, 70, 86
und weitere — die Liste stammt aus einem Abgleich von Badge-Anzahl gegen
`**N —**`-Vorkommen und ist als Ausgangspunkt gedacht, nicht als Endstand: sie
zählt nur Karten mit **abweichender Anzahl**. Karten mit gleicher Anzahl, aber
verschobener Bedeutung — wie Karte 92 es teilweise ist — fallen dabei nicht auf
und brauchen eine inhaltliche Prüfung.
