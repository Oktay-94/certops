// Minimal inline renderer for seed content: **bold** and `code` become React
// nodes (<strong>/<code>). Deliberately NOT a markdown parser (no dependency,
// no dangerouslySetInnerHTML — XSS safety comes from React's text escaping).
// Rules:
//   - `code` wins where it starts first; its content is literal (no bold
//     inside code).
//   - **bold** may contain `code` (one nesting level — bold in bold is not
//     a thing in the content).
//   - Unbalanced or empty markers stay literal text.
// Plain CLF content passes through as a single text node, unchanged.
import type { ReactNode } from "react";

// Alternation order matters: at a backtick the code branch matches first, so
// ** inside code stays literal. Bold content permits single * and backticks.
const INLINE_RE = /`([^`]+)`|\*\*((?:[^*]|\*(?!\*))+?)\*\*/g;
const CODE_RE = /`([^`]+)`/g;

function renderCodeOnly(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  CODE_RE.lastIndex = 0;
  for (let m = CODE_RE.exec(text); m; m = CODE_RE.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<code key={`${keyPrefix}c${i++}`}>{m[1]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Render a content string with **bold** and `code` as React nodes. */
export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  INLINE_RE.lastIndex = 0;
  for (let m = INLINE_RE.exec(text); m; m = INLINE_RE.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<code key={`c${i++}`}>{m[1]}</code>);
    } else {
      out.push(<strong key={`b${i++}`}>{renderCodeOnly(m[2], `b${i}`)}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
