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
export function DiagramPanel({ src, title }: { src: string; title: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLButtonElement>(null);
  const floatRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openWith = useCallback((trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    setOpen(true);
  }, []);

  useEffect(() => {
    // Measure the scrollbar once and publish it for .diagram-bleed, which sizes
    // itself as 100vw minus this value. One number, one source, used by both the
    // panel width and the lock.
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty("--sbw", `${sbw}px`);
  }, []);

  useEffect(() => {
    if (!open) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    overlayRef.current?.focus({ preventScroll: true });

    // Any key closes — except the bare modifiers. Without this the overlay would
    // vanish the moment someone presses Cmd for a screenshot, which is exactly
    // when they want it open.
    const MODIFIERS = new Set(["Shift", "Control", "Alt", "Meta"]);
    const onKeyDown = (e: KeyboardEvent) => {
      if (MODIFIERS.has(e.key)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
      <div className="diagram-bleed mt-8">
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

      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — Diagramm, Vollbild`}
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4 outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Architekturdiagramm: ${title}`}
            className="h-full w-full object-contain"
          />
        </div>
      )}
    </>
  );
}
