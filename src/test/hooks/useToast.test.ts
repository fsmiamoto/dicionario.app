import { renderHook, act } from "@testing-library/react";
import { useToast } from "../../renderer/hooks/useToast";

describe("useToast hook", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.message).toBe("");
  });

  it("should show toast with message", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Test message");
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.message).toBe("Test message");
  });

  it("should hide toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("Test message");
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.isVisible).toBe(false);
    expect(result.current.message).toBe("Test message"); // Message should remain
  });

  it("should update message when showing new toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast("First message");
    });

    expect(result.current.message).toBe("First message");

    act(() => {
      result.current.showToast("Second message");
    });

    expect(result.current.message).toBe("Second message");
    expect(result.current.isVisible).toBe(true);
  });

  it("should maintain stable function references", () => {
    const { result, rerender } = renderHook(() => useToast());

    const initialShowToast = result.current.showToast;
    const initialHideToast = result.current.hideToast;

    rerender();

    expect(result.current.showToast).toBe(initialShowToast);
    expect(result.current.hideToast).toBe(initialHideToast);
  });
});
