import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Arch } from "@/components/ui/arch";
import { ScriptureEyebrow } from "@/components/ui/scripture-eyebrow";

describe("ScriptureEyebrow", () => {
  it("renders the reference and label", () => {
    render(<ScriptureEyebrow reference="Genesis 17:7" label="Covenant" />);
    expect(screen.getByText(/Genesis 17:7/i)).toBeInTheDocument();
    expect(screen.getByText(/Covenant/i)).toBeInTheDocument();
  });

  it("uses an uppercase mono element", () => {
    render(
      <ScriptureEyebrow
        reference="John 3:16"
        label="Love"
        data-testid="eyebrow"
      />,
    );
    const el = screen.getByTestId("eyebrow");
    expect(el.className).toMatch(/uppercase/);
    expect(el.className).toMatch(/mono/);
  });
});

describe("Arch", () => {
  it("renders the child and has the gold keyline class", () => {
    render(
      <Arch data-testid="arch">
        <span>Sanctuary content</span>
      </Arch>,
    );
    const arch = screen.getByTestId("arch");
    expect(screen.getByText("Sanctuary content")).toBeInTheDocument();
    expect(arch.className).toMatch(/gold/);
  });
});
