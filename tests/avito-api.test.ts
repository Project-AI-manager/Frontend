import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { avitoApi } from "@/lib/api/avito";

vi.mock("@/lib/api/client", () => ({ apiClient: vi.fn() }));

describe("avitoApi", () => {
  beforeEach(() => vi.mocked(apiClient).mockReset());

  it("starts the Avito OAuth flow", async () => {
    vi.mocked(apiClient).mockResolvedValue({ authorization_url: "https://avito.ru/oauth" });
    await avitoApi.startOAuth();
    expect(apiClient).toHaveBeenCalledWith({
      url: "/api/v1/channels/avito/oauth/start",
      method: "POST",
      withCredentials: true,
    });
  });
});
