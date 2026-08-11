import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InstagramConnectDialog } from "@/components/settings/instagram-connect-dialog";

const api = vi.hoisted(() => ({ startOAuth: vi.fn() }));
vi.mock("@/lib/api/instagram", () => ({ instagramApi: { startOAuth: api.startOAuth } }));

describe("InstagramConnectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.startOAuth.mockRejectedValue(new Error("unavailable"));
  });

  it("starts OAuth with the current channel id and keeps the dialog open on error", async () => {
    render(<InstagramConnectDialog replaceChannelId="instagram-current" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Перейти в Instagram" }));
    await waitFor(() => expect(api.startOAuth).toHaveBeenCalledWith("instagram-current"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось начать подключение Instagram");
  });
});
