# CertOps Flashcard-UI: Best-in-Class Design- & Interaktions-Guide

**TL;DR**
- Das aktuelle amateurhafte "div-Gefühl" verschwindet, wenn du drei Dinge gleichzeitig änderst: den farbigen Left-Border-Strip durch eine vollflächige Karte mit Hairline-Border + weichem, mehrschichtigem Shadow ersetzt, das generische Emoji streichst (typografie-zuerst, optional offizielles AWS-Architecture-Icon), und die überlaufenden Scrollbars durch `line-clamp` + Modal-Expansion ersetzt.
- Der 3D-Flip gehört gemacht mit `perspective` auf dem Eltern-Element (~1200px), `transform-style: preserve-3d`, `backface-visibility: hidden` und einer Flip-Dauer von ~450–550ms mit einer premium-Easing-Kurve — deutlich länger als deine 120–200ms-UI-Motion, weil ein Karten-Flip eine "Hero"-Bewegung ist, kein Micro-Interaction. (Quizlets flashcards-basierte FlashStudy-App dokumentiert exakt "Flashcards page turn time: 500 milliseconds" als Default — ein guter Anker.)
- Bei 150 Karten ist ein Grid zum Browsen richtig, aber der Klick sollte in einen fokussierten Einzelkarten-/Study-Modus führen; reine 4-Spalten-Flip-Kacheln sind der schwächste Teil deines aktuellen Konzepts.

## Key Findings

1. **Was eine Karte wie eine physische Karte "lesen" lässt, ist NICHT Skeuomorphismus, sondern Elevation + Proportion.** Die besten Apps (Quizlet, Mochi, moderne Anki-Templates) benutzen eine vollflächige Fläche, ein festes Seitenverhältnis, großzügiges Padding, klare Typo-Hierarchie und einen weichen, geschichteten Schatten. Der farbige Left-Border-Strip ist das stärkste Amateur-Signal in deinem aktuellen Design.
2. **Skeuomorphe Zitate (Papiertextur, Deck-Stack, Corner-Fold) funktionieren 2026 nur in homöopathischer Dosis.** Neumorphism gilt als tot (Accessibility-Fail); ruled-line-Indexkarten und Corner-Folds wirken schnell "cheesy". Was premium wirkt: subtiler Deck-Stack hinter der Karte, minimaler Papierton, präzise `border-radius`.
3. **Emoji ist das zweitstärkste Amateur-Signal.** Premium-Learning-Apps im Technik-Kontext sind entweder typografie-zuerst (gar kein Icon) oder nutzen ein konsistentes monoline/duotone-Icon-Set — oder, für AWS-spezifische Karten, die offiziellen AWS-Architecture-Icons mit ihren Kategorie-Farben.
4. **Der Flip muss langsamer sein, als du denkst.** 120–200ms fühlt sich "billig/abgehackt" an für eine Karte; 450–550ms mit einer sanften ease-Kurve fühlt sich "teuer" an. Für einen Hover-Effekt vor dem Flip ist ein leichter Lift (`translateY(-4px)` + wachsender Shadow) besser als ein Y-Tilt.
5. **Scrollbars in der Karte sind ein hartes No-Go.** Front = kurz (Frage), Back = potenziell lang (Antwort). Lösung: Antwort mit `line-clamp` kürzen und per Modal expandieren, ODER die Karte im Study-Modus so groß machen, dass 90 % der Antworten ohne Scroll passen.

## Details

### 1. Wie die besten Flashcard-Apps ihre Karten gestalten

Die Recherche über Anki (inkl. AnkiWeb-Templates), Quizlet, Brainscape, Mochi, RemNote und Duolingo zeigt ein konsistentes Muster für "premium":

