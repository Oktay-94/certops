// Server-rendered markdown for the Lernskript chapters — pages are fully
// static, so this compiles to plain HTML at build time (no client JS).
//
// Colours come from CSS custom properties (--accent, --accent-soft, --tint)
// set by the chapter page on an ancestor, so one draw logic serves every
// chapter. Each var() carries a neutral fallback for isolated renders (tests).
//
// The h2 renderer derives its id via the ONE shared slugifyHeading() (same
// function as the skriptRef generator and the anchor-consistency test) and
// places the metaphor emoji + deprecation flag *beside* the title — never into
// the slug input. No rehype-slug.
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugifyHeading } from "@/lib/skript";
import { emojiForHeadingText, isMerksatzText } from "@/lib/skript-emoji";

const REMARK_PLUGINS = [remarkGfm];

// Flatten rendered children to plain text so the emoji/flag/label logic and
// slugifyHeading see the same words the reader sees.
function flattenText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(flattenText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return flattenText(
      (children as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

// Bold-paragraph section labels ("**Metapher / Konzept**", "**Das Problem &
// Die Lösung**", "**⚠️ …Prüfungs-Knackpunkte…**") — rendered as small caps
// labels instead of bold prose. ⚠️ labels (inside the .exam box) read stronger.
//
// The exam styling is a flex row (icon + uppercase heading), which shreds a
// long prose paragraph into one narrow column per inline node. So the ⚠️ branch
// only fires for SHORT headings: real labels top out around ~70 chars, while a
// ⚠️-prefixed body sentence runs 250+. The 120-char cut sits in that wide gap.
const EXAM_LABEL_MAX_LEN = 120;
function labelKind(text: string): "exam" | "plain" | null {
  const t = text.trim();
  if (t.startsWith("⚠️") && t.length <= EXAM_LABEL_MAX_LEN) return "exam";
  if (t.startsWith("Metapher / Konzept") || t === "Das Problem & Die Lösung") {
    return "plain";
  }
  return null;
}

// Short deprecation flag from a 🛑 heading annotation: the status before the
// em-dash ("abgekündigt für Neukunden — 30.07.2024" → "abgekündigt für Neukunden").
function flagFromAnnotation(annotation: string): string {
  const cleaned = annotation.replace(/[*()]/g, "").trim();
  const dash = cleaned.search(/\s[—–-]\s/);
  return (dash === -1 ? cleaned : cleaned.slice(0, dash)).trim();
}

const COMPONENTS = {
  // The chapter page renders its own header — drop the markdown h1.
  h1: () => null,
  h2: ({ children }: ComponentProps<"h2">) => {
    const full = flattenText(children); // identical input to before
    const [titlePart, ...rest] = full.split("🛑");
    const title = titlePart.trim();
    const flag = rest.length > 0 ? flagFromAnnotation(rest.join("🛑")) : null;
    const emoji = emojiForHeadingText(title);
    return (
      <h2
        id={slugifyHeading(full)} // slug computation unchanged → anchors frozen
        className="svc-head mt-0 flex scroll-mt-[72px] items-center gap-[15px]"
      >
        {emoji && (
          <span
            aria-hidden
            className="shrink-0 text-[34px] leading-none [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.06))]"
          >
            {emoji}
          </span>
        )}
        <span className="text-[26px] font-[680] leading-tight tracking-[-0.017em] text-zinc-900">
          {title}
          {flag && (
            <span className="ml-2.5 inline-block rounded-md bg-amber-100 px-2 py-[3px] align-middle text-[12.5px] font-semibold tracking-normal text-amber-700">
              {flag}
            </span>
          )}
        </span>
      </h2>
    );
  },
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-6 text-lg font-semibold text-zinc-900" {...props} />
  ),
  p: ({ children, ...rest }: ComponentProps<"p">) => {
    const kind = labelKind(flattenText(children));
    if (kind === "exam") {
      return (
        <p className="exam-label flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.03em] text-zinc-900">
          {children}
        </p>
      );
    }
    if (kind === "plain") {
      return (
        <p className="mt-6 mb-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-zinc-500">
          {children}
        </p>
      );
    }
    return (
      <p className="mt-3 leading-relaxed text-zinc-800" {...rest}>
        {children}
      </p>
    );
  },
  ul: (props: ComponentProps<"ul">) => (
    <ul
      className="mt-3 list-disc space-y-1.5 pl-5 text-zinc-800 marker:text-[color:var(--accent,#475569)]"
      {...props}
    />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol
      className="mt-3 list-decimal space-y-1.5 pl-5 text-zinc-800 marker:text-[color:var(--accent,#475569)]"
      {...props}
    />
  ),
  li: (props: ComponentProps<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: ({ children }: ComponentProps<"blockquote">) => {
    const merk = isMerksatzText(flattenText(children));
    return merk ? (
      // Merksatz (💡 / 🧠) — the one AWS-orange accent.
      <blockquote className="mt-5 rounded-2xl border border-[#fde3ca] bg-[#fff8f2] px-[18px] py-4 text-[15.5px] leading-relaxed text-[#7c3a06] [&_strong]:text-[#9a4d0a] [&>p]:mt-2 [&>p:first-child]:mt-0">
        {children}
      </blockquote>
    ) : (
      // Metaphor / note — chapter accent.
      <blockquote className="my-5 rounded-r-xl border-l-[3px] border-[color:var(--accent,#475569)] bg-[color:var(--accent-soft,#eef1f5)] px-[18px] py-3.5 text-[17px] italic leading-relaxed text-zinc-900 [&>p]:mt-2 [&>p:first-child]:mt-0">
        {children}
      </blockquote>
    );
  },
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-[640] text-zinc-900" {...props} />
  ),
  code: (props: ComponentProps<"code">) => (
    <code
      className="rounded bg-zinc-100 px-1 py-0.5 text-[13px] text-zinc-800"
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-zinc-200" />,
  a: (props: ComponentProps<"a">) => (
    <a
      className="text-[color:var(--accent,#475569)] underline underline-offset-2"
      {...props}
    />
  ),
  // GFM tables can be wide (e.g. Shield-Tabelle) — scroll inside their own box.
  // min-width forces a horizontal scroll on narrow viewports instead of
  // squeezing columns to unreadable slivers; w-full still fills wider screens.
  table: (props: ComponentProps<"table">) => (
    <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
      <table
        className="w-full min-w-[520px] border-collapse text-sm"
        {...props}
      />
    </div>
  ),
  thead: (props: ComponentProps<"thead">) => (
    <thead className="bg-zinc-50 text-left" {...props} />
  ),
  th: (props: ComponentProps<"th">) => (
    <th
      className="border-b border-zinc-200 px-3 py-2 font-semibold text-zinc-900"
      {...props}
    />
  ),
  td: (props: ComponentProps<"td">) => (
    <td
      className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800"
      {...props}
    />
  ),
};

export function SkriptMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
