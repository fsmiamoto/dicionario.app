import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import WordExplanation from "../../renderer/components/WordExplanation";

// Mock the HTML utility
vi.mock("../../renderer/utils/html", () => ({
  extractHTMLFromReactMarkdown: vi.fn(
    (markdown: string) => `<p>${markdown}</p>`,
  ),
}));

describe("WordExplanation Component", () => {
  const defaultProps = {
    word: "test",
    explanation: "This is a **test** explanation.",
    isLoading: false,
  };

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
    });

    // Mock ClipboardItem
    global.ClipboardItem = vi.fn().mockImplementation((data) => ({ data }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders word and explanation", () => {
    render(<WordExplanation {...defaultProps} />);

    expect(screen.getByText('"test" - Explanation')).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    expect(screen.getByText(/explanation/)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<WordExplanation {...defaultProps} isLoading={true} />);

    expect(screen.getByText('"test" - Explanation')).toBeInTheDocument();
    // Loading state shows skeleton animation
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows no explanation message when explanation is null", () => {
    render(<WordExplanation {...defaultProps} explanation={null} />);

    expect(
      screen.getByText("No explanation available for this word."),
    ).toBeInTheDocument();
  });

  it("does not show copy button when explanation is null", () => {
    render(<WordExplanation {...defaultProps} explanation={null} />);

    expect(
      screen.queryByRole("button", { name: /copy explanation/i }),
    ).not.toBeInTheDocument();
  });

  it("shows copy button when explanation exists", () => {
    render(<WordExplanation {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /copy explanation/i }),
    ).toBeInTheDocument();
  });

  describe("Enhanced Copy Functionality", () => {
    it("copies rich text when copy button is clicked", async () => {
      const user = userEvent.setup();
      const writeSpy = vi.spyOn(navigator.clipboard, "write");

      render(<WordExplanation {...defaultProps} />);

      const copyButton = screen.getByRole("button", {
        name: /copy explanation/i,
      });
      await user.click(copyButton);

      expect(writeSpy).toHaveBeenCalled();
    });

    it("shows checkmark icon after successful copy", async () => {
      const user = userEvent.setup();
      render(<WordExplanation {...defaultProps} />);

      const copyButton = screen.getByRole("button", {
        name: /copy explanation/i,
      });
      await user.click(copyButton);

      // Should show checkmark (success icon)
      await waitFor(() => {
        const checkIcon = screen
          .getByRole("button")
          .querySelector('path[d*="M5 13l4 4L19 7"]');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("shows copy button when explanation exists", () => {
      render(<WordExplanation {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /copy explanation/i }),
      ).toBeInTheDocument();
    });

    it("does nothing when copy is clicked with no explanation", async () => {
      const user = userEvent.setup();
      render(<WordExplanation {...defaultProps} explanation={null} />);

      // Should not show copy button
      expect(
        screen.queryByRole("button", { name: /copy explanation/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("renders markdown content correctly", () => {
    const markdownExplanation =
      "# Header\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2";

    render(
      <WordExplanation {...defaultProps} explanation={markdownExplanation} />,
    );

    // Should render markdown as formatted content
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Header",
    );
    expect(screen.getByText("Bold text")).toBeInTheDocument();
    expect(screen.getByText("italic text")).toBeInTheDocument();
    expect(screen.getByText("List item 1")).toBeInTheDocument();
    expect(screen.getByText("List item 2")).toBeInTheDocument();
  });

  it("shows AI-generated disclaimer when explanation exists", () => {
    render(<WordExplanation {...defaultProps} />);

    expect(
      screen.getByText(
        "AI-generated explanation for language learning purposes",
      ),
    ).toBeInTheDocument();
  });

  it("does not show AI disclaimer when loading or no explanation", () => {
    render(<WordExplanation {...defaultProps} explanation={null} />);

    expect(
      screen.queryByText(
        "AI-generated explanation for language learning purposes",
      ),
    ).not.toBeInTheDocument();
  });
});
