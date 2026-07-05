// Guard tests for the Dienste-Schnellübersicht (/uebersicht). These freeze the
// two invariants that would silently rot: (a) every service line renders, and
// (b) every deep-link target actually exists in the committed skript markdown —
// a renamed heading or a dropped service turns this red instead of shipping a
// dead link.
import { describe, expect, it } from "vitest";
import { SKRIPT_CHAPTERS, chapterByNum } from "./skript";
import { parseHeadings, readChapterMarkdown } from "./skript-content";
import {
  parseUebersicht,
  readUebersichtMarkdown,
  readUebersichtServices,
} from "./uebersicht-content";
import { resolveServiceRef, serviceEmoji } from "./uebersicht";
import { matchesQuery, sortKey } from "./uebersicht-search";

const markdown = readUebersichtMarkdown();
const services = readUebersichtServices();

const headingsByChapter = new Map(
  SKRIPT_CHAPTERS.map((c) => [c.num, parseHeadings(readChapterMarkdown(c))]),
);

describe("uebersicht content", () => {
  it("parses exactly 145 services", () => {
    expect(services).toHaveLength(145);
  });

  it("every '- **' bullet parses as a service (no silently dropped line)", () => {
    const bullets = markdown
      .split("\n")
      .filter((l) => /^-\s+\*\*/.test(l)).length;
    expect(parseUebersicht(markdown)).toHaveLength(bullets);
  });

  it("service names are unique", () => {
    const names = services.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("is sorted by sort key (Amazon/AWS prefix stripped)", () => {
    const keys = services.map((s) => sortKey(s.name));
    const sorted = [...keys].sort((a, b) => a.localeCompare(b, "de"));
    expect(keys).toEqual(sorted);
  });
});

describe("uebersicht deep links", () => {
  it("every service resolves to a skriptRef", () => {
    const unresolved = services
      .filter((s) => resolveServiceRef(s.name) === null)
      .map((s) => s.name);
    expect(unresolved).toEqual([]);
  });

  it("every resolved ref points at a real chapter and (if set) a real anchor", () => {
    const broken: string[] = [];
    for (const s of services) {
      const ref = resolveServiceRef(s.name)!;
      const chapter = chapterByNum(ref.chapter);
      if (!chapter) {
        broken.push(`${s.name} → unknown chapter ${ref.chapter}`);
        continue;
      }
      if (ref.anchor === undefined) continue; // chapter-level fallback (valid)
      const slugs = headingsByChapter.get(ref.chapter)!.map((h) => h.slug);
      if (!slugs.includes(ref.anchor)) {
        broken.push(`${s.name} → missing anchor #${ref.anchor} in ch ${ref.chapter}`);
      }
    }
    expect(broken).toEqual([]);
  });
});

describe("uebersicht deprecation", () => {
  it("marks exactly the 6 known deprecated services with 🛑", () => {
    const deprecated = services.filter((s) => s.deprecated).map((s) => s.name);
    expect(deprecated.sort()).toEqual(
      [
        "AWS Cloud9",
        "AWS CodeCommit",
        "Amazon Forecast",
        "Amazon Pinpoint",
        "Amazon QLDB",
        "Amazon Q Developer",
      ].sort(),
    );
  });

  it("includes the two Weg-B gap services (Bedrock, QLDB)", () => {
    const names = services.map((s) => s.name);
    expect(names).toContain("Amazon Bedrock");
    expect(names).toContain("Amazon QLDB");
  });
});

describe("uebersicht emojis", () => {
  it("every service resolves to a real pictographic emoji", () => {
    const broken: string[] = [];
    for (const s of services) {
      const e = serviceEmoji(s.name);
      // A real emoji (not a stray metaphor word) — pictographic, no ASCII letter.
      if (!e || !/\p{Extended_Pictographic}/u.test(e) || /[a-z]/i.test(e)) {
        broken.push(`${s.name} → ${JSON.stringify(e)}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("resolves emojis for the aliased and chapter-level edge cases", () => {
    // The four detail-card aliases + the two chapter-level services must still
    // get an emoji via the alias table / their own JSON entry.
    for (const n of [
      "Auto Scaling (ASG)",
      "Amazon ECR",
      "AWS Local Zones",
      "AWS Wavelength",
      "AWS Transfer Family",
      "AWS IoT Core",
      "Amazon Bedrock",
      "Amazon QLDB",
    ]) {
      expect(serviceEmoji(n), n).not.toBeNull();
    }
  });
});

describe("uebersicht prefix search", () => {
  it("empty query matches everything", () => {
    expect(matchesQuery("glue", "")).toBe(true);
    expect(matchesQuery("glue", "   ")).toBe(true);
  });

  it("matches by prefix of the sort key, case-insensitive", () => {
    expect(matchesQuery("glue", "g")).toBe(true);
    expect(matchesQuery("glue", "glue")).toBe(true);
    expect(matchesQuery("glue", "GLU")).toBe(true);
    expect(matchesQuery("athena", "a")).toBe(true);
  });

  it("does not match a non-prefix substring", () => {
    expect(matchesQuery("glue", "lue")).toBe(false);
    expect(matchesQuery("athena", "b")).toBe(false);
  });

  it("filters the real dataset consistently (single letter vs full name)", () => {
    const keys = services.map((s) => sortKey(s.name));
    const gServices = keys.filter((k) => matchesQuery(k, "g"));
    expect(gServices.length).toBeGreaterThan(0);
    expect(keys.filter((k) => matchesQuery(k, "glue"))).toEqual(["glue"]);
    // "a" bucket equals every sort key starting with "a"
    expect(keys.filter((k) => matchesQuery(k, "a"))).toEqual(
      keys.filter((k) => k.startsWith("a")),
    );
  });
});
