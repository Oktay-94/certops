import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

function clearThemeState(): void {
  delete document.documentElement.dataset.theme;
  document.cookie = "certops_theme=; path=/; max-age=0";
}

describe("ThemeToggle", () => {
  beforeEach(clearThemeState);
  afterEach(() => {
    cleanup();
    clearThemeState();
  });

  it("toggles to dark: sets data-theme and persists the cookie", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("certops_theme=dark");
  });

  it("toggles back to light: removes data-theme, cookie says light", async () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button")); // → dark

    // MutationObserver notifies as a microtask — wait for the re-render
    // before the second click, otherwise it still targets the dark toggle.
    const backButton = await screen.findByRole("button", {
      name: /light mode aktivieren/i,
    });
    fireEvent.click(backButton); // → light

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).toContain("certops_theme=light");
  });

  it("picks up a pre-set dark attribute after mount (no-flash script ran)", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);

    // Button now offers switching to light.
    expect(
      screen.getByRole("button", { name: /light mode aktivieren/i }),
    ).toBeInTheDocument();
  });
});
