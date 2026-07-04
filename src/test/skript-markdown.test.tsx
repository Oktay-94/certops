import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { SkriptMarkdown } from "@/components/skript/SkriptMarkdown";

describe("SkriptMarkdown h2 rendering", () => {
  it("puts the metaphor emoji before a service heading, id unchanged", () => {
    const { container } = render(
      <SkriptMarkdown markdown={"## Amazon Athena\n\nText"} />,
    );
    const h2 = container.querySelector("h2")!;
    expect(h2.id).toBe("amazon-athena");
    expect(h2.textContent).toContain("🔍");
    expect(h2.textContent).toContain("Amazon Athena");
  });

  it("renders no emoji for a collective heading, id still correct", () => {
    const { container } = render(
      <SkriptMarkdown
        markdown={
          "## Container-Grundlagen: Docker, Kubernetes, ECS, EKS & Fargate\n\nText"
        }
      />,
    );
    const h2 = container.querySelector("h2")!;
    expect(h2.id).toBe(
      "container-grundlagen-docker-kubernetes-ecs-eks-fargate",
    );
    // No metaphor emoji, and no stray "undefined"/"null" leaked into the DOM.
    expect(h2.textContent).not.toMatch(/🐄|undefined|null/);
    expect(h2.textContent).toContain("Container-Grundlagen");
  });

  it("splits a 🛑 annotation into a deprecation flag, slug ends at 🛑", () => {
    const { container } = render(
      <SkriptMarkdown
        markdown={
          "## Amazon Forecast 🛑 *(abgekündigt für Neukunden — 30.07.2024)*\n\nText"
        }
      />,
    );
    const h2 = container.querySelector("h2")!;
    expect(h2.id).toBe("amazon-forecast");
    expect(h2.textContent).toContain("🔮"); // metaphor emoji resolved on title
    expect(h2.textContent).toContain("abgekündigt für Neukunden");
    expect(h2.textContent).not.toContain("30.07.2024"); // date trimmed off flag
  });
});

describe("SkriptMarkdown blockquote variants", () => {
  it("styles a 🧠 Mini-Merkkasten as the orange Merksatz variant", () => {
    const { container } = render(
      <SkriptMarkdown markdown={"> **🧠 Mini-Merkkasten:** A ↔ B"} />,
    );
    const bq = container.querySelector("blockquote")!;
    expect(bq.className).toContain("#fff8f2"); // orange background token
  });

  it("styles a plain metaphor blockquote with the accent variant", () => {
    const { container } = render(
      <SkriptMarkdown markdown={"> Die Detektivin am Tatort S3."} />,
    );
    const bq = container.querySelector("blockquote")!;
    expect(bq.className).toContain("var(--accent"); // accent border/bg
    expect(bq.className).not.toContain("#fff8f2");
  });
});
