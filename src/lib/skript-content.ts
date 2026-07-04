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

export type SkriptSection = SkriptHeading & {
  /** Full section markdown, incl. its own `## ` line, `---` separators stripped. */
  markdown: string;
};

/** Drop standalone `---` separators and trim surrounding blank lines. */
function stripRules(markdown: string): string {
  return markdown
    .replace(/^[ \t]*---[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split a chapter into its intro (everything before the first `## `) and one
 * section per `## ` heading. Each section's markdown keeps its heading line so
 * the h2 renderer still owns the id/anchor — the reading page wraps each
 * section in its own card without touching slugs.
 */
export function splitChapter(markdown: string): {
  intro: string;
  sections: SkriptSection[];
} {
  const lines = markdown.split("\n");
  const introLines: string[] = [];
  const sections: SkriptSection[] = [];
  let current: string[] | null = null;

  const flush = () => {
    if (!current) return;
    const [heading] = parseHeadings(current[0]);
    sections.push({ ...heading, markdown: stripRules(current.join("\n")) });
  };

  for (const line of lines) {
    if (/^## /.test(line)) {
      flush();
      current = [line];
    } else if (current) {
      current.push(line);
    } else {
      introLines.push(line);
    }
  }
  flush();

  return { intro: stripRules(introLines.join("\n")), sections };
}

export type RenderBlock = { kind: "md" | "exam"; markdown: string };

const EXAM_START = /^\**\s*⚠️/;
const LIST_START = /^\s*(?:[-*]\s|\d+\.\s)/;

/**
 * Group a section's markdown into render blocks so the reading page can wrap
 * the ⚠️ Prüfungs-Knackpunkte (label + its list) in a styled box. Deterministic:
 * blocks are blank-line separated; a block whose first line begins with ⚠️
 * (optionally bold) is an exam block. A label-only exam block absorbs a
 * following list block. Everything else stays contiguous markdown, so lists and
 * blockquotes render exactly as before — no slug/anchor involvement.
 */
export function toRenderBlocks(sectionMarkdown: string): RenderBlock[] {
  const blocks = sectionMarkdown
    .split(/\n[ \t]*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const out: RenderBlock[] = [];
  let run: string[] = [];
  const flushRun = () => {
    if (run.length) out.push({ kind: "md", markdown: run.join("\n\n") });
    run = [];
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!EXAM_START.test(block.split("\n")[0])) {
      run.push(block);
      continue;
    }
    flushRun();
    let markdown = block;
    const hasInlineList = block
      .split("\n")
      .slice(1)
      .some((l) => LIST_START.test(l));
    if (!hasInlineList && i + 1 < blocks.length && LIST_START.test(blocks[i + 1])) {
      markdown = `${block}\n${blocks[i + 1]}`;
      i += 1;
    }
    out.push({ kind: "exam", markdown });
  }
  flushRun();
  return out;
}
