import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { getAccessToken, getRefreshToken } from "@/lib/api/token";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  loginApiV1AuthLoginPost: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/lib/api/generated/auth/auth", () => ({
  getAuth: vi.fn(() => ({
    loginApiV1AuthLoginPost: mocks.loginApiV1AuthLoginPost,
  })),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mocks.push.mockClear();
    mocks.loginApiV1AuthLoginPost.mockReset();
    vi.mocked(getAuth).mockClear();
    mocks.loginApiV1AuthLoginPost.mockResolvedValue({
      access_token: "demo-access-token",
      refresh_token: "demo-refresh-token",
    });
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
  });

  it("opens the seeded demo workspace without manual registration", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: /войти в демо без регистрации/i }));

    expect(mocks.loginApiV1AuthLoginPost).toHaveBeenCalledWith({
      email: "owner.demo@example.com",
      password: "demo-password",
    });
    expect(getAccessToken()).toBe("demo-access-token");
    expect(getRefreshToken()).toBe("demo-refresh-token");
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/inbox"));
  });
});
