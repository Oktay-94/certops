import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("test toolchain smoke", () => {
  it("renders React into jsdom and matches with jest-dom", () => {
    render(<p>hello certops</p>);
    expect(screen.getByText("hello certops")).toBeInTheDocument();
  });
});
