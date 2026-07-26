import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChannelsPage from "@/app/channels/page";

describe("Channels page", () => {
  it("shows the personal account connection and future channels", () => {
    render(<ChannelsPage />);

    expect(screen.getByRole("heading", { name: "Каналы" })).toBeInTheDocument();
    expect(screen.getByText("Личный аккаунт · MTProto")).toBeInTheDocument();
    expect(screen.getByText("VK Мессенджер")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить канал/i })).toBeInTheDocument();
  });
});
