// Lernskript content access — server-only (uses fs). Pages read chapter
// markdown at build time (fully static routes); the anchor-consistency test
// and the skriptRef generator reuse the same heading parser.
import fs from "node:fs";
import path from "node:path";
import { slugifyHeading, type SkriptChapter } from "./skript";

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "skript");

export type SkriptHeading = {
  /** Raw heading text after "## " (incl. 🛑 annotations). */
  raw: string;
  /** Display text: raw without the 🛑 annotation tail. */
  text: string;
  /** Anchor id — slugifyHeading(raw). */
  slug: string;
};

export function readSkriptFile(file: string): string {
  return fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
}

export function readChapterMarkdown(chapter: SkriptChapter): string {
  return readSkriptFile(chapter.file);
}

export function readDeckblattMarkdown(): string {
  return readSkriptFile("00-deckblatt.md");
}

/** All `## ` headings of a markdown document, in document order. */
export function parseHeadings(markdown: string): SkriptHeading[] {
  const headings: SkriptHeading[] = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(/^## (.+)$/);
    if (!m) continue;
    const raw = m[1].trim();
    const stop = raw.indexOf("🛑");
    const text = (stop === -1 ? raw : raw.slice(0, stop)).trim();
    headings.push({ raw, text, slug: slugifyHeading(raw) });
  }
  return headings;
}
