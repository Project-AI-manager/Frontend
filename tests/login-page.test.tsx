import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import { getAccessToken, getRefreshToken } from "@/lib/api/token";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  login: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/api/generated/auth/auth", () => ({
  getAuth: () => ({
    loginApiV1AuthLoginPost: mocks.login,
    registerApiV1AuthRegisterPost: vi.fn(),
  }),
}));

describe("Login page", () => {
  beforeEach(() => {
    mocks.push.mockClear();
    mocks.login.mockReset();
    mocks.login.mockResolvedValue({
      access_token: "demo-access-token",
      refresh_token: "demo-refresh-token",
    });
  });

  it("signs into the seeded demo workspace", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "Войти в демо" }));
    expect(mocks.login).toHaveBeenCalledWith({
      email: "owner.demo@example.com",
      password: "demo-password",
    });
    expect(getAccessToken()).toBe("demo-access-token");
    expect(getRefreshToken()).toBe("demo-refresh-token");
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/inbox"));
  });
});
