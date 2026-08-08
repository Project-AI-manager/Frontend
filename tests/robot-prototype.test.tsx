import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RobotPrototypePage from "@/app/robot-prototype/page";

vi.mock("@/components/ui/splite", () => ({
  SplineScene: () => <div data-testid="spline-scene" />,
}));

describe("RobotPrototypePage", () => {
  it("renders the product offer and the interactive scene", () => {
    render(<RobotPrototypePage />);

    expect(
      screen.getByRole("heading", { name: /Виртуальный сотрудник по продажам/ }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("spline-scene")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Создать за 5 минут/ })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByText(/Telegram, WhatsApp и Avito уже подключаются/)).toBeInTheDocument();
    expect(screen.queryByText(/Эксперт/)).not.toBeInTheDocument();
  });
});
