"use client";

// TTS player island for the skript reading pages. ONE provider per chapter
// page holds a single <audio> element (only one segment plays at a time) and
// hands play/pause down via context; the server-rendered chapter content flows
// through as `children`, so the page stays fully static.
//
// Chapter mode plays the playlist strictly onended-sequentially: the NEXT
// segment is requested only after the current one finished — deliberately no
// prefetch (a prefetch on cache miss would burn ElevenLabs credits for
// segments that are never heard).
//
// Structure note: the <audio> element is created and wired ONCE in an effect
// (ref mutation belongs in effects/handlers per the React compiler rules); its
// onended delegates to an effect-updated ref, which also breaks the
// play-next-segment self-recursion.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, Loader2, Pause, Play, Volume2 } from "lucide-react";

type Status = "idle" | "loading" | "playing" | "paused" | "error";

type TtsContextValue = {
  activeSlug: string | null;
  status: Status;
  toggle: (slug: string) => void;
  toggleChapter: () => void;
  chapterMode: boolean;
};

const TtsContext = createContext<TtsContextValue | null>(null);

function useTts(): TtsContextValue {
  const ctx = useContext(TtsContext);
  if (!ctx) throw new Error("TtsPlayer components need <TtsProvider>");
  return ctx;
}

async function fetchSegmentUrl(kapitel: string, slug: string): Promise<string> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kapitel, slug }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  const data = (await res.json()) as { url: string };
  return data.url;
}

export function TtsProvider({
  kapitel,
  playlist,
  children,
}: {
  kapitel: string;
  /** Segment slugs in reading order (incl. "__intro__" when present). */
  playlist: string[];
  children: ReactNode;
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [chapterMode, setChapterMode] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCache = useRef(new Map<string, string>());
  const requestSeq = useRef(0); // invalidates in-flight fetches on user action
  const onEndedRef = useRef<() => void>(() => {});

  // Create the singleton <audio> once; all element mutation lives here.
  useEffect(() => {
    const audio = new Audio();
    audio.onended = () => onEndedRef.current();
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.onended = null;
      audioRef.current = null;
    };
  }, []);

  const playSlug = useCallback(
    async (slug: string, asChapter: boolean) => {
      const seq = ++requestSeq.current;
      setActiveSlug(slug);
      setChapterMode(asChapter);
      setStatus("loading");
      try {
        let url = urlCache.current.get(slug);
        if (!url) {
          url = await fetchSegmentUrl(kapitel, slug);
          urlCache.current.set(slug, url);
        }
        const audio = audioRef.current;
        if (seq !== requestSeq.current || !audio) return; // superseded
        audio.src = url;
        await audio.play();
        if (seq !== requestSeq.current) return;
        setStatus("playing");
      } catch {
        if (seq !== requestSeq.current) return;
        setStatus("error");
      }
    },
    [kapitel],
  );

  // Keep the onended behaviour current without re-wiring the element and
  // without playSlug referencing itself.
  useEffect(() => {
    onEndedRef.current = () => {
      if (chapterMode && activeSlug) {
        const idx = playlist.indexOf(activeSlug);
        const next = idx >= 0 ? playlist[idx + 1] : undefined;
        if (next) {
          void playSlug(next, true);
          return;
        }
      }
      requestSeq.current += 1;
      setActiveSlug(null);
      setChapterMode(false);
      setStatus("idle");
    };
  }, [activeSlug, chapterMode, playlist, playSlug]);

  const resumeOrPause = useCallback((): boolean => {
    const audio = audioRef.current;
    if (!audio) return false;
    if (status === "playing") {
      audio.pause();
      setStatus("paused");
      return true;
    }
    if (status === "paused") {
      void audio.play().then(() => setStatus("playing"));
      return true;
    }
    return false;
  }, [status]);

  const toggle = useCallback(
    (slug: string) => {
      if (activeSlug === slug && !chapterMode && resumeOrPause()) return;
      void playSlug(slug, false);
    },
    [activeSlug, chapterMode, playSlug, resumeOrPause],
  );

  const toggleChapter = useCallback(() => {
    if (chapterMode && resumeOrPause()) return;
    if (playlist.length === 0) return;
    void playSlug(playlist[0], true);
  }, [chapterMode, playSlug, playlist, resumeOrPause]);

  return (
    <TtsContext.Provider
      value={{ activeSlug, status, toggle, toggleChapter, chapterMode }}
    >
      {children}
    </TtsContext.Provider>
  );
}

function StatusIcon({ active, status }: { active: boolean; status: Status }) {
  if (!active) return <Play className="h-4 w-4" aria-hidden />;
  if (status === "loading")
    return <Loader2 className="h-4 w-4 animate-spin" aria-hidden />;
  if (status === "playing") return <Pause className="h-4 w-4" aria-hidden />;
  if (status === "error") return <AlertCircle className="h-4 w-4" aria-hidden />;
  return <Play className="h-4 w-4" aria-hidden />;
}

/** Small round play/pause button, top-right of a section card. */
export function TtsSectionButton({ slug }: { slug: string }) {
  const { activeSlug, status, toggle, chapterMode } = useTts();
  const active = activeSlug === slug && !chapterMode;
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-label={
        active && status === "playing" ? "Vorlesen pausieren" : "Abschnitt vorlesen"
      }
      title={status === "error" && active ? "Vorlesen fehlgeschlagen" : undefined}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-[color:var(--accent,#475569)] shadow-sm transition hover:border-[color:var(--accent,#475569)]"
    >
      <StatusIcon active={active} status={status} />
    </button>
  );
}

/** Chapter-level player — plays all segments sequentially. */
export function TtsChapterButton() {
  const { status, toggleChapter, chapterMode } = useTts();
  const active = chapterMode;
  const label =
    active && status === "playing"
      ? "Pausieren"
      : active && status === "loading"
        ? "Lädt …"
        : "Kapitel vorlesen";
  return (
    <button
      type="button"
      onClick={toggleChapter}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-[7px] text-[13.5px] font-medium text-[color:var(--accent,#475569)] shadow-sm transition hover:border-[color:var(--accent,#475569)]"
    >
      {active ? (
        <StatusIcon active status={status} />
      ) : (
        <Volume2 className="h-4 w-4" aria-hidden />
      )}
      {label}
    </button>
  );
}
