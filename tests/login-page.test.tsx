import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { getAccessToken, getRefreshToken } from "@/lib/api/token";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  loginApiV1AuthLoginPost: vi.fn(),
  meApiV1UsersMeGet: vi.fn(),
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

vi.mock("@/lib/api/generated/users/users", () => ({
  getUsers: () => ({
    meApiV1UsersMeGet: mocks.meApiV1UsersMeGet,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mocks.push.mockClear();
    mocks.loginApiV1AuthLoginPost.mockReset();
    mocks.meApiV1UsersMeGet.mockReset();
    vi.mocked(getAuth).mockClear();
    mocks.loginApiV1AuthLoginPost.mockResolvedValue({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
    });
    mocks.meApiV1UsersMeGet.mockResolvedValue({
      email: "user@example.com",
      email_verified: true,
    });
    document.cookie = "refresh_token=; path=/; max-age=0; SameSite=Lax";
  });

  it("signs in only with credentials entered by the user", async () => {
    render(<LoginPage />);

    expect(screen.queryByRole("button", { name: /демо/i })).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("owner.demo@example.com")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Забыли пароль?" })).toHaveAttribute("href", "/password-reset");

    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Введите пароль"), "real-password");
    await userEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(mocks.loginApiV1AuthLoginPost).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "real-password",
    });
    expect(getAccessToken()).toBe("test-access-token");
    expect(getRefreshToken()).toBe("test-refresh-token");
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/inbox"));
  });

  it("sends an unverified user to email confirmation", async () => {
    mocks.meApiV1UsersMeGet.mockResolvedValue({
      email: "new@example.com",
      email_verified: false,
    });
    render(<LoginPage />);

    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "new@example.com");
    await userEvent.type(screen.getByPlaceholderText("Введите пароль"), "real-password");
    await userEvent.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/verify-email?email=new%40example.com"));
  });
});
