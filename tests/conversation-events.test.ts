import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { subscribeToConversationEvents } from "@/lib/api/conversation-events";

function streamFrom(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

describe("conversation SSE transport", () => {
  beforeEach(() => {
    localStorage.setItem("ai_manager_access_token", "access-token");
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("uses bearer auth and broadcasts conversation invalidations", async () => {
    vi.useFakeTimers();
    const onChanged = vi.fn();
    const states: string[] = [];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: streamFrom(
        "event: ready\ndata: {}\n\nevent: conversations.changed\ndata: {\"sequence\":1}\n\n",
      ),
    });
    vi.stubGlobal("fetch", fetchMock);

    const unsubscribe = subscribeToConversationEvents({
      onChanged,
      onConnectionChange: (state) => states.push(state),
    });
    await vi.advanceTimersByTimeAsync(1);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/conversations/events"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    expect(states).toContain("open");
    expect(onChanged).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("enters fallback and reconnects after a transport failure", async () => {
    vi.useFakeTimers();
    const states: string[] = [];
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ ok: true, body: streamFrom("event: ready\ndata: {}\n\n") });
    vi.stubGlobal("fetch", fetchMock);

    const unsubscribe = subscribeToConversationEvents({
      onChanged: vi.fn(),
      onConnectionChange: (state) => states.push(state),
    });
    await vi.advanceTimersByTimeAsync(1);
    expect(states).toContain("fallback");

    await vi.advanceTimersByTimeAsync(1_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
