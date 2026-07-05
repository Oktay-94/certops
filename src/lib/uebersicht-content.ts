// Dienste-Schnellübersicht content access — server-only (uses fs). The page
// reads the canonical markdown at build time (fully static route). The parser
// is pure (takes a string) so the completeness test can feed it the real file.
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(
  process.cwd(),
  "src",
  "content",
  "uebersicht",
  "dienste-uebersicht.md",
);

// One line per service: "- **Name** 🛑? — Metapher · *Signalwort*".
const LINE_RE = /^-\s+\*\*(.+?)\*\*\s*(🛑)?\s*—\s*(.+?)\s*·\s*\*(.+?)\*\s*$/u;

export type UebersichtService = {
  name: string;
  deprecated: boolean;
  metaphor: string;
  signal: string;
};

/** Parse every service line of the overview markdown, in document order. */
export function parseUebersicht(markdown: string): UebersichtService[] {
  const out: UebersichtService[] = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(LINE_RE);
    if (!m) continue;
    out.push({
      name: m[1].trim(),
      deprecated: Boolean(m[2]),
      metaphor: m[3].trim(),
      signal: m[4].trim(),
    });
  }
  return out;
}

export function readUebersichtMarkdown(): string {
  return fs.readFileSync(FILE, "utf8");
}

export function readUebersichtServices(): UebersichtService[] {
  return parseUebersicht(readUebersichtMarkdown());
}
