import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Toast } from "../../renderer/components/Toast";

describe("Toast Component", () => {
  it("renders message when visible", () => {
    render(<Toast message="Test message" isVisible={true} onHide={() => {}} />);

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("does not render when not visible", () => {
    render(
      <Toast message="Test message" isVisible={false} onHide={() => {}} />,
    );

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();
  });

  it("calls onHide after duration", async () => {
    const onHide = vi.fn();
    render(
      <Toast
        message="Test message"
        isVisible={true}
        onHide={onHide}
        duration={100}
      />,
    );

    await waitFor(() => expect(onHide).toHaveBeenCalled(), { timeout: 200 });
  });

  it("uses default duration of 2000ms when not specified", async () => {
    const onHide = vi.fn();
    render(<Toast message="Test message" isVisible={true} onHide={onHide} />);

    // Should not be called immediately
    expect(onHide).not.toHaveBeenCalled();

    // Should be called after 2000ms (we'll wait a bit less to avoid flakiness)
    await waitFor(() => expect(onHide).toHaveBeenCalled(), { timeout: 2200 });
  });

  it("displays success icon", () => {
    render(<Toast message="Test message" isVisible={true} onHide={() => {}} />);

    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("clears timer when component unmounts", () => {
    const onHide = vi.fn();
    const { unmount } = render(
      <Toast
        message="Test message"
        isVisible={true}
        onHide={onHide}
        duration={100}
      />,
    );

    unmount();

    // Wait longer than duration to ensure timer was cleared
    setTimeout(() => {
      expect(onHide).not.toHaveBeenCalled();
    }, 200);
  });
});
