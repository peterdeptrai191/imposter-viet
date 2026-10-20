import React from "react";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { RevealCard } from "./components";
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function setup() {
  const next = vi.fn();
  const ui = render(
    <RevealCard
      name="An"
      word="Bí mật kiểm thử"
      last={false}
      onContinue={next}
    />,
  );
  const zone = ui.getByRole("button", { name: /Kéo lên và giữ/ });
  return { ...ui, zone, next };
}
function release(zone: HTMLElement) {
  fireEvent.keyUp(zone, { key: " " });
  act(() => vi.advanceTimersByTime(245));
}
describe("Vuốt và giữ bí mật", () => {
  it("chưa xem hoặc chỉ chạm không mở Continue", () => {
    const ui = setup();
    expect(ui.queryByText("Continue")).toBeNull();
    fireEvent.pointerUp(ui.zone);
    act(() => vi.advanceTimersByTime(250));
    expect(ui.queryByText("Continue")).toBeNull();
    expect(ui.queryByTestId("secret-word")).toBeNull();
  });
  it("giữ phím mới hiện từ, thả che ngay, đóng xong mới Continue", () => {
    const ui = setup();
    fireEvent.keyDown(ui.zone, { key: " " });
    expect(ui.getByTestId("secret-word").textContent).toBe("Bí mật kiểm thử");
    expect(ui.queryByText("Continue")).toBeNull();
    fireEvent.keyUp(ui.zone, { key: " " });
    expect(ui.queryByTestId("secret-word")).toBeNull();
    expect(ui.queryByText("Continue")).toBeNull();
    act(() => vi.advanceTimersByTime(245));
    fireEvent.click(ui.getByText("Continue"));
    fireEvent.click(ui.getByText("Continue"));
    expect(ui.next).toHaveBeenCalledTimes(1);
  });
  it("xem lại ẩn Continue, blur và pointer cancel che ngay", () => {
    const ui = setup();
    fireEvent.keyDown(ui.zone, { key: " " });
    release(ui.zone);
    expect(ui.queryByText("Continue")).not.toBeNull();
    fireEvent.keyDown(ui.zone, { key: " " });
    expect(ui.queryByText("Continue")).toBeNull();
    fireEvent(window, new Event("blur"));
    expect(ui.queryByTestId("secret-word")).toBeNull();
    fireEvent.keyDown(ui.zone, { key: "ArrowUp" });
    expect(ui.queryByTestId("secret-word")).not.toBeNull();
    fireEvent.pointerCancel(ui.zone);
    expect(ui.queryByTestId("secret-word")).toBeNull();
  });
  it("người kế tiếp có thẻ che và chưa có quyền Continue", () => {
    const ui = setup();
    fireEvent.keyDown(ui.zone, { key: " " });
    release(ui.zone);
    ui.rerender(
      <RevealCard
        key="new"
        name="Bình"
        word="Khác"
        last={true}
        onContinue={ui.next}
      />,
    );
    expect(ui.queryByText("Bắt đầu chơi")).toBeNull();
    expect(ui.queryByText("Khác")).toBeNull();
  });
  it("chuyển ứng dụng che ngay và không tự mở lại khi quay về", () => {
    const ui = setup();
    fireEvent.keyDown(ui.zone, { key: "ArrowUp" });
    expect(ui.queryByTestId("secret-word")).not.toBeNull();
    fireEvent(document, new Event("visibilitychange"));
    expect(ui.queryByTestId("secret-word")).toBeNull();
    fireEvent(document, new Event("visibilitychange"));
    expect(ui.queryByTestId("secret-word")).toBeNull();
  });
  it("blur từ thẻ đã đóng không gỡ nút Continue trước sự kiện click", () => {
    const ui = setup();
    fireEvent.keyDown(ui.zone, { key: "ArrowUp" });
    fireEvent.keyUp(ui.zone, { key: "ArrowUp" });
    act(() => vi.advanceTimersByTime(245));
    fireEvent.blur(ui.zone);
    const button = ui.getByText("Continue");
    fireEvent.click(button);
    expect(ui.next).toHaveBeenCalledTimes(1);
  });
  it("kéo chuột: dưới ngưỡng không hiện, vượt ngưỡng mới hiện, thả che tức thì", () => {
    vi.stubGlobal("PointerEvent", MouseEvent);
    const ui = setup();
    ui.zone.setPointerCapture = vi.fn();
    fireEvent.pointerDown(ui.zone, { button: 0, clientY: 250 });
    fireEvent.pointerMove(ui.zone, { clientY: 225 });
    expect(ui.queryByTestId("secret-word")).toBeNull();
    fireEvent.pointerUp(ui.zone);
    act(() => vi.advanceTimersByTime(245));
    expect(ui.queryByText("Continue")).toBeNull();
    fireEvent.pointerDown(ui.zone, { button: 0, clientY: 250 });
    fireEvent.pointerMove(ui.zone, { clientY: 80 });
    expect(ui.queryByTestId("secret-word")).not.toBeNull();
    fireEvent.pointerUp(ui.zone);
    expect(ui.queryByTestId("secret-word")).toBeNull();
    expect(ui.queryByText("Continue")).toBeNull();
    act(() => vi.advanceTimersByTime(245));
    expect(ui.queryByText("Continue")).not.toBeNull();
    vi.unstubAllGlobals();
  });
});
