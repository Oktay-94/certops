import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

function clearThemeState(): void {
  delete document.documentElement.dataset.theme;
  document.cookie = "certops_theme=; path=/; max-age=0";
}

describe("ThemeToggle (pill switch)", () => {
  beforeEach(clearThemeState);
  afterEach(() => {
    cleanup();
    clearThemeState();
  });

  it("toggles to dark: sets data-theme, cookie and aria-checked", () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("certops_theme=dark");
  });

  it("toggles back to light: removes data-theme, cookie says light", async () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("switch")); // → dark

    // MutationObserver notifies as a microtask — wait for the re-render
    // before the second click, otherwise it still targets the dark toggle.
    const backToggle = await screen.findByRole("switch", {
      name: /light mode aktivieren/i,
    });
    expect(backToggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(backToggle); // → light

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).toContain("certops_theme=light");
  });

  it("picks up a pre-set dark attribute after mount (no-flash script ran)", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);

    expect(
      screen.getByRole("switch", { name: /light mode aktivieren/i }),
    ).toBeInTheDocument();
  });
});
