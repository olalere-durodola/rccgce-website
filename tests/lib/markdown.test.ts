import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders headings, paragraphs, bold and italic", () => {
    const out = renderMarkdown(
      "## Title\n\nHello **world** and *friends*.",
    );
    expect(out).toContain("<h2>Title</h2>");
    expect(out).toContain("<strong>world</strong>");
    expect(out).toContain("<em>friends</em>");
    expect(out).toContain("<p>");
  });

  it("renders unordered and ordered lists", () => {
    const ul = renderMarkdown("- one\n- two");
    expect(ul).toContain("<ul>");
    expect(ul).toContain("<li>one</li>");
    expect(ul).toContain("<li>two</li>");

    const ol = renderMarkdown("1. first\n2. second");
    expect(ol).toContain("<ol>");
    expect(ol).toContain("<li>first</li>");
  });

  it("renders safe http links with rel attributes", () => {
    const out = renderMarkdown("See [our site](https://example.com).");
    expect(out).toContain('<a href="https://example.com"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("escapes raw HTML so it cannot inject markup (XSS-safe)", () => {
    const out = renderMarkdown('<script>alert(1)</script>');
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("neutralizes an img onerror payload (renders as inert escaped text)", () => {
    const out = renderMarkdown('<img src=x onerror=alert(1)>');
    // No live <img> tag — the angle brackets are escaped, so the attribute
    // can never execute even though the text "onerror" survives harmlessly.
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });

  it("does not produce an anchor for javascript: links", () => {
    const out = renderMarkdown("[click](javascript:alert(1))");
    // The unsafe scheme is rejected, so no anchor is created; the text is left
    // literal (and thus inert — it is not inside an href).
    expect(out).not.toContain("<a ");
    expect(out).not.toContain("href=");
  });

  it("does not let escaped quotes break out of the href attribute", () => {
    const out = renderMarkdown('[x](https://e.com"onmouseover="alert(1))');
    // The whole bracket expression should remain literal text (unsafe url),
    // and there must be no raw double-quote breaking the attribute.
    expect(out).not.toContain('"onmouseover="');
  });
});
