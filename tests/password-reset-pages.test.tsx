import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConfirmPasswordResetPage from "@/app/password-reset/confirm/page";
import PasswordResetPage from "@/app/password-reset/page";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  confirm: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("@/lib/api/generated/auth/auth", () => ({
  getAuth: () => ({
    requestPasswordResetEmailApiV1AuthPasswordResetRequestPost: mocks.request,
    confirmPasswordResetApiV1AuthPasswordResetConfirmPost: mocks.confirm,
  }),
}));

describe("password reset pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.request.mockResolvedValue({ ok: true, sent: true });
    mocks.confirm.mockResolvedValue({ ok: true, sent: false });
    sessionStorage.clear();
  });

  it("requests reset without revealing whether the email exists", async () => {
    render(<PasswordResetPage />);

    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Получить код" }));

    await waitFor(() => expect(mocks.request).toHaveBeenCalledWith({ email: "user@example.com" }));
    expect(screen.getByRole("status")).toHaveTextContent("Если аккаунт");
    expect(screen.getByRole("link", { name: "Ввести код" })).toHaveAttribute("href", "/password-reset/confirm?email=user%40example.com");
  });

  it("validates matching passwords and confirms the reset code", async () => {
    mocks.searchParams = new URLSearchParams("token=123456");
    render(<ConfirmPasswordResetPage />);

    expect(screen.getByRole("textbox", { name: "Код из письма" })).toHaveValue("123456");
    await userEvent.type(screen.getByLabelText("Новый пароль", { selector: "input" }), "new-password");
    await userEvent.type(screen.getByLabelText("Повторите пароль"), "new-password");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить пароль" }));

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith({ token: "123456", new_password: "new-password" }));
    expect(screen.getByRole("status")).toHaveTextContent("Теперь можно войти");
  });

  it("does not submit passwords that differ", async () => {
    mocks.searchParams = new URLSearchParams("token=123456");
    render(<ConfirmPasswordResetPage />);

    await userEvent.type(screen.getByLabelText("Новый пароль", { selector: "input" }), "new-password");
    await userEvent.type(screen.getByLabelText("Повторите пароль"), "other-password");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить пароль" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Пароли не совпадают");
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});
