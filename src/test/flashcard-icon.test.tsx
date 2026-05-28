import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FlashcardIcon } from "@/components/flashcards/FlashcardIcon";

describe("FlashcardIcon", () => {
  it("renders one service icon for a single known slug", () => {
    const { container } = render(
      <FlashcardIcon iconSlugs={["s3"]} domain="Cloud Concepts" />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute("src")).toContain("/icons/aws/s3.svg");
    expect(container.querySelector('[data-icon="fallback"]')).toBeNull();
  });

  it("renders two service icons for two known slugs", () => {
    const { container } = render(
      <FlashcardIcon iconSlugs={["s3", "ec2"]} domain="Cloud Concepts" />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("src")).toContain("/icons/aws/s3.svg");
    expect(imgs[1].getAttribute("src")).toContain("/icons/aws/ec2.svg");
  });

  it("renders only first two when more than 2 slugs given", () => {
    const { container } = render(
      <FlashcardIcon
        iconSlugs={["s3", "ec2", "lambda"]}
        domain="Cloud Concepts"
      />,
    );
    expect(container.querySelectorAll("img").length).toBe(2);
  });

  it("falls back to domain icon when iconSlugs is null", () => {
    const { container } = render(
      <FlashcardIcon iconSlugs={null} domain="Cloud Concepts" />,
    );
    expect(container.querySelectorAll("img").length).toBe(0);
    const fb = container.querySelector('[data-icon="fallback"]');
    expect(fb).not.toBeNull();
    expect(fb?.getAttribute("data-fallback-name")).toBe("Cloud");
  });

  it("falls back to domain icon when slug is unknown", () => {
    const { container } = render(
      <FlashcardIcon
        iconSlugs={["does-not-exist"]}
        domain="Cloud Concepts"
      />,
    );
    expect(container.querySelectorAll("img").length).toBe(0);
    expect(
      container.querySelector('[data-icon="fallback"]'),
    ).not.toBeNull();
  });

  it("uses correct fallback icon per domain", () => {
    const cases: Array<[string, string]> = [
      ["Cloud Concepts", "Cloud"],
      ["Security and Compliance", "Shield"],
      ["Cloud Technology and Services", "Server"],
      ["Billing, Pricing, and Support", "DollarSign"],
    ];
    for (const [domain, expected] of cases) {
      const { container } = render(
        <FlashcardIcon iconSlugs={null} domain={domain} />,
      );
      const fb = container.querySelector('[data-icon="fallback"]');
      expect(fb?.getAttribute("data-fallback-name")).toBe(expected);
    }
  });
});
