import { beforeEach, describe, expect, it, vi } from "vitest";

const request = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/client", () => ({
  axiosInstance: { request, get: vi.fn() },
}));

import { replyToConversationWithFile } from "@/lib/api/conversation-attachments";

describe("replyToConversationWithFile", () => {
  beforeEach(() => {
    request.mockReset();
    request.mockResolvedValue({ data: { delivered: true } });
  });

  it("posts optional text and ordered files as multipart data", async () => {
    const firstFile = new File(["image"], "photo.png", { type: "image/png" });
    const secondFile = new File(["document"], "terms.pdf", {
      type: "application/pdf",
    });
    await replyToConversationWithFile({
      conversationId: "conversation-1",
      text: " Фото ",
      files: [firstFile, secondFile],
    });

    const config = request.mock.calls[0][0];
    expect(config.url).toBe(
      "/api/v1/conversations/conversation-1/reply-with-file",
    );
    expect(config.method).toBe("POST");
    expect(config.data).toBeInstanceOf(FormData);
    expect(config.data.get("text")).toBe("Фото");
    expect(config.data.getAll("files")).toEqual([firstFile, secondFile]);
    expect(config.headers["Content-Type"]).toBeUndefined();
  });

  it("omits empty text for a file-only reply", async () => {
    const file = new File(["document"], "terms.pdf", {
      type: "application/pdf",
    });
    await replyToConversationWithFile({
      conversationId: "conversation-1",
      text: "  ",
      files: [file],
    });

    expect(request.mock.calls[0][0].data.has("text")).toBe(false);
  });
});
