import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/site/header";

describe("Header", () => {
  it("renders the primary nav links", () => {
    render(<Header />);
    for (const label of [
      "About",
      "Ministries",
      "Sermons",
      "Events",
      "Visit",
      "Give",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("has a gold Give CTA linking to /give", () => {
    render(<Header />);
    const give = screen.getAllByRole("link", { name: "Give" });
    const cta = give.find((el) => el.className.includes("gold"));
    expect(cta).toBeTruthy();
    expect(cta).toHaveAttribute("href", "/give");
  });

  it("toggles the mobile menu via aria-expanded", () => {
    render(<Header />);
    const toggle = screen.getByRole("button", { name: /menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
