# HANDOFF-NARRATIVE-17 — Narrativ-Batch 17, **Teil 1 von 2** (Karte 49)

> **Erstellt:** 11.08.2026 · **Spec:** NARRATIVE-SPEC **v1.1** (§4-Patch in HANDOFF-05 §5.1, weiterhin nicht im Project-Knowledge-Text; §6 seit 10.08. im Repo unter `docs/`) + Konventionen aus HANDOFF-02 §2 bis -16 §2
> **Ablage empfohlen:** `~/Projekte/certops/docs/narrative-handoffs/`

> ⚠️ **Dieser Batch ist nicht abgeschlossen.** Karte 49 ist geschrieben und guard-grün. Karten 50 und 51 stehen aus. Der Faktencheck für beide ist jedoch bereits gelaufen und vollständig in §4 dokumentiert — der Folgechat muss ihn **nicht** wiederholen, sondern nur die dort offenen Punkte schließen.

---

## 1. Stand

| | |
|---|---|
| Geschrieben | **49 von 100** (Karten 1–49) |
| Dieser Batch, Teil 1 | Karte 49 — CloudTrail-Forensik mit Athena |
| Dieser Batch, Teil 2 | Karten 50, 51 — im Folgechat, Faktencheck liegt vor |
| Guard-Tests §7 | **0 Befunde** |
| Wortzahl | Karte 49: 2.434 (Erstdurchgang 2.456, zweimal gekürzt) |
| Repo-Integration | Narrative 1–39 sind live; 40–49 per Copy nachzuziehen |
| Kartenbefunde | 11 neue (140–150), davon **zwei schwere Sachbefunde**, **ein Renderfehler**, **ein R2-Fehler** |
| Kartenfixe | **Vier beschlossen, angewandt, gerendert und gesehen** |
| Rendering | **Neu im Container**, PNG + PDF für 49/50/51 liegen bei. R8 erstmals durchgeführt |
| Geschlossene Schuld | **(f) Athena-Reservierungsminimum** — Antwort: 4 DPU |

---

## 2. Konventionen aus diesem Batch

### 2.1 🚨 Der neue Faustwert aus HANDOFF-16 §1 ist nicht falsch — er beschreibt einen anderen Arbeitsablauf

Ich habe im Chat zunächst behauptet, die Formel `Kästen × 175 + Badges × 120 + 900` überschätze um rund 550 Wörter, weil sie für Karte 46 (7 Kästen, 5 Badges) 2.725 prognostizierte, während der Erstdurchgang dort 2.169 ergab. **Das war voreilig.** Karte 49 hat exakt dieselben Kennzahlen — 7 Kästen, 5 Badges, Prognose 2.725 — und der Erstdurchgang ergab **2.456**. Die Abweichung schrumpft von 556 auf 269.

Der Unterschied liegt nicht in der Karte, sondern in der Planung: Karte 46 hatte im Erstdurchgang **neun** H3 und bekam den zehnten erst über Stufe 1 nachgereicht. Karte 49 wurde von Anfang an mit **zwölf** H3 geplant — jedes Kartenelement bekam einen, einschließlich der vier Pfeile ohne eigenen Kasten und der Randnotiz.

> **Konvention: Stufe 1 ist keine Nachbesserung mehr, sondern eine Planungsvorgabe. Vor dem ersten Absatz wird die H3-Liste aufgestellt, und zwar mit einem H3 je Kartenelement — Kästen, Pfeile, Randnotizen, verworfener Weg. Dann trifft der Faustwert aus HANDOFF-16 §1 auf rund 10 % genau, und der Text muss am Ende gekürzt statt gestreckt werden. Kürzen ist die bessere Richtung: Es entfernt Redundanz, Strecken erzeugt sie.**

Erstmals seit Batch 13 lag ein Text **über** der Marke statt darunter. Das ist der gewünschte Zustand.

### 2.2 🚨 Ein Kartensatz kann durch ein AWS-Update wahr geworden sein, das nach dem Zeichnen kam

Befund 140 ist eine neue Sorte. Die Insights-Zeile „hätte gemeldet" war zum Zeitpunkt des Zeichnens **wahr** — aber nur, weil AWS acht Monate vorher eine Erweiterung ausgeliefert hatte, die auf der Karte nicht vorkommt und die Opt-in ist. Nach dem Dokumentationsstand, den drei Übersichtsseiten des User Guide bis heute beschreiben, wäre die Zeile falsch.

Das unterscheidet sich von Befund 129 (Batch 16). Dort musste eine **Voreinstellung** wahr sein. Hier musste ein **Dienstupdate** existieren *und* eingeschaltet sein.

> **Konvention: Beim Ganzheitsdurchgang wird als dritte Frage geprüft, ob eine Kartenaussage von einer Funktion abhängt, die jünger ist als das übrige Kartenmaterial. Wenn ja, gehören Datum und Opt-in-Charakter ins Narrativ — und wenn die Aussage ohne die Funktion falsch wäre, auf die Karte.**

### 2.3 ⚠️ Die AWS-Sammelankündigung zu Verfügbarkeitsänderungen ist ein Pflicht-Grep für die gesamte Kartenkette

Die Seite `aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability` listet in einem Aufwasch neun Dienste und Features, die in Maintenance gehen, vier im Sunset und eines am Ende des Supports. Drei davon treffen den Masterplan (§4.4). **Gefunden wurde sie zufällig**, bei der Recherche zum CloudTrail-Lake-Datum.

> **Konvention: In jedem Batch wird die aktuelle AWS-Service-Availability-Seite gegen den gesamten Masterplan gegriffen, nicht nur gegen die drei Karten des Batches. Ein Dienst, der für Neukunden schließt, entwertet jede Karte, die ihn als Antwort führt — auch eine, die längst live ist.**

### 2.4 Der Umlaut-Grep war zum zweiten Mal in Folge leer — er läuft trotzdem weiter

0 Kandidaten auf allen drei Karten. Stufe 2 entfiel. Regel aus HANDOFF-15 §2.3 unverändert.

### 2.5 🚨 Regel F9 galt zum zwölften Mal nicht — und R8 war zum ersten Mal überhaupt durchführbar

