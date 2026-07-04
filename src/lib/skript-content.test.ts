import { describe, expect, it } from "vitest";
import {
  readChapterMarkdown,
  splitChapter,
  toRenderBlocks,
} from "./skript-content";
import { chapterByNum } from "./skript";

describe("splitChapter", () => {
  it("separates intro from one section per ## heading (real chapter 7)", () => {
    const md = readChapterMarkdown(chapterByNum(7)!);
    const { intro, sections } = splitChapter(md);
    expect(intro).toContain("Daten-Pipeline"); // chapter Kernidee stays in intro
    expect(intro).not.toContain("## "); // no service heading leaked into intro
    expect(sections).toHaveLength(10); // K07 has 10 service sections
    expect(sections[0].text).toBe("Amazon Athena");
    expect(sections[0].slug).toBe("amazon-athena");
    expect(sections[0].markdown.startsWith("## Amazon Athena")).toBe(true);
    expect(sections[0].markdown).not.toContain("\n---"); // separators stripped
  });
});

describe("toRenderBlocks", () => {
  it("wraps the ⚠️ label + its list into one exam block, keeps the rest md", () => {
    const md = readChapterMarkdown(chapterByNum(7)!);
    const athena = splitChapter(md).sections[0].markdown;
    const blocks = toRenderBlocks(athena);

    const exam = blocks.filter((b) => b.kind === "exam");
    expect(exam).toHaveLength(1);
    expect(exam[0].markdown).toContain("Prüfungs-Knackpunkte");
    expect(exam[0].markdown).toContain("- "); // the bullet list came along
    // Heading + metaphor stay in a normal md block before the exam box…
    expect(blocks[0].kind).toBe("md");
    expect(blocks[0].markdown).toContain("## Amazon Athena");
    // …and the 🛑 Pro-Tipp paragraph after it is not swallowed by the box.
    const last = blocks[blocks.length - 1];
    expect(last.kind).toBe("md");
    expect(last.markdown).toContain("Pro-Tipp");
  });

  it("returns a single md block when a section has no ⚠️ label", () => {
    const blocks = toRenderBlocks("## Foo\n\nNur Prosa, keine Knackpunkte.");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("md");
  });

  it("absorbs a list separated from a label-only exam block by a blank line", () => {
    const blocks = toRenderBlocks(
      "## Bar\n\n**⚠️ Prüfungs-Knackpunkte**\n\n- Punkt eins\n- Punkt zwei\n\nDanach.",
    );
    const exam = blocks.filter((b) => b.kind === "exam");
    expect(exam).toHaveLength(1);
    expect(exam[0].markdown).toContain("- Punkt eins");
    expect(blocks[blocks.length - 1].markdown).toContain("Danach.");
  });
});
