import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/SearchBar";

describe("SearchBar", () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  it("renders search input and button", () => {
    render(<SearchBar onSearch={mockOnSearch} isLoading={false} />);

    expect(
      screen.getByPlaceholderText("Enter a word to learn..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("calls onSearch when form is submitted", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText("Enter a word to learn...");
    const button = screen.getByRole("button", { name: "Search" });

    await user.type(input, "test");
    await user.click(button);

    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });

  it("shows loading state when isLoading is true", () => {
    render(<SearchBar onSearch={mockOnSearch} isLoading={true} />);

    expect(screen.getByText("Searching...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /searching/i })).toBeDisabled();
  });

  it("shows autocomplete dropdown when typing", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText("Enter a word to learn...");
    await user.type(input, "test");

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation in autocomplete", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText("Enter a word to learn...");
    await user.type(input, "test");

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    // Press arrow down to select first item
    fireEvent.keyDown(input, { key: "ArrowDown" });

    // Press enter to select
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnSearch).toHaveBeenCalledWith("test");
  });

  it("closes dropdown on escape key", async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText("Enter a word to learn...");
    await user.type(input, "test");

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("test")).not.toBeInTheDocument();
    });
  });
});
