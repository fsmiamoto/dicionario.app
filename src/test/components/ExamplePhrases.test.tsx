import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ExamplePhrases from "@/components/ExamplePhrases";
import type { ExamplePhrase } from "@shared/types";

const mockPhrases: ExamplePhrase[] = [
  {
    text: "This is a test phrase.",
    translation: "Esta es una frase de prueba.",
    category: "Descriptive/Aesthetic",
  },
  {
    text: "I need to test this feature.",
    translation: "Necesito probar esta función.",
    category: "Practical/Work",
  },
];

describe("ExamplePhrases", () => {
  it("renders phrases correctly", () => {
    render(<ExamplePhrases phrases={mockPhrases} isLoading={false} />);

    expect(screen.getByText("This is a test phrase.")).toBeInTheDocument();
    expect(
      screen.getByText("Esta es una frase de prueba."),
    ).toBeInTheDocument();
    expect(screen.getByText("Descriptive/Aesthetic")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    render(<ExamplePhrases phrases={[]} isLoading={true} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(5); // 5 loading skeletons
  });

  it("handles copy button click without errors", async () => {
    const user = userEvent.setup();
    render(<ExamplePhrases phrases={mockPhrases} isLoading={false} />);

    const copyButtons = screen.getAllByTitle("Copy phrase");

    // Should not throw an error when clicked
    await expect(user.click(copyButtons[0])).resolves.not.toThrow();
  });

  it("shows checkmark after successful copy", async () => {
    const user = userEvent.setup();
    render(<ExamplePhrases phrases={mockPhrases} isLoading={false} />);

    const copyButtons = screen.getAllByTitle("Copy phrase");
    await user.click(copyButtons[0]);

    // Wait for the checkmark to appear and then disappear
    await waitFor(() => {
      const checkmark = document.querySelector('svg path[d="M5 13l4 4L19 7"]');
      expect(checkmark).toBeInTheDocument();
    });
  });

  it("handles audio playback when play button is clicked", async () => {
    const user = userEvent.setup();
    render(<ExamplePhrases phrases={mockPhrases} isLoading={false} />);

    const playButtons = screen.getAllByTitle("Play audio");
    await user.click(playButtons[0]);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("applies correct category colors", () => {
    render(<ExamplePhrases phrases={mockPhrases} isLoading={false} />);

    const descriptiveTag = screen.getByText("Descriptive/Aesthetic");
    const practicalTag = screen.getByText("Practical/Work");

    // Expect current component classes (light + dark support)
    expect(descriptiveTag).toHaveClass(
      "bg-purple-100",
      "text-purple-800",
    );
    expect(practicalTag).toHaveClass("bg-blue-100", "text-blue-800");
  });
});