- **Seitenverhältnis:** Landscape/Querformat auf Desktop (etwa 3:2 bis 5:3), nicht quadratisch. Quadratisch wirkt mehr wie eine App-Kachel; ein leicht breiteres Rechteck liest sich als Karteikarte. Für ein Grid empfiehlt sich `aspect-ratio: 3 / 2`.
- **Padding:** Großzügig und konsistent — typischerweise 24–32px innen. Das `modern-anki-card-template` von tyuichis positioniert den Inhalt bewusst leicht über der Mitte (dort, wo das Auge natürlich hinsieht) und begrenzt Inhalt in einem Container, um das "Rule of Minimum Information" zu erzwingen. Aus der README wörtlich: *"This card template was specially designed to reduce visual clutter and focus on the Rule of Minimum Information. When the container looks full, it's a good sign there's too much information in the card."*
- **Typo-Hierarchie:** Front (Frage) groß und ruhig, mittige oder linksbündige Ausrichtung, kein konkurrierendes Icon. Back (Antwort) etwas kleiner, linksbündig, mit klarer Zeilenführung. Die Deck-/Kategorie-Bezeichnung ist klein, oben, gedämpft (uppercase, letter-spacing, ~11–12px) — NICHT als knallige Pille mit abgeschnittenem Text.
- **Border vs. Shadow vs. Elevation:** Der Konsens moderner Design-Systeme (Atlassian, Material) ist: flache Karten = Border, gehobene Karten = Shadow. Für Flashcards willst du beides subtil: eine Hairline-Border (1px) für die Kante + einen weichen, mehrschichtigen Shadow für Tiefe. Quizlets "Flashcards 2.0"-Redesign entfernte bewusst die horizontalen Linien und Deko — ein von Nutzern hervorgehobener Vorteil war explizit *"no horizontal lines to distract visually from the words"*, und die zwei getrennten Aktionen wurden zu *"a single, fluid motion"* zusammengefasst.
- **Front/Back-Differenzierung ohne Kitsch:** Die beste Methode ist minimal — gleiche Fläche, aber Back hat eine dezent andere Tönung (nicht das knallige Purple deiner aktuellen Version) oder einen farbigen Akzent (dünne Top-Linie in der Domain-Farbe) plus ein kleines Label "Antwort". Der tinted-purple-Kasten ist zu laut.

### 2. Physische-Karten-Metapher, die 2026 modern wirkt

Der Trend-Konsens (mehrere 2026-Quellen zu Skeuomorphism/Neumorphism): reiner Skeuomorphismus ist zu schwer, Neumorphism ist wegen Kontrast/Accessibility praktisch tot ("shipping a neumorphic finance app in 2026 is shipping a compliance risk"). Was funktioniert:

**Premium (verwenden):**
- **Weicher, mehrschichtiger Shadow** statt eines einzelnen fuzzy-grauen Schattens. Rezept (Josh-Comeau-Stil, geschichtet):
  ```css
  box-shadow:
    0 1px 1px hsl(220 20% 10% / 0.04),
    0 2px 2px hsl(220 20% 10% / 0.04),
    0 4px 8px hsl(220 20% 10% / 0.05),
    0 8px 16px hsl(220 20% 10% / 0.05);
  ```
- **Subtiler Deck-Stack** hinter der Karte via Pseudo-Elemente (`::before`/`::after` mit leicht versetzten, gedämpften Flächen + descending z-index). Signalisiert "das ist ein Stapel Karten" ohne kitschig zu sein.
- **Präziser `border-radius`** — dein 12px-System ist genau richtig; 2026-Neumorphism-Guides nennen 12–32px als "tactile".
- **Sehr subtiler Papierton** (fast unmerkliches off-white statt reines Weiß).

**Dated/cheesy (vermeiden):**
- Ruled-line-Indexkarten-Motiv (`repeating-linear-gradient` blaue Linien) — liest sich als Retro-Gimmick, nicht als premium Cert-Tool.
- Corner-Fold ("Eselsohr").
- Neumorphe Doppel-Schatten (extruded plastic).
- Kartendicke/3D-Edges (der Auroratide-"Level 2/3"-Ansatz) — technisch beeindruckend, aber für ein 150-Karten-Grid Overkill und Performance-Risiko.

### 3. Der 3D-Flip, richtig gemacht

Die kanonische Technik (David DeSandro, *Intro to CSS 3D Transforms*):

```css
.scene {            /* Eltern-Element */
  perspective: 1200px;
}
.card {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  transform-style: preserve-3d;
  transition: transform 500ms cubic-bezier(.2,.8,.2,1);
}
.card.is-flipped {
  transform: rotateY(180deg);
}
.card__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;      /* verhindert Durchscheinen */
  -webkit-backface-visibility: hidden;
  border-radius: 12px;
}
.card__face--back {
  transform: rotateY(180deg);       /* Rückseite vorab gedreht */
}
```

