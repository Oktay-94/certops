# HANDOFF — UI Dashboard/Szenarien (13.08.2026)

> Ergänzt `CHAT-CONTEXT.md` (Stand 10.08.), ersetzt sie nicht. Auftrag war
> `~/Downloads/HANDOFF-UI-SZENARIEN.md`, Teile B–D.

## 🔴 Zuerst: der Stand ist nicht auf main

**Commit `8fe7fd5` liegt lokal auf Branch `ui-dashboard-szenarien`.
Nicht gepusht, nicht gemergt.** `main` und `origin` kennen keine dieser
Änderungen. Wer im nächsten Chat auf `main` schaut und die neuen Kacheln oder
das Vollbild sucht, findet sie nicht — das ist kein Fehler, sondern dieser
Zustand.

Diese Datei liegt in einem eigenen Commit auf demselben Branch.

## Wo wir stehen

Teile B–D des Auftrags sind umgesetzt, smoke-getestet und committet.
**Teil A (Diagramm-Rollout) ist bewusst zurückgestellt** — es liegen 90 von
100 Specs vor.

## Was passiert ist

- **B1** Quiz-Kachel-Titel kommt jetzt aus `EXAM_CERT` statt aus zwei Literalen:
  SAA → „SAA-C03 Prüfungsquiz", CLF → „CLF-C02 Prüfungsquiz". Der ursprüngliche
  Plan hätte fälschlich in beide Zweige „SAA-C03" geschrieben.
- **B2** Szenarien-Kachel auf 🗺️ mit Thumbnail-Ticker; **B3** neue tote Kachel
  „Nachschlagewerk" (📚, Badge „Bald", nicht klickbar, animiert trotzdem),
  nur im SAA-Zweig, weil es SAA-Inhalt ist.
- **C** Zurück-Knopf auf `/saa/szenarien`, wörtlich von `quiz/page.tsx`.
- **D** Diagramm bricht aus der Textspalte aus (1422 px statt 712 px), Vollbild
  per Klick oder mitlaufendem Knopf, Schließen per Klick oder Taste.
- Zehn fehlende Specs in `docs/diagramm-specs-fehlend.md` festgehalten.

## Geänderte Dateien (Commit 8fe7fd5)

| Datei | Was / Warum |
|---|---|
| `src/components/dashboard/AreaTiles.tsx` | B1/B2/B3; `href` wurde optional, damit eine Kachel ohne Link rendern kann |
| `src/app/globals.css` | Ticker-Keyframes, `scrollbar-gutter: stable`, `--sbw`, `.diagram-bleed`, Reduced-Motion-Eintrag |
| `src/lib/scenario-content.ts` | `SZENARIEN_GLYPH` — eine Konstante für Kachel **und** Eyebrow |
| `src/app/[exam]/szenarien/page.tsx` | Zurück-Knopf, Eyebrow-Glyph |
| `src/app/[exam]/szenarien/[nr]/DiagramPanel.tsx` | **neu** — Panel, Overlay, mitlaufender Knopf in einem State |
| `src/app/[exam]/szenarien/[nr]/page.tsx` | Panel eingesetzt |
| `docs/diagramm-specs-fehlend.md` | **neu** |
| `CLAUDE.md` | Schuld-Notiz: drei Zurück-Knopf-Varianten |

## Tests und Validierung

`pnpm test` 393 grün (53 Dateien) · `pnpm build` sauber, 273 Seiten ·
Smoke-Test alle sieben Punkte durch, Dashboard 128 KB übertragen (97 KB
Bilder; roh wären die fünf PNG 1029 KB).

**Ein Fehler im Smoke-Test gefunden und behoben:** Beim Schließen des Vollbilds
sprang die Leseposition von 1200 auf 568, weil `.focus()` sein Ziel in den
Viewport scrollt. Behoben mit `focus({ preventScroll: true })` an beiden
Stellen, danach nachgemessen: identisch.

### ⚠️ Nicht getestet

**`scrollbar-gutter: stable` und die Vollbild-Scroll-Sperre sind auf diesem
Rechner nur gegen 0-px-Overlay-Scrollbars gelaufen** (macOS-Standard, `--sbw`
maß 0 px). Auf Windows oder mit klassischer Scrollleiste ist beides
**ungeprüft** — genau dort würde ein Fehler in dieser Mechanik sichtbar, weil
`.diagram-bleed` dann tatsächlich etwas subtrahiert und die Sperre eine echte
Breitenänderung verhindern muss.

