import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OnboardingPage from "@/app/onboarding/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/onboarding",
}));

describe("OnboardingPage", () => {
  it("shows a vertical three-step path to the live product screens", () => {
    render(<OnboardingPage />);

    expect(
      screen.getByRole("progressbar", { name: "Прогресс настройки" }),
    ).toHaveAttribute("aria-valuenow", "1");
    const onboardingSteps = screen.getByRole("list", {
      name: "Шаги настройки",
    });
    expect(within(onboardingSteps).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(onboardingSteps).getByRole("link", { name: /Открыть профиль/i }),
    ).toHaveAttribute("href", "/profile");
    expect(
      within(onboardingSteps).getByRole("link", { name: /Настроить канал/i }),
    ).toHaveAttribute("href", "/channels");
    expect(
      within(onboardingSteps).getByRole("link", { name: /Перейти к знаниям/i }),
    ).toHaveAttribute("href", "/knowledge");
  });
});
