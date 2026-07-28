import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import VerifyEmailPage from "@/app/verify-email/page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  confirmVerification: vi.fn(),
  requestVerification: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams("email=timur%40example.com"),
}));

vi.mock("@/lib/api/email", () => ({
  emailApi: {
    confirmVerification: mocks.confirmVerification,
    requestVerification: mocks.requestVerification,
  },
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.confirmVerification.mockReset();
    mocks.requestVerification.mockReset();
    sessionStorage.clear();
  });

  it("confirms the six-digit code and opens the inbox", async () => {
    mocks.confirmVerification.mockResolvedValue({ ok: true, sent: false });
    render(<VerifyEmailPage />);

    const firstInput = screen.getAllByRole("textbox")[0];
    fireEvent.paste(firstInput, {
      clipboardData: { getData: () => "123456" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Подтвердить" }));

    await waitFor(() => expect(mocks.confirmVerification).toHaveBeenCalledWith("123456"));
    expect(mocks.push).toHaveBeenCalledWith("/inbox");
  });

  it("does not silently confirm with a hidden development token", async () => {
    sessionStorage.setItem("autopilot_verification_dev_token", "654321");
    render(<VerifyEmailPage />);

    await userEvent.click(screen.getByRole("button", { name: "Подтвердить" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Введите код из шести символов.",
    );
    expect(mocks.confirmVerification).not.toHaveBeenCalled();
  });

  it("keeps individually entered digits in their own fields", async () => {
    mocks.confirmVerification.mockResolvedValue({ ok: true, sent: false });
    render(<VerifyEmailPage />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
    for (const [index, digit] of [..."123456"].entries()) {
      fireEvent.input(inputs[index], { target: { value: digit } });
    }
    await userEvent.click(screen.getByRole("button", { name: "Подтвердить" }));

    await waitFor(() => expect(mocks.confirmVerification).toHaveBeenCalledWith("123456"));
  });
});