Ebenfalls nicht am System geschaltet: `prefers-reduced-motion`. Verifiziert ist
nur, dass die Regel in der CSSOM existiert und `.pv-ticker` trifft.

## Nächste Schritte — in dieser Reihenfolge

### a) Erst die zehn Specs klären

4, 7, 9, 25, 30, 37, 40, 54, 55, 80 (siehe `docs/diagramm-specs-fehlend.md`).
Sie streuen über fünf Batches, nicht über einen Bereich.

**Zu klären, bevor irgendetwas gebaut wird:** wurden sie in ihren
Ursprungs-Chats gemeldet, oder sind die Chats abgebrochen? Davon hängt ab, ob
Teil A ein reiner Nachbau ist oder eine Entscheidungsrunde wie bei Karte 96.
Solange das offen ist, steht in der Doku bewusst kein „TODO nachliefern" —
das würde einen Grund behaupten, der nicht feststeht.

### b) Danach Teil A nach dem fertigen Plan

Der Plan liegt vollständig ausgearbeitet vor und ist im Commit dokumentiert:

- **Whitelist der Nummern 1–100** statt Glob auf `card-*.yaml` — sonst rendern
  die Kit-Vorlagen (`card-api`, `card-kette-min`, `card-vpc-endpoint`, und die
  Repo-Fassung von `card-005.yaml`) als echte Karten mit.
- **30 ungepolsterte Specs normalisieren** (`card-41` → `card-041`), Dateiname
  **und** `id`-Feld — `build_one()` zieht den Ausgabenamen aus dem `id`.
- **Auflösung über die Kartennummer**, nicht über Dateinamen-Vergleich:
  Spec `card-${padStart(3)}`, Ordner `card-${padStart(2)}`. Karte 5 →
  `card-005.yaml` → `public/scenarios/card-05/`; Karte 52 → `card-052.yaml` →
  `card-52/`; Karte 100 → `card-100.yaml` → `card-100/`. Ein Glob wie `card-9*`
  träfe Karte 100 mit.
- **Referenzen anpassen statt umbenennen:** `diagramUrl`/`diagramPdfUrl`/
  `diagramPngUrl` mit `fs`-Prüfung und Rückfall auf `battle_card_N.*`.
- **`PREVIEW_CARDS` in `AreaTiles.tsx` von PNG auf `web.svg` umstellen** — die
  Konstante ist genau dafür angelegt und trägt den Hinweis im Kommentar.

## Entscheidungen aus dem Chat, die nicht im Code stehen

- **Scrollbar: eine Mechanik, nicht zwei.** `w-screen` (100vw inkl. Scrollbar)
  und eine `paddingRight`-Kompensation hätten sich gegenseitig gestört und
  unter dem breiten Panel einen sichtbaren Ruck erzeugt. `scrollbar-gutter:
  stable` macht die Kompensation überflüssig; `--sbw` ist der eine Wert.
- **Reine Modifier schließen das Vollbild nicht.** Sonst verschwindet es beim
  Cmd-Druck für einen Screenshot — also genau dann, wenn man es braucht.
- **Der mitlaufende Knopf wird nicht unmountet**, nur `visibility: hidden`,
  damit er beim Schließen noch ein gültiges Fokusziel ist.
- **Zurück-Knopf nicht in eine gemeinsame Komponente gezogen** — es gibt drei
  Varianten (`cards`, `stats`, `quiz`), das Zusammenführen hätte vier laufende
  Seiten angefasst. Als Schuld in `CLAUDE.md` vermerkt.
- **`card-005.yaml` im Repo ist eine Vorlage, keine Karte 5.** Sie beschreibt
  ein Fan-out-Szenario; die echte Karte 5 ist „AWS App Runner · ECR". Beim
  Rollout ersetzt die ZIP-Fassung sie.
- Der Auftragstext nannte die Specs 91–100 als „bis auf 96 fertig". Tatsächlich
  ist `certops-specs-91-100.zip` **vollständig inkl. 96**; die Lücken liegen in
  fünf früheren Batches.

## Offene Fragen

- Sind die zehn Specs gemeldet oder verloren? (blockiert Teil A)
- Soll `ui-dashboard-szenarien` nach `main` und auf `origin`?
- Nachschlagewerk-Kachel bleibt vorerst SAA-only — Inhalt dafür existiert noch
  nicht, die Kachel ist bewusst tot.
