import { describe, expect, it } from "vitest";
import {
  SKRIPT_CHAPTERS,
  chapterByNum,
  chapterBySlug,
  skriptUrl,
  slugifyHeading,
} from "./skript";

describe("slugifyHeading", () => {
  it("slugifies a plain service heading", () => {
    expect(slugifyHeading("Amazon Athena")).toBe("amazon-athena");
  });

  it("keeps numbers and collapses separators", () => {
    expect(slugifyHeading("Amazon AppStream 2.0")).toBe("amazon-appstream-2-0");
    expect(slugifyHeading("Amazon Route 53")).toBe("amazon-route-53");
  });

  it("transliterates German umlauts and ß", () => {
    expect(slugifyHeading('AWS Global Accelerator (Die „Schnellstraße")')).toBe(
      "aws-global-accelerator-die-schnellstrasse",
    );
  });

  it("handles & lists, em-dashes and commas", () => {
    expect(slugifyHeading("Amazon Lex & Polly & Transcribe")).toBe(
      "amazon-lex-polly-transcribe",
    );
    expect(
      slugifyHeading("Hybrid & Edge — Local Zones, Wavelength & Outposts"),
    ).toBe("hybrid-edge-local-zones-wavelength-outposts");
  });

  it("cuts everything from the first 🛑 marker on", () => {
    expect(
      slugifyHeading(
        "Amazon Forecast 🛑 *(abgekündigt für Neukunden — 30.07.2024)*",
      ),
    ).toBe("amazon-forecast");
  });

  it("produces identical slugs for raw markdown and rendered DOM text", () => {
    // Raw line still carries the *(…)* emphasis asterisks; the rendered DOM
    // text has them stripped by the markdown parser. Both must agree.
    const raw = "AWS CodeCommit 🛑 *(abgekündigt für Neukunden — 25.07.2024)*";
    const rendered = "AWS CodeCommit 🛑 (abgekündigt für Neukunden — 25.07.2024)";
    expect(slugifyHeading(raw)).toBe(slugifyHeading(rendered));
    expect(slugifyHeading(raw)).toBe("aws-codecommit");
  });

  it("drops emojis and other symbols", () => {
    expect(slugifyHeading("CORS, Bucket Policy & S3-Sicherheit")).toBe(
      "cors-bucket-policy-s3-sicherheit",
    );
    expect(slugifyHeading("💡 Nur Emoji Titel 💡")).toBe("nur-emoji-titel");
  });
});

describe("SKRIPT_CHAPTERS manifest", () => {
  it("has exactly 13 chapters numbered 1..13", () => {
    expect(SKRIPT_CHAPTERS).toHaveLength(13);
    expect(SKRIPT_CHAPTERS.map((c) => c.num)).toEqual(
      Array.from({ length: 13 }, (_, i) => i + 1),
    );
  });

  it("has unique slugs and files", () => {
    const slugs = new Set(SKRIPT_CHAPTERS.map((c) => c.slug));
    const files = new Set(SKRIPT_CHAPTERS.map((c) => c.file));
    expect(slugs.size).toBe(13);
    expect(files.size).toBe(13);
  });

  it("resolves lookups by num and slug", () => {
    expect(chapterByNum(7)?.slug).toBe("07-analytik");
    expect(chapterBySlug("07-analytik")?.num).toBe(7);
    expect(chapterByNum(14)).toBeUndefined();
    expect(chapterBySlug("nope")).toBeUndefined();
  });
});

describe("skriptUrl", () => {
  it("builds chapter + anchor URLs", () => {
    expect(skriptUrl({ chapter: 7, anchor: "amazon-athena" })).toBe(
      "/clf/skript/07-analytik#amazon-athena",
    );
  });

  it("builds chapter-level fallback URLs without anchor", () => {
    expect(skriptUrl({ chapter: 11 })).toBe(
      "/clf/skript/11-migration-disaster-recovery",
    );
  });

  it("falls back to the index for unknown chapters", () => {
    expect(skriptUrl({ chapter: 99, anchor: "x" })).toBe("/clf/skript");
  });
});
