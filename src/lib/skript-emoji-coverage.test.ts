// Completeness freeze for the h2 emoji coverage (analogous to
// skript-anchors.test.ts). It pins, for EVERY ## heading across all chapters,
// whether it gets a metaphor emoji. Any drift — a renamed heading, an edited
// service name, a changed metaphor that breaks a name match — flips the
// yes/no split and turns this red, so emoji coverage can never silently shift.
import { describe, expect, it } from "vitest";
import { SKRIPT_CHAPTERS } from "./skript";
import { parseHeadings, readChapterMarkdown } from "./skript-content";
import { emojiForHeadingText } from "./skript-emoji";

// The ONLY headings that legitimately carry no emoji: collective / detail /
// concept sections with no single namesake service. Frozen list — 9 entries.
// (Displayed text, i.e. without the 🛑 tail.)
const EXPECTED_WITHOUT_EMOJI = [
  "Was ist Cloud Computing — und die 6 Vorteile",
  "Cloud-Deployment-Modelle: Cloud, Hybrid & On-Premises",
  "Cloud-Service-Modelle: IaaS / PaaS / SaaS / CaaS / DaaS",
  "Das Modell der geteilten Verantwortung (Shared Responsibility Model)",
  "AWS Global Infrastructure kompakt",
  "Container-Grundlagen: Docker, Kubernetes, ECS, EKS & Fargate",
  "Container, ECS & ECR im Detail",
  "Hybrid & Edge — Local Zones, Wavelength & Outposts",
  "CloudFront – OAC, OAI, Lambda@Edge, Functions & SNI",
].sort();

const EXPECTED_WITH_EMOJI_COUNT = 154;

const allHeadings = SKRIPT_CHAPTERS.flatMap((c) =>
  parseHeadings(readChapterMarkdown(c)).map((h) => ({ chapter: c.num, ...h })),
);

describe("h2 emoji coverage freeze", () => {
  it("exactly the frozen 9 headings resolve to no emoji", () => {
    const without = allHeadings
      .filter((h) => emojiForHeadingText(h.raw) === null)
      .map((h) => h.text)
      .sort();
    expect(without).toEqual(EXPECTED_WITHOUT_EMOJI);
  });

  it("all remaining headings resolve to a non-empty, non-word emoji", () => {
    const withEmoji = allHeadings.filter(
      (h) => emojiForHeadingText(h.raw) !== null,
    );
    expect(withEmoji).toHaveLength(EXPECTED_WITH_EMOJI_COUNT);
    for (const h of withEmoji) {
      const emoji = emojiForHeadingText(h.raw)!;
      expect(emoji.length, `emoji for "${h.text}"`).toBeGreaterThan(0);
      // A leading alphanumeric/paren would mean the metaphor lacked an emoji.
      expect(emoji, `emoji for "${h.text}"`).not.toMatch(/^[\w(]/);
    }
  });

  it("covers all 163 headings (154 + 9)", () => {
    expect(allHeadings).toHaveLength(
      EXPECTED_WITH_EMOJI_COUNT + EXPECTED_WITHOUT_EMOJI.length,
    );
  });
});
