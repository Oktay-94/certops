// Content-addressed cache key for TTS audio blobs. The hash is computed over
// the STRIPPED plain text (the exact ElevenLabs input), so any content edit —
// markdown or stripping rules — yields a new key and the stale audio is simply
// never referenced again. Server-only (node:crypto), pure and test-friendly.
import { createHash } from "node:crypto";

/** First 12 hex chars of sha256 over the plain text — enough to never collide
 * within ~200 fixed segments, short enough to keep blob pathnames readable. */
export function contentHash(plainText: string): string {
  return createHash("sha256").update(plainText, "utf8").digest("hex").slice(0, 12);
}

/** Blob pathname: tts/{kapitel}/{slug}-{hash}.mp3 */
export function blobKey(kapitel: string, slug: string, hash: string): string {
  return `tts/${kapitel}/${slug}-${hash}.mp3`;
}
