import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

describe("Button", () => {
  it("renders gold variant with text and a gold class", () => {
    render(<Button variant="gold">Give</Button>);
    const btn = screen.getByRole("button", { name: "Give" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/gold/);
  });

  it("renders an anchor when href is provided", () => {
    render(
      <Button href="/give" variant="gold">
        Give
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Give" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/give");
  });

  it("forwards native button props", () => {
    render(
      <Button type="submit" disabled>
        Submit
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Submit" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("type", "submit");
  });
});

describe("Badge", () => {
  it("renders children with a tone", () => {
    render(<Badge tone="gold">New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});
