#!/usr/bin/env python3
"""Befunde 140, 141, 142 und 143 aus HANDOFF-NARRATIVE-17.

Vier Aenderungen auf drei Karten, alle mit PIL gemessen, alle nach
Oktays Entscheidung vom 11.08.2026.

A) Befund 140, Karte 49. Sachfix. Die Insights-Box behauptet
   "haette gemeldet". Das Szenario ist ein geleerter Bucket, also
   DeleteObject-Aufrufe, also Data Events. Insights analysierte bis
   zum 20.11.2025 ausschliesslich Management Events und meldet Data
   Events auch heute nur, wenn der Trail Data Events loggt UND
   Insights fuer Data Events eingeschaltet ist. Oktays Entscheidung:
   Kartenzeile ergaenzen.

   Gewaehlt wurde die Erweiterung der bestehenden Zeile statt einer
   vierten Zeile. Begruendung, offengelegt: Eine vierte Zeile bei
   y=524 hat nur 1,67 px Luft zur Boxinnenkante (528,75). Die Box auf
   height 150 zu vergroessern haette 15,67 px gegeben, aendert aber
   die Boxgeometrie und macht damit die Freizonen aus dem
   urspruenglichen R7-Durchgang ungueltig. Die gewaehlte Variante
   misst 208,1 px bei 260 verfuegbar (25,9 px Reserve), aendert keine
   Geometrie und verliert keine Zeile.

B) Befund 142, Karte 50. R2-Schnitt. "nur Checkout" misst 100,1 px,
   der Korridor zwischen Targeted-Box (endet 1020) und CAPTCHA-Box
   (beginnt 1100) ist 80 px. Horizontal nicht loesbar. Oktays
   Entscheidung: Weg A, zweizeilig im Korridor.
   "nur" 25,2 px und "Checkout" 70,2 px, beide auf x=1060 zentriert.
   ACHTUNG: x=1060, nicht 1056. Bei 1056 haette "Checkout" nur 0,9 px
   Luft zur Targeted-Box. Bei 1060 sind es 4,9 px auf beiden Seiten.
   Vertikal: Badge 5 endet bei y=476, die erste Zeile beginnt bei
   486,3 - 10,3 px Abstand.
   DIE TEXTELEMENTZAHL VON KARTE 50 STEIGT VON 51 AUF 52.

C) Befund 143, Karte 50. Zahlenkonvention aus HANDOFF-16 Paragraf 2.2.
   "Immunity Time 300 s" steht in der CAPTCHA-Box. 300 ist dort der
   Default und bis 60 s absenkbar; fuer die Challenge-Action ist 300
   dagegen das Minimum. Die Zahl steht also in der Box, in der sie am
   wenigsten bindet, und ohne das Attribut. Ergaenzt um "default".
   Gemessen 202,1 px bei ~280 verfuegbar.

D) Befund 141, Karte 51. Renderfehler. "Replay ab Zeitpunkt" (151,6 px,
   x 814..966) kollidiert mit dem Untertitel (endet bei x=1049,5) um
   151,6 x 4,3 px. Ueber dem Untertitel ist kein Platz; rechts davon
   schon. Badge 6 wird mitgezogen, damit Label und Badge zusammen
   bleiben. Beide auf x=1150.
   Label danach x 1074,2..1225,8: 24,7 px Luft zum Untertitel,
   7,7 px zur Pfadecke bei x=1233,5.
   Badge danach x 1135..1165: liegt damit 5 px rechts neben dem
   Zonenrahmen (x800..1130), den er in der alten Position gekreuzt hat.
   Der Badge sitzt weiterhin auf dem horizontalen Pfadsegment
   (y=140, x 545..1235).

Idempotent: laeuft das Skript zweimal, passiert beim zweiten Mal nichts.
Aufruf im Verzeichnis mit den drei SVGs:

    python3 r2-fix-49-50-51.py
    python3 r2.py 49 50 51
    python3 collide.py 49 50 51

PNG UND PDF VON KARTE 49, 50 UND 51 MUESSEN DANACH NEU GERENDERT WERDEN.
Textelementzahl danach: 44 / 52 / 36 (Karte 50 plus eins).
"""
import pathlib
import sys

SVG_FIXES = {
    49: [
        # Befund 140. Gemessen: alt 115,8 px, neu 208,1 px, verfuegbar ~260.
        ('<text x="1340" y="474" font-size="15" fill="#444444" text-anchor="middle">hätte gemeldet</text>',
         '<text x="1340" y="474" font-size="15" fill="#444444" text-anchor="middle">meldet nur mit Data Events</text>'),
    ],
    50: [
        # Befund 142. Eine Zeile wird zwei. x 1056 -> 1060 zwingend.
        ('<text x="1056" y="510" font-size="15" fill="#0B5A66" text-anchor="middle">nur Checkout</text>',
         '<text x="1060" y="498" font-size="15" fill="#0B5A66" text-anchor="middle">nur</text>\n'
         '  <text x="1060" y="518" font-size="15" fill="#0B5A66" text-anchor="middle">Checkout</text>'),
        # Befund 143. Gemessen: alt 148,4 px, neu 202,1 px, verfuegbar ~280.
        ('<text x="1250" y="518" font-size="14" font-style="italic" fill="#666666" text-anchor="middle">Immunity Time 300 s</text>',
         '<text x="1250" y="518" font-size="14" font-style="italic" fill="#666666" text-anchor="middle">Immunity Time default 300 s</text>'),
    ],
    51: [
        # Befund 141. Badge und Label gemeinsam nach rechts.
        ('<circle cx="890" cy="140" r="15" fill="#D97706"/>',
         '<circle cx="1150" cy="140" r="15" fill="#D97706"/>'),
        ('<text x="890" y="146" font-size="17" font-weight="bold" fill="#FFFFFF" text-anchor="middle">6</text>',
         '<text x="1150" y="146" font-size="17" font-weight="bold" fill="#FFFFFF" text-anchor="middle">6</text>'),
        ('<text x="890" y="118" font-size="15" fill="#A85A05" text-anchor="middle">Replay ab Zeitpunkt</text>',
         '<text x="1150" y="118" font-size="15" fill="#A85A05" text-anchor="middle">Replay ab Zeitpunkt</text>'),
    ],
}

fehler = 0


def anwenden(pfad, ersetzungen):
    global fehler
    p = pathlib.Path(pfad)
    if not p.exists():
        print(f"FEHLT: {pfad}")
        fehler += 1
        return
    text = p.read_text(encoding="utf-8")
    angewandt, schon_da = 0, 0
    for alt, neu in ersetzungen:
        if alt in text:
            text = text.replace(alt, neu, 1)
            angewandt += 1
        elif neu in text:
            schon_da += 1
        else:
            print(f"  WARNUNG {pfad}: Suchtext nicht gefunden -> {alt[:70]}...")
            fehler += 1
    p.write_text(text, encoding="utf-8")
    print(f"{pfad}: {angewandt} angewandt, {schon_da} bereits gesetzt")


for nr, ersetzungen in SVG_FIXES.items():
    anwenden(f"battle_card_{nr}.svg", ersetzungen)

if fehler:
    print(f"\n{fehler} Problem(e) - PNG und PDF NICHT neu rendern, erst klaeren")
    sys.exit(1)
print("\nFertig. Jetzt r2.py und collide.py laufen lassen, dann PNG/PDF neu rendern.")