**Kritische Details:**
- `perspective` MUSS auf dem Eltern-Element sitzen, nicht auf der Karte selbst. Wert: ~800–1200px. Niedriger = extremer/dramatischer, höher = flacher/subtiler. 1200px ist ein guter, ruhiger Wert für ein Cert-Tool.
- `backface-visibility: hidden` auf BEIDEN Faces verhindert das gespiegelte Durchscheinen und Text-Flicker.
- **z-fighting vermeiden:** beide Faces auf `position: absolute; inset: 0;` legen; optional die Back-Face minimal via `translateZ(1px)` nach vorn schieben.
- **Text-Flicker in Safari:** `-webkit-backface-visibility: hidden` explizit setzen und `will-change: transform` sparsam auf der Karte.

**Dauer & Easing (premium vs. billig):** UI-Motion-Guides sind sich einig, dass Micro-Interactions bei 100–200ms liegen, aber "Hero"-Transitions (und ein Karten-Flip ist eine) bei 300–400ms+. Für einen Flip fühlt sich ~450–550ms mit einer Kurve wie `cubic-bezier(.2,.8,.2,1)` teuer an. Deine 120–200ms sind für Buttons/Hover richtig, aber zu schnell für den Flip. Als externer Anker: die Quizlet-basierte FlashStudy-App nutzt "Flashcards page turn time: 500 milliseconds" als Default. **Wichtig:** Verwende ein Zwei-Kurven-System — 120–200ms für Hover/Lift (deine bestehende `cubic-bezier(.22,.9,.3,1)`), ~500ms für den Flip.

**Bessere Alternativen zum reinen Y-Flip:**
- **Lift-then-flip / Tiefe:** Der Auroratide-Ansatz zeigt, dass ein echter Karten-Flip die Karte erst leicht anhebt (`translateZ`/`translateY`), bevor sie dreht — das wirkt "anatomisch korrekt". Für dich: ein Hover-Lift (`translateY(-4px)` + wachsender Shadow, 150ms) und beim Klick der Flip.
- **Tilt-on-Hover** via `react-parallax-tilt` — laut GitHub-Repo (mkosir) *"Easily apply tilt hover effect to React components — lightweight/zero dependencies 2.9kB"*, Default `perspective: 1000`. Dezenter 3D-Tilt (max 8–10°) mit optionalem Glare gibt "premium wow" ohne Aufdringlichkeit. Achtung: `prefers-reduced-motion` respektieren; starke Perspektiv-Shifts können Übelkeit auslösen.
- Ich würde für ein Cert-Tool **NICHT** empfehlen: übertriebener Tilt (>15°), Auto-Rotation, oder ein voll-3D-Karten-Deck mit Dicke.

### 4. Icon-/Illustrations-Behandlung — klares Urteil

**Verdikt: Streiche die 3D-Emojis. Zwei akzeptable Wege, in Präferenz-Reihenfolge:**

1. **Typografie-zuerst (empfohlen als Default):** Gar kein Icon. Die besten minimalistischen Study-Apps (Mochi) und moderne Anki-Templates leben von Typografie + Whitespace. Das ist der schnellste Weg zu "professionell" und skaliert perfekt über 150 Karten.
2. **Offizielle AWS-Architecture-Icons (empfohlen für AWS-spezifische Karten):** Für ein AWS-Cert-Tool sind die offiziellen AWS-Architecture-Icons die einzige Icon-Wahl, die den Inhalt tatsächlich stärkt statt dekoriert. Sie sind offizielle SVGs mit definierten Kategorie-Farben. Klein platzieren (20–24px), oben links neben oder unter dem Deck-Label, in Original-Kategoriefarbe. Nicht groß in der Mitte.

Falls du ein generisches Icon-Set willst (für nicht-service-spezifische Karten): monoline oder duotone (z. B. Lucide, Phosphor) — konsistent, 1.5px stroke, gedämpfte Farbe. Niemals gemischte 3D-Emoji.

**Wichtiger Fakt zu AWS-Icon-Farben (mit exakten Hex-Werten):** Die offizielle AWS-Palette wurde in **AWS Architecture Icons Release 16 (2023.04.28)** überarbeitet und unterscheidet sich von deinen App-Domain-Farben. Die offiziellen Kategorie-Farben:

| AWS-Palette | Hex | Kategorie(n) |
|---|---|---|
| Smile (orange) | `#ED7100` | Compute, Containers, Media |
| Endor (grün) | `#7AA116` | Storage, Cloud Financial Mgmt, IoT |
| Galaxy (lila) | `#8C4FFF` | Security & Identity, Networking, Analytics, Serverless |
| Nebula (magenta) | `#C925D1` | Database, Developer Tools |
| Mars (rot) | `#DD344C` | Business Applications, Front-End Web & Mobile |
| Cosmos (pink) | `#E7157B` | Management & Governance, App Integration |
| Orbit (türkis) | `#01A88D` | AI, End User Computing, Migration |

