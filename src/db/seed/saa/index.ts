// SAA-C03 seed sources. The JSONs are audited artifacts copied byte-identical
// from the content pipeline (certops-saa-content) — do not hand-edit here;
// patch upstream and re-copy. exports/saa-questions-ALL-*.json is a duplicate
// of the batches and intentionally NOT included.
import type { NewFlashcard, NewQuestion } from "../../schema";

import questionsD1B1 from "./saa-questions-d1-batch1.json";
import questionsD1B2 from "./saa-questions-d1-batch2.json";
import questionsD1B3 from "./saa-questions-d1-batch3.json";
import questionsD2B1 from "./saa-questions-d2-batch1.json";
import questionsD2B2 from "./saa-questions-d2-batch2.json";
import questionsD2B3 from "./saa-questions-d2-batch3.json";
import questionsD3B1 from "./saa-questions-d3-batch1.json";
import questionsD3B2 from "./saa-questions-d3-batch2.json";
import questionsD3B3 from "./saa-questions-d3-batch3.json";
import questionsD4B1 from "./saa-questions-d4-batch1.json";
import questionsD4B2 from "./saa-questions-d4-batch2.json";
import cardsD1 from "./saa-cards-d1.json";
import cardsD2 from "./saa-cards-d2.json";
import cardsD3 from "./saa-cards-d3.json";
import cardsD4 from "./saa-cards-d4.json";

// JSON imports widen literal-union fields (cert, type) to string, so a cast is
// unavoidable. The runtime shape (counts, gapless seed keys, enum values) is
// enforced by saa-seed.test.ts.
export const saaC03Questions: NewQuestion[] = [
  questionsD1B1,
  questionsD1B2,
  questionsD1B3,
  questionsD2B1,
  questionsD2B2,
  questionsD2B3,
  questionsD3B1,
  questionsD3B2,
  questionsD3B3,
  questionsD4B1,
  questionsD4B2,
].flat() as NewQuestion[];

export const saaC03Flashcards: NewFlashcard[] = [
  cardsD1,
  cardsD2,
  cardsD3,
  cardsD4,
].flat() as NewFlashcard[];
