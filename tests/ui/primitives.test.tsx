import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";

describe("Container", () => {
  it("renders children", () => {
    render(<Container>content</Container>);
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});

describe("Section", () => {
  it("renders children and applies navy tone", () => {
    render(
      <Section tone="navy" data-testid="sec">
        hello
      </Section>,
    );
    const sec = screen.getByTestId("sec");
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(sec.className).toMatch(/navy/);
  });

  it("applies cream tone", () => {
    render(
      <Section tone="cream" data-testid="sec">
        hi
      </Section>,
    );
    expect(screen.getByTestId("sec").className).toMatch(/cream/);
  });
});

describe("Card", () => {
  it("renders children", () => {
    render(<Card>card body</Card>);
    expect(screen.getByText("card body")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("forwards name and aria-invalid", () => {
    render(<Input name="email" aria-invalid="true" placeholder="Email" />);
    const input = screen.getByPlaceholderText("Email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("renders Textarea and Label", () => {
    render(
      <>
        <Label htmlFor="msg">Message</Label>
        <Textarea id="msg" name="msg" />
      </>,
    );
    expect(screen.getByText("Message")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });
});
