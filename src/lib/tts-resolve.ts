// Segment resolution for the TTS route — the 404 logic, kept out of the route
// handler so it is testable as a plain function. Only committed skript content
// is reachable: chapter via the manifest, section via the slugs that
// parseHeadings/slugifyHeading already produce (single slug source — never a
// second slugger). Server-only (fs via skript-content).
import { chapterBySlug } from "./skript";
import { readChapterMarkdown, splitChapter } from "./skript-content";
import { INTRO_SLUG } from "./tts-text";

/**
 * Markdown of one speakable segment, or null when the kapitel/slug pair does
 * not reference committed content (→ the route answers 404).
 */
export function resolveSegmentMarkdown(
  kapitelSlug: string,
  slug: string,
): string | null {
  const chapter = chapterBySlug(kapitelSlug);
  if (!chapter) return null;
  const { intro, sections } = splitChapter(readChapterMarkdown(chapter));
  if (slug === INTRO_SLUG) return intro || null;
  return sections.find((s) => s.slug === slug)?.markdown ?? null;
}
