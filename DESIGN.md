# DESIGN.md — CertOps Redesign v2

> Quelle der Token-Werte: `design/mockups/certops-redesign-v2.html` (abgenommen).
> Render-Quelle: `src/app/globals.css` · TS-Spiegel: `src/lib/design-tokens.ts` — synchron halten.

## Zwei-Achsen-Modell

Zwei orthogonale Attribute auf `<html>`:

| Achse | Werte | steuert |
|---|---|---|
| `data-theme` | *(leer = light)* / `dark` | Flächen-/Text-/Heat-**Leitern**, `color-scheme` |
| `data-exam` | `clf` / `saa` | **Akzent**-Identität (`--accent`, `--accent-soft`) |

Das Mockup koppelt beide Achsen (CLF = hell, SAA = Squid-Ink). Die App entkoppelt sie:
**kanonisch (mockup-treu 1:1)** sind `clf×light` und `saa×dark`; die übrigen zwei Kombis
leiten `--accent-soft` per `color-mix(… 14%, transparent)` ab, bis sie ein eigenes Design bekommen.

**Übergangsregel (bis Re-Skin Phase 2–5 fertig):** Default ist **Light ohne
`prefers-color-scheme`-Fallback** — Dark nur per explizitem Cookie (`certops_theme=dark`,
Toggle). Erst wenn alle Seiten auf Tokens laufen, wird `prefers-color-scheme` als Default
aktiviert (bewusste, mit Oktay abgestimmte Abweichung vom Implementierungsplan).

**SSG-Invariante:** Kein `cookies()`/`next/headers` im Root-Layout — das würde alle
statischen Routen dynamic machen. Theme-Init läuft als statisches Inline-Script
(`layout.tsx`), Persistenz als non-httpOnly-Cookie (`src/lib/theme-cookie.ts`).

## Token-Leitern

### Flächen & Text (`data-theme`)

| Token | light | dark (Squid-Ink, luminance stacking) |
|---|---|---|
| `--canvas` | `#fafafa` | `#141a24` |
| `--surface` | `#ffffff` | `#1b2330` |
| `--surface-2` | `#f4f4f5` | `#222c3b` |
| `--border` | `#e7e7e9` | `rgba(255,255,255,.07)` |
| `--border-strong` | `#d9d9dc` | `rgba(255,255,255,.14)` |
| `--ink` | `#17181a` | `#eef2f7` |
| `--ink-soft` | `#55585f` | `#9fadc0` |
| `--ink-faint` | `#a4a7ad` | `#5c6a7e` |
| `--success` / `-soft` | `#16a34a` / `#e8f7ee` | `#2bbf9e` / `rgba(1,168,141,.14)` |
| `--heat-0…4` | `#f0f0f1 → #16a34a` | weiße Alpha-Stufen `.05 → .8` |
| `--grid-line` | `rgba(35,47,62,.06)` | `rgba(255,255,255,.045)` — theme-scoped seit 2b (diagramm-quiz) |
| `--cta-ink` | `#1a1204` | `#1a1204` |

### Akzent (`data-exam`)

| Token | clf | saa |
|---|---|---|
| `--accent` | `#0891b2` | `#7d93c9` |
| `--accent-soft` | light: `#e0f5fa` · dark: color-mix 14 % | color-mix 14 % (beide Themes) |

### Geteilt (`:root`)

- **Radius:** `--r-card: 12px` · `--r-btn: 8px` · `--r-pill: 999px`
- **Spacing:** `--sp-1…6` = 4 / 8 / 12 / 16 / 24 / 48 px
- **Motion:** `--t-fast: 140ms` · `--t-med: 200ms` — Easing `cubic-bezier(.22,.9,.3,1)`, **nichts bouncy**
- **Marken:** `--orange-bright: #FF9900` (Anker, sparsam) · `--teal: #01A88D` (mastered) ·
  AWS-Orange `#ED7100` bleibt Single-Source in `src/lib/brand.ts`

### Tailwind-Utilities (via `@theme inline`)

`bg-canvas`, `bg-surface`, `bg-surface-2`, `border-line`, `border-line-strong`,
`text-ink`, `text-ink-soft`, `text-ink-faint`, `bg-accent`, `bg-accent-soft`, `font-sans` (Geist), `font-mono` (Geist Mono).
Bestandsseiten laufen noch auf zinc-Literalen — Umzug erfolgt pro Phase (2–5), **nicht** nebenbei.

## Typografie

Geist Sans + Geist Mono via `geist`-Package (self-hosted, kein Build-Fetch), Variablen
`--font-geist-sans` / `--font-geist-mono`. Mono für Eyebrows/Labels/Zahlen-Badges
(`letter-spacing: .12–.16em`, uppercase, 9.5–11px), Sans für alles andere.
Headline-Tracking negativ (`-.02` bis `-.03em`).

## Anti-Slop-Regeln (hart)

- **Kein** Purple-Gradient, **kein** Glassmorphism, **kein** Bento-um-des-Bento-willen.
- Orange **nur als Signal** (CTA, Streak-heute, Tag) — nie als Fläche.
- **Hairline-Borders statt Schatten** (`--border`, hover → `--border-strong`).
- Domain-Farben ausschließlich aus `src/lib/domain-colors.ts` (explizite Klassen-Literale,
  Anti-Purge). Performance-Farben strikt getrennt von Domain-Farben.
- lucide-react sparsam. Tastatur-Navigation muss erhalten bleiben.
- Motion 120–200 ms, Stagger-Reveals max. ~0.3 s Gesamtverzug, `prefers-reduced-motion` respektieren.
