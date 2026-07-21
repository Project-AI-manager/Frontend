import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OnboardingPage from "@/app/onboarding/page";

describe("OnboardingPage", () => {
  it("shows a vertical three-step path to the live product screens", () => {
    render(<OnboardingPage />);

    expect(
      screen.getByRole("progressbar", { name: "Прогресс настройки" }),
    ).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: /Открыть профиль/i }),
    ).toHaveAttribute("href", "/profile");
    expect(
      screen.getByRole("link", { name: /Настроить канал/i }),
    ).toHaveAttribute("href", "/channels");
    expect(
      screen.getByRole("link", { name: /Перейти к знаниям/i }),
    ).toHaveAttribute("href", "/knowledge");
  });
});
