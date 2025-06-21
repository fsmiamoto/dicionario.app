import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import VisualContext from "@/components/VisualContext";
import type { ImageResult } from "@shared/types";

const mockImages: ImageResult[] = [
  {
    url: "https://example.com/image1.jpg",
    thumbnail: "https://example.com/thumb1.jpg",
    title: "Test Image 1",
    source: "example.com",
  },
  {
    url: "https://example.com/image2.jpg",
    thumbnail: "https://example.com/thumb2.jpg",
    title: "Test Image 2",
    source: "example.com",
  },
];

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, "open", {
  value: mockOpen,
  writable: true,
});

describe("VisualContext", () => {
  const defaultProps = {
    images: mockImages,
    word: "test",
    isLoading: false,
    currentPage: 1,
    totalPages: 3,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    mockOpen.mockClear();
    vi.clearAllMocks();
  });

  it("renders visual context title and search link", () => {
    render(<VisualContext {...defaultProps} />);

    expect(screen.getByText("Visual Context")).toBeInTheDocument();
    expect(screen.getByText("Search Google Images")).toBeInTheDocument();
  });

  it("renders images in 3x2 grid", () => {
    render(<VisualContext {...defaultProps} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);

    expect(images[0]).toHaveAttribute("src", "https://example.com/thumb1.jpg");
    expect(images[0]).toHaveAttribute("alt", "Test Image 1");
  });

  it("shows loading skeletons when isLoading is true", () => {
    render(<VisualContext {...defaultProps} images={[]} isLoading={true} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(6); // 6 image placeholders
  });

  it("handles image click without errors", async () => {
    const user = userEvent.setup();
    render(<VisualContext {...defaultProps} />);

    const imageContainer = screen.getAllByRole("img")[0].closest("div");

    // Should not throw an error when clicked
    if (imageContainer) {
      await expect(user.click(imageContainer)).resolves.not.toThrow();
    }
  });

  it("opens Google Images search when search link is clicked", async () => {
    const user = userEvent.setup();
    render(<VisualContext {...defaultProps} />);

    const searchLink = screen.getByText("Search Google Images");
    await user.click(searchLink);

    expect(mockOpen).toHaveBeenCalledWith(
      "https://www.google.com/search?q=test&tbm=isch",
      "_blank",
    );
  });

  it("renders images with hover effects", () => {
    render(<VisualContext {...defaultProps} />);

    const imageContainers = document.querySelectorAll(".group");
    expect(imageContainers).toHaveLength(2);
  });

  it("shows hover effects on images", () => {
    render(<VisualContext {...defaultProps} />);

    const imageContainers = document.querySelectorAll(".group");
    expect(imageContainers).toHaveLength(2);

    imageContainers.forEach((container) => {
      expect(container).toHaveClass("hover:ring-2", "hover:ring-primary-500");
    });
  });

  it("renders pagination controls", () => {
    render(<VisualContext {...defaultProps} />);

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("calls onPageChange when pagination is used", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<VisualContext {...defaultProps} onPageChange={onPageChange} />);

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("does not render pagination when totalPages is 1", () => {
    render(<VisualContext {...defaultProps} totalPages={1} />);

    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });
});
