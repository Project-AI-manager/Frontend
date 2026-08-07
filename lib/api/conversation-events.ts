import { getAccessToken } from "@/lib/api/token";

export type ConversationEventConnection = "connecting" | "open" | "fallback";

type ConversationEventsOptions = {
  onChanged: () => void;
  onConnectionChange?: (state: ConversationEventConnection) => void;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const reconnectDelays = [1_000, 2_000, 5_000, 10_000, 20_000];
const subscribers = new Set<ConversationEventsOptions>();
let stopSharedConnection: (() => void) | null = null;
let currentState: ConversationEventConnection = "connecting";

function broadcastState(state: ConversationEventConnection) {
  currentState = state;
  for (const subscriber of subscribers) subscriber.onConnectionChange?.(state);
}

function broadcastChange() {
  for (const subscriber of subscribers) subscriber.onChanged();
}

/**
 * Open the authenticated inbox SSE stream.
 *
 * Native EventSource cannot attach a bearer header, so the stream is parsed
 * from fetch().  That keeps the token out of URLs, browser history and proxy
 * logs while still giving us abort, reconnect and explicit fallback state.
 */
export function subscribeToConversationEvents({
  onChanged,
  onConnectionChange,
}: ConversationEventsOptions) {
  const subscriber = { onChanged, onConnectionChange };
  subscribers.add(subscriber);
  onConnectionChange?.(currentState);
  if (!stopSharedConnection) stopSharedConnection = openSharedConnection();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0) {
      stopSharedConnection?.();
      stopSharedConnection = null;
      currentState = "connecting";
    }
  };
}

function openSharedConnection() {
  let stopped = false;
  let controller: AbortController | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  async function connect() {
    if (stopped) return;
    const token = getAccessToken();
    if (!token) {
      broadcastState("fallback");
      return;
    }

    controller = new AbortController();
    broadcastState(attempt === 0 ? "connecting" : "fallback");
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/conversations/events`, {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`SSE failed with ${response.status}`);
      }

      broadcastState("open");
      attempt = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const event = frame
            .split("\n")
            .find((line) => line.startsWith("event:"))
            ?.slice(6)
            .trim();
          if (event === "conversations.changed") broadcastChange();
          boundary = buffer.indexOf("\n\n");
        }
      }
      if (!stopped) throw new Error("SSE stream closed");
    } catch (error) {
      if (stopped || (error instanceof DOMException && error.name === "AbortError")) return;
      broadcastState("fallback");
      const delay = reconnectDelays[Math.min(attempt, reconnectDelays.length - 1)];
      attempt += 1;
      reconnectTimer = setTimeout(() => void connect(), delay);
    }
  }

  void connect();
  return () => {
    stopped = true;
    controller?.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };
}
