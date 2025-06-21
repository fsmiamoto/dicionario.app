import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Pagination from "../../renderer/components/Pagination";

describe("Pagination", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pagination controls with correct page information", () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("renders page number buttons", () => {
    render(<Pagination {...defaultProps} />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it("highlights current page", () => {
    render(<Pagination {...defaultProps} currentPage={3} />);

    const currentPageButton = screen.getByText("3");
    expect(currentPageButton).toHaveClass("bg-primary-500");
  });

  it("disables previous button on first page", () => {
    render(<Pagination {...defaultProps} currentPage={1} />);

    const prevButton = screen.getByText("Previous").closest("button");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(<Pagination {...defaultProps} currentPage={5} />);

    const nextButton = screen.getByText("Next").closest("button");
    expect(nextButton).toBeDisabled();
  });

  it("calls onPageChange when previous button is clicked", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={3}
        onPageChange={onPageChange}
      />,
    );

    const prevButton = screen.getByText("Previous").closest("button");
    fireEvent.click(prevButton!);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when next button is clicked", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={2}
        onPageChange={onPageChange}
      />,
    );

    const nextButton = screen.getByText("Next").closest("button");
    fireEvent.click(nextButton!);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange when page number button is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);

    const pageButton = screen.getByText("4");
    fireEvent.click(pageButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("disables all buttons when loading", () => {
    render(<Pagination {...defaultProps} isLoading={true} />);

    const prevButton = screen.getByText("Previous").closest("button");
    const nextButton = screen.getByText("Next").closest("button");
    const pageButton = screen.getByText("1");

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(pageButton).toBeDisabled();
  });

  it("does not render when totalPages is 1", () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={1} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when totalPages is 0", () => {
    const { container } = render(
      <Pagination {...defaultProps} totalPages={0} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("limits page buttons to maximum of 5", () => {
    render(<Pagination {...defaultProps} totalPages={10} />);

    // Should only show buttons 1-5
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("6")).not.toBeInTheDocument();
    expect(screen.queryByText("10")).not.toBeInTheDocument();
  });

  it("does not call onPageChange when clicking disabled buttons", () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        {...defaultProps}
        currentPage={1}
        onPageChange={onPageChange}
        isLoading={true}
      />,
    );

    const prevButton = screen.getByText("Previous").closest("button");
    fireEvent.click(prevButton!);

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
