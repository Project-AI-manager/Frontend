import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AvitoConnectDialog } from "@/components/settings/avito-connect-dialog";

const api = vi.hoisted(() => ({ startOAuth: vi.fn() }));

vi.mock("@/lib/api/avito", () => ({ avitoApi: { startOAuth: api.startOAuth } }));

describe("AvitoConnectDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.startOAuth.mockRejectedValue(new Error("unavailable"));
  });

  it("starts OAuth and keeps the dialog open on an API error", async () => {
    render(<AvitoConnectDialog onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Перейти в Avito" }));
    await waitFor(() => expect(api.startOAuth).toHaveBeenCalledOnce());
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось начать подключение Avito");
  });
});
