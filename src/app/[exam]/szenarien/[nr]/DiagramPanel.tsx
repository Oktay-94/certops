"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Diagram panel plus its fullscreen view. Both triggers (the panel itself and
// the floating button) open the SAME view, so they share one state and live in
// one component.
//
// Scroll lock: `overflow: hidden` on <body> only. No paddingRight compensation —
// `scrollbar-gutter: stable` on <html> (globals.css) keeps the gutter reserved
// at all times, so hiding the overflow does not change the layout width. That
// matters here more than usual: the panel is full-bleed, and a width change
// under it would be a visible jump on every open and close. Deliberately NOT
// `position: fixed`, which would move the page.
const WIDTH_KEY = "certops:diagram-width";
const MIN_WIDTH = 700;
const MAX_WIDTH = 1400;
/**
 * The one viewport threshold in this component. It governs three things, and
 * they are the same question asked once: is there room to show this diagram
 * whole?
 *   - the width handle (below this the viewport clamp wins anyway)
 *   - the fullscreen zoom mode (fit above, "lesbar" below)
 *   - how fullscreen closes (see the overlay)
 * A second breakpoint would have to be kept in sync with this one for no gain.
 */
const DRAG_MIN_VIEWPORT = 900;
/**
 * Render width of the diagram in "lesbar" mode. The SVGs are drawn on a 1600px
 * canvas; at the ~358px a phone offers, the scale is 0.22 and labels land at
 * 3–4px. 1100px is where they become readable — the phone then scrolls in both
 * axes instead of shrinking. max() so a wide window still fills rather than
 * showing a 1100px column.
 */
const READ_WIDTH = "max(1100px, 100vw)";

const clampWidth = (px: number) =>
  Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, px)));

