import { AWS_SERVICES } from "./aws-services";

const ALIASES: string[] = Array.from(
  new Set(AWS_SERVICES.flatMap((s) => s.aliases)),
).sort((a, b) => b.length - a.length);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALIAS_RE = new RegExp(
  `\\b(?:${ALIASES.map(escapeRegex).join("|")})\\b`,
  "g",
);

/**
 * Wraps AWS-service aliases in `==...==` (mark syntax), skipping any text
 * already inside `**bold**` or `==marked==` spans. Idempotent.
 */
export function addServiceMarkers(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end === -1) {
        out += text.slice(i);
        break;
      }
      out += text.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    if (text.startsWith("==", i)) {
      const end = text.indexOf("==", i + 2);
      if (end === -1) {
        out += text.slice(i);
        break;
      }
      out += text.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    // Free segment until next ** / == / EOS.
    let j = i;
    while (
      j < text.length &&
      !text.startsWith("**", j) &&
      !text.startsWith("==", j)
    ) {
      j++;
    }
    const free = text.slice(i, j);
    out += free.replace(ALIAS_RE, (m) => `==${m}==`);
    i = j;
  }
  return out;
}
