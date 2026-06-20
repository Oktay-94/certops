// Guard: the full CLF-C02 seed array must stay at the expected size and free of
// duplicate prompts. Mirrors the `all` array composition in src/db/seed.ts.
import { describe, expect, it } from "vitest";
import { clfC02Questions } from "../index";
import { clfC02QuestionsBatch2 } from "./index";
import { clfC02QuestionsBatch3 } from "./index-batch3";

const all = [
  ...clfC02Questions,
  ...clfC02QuestionsBatch2,
  ...clfC02QuestionsBatch3,
];

describe("CLF-C02 seed questions", () => {
  it("has exactly 264 questions", () => {
    expect(all).toHaveLength(264);
  });

  it("has no duplicate prompts", () => {
    const prompts = all.map((q) => q.prompt.trim());
    const unique = new Set(prompts);
    expect(unique.size).toBe(prompts.length);
  });
});
