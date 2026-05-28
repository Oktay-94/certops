import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FlashcardIcon } from "@/components/flashcards/FlashcardIcon";

describe("FlashcardIcon (default hero variant)", () => {
  it("renders one 56x56 service icon for a single known slug", () => {
    const { container } = render(
      <FlashcardIcon iconSlugs={["s3"]} domain="Cloud Concepts" />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute("src")).toContain("/icons/aws/s3.svg");
    expect(imgs[0].getAttribute("width")).toBe("56");
    expect(container.querySelector('[data-icon="fallback"]')).toBeNull();
  });

  it("renders two 44x44 service icons for two known slugs", () => {
    const { container } = render(
      <FlashcardIcon iconSlugs={["s3", "ec2"]} domain="Cloud Concepts" />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("width")).toBe("44");
    expect(imgs[1].getAttribute("width")).toBe("44");
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

  it("falls back to 56x56 domain square when iconSlugs is null", () => {
    const { container } = render(
      <FlashcardIcon iconSlugs={null} domain="Cloud Concepts" />,
    );
    expect(container.querySelectorAll("img").length).toBe(0);
    const fb = container.querySelector(
      '[data-icon="fallback"]',
    ) as HTMLElement | null;
    expect(fb).not.toBeNull();
    expect(fb?.getAttribute("data-fallback-name")).toBe("Cloud");
    expect(fb?.style.width).toBe("56px");
    expect(fb?.style.height).toBe("56px");
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

describe("FlashcardIcon (compact variant)", () => {
  it("renders one 32x32 service icon for a single known slug", () => {
    const { container } = render(
      <FlashcardIcon
        iconSlugs={["s3"]}
        domain="Cloud Concepts"
        variant="compact"
      />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute("width")).toBe("32");
  });

  it("renders two 28x28 service icons for two known slugs", () => {
    const { container } = render(
      <FlashcardIcon
        iconSlugs={["s3", "ec2"]}
        domain="Cloud Concepts"
        variant="compact"
      />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("width")).toBe("28");
    expect(imgs[1].getAttribute("width")).toBe("28");
  });

  it("falls back to 32x32 domain square when iconSlugs is null", () => {
    const { container } = render(
      <FlashcardIcon
        iconSlugs={null}
        domain="Cloud Concepts"
        variant="compact"
      />,
    );
    const fb = container.querySelector(
      '[data-icon="fallback"]',
    ) as HTMLElement | null;
    expect(fb).not.toBeNull();
    expect(fb?.style.width).toBe("32px");
    expect(fb?.style.height).toBe("32px");
  });
});
