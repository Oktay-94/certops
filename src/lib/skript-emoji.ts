// h2 emoji resolution for the Lernskript reading mode.
//
// Single-source: the emoji is the leading token of a service's `metaphor`
// field in aws-services-172.json — the SAME field the service cards show. No
// emoji is ever written into the markdown headings; it is looked up here at
// render time and placed *before* the title, so slugifyHeading stays untouched.
//
// A heading gets an emoji iff a service's own name matches it
// (normalizeName equality). Collective/detail headings that only exist as a
// shared skriptRef target (e.g. "Container-Grundlagen …") match no single
// service and correctly render without an emoji.
import raw from "./aws-services-172.json";
import { normalizeName } from "./skript";

type RawService = { service: string; metaphor: string };
const services = (raw as { services: RawService[] }).services;

/** Leading emoji token of a metaphor ("🐄 Der Computer-Zoo" → "🐄"). */
function metaphorEmoji(metaphor: string): string {
  return metaphor.split(" ")[0];
}

// normalizeName(service) → emoji. First occurrence wins (names are unique).
const EMOJI_BY_NAME = new Map<string, string>();
for (const s of services) {
  const key = normalizeName(s.service);
  if (!EMOJI_BY_NAME.has(key)) EMOJI_BY_NAME.set(key, metaphorEmoji(s.metaphor));
}

/**
 * Emoji for a heading, or null when no single service matches (collective /
 * detail / concept headings). Robust to the raw heading text incl. 🛑 tail —
 * normalizeName cuts it. Never throws, never returns undefined.
 */
export function emojiForHeadingText(headingText: string): string | null {
  return EMOJI_BY_NAME.get(normalizeName(headingText)) ?? null;
}

/**
 * True when a blockquote is a "Merksatz" callout — leads with 💡 (single
 * mnemonic) or 🧠 (Mini-Merkkasten). Both get the AWS-orange variant; every
 * other blockquote (metaphor, Konvention) gets the chapter accent.
 */
export function isMerksatzText(text: string): boolean {
  return /^\s*(\*+\s*)?(💡|🧠)/.test(text);
}
