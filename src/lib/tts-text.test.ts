import { describe, expect, it } from "vitest";
import { ttsPlainText } from "./tts-text";

describe("ttsPlainText", () => {
  it("strips emphasis markers but keeps their content", () => {
    expect(ttsPlainText("Das ist **wichtig** und *kursiv* und `code`.")).toBe(
      "Das ist wichtig und kursiv und code.",
    );
  });

  it("strips emojis incl. variation selectors (⚠️ 💡 🧠 🐄)", () => {
    expect(ttsPlainText("**⚠️ Prüfungs-Knackpunkte**")).toBe(
      "Prüfungs-Knackpunkte.",
    );
    expect(ttsPlainText("> 💡 Merke: 🐄 EC2 ist der Zoo.")).toBe(
      "Merke: EC2 ist der Zoo.",
    );
  });

  it("cuts the 🛑 annotation tail off headings", () => {
    expect(
      ttsPlainText("## Amazon Forecast 🛑 *(abgekündigt für Neukunden — 2024)*"),
    ).toBe("Amazon Forecast.");
  });

  it("turns links into their text", () => {
    expect(ttsPlainText("Siehe [die Doku](https://example.com) dazu.")).toBe(
      "Siehe die Doku dazu.",
    );
  });

  it("drops blockquote markers, keeps the content", () => {
    expect(ttsPlainText("> Ein Merksatz\n> über zwei Zeilen.")).toBe(
      "Ein Merksatz über zwei Zeilen.",
    );
  });

  it("replaces a table with exactly one pointer sentence", () => {
    const md = [
      "Davor.",
      "",
      "| A | B |",
      "|---|---|",
      "| 1 | 2 |",
      "| 3 | 4 |",
      "",
      "Danach.",
    ].join("\n");
    const out = ttsPlainText(md);
    expect(out).toBe("Davor. Details siehe Tabelle im Skript. Danach.");
    expect(out.match(/Details siehe Tabelle im Skript\./g)).toHaveLength(1);
  });

  it("makes list items into sentences", () => {
    expect(ttsPlainText("- Erster Punkt\n- Zweiter Punkt.")).toBe(
      "Erster Punkt. Zweiter Punkt.",
    );
  });

  it("speaks arrows and separators instead of skipping them", () => {
    expect(ttsPlainText("Backup unlöschbar → **Vault Lock**")).toBe(
      "Backup unlöschbar, also Vault Lock.",
    );
  });

  it("drops horizontal rules and collapses whitespace", () => {
    expect(ttsPlainText("Eins.\n\n---\n\nZwei.")).toBe("Eins. Zwei.");
  });

  it("returns empty string for effectively empty markdown", () => {
    expect(ttsPlainText("---\n\n   \n")).toBe("");
  });
});