Wichtig: AWS hat **Blau bewusst deprecatet**. Aus dem offiziellen Deck wörtlich: *"We are deprecating the blue to reduce the oversaturation on the AWS site. From now on, blue will only be used for UI purposes, such as text links."* Deshalb ist "Database" in der aktuellen Palette magenta, nicht mehr blau. Die Icon-Pakete erscheinen quartalsweise (Q1 Ende Januar, Q2 Ende April, Q3 Ende Juli).

Deine App-Domain-Farben (blau Cloud Concepts, rot Security, lila Technology, amber Billing) sind ein eigenes System — verwechsle sie nicht mit den offiziellen Icon-Farben, wenn du echte AWS-Service-Icons einbaust.

### 5. Typografie für Flashcards

Basierend auf Typo-Hierarchie-Best-Practices, angepasst an dein Geist-System:

| Element | Größe | Weight | Line-height | Hinweis |
|---|---|---|---|---|
| Deck-/Kategorie-Label | 11–12px | 600 | 1.2 | uppercase, letter-spacing 0.05em, gedämpft, Geist Mono passt hier gut |
| Frage (Front) | 20–24px | 600 | 1.3 | Geist Sans, mittig oder linksbündig |
| Antwort (Back) | 15–16px | 400–450 | 1.5 | linksbündig, Body-Line-height für Lesbarkeit |
| Code in Antwort | 13–14px | 400 | 1.5 | Geist Mono |

Line-height-Regel: Headings/Fragen 1.2–1.3, Body/Antworten 1.4–1.6.

**Lange Antworten (das Scrollbar-Problem):** In Präferenz-Reihenfolge:
1. **`line-clamp` + Modal-Expansion (beste Lösung):** Antwort in der Karte auf z. B. `line-clamp: 6` kürzen, mit "… mehr anzeigen"; Klick öffnet ein Modal/Overlay mit voller Antwort. Kein Scroll in der Karte.
2. **Größere Karte im Study-Modus:** Wenn du sowieso einen Einzelkarten-Modus baust (siehe 6), kann die Karte dort so groß sein, dass 90 % der Antworten passen.
3. **Gestylte/versteckte Scrollbar als Fallback:** Wenn Scroll unvermeidbar, dann Scrollbar dezent stylen — aber Accessibility beachten (sichtbare Scrollbars helfen Orientierung):
   ```css
   .answer { scrollbar-width: thin; }
   .answer::-webkit-scrollbar { width: 6px; }
   .answer::-webkit-scrollbar-thumb { background: rgba(120,120,120,.3); border-radius: 3px; }
   ```
Vermeide: Auto-Size-Text (verschiedene Kartengrößen im Grid wirken chaotisch).

### 6. Grid-Layout bei 150 Karten

**Empfehlung: Hybrid — Grid zum Browsen, Einzelkarte zum Lernen.**
- Das Grid (Card-Grid-Pattern) ist richtig zum visuellen Browsen/Stöbern einer Sammlung. Aber: bei 150 Karten sollten die Grid-Kacheln NICHT alle einzeln flippbar sein — das ist visuelles Rauschen und der schwächste Teil deines aktuellen Ansatzes.
- Besser: Grid-Kacheln zeigen nur die Frage + Deck-Label (kompakt, kein Flip). Klick öffnet einen fokussierten **Study-/Einzelkarten-Modus** (eine große Karte mittig, Flip per Klick, Weiter/Zurück-Navigation, Tastatur-Shortcuts) — das ist das Muster von Quizlet ("Flip"-Modus) und Duolingo.
- Spaltenzahl: 4 Spalten auf großem Desktop sind ok, aber responsive gestaffelt (1 mobil → 2 tablet → 3–4 desktop). Konsistente Gutters (16px), konsistentes Padding.

### 7. Dark Mode

