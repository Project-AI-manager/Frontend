import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RegisterPage from "@/app/register/page";
import { emailApi } from "@/lib/api/email";
import { getAuth } from "@/lib/api/generated/auth/auth";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  register: vi.fn(),
  requestVerification: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/api/generated/auth/auth", () => ({
  getAuth: vi.fn(() => ({
    registerApiV1AuthRegisterPost: mocks.register,
  })),
}));

vi.mock("@/lib/api/email", () => ({
  emailApi: {
    requestVerification: mocks.requestVerification,
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.register.mockReset();
    mocks.requestVerification.mockReset();
    vi.mocked(getAuth).mockClear();
    vi.mocked(emailApi.requestVerification).mockClear();
  });

  it("requires explicit consent and does not show a password strength bar", () => {
    render(<RegisterPage />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.queryByText("от 8 символов")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Надёжность пароля/)).not.toBeInTheDocument();
  });

  it("keeps the checked consent visually selected on hover", async () => {
    render(<RegisterPage />);

    const checkbox = screen.getByRole("checkbox");
    const visualCheckbox = screen.getByLabelText(
      "Принять условия использования и политику конфиденциальности",
      { selector: "label" },
    );

    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(visualCheckbox).toHaveClass("peer-checked:hover:bg-[#1546ad]");
    expect(visualCheckbox).toHaveClass("hover:scale-110");
  });

  it("opens legal documents separately without toggling consent or clearing the form", async () => {
    render(<RegisterPage />);

    await userEvent.type(screen.getByRole("textbox", { name: "Имя" }), "Тимур");
    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "timur@example.com");
    const terms = screen.getByRole("link", { name: "условия использования" });
    const privacy = screen.getByRole("link", { name: "политику конфиденциальности" });

    expect(terms).toHaveAttribute("href", "/legal/terms");
    expect(privacy).toHaveAttribute("href", "/legal/privacy");
    expect(terms).toHaveAttribute("target", "_blank");
    expect(privacy).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("textbox", { name: "Имя" })).toHaveValue("Тимур");
    expect(screen.getByRole("textbox", { name: "Почта" })).toHaveValue("timur@example.com");
  });

  it("requests a verification code and opens the confirmation page", async () => {
    mocks.register.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
    mocks.requestVerification.mockResolvedValue({
      ok: true,
      sent: true,
      dev_token: "123456",
    });
    render(<RegisterPage />);

    await userEvent.type(screen.getByRole("textbox", { name: "Имя" }), "Тимур");
    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "timur@example.com");
    await userEvent.type(screen.getByPlaceholderText("Не менее 8 символов"), "strong-password");
    await userEvent.type(screen.getByLabelText("Повторите пароль"), "strong-password");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    await waitFor(() => expect(mocks.requestVerification).toHaveBeenCalledOnce());
    expect(mocks.push).toHaveBeenCalledWith("/verify-email?email=timur%40example.com");
  });

  it("shows the localized duplicate email error returned by the API", async () => {
    mocks.register.mockRejectedValue(
      new axios.AxiosError(
        "Conflict",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        {
          data: { detail: { message: "Пользователь с такой почтой уже существует" } },
          status: 409,
          statusText: "Conflict",
          headers: {},
          config: { headers: {} } as never,
        },
      ),
    );
    render(<RegisterPage />);

    await userEvent.type(screen.getByRole("textbox", { name: "Имя" }), "Тимур");
    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "timur@example.com");
    await userEvent.type(screen.getByPlaceholderText("Не менее 8 символов"), "strong-password");
    await userEvent.type(screen.getByLabelText("Повторите пароль"), "strong-password");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Пользователь с такой почтой уже существует",
    );
  });

  it("does not submit registration when passwords do not match", async () => {
    render(<RegisterPage />);

    await userEvent.type(screen.getByRole("textbox", { name: "Имя" }), "Тимур");
    await userEvent.type(screen.getByRole("textbox", { name: "Почта" }), "timur@example.com");
    await userEvent.type(screen.getByLabelText("Пароль"), "strong-password");
    await userEvent.type(screen.getByLabelText("Повторите пароль"), "another-password");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Пароли не совпадают.");
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.requestVerification).not.toHaveBeenCalled();
  });
});
