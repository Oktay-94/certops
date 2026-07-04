// Server-rendered markdown for the Lernskript chapters — pages are fully
// static, so this compiles to plain HTML at build time (no client JS).
//
// The h2 renderer derives its id via the ONE shared slugifyHeading() (same
// function as the skriptRef generator and the anchor-consistency test). No
// rehype-slug — a second slugger with different rules would silently break
// the deep links.
import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugifyHeading } from "@/lib/skript";

const REMARK_PLUGINS = [remarkGfm];

// Flatten rendered heading children to plain text ("Amazon Forecast 🛑 (…)")
// so slugifyHeading sees the same words the reader sees.
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

const COMPONENTS = {
  // The chapter page renders its own header — drop the markdown h1.
  h1: () => null,
  h2: ({ children }: ComponentProps<"h2">) => (
    <h2
      id={slugifyHeading(flattenText(children))}
      className="mt-10 scroll-mt-6 border-b border-zinc-200 pb-2 text-2xl font-semibold tracking-tight text-zinc-900"
    >
      {children}
    </h2>
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="mt-6 text-lg font-semibold text-zinc-900" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="mt-3 leading-relaxed text-zinc-800" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-zinc-800" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-zinc-800" {...props} />
  ),
  li: (props: ComponentProps<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="mt-4 rounded-r-lg border-l-4 border-zinc-300 bg-zinc-50 px-4 py-2.5 text-zinc-700 [&>p]:mt-1.5 [&>p:first-child]:mt-0"
      {...props}
    />
  ),
  strong: (props: ComponentProps<"strong">) => (
    <strong className="font-semibold text-zinc-900" {...props} />
  ),
  code: (props: ComponentProps<"code">) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 text-[13px]" {...props} />
  ),
  hr: () => <hr className="my-8 border-zinc-200" />,
  a: (props: ComponentProps<"a">) => (
    <a className="text-blue-700 underline underline-offset-2" {...props} />
  ),
  // GFM tables can be wide (e.g. Shield-Tabelle) — scroll inside their own box.
  table: (props: ComponentProps<"table">) => (
    <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full border-collapse text-sm" {...props} />
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