export function DiagramPanel({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  // null = follow the viewport. Only an explicit toggle pins a mode, and
  // opening the view clears the pin — so zoom is derived, never synchronised
  // in an effect.
  const [zoomPin, setZoomPin] = useState<"fit" | "read" | null>(null);
  const panelRef = useRef<HTMLButtonElement>(null);
  const floatRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const bleedRef = useRef<HTMLDivElement>(null);

  const openWith = useCallback((trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    setZoomPin(null);
    setOpen(true);
  }, []);

  // Wide opens on the whole picture, narrow opens already readable — on a
  // phone "fit" is the state the user is trying to escape, so starting there
  // would cost a tap for nothing.
  const zoom = zoomPin ?? (isWide ? "fit" : "read");
  const toggleZoom = useCallback(
    () => setZoomPin(zoom === "read" ? "fit" : "read"),
    [zoom],
  );

  useEffect(() => {
    // Measure the scrollbar once and publish it for .diagram-bleed, which sizes
    // itself as 100vw minus this value. One number, one source, used by both the
    // panel width and the lock.
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--sbw", `${sbw}px`);
  }, []);

  // Stored width applies AFTER mount, never during render. The server emits no
  // width at all, so server and client markup are identical and there is
  // nothing for React to diff — this is what keeps the hydration warning away.
  // The property lives on <html>, so the value survives client-side navigation
  // between scenario pages without re-reading storage.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(WIDTH_KEY);
    } catch {
      // Private mode or storage disabled — the default width is fine.
    }
    const px = Number(stored);
    if (Number.isFinite(px) && px > 0) {
      document.documentElement.style.setProperty(
        "--diagram-w",
        `${clampWidth(px)}px`,
      );
    }
  }, []);

  // Kept as state rather than read on demand so a rotation mid-view moves the
  // overlay to the other behaviour on its own.
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DRAG_MIN_VIEWPORT}px)`);
    const sync = () => setIsWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Width follows the pointer's distance from the panel's centre, doubled: the
  // element is centred via translateX(-50%), so growth is symmetric and the
  // right edge lands exactly under the cursor.
  //
  // Sets ONLY --diagram-w. Assigning style.width here would beat the min() in
  // globals.css and take the viewport clamp with it.
  const onHandleDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const bleed = bleedRef.current;
    if (!bleed) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);

    const rect = bleed.getBoundingClientRect();
    const centreX = rect.left + rect.width / 2;

    const onMove = (ev: PointerEvent) => {
      const next = clampWidth((ev.clientX - centreX) * 2);
      document.documentElement.style.setProperty("--diagram-w", `${next}px`);
    };
    const onUp = (ev: PointerEvent) => {
      handle.releasePointerCapture(ev.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      const current = document.documentElement.style.getPropertyValue("--diagram-w");
      try {
        window.localStorage.setItem(WIDTH_KEY, String(parseInt(current, 10)));
      } catch {
        // Not persisting is survivable; the session keeps the width.
      }
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }, []);

  // In "lesbar" the diagram is wider than the screen, and the interesting part
  // of an architecture diagram is the middle, not the left edge.
  const centreScroll = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
  }, []);

  useEffect(() => {
    if (!open || zoom !== "read") return;
    // After layout: the <img> is cached from the panel, but the scroll extent
    // only exists once this frame is laid out.
    const id = requestAnimationFrame(centreScroll);
    return () => cancelAnimationFrame(id);
  }, [open, zoom, centreScroll]);

  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    overlayRef.current?.focus({ preventScroll: true });

    // Wide: any key closes — except the bare modifiers, without which the
    // overlay would vanish the moment someone presses Cmd for a screenshot,
    // which is exactly when they want it open.
    //
    // Narrow: Escape only. The overlay is pannable there, and a stray key
    // dismissing a view the user is actively working inside is the same
    // annoyance the modifier exception exists to prevent — just via a
    // different route.
    const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta"]);
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isWide) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      if (MODIFIERS.has(e.key)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isWide]);

  useEffect(() => {
    if (open) return;
    // Focus returns to whatever opened the view. The floating button stays
    // mounted while the overlay is up (hidden via visibility/opacity, not
    // unmounted) precisely so it is still a valid target here; the fallback
    // covers the case where the remembered node left the document anyway.
    const target =
      triggerRef.current && document.contains(triggerRef.current)
        ? triggerRef.current
        : panelRef.current;
    // preventScroll is the whole point: a bare focus() scrolls the target into
    // view, which moves the reading position on close — measured 1200 → 568.
    target?.focus({ preventScroll: true });
    triggerRef.current = null;
  }, [open]);

  return (
    <>
      <div ref={bleedRef} className="diagram-bleed relative mt-8">
        <button
          ref={panelRef}
          type="button"
          onClick={(e) => openWith(e.currentTarget)}
          aria-label={`${title} — Diagramm im Vollbild öffnen`}
          className="block w-full cursor-zoom-in rounded-2xl border border-line bg-white p-4 transition hover:border-[color:var(--accent)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Architekturdiagramm: ${title}`}
            className="h-auto w-full"
          />
        </button>

        {/* Width handle. aria-hidden and not a tab stop on purpose: resizing
            carries no information that is otherwise unavailable — the panel
            reads fine at any width and fullscreen is the route to a big view. */}
        {isWide && (
          <div
            aria-hidden
            onPointerDown={onHandleDown}
            className="absolute right-0 top-1/2 flex h-16 w-4 -translate-y-1/2 translate-x-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border border-line bg-surface opacity-40 transition hover:opacity-100"
          >
            <span className="h-6 w-[2px] rounded-full bg-ink-faint" />
          </div>
        )}
      </div>

      {/* Floating trigger — same view, same close behaviour. Hidden rather than
          unmounted while the overlay is open (see focus-return above). */}
      <button
        ref={floatRef}
        type="button"
        onClick={(e) => openWith(e.currentTarget)}
        aria-label="Diagramm im Vollbild öffnen"
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        className={`fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-lg shadow-lg transition hover:border-[color:var(--accent)] sm:bottom-7 sm:right-7 ${
          open ? "invisible opacity-0" : "visible opacity-100"
        }`}
      >
        <span aria-hidden>⤢</span>
      </button>

      {/* Fullscreen. Two behaviours, one threshold (DRAG_MIN_VIEWPORT):
          - wide: unchanged — fit the whole picture, any click and any
            non-modifier key closes. Nothing pans there, so nothing conflicts.
          - narrow: a scroll container with the diagram at READ_WIDTH. Panning
            is the browser's own scrolling, which is why there is no gesture
            code here at all: momentum, rubber-banding and scrollbars come
            free and in platform quality. Closing moves to ✕, backdrop and
            Escape, because a tap on the picture now means "zoom", not "go
            away". */}
      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — Diagramm, Vollbild`}
          tabIndex={-1}
          onClick={(e) => {
            if (isWide || e.target === e.currentTarget) setOpen(false);
          }}
          className={`fixed inset-0 z-50 overflow-auto bg-black/85 outline-none ${
            isWide ? "cursor-zoom-out" : ""
          }`}
        >
          {/* min-w-full + w-fit is what keeps an oversized diagram reachable:
              a plain centred flex child gets clipped at the top and left once
              it outgrows the container, and the clipped part cannot be
              scrolled to. Sized to the content instead, centring only kicks in
              while the image still fits. */}
          <div className="flex h-fit min-h-full w-fit min-w-full items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Architekturdiagramm: ${title}`}
              onLoad={zoom === "read" ? centreScroll : undefined}
              onClick={
                isWide
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      toggleZoom();
                    }
              }
              style={zoom === "read" ? { width: READ_WIDTH } : undefined}
              className={
                zoom === "read"
                  ? "h-auto max-w-none"
                  : // Viewport units, not percentages: the wrapper is sized to
                    // its content (w-fit), so a percentage width here would be
                    // circular. Clamping the 1600px intrinsic size against the
                    // viewport is the same result the old object-contain gave.
                    "max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] object-contain"
              }
            />
          </div>

          {/* Narrow only. On wide these would need to stop propagation to work
              at all, which would mean carving exceptions into the "any click
              closes" rule the wide view is supposed to keep. */}
          {!isWide && (
            <div className="fixed right-4 top-4 z-10 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                      e.stopPropagation();
                      toggleZoom();
                    }}
                aria-label={
                  zoom === "read"
                    ? "Ganzes Diagramm anzeigen"
                    : "Diagramm vergrößern"
                }
                className="flex h-10 items-center rounded-full border border-line bg-surface px-3.5 text-[13px] font-medium text-ink shadow-lg"
              >
                {zoom === "read" ? "Ganz" : "Größer"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                aria-label="Vollbild schließen"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-lg text-ink shadow-lg"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
