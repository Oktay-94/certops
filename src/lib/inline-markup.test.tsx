import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderInline } from "./inline-markup";

function html(text: string): string {
  const { container } = render(<div data-testid="out">{renderInline(text)}</div>);
  const out = container.querySelector('[data-testid="out"]')!.innerHTML;
  document.body.innerHTML = "";
  return out;
}

describe("renderInline", () => {
  it("plain CLF content passes through unchanged", () => {
    expect(html("Was ist Amazon EC2? 100% plain * text")).toBe(
      "Was ist Amazon EC2? 100% plain * text",
    );
  });

  it("renders **bold** as <strong>", () => {
    expect(html("so **schnell wie möglich** starten")).toBe(
      "so <strong>schnell wie möglich</strong> starten",
    );
  });

  it("renders `code` as <code>", () => {
    expect(html("erlaubt `s3:*` auf dem Bucket")).toBe(
      "erlaubt <code>s3:*</code> auf dem Bucket",
    );
  });

  it("nested: code inside bold works", () => {
    expect(html("**nutze `aws s3 sync` dafür**")).toBe(
      "<strong>nutze <code>aws s3 sync</code> dafür</strong>",
    );
  });

  it("bold markers inside code stay literal", () => {
    expect(html("`a ** b`")).toBe("<code>a ** b</code>");
  });

  it("unbalanced markers stay literal", () => {
    expect(html("2 ** 8 = 256")).toBe("2 ** 8 = 256");
    expect(html("ein ` allein")).toBe("ein ` allein");
    expect(html("**offen ohne Ende")).toBe("**offen ohne Ende");
  });

  it("empty markers stay literal", () => {
    expect(html("**** und ``")).toBe("**** und ``");
  });

  it("multiple spans in order", () => {
    expect(html("**a** und `b` und **c**")).toBe(
      "<strong>a</strong> und <code>b</code> und <strong>c</strong>",
    );
  });

  it("XSS: HTML in content stays text", () => {
    render(<div data-testid="xss">{renderInline("**<script>alert(1)</script>**")}</div>);
    const strong = screen.getByTestId("xss").querySelector("strong")!;
    expect(strong.textContent).toBe("<script>alert(1)</script>");
    expect(strong.querySelector("script")).toBeNull();
    document.body.innerHTML = "";
  });

  it("code starting first wins over a later bold opener", () => {
    expect(html("`x **y` z**")).toBe("<code>x **y</code> z**");
  });
});
