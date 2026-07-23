import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";

const navigationState = vi.hoisted(() => ({ pathname: "/inbox" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

afterEach(() => {
  navigationState.pathname = "/inbox";
});

describe("AppShell", () => {
  it("renders semantic navigation and marks the current destination", () => {
    navigationState.pathname = "/knowledge/document";

    render(
      <AppShell title="База знаний" description="Документы компании">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Основная навигация" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "База знаний" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Перейти к содержимому" }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("opens an accessible mobile menu and closes it with Escape", () => {
    render(
      <AppShell title="Диалоги" description="Входящие обращения">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    const menuButton = screen.getByRole("button", { name: "Открыть меню" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("dialog", { name: "Меню кабинета" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Меню кабинета" }),
    ).not.toBeInTheDocument();
  });

  it("does not expose mock account labels in the shared shell", () => {
    render(
      <AppShell title="Аналитика" description="Метрики">
        <p>Содержимое страницы</p>
      </AppShell>,
    );

    expect(screen.queryByText(/Demo Owner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock режим/i)).not.toBeInTheDocument();
  });
});

describe("StateCard", () => {
  it("renders a neutral start-aligned state with optional description", () => {
    render(
      <StateCard
        icon={<span data-testid="icon" />}
        title="Loading"
        description="Please wait"
      />,
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("renders centered error states", () => {
    render(
      <StateCard icon={<span />} title="Error" tone="error" align="center" />,
    );

    const card = screen.getByRole("alert");
    expect(card).toHaveClass("text-center");
    expect(card).toHaveClass("text-red-700");
    expect(card).toHaveAttribute("aria-live", "assertive");
  });
});

describe("InfoRow", () => {
  it("renders labels and values", () => {
    render(<InfoRow label="Tenant" value="alpha" />);

    expect(screen.getByText("Tenant")).toHaveClass("text-[#667085]");
    expect(screen.getByText("alpha")).toBeInTheDocument();
  });

  it("supports inverted and truncated variants", () => {
    render(
      <InfoRow label="Tenant ID" value="very-long-id" inverted truncate />,
    );

    expect(screen.getByText("Tenant ID")).toHaveClass("text-white/60");
    expect(screen.getByText("very-long-id")).toHaveClass("truncate");
    expect(screen.getByText("very-long-id")).toHaveAttribute(
      "title",
      "very-long-id",
    );
  });
});
