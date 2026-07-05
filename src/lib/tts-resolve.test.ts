// Resolution guard for the TTS route's 404 logic — runs against the real
// committed skript markdown, no mocks, no HTTP (the ElevenLabs call itself is
// deliberately untested).
import { describe, expect, it } from "vitest";
import { SKRIPT_CHAPTERS } from "./skript";
import { parseHeadings, readChapterMarkdown } from "./skript-content";
import { resolveSegmentMarkdown } from "./tts-resolve";
import { INTRO_SLUG, ttsPlainText } from "./tts-text";

const storage = SKRIPT_CHAPTERS.find((c) => c.slug === "03-storage")!;
const firstHeading = parseHeadings(readChapterMarkdown(storage))[0];

describe("resolveSegmentMarkdown", () => {
  it("returns null for an unknown chapter", () => {
    expect(resolveSegmentMarkdown("99-gibt-es-nicht", firstHeading.slug)).toBeNull();
  });

  it("returns null for an unknown slug in a real chapter", () => {
    expect(resolveSegmentMarkdown("03-storage", "kein-echter-abschnitt")).toBeNull();
  });

  it("resolves a real section slug to its markdown (heading included)", () => {
    const md = resolveSegmentMarkdown("03-storage", firstHeading.slug);
    expect(md).not.toBeNull();
    expect(md!).toContain(`## ${firstHeading.raw}`);
  });

  it("resolves __intro__ to the chapter intro", () => {
    const md = resolveSegmentMarkdown("03-storage", INTRO_SLUG);
    expect(md).not.toBeNull();
    expect(md!).not.toContain("\n## "); // intro stops before the first section
  });

  it("every chapter yields a speakable segment for every committed slug", () => {
    for (const chapter of SKRIPT_CHAPTERS) {
      for (const h of parseHeadings(readChapterMarkdown(chapter))) {
        const md = resolveSegmentMarkdown(chapter.slug, h.slug);
        expect(md, `${chapter.slug}#${h.slug}`).not.toBeNull();
        expect(
          ttsPlainText(md!).length,
          `${chapter.slug}#${h.slug} speaks`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
