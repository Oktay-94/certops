// POST /api/tts — on-demand TTS for skript segments, cached in Vercel Blob.
//
// The request carries ONLY a { kapitel, slug } reference — never free text.
// The server resolves the segment from the committed markdown itself
// (tts-resolve), so the closed namespace of 13 chapters × committed slugs is
// the abuse guard: this endpoint cannot be used as an open TTS proxy.
//
// Cache: content-addressed blob key (hash over the stripped plain text). A
// cache hit returns the blob URL without touching ElevenLabs; audio blobs are
// public + deterministic by design — the skript content is public anyway.
//
// Required env (set in .env.local / Vercel project settings — see PR):
//   ELEVENLABS_API_KEY      ElevenLabs API key (server-only, never bundled)
//   ELEVENLABS_VOICE_ID     voice to render with
//   ELEVENLABS_MODEL_ID     optional, default "eleven_flash_v2_5"
//   BLOB_READ_WRITE_TOKEN   Vercel Blob (auto on Vercel; locally `vercel env pull`)
import { NextResponse } from "next/server";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { blobKey, contentHash } from "@/lib/tts-cache-key";
import { resolveSegmentMarkdown } from "@/lib/tts-resolve";
import { INTRO_SLUG, ttsPlainText } from "@/lib/tts-text";

export const runtime = "nodejs"; // fs access (skript-content)

const SLUG_RE = /^[a-z0-9-]+$/;
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }
  const { kapitel, slug } = (body ?? {}) as { kapitel?: unknown; slug?: unknown };
  if (
    typeof kapitel !== "string" ||
    typeof slug !== "string" ||
    !SLUG_RE.test(kapitel) ||
    (slug !== INTRO_SLUG && !SLUG_RE.test(slug))
  ) {
    return NextResponse.json({ error: "Ungültige Referenz" }, { status: 404 });
  }

  const markdown = resolveSegmentMarkdown(kapitel, slug);
  if (!markdown) {
    return NextResponse.json({ error: "Unbekanntes Segment" }, { status: 404 });
  }
  const text = ttsPlainText(markdown);
  if (!text) {
    return NextResponse.json({ error: "Leeres Segment" }, { status: 404 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "TTS nicht konfiguriert (Blob-Token fehlt)" },
      { status: 503 },
    );
  }

  const key = blobKey(kapitel, slug, contentHash(text));

  // Cache hit → blob URL, no ElevenLabs call.
  try {
    const existing = await head(key);
    return NextResponse.json({ url: existing.url });
  } catch (e) {
    if (!(e instanceof BlobNotFoundError)) throw e;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return NextResponse.json(
      { error: "TTS nicht konfiguriert (ElevenLabs-Env fehlt)" },
      { status: 503 },
    );
  }
  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: modelId }),
    },
  );
  if (!res.ok) {
    console.error(`[tts] ElevenLabs ${res.status}: ${await res.text()}`);
    return NextResponse.json({ error: "TTS-Generierung fehlgeschlagen" }, { status: 502 });
  }

  const audio = Buffer.from(await res.arrayBuffer());
  const blob = await put(key, audio, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true, // deterministic key — concurrent misses may race
    contentType: "audio/mpeg",
  });
  return NextResponse.json({ url: blob.url });
}
