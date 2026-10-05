import { act, cleanup, fireEvent, render } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";

import { OptimizedRobotVisual } from "@/components/landing/optimized-robot-visual";

describe("prerecorded landing robot", () => {
  let intersection: (entries: Partial<IntersectionObserverEntry>[]) => void;
  let idle: Map<number, IdleRequestCallback>;
  let play: MockInstance<() => Promise<void>>;
  let pause: MockInstance<() => void>;
  let load: MockInstance<() => void>;
  let reducedMotion: boolean;
  let motionChange: () => void;
  let raf: Map<number, FrameRequestCallback>;
  let clock: number;
  let drawImage: ReturnType<typeof vi.fn>;
  let fetchHead: ReturnType<typeof vi.fn>;
  let closeBitmap: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reducedMotion = false;
    idle = new Map();
    raf = new Map();
    clock = 0;
    let sequence = 0;
    play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {});
    load = vi
      .spyOn(HTMLMediaElement.prototype, "load")
      .mockImplementation(() => {});
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    drawImage = vi.fn();
    closeBitmap = vi.fn();
    fetchHead = vi
      .fn()
      .mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob()) });
    vi.stubGlobal("fetch", fetchHead);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ close: closeBitmap }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = ++sequence;
      raf.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => raf.delete(id));
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return query.includes("reduced-motion") ? reducedMotion : true;
      },
      addEventListener: (_event: string, callback: () => void) => {
        motionChange = callback;
      },
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof intersection) {
          intersection = callback;
        }
        observe = vi.fn(() => intersection([{ isIntersecting: true }]));
        disconnect = vi.fn();
      },
    );
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) => {
      const id = ++sequence;
      idle.set(id, callback);
      return id;
    });
    vi.stubGlobal("cancelIdleCallback", (id: number) => idle.delete(id));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const startWhenIdle = async () => {
    await act(async () => {
      const callbacks = [...idle.values()];
      idle.clear();
      callbacks.forEach((callback) =>
        callback({ didTimeout: false, timeRemaining: () => 10 }),
      );
    });
  };
  const finishHead = async () => {
    for (let i = 0; i < 300; i++) {
      await act(async () => {
        clock += 16;
        const callbacks = [...raf.values()];
        raf.clear();
        callbacks.forEach((callback) => callback(clock));
      });
      if (!raf.size) break;
    }
  };

  it("shows a high resolution poster immediately and defers video loading until idle", async () => {
    const { container } = render(<OptimizedRobotVisual />);
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/robot/poster-v8.webp",
    );
    expect(container.querySelector("video")).not.toHaveAttribute("src");
    expect(load).not.toHaveBeenCalled();
    fireEvent.scroll(window);
    expect(load).not.toHaveBeenCalled();
    await startWhenIdle();
    expect(load).toHaveBeenCalledTimes(1);
    expect(play).not.toHaveBeenCalled();
    await finishHead();
    expect(container.querySelector("img")).not.toHaveStyle({ opacity: "0" });
    fireEvent.loadedData(container.querySelector("video")!);
    expect(play).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")).toHaveStyle({ opacity: "0" });
  });

  it("keeps the same video, source and currentTime on scroll return without loading again", async () => {
    const { container } = render(<OptimizedRobotVisual />);
    const video = container.querySelector("video")!;
    const canvas = container.querySelector("canvas")!;
    await startWhenIdle();
    await finishHead();
    fireEvent.loadedData(video);
    fireEvent.pointerMove(window, {
      clientX: 1100,
      clientY: 30,
      pointerType: "mouse",
    });
    await finishHead();
    const requests = fetchHead.mock.calls.length;
    const drawings = drawImage.mock.calls.length;
    expect(drawings).toBeGreaterThan(1);
    expect(raf.size).toBe(0);
    video.currentTime = 2.75;
    act(() => intersection([{ isIntersecting: false }]));
    expect(pause).toHaveBeenCalledTimes(1);
    fireEvent.scroll(window);
    act(() => intersection([{ isIntersecting: true }]));
    expect(container.querySelector("video")).toBe(video);
    expect(video).toHaveAttribute("src", "/robot/body-loop-v8.webm");
    expect(video.currentTime).toBe(2.75);
    expect(video).toHaveStyle({ opacity: "1" });
    expect(load).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledTimes(2);
    expect(container.querySelector("canvas")).toBe(canvas);
    expect(fetchHead).toHaveBeenCalledTimes(requests);
    expect(drawImage).toHaveBeenCalledTimes(drawings);
    expect(raf.size).toBe(0);
  });

  it("defers an offscreen initial load and pauses while the browser tab is hidden", async () => {
    const { container } = render(<OptimizedRobotVisual />);
    act(() => intersection([{ isIntersecting: false }]));
    await startWhenIdle();
    expect(load).not.toHaveBeenCalled();
    act(() => intersection([{ isIntersecting: true }]));
    await startWhenIdle();
    await finishHead();
    fireEvent.loadedData(container.querySelector("video")!);
    expect(play).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    fireEvent(document, new Event("visibilitychange"));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("uses the poster for reduced motion and can enable the loop when that preference changes", async () => {
    reducedMotion = true;
    render(<OptimizedRobotVisual />);
    expect(idle.size).toBe(0);
    expect(load).not.toHaveBeenCalled();
    reducedMotion = false;
    act(() => motionChange());
    await startWhenIdle();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending start and releases the decoder when unmounted", async () => {
    const first = render(<OptimizedRobotVisual />);
    first.unmount();
    expect(idle.size).toBe(0);
    const second = render(<OptimizedRobotVisual />);
    const video = second.container.querySelector("video")!;
    await startWhenIdle();
    await finishHead();
    second.unmount();
    expect(video).not.toHaveAttribute("src");
    expect(pause).toHaveBeenCalledTimes(2);
    expect(closeBitmap).toHaveBeenCalled();
    expect(raf.size).toBe(0);
  });
});
