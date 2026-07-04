import { describe, expect, it } from "vitest";
import { emojiForHeadingText, isMerksatzText } from "./skript-emoji";

describe("emojiForHeadingText", () => {
  it("resolves a plain service heading to its metaphor emoji", () => {
    expect(emojiForHeadingText("Amazon Athena")).toBe("🔍");
    expect(emojiForHeadingText("AWS Glue")).toBe("🔗");
  });

  it("resolves headings with a parenthetical suffix", () => {
    expect(emojiForHeadingText("Amazon EC2 (Elastic Compute Cloud)")).toBe("🐄");
    expect(emojiForHeadingText("Amazon S3 (Simple Storage Service)")).toBe("🗄️");
  });

  it("cuts the 🛑 annotation tail before matching", () => {
    expect(
      emojiForHeadingText("Amazon Forecast 🛑 *(abgekündigt für Neukunden — 30.07.2024)*"),
    ).toBe("🔮");
  });

  it("returns null for collective/concept headings with no single service", () => {
    expect(
      emojiForHeadingText("Container-Grundlagen: Docker, Kubernetes, ECS, EKS & Fargate"),
    ).toBeNull();
    expect(emojiForHeadingText("Was ist Cloud Computing — und die 6 Vorteile")).toBeNull();
  });

  it("returns null (no throw) for unknown text", () => {
    expect(emojiForHeadingText("Völliger Unsinn xyz")).toBeNull();
    expect(emojiForHeadingText("")).toBeNull();
  });
});

describe("isMerksatzText", () => {
  it("flags 💡 and 🧠 blockquotes (optionally bold-wrapped)", () => {
    expect(isMerksatzText("💡 Merksatz: Athena = Detektivin")).toBe(true);
    expect(isMerksatzText("🧠 Mini-Merkkasten dieses Blocks")).toBe(true);
    expect(isMerksatzText("**🧠 Mini-Merkkasten (wortgetreu):**")).toBe(true);
  });

  it("does not flag metaphor / normal blockquotes", () => {
    expect(isMerksatzText("Die Detektivin, die deine Dateiberge …")).toBe(false);
    expect(isMerksatzText("**Konvention:** Normaler Text …")).toBe(false);
  });
});
