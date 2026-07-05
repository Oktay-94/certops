import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TtsProvider, TtsSectionButton } from "@/components/skript/TtsPlayer";

// jsdom has no media playback: play() is unimplemented and would throw.
const playMock = vi.fn(async () => {});
const pauseMock = vi.fn();
const fetchMock = vi.fn(
  async () =>
    new Response(JSON.stringify({ url: "https://blob.example/seg.mp3" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  window.HTMLMediaElement.prototype.play = playMock;
  window.HTMLMediaElement.prototype.pause = pauseMock;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderInsideClickableCard(onCardClick: () => void) {
  return render(
    <TtsProvider kapitel="cloud-konzepte" playlist={["amazon-athena"]}>
      <div role="button" tabIndex={0} onClick={onCardClick} data-testid="card">
        <TtsSectionButton slug="amazon-athena" />
      </div>
    </TtsProvider>,
  );
}

describe("TtsSectionButton inside a clickable card", () => {
  it("click starts TTS but does not bubble into the card", async () => {
    const onCardClick = vi.fn();
    renderInsideClickableCard(onCardClick);

    fireEvent.click(
      screen.getByRole("button", { name: "Abschnitt vorlesen" }),
    );

    // Guard invariant: the button never flips/activates its parent card.
    expect(onCardClick).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tts",
      expect.objectContaining({ method: "POST" }),
    );
    // Segment resolved and playback started (silence unlock + real play).
    await screen.findByRole("button", { name: "Vorlesen pausieren" });
    expect(playMock).toHaveBeenCalled();
  });

  it("clicking the card itself still reaches the card handler", () => {
    const onCardClick = vi.fn();
    renderInsideClickableCard(onCardClick);

    fireEvent.click(screen.getByTestId("card"));

    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