Die PNGs von 49 und 50 waren als auswertbare Bilder verfügbar. Auf Karte 50 war der Schnitt von `nur Checkout` an der Targeted-Box im Bild erkennbar, bevor `r2.py` ihn bestätigte.

**Neu und ohne Vorbild in der Kette: Nach dem Neurendern im Container konnten alle drei Karten tatsächlich gesehen werden.** Sämtliche `status_note`-Einträge der Karten 46 bis 51 vermerken „Sichtprüfung versucht, Bildobjekt ohne lesbaren Inhalt". Das gilt nicht mehr. Die Sichtprüfung hat zwei Dinge ergeben, die keines der Skripte findet:

**Beobachtung A — Karte 49, das Label „Falle" steht 200 px von seinem Badge entfernt.** Badge 5 sitzt bei x=950, das zugehörige Label bei x=1150. Dazwischen liegt nichts, und direkt darüber steht „parallel" (x=1180), das zu Pfeil 4 gehört. Zwei Labels verschiedener Pfeile stehen übereinander, 45 px auseinander, beide rechts der Athena-Box. Gerettet wird die Zuordnung allein durch die Farbe — „Falle" ist gold wie sein Pfeil, „parallel" teal wie seiner. **Kein Befund nach geltender Regel**, weder Schnitt noch Kollision. Aber ein Kandidat für eine neue Prüfung.

> **Vorschlag für eine Prüfung R19: Abstand zwischen einem Pfeil-Label und seinem Badge. Überschreitet er einen Schwellwert — 120 px wären auf Basis dieser Karte ein Anfang — ist die Zuordnung nur noch über die Farbe lesbar und damit für Farbfehlsichtige gar nicht. Vor der Einführung an den Karten 1–48 kalibrieren, sonst produziert sie Dutzende Altbefunde.**

**Beobachtung B — Karte 49, der Merksatz steht in Spannung zur korrigierten Boxzeile.** Der Footer sagt „Insights erkennt live, Athena rekonstruiert", die Box sagt jetzt „meldet nur mit Data Events". Nach Prüfung **kein Befund**: Der Merksatz kontrastiert die Zeitachse (währenddessen gegen nachträglich), nicht die Abdeckung. Er bleibt richtig. Festgehalten, weil die Prüfung beim nächsten Mal nicht erneut laufen muss.

### 2.7 🚨 Neue technische Schuld: Der Container rendert nicht mehr identisch zu den Karten 1–48

Karte 49 wurde vor dem Fix aus dem unveränderten Original-SVG neu gerendert und **pixelweise gegen das vorhandene PNG** abgeglichen. Ergebnis:

| Prüfung | Ergebnis |
|---|---|
| Bildgröße | identisch, 2400 × 1350 (scale 1,5) |
| Linien, Pfeile, Boxränder | **0 abweichende Pixel** |
| Glyphen | 123.700 abweichende Pixel, 3,8 % der Fläche |
| Titel-Bounding-Box | Referenz endet x=1728, neu x=1736 — **+8 px auf 1.640 px Textbreite** |
| Footer-Bounding-Box | Referenz endet x=1809, neu x=1803 — **−6 px auf 1.710 px** |
| R13 reines Schwarz | beide **0 px** |
| R18 Kanaldivergenz Titelband | beide **max 91**, 3.436 gegen 3.061 px |

Die Geometrie ist also exakt reproduzierbar, die Glyphenrasterung nicht. Vier Hinting-Varianten (`hintnone`, `hintslight`, `hintmedium`, `hintfull`) wurden gegen die Referenz getestet — **keine trifft**. Die Ursache liegt unterhalb von Fontconfig, in einer anderen freetype- oder DejaVu-Version des Base-Image. CairoSVG (2.9.0) und der R18-Patch sind identisch.

**Das ist nicht reparierbar und betrifft jeden künftigen Container gleichermaßen.** Die Abweichung liegt bei 0,3 bis 0,5 % der Textbreite und ist mit bloßem Auge nicht sichtbar; die drei gerenderten Karten wurden gesehen und sind einwandfrei. Beide messbaren Pipeline-Regeln (R13, R18) verhalten sich identisch zur Referenz.

> **Konvention: Renderergebnisse werden ab sofort gegen die Regeln geprüft (R13, R18, R7), nicht gegen Bit-Gleichheit mit früheren Karten. Bit-Gleichheit ist ab Karte 49 nicht mehr herstellbar. Wo eine Prüfung auf Sub-Pixel-Ebene arbeitet — insbesondere `zones.py` mit seinem 1,2-%-Puffer gegen die ~1,7 % CairoSVG-PIL-Divergenz — muss der Puffer gegen den neuen Renderstand nachgemessen werden, bevor die nächste Karte gezeichnet wird.**

⚠️ **Lokales Rendern auf dem Mac ist kein Ausweg und wurde verworfen.** Diagnose vom 11.08.: Das venv unter `~/Projekte/certops/.venv` ist nicht aktiv, `cairosvg` fehlt, und die DejaVu-Fonts sind auf macOS nicht installiert. Cairo und Pango liegen zwar per Homebrew vor, aber Homebrew-Cairo auf ARM gegen Linux-Cairo ist genau die Divergenz, gegen die R18 überhaupt geschrieben wurde. Der Docstring von `render.py` sagt es selbst: „Der Container-Cairo …".

### 2.6 Die Kastenzahl-Abweichung von `qc.py` ist jetzt viermal in Folge konstant

`qc.py` meldet laut `status_note` 8 / 9 Boxen für die Karten 49 und 50; der Grep aus HANDOFF-14 §2.1 ergibt **7 / 8**. Karte 51 meldet 8 gegen 7 gezählte plus einen Zonenrahmen. Wieder überall genau eine zu viel. Der Footer-Rect bleibt der wahrscheinlichste Kandidat.

---

## 3. Slugs und Nummern nach diesem Batch (49 Stück)

| Nr | Slug |
|---|---|
| 49 | `cloudtrail-organization-trail-athena-partition-projection-eichkamp-energie-forensik-nach-vier-monaten` |

**Die mitgelieferte `check.py` enthält bereits Batch 16 (Slugs *und* Nummern 46–48).** Der Nachtrag wurde selbst getestet: `card-46-narrative.md` gegen die gepatchte Fassung ergab **2 Befunde** (Nummer *und* Slug), Exit 1. Für Teil 2 ist zusätzlich die Zeile oben plus `49: "Batch 17"` nachzutragen.

