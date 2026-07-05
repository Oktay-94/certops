// TTS text preparation — pure, isomorphic (no fs, no crypto). Turns a skript
// section's markdown (incl. its `## ` heading line) into plain speakable text
// for ElevenLabs. The rules mirror what a reader *hears*, not what they see:
// emojis and markers are noise, tables are unreadable aloud and get replaced
// by a pointer sentence, and each block becomes a proper sentence so the TTS
// voice pauses naturally.

/** Reserved slug for a chapter's intro segment (text before the first `## `). */
export const INTRO_SLUG = "__intro__";

const TABLE_SENTENCE = "Details siehe Tabelle im Skript.";

/** Ensure a non-empty string ends in sentence punctuation (for TTS pauses). */
function ensureSentence(s: string): string {
  if (!s) return s;
  return /[.!?:;]$/.test(s) ? s : `${s}.`;
}

/** Strip inline markdown + emoji noise; translate symbols the voice mangles. */
function stripInline(s: string): string {
  return (
    s
      // images entirely, links → their text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // emphasis / code / strikethrough markers (content stays)
      .replace(/[*`~]+/g, "")
      // emoji incl. variation selectors & ZWJ sequences (covers 🛑⚠️💡🧠 …)
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/[\u{FE0F}\u{200D}\u{20E3}]/gu, "")
      // symbols TTS reads badly or skips
      .replace(/\s*↔\s*/g, " und umgekehrt ")
      .replace(/\s*→\s*/g, ", also ")
      .replace(/\s*·\s*/g, ", ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** Heading text: cut the 🛑 annotation tail, then strip inline noise. */
function headingSentence(headingLine: string): string {
  const raw = headingLine.replace(/^#{1,6}\s+/, "");
  const stop = raw.indexOf("🛑");
  const text = stripInline(stop === -1 ? raw : raw.slice(0, stop));
  return ensureSentence(text);
}

const TABLE_LINE = /^\s*\|/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+\.)\s+/;

/**
 * Markdown → plain speakable text. Works block-wise (blank-line separated):
 * headings and list items become sentences, blockquote markers drop, each
 * table block collapses to the single pointer sentence, `---` rules vanish.
 */
export function ttsPlainText(markdown: string): string {
  // Pass 1: collapse each contiguous table block to the pointer sentence.
  const lines: string[] = [];
  let inTable = false;
  for (const line of markdown.split("\n")) {
    if (TABLE_LINE.test(line)) {
      if (!inTable) lines.push(TABLE_SENTENCE);
      inTable = true;
      continue;
    }
    inTable = false;
    lines.push(line);
  }

  // Pass 2: block-wise conversion.
  const out: string[] = [];
  const blocks = lines
    .join("\n")
    .split(/\n[ \t]*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    if (/^[ \t]*---[ \t]*$/.test(block)) continue;
    if (/^#{1,6}\s/.test(block.split("\n")[0])) {
      // heading (first line) + any trailing lines as a paragraph
      const [first, ...rest] = block.split("\n");
      out.push(headingSentence(first));
      const restText = stripInline(rest.join(" ").replace(/^>\s?/gm, ""));
      if (restText) out.push(ensureSentence(restText));
      continue;
    }
    if (block === TABLE_SENTENCE) {
      out.push(TABLE_SENTENCE);
      continue;
    }
    const cleaned = block.replace(/^>\s?/gm, "");
    if (LIST_ITEM.test(cleaned.split("\n")[0])) {
      // list block: every item its own sentence
      for (const item of cleaned.split("\n")) {
        const text = stripInline(item.replace(LIST_ITEM, ""));
        if (text) out.push(ensureSentence(text));
      }
      continue;
    }
    // paragraph (possibly hard-wrapped): join lines, one sentence-terminated run
    const text = stripInline(cleaned.split("\n").join(" "));
    if (text) out.push(ensureSentence(text));
  }

  return out.join(" ").replace(/\s+/g, " ").trim();
}