Dein Squid-Ink #141a24-Canvas ist eine gute Basis. Die zentrale Regel (Material "tonal elevation", Muzli, Atlassian): **Schatten funktionieren auf dunklem Grund nicht — Elevation kommt aus helleren Flächen, nicht aus Schatten.**
- Canvas (dunkelste Ebene) → Karten-Fläche eine Stufe heller (z. B. #1c232e) → Back-Face oder gehobene/aktive Karte noch eine Stufe heller.
- Front/Back-Differenzierung im Dark Mode: NICHT über Farbe (tinted purple), sondern über Helligkeitsstufe + ein dünner Domain-Farb-Akzent oben.
- Hairline-Border wird im Dark Mode wichtiger (subtile helle Border statt Schatten zur Kanten-Definition).
- AWS-Orange (#FF9900/#ED7100) als sparsamer Akzent bleibt — aber auf dunklem Grund Sättigung leicht prüfen.

### 8. Konkrete Anti-Patterns (die "Don't do this"-Liste)

- ❌ Farbiger Left-Border-Strip als einziges Karten-Signal (dein aktuelles stärkstes Amateur-Merkmal).
- ❌ Oversized generisches Emoji in der Mitte (🧰🔒☁️) — passt nicht zum Inhalt, wirkt AI-generiert.
- ❌ Pillen-Badge mit abgeschnittenem Text (`text-overflow: ellipsis` in einer Pille).
- ❌ Tinted-purple-Kasten als Back-Side.
- ❌ Sichtbare Standard-Scrollbars innerhalb der Karte.
- ❌ Flip zu schnell (120–200ms) — wirkt abgehackt.
- ❌ Reines `rotateY` ohne `perspective` auf dem Eltern-Element (flacher, billiger Flip).
- ❌ Einzelner harter `box-shadow: 0 2px 4px rgba(0,0,0,.5)` — wirkt wie ein grauer Rahmen.
- ❌ Neumorphism / Doppel-Schatten.
- ❌ Alle 150 Karten als einzeln flippbare Grid-Kacheln.
- ❌ Ruled-line-Indexkarten-Textur / Corner-Fold als "physisch"-Trick.

## Recommendations

### Stufe 1 — Sofort (der 80/20-Fix, ~1 Tag)
Diese vier Änderungen beseitigen das "amateurhafte" Gefühl am stärksten:
1. **Left-Border-Strip raus.** Ersetze durch: vollflächige Karte, `rounded-xl` (12px), `border` (Hairline: `border-zinc-200` light / `border-white/8` dark), + geschichteter Shadow (siehe Rezept oben).
2. **Emoji raus.** Default: kein Icon (typografie-zuerst). Deck-Label als kleines uppercase-Mono-Label oben links.
3. **Pillen-Badge → schlichtes Text-Label** ohne Truncation; wenn Domain-Farbe gewünscht, nur ein 3px-Farbpunkt oder eine 2px-Top-Linie in der Domain-Farbe.
4. **Back-Side entlaufen:** tinted-purple raus → gleiche Fläche wie Front, Antwort linksbündig, kleines "Antwort"-Label, `line-clamp` statt Scroll.

Tailwind-4-Skizze der Front:
```jsx
<div className="group aspect-[3/2] rounded-xl border border-zinc-200 bg-white
                p-6 shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_12px_rgba(0,0,0,.05)]
                transition-transform duration-150 ease-[cubic-bezier(.22,.9,.3,1)]
                hover:-translate-y-1 dark:border-white/10 dark:bg-[#1c232e]">
  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
    Security · SAA-C03
  </span>
  <p className="mt-4 text-xl font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
    Welcher Service verschlüsselt Daten at-rest zentral verwaltet?
  </p>
</div>
```

### Stufe 2 — Der richtige Flip (~1 Tag)
- Baue die `.scene`/`.card`/`.card__face`-Struktur (Code oben).
- Flip-Dauer 500ms, `cubic-bezier(.2,.8,.2,1)`; Hover-Lift 150ms mit deiner bestehenden `cubic-bezier(.22,.9,.3,1)`.
- `prefers-reduced-motion`: Flip durch Opacity-Crossfade ersetzen (kein Rotate):
  ```css
  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
    /* stattdessen Faces per Opacity togglen */
  }
  ```
- Accessibility: Flip per `<button>` oder `tabindex` + Enter/Space auslösbar; `aria-hidden` auf der nicht-sichtbaren Face; Fokus-Ring.

### Stufe 3 — Study-Modus & Icons (~2–3 Tage)
- Grid-Klick → fokussierter Einzelkarten-Modus (große Karte, Weiter/Zurück, Tastatur, Fortschritt).
- Lange Antworten → Modal-Expansion.
- Optional: offizielle AWS-Architecture-Icons für service-spezifische Karten (20–24px, Kategoriefarbe, oben links).
- Optional: dezenter Deck-Stack (`::before`/`::after`) und/oder `react-parallax-tilt` (max 8°) im Study-Modus.

### Benchmarks / Trigger, die die Empfehlung ändern
- Wenn Nutzer im Grid tatsächlich flippen wollen (Analytics zeigt viele Grid-Flips): dann doch Flip im Grid behalten, aber Karten vergrößern (3 Spalten statt 4).
- Wenn >30 % der Antworten auch im Study-Modus überlaufen: Karten-Layout überdenken (Antworten sind zu lang → "Rule of Minimum Information").
- Wenn Performance auf 150 flippbaren Karten leidet: Flip nur im Einzelkarten-Modus, Grid statisch.

### Named-Reference-Beispiele (die Oktay direkt ansehen kann)
**Anki-Templates:**
- `anki-templates-superlist` von Troyciv (github.com/Troyciv/anki-templates-superlist) — kuratierte Sammlung guter Card-Styles.
- `modern-anki-card-template` von tyuichis (github.com/tyuichis/modern-anki-card-template) — bestes Beispiel für Metadaten-Label, Container-Fokus, Dark/Light, subtile Animationen.
- `moderncardthemes` von b3nj5m1n — cleane note-types (prettyBasic/prettyCloze) mit farbigem Top-Stripe via Tag.
- `anki-prettify` von pranavdeshai — moderne, cleane Themes.

**Flip-Code:**
- David DeSandro *Intro to CSS 3D Transforms* / Card Flip (3dtransforms.desandro.com/card-flip) — kanonische Referenz.
- Cole Bemis "CSS Card Flip" (codepen.io/colebemis/pen/WNKdNj) — clean, cubic-bezier.
- Auroratide "A (more) realistic card flip animation" (auroratide.com/posts/realistic-flip-animation) — für lift-then-flip-Physik & reduced-motion.

**Dribbble (Inspiration Grid/Flip):**
- "Flashcard App" von Pocketworks Mobile; "Flashcard App Concept!" von Rehan; Tag-Galerien dribbble.com/tags/flashcards und /tags/card-flip.

**Libraries:**
- `react-parallax-tilt` (2.9kB, zero deps) für Tilt-on-Hover.

## Caveats

- **AWS-Icon-Farben vs. deine Domain-Farben:** Die offizielle AWS-Architecture-Icon-Palette (Release 16, 2023.04.28) ist NICHT identisch mit deinen App-Domain-Farben. Insbesondere ist "Database" in der aktuellen offiziellen Palette magenta (`#C925D1`), nicht blau — AWS hat Blau bewusst zugunsten von UI-Zwecken (Text-Links) deprecatet. Networking, Security und Analytics teilen sich alle Galaxy-Lila (`#8C4FFF`). Wenn du echte AWS-Service-Icons einbaust, wird es zwei Farbsysteme geben (deine Domain-Farben + AWS-Kategoriefarben) — das kann visuell konkurrieren. Empfehlung: AWS-Icons in Original-Farbe nur als kleines Service-Marker, deine Domain-Farben für die Deck-Struktur.
- **Trend-Quellen sind teils Marketing/Meinung:** Viele der "2026-Design-Trend"-Artikel (Skeuomorphism/Neumorphism) sind Agentur-Blogs mit SEO-Motiv, keine peer-reviewten Quellen. Die Kern-Aussagen (Neumorphism = Accessibility-Problem, Elevation via Helligkeit im Dark Mode) sind aber durch etablierte Design-Systeme (Material, Atlassian) gedeckt.
- **Exakte Flip-Dauer ist Geschmackssache:** 450–550ms ist mein begründeter Richtwert (durch Quizlets 500ms-Default gestützt); teste 400/500/600ms mit echten Nutzern. Es gibt keine harte "richtige" Zahl.
- **Deck-Stack-Effekt kann bei einem Grid mit vielen Karten überladen wirken** — nur im Einzelkarten-Modus oder sehr subtil einsetzen.
- **Ich habe die konkreten Live-Designs von Brainscape/RemNote/iDoRecall/Cram/Memrise nicht Pixel für Pixel inspiziert**, sondern aus Vergleichs-/Review-Quellen und Design-Prinzipien abgeleitet; die konkreten CSS-Werte sind meine Empfehlung, nicht direkt aus diesen Apps extrahiert.