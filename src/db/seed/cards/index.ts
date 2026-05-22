import type { NewFlashcard } from "../../schema";
import { clfC02ComputeStorageCards } from "./clf-c02-compute-storage";

export const clfC02Flashcards: NewFlashcard[] = [
  ...clfC02ComputeStorageCards,
];
