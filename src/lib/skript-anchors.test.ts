// Anchor-consistency gate for the Lernskript deep links: every skriptRef in
// aws-services-172.json must resolve to a real chapter and (when set) a real
// `##` heading anchor in the committed markdown. This freezes the generator
// output — a renamed heading or edited chapter file turns this red instead of
// producing a dead deep link.
import { describe, expect, it } from "vitest";
import raw from "./aws-services-172.json";
import { SKRIPT_CHAPTERS, chapterByNum, type SkriptRef } from "./skript";
import { parseHeadings, readChapterMarkdown } from "./skript-content";

type RawService = { id: number; service: string; skriptRef?: SkriptRef };
const services = (raw as { services: RawService[] }).services;

const headingsByChapter = new Map(
  SKRIPT_CHAPTERS.map((c) => [c.num, parseHeadings(readChapterMarkdown(c))]),
);

describe("skript content", () => {
  it("every chapter file exists and has at least one ## heading", () => {
    for (const chapter of SKRIPT_CHAPTERS) {
      expect(
        headingsByChapter.get(chapter.num)!.length,
        `chapter ${chapter.num} (${chapter.file})`,
      ).toBeGreaterThan(0);
    }
  });

  it("anchors are unique within each chapter", () => {
    for (const chapter of SKRIPT_CHAPTERS) {
      const slugs = headingsByChapter.get(chapter.num)!.map((h) => h.slug);
      expect(new Set(slugs).size, `chapter ${chapter.num}`).toBe(slugs.length);
    }
  });

  it("no ## heading uses inline markdown that renders differently than raw", () => {
    // The h2 renderer slugifies the FLATTENED DOM text, the generator/test
    // slugify the RAW line. slugifyHeading tolerates the *(…)* annotation
    // after 🛑, but bold/links/inline-code before it could diverge — forbid
    // them so a future heading edit fails here instead of breaking a link.
    for (const chapter of SKRIPT_CHAPTERS) {
      for (const h of headingsByChapter.get(chapter.num)!) {
        expect(h.text, `chapter ${chapter.num}: "${h.raw}"`).not.toMatch(
          /\*\*|__|`|\[.*\]\(/,
        );
      }
    }
  });
});

describe("skriptRef deep links", () => {
  it("all 172 services carry a skriptRef", () => {
    expect(services).toHaveLength(172);
    const missing = services.filter((s) => !s.skriptRef);
    expect(
      missing.map((s) => `[${s.id}] ${s.service}`),
      "services without skriptRef",
    ).toEqual([]);
  });

  it("every skriptRef resolves to an existing chapter and heading anchor", () => {
    const broken: string[] = [];
    for (const s of services) {
      const ref = s.skriptRef!;
      const chapter = chapterByNum(ref.chapter);
      if (!chapter) {
        broken.push(`[${s.id}] ${s.service} → unknown chapter ${ref.chapter}`);
        continue;
      }
      if (ref.anchor === undefined) continue; // chapter-level fallback
      const slugs = headingsByChapter.get(ref.chapter)!.map((h) => h.slug);
      if (!slugs.includes(ref.anchor)) {
        broken.push(
          `[${s.id}] ${s.service} → missing anchor #${ref.anchor} in chapter ${ref.chapter}`,
        );
      }
    }
    expect(broken).toEqual([]);
  });
});
