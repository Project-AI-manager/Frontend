import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { instagramApi } from "@/lib/api/instagram";

vi.mock("@/lib/api/client", () => ({ apiClient: vi.fn() }));

describe("instagramApi", () => {
  beforeEach(() => vi.mocked(apiClient).mockReset());

  it("starts browser-bound OAuth and supports atomic reconnect", async () => {
    vi.mocked(apiClient).mockResolvedValue({ authorization_url: "https://instagram.com/oauth" });
    await instagramApi.startOAuth("instagram-current");
    expect(apiClient).toHaveBeenCalledWith({
      url: "/api/v1/channels/instagram/oauth/start",
      method: "POST",
      data: { replace_channel_id: "instagram-current" },
      withCredentials: true,
    });
  });
});