**Firmenname — einer neu, kollisionsfrei:** „Eichkamp Energie" (49). Präfix `Eich-` und Suffix `-kamp` sind beide neu.

⚠️ Bei der Wahl gemieden: `Nord*` (dreimal), `Falke*`, `Berg*`, `Tal*`, `Weiß-`, `Immen-`, `Uhlen-`, sowie die Suffixe `-dorn`, `-ried`, `-brook`, `*bach`, `*kontor`, `*stein`, `*werk`, `*bank`, `* Payments`.

✅ **Branchengegensteuerung umgesetzt.** HANDOFF-16 §3 forderte sie ausdrücklich für Karte 49. Gewählt wurde ein **Energieversorger** — neu in der Kette. Gemieden: Versicherung (44, 47), Finanz/Zahlung (39, 45, 46), Logistik/Spedition (31, 32, 41), Pharma/Klinik (38, 43), Maschinenbau (48).

---

## 4. Kartenbefunde dieses Batches (Nr. 140–150)

### 4.1 Karte 49 — drei Befunde, einer schwer

**140 🚨🚨 Ganzheitsdurchgang: „hätte gemeldet" trug das Szenario nicht.**

Ein geleerter Bucket besteht aus `DeleteObject`- und `DeleteObjects`-Aufrufen, also aus **Data Events**. Der Quellenstand:

| Quelle | Was Insights analysiert |
|---|---|
| User Guide, *Working with CloudTrail Insights* | **nur Management Events** |
| User Guide, *CloudTrail concepts* | **nur Management Events** |
| User Guide, *Understanding CloudTrail events* | **nur Management Events** |
| User Guide, *Logging Insights events with the console* | Management **oder** Data Events |
| User Guide (China), *Working with CloudTrail Insights* | Data Events |
| What's New, 20.11.2025 | Erweiterung auf Data Events, vorher ausschließlich Management |
| Cloud Operations Blog, 24.11.2025 | Data Events müssen im Trail aktiviert sein |

Der Sachstand ist eindeutig: Seit dem 20.11.2025 kann Insights Data Events. Drei Übersichtsseiten des User Guide sind nicht nachgezogen — dieselbe Bauart wie der Vierfach-Konflikt aus Befund 128.

Damit trägt die Kartenaussage nur unter zwei Bedingungen, die nicht auf der Karte standen: Der Trail muss Data Events loggen, **und** Insights muss für Data Events eingeschaltet sein. Beides Opt-in, beides zusätzlich kostenpflichtig.

**Oktays Entscheidung 11.08.: Kartenzeile ergänzen.** Umgesetzt in `r2-fix-49-50-51.py`.

