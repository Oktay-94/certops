import { describe, expect, it } from "vitest";
import { blobKey, contentHash } from "./tts-cache-key";

describe("contentHash", () => {
  it("is stable for identical text", () => {
    expect(contentHash("Amazon S3 ist der Tresor.")).toBe(
      contentHash("Amazon S3 ist der Tresor."),
    );
  });

  it("is 12 lowercase hex chars", () => {
    expect(contentHash("x")).toMatch(/^[0-9a-f]{12}$/);
  });

  it("changes when the text changes", () => {
    expect(contentHash("Amazon S3 ist der Tresor.")).not.toBe(
      contentHash("Amazon S3 ist der Tresor!"),
    );
  });
});

describe("blobKey", () => {
  it("builds the tts/{kapitel}/{slug}-{hash}.mp3 pathname", () => {
    expect(blobKey("03-storage", "amazon-s3", "abcdef123456")).toBe(
      "tts/03-storage/amazon-s3-abcdef123456.mp3",
    );
  });
});
