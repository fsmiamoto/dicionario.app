import { extractHTMLFromReactMarkdown } from "../../renderer/utils/html";

describe("HTML Utilities", () => {
  describe("extractHTMLFromReactMarkdown", () => {
    it("converts markdown headers to HTML", () => {
      const markdown = "# Heading\n\nSome text";
      const html = extractHTMLFromReactMarkdown(markdown);
      expect(html).toContain("<h1>Heading</h1>");
      expect(html).toContain("<p>Some text</p>");
    });

    it("converts markdown bold and italic to HTML", () => {
      const markdown = "**bold** and *italic* text";
      const html = extractHTMLFromReactMarkdown(markdown);
      expect(html).toContain("<strong>bold</strong>");
      expect(html).toContain("<em>italic</em>");
    });

    it("converts markdown lists to HTML", () => {
      const markdown = "- Item 1\n- Item 2";
      const html = extractHTMLFromReactMarkdown(markdown);
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Item 2</li>");
    });

    it("handles empty string", () => {
      const markdown = "";
      const html = extractHTMLFromReactMarkdown(markdown);
      expect(html).toBe("");
    });

    it("handles plain text without markdown", () => {
      const markdown = "Just plain text";
      const html = extractHTMLFromReactMarkdown(markdown);
      expect(html).toContain("<p>Just plain text</p>");
    });

    it("converts code blocks correctly", () => {
      const markdown = "`code` and some text";
      const html = extractHTMLFromReactMarkdown(markdown);
      expect(html).toContain("<code>code</code>");
      expect(html).toContain("some text");
    });
  });
});