⚠️ **Abweichung vom naheliegenden Weg, offengelegt.** Statt einer vierten Zeile wurde die bestehende Zeile ersetzt: `hätte gemeldet` → `meldet nur mit Data Events` (115,8 px → 208,1 px, verfügbar ~260). Grund: Eine vierte Zeile bei y=524 hätte nur **1,67 px** Luft zur Boxinnenkante gehabt. Die Box auf `height 150` zu vergrößern hätte 15,67 px gegeben, macht aber die Freizonen des ursprünglichen R7-Durchgangs ungültig. Der gewählte Weg ändert keine Geometrie und verliert keine Zeile. Der Konjunktiv („hätte") geht dabei verloren — falls das stört, ist die Box-Variante gemessen und einsatzbereit.

**144 (mittel) `.md`: „Anomalieerkennung auf Management-Events"** ist seit dem 20.11.2025 unvollständig. Betrifft Pfeil 5 im Ablauf-Abschnitt der `battle_card_49.md`.

**146 (klein) Vollständigkeit: „Abrechnung nach Bytes" gilt nur im Standardmodell.** Mit Capacity Reservations zahlt man nach DPU, Data-Scanned-Gebühren entfallen. Die gesamte Gold-Box hängt damit an einer Voreinstellung. Kein Kartenfix — die Karte behauptet nichts Falsches, und die Reservierung ist Opt-in. Steht im Narrativ.

**Belegketten geprüft — alle tragen.** Bestätigt: CloudTrail Lake für Neukunden geschlossen ab 31.05.2026, Bestandskunden weiter, nur kritische Fixes, AWS verweist auf CloudWatch; Organization Event Data Stores laufen inklusive neuer Mitgliedskonten und Regionen weiter, Account Event Data Stores nehmen keine neuen Accounts der Organization mehr auf; Trails, Insights und Aggregated Events ausdrücklich nicht betroffen.

⚠️ **Datumsdivergenz, die keine ist.** Die Sammelankündigung vom 31.03.2026 nennt für alle Maintenance-Dienste den **30.04.2026**, führt CloudTrail Lake aber mit einem ausdrücklichen Klammerzusatz auf den **31.05.2026**. Die Karte hat recht. Anders als bei Befund 134 löst die Quelle den Widerspruch selbst auf — deshalb kein Befund, aber im Handoff vermerkt, damit die nächste Prüfung nicht dieselbe Runde dreht.

**Neu belegt, nicht auf der Karte:** Insights bildet die Baseline aus den Events der zurückliegenden **28 Tage**; nach dem Einschalten dauert die erste Lieferung bei einem Trail bis zu **36 Stunden**, bei einem Event Data Store bis zu **7 Tage**; Insights wird je Trail und je Event Data Store **getrennt** abgerechnet; write-only Management Events werden für die Abrechnung **zweimal** analysiert (einmal für call rate, einmal für error rate), read-only einmal.

### 4.2 Karte 50 — zwei Befunde, keiner schwer

**142 🚨 R2: `nur Checkout` schneidet zwei Boxen.**

```
nur Checkout   schneidet Targeted-Box (14,0) UND CAPTCHA-Box (6,0)
```

Label 100,1 px, Korridor zwischen 1020 und 1100 also 80 px — horizontal nicht lösbar. Drittes Auftreten des Musters aus HANDOFF-16 §4.4, diesmal aber mit einer neuen Lösung: Anders als bei `Build bricht ab` (109,4 px) und `Nutzer + Gruppen` (137,0 px) zerfällt dieses Label in zwei Wörter, die **beide** in den Korridor passen (25,2 px und 70,2 px).

**Oktays Entscheidung 11.08.: Weg A, zweizeilig im Korridor.** `nur` bei (1060, 498), `Checkout` bei (1060, 518).

> ⚠️ **x=1060, nicht 1056.** Bei der ursprünglichen x-Position hätte `Checkout` nur 0,9 px Luft zur Targeted-Box gehabt. Auf 1060 zentriert sind es 4,9 px beidseitig. **Die Korridormitte ist nicht automatisch die alte Labelposition** — das war hier ein 4-px-Fehler, der ohne Nachmessen durchgegangen wäre.

> **Konvention-Ergänzung zu HANDOFF-16 §4.4: Ein zu breites Pfeil-Label wird zuerst auf Zerlegbarkeit geprüft. Passen die Einzelzeilen in den Korridor, ist zweizeilig-im-Korridor besser als über-die-Boxoberkante, weil das Label am Pfeil bleibt. Erst wenn ein einzelnes Wort breiter als der Korridor ist, geht es nach oben.**

**143 (mittel) Zahlenkonvention §2.2: „Immunity Time 300 s" steht in der falschen Box.**

Belegt gilt (API-Referenz `ImmunityTimeProperty`, wörtlich): Der Default ist 300; **für die Challenge-Action ist 300 zugleich das Minimum**; der zulässige Bereich reicht von 60 bis 259.200 Sekunden. Der User Guide ergänzt: Die Web-ACL-Voreinstellung beträgt für beide Immunity Times 300 Sekunden, jede Regel mit CAPTCHA- oder Challenge-Action kann sie überschreiben und erbt sonst.

Die Zahl steht auf der Karte in der **CAPTCHA**-Box. Dort ist sie eine Voreinstellung, die bis 60 s absenkbar ist. In der **Challenge**-Box wäre sie eine harte Untergrenze. Die Karte platziert sie also dort, wo sie am wenigsten bindet, und ohne Attribut — exakt der Fehlertyp aus Befund 128.

**Oktays Entscheidung 11.08. (ohne Widerspruch zur Empfehlung):** `Immunity Time 300 s` → `Immunity Time default 300 s` (148,4 px → 202,1 px, verfügbar ~280).

**Unverändert bestätigt — die `.md` hatte durchgehend recht:** Common Bot Control enthält die ersten 10 Millionen Anfragen pro Monat kostenlos, Targeted Bot Control die erste 1 Million (AWS-Preisseite, Prosa-Abschnitt lesbar); eine Challenge-Response ist eine abgerechnete Größe, unabhängig davon, ob der Nutzer die Challenge versucht; CAPTCHA- und Challenge-Antworten enthalten **keine CORS-Header**, weshalb JavaScript-Anwendungen den `x-amzn-waf-action`-Header nicht lesen können.

**145 (klein) `.md`: Die Aussage unter „Nicht bestätigt" ist widerlegt.** Die `.md` schreibt, WCU-Überschreitungen und Body-Inspektion über 16 KB seien nicht gegen die AWS-Preisseite geprüft. Die Preisseite führt beides: 0,30 USD je Million Anfragen für jede weiteren 16 KB über dem Standard-Body-Limit, und die China-Preisseite nennt zusätzlich die Standardzuteilung von **1.500 WCU** je Web ACL mit Zusatzkosten je weitere 500 WCU. Zweiter Fall dieser Art nach Befund 136 — eine `.md`-Aussage unter „Nicht bestätigt", die sich beim Nachprüfen belegen ließ.

### 4.3 Karte 51 — zwei Befunde, einer ein Renderfehler

**141 🚨 Textkollision: `Replay ab Zeitpunkt` gegen den Untertitel.**

```
A  y=106  x[  60..1049]  Untertitel (fs21, 989,5 px)
B  y=118  x[ 814.. 966]  "Replay ab Zeitpunkt" (fs15, 151,6 px)
Überlappung: 151,6 x 4,3 px
```

Der Konflikt ist strukturell: Badge 6 sitzt auf y=140, also 34 px unter der Untertitel-Baseline. Für ein 15-px-Label darüber ist zwischen beiden kein Platz, und der Untertitel reicht bis x=1049 — links davon gibt es kein freies x.

**Empfehlung, ohne Widerspruch umgesetzt:** Badge **und** Label gemeinsam von x=890 auf x=1150. Label danach x 1074,2..1225,8 (24,7 px Luft zum Untertitel, 7,7 px zur Pfadecke bei 1233,5). Der Badge rutscht dabei aus dem Zonenrahmen heraus, den er in der alten Position gekreuzt hat, und sitzt weiterhin auf dem horizontalen Pfadsegment (y=140, x 545..1235).

> ⚠️ **Beim Neurendern R7 auf Karte 51 neu schneiden.** Die Freizonen des ursprünglichen Durchgangs gingen von einem Badge bei x=890 aus, der auf der Zonen-Oberkante saß. Beides hat sich geändert.

**147 (klein) Ganzheitsdurchgang: Enhanced Fan-out ist kein Default.** Das Label steht an allen drei Konsumentenpfeilen. Tatsächlich ist EFO eine Registrierung (`RegisterStreamConsumer`) mit eigener Gebühr je Konsument-Shard-Stunde und je abgerufenem GB. Ohne EFO teilen sich alle drei Konsumenten die 2 MB/s je Shard. Kein Kartenfix — das Label behauptet keine Voreinstellung. Gehört ins Narrativ.

**✅ Der Replay ist sauber konstruiert und musterhaft beschriftet.** Belegt: Ein Stream speichert Records standardmäßig 24 Stunden, erweiterbar auf 7 Tage (extended retention) und bis 8.760 Stunden bzw. 365 Tage (long-term retention). Die Karte schreibt „Retention 24 h **Default**" — das Attribut steht drauf. Und die drei Stunden des Szenarios liegen innerhalb der Default-Retention, der gezeigte Weg funktioniert also ohne jede Zusatzeinstellung. **Erste Karte der Kette, die die Zahlenkonvention aus §2.2 von sich aus erfüllt.**

**Unverändert bestätigt:** Beim Erhöhen der Retention bleiben noch nicht abgelaufene Records erhalten, bereits abgelaufene kommen nicht zurück; beim Verringern werden Records jenseits der neuen Periode fast sofort unzugänglich.

**Noch offen für Teil 2:** Die `.md`-Angaben zu **On-demand Advantage** (04.11.2025) und **50 Enhanced-Fan-out-Konsumenten** (20.11.2025) wurden in diesem Chat **nicht** gegengeprüft. Keine der beiden Zahlen steht auf der Karte, das Risiko ist also gering — die Prüfung gehört trotzdem in Teil 2.

### 4.4 🚨🚨🚨 Kartenübergreifend — Befunde 148 bis 150

Die AWS-Sammelankündigung vom 31.03.2026 trifft drei Masterplan-Zeilen.

**148 ❌ ZURÜCKGEZOGEN — Karte 5 war bereits aktualisiert.** Der Befund wurde am 11.08. aus der Masterplan-Zeile abgeleitet, ohne `battle_card_5.md` zu lesen. Die Karte trägt längst einen Abschnitt *⚠ Aktueller Service-Status (Stand 2026)* mit Maintenance Mode, dem Datum 30.04.2026, dem Bestandsschutz, ECS Express Mode als Migrationspfad und der Prüfungseinordnung. Im Frontend am 11.08. verifiziert. **Kein Handlungsbedarf.**

> **Konvention: Ein kartenübergreifender Befund wird erst gemeldet, wenn die betroffene Karte gelesen wurde. Die Masterplan-Zeile beschreibt die Absicht, nicht den Stand.**

**149 (Vorwarnung) Karte 61 — Rekognition.** Masterplan-Zeile: „Rekognition, Lambda, S3 · Marktplatz moderiert hochgeladene Bilder automatisch". In Maintenance gehen die Features **Streaming Events und Batch Image Content Moderation**. Die synchrone Bildmoderation ist damit vermutlich nicht betroffen, aber die Batch-Variante ist es — und das Kartenthema ist Bildmoderation. **Vor dem Zeichnen von Karte 61 klären, welche API die Karte zeigt.**

**150 (Vorwarnung) Karte 63 — Comprehend.** Masterplan-Zeile: „Support-Tickets nach **Stimmung und Thema** automatisch klassifizieren". In Maintenance gehen **Topic Modeling**, Event Detection und Prompt Safety Classification. „Stimmung" ist Sentiment Analysis und nicht betroffen; „Thema" ist genau Topic Modeling. **Die Kartenidee steht zur Hälfte auf einem geschlossenen Feature.**

Nicht betroffen, aber geprüft: Audit Manager, RDS Custom for Oracle, WorkMail, WorkSpaces Thin Client, ARC Readiness Check, SNS Message Data Protection, Glue Ray Jobs, IoT FleetWise und Chime SDK Proxy Sessions kommen im Masterplan nicht vor.

---

## 5. Systematische Befunde

### 5.1 Die Vorhersage der riskanten Kategorie hat zum zweiten Mal in Folge getroffen

HANDOFF-16 §7 sagte für Batch 17 **Durchsatz- und Aufbewahrungsgrenzen** voraus, mit dem Zusatz, jede sei ein Kandidat für den Fehlertyp aus Befund 128. Das traf zu — allerdings in beide Richtungen:

- **CloudTrail Event History, 90 Tage:** festes Limit, kein Default, korrekt geführt.
- **Kinesis-Retention, 24 h / 7 d / 365 d:** korrekt attribuiert, die Karte schreibt „Default" selbst hin (§4.3).
- **WAF Immunity Time, 300 s:** **Treffer** — Default in der einen Box, Minimum in der anderen, Attribut fehlte (Befund 143).
- **WAF-Freikontingente, 10 Mio. / 1 Mio.:** belegt, korrekt.

**Nicht vorhergesehen war Befund 140** — eine Kartenaussage, die von einem Dienstupdate abhängt statt von einer Zahl. Siehe §2.2.

### 5.2 Keine Masterplan-Schuld für die drei Batchkarten — dritter Batch in Folge

| Karte | Masterplan-Zeile gleicher Nr. | Thema woanders? | Typ |
|---|---|---|---|
| 49 | CloudTrail, Athena · API-Forensik über alle Accounts | nein | deckungsgleich |
| 50 | WAF Bot Control, CAPTCHA · Scalper-Bots beim Drop | nein | deckungsgleich |
| 51 | Kinesis Data Streams vs SQS · Clickstream, Replay | nein | deckungsgleich |

Nebentreffer geprüft: `CloudTrail` steht auch in Zeile 43 (KMS-Rotationsnachweis) — dort Nachweisebene, hier Hauptgegenstand. `Athena` steht in den Zeilen 52, 53 und 56; Zeile 53 ist nach Oktays Entscheidung vom 11.08. **IPv6 statt Athena**, die Masterplan-Zeile ist entsprechend veraltet und bleibt dokumentierte Schuld. `SQS` steht in Zeile 7 (Karte 51 grenzt ab) und Zeile 89 (Idempotenz/Retry) — Zeile 89 ist weit entfernt und nicht im Konflikt.

⚠️ **Nicht abschließend prüfbar:** HANDOFF-16 §7 forderte zu klären, ob **Karte 40** die Athena-Partitionierungs- und Kostenmechanik bereits trägt. `card-40-narrative.md` lag in diesem Chat nicht vor. Das Narrativ 49 verweist deshalb an einer Stelle vorsichtig auf Karte 40 („die Herleitung des Speicherlayouts steht dort und wird hier nicht wiederholt"), **ohne dass gegengelesen werden konnte, ob sie das tut.** Bei der nächsten Athena-Berührung — Karte 52 — mitprüfen und den Satz gegebenenfalls korrigieren.

### 5.3 Der Verweis-statt-Herleiten-Konflikt ist mit der neuen H3-Planung entschärft

HANDOFF-16 §5.3 hielt fest, dass Verweise pro Karte rund 150 Wörter sparen und damit gegen die Längenmarke arbeiten. Karte 49 verweist an drei Stellen (Karte 40 für das Speicherlayout, Karte 45 für Insights und GuardDuty, Karte 48 für die `AWSReservedSSO_`-Principals) und landete trotzdem **über** der Marke. Der Grund ist §2.1: Wer von vornherein jedes Kartenelement mit einem H3 versieht, hat genug Umfang, um sich Verweise leisten zu können.

### 5.4 Der 30-Tage-Transitionskonflikt (Karte 11) wurde erneut nicht geprüft

Stand unverändert offen seit HANDOFF-05 §5.5. Karte 49 berührt S3 Lifecycle nicht.

---

## 6. Was im Narrativ 49 steht, aber nicht auf der Karte

Die Trennung Ansicht gegen Lieferung als Erklärung dafür, warum „CloudTrail" zwei Dinge im selben Konsolenmenü sind; dass ein Trail ausschließlich nach vorn wirkt und nach dem Vorfall angelegt nichts mehr hilft; dass `AssumeRole` im CloudTrail des rollenbesitzenden Accounts erscheint; die vollständigen Partition-Projection-Tabelleneigenschaften als SQL samt der drei Fallen `projection.enabled`, `NOW` im Datumsbereich und `storage.location.template`; die Lieferverzögerung von Minuten zwischen Aufruf und Datei; die 28-Tage-Baseline von Insights und die Anlaufzeit von 36 Stunden bzw. 7 Tagen (Befund 140); der Vierfach-Dokumentationsstand zu Insights und Data Events; die Athena-Kapazitätsreservierungen ab 4 DPU seit 10.02.2026 und die nicht nachgezogene 24 im User Guide (Befund 146); `CREATE TABLE AS SELECT` und Spaltenauswahl als zweiter und dritter Kostenhebel; die vier Dinge, die CloudTrail nicht sieht (SSH/RDP, VPC-Verkehr, DNS, Objektinhalt); die Fortsetzung des Betriebs für Organization Event Data Stores gegenüber Account Event Data Stores.

---

## 7. Zu prüfen vor dem Schreiben von Teil 2 (Karten 50, 51)

**Der Faktencheck ist gelaufen.** §4.2 und §4.3 enthalten den vollständigen Stand. Offen sind nur noch:

- **(i)** Die `.md`-Angaben zu **On-demand Advantage** (04.11.2025) und **bis zu 50 Enhanced-Fan-out-Konsumenten** (20.11.2025) auf Karte 51. Keine der Zahlen steht auf der Karte.
- **(ii)** Ob **Karte 55 (MSK)** dieselbe Replay-Aussage trifft wie Karte 51. Karte 51 grenzt sich ausdrücklich ab; die Gegenprobe steht aus.
- **(iii)** Ob Karte 7 (SQS + Lambda + DLQ) und Karte 89 (SQS-Idempotenz) mit der Aussage „SQS löscht nach Konsum" kollidieren. Karte 51 nennt Karte 7 explizit.

**Umfangsprognose nach §2.1** — H3-Liste vor dem ersten Absatz aufstellen:

| Karte | Kästen | Badges | Weitere Elemente | H3-Ziel | Prognose |
|---|---|---|---|---|---|
| 50 | 8 | 6 | Randnotiz links (3 Zeilen), verworfener Weg | **13–14** | ca. 3.020 → **kürzen einplanen** |
| 51 | 7 | 6 | Zonenrahmen „KONSUMENTEN", verworfener Weg | **12–13** | ca. 2.845 → **kürzen einplanen** |

Beide liegen über der Marke. Das ist die gewünschte Richtung (§2.1), verlangt aber Disziplin beim Kürzen statt beim Strecken.

**Firmennamen für 50 und 51.** Karte 50 ist ein Sneaker-Shop, Karte 51 ein Online-Modehändler — **beides Einzelhandel, beides nicht frei wählbar**, weil die Branche im Kartenszenario steht. Das ist die zweite unvermeidbare Branchendublette nach 44/47. Bei der nächsten frei wählbaren Branche erneut gegensteuern.

---

## 8. Erledigt am 11.08.2026 nach Auslieferung von Teil 1

**Befund 140 (Kartenfix Karte 49)** — angewandt, gerendert, im Frontend verifiziert.

**Befund 141, 142, 143** — angewandt, `r2.py` und `collide.py` je 0 Befunde, Textelemente 44 / 52 / 36.

**Befund 144 (Karte 49 `.md`)** — behoben mit `md-fix-49.py`. Drei Änderungen: Ablauf-Pfeil 5 auf den belegten Stand gebracht, neuer Faktencheck-Eintrag zur Insights-Erweiterung vom 20.11.2025, `status_note` um R8-Ergebnis, Kartenfix und Renderdivergenz ergänzt. Im Frontend verifiziert: Diagramm, Kurzfassung und Narrativ sagen dasselbe.

**Befund 148** — zurückgezogen, siehe §4.4.

**Narrative 40–45** — waren nie im Repo angekommen, aus den ZIPs von Batch 14 und 15 nachgezogen. **49 von 49 Narrativen sind jetzt live und im Frontend sichtbar.**

**Narrativ-Integration** — `AUFTRAG-narrative-integration.md` ist vollständig abgearbeitet, alle Phasen laufen. Der Umschalter *Kurz / Ausführlich* erscheint bei Karten mit Narrativ und fehlt bei Karten ohne. Verifiziert an 45, 49 (mit) und 50 (ohne). Guard-Tests: 20 von 20 grün, dynamisch über die vorhandenen Dateien geschrieben — die Liste `1..39` im Auftragstext ist überholt und muss nicht gepflegt werden.

⚠️ **`next start` liest den Build, nicht die Platte.** Eine neue `narrative.md` oder `.md`-Änderung wird erst nach `pnpm build` **und** einem Neustart des Servers sichtbar. Das hat am 11.08. zwei Fehldiagnosen ausgelöst.

**Offen für Teil 2:** `battle_card_50.md`, `status_note` nennt 51 Textelemente statt 52.

---

## 9. Paste-Block für den Folgechat

```
Narrativ-Batch 17, TEIL 2. Lies NARRATIVE-SPEC.md und
narrative-reference-scheduler.md aus dem Project Knowledge, bevor du schreibst.

STAND
Spec:            NARRATIVE-SPEC.md v1.1 (§4 geändert 29.07.2026) + Konventionen
                 aus HANDOFF-NARRATIVE-02 §2 bis -17 §2
                 ACHTUNG: der Spec-Patch liegt in -05 §5.1 und ist noch NICHT
                 im Project-Knowledge-Text. check.py erzwingt die neue Marke.
                 §6 (Renderer) liegt seit 10.08.2026 im Repo unter docs/
Referenz:        narrative-reference-scheduler.md (Maßstab ist die Referenz,
                 nicht der letzte Text)
Geschrieben:     49 von 100  (Karten 1-49)
Dieser Chat:     Karten 50 und 51. FAKTENCHECK LIEGT VOR in HANDOFF-17 §4.2
                 und §4.3 - nicht wiederholen, nur die Punkte (i) bis (iii)
                 aus §7 schließen
Kartenfixe:      VIER SIND ANGEWANDT, GERENDERT UND GESEHEN. Die SVGs, PNGs
                 und PDFs von 50 und 51 im Upload sind der neue Stand.
                 r2.py und collide.py melden 0 Befunde
Ablage:          public/scenarios/card-NN/narrative.md - battle_card_N.md bleibt.
                 Narrative sind LIVE, readNarrative() liest sie, check.py ist
                 Deploy-Vorbedingung. Nicht erst am Ende laufen lassen
Frontmatter:     correctAnswer wird ausgelassen (kein Aufgaben-Track)
                 sources MUSS YAML-Blockliste sein ("  - url"), kein Inline-Array
Code-Blöcke:     KEINE Zeile darf mit "# " beginnen - Guard-Test 5 wertet das
                 auch im Code-Block als H1 (HANDOFF-08 §2.2)
H2-Namen:        nur die neun kanonischen aus Spec §3. Variable Suffixe nach
                 " — " sind erlaubt (HANDOFF-09 §2.3)
Länge:           2.200-2.500 Wörter, VERBINDLICH, Guard-Test Nr. 9.
                 Intern 2.250 bis 2.450.
H3-PLANUNG:      NEU UND WICHTIG (HANDOFF-17 §2.1). Die H3-Liste wird VOR dem
                 ersten Absatz aufgestellt, mit einem H3 JE KARTENELEMENT -
                 Kästen, Pfeile, Randnotizen, verworfener Weg. Dann trifft der
                 Faustwert Kästen x 175 + Badges x 120 + 900 auf rund 10 % genau
                 und der Text muss GEKÜRZT werden. Karte 49: 12 H3 geplant,
                 Erstdurchgang 2.456 bei Prognose 2.725.
                 Ziel Karte 50: 13-14 H3. Ziel Karte 51: 12-13 H3
Kästen zählen:   NICHT len(rects)-2. qc.py meldet reproduzierbar EINEN zu viel,
                 VIERMAL bestätigt und unabhängig von Zonen (HANDOFF-17 §2.6).
                 Karte 50: 8 Kästen, 6 Badges. Karte 51: 7 Kästen, 1 Zone,
                 6 Badges
Kollisionscheck: collide.py im ZIP. Karte 51 hatte einen echten Renderfehler
                 (Befund 141), gefixt. Nach dem Fix erneut laufen lassen
R2-Check:        r2.py im ZIP. NEU (HANDOFF-17 §4.2): Ein zu breites Pfeil-Label
                 zuerst auf ZERLEGBARKEIT prüfen. Passen die Einzelwörter in den
                 Korridor, ist zweizeilig-im-Korridor besser als über die
                 Boxoberkante. UND: die Korridormitte ist NICHT automatisch die
                 alte Labelposition - immer neu rechnen
Umlaut-Grep:     läuft in JEDEM Batch, ZWEISTUFIG. Batch 17 Teil 1 hatte
                 0 Kandidaten auf allen drei Karten - das hebt die Regel nicht auf
GANZHEITSDURCH-
GANG:            DREI Fragen. (a) Widerspricht sich die Karte selbst?
                 (b) Welche Default-Einstellung muss wahr sein, damit der
                 gezeigte Weg das versprochene Ergebnis liefert (HANDOFF-16 §2.1)?
                 (c) NEU: Hängt eine Kartenaussage an einer FUNKTION, die jünger
                 ist als das übrige Kartenmaterial? Befund 140 fiel nur über (c)
                 auf (HANDOFF-17 §2.2)
ZAHLEN:          Bei jeder Zahl klären, ob DEFAULT, LIMIT oder WÄHLBARE OPTION.
                 Befund 143 (WAF Immunity Time) war eine Zahl, die in der einen
                 Box Default und in der anderen Minimum ist
Belegketten:     Jede .md-Aussage gegen die genannte Seite öffnen. Liegt sie nicht
                 auf aws.amazon.com oder docs.aws.amazon.com, prüfen ob es eine
                 AWS-Primärquelle gibt (HANDOFF-16 §2.5). NEU: auch Aussagen unter
                 "NICHT BESTÄTIGT" gegenprüfen - Befund 145 und 136 waren beide
                 belegbar
SERVICE-
AVAILABILITY:    NEU UND WICHTIG (HANDOFF-17 §2.3). Die AWS-Sammelseite zu
                 Verfügbarkeitsänderungen wird gegen den GESAMTEN Masterplan
                 gegriffen, nicht nur gegen die Batchkarten. Zuletzt geprüft:
                 aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability
                 (31.03.2026). Treffer: Karte 5, Karte 61, Karte 63
check.py:        Slugs UND Nummern nachtragen, beides, immer. Für Teil 2:
                 49 aus HANDOFF-17 §3. Nachtrag selbst testen, es MÜSSEN
                 2 Befunde kommen
Prüfungsknack-
punkte:          Abgrenzungen statt Distraktoren, Format "Warum X hier verliert:"
Kartenfehler:    im Narrativ explizit benennen, immer mit GEMESSENEM Fixvorschlag.
                 Gibt es mehrere Wege, Oktay entscheiden lassen
Masterplan:      ZWEISTUFIG. Erst die Zeile gleicher Nummer, dann das Kartenthema
                 über den GESAMTEN Masterplan greppen
Offene Karten-
befunde:         150 Stück, vollständig in HANDOFF-02 §4 bis -17 §4.
                 GEMESSENE Fixvorschläge liegen vor für Karte 20, 31, 34, 39, 41,
                 42, 43 und 44
Vertagt:         Befund 99 (Karte 38), 102 (39), 114 (41), 118 (43), 121 (44),
                 129 (46), 133 (48), 146 (49, Athena-Abrechnungsmodell),
                 147 (51, Enhanced Fan-out kein Default)
ERLEDIGT 11.08.: Befunde 140-144 alle behoben und im Frontend verifiziert.
                 Befund 148 (App Runner) ZURUECKGEZOGEN - die Karte war laengst
                 aktuell. Narrative 40-45 nachgezogen: 49 von 49 sind live.
                 Offen aus Teil 1: battle_card_50.md status_note sagt 51
                 Textelemente, es sind 52
RENDERING:       NEU UND WICHTIG (HANDOFF-17 §2.7). Der Container rendert seit
                 diesem Batch NICHT MEHR pixelidentisch zu den Karten 1-48.
                 Geometrie stimmt exakt, Glyphen weichen um 0,3-0,5 % Textbreite
                 ab. Nicht reparierbar, vier Hinting-Varianten getestet.
                 R13 und R18 verhalten sich identisch zur Referenz.
                 KONSEQUENZ: gegen die Regeln pruefen, nicht gegen Bit-Gleichheit.
                 zones.py mit seinem 1,2-%-Puffer VOR der naechsten Karte
                 gegen den neuen Renderstand nachmessen.
                 Renderaufruf rekonstruiert und verifiziert:
                 cairosvg.svg2png(url=svg, write_to=png, scale=1.5) -> 2400x1350
                 plus svg2pdf, mit dem ANTIALIAS_GRAY-Patch aus render.py
R8:              ERSTMALS DURCHFUEHRBAR. Alle status_note-Eintraege der Karten
                 46-51 sagen "Bildobjekt ohne lesbaren Inhalt" - das gilt nicht
                 mehr. Sichtpruefung ergab zwei Beobachtungen, die kein Skript
                 findet (HANDOFF-17 §2.5). Vorschlag R19: Label-Badge-Abstand
RENDERFEHLER:    Karte 41 hat ZWEI Textkollisionen im PNG (Befund 112). Fix
                 gemessen UND verifiziert: CreateSession y=395 -> y=428,
                 Key gelöscht x=630 -> x=415. Kartenkette, vorrangig
Laufender Fix:   Umlaut-Defekt. Karten 6-10, Karte 27, Karte 30
Farb-Debt:       Teal als "Regel-/Konfigurationsinstanz" SECHZEHNMAL in Folge
                 (34-50). Karte 50 nutzt es für FÜNF Boxen. Festschreibungs-
                 vorschlag aus Karte 38 überreif.
                 Rot-Pink #B0084D doppelt belegt (relationale Engine vs. SCP).
                 Karte 51 führt Pink #E7157B für die Messaging-Familie und
                 Indigo #3B3B98 für Streaming-Transport - beide von Oktay
                 am 19.07.2026 freigegeben
Masterplan-
Debt:            Karte 39 = Aurora Global Database, Client VPN fällt aus den 100.
                 KARTE 53 IST IPv6, NICHT ATHENA (Oktays Entscheidung 11.08.) -
                 die Masterplan-Zeile 53 ist entsprechend veraltet.
                 Karte 40 nimmt Nebenkästen von 56 und 57 vorweg
Nachprüfen:      (a) S3 30-Tage-Transitionsregel, Karte 11 hängt daran. Seit
                     HANDOFF-05 §5.5 offen, in Batch 17 erneut nicht geprüft
                 (b) 50-Listener-Grenze bei PrivateLink-NLBs - unbelegt
                 (c) Regionsumfang Cross-Region PrivateLink
                 (d) "Provisioned"-Modus des Regional NAT Gateway
                 (e) Sekundärregionen-Limit Aurora Global Database: 10 gegen 5
                 (f) ERLEDIGT. Athena-Reservierungsminimum: 4 DPU seit
                     10.02.2026, 1-Minuten-Reservierungen. Der User Guide
                     "Edit capacity reservations" nennt weiterhin 24 und ist
                     nicht nachgezogen. Blog sagt wörtlich "down from 24 DPU"
                 (g) Gegenprobe R2-Fehlalarm Karte 41: "python3 r2.py 41"
                 (h) KMS-FAQ 10 gegen CLI-Referenz 25
                 (i) Macie "bis zu zehn Beispiele" beim Sample-Abruf - unbelegt
                 (j) NEU: trägt card-40-narrative.md die Athena-Partitionierungs-
                     mechanik? Narrativ 49 VERWEIST darauf, ohne dass gegen-
                     gelesen werden konnte (HANDOFF-17 §5.2). Bei Karte 52 prüfen
                 (k) NEU: Karte 51 .md - On-demand Advantage (04.11.2025) und
                     50 EFO-Konsumenten (20.11.2025) nicht gegengeprüft

KARTEN ANFORDERN
Für 50 und 51 werden battle_card_N.png, .svg und .md gebraucht - einzeln
hochgeladen, nicht als ZIP. PDFs nicht. WICHTIG: die SVGs NACH Anwendung von
r2-fix-49-50-51.py und die PNGs NACH dem Neurendern.

Sammel-Befehl für Oktay:
  mkdir -p /tmp/n17b && cd ~/Projekte/certops/public/scenarios
  for n in 50 51; do
    d=$(printf "card-%02d" $n)
    command cp -f "$d/battle_card_${n}.png" "$d/battle_card_${n}.svg" "$d/battle_card_${n}.md" /tmp/n17b/
  done
  ls -1 /tmp/n17b | wc -l
  open /tmp/n17b

ABLAUF
Karten lesen → bestehende .md lesen → H3-LISTE AUFSTELLEN und Umfang
prognostizieren → Kollisions- und R2-Check → Umlaut-Grep zweistufig →
Masterplan zweistufig → Service-Availability-Grep → Punkte (i) bis (iii)
aus §7 schließen → GANZHEITSDURCHGANG mit DREI Fragen →
etwaige neue Kartenbefunde melden BEVOR Text entsteht → schreiben →
check.py → ZIP + HANDOFF-NARRATIVE-18.md + Sammelbefehle.

Kein Repo-Schreiben, kein SCENARIO_COUNT, keine Commits.
```
