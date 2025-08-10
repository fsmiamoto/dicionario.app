import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SearchHistoryPage from "@/components/SearchHistoryPage";

// Mock the electronAPI
const mockSearchHistory = vi.fn();

beforeEach(() => {
  // Reset the global window object
  Object.defineProperty(window, "electronAPI", {
    value: {
      searchHistory: mockSearchHistory,
    },
    writable: true,
  });

  mockSearchHistory.mockClear();
});

describe("SearchHistoryPage", () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    mockOnSearch.mockClear();
  });

  const mockHistoryData = [
    {
      id: 1,
      word: "test",
      searchCount: 3,
      lastSearched: "2024-01-01T10:00:00Z",
      createdAt: "2024-01-01T10:00:00Z",
      isFavorite: true,
      favoritedAt: "2024-01-01T10:00:00Z",
    },
    {
      id: 2,
      word: "example",
      searchCount: 1,
      lastSearched: "2024-01-02T10:00:00Z",
      createdAt: "2024-01-02T10:00:00Z",
      isFavorite: false,
      favoritedAt: undefined,
    },
  ];

  it("renders filter buttons", async () => {
    mockSearchHistory.mockResolvedValue([]);

    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    expect(screen.getByText("All History")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
  });

  it("loads and displays search history by default", async () => {
    mockSearchHistory.mockResolvedValue(mockHistoryData);

    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
      expect(screen.getByText("example")).toBeInTheDocument();
    });

    expect(mockSearchHistory).toHaveBeenCalledWith(false);
    expect(screen.getByText("Searched 3 times")).toBeInTheDocument();
    expect(screen.getByText("Searched 1 time")).toBeInTheDocument();
  });

  it("shows favorite hearts for favorited words", async () => {
    mockSearchHistory.mockResolvedValue(mockHistoryData);

    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    // Should have one heart for the favorited word
    const heartIcons = screen.getAllByTestId
      ? screen.queryAllByTestId("heart-icon")
      : [];
    // We check by looking for the heart SVG element in the DOM
    const favoriteButtons = document.querySelectorAll(
      'svg[fill="currentColor"]',
    );
    expect(favoriteButtons.length).toBeGreaterThan(0);
  });

  it("filters to favorites when favorites button is clicked", async () => {
    mockSearchHistory
      .mockResolvedValueOnce(mockHistoryData) // Initial load (all)
      .mockResolvedValueOnce([mockHistoryData[0]]); // Favorites only

    const user = userEvent.setup();
    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    const favoritesButton = screen.getByText("Favorites");
    await user.click(favoritesButton);

    await waitFor(() => {
      expect(mockSearchHistory).toHaveBeenCalledWith(true);
    });
  });

  it("calls onSearch when a history item is clicked", async () => {
    mockSearchHistory.mockResolvedValue(mockHistoryData);

    const user = userEvent.setup();
    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    const testButton = screen.getByText("test").closest("button");
    expect(testButton).toBeInTheDocument();

    if (testButton) {
      await user.click(testButton);
      expect(mockOnSearch).toHaveBeenCalledWith("test");
    }
  });

  it("shows empty state when no history exists", async () => {
    mockSearchHistory.mockResolvedValue([]);

    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText("No search history yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start searching to see your history here"),
      ).toBeInTheDocument();
    });
  });

  it("shows favorites empty state when no favorites exist", async () => {
    mockSearchHistory
      .mockResolvedValueOnce(mockHistoryData) // Initial load (all)
      .mockResolvedValueOnce([]); // Favorites only (empty)

    const user = userEvent.setup();
    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    const favoritesButton = screen.getByText("Favorites");
    await user.click(favoritesButton);

    await waitFor(() => {
      expect(screen.getByText("No favorite words yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start searching and favorite words to see them here"),
      ).toBeInTheDocument();
    });
  });

  it("shows loading state", async () => {
    // Mock a promise that doesn't resolve immediately
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockSearchHistory.mockReturnValue(promise);

    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    // Should show loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!([]);
    await waitFor(() => {
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
  });

  it("shows error state and retry button", async () => {
    mockSearchHistory.mockRejectedValue(new Error("Network error"));

    render(<SearchHistoryPage onSearch={mockOnSearch} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load search history"),
      ).toBeInTheDocument();
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    // Test retry functionality
    mockSearchHistory.mockResolvedValue([]);
    const retryButton = screen.getByText("Try Again");
    const user = userEvent.setup();
    await user.click(retryButton);

    await waitFor(() => {
      expect(mockSearchHistory).toHaveBeenCalledTimes(2);
    });
  });
});
